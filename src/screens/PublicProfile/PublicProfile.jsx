import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import Avatar from '../../components/Avatar';
import styles from './PublicProfile.module.css';

function formatK(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function PublicProfile() {
  const { username, profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [images, setImages] = useState([]);
  const [socials, setSocials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled || (!username && !profileId)) return;
    setLoading(true);
    setNotFound(false);
    (async () => {
      let query = supabase.from('creator_profiles').select('*');
      if (profileId) {
        query = query.eq('id', profileId);
      } else {
        query = query.eq('username', username);
      }
      const { data: profileData } = await query.maybeSingle();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Try both creator_profile_id and user_id since images can be keyed either way
      const [imgByProfileId, imgByUserId, socialRes] = await Promise.all([
        supabase
          .from('creator_carousel_images')
          .select('*')
          .eq('creator_profile_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(30),
        profileData.auth_user_id
          ? supabase
              .from('creator_carousel_images')
              .select('*')
              .eq('user_id', profileData.auth_user_id)
              .order('created_at', { ascending: false })
              .limit(30)
          : Promise.resolve({ data: [] }),
        profileData.auth_user_id
          ? supabase
              .from('creator_social_accounts')
              .select('*')
              .eq('user_id', profileData.auth_user_id)
              .eq('is_visible', true)
          : Promise.resolve({ data: [] }),
      ]);

      // Merge and deduplicate images from both queries
      const imgMap = new Map();
      for (const img of [...(imgByProfileId.data || []), ...(imgByUserId.data || [])]) {
        imgMap.set(img.id, img);
      }
      const imgRes = { data: [...imgMap.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 30) };

      setProfile(profileData);
      setImages(imgRes.data || []);
      setSocials((socialRes.data || []).filter((s) => s.handle));
      setLoading(false);
    })();
  }, [username, profileId]);

  if (loading) {
    return (
      <main className="screen">
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
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

  const displayName = profile.display_name || profile.name || profile.username;
  const followers = formatK(profile.follower_count ?? 0);
  const postsCount = images.length;
  const engagement = profile.engagement_rate ? `${profile.engagement_rate}%` : '0%';
  const location = profile.base_city || profile.location;

  return (
    <main className="screen">
      <div className={styles.screenContent}>

        <div className={styles.hero}>
          <div
            className={styles.heroBanner}
            style={profile.cover_url ? {
              backgroundImage: `url(${profile.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          />
          <div
            className={styles.heroBannerOverlay}
            style={profile.cover_url ? {
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.58) 100%)',
            } : undefined}
          />

          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
            Back
          </button>

          <div className={styles.heroContent}>
            <div className={styles.avatarRing}>
              <div className={styles.avatarRingInner}>
                <Avatar src={profile.avatar_url} name={displayName} size={76} />
              </div>
            </div>

            <h1 className={styles.profileName}>{displayName}</h1>
            <div className={styles.handleRow}>
              <span className={styles.handle}>@{profile.username}</span>
            </div>
            {profile.tagline && <p className={styles.tagline}>{profile.tagline}</p>}

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

            {location && (
              <div className={styles.locationRow}>
                <MapPin size={12} />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.body}>
          {profile.bio && (
            <div className={styles.bioCard}>
              <p className={styles.bioText}>{profile.bio}</p>
              {profile.niche_tags?.length > 0 && (
                <div className={styles.chipRow}>
                  {profile.niche_tags.map((tag) => (
                    <span key={tag} className={styles.chip}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className={styles.grid}>
              {images.map((img) => (
                <div key={img.id} className={styles.tile}>
                  <img src={img.image_url} alt={img.caption || ''} loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
