import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, MapPin, Music,
  UserCheck, UserPlus, MessageCircle, Check,
} from 'lucide-react';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import { useAuth } from '../../store/AuthContext';
import Avatar from '../../components/Avatar';
import SocialIcon from '../../components/SocialIcon';
import styles from './PublicProfile.module.css';

const PLATFORM_ACTION = {
  instagram: 'Follow',
  youtube:   'Subscribe',
  twitter:   'Follow',
  linkedin:  'Connect',
  tiktok:    'Follow',
  spotify:   'Listen',
  pinterest: 'Follow',
};

function formatK(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getImageMode(img) {
  return String(img?.caption || '').trim().startsWith('[square]') ? 'square' : 'banner';
}
function getCleanCaption(img) {
  return String(img?.caption || '').replace(/^\[(square|banner)\]\s*/i, '').trim();
}

export default function PublicProfile() {
  const { username, profileId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile]           = useState(null);
  const [images, setImages]             = useState([]);
  const [socials, setSocials]           = useState([]);
  const [modules, setModules]           = useState(null);
  const [collabBrands, setCollabBrands] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);

  const [carouselIdx, setCarouselIdx]   = useState(0);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseEnabled || (!username && !profileId)) return;
    setLoading(true);
    setNotFound(false);
    setCarouselIdx(0);

    (async () => {
      // ── 1. Resolve profile ─────────────────────────────────
      let profileData = null;

      if (profileId) {
        const { data } = await supabase
          .from('creator_profiles').select('*')
          .eq('id', profileId).maybeSingle();
        profileData = data;

        // Fallback: integer FK — find real profile via user_id on the image
        if (!profileData) {
          const { data: imgs } = await supabase
            .from('creator_carousel_images').select('*')
            .eq('creator_profile_id', profileId)
            .order('created_at', { ascending: false }).limit(30);

          if (imgs?.length) {
            // Try to find the real creator_profile via user_id on the image
            const imageUserId = imgs[0]?.user_id;
            if (imageUserId) {
              const { data: realProfile } = await supabase
                .from('creator_profiles').select('*')
                .eq('auth_user_id', imageUserId).maybeSingle();
              if (realProfile) {
                profileData = realProfile;
                // continue with full fetch below using the real profile
              }
            }
            // If still no real profile, show what we have from images only
            if (!profileData) {
              setProfile({ id: profileId, _synthetic: true, display_name: 'Creator' });
              setLocalFollowerCount(0);
              setImages(imgs);
              setLoading(false);
              return;
            }
          } else {
            setNotFound(true);
            setLoading(false);
            return;
          }
        }
      } else {
        const { data } = await supabase
          .from('creator_profiles').select('*')
          .eq('username', username).maybeSingle();
        profileData = data;
      }

      if (!profileData) { setNotFound(true); setLoading(false); return; }

      const uid = profileData.auth_user_id;

      // ── 2. Fetch everything in parallel ────────────────────
      const [imgByProfileId, imgByUserId, socialRes, modulesRes, brandsRes] = await Promise.all([
        supabase.from('creator_carousel_images').select('*')
          .eq('creator_profile_id', profileData.id)
          .order('created_at', { ascending: false }).limit(30),
        uid
          ? supabase.from('creator_carousel_images').select('*')
              .eq('user_id', uid)
              .order('created_at', { ascending: false }).limit(30)
          : Promise.resolve({ data: [] }),
        uid
          ? supabase.from('creator_social_accounts').select('*')
              .eq('user_id', uid).eq('is_visible', true)
          : Promise.resolve({ data: [] }),
        uid
          ? supabase.from('creator_dashboard_modules').select('*')
              .eq('user_id', uid).maybeSingle()
          : Promise.resolve({ data: null }),
        uid
          ? supabase.from('creator_collab_brands').select('*').eq('user_id', uid)
          : Promise.resolve({ data: [] }),
      ]);

      // Deduplicate images
      const imgMap = new Map();
      for (const img of [...(imgByProfileId.data || []), ...(imgByUserId.data || [])]) {
        imgMap.set(img.id, img);
      }
      const mergedImages = [...imgMap.values()]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 30);

      setProfile(profileData);
      setLocalFollowerCount(profileData.hub_follower_count ?? 0);
      setImages(mergedImages);
      setSocials((socialRes.data || []).filter(s => s.handle && s.is_visible));
      setModules(modulesRes.data || null);
      setCollabBrands(brandsRes.data || []);

      // ── 3. Check follow status ──────────────────────────────
      if (currentUser && uid && currentUser.id !== uid) {
        const { data: fw } = await supabase
          .from('creator_follows').select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', uid).maybeSingle();
        setIsFollowing(!!fw);
      }

      setLoading(false);
    })();
  }, [username, profileId, currentUser?.id]);

  // ── Follow / Unfollow ──────────────────────────────────────
  const toggleFollow = async () => {
    if (!currentUser || followLoading || !profile?.auth_user_id) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from('creator_follows').delete()
        .eq('follower_id', currentUser.id).eq('following_id', profile.auth_user_id);
      setIsFollowing(false);
      setLocalFollowerCount(c => Math.max(c - 1, 0));
    } else {
      await supabase.from('creator_follows')
        .insert({ follower_id: currentUser.id, following_id: profile.auth_user_id });
      setIsFollowing(true);
      setLocalFollowerCount(c => c + 1);
    }
    setFollowLoading(false);
  };

  // ── Start direct message ───────────────────────────────────
  const startChat = async () => {
    if (!currentUser || !profile?.auth_user_id) return;
    const uid = profile.auth_user_id;
    const { data: existing } = await supabase
      .from('creator_hub_conversations').select('id')
      .eq('conversation_type', 'direct')
      .or(`and(creator_user_id.eq.${currentUser.id},brand_user_id.eq.${uid}),and(creator_user_id.eq.${uid},brand_user_id.eq.${currentUser.id})`)
      .maybeSingle();
    if (existing) { navigate(`/deals/chat/${existing.id}`); return; }
    const { data: created } = await supabase
      .from('creator_hub_conversations')
      .insert({ conversation_type: 'direct', creator_user_id: currentUser.id, brand_user_id: uid, created_by: currentUser.id })
      .select('id').single();
    if (created) navigate(`/deals/chat/${created.id}`);
  };

  // ── Loading / Not found ────────────────────────────────────
  if (loading) {
    return (
      <main className="screen">
        <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
      </main>
    );
  }
  if (notFound) {
    return (
      <main className="screen">
        <div className={styles.notFound}>
          <p>Creator not found</p>
          <button className={styles.backLink} onClick={() => navigate(-1)}>Go back</button>
        </div>
      </main>
    );
  }

  const displayName   = profile.display_name || profile.name || profile.username || 'Creator';
  const followers     = formatK(localFollowerCount);
  const following     = formatK(profile.hub_following_count ?? 0);
  const postsCount    = profile.hub_posts_count ?? images.length;
  const location      = profile.base_city || profile.location;
  const isOwnProfile  = currentUser?.id && profile.auth_user_id && currentUser.id === profile.auth_user_id;
  const canInteract   = !isOwnProfile && !profile._synthetic && !!profile.auth_user_id;
  const instagramSocial = socials.find(s => s.platform === 'instagram');
  const featuredImages  = modules?.carousel_enabled ? images : images; // always show images

  return (
    <main className="screen">
      <div className={styles.screenContent}>

        {/* ── HERO ── */}
        <div className={styles.hero}>
          <div className={styles.heroBanner}
            style={profile.cover_url ? {
              backgroundImage: `url(${profile.cover_url})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            } : undefined}
          />
          <div className={styles.heroBannerOverlay}
            style={profile.cover_url ? {
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.58) 100%)',
            } : undefined}
          />

          {/* Back button */}
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={18} /> Back
          </button>

          <div className={styles.heroContent}>
            {/* Avatar */}
            <div className={styles.avatarRing}>
              <div className={styles.avatarRingInner}>
                <Avatar src={profile.avatar_url} name={displayName} size={76} />
              </div>
              {instagramSocial && (
                <div className={styles.platformBadge}>
                  <SocialIcon platform="instagram" size={10} />
                </div>
              )}
            </div>

            <h1 className={styles.profileName}>{displayName}</h1>
            <div className={styles.handleRow}>
              <span className={styles.handle}>@{profile.username || 'creator'}</span>
            </div>
            {profile.tagline && <p className={styles.tagline}>{profile.tagline}</p>}

            {/* Stats */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>{followers}</span>
                <span className={styles.statLabel}>Followers</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>{following}</span>
                <span className={styles.statLabel}>Following</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>{postsCount}</span>
                <span className={styles.statLabel}>Posts</span>
              </div>
            </div>

            {location && (
              <div className={styles.locationRow}>
                <MapPin size={12} /><span>{location}</span>
              </div>
            )}

            {/* Follow + Message */}
            {canInteract && (
              <div className={styles.ctaRow}>
                <button
                  className={isFollowing ? styles.unfollowBtn : styles.followBtn}
                  onClick={toggleFollow} disabled={followLoading}
                >
                  {isFollowing
                    ? <><UserCheck size={15} /> Following</>
                    : <><UserPlus size={15} /> Follow</>}
                </button>
                <button className={styles.chatBtn} onClick={startChat}>
                  <MessageCircle size={15} /> Message
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD GRID (exact mirror of Dashboard) ── */}
        <div className={styles.cardGrid}>

          {/* Bio */}
          {profile.bio && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.bioText}>{profile.bio}</p>
              {profile.niche_tags?.length > 0 && (
                <div className={styles.chipRow}>
                  {profile.niche_tags.map(tag => (
                    <span key={tag} className={styles.nicheChip}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Social link cards */}
          {socials.map(s => {
            const action = PLATFORM_ACTION[s.platform] || 'Follow';
            return (
              <div key={s.platform} className={`${styles.card} ${styles.socialCard}`}>
                <div className={styles.socialCardIcon}>
                  <SocialIcon platform={s.platform} size={22} />
                </div>
                <div className={styles.socialCardInfo}>
                  <p className={styles.socialCardHandle}>@{s.handle}</p>
                </div>
                {s.url
                  ? <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.socialCardBtn}>{action}</a>
                  : <span className={`${styles.socialCardBtn} ${styles.socialCardBtnDisabled}`}>{action}</span>
                }
              </div>
            );
          })}

          {/* Featured Work carousel */}
          {featuredImages.length > 0 && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Featured Work</h2>
              </div>
              <div className={`${styles.carouselWrap} ${getImageMode(featuredImages[carouselIdx]) === 'square' ? styles.carouselSquare : ''}`}>
                <img
                  src={featuredImages[carouselIdx]?.image_url}
                  alt={getCleanCaption(featuredImages[carouselIdx]) || 'Featured'}
                  className={styles.carouselImg}
                />
                {featuredImages.length > 1 && (
                  <div className={styles.carouselNav}>
                    <button className={styles.carouselNavBtn}
                      onClick={() => setCarouselIdx(i => (i - 1 + featuredImages.length) % featuredImages.length)}>
                      <ChevronLeft size={16} />
                    </button>
                    <button className={styles.carouselNavBtn}
                      onClick={() => setCarouselIdx(i => (i + 1) % featuredImages.length)}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
                <div className={styles.carouselDots}>
                  {featuredImages.map((_, i) => (
                    <div key={i}
                      className={`${styles.dot} ${i === carouselIdx ? styles.dotActive : ''}`}
                      onClick={() => setCarouselIdx(i)}
                    />
                  ))}
                </div>
              </div>
              {getCleanCaption(featuredImages[carouselIdx]) && (
                <p className={styles.carouselCaption}>{getCleanCaption(featuredImages[carouselIdx])}</p>
              )}
            </div>
          )}

          {/* Spotify */}
          {modules?.spotify_enabled && modules.spotify_url && (
            <div className={`${styles.card} ${styles.spotifyCard}`}>
              <SocialIcon platform="spotify" size={32} />
              <div className={styles.spotifyInfo}>
                <p className={styles.spotifyLabel}>My Playlist</p>
                <p className={styles.spotifyName}>Creator Mix</p>
              </div>
              <a href={modules.spotify_url} target="_blank" rel="noopener noreferrer" className={styles.spotifyBtn}>
                <Music size={12} /> Listen
              </a>
            </div>
          )}

          {/* Collab brands */}
          {collabBrands.length > 0 && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Worked With</h2>
              </div>
              <div className={styles.brandsRow}>
                {collabBrands.map(brand => (
                  <div key={brand.id} className={styles.brandBadge}>
                    {brand.brand_logo_url
                      ? <img src={brand.brand_logo_url} alt={brand.brand_name} loading="lazy" className={styles.brandLogo} />
                      : <span className={styles.brandInitial}>{brand.brand_name[0]}</span>}
                    <span className={styles.brandName}>{brand.brand_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
