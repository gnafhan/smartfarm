import { IsNotFutureDateConstraint } from './is-not-future-date.validator';
import { ValidationArguments } from 'class-validator';

describe('IsNotFutureDateConstraint', () => {
  let constraint: IsNotFutureDateConstraint;

  beforeEach(() => {
    constraint = new IsNotFutureDateConstraint();
  });

  it('should return true for past dates', () => {
    const pastDate = new Date('2020-01-01');
    const args = { property: 'testDate' } as ValidationArguments;
    
    expect(constraint.validate(pastDate, args)).toBe(true);
  });

  it('should return true for current date', () => {
    const now = new Date();
    const args = { property: 'testDate' } as ValidationArguments;
    
    expect(constraint.validate(now, args)).toBe(true);
  });

  it('should return false for future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const args = { property: 'testDate' } as ValidationArguments;
    
    expect(constraint.validate(futureDate, args)).toBe(false);
  });

  it('should return true for past date strings', () => {
    const pastDateString = '2020-01-01T00:00:00Z';
    const args = { property: 'testDate' } as ValidationArguments;
    
    expect(constraint.validate(pastDateString, args)).toBe(true);
  });

  it('should return false for future date strings', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const futureDateString = futureDate.toISOString();
    const args = { property: 'testDate' } as ValidationArguments;
    
    expect(constraint.validate(futureDateString, args)).toBe(false);
  });

  it('should return true for empty values', () => {
    const args = { property: 'testDate' } as ValidationArguments;
    
    expect(constraint.validate('', args)).toBe(true);
    expect(constraint.validate(null as any, args)).toBe(true);
    expect(constraint.validate(undefined as any, args)).toBe(true);
  });

  it('should return false for invalid date strings', () => {
    const args = { property: 'testDate' } as ValidationArguments;
    
    expect(constraint.validate('invalid-date', args)).toBe(false);
  });

  it('should return correct default message', () => {
    const args = { property: 'eventDate' } as ValidationArguments;
    
    expect(constraint.defaultMessage(args)).toBe('eventDate cannot be in the future');
  });
});
