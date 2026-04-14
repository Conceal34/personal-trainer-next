"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { Database } from "@/types/database";

// Extract base types from the generated Database interface
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type Plan = Database["public"]["Tables"]["plans"]["Row"];
type WorkoutPlan = Database["public"]["Tables"]["workout_plans"]["Row"];
type Meeting = Database["public"]["Tables"]["meetings"]["Row"];

// Helper type for our fetched data
export type ClientData = Profile & {
  // Nested joins in Supabase return as arrays of these types
  subscriptions: (Subscription & { plans: Plan | null })[];
  workout_plans: WorkoutPlan[];
  meetings: Meeting[];
};

type SortKey =
  | "full_name"
  | "subscription_plan"
  | "subscription_status"
  | "workout_assigned"
  | "next_meeting";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Sorting state
  const [sortBy, setSortBy] = useState<SortKey>("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `id, full_name, email, subscriptions(status, plans(name)), workout_plans(id), meetings(status, requested_time)`,
        )
        .eq("role", "CLIENT");

      if (error) {
        console.error("Error fetching clients:", error);
      } else {
        setClients(data as Client[]);
      }
      setIsLoading(false);
    };
    fetchClients();
  }, []);

  // This hook now only handles sorting
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;

      switch (sortBy) {
        case "full_name":
          return (a.full_name || "").localeCompare(b.full_name || "") * dir;
        case "subscription_plan":
          return (
            (a.subscriptions[0]?.plans?.name || "").localeCompare(
              b.subscriptions[0]?.plans?.name || "",
            ) * dir
          );
        case "subscription_status":
          return (
            (a.subscriptions[0]?.status || "INACTIVE").localeCompare(
              b.subscriptions[0]?.status || "INACTIVE",
            ) * dir
          );
        case "workout_assigned":
          return (a.workout_plans.length - b.workout_plans.length) * dir;
        case "next_meeting":
          const meetingA = a.meetings.find(
            (m) =>
              m.status === "CONFIRMED" &&
              new Date(m.requested_time) > new Date(),
          );
          const meetingB = b.meetings.find(
            (m) =>
              m.status === "CONFIRMED" &&
              new Date(m.requested_time) > new Date(),
          );
          const dateA = meetingA
            ? new Date(meetingA.requested_time).getTime()
            : Infinity;
          const dateB = meetingB
            ? new Date(meetingB.requested_time).getTime()
            : Infinity;
          return (dateA - dateB) * dir;
        default:
          return 0;
      }
    });
  }, [clients, sortBy, sortDirection]);

  // Handler for clicking on sortable headers
  const handleSort = (column: SortKey) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-400";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
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
                <th className="p-4">
                  <button
                    onClick={() => handleSort("full_name")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Name{" "}
                    <ChevronUpDownIcon
                      className={`h-4 w-4 transition-colors ${sortBy === "full_name" ? "text-white" : "text-gray-600"}`}
                    />
                  </button>
                </th>
                <th className="p-4">Email</th>
                <th className="p-4">
                  <button
                    onClick={() => handleSort("subscription_plan")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Subscription{" "}
                    <ChevronUpDownIcon
                      className={`h-4 w-4 transition-colors ${sortBy === "subscription_plan" ? "text-white" : "text-gray-600"}`}
                    />
                  </button>
                </th>
                <th className="p-4 text-center">
                  <button
                    onClick={() => handleSort("workout_assigned")}
                    className="flex items-center gap-1 hover:text-white mx-auto"
                  >
                    Workout{" "}
                    <ChevronUpDownIcon
                      className={`h-4 w-4 transition-colors ${sortBy === "workout_assigned" ? "text-white" : "text-gray-600"}`}
                    />
                  </button>
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleSort("next_meeting")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Next Meeting{" "}
                    <ChevronUpDownIcon
                      className={`h-4 w-4 transition-colors ${sortBy === "next_meeting" ? "text-white" : "text-gray-600"}`}
                    />
                  </button>
                </th>
                <th className="p-4">
                  <button
                    onClick={() => handleSort("subscription_status")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Status{" "}
                    <ChevronUpDownIcon
                      className={`h-4 w-4 transition-colors ${sortBy === "subscription_status" ? "text-white" : "text-gray-600"}`}
                    />
                  </button>
                </th>
                <th className="p-4">
                  <span className="sr-only">View Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-10 text-gray-400">
                    Loading clients...
                  </td>
                </tr>
              ) : (
                sortedClients.map((client) => {
                  const subscriptionStatus =
                    client.subscriptions[0]?.status?.toUpperCase() ||
                    "INACTIVE";
                  const subscriptionPlan =
                    client.subscriptions[0]?.plans?.name || "No Plan";
                  const hasWorkout = client.workout_plans.length > 0;
                  const nextMeeting = client.meetings.find(
                    (m) =>
                      m.status === "CONFIRMED" &&
                      new Date(m.requested_time) > new Date(),
                  );

                  return (
                    <tr
                      key={client.id}
                      className="border-b border-gray-800 hover:bg-black/20"
                    >
                      <td className="p-4 font-medium text-white">
                        {client.full_name || "N/A"}
                      </td>
                      <td className="p-4 text-gray-300">{client.email}</td>
                      <td className="p-4 text-gray-300">{subscriptionPlan}</td>
                      <td className="p-4 text-center">
                        {hasWorkout ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-400 inline-block" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-600 inline-block" />
                        )}
                      </td>
                      <td className="p-4 text-gray-300">
                        {nextMeeting ? (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-5 w-5 text-amber-400" />
                            <span>
                              {new Date(
                                nextMeeting.requested_time,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span>No upcoming</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(subscriptionStatus)}`}
                        >
                          {subscriptionStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-gray-500 hover:text-amber-400 transition-colors"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {!isLoading && sortedClients.length === 0 && (
            <p className="text-center text-gray-400 py-10">
              No clients have been added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
