import { NextResponse } from "next/server";

import { isPasswordConfigured, signIn, signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { password, action } = (await request
    .json()
    .catch(() => ({}))) as {
    password?: string;
    action?: "signin" | "signout";
  };

  if (action === "signout") {
    await signOut();
    return NextResponse.json({ ok: true });
  }

  if (!isPasswordConfigured()) {
    return NextResponse.json({ ok: true, unlocked: true });
  }

  const ok = await signIn(password ?? "");
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
