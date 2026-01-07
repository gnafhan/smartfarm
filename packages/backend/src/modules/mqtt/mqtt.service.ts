import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SensorPayloadDto, ValidatedSensorReading } from './dto';

/**
 * MQTT Service for handling IoT sensor data
 *
 * Requirements 6.1:
 * - Connect to Mosquitto broker
 * - Subscribe to sensor topics
 * - Validate payload structure and sensor ID
 *
 * Property 18: MQTT Payload Validation
 * - Messages missing required fields or with invalid types are rejected
 */
@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectInterval = 5000; // 5 seconds

  // Topic patterns
  private readonly GAS_SENSOR_TOPIC = 'sensors/gas/+';
  private readonly DEVICE_STATUS_TOPIC = 'livestock/devices/+/status';
  private readonly DEVICE_HEARTBEAT_TOPIC = 'livestock/devices/+/heartbeat';
  private readonly DEVICE_ERROR_TOPIC = 'livestock/devices/+/error';

  // Event names for internal communication
  static readonly SENSOR_READING_EVENT = 'mqtt.sensor.reading';

  // Callbacks for sensor readings (used by monitoring module)
  private sensorReadingCallbacks: Array<
    (reading: ValidatedSensorReading) => void | Promise<void>
  > = [];

  // Device handler callbacks
  private deviceStatusCallbacks: Array<
    (deviceId: string, payload: any) => void | Promise<void>
  > = [];
  private deviceHeartbeatCallbacks: Array<
    (deviceId: string, payload: any) => void | Promise<void>
  > = [];
  private deviceErrorCallbacks: Array<
    (deviceId: string, payload: any) => void | Promise<void>
  > = [];

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Connect to the MQTT broker
   */
  connect(): void {
    const brokerUrl = this.configService.get<string>('mqtt.brokerUrl');
    const clientId = this.configService.get<string>('mqtt.clientId');

    if (!brokerUrl) {
      this.logger.warn('MQTT broker URL not configured, skipping connection');
      return;
    }

    this.logger.log(`Connecting to MQTT broker: ${brokerUrl}`);

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: `${clientId}-${Date.now()}`,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: this.reconnectInterval,
        keepalive: 60,
      });

      this.setupEventHandlers();
    } catch (error) {
      this.logger.error(`Failed to connect to MQTT broker: ${error}`);
    }
  }

  /**
   * Set up MQTT client event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logger.log('Connected to MQTT broker');
      this.subscribeToTopics();
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      this.logger.log(
        `Reconnecting to MQTT broker (attempt ${this.reconnectAttempts})`,
      );

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.error(
          `Max reconnection attempts (${this.maxReconnectAttempts}) reached`,
        );
      }
    });

    this.client.on('disconnect', () => {
      this.isConnected = false;
      this.logger.warn('Disconnected from MQTT broker');
    });

    this.client.on('offline', () => {
      this.isConnected = false;
      this.logger.warn('MQTT client is offline');
    });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT error: ${error.message}`);
    });

    this.client.on('message', (topic, payload) => {
      void this.handleMessage(topic, payload);
    });
  }

  /**
   * Subscribe to sensor topics
   */
  private subscribeToTopics(): void {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Cannot subscribe: client not connected');
      return;
    }

    const topics = [
      this.GAS_SENSOR_TOPIC,
      this.DEVICE_STATUS_TOPIC,
      this.DEVICE_HEARTBEAT_TOPIC,
      this.DEVICE_ERROR_TOPIC,
    ];

    topics.forEach((topic) => {
      this.client!.subscribe(topic, { qos: 1 }, (error, granted) => {
        if (error) {
          this.logger.error(`Failed to subscribe to ${topic}: ${error.message}`);
        } else if (granted && granted.length > 0) {
          this.logger.log(`Subscribed to: ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    this.logger.debug(`Received message on topic: ${topic}`);

    try {
      // Route message based on topic pattern
      if (topic.startsWith('sensors/gas/')) {
        await this.handleGasSensorMessage(topic, payload);
      } else if (topic.includes('/status')) {
        await this.handleDeviceStatusMessage(topic, payload);
      } else if (topic.includes('/heartbeat')) {
        await this.handleDeviceHeartbeatMessage(topic, payload);
      } else if (topic.includes('/error')) {
        await this.handleDeviceErrorMessage(topic, payload);
      } else {
        this.logger.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message on ${topic}: ${error.message}`);
    }
  }

  /**
   * Handle device status messages
   */
  private async handleDeviceStatusMessage(
    topic: string,
    payload: Buffer,
  ): Promise<void> {
    try {
      const data = JSON.parse(payload.toString());
      const deviceId = this.extractDeviceIdFromTopic(topic);

      if (!deviceId) {
        this.logger.warn(`Could not extract device ID from topic: ${topic}`);
        return;
      }

      // Notify callbacks
      for (const callback of this.deviceStatusCallbacks) {
        await callback(deviceId, data);
      }
    } catch (error) {
      this.logger.error(`Error handling device status: ${error.message}`);
    }
  }

  /**
   * Handle device heartbeat messages
   */
  private async handleDeviceHeartbeatMessage(
    topic: string,
    payload: Buffer,
  ): Promise<void> {
    try {
      const data = JSON.parse(payload.toString());
      const deviceId = this.extractDeviceIdFromTopic(topic);

      if (!deviceId) {
        this.logger.warn(`Could not extract device ID from topic: ${topic}`);
        return;
      }

      // Notify callbacks
      for (const callback of this.deviceHeartbeatCallbacks) {
        await callback(deviceId, data);
      }
    } catch (error) {
      this.logger.error(`Error handling device heartbeat: ${error.message}`);
    }
  }

  /**
   * Handle device error messages
   */
  private async handleDeviceErrorMessage(
    topic: string,
    payload: Buffer,
  ): Promise<void> {
    try {
      const data = JSON.parse(payload.toString());
      const deviceId = this.extractDeviceIdFromTopic(topic);

      if (!deviceId) {
        this.logger.warn(`Could not extract device ID from topic: ${topic}`);
        return;
      }

      // Notify callbacks
      for (const callback of this.deviceErrorCallbacks) {
        await callback(deviceId, data);
      }
    } catch (error) {
      this.logger.error(`Error handling device error: ${error.message}`);
    }
  }

  /**
   * Extract device ID from MQTT topic
   * Example: livestock/devices/GAS-001/status -> GAS-001
   */
  private extractDeviceIdFromTopic(topic: string): string | null {
    const parts = topic.split('/');
    if (parts.length >= 3) {
      return parts[2]; // Device ID is always at index 2
    }
    return null;
  }

  /**
   * Handle gas sensor messages
   *
   * Property 18: MQTT Payload Validation
   * - Validates required fields: sensorId, barnId, methanePpm, co2Ppm, nh3Ppm
   * - Rejects messages with invalid types or missing fields
   */
  private async handleGasSensorMessage(
    topic: string,
    payload: Buffer,
  ): Promise<void> {
    let parsedPayload: unknown;

    // Parse JSON payload
    try {
      parsedPayload = JSON.parse(payload.toString());
    } catch (error) {
      this.logger.warn(`Invalid JSON payload on topic ${topic}: ${error}`);
      return;
    }

    // Validate payload structure
    const validationResult = await this.validateSensorPayload(parsedPayload);

    if (!validationResult.isValid) {
      this.logger.warn(
        `Invalid sensor payload on topic ${topic}: ${validationResult.errors.join(', ')}`,
      );
      return;
    }

    const validatedReading = validationResult.data!;

    this.logger.debug(
      `Valid sensor reading from ${validatedReading.sensorId} for barn ${validatedReading.barnId}`,
    );

    // Notify registered callbacks (monitoring service)
    await this.notifySensorReadingCallbacks(validatedReading);
  }

  /**
   * Validate sensor payload against DTO
   *
   * Property 18: MQTT Payload Validation
   * - Returns validation errors if payload is invalid
   * - Returns validated data if payload is valid
   */
  async validateSensorPayload(payload: unknown): Promise<{
    isValid: boolean;
    errors: string[];
    data?: ValidatedSensorReading;
  }> {
    // Check if payload is an object
    if (typeof payload !== 'object' || payload === null) {
      return {
        isValid: false,
        errors: ['Payload must be a JSON object'],
      };
    }

    // Transform to DTO instance
    const dto = plainToInstance(SensorPayloadDto, payload);

    // Validate using class-validator
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const errorMessages = errors.flatMap((error) =>
        Object.values(error.constraints || {}),
      );
      return {
        isValid: false,
        errors: errorMessages,
      };
    }

    // Create validated reading with proper timestamp
    const validatedReading: ValidatedSensorReading = {
      sensorId: dto.sensorId,
      barnId: dto.barnId,
      methanePpm: dto.methanePpm,
      co2Ppm: dto.co2Ppm,
      nh3Ppm: dto.nh3Ppm,
      temperature: dto.temperature,
      humidity: dto.humidity,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
    };

    return {
      isValid: true,
      errors: [],
      data: validatedReading,
    };
  }

  /**
   * Register a callback for sensor readings
   * Used by monitoring service to receive validated sensor data
   */
  onSensorReading(
    callback: (reading: ValidatedSensorReading) => void | Promise<void>,
  ): void {
    this.sensorReadingCallbacks.push(callback);
    this.logger.debug('Registered sensor reading callback');
  }

  /**
   * Remove a sensor reading callback
   */
  offSensorReading(
    callback: (reading: ValidatedSensorReading) => void | Promise<void>,
  ): void {
    const index = this.sensorReadingCallbacks.indexOf(callback);
    if (index > -1) {
      this.sensorReadingCallbacks.splice(index, 1);
      this.logger.debug('Removed sensor reading callback');
    }
  }

  /**
   * Notify all registered callbacks of a new sensor reading
   */
  private async notifySensorReadingCallbacks(
    reading: ValidatedSensorReading,
  ): Promise<void> {
    for (const callback of this.sensorReadingCallbacks) {
      try {
        await callback(reading);
      } catch (error) {
        this.logger.error(`Error in sensor reading callback: ${error}`);
      }
    }
  }

  /**
   * Register callbacks for device management
   */
  onDeviceStatus(
    callback: (deviceId: string, payload: any) => void | Promise<void>,
  ): void {
    this.deviceStatusCallbacks.push(callback);
    this.logger.debug('Registered device status callback');
  }

  onDeviceHeartbeat(
    callback: (deviceId: string, payload: any) => void | Promise<void>,
  ): void {
    this.deviceHeartbeatCallbacks.push(callback);
    this.logger.debug('Registered device heartbeat callback');
  }

  onDeviceError(
    callback: (deviceId: string, payload: any) => void | Promise<void>,
  ): void {
    this.deviceErrorCallbacks.push(callback);
    this.logger.debug('Registered device error callback');
  }

  /**
   * Disconnect from the MQTT broker
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(false, {}, () => {
          this.isConnected = false;
          this.logger.log('Disconnected from MQTT broker');
          resolve();
        });
      });
    }
  }

  /**
   * Check if the client is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get the MQTT client instance (for testing purposes)
   */
  getClient(): MqttClient | null {
    return this.client;
  }

  /**
   * Publish a message to a topic (for testing/simulation purposes)
   */
  async publish(topic: string, message: string | Buffer): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('MQTT client not connected');
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
