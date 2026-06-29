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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from 'src/schemas/room.schema';
import { LangTypes } from 'src/common/enums';
import { ydocToFiles } from 'src/utils/ydocToString';

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

    let files: { path: string; content: string }[];

    if (ydoc) {
      files = ydocToFiles(ydoc);
    } else {
      const roomDoc = await this.roomModel.findById(data.roomId).lean();
      if (!roomDoc) throw new NotFoundException('Room not found');
      files = ((roomDoc as any).files || []).map((f: any) => ({
        path: f.path,
        content: f.content || '',
      }));
    }

    const hasPackageJson = files.some((f) => f.path === 'package.json');

    if (hasPackageJson) {
      const res = await this.runCodeService.runProject(files);
      this.roomsGateway.handleCodeOuput(data.roomId, res.output);
      return res;
    }

    const filePath = data.filePath || 'index.js';
    const file = files.find((f) => f.path === filePath);
    if (!file) throw new NotFoundException(`File '${filePath}' not found`);

    const lang = (file as any).lang || LangTypes.JS;
    const res = await this.runCodeService.runCode(file.content, lang);

    if (!res) throw new ServiceUnavailableException('Execution engine not working');

    this.roomsGateway.handleCodeOuput(data.roomId, res.output);

    return res;
  }
}
