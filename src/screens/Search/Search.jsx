import { useMemo, useState } from 'react';
import { Search as SearchIcon, Hash, UserRound, Flame, Video, Users, Briefcase } from 'lucide-react';
import Chip from '../../components/Chip';
import styles from './Search.module.css';

const SEARCH_TYPES = [
  { key: 'reels', label: 'Reels', icon: Video },
  { key: 'influencers', label: 'Influencers', icon: Users },
  { key: 'brands', label: 'Brand collabs', icon: Briefcase },
];

const REEL_RESULTS = [
  { id: 'r1', title: 'Street style edit for launch', creator: '@nikita.k', likes: '18.4k', views: '152k', platform: 'Instagram' },
  { id: 'r2', title: '5 travel looks in 15 seconds', creator: '@travelwitharun', likes: '29.6k', views: '224k', platform: 'Instagram' },
  { id: 'r3', title: 'Home workout routine reel', creator: '@fitlaura', likes: '22.0k', views: '190k', platform: 'Instagram' },
];

const INFLUENCER_RESULTS = [
  { id: 'i1', name: 'Aisha Kumar', handle: '@aisha.influencer', niche: 'Fashion', followers: '98k', recent: 'StyleCo campaign' },
  { id: 'i2', name: 'Rohan Patel', handle: '@rohancreates', niche: 'Tech', followers: '54k', recent: 'Gadget launch reel' },
  { id: 'i3', name: 'Meera Joshi', handle: '@meera_moves', niche: 'Fitness', followers: '120k', recent: 'Wellness collab' },
];

const BRAND_RESULTS = [
  { id: 'b1', brand: 'StyleCo', campaign: 'Summer collection reels', budget: '₹45K', platform: 'Instagram' },
  { id: 'b2', brand: 'SoundWave', campaign: 'New launch unboxing', budget: '₹35K', platform: 'YouTube' },
  { id: 'b3', brand: 'FuelX', campaign: 'Fitness partnership', budget: '₹28K', platform: 'Instagram' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('reels');

  const filteredReels = useMemo(() => REEL_RESULTS.filter((item) => {
    const q = query.toLowerCase();
    return !q || [item.title, item.creator, item.platform].some((value) => value.toLowerCase().includes(q));
  }), [query]);

  const filteredInfluencers = useMemo(() => INFLUENCER_RESULTS.filter((item) => {
    const q = query.toLowerCase();
    return !q || [item.name, item.handle, item.niche, item.recent].some((value) => value.toLowerCase().includes(q));
  }), [query]);

  const filteredBrands = useMemo(() => BRAND_RESULTS.filter((item) => {
    const q = query.toLowerCase();
    return !q || [item.brand, item.campaign, item.platform].some((value) => value.toLowerCase().includes(q));
  }), [query]);

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
            <div className={styles.resultGrid}>
              {filteredReels.map((item) => (
                <article key={item.id} className={styles.resultCard}>
                  <div className={styles.resultHero} />
                  <div className={styles.resultBody}>
                    <p className={styles.resultLabel}>Instagram Reel</p>
                    <h3 className={styles.resultTitle}>{item.title}</h3>
                    <p className={styles.resultMeta}>{item.creator} • {item.platform}</p>
                    <div className={styles.resultStats}>
                      <span>{item.likes} likes</span>
                      <span>{item.views} views</span>
                    </div>
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
                    <p className={styles.listMeta}>{item.handle} · {item.niche}</p>
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
