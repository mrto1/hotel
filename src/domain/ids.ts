import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** SPEC 4: 'XXX-XXXX' aus eindeutig lesbaren Zeichen */
export function newReference(): string {
  const bytes = crypto.randomBytes(7);
  let s = "";
  for (let i = 0; i < 7; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

/** SPEC 4: 32 zufällige Bytes, base64url */
export function newPublicToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}
