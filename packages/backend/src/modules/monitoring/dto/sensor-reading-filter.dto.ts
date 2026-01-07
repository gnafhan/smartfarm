import {
  IsOptional,
  IsString,
  IsDateString,
  IsIn,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginatedSortedDto } from '../../../common/dto/pagination.dto';

/**
 * Aggregation period for historical data
 * Requirements: 10.2
 */
export type AggregationPeriod = 'hourly' | 'daily' | 'weekly' | 'none';

/**
 * DTO for filtering sensor readings
 * Requirements: 10.1, 10.4
 */
export class SensorReadingFilterDto extends PaginatedSortedDto {
  @IsOptional()
  @IsString()
  sensorId?: string;

  @IsOptional()
  @IsString()
  barnId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['hourly', 'daily', 'weekly', 'none'])
  aggregation?: AggregationPeriod = 'none';
}

/**
 * DTO for getting latest readings
 */
export class LatestReadingsFilterDto {
  @IsOptional()
  @IsString()
  barnId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  sensorIds?: string[];
}
