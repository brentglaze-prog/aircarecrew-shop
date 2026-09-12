"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not_admin"
      ? "That account doesn't have admin access. Contact the store owner."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Invalid email or password.");
      return;
    }
    // A hard navigation (not router.push) is required here: the nav links
    // on this page prefetch /admin/* while logged out, and Next.js's client
    // router cache can replay that stale unauthenticated redirect instead of
    // fetching the now-authenticated page.
    window.location.href = "/admin";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <div className="w-full max-w-sm rounded-lg bg-offwhite p-8">
        <h1 className="font-display text-xl font-bold tracking-tight">AirCareCrew.shop Admin</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] rounded-md border border-graphite-950/20 px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] rounded-md border border-graphite-950/20 px-3"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-xs text-graphite-600">
          Admin accounts are created by the store owner in Supabase — see SETUP.md. There is no
          public sign-up.
        </p>
      </div>
    </div>
  );
}
