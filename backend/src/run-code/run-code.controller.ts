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
import { LangTypes } from 'src/common/enums';

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
    const ydoc = await this.redisStore.getYDoc(`crdt-rooms:${data.roomId}`);

    const filePath = data.filePath || 'index.js';
  let code: string;
  let lang: LangTypes;

    if (ydoc) {
      code = ydoc.getText(filePath).toString();
      const filesArr = ydoc.getArray<{ path: string; lang: LangTypes }>('files');
      const files = filesArr.toArray();
      const file = files.find((f) => f.path === filePath);
      lang = file?.lang || LangTypes.JS;
    } else {
      const roomDoc = await this.roomModel.findById(data.roomId).lean();
      if (!roomDoc) throw new NotFoundException('Room not found');
      const roomFiles = (roomDoc as any).files || [];
      const file = roomFiles.find((f: any) => f.path === filePath);
      code = file?.content || '';
      lang = file?.lang || LangTypes.JS;
    }

    const res = await this.runCodeService.runCode(code, lang);

    if (!res) throw new ServiceUnavailableException('Execution engine not working');

    this.roomsGateway.handleCodeOuput(data.roomId, res.output);

    return res;
  }
}
