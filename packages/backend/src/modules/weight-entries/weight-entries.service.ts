import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WeightEntry,
  WeightEntryDocument,
} from '../../schemas/weight-entry.schema';
import { Livestock, LivestockDocument } from '../../schemas/livestock.schema';
import {
  CreateWeightEntryDto,
  UpdateWeightEntryDto,
  WeightEntryResponseDto,
  WeightEntryFilterDto,
  WeightChartDataDto,
} from './dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class WeightEntriesService {
  constructor(
    @InjectModel(WeightEntry.name)
    private readonly weightEntryModel: Model<WeightEntryDocument>,
    @InjectModel(Livestock.name)
    private readonly livestockModel: Model<LivestockDocument>,
    private readonly monitoringService: MonitoringService,
  ) {}

  /**
   * Validate that the livestock exists
   * Requirements: 2.1
   */
  private async validateLivestock(livestockId: string): Promise<void> {
    if (!Types.ObjectId.isValid(livestockId)) {
      throw new BadRequestException('Invalid livestock ID format');
    }

    const livestock = await this.livestockModel.findById(livestockId).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }
  }

  /**
   * Validate that measurement date is not in the future
   * Requirements: 2.3
   */
  private validateMeasurementDate(measurementDate: string): void {
    const date = new Date(measurementDate);
    const now = new Date();
    if (date > now) {
      throw new BadRequestException('Measurement date cannot be in the future');
    }
  }

  /**
   * Create a new weight entry
   * Requirements: 2.1, 2.2, 2.3
   */
  async create(
    livestockId: string,
    createWeightEntryDto: CreateWeightEntryDto,
  ): Promise<WeightEntryResponseDto> {
    try {
      // Validate livestock exists
      await this.validateLivestock(livestockId);

      // Validate measurement date is not in future
      this.validateMeasurementDate(createWeightEntryDto.measurementDate);

      const weightEntry = new this.weightEntryModel({
        livestockId: new Types.ObjectId(livestockId),
        weight: createWeightEntryDto.weight,
        measurementDate: new Date(createWeightEntryDto.measurementDate),
        notes: createWeightEntryDto.notes,
      });

      const savedEntry = await weightEntry.save();
      return WeightEntryResponseDto.fromDocument(savedEntry);
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // Wrap unknown errors
      throw new BadRequestException(
        'Failed to create weight entry: ' + (error as Error).message,
      );
    }
  }

  /**
   * Get all weight entries for a livestock
   * Requirements: 2.4
   */
  async findByLivestock(
    livestockId: string,
    filterDto: WeightEntryFilterDto,
  ): Promise<PaginatedResponse<WeightEntryResponseDto>> {
    // Validate livestock exists
    await this.validateLivestock(livestockId);

    const { page = 1, limit = 10, startDate, endDate } = filterDto;

    const filter: Record<string, unknown> = {
      livestockId: new Types.ObjectId(livestockId),
    };

    // Filter by date range
    if (startDate || endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }
      filter.measurementDate = dateFilter;
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.weightEntryModel
        .find(filter)
        .sort({ measurementDate: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .exec(),
      this.weightEntryModel.countDocuments(filter).exec(),
    ]);

    const entryDtos = entries.map((entry) =>
      WeightEntryResponseDto.fromDocument(entry),
    );
    return createPaginatedResponse(entryDtos, total, page, limit);
  }

  /**
   * Get a single weight entry
   * Requirements: 2.1
   */
  async findOne(id: string): Promise<WeightEntryResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Weight entry not found');
    }

    const entry = await this.weightEntryModel.findById(id).exec();
    if (!entry) {
      throw new NotFoundException('Weight entry not found');
    }

    return WeightEntryResponseDto.fromDocument(entry);
  }

  /**
   * Update a weight entry
   * Requirements: 2.6
   */
  async update(
    id: string,
    updateWeightEntryDto: UpdateWeightEntryDto,
  ): Promise<WeightEntryResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Weight entry not found');
    }

    const entry = await this.weightEntryModel.findById(id).exec();
    if (!entry) {
      throw new NotFoundException('Weight entry not found');
    }

    // Validate measurement date if being updated
    if (updateWeightEntryDto.measurementDate) {
      this.validateMeasurementDate(updateWeightEntryDto.measurementDate);
    }

    const updateData: Partial<WeightEntry> = {};

    if (updateWeightEntryDto.weight !== undefined) {
      updateData.weight = updateWeightEntryDto.weight;
    }

    if (updateWeightEntryDto.measurementDate !== undefined) {
      updateData.measurementDate = new Date(
        updateWeightEntryDto.measurementDate,
      );
    }

    if (updateWeightEntryDto.notes !== undefined) {
      updateData.notes = updateWeightEntryDto.notes;
    }

    const updatedEntry = await this.weightEntryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedEntry) {
      throw new NotFoundException('Weight entry not found');
    }

    return WeightEntryResponseDto.fromDocument(updatedEntry);
  }

  /**
   * Delete a weight entry
   * Requirements: 2.5
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Weight entry not found');
    }

    const result = await this.weightEntryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Weight entry not found');
    }
  }

  /**
   * Get latest weight for a livestock
   * Requirements: 2.1
   */
  async getLatestWeight(
    livestockId: string,
  ): Promise<WeightEntryResponseDto | null> {
    // Validate livestock exists
    await this.validateLivestock(livestockId);

    const entry = await this.weightEntryModel
      .findOne({ livestockId: new Types.ObjectId(livestockId) })
      .sort({ measurementDate: -1 })
      .exec();

    if (!entry) {
      return null;
    }

    return WeightEntryResponseDto.fromDocument(entry);
  }

  /**
   * Get weight chart data with environmental overlays
   * Requirements: 3.1, 3.2, 3.3, 3.6, 3.7
   *
   * Fetches weight entries for the specified date range and overlays
   * temperature and methane readings from the barn's sensors.
   * Handles missing environmental data gracefully by returning empty arrays.
   *
   * @param livestockId - The livestock ID to get weight data for
   * @param startDate - Optional start date for the range
   * @param endDate - Optional end date for the range
   * @returns WeightChartDataDto with weight, temperature, and methane data
   */
  async getWeightChartData(
    livestockId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<WeightChartDataDto> {
    // Validate livestock exists
    await this.validateLivestock(livestockId);

    // Get the livestock to find its barn
    const livestock = await this.livestockModel.findById(livestockId).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    // Build filter for weight entries
    const filter: Record<string, unknown> = {
      livestockId: new Types.ObjectId(livestockId),
    };

    // Apply date range filter
    if (startDate || endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        dateFilter.$gte = startDate;
      }
      if (endDate) {
        dateFilter.$lte = endDate;
      }
      filter.measurementDate = dateFilter;
    }

    // Fetch weight entries
    const weightEntries = await this.weightEntryModel
      .find(filter)
      .sort({ measurementDate: 1 }) // Chronological order for charts
      .exec();

    // Map weight entries to chart data format
    const weightData = weightEntries.map((entry) => ({
      date: entry.measurementDate,
      weight: entry.weight,
    }));

    // Initialize empty environmental data arrays
    let temperatureData: Array<{ date: Date; temperature: number }> = [];
    let methaneData: Array<{ date: Date; methanePpm: number }> = [];

    // If livestock has a barn, fetch environmental data
    // Handle missing environmental data gracefully (Requirement 3.6)
    if (livestock.currentBarnId) {
      const barnId = livestock.currentBarnId.toString();

      // Determine date range for environmental data
      const envStartDate = startDate || new Date(0); // Beginning of time if not specified
      const envEndDate = endDate || new Date(); // Now if not specified

      try {
        // Fetch temperature readings
        temperatureData =
          await this.monitoringService.getTemperatureReadingsForPeriod(
            barnId,
            envStartDate,
            envEndDate,
            'daily',
          );

        // Fetch methane readings
        methaneData =
          await this.monitoringService.getMethaneReadingsForPeriod(
            barnId,
            envStartDate,
            envEndDate,
            'daily',
          );
      } catch (error) {
        // Log error but continue with empty environmental data
        // This ensures graceful handling of missing data (Requirement 3.6)
        console.error('Error fetching environmental data:', error);
      }
    }

    // Return combined chart data
    const chartData = new WeightChartDataDto();
    chartData.weightData = weightData;
    chartData.temperatureData = temperatureData;
    chartData.methaneData = methaneData;

    return chartData;
  }
}
