import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EditHistory, EditHistorySchema } from 'src/schemas/edit-history.schema';
import { ReplaySession, ReplaySessionSchema } from 'src/schemas/replay-session.schema';
import { ReplayService } from './replay.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EditHistory.name, schema: EditHistorySchema },
      { name: ReplaySession.name, schema: ReplaySessionSchema },
    ]),
  ],
  providers: [ReplayService],
  exports: [ReplayService],
})
export class ReplayModule {}
