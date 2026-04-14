import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // 1. Get the Auth User
  // This refreshes the session but doesn't hit your 'profiles' table
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Define protected paths
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname.startsWith("/admin");
  const isClientPage = pathname.startsWith("/dashboard");
  const isLoginPage = pathname === "/login";

  // 3. Logic: Not logged in? Go to login.
  if (!user && (isAdminPage || isClientPage)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Logic: Logged in? Check role using user_metadata (ZERO DB QUERIES)
  if (user) {
    const role = user.user_metadata?.role;

    // Redirect if trying to access the wrong area
    if (isAdminPage && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isClientPage && role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // If logged in and trying to go to login page, send to their respective dashboard
    if (isLoginPage) {
      const redirectPath = role === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
