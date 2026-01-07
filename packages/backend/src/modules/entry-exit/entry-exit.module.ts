import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EntryExitService } from './entry-exit.service';
import { EntryExitController } from './entry-exit.controller';
import {
  EntryExitLog,
  EntryExitLogSchema,
} from '../../schemas/entry-exit-log.schema';
import { Livestock, LivestockSchema } from '../../schemas/livestock.schema';
import { Barn, BarnSchema } from '../../schemas/barn.schema';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntryExitLog.name, schema: EntryExitLogSchema },
      { name: Livestock.name, schema: LivestockSchema },
      { name: Barn.name, schema: BarnSchema },
    ]),
    WebsocketModule,
  ],
  controllers: [EntryExitController],
  providers: [EntryExitService],
  exports: [EntryExitService],
})
export class EntryExitModule {}
