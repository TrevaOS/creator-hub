import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, Plus, ChevronRight, ChevronLeft, X, Check, ExternalLink, Mail, Instagram, ChevronDown } from 'lucide-react';
import { useInfluencers, InfluencerProfile } from '../data/influencers';
import { CreatorAvatar } from '../components/CreatorAvatar';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type ViewMode = 'grid' | 'map' | 'lists';

// ── Creator Trust Score ────────────────────────────────────────────────────────
// All influencers start in the 92–100 band.
// Brand-side penalty events deduct from the score.
// Score is shown as a circular ring on every card and in the spotlight.

interface ScoreEvent {
  type: 'late_cancel' | 'early_cancel' | 'ghost' | 'completed' | 'no_show';
  delta: number;   // negative = penalty, positive = reward
  label: string;
  description: string;
}

const SCORE_EVENTS: ScoreEvent[] = [
  { type: 'late_cancel',  delta: -3, label: 'Late Cancel',   description: 'Cancelled after campaign brief was sent' },
  { type: 'early_cancel', delta: -1, label: 'Early Cancel',  description: 'Cancelled before brief — forgivable' },
  { type: 'ghost',        delta: -2, label: 'Ghosted',       description: 'No response after accepting' },
  { type: 'no_show',      delta: -3, label: 'No Show',       description: 'Did not show up / deliver content' },
  { type: 'completed',    delta: +1, label: 'Completed',     description: 'Successfully completed a collab' },
];

// Derive a deterministic base score 92–100 from profile completeness
function deriveBaseScore(profile: { followers: string; bio: string; scraped: boolean; avgPlays: string; email: string }): number {
  let score = 92;
  if (profile.bio && profile.bio.length > 20)  score += 2;
  if (profile.scraped)                          score += 2;
  if (profile.avgPlays)                         score += 1;
  if (profile.email)                            score += 1;
  return Math.min(100, score);
}

function getScoreColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 97) return { ring: '#10b981', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 94) return { ring: '#06b6d4', text: 'text-cyan-600',    bg: 'bg-cyan-50'    };
  if (score >= 90) return { ring: '#f59e0b', text: 'text-amber-600',   bg: 'bg-amber-50'   };
  return                  { ring: '#ef4444', text: 'text-red-600',      bg: 'bg-red-50'     };
}

// SVG circular score ring
function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const { ring, text } = getScoreColor(score);
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} className="absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ring} strokeWidth="3"
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} strokeLinecap="round" />
      </svg>
      <span className={`relative text-[10px] font-black ${text}`}>{score}</span>
    </div>
  );
}

// ── Deal type derivation ───────────────────────────────────────────────────────
function deriveDealType(influencerType: string, cost: string): 'paid' | 'barter' | 'unpaid' {
  const t = (influencerType || '').toLowerCase().trim();
  const c = (cost || '').toLowerCase().trim();
  // explicit barter/contra
  if (t === 'barter' || t === 'contra' || c === 'barter' || c === 'contra') return 'barter';
  // if there's an actual cost amount, it's paid
  if (cost && cost.trim() && cost.trim() !== '—' && cost.trim() !== 'NA' && cost.trim() !== 'na') {
    const numeric = cost.replace(/[^0-9.]/g, '');
    if (numeric && parseFloat(numeric) > 0) return 'paid';
  }
  // explicit paid type
  if (t === 'paid') return 'paid';
  // explicit unpaid / gifting
  if (t === 'unpaid' || t === 'gifting' || t === 'gifted') return 'unpaid';
  return 'unpaid';
}

const DEAL_TYPE_STYLES: Record<string, { label: string; cls: string }> = {
  paid:   { label: 'Paid',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  barter: { label: 'Barter', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  unpaid: { label: 'Unpaid', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const PAGE_SIZE = 16;

interface CreatorCard {
  id: string;
  name: string;
  handle: string;
  followers: string;
  engagement: string;
  niche: string;
  categories: string[];
  categoryKeys: string[];
  distance: string;
  distanceKm: number;
  img: string;
  statusKey: string;
  statusLabel: string;
  platforms: string[];
  platformKeys: string[];
  area: string;
  areaKey: string;
  sources: string[];
  sourceKeys: string[];
  profileUrl: string;
  notes: string;
  influencerType: string;
  dealType: 'paid' | 'barter' | 'unpaid';
  score: number;       // 0–100 trust score
  initials: string;
  profile: InfluencerProfile;
}

interface SpotlightProps {
  card: CreatorCard | null;
  open: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'chat';
}

function SpotlightOverlay({ card, open, onClose, defaultTab = 'profile' }: SpotlightProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'chat'>(defaultTab);
  const [chatMessages, setChatMessages] = useState<{ from: 'me' | 'them'; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab, card?.id]);
  useEffect(() => {
    if (activeTab === 'chat') chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { from: 'me', text, time: now }]);
    setChatInput('');
  };

  if (!card || !open) return null;

  const palette = getSpotlightPalette(card);
  const profile = card.profile;

  const stats = [
    { label: 'Followers', value: formatStat(card.followers) },
    { label: 'Avg. Plays', value: formatStat(profile.avgPlays) },
    { label: 'Impressions', value: formatStat(profile.impressions) },
    { label: 'Cost', value: profile.cost || 'On request' },
  ].filter(s => s.value && s.value !== '—');

  const categories = card.categories.length ? card.categories : [card.niche];
  const sources = card.sources.length ? card.sources : profile.source ? [profile.source] : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-white flex flex-col"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="relative h-32 flex-shrink-0">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.start}, ${palette.end})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/10" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 flex items-end gap-3">
            <CreatorAvatar src={card.img} name={card.name} handle={card.handle} size={64} className="rounded-2xl border-2 border-white shadow-lg" />
            <div className="text-white drop-shadow space-y-0.5 min-w-0 flex-1">
              <div className="text-xl font-extrabold leading-tight truncate">{card.name}</div>
              <div className="flex items-center gap-2 text-xs text-white/85 flex-wrap">
                {card.handle && <span className="font-medium">{card.handle}</span>}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {card.area || 'Bengaluru'}
                </span>
                {card.influencerType && (
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wide">
                    {card.influencerType}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {categories.slice(0, 5).map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 border border-white/25 uppercase tracking-wide">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            {/* Score ring — always visible in header */}
            <div className="flex-shrink-0 bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-2 flex flex-col items-center gap-0.5">
              <ScoreRing score={card.score} size={48} />
              <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider">Trust</span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-colors ${activeTab === 'profile' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-colors ${activeTab === 'chat' ? 'text-cyan-600 border-b-2 border-cyan-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Chat
          </button>
        </div>

        {/* Chat panel */}
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-3">
                    <img src="/chat-icon.png" alt="Chat" className="w-7 h-7 object-contain" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Start a conversation</p>
                  <p className="text-xs text-gray-400 mt-1">Send a message to {card.name}</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.from === 'me' ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.from === 'me' ? 'text-white/50' : 'text-gray-400'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>
            <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${card.name}...`}
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 transition max-h-28 overflow-y-auto"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center hover:bg-black transition disabled:opacity-30 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable body */}
        {activeTab === 'profile' && <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* ── Trust Score panel ── */}
          {(() => {
            const { ring, text, bg } = getScoreColor(card.score);
            return (
              <div className={`rounded-2xl border p-4 ${bg} border-opacity-40`} style={{ borderColor: ring + '55' }}>
                <div className="flex items-center gap-4">
                  <ScoreRing score={card.score} size={56} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${text}`}>{card.score}</span>
                      <span className="text-sm font-bold text-gray-500">/ 100</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        card.score >= 97 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        card.score >= 94 ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                        card.score >= 90 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {card.score >= 97 ? 'Excellent' : card.score >= 94 ? 'Good' : card.score >= 90 ? 'Average' : 'Poor'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Creator Trust Score</div>
                  </div>
                </div>
                {/* Score bar */}
                <div className="mt-3 bg-white/60 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${card.score}%`, background: ring }} />
                </div>
              </div>
            );
          })()}
          {/* Stats row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: 'Followers', value: profile.followersExact > 0 ? formatFollowerCount(profile.followersExact) : formatStat(card.followers) },
              { label: 'Following', value: profile.followingCount > 0 ? formatFollowerCount(profile.followingCount) : null },
              { label: 'Posts',     value: profile.postsCount > 0 ? profile.postsCount.toLocaleString() : null },
              { label: 'Reels',     value: profile.igtvCount > 0 ? profile.igtvCount.toLocaleString() : null },
              { label: 'Highlights',value: profile.highlightReelCount > 0 ? profile.highlightReelCount.toLocaleString() : null },
              { label: 'Cost',      value: profile.cost || 'On request' },
            ].filter(s => s.value).map(stat => (
              <div key={stat.label} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                <div className="text-sm font-extrabold text-gray-900 mt-0.5">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Bio + links */}
          {(profile.bio || profile.externalUrls?.length > 0 || profile.externalUrl) && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-2">
              {profile.bio && (
                <>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bio</div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                </>
              )}
              {/* All external links */}
              {(profile.externalUrls?.length > 0 ? profile.externalUrls : profile.externalUrl ? [{ title: '', url: profile.externalUrl }] : []).map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-600 hover:underline font-medium mr-3">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  {link.title || link.url.replace(/^https?:\/\//, '').slice(0, 45)}
                </a>
              ))}
            </div>
          )}

          {/* Recent posts — exactly 3 */}
          {profile.latestPosts && profile.latestPosts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recent Posts</div>
              <div className="grid grid-cols-3 gap-2">
                {profile.latestPosts.slice(0, 3).map((post, i) => (
                  <a
                    key={i}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative rounded-xl overflow-hidden group block bg-gray-100"
                    style={{ aspectRatio: '1/1' }}
                  >
                    <img
                      src={post.displayUrl}
                      alt={`Post ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/65 transition-all duration-200 flex flex-col justify-end p-2">
                      {post.caption && (
                        <p className="text-white text-[9px] leading-tight opacity-0 group-hover:opacity-100 transition-opacity line-clamp-4">
                          {post.caption}
                        </p>
                      )}
                    </div>
                    {/* Top badges */}
                    <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1">
                      <div className="flex flex-col gap-0.5">
                        {(post.type === 'Video' || post.productType === 'clips') && (
                          <span className="bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">▶ Reel</span>
                        )}
                        {post.isPinned && (
                          <span className="bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">📌</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 items-end">
                        {post.videoViewCount > 0 && (
                          <span className="bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            👁 {post.videoViewCount >= 1000 ? `${(post.videoViewCount/1000).toFixed(0)}k` : post.videoViewCount}
                          </span>
                        )}
                        {post.likesCount > 0 && (
                          <span className="bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            ♥ {post.likesCount >= 1000 ? `${(post.likesCount/1000).toFixed(0)}k` : post.likesCount}
                          </span>
                        )}
                        {post.commentsCount > 0 && (
                          <span className="bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            💬 {post.commentsCount >= 1000 ? `${(post.commentsCount/1000).toFixed(0)}k` : post.commentsCount}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Location + music at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity space-y-0.5">
                      {post.locationName && (
                        <p className="text-[8px] text-white/90 flex items-center gap-0.5">
                          <MapPin className="w-2 h-2 flex-shrink-0" />{post.locationName}
                        </p>
                      )}
                      {post.musicSong && !post.usesOriginalAudio && (
                        <p className="text-[8px] text-white/80 truncate">♪ {post.musicSong}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
              {/* Per-post hashtags */}
              {(() => {
                const tags = Array.from(new Set(profile.latestPosts.slice(0,3).flatMap(p => p.hashtags || []))).slice(0, 16);
                if (!tags.length) return null;
                return (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">#{tag}</span>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Social links */}
          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Social & Links</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(profile.socialLinks).map(([platform, url]) => {
                  const icons: Record<string, string> = {
                    youtube: '▶', facebook: 'f', twitter: 'X', tiktok: '♪',
                    snapchat: '👻', linkedin: 'in', website: '🌐',
                  };
                  const colors: Record<string, string> = {
                    youtube: 'bg-red-50 text-red-600 border-red-100',
                    facebook: 'bg-blue-50 text-blue-700 border-blue-100',
                    twitter: 'bg-gray-50 text-gray-800 border-gray-200',
                    tiktok: 'bg-pink-50 text-pink-700 border-pink-100',
                    linkedin: 'bg-blue-50 text-blue-800 border-blue-100',
                    website: 'bg-gray-50 text-gray-700 border-gray-200',
                    snapchat: 'bg-yellow-50 text-yellow-700 border-yellow-100',
                  };
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition hover:opacity-80 ${colors[platform] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                    >
                      <span>{icons[platform] || '🔗'}</span>
                      <span className="capitalize">{platform}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hashtags fallback (kept for compat) */}
          {false && (() => {
            const tags: string[] = [];
            if (!tags.length) return null;
            return (
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Top Hashtags</div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">#{tag}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Two column layout */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Left: details */}
            <div className="space-y-3">
              {/* Area & Type */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creator Info</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Area',         value: card.area || 'Bengaluru' },
                    { label: 'Gender',       value: profile.gender || '—' },
                    { label: 'Type',         value: profile.influencerType || '—' },
                    { label: 'Cost',         value: profile.cost || 'On request' },
                    profile.followingCount > 0 ? { label: 'Following',   value: formatFollowerCount(profile.followingCount) } : null,
                    profile.postsCount > 0 ?     { label: 'Total Posts', value: profile.postsCount.toLocaleString() } : null,
                    profile.businessCategory ?   { label: 'IG Category', value: profile.businessCategory } : null,
                    profile.isBusinessAccount ?  { label: 'Account',     value: 'Business' } : null,
                    profile.isVerified ?         { label: 'Verified',    value: '✓ Verified' } : null,
                    profile.joinedRecently ?     { label: 'Joined',      value: 'Recently' } : null,
                    profile.email ?              { label: 'Email',       value: profile.email } : null,
                  ].filter(Boolean).map(f => (
                    <div key={f!.label}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{f!.label}</div>
                      <div className={`font-semibold text-xs mt-0.5 truncate ${f!.label === 'Verified' ? 'text-blue-600' : 'text-gray-800'}`}>{f!.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              {profile.email && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact</div>
                  <a href={`mailto:${profile.email}`} className="text-sm text-cyan-600 hover:underline flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    {profile.email}
                  </a>
                </div>
              )}

              {/* Notes */}
              {profile.notes && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{profile.notes}</p>
                </div>
              )}

              {/* Source tags */}
              {sources.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Source</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sources.map(src => (
                      <span key={src} className="px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-xs font-semibold text-cyan-700">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Niche tags */}
              {categories.length > 1 && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Niches</div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(cat => (
                      <span key={cat} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {capitalizeWords(cat)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: collab + actions */}
            <div className="space-y-3">
              <div className="bg-gray-900 text-white rounded-xl p-4 shadow-md">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Collab Fit</div>
                <p className="text-xs text-white/75 leading-relaxed mb-3">
                  {profile.influencerType ? `${capitalizeWords(profile.influencerType)} creator` : 'Influencer'} in{' '}
                  {categories.length ? categories.slice(0, 3).map(capitalizeWords).join(', ') : 'lifestyle verticals'}.
                  {card.area ? ` Based in ${card.area}.` : ''} Ideal for hyperlocal campaigns within {card.distance}.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Followers',  value: profile.followersExact > 0 ? formatFollowerCount(profile.followersExact) : formatStat(profile.followers) || '—' },
                    { label: 'Following',  value: profile.followingCount > 0 ? formatFollowerCount(profile.followingCount) : '—' },
                    { label: 'Posts',      value: profile.postsCount > 0 ? profile.postsCount.toLocaleString() : '—' },
                    { label: 'Cost',       value: profile.cost || 'On request' },
                    { label: 'Avg. Plays', value: formatStat(profile.avgPlays) || '—' },
                    { label: 'Impressions',value: formatStat(profile.impressions) || '—' },
                  ].filter(f => f.value && f.value !== '—').map(f => (
                    <div key={f.label}>
                      <div className="text-[9px] text-white/50 uppercase tracking-wider">{f.label}</div>
                      <div className="font-bold text-sm">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</div>
                  <div className="text-[10px] text-gray-400">{profile.scraped ? '✓ Live data' : 'CSV dataset'}</div>
                </div>
                <a
                  href={card.profileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  View Instagram Profile
                  <ExternalLink className="w-3 h-3" />
                </a>
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Send Email
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 text-xs font-bold hover:bg-cyan-100 transition"
                >
                  Add to Brief
                </button>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

function SpotlightPortal({ card, open, onClose, defaultTab }: SpotlightProps) {
  if (!open) return null;
  return <SpotlightOverlay card={card} open={open} onClose={onClose} defaultTab={defaultTab} />;
}

const STATUS_STYLE: Record<string, string> = {
  responded: 'bg-green-50 text-green-700 border-green-200',
  'no response': 'bg-amber-50 text-amber-700 border-amber-200',
  'sent message': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'sent email': 'bg-blue-50 text-blue-700 border-blue-200',
  'sent email,responded': 'bg-green-50 text-green-700 border-green-200',
  'sent message,responded': 'bg-green-50 text-green-700 border-green-200',
  'not yet invited': 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function deriveInitials(nameOrHandle: string): string {
  const cleaned = nameOrHandle.replace(/^@/, '').trim();
  if (!cleaned) return '??';
  const parts = cleaned.split(/\s+|_/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function capitalizeWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function getMapPosition(index: number) {
  const centerX = 300;
  const centerY = 260;
  const ring = Math.floor(index / 8);
  const angleStep = (2 * Math.PI) / 8;
  const angle = (index % 8) * angleStep + ring * 0.35;
  const radius = 110 + ring * 60;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  return { x: clamp(centerX + radius * Math.cos(angle), 40, 560), y: clamp(centerY + radius * Math.sin(angle), 40, 420) };
}

function derivePlatforms(influencer: InfluencerProfile, categories: string[], notes: string): string[] {
  const platforms = new Set<string>();
  const combined = `${influencer.category} ${categories.join(' ')} ${notes}`.toLowerCase();
  if (influencer.profileUrl.toLowerCase().includes('instagram') || influencer.handle) platforms.add('Instagram');
  if (/youtube/.test(combined)) platforms.add('YouTube');
  if (/tiktok/.test(combined)) platforms.add('TikTok');
  if (/blog/.test(combined)) platforms.add('Blog');
  if (/podcast/.test(combined)) platforms.add('Podcast');
  return Array.from(platforms);
}

const CATEGORY_PALETTES: { match: RegExp; colors: { start: string; end: string; accent: string } }[] = [
  { match: /(food|drink|restaurant|chef|cafe)/, colors: { start: '#f97316', end: '#fb7185', accent: '#fb923c' } },
  { match: /(travel|explore|wander|stay|hotel)/, colors: { start: '#34d399', end: '#22d3ee', accent: '#2dd4bf' } },
  { match: /(fashion|style|beauty|model|luxury)/, colors: { start: '#a855f7', end: '#f472b6', accent: '#f472b6' } },
  { match: /(tech|gaming|digital|creator|vlogger)/, colors: { start: '#38bdf8', end: '#6366f1', accent: '#60a5fa' } },
  { match: /(fitness|wellness|health|lifestyle|mom)/, colors: { start: '#fbbf24', end: '#f97316', accent: '#facc15' } },
];

const DEFAULT_PALETTE = { start: '#2563eb', end: '#6366f1', accent: '#38bdf8' };

function getSpotlightPalette(card: CreatorCard) {
  const haystack = `${card.categoryKeys.join(' ')} ${card.niche.toLowerCase()} ${card.areaKey}`;
  return CATEGORY_PALETTES.find(e => e.match.test(haystack))?.colors ?? DEFAULT_PALETTE;
}

function formatFollowerCount(n: number): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toString();
}

function formatStat(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/â€"/g, '—')
    .replace(/[–—―]/g, '—')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(\d+(?:[.,]\d+)?)(k|l|m)\b/gi, (_, n, u) => `${n}${u.toUpperCase()}`);
}

function formatDistance(index: number): { km: number; label: string } {
  const base = 1.6 + (index % 11) * 1.15;
  const km = Math.round(base * 10) / 10;
  return { km, label: `${km.toFixed(km >= 10 ? 0 : 1)} km` };
}

function mapInfluencersToCards(influencers: InfluencerProfile[]): CreatorCard[] {
  return influencers
    .map((influencer, index) => {
      const rawCategories = influencer.categories.length ? influencer.categories : [influencer.primaryCategory].filter(Boolean);
      // Each raw segment (already split by comma/slash/pipe) may still contain compound
      // phrases like "Fashion And Lifestyle" — extract ALL matching niches from each segment
      const canonicalSet = new Set<string>();
      rawCategories.forEach(cat => { extractNichesFromSegment(cat).forEach(n => canonicalSet.add(n)); });
      const categories = canonicalSet.size > 0 ? Array.from(canonicalSet) : ['Lifestyle'];
      const categoryKeys = categories.map(normalizeKey);
      const area = influencer.areaOrCity || 'Bengaluru';
      const areaKey = normalizeKey(area);
      const sources = influencer.sourceTags;
      const sourceKeys = sources.map(normalizeKey);
      const { km, label } = formatDistance(index);
      const platforms = derivePlatforms(influencer, rawCategories, influencer.notes);
      const platformKeys = platforms.map(normalizeKey);
      const name = influencer.name || capitalizeWords(influencer.profileId || influencer.handle || 'Creator');
      const handle = influencer.handle || (influencer.profileId ? `@${influencer.profileId}` : '');
      const followersRaw = influencer.followers || '';
      const engagementRaw = influencer.avgPlays || influencer.impressions || '';
      const followers = formatStat(followersRaw) || '—';
      const engagement = formatStat(engagementRaw) || '—';
      const niche = categories[0] || influencer.primaryCategory || 'Lifestyle';
      const statusLabel = influencer.response ? capitalizeWords(influencer.response) : 'Not yet invited';
      const statusKey = influencer.response ? influencer.response.toLowerCase() : 'not yet invited';

      return {
        id: influencer.id,
        name,
        handle,
        followers,
        engagement,
        niche,
        categories,
        categoryKeys,
        distance: label,
        distanceKm: km,
        img: influencer.avatarUrl,
        statusKey,
        statusLabel,
        platforms,
        platformKeys,
        area,
        areaKey,
        sources,
        sourceKeys,
        profileUrl: influencer.profileUrl,
        notes: influencer.notes || '',
        influencerType: influencer.influencerType,
        dealType: deriveDealType(influencer.influencerType, influencer.cost),
        score: deriveBaseScore(influencer),
        initials: deriveInitials(name || handle || influencer.profileId),
        profile: influencer,
      } as CreatorCard;
    })
    .filter(card => Boolean(card.name || card.handle));
}

// ── Canonical niche map — ALL variants collapse to one canonical label ────────
// Rule: if an influencer has "skincare" AND "makeup" they both map to "Beauty"
// so the card gets ONE "Beauty" niche, not two duplicate entries.
const NICHE_MAP: Record<string, string> = {
  // ── Beauty (all personal-care variants → Beauty) ──────────────────────────
  beauty: 'Beauty', skincare: 'Beauty', makeup: 'Beauty', haircare: 'Beauty',
  grooming: 'Beauty', cosmetics: 'Beauty', 'skin care': 'Beauty',
  'hair care': 'Beauty', nails: 'Beauty', 'nail art': 'Beauty',
  'personal care': 'Beauty', fragrance: 'Beauty', perfume: 'Beauty',
  // ── Fashion ───────────────────────────────────────────────────────────────
  fashion: 'Fashion', style: 'Fashion', streetwear: 'Fashion',
  thrifting: 'Fashion', vintage: 'Fashion', jewelry: 'Fashion',
  watches: 'Fashion', sneaker: 'Fashion', luxury: 'Fashion',
  ootd: 'Fashion', accessories: 'Fashion', modelling: 'Fashion',
  // ── Lifestyle ─────────────────────────────────────────────────────────────
  lifestyle: 'Lifestyle', 'daily life': 'Lifestyle', vlogger: 'Lifestyle',
  vlogging: 'Lifestyle', 'couple content': 'Lifestyle', 'family content': 'Lifestyle',
  parenting: 'Lifestyle', minimalism: 'Lifestyle', 'college life': 'Lifestyle',
  'student life': 'Lifestyle', 'mom content': 'Lifestyle', 'pet content': 'Lifestyle',
  pets: 'Lifestyle', home: 'Lifestyle', 'home decor': 'Lifestyle',
  'home & living': 'Lifestyle', 'plant parent': 'Lifestyle',
  blogger: 'Lifestyle', blog: 'Lifestyle', creator: 'Lifestyle',
  // ── Food ──────────────────────────────────────────────────────────────────
  food: 'Food', cooking: 'Food', baking: 'Food', nutrition: 'Food',
  'street food': 'Food', restaurant: 'Food', chef: 'Food',
  'coffee culture': 'Food', 'tea culture': 'Food', foodie: 'Food',
  'food blogger': 'Food', recipe: 'Food', 'home cook': 'Food',
  // ── Travel ────────────────────────────────────────────────────────────────
  travel: 'Travel', 'luxury travel': 'Travel', 'budget travel': 'Travel',
  'solo travel': 'Travel', backpacking: 'Travel', adventure: 'Travel',
  'van life': 'Travel', explore: 'Travel', hiking: 'Travel', camping: 'Travel',
  traveller: 'Travel', travelling: 'Travel', wanderlust: 'Travel',
  'travel blogger': 'Travel', trekking: 'Travel', roadtrip: 'Travel',
  // ── Fitness ───────────────────────────────────────────────────────────────
  fitness: 'Fitness', health: 'Fitness', wellness: 'Fitness',
  bodybuilding: 'Fitness', calisthenics: 'Fitness', yoga: 'Fitness',
  running: 'Fitness', cycling: 'Fitness', sports: 'Fitness',
  'mental health': 'Fitness', meditation: 'Fitness', pilates: 'Fitness',
  gym: 'Fitness', workout: 'Fitness', 'weight loss': 'Fitness',
  'healthy living': 'Fitness', nutrition: 'Fitness',
  // ── Technology ────────────────────────────────────────────────────────────
  technology: 'Technology', tech: 'Technology', coding: 'Technology',
  'web development': 'Technology', 'mobile apps': 'Technology',
  'smart gadgets': 'Technology', 'smart home': 'Technology',
  'ui/ux design': 'Technology', engineering: 'Technology',
  'embedded systems': 'Technology', electronics: 'Technology',
  science: 'Technology', robotics: 'Technology', gadgets: 'Technology',
  // ── AI & Automation ───────────────────────────────────────────────────────
  'ai & automation': 'AI & Automation', ai: 'AI & Automation',
  automation: 'AI & Automation', 'virtual reality': 'AI & Automation',
  'augmented reality': 'AI & Automation', metaverse: 'AI & Automation',
  // ── Gaming ────────────────────────────────────────────────────────────────
  gaming: 'Gaming', esports: 'Gaming', 'board games': 'Gaming',
  'card games': 'Gaming', 'lego content': 'Gaming', gamer: 'Gaming',
  // ── Entertainment ─────────────────────────────────────────────────────────
  entertainment: 'Entertainment', comedy: 'Entertainment',
  movies: 'Entertainment', 'movies & ott': 'Entertainment',
  anime: 'Entertainment', meme: 'Entertainment', pranks: 'Entertainment',
  'reaction content': 'Entertainment', storytelling: 'Entertainment',
  'horror content': 'Entertainment', 'mystery content': 'Entertainment',
  asmr: 'Entertainment', 'live streaming': 'Entertainment', memes: 'Entertainment',
  // ── Music & Dance ─────────────────────────────────────────────────────────
  music: 'Music & Dance', dance: 'Music & Dance', singing: 'Music & Dance',
  musician: 'Music & Dance', artist: 'Music & Dance', performer: 'Music & Dance',
  // ── Education ─────────────────────────────────────────────────────────────
  education: 'Education', tutorials: 'Education', books: 'Education',
  'language learning': 'Education', 'facts & knowledge': 'Education',
  'educational shorts': 'Education', 'career guidance': 'Education',
  'public speaking': 'Education', psychology: 'Education',
  philosophy: 'Education', history: 'Education', learning: 'Education',
  // ── Business & Finance ────────────────────────────────────────────────────
  business: 'Business', finance: 'Finance', investment: 'Finance',
  cryptocurrency: 'Finance', 'stock market': 'Finance', trading: 'Finance',
  startups: 'Business', entrepreneurship: 'Business', saas: 'Business',
  freelancing: 'Business', 'passive income': 'Business',
  'side hustles': 'Business', marketing: 'Business',
  'personal branding': 'Business', 'social media': 'Business',
  // ── Nature & Outdoors ─────────────────────────────────────────────────────
  nature: 'Nature', wildlife: 'Nature', 'marine life': 'Nature',
  gardening: 'Nature', sustainability: 'Nature', 'zero waste': 'Nature',
  fishing: 'Nature', survival: 'Nature', environment: 'Nature',
  // ── Art & Photography ─────────────────────────────────────────────────────
  art: 'Art & Photography', photography: 'Art & Photography',
  videography: 'Art & Photography', filmmaking: 'Art & Photography',
  'graphic design': 'Art & Photography', 'drone content': 'Art & Photography',
  'diy & crafts': 'Art & Photography', diy: 'Art & Photography',
  crafts: 'Art & Photography', illustration: 'Art & Photography',
  painting: 'Art & Photography', drawing: 'Art & Photography',
  // ── Motivation ────────────────────────────────────────────────────────────
  motivation: 'Motivation', 'self improvement': 'Motivation',
  'motivational quotes': 'Motivation', 'inspirational stories': 'Motivation',
  'self help': 'Motivation', mindset: 'Motivation',
  // ── Fashion catchall ──────────────────────────────────────────────────────
  model: 'Fashion',
};

// Strip emojis and non-ascii decoration from a string
function stripEmojis(s: string): string {
  return s.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}©®‍️]/gu, '').replace(/\s+/g, ' ').trim();
}

// Ordered list of [keyword-regex, canonical] — first match wins per segment
const NICHE_RULES: [RegExp, string][] = [
  [/\bbeauty\b|\bskincare\b|\bskin care\b|\bmakeup\b|\bhaircare\b|\bhair care\b|\bgrooming\b|\bcosmetic\b|\bnail\b|\bfragrance\b|\bperfume\b/, 'Beauty'],
  [/\bfashion\b|\bstyle\b|\bstreetwear\b|\bthrift\b|\bvintage\b|\bjewel\b|\bwatch\b|\bsneaker\b|\bluxury\b|\bootd\b|\baccessor\b|\bmodell\b|\bfasion\b/, 'Fashion'],
  [/\bfood\b|\bcook\b|\bbak\b|\brecipe\b|\bchef\b|\brestaurant\b|\bstreet food\b|\bcoffee\b|\btea\b|\bfoodie\b|\beating\b|\bcuisine\b|\bdrink\b|\bbeverage\b|\bgourmet\b|\bgrub\b/, 'Food'],
  [/\btravel\b|\btravell\b|\bwanderlust\b|\bbackpack\b|\badventur\b|\bexplor\b|\bhik\b|\bcamp\b|\btrek\b|\broadtrip\b|\bvan life\b/, 'Travel'],
  [/\bfitness\b|\bgym\b|\bworkout\b|\bhealth\b|\bwellness\b|\byoga\b|\bbodybuilding\b|\bcalisthenic\b|\bpilates\b|\brunning\b|\bcycling\b|\bsport\b|\bmeditat\b|\bmental health\b|\bweight loss\b/, 'Fitness'],
  [/\blifestyle\b|\bdaily life\b|\bparenting\b|\bmom\b|\bminimalism\b|\bcollege\b|\bstudent\b|\bhome decor\b|\bhome & living\b|\bhome\b|\bpet\b|\bplant\b/, 'Lifestyle'],
  [/\btech\b|\btechnology\b|\bcoding\b|\bprogramm\b|\bweb dev\b|\bmobile app\b|\bgadget\b|\bsmart home\b|\bui\/ux\b|\bengineering\b|\bscience\b|\brobotic\b|\belectronic\b/, 'Technology'],
  [/\bai\b|\bautomation\b|\bvirtual reality\b|\baugmented reality\b|\bmetaverse\b/, 'AI & Automation'],
  [/\bgaming\b|\besport\b|\bgamer\b|\bboard game\b|\bcard game\b|\blego\b/, 'Gaming'],
  [/\bcomedy\b|\bmeme\b|\bprank\b|\bantertainment\b|\bstorytell\b|\basmr\b|\banime\b|\bhorror\b|\bmystery\b|\blive stream\b|\bott\b|\bmovie\b/, 'Entertainment'],
  [/\bmusic\b|\bdance\b|\bsinging\b|\bmusician\b|\bperformer\b/, 'Music & Dance'],
  [/\beducat\b|\btutor\b|\bbook\b|\blearn\b|\bknowledge\b|\bfact\b|\bcareer\b|\bpsychology\b|\bphilosophy\b|\bhistory\b/, 'Education'],
  [/\bfinance\b|\binvest\b|\bcrypto\b|\bstock\b|\btrading\b/, 'Finance'],
  [/\bbusiness\b|\bentrepreneur\b|\bstartup\b|\bsaas\b|\bfreelance\b|\bmarketing\b|\bbranding\b|\bsocial media\b/, 'Business'],
  [/\bnature\b|\bwildlife\b|\bgarden\b|\bsustainab\b|\bzero waste\b|\bfish\b|\bsurvival\b|\benviron\b/, 'Nature'],
  [/\bphoto\b|\bvideograph\b|\bfilm\b|\bgraphic design\b|\bdiy\b|\bcrafts\b|\bart\b|\billustrat\b|\bpainting\b|\bdrawing\b|\bdrone\b/, 'Art & Photography'],
  [/\bmotivat\b|\bself.improv\b|\bself help\b|\bmindset\b|\binspir\b/, 'Motivation'],
  [/\bmodel\b/, 'Fashion'],
  [/\bblog\b|\bvlog\b|\bcreator\b|\bdigital creator\b|\binfluencer\b/, 'Lifestyle'],
  [/\bplace\b|\blocal\b|\bcity\b|\bbangalore\b|\bbengaluru\b/, 'Lifestyle'],
];

function mapToCanonicalNiche(raw: string): string {
  const cleaned = stripEmojis(raw).toLowerCase().trim();
  if (!cleaned) return '';
  // Try exact map lookup first (fastest path)
  if (NICHE_MAP[cleaned]) return NICHE_MAP[cleaned];
  // Fuzzy: check each rule regex against the segment
  for (const [re, canonical] of NICHE_RULES) {
    if (re.test(cleaned)) return canonical;
  }
  // Fallback: capitalize the original
  return capitalizeWords(raw.trim());
}

// Extract ALL canonical niches from a single raw category string
// e.g. "Fashion And Lifestyle" → ['Fashion', 'Lifestyle']
// e.g. "Fashion 👗" → ['Fashion']
// e.g. "Food / Travel / Lifestyle" → already split before this call, but handles slash too
function extractNichesFromSegment(raw: string): string[] {
  const cleaned = stripEmojis(raw).toLowerCase().trim();
  if (!cleaned) return [];
  const found = new Set<string>();
  for (const [re, canonical] of NICHE_RULES) {
    if (re.test(cleaned)) found.add(canonical);
  }
  // Also try exact map
  if (NICHE_MAP[cleaned]) found.add(NICHE_MAP[cleaned]);
  // If nothing matched, fallback to capitalizing
  if (found.size === 0) {
    const fb = capitalizeWords(raw.trim());
    if (fb) found.add(fb);
  }
  return Array.from(found);
}

function buildCategoryOptions(cards: CreatorCard[]): string[] {
  // cards.categories are already canonical (set during mapInfluencersToCards)
  const seen = new Set<string>();
  cards.forEach(card => card.categories.forEach(c => { if (c) seen.add(c); }));
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function buildPlatformOptions(cards: CreatorCard[]): string[] {
  const set = new Set<string>();
  cards.forEach(card => card.platforms.forEach(p => set.add(p)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function buildMapPositions(cards: CreatorCard[]): Record<string, { x: number; y: number; initials: string }> {
  const positions: Record<string, { x: number; y: number; initials: string }> = {};
  cards.forEach((card, index) => {
    positions[card.id] = { ...getMapPosition(index), initials: card.initials };
  });
  return positions;
}

function filterCreators(
  cards: CreatorCard[],
  selectedRadius: string,
  activeNiches: string[],
  activePlatforms: string[],
  activeDealTypes: string[],
  activeRegions: string[],
  search: string,
): CreatorCard[] {
  const radiusValue = Number.isNaN(parseFloat(selectedRadius)) ? Infinity : parseFloat(selectedRadius);
  const searchValue = search.trim().toLowerCase();
  return cards.filter(card => {
    const radiusOk = card.distanceKm <= radiusValue;
    // card.categories are already canonical — direct comparison
    const nicheOk = activeNiches.length === 0 || activeNiches.some(n => card.categories.includes(n));
    const searchOk = !searchValue ||
      card.name.toLowerCase().includes(searchValue) ||
      card.handle.toLowerCase().includes(searchValue) ||
      card.area.toLowerCase().includes(searchValue);
    const platformOk = activePlatforms.length === 0 || activePlatforms.some(p => {
      const pl = p.toLowerCase();
      const social = card.profile.socialLinks || {};
      if (pl === 'youtube'   && social.youtube)   return true;
      if (pl === 'facebook'  && social.facebook)  return true;
      if (pl === 'tiktok'    && social.tiktok)    return true;
      if (pl === 'twitter'   && social.twitter)   return true;
      if (pl === 'instagram') return true;
      return card.platformKeys.includes(pl);
    });
    const dealTypeOk = activeDealTypes.length === 0 || activeDealTypes.includes(card.dealType);
    const regionOk = activeRegions.length === 0 || activeRegions.some(r =>
      card.area.toLowerCase().includes(r.toLowerCase())
    );
    return radiusOk && nicheOk && searchOk && platformOk && dealTypeOk && regionOk;
  });
}

// Full Bangalore area list — alphabetical, always shown in Region filter
const BANGALORE_AREAS = [
  'Bangalore',
  'Banashankari', 'Banaswadi', 'Bannerghatta', 'Basavanagudi', 'Basaveshwara Nagar',
  'Bellandur', 'Bommanahalli', 'BTM Layout', 'Byrathi',
  'Chandapura', 'Chickpet', 'CV Raman Nagar',
  'Dasarahalli', 'Devanahalli', 'Dodda Ballapur',
  'Electronic City', 'Electronics City Phase 2',
  'Fraser Town',
  'Frazer Town', 'Girinagar',
  'HAL', 'Hebbal', 'Hennur', 'Horamavu', 'Hoodi', 'Hosa Road', 'HSR Layout',
  'Hulimavu',
  'Indiranagar', 'Ittangur',
  'Jayanagar', 'JP Nagar',
  'Kadugodi', 'Kalyan Nagar', 'Kammanahalli', 'Kanakapura Road', 'Kanakpura',
  'Koramangala', 'KR Puram', 'Krishnarajapuram', 'Kudlu Gate',
  'Lal Bagh', 'Lingarajapuram',
  'Mahadevapura', 'Malleshwaram', 'Marathahalli', 'Marthahalli', 'MG Road',
  'Mysore Road',
  'Nagavara', 'Nandini Layout', 'Nayanahalli', 'NR Colony',
  'Ombr Layout',
  'Padmanabhanagar',
  'Rajajinagar', 'Ramamurthy Nagar', 'RT Nagar',
  'Sadashivanagar', 'Sarjapur', 'Sarjapur Road', 'Shivajinagar', 'Solladevanahalli',
  'South Bangalore',
  'Thanisandra', 'Tumkur Road',
  'Ulsoor',
  'Uttarahalli',
  'Vijayanagar', 'Varthur', 'Vidyaranyapura',
  'Whitefield', 'Wilson Garden',
  'Yelahanka', 'Yeshwanthpur',
];

function buildRegionOptions(cards: CreatorCard[]): string[] {
  // Start with the full hardcoded list, then add any areas from the data not already covered
  const base = new Set(BANGALORE_AREAS.map(a => a.toLowerCase()));
  const extra: string[] = [];
  cards.forEach(card => {
    const a = (card.area || '').trim();
    if (a && !base.has(a.toLowerCase())) { extra.push(a); base.add(a.toLowerCase()); }
  });
  return [...BANGALORE_AREAS, ...extra.sort((a, b) => a.localeCompare(b))];
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition ${
              p === page ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  selectedRadius: string;
  onRadius: (v: string) => void;
  // Niche (sub-category under Content)
  categoryOptions: string[];
  activeNiches: string[];
  onToggleNiche: (n: string) => void;
  // Platform
  platformOptions: string[];
  activePlatforms: string[];
  onTogglePlatform: (p: string) => void;
  // Deal Type
  activeDealTypes: string[];
  onToggleDealType: (t: string) => void;
  // Region
  regionOptions: string[];
  activeRegions: string[];
  onToggleRegion: (r: string) => void;
}

// ── SVG brand icons ────────────────────────────────────────────────────────────
function SocialIcon({ platform, size = 28 }: { platform: string; size?: number }) {
  const s = size;
  const r = s / 2;
  if (platform === 'youtube') return (
    <svg width={s} height={s} viewBox="0 0 28 28" className="drop-shadow-sm">
      <rect width="28" height="28" rx="14" fill="#FF0000"/>
      <path d="M20.5 10.8c-.2-.8-.8-1.4-1.6-1.6C17.5 9 14 9 14 9s-3.5 0-4.9.2c-.8.2-1.4.8-1.6 1.6C7.3 12.2 7.3 14 7.3 14s0 1.8.2 3.2c.2.8.8 1.4 1.6 1.6C10.5 19 14 19 14 19s3.5 0 4.9-.2c.8-.2 1.4-.8 1.6-1.6.2-1.4.2-3.2.2-3.2s0-1.8-.2-3.2zm-7.9 5.1v-3.8l4.1 1.9-4.1 1.9z" fill="white"/>
    </svg>
  );
  if (platform === 'instagram') return (
    <svg width={s} height={s} viewBox="0 0 28 28" className="drop-shadow-sm">
      <defs>
        <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="5%" stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/>
          <stop offset="60%" stopColor="#d6249f"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill="url(#ig-g)"/>
      <rect x="7" y="7" width="14" height="14" rx="4" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="14" cy="14" r="3.5" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="18.5" cy="9.5" r="1" fill="white"/>
    </svg>
  );
  if (platform === 'facebook') return (
    <svg width={s} height={s} viewBox="0 0 28 28" className="drop-shadow-sm">
      <rect width="28" height="28" rx="14" fill="#1877F2"/>
      <path d="M15.5 9.5h2V7h-2c-2.2 0-4 1.8-4 4v1.5H10V15h1.5v6h2.5v-6h2l.5-2.5h-2.5V11c0-.8.7-1.5 1.5-1.5z" fill="white"/>
    </svg>
  );
  if (platform === 'tiktok') return (
    <svg width={s} height={s} viewBox="0 0 28 28" className="drop-shadow-sm">
      <rect width="28" height="28" rx="7" fill="#010101"/>
      <path d="M19 8.5c-1.1-.7-1.8-1.9-2-3.5h-2.5v13c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5c.3 0 .5 0 .7.1V13c-.2 0-.5-.1-.7-.1-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5V9.7c1 .7 2.2 1.1 3.5 1.1v-2.5c-.7 0-1.3-.3-1.5-.8z" fill="white"/>
    </svg>
  );
  if (platform === 'twitter') return (
    <svg width={s} height={s} viewBox="0 0 28 28" className="drop-shadow-sm">
      <rect width="28" height="28" rx="14" fill="#000000"/>
      <path d="M7 7l5.5 7.3L7 21h1.7l4.6-5.3L17.4 21H22l-5.8-7.7L21 7h-1.7l-4.2 4.9L13.6 7H7zm2.8 1.2h2.7l8.7 11.6h-2.7L9.8 8.2z" fill="white"/>
    </svg>
  );
  // default: Instagram
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" className="drop-shadow-sm">
      <defs>
        <radialGradient id={`ig-d-${s}`} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill={`url(#ig-d-${s})`}/>
      <rect x="7" y="7" width="14" height="14" rx="4" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="14" cy="14" r="3.5" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="18.5" cy="9.5" r="1" fill="white"/>
    </svg>
  );
}

const PLATFORM_OPTIONS = [
  { key: 'Instagram', label: 'Instagram', color: '#E1306C' },
  { key: 'YouTube',   label: 'YouTube',   color: '#FF0000' },
  { key: 'Facebook',  label: 'Facebook',  color: '#1877F2' },
  { key: 'TikTok',    label: 'TikTok',    color: '#000000' },
  { key: 'Twitter',   label: 'Twitter/X', color: '#1DA1F2' },
  { key: 'Blog',      label: 'Blog',      color: '#6B7280' },
  { key: 'Podcast',   label: 'Podcast',   color: '#9333ea' },
];

const DEAL_TYPE_OPTIONS = [
  { key: 'paid',   label: 'Paid',   dot: '#10b981' },
  { key: 'barter', label: 'Barter', dot: '#8b5cf6' },
  { key: 'unpaid', label: 'Unpaid', dot: '#9ca3af' },
];

// ── Unified filter panel: single button → left main tabs + right sub-options ──
type FilterCategory = 'type' | 'platform' | 'region' | 'niche';

const FILTER_CATEGORIES: { key: FilterCategory; label: string; icon: string }[] = [
  { key: 'type',     label: 'Deal Type', icon: '💰' },
  { key: 'platform', label: 'Platform',  icon: '📱' },
  { key: 'region',   label: 'Region',    icon: '📍' },
  { key: 'niche',    label: 'Niche',     icon: '🏷' },
];

function FilterPanel({
  activeNiches, onToggleNiche, categoryOptions,
  activePlatforms, onTogglePlatform,
  activeDealTypes, onToggleDealType,
  activeRegions, onToggleRegion, regionOptions,
}: {
  activeNiches: string[]; onToggleNiche: (n: string) => void; categoryOptions: string[];
  activePlatforms: string[]; onTogglePlatform: (p: string) => void;
  activeDealTypes: string[]; onToggleDealType: (t: string) => void;
  activeRegions: string[]; onToggleRegion: (r: string) => void; regionOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterCategory>('type');
  const [nicheQ, setNicheQ] = useState('');
  const [regionQ, setRegionQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const totalActive = activeNiches.length + activePlatforms.length + activeDealTypes.length + activeRegions.length;

  const getActiveForTab = (tab: FilterCategory) => {
    if (tab === 'type')     return activeDealTypes.length;
    if (tab === 'platform') return activePlatforms.length;
    if (tab === 'region')   return activeRegions.length;
    if (tab === 'niche')    return activeNiches.length;
    return 0;
  };

  const renderSubOptions = () => {
    if (activeTab === 'type') {
      return DEAL_TYPE_OPTIONS.map(opt => {
        const active = activeDealTypes.includes(opt.key);
        return (
          <button key={opt.key} onClick={() => onToggleDealType(opt.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
            }`}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
            <span className="flex-1 text-left">{opt.label}</span>
            {active && <Check className="w-3.5 h-3.5" />}
          </button>
        );
      });
    }
    if (activeTab === 'platform') {
      return PLATFORM_OPTIONS.map(opt => {
        const active = activePlatforms.includes(opt.key);
        return (
          <button key={opt.key} onClick={() => onTogglePlatform(opt.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
            }`}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.color }} />
            <span className="flex-1 text-left">{opt.label}</span>
            {active && <Check className="w-3.5 h-3.5" />}
          </button>
        );
      });
    }
    if (activeTab === 'region') {
      const filtered = regionOptions.filter(r => !regionQ || r.toLowerCase().includes(regionQ.toLowerCase()));
      return (
        <>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input autoFocus value={regionQ} onChange={e => setRegionQ(e.target.value)} placeholder="Search region…"
              className="flex-1 outline-none text-xs bg-transparent text-gray-700 placeholder-gray-400" />
            {regionQ && <button onClick={() => setRegionQ('')}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
          <div className="space-y-1">
            {filtered.map(r => {
              const active = activeRegions.includes(r);
              return (
                <button key={r} onClick={() => onToggleRegion(r)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}>
                  <span className="flex-1 text-left">{r}</span>
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </>
      );
    }
    if (activeTab === 'niche') {
      const filtered = categoryOptions.filter(n => !nicheQ || n.toLowerCase().includes(nicheQ.toLowerCase()));
      return (
        <>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input autoFocus value={nicheQ} onChange={e => setNicheQ(e.target.value)} placeholder="Search niche…"
              className="flex-1 outline-none text-xs bg-transparent text-gray-700 placeholder-gray-400" />
            {nicheQ && <button onClick={() => setNicheQ('')}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
          <div className="space-y-1">
            {filtered.map(n => {
              const active = activeNiches.includes(n);
              return (
                <button key={n} onClick={() => onToggleNiche(n)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    active ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300'
                  }`}>
                  <span className="flex-1 text-left">{n}</span>
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
          totalActive > 0 ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM4 9h12a1 1 0 110 2H4a1 1 0 110-2zm3 5h6a1 1 0 110 2H7a1 1 0 110-2z" clipRule="evenodd"/>
        </svg>
        Filters
        {totalActive > 0 && (
          <span className="bg-cyan-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{totalActive}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-40 shadow-2xl rounded-2xl border border-gray-200 bg-white overflow-hidden flex" style={{ width: 460 }}>
          {/* Left: main categories */}
          <div className="w-40 bg-gray-50 border-r border-gray-200 py-2 flex-shrink-0 overflow-y-auto" style={{ maxHeight: 360 }}>
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Filters</div>
            {FILTER_CATEGORIES.map(cat => {
              const count = getActiveForTab(cat.key);
              const isCurrent = activeTab === cat.key;
              return (
                <button key={cat.key} onClick={() => setActiveTab(cat.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                    isCurrent ? 'bg-white text-gray-900 border-r-2 border-cyan-500' : 'text-gray-600 hover:bg-white/60'
                  }`}>
                  <span>{cat.icon}</span>
                  <span className="flex-1">{cat.label}</span>
                  {count > 0 && (
                    <span className="bg-cyan-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center">{count}</span>
                  )}
                </button>
              );
            })}
            {totalActive > 0 && (
              <button
                onClick={() => {
                  activeNiches.forEach(n => onToggleNiche(n));
                  activePlatforms.forEach(p => onTogglePlatform(p));
                  activeDealTypes.forEach(t => onToggleDealType(t));
                  activeRegions.forEach(r => onToggleRegion(r));
                }}
                className="w-full mt-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 text-left border-t border-gray-200 transition-colors"
              >
                Clear all ({totalActive})
              </button>
            )}
          </div>

          {/* Right: sub options */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1.5" style={{ maxHeight: 360 }}>
            {renderSubOptions()}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBar({ search, onSearch, selectedRadius, onRadius, categoryOptions, activeNiches, onToggleNiche, platformOptions, activePlatforms, onTogglePlatform, activeDealTypes, onToggleDealType, regionOptions, activeRegions, onToggleRegion }: FilterBarProps) {
  const totalActive = activeNiches.length + activePlatforms.length + activeDealTypes.length + activeRegions.length;

  const allChips = [
    ...activeDealTypes.map(t => ({ key: `type-${t}`, label: DEAL_TYPE_OPTIONS.find(d => d.key === t)?.label ?? t, onRemove: () => onToggleDealType(t) })),
    ...activePlatforms.map(p => ({ key: `plat-${p}`, label: p, onRemove: () => onTogglePlatform(p) })),
    ...activeRegions.map(r => ({ key: `reg-${r}`, label: r, onRemove: () => onToggleRegion(r) })),
    ...activeNiches.map(n => ({ key: `niche-${n}`, label: n, onRemove: () => onToggleNiche(n) })),
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-4 flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search name, handle, city…"
          className="flex-1 outline-none text-sm bg-transparent text-gray-700 placeholder-gray-400" />
        {search && <button onClick={() => onSearch('')}><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" /></button>}
      </div>

      {/* Radius */}
      <select value={selectedRadius} onChange={e => onRadius(e.target.value)}
        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none">
        <option value="5">Within 5km</option>
        <option value="10">Within 10km</option>
        <option value="20">Within 20km</option>
        <option value="9999">All areas</option>
      </select>

      {/* Single filter panel button */}
      <FilterPanel
        activeNiches={activeNiches} onToggleNiche={onToggleNiche} categoryOptions={categoryOptions}
        activePlatforms={activePlatforms} onTogglePlatform={onTogglePlatform}
        activeDealTypes={activeDealTypes} onToggleDealType={onToggleDealType}
        activeRegions={activeRegions} onToggleRegion={onToggleRegion} regionOptions={regionOptions}
      />

      {/* Active filter chips */}
      {allChips.map(chip => (
        <span key={chip.key} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">
          {chip.label}
          <button onClick={chip.onRemove}><X className="w-3 h-3" /></button>
        </span>
      ))}
    </div>
  );
}

// ── Area → Bangalore coordinates ───────────────────────────────────────────────
const AREA_COORDS: Record<string, [number, number]> = {
  'whitefield':           [77.7480, 12.9698],
  'bangalore':            [77.5946, 12.9716],
  'bengaluru':            [77.5946, 12.9716],
  'banglore':             [77.5946, 12.9716],
  'indiranagar':          [77.6408, 12.9784],
  'koramangala':          [77.6245, 12.9352],
  'koramanagala':         [77.6245, 12.9352],
  'hsr layout':           [77.6381, 12.9116],
  'marathahalli':         [77.7064, 12.9591],
  'jp nagar':             [77.5856, 12.9063],
  'jayanagar':            [77.5835, 12.9312],
  'malleshwaram':         [77.5655, 13.0032],
  'rajajinagar':          [77.5561, 12.9917],
  'hebbal':               [77.5973, 13.0351],
  'yelahanka':            [77.5940, 13.1005],
  'electronic city':      [77.6770, 12.8399],
  'btm layout':           [77.6109, 12.9166],
  'bannerghatta':         [77.5945, 12.8914],
  'sarjapur':             [77.6877, 12.9162],
  'ulsoor':               [77.6194, 12.9849],
  'msrit/bangalore':      [77.5597, 13.0148],
  'hennur':               [77.6378, 13.0378],
  'kr puram':             [77.6960, 13.0018],
  'south east bangalore': [77.6600, 12.9200],
  'profile not available':[77.5946, 12.9716],
};

function getCoords(area: string): [number, number] {
  const key = (area || '').toLowerCase().trim();
  if (AREA_COORDS[key]) return AREA_COORDS[key];
  // fuzzy: check if key contains known area
  for (const [k, v] of Object.entries(AREA_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  // spread randomly around Bangalore
  const seed = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = (n: number, range: number) => n + ((seed % 100) / 100 - 0.5) * range;
  return [jitter(77.5946, 0.12), jitter(12.9716, 0.10)];
}

// ── Real MapLibre map for discover view ────────────────────────────────────────
interface DiscoverMapViewProps {
  creators: CreatorCard[];
  selected: string | null;
  onSelect: (id: string) => void;
}

function DiscoverMapView({ creators, selected, onSelect }: DiscoverMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const markersRef   = useRef<{ id: string; marker: maplibregl.Marker; el: HTMLDivElement; inner: HTMLDivElement }[]>([]);

  // Build map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [77.5946, 12.9716],
      zoom: 11,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      creators.forEach(creator => {
        const [lng, lat] = getCoords(creator.area);

        // IMPORTANT: MapLibre sets transform:translate on the outer element.
        // Never set transform on it — use an inner wrapper for all visual effects.
        const outer = document.createElement('div');
        outer.style.cssText = 'width:40px;height:40px;cursor:pointer;';

        const inner = document.createElement('div');
        inner.style.cssText = `
          width:40px;height:40px;border-radius:50%;
          background:white;border:2.5px solid #111827;
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:12px;color:#111827;
          box-shadow:0 2px 10px rgba(0,0,0,0.18);
          transition:transform 0.15s ease,box-shadow 0.15s ease,border-color 0.15s ease;
          overflow:hidden;
          transform-origin:center center;
        `;

        if (creator.img) {
          const img = document.createElement('img');
          img.src = creator.img;
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
          img.onerror = () => { inner.removeChild(img); inner.textContent = creator.initials; };
          inner.appendChild(img);
        } else {
          inner.textContent = creator.initials;
        }

        outer.appendChild(inner);

        // Hover — scale the INNER element only
        outer.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.25)';
          inner.style.boxShadow = '0 4px 16px rgba(0,0,0,0.28)';
        });
        outer.addEventListener('mouseleave', () => {
          const isSel = markersRef.current.find(m => m.id === creator.id && m.el === outer);
          inner.style.transform = isSel ? 'scale(1.15)' : 'scale(1)';
          inner.style.boxShadow = '0 2px 10px rgba(0,0,0,0.18)';
        });
        outer.addEventListener('click', () => onSelect(creator.id));

        const marker = new maplibregl.Marker({ element: outer })
          .setLngLat([lng, lat])
          .addTo(map);

        markersRef.current.push({ id: creator.id, marker, el: outer, inner });
      });

      // Restaurant location dot
      const dot = document.createElement('div');
      dot.style.cssText = `
        width:16px;height:16px;border-radius:50%;
        background:#06b6d4;border:3px solid white;
        box-shadow:0 0 0 6px rgba(6,182,212,0.2);
      `;
      new maplibregl.Marker({ element: dot }).setLngLat([77.5946, 12.9716]).addTo(map);
    });

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Highlight selected marker — always target INNER element, never OUTER
  useEffect(() => {
    markersRef.current.forEach(({ id, inner }) => {
      if (id === selected) {
        inner.style.background = '#111827';
        inner.style.borderColor = '#06b6d4';
        inner.style.color = 'white';
        inner.style.transform = 'scale(1.2)';
        inner.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.4), 0 4px 16px rgba(0,0,0,0.3)';
      } else {
        inner.style.background = 'white';
        inner.style.borderColor = '#111827';
        inner.style.color = '#111827';
        inner.style.transform = 'scale(1)';
        inner.style.boxShadow = '0 2px 10px rgba(0,0,0,0.18)';
      }
    });

    if (selected && mapRef.current) {
      const creator = creators.find(c => c.id === selected);
      if (creator) {
        const [lng, lat] = getCoords(creator.area);
        mapRef.current.flyTo({ center: [lng, lat], zoom: 13, duration: 600, offset: [0, 60] });
      }
    }
  }, [selected, creators]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Add Influencer Modal ───────────────────────────────────────────────────────
interface AddInfluencerForm {
  name: string; handle: string; followers: string; category: string;
  influencerType: string; cost: string; email: string; phone: string;
  area: string; notes: string; profileUrl: string; gender: string; avgPlays: string;
}
const EMPTY_FORM: AddInfluencerForm = {
  name: '', handle: '', followers: '', category: '', influencerType: 'Paid',
  cost: '', email: '', phone: '', area: 'Bengaluru', notes: '', profileUrl: '', gender: '', avgPlays: '',
};

// Field must be outside the modal component so React doesn't remount it on every render (would lose focus)
interface ModalFieldProps {
  label: string;
  fieldKey: keyof AddInfluencerForm;
  form: AddInfluencerForm;
  errors: Partial<Record<keyof AddInfluencerForm, string>>;
  onChange: (k: keyof AddInfluencerForm, v: string) => void;
  type?: string;
  placeholder?: string;
}
function ModalField({ label, fieldKey, form, errors, onChange, type = 'text', placeholder = '' }: ModalFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[fieldKey]}
        onChange={e => onChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-300 ${
          errors[fieldKey] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
        }`}
      />
      {errors[fieldKey] && <p className="text-[10px] text-red-500 mt-0.5">{errors[fieldKey]}</p>}
    </div>
  );
}

function AddInfluencerModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (f: AddInfluencerForm) => void }) {
  const [form, setForm] = useState<AddInfluencerForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof AddInfluencerForm, string>>>({});

  const handleChange = (k: keyof AddInfluencerForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.handle.trim()) e.handle = 'Handle is required';
    if (!form.followers.trim()) e.followers = 'Followers is required';
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  if (!open) return null;

  const fp = { form, errors, onChange: handleChange };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: 'calc(100vh - 48px)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-900 text-white rounded-t-2xl flex-shrink-0">
          <div>
            <div className="font-bold text-base">Add Influencer</div>
            <div className="text-xs text-white/60 mt-0.5">Manually add a creator to your discovery list</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Identity */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Identity</div>
            <div className="grid grid-cols-2 gap-3">
              <ModalField {...fp} label="Full Name *" fieldKey="name" placeholder="e.g. Rupal Prakash" />
              <ModalField {...fp} label="Instagram Handle *" fieldKey="handle" placeholder="@username" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                <select value={form.gender} onChange={e => handleChange('gender', e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-300">
                  <option value="">Select</option>
                  <option>Female</option><option>Male</option><option>Non-binary</option>
                </select>
              </div>
              <ModalField {...fp} label="Profile URL" fieldKey="profileUrl" placeholder="https://instagram.com/..." />
            </div>
          </div>

          {/* Reach */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Reach & Content</div>
            <div className="grid grid-cols-2 gap-3">
              <ModalField {...fp} label="Followers *" fieldKey="followers" placeholder="e.g. 226k" />
              <ModalField {...fp} label="Avg. Plays / Impressions" fieldKey="avgPlays" placeholder="e.g. 35k" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category / Niche</label>
                <input value={form.category} onChange={e => handleChange('category', e.target.value)} placeholder="Food, Lifestyle, Travel…"
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Location / Area</label>
                <input value={form.area} onChange={e => handleChange('area', e.target.value)} placeholder="Bengaluru"
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-300" />
              </div>
            </div>
          </div>

          {/* Deal */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Deal & Collab</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Deal Type</label>
                <select value={form.influencerType} onChange={e => handleChange('influencerType', e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-300">
                  <option value="Paid">Paid</option>
                  <option value="Barter">Barter</option>
                  <option value="Unpaid">Unpaid / Gifting</option>
                </select>
              </div>
              <ModalField {...fp} label="Cost / Rate" fieldKey="cost" placeholder="e.g. 17k or Barter" />
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Contact</div>
            <div className="grid grid-cols-2 gap-3">
              <ModalField {...fp} label="Email" fieldKey="email" type="email" placeholder="creator@email.com" />
              <ModalField {...fp} label="Phone" fieldKey="phone" placeholder="+91 9999999999" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3}
              placeholder="Any additional notes about this creator…"
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-300 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
          <button onClick={submit} className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-bold transition flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Influencer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OutboundDiscovery() {
  const { influencers, loading, error } = useInfluencers();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedRadius, setSelectedRadius] = useState('9999');
  const [search, setSearch] = useState('');
  const [activeNiches, setActiveNiches] = useState<string[]>([]);
  const [activePlatforms, setActivePlatforms] = useState<string[]>([]);
  const [activeDealTypes, setActiveDealTypes] = useState<string[]>([]);
  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  const [mapSelected, setMapSelected] = useState<string | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightCreator, setSpotlightCreator] = useState<CreatorCard | null>(null);
  const [spotlightTab, setSpotlightTab] = useState<'profile' | 'chat'>('profile');
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [manualCreators, setManualCreators] = useState<CreatorCard[]>([]);

  const baseCards = useMemo(() => mapInfluencersToCards(influencers), [influencers]);
  const creatorCards = useMemo(() => [...baseCards, ...manualCreators], [baseCards, manualCreators]);
  const categoryOptions = useMemo(() => buildCategoryOptions(creatorCards), [creatorCards]);
  const platformOptions = useMemo(() => buildPlatformOptions(creatorCards), [creatorCards]);
  const regionOptions = useMemo(() => buildRegionOptions(creatorCards), [creatorCards]);
  const mapPositions = useMemo(() => buildMapPositions(creatorCards), [creatorCards]);

  const filtered = useMemo(
    () => filterCreators(creatorCards, selectedRadius, activeNiches, activePlatforms, activeDealTypes, activeRegions, search),
    [creatorCards, selectedRadius, activeNiches, activePlatforms, activeDealTypes, activeRegions, search],
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  useEffect(() => {
    setPage(1);
    setMapSelected(null);
  }, [selectedRadius, activeNiches, activePlatforms, activeDealTypes, activeRegions, search]);

  useEffect(() => {
    if (filtered.length === 0) {
      setMapSelected(null);
      setSpotlightCreator(null);
      setSpotlightOpen(false);
      return;
    }
    setMapSelected(prev => (prev && filtered.some(c => c.id === prev) ? prev : filtered[0]?.id ?? null));
    setSpotlightCreator(prev => (prev && filtered.some(c => c.id === prev.id) ? prev : filtered[0] ?? null));
  }, [filtered]);

  const toggleNiche = (n: string) => setActiveNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  const togglePlatform = (p: string) => setActivePlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleDealType = (t: string) => setActiveDealTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleRegion = (r: string) => setActiveRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [liked,   setLiked]   = useState<Set<string>>(new Set());
  const [listFilter, setListFilter] = useState<'starred' | 'liked' | null>(null);

  const toggleStar = (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); setStarred(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const toggleLike = (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const starredCards = useMemo(() => creatorCards.filter(c => starred.has(c.id)), [creatorCards, starred]);
  const likedCards   = useMemo(() => creatorCards.filter(c => liked.has(c.id)), [creatorCards, liked]);
  const activeListCards = listFilter === 'starred' ? starredCards : listFilter === 'liked' ? likedCards : null;

  const openSpotlight = (card: CreatorCard, tab: 'profile' | 'chat' = 'profile') => { setSpotlightCreator(card); setSpotlightTab(tab); setSpotlightOpen(true); };

  const handleAddInfluencer = (form: AddInfluencerForm) => {
    const id = `manual-${Date.now()}`;
    const handle = form.handle.startsWith('@') ? form.handle : `@${form.handle}`;
    const cats = form.category ? form.category.split(',').map(c => c.trim()).filter(Boolean) : ['Lifestyle'];
    const newCard: CreatorCard = {
      id, name: form.name, handle,
      followers: form.followers, engagement: form.avgPlays || '—',
      niche: cats[0], categories: cats, categoryKeys: cats.map(normalizeKey),
      distance: '0 km', distanceKm: 0,
      img: '', statusKey: 'not yet invited', statusLabel: 'Not yet invited',
      platforms: ['Instagram'], platformKeys: ['instagram'],
      area: form.area || 'Bengaluru', areaKey: normalizeKey(form.area || 'Bengaluru'),
      sources: [], sourceKeys: [],
      profileUrl: form.profileUrl || `https://www.instagram.com/${form.handle.replace('@', '')}/`,
      notes: form.notes, influencerType: form.influencerType,
      dealType: deriveDealType(form.influencerType, form.cost),
      score: 95,
      initials: deriveInitials(form.name || form.handle),
      profile: {
        id, instagramId: '', fbid: '', name: form.name, handle,
        profileId: form.handle.replace('@', ''), profileUrl: form.profileUrl,
        gender: form.gender, followers: form.followers, followersExact: 0,
        followingCount: 0, postsCount: 0, igtvCount: 0, highlightReelCount: 0,
        category: form.category, categories: cats, primaryCategory: cats[0],
        avgPlays: form.avgPlays, impressions: '',
        areaOrCity: form.area, influencerType: form.influencerType,
        response: '', cost: form.cost, phone: form.phone, email: form.email,
        notes: form.notes, source: 'Manual', sourceTags: ['Manual'],
        avatarUrl: '', profilePicLocal: '', bio: '', isVerified: false,
        isPrivate: false, isBusinessAccount: false, joinedRecently: false,
        businessCategory: '', externalUrl: '', externalUrls: [], socialLinks: {},
        latestPosts: [], scraped: false,
      },
    };
    setManualCreators(prev => [newCard, ...prev]);
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Discover Creators</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? 'Loading creator data…'
                : `${filtered.length} of ${creatorCards.length} creators · page ${page} of ${totalPages || 1}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Add creator */}
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Creator
            </button>

            {/* Shortlist button */}
            <button
              onClick={() => setListFilter(f => f === 'starred' ? null : 'starred')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                listFilter === 'starred'
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <svg className={`w-4 h-4 ${listFilter === 'starred' ? 'fill-white' : 'fill-amber-500'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              Shortlist {starred.size > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${listFilter === 'starred' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'}`}>{starred.size}</span>}
            </button>

            {/* Liked button */}
            <button
              onClick={() => setListFilter(f => f === 'liked' ? null : 'liked')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                listFilter === 'liked'
                  ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                  : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
              }`}
            >
              <svg className={`w-4 h-4 ${listFilter === 'liked' ? 'fill-white' : 'fill-rose-500'}`} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
              </svg>
              Liked {liked.size > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${listFilter === 'liked' ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'}`}>{liked.size}</span>}
            </button>

            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              {(['grid', 'map', 'lists'] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-xs font-semibold capitalize transition-colors ${viewMode === mode ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {mode === 'grid' ? 'Grid' : mode === 'map' ? 'Map' : 'Lists'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error.message}
            </div>
          )}

          {/* ── Shortlist / Liked panel ── */}
          {activeListCards !== null && (
            <div className={`mb-5 rounded-2xl border overflow-hidden ${listFilter === 'starred' ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'}`}>
              {/* Panel header */}
              <div className={`flex items-center justify-between px-5 py-3 border-b ${listFilter === 'starred' ? 'border-amber-200' : 'border-rose-200'}`}>
                <div className="flex items-center gap-2">
                  {listFilter === 'starred' ? (
                    <>
                      <svg className="w-4 h-4 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      <span className="font-bold text-sm text-amber-800">Shortlisted Creators</span>
                      <span className="text-xs text-amber-600">· creators you want to work with</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 fill-rose-500" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                      <span className="font-bold text-sm text-rose-800">Liked Creators</span>
                      <span className="text-xs text-rose-600">· creators you're considering</span>
                    </>
                  )}
                </div>
                <button onClick={() => setListFilter(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Creator rows */}
              {activeListCards.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  {listFilter === 'starred'
                    ? 'No creators shortlisted yet. Click ⭐ on a creator card to shortlist them.'
                    : 'No creators liked yet. Click ❤️ on a creator card to like them.'}
                </div>
              ) : (
                <div className="divide-y divide-white/60">
                  {activeListCards.map((creator, i) => (
                    <div
                      key={creator.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-white/50 transition-colors cursor-pointer"
                      onClick={() => openSpotlight(creator)}
                    >
                      <span className="text-sm font-black text-gray-300 w-5 text-center">{i + 1}</span>
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                        <CreatorAvatar src={creator.img} name={creator.name} handle={creator.handle} size={40} className="rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-gray-900 truncate">{creator.name}</span>
                          {creator.profile.isVerified && (
                            <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{creator.handle} · {creator.niche}</div>
                      </div>
                      <div className="text-sm font-bold text-gray-700 flex-shrink-0">
                        {creator.profile.followersExact > 0 ? formatFollowerCount(creator.profile.followersExact) : creator.followers}
                      </div>
                      {creator.profile.cost && (
                        <div className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          {creator.profile.cost}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={e => toggleStar(creator.id, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${starred.has(creator.id) ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-amber-200'}`}
                        >
                          <svg className={`w-3.5 h-3.5 ${starred.has(creator.id) ? 'fill-amber-500' : 'fill-none stroke-gray-400'}`} viewBox="0 0 20 20" strokeWidth="1.5">
                            <path strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </button>
                        <button
                          onClick={e => toggleLike(creator.id, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${liked.has(creator.id) ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-200 hover:border-rose-200'}`}
                        >
                          <svg className={`w-3.5 h-3.5 ${liked.has(creator.id) ? 'fill-rose-500' : 'fill-none stroke-gray-400'}`} viewBox="0 0 20 20" strokeWidth="1.5">
                            <path strokeLinejoin="round" fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                          </svg>
                        </button>
                        <a
                          href={creator.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:border-gray-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === 'grid' && (
            <div>
              <FilterBar
                search={search} onSearch={setSearch}
                selectedRadius={selectedRadius} onRadius={setSelectedRadius}
                categoryOptions={categoryOptions} activeNiches={activeNiches} onToggleNiche={toggleNiche}
                platformOptions={platformOptions} activePlatforms={activePlatforms} onTogglePlatform={togglePlatform}
                activeDealTypes={activeDealTypes} onToggleDealType={toggleDealType}
                regionOptions={regionOptions} activeRegions={activeRegions} onToggleRegion={toggleRegion}
              />

              {/* Grid — 4 cols × 4 rows = 16 per page */}
              <div className="grid grid-cols-4 gap-4">
                {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl animate-pulse shadow-sm" style={{ height: 340 }} />
                ))}

                {!loading && paginated.map(creator => {
                  const pal   = getSpotlightPalette(creator);
                  const niche = creator.niche;

                  const followersDisplay = creator.profile.followersExact > 0
                    ? formatFollowerCount(creator.profile.followersExact)
                    : creator.followers || '—';
                  const followingDisplay = creator.profile.followingCount > 0
                    ? formatFollowerCount(creator.profile.followingCount) : '—';
                  const postsDisplay = creator.profile.postsCount > 0
                    ? creator.profile.postsCount.toLocaleString() : '—';

                  // Detect primary social platform for top-left icon
                  const socialLinks = creator.profile.socialLinks || {};
                  const primarySocial = socialLinks.youtube
                    ? 'youtube'
                    : socialLinks.facebook
                    ? 'facebook'
                    : socialLinks.tiktok
                    ? 'tiktok'
                    : socialLinks.twitter
                    ? 'twitter'
                    : 'instagram';

                  // Soft pastel gradient like the reference — always 3-stop radial mesh
                  const bannerStyle = {
                    background: `
                      radial-gradient(ellipse at 20% 50%, ${pal.start}cc 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, ${pal.end}bb 0%, transparent 55%),
                      radial-gradient(ellipse at 60% 90%, ${pal.accent}99 0%, transparent 50%),
                      linear-gradient(135deg, ${pal.start}88, ${pal.end}88)
                    `,
                  };

                  return (
                    <div
                      key={creator.id}
                      onClick={() => openSpotlight(creator)}
                      className="bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 cursor-pointer border border-gray-100 flex flex-col"
                      style={{ height: 340 }}
                    >
                      {/* ── Banner + Avatar wrapper — no overflow-hidden so avatar shows ── */}
                      <div className="relative flex-shrink-0" style={{ height: 130 }}>
                        {/* Gradient banner — rounded top only via border-radius */}
                        <div
                          className="absolute top-0 left-0 right-0"
                          style={{
                            height: 96,
                            borderRadius: '24px 24px 0 0',
                            ...bannerStyle,
                          }}
                        />

                        {/* Top-left: social icon — above banner */}
                        <div className="absolute top-3 left-3 z-10">
                          <SocialIcon platform={primarySocial} size={28} />
                        </div>

                        {/* Top-right: score ring */}
                        <div className="absolute top-2.5 right-2.5 z-10 bg-white/90 backdrop-blur-sm rounded-full shadow-sm p-0.5">
                          <ScoreRing score={creator.score} size={36} />
                        </div>

                        {/* ── Avatar — sits at bottom of this wrapper, overlapping banner edge ── */}
                        <div className="absolute left-0 right-0 flex justify-center z-10" style={{ top: 56 }}>
                          <div
                            style={{
                              width: 76,
                              height: 76,
                              borderRadius: '50%',
                              border: '4px solid white',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                              overflow: 'hidden',
                              backgroundColor: '#f3f4f6',
                              flexShrink: 0,
                            }}
                          >
                            <CreatorAvatar
                              src={creator.img}
                              name={creator.name}
                              handle={creator.handle}
                              size={76}
                              className="rounded-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Name / handle / niche ── */}
                      <div className="px-3 pt-1 text-center flex-shrink-0">
                        <div className="flex items-center justify-center gap-1 min-w-0">
                          <span className="font-bold text-[13px] text-gray-900 truncate leading-snug">{creator.name}</span>
                          {creator.profile.isVerified && (
                            <img src="/verified-badge.png" alt="Verified" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">{creator.handle}</div>
                        <div className="mt-1.5 flex items-center justify-center gap-1">
                          <span className="inline-block text-[9px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            {niche}
                          </span>
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${DEAL_TYPE_STYLES[creator.dealType].cls}`}>
                            {DEAL_TYPE_STYLES[creator.dealType].label}
                          </span>
                        </div>
                      </div>

                      {/* ── Bio — fixed 2 lines always ── */}
                      <div className="px-4 pt-2 flex-shrink-0" style={{ height: 38 }}>
                        <p className="text-[10px] text-gray-500 leading-relaxed text-center line-clamp-2">
                          {creator.profile.bio || creator.area || 'Bengaluru'}
                        </p>
                      </div>

                      {/* ── Stats row ── */}
                      <div className="flex items-center mx-4 mt-2 flex-shrink-0">
                        {[
                          { val: postsDisplay,     lbl: 'Posts' },
                          { val: followingDisplay, lbl: 'Following' },
                          { val: followersDisplay, lbl: 'Followers' },
                        ].map((s, i) => (
                          <div key={s.lbl} className={`flex-1 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                            <div className="text-sm font-bold text-gray-900 leading-tight">{s.val}</div>
                            <div className="text-[9px] text-gray-400 mt-0.5">{s.lbl}</div>
                          </div>
                        ))}
                      </div>

                      {/* ── Action buttons: Instagram | Chat | Heart | Star ── */}
                      <div className="px-4 mt-auto pb-4 pt-3 flex-shrink-0 flex items-center gap-2">
                        {/* Instagram */}
                        <a
                          href={creator.profileUrl || `https://www.instagram.com/${creator.handle.replace('@','')}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex-1 py-2.5 rounded-2xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          title="View Instagram"
                        >
                          <img src="/instagram.png" alt="Instagram" className="w-3.5 h-3.5 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                        </a>

                        {/* Chat */}
                        <button
                          onClick={e => { e.stopPropagation(); openSpotlight(creator, 'chat'); }}
                          title="Chat with creator"
                          className="w-10 h-10 rounded-2xl flex items-center justify-center border bg-gray-50 border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all"
                        >
                          <img src="/chat-icon.png" alt="Chat" className="w-5 h-5 object-contain" />
                        </button>

                        {/* Heart */}
                        <button
                          onClick={e => toggleLike(creator.id, e)}
                          title="Like"
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                            liked.has(creator.id)
                              ? 'bg-rose-50 border-rose-300 text-rose-500'
                              : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-rose-300 hover:text-rose-500'
                          }`}
                        >
                          <svg className={`w-4 h-4 ${liked.has(creator.id) ? 'fill-rose-500' : 'fill-none stroke-current'}`} viewBox="0 0 20 20" strokeWidth={liked.has(creator.id) ? 0 : 1.5}>
                            <path strokeLinejoin="round" fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                          </svg>
                        </button>

                        {/* Star */}
                        <button
                          onClick={e => toggleStar(creator.id, e)}
                          title="Shortlist"
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                            starred.has(creator.id)
                              ? 'bg-amber-50 border-amber-300 text-amber-500'
                              : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500'
                          }`}
                        >
                          <svg className={`w-4 h-4 ${starred.has(creator.id) ? 'fill-amber-500' : 'fill-none stroke-current'}`} viewBox="0 0 20 20" strokeWidth={starred.has(creator.id) ? 0 : 1.5}>
                            <path strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {!loading && filtered.length === 0 && (
                  <div className="col-span-full flex items-center justify-center h-40 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
                    No creators match your filters. Try expanding radius or removing niche filters.
                  </div>
                )}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </div>
          )}

          {viewMode === 'map' && (
            <div>
              <FilterBar
                search={search} onSearch={setSearch}
                selectedRadius={selectedRadius} onRadius={setSelectedRadius}
                categoryOptions={categoryOptions} activeNiches={activeNiches} onToggleNiche={toggleNiche}
                platformOptions={platformOptions} activePlatforms={activePlatforms} onTogglePlatform={togglePlatform}
                activeDealTypes={activeDealTypes} onToggleDealType={toggleDealType}
                regionOptions={regionOptions} activeRegions={activeRegions} onToggleRegion={toggleRegion}
              />
              <div className="flex gap-4 h-[540px]">
                {/* Sidebar: creator list */}
                <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
                  <div className="text-xs font-semibold text-gray-500">{filtered.length} results</div>
                  <div className="space-y-1.5">
                    {filtered.slice(0, 12).map(creator => {
                      const dealStyle = DEAL_TYPE_STYLES[creator.dealType];
                      return (
                        <div key={creator.id}
                          onClick={() => { setMapSelected(prev => prev === creator.id ? null : creator.id); openSpotlight(creator); }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                            mapSelected === creator.id ? 'border-cyan-400 bg-cyan-50 shadow-sm' : 'border-gray-200 hover:border-cyan-300 bg-white'
                          }`}
                        >
                          <CreatorAvatar src={creator.img} name={creator.name} handle={creator.handle} size={30} className="rounded-full border border-gray-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-900 truncate">{creator.name}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0 rounded-full border ${dealStyle.cls}`}>{dealStyle.label}</span>
                              <span className="text-[9px] text-gray-400 truncate">{creator.followers}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <button onClick={e => toggleStar(creator.id, e)}
                              className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${starred.has(creator.id) ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}>
                              <svg className={`w-3.5 h-3.5 ${starred.has(creator.id) ? 'fill-amber-500' : 'fill-none stroke-current'}`} viewBox="0 0 20 20" strokeWidth="1.5">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                            </button>
                            <button onClick={e => toggleLike(creator.id, e)}
                              className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${liked.has(creator.id) ? 'text-rose-500' : 'text-gray-300 hover:text-rose-400'}`}>
                              <svg className={`w-3.5 h-3.5 ${liked.has(creator.id) ? 'fill-rose-500' : 'fill-none stroke-current'}`} viewBox="0 0 20 20" strokeWidth="1.5">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {filtered.length > 12 && (
                      <div className="text-xs text-gray-400 text-center py-1">+{filtered.length - 12} more — use Grid/List view</div>
                    )}
                  </div>
                </div>

                {/* Map */}
                <div className="flex-1 border border-gray-200 rounded-2xl relative overflow-hidden">
                  <DiscoverMapView
                    creators={filtered}
                    selected={mapSelected}
                    onSelect={id => {
                      setMapSelected(prev => prev === id ? null : id);
                      const creator = filtered.find(c => c.id === id);
                      if (creator) openSpotlight(creator);
                    }}
                  />

                  {mapSelected && (() => {
                    const creator = filtered.find(c => c.id === mapSelected);
                    if (!creator) return null;
                    const dealStyle = DEAL_TYPE_STYLES[creator.dealType];
                    return (
                      <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-xl p-4 shadow-lg w-56">
                        <div className="flex items-center gap-2 mb-3">
                          <CreatorAvatar src={creator.img} name={creator.name} handle={creator.handle} size={36} className="rounded-full border border-gray-100" />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-gray-900 truncate">{creator.name}</div>
                            <div className="text-xs text-gray-500 truncate">{creator.handle}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs">
                          <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                            <div className="text-gray-400">Followers</div>
                            <div className="font-bold text-gray-800">{creator.followers}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                            <div className="text-gray-400">Niche</div>
                            <div className="font-bold text-gray-800 truncate">{creator.niche}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                            <div className="text-gray-400">Deal</div>
                            <span className={`text-[9px] font-bold px-1.5 py-0 rounded-full border ${dealStyle.cls}`}>{dealStyle.label}</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                            <div className="text-gray-400">Cost</div>
                            <div className="font-bold text-gray-800">{creator.profile.cost || '—'}</div>
                          </div>
                        </div>
                        <button onClick={() => openSpotlight(creator)} className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-xs transition-colors">
                          View Profile
                        </button>
                        <div className="flex gap-2 mt-2">
                          <button onClick={e => toggleStar(creator.id, e)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-colors ${starred.has(creator.id) ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-amber-200'}`}>
                            <svg className={`w-3 h-3 ${starred.has(creator.id) ? 'fill-amber-500' : 'fill-none stroke-current'}`} viewBox="0 0 20 20" strokeWidth="1.5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            Star
                          </button>
                          <button onClick={e => toggleLike(creator.id, e)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-colors ${liked.has(creator.id) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'border-gray-200 text-gray-500 hover:border-rose-200'}`}>
                            <svg className={`w-3 h-3 ${liked.has(creator.id) ? 'fill-rose-500' : 'fill-none stroke-current'}`} viewBox="0 0 20 20" strokeWidth="1.5"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                            Heart
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'lists' && (
            <div>
              <FilterBar
                search={search} onSearch={setSearch}
                selectedRadius={selectedRadius} onRadius={setSelectedRadius}
                categoryOptions={categoryOptions} activeNiches={activeNiches} onToggleNiche={toggleNiche}
                platformOptions={platformOptions} activePlatforms={activePlatforms} onTogglePlatform={togglePlatform}
                activeDealTypes={activeDealTypes} onToggleDealType={toggleDealType}
                regionOptions={regionOptions} activeRegions={activeRegions} onToggleRegion={toggleRegion}
              />

              {/* List header */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-600">{filtered.length} creators</div>
                <button onClick={() => setAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Creator
                </button>
              </div>

              {/* Column headers */}
              <div className="flex items-center gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 mb-1">
                <div className="w-9" />
                <div className="flex-1">Creator</div>
                <div className="hidden sm:block w-36">Niche</div>
                <div className="w-16 text-right">Followers</div>
                <div className="w-16 text-right">Plays</div>
                <div className="w-16 text-right">Cost</div>
                <div className="w-20 text-center">Type</div>
                <div className="w-12 text-center">Score</div>
                <div className="w-16 text-center">Actions</div>
              </div>

              <div className="space-y-1">
                {paginated.map(creator => {
                  const dealStyle = DEAL_TYPE_STYLES[creator.dealType];
                  return (
                    <div
                      key={creator.id}
                      className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer"
                      onClick={() => openSpotlight(creator)}
                    >
                      <CreatorAvatar src={creator.img} name={creator.name} handle={creator.handle} size={36} className="rounded-full border border-gray-100 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-gray-900 truncate">{creator.name}</span>
                          {creator.profile.isVerified && (
                            <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{creator.handle} · {creator.area}</div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 w-36 flex-wrap">
                        {creator.categories.slice(0, 2).map(cat => (
                          <span key={cat} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{capitalizeWords(cat)}</span>
                        ))}
                      </div>
                      <div className="text-sm font-bold text-gray-700 w-16 text-right flex-shrink-0">
                        {creator.profile.followersExact > 0 ? formatFollowerCount(creator.profile.followersExact) : creator.followers}
                      </div>
                      <div className="text-sm text-gray-500 w-16 text-right flex-shrink-0">{creator.engagement || '—'}</div>
                      <div className="text-sm font-semibold text-gray-700 w-16 text-right flex-shrink-0">{creator.profile.cost || '—'}</div>
                      <div className="w-20 flex justify-center flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dealStyle.cls}`}>{dealStyle.label}</span>
                      </div>
                      <div className="w-12 flex justify-center flex-shrink-0">
                        <ScoreRing score={creator.score} size={32} />
                      </div>
                      {/* Star + Heart only */}
                      <div className="w-16 flex items-center justify-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={e => toggleStar(creator.id, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${starred.has(creator.id) ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-amber-200'}`}>
                          <svg className={`w-3.5 h-3.5 ${starred.has(creator.id) ? 'fill-amber-500' : 'fill-none stroke-gray-400'}`} viewBox="0 0 20 20" strokeWidth="1.5">
                            <path strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </button>
                        <button onClick={e => toggleLike(creator.id, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${liked.has(creator.id) ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-200 hover:border-rose-200'}`}>
                          <svg className={`w-3.5 h-3.5 ${liked.has(creator.id) ? 'fill-rose-500' : 'fill-none stroke-gray-400'}`} viewBox="0 0 20 20" strokeWidth="1.5">
                            <path strokeLinejoin="round" fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {!loading && filtered.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
                    No creators match your filters.
                  </div>
                )}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={p => setPage(p)} />
            </div>
          )}
        </main>
      </div>
      <SpotlightPortal card={spotlightCreator} open={spotlightOpen} onClose={() => setSpotlightOpen(false)} defaultTab={spotlightTab} />
      <AddInfluencerModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleAddInfluencer} />
    </>
  );
}
