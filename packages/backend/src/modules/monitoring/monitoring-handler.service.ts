import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MonitoringService } from './monitoring.service';
import { MqttService } from '../mqtt/mqtt.service';
import { MqttDeviceHandlerService } from '../mqtt/mqtt-device-handler.service';
import { ValidatedSensorReading } from '../mqtt/dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { AlertsService } from '../alerts/alerts.service';
import { BarnsService } from '../barns/barns.service';
import { calculateAlertLevel } from '../../common/utils/gas-thresholds';
import { AlertLevel } from '../../schemas/gas-sensor-reading.schema';
import { AlertSeverity } from '../../schemas/alert.schema';

/**
 * Monitoring Handler Service
 *
 * Integrates MQTT sensor data with monitoring, alerts, and WebSocket
 *
 * Requirements:
 * - 6.2: Store readings with barn reference and timestamp
 * - 6.3: Calculate alert level based on thresholds
 * - 6.4: Create alert and send notification on danger threshold
 * - 6.5: Broadcast new readings via WebSocket
 */
@Injectable()
export class MonitoringHandlerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitoringHandlerService.name);
  private sensorReadingCallback:
    | ((reading: ValidatedSensorReading) => Promise<void>)
    | null = null;

  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly mqttService: MqttService,
    private readonly mqttDeviceHandler: MqttDeviceHandlerService,
    private readonly websocketGateway: WebsocketGateway,
    private readonly alertsService: AlertsService,
    private readonly barnsService: BarnsService,
  ) {}

  onModuleInit(): void {
    this.registerMqttHandler();
    this.registerDeviceHandlers();
  }

  onModuleDestroy(): void {
    this.unregisterMqttHandler();
  }

  /**
   * Register device management handlers
   */
  private registerDeviceHandlers(): void {
    // Handle device status
    this.mqttService.onDeviceStatus(async (deviceId, payload) => {
      await this.mqttDeviceHandler.handleDeviceStatus(deviceId, payload);
    });

    // Handle device heartbeat
    this.mqttService.onDeviceHeartbeat(async (deviceId, payload) => {
      await this.mqttDeviceHandler.handleDeviceHeartbeat(deviceId, payload);
    });

    // Handle device error
    this.mqttService.onDeviceError(async (deviceId, payload) => {
      await this.mqttDeviceHandler.handleDeviceError(deviceId, payload);
    });

    this.logger.log('Device management handlers registered');
  }

  /**
   * Register callback with MQTT service to receive sensor readings
   */
  private registerMqttHandler(): void {
    this.sensorReadingCallback = (
      reading: ValidatedSensorReading,
    ): Promise<void> => this.handleSensorReading(reading);
    this.mqttService.onSensorReading(this.sensorReadingCallback);
    this.logger.log('Registered MQTT sensor reading handler');
  }

  /**
   * Unregister callback from MQTT service
   */
  private unregisterMqttHandler(): void {
    if (this.sensorReadingCallback) {
      this.mqttService.offSensorReading(this.sensorReadingCallback);
      this.sensorReadingCallback = null;
      this.logger.log('Unregistered MQTT sensor reading handler');
    }
  }

  /**
   * Handle incoming sensor reading from MQTT
   *
   * Requirements:
   * - 6.2: Store reading with barn reference and timestamp
   * - 6.3: Calculate alert level
   * - 6.4: Create alert on danger threshold
   * - 6.5: Broadcast via WebSocket
   */
  async handleSensorReading(reading: ValidatedSensorReading): Promise<void> {
    try {
      // Validate barn exists - try by ID first, then by code
      let barn = await this.barnsService.findById(reading.barnId);
      if (!barn) {
        // Try finding by code (for simulator compatibility)
        barn = await this.barnsService.findByCode(reading.barnId);
      }

      if (!barn) {
        this.logger.warn(
          `Received reading for unknown barn: ${reading.barnId}`,
        );
        return;
      }

      // Use the actual barn ID for storage
      const barnId = barn._id.toString();

      // Calculate alert level (Requirements: 6.3)
      const alertLevel = calculateAlertLevel({
        methanePpm: reading.methanePpm,
        co2Ppm: reading.co2Ppm,
        nh3Ppm: reading.nh3Ppm,
      });

      // Store reading in database (Requirements: 6.2)
      const savedReading = await this.monitoringService.storeSensorReading({
        sensorId: reading.sensorId,
        barnId: new Types.ObjectId(barnId),
        methanePpm: reading.methanePpm,
        co2Ppm: reading.co2Ppm,
        nh3Ppm: reading.nh3Ppm,
        temperature: reading.temperature,
        humidity: reading.humidity,
        alertLevel,
        timestamp: reading.timestamp,
      });

      // Broadcast via WebSocket (Requirements: 6.5)
      this.websocketGateway.emitSensorReading(savedReading);

      // Create alert on danger threshold (Requirements: 6.4)
      if (alertLevel === AlertLevel.DANGER) {
        await this.handleDangerAlert(reading, barn.farmId.toString(), barnId);
      }

      this.logger.debug(
        `Processed sensor reading from ${reading.sensorId}: alertLevel=${alertLevel}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing sensor reading: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Handle danger level alert creation
   * Requirements: 6.4, 8.1, 8.2
   */
  private async handleDangerAlert(
    reading: ValidatedSensorReading,
    farmId: string,
    barnId: string,
  ): Promise<void> {
    // Check if there's already an active alert for this barn
    const hasActiveAlert = await this.alertsService.hasActiveGasAlert(barnId);

    if (hasActiveAlert) {
      this.logger.debug(`Active gas alert already exists for barn ${barnId}`);
      return;
    }

    // Determine which gases are at danger level
    const dangerGases: string[] = [];
    if (reading.methanePpm > 1000) {
      dangerGases.push(`Methane: ${reading.methanePpm} ppm`);
    }
    if (reading.co2Ppm > 3000) {
      dangerGases.push(`CO2: ${reading.co2Ppm} ppm`);
    }
    if (reading.nh3Ppm > 25) {
      dangerGases.push(`NH3: ${reading.nh3Ppm} ppm`);
    }

    const title = 'Critical Gas Levels Detected';
    const message = `Dangerous gas levels detected in barn. ${dangerGases.join(', ')}. Immediate action required.`;

    // Create alert (Requirements: 8.1)
    const alert = await this.alertsService.createGasAlert({
      barnId,
      farmId,
      title,
      message,
      severity: AlertSeverity.CRITICAL,
    });

    // Broadcast new alert via WebSocket
    this.websocketGateway.emitNewAlert({
      _id: { toString: () => alert._id.toString() },
      type: alert.type,
      severity: alert.severity,
      barnId: alert.barnId,
      title: alert.title,
      message: alert.message,
      status: alert.status,
      farmId: alert.farmId,
      createdAt: alert.createdAt,
    });

    this.logger.warn(
      `Created critical gas alert for barn ${barnId}: ${dangerGases.join(', ')}`,
    );

    // TODO: Send email notification (Requirements: 8.2) - will be implemented in task 15
  }
}
