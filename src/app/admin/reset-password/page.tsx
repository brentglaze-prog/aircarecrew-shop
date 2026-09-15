"use client";

import { useEffect, useState } from "react";
import { createRecoveryClient } from "@/lib/supabase/recovery-client";

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
      const supabase = createRecoveryClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setChecking(false);
          setError("This recovery link is invalid or expired. Request a new password reset email.");
        }
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user || userError) {
        if (!cancelled) {
          setChecking(false);
          setError("We couldn't verify this recovery session. Request a new password reset email.");
        }
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
        setChecking(false);
        setError("This account is not authorized for AirCareCrew.shop administration.");
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
    const supabase = createRecoveryClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message || "Could not update your password. Please request a new recovery link.");
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/admin/login?reset=success";
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
        <div className="w-full max-w-sm rounded-lg bg-offwhite p-8 text-sm text-graphite-600">
          Verifying your recovery session…
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
        <div className="w-full max-w-sm rounded-lg bg-offwhite p-8">
          <h1 className="font-display text-xl font-bold tracking-tight">Recovery link unavailable</h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <a href="/admin/forgot-password" className="mt-6 inline-block font-medium text-violet-600 underline underline-offset-4">
            Request a new reset email
          </a>
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
