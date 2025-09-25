'use client';

import { useState, useEffect } from 'react';
import type { Client } from '@/src/app/admin/workouts/page';
import { Button } from '@/src/app/components/button';
import { PlusCircleIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { createWorkoutPlan, getWorkoutPlanForClient } from '@/src/app/admin/actions';

interface Exercise { id: string; name: string; sets: string; reps: string; }
interface WorkoutDay { id: string; dayTitle: string; exercises: Exercise[]; }
type FormState = { success: boolean; message: string; } | null;
interface WorkoutPlanFormProps {
    clients: Client[];
    preselectedClientId?: string; 
}

export function WorkoutPlanForm({ clients, preselectedClientId }: WorkoutPlanFormProps) {
    const [days, setDays] = useState<WorkoutDay[]>([]);
    const [clientId, setClientId] = useState<string>(preselectedClientId || ''); 
    const [planTitle, setPlanTitle] = useState<string>('');
    const [formState, setFormState] = useState<FormState>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);

    // --- Effect to load plan on initial render if client is pre-selected ---
    useEffect(() => {
        const loadPlan = async (id: string) => {
            setIsLoadingPlan(true);
            const plan = await getWorkoutPlanForClient(id);
            if (plan && plan.content?.days) {
                setPlanTitle(plan.title);
                setDays(plan.content.days);
            }
            setIsLoadingPlan(false);
        };

        if (preselectedClientId) {
            loadPlan(preselectedClientId);
        }
    }, [preselectedClientId]); 

    // --- Handler to load plan when selection changes manually ---
    const handleClientChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClientId = e.target.value;
        setClientId(newClientId);
        if (!newClientId) {
            setPlanTitle(''); setDays([]); return;
        }
        setIsLoadingPlan(true);
        setFormState(null);
        const plan = await getWorkoutPlanForClient(newClientId);
        if (plan && plan.content?.days) {
            setPlanTitle(plan.title);
            setDays(plan.content.days);
        } else {
            setPlanTitle(''); setDays([]);
        }
        setIsLoadingPlan(false);
    };

    // --- Other handler functions ---
    const addDay = () => setDays([...days, { id: crypto.randomUUID(), dayTitle: '', exercises: [] }]);
    const removeDay = (dayIndex: number) => setDays(days.filter((_, index) => index !== dayIndex));
    const addExercise = (dayIndex: number) => { const u = [...days]; u[dayIndex].exercises.push({ id: crypto.randomUUID(), name: '', sets: '', reps: '' }); setDays(u); };
    const removeExercise = (dayIndex: number, eIndex: number) => { const u = [...days]; u[dayIndex].exercises = u[dayIndex].exercises.filter((_, i) => i !== eIndex); setDays(u); };
    const handleDayTitleChange = (dIndex: number, val: string) => { const u = [...days]; u[dIndex].dayTitle = val; setDays(u); };
    const handleExerciseChange = (dIndex: number, eIndex: number, field: 'name' | 'sets' | 'reps', val: string) => { const u = [...days]; u[dIndex].exercises[eIndex][field] = val; setDays(u); };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFormState(null);
        const result = await createWorkoutPlan({ clientId, planTitle, days });
        setFormState(result);
        setIsSubmitting(false);
        if (result.success) {
            setDays([]); setClientId(''); setPlanTitle('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900/50 p-8 rounded-2xl border border-gray-700">
            <fieldset disabled={isSubmitting || isLoadingPlan} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Selection */}
                    <div>
                        <label htmlFor="client" className="block text-sm font-semibold text-white">Assign to Client</label>
                        <select id="client" name="client" value={clientId} onChange={handleClientChange} required className="mt-2 block w-full rounded-md border-0 bg-white/5 py-2 pl-3 pr-10 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-500">
                            <option value="" disabled className="text-black">Select a client...</option>
                            {clients.map((client) => (<option key={client.id} value={client.id} className="text-black">{client.full_name || 'Unnamed Client'}</option>))}
                        </select>
                    </div>
                    {/* Plan Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-white">Plan Title</label>
                        <input type="text" name="title" id="title" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} placeholder={isLoadingPlan ? "Loading plan..." : "e.g., Phase 1: Hypertrophy"} required className="mt-2 block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-500" />
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-white">Workout Structure</h2>
                        <Button type="button" variant="outline" size="sm" onClick={addDay}>
                            <PlusCircleIcon className="h-5 w-5 mr-2" /> Add Day
                        </Button>
                    </div>
                    <div className="space-y-6">
                        {days.length > 0 ? days.map((day, dayIndex) => (
                            <div key={day.id} className="bg-black/20 p-4 rounded-lg border border-gray-800 space-y-4">
                                <div className="flex items-center gap-4">
                                    <input type="text" placeholder={`Day ${dayIndex + 1} Title (e.g., Push Day)`} value={day.dayTitle} onChange={(e) => handleDayTitleChange(dayIndex, e.target.value)} className="flex-grow rounded-md border-0 bg-white/5 py-2 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-500" />
                                    <button type="button" onClick={() => removeDay(dayIndex)} className="text-red-500 hover:text-red-400"><XCircleIcon className="h-6 w-6" /></button>
                                </div>
                                <div className="space-y-2 pl-4 border-l-2 border-gray-700">
                                    {day.exercises.map((exercise, exerciseIndex) => (
                                        <div key={exercise.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                                            <input type="text" placeholder="Exercise Name" value={exercise.name} onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, 'name', e.target.value)} className="sm:col-span-2 rounded-md border-0 bg-white/5 py-1.5 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-500" />
                                            <input type="text" placeholder="Sets" value={exercise.sets} onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, 'sets', e.target.value)} className="rounded-md border-0 bg-white/5 py-1.5 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-500" />
                                            <input type="text" placeholder="Reps" value={exercise.reps} onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, 'reps', e.target.value)} className="rounded-md border-0 bg-white/5 py-1.5 px-3 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-500" />
                                            <div className="flex justify-end"><button type="button" onClick={() => removeExercise(dayIndex, exerciseIndex)} className="text-gray-500 hover:text-red-500 p-1"><TrashIcon className="h-5 w-5" /></button></div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="ghost" size="sm" onClick={() => addExercise(dayIndex)}><PlusCircleIcon className="h-5 w-5 mr-2" /> Add Exercise</Button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
                                <p className="text-gray-400">No workout days added yet.</p>
                                <p className="text-sm text-gray-500">Click "Add Day" to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </fieldset>
            <div className="pt-6 border-t border-gray-700 flex items-center justify-end gap-4">
                {formState && (<p className={`${formState.success ? 'text-green-400' : 'text-red-400'} text-sm`}>{formState.message}</p>)}
                <Button type="submit" disabled={isSubmitting || isLoadingPlan}>
                    {isSubmitting ? 'Saving...' : 'Create & Assign Plan'}
                </Button>
            </div>
        </form>
    );
}
