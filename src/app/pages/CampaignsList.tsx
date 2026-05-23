import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Filter,
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
} from 'lucide-react';

export type CampaignSummaryStatus = 'Active' | 'Draft' | 'Completed' | 'Paused';

export interface CampaignSummary {
  id: string;
  name: string;
  tagline: string;
  status: CampaignSummaryStatus;
  budget: number;
  spent: number;
  applicants: number;
  approved: number;
  startsOn: string;
  endsOn: string;
  cover: string;
  category: string;
}

export const CAMPAIGNS: CampaignSummary[] = [
  {
    id: 'weekend-brunch',
    name: 'Weekend Brunch Push',
    tagline: 'Drive Saturday & Sunday brunch reservations from foodie creators',
    status: 'Active',
    budget: 85000,
    spent: 41200,
    applicants: 18,
    approved: 5,
    startsOn: '2026-05-04',
    endsOn: '2026-06-15',
    cover: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=70',
    category: 'Food · Lifestyle',
  },
  {
    id: 'cocktail-launch',
    name: 'New Cocktail Menu Launch',
    tagline: 'Hype a craft-cocktail menu drop with reels-first creators',
    status: 'Active',
    budget: 60000,
    spent: 18000,
    applicants: 11,
    approved: 3,
    startsOn: '2026-05-10',
    endsOn: '2026-06-30',
    cover: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=70',
    category: 'Bar · Nightlife',
  },
  {
    id: 'monsoon-tasting',
    name: 'Monsoon Tasting Trail',
    tagline: 'Curated tasting menu across 4 weekends — invite-only creators',
    status: 'Draft',
    budget: 120000,
    spent: 0,
    applicants: 0,
    approved: 0,
    startsOn: '2026-07-01',
    endsOn: '2026-07-28',
    cover: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=70',
    category: 'Fine Dine',
  },
  {
    id: 'student-night',
    name: 'Student Night Series',
    tagline: 'Wednesday night student offers · campus creators',
    status: 'Paused',
    budget: 35000,
    spent: 12500,
    applicants: 6,
    approved: 2,
    startsOn: '2026-04-01',
    endsOn: '2026-05-30',
    cover: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=70',
    category: 'Casual Dining',
  },
  {
    id: 'biryani-festival',
    name: 'Biryani Festival 2025',
    tagline: 'Q1 biryani trail across the city',
    status: 'Completed',
    budget: 65000,
    spent: 65000,
    applicants: 14,
    approved: 9,
    startsOn: '2026-01-15',
    endsOn: '2026-02-28',
    cover: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=70',
    category: 'Food',
  },
];

const STATUS_STYLES: Record<CampaignSummaryStatus, { dot: string; badge: string }> = {
  Active: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-200' },
  Draft: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  Paused: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  Completed: { dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
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

export default function CampaignsList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignSummaryStatus>('all');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = CAMPAIGNS.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const counts = {
    active: CAMPAIGNS.filter((c) => c.status === 'Active').length,
    draft: CAMPAIGNS.filter((c) => c.status === 'Draft').length,
    applicants: CAMPAIGNS.reduce((sum, c) => sum + c.applicants, 0),
    spend: CAMPAIGNS.reduce((sum, c) => sum + c.spent, 0),
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns"
              className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CampaignSummaryStatus)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI strip */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <KpiCard icon={Megaphone} label="Active campaigns" value={counts.active} accent="text-cyan-600 bg-cyan-50" />
          <KpiCard icon={Users} label="Total applicants" value={counts.applicants} accent="text-violet-600 bg-violet-50" />
          <KpiCard icon={TrendingUp} label="Spend to date" value={INR.format(counts.spend)} accent="text-emerald-600 bg-emerald-50" />
          <KpiCard icon={Sparkles} label="Drafts" value={counts.draft} accent="text-amber-600 bg-amber-50" />
        </section>

        {/* Grid of campaigns */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {statusFilter === 'all' ? 'All campaigns' : `${statusFilter} campaigns`} · {filtered.length}
            </h2>
          </div>
          {filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
              <div className="text-sm text-gray-500">No campaigns match this view.</div>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 hover:underline"
              >
                <Plus className="w-4 h-4" /> Create your first campaign
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((campaign) => {
                const status = STATUS_STYLES[campaign.status];
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
                      <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {campaign.status}
                      </span>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{campaign.category}</div>
                        <div className="font-bold text-base leading-tight">{campaign.name}</div>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <p className="text-xs text-gray-500 line-clamp-2">{campaign.tagline}</p>
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
                          <div className="h-full bg-cyan-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {formatRange(campaign.startsOn, campaign.endsOn)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-cyan-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                          View applicants <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreate={(id) => {
            setShowCreate(false);
            navigate(`/marketing/campaigns/${id}`);
          }}
        />
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, compact }: { label: string; value: string | number; compact?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
      <div className={`font-bold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}

const DELIVERABLE_OPTIONS = [
  'Instagram Reel',
  'Instagram Post',
  'Instagram Story (3+ frames)',
  'YouTube Short',
  'YouTube Long-form',
  'Blog Review',
  'Google Review',
  'Zomato Review',
  'TikTok Video',
];

const PERK_OPTIONS = [
  'Barter (meal for 2)',
  'Barter (meal for 4)',
  'Cash payment',
  'Barter + cash top-up',
  'Gift voucher',
];

function CreateCampaignModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [brief, setBrief] = useState('');
  const [category, setCategory] = useState('Food · Lifestyle');
  const [budget, setBudget] = useState(50000);
  const [perk, setPerk] = useState(PERK_OPTIONS[0]);
  const [deliverables, setDeliverables] = useState<string[]>(['Instagram Reel']);
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [targetLaunch, setTargetLaunch] = useState('');
  const [audience, setAudience] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const toggleDeliverable = (label: string) => {
    setDeliverables((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
    setCoverUrl('');
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    setGalleryUrls((prev) => [...prev, ...urls].slice(0, 6));
  };

  const removeGallery = (idx: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit = name.trim().length > 2 && deliverables.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const id =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `campaign-${Date.now()}`;
    onCreate(id);
  };

  const effectiveCover = coverPreview || coverUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="font-bold text-gray-900">Create campaign</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Fill in the brief — creators see this when applying.
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            {/* Cover image */}
            <Section title="Cover image" subtitle="Shown at the top of the campaign — landscape works best.">
              <div className="space-y-2">
                <div className="relative h-40 w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                  {effectiveCover ? (
                    <>
                      <img src={effectiveCover} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverPreview(null);
                          setCoverUrl('');
                        }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-500">Upload an image or paste a URL below</div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <Upload className="w-4 h-4" /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => {
                      setCoverUrl(e.target.value);
                      setCoverPreview(null);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>
              </div>
            </Section>

            {/* Basics */}
            <Section title="Basics">
              <div className="space-y-3">
                <Field label="Campaign name" required>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Friday Date Night"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </Field>
                <Field label="Tagline" hint="Shown on the campaign card. Keep it crisp.">
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="One-line summary"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    >
                      <option>Food · Lifestyle</option>
                      <option>Bar · Nightlife</option>
                      <option>Fine Dine</option>
                      <option>Casual Dining</option>
                      <option>Cafe</option>
                    </select>
                  </Field>
                  <Field label="Target audience" hint="Who should creators reach?">
                    <input
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. 22–35, foodies, Bangalore"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* Brief */}
            <Section title="Brief" subtitle="What's the goal, the vibe, do's and don'ts.">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={`Goal: drive 30 brunch reservations across 4 weekends.\nVibe: warm, candid, behind-the-scenes.\nMust mention: bottomless mimosas, weekend-only menu.\nDo not: post before launch date.`}
                rows={6}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-y"
              />
            </Section>

            {/* Deliverables */}
            <Section title="Deliverables" subtitle="Pick everything creators must produce." required>
              <div className="flex flex-wrap gap-2">
                {DELIVERABLE_OPTIONS.map((label) => {
                  const active = deliverables.includes(label);
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => toggleDeliverable(label)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        active
                          ? 'bg-cyan-500 border-cyan-500 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      {label}
                    </button>
                  );
                })}
              </div>
              {deliverables.length === 0 && (
                <div className="text-xs text-rose-500 mt-2">Select at least one deliverable.</div>
              )}
            </Section>

            {/* Compensation */}
            <Section title="Compensation">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Perk type">
                  <select
                    value={perk}
                    onChange={(e) => setPerk(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    {PERK_OPTIONS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Total budget (INR)">
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </Field>
              </div>
            </Section>

            {/* Schedule */}
            <Section title="Schedule">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Starts on">
                  <input
                    type="date"
                    value={startsOn}
                    onChange={(e) => setStartsOn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </Field>
                <Field label="Ends on">
                  <input
                    type="date"
                    value={endsOn}
                    onChange={(e) => setEndsOn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </Field>
                <Field label="Target launch" hint="When the first post should go live.">
                  <input
                    type="date"
                    value={targetLaunch}
                    onChange={(e) => setTargetLaunch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </Field>
              </div>
            </Section>

            {/* Reference images */}
            <Section title="Reference images" subtitle="Upload up to 6 inspiration shots (optional).">
              <div className="grid grid-cols-3 gap-2">
                {galleryUrls.map((url, idx) => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGallery(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {galleryUrls.length < 6 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-xs text-gray-500 hover:border-cyan-300 cursor-pointer">
                    <Upload className="w-4 h-4 mb-1" />
                    Add image
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </Section>

            {/* Hashtags */}
            <Section title="Mandatory hashtags / handles" subtitle="Comma-separated.">
              <input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#smokehouse, @smokehousebar, #bangalorefood"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </Section>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <div className="text-xs text-gray-500">
              You can invite creators after the draft is created.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-4 py-2 text-sm font-semibold text-white bg-cyan-500 rounded-lg shadow-sm hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create draft
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  required,
  children,
}: {
  title: string;
  subtitle?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2">
        <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
          {title}
          {required && <span className="text-rose-500">*</span>}
        </div>
        {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
    </label>
  );
}
