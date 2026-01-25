import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { Chat } from 'src/schemas/chat.schema';
import { NewMessage } from './dto/NewMessage.dto';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<Chat>) {}

  async getRoomChats(
    roomId: string,
    cursorCreatedAt?: string,
    cursorId?: string,
  ) {
    const limit = 10;

    const baseFilter = { roomId };

    const filter =
      cursorCreatedAt && cursorId
        ? {
            ...baseFilter,
            $or: [
              { createdAt: { $lt: new Date(cursorCreatedAt) } },
              {
                createdAt: new Date(cursorCreatedAt),
                _id: { $lt: new mongoose.Types.ObjectId(cursorId) },
              },
            ],
          }
        : baseFilter;

    const chats = await this.chatModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('sender', 'name')
      .lean<(Chat & { _id: mongoose.Types.ObjectId; createdAt: Date })[]>();

    const hasNextPage = chats.length > limit;
    if (hasNextPage) chats.pop();

    return {
      chats,
      nextCursor: hasNextPage
        ? {
            cursorCreatedAt: chats[chats.length - 1].createdAt,
            cursorId: chats[chats.length - 1]._id.toString(),
          }
        : null,
    };
  }

  async sendMessage(client: Socket, data: NewMessage) {
    const { message, tempId } = data;

    const roomId = client.data.roomId;

    const userId = client.data.userId;

    const newMessage = new this.chatModel({
      message,
      roomId,
      sender: { _id: userId, name: client.data.name },
    });

    await newMessage.save();

    client.to(roomId).emit('chat:new-message', newMessage);

    client.emit('chat:ack', newMessage, tempId);
  }
}
