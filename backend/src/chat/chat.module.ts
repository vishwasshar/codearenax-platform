import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';

@Module({
  providers: [ChatService, MemoryStoreService],
})
export class ChatModule {}
