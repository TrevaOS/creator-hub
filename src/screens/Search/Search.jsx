import { useState, useMemo } from 'react';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import Avatar from '../../components/Avatar';
import Chip from '../../components/Chip';
import Card from '../../components/Card';
import styles from './Search.module.css';

const FILTER_TABS = ['All', 'Creators', 'Brands', 'Deals'];

const TRENDING_NICHES = ['Fashion', 'Fitness', 'Food', 'Travel', 'Tech', 'Gaming', 'Beauty', 'Finance', 'Music', 'Art'];

const FEATURED_CREATORS = [
  { id: 1, name: 'Priya Sharma', niche: 'Fashion', followers: '145K', avatar: null, collabs: 12 },
  { id: 2, name: 'Rahul Verma', niche: 'Tech', followers: '89K', avatar: null, collabs: 8 },
  { id: 3, name: 'Aisha Khan', niche: 'Fitness', followers: '210K', avatar: null, collabs: 20 },
  { id: 4, name: 'Dev Nair', niche: 'Food', followers: '67K', avatar: null, collabs: 5 },
  { id: 5, name: 'Meera Joshi', niche: 'Travel', followers: '182K', avatar: null, collabs: 15 },
  { id: 6, name: 'Arjun Singh', niche: 'Gaming', followers: '320K', avatar: null, collabs: 3 },
];

const RECENT_COLLABS = [
  { creator: 'Priya Sharma', brand: 'StyleCo', deliverable: '2 Reels + 3 Stories', platform: 'instagram' },
  { creator: 'Rahul Verma', brand: 'TechGear Pro', deliverable: '1 Video Review', platform: 'youtube' },
  { creator: 'Aisha Khan', brand: 'FitLife', deliverable: '4 Stories + 1 Reel', platform: 'instagram' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('followers');

  const isSearching = query.trim().length > 0;

  const filteredCreators = useMemo(() => {
    if (!isSearching) return FEATURED_CREATORS;
    return FEATURED_CREATORS.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.niche.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, isSearching]);

  return (
    <main className="screen">
      <div className={styles.content}>

        {/* Search bar */}
        <div className={styles.searchBarWrap}>
          <div className={styles.searchBar}>
            <SearchIcon size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search creators, brands, niches..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className={`scroll-x ${styles.filterRow}`}>
          {FILTER_TABS.map(tab => (
            <Chip
              key={tab}
              label={tab}
              active={activeFilter === tab}
              onClick={() => setActiveFilter(tab)}
              variant="default"
            />
          ))}
        </div>

        {!isSearching ? (
          <>
            {/* Trending niches */}
            <section className={styles.section}>
              <h2 className="section-title" style={{ marginBottom: 12 }}>Trending Niches</h2>
              <div className={`scroll-x`}>
                {TRENDING_NICHES.map(niche => (
                  <Chip
                    key={niche}
                    label={`# ${niche}`}
                    variant="ghost"
                    onClick={() => setQuery(niche)}
                  />
                ))}
              </div>
            </section>

            {/* Featured Creators grid */}
            <section className={styles.section}>
              <h2 className="section-title" style={{ marginBottom: 12 }}>Featured Creators</h2>
              <div className={styles.creatorsGrid}>
                {FEATURED_CREATORS.map(creator => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </section>

            {/* Recent Collabs */}
            <section className={styles.section}>
              <h2 className="section-title" style={{ marginBottom: 12 }}>Recent Collabs</h2>
              <div className={styles.collabList}>
                {RECENT_COLLABS.map((c, i) => (
                  <Card key={i} outlined className={styles.collabCard}>
                    <div className={styles.collabInner}>
                      <div className={styles.collabAvatars}>
                        <Avatar name={c.creator} size={36} />
                        <span className={styles.collabX}>×</span>
                        <div className={styles.brandIcon}>
                          {c.brand[0]}
                        </div>
                      </div>
                      <div className={styles.collabInfo}>
                        <p className={styles.collabNames}>{c.creator} × {c.brand}</p>
                        <span className={styles.collabDeliverable}>{c.deliverable}</span>
                      </div>
                      <div className={styles.collabPlatformIcon}>
                        <span style={{ fontSize: 18 }}>
                          {c.platform === 'instagram' ? '📸' : '▶️'}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Sort bar */}
            <div className={styles.sortBar}>
              <SlidersHorizontal size={14} />
              <span>Sort by:</span>
              {['followers', 'collabs', 'location'].map(s => (
                <button
                  key={s}
                  className={`${styles.sortBtn} ${sortBy === s ? styles.sortActive : ''}`}
                  onClick={() => setSortBy(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Search results */}
            {filteredCreators.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No results for "{query}"</p>
              </div>
            ) : (
              <div className={styles.creatorsGrid}>
                {filteredCreators.map(creator => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function CreatorCard({ creator }) {
  return (
    <Card elevated className={styles.creatorCard} onClick={() => {}}>
      <div className={styles.creatorCardInner}>
        <Avatar name={creator.name} size={52} />
        <div className={styles.creatorInfo}>
          <p className={styles.creatorName}>{creator.name}</p>
          <Chip label={creator.niche} variant="ghost" size="sm" />
        </div>
        <div className={styles.creatorStats}>
          <p className={styles.followerCount}>{creator.followers}</p>
          <p className={styles.followerLabel}>followers</p>
        </div>
      </div>
      {creator.collabs > 0 && (
        <div className={styles.collabPill}>
          🤝 {creator.collabs} collabs
        </div>
      )}
    </Card>
  );
}
