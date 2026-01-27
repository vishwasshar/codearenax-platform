import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import mongoose from 'mongoose';
import { CreateRoom } from './dtos/CreateRoom.dto';
import { UpdateRoom } from './dtos/UpdateRoom.dto';
import { Request } from 'express';
import { JWTGuard } from 'src/auth/guards/jwt.guard';
import { JwtPayload } from 'src/auth/dtos/jwt-payload.dto';
import { ChatService } from 'src/chat/chat.service';
import { RoomsGuard } from './rooms.guard';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly chatService: ChatService,
  ) {}

  @Get()
  getAllRooms() {
    return this.roomsService.getAllRooms();
  }

  @Get(':roomId/chat')
  @UseGuards(JWTGuard, RoomsGuard)
  async getRoomChats(
    @Param('roomId') roomId: string,
    @Query('cursorCreatedAt') cursorCreatedAt?: string,
    @Query('cursorId') cursorId?: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new HttpException('Invalid Room Id', 400);

    if (cursorId && !mongoose.Types.ObjectId.isValid(cursorId))
      throw new HttpException('Invalid Cursor Id', 400);

    const room = await this.chatService.getRoomChats(
      roomId,
      cursorCreatedAt,
      cursorId,
    );

    if (!room) throw new HttpException('Room Not Found', 404);

    return room;
  }

  @Get(':id')
  @UseGuards(JWTGuard, RoomsGuard)
  async getRoomById(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new HttpException('Invalid Id', 400);

    const room = await this.roomsService.getRoomById(id);

    if (!room) throw new HttpException('Room Not Found', 404);

    return room;
  }

  @Post()
  @UseGuards(JWTGuard, RoomsGuard)
  async createNewRoom(
    @Req() req: Request,
    @Body(new ValidationPipe()) createRoom: CreateRoom,
  ) {
    const user = req.user as JwtPayload;

    const room = await this.roomsService.createNewRoom(createRoom, user._id);

    return room;
  }

  @Patch(':id')
  @UseGuards(JWTGuard, RoomsGuard)
  async updateRoom(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateRoom: UpdateRoom,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new HttpException('Invalid Id', 400);

    const room = await this.roomsService.updateRoom(id, updateRoom);

    if (!room) throw new HttpException('Room Not Found', 404);

    return room;
  }
}
