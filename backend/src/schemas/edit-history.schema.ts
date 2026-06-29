import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema()
export class EditHistory {
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'Room', index: true })
  roomId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: Buffer })
  update: Buffer;

  @Prop({ required: false, type: String })
  text: string;

  @Prop({ required: true, default: 'index.js' })
  filePath: string;

  @Prop({ required: true, default: 'code', enum: ['code', 'whiteboard'] })
  type: string;

  @Prop({ required: false, type: Object })
  shapeData: Record<string, any>;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const EditHistorySchema = SchemaFactory.createForClass(EditHistory);
export type EditHistoryDocument = EditHistory & Document;

EditHistorySchema.index({ roomId: 1, filePath: 1, timestamp: 1 });
EditHistorySchema.index({ roomId: 1, type: 1, timestamp: 1 });
