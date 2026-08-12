import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const user = String(username || '').trim();
    const pass = String(password || '').trim();

    if (!user || !pass) {
      return NextResponse.json({ success: false, error: 'חסרים פרטים' }, { status: 400 });
    }

    if (user === 'admin' && pass === '123456') {
      return NextResponse.json({ success: true, role: 'admin' });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { success: false, error: 'חסרות הגדרות Supabase בשרת' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('username', user)
      .eq('password', pass)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'שם משתמש או סיסמה שגויים' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      role: 'client',
      event: {
        id: data.id,
        owners: data.owners || data.title || '',
        title: data.title || data.owners || '',
        username: data.username,
        password: data.password,
        isActive: data.is_active === true || data.is_active === 'כן',
        hasTransport: data.has_transport || 'לא',
        hasSeparation: data.has_separation || 'לא',
        eventType: data.event_type || '',
        eventDate: data.event_date || '',
        time: data.time || '',
        hallName: data.hall_name || '',
        city: data.city || '',
        rsvpMode: data.rsvp_mode || 'רגיל',
        clientPhone: data.client_phone || '',
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'שגיאת שרת' },
      { status: 500 }
    );
  }
}