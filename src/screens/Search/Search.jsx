import { useMemo, useState } from 'react';
import { Search as SearchIcon, Hash, UserRound, Flame } from 'lucide-react';
import Chip from '../../components/Chip';
import styles from './Search.module.css';

const SEARCH_TYPES = [
  { key: 'accounts', label: 'Accounts', icon: UserRound },
  { key: 'hashtags', label: 'Hashtags', icon: Hash },
  { key: 'trending', label: 'Trending', icon: Flame },
];

const SUGGESTIONS = {
  accounts: ['spacex', 'nasa', 'adobe', 'github', 'openai'],
  hashtags: ['space', 'creatorhub', 'buildinpublic', 'reels', 'design'],
  trending: ['space station', 'mobile ui', 'creator analytics', 'fashion grid', 'ai tools'],
};

const GRID_ITEMS = Array.from({ length: 18 }, (_, i) => ({ id: i + 1 }));

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('accounts');
  const [focused, setFocused] = useState(false);

  const activeSuggestions = useMemo(() => {
    const list = SUGGESTIONS[activeType] || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => item.toLowerCase().includes(q));
  }, [activeType, query]);

  return (
    <main className="screen">
      <div className={styles.content}>
        <div className={styles.searchBarWrap}>
          <div className={styles.searchBar}>
            <SearchIcon size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              aria-label="Search"
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

        {focused && (
          <section className={styles.suggestions}>
            {activeSuggestions.map((item) => (
              <button key={item} className={styles.suggestionItem} onClick={() => setQuery(item)}>
                <SearchIcon size={14} />
                <span>{item}</span>
              </button>
            ))}
          </section>
        )}

        <section className={styles.gridSection}>
          <div className={styles.gridFeed}>
            {GRID_ITEMS.map((item) => (
              <div key={item.id} className={styles.gridTile} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
