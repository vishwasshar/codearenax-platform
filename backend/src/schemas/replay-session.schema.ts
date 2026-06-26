import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ReplaySession {
  @Prop({ required: true, index: true })
  roomId: string;

  @Prop({ required: true, type: Buffer })
  initialState: Buffer;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const ReplaySessionSchema = SchemaFactory.createForClass(ReplaySession);
export type ReplaySessionDocument = ReplaySession & Document;
