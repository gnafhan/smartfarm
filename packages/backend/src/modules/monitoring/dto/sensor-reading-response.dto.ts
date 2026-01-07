import { AlertLevel, GasSensorReadingDocument } from '../../../schemas';

/**
 * Response DTO for sensor readings
 */
export class SensorReadingResponseDto {
  _id: string;
  sensorId: string;
  barnId: string;
  methanePpm: number;
  co2Ppm: number;
  nh3Ppm: number;
  temperature: number;
  humidity: number;
  alertLevel: AlertLevel;
  timestamp: Date;

  static fromDocument(doc: GasSensorReadingDocument): SensorReadingResponseDto {
    const dto = new SensorReadingResponseDto();
    dto._id = doc._id.toString();
    dto.sensorId = doc.sensorId;
    dto.barnId = doc.barnId.toString();
    dto.methanePpm = doc.methanePpm;
    dto.co2Ppm = doc.co2Ppm;
    dto.nh3Ppm = doc.nh3Ppm;
    dto.temperature = doc.temperature;
    dto.humidity = doc.humidity;
    dto.alertLevel = doc.alertLevel;
    dto.timestamp = doc.timestamp;
    return dto;
  }
}

/**
 * Response DTO for aggregated sensor readings
 * Requirements: 10.2
 */
export class AggregatedReadingDto {
  periodStart: Date;
  periodEnd: Date;
  sensorId: string;
  barnId: string;
  avgMethanePpm: number;
  avgCo2Ppm: number;
  avgNh3Ppm: number;
  avgTemperature: number;
  avgHumidity: number;
  maxMethanePpm: number;
  maxCo2Ppm: number;
  maxNh3Ppm: number;
  minMethanePpm: number;
  minCo2Ppm: number;
  minNh3Ppm: number;
  readingCount: number;
  maxAlertLevel: AlertLevel;
}

/**
 * Response DTO for latest readings per sensor
 */
export class LatestReadingResponseDto {
  sensorId: string;
  barnId: string;
  reading: SensorReadingResponseDto;
  lastUpdated: Date;
}
