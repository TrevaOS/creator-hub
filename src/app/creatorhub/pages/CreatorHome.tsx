import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { X, Star, Heart, MapPin, Film, BookImage, ChevronDown, ChevronLeft, ChevronRight, Map, TrendingUp, Menu } from 'lucide-react';
import { TopBar } from '../CreatorHubApp';
import MapView from '../components/MapView';
import {
  BRAND_CAMPAIGNS,
  BrandCampaign,
  MARKETING_PIPELINE_META,
  MarketingPipelineStage,
} from '../../data/creatorHubData';

type Brand = BrandCampaign & { [key: string]: unknown };

const BRANDS = BRAND_CAMPAIGNS as Brand[];

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

const toneToClasses = (tone: string) => {
  switch (tone) {
    case 'emerald':
      return { container: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' };
    case 'sky':
      return { container: 'bg-sky-50 text-sky-700 border border-sky-200', dot: 'bg-sky-500' };
    case 'amber':
      return { container: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' };
    case 'purple':
      return { container: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' };
    case 'cyan':
      return { container: 'bg-cyan-50 text-cyan-700 border border-cyan-200', dot: 'bg-cyan-500' };
    case 'gray':
    default:
      return { container: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' };
  }
};

const PIPELINE_BADGES = Object.fromEntries(
  Object.entries(MARKETING_PIPELINE_META).map(([key, meta]) => [key, { ...toneToClasses(meta.tone), label: meta.label }])
) as Record<MarketingPipelineStage, { container: string; dot: string; label: string }>;

function BudgetRail({ label, amount, offer, className }: { label: string; amount: number; offer: string; className?: string }) {
  return (
    <div className={`px-4 py-3 ${className ?? ''}`}>
      <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300">{label}</div>
          <div className="text-xl font-bold">{INR.format(amount)}</div>
        </div>
        <div className="text-sm font-semibold text-gray-200 text-right max-w-[50%] leading-snug">
          {offer}
        </div>
      </div>
    </div>
  );
}

type ViewMode = 'cards' | 'map';

export default function CreatorHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMapBrand, setSelectedMapBrand] = useState<Brand | undefined>(BRANDS[0]);
  const [imageIndex, setImageIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const dragStartX = useRef(0);

  const brand = BRANDS[currentIndex];

  useEffect(() => {
    setImageIndex(0);
  }, [currentIndex]);

  useEffect(() => {
    if (viewMode === 'map') {
      setSelectedMapBrand(BRANDS[currentIndex]);
    }
  }, [currentIndex, viewMode]);

  useEffect(() => {
    const state = location.state as { focusBrandId?: number; openDetail?: boolean } | undefined;
    if (!state) return;

    if (typeof state.focusBrandId === 'number') {
      const index = BRANDS.findIndex((b) => b.id === state.focusBrandId);
      if (index !== -1) {
        setCurrentIndex(index);
        setViewMode('cards');
        setShowDetail(Boolean(state.openDetail));
      }
    } else if (state.openDetail) {
      setShowDetail(true);
    }

    if (state.openDetail === false) {
      setShowDetail(false);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleSelectBrand = (index: number) => {
    if (index < 0 || index >= BRANDS.length) return;
    setCurrentIndex(index);
    setShowDetail(false);
    setImageIndex(0);
  };

  const handlePass = () => {
    setShowDetail(false);
    setViewMode('cards');
    setImageIndex(0);
    setCurrentIndex((i) => (i + 1) % BRANDS.length);
  };

  const handleImagePrev = () => {
    if (!brand) return;
    setImageIndex((idx) => (idx - 1 + brand.gallery.length) % brand.gallery.length);
  };

  const handleImageNext = () => {
    if (!brand) return;
    setImageIndex((idx) => (idx + 1) % brand.gallery.length);
  };

  const goToFavorites = () => {
    navigate('/creatorhub/profile', { state: { profileView: 'favorites' } });
  };

  const goToLiked = () => {
    navigate('/creatorhub/profile', { state: { profileView: 'liked' } });
  };

  const handleSelectBrandOnMap = (next: { id: number }) => {
    const fullBrand = BRANDS.find((b) => b.id === next.id);
    if (!fullBrand) return;
    setSelectedMapBrand(fullBrand);
    const index = BRANDS.findIndex((b) => b.id === next.id);
    if (index !== -1) {
      setCurrentIndex(index);
      setImageIndex(0);
    }
  };

  const handleDragEnd = (e: React.PointerEvent, startX: number) => {
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 60) handlePass();
  };

  // EMPTY STATE
  if (BRANDS.length === 0) {
    return (
      <div className="flex flex-col bg-gray-50 h-full">
        <TopBar
          right={
            <button
              onClick={() => navigate('/creatorhub/profile', { state: { openMenu: true } })}
              className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-gray-700" />
            </button>
          }
        />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-300" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-lg">No campaigns yet</div>
            <div className="text-sm text-gray-400 mt-1">Brand campaigns will appear here once they go live on the platform.</div>
          </div>
        </div>
      </div>
    );
  }

  // MAP VIEW
  if (viewMode === 'map' && selectedMapBrand) {
    return (
      <div className="flex flex-col bg-white" style={{ height: '100%' }}>
        <TopBar
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
              >
                <Map className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => navigate('/creatorhub/profile', { state: { openMenu: true } })}
                className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          }
        />
        {/* radius badge */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-white rounded-full px-4 py-1.5 flex items-center gap-2 shadow-md text-xs font-semibold text-gray-700 border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-gray-900" />
            5km Â· 12 brands nearby
          </div>
        </div>

        {/* Map fills remaining space minus bottom sheet */}
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
          <MapView
            brands={BRANDS}
            selectedBrand={selectedMapBrand}
            onSelectBrand={handleSelectBrandOnMap}
            center={[selectedMapBrand.lng, selectedMapBrand.lat]}
            zoom={12}
            height="100%"
          />
        </div>

        {/* Bottom sheet â€” fixed height, never scroll off */}
        {(() => {
          const marketing = selectedMapBrand.marketing;
          return (
            <div className="flex-shrink-0 bg-white rounded-t-2xl shadow-lg px-4 pt-3 pb-4 border-t border-gray-100 space-y-3">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <div className="flex items-start gap-3">
                <img
                  src={selectedMapBrand.thumb}
                  alt={selectedMapBrand.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div>
                    <div className="font-bold text-gray-900 text-sm leading-tight">{selectedMapBrand.name}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{selectedMapBrand.tagline}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedMapBrand.location}
                    </span>
                    <span className="inline-flex items-center gap-1">â˜… {selectedMapBrand.rating.toFixed(1)}</span>
                    <span className="inline-flex items-center gap-1 text-cyan-600 font-semibold">
                      <TrendingUp className="w-3 h-3" /> {selectedMapBrand.audienceFit}% match
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Target launch Â· {formatDate(marketing.targetLaunch)}</span>
                <span className="font-semibold text-gray-700">{marketing.inboundLeads} inbound</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePass}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={goToFavorites}
                  className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center"
                  aria-label="Open starred pitches"
                >
                  <Star className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                </button>
                <button
                  onClick={goToLiked}
                  className="flex-1 h-10 bg-rose-500 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-4 h-4 fill-white" /> Liked queue
                </button>
              </div>
            </div>
          );
        })()}

        <BudgetRail
          label="Budget"
          amount={selectedMapBrand.marketing.budget}
          offer={selectedMapBrand.offer}
          className="bg-white border-t border-gray-100"
        />
      </div>
    );
  }
  // CARDS VIEW
  return (
    <div className="flex flex-col bg-gray-50 h-full">
      <TopBar
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('map')}
              className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
              aria-label="Toggle map view"
            >
              <Map className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => navigate('/creatorhub/profile', { state: { openMenu: true } })}
              className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        }
      />

      <div className="flex-1 px-4 pt-3 pb-4 flex flex-col min-h-0">
        {!showDetail ? (
          <>
            {/* Swipe card */}
            <SwipeCard
              brand={brand}
              imageIndex={imageIndex}
              onPass={handlePass}
              onDetail={() => setShowDetail(true)}
              onDragEnd={handleDragEnd}
              onImagePrev={handleImagePrev}
              onImageNext={handleImageNext}
            />

            {/* Action buttons */}
            <div className="flex flex-shrink-0 items-center justify-center gap-4 mt-3">
              <button
                onClick={handlePass}
                className="w-12 h-12 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center shadow-sm hover:border-gray-400 transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={goToFavorites}
                className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center shadow-lg"
                aria-label="View starred pitches"
              >
                <Star className="w-5 h-5 text-cyan-400 fill-cyan-400" />
              </button>
              <button
                onClick={goToLiked}
                className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center shadow-lg"
                aria-label="View liked queue"
              >
                <Heart className="w-5 h-5 text-white fill-white" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex flex-shrink-0 justify-center gap-1.5 mt-3">
              {BRANDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectBrand(i)}
                  className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/40 ${
                    i === currentIndex ? 'bg-gray-900 w-5' : 'bg-gray-300 w-2'
                  }`}
                  aria-label={`Go to ${BRANDS[i].name}`}
                />
              ))}
            </div>
          </>
        ) : (
          /* Detail card */
          <div className="flex-1 overflow-y-auto">
            <DetailCard
              brand={brand}
              imageIndex={imageIndex}
              onPass={handlePass}
              onClose={() => setShowDetail(false)}
              onImagePrev={handleImagePrev}
              onImageNext={handleImageNext}
              onOpenLiked={goToLiked}
            />
          </div>
        )}
      </div>
      {brand && (
        <BudgetRail
          label="Budget"
          amount={brand.marketing.budget}
          offer={brand.offer}
          className="bg-gray-50 border-t border-gray-100"
        />
      )}
    </div>
  );
}

function SwipeCard({
  brand,
  imageIndex,
  onPass,
  onDetail,
  onDragEnd,
  onImagePrev,
  onImageNext,
}: {
  brand: Brand;
  imageIndex: number;
  onPass: () => void;
  onDetail: () => void;
  onDragEnd: (e: React.PointerEvent, startX: number) => void;
  onImagePrev: () => void;
  onImageNext: () => void;
}) {
  const startX = useRef(0);
  const gallery = brand.gallery;
  const currentImage = gallery[imageIndex] ?? gallery[0];
  // TODO: Persist like/star state with temporary undo affordance

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-md cursor-grab active:cursor-grabbing select-none flex-1 min-h-0"
      onPointerDown={(e) => { startX.current = e.clientX; }}
      onPointerUp={(e) => onDragEnd(e, startX.current)}
      onClick={onDetail}
    >
      <img
        src={currentImage}
        alt={brand.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* Dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />

      {gallery.length > 1 && (
        <>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 backdrop-blur flex items-center justify-center text-white hover:bg-black/50 transition"
            onClick={(e) => { e.stopPropagation(); onImagePrev(); }}
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 backdrop-blur flex items-center justify-center text-white hover:bg-black/50 transition"
            onClick={(e) => { e.stopPropagation(); onImageNext(); }}
            aria-label="Next photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute top-3 left-3 bg-black/35 backdrop-blur text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {imageIndex + 1} / {gallery.length}
          </div>
        </>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="font-bold text-white text-xl mb-0.5">{brand.name}</div>
        <div className="text-sm text-cyan-100/90 leading-tight mb-1">{brand.tagline}</div>
        <div className="flex items-center gap-2 text-cyan-200 text-xs mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{brand.location}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            â˜…<span>{brand.rating.toFixed(1)}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{brand.audienceFit}% match</span>
          </span>
        </div>
      </div>

      {/* Tap hint */}
      <div className="absolute bottom-3 right-3">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <ChevronDown className="w-4 h-4 text-white rotate-180" />
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  brand,
  imageIndex,
  onPass,
  onClose,
  onImagePrev,
  onImageNext,
  onOpenLiked,
}: {
  brand: Brand;
  imageIndex: number;
  onPass: () => void;
  onClose: () => void;
  onImagePrev: () => void;
  onImageNext: () => void;
  onOpenLiked: () => void;
}) {
  const gallery = brand.gallery;
  const currentImage = gallery[imageIndex] ?? gallery[0];
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md">
      {/* Hero image â€” compact */}
      <div className="relative h-44">
        <img src={currentImage} alt={brand.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        <div className="absolute top-3 right-3 bg-white/95 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow">
          {brand.offer}
        </div>
        {gallery.length > 1 && (
          <div className="absolute inset-x-0 top-1/2 flex justify-between px-3 -translate-y-1/2">
            <button
              onClick={(e) => { e.stopPropagation(); onImagePrev(); }}
              className="w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onImageNext(); }}
              className="w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        {gallery.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/35 backdrop-blur text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {imageIndex + 1} / {gallery.length}
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 bg-black/40 backdrop-blur rounded-full p-1.5"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <div className="font-bold text-gray-900 text-lg">{brand.name}</div>
          <div className="text-sm text-gray-500 mt-0.5">{brand.tagline}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-cyan-600">
              <MapPin className="w-3 h-3" /> {brand.location}
            </span>
            <span className="inline-flex items-center gap-1">â˜… {brand.rating.toFixed(1)}</span>
            <span className="inline-flex items-center gap-1 text-cyan-600 font-semibold">{brand.audienceFit}% match</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${PIPELINE_BADGES[brand.marketing.pipelineStage].container}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${PIPELINE_BADGES[brand.marketing.pipelineStage].dot}`} />
            {PIPELINE_BADGES[brand.marketing.pipelineStage].label}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <TrendingUp className="w-3 h-3" /> {brand.audienceFit}% match
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          Spend {INR.format(brand.marketing.spendToDate)}
        </span>

        {/* Audience fit */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">AUDIENCE FIT</div>
            <div className="text-gray-900 font-bold text-xl">{brand.audienceFit}% match</div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500 flex items-center justify-center">
            <span className="text-cyan-600 font-bold text-sm">{brand.fitGrade}</span>
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <div className="text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1.5">DELIVERABLES</div>
          <div className="flex items-center gap-2 flex-wrap">
            {brand.deliverables.map((d) => (
              <span key={d} className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 font-semibold">
                {d.includes('Reel') ? <Film className="w-3 h-3" /> : <BookImage className="w-3 h-3" />}
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">BRAND TAGS</div>
          <div className="flex items-center gap-2 flex-wrap">
            {brand.marketing.tags.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2.5 py-1.5 rounded-full font-semibold">
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        </div>

        {/* Brief */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">BRIEF</div>
          <p className="text-xs text-gray-500 leading-relaxed">{brand.brief}</p>
        </div>

        {/* Owner */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Account Owner</div>
          <div className="text-sm font-semibold text-gray-900">{brand.marketing.owner.name}</div>
          <div className="text-xs text-gray-500">{brand.marketing.owner.role}</div>
          <div className="text-xs text-gray-500 mt-1">{brand.marketing.owner.email} Â· {brand.marketing.owner.phone}</div>
        </div>

        {(brand.marketing.notes || brand.marketing.inboundLeads) && (
          <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-xl p-3 text-xs leading-relaxed space-y-1">
            <div className="font-semibold">Notes & Signals</div>
            <div>Inbound leads: {brand.marketing.inboundLeads}</div>
            {brand.marketing.notes && <div>{brand.marketing.notes}</div>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPass}
            className="flex-1 h-11 border border-gray-200 rounded-xl text-gray-600 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50"
          >
            <X className="w-4 h-4" /> Pass
          </button>
          <button
            onClick={onOpenLiked}
            className="flex-[2] h-11 bg-rose-500 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            <Heart className="w-4 h-4 fill-white" /> Liked queue
          </button>
        </div>
      </div>
    </div>
  );
}
