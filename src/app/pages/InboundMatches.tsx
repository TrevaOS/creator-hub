import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Filter, X, Star, CheckCircle2, Megaphone, MessageSquare, Heart } from 'lucide-react';
import { CAMPAIGNS } from './CampaignsList';
import { useInfluencers, type InfluencerProfile } from '../data/influencers';
import { CreatorAvatar } from '../components/CreatorAvatar';
import { ChatDrawer } from '../components/ChatDrawer';

type ViewMode = 'ranked' | 'kanban' | 'grid';
type KanbanStage = 'New' | 'Reviewing' | 'Accepted' | 'Active';

interface Creator {
  id: string;
  name: string;
  handle: string;
  followers: string;
  followersExact: number;
  engagement: string;
  offer: string;
  score: number;
  badge?: string;
  stage: KanbanStage;
  subtext: string;
  img: string;
  campaignId: string;
  niche: string;
  area: string;
  cost: string;
  isVerified: boolean;
  profile: InfluencerProfile;
}

const CAMPAIGN_IDS = CAMPAIGNS.map(c => c.id);

function deriveOffer(profile: InfluencerProfile): string {
  const cost = (profile.cost || '').trim();
  const type = (profile.influencerType || '').toLowerCase();
  if (type === 'barter' || type === 'contra') return 'Barter collab';
  if (cost && cost !== '—' && cost !== 'NA') return cost;
  if (type === 'paid') return 'Paid · On request';
  return 'Barter collab';
}

function deriveScore(profile: InfluencerProfile, index: number): number {
  let base = 72 + (index % 18);
  if (profile.bio && profile.bio.length > 20) base += 3;
  if (profile.scraped) base += 3;
  if (profile.isVerified) base += 4;
  if (profile.followersExact > 100000) base += 3;
  if (profile.avgPlays) base += 2;
  return Math.min(98, base);
}

function formatFollowers(n: number, raw: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  if (n > 0) return n.toString();
  return raw || '—';
}

function deriveSubtext(profile: InfluencerProfile, score: number): string {
  const parts: string[] = [];
  if (profile.areaOrCity) parts.push(profile.areaOrCity);
  if (score >= 90) parts.push('High trust score');
  if (profile.isVerified) parts.push('Verified account');
  if (profile.followersExact > 100000) parts.push('100K+ reach');
  return parts.slice(0, 2).join(' · ') || 'Influencer match';
}

function deriveBadge(score: number): string | undefined {
  return score >= 94 ? 'Super' : undefined;
}

function capitalizeWords(s: string): string {
  return s.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function mapInfluencersToCreators(influencers: InfluencerProfile[]): Creator[] {
  return influencers.map((p, i) => {
    const name = p.name || capitalizeWords(p.profileId || p.handle || 'Creator');
    const handle = p.handle || (p.profileId ? `@${p.profileId}` : '');
    const score = deriveScore(p, i);
    const followers = formatFollowers(p.followersExact, p.followers);
    const niche = p.primaryCategory || p.categories?.[0] || 'Lifestyle';
    const stage: KanbanStage = i % 4 === 0 ? 'New' : i % 4 === 1 ? 'Reviewing' : i % 4 === 2 ? 'Accepted' : 'Active';
    const campaignId = CAMPAIGN_IDS[i % CAMPAIGN_IDS.length];
    return {
      id: p.id,
      name,
      handle,
      followers,
      followersExact: p.followersExact,
      engagement: p.avgPlays || p.impressions || '—',
      offer: deriveOffer(p),
      score,
      badge: deriveBadge(score),
      stage,
      subtext: deriveSubtext(p, score),
      img: p.avatarUrl || '',
      campaignId,
      niche,
      area: p.areaOrCity || 'Bengaluru',
      cost: p.cost || '',
      isVerified: p.isVerified,
      profile: p,
    };
  }).filter(c => Boolean(c.name || c.handle));
}

const campaignName = (id: string) => CAMPAIGNS.find((c) => c.id === id)?.name ?? 'Direct pitch';

const KANBAN_STAGES: { label: KanbanStage; color: string; dot: string }[] = [
  { label: 'New', color: 'text-orange-600', dot: 'bg-orange-400' },
  { label: 'Reviewing', color: 'text-blue-600', dot: 'bg-blue-400' },
  { label: 'Accepted', color: 'text-green-600', dot: 'bg-green-400' },
  { label: 'Active', color: 'text-amber-600', dot: 'bg-amber-400' },
];

const PAGE_SIZE = 16;

export default function InboundMatches() {
  const { influencers, loading } = useInfluencers();
  const [viewMode, setViewMode] = useState<ViewMode>('ranked');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<KanbanStage | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [chatTarget, setChatTarget] = useState<{ name: string; handle: string; img: string } | null>(null);

  const allCreators = useMemo(() => mapInfluencersToCreators(influencers), [influencers]);
  const [stageOverrides, setStageOverrides] = useState<Map<string, KanbanStage>>(new Map());

  const creators = useMemo(() =>
    allCreators.map(c => stageOverrides.has(c.id) ? { ...c, stage: stageOverrides.get(c.id)! } : c),
    [allCreators, stageOverrides]
  );

  const visible = creators.filter(
    (c) => !dismissed.has(c.id) && (campaignFilter === 'all' || c.campaignId === campaignFilter),
  );

  const campaignsInUse = Array.from(new Set(creators.map((c) => c.campaignId)));

  const handleAccept = (id: string) => {
    setAccepted(prev => new Set([...prev, id]));
    setStageOverrides(prev => new Map(prev).set(id, 'Accepted'));
  };

  const handleDecline = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const handleDragStart = (id: string) => setDragging(id);
  const handleDragEnd = () => { setDragging(null); setDragOver(null); };

  const handleDrop = (stage: KanbanStage) => {
    if (!dragging) return;
    setStageOverrides(prev => new Map(prev).set(dragging, stage));
    setDragging(null);
    setDragOver(null);
  };

  const rankedSorted = [...visible].sort((a, b) => b.score - a.score);
  const totalPages = Math.ceil(rankedSorted.length / PAGE_SIZE);
  const pagedRanked = rankedSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Inbound Pitches</h1>
            <span className="bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {loading ? '…' : visible.filter(c => c.stage === 'New').length} new
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${visible.length} total pitches · ${visible.filter(c => c.badge === 'Super').length} super matches`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={campaignFilter}
            onChange={(e) => { setCampaignFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <option value="all">All campaigns</option>
            {campaignsInUse.map((id) => (
              <option key={id} value={id}>{campaignName(id)}</option>
            ))}
          </select>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
            {(['ranked', 'kanban', 'grid'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setPage(1); }}
                className={`px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                  viewMode === mode ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode === 'ranked' ? 'Ranked' : mode === 'kanban' ? 'Pipeline' : 'Cards'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">

        {/* Empty state — no inbound pitches yet */}
        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center">
              <Heart className="w-8 h-8 text-pink-300" />
            </div>
            <div>
              <div className="text-base font-bold text-gray-800">No inbound pitches yet</div>
              <div className="text-sm text-gray-400 mt-1 max-w-xs">
                Creators will appear here once they pitch to your campaigns. Create a campaign to start receiving pitches.
              </div>
            </div>
            <Link
              to="/marketing/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Megaphone className="w-4 h-4" /> Create a Campaign
            </Link>
          </div>
        )}

        {/* Ranked View */}
        {!loading && visible.length > 0 && viewMode === 'ranked' && (
          <div className="max-w-5xl mx-auto space-y-2.5">
            <div className="hidden xl:grid grid-cols-[52px_minmax(0,2fr)_minmax(0,1.3fr)_170px_minmax(0,1fr)_180px] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <div className="text-center">Rank</div>
              <div>Creator</div>
              <div>Campaign</div>
              <div>Match Score</div>
              <div>Offer</div>
              <div>Action</div>
            </div>
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
            {!loading && pagedRanked.map((creator, idx) => {
              const rank = (page - 1) * PAGE_SIZE + idx;
              const isTop = rank === 0;
              const isAccepted = accepted.has(creator.id);
              return (
                <div
                  key={creator.id}
                  className={`grid grid-cols-[52px_minmax(0,2fr)_minmax(0,1.3fr)_170px_minmax(0,1fr)_180px] gap-3 items-center px-4 py-3.5 rounded-xl border transition-all ${
                    isTop ? 'bg-cyan-50 border-cyan-200 shadow-sm' : 'bg-white border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className={`text-2xl font-black text-center leading-none ${isTop ? 'text-cyan-500' : 'text-gray-200'}`}>
                    {String(rank + 1).padStart(2, '0')}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <CreatorAvatar src={creator.img} name={creator.name} handle={creator.handle} size={40} />
                      {creator.badge && <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center"><Star className="w-2.5 h-2.5 text-white fill-white" /></span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1">
                        <span className="truncate">{creator.name}</span>
                        {creator.isVerified && <img src="/verified-badge.png" alt="Verified" className="w-3.5 h-3.5 object-contain flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{creator.handle}</div>
                      <div className="text-xs text-gray-500 truncate">{creator.subtext}</div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/marketing/campaigns/${creator.campaignId}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold hover:bg-violet-100 transition-colors max-w-full overflow-hidden"
                    >
                      <Megaphone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{campaignName(creator.campaignId)}</span>
                    </Link>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${creator.score >= 85 ? 'bg-green-500' : creator.score >= 70 ? 'bg-amber-400' : 'bg-gray-400'}`}
                          style={{ width: `${creator.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-800 w-7 text-right flex-shrink-0">{creator.score}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-800 truncate">{creator.offer}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleDecline(creator.id)}
                      className="w-8 h-8 border border-gray-200 bg-white rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Chat"
                      onClick={() => setChatTarget({ name: creator.name, handle: creator.handle, img: creator.img })}
                      className="w-8 h-8 border border-gray-200 bg-white rounded-lg flex items-center justify-center text-gray-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors flex-shrink-0"
                    >
                      <img src="/chat-icon.png" alt="Chat" className="w-4 h-4 object-contain" />
                    </button>
                    {isAccepted ? (
                      <button className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">Accepted</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAccept(creator.id)}
                        className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-xs transition-colors min-w-[56px]"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                  ← Prev
                </button>
                <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Kanban View */}
        {!loading && visible.length > 0 && viewMode === 'kanban' && (
          <div className="flex gap-4 h-full min-h-[500px]">
            {KANBAN_STAGES.map(({ label, dot }) => {
              const colCreators = visible.filter(c => c.stage === label);
              const isOver = dragOver === label;
              return (
                <div
                  key={label}
                  className={`flex-1 rounded-xl flex flex-col transition-all ${isOver ? 'bg-cyan-50 ring-2 ring-cyan-300' : 'bg-gray-100'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(label); }}
                  onDrop={() => handleDrop(label)}
                  onDragLeave={() => setDragOver(null)}
                >
                  <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</span>
                    <span className="text-xs text-gray-400">· {colCreators.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-2">
                    {colCreators.slice(0, 30).map(creator => (
                      <div
                        key={creator.id}
                        draggable
                        onDragStart={() => handleDragStart(creator.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white border border-gray-200 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all ${dragging === creator.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CreatorAvatar src={creator.img} name={creator.name} handle={creator.handle} size={32} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-900 truncate">{creator.name}</div>
                            <div className="text-xs text-gray-400 truncate">{creator.niche}</div>
                          </div>
                          {creator.badge && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-semibold mb-1.5 max-w-full">
                          <Megaphone className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{campaignName(creator.campaignId)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2 truncate">{creator.offer}</div>
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${creator.score}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">{creator.score}</span>
                        </div>
                        {label === 'New' && (
                          <div className="flex gap-1.5 mt-2.5">
                            <button onClick={() => handleDecline(creator.id)} className="flex-1 py-1 border border-gray-200 rounded-lg text-xs text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors font-medium">Pass</button>
                            <button onClick={() => handleAccept(creator.id)} className="flex-1 py-1 bg-cyan-500 text-white rounded-lg text-xs font-bold hover:bg-cyan-600 transition-colors">Accept</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {colCreators.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        Drop here
                      </div>
                    )}
                    {colCreators.length > 30 && (
                      <div className="text-xs text-gray-400 text-center py-2">+{colCreators.length - 30} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Grid / Card View */}
        {!loading && visible.length > 0 && viewMode === 'grid' && (
          <div>
            <div className="grid grid-cols-4 gap-4">
              {loading && Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse h-52" />
              ))}
              {!loading && visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(creator => {
                const isAccepted = accepted.has(creator.id);
                return (
                  <div key={creator.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <CreatorAvatar src={creator.img} name={creator.name} handle={creator.handle} size={48} />
                        {creator.badge && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm"><Star className="w-3 h-3 text-white fill-white" /></span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 flex items-center gap-1 min-w-0">
                          <span className="truncate">{creator.name}</span>
                          {creator.isVerified && <img src="/verified-badge.png" alt="Verified" className="w-3.5 h-3.5 object-contain flex-shrink-0" />}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{creator.handle}</div>
                        <div className="text-[10px] text-gray-400 truncate">{creator.area} · {creator.niche}</div>
                      </div>
                    </div>

                    <Link
                      to={`/marketing/campaigns/${creator.campaignId}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold hover:bg-violet-100 transition-colors w-fit max-w-full"
                    >
                      <Megaphone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{campaignName(creator.campaignId)}</span>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Followers</div>
                        <div className="text-base font-bold text-gray-900">{creator.followers}</div>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                        <div className="text-[10px] font-bold text-green-600 uppercase mb-0.5">Score</div>
                        <div className="text-base font-bold text-green-700">{creator.score}</div>
                      </div>
                    </div>

                    <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-cyan-600 uppercase mb-1">Offer</div>
                      <div className="text-xs font-semibold text-gray-700 truncate">{creator.offer}</div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${creator.score >= 85 ? 'bg-cyan-500' : creator.score >= 70 ? 'bg-amber-400' : 'bg-gray-400'}`} style={{ width: `${creator.score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-500">{creator.score}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecline(creator.id)}
                        className="flex-1 py-2 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 rounded-xl font-semibold text-xs transition-colors"
                      >
                        Pass
                      </button>
                      <button
                        title="Chat"
                        onClick={() => setChatTarget({ name: creator.name, handle: creator.handle, img: creator.img })}
                        className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl text-gray-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
                      >
                        <img src="/chat-icon.png" alt="Chat" className="w-4 h-4 object-contain" />
                      </button>
                      {isAccepted ? (
                        <button className="flex-[1.5] py-2 bg-green-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAccept(creator.id)}
                          className="flex-[1.5] py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-xs transition-colors"
                        >
                          Accept Collab
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!loading && visible.length === 0 && (
                <div className="col-span-4 flex items-center justify-center h-40 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
                  All pitches reviewed. Check back later.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                  ← Prev
                </button>
                <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      <ChatDrawer
        open={chatTarget !== null}
        onClose={() => setChatTarget(null)}
        name={chatTarget?.name ?? ''}
        handle={chatTarget?.handle}
        img={chatTarget?.img}
      />
    </div>
  );
}
