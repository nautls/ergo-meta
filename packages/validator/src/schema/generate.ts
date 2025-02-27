import { tokenMetadataSchema } from ".";
import { zodToJsonSchema } from "zod-to-json-schema";

const jsonSchema = zodToJsonSchema(tokenMetadataSchema);

Bun.write("../../metadata/tokens/token-metadata.schema.json", JSON.stringify(jsonSchema, null, 2));

console.log("Token metadata schema generated successfully");
