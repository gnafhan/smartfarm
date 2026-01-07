import {
  EntryExitLogDocument,
  EventType,
} from '../../../schemas/entry-exit-log.schema';

/**
 * Response DTO for entry/exit logs
 * Requirements: 7.5
 */
export class EntryExitLogResponseDto {
  id: string;
  livestockId: string;
  barnId: string;
  eventType: EventType;
  rfidReaderId: string;
  timestamp: Date;
  duration?: number;
  notes?: string;

  static fromDocument(doc: EntryExitLogDocument): EntryExitLogResponseDto {
    const dto = new EntryExitLogResponseDto();
    dto.id = doc._id.toString();
    dto.livestockId = doc.livestockId.toString();
    dto.barnId = doc.barnId.toString();
    dto.eventType = doc.eventType;
    dto.rfidReaderId = doc.rfidReaderId;
    dto.timestamp = doc.timestamp;
    dto.duration = doc.duration;
    dto.notes = doc.notes;
    return dto;
  }
}
