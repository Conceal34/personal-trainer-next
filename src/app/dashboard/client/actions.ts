'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function requestMeeting(requestedTime: string) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, message: 'Not authenticated.' };
  }
  const userId = session.user.id;

  // --- Start of Validation ---
  if (!requestedTime) {
    return { success: false, message: 'Please select a date and time.' };
  }
  
  const requestedDate = new Date(requestedTime);
  const now = new Date();

  if (requestedDate < now) {
    return { success: false, message: 'Cannot schedule a meeting in the past.' };
  }

  const requestedHour = requestedDate.getHours();
  if (requestedHour >= 0 && requestedHour < 6) {
    return { success: false, message: 'Booking is unavailable between 12 AM and 6 AM.' };
  }

  // Fetch all confirmed meetings to check for conflicts
  const { data: confirmedMeetings, error: fetchError } = await supabase
    .from('meetings')
    .select('requested_time')
    .eq('status', 'CONFIRMED');

  if (fetchError) {
    console.error('Error fetching confirmed meetings:', fetchError);
    return { success: false, message: 'Could not verify schedule. Please try again.' };
  }
  
  // Check for conflicts with a 30-minute buffer
  for (const meeting of confirmedMeetings) {
    const confirmedTime = new Date(meeting.requested_time);
    const bufferEndTime = new Date(confirmedTime.getTime() + 30 * 60 * 1000); // 30 minutes after

    if (requestedDate >= confirmedTime && requestedDate < bufferEndTime) {
      return { success: false, message: 'This time slot is too close to another confirmed meeting. Please choose a later time.' };
    }
  }


  const { error } = await supabase.from('meetings').insert({
    client_id: userId,
    requested_time: requestedTime,
    status: 'PENDING'
  });

  if (error) {
    console.error('Supabase error:', error);
    return { success: false, message: 'Database error: Could not request meeting.' };
  }

  revalidatePath('/dashboard/client');
  return { success: true, message: 'Meeting requested successfully!' };
}

export async function sendMessage(content: string) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, message: 'Not authenticated.' };
  }

  // Find the admin's ID to set as the receiver
  const { data: admin, error: adminError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'ADMIN')
    .limit(1)
    .single();

  if (adminError || !admin) {
    return { success: false, message: 'Could not find the admin account.' };
  }

  // Insert the message
  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: session.user.id,
      receiver_id: admin.id,
      content: content,
    });

  if (error) {
    console.error('Supabase error:', error);
    return { success: false, message: 'Database error: Could not send message.' };
  }

  revalidatePath('/dashboard/client');
  return { success: true };
}