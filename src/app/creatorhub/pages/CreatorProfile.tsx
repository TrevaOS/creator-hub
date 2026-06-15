import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, Dispatch, JSX, SetStateAction } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import {
  ArrowLeftRight,
  Award,
  ChevronRight,
  ExternalLink,
  Heart,
  ImagePlus,
  Link2,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import { TopBar } from '../CreatorHubApp';
import { CREATOR } from '../data/creator';
import {
  BRAND_CAMPAIGNS,
  MARKETING_PIPELINE_META,
  MARKETING_STATUS_META,
} from '../../data/creatorHubData';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../../components/ui/carousel';

type BrandRecord = (typeof BRAND_CAMPAIGNS)[number];

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

type PlatformId = 'instagram' | 'facebook' | 'spotify' | 'youtube';

type CreatorSocial = {
  url: string;
  label: string;
  followers: string;
};

type CreatorProfileState = {
  name: string;
  handle: string;
  avatar: string;
  cover: string;
  location: string;
  tagline: string;
  bio: string;
  niches: string[];
  reach: string;
  engagementRate: string;
  socials: Record<PlatformId, CreatorSocial>;
  showcaseImages: string[];
  showcasedCollabIds: number[];
};

const STORAGE_KEY = 'creatorhub.profile.v3';

const PLATFORM_META: Record<
  PlatformId,
  {
    name: string;
    short: string;
    color: string;
    gradient: string;
    helper: string;
    placeholder: string;
  }
> = {
  instagram: {
    name: 'Instagram',
    short: 'IG',
    color: '#E1306C',
    gradient: 'linear-gradient(135deg, #ff90c5 0%, #d63384 55%, #7c3aed 100%)',
    helper: 'Main profile link',
    placeholder: 'https://instagram.com/yourhandle',
  },
  facebook: {
    name: 'Facebook',
    short: 'FB',
    color: '#1877F2',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    helper: 'Page or creator profile',
    placeholder: 'https://facebook.com/yourpage',
  },
  spotify: {
    name: 'Spotify Playlist',
    short: 'SP',
    color: '#1DB954',
    gradient: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
    helper: 'Playlist or artist link',
    placeholder: 'https://open.spotify.com/playlist/...',
  },
  youtube: {
    name: 'YouTube',
    short: 'YT',
    color: '#FF0000',
    gradient: 'linear-gradient(135deg, #fb7185 0%, #ef4444 45%, #dc2626 100%)',
    helper: 'Channel or playlist link',
    placeholder: 'https://youtube.com/@yourchannel',
  },
};

const TONE_STYLES: Record<ToneKey, { container: string; dot: string }> = {
  emerald: { container: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  sky: { container: 'bg-sky-50 text-sky-700 border border-sky-200', dot: 'bg-sky-500' },
  amber: { container: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  gray: { container: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' },
  purple: { container: 'bg-violet-50 text-violet-700 border border-violet-200', dot: 'bg-violet-500' },
  cyan: { container: 'bg-cyan-50 text-cyan-700 border border-cyan-200', dot: 'bg-cyan-500' },
};

const COLLABS: { id: number; brand: string; img: string; reach: string; eng: string; campaign: string; date: string }[] = [];

const STARRED_BRANDS: BrandRecord[] = BRAND_CAMPAIGNS.filter((brand) => brand.audienceFit >= 85).slice(0, 4);
const LIKED_BRANDS: BrandRecord[] = BRAND_CAMPAIGNS.filter((brand) => brand.marketing.status !== 'Completed').slice(0, 5);

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const INITIAL_PROFILE: CreatorProfileState = {
  name: CREATOR.name,
  handle: CREATOR.handle,
  avatar: CREATOR.avatar,
  cover: CREATOR.cover,
  location: CREATOR.location,
  tagline: CREATOR.tagline,
  bio: CREATOR.bio,
  niches: CREATOR.categories,
  reach: CREATOR.reach,
  engagementRate: CREATOR.engagementRate,
  socials: {
    instagram: {
      label: '',
      followers: '',
      url: '',
    },
    facebook: {
      label: '',
      followers: '',
      url: '',
    },
    spotify: {
      label: '',
      followers: '',
      url: '',
    },
    youtube: {
      label: '',
      followers: '',
      url: '',
    },
  },
  showcaseImages: [],
  showcasedCollabIds: [],
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function safeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getConnectedPlatforms(profile: CreatorProfileState) {
  return (Object.keys(PLATFORM_META) as PlatformId[]).filter((platform) => profile.socials[platform].url.trim());
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
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <img src={brand.thumb} alt={brand.name} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold leading-tight text-gray-900">{brand.name}</div>
              <div className="line-clamp-1 text-xs text-gray-500">{brand.tagline}</div>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone.container}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
              {statusMeta.label}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-500">
            <MapPin className="h-3 w-3" /> {brand.location}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${accentClasses}`}>
          <AccentIcon className={`h-3 w-3 ${intent === 'favorites' ? 'fill-amber-500 text-amber-500' : 'fill-rose-500 text-rose-500'}`} />
          {intent === 'favorites' ? 'Starred' : 'Liked'}
        </span>
        <span className="text-gray-400">Updated {formatDate(brand.marketing.targetLaunch)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-gray-500">
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <div className="text-sm font-semibold text-gray-900">{INR.format(brand.marketing.budget)}</div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400">Budget</div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <div className="text-sm font-semibold text-gray-900">{brand.marketing.inboundLeads} leads</div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400">Inbound</div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${pipelineTone.container}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${pipelineTone.dot}`} />
            {pipelineMeta.label}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold">
        <button onClick={handleViewBrief} className="inline-flex items-center gap-1 text-cyan-700 hover:underline">
          View brief <ChevronRight className="h-3 w-3" />
        </button>
        <button className="text-gray-400 hover:text-gray-600">Remove</button>
      </div>
    </div>
  );
}

function HamburgerMenu({ onClose, onNavigate, activeView, profile }: { onClose: () => void; onNavigate: (v: View) => void; activeView: View; profile: CreatorProfileState }) {
  const navigate = useNavigate();

  const primary = [
    { label: 'Dashboard', view: 'dashboard' as View },
    { label: 'Brand Preview', view: 'bio' as View },
    { label: 'Analytics', view: 'stats' as View },
    { label: 'Social Accounts', view: 'socials' as View },
  ];

  const privateLinks = [
    { label: 'Saved Favorites', view: 'favorites' as View, icon: Star },
    { label: 'Liked Pitch Queue', view: 'liked' as View, icon: Heart },
    { label: 'Privacy & Data', view: 'privacy' as View, icon: ShieldCheck },
    { label: 'Profile Controls', view: 'account' as View, icon: SlidersHorizontal },
  ];

  const systemLinks = [{ label: 'Switch workspace', path: '/marketing', icon: ArrowLeftRight }];

  const handleSystem = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="flex h-full w-72 flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <span className="text-lg font-bold text-gray-900">Menu</span>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <img src={profile.avatar} alt={profile.name} className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover" />
            <div>
              <div className="font-bold text-gray-900">{profile.name}</div>
              <div className="text-xs text-gray-500">{profile.handle}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <div className="px-2 pb-2 text-[10px] font-semibold tracking-[0.2em] text-gray-400">NAVIGATION</div>
          {primary.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                onNavigate(item.view);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                activeView === item.view ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}
          <div className="px-2 pb-2 pt-4 text-[10px] font-semibold tracking-[0.2em] text-gray-400">PRIVATE</div>
          {privateLinks.map(({ label, view, icon: Icon }) => (
            <button
              key={view}
              onClick={() => {
                onNavigate(view);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                activeView === view ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}
          <div className="px-2 pb-2 pt-4 text-[10px] font-semibold tracking-[0.2em] text-gray-400">SYSTEM</div>
          {systemLinks.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => handleSystem(path)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function MenuToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white"
      aria-label="Open menu"
    >
      <div className="flex flex-col items-end gap-[3px]">
        <div className="h-[2px] w-4 rounded bg-gray-700" />
        <div className="h-[2px] w-4 rounded bg-gray-700" />
        <div className="h-[2px] w-2.5 rounded bg-gray-700" />
      </div>
    </button>
  );
}

function SocialConnect({
  onBack,
  onOpenMenu,
  profile,
  onUpdateSocial,
}: {
  onBack: () => void;
  onOpenMenu: () => void;
  profile: CreatorProfileState;
  onUpdateSocial: (platform: PlatformId, field: keyof CreatorSocial, value: string) => void;
}) {
  return (
    <div className="flex h-full flex-col bg-gray-50">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
              <Link2 className="h-4 w-4" />
            </span>
            <div>
              <div className="leading-tight font-bold text-gray-900">Social Accounts</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Only brand-facing links</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {(Object.keys(PLATFORM_META) as PlatformId[]).map((platform) => {
          const meta = PLATFORM_META[platform];
          const social = profile.socials[platform];
          const connected = !!social.url.trim();

          return (
            <section key={platform} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black text-white"
                    style={{ background: meta.gradient }}
                  >
                    {meta.short}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{meta.name}</div>
                    <div className="text-xs text-gray-400">{meta.helper}</div>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {connected ? 'Visible to brands' : 'Hidden'}
                </span>
              </div>
              <div className="space-y-2.5">
                <label className="block">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Clickable link</div>
                  <input
                    value={social.url}
                    onChange={(event) => onUpdateSocial(platform, 'url', event.target.value)}
                    placeholder={meta.placeholder}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Label shown</div>
                    <input
                      value={social.label}
                      onChange={(event) => onUpdateSocial(platform, 'label', event.target.value)}
                      placeholder={platform === 'spotify' ? 'Playlist name' : '@handle or page name'}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Followers / saves</div>
                    <input
                      value={social.followers}
                      onChange={(event) => onUpdateSocial(platform, 'followers', event.target.value)}
                      placeholder="12K"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
                    />
                  </label>
                </div>
                {connected ? (
                  <a
                    href={safeUrl(social.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 hover:underline"
                  >
                    Open live link <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">Add a link to make this platform clickable in the brand preview.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <div className="flex-shrink-0 border-t border-gray-100 bg-white p-4">
        <button onClick={onBack} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600">
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function DashboardView({
  onView,
  onOpenMenu,
  profile,
  onCoverUpload,
}: {
  onView: (v: View) => void;
  onOpenMenu: () => void;
  profile: CreatorProfileState;
  onCoverUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const connected = getConnectedPlatforms(profile);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <TopBar right={<MenuToggle onClick={onOpenMenu} />} />
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          <div className="relative h-40 w-full overflow-hidden">
            <img src={profile.cover} alt="Profile cover" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-gray-50" />
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                onClick={() => coverInputRef.current?.click()}
                className="rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-black/60"
              >
                Change image
              </button>
              <button
                onClick={() => onView('account')}
                className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-gray-700 backdrop-blur transition hover:bg-white"
              >
                Edit profile
              </button>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
          </div>
          <div className="relative z-10 -mt-12 flex flex-col px-4">
            <img src={profile.avatar} alt={profile.name} className="h-24 w-24 rounded-full border-4 border-gray-50 bg-gray-100 object-cover shadow-lg" />
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-lg font-bold leading-tight text-gray-900">{profile.name}</span>
              <img src="/verified-badge.png" alt="Verified" className="h-4 w-4 object-contain flex-shrink-0" />
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              {profile.handle} <span className="text-gray-300">·</span>
              <MapPin className="h-3 w-3" /> {profile.location}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile.niches.map((niche) => (
                <span
                  key={niche}
                  className="inline-flex items-center rounded-full border border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100 px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm"
                >
                  {niche}
                </span>
              ))}
              <button
                onClick={() => onView('bio')}
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:border-gray-300"
              >
                Brand preview <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">CONNECTED PLATFORMS</div>
            <div className="grid grid-cols-2 gap-2">
              {connected.map((platform) => {
                const meta = PLATFORM_META[platform];
                const social = profile.socials[platform];
                return (
                  <a
                    key={platform}
                    href={safeUrl(social.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="relative overflow-hidden rounded-2xl p-4 text-white shadow-lg"
                    style={{ background: meta.gradient }}
                  >
                    <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10" />
                    <div className="relative space-y-2">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/80">{meta.name}</div>
                      <div>
                        <div className="text-xs font-medium text-white/80">{social.label || meta.name}</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black leading-none">{social.followers || 'Live'}</span>
                          <span className="text-[10px] uppercase tracking-wide text-white/75">Audience</span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
                        <ExternalLink className="h-3 w-3" /> Clickable
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
            <button
              onClick={() => onView('socials')}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-[11px] font-semibold text-gray-500 transition-all hover:border-gray-400"
            >
              <Plus className="h-4 w-4" /> Edit social links
            </button>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">SHOWCASE SLIDES</div>
            <div className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm">
              <Carousel opts={{ loop: profile.showcaseImages.length > 1 }}>
                <CarouselContent className="-ml-3">
                  {profile.showcaseImages.map((image, index) => (
                    <CarouselItem key={`${image}-${index}`} className="pl-3">
                      <div className="relative h-44 overflow-hidden rounded-2xl">
                        <img src={image} alt={`Showcase slide ${index + 1}`} className="h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                          <div className="text-sm font-semibold">Photo showcase for brands</div>
                          <div className="text-xs text-white/75">Slide {index + 1} of {profile.showcaseImages.length}</div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {profile.showcaseImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-3 top-auto bottom-3 h-9 w-9 translate-y-0 border-white/20 bg-black/45 text-white hover:bg-black/60" />
                    <CarouselNext className="right-3 top-auto bottom-3 h-9 w-9 translate-y-0 border-white/20 bg-black/45 text-white hover:bg-black/60" />
                  </>
                )}
              </Carousel>
              <button
                onClick={() => onView('account')}
                className="mt-3 w-full rounded-2xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
              >
                Add or manage slideshow images
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">LIVE METRICS</div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => onView('stats')} className="rounded-2xl bg-white p-3 text-center shadow-sm transition-all hover:shadow-md">
                <div className="text-lg font-bold text-gray-900">{profile.reach}</div>
                <div className="text-[9px] uppercase tracking-wide text-gray-400">Reach</div>
              </button>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <div className="text-lg font-bold text-gray-900">{profile.engagementRate || '—'}</div>
                <div className="text-[9px] uppercase tracking-wide text-gray-400">Eng. Rate</div>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                <div className="text-base font-bold text-gray-900">—</div>
                <div className="text-[9px] uppercase tracking-wide text-gray-400">Top City</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">My shortcuts</div>
              <span className="flex items-center gap-1 text-xs font-medium text-indigo-500">
                <Lock className="h-3.5 w-3.5" /> Private
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Heart — free save list, open to all */}
              <button
                onClick={() => onView('liked')}
                className="group flex h-full items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-pink-100 text-rose-500 shadow-inner">
                  <Heart className="h-5 w-5 fill-rose-400 text-rose-500" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Saved brands</div>
                  <div className="text-[11px] font-medium text-gray-400">{LIKED_BRANDS.length} saved</div>
                </div>
              </button>
              {/* Star — paid feature, gets the deal via bidding */}
              <button
                onClick={() => onView('favorites')}
                className="group flex h-full items-center gap-2 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-500 shadow-inner">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                </span>
                <div>
                  <div className="flex items-center gap-1">
                    <div className="text-sm font-semibold text-gray-900">Bid & get deal</div>
                    <span className="text-[9px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">Pro</span>
                  </div>
                  <div className="text-[11px] font-medium text-gray-400">Star to bid on a brand</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoritesView({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gray-50">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </span>
            <div>
              <div className="leading-tight font-bold text-gray-900">Starred brands</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Private</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {STARRED_BRANDS.map((brand) => (
          <BrandListCard key={brand.id} brand={brand} intent="favorites" />
        ))}
        {STARRED_BRANDS.length === 0 && (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-6 text-center text-sm text-amber-700">
            Star campaigns from discovery to see them here.
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 bg-white p-4">
        <button onClick={onBack} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600">
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function LikedView({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gray-50">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            </span>
            <div>
              <div className="leading-tight font-bold text-gray-900">Liked pitch queue</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Private</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {LIKED_BRANDS.map((brand) => (
          <BrandListCard key={brand.id} brand={brand} intent="liked" />
        ))}
        {LIKED_BRANDS.length === 0 && (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/60 p-6 text-center text-sm text-rose-700">
            Tap the heart on discovery cards to build your pitch queue.
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 bg-white p-4">
        <button onClick={onBack} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600">
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function PrivacyCenter({ onBack, onOpenMenu }: { onBack: () => void; onOpenMenu: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gray-50">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <div className="leading-tight font-bold text-gray-900">Privacy & data</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Private controls</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">What brands can see</h3>
          <p className="mt-2 text-sm text-gray-500">
            Brands only see your public preview, uploaded cover image, showcase slideshow, and the social links you added.
          </p>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Security alerts</h3>
          <p className="mt-2 text-sm text-gray-500">
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
      <div className="border-t border-gray-100 bg-white p-4">
        <button onClick={onBack} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600">
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function AccountControls({
  onBack,
  onOpenMenu,
  profile,
  setProfile,
  onCoverUpload,
  onShowcaseUpload,
}: {
  onBack: () => void;
  onOpenMenu: () => void;
  profile: CreatorProfileState;
  setProfile: Dispatch<SetStateAction<CreatorProfileState>>;
  onCoverUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onShowcaseUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [coverUrlDraft, setCoverUrlDraft] = useState('');
  const [galleryUrlDraft, setGalleryUrlDraft] = useState('');

  const applyCoverUrl = () => {
    const url = safeUrl(coverUrlDraft);
    if (!url) return;
    setProfile((current) => ({ ...current, cover: url }));
    setCoverUrlDraft('');
  };

  const addGalleryUrl = () => {
    const url = safeUrl(galleryUrlDraft);
    if (!url) return;
    setProfile((current) => ({ ...current, showcaseImages: [...current.showcaseImages, url] }));
    setGalleryUrlDraft('');
  };

  const removeShowcaseImage = (index: number) => {
    setProfile((current) => ({
      ...current,
      showcaseImages: current.showcaseImages.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <TopBar
        title={
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div>
              <div className="leading-tight font-bold text-gray-900">Profile controls</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Edit what brands see</div>
            </div>
          </div>
        }
        right={<MenuToggle onClick={onOpenMenu} />}
      />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Background image</h3>
              <p className="mt-1 text-sm text-gray-500">Change the profile background so brands see your latest look.</p>
            </div>
            <button
              onClick={() => coverInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Upload className="h-3.5 w-3.5" /> Upload
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <img src={profile.cover} alt="Current cover" className="h-32 w-full object-cover" />
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
          <div className="mt-3 flex gap-2">
            <input
              value={coverUrlDraft}
              onChange={(event) => setCoverUrlDraft(event.target.value)}
              placeholder="Paste cover image URL"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
            />
            <button onClick={applyCoverUrl} className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white">
              Apply
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Brand collabs showcase</h3>
              <p className="mt-1 text-sm text-gray-500">Select which past brand collabs to display publicly on your profile.</p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{profile.showcasedCollabIds.length} shown</span>
          </div>
          <div className="space-y-2">
            {COLLABS.map((collab) => {
              const shown = profile.showcasedCollabIds.includes(collab.id);
              return (
                <div key={collab.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2">
                  <img src={collab.img} alt={collab.brand} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{collab.brand}</div>
                    <div className="text-xs text-gray-400">{collab.campaign} · {collab.reach} reach</div>
                  </div>
                  <button
                    onClick={() =>
                      setProfile((cur) => ({
                        ...cur,
                        showcasedCollabIds: shown
                          ? cur.showcasedCollabIds.filter((id) => id !== collab.id)
                          : [...cur.showcasedCollabIds, collab.id],
                      }))
                    }
                    className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                      shown
                        ? 'bg-cyan-500 border-cyan-500 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-cyan-300'
                    }`}
                  >
                    {shown ? 'Showcased' : 'Showcase'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Brand profile copy</h3>
          <p className="mt-1 text-sm text-gray-500">Whatever you update here is the same content brands see in the preview.</p>
          <div className="mt-3 space-y-3">
            <label className="block">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Location</div>
              <input
                value={profile.location}
                onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Tagline</div>
              <input
                value={profile.tagline}
                onChange={(event) => setProfile((current) => ({ ...current, tagline: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Niche labels</div>
              <input
                value={profile.niches.join(', ')}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    niches: event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="Food, Lifestyle, Local"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Bio</div>
              <textarea
                value={profile.bio}
                onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
                rows={5}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Photo slideshow</h3>
              <p className="mt-1 text-sm text-gray-500">Add showcase images that appear as a sliding gallery for brands.</p>
            </div>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <ImagePlus className="h-3.5 w-3.5" /> Add photos
            </button>
          </div>
          <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onShowcaseUpload} />
          <div className="mb-3 flex gap-2">
            <input
              value={galleryUrlDraft}
              onChange={(event) => setGalleryUrlDraft(event.target.value)}
              placeholder="Paste image URL for slideshow"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-cyan-400"
            />
            <button onClick={addGalleryUrl} className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white">
              Add
            </button>
          </div>
          <div className="space-y-2">
            {profile.showcaseImages.map((image, index) => (
              <div key={`${image}-${index}`} className="flex items-center gap-3 rounded-2xl border border-gray-200 p-2">
                <img src={image} alt={`Showcase ${index + 1}`} className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900">Slide {index + 1}</div>
                  <div className="truncate text-xs text-gray-400">{image}</div>
                </div>
                <button onClick={() => removeShowcaseImage(index)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-rose-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="border-t border-gray-100 bg-white p-4">
        <button onClick={onBack} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600">
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function CollabsShowcase({
  profile,
  onToggle,
}: {
  profile: CreatorProfileState;
  onToggle?: (id: number) => void;
}) {
  const showcased = COLLABS.filter((c) => profile.showcasedCollabIds.includes(c.id));
  if (showcased.length === 0) return null;
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">BRAND COLLABS</div>
      <div className="space-y-2">
        {showcased.map((collab) => (
          <div key={collab.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100">
            <img src={collab.img} alt={collab.brand} className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Award className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <div className="text-sm font-bold text-gray-900 truncate">{collab.brand}</div>
              </div>
              <div className="text-xs text-gray-500 truncate">{collab.campaign}</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                <span>{collab.reach} reach</span>
                <span>·</span>
                <span>{collab.eng} eng.</span>
                <span>·</span>
                <span>{collab.date}</span>
              </div>
            </div>
            {onToggle && (
              <button
                onClick={() => onToggle(collab.id)}
                className="flex-shrink-0 text-[10px] font-semibold text-rose-500 border border-rose-200 rounded-lg px-2 py-1 hover:bg-rose-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BioView({ onBack, profile }: { onBack: () => void; profile: CreatorProfileState }) {
  const connected = getConnectedPlatforms(profile);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50">
      <div className="relative bg-gray-200" style={{ height: 220 }}>
        <img src={profile.cover} alt="Creator cover" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/75" />
        <button onClick={onBack} className="absolute right-3 top-3 rounded-full bg-black/40 p-1.5 backdrop-blur">
          <X className="h-4 w-4 text-white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 px-4 pb-4">
          <img src={profile.avatar} alt={profile.name} className="h-16 w-16 rounded-full border-2 border-white object-cover" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold leading-none text-white">{profile.name}</span>
              <img src="/verified-badge.png" alt="Verified" className="h-4 w-4 object-contain flex-shrink-0" />
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-200">
              {profile.handle} · <MapPin className="h-2.5 w-2.5" /> {profile.location}
            </div>
            <div className="mt-1 text-xs text-gray-200">{profile.tagline}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {profile.niches.map((tag) => (
            <span key={tag} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
              {tag}
            </span>
          ))}
        </div>

        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">REACH ACROSS PLATFORMS</div>
          <div className="grid grid-cols-2 gap-2">
            {connected.map((platform) => {
              const meta = PLATFORM_META[platform];
              const social = profile.socials[platform];
              return (
                <a
                  key={platform}
                  href={safeUrl(social.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl px-4 py-3 text-white shadow-sm"
                  style={{ background: meta.gradient }}
                >
                  <div className="text-[10px] uppercase tracking-wide text-white/75">{meta.name}</div>
                  <div className="mt-1 text-xl font-black leading-none">{social.followers || 'Live'}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white/90">
                    {social.label || meta.name} <ExternalLink className="h-3 w-3" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">CLICKABLE SOCIALS</div>
          <div className="space-y-2">
            {connected.map((platform) => {
              const meta = PLATFORM_META[platform];
              const social = profile.socials[platform];
              return (
                <a
                  key={platform}
                  href={safeUrl(social.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black text-white"
                      style={{ background: meta.gradient }}
                    >
                      {meta.short}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{meta.name}</div>
                      <div className="text-xs text-gray-400">{social.label}</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">ABOUT</div>
          <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">PHOTO SHOWCASE</div>
          <div className="rounded-[28px] border border-gray-200 bg-white p-3 shadow-sm">
            <Carousel opts={{ loop: profile.showcaseImages.length > 1 }}>
              <CarouselContent className="-ml-3">
                {profile.showcaseImages.map((image, index) => (
                  <CarouselItem key={`${image}-${index}`} className="pl-3">
                    <div className="relative h-56 overflow-hidden rounded-3xl">
                      <img src={image} alt={`Showcase slide ${index + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
                        <div className="text-sm font-semibold">Brand showcase gallery</div>
                        <div className="text-xs text-white/75">Slide {index + 1} of {profile.showcaseImages.length}</div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {profile.showcaseImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-3 top-auto bottom-3 h-9 w-9 translate-y-0 border-white/20 bg-black/45 text-white hover:bg-black/60" />
                  <CarouselNext className="right-3 top-auto bottom-3 h-9 w-9 translate-y-0 border-white/20 bg-black/45 text-white hover:bg-black/60" />
                </>
              )}
            </Carousel>
          </div>
        </div>

        <CollabsShowcase profile={profile} />
      </div>
    </div>
  );
}

function StatsView({ onBack, profile }: { onBack: () => void; profile: CreatorProfileState }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-950 text-white">
      <div className="flex flex-shrink-0 items-center gap-3 px-4 pb-3 pt-4">
        <img src={profile.avatar} alt={profile.name} className="h-10 w-10 rounded-full object-cover" />
        <div className="flex-1">
          <div className="font-bold text-white">{profile.name}</div>
          <div className="text-xs text-gray-400">{profile.handle}</div>
        </div>
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="px-4 py-6 text-center">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">TOTAL REACH</div>
        <div className="text-6xl font-black text-cyan-400">{profile.reach}</div>
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-green-400">
          <TrendingUp className="h-3 w-3" /> +12% this month
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 px-4">
        <div className="rounded-xl bg-gray-900 p-4">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">ENGAGEMENT</div>
          <div className="text-2xl font-bold text-cyan-400">{profile.engagementRate}</div>
        </div>
        <div className="rounded-xl bg-gray-900 p-4">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">PITCH CRED.</div>
          <div className="text-2xl font-bold text-white">12</div>
        </div>
      </div>

      <div className="mb-4 px-4">
        <div className="rounded-xl bg-gray-900 p-4">
          <div className="mb-3 text-[10px] uppercase tracking-wide text-gray-400">TOP AUDIENCE CITIES</div>
          {[
            { city: 'Bangalore', pct: 72, color: '#22D3EE' },
            { city: 'Mumbai', pct: 14, color: '#6B7280' },
            { city: 'Delhi', pct: 9, color: '#4B5563' },
          ].map(({ city, pct, color }) => (
            <div key={city} className="mb-2.5 flex items-center gap-3">
              <span className="w-16 text-xs text-gray-300">{city}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="w-8 text-right text-xs text-gray-400">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="mb-2 text-[10px] uppercase tracking-wide text-gray-400">RECENT CONTENT</div>
        <div className="grid grid-cols-4 gap-2">
          {profile.showcaseImages.slice(0, 4).map((image, index) => (
            <div key={`${image}-${index}`} className="aspect-square overflow-hidden rounded-xl">
              <img src={image} alt={`Recent showcase ${index + 1}`} className="h-full w-full object-cover" />
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
  const [profile, setProfile] = useState<CreatorProfileState>(INITIAL_PROFILE);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CreatorProfileState>;
      setProfile((current) => ({
        ...current,
        ...parsed,
        socials: { ...current.socials, ...(parsed.socials ?? {}) },
        showcaseImages: parsed.showcaseImages?.length ? parsed.showcaseImages : current.showcaseImages,
        niches: parsed.niches?.length ? parsed.niches : current.niches,
        showcasedCollabIds: parsed.showcasedCollabIds ?? current.showcasedCollabIds,
      }));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [view]);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const updateSocial = (platform: PlatformId, field: keyof CreatorSocial, value: string) => {
    setProfile((current) => ({
      ...current,
      socials: {
        ...current.socials,
        [platform]: {
          ...current.socials[platform],
          [field]: value,
        },
      },
    }));
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextCover = await readFileAsDataUrl(file);
    setProfile((current) => ({ ...current, cover: nextCover }));
    event.target.value = '';
  };

  const handleShowcaseUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const images = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
    setProfile((current) => ({ ...current, showcaseImages: [...current.showcaseImages, ...images] }));
    event.target.value = '';
  };

  let content: JSX.Element;
  switch (view) {
    case 'bio':
      content = <BioView onBack={() => setView('dashboard')} profile={profile} />;
      break;
    case 'stats':
      content = <StatsView onBack={() => setView('dashboard')} profile={profile} />;
      break;
    case 'socials':
      content = <SocialConnect onBack={() => setView('dashboard')} onOpenMenu={openMenu} profile={profile} onUpdateSocial={updateSocial} />;
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
      content = (
        <AccountControls
          onBack={() => setView('dashboard')}
          onOpenMenu={openMenu}
          profile={profile}
          setProfile={setProfile}
          onCoverUpload={handleCoverUpload}
          onShowcaseUpload={handleShowcaseUpload}
        />
      );
      break;
    case 'dashboard':
    default:
      content = <DashboardView onView={setView} onOpenMenu={openMenu} profile={profile} onCoverUpload={handleCoverUpload} />;
  }

  return (
    <div className="relative h-full">
      {content}
      {menuOpen && (
        <HamburgerMenu
          activeView={view}
          onClose={closeMenu}
          onNavigate={setView}
          profile={profile}
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
