import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env";

/**
 * Fotos auf der lokalen Festplatte des Servers, ausgeliefert über /media/<hotelId>/<datei>.
 */
// ASSUMPTION: Lokaler Ordner (UPLOAD_DIR) statt S3 für v1 – keine Zusatzabhängigkeit. Bilder werden nicht verkleinert;
// darum Grösse begrenzt. Für mehrere Server-Instanzen später auf S3-kompatiblen Speicher (CH/EU) umstellen.

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
type Ext = keyof typeof TYPES;

export class UploadError extends Error {}

/** Bildtyp anhand der ersten Bytes (nicht anhand des Dateinamens). SVG/HTML werden nie akzeptiert. */
export function sniffImage(b: Uint8Array): Ext | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FILE = /^[A-Za-z0-9_-]{16,64}\.(jpg|png|webp)$/;

function root() {
  return path.resolve(env().UPLOAD_DIR);
}

export async function saveImage(hotelId: string, bytes: Uint8Array): Promise<string> {
  if (!UUID.test(hotelId)) throw new UploadError("Ungültiges Hotel");
  if (bytes.length === 0) throw new UploadError("Leere Datei");
  if (bytes.length > MAX_UPLOAD_BYTES) throw new UploadError(`Datei zu gross (max. ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`);
  const ext = sniffImage(bytes);
  if (!ext) throw new UploadError("Nur JPG, PNG oder WebP");
  const name = `${crypto.randomBytes(12).toString("base64url")}.${ext}`;
  const dir = path.join(root(), hotelId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes, { flag: "wx" });
  return `/media/${hotelId}/${name}`;
}

/** Pfad zu einer gespeicherten Datei, nur für gültige Namen (kein ../) */
export function mediaPath(hotelId: string, file: string): { file: string; type: string } | null {
  if (!UUID.test(hotelId) || !FILE.test(file)) return null;
  const ext = file.split(".").pop() as Ext;
  return { file: path.join(root(), hotelId, file), type: TYPES[ext] };
}

export async function deleteImage(url: string) {
  const m = /^\/media\/([^/]+)\/([^/]+)$/.exec(url);
  const p = m ? mediaPath(m[1], m[2]) : null;
  if (p) await fs.rm(p.file, { force: true });
}
