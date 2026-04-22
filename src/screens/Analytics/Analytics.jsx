import { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Download, Zap } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase';
import SocialIcon from '../../components/SocialIcon';
import { generateAnalyticsReport } from '../../services/pdfExport';
import styles from './Analytics.module.css';

const PLATFORMS = ['Instagram', 'YouTube', 'Twitter', 'TikTok'];

const EMPTY_PLATFORM_DATA = {
  totalFollowers: '—',
  engagementRate: 0,
  stats: [],
  growth: [],
  topPosts: [],
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

  const platformKey = activePlatform.toLowerCase();
  const isConnected = connected.includes(platformKey);
  const data = EMPTY_PLATFORM_DATA;

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
    : isConnected ? '—' : 'Not connected';

  const engagementRate = liveStats?.engagementRate ?? 0;
  const engagementLabel = engagementRate > 5 ? 'Excellent' : engagementRate > 3 ? 'Good' : '—';
  const engClass = engagementRate > 5 ? styles.goodBadge : engagementRate > 3 ? styles.avgBadge : styles.lowBadge;

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

        {/* ── NOT CONNECTED PROMPT ── */}
        {!isConnected && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: '32px 20px',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
            marginBottom: 16,
          }}>
            <Zap size={32} color="var(--brand)" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Connect {activePlatform}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Link your {activePlatform} account in Setup to see live analytics here.
            </p>
            <a href="/setup" style={{
              background: 'var(--brand)',
              color: '#fff',
              borderRadius: 999,
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}>Go to Setup</a>
          </div>
        )}

        {/* ── SUMMARY BANNER ── */}
        {isConnected && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryLeft}>
              <h2>{displayFollowers}</h2>
              <p>
                {activePlatform} followers
                <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>
                  <Zap size={11} style={{ display: 'inline' }} /> live
                </span>
              </p>
            </div>
            <div className={styles.summaryEngagement}>
              <p className={styles.bigNum}>{engagementRate}%</p>
              <p className={styles.bigLabel}>Engagement</p>
              <span className={styles.engBadge}>{engagementLabel}</span>
            </div>
          </div>
        )}

        {/* ── GROWTH CHART (only when connected and have data) ── */}
        {isConnected && data.growth.length > 0 && (
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
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="followers" stroke="#7C3AED" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#7C3AED', r: 3.5, strokeWidth: 0 }} activeDot={{ r: 5.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </main>
  );
}

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
