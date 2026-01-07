import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Device,
  DeviceDocument,
  DeviceStatus,
  DeviceType,
  DisconnectReason,
} from '../../schemas/device.schema';
import {
  DeviceLog,
  DeviceLogDocument,
  DeviceEventType,
} from '../../schemas/device-log.schema';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(DeviceLog.name) private deviceLogModel: Model<DeviceLogDocument>,
  ) {}

  /**
   * Register or update a device
   */
  async registerDevice(
    deviceId: string,
    type: DeviceType,
    metadata?: Record<string, any>,
  ): Promise<Device> {
    const existingDevice = await this.deviceModel.findOne({ deviceId });

    if (existingDevice) {
      // Update existing device
      existingDevice.metadata = { ...existingDevice.metadata, ...metadata };
      existingDevice.isActive = true;
      await existingDevice.save();
      return existingDevice;
    }

    // Create new device
    const device = new this.deviceModel({
      deviceId,
      type,
      status: DeviceStatus.OFFLINE,
      metadata,
      isActive: true,
    });

    await device.save();
    this.logger.log(`Device registered: ${deviceId} (${type})`);

    return device;
  }

  /**
   * Handle device connection
   */
  async handleDeviceConnect(
    deviceId: string,
    metadata?: Record<string, any>,
  ): Promise<Device> {
    const device = await this.deviceModel.findOne({ deviceId });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const previousStatus = device.status;
    device.status = DeviceStatus.ONLINE;
    device.lastConnectedAt = new Date();
    device.lastHeartbeatAt = new Date();
    device.totalConnections += 1;

    if (metadata) {
      device.metadata = { ...device.metadata, ...metadata };
    }

    await device.save();

    // Log the connection event
    await this.logDeviceEvent({
      deviceId,
      eventType: DeviceEventType.CONNECTED,
      status: DeviceStatus.ONLINE,
      previousStatus,
      message: 'Device connected successfully',
      metadata,
    });

    this.logger.log(`Device connected: ${deviceId}`);

    return device;
  }

  /**
   * Handle device disconnection
   */
  async handleDeviceDisconnect(
    deviceId: string,
    reason: DisconnectReason = DisconnectReason.UNKNOWN,
    message?: string,
    metadata?: Record<string, any>,
  ): Promise<Device | null> {
    const device = await this.deviceModel.findOne({ deviceId });

    if (!device) {
      this.logger.warn(`Attempted to disconnect unknown device: ${deviceId}`);
      return null;
    }

    const previousStatus = device.status;
    device.status = DeviceStatus.OFFLINE;
    device.lastDisconnectedAt = new Date();
    device.lastDisconnectReason = reason;
    device.lastDisconnectMessage = message;
    device.totalDisconnections += 1;

    if (reason === DisconnectReason.ERROR) {
      device.errorCount += 1;
      device.lastErrorAt = new Date();
      device.lastErrorMessage = message;
    }

    await device.save();

    // Log the disconnection event
    await this.logDeviceEvent({
      deviceId,
      eventType: DeviceEventType.DISCONNECTED,
      status: DeviceStatus.OFFLINE,
      previousStatus,
      disconnectReason: reason,
      message: message || `Device disconnected: ${reason}`,
      metadata,
    });

    this.logger.log(`Device disconnected: ${deviceId} (reason: ${reason})`);

    return device;
  }

  /**
   * Handle device error
   */
  async handleDeviceError(
    deviceId: string,
    errorMessage: string,
    errorCode?: string,
    metadata?: Record<string, any>,
  ): Promise<Device | null> {
    const device = await this.deviceModel.findOne({ deviceId });

    if (!device) {
      this.logger.warn(`Error reported for unknown device: ${deviceId}`);
      return null;
    }

    const previousStatus = device.status;
    device.status = DeviceStatus.ERROR;
    device.errorCount += 1;
    device.lastErrorAt = new Date();
    device.lastErrorMessage = errorMessage;

    await device.save();

    // Log the error event
    await this.logDeviceEvent({
      deviceId,
      eventType: DeviceEventType.ERROR,
      status: DeviceStatus.ERROR,
      previousStatus,
      message: errorMessage,
      errorCode,
      metadata,
    });

    this.logger.error(`Device error: ${deviceId} - ${errorMessage}`);

    return device;
  }

  /**
   * Update device heartbeat
   */
  async updateHeartbeat(deviceId: string): Promise<void> {
    await this.deviceModel.updateOne(
      { deviceId },
      { lastHeartbeatAt: new Date() },
    );
  }

  /**
   * Get all devices with optional filters
   */
  async findAll(filters?: {
    type?: DeviceType;
    status?: DeviceStatus;
    barnId?: string;
    isActive?: boolean;
  }): Promise<Device[]> {
    const query: any = {};

    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.barnId) query.barnId = filters.barnId;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;

    return this.deviceModel.find(query).populate('barnId').sort({ createdAt: -1 });
  }

  /**
   * Get device by ID
   */
  async findOne(deviceId: string): Promise<Device> {
    const device = await this.deviceModel.findOne({ deviceId }).populate('barnId');

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    return device;
  }

  /**
   * Get device logs
   */
  async getDeviceLogs(
    deviceId: string,
    limit: number = 100,
    eventType?: DeviceEventType,
  ): Promise<DeviceLog[]> {
    const query: any = { deviceId };
    if (eventType) query.eventType = eventType;

    return this.deviceLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Get device statistics
   */
  async getDeviceStatistics(deviceId: string): Promise<any> {
    const device = await this.findOne(deviceId);

    const logs = await this.deviceLogModel.find({ deviceId });

    const connectionEvents = logs.filter(
      (log) => log.eventType === DeviceEventType.CONNECTED,
    );
    const disconnectionEvents = logs.filter(
      (log) => log.eventType === DeviceEventType.DISCONNECTED,
    );
    const errorEvents = logs.filter(
      (log) => log.eventType === DeviceEventType.ERROR,
    );

    // Calculate uptime percentage (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter((log) => log.timestamp >= oneDayAgo);

    let uptimeMinutes = 0;
    let currentStatus = DeviceStatus.OFFLINE;
    let lastTimestamp = oneDayAgo;

    for (const log of recentLogs.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    )) {
      if (currentStatus === DeviceStatus.ONLINE) {
        uptimeMinutes +=
          (log.timestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60);
      }

      if (log.eventType === DeviceEventType.CONNECTED) {
        currentStatus = DeviceStatus.ONLINE;
      } else if (log.eventType === DeviceEventType.DISCONNECTED) {
        currentStatus = DeviceStatus.OFFLINE;
      }

      lastTimestamp = log.timestamp;
    }

    // Add time from last event to now if currently online
    if (device.status === DeviceStatus.ONLINE) {
      uptimeMinutes += (Date.now() - lastTimestamp.getTime()) / (1000 * 60);
    }

    const uptimePercentage = (uptimeMinutes / (24 * 60)) * 100;

    return {
      device,
      statistics: {
        totalConnections: device.totalConnections,
        totalDisconnections: device.totalDisconnections,
        errorCount: device.errorCount,
        uptimePercentage: Math.min(100, Math.round(uptimePercentage * 100) / 100),
        lastConnectedAt: device.lastConnectedAt,
        lastDisconnectedAt: device.lastDisconnectedAt,
        lastHeartbeatAt: device.lastHeartbeatAt,
        lastErrorAt: device.lastErrorAt,
      },
      recentEvents: {
        connections: connectionEvents.length,
        disconnections: disconnectionEvents.length,
        errors: errorEvents.length,
      },
    };
  }

  /**
   * Check for stale devices (no heartbeat in X minutes)
   */
  async checkStaleDevices(timeoutMinutes: number = 5): Promise<Device[]> {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const staleDevices = await this.deviceModel.find({
      status: DeviceStatus.ONLINE,
      lastHeartbeatAt: { $lt: timeoutDate },
    });

    // Mark stale devices as offline
    for (const device of staleDevices) {
      await this.handleDeviceDisconnect(
        device.deviceId,
        DisconnectReason.TIMEOUT,
        `No heartbeat received for ${timeoutMinutes} minutes`,
      );
    }

    return staleDevices;
  }

  /**
   * Log device event
   */
  private async logDeviceEvent(data: {
    deviceId: string;
    eventType: DeviceEventType;
    status?: DeviceStatus;
    previousStatus?: DeviceStatus;
    disconnectReason?: DisconnectReason;
    message?: string;
    errorCode?: string;
    metadata?: Record<string, any>;
  }): Promise<DeviceLog> {
    const log = new this.deviceLogModel({
      ...data,
      timestamp: new Date(),
    });

    await log.save();
    return log;
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    const device = await this.deviceModel.findOne({ deviceId });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    await this.deviceModel.deleteOne({ deviceId });
    await this.deviceLogModel.deleteMany({ deviceId });

    this.logger.log(`Device deleted: ${deviceId}`);
  }

  /**
   * Update device
   */
  async updateDevice(
    deviceId: string,
    updates: Partial<Device>,
  ): Promise<Device> {
    const device = await this.deviceModel.findOne({ deviceId });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    Object.assign(device, updates);
    await device.save();

    return device;
  }
}
