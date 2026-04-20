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

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find items expiring in the next hour that haven't been notified yet
    const { data: expiringItems } = await supabase
      .from('saving_list_items')
      .select('id, user_id, store_name')
      .lte('expires_at', oneHourFromNow.toISOString())
      .gte('expires_at', now.toISOString())
      .eq('notified_expiry', false);

    // Group by user_id
    const byUser: Record<string, { ids: string[]; storeNames: string[] }> = {};
    for (const item of expiringItems || []) {
      if (!byUser[item.user_id]) byUser[item.user_id] = { ids: [], storeNames: [] };
      byUser[item.user_id].ids.push(item.id);
      byUser[item.user_id].storeNames.push(item.store_name);
    }

    let sent = 0;

    for (const [userId, { ids, storeNames }] of Object.entries(byUser)) {
      // Get device tokens for this user
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', userId);

      const count = storeNames.length;
      const preview = storeNames.slice(0, 2).join(', ') + (count > 2 ? ` +${count - 2} more` : '');

      const payload: FcmPayload = {
        title: count === 1
          ? 'Your saving list item expires soon! 🛒'
          : `${count} saving list items expire soon! 🛒`,
        body: `${preview} — log your savings before they're removed.`,
      };

      for (const row of tokens || []) {
        const ok = await sendFcmNotification(row.token, payload, fcmServerKey);
        if (ok) sent++;
      }

      // Mark items as notified
      await supabase
        .from('saving_list_items')
        .update({ notified_expiry: true })
        .in('id', ids);
    }

    // Delete items that have already expired
    await supabase
      .from('saving_list_items')
      .delete()
      .lt('expires_at', now.toISOString());

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
