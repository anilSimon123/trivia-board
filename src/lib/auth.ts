import "server-only";

import { cookies } from "next/headers";

const COOKIE_NAME = "trivia_admin";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function expectedPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length === 0) return null;
  return pw;
}

/**
 * Returns true if the request has a valid admin cookie.
 * When ADMIN_PASSWORD is unset, admin is open (useful for local dev / demo).
 */
export async function isAdmin(): Promise<boolean> {
  const pw = expectedPassword();
  if (!pw) return true;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === pw;
}

export async function signIn(password: string): Promise<boolean> {
  const pw = expectedPassword();
  if (!pw) return true;
  if (password !== pw) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, pw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return true;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function isPasswordConfigured(): boolean {
  return expectedPassword() !== null;
}
