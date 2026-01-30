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
import { RoomsGateway } from 'src/rooms/rooms.gateway';
import { RedisStoreService } from 'src/redis-store/redis-store.service';

@Controller('run-code')
export class RunCodeController {
  constructor(
    private readonly runCodeService: RunCodeService,
    private readonly roomsGateway: RoomsGateway,
    private readonly redisStore: RedisStoreService,
  ) {}

  @Post()
  async runCode(@Body(new ValidationPipe()) data: CodeSubmission) {
    const room = await this.redisStore.get(`active-rooms:${data.roomId}`);
    if (!room) throw new NotFoundException('Room not active');

    const res = await this.runCodeService.runCode(room.content, room.lang);

    if (!res)
      throw new ServiceUnavailableException('Execution engine not working');

    this.roomsGateway.handleCodeOuput(data.roomId, res.output);

    return res;
  }
}
