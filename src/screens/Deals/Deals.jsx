import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Filter, ChevronRight, MessageCircle, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import { loadAdminData } from '../../services/adminStore';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import BottomSheet from '../../components/BottomSheet';
import Skeleton from '../../components/Skeleton';
import styles from './Deals.module.css';

const STATUS_TABS = ['Browse', 'Pending', 'Active', 'Completed'];

export default function Deals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Browse');
  const [deals, setDeals] = useState([]);
  const [acceptedDeals, setAcceptedDeals] = useState([]);
  const [acceptedIds, setAcceptedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ niche: '', platform: '', location: '' });

  useEffect(() => {
    fetchDeals();
    if (user) fetchAcceptedDeals();
  }, [user]);

  async function fetchDeals() {
    setLoading(true);
    let result = [];
    if (isSupabaseEnabled) {
      const { data } = await supabase.from('creator_hub_deals').select('*').eq('status', 'open').order('created_at', { ascending: false });
      if (Array.isArray(data)) {
        result = data;
      }
    }

    const adminData = await loadAdminData();
    const localDeals = adminData.deals || [];
    if (localDeals.length > 0) {
      const merged = [...result];
      for (const localDeal of localDeals) {
        if (!merged.some((remote) => remote.id === localDeal.id)) {
          merged.push(localDeal);
        }
      }
      result = merged;
    }

    setDeals(result);
    setLoading(false);
  }

  async function fetchAcceptedDeals() {
    const { data } = await supabase
      .from('creator_hub_accepted_deals')
      .select('*, creator_hub_deals(*)')
      .eq('user_id', user.id);
    const list = data || [];
    setAcceptedDeals(list);
    setAcceptedIds(new Set(list.map(d => d.deal_id)));
  }

  async function acceptDeal(e, dealId) {
    e.stopPropagation();
    if (!user) { navigate('/auth'); return; }
    try {
      await supabase.from('creator_hub_accepted_deals').upsert(
        { deal_id: dealId, user_id: user.id, status: 'pending' },
        { onConflict: 'deal_id,user_id' }
      );
      setAcceptedIds(prev => new Set([...prev, dealId]));
    } catch {
      setAcceptedIds(prev => new Set([...prev, dealId]));
    }
  }

  const filteredDeals = deals.filter(d => {
    if (filters.niche && !d.niche_tags?.includes(filters.niche.toLowerCase())) return false;
    if (filters.platform && d.platform !== filters.platform) return false;
    if (filters.location && !d.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    return true;
  });

  const pendingDeals = acceptedDeals.filter(d => d.status === 'pending');
  const activeDeals = acceptedDeals.filter(d => d.status === 'active');
  const completedDeals = acceptedDeals.filter(d => d.status === 'completed');

  const tabDeals = { Pending: pendingDeals, Active: activeDeals, Completed: completedDeals };

  return (
    <main className="screen">
      <div className={styles.content}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className="text-title">Deals</h1>
            <div className={styles.locationRow}>
              <MapPin size={12} />
              <span>Near You</span>
            </div>
          </div>
          <button className={`btn btn-secondary ${styles.filterBtn}`} onClick={() => setFilterOpen(true)}>
            <Filter size={16} />
            Filter
          </button>
        </div>

        {/* Tabs */}
        <div className={`scroll-x ${styles.tabRow}`}>
          {STATUS_TABS.map(tab => (
            <Chip
              key={tab}
              label={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              variant="default"
            />
          ))}
        </div>

        {/* Browse tab */}
        {activeTab === 'Browse' && (
          <div className={styles.dealList}>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className={styles.skeletonDeal}>
                  <Skeleton height={160} width="100%" />
                </div>
              ))
            ) : filteredDeals.length === 0 ? (
              <div className={styles.empty}>No deals available right now.</div>
            ) : (
              filteredDeals.map(deal => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  isAccepted={acceptedIds.has(deal.id)}
                  onPress={() => navigate(`/deals/${deal.id}`)}
                  onAccept={(e) => acceptDeal(e, deal.id)}
                  onChat={(e) => { e.stopPropagation(); navigate(`/deals/chat/${deal.id}`); }}
                />
              ))
            )}
          </div>
        )}

        {/* Accepted deal tabs */}
        {activeTab !== 'Browse' && (
          <div className={styles.dealList}>
            {(tabDeals[activeTab] || []).length === 0 ? (
              <div className={styles.empty}>No {activeTab.toLowerCase()} deals yet.</div>
            ) : (
              (tabDeals[activeTab] || []).map(ad => (
                <AcceptedDealCard
                  key={ad.id}
                  acceptedDeal={ad}
                  onChat={() => navigate(`/deals/chat/${ad.deal_id}`)}
                  onView={() => navigate(`/deals/${ad.deal_id}`)}
                />
              ))
            )}
          </div>
        )}

      </div>

      {/* Filter bottom sheet */}
      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Deals">
        <div className={styles.filterSheet}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Niche</label>
            <div className={styles.filterChips}>
              {['Fashion', 'Tech', 'Fitness', 'Food', 'Travel'].map(n => (
                <Chip
                  key={n}
                  label={n}
                  active={filters.niche === n}
                  onClick={() => setFilters(f => ({ ...f, niche: f.niche === n ? '' : n }))}
                  variant="default"
                />
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Platform</label>
            <div className={styles.filterChips}>
              {['instagram', 'youtube', 'twitter', 'tiktok'].map(p => (
                <Chip
                  key={p}
                  label={p.charAt(0).toUpperCase() + p.slice(1)}
                  active={filters.platform === p}
                  onClick={() => setFilters(f => ({ ...f, platform: f.platform === p ? '' : p }))}
                  variant="default"
                />
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Location</label>
            <input
              className="input-field"
              placeholder="e.g. Mumbai"
              value={filters.location}
              onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
            />
          </div>

          <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} onClick={() => setFilterOpen(false)}>
            Apply Filters
          </button>
          <button
            className="btn btn-ghost btn-full"
            onClick={() => { setFilters({ niche: '', platform: '', location: '' }); setFilterOpen(false); }}
          >
            Clear All
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}

function DealCard({ deal, isAccepted, onPress, onAccept, onChat }) {
  const platforms = deal.platform?.split(',') || [];

  const brandName = deal.brand_name || deal.brand || deal.creator || 'Brand';
  const category = deal.category || deal.type || deal.niche || '';
  const payoutMin = deal.payout_min ?? deal.payout ?? 0;
  const payoutMax = deal.payout_max ?? deal.payout ?? payoutMin;

  return (
    <Card elevated className={styles.dealCard} onClick={onPress}>
      <div className={styles.dealCardInner}>
        {/* Brand header */}
        <div className={styles.dealBrandRow}>
          <div className={styles.dealBrandLogo}>
            {deal.brand_logo ? (
              <img src={deal.brand_logo} alt={brandName} loading="lazy" className={styles.brandLogoImg} />
            ) : (
              <span className={styles.brandInitial}>{brandName?.[0]}</span>
            )}
          </div>
          <div className={styles.dealBrandInfo}>
            <p className={styles.dealBrandName}>{brandName}</p>
            {category && <p className={styles.dealCategory}>{category}</p>}
          </div>
          <div className={styles.dealPayout}>
            <span className={styles.payoutBadge}>
              ₹{(payoutMin / 1000).toFixed(0)}K–{(payoutMax / 1000).toFixed(0)}K
            </span>
          </div>
        </div>

        {/* Niche chips */}
        {(deal.niche_tags?.length > 0 ? deal.niche_tags : category ? [category] : []).length > 0 && (
          <div className={styles.dealChips}>
            {(deal.niche_tags?.length > 0 ? deal.niche_tags : [category]).slice(0, 3).map(tag => (
              <Chip key={tag} label={tag} variant="ghost" size="sm" />
            ))}
          </div>
        )}

        {/* Deliverables */}
        {deal.deliverables ? (
          <p className={styles.dealDeliverables}>{deal.deliverables}</p>
        ) : deal.type ? (
          <p className={styles.dealDeliverables}>{deal.type}</p>
        ) : null}

        {/* Footer meta */}
        <div className={styles.dealMeta}>
          <div className={styles.dealPlatforms}>
            {platforms.map(p => (
              <span key={p} className={styles.platformPill}>{p}</span>
            ))}
          </div>
          {deal.location && (
            <div className={styles.dealLocation}>
              <MapPin size={10} />
              <span>{deal.location}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.dealActions}>
          {isAccepted ? (
            <>
              <div className={styles.acceptedBadge}>
                <CheckCircle size={14} />
                Applied
              </div>
              <button
                className={`btn btn-primary ${styles.dealActionBtn}`}
                onClick={onChat}
              >
                <MessageCircle size={14} />
                Chat
              </button>
            </>
          ) : (
            <>
              <button
                className={`btn btn-outline ${styles.dealActionBtn}`}
                onClick={onChat}
              >
                <MessageCircle size={14} />
                Chat
              </button>
              <button
                className={`btn btn-primary ${styles.dealActionBtn}`}
                onClick={onAccept}
              >
                <Zap size={14} />
                Accept Deal
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function AcceptedDealCard({ acceptedDeal, onChat, onView }) {
  const deal = acceptedDeal.creator_hub_deals || acceptedDeal;
  const statusColors = { pending: '#f59e0b', active: '#10b981', completed: '#6b7280', rejected: '#ef4444' };

  return (
    <Card outlined className={styles.acceptedCard} onClick={onView}>
      <div className={styles.acceptedInner}>
        <div className={styles.acceptedBrand}>
          {deal?.brand_logo ? (
            <img src={deal.brand_logo} alt={deal.brand_name} className={styles.acceptedLogoImg} />
          ) : (
            <span>{deal?.brand_name?.[0] || 'B'}</span>
          )}
        </div>
        <div className={styles.acceptedInfo}>
          <p className={styles.acceptedBrandName}>{deal?.brand_name || 'Brand'}</p>
          <p className={styles.acceptedDeliverable}>{deal?.deliverables || 'TBD'}</p>
          <span
            className={styles.statusPill}
            style={{ backgroundColor: `${statusColors[acceptedDeal.status]}20`, color: statusColors[acceptedDeal.status] }}
          >
            {acceptedDeal.status}
          </span>
        </div>
        <button
          className={`btn btn-primary ${styles.chatBtn}`}
          onClick={e => { e.stopPropagation(); onChat(); }}
        >
          <MessageCircle size={14} />
          Chat
        </button>
      </div>
    </Card>
  );
}
