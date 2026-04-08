import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import { generateAnalyticsReport } from '../../services/pdfExport';
import styles from './Analytics.module.css';

const PLATFORMS = ['Instagram', 'YouTube', 'Twitter', 'TikTok'];

const PLATFORM_DATA = {
  Instagram: {
    stats: [
      { label: 'Reach', value: '125K', delta: 12, icon: '👁️' },
      { label: 'Impressions', value: '340K', delta: 8, icon: '📊' },
      { label: 'Likes', value: '18.5K', delta: 15, icon: '❤️' },
      { label: 'Comments', value: '1.2K', delta: 7, icon: '💬' },
      { label: 'Saves', value: '4.3K', delta: 22, icon: '🔖' },
      { label: 'Shares', value: '890', delta: -3, icon: '↗️' },
    ],
    engagementRate: 4.2,
    growth: [
      { month: 'Nov', followers: 9800 },
      { month: 'Dec', followers: 10400 },
      { month: 'Jan', followers: 11200 },
      { month: 'Feb', followers: 10900 },
      { month: 'Mar', followers: 11800 },
      { month: 'Apr', followers: 12500 },
    ],
    topPosts: [
      { id: 1, likes: '4.2K', comments: '380', reach: '32K', bg: '#C9A96E' },
      { id: 2, likes: '3.1K', comments: '210', reach: '24K', bg: '#9E9E9E' },
      { id: 3, likes: '2.8K', comments: '190', reach: '21K', bg: '#2C2C2C' },
      { id: 4, likes: '2.2K', comments: '142', reach: '18K', bg: '#C9A96E' },
    ],
  },
  YouTube: {
    stats: [
      { label: 'Views', value: '120K', delta: 20, icon: '▶️' },
      { label: 'Watch Time', value: '3.2K hrs', delta: 18, icon: '⏱️' },
      { label: 'Likes', value: '8.4K', delta: 12, icon: '👍' },
      { label: 'Comments', value: '620', delta: 5, icon: '💬' },
      { label: 'Subscribers', value: '+1.2K', delta: 28, icon: '🔔' },
      { label: 'Shares', value: '340', delta: 9, icon: '↗️' },
    ],
    engagementRate: 6.8,
    growth: [
      { month: 'Nov', followers: 7200 },
      { month: 'Dec', followers: 7600 },
      { month: 'Jan', followers: 7900 },
      { month: 'Feb', followers: 8000 },
      { month: 'Mar', followers: 8100 },
      { month: 'Apr', followers: 8200 },
    ],
    topPosts: [
      { id: 1, likes: '2.1K', comments: '180', reach: '45K', bg: '#FF4444' },
      { id: 2, likes: '1.8K', comments: '140', reach: '38K', bg: '#9E9E9E' },
      { id: 3, likes: '1.4K', comments: '98', reach: '29K', bg: '#2C2C2C' },
    ],
  },
  Twitter: {
    stats: [
      { label: 'Impressions', value: '42K', delta: 5, icon: '👁️' },
      { label: 'Retweets', value: '890', delta: -2, icon: '🔄' },
      { label: 'Likes', value: '3.4K', delta: 11, icon: '❤️' },
      { label: 'Replies', value: '240', delta: 3, icon: '💬' },
      { label: 'Profile Visits', value: '5.1K', delta: 14, icon: '👤' },
      { label: 'Link Clicks', value: '780', delta: -6, icon: '🔗' },
    ],
    engagementRate: 2.1,
    growth: [
      { month: 'Nov', followers: 3200 },
      { month: 'Dec', followers: 3400 },
      { month: 'Jan', followers: 3350 },
      { month: 'Feb', followers: 3500 },
      { month: 'Mar', followers: 3480 },
      { month: 'Apr', followers: 3600 },
    ],
    topPosts: [
      { id: 1, likes: '1.2K', comments: '80', reach: '12K', bg: '#333' },
      { id: 2, likes: '980', comments: '65', reach: '9K', bg: '#555' },
      { id: 3, likes: '760', comments: '44', reach: '7K', bg: '#777' },
    ],
  },
  TikTok: {
    stats: [
      { label: 'Views', value: '280K', delta: 35, icon: '▶️' },
      { label: 'Likes', value: '24K', delta: 40, icon: '❤️' },
      { label: 'Comments', value: '1.8K', delta: 18, icon: '💬' },
      { label: 'Shares', value: '3.2K', delta: 25, icon: '↗️' },
      { label: 'Followers', value: '+3.4K', delta: 55, icon: '👥' },
      { label: 'Watch Time', value: '89%', delta: 6, icon: '⏱️' },
    ],
    engagementRate: 8.6,
    growth: [
      { month: 'Nov', followers: 6000 },
      { month: 'Dec', followers: 7200 },
      { month: 'Jan', followers: 9100 },
      { month: 'Feb', followers: 10400 },
      { month: 'Mar', followers: 12800 },
      { month: 'Apr', followers: 15600 },
    ],
    topPosts: [
      { id: 1, likes: '8.4K', comments: '640', reach: '92K', bg: '#C9A96E' },
      { id: 2, likes: '6.1K', comments: '410', reach: '68K', bg: '#2C2C2C' },
      { id: 3, likes: '5.4K', comments: '380', reach: '54K', bg: '#9E9E9E' },
    ],
  },
};

function CircularProgress({ value, max = 100 }) {
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const progress = (value / max) * circ;

  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={radius}
        fill="none"
        stroke="var(--cane)"
        strokeWidth="10"
        strokeDasharray={`${progress} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="55" y="55" textAnchor="middle" dominantBaseline="central" fill="var(--text-primary)" fontSize="18" fontWeight="700">
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

export default function Analytics() {
  const { profile } = useAuth();
  const [activePlatform, setActivePlatform] = useState('Instagram');
  const [exporting, setExporting] = useState(false);

  const data = PLATFORM_DATA[activePlatform];

  const handleExport = async () => {
    setExporting(true);
    await generateAnalyticsReport(profile, null, 'Last 30 days');
    setExporting(false);
  };

  return (
    <main className="screen">
      <div className={styles.content}>

        {/* Header */}
        <div className={styles.header}>
          <h1 className="text-title">Analytics</h1>
          <button className={`btn btn-outline ${styles.exportBtn}`} onClick={handleExport} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Report'}
          </button>
        </div>

        {/* Platform selector */}
        <div className={`scroll-x ${styles.platformScroll}`}>
          {PLATFORMS.map(p => (
            <Chip
              key={p}
              label={p}
              active={activePlatform === p}
              onClick={() => setActivePlatform(p)}
              variant="default"
              size="md"
            />
          ))}
        </div>

        {/* Stat cards grid */}
        <div className={styles.statsGrid}>
          {data.stats.map(stat => (
            <Card key={stat.label} elevated className={styles.statCard}>
              <div className={styles.statCardInner}>
                <span className={styles.statIcon}>{stat.icon}</span>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={`${styles.statDelta} ${stat.delta >= 0 ? styles.up : styles.down}`}>
                  {stat.delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(stat.delta)}%
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Engagement Rate */}
        <Card elevated className={styles.engagementCard}>
          <h3 className={styles.cardTitle}>Engagement Rate</h3>
          <div className={styles.engagementInner}>
            <CircularProgress value={data.engagementRate} max={15} />
            <div className={styles.engagementInfo}>
              <p className={styles.engagementDesc}>
                Your engagement rate is <strong>{data.engagementRate}%</strong>
              </p>
              <span className={`${styles.engagementBadge} ${data.engagementRate > 3 ? styles.good : styles.avg}`}>
                {data.engagementRate > 5 ? 'Excellent' : data.engagementRate > 3 ? 'Good' : 'Average'}
              </span>
            </div>
          </div>
        </Card>

        {/* Follower Growth Chart */}
        <Card elevated className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Follower Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.growth} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
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
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="followers"
                stroke="var(--cane)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--cane)', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Performing Posts */}
        <section>
          <div className="section-header">
            <h2 className="section-title">Top Posts</h2>
          </div>
          <div className="scroll-x">
            {data.topPosts.map((post) => (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postThumb} style={{ background: post.bg }} />
                <div className={styles.postStats}>
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>👁️ {post.reach}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
