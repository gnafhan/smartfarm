import {
  IsOptional,
  IsNumber,
  IsPositive,
  IsString,
  IsDateString,
} from 'class-validator';
import { IsNotFutureDate } from '../../../common/validators';

export class UpdateWeightEntryDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @IsOptional()
  @IsDateString()
  @IsNotFutureDate()
  measurementDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
