import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthEventsService } from './health-events.service';
import {
  HealthEventsController,
  HealthEventsGlobalController,
} from './health-events.controller';
import {
  HealthEvent,
  HealthEventSchema,
} from '../../schemas/health-event.schema';
import { Livestock, LivestockSchema } from '../../schemas/livestock.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthEvent.name, schema: HealthEventSchema },
      { name: Livestock.name, schema: LivestockSchema },
    ]),
  ],
  controllers: [HealthEventsController, HealthEventsGlobalController],
  providers: [HealthEventsService],
  exports: [HealthEventsService],
})
export class HealthEventsModule {}
