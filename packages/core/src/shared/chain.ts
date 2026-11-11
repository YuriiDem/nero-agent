export const CHAINS = ["ethereum", "base", "arbitrum", "bsc", "solana"] as const;
export type Chain = (typeof CHAINS)[number];

export const CHAIN_FAMILIES = ["evm", "solana"] as const;
export type ChainFamily = (typeof CHAIN_FAMILIES)[number];

export const chainFamily = (chain: Chain): ChainFamily => (chain === "solana" ? "solana" : "evm");

export const isChain = (value: string): value is Chain => (CHAINS as readonly string[]).includes(value);
