import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import {
  GasSensorReading,
  GasSensorReadingDocument,
  AlertLevel,
} from '../../schemas/gas-sensor-reading.schema';
import {
  SensorReadingFilterDto,
  LatestReadingsFilterDto,
  AggregationPeriod,
  SensorReadingResponseDto,
  AggregatedReadingDto,
  LatestReadingResponseDto,
} from './dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';

/**
 * Interface for aggregation result from MongoDB
 */
interface AggregationResult {
  _id: {
    sensorId: string;
    barnId: Types.ObjectId;
  };
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
  minTimestamp: Date;
  maxTimestamp: Date;
}

/**
 * Interface for latest reading aggregation result
 */
interface LatestReadingResult {
  _id: string;
  latestReading: {
    _id: Types.ObjectId;
    sensorId: string;
    barnId: Types.ObjectId;
    methanePpm: number;
    co2Ppm: number;
    nh3Ppm: number;
    temperature: number;
    humidity: number;
    alertLevel: AlertLevel;
    timestamp: Date;
  };
}

/**
 * Monitoring Service
 *
 * Handles gas sensor data storage and retrieval
 *
 * Requirements:
 * - 10.1: Return sensor readings within specified date range
 * - 10.2: Support aggregation by hour, day, or week
 * - 10.4: Allow filtering by sensor ID and barn ID
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectModel(GasSensorReading.name)
    private readonly gasSensorReadingModel: Model<GasSensorReadingDocument>,
  ) {}

  /**
   * Get historical sensor readings with filtering and pagination
   * Requirements: 10.1, 10.4
   *
   * Property 28: Historical Data Date Filtering
   * - All returned readings have timestamps within the specified range
   * - All returned readings match any specified filters
   */
  async getHistoricalReadings(
    filterDto: SensorReadingFilterDto,
  ): Promise<PaginatedResponse<SensorReadingResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      sensorId,
      barnId,
      startDate,
      endDate,
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (sensorId) {
      filter.sensorId = sensorId;
    }

    if (barnId) {
      if (!Types.ObjectId.isValid(barnId)) {
        throw new NotFoundException('Invalid barn ID format');
      }
      filter.barnId = new Types.ObjectId(barnId);
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        (filter.timestamp as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        (filter.timestamp as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [readings, total] = await Promise.all([
      this.gasSensorReadingModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.gasSensorReadingModel.countDocuments(filter).exec(),
    ]);

    const readingDtos = readings.map((reading) =>
      SensorReadingResponseDto.fromDocument(reading),
    );

    return createPaginatedResponse(readingDtos, total, page, limit);
  }

  /**
   * Get aggregated sensor readings
   * Requirements: 10.2
   *
   * Property 29: Data Aggregation Correctness
   * - Aggregated values equal the mathematical average of all readings
   */
  async getAggregatedReadings(
    filterDto: SensorReadingFilterDto,
  ): Promise<AggregatedReadingDto[]> {
    const {
      sensorId,
      barnId,
      startDate,
      endDate,
      aggregation = 'hourly',
    } = filterDto;

    if (aggregation === 'none') {
      return [];
    }

    const matchStage: Record<string, unknown> = {};

    if (sensorId) {
      matchStage.sensorId = sensorId;
    }

    if (barnId) {
      if (!Types.ObjectId.isValid(barnId)) {
        throw new NotFoundException('Invalid barn ID format');
      }
      matchStage.barnId = new Types.ObjectId(barnId);
    }

    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) {
        (matchStage.timestamp as Record<string, Date>).$gte = new Date(
          startDate,
        );
      }
      if (endDate) {
        (matchStage.timestamp as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    const dateGrouping = this.getDateGrouping(aggregation);

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            sensorId: '$sensorId',
            barnId: '$barnId',
            ...dateGrouping,
          },
          avgMethanePpm: { $avg: '$methanePpm' },
          avgCo2Ppm: { $avg: '$co2Ppm' },
          avgNh3Ppm: { $avg: '$nh3Ppm' },
          avgTemperature: { $avg: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          maxMethanePpm: { $max: '$methanePpm' },
          maxCo2Ppm: { $max: '$co2Ppm' },
          maxNh3Ppm: { $max: '$nh3Ppm' },
          minMethanePpm: { $min: '$methanePpm' },
          minCo2Ppm: { $min: '$co2Ppm' },
          minNh3Ppm: { $min: '$nh3Ppm' },
          readingCount: { $sum: 1 },
          minTimestamp: { $min: '$timestamp' },
          maxTimestamp: { $max: '$timestamp' },
        },
      },
      { $sort: { minTimestamp: -1 as const } },
    ];

    const results = await this.gasSensorReadingModel
      .aggregate<AggregationResult>(pipeline)
      .exec();

    return results.map((result) => {
      const dto = new AggregatedReadingDto();
      dto.sensorId = result._id.sensorId;
      dto.barnId = result._id.barnId.toString();
      dto.periodStart = result.minTimestamp;
      dto.periodEnd = result.maxTimestamp;
      dto.avgMethanePpm = Math.round(result.avgMethanePpm * 100) / 100;
      dto.avgCo2Ppm = Math.round(result.avgCo2Ppm * 100) / 100;
      dto.avgNh3Ppm = Math.round(result.avgNh3Ppm * 100) / 100;
      dto.avgTemperature = Math.round(result.avgTemperature * 100) / 100;
      dto.avgHumidity = Math.round(result.avgHumidity * 100) / 100;
      dto.maxMethanePpm = result.maxMethanePpm;
      dto.maxCo2Ppm = result.maxCo2Ppm;
      dto.maxNh3Ppm = result.maxNh3Ppm;
      dto.minMethanePpm = result.minMethanePpm;
      dto.minCo2Ppm = result.minCo2Ppm;
      dto.minNh3Ppm = result.minNh3Ppm;
      dto.readingCount = result.readingCount;
      dto.maxAlertLevel = this.calculateMaxAlertLevel(
        result.maxMethanePpm,
        result.maxCo2Ppm,
        result.maxNh3Ppm,
      );
      return dto;
    });
  }

  /**
   * Get latest readings per sensor
   */
  async getLatestReadings(
    filterDto: LatestReadingsFilterDto,
  ): Promise<LatestReadingResponseDto[]> {
    const { barnId, sensorIds } = filterDto;

    const matchStage: Record<string, unknown> = {};

    if (barnId) {
      if (!Types.ObjectId.isValid(barnId)) {
        throw new NotFoundException('Invalid barn ID format');
      }
      matchStage.barnId = new Types.ObjectId(barnId);
    }

    if (sensorIds && sensorIds.length > 0) {
      matchStage.sensorId = { $in: sensorIds };
    }

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      { $sort: { timestamp: -1 as const } },
      {
        $group: {
          _id: '$sensorId',
          latestReading: { $first: '$$ROOT' },
        },
      },
    ];

    const results = await this.gasSensorReadingModel
      .aggregate<LatestReadingResult>(pipeline)
      .exec();

    return results.map((result) => {
      const dto = new LatestReadingResponseDto();
      dto.sensorId = result._id;
      dto.barnId = result.latestReading.barnId.toString();
      dto.lastUpdated = result.latestReading.timestamp;
      dto.reading = {
        _id: result.latestReading._id.toString(),
        sensorId: result.latestReading.sensorId,
        barnId: result.latestReading.barnId.toString(),
        methanePpm: result.latestReading.methanePpm,
        co2Ppm: result.latestReading.co2Ppm,
        nh3Ppm: result.latestReading.nh3Ppm,
        temperature: result.latestReading.temperature,
        humidity: result.latestReading.humidity,
        alertLevel: result.latestReading.alertLevel,
        timestamp: result.latestReading.timestamp,
      };
      return dto;
    });
  }

  /**
   * Get readings for a specific sensor
   * Requirements: 10.4
   */
  async getReadingsBySensor(
    sensorId: string,
    filterDto: SensorReadingFilterDto,
  ): Promise<PaginatedResponse<SensorReadingResponseDto>> {
    return this.getHistoricalReadings({
      ...filterDto,
      sensorId,
    });
  }

  /**
   * Get available sensors for a barn from stored readings
   */
  async getAvailableSensors(barnId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(barnId)) {
      return [];
    }

    const sensors = await this.gasSensorReadingModel.distinct('sensorId', {
      barnId: new Types.ObjectId(barnId),
    });

    return sensors;
  }

  /**
   * Store a new sensor reading
   * Requirements: 6.2
   */
  async storeSensorReading(
    reading: Omit<GasSensorReading, 'expireAt'>,
  ): Promise<GasSensorReadingDocument> {
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 90); // 90 days TTL

    const newReading = new this.gasSensorReadingModel({
      ...reading,
      barnId: new Types.ObjectId(String(reading.barnId)),
      expireAt,
    });

    const savedReading = await newReading.save();
    this.logger.debug(
      `Stored sensor reading from ${reading.sensorId} for barn ${String(reading.barnId)}`,
    );

    return savedReading;
  }

  /**
   * Get date grouping for aggregation
   */
  private getDateGrouping(
    aggregation: AggregationPeriod,
  ): Record<string, unknown> {
    switch (aggregation) {
      case 'hourly':
        return {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
        };
      case 'daily':
        return {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
        };
      case 'weekly':
        return {
          year: { $year: '$timestamp' },
          week: { $week: '$timestamp' },
        };
      default:
        return {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
        };
    }
  }

  /**
   * Calculate max alert level from max gas values
   */
  private calculateMaxAlertLevel(
    maxMethane: number,
    maxCo2: number,
    maxNh3: number,
  ): AlertLevel {
    if (maxMethane > 1000 || maxCo2 > 3000 || maxNh3 > 25) {
      return AlertLevel.DANGER;
    }

    if (maxMethane > 500 || maxCo2 > 2000 || maxNh3 > 15) {
      return AlertLevel.WARNING;
    }

    return AlertLevel.NORMAL;
  }

  /**
   * Get methane readings for a period with aggregation
   * Requirements: 3.2, 3.3
   *
   * @param barnId - The barn ID to get readings for
   * @param startDate - Start of the period
   * @param endDate - End of the period
   * @param aggregation - Aggregation level (hourly or daily)
   * @returns Array of methane readings with dates
   */
  async getMethaneReadingsForPeriod(
    barnId: string,
    startDate: Date,
    endDate: Date,
    aggregation: 'hourly' | 'daily' = 'daily',
  ): Promise<Array<{ date: Date; methanePpm: number }>> {
    if (!Types.ObjectId.isValid(barnId)) {
      return [];
    }

    const matchStage: Record<string, unknown> = {
      barnId: new Types.ObjectId(barnId),
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const dateGrouping = this.getDateGrouping(aggregation);

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $group: {
          _id: dateGrouping,
          avgMethanePpm: { $avg: '$methanePpm' },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $sort: { timestamp: 1 as const } },
    ];

    const results = await this.gasSensorReadingModel
      .aggregate<{
        _id: Record<string, number>;
        avgMethanePpm: number;
        timestamp: Date;
      }>(pipeline)
      .exec();

    return results.map((result) => ({
      date: result.timestamp,
      methanePpm: Math.round(result.avgMethanePpm * 100) / 100,
    }));
  }

  /**
   * Get temperature readings for a period with aggregation
   * Requirements: 3.2, 3.3
   *
   * @param barnId - The barn ID to get readings for
   * @param startDate - Start of the period
   * @param endDate - End of the period
   * @param aggregation - Aggregation level (hourly or daily)
   * @returns Array of temperature readings with dates
   */
  async getTemperatureReadingsForPeriod(
    barnId: string,
    startDate: Date,
    endDate: Date,
    aggregation: 'hourly' | 'daily' = 'daily',
  ): Promise<Array<{ date: Date; temperature: number }>> {
    if (!Types.ObjectId.isValid(barnId)) {
      return [];
    }

    const matchStage: Record<string, unknown> = {
      barnId: new Types.ObjectId(barnId),
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const dateGrouping = this.getDateGrouping(aggregation);

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $group: {
          _id: dateGrouping,
          avgTemperature: { $avg: '$temperature' },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $sort: { timestamp: 1 as const } },
    ];

    const results = await this.gasSensorReadingModel
      .aggregate<{
        _id: Record<string, number>;
        avgTemperature: number;
        timestamp: Date;
      }>(pipeline)
      .exec();

    return results.map((result) => ({
      date: result.timestamp,
      temperature: Math.round(result.avgTemperature * 100) / 100,
    }));
  }
}
