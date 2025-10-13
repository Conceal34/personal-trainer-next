'use client';

import { useState } from 'react';
import { Button } from '@/src/app/components/button';
import { submitCheckin } from '@/src/app/dashboard/client/actions';

interface WeeklyCheckinProps {
    isCheckinDue: boolean;
}

export function WeeklyCheckin({ isCheckinDue }: WeeklyCheckinProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [formState, setFormState] = useState({
        energyLevel: 3,
        motivationLevel: 3,
        biggestChallenge: '',
        winsForTheWeek: '',
    });
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isCheckinDue) {
        return (
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 text-center">
                <h3 className="font-semibold text-white">Weekly Check-in Complete!</h3>
                <p className="text-sm text-gray-400 mt-2">Great work this week. Your next check-in is due in a few days.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await submitCheckin(formState);
        setMessage(result.message);
        if (result.success) {
            setTimeout(() => setIsOpen(false), 1500);
        }
        setIsSubmitting(false);
    };

    return (
        <>
            <div className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/30 text-center">
                <h3 className="font-semibold text-amber-300">Your Weekly Check-in is Due!</h3>
                <p className="text-sm text-gray-400 mt-2">Take a moment to reflect on your week.</p>
                <Button onClick={() => setIsOpen(true)} className="mt-4" size="sm">Start Check-in</Button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 max-w-2xl w-full">
                        <h4 className="text-xl font-bold text-amber-400 mb-6">Weekly Check-in</h4>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Energy Level */}
                            <div>
                                <label className="text-sm font-semibold text-white">Rate your energy this week (1-5)</label>
                                <div className="flex justify-between mt-2">
                                    {[1, 2, 3, 4, 5].map(val => (
                                        <button type="button" key={val} onClick={() => setFormState({ ...formState, energyLevel: val })} className={`w-10 h-10 rounded-full transition-all ${formState.energyLevel === val ? 'bg-amber-500 text-black' : 'bg-gray-700 text-white'}`}>{val}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Motivation Level */}
                            <div>
                                <label className="text-sm font-semibold text-white">Rate your motivation this week (1-5)</label>
                                <div className="flex justify-between mt-2">
                                    {[1, 2, 3, 4, 5].map(val => (
                                        <button type="button" key={val} onClick={() => setFormState({ ...formState, motivationLevel: val })} className={`w-10 h-10 rounded-full transition-all ${formState.motivationLevel === val ? 'bg-amber-500 text-black' : 'bg-gray-700 text-white'}`}>{val}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Biggest Challenge */}
                            <div>
                                <label className="text-sm font-semibold text-white">What was your biggest challenge?</label>
                                <textarea value={formState.biggestChallenge} onChange={e => setFormState({ ...formState, biggestChallenge: e.target.value })} rows={3} className="mt-1 block w-full rounded-md bg-white/5 py-2 px-3 text-white ring-1 ring-white/10" />
                            </div>
                            {/* Wins for the week */}
                            <div>
                                <label className="text-sm font-semibold text-white">What was a win for you this week?</label>
                                <textarea value={formState.winsForTheWeek} onChange={e => setFormState({ ...formState, winsForTheWeek: e.target.value })} rows={3} className="mt-1 block w-full rounded-md bg-white/5 py-2 px-3 text-white ring-1 ring-white/10" />
                            </div>
                            {message && <p className="text-center text-sm">{message}</p>}
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Check-in'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
