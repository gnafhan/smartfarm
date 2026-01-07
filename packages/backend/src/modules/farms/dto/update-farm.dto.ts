import {
  IsString,
  IsOptional,
  ValidateNested,
  IsEmail,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateContactInfoDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateFarmDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsMongoId()
  ownerId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateContactInfoDto)
  contactInfo?: UpdateContactInfoDto;
}
