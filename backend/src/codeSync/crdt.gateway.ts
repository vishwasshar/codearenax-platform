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

@Injectable()
@WebSocketGateway(3003, { cors: true })
export class CRDTGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private inMemoryStore: MemoryStoreService) {}

  handleConnection(client: any, ...args: any[]) {
    // console.log('User Connected:', client.id);
  }

  handleDisconnect(client: any) {}

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
