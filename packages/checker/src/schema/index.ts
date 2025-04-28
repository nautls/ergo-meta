import { isHex } from "@fleet-sdk/common";
import { z } from "zod";
import { validateLogo, isInt } from "./validations";

const _hexString = z.string().refine(isHex, "String must be a valid hex string");
const _bigIntString = z.string().refine(isInt);
const _256Hash = z.string().length(64).refine(isHex, "String must be a valid 256-bit hex hash.");
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
    logo: z.string().max(87_400).superRefine(validateLogo).optional() // 87_400 is equivalent in char length to ~64kb of base64 encoded data.
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
