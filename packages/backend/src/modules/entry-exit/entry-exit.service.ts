import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EntryExitLog,
  EntryExitLogDocument,
  EventType,
} from '../../schemas/entry-exit-log.schema';
import { Livestock, LivestockDocument } from '../../schemas/livestock.schema';
import { Barn, BarnDocument } from '../../schemas/barn.schema';
import { CreateEntryExitLogDto } from './dto/create-entry-exit-log.dto';
import { EntryExitLogResponseDto } from './dto/entry-exit-log-response.dto';
import { EntryExitDateFilterDto } from '../../common/dto/entry-exit-filter.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class EntryExitService {
  private readonly logger = new Logger(EntryExitService.name);

  constructor(
    @InjectModel(EntryExitLog.name)
    private readonly entryExitLogModel: Model<EntryExitLogDocument>,
    @InjectModel(Livestock.name)
    private readonly livestockModel: Model<LivestockDocument>,
    @InjectModel(Barn.name)
    private readonly barnModel: Model<BarnDocument>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Validate that the livestock exists
   * Requirements: 7.1
   */
  private async validateLivestock(
    livestockId: string,
  ): Promise<LivestockDocument> {
    if (!Types.ObjectId.isValid(livestockId)) {
      throw new BadRequestException('Invalid livestock ID format');
    }

    const livestock = await this.livestockModel.findById(livestockId).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    return livestock;
  }

  /**
   * Validate that the barn exists
   * Requirements: 7.1
   */
  private async validateBarn(barnId: string): Promise<BarnDocument> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new BadRequestException('Invalid barn ID format');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    return barn;
  }

  /**
   * Find the last entry log for a livestock in a specific barn
   * Used to calculate duration on exit
   * Requirements: 7.3
   */
  private async findLastEntryLog(
    livestockId: string,
    barnId: string,
  ): Promise<EntryExitLogDocument | null> {
    return this.entryExitLogModel
      .findOne({
        livestockId: new Types.ObjectId(livestockId),
        barnId: new Types.ObjectId(barnId),
        eventType: EventType.ENTRY,
      })
      .sort({ timestamp: -1 })
      .exec();
  }

  /**
   * Calculate duration in seconds between entry and exit
   * Requirements: 7.3
   */
  private calculateDuration(entryTimestamp: Date, exitTimestamp: Date): number {
    return Math.floor(
      (exitTimestamp.getTime() - entryTimestamp.getTime()) / 1000,
    );
  }

  /**
   * Create a new entry/exit log from RFID event
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  async create(
    createDto: CreateEntryExitLogDto,
  ): Promise<EntryExitLogResponseDto> {
    // Validate livestock and barn exist
    const livestock = await this.validateLivestock(createDto.livestockId);
    await this.validateBarn(createDto.barnId);

    const timestamp = createDto.timestamp
      ? new Date(createDto.timestamp)
      : new Date();

    let duration: number | undefined;

    // Handle entry event
    if (createDto.eventType === EventType.ENTRY) {
      // Update livestock's current barn
      await this.livestockModel
        .findByIdAndUpdate(createDto.livestockId, {
          currentBarnId: new Types.ObjectId(createDto.barnId),
        })
        .exec();

      // Increment barn occupancy
      await this.barnModel
        .findByIdAndUpdate(createDto.barnId, {
          $inc: { currentOccupancy: 1 },
        })
        .exec();

      this.logger.log(
        `Entry event: Livestock ${createDto.livestockId} entered barn ${createDto.barnId}`,
      );
    }

    // Handle exit event
    if (createDto.eventType === EventType.EXIT) {
      // Find the last entry log to calculate duration
      const lastEntry = await this.findLastEntryLog(
        createDto.livestockId,
        createDto.barnId,
      );

      if (lastEntry) {
        duration = this.calculateDuration(lastEntry.timestamp, timestamp);
        this.logger.log(
          `Exit event: Livestock ${createDto.livestockId} exited barn ${createDto.barnId} after ${duration} seconds`,
        );
      } else {
        this.logger.warn(
          `Exit event without prior entry: Livestock ${createDto.livestockId} in barn ${createDto.barnId}`,
        );
      }

      // Clear livestock's current barn if it matches
      if (livestock.currentBarnId?.toString() === createDto.barnId) {
        await this.livestockModel
          .findByIdAndUpdate(createDto.livestockId, {
            currentBarnId: null,
          })
          .exec();
      }

      // Decrement barn occupancy
      await this.barnModel
        .findByIdAndUpdate(createDto.barnId, {
          $inc: { currentOccupancy: -1 },
        })
        .exec();
    }

    // Create the log entry
    const log = new this.entryExitLogModel({
      livestockId: new Types.ObjectId(createDto.livestockId),
      barnId: new Types.ObjectId(createDto.barnId),
      eventType: createDto.eventType,
      rfidReaderId: createDto.rfidReaderId,
      timestamp,
      duration,
      notes: createDto.notes,
    });

    const savedLog = await log.save();

    // Broadcast via WebSocket
    this.websocketGateway.emitEntryExitEvent(savedLog);

    return EntryExitLogResponseDto.fromDocument(savedLog);
  }

  /**
   * Find all entry/exit logs with pagination and filtering
   * Requirements: 7.5
   */
  async findAll(
    filterDto: EntryExitDateFilterDto,
  ): Promise<PaginatedResponse<EntryExitLogResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
      livestockId,
      barnId,
      eventType,
      startDate,
      endDate,
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (livestockId) {
      if (!Types.ObjectId.isValid(livestockId)) {
        throw new BadRequestException('Invalid livestock ID format');
      }
      filter.livestockId = new Types.ObjectId(livestockId);
    }

    if (barnId) {
      if (!Types.ObjectId.isValid(barnId)) {
        throw new BadRequestException('Invalid barn ID format');
      }
      filter.barnId = new Types.ObjectId(barnId);
    }

    if (eventType) {
      filter.eventType = eventType;
    }

    // Date range filtering
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        (filter.timestamp as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        (filter.timestamp as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.timestamp = -1;
    }

    const [logs, total] = await Promise.all([
      this.entryExitLogModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.entryExitLogModel.countDocuments(filter).exec(),
    ]);

    const logDtos = logs.map((log) =>
      EntryExitLogResponseDto.fromDocument(log),
    );
    return createPaginatedResponse(logDtos, total, page, limit);
  }

  /**
   * Find logs by livestock ID
   * Requirements: 7.5
   */
  async findByLivestock(
    livestockId: string,
    filterDto: EntryExitDateFilterDto,
  ): Promise<PaginatedResponse<EntryExitLogResponseDto>> {
    return this.findAll({ ...filterDto, livestockId });
  }

  /**
   * Find logs by barn ID
   * Requirements: 7.5
   */
  async findByBarn(
    barnId: string,
    filterDto: EntryExitDateFilterDto,
  ): Promise<PaginatedResponse<EntryExitLogResponseDto>> {
    return this.findAll({ ...filterDto, barnId });
  }

  /**
   * Get recent logs (for dashboard)
   * Requirements: 9.3
   */
  async getRecentLogs(limit: number = 10): Promise<EntryExitLogResponseDto[]> {
    const logs = await this.entryExitLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    return logs.map((log) => EntryExitLogResponseDto.fromDocument(log));
  }

  /**
   * Find a single log by ID
   */
  async findOne(id: string): Promise<EntryExitLogResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Entry/Exit log not found');
    }

    const log = await this.entryExitLogModel.findById(id).exec();
    if (!log) {
      throw new NotFoundException('Entry/Exit log not found');
    }

    return EntryExitLogResponseDto.fromDocument(log);
  }
}
