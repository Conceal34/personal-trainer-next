'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = createClient();

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to the home page
  redirect('/');
}