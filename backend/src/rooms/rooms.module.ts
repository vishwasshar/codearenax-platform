import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from 'src/schemas/room.schema';
import { RoomsGateway } from './rooms.gateway';
import { CrdtService } from 'src/crdt/crdt.service';
import { JwtService } from '@nestjs/jwt';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { ChatService } from 'src/chat/chat.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [RoomsController],
  providers: [
    RoomsService,
    RoomsGateway,
    CrdtService,
    JwtService,
    MemoryStoreService,
    ChatService,
  ],
})
export class RoomsModule {}
