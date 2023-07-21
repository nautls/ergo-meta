import { RefinementCtx, z } from "zod";
import { base64 } from "@scure/base";
import { SaxesParser } from "saxes";

const encodedLogoSchema = z
  .string()
  .max(87_400) // equivalent in char length to ~64kb of base64 encoded data.
  .superRefine(assertLogoContent);

export const metadataSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500),
  url: z.string().max(250).optional(),
  logo: z.union([
    encodedLogoSchema,
    z.object({ light: encodedLogoSchema, dark: encodedLogoSchema }).strict()
  ])
});

export const tokenMetadataSchema = metadataSchema
  .extend({
    tokenId: z
      .string()
      .length(64) // 32bytes hex string
      .refine(isHex, "Invalid hex string."),
    decimals: z.number().min(0).max(19).optional(),
    ticker: z.string().min(2).max(9).optional()
  })
  .strict();

const boxSchema = z.object({ boxId: z.string() }); // todo: complete schema

export const tokenSignatureSchema = z.object({
  mintingBox: boxSchema,
  metadataBox: boxSchema,
  signature: z.string()
});

export const contractMetadataSchema = metadataSchema
  .extend({
    template: z.string().max(8_192), // 4kb hex string
    source: z
      .object({
        script: z.string(),
        buildParams: z.object({ map: z.record(z.string(), z.string()) }).optional()
      })
      .strict()
      .optional()
  })
  .strict();

const HEX_PATTERN = /^[0-9A-Fa-f]+$/s;
function isHex(value: string): boolean {
  return HEX_PATTERN.test(value);
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

function assertLogoContent(val: string, ctx: RefinementCtx): void {
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
