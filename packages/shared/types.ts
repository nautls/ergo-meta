import { z } from "zod";
import { contractMetadataSchema, tokenMetadataSchema } from "shared/schema.ts";

export type TokenMetadata = z.infer<typeof tokenMetadataSchema>;
export type ContractMetadata = z.infer<typeof contractMetadataSchema>;

export type ValidationResult = {
  success: boolean;
  name?: string;
  errors?: ValidationError[];
};

export type ValidationError = {
  message: string;
  path?: string;
};

export type ValidationContext = {
  entry: TokenMetadata;
  filename: string;
};

export type ValidationTestFunction = (context: ValidationContext) => ValidationResult;

export type ValidationRule = {
  name: string;
  test: ValidationTestFunction;
};

export type ValidationRuleSet = {
  name: string;
  type: "token" | "dapp" | "contract";
  rules: ValidationRule[];
};

export type RuleSetValidationResult = {
  ruleSet: ValidationRuleSet;
  results: ValidationResult[];
};
