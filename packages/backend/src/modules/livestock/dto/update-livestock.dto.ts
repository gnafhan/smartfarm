import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  Min,
  IsArray,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';
import {
  LivestockGender,
  LivestockStatus,
} from '../../../schemas/livestock.schema';

export class UpdateLivestockDto {
  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(LivestockGender)
  gender?: LivestockGender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsEnum(LivestockStatus)
  status?: LivestockStatus;

  @IsOptional()
  @IsString()
  healthStatus?: string;

  @IsOptional()
  @IsMongoId()
  currentBarnId?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
