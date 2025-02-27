import { RefinementCtx, z } from "zod";
import { base64 } from "@scure/base";
import { SaxesParser } from "saxes";
import { isHex } from "@fleet-sdk/common";

const _hexString = z.string().refine(isHex);
const _bigIntString = z.string().refine(isInt);
const _256Hash = z.string().length(64).refine(isHex);
const _name = z.string().min(1).max(50);

export const metadataSchema = z.object({
  $schema: z.string().optional(),
  name: _name,
  description: z.string().max(500).optional(),
  url: z.string().max(250).optional()
});

export const tokenMetadataSchema = metadataSchema
  .extend({
    $schema: z.literal("./token-metadata.schema.json").optional(),
    tokenId: _256Hash,
    decimals: z.number().int().min(0).max(19),
    ticker: z.string().min(2).max(9).optional(),
    logo: z.string().max(87_400).superRefine(assertLogo).optional() // 87_400 is equivalent in char length to ~64kb of base64 encoded data.
  })
  .strict();

const boxSchema = z
  .object({
    boxId: _256Hash,
    transactionId: _256Hash,
    index: z.number().int().min(0),
    ergoTree: _hexString,
    creationHeight: z.number().int().min(0),
    value: _bigIntString,
    assets: z.array(z.object({ tokenId: _256Hash, amount: _bigIntString }).strict()),
    additionalRegisters: z
      .object({
        R4: _hexString.optional(),
        R5: _hexString.optional(),
        R6: _hexString.optional(),
        R7: _hexString.optional(),
        R8: _hexString.optional(),
        R9: _hexString.optional()
      })
      .strict()
  })
  .strict();

export const tokenSignatureSchema = z.object({
  mintingBox: boxSchema,
  metadataBox: boxSchema,
  signature: z.string()
});

export const contractMetadataSchema = metadataSchema
  .extend({
    $schema: z.literal("./contract-metadata.schema.json").optional(),
    template: z.string().max(8_192).refine(isHex), // 4kb hex string
    source: z
      .object({
        script: z.string(),
        buildParams: z
          .object({ map: z.record(z.string(), _hexString) })
          .strict()
          .optional()
      })
      .strict()
      .optional(),
    variables: z.record(z.number(), _name).optional(),
    registers: z
      .object({
        R4: _name.optional(),
        R5: _name.optional(),
        R6: _name.optional(),
        R7: _name.optional(),
        R8: _name.optional(),
        R9: _name.optional()
      })
      .strict()
      .optional()
  })
  .strict();

const INTEGER_PATTERN = /^\d+$/s;
function isInt(value: string): boolean {
  return INTEGER_PATTERN.test(value);
}

function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

const SVG_BASE64_DATA_URL = "data:image/svg+xml;base64,";
const PNG_BASE64_DATA_URL = "data:image/png;base64,";

function assertLogo(content: string, ctx: RefinementCtx): void {
  const logError = ({ message }: Error) => ctx.addIssue({ code: "custom", message });

  const type = content.startsWith(PNG_BASE64_DATA_URL)
    ? PNG_BASE64_DATA_URL
    : content.startsWith(SVG_BASE64_DATA_URL)
      ? SVG_BASE64_DATA_URL
      : undefined;

  if (!type) {
    logError(
      Error(
        `The logo must be prefixed with either '${PNG_BASE64_DATA_URL}' or '${SVG_BASE64_DATA_URL}' according to the image type.`
      )
    );
    return;
  }

  const bytes = safeRun(() => base64.decode(content.replace(type, "")), logError);
  if (!bytes) return;

  if (type === "data:image/png;base64,") {
    if (!isPng(bytes)) {
      logError(
        Error(`The logo Data URL Type is '${type}' but the content is not a valid PNG image.`)
      );
    }
  } else {
    if (isPng(bytes)) {
      logError(
        Error(`The logo Data URL Type is '${type}' but the content is not a valid SVG image.`)
      );
      return;
    }

    validateSvg(bytes, logError);
  }
}

function validateSvg(bytes: Uint8Array, onError: (error: Error) => void) {
  const decoded = safeRun(() => new TextDecoder().decode(bytes), onError);
  if (!decoded) return;

  const parser = new SaxesParser();
  parser.on("error", onError);
  parser.on("opentag", (tag) => {
    if (tag.name === "script") {
      parser.fail("The '<script>' tag is not allowed in .svg files.");
    }
  });

  parser.write(decoded);
}

function safeRun<T>(fn: () => T, onError?: (error: Error) => void): T | undefined {
  try {
    return fn();
  } catch (e) {
    if (onError) onError(e as Error);
  }
}
