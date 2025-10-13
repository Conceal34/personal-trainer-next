import { createClient } from '@/lib/supabase/server';
import { UsersIcon, BanknotesIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // --- Data Fetching for Metrics ---

    // 1. Get Total Active Clients
    const { count: activeClientsCount, error: countError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

    // 2. Get Monthly Revenue
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { data: monthlySubs, error: revenueError } = await supabase
        .from('subscriptions')
        .select('plans ( price )')
        .gte('start_date', firstDayOfMonth);

    const monthlyRevenue = monthlySubs?.reduce((sum, sub) => sum + (sub.plans?.price || 0), 0) || 0;

    // 3. Get Upcoming Appointments
    const { data: upcomingMeetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('id, requested_time, profiles ( full_name )')
        .eq('status', 'CONFIRMED')
        .gte('requested_time', new Date().toISOString())
        .order('requested_time', { ascending: true })
        .limit(5); // Show the next 5 upcoming meetings

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Dashboard
            </h1>
            <p className="text-amber-400 text-sm uppercase font-semibold mb-8">
                YOUR BUSINESS AT A GLANCE
            </p>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Active Clients Card */}
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-400">Total Active Clients</p>
                        <UsersIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-white">
                        {activeClientsCount ?? 0}
                    </p>
                </div>

                {/* Monthly Revenue Card */}
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-400">Revenue (This Month)</p>
                        <BanknotesIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-white">
                        ₹{(monthlyRevenue / 100).toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Upcoming Appointments List */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Upcoming Appointments</h2>
                <div className="bg-gray-900/50 rounded-2xl border border-gray-700">
                    <ul className="divide-y divide-gray-700">
                        {upcomingMeetings && upcomingMeetings.length > 0 ? (
                            upcomingMeetings.map((meeting: any) => (
                                <li key={meeting.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4">
                                    <div>
                                        <p className="font-semibold text-white">{meeting.profiles?.full_name || 'Unnamed Client'}</p>
                                        <p className="text-sm text-gray-400">
                                            {new Date(meeting.requested_time).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <Link href={`/admin/clients/${meeting.profiles?.id}`} className="text-sm font-medium text-amber-400 hover:text-amber-300">
                                        View Client &rarr;
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <p className="text-center text-gray-400 py-10">No upcoming appointments scheduled.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
