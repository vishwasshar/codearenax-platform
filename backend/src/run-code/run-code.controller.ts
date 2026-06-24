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
import { RoomsGateway } from 'src/rooms/rooms.gateway';
import { RedisStoreService } from 'src/redis-store/redis-store.service';
import { ydocToString } from 'src/utils/ydocToString';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from 'src/schemas/room.schema';
import { stringToYDoc } from 'src/utils/stringToYDoc';

@Controller('run-code')
export class RunCodeController {
  constructor(
    private readonly runCodeService: RunCodeService,
    private readonly roomsGateway: RoomsGateway,
    private readonly redisStore: RedisStoreService,
    @InjectModel(Room.name) private roomModel: Model<Room>,
  ) {}

  @Post()
  async runCode(@Body(new ValidationPipe()) data: CodeSubmission) {
    let ydoc = await this.redisStore.getYDoc(`crdt-rooms:${data.roomId}`);

    if (!ydoc) {
      const roomDoc = await this.roomModel.findById(data.roomId).lean();
      if (!roomDoc) throw new NotFoundException('Room not found');
      ydoc = stringToYDoc(roomDoc.content);
    }

    const updatedContent = ydocToString(ydoc);

    const room = await this.redisStore.get(`active-rooms:${data.roomId}`);
    const lang = room?.lang || (await this.roomModel.findById(data.roomId).lean())?.lang || 'javascript';

    const res = await this.runCodeService.runCode(updatedContent, lang);

    if (!res) throw new ServiceUnavailableException('Execution engine not working');

    this.roomsGateway.handleCodeOuput(data.roomId, res.output);

    return res;
  }
}
