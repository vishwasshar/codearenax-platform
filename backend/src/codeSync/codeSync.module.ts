import { Module } from '@nestjs/common';
import { CodeSyncGateway } from './codeSync.gateway';
import { JwtService } from '@nestjs/jwt';
import { RoomsService } from 'src/rooms/rooms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from 'src/schemas/room.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  providers: [CodeSyncGateway, JwtService, RoomsService],
})
export class CodeSyncModule {}
