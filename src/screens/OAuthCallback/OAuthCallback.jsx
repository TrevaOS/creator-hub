import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { exchangeInstagramCode, exchangeYouTubeCode } from '../../services/oauth';
import styles from './OAuthCallback.module.css';

export default function OAuthCallback() {
  const { platform } = useParams();          // 'instagram' | 'youtube'
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('connecting'); // 'connecting' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Authorization was denied. You can close this and try again.');
      setTimeout(() => navigate('/setup'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received.');
      setTimeout(() => navigate('/setup'), 3000);
      return;
    }

    if (!user?.id) {
      setStatus('error');
      setMessage('Please sign in first, then reconnect the platform.');
      setTimeout(() => navigate('/auth'), 2500);
      return;
    }

    const exchange = async () => {
      try {
        if (platform === 'instagram') {
          await exchangeInstagramCode(code, user?.id);
        } else if (platform === 'youtube') {
          await exchangeYouTubeCode(code, user?.id);
        }
        setStatus('success');
        setMessage(`${capitalize(platform)} connected successfully!`);
        setTimeout(() => navigate('/setup'), 1800);
      } catch (e) {
        setStatus('error');
        setMessage(
          e.message?.includes('backend') || e.message?.includes('fetch')
            ? 'OAuth exchange backend is missing. Add /api/oauth routes (or Supabase Edge Functions) to store tokens.'
            : e.message || 'Connection failed. Please try again.'
        );
        setTimeout(() => navigate('/setup'), 3500);
      }
    };

    exchange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon = platform === 'instagram' ? '📸' : platform === 'youtube' ? '▶️' : '🔗';

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <div className={`${styles.iconWrap} ${status === 'success' ? styles.iconSuccess : status === 'error' ? styles.iconError : styles.iconLoading}`}>
          {status === 'connecting' ? (
            <div className={styles.spinner} />
          ) : status === 'success' ? (
            <span className={styles.checkIcon}>✓</span>
          ) : (
            <span className={styles.errIcon}>✕</span>
          )}
        </div>

        <p className={styles.platformName}>{icon} {capitalize(platform || 'Platform')}</p>

        <h2 className={styles.title}>
          {status === 'connecting' && 'Connecting...'}
          {status === 'success'    && 'Connected!'}
          {status === 'error'      && 'Connection Failed'}
        </h2>

        <p className={styles.subtitle}>{message || 'Exchanging authorization code for access token…'}</p>

        <div className={styles.dots}>
          {[0, 1, 2].map(i => (
            <div key={i} className={`${styles.dot} ${status === 'connecting' ? styles.dotAnimate : ''}`}
              style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>
    </main>
  );
}

function capitalize(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}
