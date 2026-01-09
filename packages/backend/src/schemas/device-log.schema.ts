import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DeviceStatus, DisconnectReason } from './device.schema';

export type DeviceLogDocument = DeviceLog & Document;

export enum DeviceEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
  STATUS_CHANGE = 'status_change',
}

@Schema({ timestamps: true })
export class DeviceLog {
  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true, enum: DeviceEventType })
  eventType: DeviceEventType;

  @Prop({ type: String, enum: DeviceStatus })
  status?: DeviceStatus;

  @Prop({ type: String, enum: DeviceStatus })
  previousStatus?: DeviceStatus;

  @Prop({ type: String, enum: DisconnectReason })
  disconnectReason?: DisconnectReason;

  @Prop()
  message?: string;

  @Prop()
  errorCode?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: Date.now })
  timestamp: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const DeviceLogSchema = SchemaFactory.createForClass(DeviceLog);

// Indexes
DeviceLogSchema.index({ deviceId: 1, timestamp: -1 });
DeviceLogSchema.index({ eventType: 1, timestamp: -1 });
DeviceLogSchema.index({ timestamp: -1 });
