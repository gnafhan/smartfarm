import { Injectable, Logger } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { DeviceType, DisconnectReason } from '../../schemas/device.schema';

/**
 * MQTT Device Handler Service
 * 
 * Handles device management messages from MQTT:
 * - Auto-register devices on first message
 * - Track device status (online/offline)
 * - Handle heartbeats
 * - Log errors
 */
@Injectable()
export class MqttDeviceHandlerService {
  private readonly logger = new Logger(MqttDeviceHandlerService.name);

  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Handle device status message
   * Auto-registers device if not exists
   */
  async handleDeviceStatus(deviceId: string, payload: any): Promise<void> {
    try {
      const { status, reason, message, metadata } = payload;

      // Determine device type from metadata or deviceId
      const deviceType = this.getDeviceType(deviceId, metadata);

      // Auto-register device if not exists
      await this.ensureDeviceExists(deviceId, deviceType, metadata);

      // Handle status change
      if (status === 'online' || status === 'connected') {
        await this.devicesService.handleDeviceConnect(deviceId, metadata);
        this.logger.log(`Device ${deviceId} connected`);
      } else if (status === 'offline' || status === 'disconnected') {
        const disconnectReason = this.mapDisconnectReason(reason);
        await this.devicesService.handleDeviceDisconnect(
          deviceId,
          disconnectReason,
          message,
          metadata,
        );
        this.logger.log(`Device ${deviceId} disconnected (${disconnectReason})`);
      }
    } catch (error) {
      this.logger.error(`Error handling device status for ${deviceId}: ${error.message}`);
    }
  }

  /**
   * Handle device heartbeat
   * Auto-registers device if not exists
   */
  async handleDeviceHeartbeat(deviceId: string, payload: any): Promise<void> {
    try {
      // Determine device type
      const deviceType = this.getDeviceType(deviceId, payload?.metadata);

      // Auto-register device if not exists
      await this.ensureDeviceExists(deviceId, deviceType);

      // Update heartbeat
      await this.devicesService.updateHeartbeat(deviceId);
    } catch (error) {
      this.logger.error(`Error handling heartbeat for ${deviceId}: ${error.message}`);
    }
  }

  /**
   * Handle device error
   * Auto-registers device if not exists
   */
  async handleDeviceError(deviceId: string, payload: any): Promise<void> {
    try {
      const { error, errorCode, message, metadata } = payload;

      // Determine device type
      const deviceType = this.getDeviceType(deviceId, metadata);

      // Auto-register device if not exists
      await this.ensureDeviceExists(deviceId, deviceType, metadata);

      // Log error
      await this.devicesService.handleDeviceError(
        deviceId,
        message || error,
        errorCode,
        metadata,
      );

      this.logger.warn(`Device ${deviceId} error: ${message || error}`);
    } catch (error) {
      this.logger.error(`Error handling device error for ${deviceId}: ${error.message}`);
    }
  }

  /**
   * Handle sensor reading (gas sensor)
   * Auto-registers device if not exists
   */
  async handleSensorReading(sensorId: string, barnId: string, metadata?: any): Promise<void> {
    try {
      // Auto-register gas sensor
      await this.ensureDeviceExists(sensorId, DeviceType.GAS_SENSOR, {
        ...metadata,
        barnId,
      });

      // Update heartbeat
      await this.devicesService.updateHeartbeat(sensorId);
    } catch (error) {
      this.logger.error(`Error handling sensor reading for ${sensorId}: ${error.message}`);
    }
  }

  /**
   * Handle RFID reading
   * Auto-registers device if not exists
   */
  async handleRfidReading(readerId: string, barnId: string, metadata?: any): Promise<void> {
    try {
      // Auto-register RFID reader
      await this.ensureDeviceExists(readerId, DeviceType.RFID_READER, {
        ...metadata,
        barnId,
      });

      // Update heartbeat
      await this.devicesService.updateHeartbeat(readerId);
    } catch (error) {
      this.logger.error(`Error handling RFID reading for ${readerId}: ${error.message}`);
    }
  }

  /**
   * Ensure device exists, register if not
   */
  private async ensureDeviceExists(
    deviceId: string,
    type: DeviceType,
    metadata?: any,
  ): Promise<void> {
    try {
      // Try to find device
      await this.devicesService.findOne(deviceId);
    } catch (error) {
      // Device not found, register it
      this.logger.log(`Auto-registering new device: ${deviceId} (${type})`);
      await this.devicesService.registerDevice(deviceId, type, metadata);
    }
  }

  /**
   * Determine device type from deviceId or metadata
   */
  private getDeviceType(deviceId: string, metadata?: any): DeviceType {
    // Check metadata first
    if (metadata?.type === 'gas_sensor') {
      return DeviceType.GAS_SENSOR;
    }
    if (metadata?.type === 'rfid_reader') {
      return DeviceType.RFID_READER;
    }

    // Fallback to deviceId pattern
    const idUpper = deviceId.toUpperCase();
    if (idUpper.includes('GAS') || idUpper.includes('SENSOR')) {
      return DeviceType.GAS_SENSOR;
    }
    if (idUpper.includes('RFID') || idUpper.includes('READER')) {
      return DeviceType.RFID_READER;
    }

    // Default to gas sensor
    return DeviceType.GAS_SENSOR;
  }

  /**
   * Map disconnect reason string to enum
   */
  private mapDisconnectReason(reason?: string): DisconnectReason {
    if (!reason) return DisconnectReason.UNKNOWN;

    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('intentional') || reasonLower.includes('graceful')) {
      return DisconnectReason.INTENTIONAL;
    }
    if (reasonLower.includes('timeout')) {
      return DisconnectReason.TIMEOUT;
    }
    if (reasonLower.includes('error')) {
      return DisconnectReason.ERROR;
    }
    if (reasonLower.includes('network')) {
      return DisconnectReason.NETWORK;
    }
    return DisconnectReason.UNKNOWN;
  }
}
