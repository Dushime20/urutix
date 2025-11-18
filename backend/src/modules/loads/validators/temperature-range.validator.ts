import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'TemperatureRangeValidator', async: false })
export class TemperatureRangeValidator implements ValidatorConstraintInterface {
  validate(temperatureRange: any, args: ValidationArguments): boolean {
    if (!temperatureRange) return true;

    const { min, max } = temperatureRange;

    if (min === undefined || max === undefined) return true;

    return min < max;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Temperature minimum must be less than temperature maximum';
  }
}
