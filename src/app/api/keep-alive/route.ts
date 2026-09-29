import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Optional: Protect the endpoint if a secret is provided
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new NextResponse('Missing Supabase credentials', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch a single row to ensure database activity
    const { data, error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      console.error('Supabase keep-alive error:', error);
      return new NextResponse('Error pinging database', { status: 500 });
    }

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Keep-alive error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
