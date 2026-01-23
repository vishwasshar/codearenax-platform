import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';

@Injectable()
export class ChatService {
  constructor(private inMemoryStore: MemoryStoreService) {}

  sendMessage(
    client: Socket,
    data: { roomId: string; message: string; tempId: string },
  ) {
    const { roomId, message, tempId } = data;

    const userId = this.inMemoryStore.userIds.get(client.id);

    const generatedId = crypto.randomUUID();

    client.to(roomId).emit('chat:new-message', {
      id: generatedId,
      message,
      sender: userId,
    });

    client.emit('chat:ack', {
      tempId,
      id: generatedId,
      message,
      sender: userId,
    });
  }
}
