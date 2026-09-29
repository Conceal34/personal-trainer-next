"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProgressChart } from "@/app/components/admin/ProgressChart";

export function ClientMetrics({ clientId }: { clientId: string }) {
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workout_logs")
        .select("exercise_name")
        .eq("client_id", clientId);
        
      if (!error && data) {
        // Get unique exercise names
        const uniqueExercises = Array.from(new Set(data.map(d => d.exercise_name)));
        setExercises(uniqueExercises);
        if (uniqueExercises.length > 0) {
          setSelectedExercise(uniqueExercises[0]);
        }
      }
      setIsLoading(false);
    };
    fetchExercises();
  }, [clientId]);

  if (isLoading) return <div className="text-gray-400 py-4 text-center">Loading your performance metrics...</div>;

  if (exercises.length === 0) {
    return (
      <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700 text-center">
        <h3 className="text-2xl font-bold text-amber-400 mb-2">Performance Tracking</h3>
        <p className="text-gray-400">
          No workout logs found yet. Start logging your workouts to see your performance metrics here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <label htmlFor="exercise-select" className="text-sm font-semibold text-white">
          Filter by Exercise:
        </label>
        <select
          id="exercise-select"
          value={selectedExercise || ""}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="rounded-md bg-white/5 py-2 pl-3 pr-8 text-white ring-1 ring-white/10 text-sm"
        >
          {exercises.map((ex) => (
            <option key={ex} value={ex} className="text-black">{ex}</option>
          ))}
        </select>
      </div>
      
      <ProgressChart clientId={clientId} selectedExercise={selectedExercise} />
    </div>
  );
}
