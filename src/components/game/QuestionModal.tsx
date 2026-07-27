"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PostItColor } from "@/lib/types";

const COLOR_CLASSES: Record<PostItColor, string> = {
  yellow: "bg-postit-yellow",
  pink: "bg-postit-pink",
  blue: "bg-postit-blue",
  green: "bg-postit-green",
  orange: "bg-postit-orange",
  purple: "bg-postit-purple",
};

type QuestionModalProps = {
  open: boolean;
  questionId: string | null;
  color: PostItColor;
  category: string;
  difficulty: string;
  points: number;
  text: string;
  answer?: string;
  onMarkAnswered: () => void;
  onClose: () => void;
};

export function QuestionModal({
  open,
  questionId,
  color,
  category,
  difficulty,
  points,
  text,
  answer,
  onMarkAnswered,
  onClose,
}: QuestionModalProps) {
  return (
    <AnimatePresence>
      {open && questionId && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          exit={{ backgroundColor: "rgba(0,0,0,0)" }}
          onClick={onClose}
        >
          <motion.div
            layoutId={`postit-${questionId}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "postit-paper postit-shadow-lg relative w-full max-w-3xl rounded-md",
              "flex flex-col items-center justify-center text-center",
              "px-6 sm:px-14 py-10 sm:py-16",
              COLOR_CLASSES[color],
            )}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
          >
            {/* Faux tape */}
            <span
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-28 rounded-[3px] bg-white/70 border border-white/80 shadow-md rotate-[-2deg]"
            />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 rounded-full p-2 text-black/50 hover:bg-black/10 hover:text-black transition"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
              className="flex flex-col items-center gap-2 sm:gap-3"
            >
              <div className="flex items-center gap-3 text-xs sm:text-sm uppercase tracking-[0.2em] text-black/50 font-medium">
                <span>{category}</span>
                <span aria-hidden>·</span>
                <span>{difficulty}</span>
                <span aria-hidden>·</span>
                <span className="font-bold text-black/70">{points} pts</span>
              </div>

              <p className="font-hand font-semibold text-black/85 leading-tight text-[clamp(2rem,5vw,4rem)] max-w-2xl">
                {text}
              </p>

              {answer && (
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-xs sm:text-sm text-black/50 hover:text-black/80 select-none list-none">
                    <span className="underline underline-offset-4">Reveal host hint</span>
                  </summary>
                  <p className="mt-2 font-hand text-2xl text-black/70 max-w-xl">
                    {answer}
                  </p>
                </details>
              )}
            </motion.div>

            <motion.button
              onClick={onMarkAnswered}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.35, type: "spring", stiffness: 300, damping: 20 } }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "mt-8 sm:mt-12 inline-flex items-center gap-3 rounded-full",
                "bg-emerald-600 text-white font-semibold",
                "px-8 py-4 sm:px-10 sm:py-5 text-lg sm:text-xl",
                "shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-colors",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300",
              )}
            >
              <Check className="size-6 sm:size-7" strokeWidth={3} />
              <span>Answered</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
