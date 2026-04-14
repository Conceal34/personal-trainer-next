"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  // 1. Sign in the user
  const {
    data: { user },
    error: signInError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !user) {
    if (signInError?.message.includes("Invalid login credentials")) {
      return {
        success: false,
        message: "Invalid email or password. Don't have an account?",
        isUserNotFound: true,
      };
    }
    return {
      success: false,
      message: signInError?.message || "Invalid login credentials.",
    };
  }

  // --- DEBUGGING STEP FOR MCA ---
  // If this still fails, it means the RLS policy is blocking the read.
  // We fetch the profile specifically for the user ID we just got back.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // If profile is missing here, it's 100% an RLS issue.
  if (profileError || !profile) {
    console.error("Profile check failed:", profileError); // Check your server terminal
    return { success: false, message: "Could not find user profile." };
  }

  const redirectPath =
    profile.role === "ADMIN" ? "/admin/clients" : "/dashboard/client";

  return { success: true, redirectPath };
}
