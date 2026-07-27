import { redirect } from "next/navigation";

import { AdminEditor } from "@/components/admin/AdminEditor";
import { isAdmin, isPasswordConfigured } from "@/lib/auth";
import { loadBoard, storageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (isPasswordConfigured() && !(await isAdmin())) {
    redirect("/admin/login");
  }
  const board = await loadBoard();
  return <AdminEditor initialBoard={board} storageMode={storageMode()} />;
}
