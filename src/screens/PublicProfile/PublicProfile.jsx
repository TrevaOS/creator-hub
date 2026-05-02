import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import Avatar from '../../components/Avatar';
import styles from './PublicProfile.module.css';

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled || !username) return;
    setLoading(true);
    (async () => {
      const { data: profileData } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: imgData } = await supabase
        .from('creator_carousel_images')
        .select('*')
        .eq('creator_profile_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(30);

      setProfile(profileData);
      setImages(imgData || []);
      setLoading(false);
    })();
  }, [username]);

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
          <button className={styles.backBtn} onClick={() => navigate(-1)}>Go back</button>
        </div>
      </main>
    );
  }

  const displayName = profile.display_name || profile.name || profile.username;
  const followers = profile.follower_count ?? 0;
  const postsCount = images.length;
  const engagement = profile.engagement_rate ? `${profile.engagement_rate}%` : '0%';

  return (
    <main className="screen">
      <div className={styles.content}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
          Back
        </button>

        <div className={styles.heroCard}>
          {profile.banner_url && (
            <img className={styles.banner} src={profile.banner_url} alt="banner" />
          )}
          <div className={styles.profileInfo}>
            <Avatar src={profile.avatar_url} name={displayName} size={72} />
            <h1 className={styles.displayName}>{displayName}</h1>
            <p className={styles.handle}>@{profile.username}</p>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            {profile.location && (
              <p className={styles.location}>
                <MapPin size={13} />
                {profile.location}
              </p>
            )}
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatK(followers)}</span>
              <span className={styles.statLabel}>Followers</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{postsCount}</span>
              <span className={styles.statLabel}>Posts</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{engagement}</span>
              <span className={styles.statLabel}>Engagement</span>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <section className={styles.grid}>
            {images.map((img) => (
              <div key={img.id} className={styles.tile}>
                <img src={img.image_url} alt={img.caption || ''} loading="lazy" />
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
