import YAML from "yaml";
import { schemaValidations, validate } from "./rules.ts";
import { RuleSetValidationResult, ValidationContext } from "../shared/types.ts";
import { cyan, green, red } from "picocolors";

const filenames = Bun.argv.slice(2);
if (!filenames || filenames.length === 0) {
  console.log("No metadata changes.");
  process.exit(0);
}

for (const filename of filenames) {
  const path = Bun.resolveSync(`../../../metadata/${filename}`, import.meta.dir);
  const context = {
    entry: YAML.parse(await Bun.file(path).text()),
    filename
  };
  const resultSet = validate(schemaValidations, context);
  print(resultSet, context);
}

function print(resultSet: RuleSetValidationResult, context: ValidationContext): void {
  console.log(`${resultSet.ruleSet.name} for ${resultSet.ruleSet.type} ${context.entry.tokenId}`);

  group(() => {
    for (const vr of resultSet.results) {
      console.log(`[${vr.success ? green("pass") : red("fail")}] ${vr.name}`);

      if (!vr.success) {
        group(() =>
          vr.errors?.forEach((e) =>
            console.log(`[${red("error")}] ${e.path ? cyan(e.path) + " " : ""}${e.message}`)
          )
        );
      }
    }
  });
}

function group(fn: () => unknown) {
  console.group();
  fn();
  console.groupEnd();
}
