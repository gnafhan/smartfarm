import { IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { PaginatedSortedDto } from './pagination.dto';
import { AlertStatus, AlertSeverity, AlertType } from '../../schemas';

export class AlertFilterDto extends PaginatedSortedDto {
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @IsOptional()
  @IsMongoId()
  barnId?: string;

  @IsOptional()
  @IsMongoId()
  farmId?: string;
}
