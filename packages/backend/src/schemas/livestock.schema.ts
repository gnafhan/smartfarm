import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LivestockDocument = Livestock & Document;

export enum LivestockStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  DECEASED = 'deceased',
}

export enum LivestockGender {
  MALE = 'male',
  FEMALE = 'female',
}

@Schema({ timestamps: true })
export class Livestock {
  @Prop({ required: true, unique: true, index: true })
  earTagId: string;

  @Prop({ required: true, unique: true, index: true })
  qrCode: string;

  @Prop({ required: true })
  species: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: LivestockGender })
  gender: LivestockGender;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true })
  weight: number;

  @Prop()
  color: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({
    required: true,
    enum: LivestockStatus,
    default: LivestockStatus.ACTIVE,
  })
  status: LivestockStatus;

  @Prop()
  healthStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'Barn', index: true })
  currentBarnId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  customFields: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Farm', required: true, index: true })
  farmId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const LivestockSchema = SchemaFactory.createForClass(Livestock);
