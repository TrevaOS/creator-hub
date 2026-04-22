import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { supabaseConfigError } from '../../services/supabase';
import styles from './Auth.module.css';

export default function Auth() {
  const [mode, setMode]       = useState('signin');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp }    = useAuth();
  const navigate              = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password, username);
        navigate('/dashboard', { replace: true });
      } else {
        await signIn(email, password);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };


  return (
    <main className={styles.screen}>
      {/* ── HERO ── */}
      <div className={styles.hero}>
        <div className={styles.heroGlow1} />
        <div className={styles.heroGlow2} />

        <div className={styles.logoMark}>CH</div>
        <h1 className={styles.appName}>Creator Hub</h1>
        <p className={styles.heroTagline}>Your creator brand, amplified.</p>

        <div className={styles.heroPills}>
          <span className={styles.heroPill}>Instagram</span>
          <span className={styles.heroPill}>YouTube</span>
          <span className={styles.heroPill}>Deals</span>
          <span className={styles.heroPill}>Analytics</span>
        </div>
      </div>

      {/* ── FORM ── */}
      <div className={styles.formArea}>
        <div>
          <h2 className={styles.formTitle}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className={styles.formSubtitle}>
            {mode === 'signin'
              ? 'Sign in to your creator profile'
              : 'Start building your creator brand today'}
          </p>
          {supabaseConfigError && <p className={styles.error}>{supabaseConfigError}</p>}
        </div>

        <form className={styles.form} onSubmit={submit}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Username</label>
              <input
                className="input-field"
                type="text"
                placeholder="@yourname"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoCapitalize="none"
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoCapitalize="none"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={`btn btn-primary btn-full ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          className={`btn btn-ghost btn-full ${styles.switchBtn}`}
          onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin'
            ? <>Don't have an account? <span>&nbsp;Sign Up</span></>
            : <>Already have an account? <span>&nbsp;Sign In</span></>}
        </button>

      </div>
    </main>
  );
}
