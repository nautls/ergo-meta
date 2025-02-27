import { schemaValidations, validate } from "./rules.ts";
import { RuleSetValidationResult, ValidationContext } from "../schema/types.ts";
import { cyan, green, red, bold } from "picocolors";

const METADATA_DIR = "../../../../metadata";

const filenames = Bun.argv.slice(2);
if (!filenames || filenames.length === 0) {
  console.log("No metadata changes.");
  process.exit(0);
}

for (const filename of filenames) {
  const path = r(filename);
  const context = {
    entry: JSON.parse(await Bun.file(path).text()),
    filename
  };
  const resultSet = validate(schemaValidations, context);
  print(resultSet, context);
}

function print(resultSet: RuleSetValidationResult, context: ValidationContext): void {
  console.log(
    `Running ${resultSet.ruleSet.name} checks for ${resultSet.ruleSet.type} metadata file ${context.filename}`
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
  return Bun.resolveSync(`${METADATA_DIR}/tokens/${filename}`, import.meta.dir);
}
