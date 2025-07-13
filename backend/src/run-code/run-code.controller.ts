import {
  Body,
  Controller,
  NotFoundException,
  Post,
  ServiceUnavailableException,
  ValidationPipe,
} from '@nestjs/common';
import { CodeSubmission } from './dtos/RunCode.dto';
import { RunCodeService } from './run-code.service';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { CodeSyncGateway } from 'src/codeSync/codeSync.gateway';

@Controller('run-code')
export class RunCodeController {
  constructor(
    private readonly runCodeService: RunCodeService,
    private readonly memoryStore: MemoryStoreService,
    private readonly codeSync: CodeSyncGateway,
  ) {}

  @Post()
  async runCode(@Body(new ValidationPipe()) data: CodeSubmission) {
    if (!this.memoryStore.activeRooms.has(data.roomId))
      throw new NotFoundException('Room not active');

    const room = this.memoryStore.activeRooms.get(data.roomId);

    const res = await this.runCodeService.runCode(room.content, room.lang);

    if (!res)
      throw new ServiceUnavailableException('Execution engine not working');

    this.codeSync.handleCodeOuput(data.roomId, res.output);

    return res;
  }
}
