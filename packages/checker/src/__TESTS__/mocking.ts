import { TokenMetadata } from "../schema/types";

export function mockTokenMetadata(overrides: Partial<TokenMetadata> = {}): TokenMetadata {
  return {
    tokenId: "3bc1e5eaeb808b5e2a9504d196bc0b3e6858b7611250a87eea7fffcf6f7ab334",
    name: "Mock Token",
    decimals: 10,
    ...overrides
  };
}
