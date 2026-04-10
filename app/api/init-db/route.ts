import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This endpoint helps initialize the database tables
// For security, this should be run only once during setup

export async function POST(request: Request) {
  try {
    // Check for authorization (simple key check)
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.DB_INIT_SECRET || 'init-smart-lms-db';
    
    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { 
          error: 'Missing Supabase credentials',
          message: 'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables',
          instructions: 'You need to run the SQL migration manually in the Supabase SQL Editor. Copy the contents of /scripts/001-setup-tables.sql and execute it in your Supabase dashboard.'
        }, 
        { status: 500 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test connection by checking if profiles table exists
    const { error: testError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError && testError.code === '42P01') {
      // Table doesn't exist
      return NextResponse.json({
        success: false,
        message: 'Database tables not found. Please run the SQL migration manually.',
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the contents of /scripts/001-setup-tables.sql',
          '4. Click "Run" to execute the migration'
        ]
      }, { status: 400 });
    }

    if (testError) {
      return NextResponse.json({
        success: false,
        error: testError.message,
        code: testError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database is properly configured!'
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database initialization endpoint',
    usage: 'POST with Authorization: Bearer <DB_INIT_SECRET>',
    alternative: 'Run the SQL in /scripts/001-setup-tables.sql manually in Supabase SQL Editor'
  });
}
