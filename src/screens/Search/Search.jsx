import { useMemo, useState } from 'react';
import { Search as SearchIcon, Play, Image as ImageIcon, Heart, MessageCircle, Eye } from 'lucide-react';
import Chip from '../../components/Chip';
import Card from '../../components/Card';
import styles from './Search.module.css';

const FILTER_TABS = ['All', 'Creators', 'Brands', 'Reels', 'Posts'];

const TRENDING_TOPICS = ['Streetwear', 'Travel', 'Fitness', 'Gaming', 'Beauty', 'Food'];

const PREVIEW_FEED = [
  {
    id: 1,
    type: 'Reel',
    creator: '@priya.style',
    title: 'Summer streetwear fit checks',
    cover:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    views: '128K',
    likes: '12.9K',
    comments: '420',
    tags: ['Fashion', 'Streetwear'],
    mentions: [
      { brand: 'StyleCo', influencer: 'Priya Sharma', status: 'Active collab' },
      { brand: 'UrbanShine', influencer: 'Priya Sharma', status: 'Mentioned in caption' },
    ],
  },
  {
    id: 2,
    type: 'Post',
    creator: '@dev.bytes',
    title: 'Desk setup breakdown for creators',
    cover:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    views: '64K',
    likes: '8.1K',
    comments: '188',
    tags: ['Tech', 'Productivity'],
    mentions: [
      { brand: 'TechGear Pro', influencer: 'Dev Nair', status: 'Paid campaign' },
      { brand: 'FocusLabs', influencer: 'Dev Nair', status: 'Organic mention' },
    ],
  },
  {
    id: 3,
    type: 'Reel',
    creator: '@aisha.fit',
    title: '30-min home workout challenge',
    cover:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80',
    views: '214K',
    likes: '22.5K',
    comments: '960',
    tags: ['Fitness', 'Health'],
    mentions: [
      { brand: 'FitLife', influencer: 'Aisha Khan', status: 'Ambassador' },
      { brand: 'HydroMax', influencer: 'Aisha Khan', status: 'Story + Reel mention' },
    ],
  },
  {
    id: 4,
    type: 'Post',
    creator: '@meera.travels',
    title: '3-day Goa itinerary for creators',
    cover:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80',
    views: '92K',
    likes: '10.4K',
    comments: '302',
    tags: ['Travel', 'Lifestyle'],
    mentions: [{ brand: 'FlyNest', influencer: 'Meera Joshi', status: 'Sponsored post' }],
  },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [openMentionsId, setOpenMentionsId] = useState(null);

  const feed = useMemo(() => {
    return PREVIEW_FEED.filter((item) => {
      const q = query.trim().toLowerCase();
      const inSearch =
        !q ||
        item.creator.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        item.mentions.some(
          (m) =>
            m.brand.toLowerCase().includes(q) || m.influencer.toLowerCase().includes(q),
        );

      const inFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Reels' && item.type === 'Reel') ||
        (activeFilter === 'Posts' && item.type === 'Post') ||
        (activeFilter === 'Creators' && item.creator) ||
        (activeFilter === 'Brands' && item.mentions.length > 0);

      return inSearch && inFilter;
    });
  }, [activeFilter, query]);

  return (
    <main className="screen">
      <div className={styles.content}>
        <div className={styles.searchBarWrap}>
          <div className={styles.searchBar}>
            <SearchIcon size={18} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search reels, posts, creators, brands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search feed"
            />
          </div>
        </div>

        <div className={`scroll-x ${styles.filterRow}`}>
          {FILTER_TABS.map((tab) => (
            <Chip
              key={tab}
              label={tab}
              active={activeFilter === tab}
              onClick={() => setActiveFilter(tab)}
              variant="default"
            />
          ))}
        </div>

        <section className={styles.topicSection}>
          <h2 className="section-title">Trending Topics</h2>
          <div className={`scroll-x ${styles.topicRow}`}>
            {TRENDING_TOPICS.map((topic) => (
              <Chip key={topic} label={`# ${topic}`} variant="ghost" onClick={() => setQuery(topic)} />
            ))}
          </div>
        </section>

        <section className={styles.feedSection}>
          <h2 className="section-title">Instagram Preview Feed</h2>
          <div className={styles.feedGrid}>
            {feed.map((item) => {
              const mentionsOpen = openMentionsId === item.id;
              const isReel = item.type === 'Reel';
              return (
                <Card key={item.id} elevated className={styles.feedCard}>
                  <div className={styles.coverWrap}>
                    <img src={item.cover} alt={item.title} className={styles.coverImage} loading="lazy" />
                    <div className={styles.coverOverlay}>
                      <span className={styles.typeBadge}>
                        {isReel ? <Play size={12} /> : <ImageIcon size={12} />}
                        {item.type}
                      </span>
                      <span className={styles.creatorBadge}>{item.creator}</span>
                    </div>
                  </div>

                  <div className={styles.feedBody}>
                    <p className={styles.feedTitle}>{item.title}</p>

                    <div className={styles.metricRow}>
                      <span>
                        <Eye size={12} />
                        {item.views}
                      </span>
                      <span>
                        <Heart size={12} />
                        {item.likes}
                      </span>
                      <span>
                        <MessageCircle size={12} />
                        {item.comments}
                      </span>
                    </div>

                    <div className={styles.tagRow}>
                      {item.tags.map((tag) => (
                        <span key={tag} className={styles.tagPill}>
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={styles.mentionBtn}
                      onClick={() => setOpenMentionsId(mentionsOpen ? null : item.id)}
                    >
                      {mentionsOpen ? 'Hide' : 'Show'} brand × influencer mentions ({item.mentions.length})
                    </button>

                    {mentionsOpen && (
                      <div className={styles.mentionsList}>
                        {item.mentions.map((mention, idx) => (
                          <div key={`${mention.brand}-${idx}`} className={styles.mentionItem}>
                            <p className={styles.mentionLine}>
                              <strong>{mention.brand}</strong> × {mention.influencer}
                            </p>
                            <span className={styles.mentionStatus}>{mention.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {feed.length === 0 && <div className={styles.emptyState}>No preview results found.</div>}
        </section>
      </div>
    </main>
  );
}
