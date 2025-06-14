import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
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

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  getAllRooms() {
    return this.roomsService.getAllRooms();
  }

  @Get(':id')
  getRoomById(@Param('id') id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new HttpException('Invalid Id', 400);

    const room = this.roomsService.getRoomById(id);

    if (!room) throw new HttpException('Room Not Found', 404);

    return room;
  }

  @Post()
  @UseGuards(JWTGuard)
  createNewRoom(
    @Req() req: Request,
    @Body(new ValidationPipe()) createRoom: CreateRoom,
  ) {
    const user = req.user as JwtPayload;

    const room = this.roomsService.createNewRoom(createRoom, user._id);

    return room;
  }

  @Patch(':id')
  updateRoom(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateRoom: UpdateRoom,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new HttpException('Invalid Id', 400);

    const room = this.roomsService.updateRoom(id, updateRoom);

    if (!room) throw new HttpException('Room Not Found', 404);

    return room;
  }
}
