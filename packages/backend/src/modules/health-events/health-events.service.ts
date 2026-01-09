import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  HealthEvent,
  HealthEventDocument,
} from '../../schemas/health-event.schema';
import { Livestock, LivestockDocument } from '../../schemas/livestock.schema';
import {
  CreateHealthEventDto,
  UpdateHealthEventDto,
  HealthEventResponseDto,
  HealthEventFilterDto,
} from './dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';

@Injectable()
export class HealthEventsService {
  constructor(
    @InjectModel(HealthEvent.name)
    private readonly healthEventModel: Model<HealthEventDocument>,
    @InjectModel(Livestock.name)
    private readonly livestockModel: Model<LivestockDocument>,
  ) {}

  /**
   * Validate that the livestock exists
   * Requirements: 1.1
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
   * Validate that event date is not in the future
   * Requirements: 1.3
   */
  private validateEventDate(eventDate: string): void {
    const date = new Date(eventDate);
    const now = new Date();
    if (date > now) {
      throw new BadRequestException('Event date cannot be in the future');
    }
  }

  /**
   * Create a new health event
   * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6
   */
  async create(
    livestockId: string,
    createHealthEventDto: CreateHealthEventDto,
  ): Promise<HealthEventResponseDto> {
    try {
      // Validate livestock exists
      await this.validateLivestock(livestockId);

      // Validate event date is not in future
      this.validateEventDate(createHealthEventDto.eventDate);

      // Validate next due date if provided
      if (createHealthEventDto.nextDueDate) {
        const nextDueDate = new Date(createHealthEventDto.nextDueDate);
        const eventDate = new Date(createHealthEventDto.eventDate);
        if (nextDueDate < eventDate) {
          throw new BadRequestException(
            'Next due date cannot be before event date',
          );
        }
      }

      const healthEvent = new this.healthEventModel({
        livestockId: new Types.ObjectId(livestockId),
        eventType: createHealthEventDto.eventType,
        eventDate: new Date(createHealthEventDto.eventDate),
        description: createHealthEventDto.description,
        vaccineName: createHealthEventDto.vaccineName,
        nextDueDate: createHealthEventDto.nextDueDate
          ? new Date(createHealthEventDto.nextDueDate)
          : undefined,
        veterinarianName: createHealthEventDto.veterinarianName,
        findings: createHealthEventDto.findings,
        diseaseName: createHealthEventDto.diseaseName,
        severity: createHealthEventDto.severity,
        treatmentPlan: createHealthEventDto.treatmentPlan,
      });

      const savedEvent = await healthEvent.save();
      return HealthEventResponseDto.fromDocument(savedEvent);
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
        'Failed to create health event: ' + (error as Error).message,
      );
    }
  }

  /**
   * Get all health events for a livestock
   * Requirements: 1.2, 1.7, 1.8
   */
  async findByLivestock(
    livestockId: string,
    filterDto: HealthEventFilterDto,
  ): Promise<PaginatedResponse<HealthEventResponseDto>> {
    // Validate livestock exists
    await this.validateLivestock(livestockId);

    const { page = 1, limit = 10, eventType, startDate, endDate } = filterDto;

    const filter: Record<string, unknown> = {
      livestockId: new Types.ObjectId(livestockId),
    };

    // Filter by event type
    if (eventType) {
      filter.eventType = eventType;
    }

    // Filter by date range
    if (startDate || endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }
      filter.eventDate = dateFilter;
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.healthEventModel
        .find(filter)
        .sort({ eventDate: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .exec(),
      this.healthEventModel.countDocuments(filter).exec(),
    ]);

    const eventDtos = events.map((event) =>
      HealthEventResponseDto.fromDocument(event),
    );
    return createPaginatedResponse(eventDtos, total, page, limit);
  }

  /**
   * Get a single health event
   * Requirements: 1.1
   */
  async findOne(id: string): Promise<HealthEventResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Health event not found');
    }

    const event = await this.healthEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Health event not found');
    }

    return HealthEventResponseDto.fromDocument(event);
  }

  /**
   * Update a health event
   * Requirements: 1.1
   */
  async update(
    id: string,
    updateHealthEventDto: UpdateHealthEventDto,
  ): Promise<HealthEventResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Health event not found');
    }

    const event = await this.healthEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException('Health event not found');
    }

    // Validate event date if being updated
    if (updateHealthEventDto.eventDate) {
      this.validateEventDate(updateHealthEventDto.eventDate);
    }

    const updateData: Partial<HealthEvent> = {};

    if (updateHealthEventDto.eventType !== undefined) {
      updateData.eventType = updateHealthEventDto.eventType;
    }

    if (updateHealthEventDto.eventDate !== undefined) {
      updateData.eventDate = new Date(updateHealthEventDto.eventDate);
    }

    if (updateHealthEventDto.description !== undefined) {
      updateData.description = updateHealthEventDto.description;
    }

    if (updateHealthEventDto.vaccineName !== undefined) {
      updateData.vaccineName = updateHealthEventDto.vaccineName;
    }

    if (updateHealthEventDto.nextDueDate !== undefined) {
      updateData.nextDueDate = new Date(updateHealthEventDto.nextDueDate);
    }

    if (updateHealthEventDto.veterinarianName !== undefined) {
      updateData.veterinarianName = updateHealthEventDto.veterinarianName;
    }

    if (updateHealthEventDto.findings !== undefined) {
      updateData.findings = updateHealthEventDto.findings;
    }

    if (updateHealthEventDto.diseaseName !== undefined) {
      updateData.diseaseName = updateHealthEventDto.diseaseName;
    }

    if (updateHealthEventDto.severity !== undefined) {
      updateData.severity = updateHealthEventDto.severity;
    }

    if (updateHealthEventDto.treatmentPlan !== undefined) {
      updateData.treatmentPlan = updateHealthEventDto.treatmentPlan;
    }

    const updatedEvent = await this.healthEventModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException('Health event not found');
    }

    return HealthEventResponseDto.fromDocument(updatedEvent);
  }

  /**
   * Delete a health event
   * Requirements: 1.1
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Health event not found');
    }

    const result = await this.healthEventModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Health event not found');
    }
  }

  /**
   * Get upcoming vaccinations
   * Requirements: 1.4
   */
  async getUpcomingVaccinations(
    farmId: string,
    daysAhead: number = 30,
  ): Promise<HealthEventResponseDto[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Get all livestock for the farm
    const livestock = await this.livestockModel
      .find({ farmId: new Types.ObjectId(farmId) })
      .exec();

    const livestockIds = livestock.map((l) => l._id);

    // Find vaccination events with upcoming due dates
    const events = await this.healthEventModel
      .find({
        livestockId: { $in: livestockIds },
        eventType: 'vaccination',
        nextDueDate: {
          $gte: now,
          $lte: futureDate,
        },
      })
      .sort({ nextDueDate: 1 })
      .exec();

    return events.map((event) => HealthEventResponseDto.fromDocument(event));
  }
}
