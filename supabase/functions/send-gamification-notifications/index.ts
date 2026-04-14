import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FcmPayload {
  title: string;
  body: string;
}

async function sendFcmNotification(token: string, payload: FcmPayload, fcmServerKey: string) {
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${fcmServerKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: { title: payload.title, body: payload.body },
      priority: 'high',
    }),
  });
  return res.ok;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY') || '';

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
    const hour = new Date().getUTCHours();

    // Only send streak-at-risk notifications in the evening (UTC 17–20)
    if (hour < 17 || hour > 20) {
      return new Response(JSON.stringify({ skipped: 'outside notification window' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find users whose last_active_date is yesterday (streak at risk) and streak > 2
    const { data: atRiskProfiles } = await supabase
      .from('profiles')
      .select('id, current_streak, last_active_date')
      .eq('last_active_date', yesterday)
      .gt('current_streak', 2);

    let sent = 0;

    for (const profile of atRiskProfiles || []) {
      // Get their device tokens
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', profile.id);

      for (const row of tokens || []) {
        const payload: FcmPayload = {
          title: 'Your streak is at risk! 🔥',
          body: `Your ${profile.current_streak}-day streak ends tonight. Do a quick search to keep it going!`,
        };
        const ok = await sendFcmNotification(row.token, payload, fcmServerKey);
        if (ok) sent++;
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
