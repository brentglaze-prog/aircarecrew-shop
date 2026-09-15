"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verifyAdminSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/admin/login?error=recovery_failed";
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (adminError || !adminRow) {
        await supabase.auth.signOut();
        window.location.href = "/admin/login?error=not_admin";
        return;
      }

      setAuthorized(true);
      setChecking(false);
    }

    void verifyAdminSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("Use at least 12 characters for the new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message || "Could not update your password. Please request a new recovery link.");
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/admin/login?reset=success";
  }

  if (checking || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
        <div className="w-full max-w-sm rounded-lg bg-offwhite p-8 text-sm text-graphite-600">
          Verifying your recovery session…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <div className="w-full max-w-sm rounded-lg bg-offwhite p-8">
        <h1 className="font-display text-xl font-bold tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-sm text-graphite-600">
          Set a new password for your AirCareCrew.shop administrator account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            New password
            <input
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] rounded-md border border-graphite-950/20 px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Confirm new password
            <input
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="min-h-[44px] rounded-md border border-graphite-950/20 px-3"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Updating…" : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
