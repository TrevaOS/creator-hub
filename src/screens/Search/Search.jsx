import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import { useAuth } from '../../store/AuthContext';
import Avatar from '../../components/Avatar';
import styles from './Search.module.css';

function formatK(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function Search() {
  const navigate = useNavigate();
  const { profile: myProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [creators, setCreators] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let nextImages = [];

      if (isSupabaseEnabled) {
        // Fetch all images (no is_public filter — column may not exist yet)
        // and all creator profiles in parallel
        const [imageRes, allCreatorsRes] = await Promise.all([
          supabase
            .from('creator_carousel_images')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase
            .from('creator_profiles')
            .select('id,auth_user_id,username,display_name,avatar_url,base_city,niche_tags,hub_follower_count')
            .order('updated_at', { ascending: false })
            .limit(200),
        ]);

        const allImages = imageRes.data || [];
        const allProfiles = allCreatorsRes.data || [];

        // Build two maps: by creator_profile_id (UUID) and by auth_user_id
        const profileById = new Map(allProfiles.map(c => [c.id, c]));
        const profileByUserId = new Map(allProfiles.map(c => [c.auth_user_id, c]));

        // Deduplicate: one image per creator (show their best/latest image)
        const seenCreators = new Set();
        const deduped = [];
        for (const img of allImages) {
          const profile = profileById.get(img.creator_profile_id) || profileByUserId.get(img.user_id);
          const key = profile?.id || img.creator_profile_id || img.user_id || img.id;
          if (!seenCreators.has(key)) {
            seenCreators.add(key);
            deduped.push({ img, profile });
          }
        }

        nextImages = deduped.map(({ img, profile }, index) => {
          const username = profile?.username?.trim() || null;
          const displayHandle = username ? `@${username}` : profile?.display_name || null;
          const profileId = profile?.id || img.creator_profile_id || null;
          return {
            id: img.id,
            title: img.caption || `Featured Image ${index + 1}`,
            creator: displayHandle || 'Creator',
            username,
            profileId,
            views: profile?.hub_follower_count ? `${formatK(profile.hub_follower_count)} followers` : 'Featured',
            image: img.image_url,
            heightClass: index % 11 === 0 ? 'tall' : index % 5 === 0 ? 'mid' : 'short',
          };
        }).filter((item) => !!item.image);

        if (mounted) setCreators(allProfiles);
      }

      if (mounted) {
        setImages(nextImages);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredImages = useMemo(() => images.filter((item) => {
    const q = query.toLowerCase();
    return !q || [item.title, item.creator].some((value) => value.toLowerCase().includes(q));
  }), [query, images]);

  const goToProfile = (username, profileId) => {
    if (!username && !profileId) return;
    const myUsername = myProfile?.username?.trim();
    const myProfileId = myProfile?.profile_id;
    // Only redirect to own dashboard if username explicitly matches (never match on null/empty)
    if (username && myUsername && username === myUsername) {
      navigate('/dashboard');
      return;
    }
    // Also redirect to own dashboard if navigating by profileId and it's our own profile
    if (!username && profileId && myProfileId && profileId === myProfileId) {
      navigate('/dashboard');
      return;
    }
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      navigate(`/profile/id/${profileId}`);
    }
  };

  const filteredCreators = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return creators.filter((c) =>
      (c.username || '').toLowerCase().includes(q) ||
      (c.display_name || c.name || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, creators]);

  return (
    <main className="screen">
      <div className={styles.content}>
        <div className={styles.searchBarWrap}>
          <div className={styles.searchBar}>
            <SearchIcon size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search users and images"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search users and images"
            />
          </div>
        </div>

        {filteredCreators.length > 0 && (
          <section className={styles.creatorSection}>
            {filteredCreators.map((c) => (
              <button
                key={c.id}
                className={styles.creatorRow}
                onClick={() => goToProfile(c.username, c.id)}
              >
                <Avatar src={c.avatar_url} name={c.display_name || c.name || c.username} size={44} />
                <div className={styles.creatorInfo}>
                  <span className={styles.creatorName}>{c.display_name || c.name || c.username}</span>
                  <span className={styles.creatorHandle}>@{c.username}</span>
                </div>
              </button>
            ))}
          </section>
        )}

        <section className={styles.resultSection}>
          <div className={styles.reelGrid}>
            {filteredImages.map((item) => (
              <article
                key={item.id}
                className={`${styles.reelTile} ${styles[item.heightClass]}`}
                onClick={() => goToProfile(item.username, item.profileId)}
                style={{ cursor: (item.username || item.profileId) ? 'pointer' : 'default' }}
              >
                <img src={item.image} alt={item.title} loading="lazy" />
                <div className={styles.reelOverlay}>
                  <p>{item.creator}</p>
                  <span>{item.views}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
