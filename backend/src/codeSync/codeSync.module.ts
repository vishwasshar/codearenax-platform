import { Module } from '@nestjs/common';
import { CodeSyncGateway } from './codeSync.gateway';
import { JwtService } from '@nestjs/jwt';
import { RoomsService } from 'src/rooms/rooms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from 'src/schemas/room.schema';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { CRDTGateway } from './crdt.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  providers: [
    CodeSyncGateway,
    JwtService,
    RoomsService,
    MemoryStoreService,
    CRDTGateway,
  ],
})
export class CodeSyncModule {}
