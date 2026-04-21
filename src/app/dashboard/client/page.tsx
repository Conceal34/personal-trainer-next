import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { Button } from "@/app/components/button";
import { MeetingScheduler } from "@/app/components/client/MeetingScheduler";
import { ChatBox } from "@/app/components/client/ChatBox";
import { WorkoutPlanDisplay } from "@/app/components/client/WorkoutPlanDisplay";
import { WeeklyCheckin } from "@/app/components/client/WeeklyCheckin";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/auth");
  }

  const userId = session.user.id;

  // Fetch all necessary data concurrently for better performance
  const [
    profileRes,
    workoutPlanRes,
    myMeetingsRes,
    allConfirmedMeetingsRes,
    messagesRes,
    adminRes,
    lastCheckinRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, meal_plan_url")
      .eq("id", userId)
      .single(),
    supabase
      .from("workout_plans")
      .select("id, title, content")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("meetings")
      .select("id, requested_time, status, meeting_link")
      .eq("client_id", userId)
      .order("requested_time", { ascending: false }),
    supabase
      .from("meetings")
      .select("requested_time")
      .eq("status", "CONFIRMED"),
    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at"),
    supabase.from("profiles").select("id").eq("role", "ADMIN").single(),
    supabase
      .from("weekly_checkins")
      .select("created_at")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const profile = profileRes.data;
  const workoutPlan = workoutPlanRes.data;
  const myMeetings = myMeetingsRes.data;
  const allConfirmedMeetings = allConfirmedMeetingsRes.data;
  const messages = messagesRes.data;
  const admin = adminRes.data;
  const lastCheckin = lastCheckinRes.data;

  // Logic to determine if a check-in is due
  let isCheckinDue = true;
  if (lastCheckin) {
    const lastCheckinDate = new Date(lastCheckin.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (lastCheckinDate > sevenDaysAgo) {
      isCheckinDue = false;
    }
  }

  if (adminRes.error) {
    console.log("DEBUG: Admin fetch failed with:", adminRes.error.message);
  } else {
    console.log("DEBUG: Admin ID found:", adminRes.data?.id);
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Dashboard Header */}
      <header className="bg-gray-900/50 border-b border-gray-700">
        <div className="w-full max-w-7xl mx-auto p-4 px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Client Dashboard</h1>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Log Out
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content Area with Grid Layout */}
      <main className="w-full max-w-7xl mx-auto p-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
              Welcome, {profile?.full_name || "Client"}!
            </h2>
            <p className="text-gray-400">
              Your journey to greatness continues here.
            </p>
          </div>

          <WeeklyCheckin isCheckinDue={isCheckinDue} />

          {/* Workout Plan Section */}
          {workoutPlan ? (
            <WorkoutPlanDisplay plan={workoutPlan} />
          ) : (
            <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700 text-center py-10">
              <p className="text-gray-400">
                Your trainer has not assigned a workout plan yet.
              </p>
            </div>
          )}

          {/* Meal Plan Section */}
          {profile?.meal_plan_url && (
            <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700">
              <h3 className="text-2xl font-bold text-amber-400 mb-4">
                Your Meal Plan
              </h3>
              <p className="text-gray-300 mb-6">
                Your personalized meal plan is ready. Click the button below to
                view and download it.
              </p>
              <Button href={profile.meal_plan_url} target="_blank">
                View Meal Plan (PDF)
              </Button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Chat Box Section */}
          {admin?.id ? (
            <ChatBox initialMessages={messages || []} userId={userId} />
          ) : (
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 text-center">
              <p className="text-gray-400">Chat is currently unavailable.</p>
            </div>
          )}

          {/* Meeting Scheduler Section */}
          <MeetingScheduler
            myMeetings={myMeetings || []}
            allConfirmedMeetings={allConfirmedMeetings || []}
          />
        </div>
      </main>
    </div>
  );
}
