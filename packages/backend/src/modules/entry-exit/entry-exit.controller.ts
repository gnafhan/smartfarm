import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EntryExitService } from './entry-exit.service';
import { CreateEntryExitLogDto } from './dto/create-entry-exit-log.dto';
import { EntryExitLogResponseDto } from './dto/entry-exit-log-response.dto';
import { EntryExitDateFilterDto } from '../../common/dto/entry-exit-filter.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Entry/Exit Controller
 * Handles RFID events and entry/exit log queries
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
@Controller('api/logs')
export class EntryExitController {
  constructor(private readonly entryExitService: EntryExitService) {}

  /**
   * Create a new entry/exit log from RFID event
   * This endpoint is called by RFID readers
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateEntryExitLogDto,
  ): Promise<EntryExitLogResponseDto> {
    return this.entryExitService.create(createDto);
  }

  /**
   * Get all entry/exit logs with filtering
   * Requirements: 7.5
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() filterDto: EntryExitDateFilterDto,
  ): Promise<PaginatedResponse<EntryExitLogResponseDto>> {
    return this.entryExitService.findAll(filterDto);
  }

  /**
   * Get recent logs (for dashboard)
   * Requirements: 9.3
   */
  @Get('recent')
  @UseGuards(JwtAuthGuard)
  async getRecentLogs(
    @Query('limit') limit?: number,
  ): Promise<EntryExitLogResponseDto[]> {
    return this.entryExitService.getRecentLogs(limit || 10);
  }

  /**
   * Get logs for a specific livestock
   * Requirements: 7.5
   */
  @Get('livestock/:id')
  @UseGuards(JwtAuthGuard)
  async findByLivestock(
    @Param('id') livestockId: string,
    @Query() filterDto: EntryExitDateFilterDto,
  ): Promise<PaginatedResponse<EntryExitLogResponseDto>> {
    return this.entryExitService.findByLivestock(livestockId, filterDto);
  }

  /**
   * Get logs for a specific barn
   * Requirements: 7.5
   */
  @Get('barn/:id')
  @UseGuards(JwtAuthGuard)
  async findByBarn(
    @Param('id') barnId: string,
    @Query() filterDto: EntryExitDateFilterDto,
  ): Promise<PaginatedResponse<EntryExitLogResponseDto>> {
    return this.entryExitService.findByBarn(barnId, filterDto);
  }

  /**
   * Get a single log by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<EntryExitLogResponseDto> {
    return this.entryExitService.findOne(id);
  }
}
