export function hasValue<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function hasNoValue<T>(
  value: T | undefined | null,
): value is undefined | null {
  return value === undefined || value === null;
}
