import {
  IsNotEmpty,
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
import { IsUniqueEarTag } from '../../../common/validators/is-unique-ear-tag.validator';
import {
  LivestockGender,
  LivestockStatus,
} from '../../../schemas/livestock.schema';

export class CreateLivestockDto {
  @IsString()
  @IsNotEmpty()
  @IsUniqueEarTag()
  earTagId: string;

  @IsString()
  @IsNotEmpty()
  species: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(LivestockGender)
  gender: LivestockGender;

  @IsDateString()
  dateOfBirth: string;

  @IsNumber()
  @Min(0)
  weight: number;

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

  @IsMongoId()
  @IsNotEmpty()
  farmId: string;
}
