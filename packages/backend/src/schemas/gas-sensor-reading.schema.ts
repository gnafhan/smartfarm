import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GasSensorReadingDocument = GasSensorReading & Document;

export enum AlertLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  DANGER = 'danger',
}

@Schema({ timestamps: false })
export class GasSensorReading {
  @Prop({ required: true, index: true })
  sensorId: string;

  @Prop({ type: Types.ObjectId, ref: 'Barn', required: true, index: true })
  barnId: Types.ObjectId;

  @Prop({ required: true })
  methanePpm: number;

  @Prop({ required: true })
  co2Ppm: number;

  @Prop({ required: true })
  nh3Ppm: number;

  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ required: true, enum: AlertLevel, default: AlertLevel.NORMAL })
  alertLevel: AlertLevel;

  @Prop({ required: true, index: true, default: () => new Date() })
  timestamp: Date;

  @Prop({
    required: true,
    index: true,
    expires: 0, // TTL index - documents expire at the specified date
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 90); // 90 days from now
      return date;
    },
  })
  expireAt: Date;
}

export const GasSensorReadingSchema =
  SchemaFactory.createForClass(GasSensorReading);

// Create compound indexes for efficient queries
GasSensorReadingSchema.index({ sensorId: 1, timestamp: -1 });
GasSensorReadingSchema.index({ barnId: 1, timestamp: -1 });
