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
import { Barn, BarnDocument } from '../../schemas';

@ValidatorConstraint({ name: 'isUniqueBarnCode', async: true })
@Injectable()
export class IsUniqueBarnCodeConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(Barn.name)
    private readonly barnModel: Model<BarnDocument>,
  ) {}

  async validate(code: string, args: ValidationArguments): Promise<boolean> {
    if (!code) return true;

    const object = args.object as Record<string, unknown>;
    const excludeId = (object._id || object.id) as string | undefined;

    const query: { code: string; _id?: { $ne: string } } = { code };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await this.barnModel.findOne(query).exec();
    return !existing;
  }

  defaultMessage(): string {
    return 'Barn code already exists';
  }
}

export function IsUniqueBarnCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueBarnCodeConstraint,
    });
  };
}
