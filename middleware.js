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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Define protected paths
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isClientPage = request.nextUrl.pathname.startsWith("/dashboard");
  const isLoginPage = request.nextUrl.pathname === "/login";

  // 3. Logic: Not logged in? Go to login.
  if (!user && (isAdminPage || isClientPage)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Logic: Logged in? Check role for redirection
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Redirect if trying to access the wrong area
    if (isAdminPage && profile?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isClientPage && profile?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // If logged in and trying to go to login page, send to their respective dashboard
    if (isLoginPage) {
      const redirectPath = profile?.role === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
