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
import { AccessRole } from 'src/common/enums/access-role.enum';
import { LangTypes } from 'src/common/enums';

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
          this.inMemoryStore.crdtRooms.delete(roomId);
        } else {
          this.inMemoryStore.activeRooms.set(roomId, room);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(client: Socket, roomId: string) {
    try {
      let room: any;

      if (this.inMemoryStore.activeRooms.has(roomId)) {
        room = this.inMemoryStore.activeRooms.get(roomId);
        room.content = Y.encodeStateAsUpdate(
          this.inMemoryStore.crdtRooms.get(roomId) || new Y.Doc(),
        );
      } else {
        room = await this.roomService.getRoomById(roomId);

        room.activeUsers = [];
        room.isDirty = false;
        let ydoc = new Y.Doc(room.content);

        room.content = Y.encodeStateAsUpdate(ydoc);

        this.inMemoryStore.crdtRooms.set(roomId, ydoc);
      }

      if (
        room?.accessList?.some(
          (user: any) => user.user == this.inMemoryStore.userIds.get(client.id),
        )
      ) {
        room.activeUsers.push(client.id);

        this.inMemoryStore.activeRooms.set(roomId, room);

        client.join(roomId);

        client.emit('room:code-edit', room.content);
        client.emit('room:lang-change', room.lang);
      } else {
        client.emit('room:error', 'Not Accessible');
      }
    } catch (err) {
      client.emit('room:error', 'Failed to Join Room');
    }
  }

  @SubscribeMessage('room:edit')
  updateRoom(client: Socket, data: { roomId: string; update: Number[] }) {
    const { roomId, update } = data;

    const roomDetails = this.inMemoryStore.activeRooms.get(roomId);
    const room = this.inMemoryStore.crdtRooms.get(roomId);

    const userId = this.inMemoryStore.userIds.get(client.id);

    if (
      !room ||
      !roomDetails?.accessList?.some(
        (user: any) =>
          user.user == userId &&
          (user.role == AccessRole.OWNER || user.role == AccessRole.EDITOR),
      )
    )
      return;

    if (!roomDetails.isDirty) {
      roomDetails.isDirty = true;
      this.inMemoryStore.activeRooms.set(roomId, roomDetails);
    }

    const updateBuffer = Uint8Array.from(update);
    Y.applyUpdate(room, updateBuffer);

    client.to(roomId).emit('room:code-edit', updateBuffer);
  }

  @SubscribeMessage('room:lang-change')
  async updateRoomLang(
    client: Socket,
    data: { roomId: string; lang: LangTypes },
  ) {
    const { roomId, lang } = data;

    const roomDetails = this.inMemoryStore.activeRooms.get(roomId);

    const userId = this.inMemoryStore.userIds.get(client.id);

    if (
      !(
        roomDetails &&
        roomDetails?.accessList?.some(
          (user: any) =>
            user.user == userId &&
            (user.role == AccessRole.OWNER || user.role == AccessRole.EDITOR),
        )
      )
    )
      return;

    roomDetails.lang = lang;
    this.inMemoryStore.activeRooms.set(roomId, roomDetails);

    await this.roomService.updateRoom(roomId, { lang });
    client.to(roomId).emit('room:lang-change', lang);
  }
}
