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
import { CRDTGateway } from 'src/crdt/crdt.gateway';

@Controller('run-code')
export class RunCodeController {
  constructor(
    private readonly runCodeService: RunCodeService,
    private readonly memoryStore: MemoryStoreService,
    private readonly crdtGateway: CRDTGateway,
  ) {}

  @Post()
  async runCode(@Body(new ValidationPipe()) data: CodeSubmission) {
    if (!this.memoryStore.activeRooms.has(data.roomId))
      throw new NotFoundException('Room not active');

    const room = this.memoryStore.activeRooms.get(data.roomId);

    const res = await this.runCodeService.runCode(room.content, room.lang);

    if (!res)
      throw new ServiceUnavailableException('Execution engine not working');

    this.crdtGateway.handleCodeOuput(data.roomId, res.output);

    return res;
  }
}
