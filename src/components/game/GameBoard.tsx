"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import type { Board, Question } from "@/lib/types";
import { useSession } from "@/lib/session-store";
import { cn } from "@/lib/utils";

import { PostIt } from "./PostIt";
import { QuestionModal } from "./QuestionModal";

type GameBoardProps = {
  initialBoard: Board;
};

export function GameBoard({ initialBoard }: GameBoardProps) {
  const [board, setBoard] = useState(initialBoard);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);

  const answered = useSession((s) => s.answered);
  const markAnswered = useSession((s) => s.markAnswered);
  const resetSession = useSession((s) => s.resetSession);
  const syncBoardVersion = useSession((s) => s.syncBoardVersion);

  useEffect(() => {
    syncBoardVersion(board.updatedAt);
  }, [board.updatedAt, syncBoardVersion]);

  // Poll for board updates every 30s so a fresh admin save appears without a full refresh.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/board", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as Board;
        if (!cancelled && next.updatedAt !== board.updatedAt) setBoard(next);
      } catch {
        // Ignore polling failures.
      }
    };
    const handle = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [board.updatedAt]);

  // Group questions per (difficulty, category) cell in stable order.
  const cellQuestions = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of board.questions) {
      const key = `${q.difficultyId}:${q.categoryId}`;
      const arr = map.get(key);
      if (arr) arr.push(q);
      else map.set(key, [q]);
    }
    return map;
  }, [board.questions]);

  const active = activeId
    ? board.questions.find((q) => q.id === activeId) ?? null
    : null;
  const activeCategory = active
    ? board.categories.find((c) => c.id === active.categoryId)
    : null;
  const activeDifficulty = active
    ? board.difficulties.find((d) => d.id === active.difficultyId)
    : null;

  const totalQuestions = board.questions.length;
  const answeredCount = board.questions.filter((q) => answered[q.id]).length;

  const isEmpty = board.categories.length === 0 || board.difficulties.length === 0;

  // Presentation / fullscreen mode.
  const enterPresentation = useCallback(async () => {
    setPresenting(true);
    try {
      if (
        typeof document !== "undefined" &&
        !document.fullscreenElement &&
        document.documentElement.requestFullscreen
      ) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen was refused (permission / iframe); the header hide still works.
    }
  }, []);

  const exitPresentation = useCallback(async () => {
    setPresenting(false);
    try {
      if (typeof document !== "undefined" && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync state when the user leaves fullscreen via Esc or the browser chrome.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div className="board-surface flex flex-col min-h-dvh w-full">
      <AnimatePresence>
        {!presenting && (
          <motion.header
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4 gap-3"
          >
            <h1 className="font-hand text-3xl sm:text-5xl font-bold text-black/80">
              {board.title || "Trivia Board"}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <ProgressPill answered={answeredCount} total={totalQuestions} />
              <button
                onClick={enterPresentation}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-black/70 hover:bg-white transition shadow-sm"
                title="Presentation mode (hides the header and enters fullscreen)"
              >
                <Maximize2 className="size-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
              <button
                onClick={() => resetSession(board.updatedAt)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-black/70 hover:bg-white transition shadow-sm"
                title="Reset session (mark all questions as unanswered)"
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-black/80 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium hover:bg-black transition shadow-sm"
              >
                <Settings className="size-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main
        className={cn(
          "flex-1 flex items-center justify-center px-3 sm:px-8",
          presenting ? "py-6 sm:py-10" : "pb-6 sm:pb-10",
        )}
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div
            className={cn(
              "grid w-full max-w-[1600px] mx-auto",
              "gap-3 sm:gap-5 lg:gap-6",
            )}
            style={{
              gridTemplateColumns: `minmax(4rem, auto) repeat(${board.categories.length}, minmax(0, 1fr))`,
              gridTemplateRows: `auto repeat(${board.difficulties.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {board.categories.map((cat) => (
              <div key={cat.id} className="flex items-end justify-center pb-2">
                <span className="font-hand text-2xl sm:text-3xl lg:text-4xl font-bold text-black/70 text-center leading-tight px-2">
                  {cat.name}
                </span>
              </div>
            ))}

            {board.difficulties.map((diff) => (
              <RowFragment
                key={diff.id}
                diffLabel={diff.label}
                diffPoints={diff.points}
              >
                {board.categories.map((cat) => {
                  const questions = cellQuestions.get(`${diff.id}:${cat.id}`) ?? [];
                  const remaining = questions.filter((q) => !answered[q.id]);
                  const top = remaining[0];
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-center"
                    >
                      <AnimatePresence mode="wait">
                        {top ? (
                          <PostIt
                            key={top.id}
                            id={top.id}
                            color={cat.color}
                            points={diff.points}
                            remaining={remaining.length}
                            onClick={() => setActiveId(top.id)}
                            className="max-w-[min(18vw,180px)]"
                          />
                        ) : (
                          <motion.div
                            key={`empty-${cat.id}-${diff.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-[min(18vw,180px)] aspect-square rounded-[3px] border-2 border-dashed border-black/10"
                            aria-hidden
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </RowFragment>
            ))}
          </div>
        )}
      </main>

      {/* Floating exit chip while in presentation mode. Visible on hover / tap so it stays out of the way during play. */}
      <AnimatePresence>
        {presenting && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            onClick={exitPresentation}
            className={cn(
              "fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5",
              "rounded-full bg-black/70 hover:bg-black text-white shadow-lg",
              "px-4 py-2 text-sm font-medium backdrop-blur",
              "opacity-30 hover:opacity-100 transition",
            )}
          >
            <Minimize2 className="size-4" />
            Exit fullscreen
          </motion.button>
        )}
      </AnimatePresence>

      <QuestionModal
        open={!!active}
        questionId={active?.id ?? null}
        color={activeCategory?.color ?? "yellow"}
        category={activeCategory?.name ?? ""}
        difficulty={activeDifficulty?.label ?? ""}
        points={activeDifficulty?.points ?? 0}
        text={active?.text ?? ""}
        answer={active?.answer}
        options={active?.options}
        onMarkAnswered={() => {
          if (active) {
            markAnswered(active.id);
            setActiveId(null);
          }
        }}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
}

function RowFragment({
  diffLabel,
  diffPoints,
  children,
}: {
  diffLabel: string;
  diffPoints: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-2 sm:pr-3">
        <div className="flex flex-col items-end leading-tight">
          <span className="font-hand text-xl sm:text-2xl font-semibold text-black/70">
            {diffLabel}
          </span>
          <span className="text-[0.65rem] sm:text-xs uppercase tracking-widest text-black/40">
            {diffPoints} pts
          </span>
        </div>
      </div>
      {children}
    </>
  );
}

function ProgressPill({
  answered,
  total,
}: {
  answered: number;
  total: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm">
      <Sparkles className="size-4 text-amber-500" />
      <span className="text-sm sm:text-base font-semibold text-black/80 tabular-nums">
        {answered}/{total}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-xl text-center rounded-xl bg-white/70 backdrop-blur p-8 sm:p-12 shadow-sm">
      <h2 className="font-hand text-4xl sm:text-5xl font-bold text-black/80 mb-3">
        The board is empty
      </h2>
      <p className="text-black/60 mb-6 text-base sm:text-lg">
        Head to the admin page to add categories, difficulty tiers, and questions.
        Once you save, they will appear here as post-its.
      </p>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 rounded-full bg-black text-white px-6 py-3 font-semibold hover:bg-black/80 transition"
      >
        <Settings className="size-4" />
        Open admin
      </Link>
    </div>
  );
}
