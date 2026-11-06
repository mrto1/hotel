import { NextResponse } from "next/server";
import { consumeLoginToken, createSessionValue, SESSION_COOKIE } from "@/src/auth/session";
import { env } from "@/src/env";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const base = env().APP_BASE_URL;
  const userId = token ? await consumeLoginToken(token) : null;
  if (!userId) return NextResponse.redirect(`${base}/admin/login?error=link`);
  const res = NextResponse.redirect(`${base}/admin`);
  res.cookies.set(SESSION_COOKIE, createSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: base.startsWith("https://"),
    path: "/",
    maxAge: 30 * 86400,
  });
  return res;
}
