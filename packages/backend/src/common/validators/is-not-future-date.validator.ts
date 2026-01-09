import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string | Date, args: ValidationArguments): boolean {
    if (!value) return true; // Let @IsNotEmpty handle empty values

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }

    // Check if date is not in the future
    return date <= now;
  }

  defaultMessage(args: ValidationArguments): string {
    const propertyName = args.property;
    return `${propertyName} cannot be in the future`;
  }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureDateConstraint,
    });
  };
}
