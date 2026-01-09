import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { HealthEventType } from '../../../schemas/health-event.schema';

export class HealthEventFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(HealthEventType)
  eventType?: HealthEventType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
