import { RefinementCtx, z } from "zod";
import { base64 } from "@scure/base";
import { SaxesParser } from "saxes";

const _hexString = z.string().refine(isHex);
const _bigIntString = z.string().refine(isInt);
const _256Hash = z.string().length(64).refine(isHex);
const _logo = z.string().max(87_400).superRefine(assertLogo); // 87_400 is equivalent in char length to ~64kb of base64 encoded data.

export const metadataSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500),
  url: z.string().max(250).optional(),
  logo: z.union([_logo, z.object({ light: _logo, dark: _logo }).strict()])
});

export const tokenMetadataSchema = metadataSchema
  .extend({
    tokenId: _256Hash,
    decimals: z.number().int().min(0).max(19).optional(),
    ticker: z.string().min(2).max(9).optional()
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
      .optional()
  })
  .strict();

const HEX_PATTERN = /^[0-9A-Fa-f]+$/s;
function isHex(value: string): boolean {
  return HEX_PATTERN.test(value);
}

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

function assertLogo(val: string, ctx: RefinementCtx): void {
  const onError = ({ message }: Error) => ctx.addIssue({ code: "custom", message });

  const bytes = safeRun(() => base64.decode(val), onError);
  if (!bytes) {
    return;
  }

  if (!isPng(bytes)) {
    validateSvg(bytes, onError);
  }
}

function validateSvg(bytes: Uint8Array, onError: (error: Error) => void) {
  const decoded = safeRun(() => new TextDecoder().decode(bytes), onError);
  if (!decoded) {
    return;
  }

  const parser = new SaxesParser();
  parser.on("error", onError);
  parser.on("opentag", (tag) => {
    if (tag.name === "script") {
      parser.fail("The <script> tag is not allowed in .svg files.");
    }
  });

  parser.write(decoded);
}

function safeRun<T>(fn: () => T, onError?: (error: Error) => void): T | undefined {
  try {
    return fn();
  } catch (e) {
    if (onError) onError(e);
  }
}
