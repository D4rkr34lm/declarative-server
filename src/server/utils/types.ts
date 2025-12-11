export type WithValue<K extends string, T> = { [P in K]: T };
export type WithoutValue = {};

export type MaybeValue<K extends string, T> = WithValue<K, T> | WithoutValue;
