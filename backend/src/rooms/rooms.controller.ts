import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
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
import { RoomsGateway } from './rooms.gateway';
import { AccessRole } from 'src/common/enums/access-role.enum';
import { ReplayService } from 'src/replay/replay.service';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly chatService: ChatService,
    private readonly roomGateway: RoomsGateway,
    private readonly replayService: ReplayService,
  ) {}

  @Get()
  @UseGuards(JWTGuard)
  async getRooms(@Req() req: Request) {
    const user = req.user as JwtPayload;

    const rooms = await this.roomsService.getAllRooms(user._id);

    return rooms;
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

  @Get(':roomId')
  @UseGuards(JWTGuard, RoomsGuard)
  async getRoomById(@Param('roomId') roomId: string, @Req() req: Request) {
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new HttpException('Invalid Room Id', 400);

    if (req?.roomRole != AccessRole.EDITOR && req.roomRole != AccessRole.OWNER)
      throw new UnauthorizedException('Unauthorized Operation');

    const room = await this.roomsService.getRoomById(roomId);

    if (!room) throw new HttpException('Room Not Found', 404);

    return room;
  }

  @Post()
  @UseGuards(JWTGuard)
  async createNewRoom(
    @Req() req: Request,
    @Body(new ValidationPipe()) createRoom: CreateRoom,
  ) {
    const user = req.user as JwtPayload;

    const room = await this.roomsService.createNewRoom(createRoom, user._id);

    return room;
  }

  @Put(':roomId')
  @UseGuards(JWTGuard, RoomsGuard)
  async updateRoom(
    @Param('roomId') roomId: string,
    @Body(new ValidationPipe()) updateRoom: UpdateRoom,
    @Req() req: Request,
  ) {
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new HttpException('Invalid Room Id', 400);

    if (req?.roomRole != AccessRole.EDITOR && req.roomRole != AccessRole.OWNER)
      throw new UnauthorizedException('Unauthorized Operation');

    const room = await this.roomsService.updateRoom(roomId, updateRoom);

    if (!room) throw new HttpException('Room Not Found', 404);

    return room;
  }

  @Delete(':roomId')
  @UseGuards(JWTGuard, RoomsGuard)
  async deleteRoom(@Param('roomId') roomId: string, @Req() req: Request) {
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new HttpException('Invalid Room Id', 400);

    if (req?.roomRole != 'owner')
      throw new UnauthorizedException('Unauthorized Operation');

    await this.roomsService.deleteRoom(roomId);

    this.roomGateway.handleRoomDelete(roomId);

    return { success: true };
  }

  @Put(':roomId/save')
  @UseGuards(JWTGuard, RoomsGuard)
  async saveCodeSnapshot(@Param('roomId') roomId: string, @Req() req: Request) {
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new HttpException('Invalid Room Id', 400);

    if (req?.roomRole != 'owner' && req?.roomRole != 'editor')
      throw new UnauthorizedException('Unauthorized Operation');

    const updatedRoom = await this.roomsService.saveCodeSnapshot(roomId);

    return updatedRoom;
  }

  @Get(':roomId/replay')
  @UseGuards(JWTGuard)
  async getReplayData(
    @Param('roomId') roomId: string,
    @Query('filePath') filePath?: string,
    @Req() req?: Request,
  ) {
    let room;
    if (mongoose.Types.ObjectId.isValid(roomId)) {
      room = await this.roomsService.getRoomById(roomId);
    } else {
      room = await this.roomsService.getRoomBySlug(roomId);
    }

    if (!room) throw new HttpException('Room Not Found', 404);

    const user = req?.user as JwtPayload;
    const hasAccess = (room.accessList as any[])?.some(
      (a: any) => a.user?._id?.toString() === user._id?.toString(),
    );
    if (!hasAccess) throw new UnauthorizedException('Not Accessible');

    const roomMongoId = room._id.toString();
    const edits = await this.replayService.getEdits(roomMongoId, filePath);
    const sessions = await this.replayService.getSessions(roomMongoId);
    const editedFiles = await this.replayService.getDistinctFiles(roomMongoId);

    const roomFiles = (room as any).files || [{ path: 'index.js', content: (room as any).content || '', lang: 'javascript' }];

    return {
      files: roomFiles,
      editedFiles,
      edits,
      sessions,
    };
  }

  @Post(':roomId/access')
  @UseGuards(JWTGuard, RoomsGuard)
  async addUserAccess(@Param('roomId') roomId: string, @Req() req: Request) {
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new HttpException('Invalid Room Id', 400);

    if (!mongoose.Types.ObjectId.isValid(req.body.userId))
      throw new HttpException('Invalid User', 400);

    if (req?.roomRole != 'owner')
      throw new UnauthorizedException('Unauthorized Operation');

    const updatedRoom = await this.roomsService.addUserAccess(
      roomId,
      req.body.userId,
      req.body.role,
    );

    return updatedRoom;
  }

  @Put(':roomId/access/:userId')
  @UseGuards(JWTGuard, RoomsGuard)
  async updateUserAccess(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new HttpException('Invalid Room Id', 400);

    if (req?.roomRole != 'owner')
      throw new UnauthorizedException('Unauthorized Operation');

    const updatedRoom = await this.roomsService.updateUserAccess(
      roomId,
      userId,
      req.body.role,
    );

    return updatedRoom;
  }

  @Delete(':roomId/access/:userId')
  @UseGuards(JWTGuard, RoomsGuard)
  async removeUserAccess(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    if (!mongoose.Types.ObjectId.isValid(roomId))
      throw new HttpException('Invalid Room Id', 400);

    if (req?.roomRole != 'owner')
      throw new UnauthorizedException('Unauthorized Operation');

    const updatedRoom = await this.roomsService.removeUserAccess(
      roomId,
      userId,
    );

    return updatedRoom;
  }
}
