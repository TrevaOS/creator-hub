import { useState, useRef } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Camera } from 'lucide-react';
import Avatar from '../../components/Avatar';
import Chip from '../../components/Chip';
import styles from './Steps.module.css';

const NICHE_OPTIONS = [
  'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel',
  'Technology', 'Gaming', 'Music', 'Art', 'Lifestyle',
  'Finance', 'Education', 'Comedy', 'Health', 'Sports',
];

const LOCATION_OPTIONS = [
  'Andheri', 'Bandra', 'Colaba', 'Churchgate', 'Dadar', 'Fort',
  'Juhu', 'Lower Parel', 'Powai', 'Thane', 'Vashi', 'Worli',
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune',
  'Kolkata', 'Jaipur', 'Goa', 'Other',
];

export default function Step3Profile({ onNext, onBack }) {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    niches: [],
    avatarPreview: null,
  });
  const [customLocation, setCustomLocation] = useState('');
  const selectedLocation = LOCATION_OPTIONS.includes(form.location)
    ? form.location
    : (form.location ? 'Other' : '');
  const showCustomLocation = selectedLocation === 'Other';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleNiche = (niche) => {
    setForm(f => ({
      ...f,
      niches: f.niches.includes(niche)
        ? f.niches.filter(n => n !== niche)
        : [...f.niches, niche],
    }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatarPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.username.trim()) { setError('Username is required'); return; }
    if (showCustomLocation && !customLocation.trim()) { setError('Please enter a valid location or choose a predefined area.'); return; }
    setSaving(true);
    try {
      if (user) {
        await updateProfile({
          name: form.name.trim(),
          username: form.username.trim().toLowerCase().replace(/\s/g, '_'),
          bio: form.bio.trim(),
          location: form.location.trim(),
          niche_tags: form.niches,
          avatar_url: form.avatarPreview || null,
        });
      }
    } catch (e) {
      setError(e.message || 'Failed to save');
      setSaving(false);
      return;
    }
    setSaving(false);
    onNext();
  };

  return (
    <div className={styles.step}>
      <div className={styles.content} style={{ overflowY: 'auto' }}>
        <h2 className={styles.title}>Set up your<br /><span className={styles.highlight}>profile</span></h2>

        {/* Avatar */}
        <div className={styles.avatarPicker} onClick={() => fileRef.current?.click()}>
          <Avatar src={form.avatarPreview} name={form.name} size={80} />
          <div className={styles.cameraBadge}><Camera size={14} /></div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>

        {/* Form fields */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Full Name *</label>
          <input
            className="input-field"
            placeholder="Jane Smith"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Username *</label>
          <div className={styles.usernameWrap}>
            <span className={styles.usernamePrefix}>@</span>
            <input
              className={`input-field ${styles.usernameInput}`}
              placeholder="janesmith"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Bio</label>
          <textarea
            className={`input-field ${styles.textarea}`}
            placeholder="Tell brands about yourself..."
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Location</label>
          <select
            className="input-field"
            value={selectedLocation}
            onChange={e => {
              const value = e.target.value;
              if (value === 'Other') {
                setForm(f => ({ ...f, location: 'Other' }));
                setCustomLocation(form.location && form.location !== 'Other' ? form.location : '');
              } else {
                setForm(f => ({ ...f, location: value }));
                setCustomLocation('');
              }
            }}
          >
            <option value="" disabled>Choose location area</option>
            {LOCATION_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {showCustomLocation && (
            <input
              className="input-field"
              placeholder="Enter custom location"
              value={customLocation}
              onChange={e => {
                const value = e.target.value;
                setCustomLocation(value);
                setForm(f => ({ ...f, location: value }));
              }}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Your Niches</label>
          <div className={styles.nicheGrid}>
            {NICHE_OPTIONS.map(niche => (
              <Chip
                key={niche}
                label={niche}
                active={form.niches.includes(niche)}
                onClick={() => toggleNiche(niche)}
                variant="default"
              />
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>

      <div className={styles.footer}>
        <button className={`btn btn-secondary ${styles.backBtn}`} onClick={onBack}>Back</button>
        <button className={`btn btn-primary ${styles.nextBtn}`} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Finish'}
        </button>
      </div>
    </div>
  );
}
