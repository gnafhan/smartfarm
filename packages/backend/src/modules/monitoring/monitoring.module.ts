import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { MonitoringHandlerService } from './monitoring-handler.service';
import {
  GasSensorReading,
  GasSensorReadingSchema,
} from '../../schemas/gas-sensor-reading.schema';
import { MqttModule } from '../mqtt/mqtt.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AlertsModule } from '../alerts/alerts.module';
import { BarnsModule } from '../barns/barns.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GasSensorReading.name, schema: GasSensorReadingSchema },
    ]),
    MqttModule,
    WebsocketModule,
    forwardRef(() => AlertsModule),
    forwardRef(() => BarnsModule),
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService, MonitoringHandlerService],
  exports: [MonitoringService, MonitoringHandlerService],
})
export class MonitoringModule {}
