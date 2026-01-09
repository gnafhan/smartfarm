import { IsNotEmpty, IsNumber, IsPositive, IsOptional, IsString, IsDateString } from 'class-validator';
import { IsNotFutureDate } from '../../../common/validators';

export class CreateWeightEntryDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  weight: number;

  @IsDateString()
  @IsNotEmpty()
  @IsNotFutureDate()
  measurementDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
