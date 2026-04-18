import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase';
import { getAllPlatforms, getSocialConfig } from '../../components/SocialIcon';
import SocialIcon from '../../components/SocialIcon';
import styles from './Steps.module.css';

const PLATFORMS = getAllPlatforms();

export default function Step2Socials({ onNext, onBack }) {
  const { user } = useAuth();
  const [handles, setHandles] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (user) {
        const rows = Object.entries(handles)
          .filter(([, h]) => h.trim())
          .map(([platform, handle]) => ({
            user_id: user.id,
            platform,
            handle: handle.trim(),
            is_visible: true,
          }));
        if (rows.length) {
          await supabase.from('creator_social_accounts').upsert(rows, { onConflict: 'user_id,platform' });
        }
      }
    } catch (e) {
      // continue anyway
    }
    setSaving(false);
    onNext();
  };

  return (
    <div className={styles.step}>
      <div className={styles.content}>
        <h2 className={styles.title}>Connect your<br /><span className={styles.highlight}>social accounts</span></h2>
        <p className={styles.body}>Add your handles to showcase your presence. You can always edit these later.</p>

        <div className={styles.socialList}>
          {PLATFORMS.map(platform => {
            const config = getSocialConfig(platform);
            if (!config) return null;
            return (
              <div key={platform} className={styles.socialRow}>
                <div className={styles.socialIcon}>
                  <SocialIcon platform={platform} size={22} />
                </div>
                <div className={styles.socialInputWrap}>
                  <span className={styles.socialLabel}>{config.label}</span>
                  <input
                    type="text"
                    className={styles.socialInput}
                    placeholder={`@your${platform}handle`}
                    value={handles[platform] || ''}
                    onChange={e => setHandles(h => ({ ...h, [platform]: e.target.value }))}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <button className={`btn btn-secondary ${styles.backBtn}`} onClick={onBack}>Back</button>
        <button className={`btn btn-primary ${styles.nextBtn}`} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
