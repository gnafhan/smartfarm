import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Livestock,
  LivestockDocument,
  LivestockStatus,
} from '../../schemas/livestock.schema';
import { Barn, BarnDocument } from '../../schemas/barn.schema';
import {
  EntryExitLog,
  EntryExitLogDocument,
} from '../../schemas/entry-exit-log.schema';
import { EntryExitLogResponseDto } from '../entry-exit/dto/entry-exit-log-response.dto';
import { BarnResponseDto } from '../barns/dto/barn-response.dto';
import {
  DashboardStatisticsDto,
  LivestockSummaryDto,
  LivestockStatusSummaryDto,
  LivestockSpeciesSummaryDto,
  BarnOccupancyDto,
} from './dto';

/**
 * Interface for species aggregation result
 */
interface SpeciesAggregationResult {
  _id: string;
  count: number;
}

/**
 * Interface for status aggregation result
 */
interface StatusAggregationResult {
  _id: LivestockStatus;
  count: number;
}

/**
 * Dashboard Service
 *
 * Provides dashboard statistics including recent logs, livestock summary, and barn occupancy
 *
 * Requirements:
 * - 9.3: Display recent entry/exit logs (last 10 events)
 * - 9.4: Display livestock summary statistics (total, by status, by species)
 * - 9.5: Display barn occupancy overview with capacity indicators
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Livestock.name)
    private readonly livestockModel: Model<LivestockDocument>,
    @InjectModel(Barn.name)
    private readonly barnModel: Model<BarnDocument>,
    @InjectModel(EntryExitLog.name)
    private readonly entryExitLogModel: Model<EntryExitLogDocument>,
  ) {}

  /**
   * Get dashboard statistics
   * Requirements: 9.3, 9.4, 9.5
   *
   * Property 27: Dashboard Statistics Accuracy
   * - Recent logs count equals actual logs in the time window
   * - Livestock totals equal actual counts by status/species
   * - Barn occupancy equals actual livestock assignments
   */
  async getStatistics(farmId?: string): Promise<DashboardStatisticsDto> {
    const [recentLogs, livestockSummary, barnOccupancy] = await Promise.all([
      this.getRecentLogs(10, farmId),
      this.getLivestockSummary(farmId),
      this.getBarnOccupancy(farmId),
    ]);

    const dto = new DashboardStatisticsDto();
    dto.recentLogs = recentLogs;
    dto.livestockSummary = livestockSummary;
    dto.barnOccupancy = barnOccupancy;

    return dto;
  }

  /**
   * Get recent entry/exit logs
   * Requirements: 9.3
   */
  private async getRecentLogs(
    limit: number = 10,
    farmId?: string,
  ): Promise<EntryExitLogResponseDto[]> {
    let filter: Record<string, unknown> = {};

    // If farmId is provided, filter logs by barns belonging to that farm
    if (farmId && Types.ObjectId.isValid(farmId)) {
      const barns = await this.barnModel
        .find({ farmId: new Types.ObjectId(farmId) })
        .select('_id')
        .exec();
      const barnIds = barns.map((barn) => barn._id);
      filter = { barnId: { $in: barnIds } };
    }

    const logs = await this.entryExitLogModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    return logs.map((log) => EntryExitLogResponseDto.fromDocument(log));
  }

  /**
   * Get livestock summary by status and species
   * Requirements: 9.4
   */
  private async getLivestockSummary(
    farmId?: string,
  ): Promise<LivestockSummaryDto> {
    const filter: Record<string, unknown> = {};

    if (farmId && Types.ObjectId.isValid(farmId)) {
      filter.farmId = new Types.ObjectId(farmId);
    }

    // Get counts by status
    const statusAggregation = await this.livestockModel
      .aggregate<StatusAggregationResult>([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();

    // Get counts by species
    const speciesAggregation = await this.livestockModel
      .aggregate<SpeciesAggregationResult>([
        { $match: filter },
        { $group: { _id: '$species', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .exec();

    // Build status summary
    const byStatus = new LivestockStatusSummaryDto();
    byStatus.active = 0;
    byStatus.sold = 0;
    byStatus.deceased = 0;
    byStatus.total = 0;

    for (const item of statusAggregation) {
      byStatus.total += item.count;
      switch (item._id) {
        case LivestockStatus.ACTIVE:
          byStatus.active = item.count;
          break;
        case LivestockStatus.SOLD:
          byStatus.sold = item.count;
          break;
        case LivestockStatus.DECEASED:
          byStatus.deceased = item.count;
          break;
      }
    }

    // Build species summary
    const bySpecies: LivestockSpeciesSummaryDto[] = speciesAggregation.map(
      (item) => {
        const speciesDto = new LivestockSpeciesSummaryDto();
        speciesDto.species = item._id;
        speciesDto.count = item.count;
        return speciesDto;
      },
    );

    const summary = new LivestockSummaryDto();
    summary.byStatus = byStatus;
    summary.bySpecies = bySpecies;

    return summary;
  }

  /**
   * Get barn occupancy overview
   * Requirements: 9.5
   */
  private async getBarnOccupancy(farmId?: string): Promise<BarnOccupancyDto[]> {
    const filter: Record<string, unknown> = {};

    if (farmId && Types.ObjectId.isValid(farmId)) {
      filter.farmId = new Types.ObjectId(farmId);
    }

    const barns = await this.barnModel.find(filter).sort({ name: 1 }).exec();

    return barns.map((barn) => {
      const barnResponse = BarnResponseDto.fromDocument(barn);
      return BarnOccupancyDto.fromBarnResponse(barnResponse);
    });
  }
}
