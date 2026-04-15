"use client";
import { Database } from "@/types/database";
import { useCallback, useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ProgressChart } from "@/app/components/admin/ProgressChart";
import { MealPlanUploader } from "@/app/components/admin/MealPlanUploader";
import { Button } from "@/app/components/button";

// Extract base types from the generated Database interface
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type Plan = Database["public"]["Tables"]["plans"]["Row"];
type WorkoutPlan = Database["public"]["Tables"]["workout_plans"]["Row"];
type WorkoutLog = Database["public"]["Tables"]["workout_logs"]["Row"];
type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
type WeeklyCheckin = Database["public"]["Tables"]["weekly_checkins"]["Row"];

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
}

interface WorkoutDay {
  dayTitle: string;
  exercises: Exercise[];
}

// Combine for your state
type ClientWithDetails = Profile & {
  workout_plans: Array<
    Omit<WorkoutPlan, "content"> & { content: { days: WorkoutDay[] } }
  >;
  workout_logs: WorkoutLog[];
};

// Helper type for our fetched data
export type ClientData = Profile & {
  // Nested joins in Supabase return as arrays of these types
  subscriptions: (Subscription & { plans: Plan | null })[];
  workout_plans: WorkoutPlan[];
  meetings: Meeting[];
  workout_logs: WorkoutLog[];
  weekly_checkins: WeeklyCheckin[];
};

// Helper function to calculate E-1RM for a single log entry
const calculateE1RM = (log: {
  reps_completed: string;
  weight_used: string;
}): number => {
  const reps = log.reps_completed.split(",").map((r) => parseInt(r.trim(), 10));
  const weights = log.weight_used.split(",").map((w) => parseFloat(w.trim()));
  let maxWeight = 0;
  let repsAtMax = 0;
  for (let i = 0; i < weights.length; i++) {
    if (!isNaN(weights[i]) && weights[i] > maxWeight) {
      maxWeight = weights[i];
      repsAtMax = reps[i] || 0;
    }
  }
  if (repsAtMax === 0 || maxWeight === 0) return 0;
  const e1rm =
    repsAtMax > 1 ? maxWeight / (1.0278 - 0.0278 * repsAtMax) : maxWeight;
  return isNaN(e1rm) ? 0 : Math.round(e1rm);
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [dayFilter, setDayFilter] = useState("all");
  const [exerciseFilter, setExerciseFilter] = useState("all");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const fetchClientData = useCallback(async () => {
    const { clientId } = await params;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `*, workout_plans(*), workout_logs(*), weekly_checkins(*), subscriptions(*, plans(*)), meetings(*)`,
      )
      .eq("id", clientId)
      .single();

    if (error) {
      console.error(error);
    } else {
      setClient(data as unknown as ClientWithDetails);
    }
  }, [params]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const uniqueDays = useMemo(() => {
    if (!client?.workout_plans[0]?.content?.days) return [];
    return client.workout_plans[0].content.days.map(
      (day: WorkoutDay) => day.dayTitle,
    );
  }, [client?.workout_plans]);
  const exercisesForDropdown = useMemo(() => {
    if (!client?.workout_plans[0]?.content?.days) return [];
    if (dayFilter === "all") {
      const allExercises = client.workout_plans[0].content.days.flatMap(
        (day: WorkoutDay) => day.exercises.map((ex: Exercise) => ex.name),
      );
      return [...new Set(allExercises)];
    }
    return (
      client.workout_plans[0].content.days
        .find((day: WorkoutDay) => day.dayTitle === dayFilter)
        ?.exercises.map((ex: Exercise) => ex.name) || []
    );
  }, [client?.workout_plans, dayFilter]);
  useEffect(() => {
    setExerciseFilter("all");
  }, [dayFilter]);
  const groupedLogs = useMemo(() => {
    if (!client?.workout_logs) return {};
    let filteredLogs = client.workout_logs;
    if (dayFilter !== "all" && client.workout_plans.length > 0) {
      const plan = client.workout_plans[0];

      const exercisesForDay =
        plan.content.days
          .find((d: WorkoutDay) => d.dayTitle === dayFilter)
          ?.exercises.map((ex: Exercise) => ex.name) || [];

      filteredLogs = filteredLogs.filter((log) =>
        exercisesForDay.includes(log.exercise_name),
      );
    }
    if (exerciseFilter !== "all") {
      filteredLogs = filteredLogs.filter(
        (log) => log.exercise_name === exerciseFilter,
      );
    }
    return filteredLogs.reduce(
      (acc: Record<string, WorkoutLog[]>, log: WorkoutLog) => {
        const date = new Date(log.logged_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        });

        if (!acc[date]) {
          acc[date] = [];
        }

        acc[date].push(log);
        return acc;
      },
      {} as Record<string, WorkoutLog[]>,
    );
  }, [client?.workout_logs, dayFilter, exerciseFilter, client?.workout_plans]);
  const toggleDate = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  if (!client) {
    return (
      <div className="text-center text-white p-10">Loading client data...</div>
    );
  }

  const now = new Date();
  const upcomingMeetings = client.meetings
    .filter((m) => new Date(m.requested_time) > now && m.status === "CONFIRMED")
    .sort(
      (a, b) =>
        new Date(a.requested_time).getTime() -
        new Date(b.requested_time).getTime(),
    );
  const pastMeetings = client.meetings
    .filter((m) => new Date(m.requested_time) <= now)
    .sort(
      (a, b) =>
        new Date(b.requested_time).getTime() -
        new Date(a.requested_time).getTime(),
    );

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
        {client.full_name}
      </h1>
      <p className="text-amber-400 text-sm uppercase font-semibold mb-8">
        {client.email}
      </p>

      {/* Top Section with Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link
          href={`/admin/workouts?clientId=${client.id}`}
          className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 hover:border-amber-400 transition-all block"
        >
          <h2 className="font-bold text-xl text-amber-400 mb-4">
            Assigned Workout Plan
          </h2>
          {client.workout_plans.length > 0 ? (
            <div className="text-gray-300">{client.workout_plans[0].title}</div>
          ) : (
            <p className="text-gray-400">
              No workout plan assigned. Click to create one.
            </p>
          )}
        </Link>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
          <h2 className="font-bold text-xl text-amber-400 mb-4">
            Subscription
          </h2>
          {client.subscriptions.length > 0 ? (
            <div className="text-gray-300">
              <p>Plan: {client.subscriptions[0].plans.name}</p>
              <p>Status: {client.subscriptions[0].status}</p>
            </div>
          ) : (
            <p className="text-gray-400">No active subscription.</p>
          )}
        </div>
      </div>

      {/* Two-column layout for logs and chart */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Workout Log History
          </h2>
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-gray-700">
              <div>
                <label
                  htmlFor="dayFilter"
                  className="text-xs font-semibold text-gray-400"
                >
                  Filter by Day
                </label>
                <select
                  id="dayFilter"
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white/5 py-2 pl-3 text-white ring-1 ring-white/10"
                >
                  <option value="all" className="text-black">
                    All Days
                  </option>
                  {uniqueDays.map((day) => (
                    <option key={day} value={day} className="text-black">
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="exerciseFilter"
                  className="text-xs font-semibold text-gray-400"
                >
                  Filter by Exercise
                </label>
                <select
                  id="exerciseFilter"
                  value={exerciseFilter}
                  onChange={(e) => setExerciseFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white/5 py-2 pl-3 text-white ring-1 ring-white/10"
                >
                  <option value="all" className="text-black">
                    All Exercises
                  </option>
                  {exercisesForDropdown.map((ex) => (
                    <option key={ex} value={ex} className="text-black">
                      {ex}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {Object.keys(groupedLogs).length > 0 ? (
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {Object.entries(groupedLogs).map(([date, logs]) => (
                  <li
                    key={date}
                    className="bg-black/20 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleDate(date)}
                      className="w-full flex justify-between items-center p-4 hover:bg-black/30"
                    >
                      <span className="font-semibold text-amber-400">
                        {date}
                      </span>
                      <span className="text-xs text-gray-400">
                        {logs.length}{" "}
                        {logs.length === 1 ? "exercise" : "exercises"} logged
                      </span>
                    </button>
                    {expandedDate === date && (
                      <div className="p-4 border-t border-gray-700 space-y-4">
                        {logs.map((log) => {
                          const e1rm = calculateE1RM(log);
                          return (
                            <div
                              key={log.id}
                              className="bg-gray-800/50 p-3 rounded-md"
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-semibold text-white">
                                  {log.exercise_name}
                                </p>
                                {e1rm > 0 && (
                                  <p className="text-sm font-bold text-amber-300">
                                    E-1RM: {e1rm} kg
                                  </p>
                                )}
                              </div>
                              <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-4 mt-1">
                                <p>
                                  <strong>Reps:</strong> {log.reps_completed}
                                </p>
                                <p>
                                  <strong>Weight:</strong> {log.weight_used}
                                </p>
                              </div>
                              {log.notes && (
                                <p className="text-sm text-gray-400 mt-2 pt-2 border-t border-gray-800">
                                  <strong>Notes:</strong> {log.notes}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No workout logs match the selected filters.
              </p>
            )}
          </div>
        </div>
        <div>
          <ProgressChart
            clientId={client.id}
            selectedExercise={exerciseFilter === "all" ? null : exerciseFilter}
          />
        </div>
      </div>

      {/* Integrated Meal Plan Management Section */}
      <div className="mt-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Meal Plan Management
        </h2>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
          {client.meal_plan_url ? (
            <div>
              <p className="text-gray-300 mb-4">
                This client has a meal plan assigned. You can view it or upload
                a new version to replace it.
              </p>
              <div className="flex gap-4 items-center mb-6">
                <Button href={client.meal_plan_url} target="_blank">
                  View Current Plan (PDF)
                </Button>
              </div>
              <h3 className="text-lg font-semibold text-white mt-6 mb-4 border-t border-gray-700 pt-6">
                Replace Plan:
              </h3>
              <MealPlanUploader
                clientId={client.id}
                onUploadSuccess={fetchClientData}
              />
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-4">
                This client does not have a meal plan. Upload a PDF to assign
                one.
              </p>
              <MealPlanUploader
                clientId={client.id}
                onUploadSuccess={fetchClientData}
              />
            </div>
          )}
        </div>
      </div>

      {/* meetings */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Meeting Schedule</h2>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Upcoming
              </h3>
              <ul className="space-y-2">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting: Meeting) => (
                    <li
                      key={meeting.id}
                      className="text-gray-300 flex justify-between bg-black/20 p-2 rounded-md"
                    >
                      <span>
                        {new Date(meeting.requested_time).toLocaleString(
                          "en-US",
                          { dateStyle: "medium", timeStyle: "short" },
                        )}
                      </span>
                      <span className="font-medium text-green-400">
                        {meeting.status}
                      </span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No upcoming meetings scheduled.
                  </p>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                History
              </h3>
              <ul className="space-y-2">
                {pastMeetings.length > 0 ? (
                  pastMeetings.map((meeting: Meeting) => (
                    <li
                      key={meeting.id}
                      className="text-gray-400 flex justify-between"
                    >
                      <span>
                        {new Date(meeting.requested_time).toLocaleString(
                          "en-US",
                          { dateStyle: "medium", timeStyle: "short" },
                        )}
                      </span>
                      <span>{meeting.status}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No meeting history.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* check-in */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Check-in History</h2>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
          {client.weekly_checkins.length > 0 ? (
            <ul className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {client.weekly_checkins.map((checkin: WeeklyCheckin) => (
                <li key={checkin.id} className="bg-black/20 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-amber-400 mb-2">
                    {new Date(checkin.created_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <p>
                      <strong>Energy:</strong>{" "}
                      <span className="font-bold">
                        {checkin.energy_level}/5
                      </span>
                    </p>
                    <p>
                      <strong>Motivation:</strong>{" "}
                      <span className="font-bold">
                        {checkin.motivation_level}/5
                      </span>
                    </p>
                  </div>
                  <div className="text-sm space-y-2 pt-3 border-t border-gray-700">
                    <p>
                      <strong className="text-gray-400">
                        Biggest Challenge:
                      </strong>{" "}
                      {checkin.biggest_challenge}
                    </p>
                    <p>
                      <strong className="text-gray-400">
                        Wins for the Week:
                      </strong>{" "}
                      {checkin.wins_for_the_week}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-8">
              This client has not submitted any weekly check-ins yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
