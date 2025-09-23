import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // 1. Check if a user is logged in
    if (!session) {
        redirect('/auth');
    }

    // 2. Check if the user is an admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'ADMIN') {
        // Redirect non-admin users to their dashboard or home page
        redirect('/dashboard/client');
    }

    // 3. If they are an admin, render the layout
    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-800">
            <aside className="w-64 bg-gray-800 text-white p-6">
                <h1 className="text-xl font-bold mb-8">Admin Panel</h1>
                <nav className="flex flex-col space-y-4">
                    <Link href="/admin/workouts" className="hover:text-amber-300">Workout Plans</Link>
                    {/* Add more admin links here later */}
                </nav>
            </aside>
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
} 