import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link'; 

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
    const supabase = await createClient();

    // Fetch all data for this specific client
    const { data: client, error } = await supabase
        .from('profiles')
        .select(`
            *,
            subscriptions ( *, plans ( * ) ),
            workout_plans ( * ),
            meetings ( * )
        `)
        .eq('id', params.clientId)
        .single();

    if (error || !client) {
        notFound(); // If client not found, show a 404 page
    }

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                {client.full_name}
            </h1>
            <p className="text-amber-400 text-sm uppercase font-semibold mb-8">
                {client.email}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Workout Plan Details */}
                <Link
                    href={`/admin/workouts?clientId=${client.id}`}
                    className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 hover:border-amber-400 transition-all"
                >
                    <h2 className="font-bold text-xl text-amber-400 mb-4">Assigned Workout Plan</h2>
                    {client.workout_plans.length > 0 ? (
                        <div className="text-gray-300">{client.workout_plans[0].title}</div>
                    ) : <p className="text-gray-400">No workout plan assigned. Click to create one.</p>}
                </Link>

                {/* Subscription Details */}
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
                    <h2 className="font-bold text-xl text-amber-400 mb-4">Subscription</h2>
                    {client.subscriptions.length > 0 ? (
                        <div className="text-gray-300">
                            <p>Plan: {client.subscriptions[0].plans.name}</p>
                            <p>Status: {client.subscriptions[0].status}</p>
                        </div>
                    ) : <p className="text-gray-400">No active subscription.</p>}
                </div>

                {/* Meeting History */}
                <div className="lg:col-span-2 bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
                    <h2 className="font-bold text-xl text-amber-400 mb-4">Meeting History</h2>
                    <ul className="space-y-2">
                        {client.meetings.length > 0 ? client.meetings.map((meeting: any) => (
                            <li key={meeting.id} className="text-gray-300 flex justify-between">
                                <span>{new Date(meeting.requested_time).toLocaleString()}</span>
                                <span>{meeting.status}</span>
                            </li>
                        )) : <p className="text-gray-400">No meeting history.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
}