import { useEffect, useMemo, useState, useRef } from 'react';
import {
  AlertTriangle,
  BadgeIndianRupee,
  BarChart3,
  Building2,
  Headset,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { loadAdminData, resetAdminData, saveAdminData } from '../../services/adminStore';
import { isSupabaseEnabled, supabase } from '../../services/supabase';
import styles from './AdminDashboard.module.css';

const EMPTY_CREATOR = { name: '', niche: '', followers: '', city: '' };
const EMPTY_BRAND = {
  name: '',
  industry: '',
  budget: '',
  pan: '',
  gst: '',
  cin: '',
  email: '',
  phone: '',
  address: '',
  historyNote: '',
};
const EMPTY_DEAL = { brand: '', creator: '', type: '', status: 'Pending', payout: '' };
const EMPTY_TICKET = { source: 'App', title: '', raisedBy: '', severity: 'Medium', linkedDealId: '', status: 'Open' };

const DEAL_STAGES = ['Pending', 'Active', 'Completed'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [creators, setCreators] = useState([]);
  const [brands, setBrands] = useState([]);
  const [deals, setDeals] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatDraft, setChatDraft] = useState('');
  const [importError, setImportError] = useState('');
  const [isRemoteDeals, setIsRemoteDeals] = useState(false);

  const [query, setQuery] = useState('');
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [creatorForm, setCreatorForm] = useState(EMPTY_CREATOR);
  const [brandForm, setBrandForm] = useState(EMPTY_BRAND);
  const [dealForm, setDealForm] = useState(EMPTY_DEAL);
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET);

  const [drawer, setDrawer] = useState({ open: false, type: null, mode: 'create', id: null });

  useEffect(() => {
    const root = document.getElementById('root');
    root?.classList.add('admin-fullwidth');

    let mounted = true;
    async function loadData() {
      const data = await loadAdminData();
      let remoteDeals = [];
      if (isSupabaseEnabled) {
        const { data: supaDeals, error } = await supabase.from('creator_hub_deals').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(supaDeals) && supaDeals.length > 0) {
          remoteDeals = supaDeals;
        }
      }
      if (!mounted) return;
      setCreators(data.creators || []);
      setBrands(data.brands || []);
      setSupportTickets(data.supportTickets || []);
      setChats(data.chats || []);
      setSelectedChatId(data.chats?.[0]?.id || null);
      setIsRemoteDeals(remoteDeals.length > 0);
      setDeals(remoteDeals.length > 0 ? remoteDeals : data.deals || []);
      setLoading(false);
    }
    loadData();

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
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
    saveAdminData({ creators, brands, deals, companies: [], supportTickets, chats })
      .then(() => setMessage('Saved'))
      .finally(() => setSaving(false));
  }, [brands, chats, creators, deals, loading, supportTickets]);

  const totals = useMemo(() => {
    const totalDealValue = deals.reduce((sum, d) => sum + Number(d.payout || 0), 0);
    const activeDeals = deals.filter((d) => d.status === 'Active').length;
    const openIssues = supportTickets.filter((t) => t.status !== 'Resolved').length;
    return { creators: creators.length, brands: brands.length, deals: deals.length, activeDeals, totalDealValue, openIssues };
  }, [brands.length, creators.length, deals, supportTickets]);

  const dealStageCounts = useMemo(
    () => DEAL_STAGES.map((stage) => ({ stage, count: deals.filter((d) => d.status === stage).length })),
    [deals],
  );
  const maxStageCount = Math.max(...dealStageCounts.map((s) => s.count), 1);

  const issueSeverityCounts = useMemo(() => {
    const out = { High: 0, Medium: 0, Low: 0 };
    supportTickets.forEach((t) => {
      out[t.severity] = (out[t.severity] || 0) + 1;
    });
    return out;
  }, [supportTickets]);

  const filteredCreators = useMemo(
    () => creators.filter((c) => [c.name, c.niche, c.city].join(' ').toLowerCase().includes(query.toLowerCase())),
    [creators, query],
  );
  const filteredBrands = useMemo(
    () => brands.filter((b) => [b.name, b.industry, b.pan, b.gst].join(' ').toLowerCase().includes(query.toLowerCase())),
    [brands, query],
  );
  const filteredDeals = useMemo(
    () => deals.filter((d) => [d.brand, d.creator, d.type, d.status].join(' ').toLowerCase().includes(query.toLowerCase())),
    [deals, query],
  );
  const filteredTickets = useMemo(
    () => supportTickets.filter((t) => [t.title, t.raisedBy, t.source, t.status].join(' ').toLowerCase().includes(query.toLowerCase())),
    [supportTickets, query],
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  function openDrawer(type, mode = 'create', row = null) {
    setDrawer({ open: true, type, mode, id: row?.id ?? null });
    if (type === 'creator') {
      setCreatorForm(mode === 'edit' && row ? { ...row, followers: String(row.followers || '') } : EMPTY_CREATOR);
    }
    if (type === 'brand') {
      setBrandForm(
        mode === 'edit' && row
          ? { ...row, budget: String(row.budget || ''), historyNote: '' }
          : EMPTY_BRAND,
      );
    }
    if (type === 'deal') {
      setDealForm(mode === 'edit' && row ? { ...row, payout: String(row.payout || '') } : EMPTY_DEAL);
    }
    if (type === 'ticket') {
      setTicketForm(mode === 'edit' && row ? { ...row, linkedDealId: row.linkedDealId ? String(row.linkedDealId) : '' } : EMPTY_TICKET);
    }
  }

  function closeDrawer() {
    setDrawer({ open: false, type: null, mode: 'create', id: null });
  }

  function upsertCreator(e) {
    e.preventDefault();
    if (!creatorForm.name || !creatorForm.niche) return;
    const payload = { ...creatorForm, followers: Number(creatorForm.followers || 0), city: creatorForm.city || 'Unknown' };
    if (drawer.mode === 'edit') {
      setCreators((prev) => prev.map((c) => (c.id === drawer.id ? { ...c, ...payload } : c)));
    } else {
      setCreators((prev) => [{ id: Date.now(), ...payload }, ...prev]);
    }
    closeDrawer();
  }

  function upsertBrand(e) {
    e.preventDefault();
    if (!brandForm.name || !brandForm.pan || !brandForm.gst) return;
    const payload = {
      ...brandForm,
      budget: Number(brandForm.budget || 0),
      pan: brandForm.pan.toUpperCase(),
      gst: brandForm.gst.toUpperCase(),
      history: [],
    };
    if (drawer.mode === 'edit') {
      setBrands((prev) =>
        prev.map((b) =>
          b.id === drawer.id
            ? {
                ...b,
                ...payload,
                history: brandForm.historyNote
                  ? [{ date: new Date().toISOString().slice(0, 10), note: brandForm.historyNote }, ...(b.history || [])]
                  : b.history || [],
              }
            : b,
        ),
      );
    } else {
      setBrands((prev) => [
        {
          id: Date.now(),
          ...payload,
          history: brandForm.historyNote
            ? [{ date: new Date().toISOString().slice(0, 10), note: brandForm.historyNote }]
            : [],
        },
        ...prev,
      ]);
    }
    closeDrawer();
  }

  async function upsertDeal(e) {
    e.preventDefault();
    if (!dealForm.brand || !dealForm.creator || !dealForm.type) return;
    const payload = { ...dealForm, payout: Number(dealForm.payout || 0) };

    if (drawer.mode === 'edit') {
      setDeals((prev) => prev.map((d) => (d.id === drawer.id ? { ...d, ...payload } : d)));
      if (isSupabaseEnabled && payload.id) {
        await supabase.from('creator_hub_deals').upsert({ id: payload.id, ...payload }, { onConflict: 'id' });
      }
    } else {
      const item = { id: Date.now(), ...payload };
      setDeals((prev) => [item, ...prev]);
      if (isSupabaseEnabled) {
        await supabase.from('creator_hub_deals').insert({ ...item, status: item.status?.toLowerCase() || 'open' });
      }
    }
    closeDrawer();
  }

  function upsertTicket(e) {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.raisedBy) return;
    const payload = {
      ...ticketForm,
      linkedDealId: ticketForm.linkedDealId ? Number(ticketForm.linkedDealId) : null,
    };
    if (drawer.mode === 'edit') {
      setSupportTickets((prev) => prev.map((t) => (t.id === drawer.id ? { ...t, ...payload } : t)));
    } else {
      setSupportTickets((prev) => [{ id: Date.now(), ...payload, createdAt: new Date().toISOString() }, ...prev]);
    }
    closeDrawer();
  }

  function sendChatMessage(e) {
    e.preventDefault();
    if (!selectedChat || !chatDraft.trim()) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat.id
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: Date.now(),
                  from: 'admin',
                  text: chatDraft.trim(),
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ],
            }
          : c,
      ),
    );
    setChatDraft('');
  }

  function resetAll() {
    const data = resetAdminData();
    setCreators(data.creators);
    setBrands(data.brands);
    setDeals(data.deals);
    setSupportTickets(data.supportTickets);
    setChats(data.chats);
    setSelectedChatId(data.chats?.[0]?.id || null);
    setMessage('Reset complete');
  }

  async function importCsvFile(file) {
    setImportError('');
    if (!file) return;
    const raw = await file.text();
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setImportError('CSV file must contain headers and at least one row.');
      return;
    }
    const headers = lines[0].split(',').map((cell) => cell.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
    const rows = lines.slice(1).map((line) => {
      const values = line.match(/(?:"([^"]*)"|([^,]+))(?:,|$)/g)?.map((cell) => cell.replace(/(^,|,$)/g, '').replace(/^"|"$/g, '').trim()) || [];
      return headers.reduce((row, header, index) => {
        row[header] = values[index] || '';
        return row;
      }, {});
    }).filter(row => Object.values(row).some(Boolean));

    const normalized = rows.map((row) => {
      const name = row.name || row.full_name || row.creator_name || row.creator || row['user name'] || row['username'] || '';
      if (!name) return null;
      return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: name.trim(),
        username: row.username || row.handle || name.trim().toLowerCase().replace(/\s+/g, '_'),
        email: row.email || row.e_mail || '',
        city: row.city || row.location || row.base_city || '',
        niche: row.niche || row.industry || row.category || '',
        followers: Number(row.followers || row.audience || row.follower_count || 0),
        phone: row.phone || row.mobile || row.contact || '',
      };
    }).filter(Boolean);

    if (normalized.length === 0) {
      setImportError('No valid user rows were detected in the CSV file.');
      return;
    }

    setCreators((prev) => [...normalized, ...prev]);
    setMessage(`Imported ${normalized.length} users`);
  }

  function handleCsvInputChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    importCsvFile(file);
    event.target.value = '';
  }

  if (loading) return <main className={styles.page}><div className={styles.loading}>Loading admin center...</div></main>;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <h1 className={styles.brand}>Creator Hub CRM</h1>
          <p className={styles.sidebarHint}>Support contact point + full operations panel.</p>
          <nav className={styles.nav}>
            {['Overview', 'Creators', 'Brands', 'Deals', 'Support', 'Chats'].map((tab) => (
              <button key={tab} className={`${styles.navBtn} ${activeTab === tab ? styles.navActive : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        <section className={styles.main}>
          <header className={styles.header}>
            <div>
              <h2>Admin Control Desk</h2>
              <p>Monochrome theme. Left panel editing. Support-first communication hub.</p>
            </div>
            <div className={styles.headerActions}>
              <div className={`${styles.connectivity} ${online ? styles.online : styles.offline}`}>
                {online ? <Wifi size={14} /> : <WifiOff size={14} />}
                {online ? 'Online' : 'Offline'}
              </div>
              <button className={styles.actionBtn} onClick={() => fileInputRef.current?.click()}>
                <Plus size={14} />
                Import CSV
              </button>
              <button className={styles.actionBtn} onClick={resetAll}>
                <RefreshCcw size={14} />
                Reset
              </button>
              <span className={styles.saveState}>
                <Save size={14} />
                {saving ? 'Saving...' : message || 'Ready'}
              </span>
            </div>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCsvInputChange}
              style={{ display: 'none' }}
            />
          </header>

          <div className={styles.searchRow}>
            <input className="input-field" placeholder="Search current tab..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {importError && <div className={styles.importError}>{importError}</div>}

          <section className={styles.kpiGrid}>
            <KpiCard title="Creators" value={totals.creators} icon={<Users size={16} />} />
            <KpiCard title="Brands" value={totals.brands} icon={<Building2 size={16} />} />
            <KpiCard title="Deals" value={totals.deals} subtitle={`${totals.activeDeals} active`} icon={<BarChart3 size={16} />} />
            <KpiCard title="Deal Value" value={`INR ${totals.totalDealValue.toLocaleString('en-IN')}`} icon={<BadgeIndianRupee size={16} />} />
            <KpiCard title="Open Issues" value={totals.openIssues} icon={<AlertTriangle size={16} />} />
            <KpiCard title="Support Chats" value={chats.length} icon={<MessageSquare size={16} />} />
          </section>

          {activeTab === 'Overview' && (
            <section className={styles.overviewGrid}>
              <div className={styles.panel}>
                <div className={styles.panelHead}><h3>Deal Cycle</h3><BarChart3 size={14} /></div>
                <div className={styles.chartWrap}>
                  {dealStageCounts.map((s) => (
                    <div key={s.stage} className={styles.stageBarRow}>
                      <span>{s.stage}</span>
                      <div className={styles.stageBarTrack}>
                        <div className={styles.stageBarFill} style={{ width: `${(s.count / maxStageCount) * 100}%` }} />
                      </div>
                      <strong>{s.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.panel}>
                <div className={styles.panelHead}><h3>Support Split</h3><Headset size={14} /></div>
                <div className={styles.pieLegend}>
                  {['High', 'Medium', 'Low'].map((level) => (
                    <div key={level} className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${styles[`dot${level}`]}`} />
                      {level}: {issueSeverityCounts[level] || 0}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.panel}>
                <div className={styles.panelHead}><h3>Quick Actions</h3><Plus size={14} /></div>
                <div className={styles.quickActions}>
                  <button className={styles.actionBtn} onClick={() => openDrawer('creator')}>New Creator</button>
                  <button className={styles.actionBtn} onClick={() => openDrawer('brand')}>New Brand</button>
                  <button className={styles.actionBtn} onClick={() => openDrawer('deal')}>New Deal</button>
                  <button className={styles.actionBtn} onClick={() => openDrawer('ticket')}>Raise Issue</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'Creators' && (
            <>
              <div className={styles.tabHeader}>
                <h3>Creators</h3>
                <button className={styles.actionBtn} onClick={() => openDrawer('creator')}><Plus size={14} />Add Creator</button>
              </div>
              <DataTable
                title="Creator Directory"
                columns={['ID', 'Name', 'Niche', 'Followers', 'City']}
                rows={filteredCreators}
                render={(c) => [c.id, c.name, c.niche, Number(c.followers || 0).toLocaleString('en-IN'), c.city]}
                onDelete={(id) => setCreators((prev) => prev.filter((c) => c.id !== id))}
                onEdit={(row) => openDrawer('creator', 'edit', row)}
              />
            </>
          )}

          {activeTab === 'Brands' && (
            <>
              <div className={styles.tabHeader}>
                <h3>Brands & Company Details</h3>
                <button className={styles.actionBtn} onClick={() => openDrawer('brand')}><Plus size={14} />Add Brand</button>
              </div>
              <BrandTable
                rows={filteredBrands}
                onDelete={(id) => setBrands((prev) => prev.filter((b) => b.id !== id))}
                onEdit={(row) => openDrawer('brand', 'edit', row)}
              />
            </>
          )}

          {activeTab === 'Deals' && (
            <>
              <div className={styles.tabHeader}>
                <h3>Deal Pipeline</h3>
                <button className={styles.actionBtn} onClick={() => openDrawer('deal')}><Plus size={14} />Create Deal</button>
              </div>
              <DataTable
                title="Deals"
                columns={['ID', 'Brand', 'Creator', 'Deliverable', 'Status', 'Payout']}
                rows={filteredDeals}
                render={(d) => [d.id, d.brand, d.creator, d.type, d.status, `INR ${Number(d.payout || 0).toLocaleString('en-IN')}`]}
                onDelete={(id) => setDeals((prev) => prev.filter((d) => d.id !== id))}
                onEdit={(row) => openDrawer('deal', 'edit', row)}
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
            </>
          )}

          {activeTab === 'Support' && (
            <>
              <div className={styles.tabHeader}>
                <h3>Support Desk (Users Contact Us Here)</h3>
                <button className={styles.actionBtn} onClick={() => openDrawer('ticket')}><Plus size={14} />Raise Ticket</button>
              </div>
              <SupportTable
                rows={filteredTickets}
                onDelete={(id) => setSupportTickets((prev) => prev.filter((t) => t.id !== id))}
                onEdit={(row) => openDrawer('ticket', 'edit', row)}
                onStatusChange={(id) =>
                  setSupportTickets((prev) =>
                    prev.map((t) =>
                      t.id === id ? { ...t, status: t.status === 'Open' ? 'In Progress' : t.status === 'In Progress' ? 'Resolved' : 'Open' } : t,
                    ),
                  )
                }
              />
            </>
          )}

          {activeTab === 'Chats' && (
            <section className={styles.chatLayout}>
              <div className={styles.chatList}>
                <h3>Help Chat Inbox</h3>
                {chats.map((chat) => (
                  <button key={chat.id} className={`${styles.chatThread} ${selectedChatId === chat.id ? styles.chatThreadActive : ''}`} onClick={() => setSelectedChatId(chat.id)}>
                    <div>
                      <strong>{chat.participantName}</strong>
                      <p>{chat.participantType} • {chat.topic}</p>
                    </div>
                    {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
                  </button>
                ))}
              </div>
              <div className={styles.chatPanel}>
                {!selectedChat ? (
                  <div className={styles.emptyChat}>Select a chat thread</div>
                ) : (
                  <>
                    <div className={styles.chatHeader}>
                      <h3>{selectedChat.participantName}</h3>
                      <span>{selectedChat.participantType}</span>
                    </div>
                    <div className={styles.chatMessages}>
                      {selectedChat.messages.map((m) => (
                        <div key={m.id} className={`${styles.msg} ${m.from === 'admin' ? styles.msgAdmin : styles.msgOther}`}>
                          <p>{m.text}</p>
                          <span>{m.time}</span>
                        </div>
                      ))}
                    </div>
                    <form className={styles.chatComposer} onSubmit={sendChatMessage}>
                      <input className="input-field" placeholder="Reply as support team..." value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} />
                      <button type="submit" className={styles.actionBtn}>Send</button>
                    </form>
                  </>
                )}
              </div>
            </section>
          )}
        </section>
      </div>

      {drawer.open && (
        <>
          <div className={styles.drawerBackdrop} onClick={closeDrawer} />
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h3>{drawer.mode === 'edit' ? `Edit ${capitalize(drawer.type)} #${drawer.id}` : `Create ${capitalize(drawer.type)}`}</h3>
              <button className={styles.iconBtn} onClick={closeDrawer}><X size={16} /></button>
            </div>

            {drawer.type === 'creator' && (
              <form className={styles.drawerForm} onSubmit={upsertCreator}>
                <input className="input-field" placeholder="Name" value={creatorForm.name} onChange={(e) => setCreatorForm((v) => ({ ...v, name: e.target.value }))} />
                <input className="input-field" placeholder="Niche" value={creatorForm.niche} onChange={(e) => setCreatorForm((v) => ({ ...v, niche: e.target.value }))} />
                <input className="input-field" type="number" placeholder="Followers" value={creatorForm.followers} onChange={(e) => setCreatorForm((v) => ({ ...v, followers: e.target.value }))} />
                <input className="input-field" placeholder="City" value={creatorForm.city} onChange={(e) => setCreatorForm((v) => ({ ...v, city: e.target.value }))} />
                <button className={styles.actionBtn} type="submit">{drawer.mode === 'edit' ? 'Update Creator' : 'Create Creator'}</button>
              </form>
            )}

            {drawer.type === 'brand' && (
              <form className={styles.drawerForm} onSubmit={upsertBrand}>
                <input className="input-field" placeholder="Company / Brand Name" value={brandForm.name} onChange={(e) => setBrandForm((v) => ({ ...v, name: e.target.value }))} />
                <input className="input-field" placeholder="Industry" value={brandForm.industry} onChange={(e) => setBrandForm((v) => ({ ...v, industry: e.target.value }))} />
                <input className="input-field" type="number" placeholder="Budget" value={brandForm.budget} onChange={(e) => setBrandForm((v) => ({ ...v, budget: e.target.value }))} />
                <input className="input-field" placeholder="PAN" value={brandForm.pan} onChange={(e) => setBrandForm((v) => ({ ...v, pan: e.target.value }))} />
                <input className="input-field" placeholder="GST" value={brandForm.gst} onChange={(e) => setBrandForm((v) => ({ ...v, gst: e.target.value }))} />
                <input className="input-field" placeholder="CIN" value={brandForm.cin} onChange={(e) => setBrandForm((v) => ({ ...v, cin: e.target.value }))} />
                <input className="input-field" placeholder="Email" value={brandForm.email} onChange={(e) => setBrandForm((v) => ({ ...v, email: e.target.value }))} />
                <input className="input-field" placeholder="Phone" value={brandForm.phone} onChange={(e) => setBrandForm((v) => ({ ...v, phone: e.target.value }))} />
                <input className="input-field" placeholder="Address" value={brandForm.address} onChange={(e) => setBrandForm((v) => ({ ...v, address: e.target.value }))} />
                <textarea className="input-field" placeholder="History / notes" value={brandForm.historyNote} onChange={(e) => setBrandForm((v) => ({ ...v, historyNote: e.target.value }))} />
                <button className={styles.actionBtn} type="submit">{drawer.mode === 'edit' ? 'Update Brand' : 'Create Brand'}</button>
              </form>
            )}

            {drawer.type === 'deal' && (
              <form className={styles.drawerForm} onSubmit={upsertDeal}>
                <select className="input-field" value={dealForm.brand} onChange={(e) => setDealForm((v) => ({ ...v, brand: e.target.value }))}>
                  <option value="">Select brand</option>
                  {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <select className="input-field" value={dealForm.creator} onChange={(e) => setDealForm((v) => ({ ...v, creator: e.target.value }))}>
                  <option value="">Select creator</option>
                  {creators.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <input className="input-field" placeholder="Deliverable" value={dealForm.type} onChange={(e) => setDealForm((v) => ({ ...v, type: e.target.value }))} />
                <select className="input-field" value={dealForm.status} onChange={(e) => setDealForm((v) => ({ ...v, status: e.target.value }))}>
                  <option>Pending</option><option>Active</option><option>Completed</option>
                </select>
                <input className="input-field" type="number" placeholder="Payout" value={dealForm.payout} onChange={(e) => setDealForm((v) => ({ ...v, payout: e.target.value }))} />
                <button className={styles.actionBtn} type="submit">{drawer.mode === 'edit' ? 'Update Deal' : 'Create Deal'}</button>
              </form>
            )}

            {drawer.type === 'ticket' && (
              <form className={styles.drawerForm} onSubmit={upsertTicket}>
                <select className="input-field" value={ticketForm.source} onChange={(e) => setTicketForm((v) => ({ ...v, source: e.target.value }))}>
                  <option>App</option><option>Brand Portal</option><option>Creator Panel</option>
                </select>
                <input className="input-field" placeholder="Issue title" value={ticketForm.title} onChange={(e) => setTicketForm((v) => ({ ...v, title: e.target.value }))} />
                <input className="input-field" placeholder="Raised by" value={ticketForm.raisedBy} onChange={(e) => setTicketForm((v) => ({ ...v, raisedBy: e.target.value }))} />
                <select className="input-field" value={ticketForm.severity} onChange={(e) => setTicketForm((v) => ({ ...v, severity: e.target.value }))}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
                <select className="input-field" value={ticketForm.status} onChange={(e) => setTicketForm((v) => ({ ...v, status: e.target.value }))}>
                  <option>Open</option><option>In Progress</option><option>Resolved</option>
                </select>
                <select className="input-field" value={ticketForm.linkedDealId} onChange={(e) => setTicketForm((v) => ({ ...v, linkedDealId: e.target.value }))}>
                  <option value="">Link deal (optional)</option>
                  {deals.map((d) => <option key={d.id} value={d.id}>{d.id} • {d.brand} × {d.creator}</option>)}
                </select>
                <button className={styles.actionBtn} type="submit">{drawer.mode === 'edit' ? 'Update Ticket' : 'Raise Ticket'}</button>
              </form>
            )}
          </aside>
        </>
      )}
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
                  <button type="button" className={styles.iconBtn} onClick={() => onEdit(row)}><Pencil size={13} /></button>
                  {onToggleStatus && <button type="button" className={styles.actionBtnSmall} onClick={() => onToggleStatus(row.id)}>Next</button>}
                  <button type="button" className={styles.iconBtnDanger} onClick={() => onDelete(row.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={columns.length + 1} className={styles.emptyRow}>No records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BrandTable({ rows, onDelete, onEdit }) {
  return (
    <div className={styles.tablePanel}>
      <h3>Brand / Company Records</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Industry</th><th>PAN</th><th>GST</th><th>CIN</th><th>Contact</th><th>Address</th><th>History</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.industry}</td>
                <td>{row.pan}</td>
                <td>{row.gst}</td>
                <td>{row.cin || '-'}</td>
                <td>{row.email}<br />{row.phone}</td>
                <td>{row.address}</td>
                <td>{(row.history || []).slice(0, 2).map((h, i) => <div key={i}>{h.date}: {h.note}</div>)}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.iconBtn} onClick={() => onEdit(row)}><Pencil size={13} /></button>
                  <button type="button" className={styles.iconBtnDanger} onClick={() => onDelete(row.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={10} className={styles.emptyRow}>No brand records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupportTable({ rows, onDelete, onEdit, onStatusChange }) {
  return (
    <div className={styles.tablePanel}>
      <h3>Support Queue</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th><th>Source</th><th>Title</th><th>Raised By</th><th>Severity</th><th>Status</th><th>Linked Deal</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.source}</td>
                <td>{row.title}</td>
                <td>{row.raisedBy}</td>
                <td>{row.severity}</td>
                <td>{row.status}</td>
                <td>{row.linkedDealId || '-'}</td>
                <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className={styles.actionsCell}>
                  <button type="button" className={styles.iconBtn} onClick={() => onEdit(row)}><Pencil size={13} /></button>
                  <button type="button" className={styles.actionBtnSmall} onClick={() => onStatusChange(row.id)}>Move</button>
                  <button type="button" className={styles.iconBtnDanger} onClick={() => onDelete(row.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className={styles.emptyRow}>No tickets found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
