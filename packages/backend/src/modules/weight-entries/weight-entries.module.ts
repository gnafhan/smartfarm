import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WeightEntriesService } from './weight-entries.service';
import { WeightEntriesController } from './weight-entries.controller';
import {
  WeightEntry,
  WeightEntrySchema,
} from '../../schemas/weight-entry.schema';
import { Livestock, LivestockSchema } from '../../schemas/livestock.schema';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeightEntry.name, schema: WeightEntrySchema },
      { name: Livestock.name, schema: LivestockSchema },
    ]),
    MonitoringModule,
  ],
  controllers: [WeightEntriesController],
  providers: [WeightEntriesService],
  exports: [WeightEntriesService],
})
export class WeightEntriesModule {}
