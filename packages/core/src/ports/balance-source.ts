import type { Address } from "../shared/address.js";
import type { Chain } from "../shared/chain.js";
import type { SourceFailure } from "../shared/coverage.js";
import type { SourceId } from "../shared/fact.js";
import type { Result } from "../shared/result.js";
import type { CollectOptions } from "./evidence-source.js";

export type AssetRef = {
  readonly symbol: string;
  readonly chain?: Chain;
  readonly contract?: Address;
};

export type Holding = {
  readonly source: SourceId;
  readonly asset: AssetRef;
  readonly amount: string;
};

export type BalanceTarget =
  | { readonly kind: "wallet"; readonly chain: Chain; readonly address: Address }
  | { readonly kind: "exchange"; readonly exchange: "binance" };

export type BalanceSource = {
  readonly id: SourceId;
  supports(target: BalanceTarget): boolean;
  fetchHoldings(
    target: BalanceTarget,
    options: CollectOptions,
  ): Promise<Result<readonly Holding[], SourceFailure>>;
};
