import {
  HealthEventDocument,
  HealthEventType,
  DiseaseSeverity,
} from '../../../schemas/health-event.schema';

export class HealthEventResponseDto {
  id: string;
  livestockId: string;
  eventType: HealthEventType;
  eventDate: Date;
  description: string;

  // Vaccination-specific fields
  vaccineName?: string;
  nextDueDate?: Date;

  // Examination-specific fields
  veterinarianName?: string;
  findings?: string;

  // Disease-specific fields
  diseaseName?: string;
  severity?: DiseaseSeverity;
  treatmentPlan?: string;

  // Metadata
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDocument(doc: HealthEventDocument): HealthEventResponseDto {
    const dto = new HealthEventResponseDto();
    dto.id = doc._id.toString();
    dto.livestockId = doc.livestockId.toString();
    dto.eventType = doc.eventType;
    dto.eventDate = doc.eventDate;
    dto.description = doc.description;

    // Vaccination fields
    dto.vaccineName = doc.vaccineName;
    dto.nextDueDate = doc.nextDueDate;

    // Examination fields
    dto.veterinarianName = doc.veterinarianName;
    dto.findings = doc.findings;

    // Disease fields
    dto.diseaseName = doc.diseaseName;
    dto.severity = doc.severity;
    dto.treatmentPlan = doc.treatmentPlan;

    // Metadata
    dto.createdBy = doc.createdBy?.toString();
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;

    return dto;
  }
}
