import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
import { loadBoard, saveBoard } from "@/lib/storage";
import type { Board } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const board = await loadBoard();
  return NextResponse.json(board, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Board;
  try {
    body = (await request.json()) as Board;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body ||
    !Array.isArray(body.categories) ||
    !Array.isArray(body.difficulties) ||
    !Array.isArray(body.questions)
  ) {
    return NextResponse.json({ error: "Invalid board shape" }, { status: 400 });
  }

  const saved = await saveBoard(body);
  return NextResponse.json(saved);
}
