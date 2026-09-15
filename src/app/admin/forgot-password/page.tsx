"use client";

import Link from "next/link";
import { useState } from "react";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import { createRecoveryClient } from "@/lib/supabase/recovery-client";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createRecoveryClient();
    const redirectTo = `${PRODUCTION_SITE_URL}/auth/callback`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setLoading(false);
    if (resetError) {
      console.error("admin password reset request failed", resetError);
      setError("We couldn't send the reset email. Please wait a moment and try again.");
      return;
    }

    // Keep the response generic so the public form does not disclose which
    // email addresses are registered as administrators.
    setMessage("If that email matches an admin account, a password-reset link has been sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <div className="w-full max-w-sm rounded-lg bg-offwhite p-8">
        <h1 className="font-display text-xl font-bold tracking-tight">Reset admin password</h1>
        <p className="mt-2 text-sm text-graphite-600">
          Enter the email address for your AirCareCrew.shop admin account. We’ll email you a secure reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] rounded-md border border-graphite-950/20 px-3"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Sending…" : "Email reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm">
          <Link href="/admin/login" className="font-medium text-violet-600 underline underline-offset-4">
            Back to admin sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
