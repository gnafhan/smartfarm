import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import {
  HealthEventType,
  DiseaseSeverity,
} from '../../../schemas/health-event.schema';
import { IsNotFutureDate } from '../../../common/validators';

export class CreateHealthEventDto {
  @IsEnum(HealthEventType)
  @IsNotEmpty()
  eventType: HealthEventType;

  @IsDateString()
  @IsNotEmpty()
  @IsNotFutureDate()
  eventDate: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // Vaccination fields
  @IsOptional()
  @IsString()
  @ValidateIf((o: CreateHealthEventDto) => o.eventType === HealthEventType.VACCINATION)
  @IsNotEmpty()
  vaccineName?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  // Examination fields
  @IsOptional()
  @IsString()
  @ValidateIf((o: CreateHealthEventDto) => o.eventType === HealthEventType.EXAMINATION)
  @IsNotEmpty()
  veterinarianName?: string;

  @IsOptional()
  @IsString()
  findings?: string;

  // Disease fields
  @IsOptional()
  @IsString()
  @ValidateIf((o: CreateHealthEventDto) => o.eventType === HealthEventType.DISEASE)
  @IsNotEmpty()
  diseaseName?: string;

  @IsOptional()
  @IsEnum(DiseaseSeverity)
  @ValidateIf((o: CreateHealthEventDto) => o.eventType === HealthEventType.DISEASE)
  @IsNotEmpty()
  severity?: DiseaseSeverity;

  @IsOptional()
  @IsString()
  treatmentPlan?: string;
}
