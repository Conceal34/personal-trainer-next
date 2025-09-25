'use client';

import { approveMeeting, denyMeeting } from '@/src/app/admin/actions';
import { Button } from '@/src/app/components/button';

interface MeetingControlsProps {
    meetingId: string;
    status: string;
}

export function MeetingControls({ meetingId, status }: MeetingControlsProps) {
    // Only show controls for pending meetings
    if (status !== 'PENDING') {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <form action={() => approveMeeting(meetingId)}>
                <Button type="submit" size="sm">Approve</Button>
            </form>
            <form action={() => denyMeeting(meetingId)}>
                <Button type="submit" variant="outline" size="sm">Deny</Button>
            </form>
        </div>
    );
}