import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

export enum AlertType {
  GAS_LEVEL = 'gas_level',
  SYSTEM = 'system',
  LIVESTOCK = 'livestock',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

@Schema({ timestamps: true })
export class Alert {
  @Prop({ required: true, enum: AlertType })
  type: AlertType;

  @Prop({ required: true, enum: AlertSeverity })
  severity: AlertSeverity;

  @Prop({ type: Types.ObjectId, ref: 'Barn', index: true })
  barnId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Livestock', index: true })
  livestockId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
    index: true,
  })
  status: AlertStatus;

  @Prop()
  acknowledgedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acknowledgedBy?: Types.ObjectId;

  @Prop()
  resolvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Farm', required: true, index: true })
  farmId: Types.ObjectId;

  createdAt: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

// Create compound indexes for efficient queries
AlertSchema.index({ farmId: 1, status: 1 });
AlertSchema.index({ farmId: 1, severity: 1 });
AlertSchema.index({ farmId: 1, createdAt: -1 });
