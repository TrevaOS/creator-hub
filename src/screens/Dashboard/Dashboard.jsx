import { useState, useEffect, useRef } from 'react';
import {
  Share2, Download, MapPin, Play, Music, ExternalLink,
  ChevronLeft, ChevronRight,
  Check, Zap, Settings2, Palette, Moon, Sun, X,
  Maximize2, Minimize2, GripVertical,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import { supabase } from '../../services/supabase';
import Avatar from '../../components/Avatar';
import SocialIcon from '../../components/SocialIcon';
import Skeleton from '../../components/Skeleton';
import BottomSheet from '../../components/BottomSheet';
import Toggle from '../../components/Toggle';
import { generateMediaKit } from '../../services/pdfExport';
import styles from './Dashboard.module.css';

/* ── DEMO FALLBACKS ─────────────────────────────────────────── */
const EMPTY_POSTS = [];
const EMPTY_YT_VIDEOS = [];

const GRADIENTS = [
  'linear-gradient(135deg,#1a0533,#0d0d2b)',
  'linear-gradient(135deg,#0a1628,#0f3460)',
  'linear-gradient(135deg,#16213e,#1a472a)',
  'linear-gradient(135deg,#0f0c29,#302b63)',
  'linear-gradient(135deg,#0d0d2b,#4a0e8f)',
  'linear-gradient(135deg,#0a1628,#1a0533)',
  'linear-gradient(135deg,#16213e,#0f3460)',
  'linear-gradient(135deg,#1a0533,#16213e)',
  'linear-gradient(135deg,#0f0c29,#0a1628)',
];

/* ── THEME PRESETS ──────────────────────────────────────────── */
const THEMES = [
  { id: 'default',  label: 'Default',  color: '#7C3AED' },
  { id: 'slate',    label: 'Slate',    color: '#475569' },
  { id: 'stone',    label: 'Stone',    color: '#78716c' },
  { id: 'ocean',    label: 'Ocean',    color: '#0ea5e9' },
  { id: 'forest',   label: 'Forest',   color: '#16a34a' },
  { id: 'lavender', label: 'Lavender', color: '#a855f7' },
  { id: 'midnight', label: 'Midnight', color: '#1e293b' },
  { id: 'sunset',   label: 'Sunset',   color: '#f97316' },
  { id: 'rose',     label: 'Rose',     color: '#e11d48' },
  { id: 'noir',     label: 'Noir',     color: '#1c1c1e' },
];

/* ── SOCIAL CARD ACTION LABELS ──────────────────────────────── */
const PLATFORM_ACTION = {
  instagram: 'Follow',
  youtube:   'Subscribe',
  twitter:   'Follow',
  linkedin:  'Connect',
  tiktok:    'Follow',
  spotify:   'Listen',
  pinterest: 'Follow',
};

/* ── LIVE DATA FETCHERS ─────────────────────────────────────── */
async function fetchInstagramPosts(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase.from('creator_oauth_tokens').select('access_token').eq('user_id', userId).eq('platform', 'instagram').single();
    if (!data?.access_token) return null;
    const fields = 'id,media_type,thumbnail_url,media_url,like_count,timestamp,caption';
    const res = await fetch(`https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${data.access_token}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch { return null; }
}

async function fetchInstagramProfile(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase.from('creator_oauth_tokens').select('access_token').eq('user_id', userId).eq('platform', 'instagram').single();
    if (!data?.access_token) return null;
    const fields = 'username,name,biography,profile_picture_url,followers_count,media_count,website';
    const res = await fetch(`https://graph.instagram.com/me?fields=${fields}&access_token=${data.access_token}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchYouTubeVideos(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase.from('creator_oauth_tokens').select('access_token').eq('user_id', userId).eq('platform', 'youtube').single();
    if (!data?.access_token) return null;
    const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${data.access_token}`);
    if (!chRes.ok) return null;
    const chJson = await chRes.json();
    const channel = chJson.items?.[0];
    const vRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&order=date&access_token=${data.access_token}`);
    const vJson = vRes.ok ? await vRes.json() : { items: [] };
    return {
      channel,
      videos: vJson.items?.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumb: item.snippet.thumbnails?.medium?.url || null,
        views: '—',
      })) || [],
    };
  } catch { return null; }
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { profile, user } = useAuth();
  const { theme, toggleTheme, accentTheme, setAccentTheme } = useTheme();
  const { socialAccounts, dashboardModules, carouselImages, collabBrands, loading } = useProfileData();

  const [exporting, setExporting]     = useState(false);
  const [copied, setCopied]           = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [editMode, setEditMode]       = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(accentTheme || 'default');

  // Card sizes: 'half' = spans 1 col, 'full' = spans 2 cols
  const [cardSizes, setCardSizes] = useState({});

  // Live data from connected accounts
  const [igPosts, setIgPosts]     = useState(null);
  const [igProfile, setIgProfile] = useState(null);
  const [ytData, setYtData]       = useState(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('creator_oauth_tokens').select('platform').eq('user_id', user.id)
      .then(({ data }) => { if (data) setConnectedPlatforms(data.map(r => r.platform)); });
    fetchInstagramProfile(user.id).then(p => p && setIgProfile(p));
    fetchInstagramPosts(user.id).then(p => p && setIgPosts(p));
    fetchYouTubeVideos(user.id).then(d => d && setYtData(d));
  }, [user?.id]);

  useEffect(() => {
    setSelectedTheme(accentTheme || 'default');
  }, [accentTheme]);

  const displayProfile = profile || {};
  const displaySocials = socialAccounts.filter(s => s.is_visible && s.handle).length > 0
    ? socialAccounts.filter(s => s.is_visible && s.handle)
    : [];

  const instagramSocial = displaySocials.find(s => s.platform === 'instagram');
  const youtubeSocial   = displaySocials.find(s => s.platform === 'youtube');

  const livePosts = igPosts
    ? igPosts.map(p => ({ id: p.id, type: p.media_type === 'VIDEO' ? 'reel' : 'image', thumb: p.thumbnail_url || p.media_url, likes: p.like_count || 0, caption: p.caption || '' }))
    : EMPTY_POSTS;

  const followers        = igProfile?.followers_count ? formatK(igProfile.followers_count) : '0';
  const postsCount       = igProfile?.media_count ?? 0;
  const engagement       = '0%';
  const featuredImages   = carouselImages.length > 0 ? carouselImages : [];
  const getImageMode = (img) => (String(img?.caption || '').trim().startsWith('[square]') ? 'square' : 'banner');
  const getCleanCaption = (img) => String(img?.caption || '').replace(/^\[(square|banner)\]\s*/i, '').trim();
  const dragCardRef = useRef(null);
  const defaultOrder = ['bio', ...displaySocials.map((s) => `social_${s.platform}`), 'carousel', 'spotify', 'brands', 'connect'];
  const [cardOrder, setCardOrder] = useState(() => {
    try {
      const raw = localStorage.getItem('creator_hub_card_order');
      return raw ? JSON.parse(raw) : defaultOrder;
    } catch {
      return defaultOrder;
    }
  });

  useEffect(() => {
    setCardOrder((prev) => {
      const merged = [...prev.filter((id) => defaultOrder.includes(id)), ...defaultOrder.filter((id) => !prev.includes(id))];
      return merged;
    });
  }, [displaySocials.length]);

  useEffect(() => {
    localStorage.setItem('creator_hub_card_order', JSON.stringify(cardOrder));
  }, [cardOrder]);

  const toggleCardSize = (key) => {
    setCardSizes(prev => ({ ...prev, [key]: prev[key] === 'full' ? 'half' : 'full' }));
  };

  const cardSize = (key) => cardSizes[key] || 'half';

  const getCardOrder = (id) => {
    const idx = cardOrder.indexOf(id);
    return idx === -1 ? cardOrder.length + 1 : idx;
  };

  const onCardDrop = (targetId) => {
    const sourceId = dragCardRef.current;
    if (!sourceId || sourceId === targetId) return;
    setCardOrder((prev) => {
      const arr = [...prev];
      const from = arr.indexOf(sourceId);
      const to = arr.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, sourceId);
      return arr;
    });
    dragCardRef.current = null;
  };

  const cardDragProps = (id) => ({
    draggable: true,
    onDragStart: () => { dragCardRef.current = id; },
    onDragOver: (e) => e.preventDefault(),
    onDrop: () => onCardDrop(id),
    style: { order: getCardOrder(id) },
  });

  const shareProfile = async () => {
    const url = `https://creatorhub.treva.in/${displayProfile?.username || 'creator'}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* silent */ }
  };

  const downloadKit = async () => {
    setExporting(true);
    const mediaKitAnalytics = {
      followers: followers || '-',
      engagement: engagement || '-',
      reach: ytData?.channel?.statistics?.viewCount || '-',
      topPlatform: instagramSocial ? 'Instagram' : youtubeSocial ? 'YouTube' : 'Creator Hub',
    };
    await generateMediaKit(displayProfile, mediaKitAnalytics, carouselImages, collabBrands);
    setExporting(false);
  };

  if (loading && !profile) {
    return (
      <main className="screen">
        <div className="screen-content">
          <div className={styles.skeletonCard}>
            <Skeleton width={80} height={80} borderRadius="50%" />
            <Skeleton height={22} width="50%" style={{ margin: '14px 0 8px' }} />
            <Skeleton height={14} width="70%" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className={styles.screenContent}>

        {/* ── HERO ── */}
        <div className={styles.hero}>
          <div
            className={styles.heroBanner}
            style={displayProfile?.cover_url ? {
              backgroundImage: `url(${displayProfile.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          />
          <div
            className={styles.heroBannerOverlay}
            style={displayProfile?.cover_url ? {
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.58) 100%)',
            } : undefined}
          />

          {/* Top actions */}
          <div className={styles.heroActions}>
            <button className={styles.heroIconBtn} onClick={() => setEditMode(e => !e)} aria-label="Edit mode">
              {editMode ? <Check size={15} color="#7C3AED" /> : <GripVertical size={15} />}
            </button>
            <button className={styles.heroIconBtn} onClick={() => setCustomizeOpen(true)} aria-label="Customize">
              <Palette size={15} />
            </button>
            <button className={styles.heroIconBtn} onClick={shareProfile} aria-label="Share">
              {copied ? <Check size={15} /> : <Share2 size={15} />}
            </button>
            <button className={styles.heroIconBtn} onClick={downloadKit} disabled={exporting} aria-label="Media Kit">
              <Download size={15} />
            </button>
          </div>

          <div className={styles.heroContent}>
            {/* Avatar */}
            <div className={styles.avatarRing}>
              <div className={styles.avatarRingInner}>
                <Avatar src={displayProfile?.avatar_url} name={displayProfile?.name || 'C'} size={76} />
              </div>
              {instagramSocial && (
                <div className={styles.platformBadge}>
                  <SocialIcon platform="instagram" size={10} />
                </div>
              )}
            </div>

            <h1 className={styles.profileName}>{displayProfile?.name || 'Your Name'}</h1>
            <div className={styles.handleRow}>
              <span className={styles.handle}>@{displayProfile?.username || 'creator'}</span>
              {connectedPlatforms.includes('instagram') && (
                <div className={styles.verifiedBadge}><Check size={8} color="white" /></div>
              )}
            </div>
            {displayProfile?.tagline && (
              <p className={styles.tagline}>{displayProfile.tagline}</p>
            )}

            {/* Stats */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>{followers}</span>
                <span className={styles.statLabel}>Followers</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>{postsCount}</span>
                <span className={styles.statLabel}>Posts</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>{engagement}</span>
                <span className={styles.statLabel}>Engagement</span>
              </div>
            </div>

            {/* Location */}
            {displayProfile?.location && (
              <div className={styles.locationRow}>
                <MapPin size={12} />
                <span>{displayProfile.location}</span>
              </div>
            )}

            {/* CTA */}
            <div className={styles.ctaRow}>
              <button className={styles.ctaShare} onClick={shareProfile}>
                <Share2 size={14} />
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button className={styles.ctaKit} onClick={downloadKit} disabled={exporting}>
                <Download size={14} />
                {exporting ? 'Exporting...' : 'Media Kit'}
              </button>
            </div>
          </div>
        </div>

        {/* ── EDIT MODE BANNER ── */}
        {editMode && (
          <div className={styles.editBanner}>
            <GripVertical size={14} />
            <span>Edit mode — tap cards to resize</span>
            <button className={styles.editBannerDone} onClick={() => setEditMode(false)}>
              <Check size={13} /> Done
            </button>
          </div>
        )}

        {/* ── CARD GRID ── */}
        <div className={styles.cardGrid}>

          {/* Bio card */}
          {displayProfile?.bio && (
            <div
              {...cardDragProps('bio')}
              className={`${styles.card} ${cardSize('bio') === 'full' ? styles.cardFull : ''}`}
            >
              {editMode && <EditHandle onToggle={() => toggleCardSize('bio')} isFull={cardSize('bio') === 'full'} />}
              <p className={styles.bioText}>{displayProfile.bio}</p>
              {displayProfile?.niche_tags?.length > 0 && (
                <div className={styles.chipRow}>
                  {displayProfile.niche_tags.map(tag => (
                    <span key={tag} className={styles.nicheChip}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Social link cards */}
          {displaySocials.map((s, idx) => {
            const key = `social_${s.platform}`;
            const isFull = cardSize(key) === 'full';
            const action = PLATFORM_ACTION[s.platform] || 'Follow';
            return (
              <div
                {...cardDragProps(key)}
                key={s.platform}
                className={`${styles.card} ${styles.socialCard} ${isFull ? styles.cardFull : ''}`}
              >
                {editMode && <EditHandle onToggle={() => toggleCardSize(key)} isFull={isFull} />}
                <div className={styles.socialCardIcon}>
                  <SocialIcon platform={s.platform} size={22} />
                </div>
                <div className={styles.socialCardInfo}>
                  <p className={styles.socialCardHandle}>@{s.handle}</p>
                  {isFull && s.url && (
                    <p className={styles.socialCardUrl}>
                      {s.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </p>
                  )}
                </div>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialCardBtn}
                  >
                    {action}
                  </a>
                ) : (
                  <span className={`${styles.socialCardBtn} ${styles.socialCardBtnDisabled}`}>{action}</span>
                )}
              </div>
            );
          })}

          {/* Featured Work carousel */}
          {dashboardModules?.carousel_enabled && featuredImages.length > 0 && (() => {
            const key = 'carousel';
            return (
              <div {...cardDragProps(key)} className={`${styles.card} ${styles.cardFull}`}>
                {editMode && <EditHandle onToggle={() => toggleCardSize(key)} isFull={true} />}
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Featured Work</h2>
                </div>
                <div className={`${styles.carouselWrap} ${getImageMode(featuredImages[carouselIdx]) === 'square' ? styles.carouselSquare : ''}`}>
                  <img src={featuredImages[carouselIdx]?.image_url} alt={featuredImages[carouselIdx]?.caption || 'Featured'} className={styles.carouselImg} />
                  {featuredImages.length > 1 && (
                    <div className={styles.carouselNav}>
                      <button className={styles.carouselNavBtn} onClick={() => setCarouselIdx(i => (i - 1 + featuredImages.length) % featuredImages.length)}><ChevronLeft size={16} /></button>
                      <button className={styles.carouselNavBtn} onClick={() => setCarouselIdx(i => (i + 1) % featuredImages.length)}><ChevronRight size={16} /></button>
                    </div>
                  )}
                  <div className={styles.carouselDots}>
                    {featuredImages.map((_, i) => (
                      <div key={i} className={`${styles.dot} ${i === carouselIdx ? styles.dotActive : ''}`} onClick={() => setCarouselIdx(i)} />
                    ))}
                  </div>
                </div>
                {getCleanCaption(featuredImages[carouselIdx]) && (
                  <p className={styles.carouselCaption}>{getCleanCaption(featuredImages[carouselIdx])}</p>
                )}
              </div>
            );
          })()}

          {/* Spotify */}
          {dashboardModules?.spotify_enabled && dashboardModules.spotify_url && (() => {
            const key = 'spotify';
            const isFull = cardSize(key) === 'full';
            return (
              <div {...cardDragProps(key)} className={`${styles.card} ${styles.spotifyCard} ${isFull ? styles.cardFull : ''}`}>
                {editMode && <EditHandle onToggle={() => toggleCardSize(key)} isFull={isFull} />}
                <SocialIcon platform="spotify" size={32} />
                <div className={styles.spotifyInfo}>
                  <p className={styles.spotifyLabel}>My Playlist</p>
                  <p className={styles.spotifyName}>Creator Mix</p>
                </div>
                <a href={dashboardModules.spotify_url} target="_blank" rel="noopener noreferrer" className={styles.spotifyBtn}>
                  <Music size={12} /> Listen
                </a>
              </div>
            );
          })()}

          {/* Collab brands */}
          {collabBrands.length > 0 && (
            <div {...cardDragProps('brands')} className={`${styles.card} ${styles.cardFull}`}>
              {editMode && <EditHandle onToggle={() => toggleCardSize('brands')} isFull={true} />}
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Worked With</h2>
              </div>
              <div className={styles.brandsRow}>
                {collabBrands.map(brand => (
                  <div key={brand.id} className={styles.brandBadge}>
                    {brand.brand_logo_url
                      ? <img src={brand.brand_logo_url} alt={brand.brand_name} loading="lazy" className={styles.brandLogo} />
                      : <span className={styles.brandInitial}>{brand.brand_name[0]}</span>
                    }
                    <span className={styles.brandName}>{brand.brand_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connect banner */}
          {connectedPlatforms.length === 0 && (
            <div {...cardDragProps('connect')} className={`${styles.card} ${styles.cardFull} ${styles.connectCard}`}>
              <p className={styles.connectTitle}><Zap size={14} style={{ display:'inline', marginRight:4 }} />Connect accounts</p>
              <p className={styles.connectSub}>Link Instagram or YouTube to show live posts</p>
              <div className={styles.connectRow}>
                <a href="/setup" className={styles.connectBtn}><SocialIcon platform="instagram" size={13} /> Instagram</a>
                <a href="/setup" className={styles.connectBtn}><SocialIcon platform="youtube" size={13} /> YouTube</a>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── CUSTOMIZE SHEET ── */}
      <BottomSheet open={customizeOpen} onClose={() => setCustomizeOpen(false)} title="Customize">
        <div className={styles.customizeSheet}>

          <p className={styles.customizeSection}>Theme</p>
          <div className={styles.themeGrid}>
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`${styles.themeBtn} ${selectedTheme === t.id ? styles.themeBtnActive : ''}`}
                onClick={() => setSelectedTheme(t.id)}
              >
                <span className={styles.themeSwatch} style={{ background: t.color }} />
                <span className={styles.themeLabel}>{t.label}</span>
                {selectedTheme === t.id && <Check size={12} className={styles.themeCheck} />}
              </button>
            ))}
          </div>

          <div className={styles.customizeDivider} />

          <div className={styles.customizeRow}>
            <div className={styles.customizeRowLeft}>
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              <span>Dark Mode</span>
            </div>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} id="dark_toggle" />
          </div>

          <div className={styles.customizeDivider} />

          <button
            className={`btn btn-primary btn-full`}
            style={{ marginTop: 8 }}
            onClick={() => {
              setAccentTheme(selectedTheme);
              setCustomizeOpen(false);
            }}
          >
            Save Changes
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}

/* ── EDIT HANDLE COMPONENT ──────────────────────────────────── */
function EditHandle({ onToggle, isFull }) {
  return (
    <div className={styles.editHandle}>
      <button className={styles.editHandleBtn} onClick={onToggle} title={isFull ? 'Make half-width' : 'Make full-width'}>
        {isFull ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
      </button>
    </div>
  );
}

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

