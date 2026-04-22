import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, Video, Users, Briefcase } from 'lucide-react';
import Chip from '../../components/Chip';
import { loadAdminData } from '../../services/adminStore';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import styles from './Search.module.css';

const SEARCH_TYPES = [
  { key: 'reels', label: 'Reels', icon: Video },
  { key: 'influencers', label: 'Influencers', icon: Users },
  { key: 'brands', label: 'Brand collabs', icon: Briefcase },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('reels');
  const [reels, setReels] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const adminData = await loadAdminData();
      let nextReels = [];
      let nextInfluencers = [];
      let nextBrands = [];

      if (isSupabaseEnabled) {
        const [imageRes, creatorRes, dealRes] = await Promise.all([
          supabase.from('creator_carousel_images').select('*').order('created_at', { ascending: false }).limit(60),
          supabase.from('creator_profiles').select('*').order('updated_at', { ascending: false }).limit(200),
          supabase.from('creator_hub_deals').select('*').order('created_at', { ascending: false }).limit(200),
        ]);

        const creatorMap = new Map((creatorRes.data || []).map((c) => [c.id, c]));
        nextReels = (imageRes.data || []).map((img, index) => {
          const profile = creatorMap.get(img.creator_profile_id);
          return {
            id: img.id,
            title: img.caption || `Featured Reel ${index + 1}`,
            creator: `@${profile?.username || profile?.display_name?.toLowerCase().replace(/\s+/g, '_') || 'creator'}`,
            views: profile?.follower_count ? `${Math.max(1, Math.round(profile.follower_count / 10))} views` : 'Featured',
            image: img.image_url,
            heightClass: index % 11 === 0 ? 'tall' : index % 5 === 0 ? 'mid' : 'short',
          };
        }).filter((item) => !!item.image);

        nextInfluencers = (creatorRes.data || []).map((row) => ({
          id: row.id,
          name: row.display_name || row.username || 'Creator',
          handle: `@${row.username || String(row.display_name || 'creator').toLowerCase().replace(/\s+/g, '_')}`,
          niche: Array.isArray(row.niche_tags) ? row.niche_tags.join(', ') : row.niche_tags || 'Creator',
          followers: Number(row.follower_count || 0).toLocaleString('en-IN'),
          recent: row.tagline || row.base_city || 'Available for collaborations',
        }));

        nextBrands = (dealRes.data || []).map((row) => ({
          id: row.id,
          brand: row.brand_name || row.brand || 'Brand',
          campaign: row.deliverables || row.requirement || row.category || 'Campaign',
          budget: `INR ${Number(row.payout_max || row.payout_min || row.payout || 0).toLocaleString('en-IN')}`,
          platform: row.platform || 'Any',
        }));
      }

      if (nextInfluencers.length === 0) {
        nextInfluencers = (adminData.creators || []).map((creator) => ({
          id: creator.id,
          name: creator.name || 'Creator',
          handle: creator.username ? `@${creator.username}` : `@${String(creator.name || 'creator').toLowerCase().replace(/\s+/g, '_')}`,
          niche: creator.niche || 'Creator',
          followers: Number(creator.followers || 0).toLocaleString('en-IN'),
          recent: creator.city || 'Available for collaborations',
        }));
      }

      if (nextBrands.length === 0) {
        nextBrands = (adminData.deals || []).map((deal) => ({
          id: deal.id,
          brand: deal.brand_name || deal.brand || 'Brand',
          campaign: deal.deliverables || deal.requirement || deal.category || 'Campaign',
          budget: `INR ${Number(deal.payout_max || deal.payout_min || deal.payout || 0).toLocaleString('en-IN')}`,
          platform: deal.platform || 'Any',
        }));
      }

      if (mounted) {
        setReels(nextReels);
        setInfluencers(nextInfluencers);
        setBrands(nextBrands);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredReels = useMemo(() => reels.filter((item) => {
    const q = query.toLowerCase();
    return !q || [item.title, item.creator].some((value) => value.toLowerCase().includes(q));
  }), [query, reels]);

  const filteredInfluencers = useMemo(() => influencers.filter((item) => {
    const q = query.toLowerCase();
    return !q || [item.name, item.handle, item.niche, item.recent].some((value) => value.toLowerCase().includes(q));
  }), [query, influencers]);

  const filteredBrands = useMemo(() => brands.filter((item) => {
    const q = query.toLowerCase();
    return !q || [item.brand, item.campaign, item.platform].some((value) => value.toLowerCase().includes(q));
  }), [query, brands]);

  return (
    <main className="screen">
      <div className={styles.content}>
        <div className={styles.searchBarWrap}>
          <div className={styles.searchBar}>
            <SearchIcon size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search reels, influencers, brands"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search influencers and reels"
            />
          </div>
        </div>

        <div className={`scroll-x ${styles.filterRow}`}>
          {SEARCH_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Chip
                key={type.key}
                label={type.label}
                active={activeType === type.key}
                onClick={() => setActiveType(type.key)}
                variant="default"
                icon={<Icon size={12} />}
              />
            );
          })}
        </div>

        <section className={styles.resultSection}>
          {activeType === 'reels' && (
            <div className={styles.reelGrid}>
              {filteredReels.map((item) => (
                <article key={item.id} className={`${styles.reelTile} ${styles[item.heightClass]}`}>
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <div className={styles.reelOverlay}>
                    <p>{item.creator}</p>
                    <span>{item.views}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeType === 'influencers' && (
            <div className={styles.resultList}>
              {filteredInfluencers.map((item) => (
                <article key={item.id} className={styles.listItem}>
                  <div>
                    <h3>{item.name}</h3>
                    <p className={styles.listMeta}>{item.handle} - {item.niche}</p>
                  </div>
                  <div className={styles.listRight}>
                    <span>{item.followers}</span>
                    <small>{item.recent}</small>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeType === 'brands' && (
            <div className={styles.resultList}>
              {filteredBrands.map((item) => (
                <article key={item.id} className={styles.listItem}>
                  <div>
                    <h3>{item.brand}</h3>
                    <p className={styles.listMeta}>{item.campaign}</p>
                  </div>
                  <div className={styles.listRight}>
                    <span>{item.budget}</span>
                    <small>{item.platform}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
