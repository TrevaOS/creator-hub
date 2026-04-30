import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import styles from './Search.module.css';

export default function Search() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let nextImages = [];

      if (isSupabaseEnabled) {
        const [imageRes, creatorRes] = await Promise.all([
          supabase.from('creator_carousel_images').select('*').order('created_at', { ascending: false }).limit(60),
          supabase.from('creator_profiles').select('*').order('updated_at', { ascending: false }).limit(200),
        ]);

        const creatorMap = new Map((creatorRes.data || []).map((c) => [c.id, c]));
        nextImages = (imageRes.data || []).map((img, index) => {
          const profile = creatorMap.get(img.creator_profile_id);
          return {
            id: img.id,
            title: img.caption || `Featured Image ${index + 1}`,
            creator: `@${profile?.username || profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || 'creator'}`,
            views: profile?.follower_count ? `${Math.max(1, Math.round(profile.follower_count / 10))} views` : 'Featured',
            image: img.image_url,
            heightClass: index % 11 === 0 ? 'tall' : index % 5 === 0 ? 'mid' : 'short',
          };
        }).filter((item) => !!item.image);

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

        <section className={styles.resultSection}>
          <div className={styles.reelGrid}>
            {filteredImages.map((item) => (
              <article key={item.id} className={`${styles.reelTile} ${styles[item.heightClass]}`}>
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
