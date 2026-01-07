import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LivestockService } from './livestock.service';
import { CreateLivestockDto } from './dto/create-livestock.dto';
import { UpdateLivestockDto } from './dto/update-livestock.dto';
import { LivestockResponseDto } from './dto/livestock-response.dto';
import { LivestockFilterDto } from '../../common/dto/livestock-filter.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/livestock')
@UseGuards(JwtAuthGuard)
export class LivestockController {
  constructor(private readonly livestockService: LivestockService) {}

  /**
   * Create a new livestock record
   * Requirements: 3.1, 3.2
   */
  @Post()
  async create(
    @Body() createLivestockDto: CreateLivestockDto,
  ): Promise<LivestockResponseDto> {
    return this.livestockService.create(createLivestockDto);
  }

  /**
   * Get all livestock with pagination and filtering
   * Requirements: 3.3
   */
  @Get()
  async findAll(
    @Query() filterDto: LivestockFilterDto,
  ): Promise<PaginatedResponse<LivestockResponseDto>> {
    return this.livestockService.findAll(filterDto);
  }

  /**
   * Get public livestock info by QR code (no authentication required)
   * Requirements: 4.1, 4.2, 4.3
   */
  @Public()
  @Get('qr/:qrCode')
  async getByQrCode(@Param('qrCode') qrCode: string): Promise<{
    livestock: LivestockResponseDto;
    barn: { id: string; name: string; code: string } | null;
    recentLogs: any[];
  }> {
    return this.livestockService.getPublicInfo(qrCode);
  }

  /**
   * Get a livestock by ID
   * Requirements: 3.3
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LivestockResponseDto> {
    return this.livestockService.findOne(id);
  }

  /**
   * Update a livestock record
   * Requirements: 3.4, 3.6
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLivestockDto: UpdateLivestockDto,
  ): Promise<LivestockResponseDto> {
    return this.livestockService.update(id, updateLivestockDto);
  }

  /**
   * Soft delete a livestock record
   * Requirements: 3.5
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.livestockService.remove(id);
  }

  /**
   * Add photos to livestock
   * Requirements: 3.7
   */
  @Post(':id/photos')
  async addPhotos(
    @Param('id') id: string,
    @Body('photos') photos: string[],
  ): Promise<LivestockResponseDto> {
    return this.livestockService.addPhotos(id, photos);
  }

  /**
   * Remove a photo from livestock
   * Requirements: 3.7
   */
  @Delete(':id/photos')
  async removePhoto(
    @Param('id') id: string,
    @Body('photoUrl') photoUrl: string,
  ): Promise<LivestockResponseDto> {
    return this.livestockService.removePhoto(id, photoUrl);
  }
}
