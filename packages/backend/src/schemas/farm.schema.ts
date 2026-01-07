import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FarmDocument = Farm & Document;

class ContactInfo {
  @Prop()
  phone?: string;

  @Prop()
  email?: string;
}

class FarmStats {
  @Prop({ default: 0 })
  totalLivestock: number;

  @Prop({ default: 0 })
  totalBarns: number;

  @Prop({ default: 0 })
  totalSensors: number;
}

@Schema({ timestamps: true })
export class Farm {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop()
  address: string;

  @Prop({ type: ContactInfo, default: {} })
  contactInfo: ContactInfo;

  @Prop({
    type: FarmStats,
    default: { totalLivestock: 0, totalBarns: 0, totalSensors: 0 },
  })
  stats: FarmStats;

  createdAt: Date;
  updatedAt: Date;
}

export const FarmSchema = SchemaFactory.createForClass(Farm);
