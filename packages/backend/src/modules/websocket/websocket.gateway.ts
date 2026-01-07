import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  GasSensorReading,
  AlertLevel,
} from '../../schemas/gas-sensor-reading.schema';
import { EntryExitLog, EventType } from '../../schemas/entry-exit-log.schema';
import { Alert, AlertStatus } from '../../schemas/alert.schema';

// DTOs for WebSocket events
export interface SensorReadingEvent {
  sensorId: string;
  barnId: string;
  reading: {
    methanePpm: number;
    co2Ppm: number;
    nh3Ppm: number;
    temperature: number;
    humidity: number;
    timestamp: Date;
  };
  alertLevel: AlertLevel;
}

export interface EntryExitEvent {
  livestockId: string;
  barnId: string;
  eventType: EventType;
  timestamp: Date;
  duration?: number;
}

export interface AlertNewEvent {
  _id: string;
  type: string;
  severity: string;
  barnId?: string;
  livestockId?: string;
  title: string;
  message: string;
  status: string;
  farmId: string;
  createdAt: Date;
}

export interface AlertUpdatedEvent {
  alertId: string;
  status: AlertStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface SubscribeBarnPayload {
  barnId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly wsServer!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Getter for the server to be used by other services
  getServer(): Server {
    return this.wsServer;
  }

  // ==========================================
  // Client to Server: Room Subscriptions
  // ==========================================

  /**
   * Subscribe client to a specific barn room for real-time updates
   * Client will receive sensor readings, entry/exit events, and alerts for this barn
   */
  @SubscribeMessage('subscribe:barn')
  handleSubscribeBarn(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubscribeBarnPayload,
  ): { success: boolean; message: string } {
    const { barnId } = payload;

    if (!barnId) {
      this.logger.warn(
        `Client ${client.id} attempted to subscribe without barnId`,
      );
      return { success: false, message: 'barnId is required' };
    }

    const roomName = this.getBarnRoomName(barnId);
    void client.join(roomName);
    this.logger.log(`Client ${client.id} subscribed to barn: ${barnId}`);

    return { success: true, message: `Subscribed to barn ${barnId}` };
  }

  /**
   * Unsubscribe client from a specific barn room
   */
  @SubscribeMessage('unsubscribe:barn')
  handleUnsubscribeBarn(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubscribeBarnPayload,
  ): { success: boolean; message: string } {
    const { barnId } = payload;

    if (!barnId) {
      this.logger.warn(
        `Client ${client.id} attempted to unsubscribe without barnId`,
      );
      return { success: false, message: 'barnId is required' };
    }

    const roomName = this.getBarnRoomName(barnId);
    void client.leave(roomName);
    this.logger.log(`Client ${client.id} unsubscribed from barn: ${barnId}`);

    return { success: true, message: `Unsubscribed from barn ${barnId}` };
  }

  // ==========================================
  // Server to Client: Event Emitters
  // ==========================================

  /**
   * Emit new sensor reading to all clients subscribed to the barn
   * Called by Monitoring service when new MQTT data is received
   */
  emitSensorReading(reading: GasSensorReading): void {
    const barnId = reading.barnId.toString();
    const roomName = this.getBarnRoomName(barnId);

    const event: SensorReadingEvent = {
      sensorId: reading.sensorId,
      barnId,
      reading: {
        methanePpm: reading.methanePpm,
        co2Ppm: reading.co2Ppm,
        nh3Ppm: reading.nh3Ppm,
        temperature: reading.temperature,
        humidity: reading.humidity,
        timestamp: reading.timestamp,
      },
      alertLevel: reading.alertLevel,
    };

    // Emit to barn-specific room
    this.wsServer.to(roomName).emit('sensor:reading', event);

    // Also emit to global listeners (for dashboard overview)
    this.wsServer.emit('sensor:reading:global', event);

    this.logger.debug(
      `Emitted sensor reading for barn ${barnId}, sensor ${reading.sensorId}`,
    );
  }

  /**
   * Emit entry/exit event to all clients subscribed to the barn
   * Called by Entry/Exit service when RFID event is processed
   */
  emitEntryExitEvent(log: EntryExitLog): void {
    const barnId = log.barnId.toString();
    const livestockId = log.livestockId.toString();
    const roomName = this.getBarnRoomName(barnId);

    const event: EntryExitEvent = {
      livestockId,
      barnId,
      eventType: log.eventType,
      timestamp: log.timestamp,
      duration: log.duration,
    };

    // Emit to barn-specific room
    this.wsServer.to(roomName).emit('entry-exit:event', event);

    // Also emit to global listeners (for dashboard overview)
    this.wsServer.emit('entry-exit:event:global', event);

    this.logger.debug(
      `Emitted ${log.eventType} event for livestock ${livestockId} in barn ${barnId}`,
    );
  }

  /**
   * Emit new alert to all clients
   * Called by Alerts service when a new alert is created
   */
  emitNewAlert(alert: Alert & { _id: { toString(): string } }): void {
    const event: AlertNewEvent = {
      _id: alert._id.toString(),
      type: alert.type,
      severity: alert.severity,
      barnId: alert.barnId?.toString(),
      livestockId: alert.livestockId?.toString(),
      title: alert.title,
      message: alert.message,
      status: alert.status,
      farmId: alert.farmId.toString(),
      createdAt: alert.createdAt,
    };

    // Emit to all connected clients
    this.wsServer.emit('alert:new', event);

    // If alert is associated with a barn, also emit to barn room
    if (alert.barnId) {
      const roomName = this.getBarnRoomName(alert.barnId.toString());
      this.wsServer.to(roomName).emit('alert:new:barn', event);
    }

    this.logger.debug(`Emitted new alert: ${alert.title}`);
  }

  /**
   * Emit alert status update to all clients
   * Called by Alerts service when alert is acknowledged or resolved
   */
  emitAlertUpdated(
    alertId: string,
    status: AlertStatus,
    updatedBy?: string,
    timestamp?: Date,
  ): void {
    const event: AlertUpdatedEvent = {
      alertId,
      status,
    };

    if (status === AlertStatus.ACKNOWLEDGED) {
      event.acknowledgedAt = timestamp;
      event.acknowledgedBy = updatedBy;
    } else if (status === AlertStatus.RESOLVED) {
      event.resolvedAt = timestamp;
      event.resolvedBy = updatedBy;
    }

    // Emit to all connected clients
    this.wsServer.emit('alert:updated', event);

    this.logger.debug(`Emitted alert update: ${alertId} -> ${status}`);
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Generate consistent room name for a barn
   */
  private getBarnRoomName(barnId: string): string {
    return `barn:${barnId}`;
  }

  /**
   * Get count of clients in a specific barn room
   */
  async getClientsInBarnRoom(barnId: string): Promise<number> {
    const roomName = this.getBarnRoomName(barnId);
    const sockets = await this.wsServer.in(roomName).fetchSockets();
    return sockets.length;
  }

  /**
   * Get total connected clients count
   */
  async getTotalConnectedClients(): Promise<number> {
    const sockets = await this.wsServer.fetchSockets();
    return sockets.length;
  }
}
