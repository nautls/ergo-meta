import { RefinementCtx, z } from "zod";
import { base64 } from "@scure/base";
import { SaxesParser } from "saxes";

const INTEGER_PATTERN = /^\d+$/s;
const SVG_BASE64_DATA_URL = "data:image/svg+xml;base64,";
const PNG_BASE64_DATA_URL = "data:image/png;base64,";

export function isInt(value: string): boolean {
  return INTEGER_PATTERN.test(value);
}

export function isPng(bytes: Uint8Array): boolean {
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

export function validateLogo(content: string, ctx: RefinementCtx): void {
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
