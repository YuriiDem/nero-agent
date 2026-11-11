declare const addressBrand: unique symbol;

export type Address = string & { readonly [addressBrand]: true };

export const unsafeAddress = (value: string): Address => value as Address;
