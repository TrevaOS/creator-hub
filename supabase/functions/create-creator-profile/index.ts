/**
 * Supabase Edge Function for creating a creator profile.
 *
 * 1) Deploy this function to Supabase Edge Functions.
 * 2) Add a secret named `SUPABASE_SERVICE_ROLE_KEY` in the Supabase Functions secrets UI.
 * 3) The frontend should call `/functions/v1/create-creator-profile` after signup.
 */
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req: Request) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({}), {
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

    const { data, error } = await supabase
      .from('creator_profiles')
      .insert({
        auth_user_id: authUserId,
        display_name: displayName,
        username,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message, details: error.details }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ data }), {
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
