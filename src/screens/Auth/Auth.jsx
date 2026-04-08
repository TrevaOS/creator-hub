import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import styles from './Auth.module.css';

export default function Auth() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password, username);
        navigate('/onboarding', { replace: true });
      } else {
        await signIn(email, password);
        const onboarded = localStorage.getItem('ch_onboarded');
        navigate(onboarded ? '/dashboard' : '/onboarding', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  // Demo login — bypass auth for preview
  const demoLogin = () => {
    localStorage.setItem('ch_onboarded', 'true');
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className={styles.screen}>
      <div className={styles.logoSection}>
        <div className={styles.logo}>CH</div>
        <h1 className={styles.appName}>Creator Hub</h1>
        <p className={styles.tagline}>Your creator brand, amplified.</p>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <h2 className={styles.formTitle}>{mode === 'signin' ? 'Welcome back' : 'Create account'}</h2>

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

        <button type="submit" className={`btn btn-primary btn-full`} disabled={loading}>
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <button
          type="button"
          className={`btn btn-ghost btn-full`}
          onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>
      </form>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <button className={`btn btn-secondary btn-full ${styles.demoBtn}`} onClick={demoLogin}>
        Continue as Demo User
      </button>
    </main>
  );
}
