import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for validating MQTT gas sensor payload
 * Based on design document MQTT Message Format
 *
 * Property 18: MQTT Payload Validation
 * - Required fields: sensorId, barnId, methanePpm, co2Ppm, nh3Ppm
 * - Invalid types or missing fields should be rejected
 */
export class SensorPayloadDto {
  @IsString()
  sensorId: string;

  @IsString()
  barnId: string;

  @IsNumber()
  @Min(0)
  @Max(100000) // Reasonable upper limit for methane ppm
  methanePpm: number;

  @IsNumber()
  @Min(0)
  @Max(100000) // Reasonable upper limit for CO2 ppm
  co2Ppm: number;

  @IsNumber()
  @Min(0)
  @Max(1000) // Reasonable upper limit for NH3 ppm
  nh3Ppm: number;

  @IsNumber()
  @Min(-50) // Reasonable temperature range
  @Max(100)
  temperature: number;

  @IsNumber()
  @Min(0)
  @Max(100) // Humidity percentage
  humidity: number;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

/**
 * Interface for validated sensor reading data
 */
export interface ValidatedSensorReading {
  sensorId: string;
  barnId: string;
  methanePpm: number;
  co2Ppm: number;
  nh3Ppm: number;
  temperature: number;
  humidity: number;
  timestamp: Date;
}
