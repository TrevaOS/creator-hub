import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Download, Zap } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase';
import SocialIcon from '../../components/SocialIcon';
import { generateAnalyticsReport } from '../../services/pdfExport';
import styles from './Analytics.module.css';

/* ── STATIC DEMO DATA ──────────────────────────────────────── */
const PLATFORMS = ['Instagram', 'YouTube', 'Twitter', 'TikTok'];

const PLATFORM_DATA = {
  Instagram: {
    totalFollowers: '12.5K',
    engagementRate: 4.2,
    stats: [
      { label: 'Reach',       value: '125K', delta: 12, icon: '👁️' },
      { label: 'Impressions', value: '340K', delta: 8,  icon: '📊' },
      { label: 'Likes',       value: '18.5K',delta: 15, icon: '❤️' },
      { label: 'Comments',    value: '1.2K', delta: 7,  icon: '💬' },
      { label: 'Saves',       value: '4.3K', delta: 22, icon: '🔖' },
      { label: 'Shares',      value: '890',  delta: -3, icon: '↗️' },
    ],
    growth: [
      { month: 'Nov', followers: 9800  },
      { month: 'Dec', followers: 10400 },
      { month: 'Jan', followers: 11200 },
      { month: 'Feb', followers: 10900 },
      { month: 'Mar', followers: 11800 },
      { month: 'Apr', followers: 12500 },
    ],
    topPosts: [
      { id: 1, likes: '4.2K', comments: '380', reach: '32K', bg: 'linear-gradient(135deg,#1a0533,#0d0d2b)' },
      { id: 2, likes: '3.1K', comments: '210', reach: '24K', bg: 'linear-gradient(135deg,#0a1628,#0f3460)' },
      { id: 3, likes: '2.8K', comments: '190', reach: '21K', bg: 'linear-gradient(135deg,#16213e,#1a472a)' },
    ],
  },
  YouTube: {
    totalFollowers: '8.2K',
    engagementRate: 6.8,
    stats: [
      { label: 'Views',       value: '120K',   delta: 20, icon: '▶️' },
      { label: 'Watch Time',  value: '3.2K hrs',delta: 18, icon: '⏱️' },
      { label: 'Likes',       value: '8.4K',   delta: 12, icon: '👍' },
      { label: 'Comments',    value: '620',    delta: 5,  icon: '💬' },
      { label: 'Subscribers', value: '+1.2K',  delta: 28, icon: '🔔' },
      { label: 'Shares',      value: '340',    delta: 9,  icon: '↗️' },
    ],
    growth: [
      { month: 'Nov', followers: 7200 },
      { month: 'Dec', followers: 7600 },
      { month: 'Jan', followers: 7900 },
      { month: 'Feb', followers: 8000 },
      { month: 'Mar', followers: 8100 },
      { month: 'Apr', followers: 8200 },
    ],
    topPosts: [
      { id: 1, likes: '2.1K', comments: '180', reach: '45K', bg: 'linear-gradient(135deg,#4a0e0e,#c9a96e)' },
      { id: 2, likes: '1.8K', comments: '140', reach: '38K', bg: 'linear-gradient(135deg,#0f0c29,#302b63)' },
      { id: 3, likes: '1.4K', comments: '98',  reach: '29K', bg: 'linear-gradient(135deg,#16213e,#1a0533)' },
    ],
  },
  Twitter: {
    totalFollowers: '3.6K',
    engagementRate: 2.1,
    stats: [
      { label: 'Impressions',   value: '42K',  delta: 5,  icon: '👁️' },
      { label: 'Retweets',      value: '890',  delta: -2, icon: '🔄' },
      { label: 'Likes',         value: '3.4K', delta: 11, icon: '❤️' },
      { label: 'Replies',       value: '240',  delta: 3,  icon: '💬' },
      { label: 'Profile Visits',value: '5.1K', delta: 14, icon: '👤' },
      { label: 'Link Clicks',   value: '780',  delta: -6, icon: '🔗' },
    ],
    growth: [
      { month: 'Nov', followers: 3200 },
      { month: 'Dec', followers: 3400 },
      { month: 'Jan', followers: 3350 },
      { month: 'Feb', followers: 3500 },
      { month: 'Mar', followers: 3480 },
      { month: 'Apr', followers: 3600 },
    ],
    topPosts: [
      { id: 1, likes: '1.2K', comments: '80', reach: '12K', bg: 'linear-gradient(135deg,#0a1628,#1a0533)' },
      { id: 2, likes: '980',  comments: '65', reach: '9K',  bg: 'linear-gradient(135deg,#1a0533,#0d0d2b)' },
    ],
  },
  TikTok: {
    totalFollowers: '15.6K',
    engagementRate: 8.6,
    stats: [
      { label: 'Views',     value: '280K', delta: 35, icon: '▶️' },
      { label: 'Likes',     value: '24K',  delta: 40, icon: '❤️' },
      { label: 'Comments',  value: '1.8K', delta: 18, icon: '💬' },
      { label: 'Shares',    value: '3.2K', delta: 25, icon: '↗️' },
      { label: 'Followers', value: '+3.4K',delta: 55, icon: '👥' },
      { label: 'Watch Time',value: '89%',  delta: 6,  icon: '⏱️' },
    ],
    growth: [
      { month: 'Nov', followers: 6000  },
      { month: 'Dec', followers: 7200  },
      { month: 'Jan', followers: 9100  },
      { month: 'Feb', followers: 10400 },
      { month: 'Mar', followers: 12800 },
      { month: 'Apr', followers: 15600 },
    ],
    topPosts: [
      { id: 1, likes: '8.4K', comments: '640', reach: '92K', bg: 'linear-gradient(135deg,#0f0c29,#4a0e8f)' },
      { id: 2, likes: '6.1K', comments: '410', reach: '68K', bg: 'linear-gradient(135deg,#1a0533,#0f3460)' },
      { id: 3, likes: '5.4K', comments: '380', reach: '54K', bg: 'linear-gradient(135deg,#16213e,#0a1628)' },
    ],
  },
};

/* ── CIRCULAR PROGRESS ─────────────────────────────────────── */
function CircularProgress({ value, max = 15 }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const filled = Math.min((value / max) * circ, circ);

  return (
    <svg width="106" height="106" viewBox="0 0 106 106">
      <circle cx="53" cy="53" r={radius} fill="none" stroke="var(--bg-secondary)" strokeWidth="9" />
      <defs>
        <linearGradient id="engGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <circle
        cx="53" cy="53" r={radius}
        fill="none"
        stroke="url(#engGrad)"
        strokeWidth="9"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 53 53)"
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
      <text x="53" y="53" textAnchor="middle" dominantBaseline="central"
        fill="var(--text-primary)" fontSize="17" fontWeight="800">
        {value}%
      </text>
    </svg>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipVal}>{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

/* ── MAIN ──────────────────────────────────────────────────── */
export default function Analytics() {
  const { profile, user } = useAuth();
  const [activePlatform, setActivePlatform] = useState('Instagram');
  const [exporting, setExporting] = useState(false);
  const [connected, setConnected] = useState([]);
  const [liveStats, setLiveStats] = useState(null);

  const data = PLATFORM_DATA[activePlatform];
  const platformKey = activePlatform.toLowerCase();

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('creator_oauth_tokens')
      .select('platform')
      .eq('user_id', user.id)
      .then(({ data: rows }) => {
        if (rows) setConnected(rows.map(r => r.platform));
      });
  }, [user?.id]);

  // Fetch live Instagram stats when IG tab active + connected
  useEffect(() => {
    if (activePlatform !== 'Instagram' || !connected.includes('instagram') || !user?.id) {
      setLiveStats(null);
      return;
    }
    supabase
      .from('creator_oauth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .single()
      .then(async ({ data: row }) => {
        if (!row?.access_token) return;
        try {
          const fields = 'username,followers_count,media_count,biography';
          const res = await fetch(`https://graph.instagram.com/me?fields=${fields}&access_token=${row.access_token}`);
          if (res.ok) {
            const json = await res.json();
            setLiveStats({ followers: json.followers_count, posts: json.media_count });
          }
        } catch { /* ignore */ }
      });
  }, [activePlatform, connected, user?.id]);

  const displayFollowers = liveStats
    ? formatK(liveStats.followers)
    : data.totalFollowers;

  const engagementLabel =
    data.engagementRate > 5 ? 'Excellent' :
    data.engagementRate > 3 ? 'Good' : 'Average';

  const engClass =
    data.engagementRate > 5 ? styles.goodBadge :
    data.engagementRate > 3 ? styles.avgBadge : styles.lowBadge;

  const handleExport = async () => {
    setExporting(true);
    await generateAnalyticsReport(profile, null, 'Last 30 days');
    setExporting(false);
  };

  return (
    <main className="screen">
      <div className={styles.content}>

        {/* ── HEADER ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Analytics</h1>
            <p>Last 30 days</p>
          </div>
          <button className={`btn ${styles.exportBtn}`} onClick={handleExport} disabled={exporting}>
            <Download size={14} />
            {exporting ? '...' : 'Export'}
          </button>
        </div>

        {/* ── PLATFORM TABS ── */}
        <div className={`scroll-x ${styles.platformScroll}`}>
          {PLATFORMS.map(p => {
            const pk = p.toLowerCase();
            const isConnected = connected.includes(pk);
            return (
              <button
                key={p}
                className={`${styles.platformTab} ${activePlatform === p ? styles.platformTabActive : ''} ${isConnected ? styles.platformTabConnected : ''}`}
                onClick={() => setActivePlatform(p)}
              >
                <SocialIcon platform={pk} size={14} />
                {p}
              </button>
            );
          })}
        </div>

        {/* ── SUMMARY BANNER ── */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryLeft}>
            <h2>{displayFollowers}</h2>
            <p>
              {activePlatform} followers
              {connected.includes(platformKey) && (
                <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>
                  <Zap size={11} style={{ display: 'inline' }} /> live
                </span>
              )}
            </p>
          </div>
          <div className={styles.summaryEngagement}>
            <p className={styles.bigNum}>{data.engagementRate}%</p>
            <p className={styles.bigLabel}>Engagement</p>
            <span className={styles.engBadge}>{engagementLabel}</span>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div className={styles.statsGrid}>
          {data.stats.map(stat => (
            <div key={stat.label} className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statIcon}>{stat.icon}</span>
                <span className={`${styles.statDelta} ${stat.delta >= 0 ? styles.up : styles.down}`}>
                  {stat.delta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(stat.delta)}%
                </span>
              </div>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── ENGAGEMENT RING ── */}
        <div className={styles.engCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Engagement Rate</h3>
            <span className={styles.cardBadge}>{activePlatform}</span>
          </div>
          <div className={styles.engInner}>
            <CircularProgress value={data.engagementRate} max={15} />
            <div className={styles.engInfo}>
              <p className={styles.engDesc}>
                Your engagement is <strong>{data.engagementRate}%</strong> — above industry average for creators in your niche.
              </p>
              <span className={`${styles.engBadgePill} ${engClass}`}>{engagementLabel}</span>
            </div>
          </div>
        </div>

        {/* ── GROWTH CHART ── */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Follower Growth</h3>
            <span className={styles.cardBadge}>6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={data.growth} margin={{ top: 8, right: 6, left: -26, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="followers"
                stroke="#7C3AED"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ fill: '#7C3AED', r: 3.5, strokeWidth: 0 }}
                activeDot={{ r: 5.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── TOP POSTS ── */}
        <section>
          <div className="section-header">
            <h2 className="section-title">Top Posts</h2>
          </div>
          <div className="scroll-x">
            {data.topPosts.map(post => (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postThumb} style={{ background: post.bg }}>
                  {post.thumb && (
                    <img src={post.thumb} alt="" className={styles.postThumbImg} />
                  )}
                  <div className={styles.postStatsBadges}>
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </div>
                <div className={styles.postStats}>
                  <span>👁️ {post.reach} reach</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
