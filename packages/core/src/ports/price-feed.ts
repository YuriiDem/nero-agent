import type { SourceFailure } from "../shared/coverage.js";
import type { SourceId } from "../shared/fact.js";
import type { Result } from "../shared/result.js";
import type { AssetRef } from "./balance-source.js";
import type { CollectOptions } from "./evidence-source.js";

export type UsdPrice = {
  readonly asset: AssetRef;
  readonly usd: number;
  readonly observedAt: string;
};

export type PriceFeed = {
  readonly id: SourceId;
  usdPrices(
    assets: readonly AssetRef[],
    options: CollectOptions,
  ): Promise<Result<readonly UsdPrice[], SourceFailure>>;
};
