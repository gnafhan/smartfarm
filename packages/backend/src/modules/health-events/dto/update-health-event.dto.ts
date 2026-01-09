import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import {
  HealthEventType,
  DiseaseSeverity,
} from '../../../schemas/health-event.schema';
import { IsNotFutureDate } from '../../../common/validators';

export class UpdateHealthEventDto {
  @IsOptional()
  @IsEnum(HealthEventType)
  eventType?: HealthEventType;

  @IsOptional()
  @IsDateString()
  @IsNotFutureDate()
  eventDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Vaccination fields
  @IsOptional()
  @IsString()
  @ValidateIf((o: UpdateHealthEventDto) => o.eventType === HealthEventType.VACCINATION)
  vaccineName?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  // Examination fields
  @IsOptional()
  @IsString()
  @ValidateIf((o: UpdateHealthEventDto) => o.eventType === HealthEventType.EXAMINATION)
  veterinarianName?: string;

  @IsOptional()
  @IsString()
  findings?: string;

  // Disease fields
  @IsOptional()
  @IsString()
  @ValidateIf((o: UpdateHealthEventDto) => o.eventType === HealthEventType.DISEASE)
  diseaseName?: string;

  @IsOptional()
  @IsEnum(DiseaseSeverity)
  @ValidateIf((o: UpdateHealthEventDto) => o.eventType === HealthEventType.DISEASE)
  severity?: DiseaseSeverity;

  @IsOptional()
  @IsString()
  treatmentPlan?: string;
}
