import { supabase } from '../../../lib/supabaseClient';

const THREAD_SELECT = `id, brand_id, creator_id, stage, unread_count, last_message_preview, last_message_at, matched_at, created_at,
  brand:brands (
    id,
    name,
    tagline,
    location_label,
    average_ticket_amount,
    average_ticket_currency,
    offer_copy,
    brief,
    brand_gallery_images ( image_url ),
    brand_marketing ( status, pipeline_stage, inbound_leads, notes, budget_amount, spend_to_date, target_launch ),
    brand_deliverables ( label )
  )`;

const MESSAGE_SELECT =
  'id, thread_id, sender, message_type, body, monetary_amount, monetary_currency, deliverables, label, extra, created_at';

export type ChatActor = 'brand' | 'creator';
export type ChatStage = 'match' | 'negotiating' | 'booked' | 'content' | 'done';
export type ChatMessageType = 'text' | 'profile_card' | 'offer' | 'counter' | 'calendar';

export interface ChatThreadRecord {
  id: number;
  brand_id: number | null;
  creator_id: number | null;
  stage: ChatStage;
  unread_count: number | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  matched_at: string | null;
  created_at: string | null;
  brand?: {
    id: number;
    name: string;
    tagline: string | null;
    location_label: string | null;
    average_ticket_amount: number | null;
    average_ticket_currency: string | null;
    offer_copy: string | null;
    brief: string | null;
    brand_gallery_images?: { image_url: string | null }[] | null;
    brand_marketing?: {
      status: string | null;
      pipeline_stage: string | null;
      inbound_leads: number | null;
      notes: string | null;
      budget_amount: number | null;
      spend_to_date: number | null;
      target_launch: string | null;
    }[] | null;
    brand_deliverables?: { label: string | null }[] | null;
  } | null;
}

export interface ChatMessageRecord {
  id: string;
  thread_id: number | null;
  sender: ChatActor;
  message_type: ChatMessageType;
  body: string | null;
  monetary_amount: number | null;
  monetary_currency: string | null;
  deliverables: string[] | null;
  label: string | null;
  extra: Record<string, unknown> | null;
  created_at: string | null;
}

export async function fetchChatThreads(creatorId: number): Promise<ChatThreadRecord[]> {
  const { data, error } = await supabase
    .from('chat_threads')
    .select(THREAD_SELECT)
    .eq('creator_id', creatorId)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as ChatThreadRecord[];
}

export async function fetchChatThreadById(threadId: number): Promise<ChatThreadRecord | null> {
  const { data, error } = await supabase
    .from('chat_threads')
    .select(THREAD_SELECT)
    .eq('id', threadId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as unknown as ChatThreadRecord) ?? null;
}

export async function createChatThread(
  creatorId: number,
  brandId: number,
  stage: ChatStage = 'match',
): Promise<ChatThreadRecord> {
  const { data, error } = await supabase
    .from('chat_threads')
    .insert({ creator_id: creatorId, brand_id: brandId, stage })
    .select(THREAD_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as unknown as ChatThreadRecord;
}

export async function fetchChatThreadForBrand(
  creatorId: number,
  brandId: number,
): Promise<ChatThreadRecord | null> {
  const { data, error } = await supabase
    .from('chat_threads')
    .select(THREAD_SELECT)
    .eq('creator_id', creatorId)
    .eq('brand_id', brandId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as unknown as ChatThreadRecord) ?? null;
}

export async function fetchChatMessages(threadId: number): Promise<ChatMessageRecord[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_SELECT)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as ChatMessageRecord[];
}

export async function sendChatMessage(threadId: number, body: string): Promise<ChatMessageRecord> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      sender: 'creator',
      message_type: 'text',
      body,
    })
    .select(MESSAGE_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  // Update thread metadata asynchronously (fire-and-forget)
  void supabase
    .from('chat_threads')
    .update({
      last_message_preview: body.slice(0, 160),
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    })
    .eq('id', threadId);

  return data as unknown as ChatMessageRecord;
}
