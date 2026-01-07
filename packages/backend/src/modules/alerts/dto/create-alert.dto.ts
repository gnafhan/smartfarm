import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AlertType, AlertSeverity } from '../../../schemas/alert.schema';

export class CreateAlertDto {
  @IsEnum(AlertType)
  @IsNotEmpty()
  type: AlertType;

  @IsEnum(AlertSeverity)
  @IsNotEmpty()
  severity: AlertSeverity;

  @IsOptional()
  @IsMongoId()
  barnId?: string;

  @IsOptional()
  @IsMongoId()
  livestockId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsMongoId()
  @IsNotEmpty()
  farmId: string;
}
