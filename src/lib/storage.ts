import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Board } from "./types";
import { emptyBoard } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL;
// Accept both the new key name (SUPABASE_SECRET_KEY) and the legacy one
// (SUPABASE_SERVICE_ROLE_KEY). Either works — supabase-js takes the string
// as-is.
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const BOARD_ROW_ID = "current";

const LOCAL_BOARD_FILE = path.join(process.cwd(), ".data", "board.json");

let cachedClient: SupabaseClient | null = null;

function supabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

async function loadFromFile(): Promise<Board> {
  try {
    const raw = await fs.readFile(LOCAL_BOARD_FILE, "utf8");
    return JSON.parse(raw) as Board;
  } catch {
    return emptyBoard();
  }
}

async function saveToFile(board: Board): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_BOARD_FILE), { recursive: true });
  await fs.writeFile(LOCAL_BOARD_FILE, JSON.stringify(board, null, 2), "utf8");
}

export async function loadBoard(): Promise<Board> {
  const sb = supabase();
  if (!sb) return loadFromFile();

  const { data, error } = await sb
    .from("boards")
    .select("data")
    .eq("id", BOARD_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("Supabase load error:", error);
    return loadFromFile();
  }
  if (!data) return emptyBoard();
  return data.data as Board;
}

export async function saveBoard(board: Board): Promise<Board> {
  const stamped: Board = { ...board, updatedAt: new Date().toISOString() };

  const sb = supabase();
  if (!sb) {
    await saveToFile(stamped);
    return stamped;
  }

  const { error } = await sb
    .from("boards")
    .upsert({ id: BOARD_ROW_ID, data: stamped }, { onConflict: "id" });

  if (error) {
    console.error("Supabase save error:", error);
    // Fall back so the admin isn't blocked locally.
    await saveToFile(stamped);
  }
  return stamped;
}

export function storageMode(): "supabase" | "file" {
  return supabase() ? "supabase" : "file";
}
