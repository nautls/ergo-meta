import { tokenMetadataSchema } from "shared/schema.ts";
import {
  RuleSetValidationResult,
  ValidationContext,
  ValidationResult,
  ValidationRule,
  ValidationRuleSet
} from "shared/types.ts";
import { assertEqual, assertSchema } from "./assertions.ts";

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
  name: "Well-formedness rules",
  rules: [
    {
      name: "Schema validation.",
      test: ({ entry }) => assertSchema(entry, tokenMetadataSchema)
    },
    {
      name: "Filename matching.",
      test: ({ entry, filename }) => assertEqual(`${entry.tokenId}.json`, filename)
    }
  ]
};
