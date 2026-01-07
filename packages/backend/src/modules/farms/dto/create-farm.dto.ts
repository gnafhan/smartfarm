import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ContactInfoDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsNotEmpty()
  ownerId: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;
}
