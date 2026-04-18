import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Users, Building2, BadgeIndianRupee, Plus, Trash2, Save, RefreshCcw, Wifi, WifiOff, Pencil } from 'lucide-react';
import { loadAdminData, resetAdminData, saveAdminData } from '../../services/adminStore';
import styles from './AdminDashboard.module.css';

const EMPTY_CREATOR = { name: '', niche: '', followers: '', city: '' };
const EMPTY_BRAND = { name: '', industry: '', budget: '' };
const EMPTY_DEAL = { brand: '', creator: '', type: '', status: 'Pending', payout: '' };

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [creators, setCreators] = useState([]);
  const [brands, setBrands] = useState([]);
  const [deals, setDeals] = useState([]);
  const [query, setQuery] = useState('');
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [creatorForm, setCreatorForm] = useState(EMPTY_CREATOR);
  const [brandForm, setBrandForm] = useState(EMPTY_BRAND);
  const [dealForm, setDealForm] = useState(EMPTY_DEAL);

  const [editing, setEditing] = useState({ type: null, id: null });

  useEffect(() => {
    const root = document.getElementById('root');
    root?.classList.add('admin-fullwidth');

    let mounted = true;
    loadAdminData().then((data) => {
      if (!mounted) return;
      setCreators(data.creators);
      setBrands(data.brands);
      setDeals(data.deals);
      setLoading(false);
    });

    function onOnline() {
      setOnline(true);
    }
    function onOffline() {
      setOnline(false);
    }

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      mounted = false;
      root?.classList.remove('admin-fullwidth');
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    setSaving(true);
    saveAdminData({ creators, brands, deals })
      .then(() => {
        setMessage('Saved');
      })
      .finally(() => {
        setSaving(false);
      });
  }, [brands, creators, deals, loading]);

  const totals = useMemo(() => {
    const totalDealValue = deals.reduce((sum, d) => sum + Number(d.payout || 0), 0);
    const activeDeals = deals.filter((d) => d.status === 'Active').length;
    return {
      creators: creators.length,
      brands: brands.length,
      deals: deals.length,
      activeDeals,
      totalDealValue,
    };
  }, [brands.length, creators.length, deals]);

  const filteredCreators = useMemo(
    () => creators.filter((c) => [c.name, c.niche, c.city].join(' ').toLowerCase().includes(query.toLowerCase())),
    [creators, query],
  );
  const filteredBrands = useMemo(
    () => brands.filter((b) => [b.name, b.industry].join(' ').toLowerCase().includes(query.toLowerCase())),
    [brands, query],
  );
  const filteredDeals = useMemo(
    () => deals.filter((d) => [d.brand, d.creator, d.type, d.status].join(' ').toLowerCase().includes(query.toLowerCase())),
    [deals, query],
  );

  function upsertCreator(e) {
    e.preventDefault();
    if (!creatorForm.name || !creatorForm.niche) return;
    if (editing.type === 'creator') {
      setCreators((prev) =>
        prev.map((c) =>
          c.id === editing.id ? { ...c, ...creatorForm, followers: Number(creatorForm.followers || 0), city: creatorForm.city || 'Unknown' } : c,
        ),
      );
      setEditing({ type: null, id: null });
    } else {
      setCreators((prev) => [
        { id: Date.now(), ...creatorForm, followers: Number(creatorForm.followers || 0), city: creatorForm.city || 'Unknown' },
        ...prev,
      ]);
    }
    setCreatorForm(EMPTY_CREATOR);
  }

  function upsertBrand(e) {
    e.preventDefault();
    if (!brandForm.name || !brandForm.industry) return;
    if (editing.type === 'brand') {
      setBrands((prev) => prev.map((b) => (b.id === editing.id ? { ...b, ...brandForm, budget: Number(brandForm.budget || 0) } : b)));
      setEditing({ type: null, id: null });
    } else {
      setBrands((prev) => [{ id: Date.now(), ...brandForm, budget: Number(brandForm.budget || 0) }, ...prev]);
    }
    setBrandForm(EMPTY_BRAND);
  }

  function upsertDeal(e) {
    e.preventDefault();
    if (!dealForm.brand || !dealForm.creator || !dealForm.type) return;
    if (editing.type === 'deal') {
      setDeals((prev) => prev.map((d) => (d.id === editing.id ? { ...d, ...dealForm, payout: Number(dealForm.payout || 0) } : d)));
      setEditing({ type: null, id: null });
    } else {
      setDeals((prev) => [{ id: Date.now(), ...dealForm, payout: Number(dealForm.payout || 0) }, ...prev]);
    }
    setDealForm(EMPTY_DEAL);
  }

  function startEdit(type, row) {
    setEditing({ type, id: row.id });
    if (type === 'creator') setCreatorForm({ ...row, followers: String(row.followers || '') });
    if (type === 'brand') setBrandForm({ ...row, budget: String(row.budget || '') });
    if (type === 'deal') setDealForm({ ...row, payout: String(row.payout || '') });
  }

  function onResetDemoData() {
    const data = resetAdminData();
    setCreators(data.creators);
    setBrands(data.brands);
    setDeals(data.deals);
    setMessage('Reset complete');
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <h1 className={styles.brand}>Creator Hub CRM</h1>
          <p className={styles.sidebarHint}>Web-first admin panel, mobile compatible.</p>
          <nav className={styles.nav}>
            {['Overview', 'Creators', 'Brands', 'Deals'].map((tab) => (
              <button key={tab} className={`${styles.navBtn} ${activeTab === tab ? styles.navActive : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        <section className={styles.main}>
          <header className={styles.header}>
            <div>
              <h2>Admin Dashboard</h2>
              <p>Direct access enabled now. Login gate can be added next.</p>
            </div>
            <div className={styles.headerActions}>
              <div className={`${styles.connectivity} ${online ? styles.online : styles.offline}`}>
                {online ? <Wifi size={14} /> : <WifiOff size={14} />}
                {online ? 'Online' : 'Offline'}
              </div>
              <button className="btn btn-secondary" onClick={onResetDemoData}>
                <RefreshCcw size={14} />
                Reset Data
              </button>
              <span className={styles.saveState}>
                <Save size={14} />
                {saving ? 'Saving...' : message || 'Ready'}
              </span>
            </div>
          </header>

          <div className={styles.searchRow}>
            <input className="input-field" placeholder="Search creators, brands, deals..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <section className={styles.kpiGrid}>
            <KpiCard title="Total Creators" value={totals.creators} icon={<Users size={16} />} />
            <KpiCard title="Total Brands" value={totals.brands} icon={<Building2 size={16} />} />
            <KpiCard title="Total Deals" value={totals.deals} icon={<BarChart3 size={16} />} />
            <KpiCard title="Deal Value" value={`INR ${totals.totalDealValue.toLocaleString('en-IN')}`} subtitle={`${totals.activeDeals} active`} icon={<BadgeIndianRupee size={16} />} />
          </section>

          {(activeTab === 'Overview' || activeTab === 'Creators') && (
            <section className={styles.panel}>
              <div className={styles.panelHead}><h3>{editing.type === 'creator' ? 'Edit Creator' : 'Create Creator'}</h3><Plus size={14} /></div>
              <form className={styles.form} onSubmit={upsertCreator}>
                <input className="input-field" placeholder="Creator name" value={creatorForm.name} onChange={(e) => setCreatorForm((v) => ({ ...v, name: e.target.value }))} />
                <input className="input-field" placeholder="Niche" value={creatorForm.niche} onChange={(e) => setCreatorForm((v) => ({ ...v, niche: e.target.value }))} />
                <input className="input-field" placeholder="Followers" type="number" value={creatorForm.followers} onChange={(e) => setCreatorForm((v) => ({ ...v, followers: e.target.value }))} />
                <input className="input-field" placeholder="City" value={creatorForm.city} onChange={(e) => setCreatorForm((v) => ({ ...v, city: e.target.value }))} />
                <button type="submit" className="btn btn-primary">{editing.type === 'creator' ? 'Update Creator' : 'Add Creator'}</button>
              </form>
            </section>
          )}

          {(activeTab === 'Overview' || activeTab === 'Brands') && (
            <section className={styles.panel}>
              <div className={styles.panelHead}><h3>{editing.type === 'brand' ? 'Edit Brand' : 'Create Brand'}</h3><Plus size={14} /></div>
              <form className={styles.form} onSubmit={upsertBrand}>
                <input className="input-field" placeholder="Brand name" value={brandForm.name} onChange={(e) => setBrandForm((v) => ({ ...v, name: e.target.value }))} />
                <input className="input-field" placeholder="Industry" value={brandForm.industry} onChange={(e) => setBrandForm((v) => ({ ...v, industry: e.target.value }))} />
                <input className="input-field" placeholder="Budget" type="number" value={brandForm.budget} onChange={(e) => setBrandForm((v) => ({ ...v, budget: e.target.value }))} />
                <button type="submit" className="btn btn-primary">{editing.type === 'brand' ? 'Update Brand' : 'Add Brand'}</button>
              </form>
            </section>
          )}

          {(activeTab === 'Overview' || activeTab === 'Deals') && (
            <section className={styles.panel}>
              <div className={styles.panelHead}><h3>{editing.type === 'deal' ? 'Edit Deal' : 'Create Deal'}</h3><Plus size={14} /></div>
              <form className={styles.form} onSubmit={upsertDeal}>
                <select className="input-field" value={dealForm.brand} onChange={(e) => setDealForm((v) => ({ ...v, brand: e.target.value }))}>
                  <option value="">Select brand</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                </select>
                <select className="input-field" value={dealForm.creator} onChange={(e) => setDealForm((v) => ({ ...v, creator: e.target.value }))}>
                  <option value="">Select creator</option>
                  {creators.map((creator) => <option key={creator.id} value={creator.name}>{creator.name}</option>)}
                </select>
                <input className="input-field" placeholder="Deliverable" value={dealForm.type} onChange={(e) => setDealForm((v) => ({ ...v, type: e.target.value }))} />
                <select className="input-field" value={dealForm.status} onChange={(e) => setDealForm((v) => ({ ...v, status: e.target.value }))}>
                  <option>Pending</option><option>Active</option><option>Completed</option>
                </select>
                <input className="input-field" type="number" placeholder="Payout" value={dealForm.payout} onChange={(e) => setDealForm((v) => ({ ...v, payout: e.target.value }))} />
                <button type="submit" className="btn btn-primary">{editing.type === 'deal' ? 'Update Deal' : 'Create Deal'}</button>
              </form>
            </section>
          )}

          <section className={styles.tableGrid}>
            {(activeTab === 'Overview' || activeTab === 'Creators') && (
              <DataTable
                title="Creators"
                columns={['Name', 'Niche', 'Followers', 'City']}
                rows={filteredCreators}
                render={(c) => [c.name, c.niche, Number(c.followers || 0).toLocaleString('en-IN'), c.city]}
                onDelete={(id) => setCreators((prev) => prev.filter((c) => c.id !== id))}
                onEdit={(row) => startEdit('creator', row)}
              />
            )}
            {(activeTab === 'Overview' || activeTab === 'Brands') && (
              <DataTable
                title="Brands"
                columns={['Name', 'Industry', 'Budget']}
                rows={filteredBrands}
                render={(b) => [b.name, b.industry, `INR ${Number(b.budget || 0).toLocaleString('en-IN')}`]}
                onDelete={(id) => setBrands((prev) => prev.filter((b) => b.id !== id))}
                onEdit={(row) => startEdit('brand', row)}
              />
            )}
            {(activeTab === 'Overview' || activeTab === 'Deals') && (
              <DataTable
                title="Deals"
                columns={['Brand', 'Creator', 'Deliverable', 'Status', 'Payout']}
                rows={filteredDeals}
                render={(d) => [d.brand, d.creator, d.type, d.status, `INR ${Number(d.payout || 0).toLocaleString('en-IN')}`]}
                onDelete={(id) => setDeals((prev) => prev.filter((d) => d.id !== id))}
                onEdit={(row) => startEdit('deal', row)}
                onToggleStatus={(id) =>
                  setDeals((prev) =>
                    prev.map((d) =>
                      d.id === id
                        ? { ...d, status: d.status === 'Pending' ? 'Active' : d.status === 'Active' ? 'Completed' : 'Pending' }
                        : d,
                    ),
                  )
                }
              />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function KpiCard({ title, value, subtitle, icon }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcon}>{icon}</div>
      <p className={styles.kpiTitle}>{title}</p>
      <h3 className={styles.kpiValue}>{value}</h3>
      {subtitle && <span className={styles.kpiSubtitle}>{subtitle}</span>}
    </div>
  );
}

function DataTable({ title, columns, rows, render, onDelete, onEdit, onToggleStatus }) {
  return (
    <div className={styles.tablePanel}>
      <h3>{title}</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => <th key={column}>{column}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.id}`}>
                {render(row).map((cell, i) => <td key={`${title}-${row.id}-${i}`}>{cell}</td>)}
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.editBtn} onClick={() => onEdit(row)}><Pencil size={13} /></button>
                  {onToggleStatus && <button type="button" className={styles.statusBtn} onClick={() => onToggleStatus(row.id)}>Next Status</button>}
                  <button type="button" className={styles.deleteBtn} onClick={() => onDelete(row.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className={styles.emptyRow}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
