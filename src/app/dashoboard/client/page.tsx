import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/src/app/auth/actions'; // Import the new logout action

export default async function ClientDashboard() {
    const supabase = createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect('/auth');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Dashboard Header */}
            <header className="bg-white shadow-md">
                <div className="w-full max-w-4xl mx-auto p-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">
                        Client Dashboard
                    </h1>
                    {/* Logout Form */}
                    <form action={logout}>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Log Out
                        </button>
                    </form>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                        Welcome, {profile?.full_name || 'Client'}!
                    </h2>
                    <p className="text-gray-600">
                        This is your personal dashboard. Only you can see this page.
                    </p>

                    <div className="mt-6 p-6 border-t border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700">Your Workout Plan</h3>
                        <p className="mt-2 text-gray-500">Coming soon...</p>
                    </div>
                    <div className="mt-6 p-6 border-t border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700">Scheduled Meetings</h3>
                        <p className="mt-2 text-gray-500">Coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}