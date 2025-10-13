'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { google } from 'googleapis';
import { redirect } from 'next/navigation';


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

  // 1. Get the current admin's refresh token and the meeting details
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("Authentication Error: Admin user not found.");
    return;
  }

  // Fetch the admin's profile to get their saved Google refresh token
  const { data: profile } = await supabase
    .from('profiles')
    .select('google_refresh_token')
    .eq('id', user.id)
    .single();

  const refreshToken = profile?.google_refresh_token;
  if (!refreshToken) {
    console.error("Configuration Error: Admin's Google account is not connected. No refresh token found.");
    // return an error to the UI to prompt the admin to connect their account.
    return;
  }

  // Fetch the specific meeting's details, including the client's email from the related profiles table
  const { data: meeting } = await supabase
    .from('meetings')
    .select('*, profiles(email)') 
    .eq('id', meetingId)
    .single();

  if (!meeting || !meeting.profiles?.email) {
    console.error(`Data Error: Could not find meeting with ID ${meetingId} or client email is missing.`);
    return;
  }

  // 2. Set up the Google API client using the saved refresh token
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // 3. Create the Google Calendar event
  try {
    const startTime = new Date(meeting.requested_time);
    // Assuming all meetings are 30 minutes long
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); 

    const event = await calendar.events.insert({
      calendarId: 'primary', 
      sendNotifications: true,
      conferenceDataVersion: 1, 
      requestBody: {
        summary: `Training Session with ${meeting.profiles.email}`,
        description: 'Personal training session booked via Ascend Fitness app.',
        start: { 
          dateTime: startTime.toISOString(), 
          timeZone: 'Asia/Kolkata' 
        },
        end: { 
          dateTime: endTime.toISOString(), 
          timeZone: 'Asia/Kolkata' 
        },
        attendees: [{ email: meeting.profiles.email }], 
        conferenceData: {
          createRequest: {
            requestId: `ascend-fitness-meeting-${meeting.id}`, 
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    // Extract the generated Google Meet link from the API response
    const googleMeetLink = event.data.hangoutLink;
    if (!googleMeetLink) {
        throw new Error("Google Meet link was not generated.");
    }

    // 4. Update our database with the 'CONFIRMED' status and the new Meet link
    const { error: updateError } = await supabase
      .from('meetings')
      .update({ status: 'CONFIRMED', meeting_link: googleMeetLink })
      .eq('id', meetingId);

    if (updateError) {
      // If this fails, the DB is out of sync with the calendar. Critical to log. will add the Logs later during shipment of the product
      throw updateError;
    }

  } catch (error) {
    console.error('Fatal Error: Could not create Google Calendar event or update database.', error);
    // add logic here to update the meeting status to 'failed' in your DB to get to know that something went wrong.
    return;
  }

  // 5. Refresh the data on the admin and client pages
  revalidatePath('/admin/meetings');
  revalidatePath('/dashboard/client');
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
    .or(
      `and(sender_id.eq.${adminId},receiver_id.eq.${clientId})`,
      `and(sender_id.eq.${clientId},receiver_id.eq.${adminId})`
    )
    .order('created_at');

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  
  return data;
}
export async function getGoogleAuthUrl() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback` 
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: scopes,
  });


  redirect(url);
}

export async function getChartDataForClient(clientId: string, exerciseName: string) {
  if (!clientId || !exerciseName) return [];
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('workout_logs')
    .select('reps_completed, weight_used, logged_at')
    .eq('client_id', clientId)
    .eq('exercise_name', exerciseName)
    .order('logged_at', { ascending: true });

  if (error) {
    console.error("Error fetching chart data:", error);
    return [];
  }

  // Process the raw data into our four key metrics
  const chartData = logs.map(log => {
    const reps = log.reps_completed.split(',').map(r => parseInt(r.trim(), 10));
    const weights = log.weight_used.split(',').map(w => parseFloat(w.trim()));
    
    let totalVolume = 0;
    let singleSetVolumes: number[] = [];
    let maxWeight = 0;
    let repsAtMax = 0;

    for (let i = 0; i < reps.length; i++) {
      const currentRep = reps[i] || 0;
      const currentWeight = weights[i] || weights[0] || 0; // Fallback to first weight if not specified for all sets
      
      if (!isNaN(currentRep) && !isNaN(currentWeight)) {
        const setVolume = currentRep * currentWeight;
        totalVolume += setVolume;
        singleSetVolumes.push(setVolume);

        if (currentWeight > maxWeight) {
          maxWeight = currentWeight;
          repsAtMax = currentRep;
        }
      }
    }
    
    // Calculate E-1RM (Brzycki Formula) on the heaviest set
    const e1rm = repsAtMax > 1 ? maxWeight / (1.0278 - 0.0278 * repsAtMax) : maxWeight;
    const bestSetVolume = Math.max(...singleSetVolumes, 0);

    return {
      date: new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalVolume: isNaN(totalVolume) ? 0 : totalVolume,
      maxWeight: isNaN(maxWeight) ? 0 : maxWeight,
      singleSetVolume: isNaN(bestSetVolume) ? 0 : bestSetVolume,
      e1rm: isNaN(e1rm) ? 0 : Math.round(e1rm),
    };
  });
  
  return chartData;
}

export async function uploadMealPlan(formData: FormData) {
  const supabase = await createClient();
  const clientId = formData.get('clientId') as string;
  const file = formData.get('mealPlanFile') as File;

  // Basic validation to ensure we have the necessary data
  if (!clientId || !file || file.size === 0) {
    return { success: false, message: 'Client and file are required.' };
  }

  // 1. Upload the file to the 'meal-plans' bucket in Supabase Storage.
  // We'll store it in a folder named after the client's ID for organization.
  const filePath = `${clientId}/${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('meal-plans')
    .upload(filePath, file, { 
      upsert: true // 'upsert: true' means it will overwrite any existing file with the same name for this client.
    });

  if (uploadError) {
    console.error("Supabase Storage Error:", uploadError);
    return { success: false, message: 'Failed to upload file to storage.' };
  }

  // 2. Get the public URL of the file you just uploaded.
  const { data: { publicUrl } } = supabase.storage
    .from('meal-plans')
    .getPublicUrl(filePath);

  // 3. Save that public URL to the 'meal_plan_url' column in the client's profile.
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ meal_plan_url: publicUrl })
    .eq('id', clientId);

  if (updateError) {
    console.error("Supabase Database Error:", updateError);
    return { success: false, message: 'Failed to assign plan to client.' };
  }
  
  // 4. Refresh the data on relevant pages so the changes appear immediately.
  revalidatePath('/admin/meal-plans');
  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true, message: 'Meal plan uploaded successfully!' };
}
