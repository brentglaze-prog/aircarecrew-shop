import { NextResponse, type NextRequest } from "next/server";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/admin/") ? requestedNext : "/admin/reset-password";

  if (!code) {
    return NextResponse.redirect(`${PRODUCTION_SITE_URL}/admin/login?error=recovery_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth callback: code exchange failed", error);
    return NextResponse.redirect(`${PRODUCTION_SITE_URL}/admin/login?error=recovery_failed`);
  }

  return NextResponse.redirect(`${PRODUCTION_SITE_URL}${next}`);
}
