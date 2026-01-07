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
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmFilterDto } from './dto/farm-filter.dto';
import { FarmResponseDto } from './dto/farm-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';
import type { PaginatedResponse } from '../../common/dto/pagination.dto';

@Controller('api/farms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  /**
   * Create a new farm (admin only)
   * Requirements: 12.1
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFarmDto: CreateFarmDto): Promise<FarmResponseDto> {
    return this.farmsService.create(createFarmDto);
  }

  /**
   * List all farms with pagination and filtering
   * Requirements: 12.3
   */
  @Get()
  async findAll(
    @Query() filterDto: FarmFilterDto,
  ): Promise<PaginatedResponse<FarmResponseDto>> {
    return this.farmsService.findAll(filterDto);
  }

  /**
   * Get farm by ID with stats
   * Requirements: 12.2, 12.3
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FarmResponseDto> {
    return this.farmsService.findOne(id);
  }

  /**
   * Update farm by ID (admin only)
   * Requirements: 12.1
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateFarmDto: UpdateFarmDto,
  ): Promise<FarmResponseDto> {
    return this.farmsService.update(id, updateFarmDto);
  }

  /**
   * Delete farm by ID (admin only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.farmsService.remove(id);
  }
}
