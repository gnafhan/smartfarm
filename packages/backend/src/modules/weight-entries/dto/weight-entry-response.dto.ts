import { WeightEntryDocument } from '../../../schemas/weight-entry.schema';

export class WeightEntryResponseDto {
  id: string;
  livestockId: string;
  weight: number;
  measurementDate: Date;
  notes?: string;

  // Metadata
  recordedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDocument(doc: WeightEntryDocument): WeightEntryResponseDto {
    const dto = new WeightEntryResponseDto();
    dto.id = doc._id.toString();
    dto.livestockId = doc.livestockId.toString();
    dto.weight = doc.weight;
    dto.measurementDate = doc.measurementDate;
    dto.notes = doc.notes;

    // Metadata
    dto.recordedBy = doc.recordedBy?.toString();
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;

    return dto;
  }
}
