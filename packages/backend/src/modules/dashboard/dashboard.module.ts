import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Livestock, LivestockSchema } from '../../schemas/livestock.schema';
import { Barn, BarnSchema } from '../../schemas/barn.schema';
import {
  EntryExitLog,
  EntryExitLogSchema,
} from '../../schemas/entry-exit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Livestock.name, schema: LivestockSchema },
      { name: Barn.name, schema: BarnSchema },
      { name: EntryExitLog.name, schema: EntryExitLogSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
