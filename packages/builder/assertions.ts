import { ZodSchema } from "zod";
import { ValidationResult, ValidationError } from "shared/types.ts";

export function assertEqual(a: unknown, b: unknown) {
  return assert(a === b, `Expected '${a}' to be equal to '${b}'.`);
}

function assert(condition: boolean | boolean[], message?: string): ValidationResult {
  return condition
    ? { success: true }
    : { success: false, errors: message ? [{ message }] : undefined };
}

export function assertAll(...results: ValidationResult[]): ValidationResult {
  return {
    success: results.every((r) => r.success),
    errors: results.flatMap((r) => r.errors).filter((error): error is ValidationError => !!error)
  };
}

export function assertSchema(entry: unknown, schema: ZodSchema): ValidationResult {
  const parsingResult = schema.safeParse(entry);
  if (!parsingResult.success) {
    return {
      success: false,
      errors: parsingResult.error.issues.map((i) => ({
        message: i.message,
        path: i.path.length > 0 ? i.path.join(".") : undefined
      }))
    };
  }

  return { success: true };
}
