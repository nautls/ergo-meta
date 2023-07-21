import { resolve } from "std/path/mod.ts";
import { schemaValidations, validate } from "./rules.ts";
import { RuleSetValidationResult, ValidationContext } from "shared/types.ts";
import { cyan, green, red } from "std/fmt/colors.ts";

(async () => {
  const filenames = ["03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04.json"]; // Deno.args;
  if (filenames.length === 0) {
    console.log("No metadata changes.");
  }

  for (const filename of filenames) {
    const context = {
      entry: JSON.parse(await Deno.readTextFile(resolve("../metadata/tokens", filename))),
      filename
    };
    const resultSet = validate(schemaValidations, context);
    print(resultSet, context);
  }
})();

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
