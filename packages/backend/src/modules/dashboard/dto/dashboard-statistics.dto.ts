import { EntryExitLogResponseDto } from '../../entry-exit/dto/entry-exit-log-response.dto';
import { BarnResponseDto } from '../../barns/dto/barn-response.dto';

/**
 * Livestock summary by status
 * Requirements: 9.4
 */
export class LivestockStatusSummaryDto {
  active: number;
  sold: number;
  deceased: number;
  total: number;
}

/**
 * Livestock summary by species
 * Requirements: 9.4
 */
export class LivestockSpeciesSummaryDto {
  species: string;
  count: number;
}

/**
 * Livestock summary combining status and species
 * Requirements: 9.4
 */
export class LivestockSummaryDto {
  byStatus: LivestockStatusSummaryDto;
  bySpecies: LivestockSpeciesSummaryDto[];
}

/**
 * Barn occupancy overview
 * Requirements: 9.5
 */
export class BarnOccupancyDto {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  status: string;

  static fromBarnResponse(barn: BarnResponseDto): BarnOccupancyDto {
    const dto = new BarnOccupancyDto();
    dto.id = barn.id;
    dto.name = barn.name;
    dto.code = barn.code;
    dto.capacity = barn.capacity;
    dto.currentOccupancy = barn.currentOccupancy;
    dto.occupancyPercentage =
      barn.capacity > 0
        ? Math.round((barn.currentOccupancy / barn.capacity) * 100)
        : 0;
    dto.status = barn.status;
    return dto;
  }
}

/**
 * Dashboard statistics response
 * Requirements: 9.3, 9.4, 9.5
 */
export class DashboardStatisticsDto {
  recentLogs: EntryExitLogResponseDto[];
  livestockSummary: LivestockSummaryDto;
  barnOccupancy: BarnOccupancyDto[];
}
