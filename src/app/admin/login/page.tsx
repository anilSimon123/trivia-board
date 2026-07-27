import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin, isPasswordConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!isPasswordConfigured() || (await isAdmin())) {
    redirect("/admin");
  }
  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-zinc-50 p-6">
      <LoginForm />
    </div>
  );
}
