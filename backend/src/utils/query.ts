import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';

export function getMinMaxFilter<T>(min?: T, max?: T) {
  if (min && max) return Between(min, max);
  if (min) return MoreThanOrEqual(min);
  if (max) return LessThanOrEqual(max);
  return null;
}

export function mergeWhere<T>(
  base: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  extra: FindOptionsWhere<T>,
) {
  if (Array.isArray(base) && base?.length > 0)
    return base.map((condition) => ({ ...condition, ...extra }));

  return { ...base, ...extra };
}
