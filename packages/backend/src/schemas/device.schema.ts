import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceDocument = Device & Document;

export enum DeviceType {
  GAS_SENSOR = 'gas_sensor',
  RFID_READER = 'rfid_reader',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export enum DisconnectReason {
  INTENTIONAL = 'intentional', // Graceful shutdown
  TIMEOUT = 'timeout', // Connection timeout
  ERROR = 'error', // Error occurred
  NETWORK = 'network', // Network issue
  UNKNOWN = 'unknown',
}

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true, enum: DeviceType })
  type: DeviceType;

  @Prop({ required: true, enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;

  @Prop({ type: Types.ObjectId, ref: 'Barn' })
  barnId?: Types.ObjectId;

  @Prop()
  name?: string;

  @Prop()
  description?: string;

  @Prop()
  location?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  macAddress?: string;

  @Prop()
  firmwareVersion?: string;

  @Prop({ type: Date })
  lastConnectedAt?: Date;

  @Prop({ type: Date })
  lastDisconnectedAt?: Date;

  @Prop({ type: Date })
  lastHeartbeatAt?: Date;

  @Prop({ enum: DisconnectReason })
  lastDisconnectReason?: DisconnectReason;

  @Prop()
  lastDisconnectMessage?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: 0 })
  totalConnections: number;

  @Prop({ default: 0 })
  totalDisconnections: number;

  @Prop({ default: 0 })
  errorCount: number;

  @Prop({ type: Date })
  lastErrorAt?: Date;

  @Prop()
  lastErrorMessage?: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Indexes for better query performance
DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ type: 1, status: 1 });
DeviceSchema.index({ barnId: 1 });
DeviceSchema.index({ status: 1 });
