import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeightEntryDocument = WeightEntry & Document;

@Schema({ timestamps: true })
export class WeightEntry {
  @Prop({ type: Types.ObjectId, ref: 'Livestock', required: true, index: true })
  livestockId: Types.ObjectId;

  @Prop({ required: true })
  weight: number;

  @Prop({ required: true, index: true })
  measurementDate: Date;

  @Prop()
  notes?: string;

  // Metadata
  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const WeightEntrySchema = SchemaFactory.createForClass(WeightEntry);

// Compound index for efficient livestock queries (most recent first)
WeightEntrySchema.index({ livestockId: 1, measurementDate: -1 });

// Index for date range queries
WeightEntrySchema.index({ measurementDate: 1 });
