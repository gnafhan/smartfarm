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
import { WeightEntriesService } from './weight-entries.service';
import {
  CreateWeightEntryDto,
  UpdateWeightEntryDto,
  WeightEntryResponseDto,
  WeightEntryFilterDto,
  WeightChartDataDto,
} from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/livestock/:livestockId/weight-entries')
@UseGuards(JwtAuthGuard)
export class WeightEntriesController {
  constructor(private readonly weightEntriesService: WeightEntriesService) {}

  /**
   * Create a new weight entry
   * Requirements: 6.3
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('livestockId') livestockId: string,
    @Body() createWeightEntryDto: CreateWeightEntryDto,
  ): Promise<WeightEntryResponseDto> {
    return this.weightEntriesService.create(livestockId, createWeightEntryDto);
  }

  /**
   * Get all weight entries for a livestock
   * Requirements: 6.4, 6.5
   */
  @Get()
  async findAll(
    @Param('livestockId') livestockId: string,
    @Query() filterDto: WeightEntryFilterDto,
  ): Promise<PaginatedResponse<WeightEntryResponseDto>> {
    return this.weightEntriesService.findByLivestock(livestockId, filterDto);
  }

  /**
   * Get weight chart data with environmental overlays
   * Requirements: 3.1, 3.2, 3.3
   */
  @Get('chart-data')
  async getChartData(
    @Param('livestockId') livestockId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<WeightChartDataDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.weightEntriesService.getWeightChartData(
      livestockId,
      start,
      end,
    );
  }

  /**
   * Get latest weight entry for a livestock
   * Requirements: 2.1
   */
  @Get('latest')
  async getLatest(
    @Param('livestockId') livestockId: string,
  ): Promise<WeightEntryResponseDto | null> {
    return this.weightEntriesService.getLatestWeight(livestockId);
  }

  /**
   * Get a single weight entry
   * Requirements: 2.1
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WeightEntryResponseDto> {
    return this.weightEntriesService.findOne(id);
  }

  /**
   * Update a weight entry
   * Requirements: 2.6
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWeightEntryDto: UpdateWeightEntryDto,
  ): Promise<WeightEntryResponseDto> {
    return this.weightEntriesService.update(id, updateWeightEntryDto);
  }

  /**
   * Delete a weight entry
   * Requirements: 2.5
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.weightEntriesService.remove(id);
  }
}
