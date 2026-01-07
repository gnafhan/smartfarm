import { IsOptional, IsMongoId, IsEnum } from 'class-validator';
import { PaginatedSortedDto } from './pagination.dto';
import { EventType } from '../../schemas';

export class EntryExitFilterDto extends PaginatedSortedDto {
  @IsOptional()
  @IsMongoId()
  livestockId?: string;

  @IsOptional()
  @IsMongoId()
  barnId?: string;

  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;
}

export class EntryExitDateFilterDto extends EntryExitFilterDto {
  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;
}
