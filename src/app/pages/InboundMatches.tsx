import { useState } from 'react';
import { Link } from 'react-router';
import { Filter, X, ChevronRight, Star, Heart, Users, Activity, CheckCircle2, ArrowUpDown, Megaphone } from 'lucide-react';
import { CAMPAIGNS } from './CampaignsList';

type ViewMode = 'ranked' | 'kanban' | 'grid';
type KanbanStage = 'New' | 'Reviewing' | 'Accepted' | 'Active';

interface Creator {
  id: string;
  name: string;
  handle: string;
  followers: string;
  engagement: string;
  offer: string;
  score: number;
  badge?: string;
  stage: KanbanStage;
  subtext: string;
  img: string;
  campaignId: string;
}

const INITIAL_CREATORS: Creator[] = [
  { id: '1', name: 'Maya R.', handle: '@foodie_blr', followers: '28.4K', engagement: '7.2%', offer: 'Barter: Dinner for 2', score: 92, badge: 'Super', stage: 'New', subtext: '92% audience overlap · same neighbourhood', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face', campaignId: 'weekend-brunch' },
  { id: '2', name: 'Priya S.', handle: '@dineanddash', followers: '12.2K', engagement: '9.1%', offer: 'Barter only', score: 87, stage: 'New', subtext: 'Top engagement rate · food niche', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face', campaignId: 'weekend-brunch' },
  { id: '3', name: 'Arjun K.', handle: '@bangalorebites', followers: '45.1K', engagement: '5.8%', offer: 'Barter + ₹3,000', score: 74, stage: 'Reviewing', subtext: 'High reach · partial niche fit', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face', campaignId: 'cocktail-launch' },
  { id: '4', name: 'Rohan M.', handle: '@thefoodiephd', followers: '82K', engagement: '4.2%', offer: '₹8,000 + Meal', score: 58, stage: 'Reviewing', subtext: 'Big follower count · low engagement', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face', campaignId: 'cocktail-launch' },
  { id: '5', name: 'Sara V.', handle: '@saravibe', followers: '19.3K', engagement: '6.1%', offer: 'Barter only', score: 81, stage: 'Reviewing', subtext: 'Strong food content · growing fast', img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=60&h=60&fit=crop&crop=face', campaignId: 'weekend-brunch' },
  { id: '6', name: 'Devi P.', handle: '@deviperks', followers: '18K', engagement: '8.4%', offer: 'Barter: Dinner for 4', score: 88, badge: 'Super', stage: 'Accepted', subtext: 'High engagement · same niche', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop&crop=face', campaignId: 'student-night' },
  { id: '7', name: 'Kiran A.', handle: '@kiranfood', followers: '33K', engagement: '5.5%', offer: 'Barter + ₹2,000', score: 75, stage: 'Active', subtext: 'Awaiting visit', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face', campaignId: 'weekend-brunch' },
  { id: '8', name: 'Tanvi G.', handle: '@tanvig', followers: '22K', engagement: '7.8%', offer: 'Barter only', score: 83, stage: 'Active', subtext: 'Content pending', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face', campaignId: 'cocktail-launch' },
];

const campaignName = (id: string) => CAMPAIGNS.find((c) => c.id === id)?.name ?? 'Direct pitch';

const KANBAN_STAGES: { label: KanbanStage; color: string; dot: string }[] = [
  { label: 'New', color: 'text-orange-600', dot: 'bg-orange-400' },
  { label: 'Reviewing', color: 'text-blue-600', dot: 'bg-blue-400' },
  { label: 'Accepted', color: 'text-green-600', dot: 'bg-green-400' },
  { label: 'Active', color: 'text-amber-600', dot: 'bg-amber-400' },
];

export default function InboundMatches() {
  const [viewMode, setViewMode] = useState<ViewMode>('ranked');
  const [creators, setCreators] = useState<Creator[]>(INITIAL_CREATORS);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<KanbanStage | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string>('all');

  const visible = creators.filter(
    (c) => !dismissed.has(c.id) && (campaignFilter === 'all' || c.campaignId === campaignFilter),
  );

  const campaignsInUse = Array.from(new Set(creators.map((c) => c.campaignId)));

  const handleAccept = (id: string) => {
    setAccepted(prev => new Set([...prev, id]));
    setCreators(prev => prev.map(c => c.id === id ? { ...c, stage: 'Accepted' } : c));
  };

  const handleDecline = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const handleDragStart = (id: string) => setDragging(id);
  const handleDragEnd = () => { setDragging(null); setDragOver(null); };

  const handleDrop = (stage: KanbanStage) => {
    if (!dragging) return;
    setCreators(prev => prev.map(c => c.id === dragging ? { ...c, stage } : c));
    setDragging(null);
    setDragOver(null);
  };

  const rankedSorted = [...visible].sort((a, b) => b.score - a.score);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Inbound Pitches</h1>
            <span className="bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {visible.filter(c => c.stage === 'New').length} new
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {visible.length} total pitches · {visible.filter(c => c.badge === 'Super').length} super matches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <option value="all">All campaigns</option>
            {campaignsInUse.map((id) => (
              <option key={id} value={id}>
                {campaignName(id)}
              </option>
            ))}
          </select>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
            {(['ranked', 'kanban', 'grid'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
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

        {/* Ranked View */}
        {viewMode === 'ranked' && (
          <div className="max-w-5xl mx-auto space-y-2.5">
            <div className="grid grid-cols-[56px_1.4fr_180px_200px_200px_180px] gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <div className="text-center">Rank</div>
              <div>Creator</div>
              <div>Campaign</div>
              <div>Match Score</div>
              <div>Offer</div>
              <div>Action</div>
            </div>
            {rankedSorted.map((creator, idx) => {
              const isTop = idx === 0;
              const isAccepted = accepted.has(creator.id);
              return (
                <div
                  key={creator.id}
                  className={`grid grid-cols-[56px_1.4fr_180px_200px_200px_180px] gap-4 items-center px-4 py-4 rounded-xl border transition-all ${
                    isTop ? 'bg-cyan-50 border-cyan-200 shadow-sm' : 'bg-white border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className={`text-3xl font-black text-center ${isTop ? 'text-cyan-500' : 'text-gray-200'}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={creator.img} alt={creator.name} className="w-11 h-11 rounded-full object-cover border border-gray-200" />
                      {creator.badge && <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center"><Star className="w-2.5 h-2.5 text-white fill-white" /></span>}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{creator.name} <span className="text-gray-400 font-normal">· {creator.handle}</span></div>
                      <div className="text-xs text-gray-500 mt-0.5">{creator.subtext}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Campaign</div>
                    <Link
                      to={`/marketing/campaigns/${creator.campaignId}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold hover:bg-violet-100 transition-colors max-w-full"
                    >
                      <Megaphone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{campaignName(creator.campaignId)}</span>
                    </Link>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1.5">Match Score</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${creator.score >= 85 ? 'bg-green-500' : creator.score >= 70 ? 'bg-amber-400' : 'bg-gray-400'}`}
                          style={{ width: `${creator.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-800 w-6 text-right">{creator.score}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Offer</div>
                    <div className="text-xs font-semibold text-gray-800">{creator.offer}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecline(creator.id)}
                      className="w-8 h-8 border border-gray-200 bg-white rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {isAccepted ? (
                      <button className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAccept(creator.id)}
                        className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-xs transition-colors"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
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
                    {colCreators.map(creator => (
                      <div
                        key={creator.id}
                        draggable
                        onDragStart={() => handleDragStart(creator.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white border border-gray-200 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all ${dragging === creator.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <img src={creator.img} alt={creator.name} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-900 truncate">{creator.name}</div>
                            <div className="text-xs text-green-600 font-semibold">{creator.engagement} eng</div>
                          </div>
                          {creator.badge && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-semibold mb-1.5 max-w-full">
                          <Megaphone className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{campaignName(creator.campaignId)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{creator.offer}</div>
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
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Grid / Card View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-4 gap-4">
            {visible.map(creator => {
              const isAccepted = accepted.has(creator.id);
              return (
                <div key={creator.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={creator.img} alt={creator.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                      {creator.badge && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm"><Star className="w-3 h-3 text-white fill-white" /></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900">{creator.name}</div>
                      <div className="text-xs text-gray-400">{creator.handle}</div>
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
                      <div className="text-[10px] font-bold text-green-600 uppercase mb-0.5">Engagement</div>
                      <div className="text-base font-bold text-green-700">{creator.engagement}</div>
                    </div>
                  </div>

                  <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-cyan-600 uppercase mb-1">Offer</div>
                    <div className="text-xs font-semibold text-gray-700">{creator.offer}</div>
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
            {visible.length === 0 && (
              <div className="col-span-4 flex items-center justify-center h-40 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
                All pitches reviewed. Check back later.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
