import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import slugify from 'slugify';
import { LangTypes } from 'src/common/enums';
import { AccessRole } from 'src/common/enums/access-role.enum';

@Schema()
export class Room {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: '// Start writing your code from Here' })
  content: string;

  @Prop({ required: true, enum: LangTypes, default: LangTypes.JS })
  lang: LangTypes;

  @Prop({})
  output: string;

  @Prop({ unique: true })
  slug: string;

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

export type RoomDocument = Room & Document;

RoomSchema.index({ slug: 1 }, { unique: true });

RoomSchema.index({ 'accessList.user': 1 });

RoomSchema.pre<RoomDocument>('save', async function (next) {
  if (!this.isModified('name')) return next();

  let baseSlug = slugify(this.name, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 0;

  const Model = this.constructor as mongoose.Model<RoomDocument>;

  while (await Model.exists({ slug })) {
    count++;
    slug = `${baseSlug}-${count}`;
  }

  this.slug = slug;
  next();
});
