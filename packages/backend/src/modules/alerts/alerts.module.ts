import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { Alert, AlertSchema } from '../../schemas/alert.schema';
import { WebsocketModule } from '../websocket/websocket.module';
import { EmailNotificationService } from './email-notification.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }]),
    WebsocketModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [AlertsController],
  providers: [AlertsService, EmailNotificationService],
  exports: [AlertsService, EmailNotificationService],
})
export class AlertsModule {}
