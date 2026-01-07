import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  FARMER = 'farmer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.FARMER })
  role: UserRole;

  @Prop({ required: true, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ type: Types.ObjectId, ref: 'Farm' })
  farmId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
