import { Test, TestingModule } from '@nestjs/testing';
import { RunCodeController } from './run-code.controller';

describe('RunCodeController', () => {
  let controller: RunCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RunCodeController],
    }).compile();

    controller = module.get<RunCodeController>(RunCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
