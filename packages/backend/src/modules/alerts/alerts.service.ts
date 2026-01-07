import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Alert,
  AlertDocument,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from '../../schemas/alert.schema';
import { AlertFilterDto } from '../../common/dto/alert-filter.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { AlertResponseDto } from './dto/alert-response.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { EmailNotificationService } from './email-notification.service';
import { UsersService } from '../users/users.service';

/**
 * DTO for creating a gas level alert (internal use)
 */
export interface CreateGasAlertDto {
  barnId: string;
  farmId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
}

/**
 * Alerts Service
 *
 * Handles alert creation, management, and state transitions
 * Requirements: 8.1, 8.3, 8.4, 8.5, 8.6
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    private readonly websocketGateway: WebsocketGateway,
    private readonly emailNotificationService: EmailNotificationService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a new alert
   * Requirements: 8.1, 8.2, 8.5
   */
  async create(dto: CreateAlertDto): Promise<AlertDocument> {
    // Validate alert type
    if (!Object.values(AlertType).includes(dto.type)) {
      throw new BadRequestException(
        `Invalid alert type. Must be one of: ${Object.values(AlertType).join(', ')}`,
      );
    }

    const alert = new this.alertModel({
      type: dto.type,
      severity: dto.severity,
      barnId: dto.barnId ? new Types.ObjectId(dto.barnId) : undefined,
      livestockId: dto.livestockId
        ? new Types.ObjectId(dto.livestockId)
        : undefined,
      title: dto.title,
      message: dto.message,
      status: AlertStatus.ACTIVE,
      farmId: new Types.ObjectId(dto.farmId),
    });

    const savedAlert = await alert.save();
    this.logger.log(`Created alert: ${dto.title} (type: ${dto.type})`);

    // Broadcast new alert via WebSocket
    this.websocketGateway.emitNewAlert(savedAlert);

    // Send email notification for critical alerts
    if (dto.severity === AlertSeverity.CRITICAL) {
      await this.sendEmailNotification(savedAlert);
    }

    return savedAlert;
  }

  /**
   * Create a gas level alert (called by monitoring service)
   * Requirements: 6.4, 8.1, 8.2
   */
  async createGasAlert(dto: CreateGasAlertDto): Promise<AlertDocument> {
    const alert = new this.alertModel({
      type: AlertType.GAS_LEVEL,
      severity: dto.severity,
      barnId: new Types.ObjectId(dto.barnId),
      title: dto.title,
      message: dto.message,
      status: AlertStatus.ACTIVE,
      farmId: new Types.ObjectId(dto.farmId),
    });

    const savedAlert = await alert.save();
    this.logger.log(
      `Created gas level alert: ${dto.title} for barn ${dto.barnId}`,
    );

    // Broadcast new alert via WebSocket
    this.websocketGateway.emitNewAlert(savedAlert);

    // Send email notification for critical alerts
    if (dto.severity === AlertSeverity.CRITICAL) {
      await this.sendEmailNotification(savedAlert);
    }

    return savedAlert;
  }

  /**
   * Check if there's an active gas alert for a barn
   * Used to prevent duplicate alerts
   */
  async hasActiveGasAlert(barnId: string): Promise<boolean> {
    const activeAlert = await this.alertModel
      .findOne({
        barnId: new Types.ObjectId(barnId),
        type: AlertType.GAS_LEVEL,
        status: AlertStatus.ACTIVE,
      })
      .exec();

    return !!activeAlert;
  }

  /**
   * Find all alerts with filtering and pagination
   * Requirements: 8.6
   */
  async findAll(
    filterDto: AlertFilterDto,
  ): Promise<PaginatedResponse<AlertResponseDto>> {
    const { page = 1, limit = 10, sortBy, sortOrder, ...filters } = filterDto;

    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.severity) {
      query.severity = filters.severity;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.barnId) {
      query.barnId = new Types.ObjectId(filters.barnId);
    }

    if (filters.farmId) {
      query.farmId = new Types.ObjectId(filters.farmId);
    }

    const skip = (page - 1) * limit;
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [alerts, total] = await Promise.all([
      this.alertModel
        .find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.alertModel.countDocuments(query).exec(),
    ]);

    const data = alerts.map((alert) => AlertResponseDto.fromDocument(alert));

    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Get active alerts
   * Requirements: 8.6
   */
  async findActive(farmId?: string): Promise<AlertResponseDto[]> {
    const query: Record<string, unknown> = {
      status: AlertStatus.ACTIVE,
    };

    if (farmId) {
      query.farmId = new Types.ObjectId(farmId);
    }

    const alerts = await this.alertModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    return alerts.map((alert) => AlertResponseDto.fromDocument(alert));
  }

  /**
   * Find alert by ID
   */
  async findById(id: string): Promise<AlertDocument> {
    const alert = await this.alertModel.findById(id).exec();

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  /**
   * Acknowledge an alert
   * Requirements: 8.3
   * State transition: active -> acknowledged
   */
  async acknowledge(id: string, userId: string): Promise<AlertResponseDto> {
    const alert = await this.findById(id);

    // Validate state transition
    if (alert.status !== AlertStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot acknowledge alert with status '${alert.status}'. Only active alerts can be acknowledged.`,
      );
    }

    const now = new Date();
    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = now;
    alert.acknowledgedBy = new Types.ObjectId(userId);

    const updatedAlert = await alert.save();
    this.logger.log(`Alert ${id} acknowledged by user ${userId}`);

    // Broadcast alert update via WebSocket
    this.websocketGateway.emitAlertUpdated(
      id,
      AlertStatus.ACKNOWLEDGED,
      userId,
      now,
    );

    return AlertResponseDto.fromDocument(updatedAlert);
  }

  /**
   * Resolve an alert
   * Requirements: 8.4
   * State transition: active -> resolved OR acknowledged -> resolved
   */
  async resolve(id: string, userId: string): Promise<AlertResponseDto> {
    const alert = await this.findById(id);

    // Validate state transition
    if (alert.status === AlertStatus.RESOLVED) {
      throw new BadRequestException('Alert is already resolved.');
    }

    const now = new Date();
    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = now;
    alert.resolvedBy = new Types.ObjectId(userId);

    const updatedAlert = await alert.save();
    this.logger.log(`Alert ${id} resolved by user ${userId}`);

    // Broadcast alert update via WebSocket
    this.websocketGateway.emitAlertUpdated(
      id,
      AlertStatus.RESOLVED,
      userId,
      now,
    );

    return AlertResponseDto.fromDocument(updatedAlert);
  }

  /**
   * Get alert statistics for a farm
   */
  async getStats(farmId: string): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
  }> {
    const farmObjectId = new Types.ObjectId(farmId);

    const [statusCounts, severityCounts] = await Promise.all([
      this.alertModel.aggregate([
        { $match: { farmId: farmObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.alertModel.aggregate([
        { $match: { farmId: farmObjectId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((item: { _id: string; count: number }) => {
      statusMap[item._id] = item.count;
    });

    const severityMap: Record<string, number> = {};
    severityCounts.forEach((item: { _id: string; count: number }) => {
      severityMap[item._id] = item.count;
    });

    return {
      total:
        (statusMap.active || 0) +
        (statusMap.acknowledged || 0) +
        (statusMap.resolved || 0),
      active: statusMap.active || 0,
      acknowledged: statusMap.acknowledged || 0,
      resolved: statusMap.resolved || 0,
      bySeverity: severityMap,
    };
  }

  /**
   * Send email notification for critical alerts
   * Requirements: 8.2
   */
  private async sendEmailNotification(alert: AlertDocument): Promise<void> {
    try {
      // Get all users associated with the farm
      const farmId = alert.farmId.toString();
      const emails = await this.usersService.getEmailsByFarm(farmId);

      if (emails.length === 0) {
        this.logger.warn(
          `No users found for farm ${farmId} to send alert notification`,
        );
        return;
      }

      // Send email notification
      const sent = await this.emailNotificationService.sendAlertNotification(
        alert,
        emails,
      );

      if (sent) {
        const alertId = alert._id.toString();
        this.logger.log(
          `Email notification sent for alert ${alertId} to ${emails.length} recipients`,
        );
      }
    } catch (error) {
      // Log error but don't fail the alert creation
      const alertId = alert._id.toString();
      this.logger.error(
        `Failed to send email notification for alert ${alertId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
