import { Test, TestingModule } from '@nestjs/testing';
import { CrdtService } from './crdt.service';

describe('CrdtService', () => {
  let service: CrdtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrdtService],
    }).compile();

    service = module.get<CrdtService>(CrdtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
