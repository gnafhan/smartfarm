import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HealthEventsService } from './health-events.service';
import {
  CreateHealthEventDto,
  UpdateHealthEventDto,
  HealthEventResponseDto,
  HealthEventFilterDto,
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/livestock/:livestockId/health-events')
@UseGuards(JwtAuthGuard)
export class HealthEventsController {
  constructor(private readonly healthEventsService: HealthEventsService) {}

  /**
   * Create a new health event
   * Requirements: 6.1, 6.7
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('livestockId') livestockId: string,
    @Body() createHealthEventDto: CreateHealthEventDto,
  ): Promise<HealthEventResponseDto> {
    return this.healthEventsService.create(livestockId, createHealthEventDto);
  }

  /**
   * Get all health events for a livestock
   * Requirements: 6.2, 6.5, 6.6
   */
  @Get()
  async findAll(
    @Param('livestockId') livestockId: string,
    @Query() filterDto: HealthEventFilterDto,
  ): Promise<PaginatedResponse<HealthEventResponseDto>> {
    return this.healthEventsService.findByLivestock(livestockId, filterDto);
  }

  /**
   * Get a single health event
   * Requirements: 1.1
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<HealthEventResponseDto> {
    return this.healthEventsService.findOne(id);
  }

  /**
   * Update a health event
   * Requirements: 1.1
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateHealthEventDto: UpdateHealthEventDto,
  ): Promise<HealthEventResponseDto> {
    return this.healthEventsService.update(id, updateHealthEventDto);
  }

  /**
   * Delete a health event
   * Requirements: 1.1
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.healthEventsService.remove(id);
  }
}

@Controller('api/health-events')
@UseGuards(JwtAuthGuard)
export class HealthEventsGlobalController {
  constructor(private readonly healthEventsService: HealthEventsService) {}

  /**
   * Get upcoming vaccinations for a farm
   * Requirements: 1.4
   */
  @Get('upcoming-vaccinations')
  async getUpcomingVaccinations(
    @Query('farmId') farmId: string,
    @Query('days') days?: number,
  ): Promise<HealthEventResponseDto[]> {
    const daysAhead = days ? parseInt(days.toString(), 10) : 30;
    return this.healthEventsService.getUpcomingVaccinations(farmId, daysAhead);
  }
}
