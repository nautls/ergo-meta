import { contractMetadataSchema, tokenMetadataSchema } from ".";
import { zodToJsonSchema } from "zod-to-json-schema";
import { write } from "bun";

const METADATA_DIR = "../../metadata";
const r = (filename: string) => `${METADATA_DIR}/${filename}`;
const serialize = (obj: any) => JSON.stringify(obj, null, 2);

const tokenSchema = zodToJsonSchema(tokenMetadataSchema);
const contractSchema = zodToJsonSchema(contractMetadataSchema);

await write(r("/tokens/token-metadata.schema.json"), serialize(tokenSchema));
console.log("Token metadata schema generated successfully");

await write(r("/contracts/contract-metadata.schema.json"), serialize(contractSchema));
console.log("Contract metadata schema generated successfully");
