import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsInt,
  Min,
  IsArray,
  IsEnum,
} from 'class-validator';
import { IsUniqueBarnCode } from '../../../common/validators/is-unique-barn-code.validator';
import { BarnStatus } from '../../../schemas/barn.schema';

export class CreateBarnDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUniqueBarnCode()
  code: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sensors?: string[];

  @IsOptional()
  @IsEnum(BarnStatus)
  status?: BarnStatus;

  @IsMongoId()
  @IsNotEmpty()
  farmId: string;
}
