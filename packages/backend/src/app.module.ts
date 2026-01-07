import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { configuration, validationSchema } from './config';
import { RedisProvider, REDIS_CLIENT } from './common/providers/redis.provider';

// Feature modules
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { LivestockModule } from './modules/livestock';
import { BarnsModule } from './modules/barns';
import { MonitoringModule } from './modules/monitoring';
import { EntryExitModule } from './modules/entry-exit';
import { AlertsModule } from './modules/alerts';
import { FarmsModule } from './modules/farms';
import { MqttModule } from './modules/mqtt';
import { WebsocketModule } from './modules/websocket';
import { DashboardModule } from './modules/dashboard';
import { DevicesModule } from './modules/devices/devices.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    LivestockModule,
    BarnsModule,
    MonitoringModule,
    EntryExitModule,
    AlertsModule,
    FarmsModule,
    DevicesModule,
    MqttModule,
    WebsocketModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisProvider],
  exports: [REDIS_CLIENT],
})
export class AppModule {}
