import { BarnDocument, BarnStatus } from '../../../schemas/barn.schema';

export class BarnResponseDto {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentOccupancy: number;
  sensors: string[];
  status: BarnStatus;
  farmId: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDocument(doc: BarnDocument): BarnResponseDto {
    const dto = new BarnResponseDto();
    dto.id = doc._id.toString();
    dto.name = doc.name;
    dto.code = doc.code;
    dto.capacity = doc.capacity;
    dto.currentOccupancy = doc.currentOccupancy;
    dto.sensors = doc.sensors || [];
    dto.status = doc.status;
    dto.farmId = doc.farmId.toString();
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;
    return dto;
  }
}
