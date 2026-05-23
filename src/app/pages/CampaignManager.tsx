import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { X, Calendar, MapPin, ChevronRight, ChevronLeft, CheckCircle2, Circle, Clock, FileText, BarChart2, Users, Filter, Download, Activity } from 'lucide-react';
import { CAMPAIGNS } from './CampaignsList';

type CampaignStatus = 'awaiting' | 'booked' | 'content' | 'done';

interface Campaign {
  id: string;
  name: string;
  handle: string;
  followers: string;
  engagement: string;
  offer: string;
  status: CampaignStatus;
  deadline: string;
  img: string;
  date?: string;
  time?: string;
  pax?: number;
  reach?: string;
}

const campaigns: Campaign[] = [
  { id: '1', name: 'Maya R.', handle: '@foodie_blr', followers: '28.4K', engagement: '7.2%', offer: 'Barter: Dinner for 2', status: 'awaiting', deadline: 'Reservation needed', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face' },
  { id: '2', name: 'Priya S.', handle: '@dineanddash', followers: '12.2K', engagement: '9.1%', offer: 'Barter only', status: 'awaiting', deadline: 'Reservation needed', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face' },
  { id: '3', name: 'Devi P.', handle: '@deviperks', followers: '18K', engagement: '8.4%', offer: 'Barter: Dinner for 4', status: 'booked', deadline: 'Sat 14 · 8:00pm · 2 pax', date: 'Sat 14 Mar', time: '8:00 PM', pax: 2, img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop&crop=face' },
  { id: '4', name: 'Kiran A.', handle: '@kiranfood', followers: '33K', engagement: '5.5%', offer: 'Barter + ₹2,000', status: 'content', deadline: 'Draft due Friday', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face' },
  { id: '5', name: 'Tanvi G.', handle: '@tanvig', followers: '22K', engagement: '7.8%', offer: 'Barter only', status: 'done', deadline: 'Posted · 42K reach', reach: '42K', img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=60&h=60&fit=crop&crop=face' },
];

const STATUS_CONFIG: Record<CampaignStatus, { label: string; dot: string; badge: string }> = {
  awaiting: { label: 'Awaiting Visit', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  booked: { label: 'Booked', dot: 'bg-green-400', badge: 'bg-green-50 text-green-700 border-green-200' },
  content: { label: 'Content Pending', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  done: { label: 'Done', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const TIMELINE_STEPS = [
  { key: 'pitched', label: 'Pitched · barter for dinner', date: 'Mar 5' },
  { key: 'accepted', label: 'Accepted by you', date: 'Mar 6' },
  { key: 'book', label: 'Book table & reserve date', date: '' },
  { key: 'visit', label: 'Visit + content draft', date: '' },
  { key: 'posted', label: 'Posted + reach reported', date: '' },
];

function getTimelineDone(status: CampaignStatus) {
  if (status === 'done') return [0, 1, 2, 3, 4];
  if (status === 'content') return [0, 1, 2, 3];
  if (status === 'booked') return [0, 1, 2];
  return [0, 1];
}

function getTimelineActive(status: CampaignStatus) {
  if (status === 'done') return -1;
  if (status === 'content') return 4;
  if (status === 'booked') return 3;
  return 2;
}

const DATES = ['Wed 11', 'Thu 12', 'Fri 13', 'Sat 14', 'Sun 15'];
const TIMES = ['7:00', '7:30', '8:00', '8:30', '9:00', '9:30'];

export default function CampaignManager() {
  const { campaignId } = useParams();
  const campaignMeta = CAMPAIGNS.find((c) => c.id === campaignId);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [showSideSheet, setShowSideSheet] = useState(false);
  const [sheetCampaign, setSheetCampaign] = useState<Campaign | null>(null);
  const [campaignList, setCampaignList] = useState<Campaign[]>(campaigns);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Side sheet state
  const [selectedDate, setSelectedDate] = useState(3);
  const [selectedTime, setSelectedTime] = useState(2);
  const [pax, setPax] = useState(2);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const openSideSheet = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    setSheetCampaign(campaign);
    setShowSideSheet(true);
    setPax(campaign.pax || 2);
  };

  const handleConfirm = () => {
    if (!sheetCampaign) return;
    setCampaignList(prev =>
      prev.map(c =>
        c.id === sheetCampaign.id
          ? { ...c, status: 'booked', deadline: `${DATES[selectedDate]} · ${TIMES[selectedTime]}pm · ${pax} pax`, date: DATES[selectedDate], time: TIMES[selectedTime] + ' PM', pax }
          : c
      )
    );
    setConfirmed(prev => new Set([...prev, sheetCampaign.id]));
    if (selected?.id === sheetCampaign.id) {
      setSelected(prev => prev ? { ...prev, status: 'booked' } : null);
    }
    setTimeout(() => setShowSideSheet(false), 800);
  };

  const filtered = filterStatus === 'all' ? campaignList : campaignList.filter(c => c.status === filterStatus);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0">
          <Link
            to="/marketing/campaigns"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> All campaigns
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {campaignMeta ? campaignMeta.name : 'Campaign applicants'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {campaignList.length} applicants · {campaignList.filter(c => c.status === 'awaiting').length} awaiting visit · {campaignList.filter(c => c.status === 'content').length} content pending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <option value="all">All statuses</option>
            <option value="awaiting">Awaiting Visit</option>
            <option value="booked">Booked</option>
            <option value="content">Content Pending</option>
            <option value="done">Done</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {/* Body: list + detail panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Campaign List */}
        <div className={`flex flex-col overflow-hidden transition-all ${selected ? 'w-[420px] flex-shrink-0' : 'flex-1'}`}>
          {/* Column headers */}
          <div className="grid grid-cols-[48px_1.6fr_1fr_1.2fr_160px] gap-3 px-5 py-2.5 bg-gray-100 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex-shrink-0">
            <div />
            <div>Creator</div>
            <div>Status</div>
            <div>Next Step</div>
            <div>Action</div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filtered.map((campaign) => {
              const sc = STATUS_CONFIG[campaign.status];
              const isSelected = selected?.id === campaign.id;
              return (
                <div
                  key={campaign.id}
                  onClick={() => setSelected(isSelected ? null : campaign)}
                  className={`grid grid-cols-[48px_1.6fr_1fr_1.2fr_160px] gap-3 items-center px-5 py-3.5 cursor-pointer transition-all ${
                    isSelected ? 'bg-cyan-50 border-l-2 border-cyan-500' : 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
                  }`}
                >
                  <img src={campaign.img} alt={campaign.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{campaign.name}</div>
                    <div className="text-xs text-gray-400">{campaign.handle} · {campaign.followers}</div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 truncate">{campaign.deadline}</div>
                  <div onClick={e => e.stopPropagation()}>
                    {campaign.status === 'awaiting' && (
                      <button
                        onClick={(e) => openSideSheet(campaign, e)}
                        className="flex items-center gap-1.5 py-1.5 px-3 bg-white border border-cyan-400 text-cyan-600 rounded-lg font-semibold text-xs hover:bg-cyan-50 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Book Table
                      </button>
                    )}
                    {campaign.status === 'booked' && (
                      <button className="flex items-center gap-1.5 py-1.5 px-3 bg-green-500 text-white rounded-lg font-semibold text-xs hover:bg-green-600 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> View Floor
                      </button>
                    )}
                    {campaign.status === 'content' && (
                      <button className="flex items-center gap-1.5 py-1.5 px-3 bg-amber-500 text-white rounded-lg font-semibold text-xs hover:bg-amber-600 transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Review Draft
                      </button>
                    )}
                    {campaign.status === 'done' && (
                      <button className="flex items-center gap-1.5 py-1.5 px-3 bg-white border border-gray-200 text-gray-600 rounded-lg font-semibold text-xs hover:bg-gray-50 transition-colors">
                        <BarChart2 className="w-3.5 h-3.5" /> Analytics
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No campaigns for this filter.</div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="flex-1 flex flex-col bg-white border-l border-gray-200 overflow-hidden">
            {/* Detail Header */}
            <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <img src={selected.img} alt={selected.name} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg text-gray-900">{selected.name} <span className="text-gray-400 font-normal text-sm">{selected.handle}</span></div>
                <div className="text-sm text-gray-500 mt-0.5">{selected.followers} followers · {selected.engagement} engagement · {selected.offer}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[selected.status].badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status].dot}`} />
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selected.status === 'awaiting' && (
                  <button
                    onClick={(e) => openSideSheet(selected, e)}
                    className="flex items-center gap-1.5 py-2 px-4 bg-cyan-500 text-white rounded-lg font-semibold text-sm hover:bg-cyan-600 transition-colors"
                  >
                    <Calendar className="w-4 h-4" /> Book Table
                  </button>
                )}
                {selected.status === 'booked' && (
                  <button className="flex items-center gap-1.5 py-2 px-4 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> View Floor
                  </button>
                )}
                {selected.status === 'content' && (
                  <button className="flex items-center gap-1.5 py-2 px-4 bg-amber-500 text-white rounded-lg font-semibold text-sm hover:bg-amber-600 transition-colors">
                    <FileText className="w-4 h-4" /> Review Draft
                  </button>
                )}
                {selected.status === 'done' && (
                  <button className="flex items-center gap-1.5 py-2 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors">
                    <BarChart2 className="w-4 h-4" /> Analytics
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">Campaign Timeline</div>
                <div className="space-y-0">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const done = getTimelineDone(selected.status).includes(idx);
                    const active = getTimelineActive(selected.status) === idx;
                    const isLast = idx === TIMELINE_STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            {done ? '✓' : active ? '·' : ''}
                          </div>
                          {!isLast && <div className={`w-0.5 h-6 mt-0.5 ${done ? 'bg-green-200' : 'bg-gray-200'}`} />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className={`text-sm ${done ? 'text-gray-600 font-medium' : active ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium'}`}>
                            {step.label}
                          </div>
                          {step.date && <div className="text-xs text-gray-400 mt-0.5">{step.date}</div>}
                          {active && selected.status === 'awaiting' && (
                            <button
                              onClick={(e) => openSideSheet(selected, e)}
                              className="mt-2 flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:underline"
                            >
                              <Calendar className="w-3.5 h-3.5" /> Book table now
                            </button>
                          )}
                          {selected.status === 'booked' && idx === 2 && (
                            <div className="text-xs text-green-600 font-semibold mt-0.5">
                              {selected.date} · {selected.time} · {selected.pax} pax
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats for done campaigns */}
              {selected.status === 'done' && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Reach', value: selected.reach || '42K', icon: Users },
                    { label: 'Engagement', value: selected.engagement, icon: Activity },
                    { label: 'Offer', value: selected.offer.split(':')[0], icon: ChevronRight },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-400">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Side Sheet — Quick Reservation */}
      {showSideSheet && sheetCampaign && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setShowSideSheet(false)} />
          <div className="w-[320px] bg-white border-l border-gray-200 shadow-2xl flex flex-col overflow-hidden">
            {/* Sheet Header */}
            <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="font-bold text-sm">Quick Reservation</div>
                <div className="text-xs text-gray-400 mt-0.5">{sheetCampaign.name} · {sheetCampaign.offer.split(':')[0]}</div>
              </div>
              <button
                onClick={() => setShowSideSheet(false)}
                className="w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Creator info */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <img src={sheetCampaign.img} alt={sheetCampaign.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-sm text-gray-900">{sheetCampaign.name}</div>
                  <div className="text-xs text-gray-500">{sheetCampaign.followers} · {sheetCampaign.engagement} eng</div>
                </div>
              </div>

              {/* Date */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Pick a Date</div>
                <div className="flex gap-1.5">
                  {DATES.map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(idx)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                        selectedDate === idx
                          ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Time</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIMES.map((time, idx) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(idx)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                        selectedTime === idx
                          ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pax */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Guests (Pax)</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPax(Math.max(1, pax - 1))}
                    className="w-9 h-9 border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center text-lg"
                  >
                    −
                  </button>
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2 text-center text-sm font-bold text-gray-900">
                    {pax} guests
                  </div>
                  <button
                    onClick={() => setPax(pax + 1)}
                    className="w-9 h-9 border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">Pre-filled from collab details</div>
              </div>

              {/* Tag */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Marketing: Barter</span>
                </div>
                <div className="text-xs text-gray-500">Auto-tagged · visible to front desk on the day</div>
              </div>

              {/* Notes */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Notes (optional)</div>
                <textarea
                  placeholder="e.g. window table preferred, dietary requirements…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 placeholder-gray-400 min-h-[72px] outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
                />
              </div>
            </div>

            {/* Confirm */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              {confirmed.has(sheetCampaign.id) ? (
                <button className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Reservation Confirmed!
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  Confirm — Push to Floor
                </button>
              )}
              <div className="text-xs text-gray-400 text-center mt-2">Pushes to Floor & Live waitlist</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
