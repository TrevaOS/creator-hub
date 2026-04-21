import { useState, useRef, useEffect } from 'react';
import { Menu, Camera, X, LogOut, Moon, Sun, Shield, Bell, HelpCircle, Plus, Check, Unlink } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useProfileData } from '../../hooks/useProfileData';
import { supabase } from '../../services/supabase';
import {
  getInstagramAuthURL,
  getYouTubeAuthURL,
  disconnectPlatform,
  isInstagramOAuthConfigured,
  isYouTubeOAuthConfigured,
} from '../../services/oauth';
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

const LOCATION_OPTIONS = [
  'Andheri', 'Bandra', 'Colaba', 'Churchgate', 'Dadar', 'Fort',
  'Juhu', 'Lower Parel', 'Powai', 'Thane', 'Vashi', 'Worli',
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune',
  'Kolkata', 'Jaipur', 'Goa', 'Other',
];

const ALL_PLATFORMS = getAllPlatforms();

// Platforms that support OAuth one-click connect
const OAUTH_PLATFORMS = {
  instagram: { getURL: getInstagramAuthURL,  isConfigured: isInstagramOAuthConfigured, label: 'Connect' },
  youtube:   { getURL: getYouTubeAuthURL,    isConfigured: isYouTubeOAuthConfigured, label: 'Connect' },
};

export default function Setup() {
  const { profile, user, updateProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socialAccounts, dashboardModules, carouselImages, dispatch, refetch } = useProfileData();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const fileRef                   = useRef(null);
  const coverFileRef              = useRef(null);
  const carouselFileRef           = useRef(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    name:          profile?.name          || '',
    username:      profile?.username      || '',
    bio:           profile?.bio           || '',
    tagline:       profile?.tagline       || '',
    location:      profile?.location      || '',
    niches:        profile?.niche_tags    || [],
    avatarPreview: profile?.avatar_url    || null,
    coverPreview:  profile?.cover_url     || null,
  });
  const [customLocation, setCustomLocation] = useState(
    LOCATION_OPTIONS.includes(profile?.location) ? '' : profile?.location || ''
  );

  const [socials, setSocials] = useState(() => {
    const map = {};
    ALL_PLATFORMS.forEach(p => {
      const found = socialAccounts.find(s => s.platform === p);
      map[p] = {
        handle:     found?.handle || '',
        url:        found?.url || '',
        is_visible: found?.is_visible ?? true,
      };
    });
    return map;
  });

  const [modules, setModules] = useState({
    carousel_enabled:      dashboardModules?.carousel_enabled      ?? false,
    spotify_url:           dashboardModules?.spotify_url           || '',
    spotify_enabled:       dashboardModules?.spotify_enabled       ?? false,
    reels_enabled:         dashboardModules?.reels_enabled         ?? false,
    collab_badges_enabled: dashboardModules?.collab_badges_enabled ?? true,
  });

  // Local carousel slides (start from existing Supabase images)
  const [slides, setSlides] = useState(
    carouselImages.map(img => ({ id: img.id, url: img.image_url, caption: img.caption || '', isExisting: true }))
  );

  useEffect(() => {
    setForm({
      name:          profile?.name          || '',
      username:      profile?.username      || '',
      bio:           profile?.bio           || '',
      tagline:       profile?.tagline       || '',
      location:      profile?.location      || '',
      niches:        profile?.niche_tags    || [],
      avatarPreview: profile?.avatar_url    || null,
      coverPreview:  profile?.cover_url     || null,
    });
    setCustomLocation(
      LOCATION_OPTIONS.includes(profile?.location) ? '' : profile?.location || ''
    );
  }, [profile]);

  useEffect(() => {
    const nextSocials = {};
    ALL_PLATFORMS.forEach(p => {
      const found = socialAccounts.find(s => s.platform === p);
      nextSocials[p] = {
        handle: found?.handle || '',
        url: found?.url || '',
        is_visible: found?.is_visible ?? true,
      };
    });
    setSocials(nextSocials);
  }, [socialAccounts]);

  useEffect(() => {
    setModules({
      carousel_enabled:      dashboardModules?.carousel_enabled      ?? false,
      spotify_url:           dashboardModules?.spotify_url           || '',
      spotify_enabled:       dashboardModules?.spotify_enabled       ?? false,
      reels_enabled:         dashboardModules?.reels_enabled         ?? false,
      collab_badges_enabled: dashboardModules?.collab_badges_enabled ?? true,
    });
  }, [dashboardModules]);

  useEffect(() => {
    setSlides(carouselImages.map(img => ({
      id: img.id,
      url: img.image_url,
      caption: img.caption || '',
      isExisting: true,
    })));
  }, [carouselImages]);

  // Check connected OAuth platforms
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('creator_oauth_tokens')
      .select('platform')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setConnectedPlatforms(data.map(r => r.platform));
      });
  }, [user?.id]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatarPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, coverPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const uploadImageAndGetUrl = async (file, folder) => {
    if (!file || !user?.id) return null;
    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
    const filePath = `${user.id}/${folder}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

    if (uploadError) return null;
    const { data } = supabase.storage.from('creator-assets').getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const handleCarouselAdd = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setSlides(prev => [
          ...prev,
          {
            id: `local_${Date.now()}_${Math.random()}`,
            url: ev.target.result,
            caption: '',
            isExisting: false,
            file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-added
    e.target.value = '';
  };

  const removeSlide = (id) => {
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  const updateSlideCaption = (id, caption) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, caption } : s));
  };

  const selectedLocation = LOCATION_OPTIONS.includes(form.location)
    ? form.location
    : (form.location ? 'Other' : '');
  const showCustomLocation = selectedLocation === 'Other';

  const toggleNiche = (niche) => {
    setForm(f => ({
      ...f,
      niches: f.niches.includes(niche)
        ? f.niches.filter(n => n !== niche)
        : [...f.niches, niche],
    }));
  };

  const handleOAuthConnect = (platform) => {
    const cfg = OAUTH_PLATFORMS[platform];
    if (!cfg) return;
    if (!cfg.isConfigured()) {
      alert(`To connect ${platform}, set valid OAuth values in .env and restart the app.`);
      return;
    }
    const url = cfg.getURL();
    if (!url) {
      alert(`OAuth URL could not be generated for ${platform}. Check .env and restart the app.`);
      return;
    }
    window.location.href = url;
  };

  const handleOAuthDisconnect = async (platform) => {
    if (!user?.id) return;
    await disconnectPlatform(user.id, platform);
    setConnectedPlatforms(prev => prev.filter(p => p !== platform));
  };

  const uploadCarouselSlide = async (slide) => {
    if (!slide?.file || !user?.id) return slide?.url || null;
    const ext = (slide.file.name?.split('.').pop() || 'jpg').toLowerCase();
    const filePath = `${user.id}/carousel_${Date.now()}_${Math.floor(Math.random() * 9999)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(filePath, slide.file, { upsert: true, contentType: slide.file.type || 'image/jpeg' });
    if (uploadError) return null;
    const { data } = supabase.storage.from('creator-assets').getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const normalizeSocialInput = (value) => {
    const v = value.trim();
    if (!v) return { handle: '', url: '' };

    if (v.startsWith('http://') || v.startsWith('https://')) {
      try {
        const u = new URL(v);
        const cleaned = u.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || '';
        return { handle: cleaned, url: v };
      } catch {
        return { handle: v.replace(/^@/, ''), url: '' };
      }
    }
    return { handle: v.replace(/^@/, ''), url: '' };
  };

  const buildSocialUrl = (platform, handle) => {
    const clean = (handle || '').trim().replace(/^@/, '');
    if (!clean) return '';
    const map = {
      instagram: `https://instagram.com/${clean}`,
      youtube: `https://youtube.com/@${clean}`,
      twitter: `https://x.com/${clean}`,
      linkedin: `https://www.linkedin.com/in/${clean}`,
      tiktok: `https://www.tiktok.com/@${clean}`,
      spotify: `https://open.spotify.com/user/${clean}`,
      pinterest: `https://pinterest.com/${clean}`,
    };
    return map[platform] || '';
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveError('');
    try {
      if (!form.name.trim() || !form.username.trim() || !form.bio.trim() || !form.location.trim()) {
        throw new Error('Name, username, bio, and location are required.');
      }
      if (selectedLocation === 'Other' && !customLocation.trim()) {
        throw new Error('Please enter a valid custom location or choose one of the predefined areas.');
      }
      const uploadedAvatarUrl = await uploadImageAndGetUrl(avatarFile, 'avatar');
      const uploadedCoverUrl = await uploadImageAndGetUrl(coverFile, 'cover');

      await updateProfile({
        name:       form.name,
        username:   form.username.toLowerCase().replace(/\s/g, '_'),
        bio:        form.bio,
        tagline:    form.tagline,
        location:   form.location,
        niche_tags: form.niches,
        avatar_url: uploadedAvatarUrl || form.avatarPreview || null,
        cover_url:  uploadedCoverUrl || form.coverPreview || null,
      });

      if (user) {
        // Upsert social accounts
        const rows = ALL_PLATFORMS
          .filter(p => socials[p].handle)
          .map(p => ({
            user_id:            user.id,
            creator_profile_id: profile?.profile_id ?? null,
            platform:           p,
            handle:             socials[p].handle,
            url:                socials[p].url || buildSocialUrl(p, socials[p].handle) || null,
            is_visible:         Boolean(socials[p].url || socials[p].handle) && socials[p].is_visible,
          }));
        if (rows.length) {
          await supabase.from('creator_social_accounts').upsert(rows, { onConflict: 'user_id,platform' });
        }

        // Upsert modules
        await supabase.from('creator_dashboard_modules').upsert({
          user_id: user.id,
          creator_profile_id: profile?.profile_id ?? null,
          ...modules,
        }, { onConflict: 'user_id' });

        // Carousel: delete removed existing slides
        const existingIds = slides.filter(s => s.isExisting).map(s => s.id);
        const removedExisting = carouselImages.filter(img => !existingIds.includes(img.id));
        for (const img of removedExisting) {
          await supabase.from('creator_carousel_images').delete().eq('id', img.id);
        }

        // Insert new local slides and upload to storage
        const newSlides = slides.filter(s => !s.isExisting);
        for (const slide of newSlides) {
          const uploadedUrl = await uploadCarouselSlide(slide);
          if (!uploadedUrl) continue;
          await supabase.from('creator_carousel_images').insert({
            user_id:            user.id,
            creator_profile_id: profile?.profile_id ?? null,
            image_url:          uploadedUrl,
            caption:            slide.caption,
            order:              slides.indexOf(slide),
          });
        }

        // Update captions and order of existing slides
        for (const slide of slides.filter(s => s.isExisting)) {
          await supabase
            .from('creator_carousel_images')
            .update({ caption: slide.caption, order: slides.indexOf(slide) })
            .eq('id', slide.id);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      dispatch({ type: 'SET_DASHBOARD_MODULES', payload: { user_id: user.id, ...modules } });
      setAvatarFile(null);
      setCoverFile(null);
      await refetch();
    } catch (e) {
      setSaveError(e?.message || 'Failed to save profile changes');
    }
    setSaving(false);
  };

  return (
    <main className="screen">
      <div className={styles.content}>

        {/* ── HEADER ── */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Setup</h1>
          <button className={styles.menuBtn} onClick={() => setMenuOpen(true)} aria-label="Settings menu">
            <Menu size={20} />
          </button>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`btn btn-primary ${styles.saveBtnInline}`}
            onClick={saveAll}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* ── PROFILE SECTION ── */}
        <div className={styles.sectionCard}>
          <p className={styles.sectionTitle}>Profile</p>

          {/* Cover / background image */}
          <div className={styles.coverPicker} onClick={() => coverFileRef.current?.click()}>
            {form.coverPreview ? (
              <img src={form.coverPreview} alt="Cover" className={styles.coverImg} />
            ) : (
              <div className={styles.coverPlaceholder}>
                <Camera size={18} />
                <span>Upload cover photo</span>
              </div>
            )}
            <div className={styles.coverEditBadge}><Camera size={11} /></div>
            <input ref={coverFileRef} type="file" accept="image/*" hidden onChange={handleCover} />
          </div>

          <div className={styles.avatarPicker} onClick={() => fileRef.current?.click()}>
            <Avatar src={form.avatarPreview} name={form.name} size={80} />
            <div className={styles.cameraBadge}><Camera size={13} /></div>
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
              <span className={styles.prefix}>creatorhub.com/</span>
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
            <textarea className={`input-field ${styles.textarea}`} placeholder="Tell brands about yourself…"
              value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Location</label>
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
        </div>

        {/* ── SOCIAL ACCOUNTS ── */}
        <div className={styles.sectionCard}>
          <p className={styles.sectionTitle}>Social Accounts</p>
          {ALL_PLATFORMS.map(platform => {
            const config    = getSocialConfig(platform);
            const isOAuth   = !!OAUTH_PLATFORMS[platform];
            const isConnected = connectedPlatforms.includes(platform);

            return (
              <div key={platform} className={styles.socialRow}>
                <div className={styles.socialLeft}>
                  <div className={styles.socialIconWrap}>
                    <SocialIcon platform={platform} size={18} />
                  </div>
                  <div className={styles.socialInfo}>
                    <p className={styles.socialName}>{config?.label}</p>
                    <input
                      className={styles.socialInput}
                      placeholder={`@${platform}handle`}
                      value={socials[platform]?.handle || ''}
                      onChange={e => {
                        const normalized = normalizeSocialInput(e.target.value);
                        setSocials(s => ({
                          ...s,
                          [platform]: {
                            ...s[platform],
                            ...normalized,
                            url: normalized.url || buildSocialUrl(platform, normalized.handle),
                            is_visible: Boolean(normalized.handle),
                          },
                        }));
                      }}
                    />
                  </div>
                </div>
                <div className={styles.socialRight}>
                  {isOAuth ? (
                    isConnected ? (
                      <button
                        className={`${styles.oauthBtn} ${styles.oauthBtnDisconnect}`}
                        onClick={() => handleOAuthDisconnect(platform)}
                      >
                        <Unlink size={10} /> Unlink
                      </button>
                    ) : (
                      <button
                        className={`${styles.oauthBtn} ${styles.oauthBtnConnect}`}
                        onClick={() => handleOAuthConnect(platform)}
                      >
                        <Plus size={10} /> Connect
                      </button>
                    )
                  ) : (
                    <Toggle
                      checked={socials[platform]?.is_visible ?? true}
                      disabled={!socials[platform]?.url}
                      onChange={v => setSocials(s => ({ ...s, [platform]: { ...s[platform], is_visible: v } }))}
                      id={`social_${platform}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── DASHBOARD MODULES ── */}
        <div className={styles.sectionCard}>
          <p className={styles.sectionTitle}>Dashboard Modules</p>

          <div className={styles.moduleRow}>
            <div className={styles.moduleInfo}>
              <p className={styles.moduleTitle}>Image Carousel</p>
              <p className={styles.moduleDesc}>Featured work slideshow</p>
            </div>
            <Toggle checked={modules.carousel_enabled} onChange={v => setModules(m => ({ ...m, carousel_enabled: v }))} id="carousel_toggle" />
          </div>

          {/* Carousel image uploader */}
          {modules.carousel_enabled && (
            <div className={styles.carouselSection}>
              <div className={styles.carouselScrollArea}>
                {slides.map(slide => (
                  <div key={slide.id} className={styles.carouselSlide}>
                    <img src={slide.url} alt={slide.caption} className={styles.carouselSlideImg} />
                    <button className={styles.carouselRemoveBtn} onClick={() => removeSlide(slide.id)}>
                      <X size={11} />
                    </button>
                    <input
                      style={{ fontSize: 11, background: 'none', color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}
                      placeholder="Caption…"
                      value={slide.caption}
                      onChange={e => updateSlideCaption(slide.id, e.target.value)}
                    />
                  </div>
                ))}
                <div className={styles.addSlideBtn} onClick={() => carouselFileRef.current?.click()}>
                  <div className={styles.addSlidePlus}><Plus size={16} /></div>
                  Add photo
                  <input
                    ref={carouselFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleCarouselAdd}
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.moduleRow}>
            <div className={styles.moduleInfo}>
              <p className={styles.moduleTitle}>Spotify Playlist</p>
              <p className={styles.moduleDesc}>Show your creative vibe</p>
            </div>
            <Toggle checked={modules.spotify_enabled} onChange={v => setModules(m => ({ ...m, spotify_enabled: v }))} id="spotify_toggle" />
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
              <p className={styles.moduleDesc}>Preview strip on dashboard</p>
            </div>
            <Toggle checked={modules.reels_enabled} onChange={v => setModules(m => ({ ...m, reels_enabled: v }))} id="reels_toggle" />
          </div>

          <div className={styles.moduleRow}>
            <div className={styles.moduleInfo}>
              <p className={styles.moduleTitle}>Collab Badges</p>
              <p className={styles.moduleDesc}>Brand partnership logos</p>
            </div>
            <Toggle checked={modules.collab_badges_enabled} onChange={v => setModules(m => ({ ...m, collab_badges_enabled: v }))} id="badges_toggle" />
          </div>
        </div>

        {/* ── SAVE ── */}
        {saveError && (
          <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{saveError}</p>
        )}

      </div>

      {/* ── SAVED TOAST ── */}
      {saved && (
        <div className={styles.savedToast}>
          <Check size={14} /> Saved successfully
        </div>
      )}

      {/* ── MENU SHEET ── */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Settings">
        <div className={styles.menuSheet}>
          <button className={styles.menuItem} onClick={() => {}}>
            <Shield size={20} />
            <span>Personal & Security</span>
          </button>

          <button className={styles.menuItem} onClick={() => { toggleTheme(); }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
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
