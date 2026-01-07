import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DevicesService } from './devices.service';
import { DeviceType, DeviceStatus } from '../../schemas/device.schema';
import { DeviceEventType } from '../../schemas/device-log.schema';

@Controller('api/devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Get all devices
   */
  @Get()
  async findAll(
    @Query('type') type?: DeviceType,
    @Query('status') status?: DeviceStatus,
    @Query('barnId') barnId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.devicesService.findAll({
      type,
      status,
      barnId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  /**
   * Get device by ID
   */
  @Get(':deviceId')
  async findOne(@Param('deviceId') deviceId: string) {
    return this.devicesService.findOne(deviceId);
  }

  /**
   * Get device statistics
   */
  @Get(':deviceId/statistics')
  async getStatistics(@Param('deviceId') deviceId: string) {
    return this.devicesService.getDeviceStatistics(deviceId);
  }

  /**
   * Get device logs
   */
  @Get(':deviceId/logs')
  async getLogs(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: string,
    @Query('eventType') eventType?: DeviceEventType,
  ) {
    return this.devicesService.getDeviceLogs(
      deviceId,
      limit ? parseInt(limit) : 100,
      eventType,
    );
  }

  /**
   * Register a new device
   */
  @Post('register')
  async register(
    @Body()
    body: {
      deviceId: string;
      type: DeviceType;
      name?: string;
      barnId?: string;
      metadata?: Record<string, any>;
    },
  ) {
    const device = await this.devicesService.registerDevice(
      body.deviceId,
      body.type,
      body.metadata,
    );

    if (body.name || body.barnId) {
      return this.devicesService.updateDevice(device.deviceId, {
        name: body.name,
        barnId: body.barnId as any,
      });
    }

    return device;
  }

  /**
   * Update device
   */
  @Put(':deviceId')
  async update(
    @Param('deviceId') deviceId: string,
    @Body()
    updates: {
      name?: string;
      description?: string;
      barnId?: string;
      location?: string;
      isActive?: boolean;
      metadata?: Record<string, any>;
    },
  ) {
    return this.devicesService.updateDevice(deviceId, updates as any);
  }

  /**
   * Delete device
   */
  @Delete(':deviceId')
  async delete(@Param('deviceId') deviceId: string) {
    await this.devicesService.deleteDevice(deviceId);
    return { message: 'Device deleted successfully' };
  }

  /**
   * Check for stale devices
   */
  @Post('check-stale')
  async checkStale(@Query('timeoutMinutes') timeoutMinutes?: string) {
    return this.devicesService.checkStaleDevices(
      timeoutMinutes ? parseInt(timeoutMinutes) : 5,
    );
  }
}
