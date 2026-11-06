import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  PAYMENT_PROVIDER: z.enum(["fake", "stripe"]).default("fake"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET_CONNECT: z.string().optional(),
  CHANNEX_BASE_URL: z.string().default("https://staging.channex.io/api/v1"),
  CHANNEX_API_KEY: z.string().optional(),
  CHANNEX_WEBHOOK_SECRET: z.string().optional(),
  POSTMARK_SERVER_TOKEN: z.string().optional(),
  EMAIL_FROM: z.string().default("buchung@example.ch"),
  PLATFORM_ALERT_EMAIL: z.string().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Liest Umgebungsvariablen (SPEC 11). Leere Strings gelten als nicht gesetzt. */
export function env(): Env {
  if (cached && process.env.NODE_ENV !== "test") return cached;
  const raw = Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ""),
  );
  cached = schema.parse(raw);
  return cached;
}

export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const v = env()[key];
  if (v === undefined || v === null || v === "") {
    throw new Error(`Umgebungsvariable ${String(key)} fehlt`);
  }
  return v as NonNullable<Env[K]>;
}
