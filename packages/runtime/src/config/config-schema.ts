import { z } from "zod";

export const neroConfigSchema = z
  .object({
    version: z.literal(1),
    ui: z
      .object({
        mascot: z.boolean(),
      })
      .strict(),
    privacy: z
      .object({
        maskAddressesInCloudPrompts: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type NeroConfig = z.infer<typeof neroConfigSchema>;

export const DEFAULT_CONFIG: NeroConfig = Object.freeze({
  version: 1,
  ui: { mascot: true },
  privacy: { maskAddressesInCloudPrompts: true },
});
