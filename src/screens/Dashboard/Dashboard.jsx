import { useState } from 'react';
import { Share2, Download, MapPin, Play, Music, ExternalLink, LayoutGrid, PlayCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useProfileData } from '../../hooks/useProfileData';
import Avatar from '../../components/Avatar';
import Chip from '../../components/Chip';
import Card from '../../components/Card';
import SocialIcon from '../../components/SocialIcon';
import Skeleton from '../../components/Skeleton';
import { generateMediaKit } from '../../services/pdfExport';
import styles from './Dashboard.module.css';

// Real mock data based on @core.forge.in (Instagram) and @DrBro (YouTube)
const DEMO_PROFILE = {
  name: 'Core Forge',
  username: 'core.forge.in',
  tagline: 'Building things that matter',
  bio: 'Maker • Developer • Creator\nBuilding products at the intersection of tech & design.',
  location: 'India',
  niche_tags: ['Technology', 'Programming', 'Design'],
  avatar_url: null,
};

const DEMO_SOCIALS = [
  { platform: 'instagram', handle: 'core.forge.in', url: 'https://www.instagram.com/core.forge.in/', is_visible: true },
  { platform: 'youtube', handle: 'DrBro', url: 'https://www.youtube.com/@DrBro', is_visible: true },
];

// Instagram-style post grid mock (placeholder tiles with gradient)
const DEMO_POSTS = [
  { id: 'p1', type: 'image', thumb: null, likes: 312, caption: 'Building in public 🔨' },
  { id: 'p2', type: 'reel', thumb: null, likes: 841, caption: 'How I built this app' },
  { id: 'p3', type: 'image', thumb: null, likes: 524, caption: 'Design system 101' },
  { id: 'p4', type: 'reel', thumb: null, likes: 1203, caption: 'React tips & tricks' },
  { id: 'p5', type: 'image', thumb: null, likes: 289, caption: 'Weekend project' },
  { id: 'p6', type: 'reel', thumb: null, likes: 672, caption: 'Shipping fast' },
  { id: 'p7', type: 'image', thumb: null, likes: 445, caption: 'UI inspiration' },
  { id: 'p8', type: 'image', thumb: null, likes: 389, caption: 'Code review session' },
  { id: 'p9', type: 'reel', thumb: null, likes: 956, caption: 'Tutorial: Build this' },
];

const DEMO_YT_VIDEOS = [
  { id: 'v1', title: 'Building a Full Stack App in 1 Hour', views: '24K', thumb: null },
  { id: 'v2', title: 'React Best Practices 2024', views: '18K', thumb: null },
  { id: 'v3', title: 'How I Landed My First Client', views: '31K', thumb: null },
  { id: 'v4', title: 'My Dev Setup Tour', views: '14K', thumb: null },
];

const POST_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #2d1b69, #11998e)',
  'linear-gradient(135deg, #3a3a3a, #c9a96e)',
  'linear-gradient(135deg, #0f3460, #533483)',
  'linear-gradient(135deg, #1a472a, #2d6a4f)',
  'linear-gradient(135deg, #4a0e0e, #c9a96e)',
  'linear-gradient(135deg, #1b1b2f, #e43f5a)',
  'linear-gradient(135deg, #2c3e50, #3498db)',
  'linear-gradient(135deg, #1a1a1a, #525252)',
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { socialAccounts, dashboardModules, carouselImages, collabBrands, loading } = useProfileData();
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [postTab, setPostTab] = useState('posts'); // 'posts' | 'reels' | 'youtube'

  // Use real profile data if available, fall back to demo
  const displayProfile = (profile?.name) ? profile : DEMO_PROFILE;
  const displaySocials = socialAccounts.filter(s => s.is_visible && s.handle).length > 0
    ? socialAccounts.filter(s => s.is_visible && s.handle)
    : DEMO_SOCIALS;

  const shareProfile = async () => {
    const url = `https://ourcreatorhub.com/${displayProfile?.username || 'creator'}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent
    }
  };

  const downloadKit = async () => {
    setExporting(true);
    await generateMediaKit(displayProfile, null, carouselImages, collabBrands);
    setExporting(false);
  };

  if (loading && !profile) {
    return (
      <main className="screen">
        <div className="screen-content">
          <div className={styles.skeletonCard}>
            <Skeleton width={72} height={72} borderRadius="50%" />
            <Skeleton height={20} width="50%" style={{ margin: '12px 0 8px' }} />
            <Skeleton height={14} width="70%" />
          </div>
        </div>
      </main>
    );
  }

  const spotifyId = dashboardModules?.spotify_url?.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];

  const instagramSocial = displaySocials.find(s => s.platform === 'instagram');
  const youtubeSocial = displaySocials.find(s => s.platform === 'youtube');

  const displayPosts = postTab === 'reels'
    ? DEMO_POSTS.filter(p => p.type === 'reel')
    : DEMO_POSTS;

  return (
    <main className="screen">
      <div className={styles.screenContent}>

        {/* Profile Header Card */}
        <Card elevated className={styles.profileCard}>
          <div className={styles.profileCardInner}>
            <div className={styles.avatarWrap}>
              <Avatar
                src={displayProfile?.avatar_url}
                name={displayProfile?.name || 'Creator'}
                size={80}
              />
              {instagramSocial && (
                <div className={styles.igBadge}>
                  <SocialIcon platform="instagram" size={14} />
                </div>
              )}
            </div>

            <h1 className={styles.profileName}>{displayProfile?.name || 'Your Name'}</h1>
            <p className={styles.handle}>@{displayProfile?.username || 'creator'}</p>

            {displayProfile?.tagline && (
              <p className={styles.tagline}>{displayProfile.tagline}</p>
            )}

            {/* Stats row */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>12.4K</span>
                <span className={styles.statLabel}>Followers</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>284</span>
                <span className={styles.statLabel}>Posts</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>4.8%</span>
                <span className={styles.statLabel}>Engagement</span>
              </div>
            </div>

            {/* Niche tags */}
            {displayProfile?.niche_tags?.length > 0 && (
              <div className={styles.chipRow}>
                {displayProfile.niche_tags.map(tag => (
                  <Chip key={tag} label={tag} variant="filled" size="sm" />
                ))}
              </div>
            )}

            {/* Location */}
            {displayProfile?.location && (
              <div className={styles.locationRow}>
                <MapPin size={12} />
                <span>{displayProfile.location}</span>
              </div>
            )}

            {/* Bio */}
            {displayProfile?.bio && (
              <p className={styles.bio}>{displayProfile.bio}</p>
            )}

            {/* Social icons */}
            {displaySocials.length > 0 && (
              <div className={styles.socialsRow}>
                {displaySocials.map(s => (
                  <a
                    key={s.platform}
                    href={s.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialBtn}
                    aria-label={s.platform}
                  >
                    <SocialIcon platform={s.platform} size={20} />
                  </a>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className={styles.actionRow}>
              <button className={`btn btn-outline ${styles.actionBtn}`} onClick={shareProfile}>
                <Share2 size={16} />
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                className={`btn btn-primary ${styles.actionBtn}`}
                onClick={downloadKit}
                disabled={exporting}
              >
                <Download size={16} />
                {exporting ? '...' : 'Media Kit'}
              </button>
            </div>
          </div>
        </Card>

        {/* Content Grid — Instagram Posts + Reels */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Content</h2>
            {instagramSocial && (
              <a
                href={instagramSocial.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.viewAllLink}
              >
                View on Instagram <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Tab switcher */}
          <div className={styles.contentTabs}>
            <button
              className={`${styles.contentTab} ${postTab === 'posts' ? styles.contentTabActive : ''}`}
              onClick={() => setPostTab('posts')}
            >
              <LayoutGrid size={14} />
              Posts
            </button>
            <button
              className={`${styles.contentTab} ${postTab === 'reels' ? styles.contentTabActive : ''}`}
              onClick={() => setPostTab('reels')}
            >
              <Play size={14} />
              Reels
            </button>
            {youtubeSocial && (
              <button
                className={`${styles.contentTab} ${postTab === 'youtube' ? styles.contentTabActive : ''}`}
                onClick={() => setPostTab('youtube')}
              >
                <PlayCircle size={14} />
                YouTube
              </button>
            )}
          </div>

          {postTab !== 'youtube' ? (
            /* Instagram-style 3-col grid */
            <div className={styles.postsGrid}>
              {displayPosts.map((post, idx) => (
                <div key={post.id} className={styles.postTile} style={{ background: POST_GRADIENTS[idx % POST_GRADIENTS.length] }}>
                  {post.type === 'reel' && (
                    <div className={styles.reelIndicator}>
                      <Play size={10} fill="white" color="white" />
                    </div>
                  )}
                  <div className={styles.postOverlay}>
                    <span className={styles.postLikes}>♥ {post.likes >= 1000 ? `${(post.likes / 1000).toFixed(1)}K` : post.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* YouTube videos list */
            <div className={styles.ytList}>
              {DEMO_YT_VIDEOS.map((vid, idx) => (
                <a
                  key={vid.id}
                  href={youtubeSocial?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ytCard}
                >
                  <div className={styles.ytThumb} style={{ background: POST_GRADIENTS[(idx + 2) % POST_GRADIENTS.length] }}>
                    <div className={styles.ytPlayBtn}>
                      <Play size={18} fill="white" color="white" />
                    </div>
                  </div>
                  <div className={styles.ytInfo}>
                    <p className={styles.ytTitle}>{vid.title}</p>
                    <p className={styles.ytViews}>{vid.views} views</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Pinned Carousel */}
        {dashboardModules?.carousel_enabled && carouselImages.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Featured Work</h2>
            </div>
            <div className="scroll-x">
              {carouselImages.map(img => (
                <div key={img.id} className={styles.carouselTile}>
                  <img
                    src={img.image_url}
                    alt={img.caption || 'Featured work'}
                    loading="lazy"
                    className={styles.carouselImg}
                  />
                  {img.caption && <p className={styles.carouselCaption}>{img.caption}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Spotify Card */}
        {dashboardModules?.spotify_enabled && dashboardModules.spotify_url && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Playlist</h2>
            </div>
            <Card outlined className={styles.spotifyCard}>
              <div className={styles.spotifyInner}>
                <div className={styles.spotifyIcon}>
                  <SocialIcon platform="spotify" size={32} />
                </div>
                <div className={styles.spotifyInfo}>
                  <p className={styles.spotifyLabel}>Spotify Playlist</p>
                  <p className={styles.spotifyName}>My Creator Mix</p>
                </div>
                <a
                  href={dashboardModules.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-primary ${styles.spotifyBtn}`}
                >
                  <Music size={14} />
                  Listen
                </a>
              </div>
            </Card>
          </section>
        )}

        {/* Collab Badges */}
        {collabBrands.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Worked With</h2>
            </div>
            <div className="scroll-x">
              {collabBrands.map(brand => (
                <div key={brand.id} className={styles.brandBadge}>
                  {brand.brand_logo_url ? (
                    <img src={brand.brand_logo_url} alt={brand.brand_name} loading="lazy" className={styles.brandLogo} />
                  ) : (
                    <span className={styles.brandInitial}>{brand.brand_name[0]}</span>
                  )}
                  <span className={styles.brandName}>{brand.brand_name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
