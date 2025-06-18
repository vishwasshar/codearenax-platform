import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRoles } from 'src/common/enums';
import { encodePassword } from 'src/utils/bcrypt';

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, enum: UserRoles, default: UserRoles.USER })
  role: UserRoles;

  @Prop({ required: true })
  password: string;
}

// Creating a Schema using a Class
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'accessList.user',
});

UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

export type UserDocument = User & Document;

UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await encodePassword(this.password);

  next();
});
