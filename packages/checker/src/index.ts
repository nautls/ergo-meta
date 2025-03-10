import { schemaValidations, validate } from "./validations/rules.ts";
import { Glob, argv, file } from "bun";
import { print } from "./utils/console.ts";

const METADATA_DIR = "../../metadata";
const r = (filename: string) => `${METADATA_DIR}/tokens/${filename}`;

if (argv.length <= 2) {
  console.log("No metadata changes.");
  process.exit(0);
}

const filenames = argv[2].endsWith("all-tokens")
  ? new Glob(`${METADATA_DIR}/tokens/*[!schema].json`).scanSync()
  : argv.slice(2);

for (const filename of filenames) {
  const context = {
    entry: JSON.parse(await file(r(filename)).text()),
    filename
  };

  print(validate(schemaValidations, context), context);
}
