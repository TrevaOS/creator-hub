import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import { useAuth } from '../../store/AuthContext';
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
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [images, setImages] = useState([]);
  const [socials, setSocials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseEnabled || (!username && !profileId)) return;
    setLoading(true);
    setNotFound(false);
    (async () => {
      let profileData = null;

      if (profileId) {
        // Try UUID lookup first
        const { data } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle();
        profileData = data;

        // If not found by UUID, the id might be a legacy integer FK —
        // fetch images directly by creator_profile_id and build a synthetic profile
        if (!profileData) {
          const { data: imgs } = await supabase
            .from('creator_carousel_images')
            .select('*')
            .eq('creator_profile_id', profileId)
            .order('created_at', { ascending: false })
            .limit(30);

          if (imgs && imgs.length > 0) {
            // Build a synthetic profile from the image metadata
            profileData = {
              id: profileId,
              auth_user_id: null,
              display_name: 'Creator',
              username: null,
              avatar_url: null,
              cover_url: null,
              bio: null,
              base_city: null,
              tagline: null,
              niche_tags: [],
              follower_count: null,
              engagement_rate: null,
              _synthetic: true,
              _images: imgs,
            };
          }

          if (!profileData) {
            setNotFound(true);
            setLoading(false);
            return;
          }

          setProfile(profileData);
          setLocalFollowerCount(0);
          setImages(profileData._images || []);
          setSocials([]);
          setLoading(false);
          return;
        }
      } else {
        const { data } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();
        profileData = data;
      }

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
      setLocalFollowerCount(profileData.hub_follower_count ?? 0);
      setImages(imgRes.data || []);
      setSocials((socialRes.data || []).filter((s) => s.handle));

      // Check if current user already follows this profile
      if (currentUser && profileData.auth_user_id && currentUser.id !== profileData.auth_user_id) {
        const { data: followRow } = await supabase
          .from('creator_follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileData.auth_user_id)
          .maybeSingle();
        setIsFollowing(!!followRow);
      }

      setLoading(false);
    })();
  }, [username, profileId, currentUser?.id]);

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

  const displayName = profile.display_name || profile.name || profile.username || 'Creator';
  const followers = formatK(localFollowerCount);
  const following = formatK(profile.hub_following_count ?? 0);
  const postsCount = images.length;
  const location = profile.base_city || profile.location;
  const isOwnProfile = currentUser && profile.auth_user_id && currentUser.id === profile.auth_user_id;
  const canFollow = !isOwnProfile && !profile._synthetic && !!profile.auth_user_id;

  const toggleFollow = async () => {
    if (!currentUser || followLoading) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase
        .from('creator_follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.auth_user_id);
      setIsFollowing(false);
      setLocalFollowerCount(c => Math.max(c - 1, 0));
    } else {
      await supabase
        .from('creator_follows')
        .insert({ follower_id: currentUser.id, following_id: profile.auth_user_id });
      setIsFollowing(true);
      setLocalFollowerCount(c => c + 1);
    }
    setFollowLoading(false);
  };

  const startChat = async () => {
    if (!currentUser || !profile.auth_user_id) return;
    // Find or create a direct conversation between these two users
    const { data: existing } = await supabase
      .from('creator_hub_conversations')
      .select('id')
      .eq('conversation_type', 'direct')
      .or(`and(creator_user_id.eq.${currentUser.id},brand_user_id.eq.${profile.auth_user_id}),and(creator_user_id.eq.${profile.auth_user_id},brand_user_id.eq.${currentUser.id})`)
      .maybeSingle();
    if (existing) {
      navigate(`/deals/chat/${existing.id}`);
      return;
    }
    const { data: created } = await supabase
      .from('creator_hub_conversations')
      .insert({
        conversation_type: 'direct',
        creator_user_id: currentUser.id,
        brand_user_id: profile.auth_user_id,
        created_by: currentUser.id,
      })
      .select('id')
      .single();
    if (created) navigate(`/deals/chat/${created.id}`);
  };

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
                <MapPin size={12} />
                <span>{location}</span>
              </div>
            )}

            {canFollow && (
              <div className={styles.ctaRow}>
                <button
                  className={isFollowing ? styles.unfollowBtn : styles.followBtn}
                  onClick={toggleFollow}
                  disabled={followLoading}
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
