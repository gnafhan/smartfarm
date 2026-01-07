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
import { BarnsService } from './barns.service';
import { CreateBarnDto } from './dto/create-barn.dto';
import { UpdateBarnDto } from './dto/update-barn.dto';
import { BarnFilterDto } from './dto/barn-filter.dto';
import { BarnResponseDto } from './dto/barn-response.dto';
import { AssignSensorDto } from './dto/assign-sensor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';
import type { PaginatedResponse } from '../../common/dto/pagination.dto';

@Controller('api/barns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BarnsController {
  constructor(private readonly barnsService: BarnsService) {}

  /**
   * Create a new barn
   * Requirements: 5.1
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBarnDto: CreateBarnDto): Promise<BarnResponseDto> {
    return this.barnsService.create(createBarnDto);
  }

  /**
   * List all barns with pagination and filtering
   * Requirements: 5.2
   */
  @Get()
  async findAll(
    @Query() filterDto: BarnFilterDto,
  ): Promise<PaginatedResponse<BarnResponseDto>> {
    return this.barnsService.findAll(filterDto);
  }

  /**
   * Get barn by ID with details
   * Requirements: 5.3
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BarnResponseDto> {
    return this.barnsService.findOne(id);
  }

  /**
   * Get livestock in a barn
   * Requirements: 5.3
   */
  @Get(':id/livestock')
  async getLivestockInBarn(@Param('id') id: string) {
    return this.barnsService.getLivestockInBarn(id);
  }

  /**
   * Update barn by ID
   * Requirements: 5.1
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBarnDto: UpdateBarnDto,
  ): Promise<BarnResponseDto> {
    return this.barnsService.update(id, updateBarnDto);
  }

  /**
   * Delete barn by ID
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.barnsService.remove(id);
  }

  /**
   * Assign a sensor to a barn
   * Requirements: 5.4
   */
  @Post(':id/sensors')
  async assignSensor(
    @Param('id') id: string,
    @Body() assignSensorDto: AssignSensorDto,
  ): Promise<BarnResponseDto> {
    return this.barnsService.assignSensor(id, assignSensorDto.sensorId);
  }

  /**
   * Remove a sensor from a barn
   */
  @Delete(':id/sensors/:sensorId')
  async removeSensor(
    @Param('id') id: string,
    @Param('sensorId') sensorId: string,
  ): Promise<BarnResponseDto> {
    return this.barnsService.removeSensor(id, sensorId);
  }

  /**
   * Recalculate barn occupancy
   * Requirements: 5.2
   */
  @Post(':id/recalculate-occupancy')
  async recalculateOccupancy(
    @Param('id') id: string,
  ): Promise<BarnResponseDto> {
    return this.barnsService.updateOccupancy(id);
  }

  /**
   * Check if barn capacity is exceeded
   * Requirements: 5.5
   */
  @Get(':id/capacity-status')
  async getCapacityStatus(
    @Param('id') id: string,
  ): Promise<{ isExceeded: boolean; barn: BarnResponseDto }> {
    const barn = await this.barnsService.findOne(id);
    const isExceeded = await this.barnsService.isCapacityExceeded(id);
    return { isExceeded, barn };
  }
}
