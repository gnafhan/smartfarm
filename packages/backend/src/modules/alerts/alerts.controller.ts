import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertFilterDto } from '../../common/dto/alert-filter.dto';
import { AlertResponseDto } from './dto/alert-response.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

/**
 * Alerts Controller
 *
 * Handles HTTP endpoints for alert management
 * Requirements: 8.1, 8.3, 8.4, 8.5, 8.6
 */
@Controller('api/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Create a new alert
   * POST /api/alerts
   * Requirements: 8.1, 8.5
   */
  @Post()
  async create(@Body() dto: CreateAlertDto): Promise<AlertResponseDto> {
    const alert = await this.alertsService.create(dto);
    return AlertResponseDto.fromDocument(alert);
  }

  /**
   * Get all alerts with filtering and pagination
   * GET /api/alerts
   * Requirements: 8.6
   */
  @Get()
  async findAll(
    @Query() filterDto: AlertFilterDto,
  ): Promise<PaginatedResponse<AlertResponseDto>> {
    return this.alertsService.findAll(filterDto);
  }

  /**
   * Get active alerts
   * GET /api/alerts/active
   * Requirements: 8.6
   */
  @Get('active')
  async findActive(
    @Query('farmId') farmId?: string,
  ): Promise<AlertResponseDto[]> {
    return this.alertsService.findActive(farmId);
  }

  /**
   * Get alert statistics for a farm
   * GET /api/alerts/stats/:farmId
   */
  @Get('stats/:farmId')
  async getStats(@Param('farmId') farmId: string): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
  }> {
    return this.alertsService.getStats(farmId);
  }

  /**
   * Get alert by ID
   * GET /api/alerts/:id
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<AlertResponseDto> {
    const alert = await this.alertsService.findById(id);
    return AlertResponseDto.fromDocument(alert);
  }

  /**
   * Acknowledge an alert
   * PATCH /api/alerts/:id/acknowledge
   * Requirements: 8.3
   */
  @Patch(':id/acknowledge')
  async acknowledge(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AlertResponseDto> {
    return this.alertsService.acknowledge(id, user.sub);
  }

  /**
   * Resolve an alert
   * PATCH /api/alerts/:id/resolve
   * Requirements: 8.4
   */
  @Patch(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AlertResponseDto> {
    return this.alertsService.resolve(id, user.sub);
  }
}
