export const decimalToNumberTransformer = {
  to: (value: number | null): any => value,
  from: (value: string | null): number | null =>
    value === null || value === undefined ? null : parseFloat(value as any),
};


