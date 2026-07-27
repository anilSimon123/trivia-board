"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type SessionState = {
  /** Question ids that have been answered in the current session. */
  answered: Record<string, boolean>;
  /** Board updatedAt when this session started, so we can auto-reset when admin publishes a new board. */
  boardVersion: string | null;
  markAnswered: (id: string) => void;
  markUnanswered: (id: string) => void;
  resetSession: (boardVersion?: string) => void;
  syncBoardVersion: (boardVersion: string) => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      answered: {},
      boardVersion: null,
      markAnswered: (id) =>
        set((s) => ({ answered: { ...s.answered, [id]: true } })),
      markUnanswered: (id) =>
        set((s) => {
          const next = { ...s.answered };
          delete next[id];
          return { answered: next };
        }),
      resetSession: (boardVersion) =>
        set({ answered: {}, boardVersion: boardVersion ?? null }),
      syncBoardVersion: (boardVersion) =>
        set((s) => {
          if (s.boardVersion === boardVersion) return s;
          // Board has changed since last play — reset the session.
          return { boardVersion, answered: {} };
        }),
    }),
    { name: "trivia-session" },
  ),
);
