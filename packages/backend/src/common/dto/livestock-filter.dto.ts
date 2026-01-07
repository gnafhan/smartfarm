import { IsOptional, IsString, IsEnum, IsMongoId } from 'class-validator';
import { PaginatedSortedDto } from './pagination.dto';
import { LivestockStatus } from '../../schemas';

export class LivestockFilterDto extends PaginatedSortedDto {
  @IsOptional()
  @IsString()
  search?: string; // Search by name or ear tag

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsEnum(LivestockStatus)
  status?: LivestockStatus;

  @IsOptional()
  @IsMongoId()
  barnId?: string;

  @IsOptional()
  @IsMongoId()
  farmId?: string;
}
