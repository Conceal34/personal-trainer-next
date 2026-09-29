"use client";

import { useState } from "react";
import { Button } from "@/app/components/button";
import { logWorkout } from "@/app/dashboard/client/actions";

// --- TypeScript Type Definitions ---
type Exercise = { id: string; name: string; sets: string; reps: string };
type Day = { id: string; dayTitle: string; exercises: Exercise[] };
type WorkoutPlan = { title: string; content: { days: Day[] }; id: string };

type SetLog = { reps: string; weight: string };
type ExerciseLog = { sets: SetLog[]; notes: string };

export function WorkoutPlanDisplay({ plan }: { plan: WorkoutPlan }) {
  const [loggingDay, setLoggingDay] = useState<Day | null>(null);
  const [formState, setFormState] = useState<ExerciseLog[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to parse the number of sets from a string like "3" or "3-4"
  const getSetCount = (setsString: string): number => {
    return parseInt(setsString, 10) || 1;
  };

  const handleOpenLogger = (day: Day) => {
    setLoggingDay(day);
    // Pre-fill the form with the correct number of sets for each exercise
    const initialFormState = day.exercises.map((exercise) => {
      const setCount = getSetCount(exercise.sets);
      return {
        // Create an array with an entry for each set
        sets: Array.from({ length: setCount }, () => ({
          reps: exercise.reps,
          weight: "",
        })),
        notes: "",
      };
    });
    setFormState(initialFormState);
    setMessage("");
  };

  const handleCloseLogger = () => setLoggingDay(null);

  // Handler to update a specific set's input field
  const handleSetInputChange = (
    exIndex: number,
    setIndex: number,
    field: keyof SetLog,
    value: string,
  ) => {
    const newFormState = [...formState];
    newFormState[exIndex].sets[setIndex][field] = value;
    setFormState(newFormState);
  };

  // Handler to update the notes for an exercise
  const handleNotesChange = (exIndex: number, value: string) => {
    const newFormState = [...formState];
    newFormState[exIndex].notes = value;
    setFormState(newFormState);
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingDay) return;
    setIsSubmitting(true);

    // Convert the form state into the comma-separated strings the server expects
    const payload = {
      workoutPlanId: plan.id,
      exercises: loggingDay.exercises.map((exercise, index) => {
        const loggedExercise = formState[index];
        return {
          exerciseName: exercise.name,
          reps: loggedExercise.sets.map((s) => s.reps).join(", "),
          weight: loggedExercise.sets.map((s) => s.weight).join(", "),
          notes: loggedExercise.notes,
        };
      }),
    };

    const result = await logWorkout(payload);

    setMessage(result.message);
    setIsSubmitting(false);

    if (result.success) {
      setTimeout(() => handleCloseLogger(), 1500);
    }
  };

  return (
    <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700">
      <h3 className="text-2xl font-bold text-amber-400 mb-6">{plan.title}</h3>
      <div className="space-y-6">
        {plan.content.days.map((day, dayIndex) => (
          <div key={day.id || dayIndex} className="bg-black/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-lg text-white">
                {day.dayTitle || `Day ${dayIndex + 1}`}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenLogger(day)}
              >
                Log This Day
              </Button>
            </div>
            <div className="overflow-x-auto"></div>
          </div>
        ))}
      </div>

      {loggingDay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <h4 className="text-xl font-bold text-amber-400 mb-4 flex-shrink-0">
              Log: {loggingDay.dayTitle}
            </h4>
            <div className="space-y-6 overflow-y-auto flex-grow pr-2">
              {loggingDay.exercises.map((exercise, exIndex) => (
                <div key={exercise.id} className="p-4 bg-black/20 rounded-lg">
                  <p className="font-semibold text-white mb-4">
                    {exercise.name}
                  </p>
                  <div className="space-y-3">
                    {/* Loop to generate input fields for each set */}
                    {formState[exIndex]?.sets.map((set, setIndex) => (
                      <div
                        key={setIndex}
                        className="grid grid-cols-3 gap-3 items-center"
                      >
                        <span className="text-sm text-gray-400 font-medium">
                          Set {setIndex + 1}
                        </span>
                        <input
                          type="text"
                          value={set.reps}
                          onChange={(e) =>
                            handleSetInputChange(
                              exIndex,
                              setIndex,
                              "reps",
                              e.target.value,
                            )
                          }
                          placeholder="Reps"
                          className="rounded-md bg-white/5 py-1.5 px-3 text-white ring-1 ring-white/10"
                        />
                        <input
                          type="text"
                          value={set.weight}
                          onChange={(e) =>
                            handleSetInputChange(
                              exIndex,
                              setIndex,
                              "weight",
                              e.target.value,
                            )
                          }
                          placeholder="Weight (kg)"
                          className="rounded-md bg-white/5 py-1.5 px-3 text-white ring-1 ring-white/10"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-gray-400">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formState[exIndex]?.notes || ""}
                      onChange={(e) =>
                        handleNotesChange(exIndex, e.target.value)
                      }
                      placeholder="How did it feel?"
                      rows={2}
                      className="mt-1 block w-full rounded-md bg-white/5 py-2 px-3 text-white ring-1 ring-white/10"
                    ></textarea>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700 flex-shrink-0">
              {message && (
                <p className="text-center text-sm mr-auto self-center">
                  {message}
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseLogger}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitLog}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Log"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
