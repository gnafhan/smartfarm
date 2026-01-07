import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EntryExitLogDocument = EntryExitLog & Document;

export enum EventType {
  ENTRY = 'entry',
  EXIT = 'exit',
}

@Schema({ timestamps: false })
export class EntryExitLog {
  @Prop({ type: Types.ObjectId, ref: 'Livestock', required: true, index: true })
  livestockId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Barn', required: true, index: true })
  barnId: Types.ObjectId;

  @Prop({ required: true, enum: EventType })
  eventType: EventType;

  @Prop({ required: true })
  rfidReaderId: string;

  @Prop({ required: true, index: true, default: () => new Date() })
  timestamp: Date;

  @Prop()
  duration?: number; // seconds, calculated on exit

  @Prop()
  notes?: string;
}

export const EntryExitLogSchema = SchemaFactory.createForClass(EntryExitLog);

// Create compound indexes for efficient queries
EntryExitLogSchema.index({ livestockId: 1, timestamp: -1 });
EntryExitLogSchema.index({ barnId: 1, timestamp: -1 });
EntryExitLogSchema.index({ livestockId: 1, barnId: 1, timestamp: -1 });
