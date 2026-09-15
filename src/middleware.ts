import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects /admin/*. Anyone else passes through untouched (page-level
 * checks would rely only on hiding UI, which the project spec explicitly
 * forbids for the admin surface — this enforces it at the edge, and every
 * admin server action re-checks with requireAdmin() as defense in depth).
 */
export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Authentication entry points must remain public. The actual reset-password
  // page is intentionally NOT exempt: the recovery callback must establish a
  // valid admin session before a password can be changed.
  if (
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/admin/forgot-password"
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return NextResponse.redirect(new URL("/admin/login?error=not_admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
