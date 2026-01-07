import {
  AlertDocument,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from '../../../schemas/alert.schema';

export class AlertResponseDto {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  barnId?: string;
  livestockId?: string;
  title: string;
  message: string;
  status: AlertStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  farmId: string;
  createdAt: Date;

  static fromDocument(doc: AlertDocument): AlertResponseDto {
    const dto = new AlertResponseDto();
    dto.id = doc._id.toString();
    dto.type = doc.type;
    dto.severity = doc.severity;
    dto.barnId = doc.barnId?.toString();
    dto.livestockId = doc.livestockId?.toString();
    dto.title = doc.title;
    dto.message = doc.message;
    dto.status = doc.status;
    dto.acknowledgedAt = doc.acknowledgedAt;
    dto.acknowledgedBy = doc.acknowledgedBy?.toString();
    dto.resolvedAt = doc.resolvedAt;
    dto.resolvedBy = doc.resolvedBy?.toString();
    dto.farmId = doc.farmId.toString();
    dto.createdAt = doc.createdAt;
    return dto;
  }
}
