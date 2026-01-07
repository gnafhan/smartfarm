import {
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { UserRole, UserStatus } from '../../../schemas/user.schema';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be either admin or farmer' })
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status must be either active or inactive' })
  status?: UserStatus;

  @IsOptional()
  @IsMongoId()
  farmId?: string;
}

// DTO for profile update - only allows fullName and password
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
