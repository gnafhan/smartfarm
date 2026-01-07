import {
  LivestockDocument,
  LivestockGender,
  LivestockStatus,
} from '../../../schemas/livestock.schema';

export class LivestockResponseDto {
  id: string;
  earTagId: string;
  qrCode: string;
  species: string;
  name: string;
  gender: LivestockGender;
  dateOfBirth: Date;
  weight: number;
  color?: string;
  photos: string[];
  status: LivestockStatus;
  healthStatus?: string;
  currentBarnId?: string;
  customFields: Record<string, any>;
  farmId: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDocument(doc: LivestockDocument): LivestockResponseDto {
    const dto = new LivestockResponseDto();
    dto.id = doc._id.toString();
    dto.earTagId = doc.earTagId;
    dto.qrCode = doc.qrCode;
    dto.species = doc.species;
    dto.name = doc.name;
    dto.gender = doc.gender;
    dto.dateOfBirth = doc.dateOfBirth;
    dto.weight = doc.weight;
    dto.color = doc.color;
    dto.photos = doc.photos || [];
    dto.status = doc.status;
    dto.healthStatus = doc.healthStatus;
    dto.currentBarnId = doc.currentBarnId?.toString();
    dto.customFields = doc.customFields || {};
    dto.farmId = doc.farmId.toString();
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;
    return dto;
  }
}
