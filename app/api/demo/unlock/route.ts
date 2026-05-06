import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { code } = await request.json().catch(() => ({ code: '' }));
  const expected = process.env.DEMO_PASSCODE || '5596';

  if (!code || String(code) !== expected) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 });
  }

  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Demo user credentials not configured on the server' },
      { status: 500 },
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      { error: `Demo sign-in failed: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
