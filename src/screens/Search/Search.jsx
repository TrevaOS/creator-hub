import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import { useAuth } from '../../store/AuthContext';
import Avatar from '../../components/Avatar';
import styles from './Search.module.css';

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
        // Step 1: fetch all images
        const imageRes = await supabase
          .from('creator_carousel_images')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(60);

        const allImages = imageRes.data || [];

        // Step 2: collect all unique creator_profile_ids from images
        const profileIds = [...new Set(
          allImages.map(img => img.creator_profile_id).filter(Boolean)
        )];

        // Step 3: fetch ONLY those profiles (exact match, no limit miss)
        const [creatorRes, allCreatorsRes] = await Promise.all([
          profileIds.length > 0
            ? supabase.from('creator_profiles').select('*').in('id', profileIds)
            : Promise.resolve({ data: [] }),
          supabase.from('creator_profiles').select('id,username,display_name,avatar_url,base_city,niche_tags').order('updated_at', { ascending: false }).limit(200),
        ]);

        const creatorMap = new Map((creatorRes.data || []).map((c) => [c.id, c]));

        nextImages = allImages.map((img, index) => {
          const profile = creatorMap.get(img.creator_profile_id);
          const username = profile?.username?.trim() || null;
          const displayHandle = username
            ? `@${username}`
            : profile?.display_name || null;
          const profileId = profile?.id || img.creator_profile_id || null;
          return {
            id: img.id,
            title: img.caption || `Featured Image ${index + 1}`,
            creator: displayHandle || 'Creator',
            username,
            profileId,
            views: profile?.follower_count ? `${Math.max(1, Math.round(profile.follower_count / 10))} views` : 'Featured',
            image: img.image_url,
            heightClass: index % 11 === 0 ? 'tall' : index % 5 === 0 ? 'mid' : 'short',
          };
        }).filter((item) => !!item.image);

        if (mounted) setCreators(allCreatorsRes.data || []);
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
