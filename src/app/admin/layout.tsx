import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { redirect('/auth'); }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'ADMIN') {
        redirect('/dashboard/client');
    }

    return (
        <div className="flex min-h-screen bg-gray-900 text-gray-200">
            {/* Sidebar */}
            <aside className="w-64 bg-black/30 p-6">
                <Link href="/admin" className="text-xl font-bold mb-8 text-white block">Admin Panel</Link>
                <nav className="flex flex-col space-y-4">
                    {/* UPDATE: Add a dedicated "Dashboard" link */}
                    <Link href="/admin" className="hover:text-amber-300">Dashboard</Link>
                    <Link href="/admin/clients" className="hover:text-amber-300">Clients</Link>
                    <Link href="/admin/workouts" className="hover:text-amber-300">Workout Plans</Link>
                    <Link href="/admin/meetings" className="hover:text-amber-300">Meetings</Link>
                    <Link href="/admin/chat" className="hover:text-amber-300">Chat</Link>
                    <Link href="/admin/settings" className="hover:text-amber-300">Settings</Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
