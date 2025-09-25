import { createClient } from '@/lib/supabase/server';
import { MeetingControls } from '@/src/app/components/admin/MeetingControls';

export default async function AdminMeetingsPage() {
    const supabase = await createClient();

    // Fetch all meetings and join with the profiles table to get the client's name
    const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
            id,
            requested_time,
            status,
            profiles ( full_name )
        `)
        .order('status', { ascending: true })
        .order('requested_time', { ascending: true });

    if (error) {
        console.error("Error fetching meetings:", error);
    }

    const getStatusChipClass = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/20 text-green-400';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            case 'cancelled': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Manage Meetings
            </h1>
            <p className="text-amber-400 text-sm uppercase font-semibold mb-8">
                APPROVE OR DENY CLIENT REQUESTS
            </p>

            <div className="bg-gray-900/50 rounded-2xl border border-gray-700">
                <div className="space-y-4 p-6">
                    {meetings && meetings.length > 0 ? meetings.map((meeting: any) => (
                        <div key={meeting.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/20 p-4 rounded-lg">
                            <div>
                                <p className="font-semibold text-white">
                                    {meeting.profiles?.full_name || 'Unnamed Client'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    {new Date(meeting.requested_time).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(meeting.status)}`}>
                                    {meeting.status}
                                </span>
                                <MeetingControls meetingId={meeting.id} status={meeting.status} />
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-400 text-center py-8">No meeting requests found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}