import { useMemo, useState } from 'react';
import { BarChart3, Users, Building2, BadgeIndianRupee, Plus, Trash2 } from 'lucide-react';
import styles from './AdminDashboard.module.css';

const INITIAL_CREATORS = [
  { id: 1, name: 'Priya Sharma', niche: 'Fashion', followers: 145000, city: 'Mumbai' },
  { id: 2, name: 'Rahul Verma', niche: 'Tech', followers: 89000, city: 'Bengaluru' },
  { id: 3, name: 'Aisha Khan', niche: 'Fitness', followers: 210000, city: 'Delhi' },
];

const INITIAL_BRANDS = [
  { id: 1, name: 'StyleCo', industry: 'Fashion', budget: 450000 },
  { id: 2, name: 'TechGear Pro', industry: 'Electronics', budget: 800000 },
  { id: 3, name: 'FitLife', industry: 'Health', budget: 350000 },
];

const INITIAL_DEALS = [
  {
    id: 1,
    brand: 'StyleCo',
    creator: 'Priya Sharma',
    type: '2 Reels + 3 Stories',
    status: 'Active',
    payout: 120000,
  },
  {
    id: 2,
    brand: 'TechGear Pro',
    creator: 'Rahul Verma',
    type: '1 Long Video',
    status: 'Pending',
    payout: 180000,
  },
];

export default function AdminDashboard() {
  const [creators, setCreators] = useState(INITIAL_CREATORS);
  const [brands, setBrands] = useState(INITIAL_BRANDS);
  const [deals, setDeals] = useState(INITIAL_DEALS);

  const [creatorForm, setCreatorForm] = useState({ name: '', niche: '', followers: '', city: '' });
  const [brandForm, setBrandForm] = useState({ name: '', industry: '', budget: '' });
  const [dealForm, setDealForm] = useState({ brand: '', creator: '', type: '', status: 'Pending', payout: '' });

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

  function addCreator(e) {
    e.preventDefault();
    if (!creatorForm.name || !creatorForm.niche) return;
    const newCreator = {
      id: Date.now(),
      name: creatorForm.name.trim(),
      niche: creatorForm.niche.trim(),
      followers: Number(creatorForm.followers || 0),
      city: creatorForm.city.trim() || 'Unknown',
    };
    setCreators((prev) => [newCreator, ...prev]);
    setCreatorForm({ name: '', niche: '', followers: '', city: '' });
  }

  function addBrand(e) {
    e.preventDefault();
    if (!brandForm.name || !brandForm.industry) return;
    const newBrand = {
      id: Date.now(),
      name: brandForm.name.trim(),
      industry: brandForm.industry.trim(),
      budget: Number(brandForm.budget || 0),
    };
    setBrands((prev) => [newBrand, ...prev]);
    setBrandForm({ name: '', industry: '', budget: '' });
  }

  function addDeal(e) {
    e.preventDefault();
    if (!dealForm.brand || !dealForm.creator || !dealForm.type) return;
    const newDeal = {
      id: Date.now(),
      brand: dealForm.brand,
      creator: dealForm.creator,
      type: dealForm.type.trim(),
      status: dealForm.status,
      payout: Number(dealForm.payout || 0),
    };
    setDeals((prev) => [newDeal, ...prev]);
    setDealForm({ brand: '', creator: '', type: '', status: 'Pending', payout: '' });
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <h1 className={styles.brand}>Creator Hub CRM</h1>
          <p className={styles.sidebarHint}>Direct access enabled for now.</p>

          <nav className={styles.nav}>
            <button className={`${styles.navBtn} ${styles.navActive}`}>Overview</button>
            <button className={styles.navBtn}>Creators</button>
            <button className={styles.navBtn}>Brands</button>
            <button className={styles.navBtn}>Deals</button>
          </nav>
        </aside>

        <section className={styles.main}>
          <header className={styles.header}>
            <div>
              <h2>Admin Dashboard</h2>
              <p>Manage creators, brands, deals, and platform pipeline in one place.</p>
            </div>
            <div className={styles.loginTag}>Admin Login: Bypassed</div>
          </header>

          <section className={styles.kpiGrid}>
            <KpiCard title="Total Creators" value={totals.creators} icon={<Users size={16} />} />
            <KpiCard title="Total Brands" value={totals.brands} icon={<Building2 size={16} />} />
            <KpiCard title="Total Deals" value={totals.deals} icon={<BarChart3 size={16} />} />
            <KpiCard
              title="Deal Value"
              value={`₹${totals.totalDealValue.toLocaleString('en-IN')}`}
              subtitle={`${totals.activeDeals} active`}
              icon={<BadgeIndianRupee size={16} />}
            />
          </section>

          <section className={styles.panelGrid}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h3>Create Creator</h3>
                <Plus size={14} />
              </div>
              <form className={styles.form} onSubmit={addCreator}>
                <input
                  className="input-field"
                  placeholder="Creator name"
                  value={creatorForm.name}
                  onChange={(e) => setCreatorForm((v) => ({ ...v, name: e.target.value }))}
                />
                <input
                  className="input-field"
                  placeholder="Niche"
                  value={creatorForm.niche}
                  onChange={(e) => setCreatorForm((v) => ({ ...v, niche: e.target.value }))}
                />
                <input
                  className="input-field"
                  placeholder="Followers"
                  type="number"
                  value={creatorForm.followers}
                  onChange={(e) => setCreatorForm((v) => ({ ...v, followers: e.target.value }))}
                />
                <input
                  className="input-field"
                  placeholder="City"
                  value={creatorForm.city}
                  onChange={(e) => setCreatorForm((v) => ({ ...v, city: e.target.value }))}
                />
                <button type="submit" className="btn btn-primary">Add Creator</button>
              </form>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h3>Create Brand</h3>
                <Plus size={14} />
              </div>
              <form className={styles.form} onSubmit={addBrand}>
                <input
                  className="input-field"
                  placeholder="Brand name"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm((v) => ({ ...v, name: e.target.value }))}
                />
                <input
                  className="input-field"
                  placeholder="Industry"
                  value={brandForm.industry}
                  onChange={(e) => setBrandForm((v) => ({ ...v, industry: e.target.value }))}
                />
                <input
                  className="input-field"
                  placeholder="Budget"
                  type="number"
                  value={brandForm.budget}
                  onChange={(e) => setBrandForm((v) => ({ ...v, budget: e.target.value }))}
                />
                <button type="submit" className="btn btn-primary">Add Brand</button>
              </form>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h3>Create Deal</h3>
                <Plus size={14} />
              </div>
              <form className={styles.form} onSubmit={addDeal}>
                <select
                  className="input-field"
                  value={dealForm.brand}
                  onChange={(e) => setDealForm((v) => ({ ...v, brand: e.target.value }))}
                >
                  <option value="">Select brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={dealForm.creator}
                  onChange={(e) => setDealForm((v) => ({ ...v, creator: e.target.value }))}
                >
                  <option value="">Select creator</option>
                  {creators.map((creator) => (
                    <option key={creator.id} value={creator.name}>
                      {creator.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input-field"
                  placeholder="Deliverable"
                  value={dealForm.type}
                  onChange={(e) => setDealForm((v) => ({ ...v, type: e.target.value }))}
                />
                <select
                  className="input-field"
                  value={dealForm.status}
                  onChange={(e) => setDealForm((v) => ({ ...v, status: e.target.value }))}
                >
                  <option>Pending</option>
                  <option>Active</option>
                  <option>Completed</option>
                </select>
                <input
                  className="input-field"
                  type="number"
                  placeholder="Payout"
                  value={dealForm.payout}
                  onChange={(e) => setDealForm((v) => ({ ...v, payout: e.target.value }))}
                />
                <button type="submit" className="btn btn-primary">Create Deal</button>
              </form>
            </div>
          </section>

          <section className={styles.tableGrid}>
            <DataTable
              title="Creators"
              columns={['Name', 'Niche', 'Followers', 'City']}
              rows={creators.map((c) => [c.name, c.niche, c.followers.toLocaleString('en-IN'), c.city])}
              onDelete={(index) => setCreators((prev) => prev.filter((_, i) => i !== index))}
            />
            <DataTable
              title="Brands"
              columns={['Name', 'Industry', 'Budget']}
              rows={brands.map((b) => [b.name, b.industry, `₹${b.budget.toLocaleString('en-IN')}`])}
              onDelete={(index) => setBrands((prev) => prev.filter((_, i) => i !== index))}
            />
            <DataTable
              title="Deals"
              columns={['Brand', 'Creator', 'Deliverable', 'Status', 'Payout']}
              rows={deals.map((d) => [d.brand, d.creator, d.type, d.status, `₹${d.payout.toLocaleString('en-IN')}`])}
              onDelete={(index) => setDeals((prev) => prev.filter((_, i) => i !== index))}
            />
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

function DataTable({ title, columns, rows, onDelete }) {
  return (
    <div className={styles.tablePanel}>
      <h3>{title}</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>
                {row.map((cell, i) => (
                  <td key={`${title}-${rowIndex}-${i}`}>{cell}</td>
                ))}
                <td>
                  <button type="button" className={styles.deleteBtn} onClick={() => onDelete(rowIndex)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className={styles.emptyRow}>No records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
