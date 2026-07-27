"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signin", password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Login failed");
      }
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="rounded-full bg-zinc-100 p-3 mb-3">
          <Lock className="size-5 text-zinc-700" />
        </div>
        <h1 className="text-xl font-semibold">Admin access</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Enter the admin password to edit the board.
        </p>
      </div>

      <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
        Password
      </label>
      <input
        autoFocus
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        placeholder="••••••••"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || password.length === 0}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Sign in
      </button>
    </form>
  );
}
