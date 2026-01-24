import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MemoryStoreModule } from 'src/memory-store/memory-store.module';

@Module({
  imports: [MemoryStoreModule],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
