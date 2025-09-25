import { createClient } from '@/lib/supabase/server';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default async function AdminClientsPage() {
    const supabase = await createClient();

    const { data: clients, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            subscriptions ( status, plans ( name ) ),
            workout_plans ( id ),
            meetings ( status, requested_time )
        `)
        .eq('role', 'CLIENT')
        .order('full_name', { ascending: true });

    if (error) { console.error("Error fetching clients:", error); }

    const getSubscriptionStatus = (subscriptions: any[]) => {
        if (!subscriptions || subscriptions.length === 0) return { text: 'INACTIVE', plan: 'No Plan' };
        const firstSub = subscriptions[0];
        return {
            text: firstSub.status?.toUpperCase() || 'INACTIVE',
            plan: firstSub.plans?.name || 'No Plan'
        };
    };

    const getStatusChipClass = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-500/20 text-green-400';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Client Management
            </h1>
            <p className="text-amber-400 text-sm uppercase font-semibold mb-8">
                VIEW AND MANAGE ALL CLIENTS
            </p>

            <div className="bg-gray-900/50 rounded-2xl border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="border-b border-gray-700 text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Full Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Subscription</th>
                                <th className="p-4 text-center">Workout Assigned</th>
                                <th className="p-4">Next Meeting</th>
                                <th className="p-4">Status</th>
                                {/* 1. Add a new, empty header for the action icon */}
                                <th className="p-4"><span className="sr-only">View Details</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients && clients.map((client: any) => {
                                const subscription = getSubscriptionStatus(client.subscriptions);
                                const hasWorkout = client.workout_plans.length > 0;
                                const nextMeeting = client.meetings
                                    .filter((m: any) => m.status === 'CONFIRMED' && new Date(m.requested_time) > new Date())
                                    .sort((a: any, b: any) => new Date(a.requested_time).getTime() - new Date(b.requested_time).getTime())[0];

                                return (
                                    <tr key={client.id} className="border-b border-gray-800 hover:bg-black/20">
                                        {/* 2. Client's name is now plain text */}
                                        <td className="p-4 font-medium text-white">{client.full_name || 'N/A'}</td>
                                        <td className="p-4 text-gray-300">{client.email}</td>
                                        <td className="p-4 text-gray-300">{subscription.plan}</td>
                                        <td className="p-4 text-center">
                                            {hasWorkout ? <CheckCircleIcon className="h-5 w-5 text-green-400 inline-block" /> : <XCircleIcon className="h-5 w-5 text-gray-600 inline-block" />}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {nextMeeting ? (
                                                <div className="flex items-center gap-2">
                                                    <ClockIcon className="h-5 w-5 text-amber-400" />
                                                    <span>{new Date(nextMeeting.requested_time).toLocaleDateString()}</span>
                                                </div>
                                            ) : (<span>No upcoming meetings</span>)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(subscription.text)}`}>{subscription.text}</span>
                                        </td>
                                        {/* 3. Add a new cell at the end of the row */}
                                        <td className="p-4 text-right">
                                            {/* 4. Add the Link and Icon inside the new cell */}
                                            <Link href={`/admin/clients/${client.id}`} className="text-gray-500 hover:text-amber-400 transition-colors">
                                                <ChevronRightIcon className="h-5 w-5" />
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {(!clients || clients.length === 0) && <p className="text-center text-gray-400 py-10">No clients found.</p>}
                </div>
            </div>
        </div>
    );
}