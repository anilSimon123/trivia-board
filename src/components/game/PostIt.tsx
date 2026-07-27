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
  className?: string;
};

export function PostIt({ id, color, points, onClick, className }: PostItProps) {
  const tilt = tiltFromId(id);

  return (
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
        "postit-paper postit-shadow group relative aspect-square w-full",
        "cursor-pointer overflow-hidden rounded-[3px]",
        "flex items-center justify-center",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-black/20",
        COLOR_CLASSES[color],
        className,
      )}
      aria-label={`Reveal question worth ${points} points`}
    >
      {/* Faux tape */}
      <span
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-14 rounded-[2px] bg-white/60 border border-white/70 shadow-sm rotate-[-2deg]"
      />
      <span className="font-hand text-[clamp(2rem,5vw,4.5rem)] font-bold text-black/70 drop-shadow-sm">
        {points}
      </span>
    </motion.button>
  );
}
