import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HealthEventDocument = HealthEvent & Document;

export enum HealthEventType {
  VACCINATION = 'vaccination',
  EXAMINATION = 'examination',
  DISEASE = 'disease',
}

export enum DiseaseSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

@Schema({ timestamps: true })
export class HealthEvent {
  @Prop({ type: Types.ObjectId, ref: 'Livestock', required: true, index: true })
  livestockId: Types.ObjectId;

  @Prop({ required: true, enum: HealthEventType, index: true })
  eventType: HealthEventType;

  @Prop({ required: true, index: true })
  eventDate: Date;

  @Prop({ required: true })
  description: string;

  // Vaccination-specific fields
  @Prop()
  vaccineName?: string;

  @Prop()
  nextDueDate?: Date;

  // Examination-specific fields
  @Prop()
  veterinarianName?: string;

  @Prop()
  findings?: string;

  // Disease-specific fields
  @Prop()
  diseaseName?: string;

  @Prop({ enum: DiseaseSeverity })
  severity?: DiseaseSeverity;

  @Prop()
  treatmentPlan?: string;

  // Metadata
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const HealthEventSchema = SchemaFactory.createForClass(HealthEvent);

// Compound index for efficient livestock queries (most recent first)
HealthEventSchema.index({ livestockId: 1, eventDate: -1 });

// Index for vaccination due date queries
HealthEventSchema.index({ eventType: 1, nextDueDate: 1 });
