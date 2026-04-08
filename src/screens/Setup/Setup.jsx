import { useState, useRef } from 'react';
import { Menu, Camera, Plus, X, LogOut, Moon, Sun, Shield, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import { supabase } from '../../services/supabase';
import Avatar from '../../components/Avatar';
import BottomSheet from '../../components/BottomSheet';
import Toggle from '../../components/Toggle';
import Chip from '../../components/Chip';
import { getAllPlatforms, getSocialConfig } from '../../components/SocialIcon';
import SocialIcon from '../../components/SocialIcon';
import styles from './Setup.module.css';

const NICHE_OPTIONS = [
  'Fashion', 'Beauty', 'Fitness', 'Food', 'Travel',
  'Technology', 'Gaming', 'Music', 'Art', 'Lifestyle',
  'Finance', 'Education', 'Comedy', 'Health', 'Sports',
];

const ALL_PLATFORMS = getAllPlatforms();

export default function Setup() {
  const { profile, user, updateProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socialAccounts, dashboardModules, dispatch } = useProfileData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: profile?.name || 'Core Forge',
    username: profile?.username || 'core.forge.in',
    bio: profile?.bio || 'Maker • Developer • Creator\nBuilding products at the intersection of tech & design.',
    tagline: profile?.tagline || 'Building things that matter',
    location: profile?.location || 'India',
    niches: profile?.niche_tags || ['Technology', 'Programming', 'Design'],
    avatarPreview: profile?.avatar_url || null,
  });

  // Default handles for demo / first-time setup
  const DEMO_HANDLES = {
    instagram: { handle: 'core.forge.in', url: 'https://www.instagram.com/core.forge.in/', is_visible: true },
    youtube: { handle: 'DrBro', url: 'https://www.youtube.com/@DrBro', is_visible: true },
  };

  const [socials, setSocials] = useState(() => {
    const map = {};
    ALL_PLATFORMS.forEach(p => {
      const found = socialAccounts.find(s => s.platform === p);
      const demo = DEMO_HANDLES[p] || {};
      map[p] = {
        handle: found?.handle || demo.handle || '',
        url: found?.url || demo.url || '',
        is_visible: found?.is_visible ?? demo.is_visible ?? true,
      };
    });
    return map;
  });

  const [modules, setModules] = useState({
    carousel_enabled: dashboardModules?.carousel_enabled ?? false,
    spotify_url: dashboardModules?.spotify_url || '',
    spotify_enabled: dashboardModules?.spotify_enabled ?? false,
    reels_enabled: dashboardModules?.reels_enabled ?? false,
    collab_badges_enabled: dashboardModules?.collab_badges_enabled ?? true,
  });

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatarPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const toggleNiche = (niche) => {
    setForm(f => ({
      ...f,
      niches: f.niches.includes(niche)
        ? f.niches.filter(n => n !== niche)
        : [...f.niches, niche],
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        username: form.username.toLowerCase().replace(/\s/g, '_'),
        bio: form.bio,
        tagline: form.tagline,
        location: form.location,
        niche_tags: form.niches,
        avatar_url: form.avatarPreview,
      });

      if (user) {
        // Upsert social accounts
        const rows = ALL_PLATFORMS
          .filter(p => socials[p].handle)
          .map(p => ({
            user_id: user.id,
            platform: p,
            handle: socials[p].handle,
            url: socials[p].url,
            is_visible: socials[p].is_visible,
          }));
        if (rows.length) {
          await supabase.from('social_accounts').upsert(rows, { onConflict: 'user_id,platform' });
        }

        // Upsert modules
        await supabase.from('dashboard_modules').upsert({
          user_id: user.id,
          ...modules,
        }, { onConflict: 'user_id' });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      // silently handle
    }
    setSaving(false);
  };

  return (
    <main className="screen">
      <div className={styles.content}>

        {/* Header */}
        <div className={styles.header}>
          <h1 className="text-title">Setup</h1>
          <button className={styles.menuBtn} onClick={() => setMenuOpen(true)} aria-label="Settings menu">
            <Menu size={24} />
          </button>
        </div>

        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>

          <div className={styles.avatarPicker} onClick={() => fileRef.current?.click()}>
            <Avatar src={form.avatarPreview} name={form.name} size={72} />
            <div className={styles.cameraBadge}><Camera size={14} /></div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input className="input-field" placeholder="Jane Smith" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <div className={styles.usernameWrap}>
              <span className={styles.prefix}>ourcreatorhub.com/</span>
              <input
                className={styles.usernameInput}
                placeholder="janesmith"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tagline</label>
            <input className="input-field" placeholder="Fashion creator & stylist" value={form.tagline}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Bio</label>
            <textarea className={`input-field ${styles.textarea}`} placeholder="Tell brands about yourself..."
              value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Location</label>
            <input className="input-field" placeholder="Mumbai, India" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Niches</label>
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
        </section>

        {/* Social Accounts Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Social Accounts</h2>
          {ALL_PLATFORMS.map(platform => {
            const config = getSocialConfig(platform);
            return (
              <div key={platform} className={styles.socialRow}>
                <div className={styles.socialLeft}>
                  <SocialIcon platform={platform} size={20} />
                  <div className={styles.socialInfo}>
                    <p className={styles.socialName}>{config?.label}</p>
                    <input
                      className={styles.socialInput}
                      placeholder={`@${platform}handle`}
                      value={socials[platform]?.handle || ''}
                      onChange={e => setSocials(s => ({ ...s, [platform]: { ...s[platform], handle: e.target.value } }))}
                    />
                  </div>
                </div>
                <Toggle
                  checked={socials[platform]?.is_visible ?? true}
                  onChange={v => setSocials(s => ({ ...s, [platform]: { ...s[platform], is_visible: v } }))}
                  id={`social_${platform}`}
                />
              </div>
            );
          })}
        </section>

        {/* Dashboard Modules */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dashboard Modules</h2>

          <div className={styles.moduleRow}>
            <div className={styles.moduleInfo}>
              <p className={styles.moduleTitle}>Image Carousel</p>
              <p className={styles.moduleDesc}>Featured work gallery</p>
            </div>
            <Toggle
              checked={modules.carousel_enabled}
              onChange={v => setModules(m => ({ ...m, carousel_enabled: v }))}
              id="carousel_toggle"
            />
          </div>

          <div className={styles.moduleRow}>
            <div className={styles.moduleInfo}>
              <p className={styles.moduleTitle}>Spotify Playlist</p>
              <p className={styles.moduleDesc}>Show your vibe</p>
            </div>
            <Toggle
              checked={modules.spotify_enabled}
              onChange={v => setModules(m => ({ ...m, spotify_enabled: v }))}
              id="spotify_toggle"
            />
          </div>

          {modules.spotify_enabled && (
            <div className={styles.formGroup} style={{ marginTop: 0 }}>
              <input
                className="input-field"
                placeholder="Paste Spotify playlist URL"
                value={modules.spotify_url}
                onChange={e => setModules(m => ({ ...m, spotify_url: e.target.value }))}
              />
            </div>
          )}

          <div className={styles.moduleRow}>
            <div className={styles.moduleInfo}>
              <p className={styles.moduleTitle}>Instagram Reels</p>
              <p className={styles.moduleDesc}>Preview strip</p>
            </div>
            <Toggle
              checked={modules.reels_enabled}
              onChange={v => setModules(m => ({ ...m, reels_enabled: v }))}
              id="reels_toggle"
            />
          </div>

          <div className={styles.moduleRow}>
            <div className={styles.moduleInfo}>
              <p className={styles.moduleTitle}>Collab Badges</p>
              <p className={styles.moduleDesc}>Brand partnerships</p>
            </div>
            <Toggle
              checked={modules.collab_badges_enabled}
              onChange={v => setModules(m => ({ ...m, collab_badges_enabled: v }))}
              id="badges_toggle"
            />
          </div>
        </section>

        {/* Save button */}
        <button
          className={`btn btn-primary btn-full ${styles.saveBtn}`}
          onClick={saveAll}
          disabled={saving}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>

      </div>

      {/* Hamburger Menu Sheet */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Settings">
        <div className={styles.menuSheet}>
          <button className={styles.menuItem} onClick={() => {}}>
            <Shield size={20} />
            <span>Personal & Security</span>
          </button>

          <button className={styles.menuItem} onClick={() => { toggleTheme(); }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            <span className={styles.menuBadge}>{theme}</span>
          </button>

          <button className={styles.menuItem} onClick={() => {}}>
            <Bell size={20} />
            <span>Notifications</span>
          </button>

          <button className={styles.menuItem} onClick={() => {}}>
            <HelpCircle size={20} />
            <span>Help & Support</span>
          </button>

          <div className={styles.menuDivider} />

          <button
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            onClick={async () => { await signOut(); setMenuOpen(false); }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}
