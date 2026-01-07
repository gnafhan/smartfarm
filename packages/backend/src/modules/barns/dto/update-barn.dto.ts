import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  IsEnum,
} from 'class-validator';
import { BarnStatus } from '../../../schemas/barn.schema';

export class UpdateBarnDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sensors?: string[];

  @IsOptional()
  @IsEnum(BarnStatus)
  status?: BarnStatus;
}
