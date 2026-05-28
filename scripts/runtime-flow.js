const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const makeClient = () => createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const signIn = async (client, email, password) => {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    throw new Error(`Login failed for ${email}: ${error?.message || 'no user returned'}`);
  }
  return data.user;
};

const today = () => new Date().toISOString().slice(0, 10);

async function run() {
  console.log('--- Runtime flow test started ---');

  const adminClient = makeClient();
  const studentClient = makeClient();
  const facultyClient = makeClient();

  // 1) Admin creates an event
  console.log('\n[Admin] Logging in...');
  const adminUser = await signIn(adminClient, 'admin@mock.com', 'password123');
  console.log(`[Admin] Logged in as ${adminUser.id}`);

  const eventTitle = `Runtime Test Event ${Date.now()}`;
  console.log(`[Admin] Creating event: ${eventTitle}`);
  const { data: event, error: eventErr } = await adminClient
    .from('events')
    .insert({
      title: eventTitle,
      description: 'Runtime test event',
      date: today(),
      venue: 'Test Venue',
      created_by: adminUser.id,
    })
    .select('id, title')
    .single();

  if (eventErr) {
    throw new Error(`[Admin] Failed to create event: ${eventErr.message}`);
  }
  console.log(`[Admin] Event created: ${event.id}`);

  // 2) Student requests attendance twice
  console.log('\n[Student] Logging in...');
  const studentUser = await signIn(studentClient, 'student@mock.com', 'password123');
  console.log(`[Student] Logged in as ${studentUser.id}`);

  console.log('[Student] Submitting two attendance requests...');
  const { data: requests, error: requestErr } = await studentClient
    .from('attendance_requests')
    .insert([
      {
        event_id: event.id,
        student_id: studentUser.id,
        participation_type: 'participate',
        subsidiary_details: 'Runtime test request 1',
        status: 'pending',
      },
      {
        event_id: event.id,
        student_id: studentUser.id,
        participation_type: 'volunteer',
        subsidiary_details: 'Runtime test request 2',
        status: 'pending',
      },
    ])
    .select('id, status, participation_type');

  if (requestErr) {
    throw new Error(`[Student] Failed to create requests: ${requestErr.message}`);
  }

  console.log(`[Student] Created ${requests.length} requests.`);

  // 3) Faculty approves one and rejects one
  console.log('\n[Faculty] Logging in...');
  const facultyUser = await signIn(facultyClient, 'faculty@mock.com', 'password123');
  console.log(`[Faculty] Logged in as ${facultyUser.id}`);

  console.log('[Faculty] Fetching pending requests for this student/event...');
  const { data: pending, error: pendingErr } = await facultyClient
    .from('attendance_requests')
    .select('id, status, student_id, event_id')
    .eq('status', 'pending');

  if (pendingErr) {
    throw new Error(`[Faculty] Failed to fetch pending: ${pendingErr.message}`);
  }

  const related = pending.filter(
    (item) => item.event_id === event.id && item.student_id === studentUser.id
  );

  if (related.length < 2) {
    console.warn(
      `[Faculty] Warning: expected 2 pending requests, found ${related.length}.`
    );
  }

  const approveId = related[0]?.id;
  const rejectId = related[1]?.id;

  if (approveId) {
    console.log(`[Faculty] Approving request ${approveId}...`);
    const { error: approveErr } = await facultyClient
      .from('attendance_requests')
      .update({
        status: 'approved',
        reviewed_by: facultyUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', approveId);

    if (approveErr) {
      throw new Error(`[Faculty] Approval failed: ${approveErr.message}`);
    }
  }

  if (rejectId) {
    console.log(`[Faculty] Rejecting request ${rejectId}...`);
    const { error: rejectErr } = await facultyClient
      .from('attendance_requests')
      .update({
        status: 'rejected',
        reviewed_by: facultyUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', rejectId);

    if (rejectErr) {
      throw new Error(`[Faculty] Rejection failed: ${rejectErr.message}`);
    }
  }

  // 4) Faculty history check
  console.log('\n[Faculty] Fetching approval history...');
  const { data: history, error: historyErr } = await facultyClient
    .from('attendance_requests')
    .select('id, status, reviewed_by, event_id, student_id')
    .eq('reviewed_by', facultyUser.id)
    .in('status', ['approved', 'rejected']);

  if (historyErr) {
    throw new Error(`[Faculty] History fetch failed: ${historyErr.message}`);
  }

  const historyForEvent = history.filter(
    (item) => item.event_id === event.id && item.student_id === studentUser.id
  );

  console.log(`[Faculty] History entries found for this test: ${historyForEvent.length}`);

  console.log('\n--- Runtime flow test completed successfully ---');
}

run().catch((err) => {
  console.error(`\nRuntime flow failed: ${err.message}`);
  process.exit(1);
});
