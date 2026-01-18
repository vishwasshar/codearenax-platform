import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { Socket } from 'socket.io';

import * as Y from 'yjs';
import { JwtService } from '@nestjs/jwt';
import { RoomsService } from 'src/rooms/rooms.service';
import { snapshotFromYDoc } from 'src/utils/codeSnapshot';

@Injectable()
@WebSocketGateway(3003, { cors: true })
export class CRDTGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private jwtService: JwtService,
    private roomService: RoomsService,
    private inMemoryStore: MemoryStoreService,
  ) {}

  async handleConnection(client: any, ...args: any[]) {
    try {
      const user = await this.jwtService.verify(client.handshake.auth.token, {
        secret: process.env.JWT_SECRET,
      });

      this.inMemoryStore.userIds.set(client.id, user._id);
    } catch (err) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: any) {
    try {
      this.inMemoryStore.userIds.delete(client.id);

      for (const [roomId, room] of this.inMemoryStore.activeRooms.entries()) {
        room.activeUsers = room.activeUsers.filter(
          (socketId: string) => socketId !== client.id,
        );

        if (room.activeUsers.length == 0) {
          await this.roomService.saveCodeSnapshot(
            roomId,
            snapshotFromYDoc(room),
          );
          this.inMemoryStore.activeRooms.delete(roomId);
        } else {
          this.inMemoryStore.activeRooms.set(roomId, room);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage('room:join')
  handleRoomJoin(client: Socket, roomId: string) {
    if (!this.inMemoryStore.crdtRooms.has(roomId)) {
      this.inMemoryStore.crdtRooms.set(roomId, new Y.Doc());
    }

    const room = this.inMemoryStore.crdtRooms.get(roomId);

    if (!room) return;

    client.join(roomId);

    const state = Y.encodeStateAsUpdate(room);
    client.emit('room:edit', state);
  }

  private count = 0;
  @SubscribeMessage('room:edit')
  updateRoom(client: Socket, data: { roomId: string; update: Number[] }) {
    const { roomId, update } = data;
    const room = this.inMemoryStore.crdtRooms.get(roomId);
    if (!room) return;

    const updateBuffer = Uint8Array.from(update);
    Y.applyUpdate(room, updateBuffer);

    console.log('update', this.count++, roomId, client.id);

    client.to(roomId).emit('room:edit', updateBuffer);
  }
}
