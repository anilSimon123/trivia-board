export type Category = {
  id: string;
  name: string;
  /** Tailwind-ish hue key used to pick a post-it color. */
  color: PostItColor;
};

export type Difficulty = {
  id: string;
  label: string;
  points: number;
};

export type Question = {
  id: string;
  categoryId: string;
  difficultyId: string;
  text: string;
  /** Optional canonical answer, shown to the host if they want a hint. */
  answer?: string;
  /**
   * Optional multiple-choice options. If present and non-empty, they render
   * as A/B/C/D under the question. Zero-length or all-blank means "not a
   * multiple choice question" and the block is hidden.
   */
  options?: string[];
};

export type Board = {
  title: string;
  categories: Category[];
  difficulties: Difficulty[];
  questions: Question[];
  updatedAt: string;
};

export const POSTIT_COLORS = [
  "yellow",
  "pink",
  "blue",
  "green",
  "orange",
  "purple",
] as const;

export type PostItColor = (typeof POSTIT_COLORS)[number];

export const emptyBoard = (): Board => ({
  title: "Trivia Night",
  categories: [],
  difficulties: [],
  questions: [],
  updatedAt: new Date().toISOString(),
});
