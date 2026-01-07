import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardStatisticsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';

/**
 * Dashboard Controller
 *
 * Provides endpoints for dashboard statistics
 *
 * Requirements:
 * - 9.3: GET /api/dashboard/statistics - Recent logs (last 10)
 * - 9.4: GET /api/dashboard/statistics - Livestock summary by status/species
 * - 9.5: GET /api/dashboard/statistics - Barn occupancy overview
 */
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard statistics
   * Requirements: 9.3, 9.4, 9.5
   *
   * @param farmId - Optional farm ID to filter statistics
   * @returns Dashboard statistics including recent logs, livestock summary, and barn occupancy
   */
  @Get('statistics')
  async getStatistics(
    @Query('farmId') farmId?: string,
  ): Promise<DashboardStatisticsDto> {
    return this.dashboardService.getStatistics(farmId);
  }
}
