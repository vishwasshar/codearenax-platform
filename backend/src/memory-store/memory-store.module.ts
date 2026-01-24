import { Module } from '@nestjs/common';
import { MemoryStoreService } from './memory-store.service';

@Module({
  providers: [MemoryStoreService],
  exports: [MemoryStoreService],
})
export class MemoryStoreModule {}
