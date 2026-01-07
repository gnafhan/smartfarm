import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  IsMongoId,
} from 'class-validator';
import { UserRole } from '../../../schemas/user.schema';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(UserRole, { message: 'Role must be either admin or farmer' })
  @IsNotEmpty()
  role: UserRole;

  @IsOptional()
  @IsMongoId()
  farmId?: string;
}
