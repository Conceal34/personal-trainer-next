import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/src/app/auth/actions';
import { Button } from '@/src/app/components/button';
import { MeetingScheduler } from '@/src/app/components/client/MeetingScheduler';
import { ChatBox } from '@/src/app/components/client/ChatBox';

export default async function ClientDashboard() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { redirect('/auth'); }

    const userId = session.user.id;

    // Fetch all necessary data concurrently for better performance
    const [
        profileRes,
        workoutPlanRes,
        myMeetingsRes,
        allConfirmedMeetingsRes,
        messagesRes,
        adminRes
    ] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', userId).single(),
        supabase.from('workout_plans').select('title, content').eq('client_id', userId).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('meetings').select('id, requested_time, status').eq('client_id', userId).order('requested_time', { ascending: false }),
        supabase.from('meetings').select('requested_time').eq('status', 'CONFIRMED'),
        supabase.from('messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at'),
        supabase.from('profiles').select('id').eq('role', 'ADMIN').single()
    ]);

    const profile = profileRes.data;
    const workoutPlan = workoutPlanRes.data;
    const myMeetings = myMeetingsRes.data;
    const allConfirmedMeetings = allConfirmedMeetingsRes.data;
    const messages = messagesRes.data;
    const admin = adminRes.data;

    return (
        <div className="bg-black text-white min-h-screen">
            <header className="bg-gray-900/50 border-b border-gray-700">
                <div className="w-full max-w-7xl mx-auto p-4 px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-white">Client Dashboard</h1>
                    <form action={logout}>
                        <Button type="submit" variant="outline" size="sm">Log Out</Button>
                    </form>
                </div>
            </header>
            <main className="w-full max-w-7xl mx-auto p-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome, {profile?.full_name || 'Client'}!</h2>
                        <p className="text-gray-400">Your journey to greatness continues here.</p>
                    </div>
                    <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700">
                        <h3 className="text-2xl font-bold text-amber-400 mb-6">{workoutPlan ? workoutPlan.title : 'Your Workout Plan'}</h3>
                        {workoutPlan && workoutPlan.content.days ? (
                            <div className="space-y-6">
                                {workoutPlan.content.days.map((day: any, dayIndex: number) => (
                                    <div key={day.id || dayIndex} className="bg-black/20 p-4 rounded-lg">
                                        <h4 className="font-semibold text-lg text-white mb-3">{day.dayTitle || `Day ${dayIndex + 1}`}</h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm text-left">
                                                <thead className="border-b border-gray-700 text-gray-400">
                                                    <tr>
                                                        <th className="p-2">EXERCISE</th>
                                                        <th className="p-2 text-center">SETS</th>
                                                        <th className="p-2 text-center">REPS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {day.exercises.map((exercise: any, exIndex: number) => (
                                                        <tr key={exercise.id || exIndex} className="border-b border-gray-800">
                                                            <td className="p-2 font-medium">{exercise.name}</td>
                                                            <td className="p-2 text-center">{exercise.sets}</td>
                                                            <td className="p-2 text-center">{exercise.reps}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-400">Your trainer has not assigned a workout plan yet.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-8">
                    {admin?.id ? (
                        <ChatBox
                            initialMessages={messages || []}
                            userId={userId}
                        />
                    ) : (
                        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 text-center">
                            <p className="text-gray-400">Chat is currently unavailable.</p>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-3">
                    <MeetingScheduler
                        myMeetings={myMeetings || []}
                        allConfirmedMeetings={allConfirmedMeetings || []}
                    />
                </div>
            </main>
        </div>
    );
}
