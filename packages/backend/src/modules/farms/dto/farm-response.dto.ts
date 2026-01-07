import { FarmDocument } from '../../../schemas/farm.schema';

export class ContactInfoResponseDto {
  phone?: string;
  email?: string;
}

export class FarmStatsResponseDto {
  totalLivestock: number;
  totalBarns: number;
  totalSensors: number;
}

export class FarmResponseDto {
  id: string;
  name: string;
  ownerId: string;
  address?: string;
  contactInfo: ContactInfoResponseDto;
  stats: FarmStatsResponseDto;
  createdAt: Date;
  updatedAt: Date;

  static fromDocument(doc: FarmDocument): FarmResponseDto {
    const dto = new FarmResponseDto();
    dto.id = doc._id.toString();
    dto.name = doc.name;
    dto.ownerId = doc.ownerId.toString();
    dto.address = doc.address;
    dto.contactInfo = {
      phone: doc.contactInfo?.phone,
      email: doc.contactInfo?.email,
    };
    dto.stats = {
      totalLivestock: doc.stats?.totalLivestock ?? 0,
      totalBarns: doc.stats?.totalBarns ?? 0,
      totalSensors: doc.stats?.totalSensors ?? 0,
    };
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;
    return dto;
  }
}
