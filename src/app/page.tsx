import { GameBoard } from "@/components/game/GameBoard";
import { loadBoard } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function GamePage() {
  const board = await loadBoard();
  return <GameBoard initialBoard={board} />;
}
