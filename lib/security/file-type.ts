/**
 * Detects PNG, JPEG and PDF from the file's first bytes (magic numbers), so the type
 * comes from the content, not the name or the browser-supplied MIME type.
 */
export type AllowedFileType = "image/png" | "image/jpeg" | "application/pdf";

export function detectFileType(bytes: Uint8Array): AllowedFileType | null {
  const starts = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // "%PDF-"
  return null;
}

const extensionFor: Record<AllowedFileType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/pdf": "pdf",
};

/**
 * A safe display/storage name: keeps letters (any script), digits, dot, dash and
 * underscore, trims length, and forces the extension to match the detected type.
 */
export function safeFileName(original: string, type: AllowedFileType): string {
  const base = original
    .replace(/\.[^.]*$/, "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return `${base || "attachment"}.${extensionFor[type]}`;
}
