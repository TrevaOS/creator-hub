import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Calendar,
  Users,
  TrendingUp,
  ChevronRight,
  X,
  Megaphone,
  Sparkles,
  Upload,
  Check,
  Image as ImageIcon,
  Zap,
  Star,
  Layers,
  ChevronDown,
  ChevronUp,
  Utensils,
  Wine,
  Camera,
  BarChart3,
  LayoutGrid,
  List,
  Kanban,
} from 'lucide-react';

export type CampaignSummaryStatus = 'Active' | 'Draft' | 'Completed' | 'Paused';

export interface DeliverableWithDate {
  label: string;
  dueDate: string;
}

// ── Segment Groups ──────────────────────────────────────────────────────────────
// Groups are permanent buckets (Food / Ambience / Drinks).
// Each campaign belongs to one group. A single launch/event can add campaigns
// across multiple groups (e.g. ₹10K Food + ₹5K Ambience = same event, two campaigns).
export type SegmentGroupId = 'food' | 'ambience' | 'drinks';

export interface SegmentGroup {
  id: SegmentGroupId;
  name: string;
  description: string;
  icon: string;        // emoji icon for the group
  color: string;       // tailwind bg color token for chips
  textColor: string;
  borderColor: string;
  accentHex: string;
  totalBudget: number; // total yearly / season budget for this segment
}

export const SEGMENT_GROUPS: SegmentGroup[] = [
  {
    id: 'food',
    name: 'Food',
    description: 'Food contentmenu launches, tastings, food trails, recipe campaigns',
    icon: '🍽️',
    color: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    accentHex: '#f97316',
    totalBudget: 0,
  },
  {
    id: 'ambience',
    name: 'Ambience',
    description: 'Space & vibeinteriors, décor, atmosphere, rooftop, live events',
    icon: '✨',
    color: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    accentHex: '#7c3aed',
    totalBudget: 0,
  },
  {
    id: 'drinks',
    name: 'Drinks',
    description: 'Cocktails, mocktails, wine lists, bar specials & beverage launches',
    icon: '🍹',
    color: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    accentHex: '#06b6d4',
    totalBudget: 0,
  },
];

// ── Campaign ────────────────────────────────────────────────────────────────────
export interface CampaignSummary {
  id: string;
  name: string;
  tagline: string;
  status: CampaignSummaryStatus;
  groupId: SegmentGroupId;    // which segment this campaign belongs to
  budget: number;             // fixed amount allocated to this campaign
  spent: number;
  applicants: number;
  approved: number;
  startsOn: string;
  endsOn: string;
  targetLaunch: string;
  cover: string;
  category: string;
  brief?: string;
  audience?: string;
  hashtags?: string;
  perk?: string;
  deliverables?: DeliverableWithDate[];
  activeCreatorHandle?: string;
  activeCreatorName?: string;
  activeCreatorThumb?: string;
  premium?: boolean;
  eventTag?: string;  // optionallinks campaigns across groups under one launch/event name
}

export const CAMPAIGNS: CampaignSummary[] = [];

// ── Style maps ──────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<CampaignSummaryStatus, { dot: string; badge: string }> = {
  Active:    { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  Draft:     { dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  Paused:    { dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  Completed: { dot: 'bg-cyan-500',   badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

const SEGMENT_ICON_COMPONENT: Record<SegmentGroupId, React.ComponentType<{ className?: string }>> = {
  food:     Utensils,
  ambience: Camera,
  drinks:   Wine,
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatRange = (start: string, end: string) => {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${new Date(start).toLocaleDateString('en-IN', opts)} – ${new Date(end).toLocaleDateString('en-IN', opts)}`;
};

// ── Segment Group Card ──────────────────────────────────────────────────────────
function SegmentGroupCard({
  group,
  campaigns,
  segmentBudget,
  onBudgetChange,
  onAddCampaign,
  onDelete,
}: {
  group: SegmentGroup;
  campaigns: CampaignSummary[];
  segmentBudget: number;
  onBudgetChange: (val: number) => void;
  onAddCampaign: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(segmentBudget));

  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const activeCount = campaigns.filter(c => c.status === 'Active').length;
  const totalApplicants = campaigns.reduce((s, c) => s + c.applicants, 0);
  const pct = segmentBudget > 0 ? Math.min(100, (totalSpent / segmentBudget) * 100) : 0;
  const IconComp = SEGMENT_ICON_COMPONENT[group.id];

  const commitBudget = () => {
    const val = parseInt(budgetDraft.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val >= 0) onBudgetChange(val);
    setEditingBudget(false);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 ${group.borderColor} overflow-hidden shadow-sm`}>
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-xl ${group.color} ${group.borderColor} border flex items-center justify-center flex-shrink-0`}>
            <IconComp className={`w-4 h-4 ${group.textColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-sm">{group.name}</div>
            <div className="text-[11px] text-gray-400 truncate">{group.description}</div>
          </div>
          <button
            onClick={onDelete}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title="Delete segment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Editable segment budget */}
        <div className="mb-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Segment Budget</div>
          {editingBudget ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">₹</span>
              <input
                autoFocus
                type="number"
                min={0}
                value={budgetDraft}
                onChange={e => setBudgetDraft(e.target.value)}
                onBlur={commitBudget}
                onKeyDown={e => { if (e.key === 'Enter') commitBudget(); if (e.key === 'Escape') setEditingBudget(false); }}
                className={`w-full text-lg font-black border-b-2 ${group.borderColor} outline-none bg-transparent ${group.textColor}`}
              />
            </div>
          ) : (
            <button
              onClick={() => { setBudgetDraft(String(segmentBudget)); setEditingBudget(true); }}
              className={`text-lg font-black ${group.textColor} hover:opacity-70 transition-opacity flex items-center gap-1`}
              title="Click to edit budget"
            >
              {segmentBudget > 0 ? INR.format(segmentBudget) : <span className="text-gray-300 text-sm font-semibold">Set budget…</span>}
              <span className="text-[10px] text-gray-300 font-normal ml-1">✏️</span>
            </button>
          )}
        </div>

        {/* KPI row3 items only, no overflow */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[
            { label: 'Campaigns', value: String(campaigns.length) },
            { label: 'Active', value: String(activeCount) },
            { label: 'Applicants', value: String(totalApplicants) },
          ].map(s => (
            <div key={s.label} className={`${group.color} rounded-lg px-2 py-1.5 text-center`}>
              <div className={`text-sm font-black ${group.textColor}`}>{s.value}</div>
              <div className="text-[9px] text-gray-500 mt-0.5 truncate">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Spend bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
            <span className="text-gray-500">Spent</span>
            <span className={group.textColor}>{INR.format(totalSpent)}{segmentBudget > 0 ? ` / ${INR.format(segmentBudget)}` : ''}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: group.accentHex }} />
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5 text-right">{Math.round(pct)}% spent</div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-2 flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span>{expanded ? 'Hide' : `Show ${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100">
          {campaigns.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400 text-center">No campaigns in this segment yet.</div>
          )}
          {campaigns.map(c => {
            const st = STATUS_STYLES[c.status];
            const cPct = c.budget > 0 ? Math.min(100, (c.spent / c.budget) * 100) : 0;
            return (
              <Link key={c.id} to={`/marketing/campaigns/${c.id}`}
                className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{c.name}</div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1 w-16">
                    <div className="h-full rounded-full" style={{ width: `${cPct}%`, background: group.accentHex }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 text-[10px] text-gray-500">{INR.format(c.spent)} spent</div>
                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
              </Link>
            );
          })}
          <div className="px-4 py-2.5">
            <button onClick={onAddCampaign}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 border-dashed ${group.borderColor} ${group.textColor} text-xs font-bold transition-colors`}
            >
              <Plus className="w-3 h-3" /> Add campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Segment spend overview bar (for analytics) ──────────────────────────────────
function SegmentSpendOverview({ campaigns, segmentBudgets, segments: segList }: { campaigns: CampaignSummary[]; segmentBudgets: Record<string, number>; segments: SegmentGroup[] }) {
  const segments = segList.map(g => {
    const gc = campaigns.filter(c => c.groupId === g.id);
    return {
      ...g,
      spent: gc.reduce((s, c) => s + c.spent, 0),
      allocated: gc.reduce((s, c) => s + c.budget, 0),
      count: gc.length,
      totalBudget: segmentBudgets[g.id] ?? 0,
    };
  });
  const totalSpent = segments.reduce((s, g) => s + g.spent, 0);
  const totalBudget = segments.reduce((s, g) => s + g.totalBudget, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-900">Spend by Segment</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Total spent</div>
          <div className="text-base font-black text-gray-900">{INR.format(totalSpent)} <span className="text-xs text-gray-400 font-normal">of {INR.format(totalBudget)}</span></div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
        {segments.map(g => {
          const width = totalBudget > 0 ? (g.spent / totalBudget) * 100 : 0;
          if (width === 0) return null;
          return (
            <div key={g.id} className="h-full rounded-full transition-all" style={{ width: `${width}%`, background: g.accentHex }} title={`${g.name}: ${INR.format(g.spent)}`} />
          );
        })}
        {/* Remaining */}
        <div className="flex-1 h-full bg-gray-100 rounded-full" />
      </div>

      {/* Per-segment rows */}
      <div className="space-y-3">
        {segments.map(g => {
          const pct = g.totalBudget > 0 ? Math.min(100, (g.spent / g.totalBudget) * 100) : 0;
          const IconComp = SEGMENT_ICON_COMPONENT[g.id];
          return (
            <div key={g.id} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-lg ${g.color} flex items-center justify-center flex-shrink-0`}>
                <IconComp className={`w-3.5 h-3.5 ${g.textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{g.name}</span>
                  <span className="text-xs font-bold text-gray-800">{INR.format(g.spent)} <span className="text-gray-400 font-normal">/ {INR.format(g.totalBudget)}</span></span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: g.accentHex }} />
                </div>
              </div>
              <div className="text-[10px] text-gray-400 flex-shrink-0 w-10 text-right">{Math.round(pct)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ViewMode = 'card' | 'list' | 'kanban';

// Segment accent palettes for new segments
const SEGMENT_PALETTE = [
  { color: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-200', accentHex: '#f43f5e' },
  { color: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', accentHex: '#10b981' },
  { color: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200', accentHex: '#6366f1' },
  { color: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200', accentHex: '#eab308' },
];

export default function CampaignsList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<SegmentGroupId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CampaignSummaryStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [campaignList, setCampaignList] = useState<CampaignSummary[]>(CAMPAIGNS);
  const [createForGroup, setCreateForGroup] = useState<SegmentGroupId | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [segments, setSegments] = useState<SegmentGroup[]>(SEGMENT_GROUPS);
  const [segmentBudgets, setSegmentBudgets] = useState<Record<string, number>>(
    Object.fromEntries(SEGMENT_GROUPS.map(g => [g.id, g.totalBudget]))
  );
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDesc, setNewSegmentDesc] = useState('');

  const addSegment = () => {
    const trimmed = newSegmentName.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-') as SegmentGroupId;
    const palette = SEGMENT_PALETTE[segments.length % SEGMENT_PALETTE.length];
    const newSeg: SegmentGroup = {
      id,
      name: trimmed,
      description: newSegmentDesc.trim() || trimmed,
      icon: '📌',
      totalBudget: 0,
      ...palette,
    };
    setSegments(prev => [...prev, newSeg]);
    setSegmentBudgets(prev => ({ ...prev, [id]: 0 }));
    setNewSegmentName('');
    setNewSegmentDesc('');
    setShowAddSegment(false);
  };

  const deleteSegment = (id: string) => {
    setSegments(prev => prev.filter(g => g.id !== id));
    setSegmentBudgets(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (groupFilter === id) setGroupFilter('all');
  };

  const filtered = campaignList.filter((c) => {
    const q = c.name.toLowerCase().includes(query.toLowerCase());
    const g = groupFilter === 'all' || c.groupId === groupFilter;
    const s = statusFilter === 'all' || c.status === statusFilter;
    return q && g && s;
  });

  const counts = {
    active:     campaignList.filter(c => c.status === 'Active').length,
    draft:      campaignList.filter(c => c.status === 'Draft').length,
    applicants: campaignList.reduce((s, c) => s + c.applicants, 0),
    spend:      campaignList.reduce((s, c) => s + c.spent, 0),
    budget:     campaignList.reduce((s, c) => s + c.budget, 0),
  };

  const handleOpenCreate = (gid?: SegmentGroupId) => {
    setCreateForGroup(gid);
    setShowCreate(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.active} active · {counts.draft} drafts · {counts.applicants} total applicants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search campaigns"
              className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 w-52"
            />
          </div>
          {/* Segment filter pills */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['all', ...segments.map(g => g.id)] as string[]).map(gid => {
              const g = segments.find(x => x.id === gid);
              const active = groupFilter === gid;
              return (
                <button
                  key={gid}
                  onClick={() => setGroupFilter(gid as SegmentGroupId | 'all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {g ? `${g.icon} ${g.name}` : 'All'}
                </button>
              );
            })}
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as CampaignSummaryStatus | 'all')}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
          </select>
          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
            {([['kanban', Kanban], ['card', LayoutGrid], ['list', List]] as [ViewMode, React.ComponentType<{className?: string}>][]).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${viewMode === mode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1) + ' view'}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI strip */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Megaphone,   label: 'Active',      value: counts.active,             accent: 'text-cyan-600 bg-cyan-50' },
            { icon: Sparkles,    label: 'Drafts',       value: counts.draft,              accent: 'text-amber-600 bg-amber-50' },
            { icon: Users,       label: 'Applicants',   value: counts.applicants,         accent: 'text-violet-600 bg-violet-50' },
            { icon: TrendingUp,  label: 'Spent',        value: INR.format(counts.spend),  accent: 'text-emerald-600 bg-emerald-50' },
            { icon: Layers,      label: 'Total alloc.',  value: INR.format(counts.budget), accent: 'text-gray-600 bg-gray-100' },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
                <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{label}</div>
                <div className="text-lg font-bold text-gray-900">{value}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Segments */}
        {groupFilter === 'all' && statusFilter === 'all' && !query && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Segments</h2>
              </div>
              <button
                onClick={() => setShowAddSegment(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-600 border border-cyan-200 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add segment
              </button>
            </div>

            {/* Add segment inline form */}
            {showAddSegment && (
              <div className="mb-4 p-4 bg-white border border-gray-200 rounded-xl flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Segment name</label>
                  <input
                    autoFocus
                    value={newSegmentName}
                    onChange={e => setNewSegmentName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addSegment(); if (e.key === 'Escape') setShowAddSegment(false); }}
                    placeholder="e.g. Events, Delivery, Brand"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Description (optional)</label>
                  <input
                    value={newSegmentDesc}
                    onChange={e => setNewSegmentDesc(e.target.value)}
                    placeholder="What kind of campaigns go here?"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>
                <button onClick={addSegment} disabled={!newSegmentName.trim()} className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-cyan-600">Add</button>
                <button onClick={() => setShowAddSegment(false)} className="px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-200">Cancel</button>
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 content-start">
                {segments.map(g => (
                  <SegmentGroupCard
                    key={g.id}
                    group={g}
                    campaigns={campaignList.filter(c => c.groupId === g.id)}
                    segmentBudget={segmentBudgets[g.id] ?? 0}
                    onBudgetChange={val => setSegmentBudgets(prev => ({ ...prev, [g.id]: val }))}
                    onAddCampaign={() => handleOpenCreate(g.id)}
                    onDelete={() => deleteSegment(g.id)}
                  />
                ))}
              </div>
              <SegmentSpendOverview campaigns={campaignList} segmentBudgets={segmentBudgets} segments={segments} />
            </div>
          </section>
        )}

        {/* Campaignskanban / card / list view */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {groupFilter !== 'all'
                ? `${segments.find(g => g.id === groupFilter)?.name ?? groupFilter} campaigns`
                : statusFilter !== 'all'
                ? `${statusFilter} campaigns`
                : 'All campaigns'} · {filtered.length}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
              <Megaphone className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <div className="text-sm font-semibold text-gray-500">No campaigns yet</div>
              <div className="text-xs text-gray-400 mt-1">Create your first campaign to start matching with creators.</div>
              <button
                onClick={() => handleOpenCreate(createForGroup)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 hover:underline"
              >
                <Plus className="w-4 h-4" /> Create your first campaign
              </button>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanView campaigns={filtered} />
          ) : viewMode === 'list' ? (
            <ListView campaigns={filtered} />
          ) : (
            <CardView campaigns={filtered} />
          )}
        </section>
      </div>

      {showCreate && (
        <CreateCampaignModal
          defaultGroupId={createForGroup}
          onClose={() => { setShowCreate(false); setCreateForGroup(undefined); }}
          onCreate={newCampaign => {
            setCampaignList(prev => [newCampaign, ...prev]);
            setShowCreate(false);
            setCreateForGroup(undefined);
            navigate(`/marketing/campaigns/${newCampaign.id}`);
          }}
        />
      )}
    </div>
  );
}

// ── Kanban View (Jira-style) ────────────────────────────────────────────────────
const KANBAN_COLS: { status: CampaignSummaryStatus; label: string; dotColor: string; accent: string }[] = [
  { status: 'Draft',     label: 'DRAFT',     dotColor: '#9CA3AF', accent: '#F3F4F6' },
  { status: 'Active',    label: 'LIVE',      dotColor: '#10B981', accent: '#ECFDF5' },
  { status: 'Paused',    label: 'PAUSED',    dotColor: '#F59E0B', accent: '#FFFBEB' },
  { status: 'Completed', label: 'COMPLETED', dotColor: '#06B6D4', accent: '#ECFEFF' },
];

function KanbanView({ campaigns }: { campaigns: CampaignSummary[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3 min-h-[400px]">
      {KANBAN_COLS.map(col => {
        const colCampaigns = campaigns.filter(c => c.status === col.status);
        return (
          <div key={col.status} className="flex flex-col w-64 flex-shrink-0">
            {/* Jira-style column header */}
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.dotColor }} />
              <span className="text-[11px] font-bold text-gray-500 tracking-widest flex-1">{col.label}</span>
              <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{colCampaigns.length}</span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1">
              {colCampaigns.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-5 text-center text-[11px] text-gray-300 bg-gray-50/50">
                  No campaigns
                </div>
              ) : colCampaigns.map(c => {
                const g = SEGMENT_GROUPS.find(x => x.id === c.groupId);
                return (
                  <Link
                    key={c.id}
                    to={`/marketing/campaigns/${c.id}`}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-cyan-300 hover:shadow-md transition-all flex flex-col gap-2.5 group"
                  >
                    {/* Campaign name */}
                    <div className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-cyan-700 transition-colors">
                      {c.name}
                    </div>
                    {/* Tagline */}
                    <div className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{c.tagline}</div>

                    {/* Segment + creator badges */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {g && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${g.color} ${g.textColor} ${g.borderColor}`}>
                          {g.icon} {g.name}
                        </span>
                      )}
                      {c.activeCreatorHandle && (
                        <span className="inline-flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          <Zap className="w-2.5 h-2.5" />{c.activeCreatorName ?? c.activeCreatorHandle}
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{c.applicants} applied
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />{c.approved} approved
                      </span>
                    </div>

                    {/* Budget */}
                    <div className="text-[10px] font-semibold text-gray-400">
                      Budget: <span className="text-gray-700">{INR.format(c.budget)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── List View ────────────────────────────────────────────────────────────────────
function ListView({ campaigns }: { campaigns: CampaignSummary[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-200">
            <th className="text-left px-5 py-3">Campaign</th>
            <th className="text-left px-3 py-3">Segment</th>
            <th className="text-left px-3 py-3">Status</th>
            <th className="text-right px-3 py-3">Applicants</th>
            <th className="text-right px-3 py-3">Budget</th>
            <th className="text-right px-3 py-3">Spend %</th>
            <th className="text-left px-3 py-3">Dates</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {campaigns.map(c => {
            const st = STATUS_STYLES[c.status];
            const g = SEGMENT_GROUPS.find(x => x.id === c.groupId);
            const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
            return (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[200px]">{c.tagline}</div>
                </td>
                <td className="px-3 py-3">
                  {g && <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${g.color} ${g.textColor} ${g.borderColor}`}>{g.icon} {g.name}</span>}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {c.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="text-sm font-bold text-gray-900">{c.applicants}</div>
                  <div className="text-[10px] text-gray-400">{c.approved} approved</div>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-gray-900">{INR.format(c.budget)}</td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g?.accentHex ?? '#06b6d4' }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8">{pct}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-500">{formatRange(c.startsOn, c.endsOn)}</td>
                <td className="px-3 py-3">
                  <Link to={`/marketing/campaigns/${c.id}`} className="text-xs font-semibold text-cyan-600 hover:underline flex items-center gap-1">
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Card View ────────────────────────────────────────────────────────────────────
function CardView({ campaigns }: { campaigns: CampaignSummary[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map(campaign => {
        const status = STATUS_STYLES[campaign.status];
        const group = SEGMENT_GROUPS.find(g => g.id === campaign.groupId);
        const progress = campaign.budget > 0 ? Math.min(100, (campaign.spent / campaign.budget) * 100) : 0;
        return (
          <Link
            key={campaign.id}
            to={`/marketing/campaigns/${campaign.id}`}
            className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-cyan-300 hover:shadow-md transition-all flex flex-col"
          >
            <div className="relative h-32 overflow-hidden">
              <img src={campaign.cover} alt={campaign.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {campaign.status}
                </span>
                {group && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${group.color} ${group.textColor} ${group.borderColor}`}>
                    {group.icon} {group.name}
                  </span>
                )}
                {campaign.premium && (
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5 fill-amber-900" /> Premium
                  </span>
                )}
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{campaign.category}</div>
                <div className="font-bold text-base leading-tight">{campaign.name}</div>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <p className="text-xs text-gray-500 line-clamp-2">{campaign.tagline}</p>
              {campaign.activeCreatorHandle && (
                <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-100 rounded-lg px-2.5 py-1.5">
                  {campaign.activeCreatorThumb && (
                    <img src={campaign.activeCreatorThumb} alt={campaign.activeCreatorName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  )}
                  <Zap className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-cyan-700 truncate">
                    Collab in progress · {campaign.activeCreatorName ?? campaign.activeCreatorHandle}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Applicants" value={campaign.applicants} />
                <Stat label="Approved" value={campaign.approved} />
                <Stat label="Budget" value={INR.format(campaign.budget)} compact />
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1">
                  <span>Spend</span>
                  <span>{INR.format(campaign.spent)} / {INR.format(campaign.budget)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, background: group?.accentHex ?? '#06b6d4' }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatRange(campaign.startsOn, campaign.endsOn)}
                </span>
                <span className="inline-flex items-center gap-1 text-cyan-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  View <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────
function Stat({ label, value, compact }: { label: string; value: string | number; compact?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
      <div className={`font-bold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}

// ── Platform deliverable config ──────────────────────────────────────────────────
const PLATFORMS: { id: string; label: string; icon: string; deliverableTypes: { id: string; label: string }[] }[] = [
  {
    id: 'instagram', label: 'Instagram', icon: '📸',
    deliverableTypes: [
      { id: 'reel', label: 'Reel' },
      { id: 'post_static', label: 'Static Post' },
      { id: 'post_carousel', label: 'Carousel Post' },
      { id: 'story', label: 'Story (frames)' },
      { id: 'live', label: 'Instagram Live' },
    ],
  },
  {
    id: 'youtube', label: 'YouTube', icon: '▶️',
    deliverableTypes: [
      { id: 'short', label: 'YouTube Short' },
      { id: 'longform', label: 'Long-form Video' },
      { id: 'community', label: 'Community Post' },
    ],
  },
  {
    id: 'tiktok', label: 'TikTok', icon: '🎵',
    deliverableTypes: [
      { id: 'video', label: 'TikTok Video' },
      { id: 'live', label: 'TikTok Live' },
    ],
  },
  {
    id: 'blog', label: 'Blog / Review', icon: '✍️',
    deliverableTypes: [
      { id: 'blog_post', label: 'Blog Post' },
      { id: 'google_review', label: 'Google Review' },
      { id: 'zomato_review', label: 'Zomato Review' },
    ],
  },
];

interface DeliverableEntry {
  platformId: string;
  typeId: string;
  typeLabel: string;
  quantity: number;
  dueDate: string;
}

const PERK_OPTIONS = [
  'Barter (meal for 2)', 'Barter (meal for 4)', 'Cash payment',
  'Barter + cash top-up', 'Gift voucher', 'Custom',
];

function CreateCampaignModal({
  defaultGroupId,
  onClose,
  onCreate,
}: {
  defaultGroupId?: SegmentGroupId;
  onClose: () => void;
  onCreate: (campaign: CampaignSummary) => void;
}) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [brief, setBrief] = useState('');
  const [groupId, setGroupId] = useState<SegmentGroupId>(defaultGroupId ?? 'food');
  const [budget, setBudget] = useState(0);
  const [perk, setPerk] = useState(PERK_OPTIONS[0]);
  const [customPerk, setCustomPerk] = useState('');
  const [audience, setAudience] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [eventTag, setEventTag] = useState('');

  // Gallery images
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Deliverablesplatform-first
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [deliverableEntries, setDeliverableEntries] = useState<DeliverableEntry[]>([]);

  // Schedule
  const [scheduleType, setScheduleType] = useState<'exact' | 'range'>('range');
  const [exactDate, setExactDate] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [targetLaunch, setTargetLaunch] = useState('');

  // Notes
  const [notes, setNotes] = useState('');
  const [notesPublic, setNotesPublic] = useState(false);

  const selectedGroup = SEGMENT_GROUPS.find(g => g.id === groupId)!;

  // Gallery upload
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls = files.map(f => URL.createObjectURL(f));
    setGalleryImages(prev => [...prev, ...urls]);
    e.target.value = '';
  };

  const removeGalleryImage = (idx: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Platform toggle
  const togglePlatform = (pid: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(pid)) {
        setDeliverableEntries(de => de.filter(d => d.platformId !== pid));
        return prev.filter(p => p !== pid);
      }
      return [...prev, pid];
    });
  };

  // Add deliverable row for a platform type
  const addDeliverable = (platformId: string, typeId: string, typeLabel: string) => {
    setDeliverableEntries(prev => [
      ...prev,
      { platformId, typeId, typeLabel, quantity: 1, dueDate: '' },
    ]);
  };

  const removeDeliverable = (idx: number) => {
    setDeliverableEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const updateDeliverable = (idx: number, field: keyof DeliverableEntry, value: string | number) => {
    setDeliverableEntries(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const canSubmit = name.trim().length > 2;

  const buildId = () =>
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `campaign-${Date.now()}`;

  const buildCampaign = (): CampaignSummary => {
    const startsOn = scheduleType === 'exact' ? exactDate : rangeFrom;
    const endsOn = scheduleType === 'exact' ? exactDate : rangeTo;
    const allDeliverables = deliverableEntries.map(d =>
      Array.from({ length: d.quantity }, (_, i) => ({
        label: d.quantity > 1 ? `${d.typeLabel} #${i + 1}` : d.typeLabel,
        dueDate: d.dueDate,
      }))
    ).flat();

    return {
      id: buildId(),
      name: name.trim(),
      tagline: tagline.trim() || 'New campaign',
      status: 'Draft',
      groupId,
      budget,
      spent: 0,
      applicants: 0,
      approved: 0,
      startsOn: startsOn || new Date().toISOString().slice(0, 10),
      endsOn: endsOn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      targetLaunch,
      cover: galleryImages[0] ?? '',
      gallery: galleryImages,
      category: selectedGroup.name,
      brief: brief.trim() || undefined,
      audience: audience.trim() || undefined,
      hashtags: hashtags.trim() || undefined,
      perk: perk === 'Custom' ? customPerk.trim() || 'Custom' : perk,
      deliverables: allDeliverables,
      eventTag: eventTag.trim() ? eventTag.trim().toLowerCase().replace(/\s+/g, '-') : undefined,
    } as CampaignSummary;
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="font-bold text-gray-900 text-base">Create campaign</div>
            <div className="text-xs text-gray-400 mt-0.5">Creators see this brief when applying.</div>
          </div>
          <button onClick={onClose} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* 1. Segment */}
          <Section title="Segment" subtitle="Which content bucket does this campaign belong to?">
            <div className="grid grid-cols-3 gap-2">
              {SEGMENT_GROUPS.map(g => {
                const IC = SEGMENT_ICON_COMPONENT[g.id];
                const active = groupId === g.id;
                return (
                  <button key={g.id} type="button" onClick={() => setGroupId(g.id)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      active ? `${g.color} ${g.borderColor} ${g.textColor}` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <IC className="w-5 h-5" />
                    {g.name}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 2. Basics */}
          <Section title="Basics">
            <div className="space-y-3">
              <Field label="Campaign name" required>
                <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. July Cocktail Drop" className={inputCls} />
              </Field>
              <Field label="Tagline" hint="One-line summary shown on the campaign card.">
                <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Drive weekend cocktail orders with reel creators" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Budget (INR)">
                  <input type="number" min={0} step={1000} value={budget || ''} onChange={e => setBudget(Number(e.target.value))}
                    placeholder="0" className={inputCls} />
                </Field>
                <Field label="Event / launch tag" hint="Links campaigns across segments for one event.">
                  <input value={eventTag} onChange={e => setEventTag(e.target.value)} placeholder="e.g. July Launch" className={inputCls} />
                </Field>
                <Field label="Target audience">
                  <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. 22–35, foodies, Bangalore" className={inputCls} />
                </Field>
                <Field label="Perk type">
                  <select value={perk} onChange={e => setPerk(e.target.value)} className={inputCls}>
                    {PERK_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
              {perk === 'Custom' && (
                <Field label="Custom perk description">
                  <input value={customPerk} onChange={e => setCustomPerk(e.target.value)}
                    placeholder="e.g. 3-course dinner for 2 + ₹2,000 gift card" className={inputCls} />
                </Field>
              )}
            </div>
          </Section>

          {/* 3. Campaign images */}
          <Section title="Campaign images" subtitle="Add multiple imagesfirst image is the cover.">
            <div className="flex flex-wrap gap-2 mb-2">
              {galleryImages.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold text-white bg-black/50 py-0.5">Cover</span>
                  )}
                  <button type="button" onClick={() => removeGalleryImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full items-center justify-center hidden group-hover:flex">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-300 transition-colors">
                <Upload className="w-4 h-4 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-400">Add</span>
                <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
              </label>
            </div>
          </Section>

          {/* 4. Brief */}
          <Section title="Brief">
            <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={3}
              placeholder="Goal, vibe, do's & don'ts, mandatory mentions…"
              className={`${inputCls} resize-y`} />
          </Section>

          {/* 5. Platforms & Deliverables */}
          <Section title="Platforms & Deliverables" required subtitle="Select platforms first, then add deliverables for each.">
            {/* Platform chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.map(p => {
                const active = selectedPlatforms.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      active ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                    <span>{p.icon}</span>{p.label}
                    {active && <X className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Per-platform deliverable builder */}
            {selectedPlatforms.map(pid => {
              const platform = PLATFORMS.find(p => p.id === pid)!;
              const platformEntries = deliverableEntries.filter(d => d.platformId === pid);
              return (
                <div key={pid} className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm">{platform.icon}</span>
                    <span className="text-xs font-bold text-gray-700">{platform.label}</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {/* Existing entries */}
                    {platformEntries.map((entry, globalIdx) => {
                      const idx = deliverableEntries.indexOf(entry);
                      return (
                        <div key={idx} className="grid grid-cols-[1fr_60px_140px_32px] gap-2 items-center">
                          <div className="text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg px-2 py-1.5 truncate">{entry.typeLabel}</div>
                          <div>
                            <input type="number" min={1} max={20} value={entry.quantity}
                              onChange={e => updateDeliverable(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-cyan-300" />
                          </div>
                          <div>
                            <input type="date" value={entry.dueDate}
                              onChange={e => updateDeliverable(idx, 'dueDate', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300" />
                          </div>
                          <button type="button" onClick={() => removeDeliverable(idx)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {platformEntries.length > 0 && (
                      <div className="grid grid-cols-[1fr_60px_140px_32px] gap-2 text-[10px] text-gray-400 font-semibold px-1">
                        <div>Type</div><div className="text-center">Qty</div><div>Due date</div><div />
                      </div>
                    )}
                    {/* Add deliverable type */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {platform.deliverableTypes.map(dt => {
                        const alreadyAdded = platformEntries.some(e => e.typeId === dt.id);
                        return (
                          <button key={dt.id} type="button"
                            onClick={() => !alreadyAdded && addDeliverable(pid, dt.id, dt.label)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all ${
                              alreadyAdded
                                ? 'bg-cyan-500 border-cyan-500 text-white cursor-default'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-cyan-300 hover:text-cyan-700'
                            }`}>
                            {alreadyAdded && <Check className="w-2.5 h-2.5" />}
                            {dt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {selectedPlatforms.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                Select a platform above to add deliverables
              </div>
            )}
          </Section>

          {/* 6. Creator visit schedule */}
          <Section title="Creator visit / shoot schedule">
            <div className="flex items-center gap-2 mb-3">
              <button type="button" onClick={() => setScheduleType('range')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${scheduleType === 'range' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}>
                Date range
              </button>
              <button type="button" onClick={() => setScheduleType('exact')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${scheduleType === 'exact' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}>
                Fixed date
              </button>
              <span className="text-[11px] text-gray-400">
                {scheduleType === 'range' ? 'Creator can visit any time within this window' : 'Creator must come on this specific date'}
              </span>
            </div>
            {scheduleType === 'range' ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="From"><input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} className={inputCls} /></Field>
                <Field label="To"><input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} className={inputCls} /></Field>
              </div>
            ) : (
              <Field label="Visit date"><input type="date" value={exactDate} onChange={e => setExactDate(e.target.value)} className={inputCls} /></Field>
            )}
            <div className="mt-3">
              <Field label="Content go-live / target launch">
                <input type="date" value={targetLaunch} onChange={e => setTargetLaunch(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* 7. Hashtags */}
          <Section title="Mandatory hashtags & handles">
            <input value={hashtags} onChange={e => setHashtags(e.target.value)}
              placeholder="#yourvenue, @yourhandle" className={inputCls} />
          </Section>

          {/* 8. Notes / Special requests */}
          <Section title="Notes & special requests">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="e.g. Please capture the new outdoor seating area. Avoid showing the basement level."
              className={`${inputCls} resize-y`} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Visibility</span>
              <button type="button" onClick={() => setNotesPublic(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <div className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${notesPublic ? 'bg-cyan-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform block ${notesPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                {notesPublic ? 'Shown publicly to all creators' : 'Shown only to selected creator'}
              </button>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-400">You can invite creators after the draft is saved.</div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white rounded-lg border border-gray-200">Cancel</button>
            <button onClick={() => { if (canSubmit) onCreate(buildCampaign()); }} disabled={!canSubmit}
              className="px-4 py-2 text-sm font-semibold text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Save as draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, required, children }: { title: string; subtitle?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2">
        <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
          {title}{required && <span className="text-rose-500">*</span>}
        </div>
        {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
        {label}{required && <span className="text-rose-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
    </label>
  );
}
