import { IsOptional, IsDateString, IsString, IsIn } from 'class-validator';

/**
 * DTO for chart data query parameters
 * Requirements: 3.2, 3.3
 */
export class ChartDataQueryDto {
  @IsString()
  barnId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(['hourly', 'daily'])
  aggregation?: 'hourly' | 'daily' = 'daily';
}

/**
 * Response DTO for methane chart data
 * Requirements: 3.2
 */
export class MethaneChartDataDto {
  date: Date;
  methanePpm: number;
}

/**
 * Response DTO for temperature chart data
 * Requirements: 3.3
 */
export class TemperatureChartDataDto {
  date: Date;
  temperature: number;
}
