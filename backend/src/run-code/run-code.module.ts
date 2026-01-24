import { Module } from '@nestjs/common';
import { RunCodeService } from './run-code.service';
import { RunCodeController } from './run-code.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from 'src/schemas/room.schema';
import { MemoryStoreModule } from 'src/memory-store/memory-store.module';
import { RoomsModule } from 'src/rooms/rooms.module';
import { CRDTModule } from 'src/crdt/crdt.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    MemoryStoreModule,
    RoomsModule,
    CRDTModule,
    ChatModule,
  ],
  controllers: [RunCodeController],
  providers: [RunCodeService],
  exports: [RunCodeService],
})
export class RunCodeModule {}
