import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  message: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  sender: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Room' })
  roomId: mongoose.Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.index({ roomId: 1, createdAt: -1, _id: -1 });
