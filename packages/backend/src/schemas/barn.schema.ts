import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BarnDocument = Barn & Document;

export enum BarnStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({ timestamps: true })
export class Barn {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  capacity: number;

  @Prop({ required: true, default: 0 })
  currentOccupancy: number;

  @Prop({ type: [String], default: [] })
  sensors: string[];

  @Prop({ required: true, enum: BarnStatus, default: BarnStatus.ACTIVE })
  status: BarnStatus;

  @Prop({ type: Types.ObjectId, ref: 'Farm', required: true, index: true })
  farmId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const BarnSchema = SchemaFactory.createForClass(Barn);
