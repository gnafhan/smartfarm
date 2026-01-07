import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { EventType } from '../../../schemas/entry-exit-log.schema';

/**
 * DTO for creating entry/exit logs from RFID events
 * Requirements: 7.1, 7.2, 7.3
 */
export class CreateEntryExitLogDto {
  @IsNotEmpty()
  @IsMongoId()
  livestockId: string;

  @IsNotEmpty()
  @IsMongoId()
  barnId: string;

  @IsNotEmpty()
  @IsEnum(EventType)
  eventType: EventType;

  @IsNotEmpty()
  @IsString()
  rfidReaderId: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
