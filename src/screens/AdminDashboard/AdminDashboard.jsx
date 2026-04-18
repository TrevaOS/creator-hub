import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Users, Building2, BadgeIndianRupee, Plus, Trash2, Save, RefreshCcw, Wifi, WifiOff, Pencil, Headset, MessageSquare, AlertTriangle } from 'lucide-react';
import { loadAdminData, resetAdminData, saveAdminData } from '../../services/adminStore';
import styles from './AdminDashboard.module.css';

const EMPTY_CREATOR = { name: '', niche: '', followers: '', city: '' };
const EMPTY_BRAND = { name: '', industry: '', budget: '' };
const EMPTY_DEAL = { brand: '', creator: '', type: '', status: 'Pending', payout: '' };
const EMPTY_COMPANY = { name: '', industry: '', pan: '', gst: '', cin: '', email: '', phone: '', address: '', historyNote: '' };
const EMPTY_TICKET = { source: 'App', title: '', raisedBy: '', severity: 'Medium', linkedDealId: '', status: 'Open' };

const DEAL_STAGES = ['Pending', 'Active', 'Completed'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [creators, setCreators] = useState([]);
  const [brands, setBrands] = useState([]);
  const [deals, setDeals] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatDraft, setChatDraft] = useState('');

  const [query, setQuery] = useState('');
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [creatorForm, setCreatorForm] = useState(EMPTY_CREATOR);
  const [brandForm, setBrandForm] = useState(EMPTY_BRAND);
  const [dealForm, setDealForm] = useState(EMPTY_DEAL);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY);
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET);
  const [editing, setEditing] = useState({ type: null, id: null });

  useEffect(() => {
    const root = document.getElementById('root');
    root?.classList.add('admin-fullwidth');
    let mounted = true;
    loadAdminData().then((data) => {
      if (!mounted) return;
      setCreators(data.creators || []);
      setBrands(data.brands || []);
      setDeals(data.deals || []);
      setCompanies(data.companies || []);
      setSupportTickets(data.supportTickets || []);
      setChats(data.chats || []);
      setSelectedChatId(data.chats?.[0]?.id || null);
      setLoading(false);
    });

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
    saveAdminData({ creators, brands, deals, companies, supportTickets, chats }).then(() => setMessage('Saved')).finally(() => setSaving(false));
  }, [brands, chats, companies, creators, deals, loading, supportTickets]);

  const totals = useMemo(() => {
    const totalDealValue = deals.reduce((sum, d) => sum + Number(d.payout || 0), 0);
    const activeDeals = deals.filter((d) => d.status === 'Active').length;
    const openIssues = supportTickets.filter((t) => t.status !== 'Resolved').length;
    return { creators: creators.length, brands: brands.length, deals: deals.length, activeDeals, totalDealValue, openIssues };
  }, [brands.length, creators.length, deals, supportTickets]);

  const dealStageCounts = useMemo(() => {
    return DEAL_STAGES.map((stage) => ({ stage, count: deals.filter((d) => d.status === stage).length }));
  }, [deals]);
  const maxStageCount = Math.max(...dealStageCounts.map((s) => s.count), 1);

  const issueSeverityCounts = useMemo(() => {
    const out = { High: 0, Medium: 0, Low: 0 };
    supportTickets.forEach((t) => { out[t.severity] = (out[t.severity] || 0) + 1; });
    return out;
  }, [supportTickets]);

  const filteredCompanies = useMemo(() => companies.filter((c) => [c.name, c.industry, c.pan, c.gst].join(' ').toLowerCase().includes(query.toLowerCase())), [companies, query]);
  const filteredDeals = useMemo(() => deals.filter((d) => [d.brand, d.creator, d.type, d.status].join(' ').toLowerCase().includes(query.toLowerCase())), [deals, query]);
  const filteredTickets = useMemo(() => supportTickets.filter((t) => [t.title, t.raisedBy, t.source, t.status].join(' ').toLowerCase().includes(query.toLowerCase())), [supportTickets, query]);

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  function clearEdit() { setEditing({ type: null, id: null }); }

  function upsertCreator(e) {
    e.preventDefault();
    if (!creatorForm.name || !creatorForm.niche) return;
    const payload = { ...creatorForm, followers: Number(creatorForm.followers || 0), city: creatorForm.city || 'Unknown' };
    if (editing.type === 'creator') {
      setCreators((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...payload } : c)));
    } else {
      setCreators((prev) => [{ id: Date.now(), ...payload }, ...prev]);
    }
    setCreatorForm(EMPTY_CREATOR); clearEdit();
  }

  function upsertBrand(e) {
    e.preventDefault();
    if (!brandForm.name || !brandForm.industry) return;
    const payload = { ...brandForm, budget: Number(brandForm.budget || 0) };
    if (editing.type === 'brand') setBrands((prev) => prev.map((b) => (b.id === editing.id ? { ...b, ...payload } : b)));
    else setBrands((prev) => [{ id: Date.now(), ...payload }, ...prev]);
    setBrandForm(EMPTY_BRAND); clearEdit();
  }

  function upsertDeal(e) {
    e.preventDefault();
    if (!dealForm.brand || !dealForm.creator || !dealForm.type) return;
    const payload = { ...dealForm, payout: Number(dealForm.payout || 0) };
    if (editing.type === 'deal') setDeals((prev) => prev.map((d) => (d.id === editing.id ? { ...d, ...payload } : d)));
    else setDeals((prev) => [{ id: Date.now(), ...payload }, ...prev]);
    setDealForm(EMPTY_DEAL); clearEdit();
  }

  function upsertCompany(e) {
    e.preventDefault();
    if (!companyForm.name || !companyForm.pan || !companyForm.gst) return;
    const payload = {
      name: companyForm.name,
      industry: companyForm.industry,
      pan: companyForm.pan.toUpperCase(),
      gst: companyForm.gst.toUpperCase(),
      cin: companyForm.cin,
      email: companyForm.email,
      phone: companyForm.phone,
      address: companyForm.address,
    };
    if (editing.type === 'company') {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? {
                ...c,
                ...payload,
                history: companyForm.historyNote ? [{ date: new Date().toISOString().slice(0, 10), note: companyForm.historyNote }, ...(c.history || [])] : c.history || [],
              }
            : c,
        ),
      );
    } else {
      setCompanies((prev) => [{ id: Date.now(), ...payload, history: companyForm.historyNote ? [{ date: new Date().toISOString().slice(0, 10), note: companyForm.historyNote }] : [] }, ...prev]);
    }
    setCompanyForm(EMPTY_COMPANY); clearEdit();
  }

  function createTicket(e) {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.raisedBy) return;
    setSupportTickets((prev) => [{ id: Date.now(), ...ticketForm, linkedDealId: ticketForm.linkedDealId ? Number(ticketForm.linkedDealId) : null, createdAt: new Date().toISOString() }, ...prev]);
    setTicketForm(EMPTY_TICKET);
  }

  function sendChatMessage(e) {
    e.preventDefault();
    if (!selectedChat || !chatDraft.trim()) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat.id
          ? { ...c, messages: [...c.messages, { id: Date.now(), from: 'admin', text: chatDraft.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] }
          : c,
      ),
    );
    setChatDraft('');
  }

  function startEdit(type, row) {
    setEditing({ type, id: row.id });
    if (type === 'creator') setCreatorForm({ ...row, followers: String(row.followers || '') });
    if (type === 'brand') setBrandForm({ ...row, budget: String(row.budget || '') });
    if (type === 'deal') setDealForm({ ...row, payout: String(row.payout || '') });
    if (type === 'company') setCompanyForm({ ...row, historyNote: '' });
  }

  function resetAll() {
    const data = resetAdminData();
    setCreators(data.creators); setBrands(data.brands); setDeals(data.deals); setCompanies(data.companies); setSupportTickets(data.supportTickets); setChats(data.chats); setSelectedChatId(data.chats?.[0]?.id || null);
    setMessage('Reset complete');
  }

  if (loading) return <main className={styles.page}><div className={styles.loading}>Loading admin center...</div></main>;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <h1 className={styles.brand}>Creator Hub CRM</h1>
          <p className={styles.sidebarHint}>Everything interlinked: deals, support, company records, chat.</p>
          <nav className={styles.nav}>
            {['Overview', 'Deals', 'Companies', 'Support', 'Chats'].map((tab) => (
              <button key={tab} className={`${styles.navBtn} ${activeTab === tab ? styles.navActive : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </nav>
        </aside>

        <section className={styles.main}>
          <header className={styles.header}>
            <div>
              <h2>Admin Command Center</h2>
              <p>Web-first dashboard with mobile compatibility and linked app operations.</p>
            </div>
            <div className={styles.headerActions}>
              <div className={`${styles.connectivity} ${online ? styles.online : styles.offline}`}>{online ? <Wifi size={14} /> : <WifiOff size={14} />}{online ? 'Online' : 'Offline'}</div>
              <button className="btn btn-secondary" onClick={resetAll}><RefreshCcw size={14} />Reset</button>
              <span className={styles.saveState}><Save size={14} />{saving ? 'Saving...' : message || 'Ready'}</span>
            </div>
          </header>

          <div className={styles.searchRow}><input className="input-field" placeholder="Global search..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>

          <section className={styles.kpiGrid}>
            <KpiCard title="Creators" value={totals.creators} icon={<Users size={16} />} />
            <KpiCard title="Brands" value={totals.brands} icon={<Building2 size={16} />} />
            <KpiCard title="Deals" value={totals.deals} subtitle={`${totals.activeDeals} active`} icon={<BarChart3 size={16} />} />
            <KpiCard title="Deal Value" value={`INR ${totals.totalDealValue.toLocaleString('en-IN')}`} icon={<BadgeIndianRupee size={16} />} />
            <KpiCard title="Open Issues" value={totals.openIssues} icon={<AlertTriangle size={16} />} />
            <KpiCard title="Active Chats" value={chats.length} icon={<MessageSquare size={16} />} />
          </section>

          {activeTab === 'Overview' && (
            <section className={styles.overviewGrid}>
              <div className={styles.panel}>
                <div className={styles.panelHead}><h3>Deal Cycle</h3><BarChart3 size={14} /></div>
                <div className={styles.chartWrap}>
                  {dealStageCounts.map((s) => (
                    <div key={s.stage} className={styles.stageBarRow}>
                      <span>{s.stage}</span>
                      <div className={styles.stageBarTrack}><div className={styles.stageBarFill} style={{ width: `${(s.count / maxStageCount) * 100}%` }} /></div>
                      <strong>{s.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.panel}>
                <div className={styles.panelHead}><h3>Support Severity Split</h3><Headset size={14} /></div>
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
                <div className={styles.panelHead}><h3>Quick Ticket Create</h3><Plus size={14} /></div>
                <form className={styles.formCompact} onSubmit={createTicket}>
                  <input className="input-field" placeholder="Issue title" value={ticketForm.title} onChange={(e) => setTicketForm((v) => ({ ...v, title: e.target.value }))} />
                  <input className="input-field" placeholder="Raised by" value={ticketForm.raisedBy} onChange={(e) => setTicketForm((v) => ({ ...v, raisedBy: e.target.value }))} />
                  <select className="input-field" value={ticketForm.severity} onChange={(e) => setTicketForm((v) => ({ ...v, severity: e.target.value }))}><option>High</option><option>Medium</option><option>Low</option></select>
                  <button type="submit" className="btn btn-primary">Raise Ticket</button>
                </form>
              </div>
            </section>
          )}

          {activeTab === 'Deals' && (
            <>
              <section className={styles.panel}>
                <div className={styles.panelHead}><h3>{editing.type === 'deal' ? 'Edit Deal' : 'Create Deal'}</h3><Plus size={14} /></div>
                <form className={styles.form} onSubmit={upsertDeal}>
                  <select className="input-field" value={dealForm.brand} onChange={(e) => setDealForm((v) => ({ ...v, brand: e.target.value }))}><option value="">Select brand</option>{brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}</select>
                  <select className="input-field" value={dealForm.creator} onChange={(e) => setDealForm((v) => ({ ...v, creator: e.target.value }))}><option value="">Select creator</option>{creators.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
                  <input className="input-field" placeholder="Deliverable" value={dealForm.type} onChange={(e) => setDealForm((v) => ({ ...v, type: e.target.value }))} />
                  <select className="input-field" value={dealForm.status} onChange={(e) => setDealForm((v) => ({ ...v, status: e.target.value }))}><option>Pending</option><option>Active</option><option>Completed</option></select>
                  <input className="input-field" type="number" placeholder="Payout" value={dealForm.payout} onChange={(e) => setDealForm((v) => ({ ...v, payout: e.target.value }))} />
                  <button type="submit" className="btn btn-primary">{editing.type === 'deal' ? 'Update Deal' : 'Create Deal'}</button>
                </form>
              </section>
              <DataTable
                title="Deal Pipeline"
                columns={['Brand', 'Creator', 'Deliverable', 'Status', 'Payout']}
                rows={filteredDeals}
                render={(d) => [d.brand, d.creator, d.type, d.status, `INR ${Number(d.payout || 0).toLocaleString('en-IN')}`]}
                onDelete={(id) => setDeals((prev) => prev.filter((d) => d.id !== id))}
                onEdit={(row) => startEdit('deal', row)}
                onToggleStatus={(id) => setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, status: d.status === 'Pending' ? 'Active' : d.status === 'Active' ? 'Completed' : 'Pending' } : d)))}
              />
            </>
          )}

          {activeTab === 'Companies' && (
            <>
              <section className={styles.panel}>
                <div className={styles.panelHead}><h3>{editing.type === 'company' ? 'Edit Company Profile' : 'Create Company Profile'}</h3><Building2 size={14} /></div>
                <form className={styles.form} onSubmit={upsertCompany}>
                  <input className="input-field" placeholder="Company name" value={companyForm.name} onChange={(e) => setCompanyForm((v) => ({ ...v, name: e.target.value }))} />
                  <input className="input-field" placeholder="Industry" value={companyForm.industry} onChange={(e) => setCompanyForm((v) => ({ ...v, industry: e.target.value }))} />
                  <input className="input-field" placeholder="PAN" value={companyForm.pan} onChange={(e) => setCompanyForm((v) => ({ ...v, pan: e.target.value }))} />
                  <input className="input-field" placeholder="GST" value={companyForm.gst} onChange={(e) => setCompanyForm((v) => ({ ...v, gst: e.target.value }))} />
                  <input className="input-field" placeholder="CIN" value={companyForm.cin} onChange={(e) => setCompanyForm((v) => ({ ...v, cin: e.target.value }))} />
                  <input className="input-field" placeholder="Email" value={companyForm.email} onChange={(e) => setCompanyForm((v) => ({ ...v, email: e.target.value }))} />
                  <input className="input-field" placeholder="Phone" value={companyForm.phone} onChange={(e) => setCompanyForm((v) => ({ ...v, phone: e.target.value }))} />
                  <input className="input-field" placeholder="Address" value={companyForm.address} onChange={(e) => setCompanyForm((v) => ({ ...v, address: e.target.value }))} />
                  <input className="input-field" placeholder="History note (audit trail)" value={companyForm.historyNote} onChange={(e) => setCompanyForm((v) => ({ ...v, historyNote: e.target.value }))} />
                  <button type="submit" className="btn btn-primary">{editing.type === 'company' ? 'Update Company' : 'Create Company'}</button>
                </form>
              </section>
              <CompanyTable rows={filteredCompanies} onDelete={(id) => setCompanies((prev) => prev.filter((c) => c.id !== id))} onEdit={(row) => startEdit('company', row)} />
            </>
          )}

          {activeTab === 'Support' && (
            <>
              <section className={styles.panel}>
                <div className={styles.panelHead}><h3>Raise Support Ticket</h3><Headset size={14} /></div>
                <form className={styles.form} onSubmit={createTicket}>
                  <select className="input-field" value={ticketForm.source} onChange={(e) => setTicketForm((v) => ({ ...v, source: e.target.value }))}><option>App</option><option>Brand Portal</option><option>Creator Panel</option></select>
                  <input className="input-field" placeholder="Issue title" value={ticketForm.title} onChange={(e) => setTicketForm((v) => ({ ...v, title: e.target.value }))} />
                  <input className="input-field" placeholder="Raised by" value={ticketForm.raisedBy} onChange={(e) => setTicketForm((v) => ({ ...v, raisedBy: e.target.value }))} />
                  <select className="input-field" value={ticketForm.severity} onChange={(e) => setTicketForm((v) => ({ ...v, severity: e.target.value }))}><option>High</option><option>Medium</option><option>Low</option></select>
                  <select className="input-field" value={ticketForm.status} onChange={(e) => setTicketForm((v) => ({ ...v, status: e.target.value }))}><option>Open</option><option>In Progress</option><option>Resolved</option></select>
                  <select className="input-field" value={ticketForm.linkedDealId} onChange={(e) => setTicketForm((v) => ({ ...v, linkedDealId: e.target.value }))}><option value="">Link deal (optional)</option>{deals.map((d) => <option key={d.id} value={d.id}>{d.brand} × {d.creator}</option>)}</select>
                  <button type="submit" className="btn btn-primary">Create Ticket</button>
                </form>
              </section>
              <SupportTable
                rows={filteredTickets}
                onDelete={(id) => setSupportTickets((prev) => prev.filter((t) => t.id !== id))}
                onStatusChange={(id) =>
                  setSupportTickets((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, status: t.status === 'Open' ? 'In Progress' : t.status === 'In Progress' ? 'Resolved' : 'Open' } : t)),
                  )
                }
              />
            </>
          )}

          {activeTab === 'Chats' && (
            <section className={styles.chatLayout}>
              <div className={styles.chatList}>
                <h3>Chat Threads</h3>
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
                    <div className={styles.chatHeader}><h3>{selectedChat.participantName}</h3><span>{selectedChat.participantType}</span></div>
                    <div className={styles.chatMessages}>
                      {selectedChat.messages.map((m) => (
                        <div key={m.id} className={`${styles.msg} ${m.from === 'admin' ? styles.msgAdmin : styles.msgOther}`}>
                          <p>{m.text}</p>
                          <span>{m.time}</span>
                        </div>
                      ))}
                    </div>
                    <form className={styles.chatComposer} onSubmit={sendChatMessage}>
                      <input className="input-field" placeholder="Type reply..." value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} />
                      <button type="submit" className="btn btn-primary">Send</button>
                    </form>
                  </>
                )}
              </div>
            </section>
          )}

          <section className={styles.utilityRow}>
            <MiniForm title={editing.type === 'creator' ? 'Edit Creator' : 'Create Creator'} form={creatorForm} setForm={setCreatorForm} onSubmit={upsertCreator} editing={editing.type === 'creator'} fields={[['name', 'Name'], ['niche', 'Niche'], ['followers', 'Followers', 'number'], ['city', 'City']]} />
            <MiniForm title={editing.type === 'brand' ? 'Edit Brand' : 'Create Brand'} form={brandForm} setForm={setBrandForm} onSubmit={upsertBrand} editing={editing.type === 'brand'} fields={[['name', 'Brand name'], ['industry', 'Industry'], ['budget', 'Budget', 'number']]} />
          </section>
        </section>
      </div>
    </main>
  );
}

function KpiCard({ title, value, subtitle, icon }) {
  return <div className={styles.kpiCard}><div className={styles.kpiIcon}>{icon}</div><p className={styles.kpiTitle}>{title}</p><h3 className={styles.kpiValue}>{value}</h3>{subtitle && <span className={styles.kpiSubtitle}>{subtitle}</span>}</div>;
}

function MiniForm({ title, form, setForm, onSubmit, editing, fields }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}><h3>{title}</h3><Plus size={14} /></div>
      <form className={styles.formCompact} onSubmit={onSubmit}>
        {fields.map(([key, label, type = 'text']) => <input key={key} className="input-field" type={type} placeholder={label} value={form[key]} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} />)}
        <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
      </form>
    </section>
  );
}

function DataTable({ title, columns, rows, render, onDelete, onEdit, onToggleStatus }) {
  return (
    <div className={styles.tablePanel}>
      <h3>{title}</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}<th>Actions</th></tr></thead>
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
            {rows.length === 0 && <tr><td colSpan={columns.length + 1} className={styles.emptyRow}>No records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompanyTable({ rows, onDelete, onEdit }) {
  return (
    <div className={styles.tablePanel}>
      <h3>Company Master Records</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Name</th><th>Industry</th><th>PAN</th><th>GST</th><th>CIN</th><th>Contacts</th><th>History</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.industry}</td>
                <td>{row.pan}</td>
                <td>{row.gst}</td>
                <td>{row.cin || '-'}</td>
                <td>{row.email}<br />{row.phone}</td>
                <td>{(row.history || []).slice(0, 2).map((h, i) => <div key={i}>{h.date}: {h.note}</div>)}</td>
                <td className={styles.actionsCell}><button type="button" className={styles.editBtn} onClick={() => onEdit(row)}><Pencil size={13} /></button><button type="button" className={styles.deleteBtn} onClick={() => onDelete(row.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className={styles.emptyRow}>No company records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupportTable({ rows, onDelete, onStatusChange }) {
  return (
    <div className={styles.tablePanel}>
      <h3>Support Queue</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Source</th><th>Title</th><th>Raised By</th><th>Severity</th><th>Status</th><th>Linked Deal</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.source}</td>
                <td>{row.title}</td>
                <td>{row.raisedBy}</td>
                <td>{row.severity}</td>
                <td>{row.status}</td>
                <td>{row.linkedDealId || '-'}</td>
                <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className={styles.actionsCell}><button type="button" className={styles.statusBtn} onClick={() => onStatusChange(row.id)}>Move Status</button><button type="button" className={styles.deleteBtn} onClick={() => onDelete(row.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className={styles.emptyRow}>No tickets found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
