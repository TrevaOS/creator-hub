import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import Chip from '../../components/Chip';
import styles from './DealDetail.module.css';

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetchDeal();
  }, [id]);

  async function fetchDeal() {
    if (!isSupabaseEnabled) {
      setDeal(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('creator_hub_deals').select('*').eq('id', id).single();
    setDeal(data || null);
    setLoading(false);
  }

  async function acceptDeal() {
    if (!user) { navigate('/auth'); return; }
    setAccepting(true);
    try {
      await supabase.from('creator_hub_accepted_deals').upsert({
        deal_id: id,
        user_id: user.id,
        status: 'pending',
      }, { onConflict: 'deal_id,user_id' });
      setAccepted(true);
    } catch (e) {
      setAccepted(true); // optimistic
    }
    setAccepting(false);
  }

  if (loading) return (
    <main className={styles.screen}>
      <div className={styles.loadingState}>Loading deal...</div>
    </main>
  );

  if (!deal) return (
    <main className={styles.screen}>
      <div className={styles.loadingState}>Deal not found.</div>
    </main>
  );

  const brandName = deal.brand_name || deal.brand || deal.creator || 'Brand';
  const category = deal.category || deal.type || deal.niche || '';
  const platforms = (deal.platform || deal.platforms || '').toString().split(',').map((p) => p.trim()).filter(Boolean);
  const payoutMin = deal.payout_min ?? deal.payout ?? 0;
  const payoutMax = deal.payout_max ?? deal.payout ?? payoutMin;

  return (
    <main className={styles.screen}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <span className={styles.topTitle}>Deal Details</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={styles.content}>
        {/* Brand section */}
        <div className={styles.brandSection}>
          <div className={styles.brandLogo}>
            {brandName?.[0]}
          </div>
          <div>
            <h1 className={styles.brandName}>{brandName}</h1>
            <div className={styles.metaRow}>
              {category && <span className={styles.category}>{category}</span>}
              {deal.location && (
                <span className={styles.location}>
                  <MapPin size={10} /> {deal.location}
                </span>
              )}
            </div>
          </div>
          <div className={styles.payoutBadge}>
            ₹{(payoutMin / 1000).toFixed(0)}K–{(payoutMax / 1000).toFixed(0)}K
          </div>
        </div>

        {/* Niche tags */}
        {((deal.niche_tags?.length > 0 ? deal.niche_tags : category ? [category] : []).length > 0) && (
          <div className={styles.chips}>
            {(deal.niche_tags?.length > 0 ? deal.niche_tags : [category]).map(t => <Chip key={t} label={t} variant="ghost" size="sm" />)}
          </div>
        )}

        {/* Brief */}
        {(deal.brief || deal.type) && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Brand Brief</h3>
            <p className={styles.sectionText}>{deal.brief || deal.type}</p>
          </section>
        )}

        {/* Requirements */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Requirements</h3>
          <p className={styles.sectionText}>{deal.requirement || 'No specific requirements listed.'}</p>
        </section>

        {/* Deliverables */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Deliverables</h3>
          <div className={styles.deliverablesList}>
            {(deal.deliverables || '').split('+').map((d, i) => (
              <div key={i} className={styles.deliverableItem}>
                <CheckCircle size={16} className={styles.checkIcon} />
                <span>{d.trim()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Platforms */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Platform</h3>
          <div className={styles.platformRow}>
            {platforms.map(p => (
              <span key={p} className={styles.platformChip}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </span>
            ))}
          </div>
        </section>

        {/* Timeline */}
        {deal.timeline && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Timeline</h3>
            <p className={styles.sectionText}>{deal.timeline}</p>
          </section>
        )}
      </div>

      {/* CTA Footer */}
      <div className={styles.ctaBar}>
        {accepted ? (
          <div className={styles.acceptedMsg}>
            <CheckCircle size={18} />
            Request sent! Check "Pending" in Deals.
          </div>
        ) : (
          <>
            <button
              className={`btn btn-outline ${styles.ctaBtn}`}
              onClick={() => navigate(`/deals/chat/${id}`)}
            >
              Start Chat
            </button>
            <button
              className={`btn btn-primary ${styles.ctaBtn}`}
              onClick={acceptDeal}
              disabled={accepting}
            >
              {accepting ? 'Sending...' : 'Accept & Negotiate'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
