/**
 * Supabase Edge Function for creating a creator profile.
 *
 * 1) Deploy this function to Supabase Edge Functions.
 * 2) Add a secret named `SUPABASE_SERVICE_ROLE_KEY` in the Supabase Functions secrets UI.
 * 3) The frontend should call `/functions/v1/create-creator-profile` after signup.
 */
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_REST_URL') || Deno.env.get('VITE_SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';

serve(async (req: Request) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-client-env, x-client-user-agent, x-application-name, x-application-version',
    'Access-Control-Expose-Headers': 'Content-Type, Authorization, apikey',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST requests are allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({
      error: 'Missing Supabase function secrets. Set SUPABASE_URL (or SUPABASE_REST_URL/VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY/SERVICE_ROLE_KEY).',
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const authUserId = String(body?.auth_user_id || '').trim();
    const displayName = String(body?.display_name || '').trim();
    const username = String(body?.username || '').trim().toLowerCase().replace(/\s+/g, '_');

    if (!authUserId || !displayName || !username) {
      return new Response(JSON.stringify({ error: 'auth_user_id, display_name and username are required.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const checkRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/creator_profiles?username=eq.${encodeURIComponent(username)}&select=id`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (!checkRes.ok) {
      const checkError = await checkRes.json().catch(() => null);
      const message = checkError?.message || checkError?.error_description || 'Unable to verify username availability';
      return new Response(JSON.stringify({ error: `Username check failed: ${message}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const existingUsers = await checkRes.json();
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return new Response(JSON.stringify({ error: 'Username already exists. Please choose a different username.' }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    const insertRes = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/creator_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        auth_user_id: authUserId,
        display_name: displayName,
        username,
      }),
    });

    const result = await insertRes.json();
    if (!insertRes.ok) {
      const message = result?.message || result?.error_description || JSON.stringify(result);
      return new Response(JSON.stringify({ error: `Supabase REST insert failed: ${message}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : 'Unexpected error') }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
