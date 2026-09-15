"use client";

import { useEffect, useState } from "react";
import { createRecoveryClient } from "@/lib/supabase/recovery-client";

export default function AuthRecoveryCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createRecoveryClient();
    let redirected = false;

    function goToReset() {
      if (redirected) return;
      redirected = true;
      window.location.replace("/admin/reset-password");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        goToReset();
      }
    });

    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        goToReset();
        return;
      }

      // detectSessionInUrl processes the recovery hash asynchronously. Give it
      // a short window before showing an actionable error instead of looping.
      window.setTimeout(async () => {
        if (redirected) return;
        const {
          data: { session: delayedSession },
        } = await supabase.auth.getSession();

        if (delayedSession) {
          goToReset();
        } else {
          setError("This recovery link is invalid or expired. Please request a new reset email.");
        }
      }, 1200);
    }

    void checkExistingSession();
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
      <div className="w-full max-w-sm rounded-lg bg-offwhite p-8">
        <h1 className="font-display text-xl font-bold tracking-tight">Password recovery</h1>
        {error ? (
          <>
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <a
              href="/admin/forgot-password"
              className="mt-6 inline-block font-medium text-violet-600 underline underline-offset-4"
            >
              Request a new reset email
            </a>
          </>
        ) : (
          <p className="mt-3 text-sm text-graphite-600">Verifying your secure recovery link…</p>
        )}
      </div>
    </div>
  );
}
