import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BarnsService } from './barns.service';
import { BarnsController } from './barns.controller';
import { Barn, BarnSchema } from '../../schemas/barn.schema';
import { Farm, FarmSchema } from '../../schemas/farm.schema';
import { Livestock, LivestockSchema } from '../../schemas/livestock.schema';
import { IsUniqueBarnCodeConstraint } from '../../common/validators/is-unique-barn-code.validator';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Barn.name, schema: BarnSchema },
      { name: Farm.name, schema: FarmSchema },
      { name: Livestock.name, schema: LivestockSchema },
    ]),
  ],
  controllers: [BarnsController],
  providers: [BarnsService, IsUniqueBarnCodeConstraint],
  exports: [BarnsService],
})
export class BarnsModule {}
