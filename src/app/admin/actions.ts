'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Define the shape of the plan data we expect from the form
interface WorkoutDay {
  id: string;
  dayTitle: string;
  exercises: {
    id: string;
    name: string;
    sets: string;
    reps: string;
  }[];
}

interface PlanData {
  clientId: string;
  planTitle: string;
  days: WorkoutDay[];
}

export async function createWorkoutPlan(planData: PlanData) {
  // 1. Validate the data on the server
  if (!planData.clientId || !planData.planTitle || planData.days.length === 0) {
    return { success: false, message: 'Client, title, and at least one day are required.' };
  }

  const supabase = await createClient();

  // 2. Prepare the data for insertion
  const { clientId, planTitle, days } = planData;
  const content = { days }; // The entire 'days' array is stored in the JSONB 'content' column

  // 3. Insert into the database
  const { error } = await supabase
    .from('workout_plans')
    .insert({
      client_id: clientId,
      title: planTitle,
      content: content,
    });

  if (error) {
    console.error('Supabase error:', error);
    return { success: false, message: 'Database error: Could not create plan.' };
  }

  // 4. Revalidate the path to show the new data if we were displaying a list
  revalidatePath('/admin/workouts');
  
  return { success: true, message: 'Workout plan created successfully!' };
}

// function to approve a meeting
export async function approveMeeting(meetingId: string) {
  if (!meetingId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('meetings')
    .update({ status: 'CONFIRMED' })
    .eq('id', meetingId);

  if (error) {
    console.error('Supabase error:', error);
    return;
  }

  revalidatePath('/admin/meetings');
  revalidatePath('/dashboard/client'); // Also revalidate client's view
}

// Function to Deny a Meeting
export async function denyMeeting(meetingId: string) {
  if (!meetingId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('meetings')
    .update({ status: 'CANCELLED' })
    .eq('id', meetingId);
  
  if (error) {
    console.error('Supabase error:', error);
    return;
  }

  revalidatePath('/admin/meetings');
  revalidatePath('/dashboard/client'); // Also revalidate client's view
}

export async function getWorkoutPlanForClient(clientId: string) {
  if (!clientId) return null;

  const supabase = await createClient();
  const { data: workoutPlan, error } = await supabase
    .from('workout_plans')
    .select('title, content')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // It's normal for a client to not have a plan, so we don't log the "not found" error
    if (error.code !== 'PGRST116') {
      console.error('Error fetching workout plan:', error);
    }
    return null;
  }
  
  return workoutPlan;
}

export async function sendMessageToClient(receiverId: string, content: string) {
  if (!receiverId || !content.trim()) return;
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // Not authenticated

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: session.user.id,
      receiver_id: receiverId,
      content,
    });
  
  if (error) { console.error("Supabase error:", error); return; }

  // Revalidate the chat page to show the new message
  revalidatePath(`/admin/chat`);
}

export async function getMessagesForClient(clientId: string) {
  if (!clientId) return [];
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const adminId = session.user.id;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`(sender_id.eq.${adminId},receiver_id.eq.${clientId}),(sender_id.eq.${clientId},receiver_id.eq.${adminId})`)
    .order('created_at');

  if (error) { console.error("Error fetching messages:", error); return []; }
  
  return data;
}

