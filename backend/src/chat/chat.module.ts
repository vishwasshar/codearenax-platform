import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MemoryStoreModule } from 'src/memory-store/memory-store.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'src/schemas/chat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    MemoryStoreModule,
  ],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
