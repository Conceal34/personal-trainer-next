'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  // 1. Sign in the user
  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !user) {
    // Check for the specific "Invalid login credentials" error
    if (signInError?.message.includes('Invalid login credentials')) {
      return { 
        success: false, 
        message: 'Invalid email or password. Don\'t have an account?', 
        isUserNotFound: true // Send a new flag to the client
      };
    }
    return { success: false, message: signInError?.message || 'Invalid login credentials.' };
  }

  // 2. Fetch the user's profile to check their role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile) {
    // This case is unlikely but good to handle
    return { success: false, message: 'Could not find user profile.' };
  }
  
  // 3. Determine the redirect path based on the role
  const redirectPath = profile.role === 'ADMIN' 
    ? '/admin/workouts' 
    : '/dashboard/client';
    
  // 4. Return the success state and the correct path
  return { success: true, redirectPath };
}