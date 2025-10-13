import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      // 1. Initialize the Google OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`
      );

      // 2. Exchange the authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (!refreshToken) {
        throw new Error("No refresh token received from Google. Please ensure you are requesting 'offline' access.");
      }
      
      // 3. Get the current logged-in user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated.");
      }

      // 4. Securely save the refresh_token to the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ google_refresh_token: refreshToken })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Database error: ${updateError.message}`);
      }
      
    } catch (error) {
      console.error("Error during Google OAuth callback:", error);
      // Redirect to settings page with an error message
      return NextResponse.redirect(`${requestUrl.origin}/admin/settings?error=google_auth_failed`);
    }
  }

  // 5. Redirect the user back to the settings page on success
  return NextResponse.redirect(`${requestUrl.origin}/admin/settings`);
}
