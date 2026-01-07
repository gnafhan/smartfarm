import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import {
  SensorReadingFilterDto,
  LatestReadingsFilterDto,
  SensorReadingResponseDto,
  AggregatedReadingDto,
  LatestReadingResponseDto,
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards';

/**
 * Monitoring Controller
 *
 * Provides endpoints for accessing gas sensor data
 *
 * Requirements:
 * - 10.1: GET /api/monitoring/readings - Historical readings with date range
 * - 10.2: GET /api/monitoring/readings/aggregated - Aggregated data
 * - 10.4: GET /api/monitoring/sensor/:id - Readings for specific sensor
 */
@Controller('api/monitoring')
@UseGuards(JwtAuthGuard)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  /**
   * Get historical sensor readings with filtering and pagination
   * Requirements: 10.1, 10.4
   *
   * @param filterDto - Filter options including date range, sensor ID, barn ID
   * @returns Paginated list of sensor readings
   */
  @Get('readings')
  async getHistoricalReadings(
    @Query() filterDto: SensorReadingFilterDto,
  ): Promise<PaginatedResponse<SensorReadingResponseDto>> {
    return this.monitoringService.getHistoricalReadings(filterDto);
  }

  /**
   * Get aggregated sensor readings
   * Requirements: 10.2
   *
   * @param filterDto - Filter options including aggregation period
   * @returns List of aggregated readings
   */
  @Get('readings/aggregated')
  async getAggregatedReadings(
    @Query() filterDto: SensorReadingFilterDto,
  ): Promise<AggregatedReadingDto[]> {
    return this.monitoringService.getAggregatedReadings(filterDto);
  }

  /**
   * Get latest readings per sensor
   *
   * @param filterDto - Filter options including barn ID and sensor IDs
   * @returns List of latest readings per sensor
   */
  @Get('latest')
  async getLatestReadings(
    @Query() filterDto: LatestReadingsFilterDto,
  ): Promise<LatestReadingResponseDto[]> {
    return this.monitoringService.getLatestReadings(filterDto);
  }

  /**
   * Get readings for a specific sensor
   * Requirements: 10.4
   *
   * @param sensorId - The sensor ID
   * @param filterDto - Filter options
   * @returns Paginated list of sensor readings
   */
  @Get('sensor/:sensorId')
  async getReadingsBySensor(
    @Param('sensorId') sensorId: string,
    @Query() filterDto: SensorReadingFilterDto,
  ): Promise<PaginatedResponse<SensorReadingResponseDto>> {
    return this.monitoringService.getReadingsBySensor(sensorId, filterDto);
  }

  /**
   * Get available sensors for a barn
   *
   * @param barnId - The barn ID
   * @returns List of sensor IDs that have data for this barn
   */
  @Get('sensors/:barnId')
  async getAvailableSensors(
    @Param('barnId') barnId: string,
  ): Promise<string[]> {
    return this.monitoringService.getAvailableSensors(barnId);
  }
}
