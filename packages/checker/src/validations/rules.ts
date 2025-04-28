import { tokenMetadataSchema } from "../schema/index.ts";
import {
  RuleSetValidationResult,
  ValidationContext,
  ValidationResult,
  ValidationRule,
  ValidationRuleSet
} from "../schema/types.ts";
import { assertEndsWith, assertSchema } from "./assertions.ts";

export function validate(
  ruleSet: ValidationRuleSet,
  context: ValidationContext
): RuleSetValidationResult {
  return {
    ruleSet,
    results: ruleSet.rules.map((rule) => execute(rule, context))
  };
}

function execute(rule: ValidationRule, context: ValidationContext): ValidationResult {
  const result = rule.test(context);
  result.name = rule.name;

  return result;
}

export const schemaValidations: ValidationRuleSet = {
  type: "token",
  name: "well-formedness",
  rules: [
    {
      name: "Filename matching",
      test: ({ entry, filename }) => assertEndsWith(filename, `${entry.tokenId}.json`)
    },
    {
      name: "Schema validation",
      test: ({ entry }) => assertSchema(entry, tokenMetadataSchema)
    }
  ]
};
