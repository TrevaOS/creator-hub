import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router';
import {
  MapPin,
  TrendingUp,
  X,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Star,
  Heart,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  ArrowLeftRight,
} from 'lucide-react';
import { TopBar } from '../CreatorHubApp';
import { CREATOR } from '../data/creator';
import {
  BRAND_CAMPAIGNS,
  MARKETING_PIPELINE_META,
  MARKETING_STATUS_META,
} from '../../data/creatorHubData';

// Social platform definitions
const ALL_PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@foodie_blr',
    followers: '28.4K',
    connected: true,
    color: '#E1306C',
    icon: 'IG',
    gradient: 'linear-gradient(135deg, #FF8AC5 0%, #C13584 55%, #833AB4 100%)',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@foodie_blr',
    followers: '12K',
    connected: true,
    color: '#FF0000',
    icon: 'YT',
    gradient: 'linear-gradient(135deg, #FF5F6D 0%, #FF2D55 50%, #FB1D1D 100%)',
  },
  { id: 'tiktok', name: 'TikTok', handle: '', followers: '', connected: false, color: '#010101', icon: 'TT' },
  { id: 'twitter', name: 'X / Twitter', handle: '', followers: '', connected: false, color: '#1DA1F2', icon: 'X' },
  { id: 'spotify', name: 'Spotify', handle: '', followers: '', connected: false, color: '#1DB954', icon: 'SP' },
  { id: 'snapchat', name: 'Snapchat', handle: '', followers: '', connected: false, color: '#FFFC00', icon: 'SC', textColor: '#111' },
  { id: 'linkedin', name: 'LinkedIn', handle: '', followers: '', connected: false, color: '#0A66C2', icon: 'LI' },
  { id: 'pinterest', name: 'Pinterest', handle: '', followers: '', connected: false, color: '#E60023', icon: 'PI' },
  { id: 'zomato', name: 'Zomato', handle: '', followers: '', connected: false, color: '#E23744', icon: 'ZO' },
  { id: 'swiggy', name: 'Swiggy', handle: '', followers: '', connected: false, color: '#FC8019', icon: 'SW' },
];

const COLLABS = [
  { id: 1, brand: 'Smokehouse Bar', img: 'https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=200&h=200&fit=crop', reach: '42K', eng: '8.4%' },
  { id: 2, brand: 'Cafe Verde', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop', reach: '31K', eng: '7.1%' },
  { id: 3, brand: 'Chianti & Co', img: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=200&h=200&fit=crop', reach: '28K', eng: '6.8%' },
  { id: 4, brand: 'Roasted Bean', img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=200&fit=crop', reach: '19K', eng: '9.2%' },
  { id: 5, brand: 'Urban Bistro', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop', reach: '22K', eng: '5.9%' },
  { id: 6, brand: 'The Waffle Lab', img: 'https://images.unsplash.com/photo-1568051243858-533a607809a5?w=200&h=200&fit=crop', reach: '16K', eng: '7.7%' },
];

type BrandRecord = (typeof BRAND_CAMPAIGNS)[number];

const STARRED_BRANDS: BrandRecord[] = BRAND_CAMPAIGNS.filter((brand) => brand.audienceFit >= 85).slice(0, 4);
const LIKED_BRANDS: BrandRecord[] = BRAND_CAMPAIGNS.filter((brand) => brand.marketing.status !== 'Completed').slice(0, 5);

type View =
  | 'dashboard'
  | 'bio'
  | 'stats'
  | 'socials'
  | 'favorites'
  | 'liked'
  | 'privacy'
  | 'account';

type ToneKey = 'emerald' | 'sky' | 'amber' | 'gray' | 'purple' | 'cyan';

const TONE_STYLES: Record<ToneKey, { container: string; dot: string }> = {
  emerald: { container: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  sky: { container: 'bg-sky-50 text-sky-700 border border-sky-200', dot: 'bg-sky-500' },
  amber: { container: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  gray: { container: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' },
  purple: { container: 'bg-violet-50 text-violet-700 border border-violet-200', dot: 'bg-violet-500' },
  cyan: { container: 'bg-cyan-50 text-cyan-700 border border-cyan-200', dot: 'bg-cyan-500' },
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

function HamburgerMenu({ onClose, onNavigate, activeView }: { onClose: () => void; onNavigate: (v: View) => void; activeView: View }) {
  const navigate = useNavigate();

  const primary = [
    { label: 'Dashboard', view: 'dashboard' as View },
    { label: 'Profile Bio', view: 'bio' as View },
    { label: 'Analytics', view: 'stats' as View },
    { label: 'Social Accounts', view: 'socials' as View },
  ];

  const privateLinks = [
    { label: 'Saved Favorites', view: 'favorites' as View, icon: Star },
    { label: 'Liked Pitch Queue', view: 'liked' as View, icon: Heart },
    { label: 'Privacy & Data', view: 'privacy' as View, icon: ShieldCheck },
    { label: 'Account Controls', view: 'account' as View, icon: SlidersHorizontal },
  ];

  const systemLinks = [
    { label: 'Switch workspace', path: '/marketing', icon: ArrowLeftRight },
  ];

  const handleNavigate = (view: View) => {
    onNavigate(view);
    onClose();
  };

  const handleSystem = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-72 bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-gray-900 text-lg">Menu</span>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={CREATOR.avatar}
              alt={CREATOR.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
            <div>
              <div className="font-bold text-gray-900">{CREATOR.name}</div>
              <div className="text-xs text-gray-500">{CREATOR.handle}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] font-semibold text-gray-400 tracking-[0.2em] px-2 pb-2">NAVIGATION</div>
          {primary.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavigate(item.view)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeView === item.view ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
          <div className="text-[10px] font-semibold text-gray-400 tracking-[0.2em] px-2 pt-4 pb-2">PRIVATE</div>
          {privateLinks.map(({ label, view, icon: Icon }) => {
            const isActive = activeView === view;
            return (
            <button
              key={view}
              onClick={() => handleNavigate(view)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  <Icon className="w-4 h-4" />
                </span>
                {label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            );
          })}
          <div className="text-[10px] font-semibold text-gray-400 tracking-[0.2em] px-2 pt-4 pb-2">SYSTEM</div>
          {systemLinks.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => handleSystem(path)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                  <Icon className="w-4 h-4" />
                </span>
                {label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
      aria-label="Open menu"
    >
      <div className="flex flex-col gap-[3px] items-end">
        <div className="w-4 h-[2px] bg-gray-700 rounded" />
        <div className="w-4 h-[2px] bg-gray-700 rounded" />
        <div className="w-2.5 h-[2px] bg-gray-700 rounded" />
      </div>
    </button>
  );
}

function SocialConnect({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  const [platforms, setPlatforms] = useState(ALL_PLATFORMS);
  const [connecting, setConnecting] = useState<string | null>(null);

  const toggle = (id: string) => {
    setConnecting(id);
    setTimeout(() => {
      setPlatforms((prev) =>
        prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p))
      );
      setConnecting(null);
    }, 800);
  };

  const connected = platforms.filter((p) => p.connected);
  const available = platforms.filter((p) => !p.connected);

  return (
    <div className="flex flex-col bg-gray-50 h-full">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
              🔗
            </span>
            <div>
              <div className="font-bold text-gray-900 leading-tight">Social Accounts</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Private controls</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Connected */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">CONNECTED · {connected.length}</div>
          <div className="space-y-2">
            {connected.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                  style={{ background: p.color }}
                >
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.handle} · {p.followers} followers</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <button
                    onClick={() => toggle(p.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {connecting === p.id ? '...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">ADD MORE</div>
          <div className="space-y-2">
            {available.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                  style={{ background: p.color, color: p.textColor ?? 'white' }}
                >
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
                  <div className="text-xs text-gray-400">Tap to connect</div>
                </div>
                <button
                  onClick={() => toggle(p.id)}
                  className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-900 transition-all"
                >
                  {connecting === p.id ? (
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
        <button onClick={onBack} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500">
          ← Back
        </button>
      </div>
    </div>
  );
}

function DashboardView({ onView, onOpenMenu }: { onView: (v: View) => void; onOpenMenu: () => void }) {
  const connected = ALL_PLATFORMS.filter((p) => p.connected);

  return (
    <div className="flex flex-col bg-gray-50 h-full">
      <TopBar
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 overflow-y-auto">
        {/* Hero cover */}
        <div className="relative">
          <div className="relative h-36 w-full overflow-hidden">
            <img
              src={CREATOR.cover}
              alt="Profile cover"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-gray-50" />
            <button
              onClick={() => onView('account')}
              className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-black/60"
            >
              Edit cover
            </button>
          </div>
          {/* Avatar overlapping the cover */}
          <div className="relative z-10 px-4 -mt-12 flex flex-col">
            <img
              src={CREATOR.avatar}
              alt={CREATOR.name}
              className="h-24 w-24 rounded-full object-cover border-4 border-gray-50 shadow-lg bg-gray-100"
            />
            <div className="mt-2 flex items-center gap-1.5">
              <span className="font-bold text-gray-900 text-lg leading-tight">{CREATOR.name}</span>
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              {CREATOR.handle} <span className="text-gray-300">·</span>
              <MapPin className="h-3 w-3" /> Bangalore
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100 px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm">
                🍔 Food
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-pink-100 bg-gradient-to-r from-pink-50 to-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm">
                ✨ Lifestyle
              </span>
              <button
                onClick={() => onView('bio')}
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:border-gray-300"
              >
                View bio <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
        {/* Social chips */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">CONNECTED PLATFORMS</div>
          <div className="grid grid-cols-2 gap-2">
            {connected.map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-2xl p-4 text-white shadow-lg"
                style={{ background: p.gradient ?? p.color }}
              >
                <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/15" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10" />
                <div className="relative space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/80">Connected</div>
                  <div>
                    <div className="text-xs font-medium text-white/80">{p.handle || p.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black leading-none">{p.followers}</span>
                      <span className="text-[10px] uppercase tracking-wide text-white/75">Followers</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
                    <Check className="h-3 w-3" /> {p.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onView('socials')}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-[11px] font-semibold text-gray-500 transition-all hover:border-gray-400"
          >
            <Plus className="h-4 w-4" /> Add More
          </button>
        </div>

        {/* Live Metrics */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">LIVE METRICS</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onView('stats')}
              className="rounded-2xl bg-white p-3 text-center shadow-sm transition-all hover:shadow-md"
            >
              <div className="text-lg font-bold text-gray-900">142K</div>
              <div className="text-[9px] uppercase tracking-wide text-gray-400">Reach</div>
            </button>
            <div className="rounded-2xl border border-cyan-200 bg-white p-3 text-center shadow-[0_10px_30px_-12px_rgba(45,212,191,0.65)]">
              <div className="text-lg font-bold text-cyan-600">7.2%</div>
              <div className="text-[9px] uppercase tracking-wide text-gray-400">Eng. Rate</div>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
              <div className="text-base font-bold text-gray-900">Blore</div>
              <div className="text-[9px] uppercase tracking-wide text-gray-400">Top City</div>
            </div>
          </div>
        </div>

        {/* Private shortcuts */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">My shortcuts</div>
            <span className="flex items-center gap-1 text-xs font-medium text-indigo-500">
              <Lock className="h-3.5 w-3.5" /> Private
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onView('favorites')}
              className="group flex h-full items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-500 shadow-inner">
                <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              </span>
              <div>
                <div className="text-sm font-semibold text-gray-900">Starred pitches</div>
                <div className="text-[11px] font-medium text-gray-400">{STARRED_BRANDS.length} saved</div>
              </div>
            </button>
            <button
              onClick={() => onView('liked')}
              className="group flex h-full items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-pink-100 text-rose-500 shadow-inner">
                <Heart className="h-5 w-5 fill-rose-400 text-rose-500" />
              </span>
              <div>
                <div className="text-sm font-semibold text-gray-900">Liked queue</div>
                <div className="text-[11px] font-medium text-gray-400">{LIKED_BRANDS.length} brands</div>
              </div>
            </button>
          </div>
        </div>

        {/* Past Collabs */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">PAST COLLABS · {COLLABS.length}</div>
            <button className="text-xs font-semibold text-cyan-600">View All →</button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {COLLABS.map((c) => (
              <div key={c.id} className="group relative aspect-square overflow-hidden rounded-2xl shadow-sm">
                <img src={c.img} alt={c.brand} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-black/10 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="text-[9px] font-semibold leading-tight text-white">{c.reach} reach</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View bio button */}
        <button
          onClick={() => onView('bio')}
          className="w-full py-3 bg-white rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 shadow-sm flex items-center justify-center gap-2"
        >
          View Public Bio <ChevronRight className="w-4 h-4" />
        </button>
        </div>
      </div>
    </div>
  );
}

function BrandListCard({ brand, intent }: { brand: BrandRecord; intent: 'favorites' | 'liked' }) {
  const navigate = useNavigate();
  const statusMeta = MARKETING_STATUS_META[brand.marketing.status];
  const statusTone = TONE_STYLES[statusMeta.tone];
  const pipelineMeta = MARKETING_PIPELINE_META[brand.marketing.pipelineStage];
  const pipelineTone = TONE_STYLES[pipelineMeta.tone];
  const AccentIcon = intent === 'favorites' ? Star : Heart;
  const accentClasses =
    intent === 'favorites'
      ? 'border border-amber-200 bg-amber-100 text-amber-700'
      : 'border border-rose-200 bg-rose-100 text-rose-700';

  const handleViewBrief = () => {
    navigate('/creatorhub/home', { state: { focusBrandId: brand.id, openDetail: true } });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <img src={brand.thumb} alt={brand.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-gray-900 text-sm leading-tight">{brand.name}</div>
              <div className="text-xs text-gray-500 line-clamp-1">{brand.tagline}</div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusTone.container}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusTone.dot}`} />
              {statusMeta.label}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {brand.location}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${accentClasses}`}>
          <AccentIcon
            className={`w-3 h-3 ${intent === 'favorites' ? 'fill-amber-500 text-amber-500' : 'fill-rose-500 text-rose-500'}`}
          />
          {intent === 'favorites' ? 'Starred' : 'Liked'}
        </span>
        <span className="text-gray-400">Updated {formatDate(brand.marketing.targetLaunch)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-gray-500">
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
          <div className="text-sm font-semibold text-gray-900">{INR.format(brand.marketing.budget)}</div>
          <div className="uppercase tracking-wide text-[10px] text-gray-400">Budget</div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
          <div className="text-sm font-semibold text-gray-900">{brand.marketing.inboundLeads} leads</div>
          <div className="uppercase tracking-wide text-[10px] text-gray-400">Inbound</div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${pipelineTone.container}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pipelineTone.dot}`} />
            {pipelineMeta.label}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold">
        <button onClick={handleViewBrief} className="text-cyan-700 hover:underline inline-flex items-center gap-1">
          View brief <ChevronRight className="w-3 h-3" />
        </button>
        <button className="text-gray-400 hover:text-gray-600">Remove</button>
      </div>
    </div>
  );
}

function FavoritesView({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  return (
    <div className="flex flex-col bg-gray-50 h-full">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </span>
            <div>
              <div className="font-bold text-gray-900 leading-tight">Starred brands</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Private</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {STARRED_BRANDS.map((brand) => (
          <BrandListCard key={brand.id} brand={brand} intent="favorites" />
        ))}
        {STARRED_BRANDS.length === 0 && (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-6 text-center text-sm text-amber-700">
            Star campaigns from discovery to see them here.
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function LikedView({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  return (
    <div className="flex flex-col bg-gray-50 h-full">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </span>
            <div>
              <div className="font-bold text-gray-900 leading-tight">Liked pitch queue</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Private</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {LIKED_BRANDS.map((brand) => (
          <BrandListCard key={brand.id} brand={brand} intent="liked" />
        ))}
        {LIKED_BRANDS.length === 0 && (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/60 p-6 text-center text-sm text-rose-700">
            Tap the heart on discovery cards to build your pitch queue.
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function PrivacyCenter({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  return (
    <div className="flex flex-col bg-gray-50 h-full">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <div className="font-bold text-gray-900 leading-tight">Privacy & data</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Policy & controls</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Privacy policy</h3>
          <p className="text-sm text-gray-500 mt-2">
            Learn how Treva handles your creator data, consent, and analytics. Review the latest update from May 2026.
          </p>
          <button className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 hover:underline">
            Read full privacy policy <ChevronRight className="w-3 h-3" />
          </button>
        </section>
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Data controls</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-600">
            <li>• Export campaign history as CSV</li>
            <li>• Request data deletion for archived brands</li>
            <li>• Manage consents shared with brand partners</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300">
              Export data
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-600">
              Request deletion
            </button>
          </div>
        </section>
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Security alerts</h3>
          <p className="text-sm text-gray-500 mt-2">
            Enable push alerts when a new device logs in or when connected accounts lose access.
          </p>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-sm text-gray-600">Device login alerts</span>
            <span className="text-xs font-semibold text-emerald-600">Enabled</span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-sm text-gray-600">Connected account monitor</span>
            <span className="text-xs font-semibold text-amber-600">Review</span>
          </div>
        </section>
      </div>
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function AccountControls({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  return (
    <div className="flex flex-col bg-gray-50 h-full">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
              ⚙️
            </span>
            <div>
              <div className="font-bold text-gray-900 leading-tight">Account controls</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">Profile & sessions</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Creator profile</h3>
          <p className="text-sm text-gray-500 mt-2">
            Update your bio, categories, and profile imagery used across marketing pitches.
          </p>
          <button className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 hover:underline">
            Edit profile bio <ChevronRight className="w-3 h-3" />
          </button>
        </section>
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Sessions & devices</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <span>MacBook Pro · Chrome</span>
              <span className="text-xs font-semibold text-emerald-600">Current</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <span>Pixel 7 · Treva App</span>
              <button className="text-xs font-semibold text-rose-600">Sign out</button>
            </div>
          </div>
        </section>
        <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Workspace switching</h3>
          <p className="text-sm text-gray-500 mt-2">
            Jump to the marketing console to collaborate with brand managers or manage creator hub settings.
          </p>
          <button className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300">
            Switch to marketing workspace
          </button>
        </section>
      </div>
      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function BioView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col bg-gray-50 h-full overflow-y-auto">
      {/* Hero */}
      <div className="relative bg-gray-200" style={{ height: 200 }}>
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"
          alt="Creator cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/70" />
        <button
          onClick={onBack}
          className="absolute top-3 right-3 bg-black/40 backdrop-blur rounded-full p-1.5"
        >
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-3">
          <img
            src={CREATOR.avatar}
            alt={CREATOR.name}
            className="w-14 h-14 rounded-full border-2 border-white object-cover"
          />
          <div>
            <div className="font-bold text-white text-lg leading-none">{CREATOR.name}</div>
            <div className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
              {CREATOR.handle} · <MapPin className="w-2.5 h-2.5" /> Bangalore
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {['🍔 Food', '✨ Lifestyle', '📍 Local'].map((tag) => (
            <span key={tag} className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              {tag}
            </span>
          ))}
        </div>

        {/* Reach */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">REACH ACROSS PLATFORMS</div>
          <div className="flex items-center gap-2">
            {ALL_PLATFORMS.filter((p) => p.connected).map((p) => (
              <div
                key={p.id}
                className="rounded-xl px-4 py-2.5 text-white text-center"
                style={{ background: p.color }}
              >
                <div className="font-bold text-base leading-none">{p.followers}</div>
                <div className="text-[9px] opacity-70 mt-0.5">{p.icon} ✓</div>
              </div>
            ))}
            <button
              onClick={onBack}
              className="bg-white border border-dashed border-gray-200 rounded-xl px-4 py-2.5 text-center text-gray-400 text-xs font-semibold"
            >
              + More
            </button>
          </div>
        </div>

        {/* About */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">ABOUT</div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Bangalore-based food & lifestyle creator. I love exploring hidden gems and authentic experiences across the city.
            Partnering with brands that share a passion for great food and storytelling.
          </p>
        </div>

        {/* Featured Collab */}
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=100&h=100&fit=crop"
            alt="Smokehouse"
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
          <div>
            <div className="text-[10px] text-gray-400 font-medium">Featured Collab</div>
            <div className="font-bold text-gray-900 text-sm">The Smokehouse Bar</div>
            <div className="text-xs text-gray-400 mt-0.5">42K reach · 8.43% eng</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col bg-gray-950 h-full text-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0">
        <img
          src={CREATOR.avatar}
          alt={CREATOR.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="font-bold text-white">{CREATOR.name}</div>
          <div className="text-xs text-gray-400">{CREATOR.handle}</div>
        </div>
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Total reach hero */}
      <div className="px-4 py-6 text-center">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL REACH</div>
        <div className="text-6xl font-black text-cyan-400">142K</div>
        <div className="flex items-center justify-center gap-1 text-xs text-green-400 mt-1">
          <TrendingUp className="w-3 h-3" /> +12% this month
        </div>
      </div>

      {/* Metrics grid */}
      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">ENGAGEMENT</div>
          <div className="text-2xl font-bold text-cyan-400">7.2%</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">PITCH CRED.</div>
          <div className="text-2xl font-bold text-white">12</div>
        </div>
      </div>

      {/* Top cities */}
      <div className="px-4 mb-4">
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">TOP AUDIENCE CITIES</div>
          {[
            { city: 'Bangalore', pct: 72, color: '#22D3EE' },
            { city: 'Mumbai', pct: 14, color: '#6B7280' },
            { city: 'Delhi', pct: 9, color: '#4B5563' },
          ].map(({ city, pct, color }) => (
            <div key={city} className="flex items-center gap-3 mb-2.5">
              <span className="text-xs text-gray-300 w-16">{city}</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div className="px-4 pb-4">
        <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">RECENT CONTENT</div>
        <div className="grid grid-cols-4 gap-2">
          {COLLABS.slice(0, 4).map((c) => (
            <div key={c.id} className="aspect-square rounded-xl overflow-hidden">
              <img src={c.img} alt={c.brand} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileRouter() {
  const [view, setView] = useState<View>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { profileView?: View; openMenu?: boolean } | undefined;
    if (state?.profileView && state.profileView !== view) {
      setView(state.profileView);
    }
    if (state?.openMenu) {
      setMenuOpen(true);
    }
    if (state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, view]);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);
  const handleNavigate = (next: View) => {
    setView(next);
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [view]);

  let content: JSX.Element;
  switch (view) {
    case 'bio':
      content = <BioView onBack={() => setView('dashboard')} />;
      break;
    case 'stats':
      content = <StatsView onBack={() => setView('dashboard')} />;
      break;
    case 'socials':
      content = <SocialConnect onBack={() => setView('dashboard')} onOpenMenu={openMenu} />;
      break;
    case 'favorites':
      content = <FavoritesView onBack={() => setView('dashboard')} onOpenMenu={openMenu} />;
      break;
    case 'liked':
      content = <LikedView onBack={() => setView('dashboard')} onOpenMenu={openMenu} />;
      break;
    case 'privacy':
      content = <PrivacyCenter onBack={() => setView('dashboard')} onOpenMenu={openMenu} />;
      break;
    case 'account':
      content = <AccountControls onBack={() => setView('dashboard')} onOpenMenu={openMenu} />;
      break;
    case 'dashboard':
    default:
      content = <DashboardView onView={handleNavigate} onOpenMenu={openMenu} />;
  }

  return (
    <div className="relative h-full">
      {content}
      {menuOpen && (
        <HamburgerMenu
          activeView={view}
          onClose={closeMenu}
          onNavigate={(next) => {
            setView(next);
            closeMenu();
          }}
        />
      )}
    </div>
  );
}

export default function CreatorProfile() {
  return (
    <Routes>
      <Route index element={<ProfileRouter />} />
    </Routes>
  );
}
