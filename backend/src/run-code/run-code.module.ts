import { Module } from '@nestjs/common';
import { RunCodeService } from './run-code.service';
import { RunCodeController } from './run-code.controller';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { CodeSyncGateway } from 'src/codeSync/codeSync.gateway';
import { JwtService } from '@nestjs/jwt';
import { RoomsService } from 'src/rooms/rooms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from 'src/schemas/room.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [RunCodeController],
  providers: [
    RunCodeService,
    MemoryStoreService,
    CodeSyncGateway,
    JwtService,
    RoomsService,
  ],
})
export class RunCodeModule {}
