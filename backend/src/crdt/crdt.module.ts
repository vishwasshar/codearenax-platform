import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from 'src/schemas/room.schema';
import { CrdtService } from './crdt.service';
import { RoomsModule } from 'src/rooms/rooms.module';
import { MemoryStoreModule } from 'src/memory-store/memory-store.module';
import { ReplayModule } from 'src/replay/replay.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    forwardRef(() => RoomsModule),
    MemoryStoreModule,
    ReplayModule,
  ],
  providers: [CrdtService],
  exports: [CrdtService],
})
export class CRDTModule {}
