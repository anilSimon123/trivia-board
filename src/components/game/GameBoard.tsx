"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, Settings, Sparkles } from "lucide-react";
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

  const answered = useSession((s) => s.answered);
  const markAnswered = useSession((s) => s.markAnswered);
  const resetSession = useSession((s) => s.resetSession);
  const syncBoardVersion = useSession((s) => s.syncBoardVersion);

  // Sync session with board version so a new admin publish resets progress.
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

  const questionMap = useMemo(() => {
    const map = new Map<string, Question>();
    for (const q of board.questions) map.set(`${q.difficultyId}:${q.categoryId}`, q);
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
  const score = board.questions
    .filter((q) => answered[q.id])
    .reduce((sum, q) => {
      const d = board.difficulties.find((x) => x.id === q.difficultyId);
      return sum + (d?.points ?? 0);
    }, 0);

  const isEmpty = board.categories.length === 0 || board.difficulties.length === 0;

  return (
    <div className="board-surface flex flex-col min-h-dvh w-full">
      <header className="flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4 gap-3">
        <h1 className="font-hand text-3xl sm:text-5xl font-bold text-black/80">
          {board.title || "Trivia Board"}
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <ScorePill answered={answeredCount} total={totalQuestions} score={score} />
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
      </header>

      <main className="flex-1 flex items-center justify-center px-3 sm:px-8 pb-6 sm:pb-10">
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
            {/* Top-left blank */}
            <div />

            {/* Category headers */}
            {board.categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-end justify-center pb-2"
              >
                <span className="font-hand text-2xl sm:text-3xl lg:text-4xl font-bold text-black/70 text-center leading-tight px-2">
                  {cat.name}
                </span>
              </div>
            ))}

            {/* Difficulty rows */}
            {board.difficulties.map((diff) => (
              <RowFragment
                key={diff.id}
                diffLabel={diff.label}
                diffPoints={diff.points}
              >
                {board.categories.map((cat) => {
                  const q = questionMap.get(`${diff.id}:${cat.id}`);
                  const isAnswered = q ? !!answered[q.id] : false;
                  return (
                    <div key={cat.id} className="flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {q && !isAnswered ? (
                          <PostIt
                            key={q.id}
                            id={q.id}
                            color={cat.color}
                            points={diff.points}
                            onClick={() => setActiveId(q.id)}
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

      <QuestionModal
        open={!!active}
        questionId={active?.id ?? null}
        color={activeCategory?.color ?? "yellow"}
        category={activeCategory?.name ?? ""}
        difficulty={activeDifficulty?.label ?? ""}
        points={activeDifficulty?.points ?? 0}
        text={active?.text ?? ""}
        answer={active?.answer}
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

function ScorePill({
  answered,
  total,
  score,
}: {
  answered: number;
  total: number;
  score: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm">
      <Sparkles className="size-4 text-amber-500" />
      <span className="text-sm sm:text-base font-semibold text-black/80">
        {answered}/{total}
      </span>
      <span className="text-black/30" aria-hidden>|</span>
      <span className="text-sm sm:text-base font-semibold text-black/80">
        {score} pts
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
