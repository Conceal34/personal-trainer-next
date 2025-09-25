'use client';

import { useState } from 'react';
import { Button } from '@/src/app/components/button'; // FIX: Corrected import path
import { requestMeeting } from '@/src/app/dashboard/client/actions';

// Define the shape of a meeting object
type Meeting = {
    id: string;
    requested_time: string;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
};

// FIX: Define the missing type for confirmed meetings
type ConfirmedMeeting = {
    requested_time: string;
};

interface MeetingSchedulerProps {
    myMeetings: Meeting[];
    allConfirmedMeetings: ConfirmedMeeting[];
}

// FIX: Destructure the correct prop name ('myMeetings')
export function MeetingScheduler({ myMeetings, allConfirmedMeetings }: MeetingSchedulerProps) {
    const [requestedTime, setRequestedTime] = useState('');
    const [message, setMessage] = useState('');

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        if (!time) {
            setRequestedTime('');
            setMessage('');
            return;
        }

        const selectedDate = new Date(time);
        const selectedHour = selectedDate.getHours();

        // Check for 12 AM - 6 AM block
        if (selectedHour >= 0 && selectedHour < 6) {
            setMessage('Booking is not available between 12 AM and 6 AM.');
            return;
        }

        // FIX: Add the validation loop for confirmed meetings
        for (const meeting of allConfirmedMeetings) {
            const confirmedTime = new Date(meeting.requested_time);
            const bufferEndTime = new Date(confirmedTime.getTime() + 30 * 60 * 1000);

            if (selectedDate >= confirmedTime && selectedDate < bufferEndTime) {
                setMessage('This time slot is unavailable. Please choose another time.');
                return;
            }
        }
        
        setMessage('');
        setRequestedTime(time);
    };
    
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const result = await requestMeeting(requestedTime);
        setMessage(result.message);
        if (result.success) {
            setRequestedTime('');
        }
    };

    const getStatusChipClass = (status: Meeting['status']) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-500/20 text-green-400';
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700">
            <h3 className="text-2xl font-bold text-amber-400 mb-6">Schedule a Meeting</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 mb-8 pb-8 border-b border-gray-700">
                <input
                    type="datetime-local"
                    value={requestedTime}
                    onChange={handleTimeChange}
                    min={minDateTime}
                    required
                    className="w-full flex-grow rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-amber-500"
                />
                <Button type="submit" className="w-full sm:w-auto">Request Meeting</Button>
            </form>
            {message && <p className="text-sm text-center -mt-4 mb-4">{message}</p>}

            <h4 className="font-semibold text-lg text-white mb-4">Your Meetings</h4>
            <div className="space-y-3">
                {/* FIX: Use the correct variable name here */}
                {myMeetings.length > 0 ? myMeetings.map(meeting => (
                    <div key={meeting.id} className="flex justify-between items-center bg-black/20 p-3 rounded-md">
                        <p className="text-white">
                            {new Date(meeting.requested_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChipClass(meeting.status)}`}>
                            {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1).toLowerCase()}
                        </span>
                    </div>
                )) : (
                    <p className="text-gray-400 text-sm">You have no scheduled meetings.</p>
                )}
            </div>
        </div>
    );
}