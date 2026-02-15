import { Test, TestingModule } from '@nestjs/testing';
import { MediasoupService } from './mediasoup.service';

describe('MediasoupService', () => {
  let service: MediasoupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediasoupService],
    }).compile();

    service = module.get<MediasoupService>(MediasoupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
