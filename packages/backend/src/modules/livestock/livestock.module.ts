import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LivestockService } from './livestock.service';
import { LivestockController } from './livestock.controller';
import { Livestock, LivestockSchema } from '../../schemas/livestock.schema';
import { Farm, FarmSchema } from '../../schemas/farm.schema';
import { Barn, BarnSchema } from '../../schemas/barn.schema';
import {
  EntryExitLog,
  EntryExitLogSchema,
} from '../../schemas/entry-exit-log.schema';
import { IsUniqueEarTagConstraint } from '../../common/validators/is-unique-ear-tag.validator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Livestock.name, schema: LivestockSchema },
      { name: Farm.name, schema: FarmSchema },
      { name: Barn.name, schema: BarnSchema },
      { name: EntryExitLog.name, schema: EntryExitLogSchema },
    ]),
  ],
  controllers: [LivestockController],
  providers: [LivestockService, IsUniqueEarTagConstraint],
  exports: [LivestockService],
})
export class LivestockModule {}
