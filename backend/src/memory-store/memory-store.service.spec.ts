import { Test, TestingModule } from '@nestjs/testing';
import { MemoryStoreService } from './memory-store.service';

describe('MemoryStoreService', () => {
  let service: MemoryStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryStoreService],
    }).compile();

    service = module.get<MemoryStoreService>(MemoryStoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
