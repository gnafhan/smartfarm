import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FarmsService } from './farms.service';
import { FarmsController } from './farms.controller';
import { Farm, FarmSchema } from '../../schemas/farm.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Farm.name, schema: FarmSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FarmsController],
  providers: [FarmsService],
  exports: [FarmsService],
})
export class FarmsModule {}
