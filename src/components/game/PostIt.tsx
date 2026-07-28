"use client";

import { motion } from "motion/react";
import { cn, tiltFromId } from "@/lib/utils";
import type { PostItColor } from "@/lib/types";

const COLOR_CLASSES: Record<PostItColor, string> = {
  yellow: "bg-postit-yellow",
  pink: "bg-postit-pink",
  blue: "bg-postit-blue",
  green: "bg-postit-green",
  orange: "bg-postit-orange",
  purple: "bg-postit-purple",
};

type PostItProps = {
  id: string;
  color: PostItColor;
  points: number;
  onClick: () => void;
  /** How many post-its remain in this cell (including the visible top one). Values > 1 render a fake stack behind. */
  remaining?: number;
  className?: string;
};

export function PostIt({
  id,
  color,
  points,
  onClick,
  remaining = 1,
  className,
}: PostItProps) {
  const tilt = tiltFromId(id);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Fake stacked notes behind the top one. We draw up to 2 background layers, offset and tilted. */}
      {remaining > 1 && (
        <StackShadow color={color} depth={Math.min(remaining - 1, 2)} baseId={id} />
      )}

      <motion.button
        layoutId={`postit-${id}`}
        onClick={onClick}
        initial={false}
        animate={{ rotate: tilt }}
        whileHover={{
          rotate: 0,
          scale: 1.04,
          y: -4,
          transition: { type: "spring", stiffness: 300, damping: 22 },
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className={cn(
          "postit-paper postit-shadow relative z-10 aspect-square w-full",
          "cursor-pointer overflow-hidden rounded-[3px]",
          "flex items-center justify-center",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-black/20",
          COLOR_CLASSES[color],
        )}
        aria-label={
          remaining > 1
            ? `Reveal question worth ${points} points (${remaining} remaining in this slot)`
            : `Reveal question worth ${points} points`
        }
      >
        {/* Faux tape */}
        <span
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-14 rounded-[2px] bg-white/60 border border-white/70 shadow-sm rotate-[-2deg]"
        />
        <span className="font-hand text-[clamp(2rem,5vw,4.5rem)] font-bold text-black/70 drop-shadow-sm">
          {points}
        </span>

        {/* Remaining-count badge */}
        {remaining > 1 && (
          <span
            aria-hidden
            className={cn(
              "absolute top-1.5 right-1.5 rounded-full bg-black/80 text-white",
              "text-[0.7rem] sm:text-xs font-bold leading-none",
              "px-1.5 py-1 min-w-[1.35rem] text-center shadow-md",
            )}
          >
            ×{remaining}
          </span>
        )}
      </motion.button>
    </div>
  );
}

function StackShadow({
  color,
  depth,
  baseId,
}: {
  color: PostItColor;
  depth: number;
  baseId: string;
}) {
  // Two possible layers; each with a small offset + tilt derived from baseId so it looks organic but stable.
  const layers = Array.from({ length: depth }, (_, i) => i + 1);
  return (
    <>
      {layers.map((i) => {
        const tilt = tiltFromId(`${baseId}-stack-${i}`, 5);
        const offset = i * 3; // px translation for depth
        return (
          <div
            key={i}
            aria-hidden
            className={cn(
              "postit-paper postit-shadow absolute inset-0 aspect-square rounded-[3px] pointer-events-none",
              COLOR_CLASSES[color],
            )}
            style={{
              transform: `translate(${offset}px, ${offset}px) rotate(${tilt}deg)`,
              zIndex: 10 - i,
              opacity: 1 - i * 0.05,
            }}
          />
        );
      })}
    </>
  );
}
