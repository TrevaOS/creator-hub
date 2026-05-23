import { useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router';
import { MessageSquare, MapPin, Clock, Upload, Search, ArrowLeft, Send, CheckCheck } from 'lucide-react';
import { TopBar } from '../CreatorHubApp';
import {
  BRAND_CAMPAIGNS,
  MARKETING_STATUS_META,
  type MarketingStatus,
} from '../../data/creatorHubData';
import type { ChatMessageRecord, ChatThreadRecord } from '../api/chat';
import {
  createChatThread,
  fetchChatMessages,
  fetchChatThreadById,
  fetchChatThreadForBrand,
  fetchChatThreads,
  sendChatMessage,
} from '../api/chat';

const SUPABASE_CREATOR_ID = Number(import.meta.env.VITE_SUPABASE_CREATOR_ID ?? '0');
const FALLBACK_CREATOR_ID = 1;
const ACTIVE_CREATOR_ID =
  Number.isFinite(SUPABASE_CREATOR_ID) && SUPABASE_CREATOR_ID > 0 ? SUPABASE_CREATOR_ID : FALLBACK_CREATOR_ID;

if (!Number.isFinite(SUPABASE_CREATOR_ID) || SUPABASE_CREATOR_ID <= 0) {
  console.warn('[CreatorInbox] VITE_SUPABASE_CREATOR_ID is not set. Falling back to demo creator #1.');
}

interface InboxBrandRow {
  id: number;
  threadId: number;
  brandId: number;
  name: string;
  thumb: string;
  lastMsg: string;
  time: string;
  matched: string;
  unread: number;
  tagline: string;
  stage: (typeof BRAND_CAMPAIGNS)[number]['marketing']['pipelineStage'];
  marketingStatus: (typeof BRAND_CAMPAIGNS)[number]['marketing']['status'];
  offer: string;
  deliverables: string[];
  inboundLeads: number;
}

const formatTimeLabel = (hoursAgo: number) => {
  if (hoursAgo < 1) return 'just now';
  if (hoursAgo < 24) return `${hoursAgo}h`;
  const days = Math.floor(hoursAgo / 24);
  return `${days}d`;
};

const formatMatched = (hoursAgo: number) => {
  if (hoursAgo < 1) return 'just now';
  if (hoursAgo < 2) return '1h ago';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const days = Math.floor(hoursAgo / 24);
  return `${days}d ago`;
};

const formatRelativeShort = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return '—';
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);
  if (diffMinutes <= 0) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.round(days / 30);
  return `${months}mo`;
};

const formatRelativeAgo = (iso: string | null | undefined): string => {
  if (!iso) return 'just now';
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 'just now';
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);
  if (diffMinutes <= 0) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
};

const INBOX_BRANDS = BRAND_CAMPAIGNS.slice(0, 8).map((brand, index) => {
  const hoursAgo = 2 + index * 3;
  const statusMeta = MARKETING_STATUS_META[brand.marketing.status];
  return {
    id: brand.id,
    threadId: index + 1,
    brandId: brand.id,
    name: brand.name,
    thumb: brand.thumb,
    lastMsg:
      brand.marketing.notes?.slice(0, 36) ??
      `${statusMeta.label} · ${brand.offer.split('+')[0].trim()} collab`,
    time: formatTimeLabel(hoursAgo),
    matched: formatMatched(hoursAgo),
    unread: index % 3 === 0 ? 2 : index % 3 === 1 ? 1 : 0,
    tagline: brand.tagline,
    stage: brand.marketing.pipelineStage,
    marketingStatus: brand.marketing.status,
    offer: brand.offer,
    deliverables: brand.deliverables,
    inboundLeads: brand.marketing.inboundLeads,
  } satisfies InboxBrandRow;
});

type PipelineItem = { id: number; name: string; sub: string; action: 'Chat' | 'View' | 'Submit'; thumb: string; alert?: string };
type PipelineSection = { stage: string; dot: string; items: PipelineItem[] };

const buildPipeline = (rows: InboxBrandRow[]): PipelineSection[] => {
  const groups: Record<string, PipelineSection> = {
    Negotiation: { stage: 'NEGOTIATION', dot: '#F59E0B', items: [] },
    Live: { stage: 'LIVE CAMPAIGNS', dot: '#10B981', items: [] },
    Shortlist: { stage: 'SHORTLIST', dot: '#06B6D4', items: [] },
    Brief: { stage: 'BRIEFING', dot: '#8B5CF6', items: [] },
    Wrap: { stage: 'WRAP UP', dot: '#9CA3AF', items: [] },
  };

  rows.forEach((row) => {
    const group = groups[row.stage];
    if (!group) return;
    const action: 'Chat' | 'View' | 'Submit' = row.stage === 'Negotiation' ? 'Chat' : row.stage === 'Live' ? 'View' : row.stage === 'Shortlist' ? 'Chat' : 'Submit';
    group.items.push({
      id: row.threadId,
      name: row.name,
      sub: `${MARKETING_STATUS_META[row.marketingStatus].label.toLowerCase()} · ${row.offer}`,
      action,
      thumb: row.thumb,
      alert: row.stage === 'Live' ? `📈 ${row.inboundLeads} inbound leads` : undefined,
    });
  });

  return Object.values(groups);
};

const CHAT_DATA: Record<number, { from: 'brand' | 'me'; text: string; time: string }[]> = BRAND_CAMPAIGNS.reduce((acc, brand, idx) => {
  acc[brand.id] = [
    { from: 'brand', text: `Hi! We loved your work and would like to partner on ${brand.offer}.`, time: '10:00 AM' },
    { from: 'me', text: 'Hey! Excited about this. Can you share the deliverables?', time: '10:02 AM' },
    { from: 'brand', text: `${brand.deliverables.join(', ')} with schedule around ${formatMatched(6 + idx * 2)}.`, time: '10:05 AM' },
  ];
  return acc;
}, {} as Record<number, { from: 'brand' | 'me'; text: string; time: string }[]>);

type Tab = 'matches' | 'pipeline' | 'messages';

type BrandRecord = (typeof BRAND_CAMPAIGNS)[number];

const buildMockThreadFromBrand = (threadId: number | null | undefined, brand: BrandRecord): ChatThreadRecord => {
  const status = brand.marketing.status.toLowerCase();
  const pipelineStage = brand.marketing.pipelineStage.toLowerCase();

  return {
    id: threadId && threadId > 0 ? threadId : brand.id,
    brand_id: brand.id,
    creator_id: ACTIVE_CREATOR_ID,
    stage: 'negotiating',
    unread_count: 0,
    last_message_preview: brand.marketing.notes ?? brand.offer,
    last_message_at: null,
    matched_at: null,
    created_at: null,
    brand: {
      id: brand.id,
      name: brand.name,
      tagline: brand.tagline,
      location_label: brand.location,
      average_ticket_amount: null,
      average_ticket_currency: 'INR',
      offer_copy: brand.offer,
      brief: brand.brief,
      brand_gallery_images: brand.gallery.map((image_url: string) => ({ image_url })),
      brand_marketing: [
        {
          status,
          pipeline_stage: pipelineStage,
          inbound_leads: brand.marketing.inboundLeads,
          notes: brand.marketing.notes ?? null,
          budget_amount: brand.marketing.budget,
          spend_to_date: brand.marketing.spendToDate,
          target_launch: brand.marketing.targetLaunch,
        },
      ],
      brand_deliverables: brand.deliverables.map((label: string) => ({ label })),
    },
  };
};

const mapThreadToInboxRow = (thread: ChatThreadRecord): InboxBrandRow => {
  const brand = thread.brand;
  const marketing = brand?.brand_marketing?.[0];
  const status = (marketing?.status ?? 'active') as MarketingStatus;

  return {
    id: thread.id,
    threadId: thread.id,
    brandId: brand?.id ?? 0,
    name: brand?.name ?? 'Unknown brand',
    thumb:
      brand?.brand_gallery_images?.[0]?.image_url ??
      'https://images.unsplash.com/photo-1559628233-3daf8d946fa7?auto=format&fit=crop&w=200&q=80',
    lastMsg: thread.last_message_preview ?? marketing?.notes ?? brand?.offer_copy ?? 'New opportunity waiting for you.',
    time: formatRelativeShort(thread.last_message_at ?? thread.matched_at),
    matched: formatRelativeAgo(thread.matched_at),
    unread: thread.unread_count ?? 0,
    tagline: brand?.tagline ?? '',
    stage: (marketing?.pipeline_stage ?? 'Negotiation') as InboxBrandRow['stage'],
    marketingStatus: status,
    offer: brand?.offer_copy ?? 'Custom collaboration opportunity',
    deliverables: brand?.brand_deliverables?.map((d) => d.label ?? '').filter(Boolean) ?? [],
    inboundLeads: marketing?.inbound_leads ?? 0,
  };
};

const FALLBACK_INBOX_ROWS: InboxBrandRow[] = INBOX_BRANDS;

function InboxList() {
  const [tab, setTab] = useState<Tab>('matches');
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThreadRecord[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const loadThreads = async () => {
      try {
        setLoadingThreads(true);
        const data = await fetchChatThreads(ACTIVE_CREATOR_ID);
        if (isCancelled) return;
        setThreads(data);
        setThreadError(null);
      } catch (error) {
        if (isCancelled) return;
        console.error('[InboxList] Failed to load chat threads', error);
        setThreadError(error instanceof Error ? error.message : 'Unable to load conversations from Supabase.');
      } finally {
        if (!isCancelled) {
          setLoadingThreads(false);
        }
      }
    };

    void loadThreads();

    return () => {
      isCancelled = true;
    };
  }, []);

  const supabaseRows = useMemo(() => threads.map(mapThreadToInboxRow), [threads]);
  const hasSupabaseRows = supabaseRows.length > 0;
  const rows = hasSupabaseRows ? supabaseRows : FALLBACK_INBOX_ROWS;
  const matchesLabel = `New Matches · ${rows.length}`;
  const pipelineSections = useMemo(() => buildPipeline(rows), [rows]);
  const pipelineCount = pipelineSections.reduce<number>((sum, section) => sum + section.items.length, 0);
  const spotlight = rows[0];
  const spotlightStatus = spotlight ? MARKETING_STATUS_META[spotlight.marketingStatus] : null;

  return (
    <div className="flex flex-col bg-gray-50 h-full">
      <TopBar title={<span className="font-bold text-gray-900 text-lg">Inbox</span>} />

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 px-4">
        {([
          ['matches', matchesLabel],
          ['pipeline', `Pipeline · ${pipelineCount}`],
          ['messages', 'Messages'],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-bold py-3 px-3 -mb-px border-b-2 transition-all ${
              tab === t ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {threadError && (
        <div className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
          {threadError} Showing demo conversations until the connection is fixed.
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {tab === 'matches' && (
          <div className="p-4 space-y-3">
            {loadingThreads && hasSupabaseRows && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 p-3 text-center text-xs text-gray-400">
                Refreshing conversations…
              </div>
            )}

            {rows.map((row) => (
              <div key={row.threadId} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                <div className="relative">
                  <img src={row.thumb} alt={row.name} className="w-12 h-12 rounded-full object-cover" />
                  {row.unread > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                      <span className="text-[9px] text-white font-bold">{row.unread}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{row.name}</div>
                  <div className="text-xs text-gray-400">Matched {row.matched}</div>
                </div>
                <button
                  onClick={() => navigate(`/creatorhub/inbox/chat/${row.threadId}`)}
                  className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <MessageSquare className="w-3 h-3" /> Chat
                </button>
              </div>
            ))}

            {!rows.length && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-4 text-center text-xs text-gray-400">
                No conversations yet — matches will appear here once campaigns go live.
              </div>
            )}

            {spotlight && spotlightStatus && (
              <div className="bg-gray-100 rounded-xl p-3 mt-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">ACTIVE CAMPAIGN</div>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{spotlight.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      spotlightStatus.tone === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : spotlightStatus.tone === 'amber'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : spotlightStatus.tone === 'sky'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {spotlightStatus.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700 text-xs mb-2">
                    <Clock className="w-3 h-3" /> {spotlight.deliverables.length ? spotlight.deliverables.join(' · ') : spotlight.offer}
                  </div>
                  <button
                    onClick={() => navigate(`/creatorhub/inbox/chat/${spotlight.threadId}`)}
                    className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Open chat →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'pipeline' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg text-gray-900">My Pipeline</span>
              <span className="text-gray-500 text-sm font-semibold">{pipelineCount} collabs</span>
            </div>
            <div className="space-y-4">
              {pipelineSections.map((section) => (
                <div key={section.stage}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: section.dot }} />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      {section.stage}{section.items.length > 0 ? ` · ${section.items.length}` : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {section.items.map((item: PipelineItem) => (
                      <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <img src={item.thumb} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                            <div className="text-xs text-gray-400">{item.sub}</div>
                          </div>
                          <button
                            onClick={() => {}}
                            className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            {item.action === 'Chat' && <MessageSquare className="w-3 h-3" />}
                            {item.action === 'View' && <MapPin className="w-3 h-3" />}
                            {item.action === 'Submit' && <Upload className="w-3 h-3" />}
                            {item.action}
                          </button>
                        </div>
                        {'alert' in item && item.alert && (
                          <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 text-xs text-amber-700 font-medium">
                            {item.alert}
                          </div>
                        )}
                      </div>
                    ))}
                    {section.items.length === 0 && (
                      <div className="bg-white/60 rounded-xl p-3 text-xs text-gray-300 text-center border border-dashed border-gray-200">
                        No items
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'messages' && (
          <div className="p-4">
            {/* Due alert */}
            {spotlight && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-900 text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" /> DUE FRIDAY
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">2 days</span>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-2">Submit Draft — {spotlight.name}</div>
                <button
                  onClick={() => navigate(`/creatorhub/inbox/chat/${spotlight.threadId}`)}
                  className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold"
                >
                  Upload Now
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">CONVERSATIONS</span>
              <button className="w-8 h-8 rounded-lg hasBorder border border-gray-200 bg-white flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-0">
              {rows.map((row) => (
                <button
                  key={row.threadId}
                  className="w-full flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
                  onClick={() => navigate(`/creatorhub/inbox/chat/${row.threadId}`)}
                >
                  <div className="relative">
                    <img src={row.thumb} alt={row.name} className="w-11 h-11 rounded-full object-cover" />
                    {row.unread > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold">{row.unread}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-gray-900 text-sm">{row.name}</div>
                    <div className="text-xs text-gray-400 truncate">{row.lastMsg}</div>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{row.time}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const threadIdParam = Number(id);
  const [thread, setThread] = useState<ChatThreadRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let isCancelled = false;

    const loadThread = async () => {
      setLoading(true);
      try {
        let activeThread: ChatThreadRecord | null = null;

        if (Number.isFinite(threadIdParam) && threadIdParam > 0) {
          activeThread = await fetchChatThreadById(threadIdParam);
        }

        if (!activeThread) {
          const fallbackBrand = BRAND_CAMPAIGNS.find((b) => b.id === threadIdParam) ?? BRAND_CAMPAIGNS[0];
          const brandId = fallbackBrand.id;
          activeThread = await fetchChatThreadForBrand(ACTIVE_CREATOR_ID, brandId);

          if (!activeThread) {
            activeThread = await createChatThread(ACTIVE_CREATOR_ID, brandId, 'negotiating').catch(() => null);
          }

          if (!activeThread) {
            activeThread = buildMockThreadFromBrand(threadIdParam, fallbackBrand);
          }
        }

        if (!activeThread) {
          throw new Error('Unable to locate chat thread.');
        }

        const messageData = await fetchChatMessages(activeThread.id).catch(() => null);

        if (isCancelled) return;

        setThread(activeThread);

        if (messageData && messageData.length) {
          setMessages(messageData);
        } else {
          const fallbackBrandId = activeThread.brand_id ?? activeThread.brand?.id ?? 0;
          const fallbackArray = CHAT_DATA[fallbackBrandId] ?? [];
          setMessages(
            fallbackArray.map((msg, idx) => {
              const minutesAgo = Math.max(fallbackArray.length - idx, 1);
              const fallbackMessage: ChatMessageRecord = {
                id: `${activeThread.id}-${idx}`,
                thread_id: activeThread.id,
                sender: msg.from === 'me' ? 'creator' : 'brand',
                message_type: 'text',
                body: msg.text,
                monetary_amount: null,
                monetary_currency: 'INR',
                deliverables: null,
                label: null,
                extra: null,
                created_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
              };
              return fallbackMessage;
            }),
          );
        }
        setError(null);
      } catch (err) {
        if (isCancelled) return;
        console.error('[ChatScreen] Failed to load chat thread', err);
        setError(err instanceof Error ? err.message : 'Unable to load chat.');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadThread();

    return () => {
      isCancelled = true;
    };
  }, [threadIdParam]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !thread) return;
    try {
      setSending(true);
      const optimisticMessage: ChatMessageRecord = {
        id: `local-${Date.now()}`,
        thread_id: thread.id,
        sender: 'creator',
        message_type: 'text',
        body: trimmed,
        monetary_amount: null,
        monetary_currency: 'INR',
        deliverables: null,
        label: null,
        extra: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setInput('');
      const saved = await sendChatMessage(thread.id, trimmed);
      setMessages((prev) => prev.map((msg) => (msg.id === optimisticMessage.id ? saved : msg)));
      setError(null);
    } catch (err) {
      console.error('[ChatScreen] Failed to send message', err);
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const brandThumb =
    thread?.brand?.brand_gallery_images?.[0]?.image_url ??
    BRAND_CAMPAIGNS.find((b) => b.id === thread?.brand_id)?.thumb ??
    'https://images.unsplash.com/photo-1559628233-3daf8d946fa7?auto=format&fit=crop&w=200&q=80';
  const brandName = thread?.brand?.name ?? 'Partner brand';

  const handleSendFromInput = () => {
    void handleSend();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col bg-white h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <img src={brandThumb} alt={brandName} className="w-9 h-9 rounded-full object-cover" />
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-sm">{brandName}</div>
          <div className="text-[10px] text-green-500 font-medium">Online</div>
        </div>
        <button className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center">
          <Search className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {loading && (
          <div className="text-xs text-gray-400 text-center py-6">Loading conversation…</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-6">
            Start the conversation with {brandName}.
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'creator' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.sender === 'creator' ? 'bg-gray-900 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'
              }`}
            >
              <p className={`text-sm ${msg.sender === 'creator' ? 'text-white' : 'text-gray-800'}`}>
                {msg.body}
              </p>
              <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'creator' ? 'justify-end' : ''}`}>
                <span className="text-[10px] text-gray-400">
                  {msg.created_at ? formatRelativeAgo(msg.created_at) : 'now'}
                </span>
                {msg.sender === 'creator' && <CheckCheck className="w-3 h-3 text-cyan-400" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input — always at bottom, no overflow */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-800 outline-none border border-transparent focus:border-gray-300"
            placeholder="Message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            />
          <button
            onClick={handleSendFromInput}
            disabled={sending || !input.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              sending || !input.trim() ? 'bg-gray-300' : 'bg-gray-900'
            }`}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        {error && <p className="mt-2 text-[10px] font-semibold text-rose-600">{error}</p>}
      </div>
    </div>
  );
}

export default function CreatorInbox() {
  return (
    <Routes>
      <Route index element={<InboxList />} />
      <Route path="chat/:id" element={<ChatScreen />} />
    </Routes>
  );
}
