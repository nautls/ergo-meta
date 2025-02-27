import { schemaValidations, validate } from "./rules.ts";
import { RuleSetValidationResult, ValidationContext } from "../schema/types.ts";
import { cyan, green, red, bold } from "picocolors";
import { Glob } from "bun";

const METADATA_DIR = "../../metadata";

if (Bun.argv.length <= 2) {
  console.log("No metadata changes.");
  process.exit(0);
}

const filenames =
  Bun.argv[2] === "all-tokens"
    ? new Glob(`${METADATA_DIR}/tokens/*[!schema].json`).scanSync()
    : Bun.argv.slice(2);

for (const filename of filenames) {
  const context = {
    entry: JSON.parse(await Bun.file(r(filename)).text()),
    filename
  };

  const result = validate(schemaValidations, context);
  print(result, context);
}

function print(resultSet: RuleSetValidationResult, context: ValidationContext): void {
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

function nullish(value?: string | number, formatter?: FormatterFn) {
  return value ? (formatter ? formatter(value) : value) : null;
}

function indent(content: string) {
  return "  " + content;
}

function line(...content: unknown[]) {
  return content.filter((x) => x !== null && x !== undefined).join(" ");
}

function tag(content: unknown) {
  return `[${content}]`;
}

function r(filename: string) {
  return `${METADATA_DIR}/tokens/${filename}`;
}
