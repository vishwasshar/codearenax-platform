import { forwardRef, Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from 'src/schemas/room.schema';
import { RoomsGateway } from './rooms.gateway';
import { JwtService } from '@nestjs/jwt';
import { CRDTModule } from 'src/crdt/crdt.module';
import { MemoryStoreModule } from 'src/memory-store/memory-store.module';
import { ChatModule } from 'src/chat/chat.module';
import { MediasoupModule } from 'src/mediasoup/mediasoup.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    MemoryStoreModule,
    ChatModule,
    forwardRef(() => CRDTModule),
    MediasoupModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway, JwtService],
  exports: [RoomsService, RoomsGateway],
})
export class RoomsModule {}
