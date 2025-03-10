import { bold, green, red, cyan } from "picocolors";
import { RuleSetValidationResult, ValidationContext } from "../schema/types";

export function print(resultSet: RuleSetValidationResult, context: ValidationContext): void {
  console.log(
    `Running ${resultSet.ruleSet.name} checks for ${resultSet.ruleSet.type} metadata '${context.entry.name}' '${context.entry.tokenId ?? context.filename}'`
  );

  for (const vr of resultSet.results) {
    console.log(indent(line(tag(bold(vr.success ? green("pass") : red("fail"))), vr.name)));

    if (!vr.success && vr.errors?.length) {
      for (const e of vr.errors) {
        console.log(indent(indent(line(tag(red("error")), nullish(e.path, cyan), e.message))));
      }
    }
  }
}

type FormatterFn = (content?: string | number) => string;

export function nullish(value?: string | number, formatter?: FormatterFn) {
  return value ? (formatter ? formatter(value) : value) : null;
}

export function indent(content: string) {
  return "  " + content;
}

export function line(...content: unknown[]) {
  return content.filter((x) => x !== null && x !== undefined).join(" ");
}

export function tag(content: unknown) {
  return `[${content}]`;
}
