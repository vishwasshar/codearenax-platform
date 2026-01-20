import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { LangTypes } from 'src/common/enums';
import { AccessRole } from 'src/common/enums/access-role.enum';

@Schema()
export class Room {
  @Prop({ required: true })
  name: string;

  @Prop({})
  content: [Buffer];

  @Prop({ required: true, enum: LangTypes, default: LangTypes.JS })
  lang: LangTypes;

  @Prop({})
  output: string;

  @Prop([
    {
      user: { type: mongoose.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: AccessRole, default: AccessRole.VIEWER },
    },
  ])
  accessList: {
    user: mongoose.Types.ObjectId;
    role: string;
  }[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
