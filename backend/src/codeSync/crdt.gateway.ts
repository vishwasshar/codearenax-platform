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
import { AccessRole } from 'src/common/enums/access-role.enum';
import { LangTypes } from 'src/common/enums';
import { ydocToString } from 'src/utils/ydocToString';
import { stringToYDoc } from 'src/utils/stringToYDoc';

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

  async handleDisconnect(client: Socket) {
    try {
      this.inMemoryStore.userIds.delete(client.id);

      for (const [
        roomId,
        roomDetails,
      ] of this.inMemoryStore.activeRooms.entries()) {
        if (!roomDetails.activeUsers.includes(client.id)) continue;

        roomDetails.activeUsers = roomDetails.activeUsers.filter(
          (id: string) => id !== client.id,
        );

        if (roomDetails?.activeUsers?.length === 0) {
          const ydoc = this.inMemoryStore.crdtRooms.get(roomId);

          if (ydoc) {
            await this.roomService.saveCodeSnapshot(roomId, ydocToString(ydoc));
          }

          this.inMemoryStore.activeRooms.delete(roomId);
          this.inMemoryStore.crdtRooms.delete(roomId);
        } else {
          this.inMemoryStore.activeRooms.set(roomId, roomDetails);
        }
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(client: Socket, roomId: string) {
    try {
      let roomDetails = this.inMemoryStore.activeRooms.get(roomId);
      let ydoc: Y.Doc;

      if (!roomDetails) {
        roomDetails = await this.roomService.getRoomById(roomId);

        if (!roomDetails) {
          client.emit('room:error', 'Room not Found');
          throw new Error('Room not found');
        }

        roomDetails.activeUsers = [];
        roomDetails.isDirty = false;

        ydoc = stringToYDoc(roomDetails.content);
        this.inMemoryStore.crdtRooms.set(roomId, ydoc);
        this.inMemoryStore.activeRooms.set(roomId, roomDetails);
      } else {
        ydoc = this.inMemoryStore.crdtRooms.get(roomId)!;
      }

      const userId = this.inMemoryStore.userIds.get(client.id);

      const hasAccess = roomDetails.accessList?.some(
        (u: any) => u?.user?.toString() === userId?.toString(),
      );

      if (!hasAccess) {
        client.emit('room:error', 'Not Accessible');
        return;
      }

      if (!roomDetails.activeUsers.includes(client.id)) {
        roomDetails.activeUsers.push(client.id);
      }

      client.join(roomId);

      client.emit('room:joined', Y.encodeStateAsUpdate(ydoc), roomDetails.lang);
    } catch (err) {
      console.error('Join error:', err);
      client.emit('room:error', 'Failed to Join Room');
    }
  }

  @SubscribeMessage('room:leave')
  async leaveRoom(client: Socket, roomId: string) {
    let roomDetails = this.inMemoryStore.activeRooms.get(roomId);
    let room = this.inMemoryStore.crdtRooms.get(roomId);

    if (!roomDetails) return;

    roomDetails.activeUsers = roomDetails.activeUsers.filter(
      (socketId: string) => socketId != client.id,
    );

    if (roomDetails?.activeUsers?.length == 0) {
      await this.roomService.saveCodeSnapshot(roomId, ydocToString(room));
      this.inMemoryStore.activeRooms.delete(roomId);
      this.inMemoryStore.crdtRooms.delete(roomId);
    } else {
      this.inMemoryStore.activeRooms.set(roomId, roomDetails);
    }
  }

  @SubscribeMessage('room:code-edit')
  updateRoom(client: Socket, data: { roomId: string; update: number[] }) {
    const { roomId, update } = data;

    const roomDetails = this.inMemoryStore.activeRooms.get(roomId);
    const ydoc = this.inMemoryStore.crdtRooms.get(roomId);
    const userId = this.inMemoryStore.userIds.get(client.id);

    if (!roomDetails || !ydoc) return;
    if (!roomDetails.activeUsers.includes(client.id)) return;

    const hasEditAccess = roomDetails.accessList?.some(
      (u: any) =>
        u?.user?.toString() === userId?.toString() &&
        [AccessRole.OWNER, AccessRole.EDITOR].includes(u.role),
    );

    if (!hasEditAccess) return;

    if (!roomDetails.isDirty) {
      roomDetails.isDirty = true;
      this.inMemoryStore.activeRooms.set(roomId, roomDetails);
    }

    const updateBuffer = Uint8Array.from(update);
    Y.applyUpdate(ydoc, updateBuffer);

    client.to(roomId).emit('room:code-update', updateBuffer);
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
