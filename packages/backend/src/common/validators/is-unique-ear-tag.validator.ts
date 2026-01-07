import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Livestock, LivestockDocument } from '../../schemas';

@ValidatorConstraint({ name: 'isUniqueEarTag', async: true })
@Injectable()
export class IsUniqueEarTagConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(Livestock.name)
    private readonly livestockModel: Model<LivestockDocument>,
  ) {}

  async validate(
    earTagId: string,
    args: ValidationArguments,
  ): Promise<boolean> {
    if (!earTagId) return true;

    const object = args.object as Record<string, unknown>;
    const excludeId = (object._id || object.id) as string | undefined;

    const query: { earTagId: string; _id?: { $ne: string } } = { earTagId };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await this.livestockModel.findOne(query).exec();
    return !existing;
  }

  defaultMessage(): string {
    return 'Ear tag ID already exists';
  }
}

export function IsUniqueEarTag(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueEarTagConstraint,
    });
  };
}
