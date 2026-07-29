"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import type { Board, Category, Difficulty, Question } from "@/lib/types";
import { POSTIT_COLORS } from "@/lib/types";
import { cn, newId } from "@/lib/utils";

type AdminEditorProps = {
  initialBoard: Board;
  storageMode: "supabase" | "file";
};

export function AdminEditor({ initialBoard, storageMode }: AdminEditorProps) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Group questions per (difficulty, category). Preserves array order.
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

  const setBoardField = <K extends keyof Board>(key: K, value: Board[K]) =>
    setBoard((b) => ({ ...b, [key]: value }));

  const addCategory = () => {
    const next: Category = {
      id: newId(),
      name: `Category ${board.categories.length + 1}`,
      color: POSTIT_COLORS[board.categories.length % POSTIT_COLORS.length],
    };
    setBoardField("categories", [...board.categories, next]);
  };

  const removeCategory = (id: string) => {
    setBoard((b) => ({
      ...b,
      categories: b.categories.filter((c) => c.id !== id),
      questions: b.questions.filter((q) => q.categoryId !== id),
    }));
  };

  const updateCategory = (id: string, patch: Partial<Category>) => {
    setBoard((b) => ({
      ...b,
      categories: b.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const addDifficulty = () => {
    const next: Difficulty = {
      id: newId(),
      label: `Tier ${board.difficulties.length + 1}`,
      points: (board.difficulties.length + 1) * 100,
    };
    setBoardField("difficulties", [...board.difficulties, next]);
  };

  const removeDifficulty = (id: string) => {
    setBoard((b) => ({
      ...b,
      difficulties: b.difficulties.filter((d) => d.id !== id),
      questions: b.questions.filter((q) => q.difficultyId !== id),
    }));
  };

  const updateDifficulty = (id: string, patch: Partial<Difficulty>) => {
    setBoard((b) => ({
      ...b,
      difficulties: b.difficulties.map((d) =>
        d.id === id ? { ...d, ...patch } : d,
      ),
    }));
  };

  const addQuestion = (difficultyId: string, categoryId: string) => {
    const created: Question = {
      id: newId(),
      difficultyId,
      categoryId,
      text: "",
    };
    setBoard((b) => ({ ...b, questions: [...b.questions, created] }));
  };

  const updateQuestion = (
    id: string,
    patch: Partial<Pick<Question, "text" | "answer" | "options">>,
  ) => {
    setBoard((b) => ({
      ...b,
      questions: b.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  };

  const updateOption = (id: string, index: number, value: string) => {
    setBoard((b) => ({
      ...b,
      questions: b.questions.map((q) => {
        if (q.id !== id) return q;
        const next = [...(q.options ?? ["", "", "", ""])];
        // Pad to at least (index + 1) so we can write to the target slot.
        while (next.length <= index) next.push("");
        next[index] = value;
        return { ...q, options: next };
      }),
    }));
  };

  const removeQuestion = (id: string) => {
    setBoard((b) => ({ ...b, questions: b.questions.filter((q) => q.id !== id) }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const cleaned: Board = {
        ...board,
        questions: board.questions
          .filter((q) => q.text.trim().length > 0)
          .map((q) => {
            const opts = (q.options ?? [])
              .map((o) => o.trim())
              .filter((o) => o.length > 0);
            const next: Question = { ...q };
            if (opts.length > 0) next.options = opts;
            else delete next.options;
            return next;
          }),
      };
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      const saved = (await res.json()) as Board;
      setBoard(saved);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const filledQuestions = board.questions.filter((q) => q.text.trim().length > 0).length;

  return (
    <div className="min-h-dvh w-full bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition"
            >
              <ArrowLeft className="size-4" />
              Board
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold">Admin</h1>
            <span
              className={cn(
                "hidden sm:inline text-xs px-2 py-0.5 rounded-full",
                storageMode === "supabase"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700",
              )}
              title={
                storageMode === "supabase"
                  ? "Persisted to Supabase"
                  : "Saved to a local file (.data/board.json). Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) to use Supabase."
              }
            >
              {storageMode === "supabase" ? "Supabase" : "Local file"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-zinc-500">
              {filledQuestions} question{filledQuestions === 1 ? "" : "s"}
            </span>
            {savedAt && !error && (
              <span className="text-xs text-emerald-600">Saved {savedAt}</span>
            )}
            {error && <span className="text-xs text-red-600">{error}</span>}
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 sm:px-5 py-2 text-sm font-semibold shadow-sm hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 sm:px-8 py-6 sm:py-10 space-y-8">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
            Board title
          </label>
          <input
            value={board.title}
            onChange={(e) => setBoardField("title", e.target.value)}
            className="w-full text-2xl sm:text-3xl font-hand font-bold bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-400 focus:outline-none py-1"
            placeholder="Trivia Night"
          />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Stepper
            label="Difficulty tiers (rows)"
            value={board.difficulties.length}
            onDecrement={() => {
              const last = board.difficulties.at(-1);
              if (last) removeDifficulty(last.id);
            }}
            onIncrement={addDifficulty}
          />
          <Stepper
            label="Categories (columns)"
            value={board.categories.length}
            onDecrement={() => {
              const last = board.categories.at(-1);
              if (last) removeCategory(last.id);
            }}
            onIncrement={addCategory}
          />
        </section>

        {board.categories.length === 0 || board.difficulties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
            <Sparkles className="size-5 inline mr-1 text-amber-500" />
            Add at least one difficulty tier and one category to start entering
            questions.
          </div>
        ) : (
          <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <div
              className="grid min-w-[720px]"
              style={{
                gridTemplateColumns: `minmax(11rem, 14rem) repeat(${board.categories.length}, minmax(18rem, 1fr))`,
              }}
            >
              <div className="border-b border-r border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Difficulty ↓ / Category →
              </div>
              {board.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="border-b border-zinc-200 bg-zinc-50 p-3 flex items-center gap-2"
                >
                  <input
                    value={cat.name}
                    onChange={(e) =>
                      updateCategory(cat.id, { name: e.target.value })
                    }
                    className="flex-1 font-semibold bg-transparent focus:outline-none border-b border-transparent hover:border-zinc-300 focus:border-zinc-400 py-1"
                    placeholder="Category name"
                  />
                  <ColorPicker
                    color={cat.color}
                    onChange={(color) => updateCategory(cat.id, { color })}
                  />
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className="text-zinc-400 hover:text-red-600 transition"
                    aria-label="Remove category"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              {board.difficulties.map((diff) => (
                <DifficultyRow
                  key={diff.id}
                  diff={diff}
                  categories={board.categories}
                  cellQuestions={cellQuestions}
                  onUpdateDiff={(patch) => updateDifficulty(diff.id, patch)}
                  onRemoveDiff={() => removeDifficulty(diff.id)}
                  onAddQuestion={(categoryId) => addQuestion(diff.id, categoryId)}
                  onUpdateQuestion={updateQuestion}
                  onUpdateOption={updateOption}
                  onRemoveQuestion={removeQuestion}
                />
              ))}
            </div>
          </section>
        )}

        <p className="text-xs text-zinc-500">
          Tip: each cell can hold multiple questions — they&apos;ll appear as a
          stack of post-its on the board and reveal one at a time. Empty
          questions are pruned automatically on save.
        </p>
      </main>
    </div>
  );
}

function Stepper({
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
          {label}
        </div>
        <div className="text-3xl font-bold tabular-nums">{value}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onDecrement}
          disabled={value === 0}
          className="rounded-full p-2 border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 transition"
          aria-label={`Decrement ${label}`}
        >
          <Minus className="size-4" />
        </button>
        <button
          onClick={onIncrement}
          className="rounded-full p-2 border border-zinc-200 hover:bg-zinc-100 transition"
          aria-label={`Increment ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function DifficultyRow({
  diff,
  categories,
  cellQuestions,
  onUpdateDiff,
  onRemoveDiff,
  onAddQuestion,
  onUpdateQuestion,
  onUpdateOption,
  onRemoveQuestion,
}: {
  diff: Difficulty;
  categories: Category[];
  cellQuestions: Map<string, Question[]>;
  onUpdateDiff: (patch: Partial<Difficulty>) => void;
  onRemoveDiff: () => void;
  onAddQuestion: (categoryId: string) => void;
  onUpdateQuestion: (
    id: string,
    patch: Partial<Pick<Question, "text" | "answer" | "options">>,
  ) => void;
  onUpdateOption: (id: string, index: number, value: string) => void;
  onRemoveQuestion: (id: string) => void;
}) {
  return (
    <>
      <div className="border-b border-r border-zinc-200 bg-zinc-50/60 p-3 flex flex-col gap-2">
        <input
          value={diff.label}
          onChange={(e) => onUpdateDiff({ label: e.target.value })}
          className="font-semibold bg-transparent focus:outline-none border-b border-transparent hover:border-zinc-300 focus:border-zinc-400 py-1"
          placeholder="Tier label (Easy / Medium / Hard)"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={diff.points}
            onChange={(e) =>
              onUpdateDiff({ points: Number.parseInt(e.target.value, 10) || 0 })
            }
            className="w-24 rounded border border-zinc-200 px-2 py-1 text-sm"
          />
          <span className="text-xs text-zinc-500">pts</span>
          <button
            onClick={onRemoveDiff}
            className="ml-auto text-zinc-400 hover:text-red-600 transition"
            aria-label="Remove difficulty"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {categories.map((cat) => {
        const key = `${diff.id}:${cat.id}`;
        const questions = cellQuestions.get(key) ?? [];
        return (
          <div
            key={cat.id}
            className="border-b border-zinc-200 p-3 flex flex-col gap-3"
          >
            {questions.length === 0 && (
              <div className="text-xs text-zinc-400 italic px-1">
                No questions yet.
              </div>
            )}
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                index={idx}
                total={questions.length}
                question={q}
                onUpdate={(patch) => onUpdateQuestion(q.id, patch)}
                onUpdateOption={(optIdx, value) =>
                  onUpdateOption(q.id, optIdx, value)
                }
                onRemove={() => onRemoveQuestion(q.id)}
              />
            ))}
            <button
              onClick={() => onAddQuestion(cat.id)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:border-zinc-400 hover:text-zinc-900 transition"
            >
              <Plus className="size-3.5" />
              {questions.length === 0 ? "Add question" : "Add another"}
            </button>
          </div>
        );
      })}
    </>
  );
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function QuestionCard({
  index,
  total,
  question,
  onUpdate,
  onUpdateOption,
  onRemove,
}: {
  index: number;
  total: number;
  question: Question;
  onUpdate: (patch: Partial<Pick<Question, "text" | "answer" | "options">>) => void;
  onUpdateOption: (index: number, value: string) => void;
  onRemove: () => void;
}) {
  // Always render four slots in the editor; blanks are pruned on save.
  const optionSlots = Array.from(
    { length: 4 },
    (_, i) => question.options?.[i] ?? "",
  );

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-100 bg-zinc-50/60 rounded-t-md">
        <span className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-semibold">
          Question {index + 1}
          {total > 1 && <span className="text-zinc-400"> / {total}</span>}
        </span>
        <button
          onClick={onRemove}
          className="text-zinc-400 hover:text-red-600 transition"
          aria-label="Remove question"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="p-2.5 flex flex-col gap-2">
        <textarea
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={2}
          placeholder="Question..."
          className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        />

        <div className="grid grid-cols-1 gap-1.5">
          {optionSlots.map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-xs font-bold text-zinc-500 text-center">
                {OPTION_LETTERS[i]}
              </span>
              <input
                value={value}
                onChange={(e) => onUpdateOption(i, e.target.value)}
                placeholder={`Option ${OPTION_LETTERS[i]} (optional)`}
                className="flex-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>
          ))}
        </div>

        <input
          value={question.answer ?? ""}
          onChange={(e) => onUpdate({ answer: e.target.value })}
          placeholder="Host hint / answer (optional)"
          className="w-full rounded-md border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 focus:outline-none focus:border-zinc-300"
        />
      </div>
    </div>
  );
}

const COLOR_SWATCH: Record<(typeof POSTIT_COLORS)[number], string> = {
  yellow: "bg-postit-yellow",
  pink: "bg-postit-pink",
  blue: "bg-postit-blue",
  green: "bg-postit-green",
  orange: "bg-postit-orange",
  purple: "bg-postit-purple",
};

function ColorPicker({
  color,
  onChange,
}: {
  color: (typeof POSTIT_COLORS)[number];
  onChange: (color: (typeof POSTIT_COLORS)[number]) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {POSTIT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            "size-5 rounded-full border transition",
            color === c
              ? "ring-2 ring-offset-1 ring-zinc-700 border-transparent"
              : "border-zinc-300 hover:scale-110",
            COLOR_SWATCH[c],
          )}
          aria-label={`Set color ${c}`}
          title={c}
        />
      ))}
    </div>
  );
}
