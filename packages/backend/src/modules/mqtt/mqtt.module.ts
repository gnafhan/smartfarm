import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MqttService } from './mqtt.service';
import { MqttDeviceHandlerService } from './mqtt-device-handler.service';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [ConfigModule, DevicesModule],
  providers: [MqttService, MqttDeviceHandlerService],
  exports: [MqttService, MqttDeviceHandlerService],
})
export class MqttModule {}
