import { createClient } from '@/lib/supabase/server';
import { getGoogleAuthUrl } from '@/src/app/admin/actions';
import { Button } from '@/src/app/components/button';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default async function AdminSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if the admin has already connected their Google account
    const { data: profile } = await supabase
        .from('profiles')
        .select('google_refresh_token')
        .eq('id', user?.id)
        .single();

    const isGoogleConnected = !!profile?.google_refresh_token;

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Settings
            </h1>
            <p className="text-amber-400 text-sm uppercase font-semibold mb-8">
                INTEGRATIONS & PREFERENCES
            </p>

            <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700 max-w-lg">
                <h2 className="text-xl font-bold text-white mb-4">Google Calendar Integration</h2>
                {isGoogleConnected ? (
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircleIcon className="h-6 w-6" />
                        <p>Your Google Calendar is connected.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-300 mb-4">
                            Connect your Google Calendar to automatically create Google Meet events when you approve a client's meeting request.
                        </p>
                        <form action={getGoogleAuthUrl}>
                            <Button type="submit">Connect Google Calendar</Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}