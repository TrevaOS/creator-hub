import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  X, Calendar, ChevronLeft, CheckCircle2, FileText, BarChart2,
  Users, Filter, Download, Activity, Zap, Star, Edit3, Save,
  Plus, Trash2, Clock, Upload as UploadIcon, Image as ImageIcon, MessageSquare,
} from 'lucide-react';
import { CAMPAIGNS } from './CampaignsList';
import type { CampaignSummary, CampaignSummaryStatus, DeliverableWithDate } from './CampaignsList';
import { ChatDrawer } from '../components/ChatDrawer';

type CampaignStatus = 'awaiting' | 'booked' | 'content' | 'done';

interface Applicant {
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

const DEFAULT_APPLICANTS: Applicant[] = [
  { id: '1', name: 'Maya R.', handle: '@foodie_blr', followers: '28.4K', engagement: '7.2%', offer: 'Barter: Dinner for 2', status: 'awaiting', deadline: 'Reservation needed', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face' },
  { id: '2', name: 'Priya S.', handle: '@dineanddash', followers: '12.2K', engagement: '9.1%', offer: 'Barter only', status: 'awaiting', deadline: 'Reservation needed', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face' },
  { id: '3', name: 'Devi P.', handle: '@deviperks', followers: '18K', engagement: '8.4%', offer: 'Barter: Dinner for 4', status: 'booked', deadline: 'Sat 14 Â· 8:00pm Â· 2 pax', date: 'Sat 14 Mar', time: '8:00 PM', pax: 2, img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop&crop=face' },
  { id: '4', name: 'Kiran A.', handle: '@kiranfood', followers: '33K', engagement: '5.5%', offer: 'Barter + â‚¹2,000', status: 'content', deadline: 'Draft due Friday', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face' },
  { id: '5', name: 'Tanvi G.', handle: '@tanvig', followers: '22K', engagement: '7.8%', offer: 'Barter only', status: 'done', deadline: 'Posted Â· 42K reach', reach: '42K', img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=60&h=60&fit=crop&crop=face' },
];

const STATUS_CONFIG: Record<CampaignStatus, { label: string; dot: string; badge: string }> = {
  awaiting: { label: 'Awaiting Visit', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  booked: { label: 'Booked', dot: 'bg-green-400', badge: 'bg-green-50 text-green-700 border-green-200' },
  content: { label: 'Content Pending', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  done: { label: 'Done', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const DATES = ['Wed 11', 'Thu 12', 'Fri 13', 'Sat 14', 'Sun 15'];
const TIMES = ['7:00', '7:30', '8:00', '8:30', '9:00', '9:30'];

const DELIVERABLE_OPTIONS = [
  'Instagram Reel', 'Instagram Post', 'Instagram Story (3+ frames)',
  'YouTube Short', 'YouTube Long-form', 'Blog Review',
  'Google Review', 'Zomato Review', 'TikTok Video',
];

const PERK_OPTIONS = [
  'Barter (meal for 2)', 'Barter (meal for 4)', 'Cash payment',
  'Barter + cash top-up', 'Gift voucher', 'Custom',
];

const STATUS_OPTIONS: CampaignSummaryStatus[] = ['Draft', 'Active', 'Paused', 'Completed'];

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

// â”€â”€â”€ Campaign Edit Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CampaignEditPanel({ campaign, onSave }: { campaign: CampaignSummary; onSave: (updated: CampaignSummary) => void }) {
  const [name, setName] = useState(campaign.name);
  const [tagline, setTagline] = useState(campaign.tagline);
  const [brief, setBrief] = useState(campaign.brief ?? '');
  const [category, setCategory] = useState(campaign.category);
  const [customCategory, setCustomCategory] = useState('');
  const [budget, setBudget] = useState(campaign.budget);
  const [perk, setPerk] = useState(campaign.perk ?? PERK_OPTIONS[0]);
  const [customPerk, setCustomPerk] = useState('');
  const [audience, setAudience] = useState(campaign.audience ?? '');
  const [hashtags, setHashtags] = useState(campaign.hashtags ?? '');
  const [startsOn, setStartsOn] = useState(campaign.startsOn);
  const [endsOn, setEndsOn] = useState(campaign.endsOn);
  const [targetLaunch, setTargetLaunch] = useState(campaign.targetLaunch ?? '');
  const [status, setStatus] = useState<CampaignSummaryStatus>(campaign.status);
  const [deliverables, setDeliverables] = useState<DeliverableWithDate[]>(
    campaign.deliverables ?? []
  );
  const [newDelivLabel, setNewDelivLabel] = useState(DELIVERABLE_OPTIONS[0]);
  const [customDelivLabel, setCustomDelivLabel] = useState('');
  const [saved, setSaved] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState(campaign.cover ?? '');

  const updateDeliverable = (idx: number, field: keyof DeliverableWithDate, value: string) => {
    setDeliverables((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const addDeliverable = () => {
    const label = newDelivLabel === 'Other' ? customDelivLabel.trim() : newDelivLabel;
    if (!label) return;
    setDeliverables((prev) => [...prev, { label, dueDate: '' }]);
    if (newDelivLabel === 'Other') setCustomDelivLabel('');
  };

  const removeDeliverable = (idx: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setCoverUrl('');
  };

  const handleSave = () => {
    const effectiveCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;
    const effectivePerk = perk === 'Custom' ? (customPerk.trim() || 'Custom') : perk;
    onSave({
      ...campaign,
      name: name.trim() || campaign.name,
      tagline: tagline.trim(),
      brief: brief.trim() || undefined,
      category: effectiveCategory,
      budget,
      perk: effectivePerk,
      audience: audience.trim() || undefined,
      hashtags: hashtags.trim() || undefined,
      startsOn,
      endsOn,
      targetLaunch,
      status,
      deliverables,
      cover: coverPreview ?? coverUrl ?? campaign.cover,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <div className="font-bold text-gray-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-cyan-500" /> Campaign Settings
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Edit and save changes to this campaign</div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white'
          }`}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Cover / Banner Image */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Campaign Banner</div>
          <div className="relative h-36 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {(coverPreview || coverUrl) ? (
              <>
                <img src={coverPreview || coverUrl} alt="Campaign banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <button
                  type="button"
                  onClick={() => { setCoverPreview(null); setCoverUrl(''); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                <ImageIcon className="w-7 h-7" />
                <span className="text-xs">No banner image</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-2 mt-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
              <UploadIcon className="w-3.5 h-3.5" /> Upload image
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={e => { setCoverUrl(e.target.value); setCoverPreview(null); }}
              placeholder="Or paste image URLâ€¦"
              className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
        </div>

        {/* Status */}
        <EField label="Campaign status">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  status === s
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </EField>

        {/* Basics */}
        <EField label="Campaign name">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
        </EField>

        <EField label="Tagline">
          <input value={tagline} onChange={(e) => setTagline(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
        </EField>

        <EField label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300">
            <option>Food Â· Lifestyle</option>
            <option>Bar Â· Nightlife</option>
            <option>Fine Dine</option>
            <option>Casual Dining</option>
            <option>Cafe</option>
            <option value="Other">Other (custom)</option>
          </select>
          {category === 'Other' && (
            <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Cloud Kitchen, Dessertsâ€¦"
              className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
          )}
        </EField>

        {/* Brief */}
        <EField label="Brief">
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4}
            placeholder="Goal, vibe, do's and don'tsâ€¦"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-y" />
        </EField>

        {/* Compensation */}
        <div className="grid grid-cols-2 gap-3">
          <EField label="Perk type">
            <select value={perk} onChange={(e) => setPerk(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300">
              {PERK_OPTIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
            {perk === 'Custom' && (
              <input value={customPerk} onChange={(e) => setCustomPerk(e.target.value)}
                placeholder="Describe what you'll giveâ€¦"
                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
            )}
          </EField>
          <EField label="Budget (INR)">
            <input type="number" min={0} step={5000} value={budget} onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
          </EField>
        </div>

        {/* Audience + Hashtags */}
        <EField label="Target audience">
          <input value={audience} onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. 22â€“35, foodies, Bangalore"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
        </EField>

        <EField label="Mandatory hashtags / handles" hint="Comma-separated">
          <input value={hashtags} onChange={(e) => setHashtags(e.target.value)}
            placeholder="#smokehouse, @smokehousebar"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
        </EField>

        {/* Schedule */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Schedule</div>
          <div className="grid grid-cols-3 gap-2">
            <EField label="Starts on">
              <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
            </EField>
            <EField label="Ends on">
              <input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
            </EField>
            <EField label="Target launch" hint="First post date">
              <input type="date" value={targetLaunch} onChange={(e) => setTargetLaunch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
            </EField>
          </div>
        </div>

        {/* Deliverables with due dates */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Deliverables & due dates
          </div>
          <div className="space-y-2 mb-3">
            {deliverables.length === 0 && (
              <div className="text-xs text-gray-400 italic">No deliverables added yet.</div>
            )}
            {deliverables.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{d.label}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <input
                    type="date"
                    value={d.dueDate}
                    onChange={(e) => updateDeliverable(idx, 'dueDate', e.target.value)}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white"
                  />
                </div>
                <button onClick={() => removeDeliverable(idx)}
                  className="text-gray-300 hover:text-rose-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new deliverable */}
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-3 space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Add deliverable</div>
            <div className="flex gap-2">
              <select value={newDelivLabel} onChange={(e) => setNewDelivLabel(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white">
                {DELIVERABLE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                <option value="Other">Other (custom)</option>
              </select>
              <button onClick={addDeliverable}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-xs font-semibold hover:bg-cyan-600">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {newDelivLabel === 'Other' && (
              <input value={customDelivLabel} onChange={(e) => setCustomDelivLabel(e.target.value)}
                placeholder="Describe the deliverableâ€¦"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
    </label>
  );
}

// â”€â”€â”€ Main CampaignManager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CampaignManager() {
  const { campaignId } = useParams();
  const [campaignMeta, setCampaignMeta] = useState<CampaignSummary | undefined>(
    CAMPAIGNS.find((c) => c.id === campaignId)
  );
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [showSideSheet, setShowSideSheet] = useState(false);
  const [sheetCampaign, setSheetCampaign] = useState<Applicant | null>(null);
  const [applicantList, setApplicantList] = useState<Applicant[]>(DEFAULT_APPLICANTS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activePanel, setActivePanel] = useState<'applicants' | 'settings'>('applicants');
  const [chatTarget, setChatTarget] = useState<{ name: string; handle: string; img: string } | null>(null);

  // Side sheet state
  const [selectedDate, setSelectedDate] = useState(3);
  const [selectedTime, setSelectedTime] = useState(2);
  const [pax, setPax] = useState(2);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const openSideSheet = (applicant: Applicant, e: React.MouseEvent) => {
    e.stopPropagation();
    setSheetCampaign(applicant);
    setShowSideSheet(true);
    setPax(applicant.pax || 2);
  };

  const handleConfirm = () => {
    if (!sheetCampaign) return;
    setApplicantList(prev =>
      prev.map(c =>
        c.id === sheetCampaign.id
          ? { ...c, status: 'booked', deadline: `${DATES[selectedDate]} Â· ${TIMES[selectedTime]}pm Â· ${pax} pax`, date: DATES[selectedDate], time: TIMES[selectedTime] + ' PM', pax }
          : c
      )
    );
    setConfirmed(prev => new Set([...prev, sheetCampaign.id]));
    if (selected?.id === sheetCampaign.id) {
      setSelected(prev => prev ? { ...prev, status: 'booked' } : null);
    }
    setTimeout(() => setShowSideSheet(false), 800);
  };

  const filtered = filterStatus === 'all' ? applicantList : applicantList.filter(c => c.status === filterStatus);

  const timelineSteps = campaignMeta?.deliverables?.length
    ? [
        { key: 'pitched', label: 'Pitched & accepted', date: '' },
        { key: 'booked', label: 'Visit / shoot booked', date: '' },
        ...campaignMeta.deliverables.map((d) => ({
          key: `d-${d.label}`,
          label: d.label,
          date: d.dueDate,
        })),
        { key: 'posted', label: 'Posted + reach reported', date: '' },
      ]
    : [
        { key: 'pitched', label: 'Pitched Â· barter for dinner', date: 'Mar 5' },
        { key: 'accepted', label: 'Accepted by you', date: 'Mar 6' },
        { key: 'book', label: 'Book table & reserve date', date: '' },
        { key: 'visit', label: 'Visit + content draft', date: '' },
        { key: 'posted', label: 'Posted + reach reported', date: '' },
      ];

  function getTimelineDone(status: CampaignStatus) {
    if (status === 'done') return timelineSteps.map((_, i) => i);
    if (status === 'content') return timelineSteps.slice(0, -1).map((_, i) => i);
    if (status === 'booked') return [0, 1];
    return [0];
  }

  function getTimelineActive(status: CampaignStatus) {
    if (status === 'done') return -1;
    if (status === 'content') return timelineSteps.length - 1;
    if (status === 'booked') return 2;
    return 1;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0">
          <Link to="/marketing/campaigns"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 mb-1">
            <ChevronLeft className="w-3.5 h-3.5" /> All campaigns
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {campaignMeta ? campaignMeta.name : 'Campaign applicants'}
            </h1>
            {campaignMeta?.premium && (
              <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Star className="w-3 h-3 fill-amber-900" /> Premium
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {applicantList.length} applicants Â· {applicantList.filter(c => c.status === 'awaiting').length} awaiting Â· {applicantList.filter(c => c.status === 'content').length} content pending
          </p>
          {campaignMeta?.activeCreatorHandle && (
            <div className="mt-1.5 inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-1.5">
              {campaignMeta.activeCreatorThumb && (
                <img src={campaignMeta.activeCreatorThumb} alt={campaignMeta.activeCreatorName} className="w-5 h-5 rounded-full object-cover" />
              )}
              <Zap className="w-3 h-3 text-cyan-500" />
              <span className="text-xs font-semibold text-cyan-700">
                Collab in progress Â· <span className="text-cyan-900">{campaignMeta.activeCreatorName ?? campaignMeta.activeCreatorHandle}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Panel toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActivePanel('applicants')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activePanel === 'applicants' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Applicants
            </button>
            <button
              onClick={() => setActivePanel('settings')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                activePanel === 'settings' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit3 className="w-3 h-3" /> Campaign Settings
            </button>
          </div>
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

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {activePanel === 'settings' && campaignMeta ? (
          <div className="flex-1 overflow-hidden">
            <CampaignEditPanel
              campaign={campaignMeta}
              onSave={(updated) => setCampaignMeta(updated)}
            />
          </div>
        ) : (
          <>
            {/* Applicant List */}
            <div className={`flex flex-col overflow-hidden transition-all ${selected ? 'w-[420px] flex-shrink-0' : 'flex-1'}`}>
              <div className="grid grid-cols-[48px_1.6fr_1fr_1.2fr_200px] gap-3 px-5 py-2.5 bg-gray-100 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex-shrink-0">
                <div />
                <div>Creator</div>
                <div>Status</div>
                <div>Next Step</div>
                <div>Action</div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {filtered.map((applicant) => {
                  const sc = STATUS_CONFIG[applicant.status];
                  const isSelected = selected?.id === applicant.id;
                  return (
                    <div
                      key={applicant.id}
                      onClick={() => setSelected(isSelected ? null : applicant)}
                      className={`grid grid-cols-[48px_1.6fr_1fr_1.2fr_200px] gap-3 items-center px-5 py-3.5 cursor-pointer transition-all ${
                        isSelected ? 'bg-cyan-50 border-l-2 border-cyan-500' : 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
                      }`}
                    >
                      <img src={applicant.img} alt={applicant.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{applicant.name}</div>
                        <div className="text-xs text-gray-400">{applicant.handle} Â· {applicant.followers}</div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 truncate">{applicant.deadline}</div>
                      <div onClick={e => e.stopPropagation()} className="flex items-center gap-1.5">
                        {applicant.status === 'awaiting' && (
                          <button onClick={(e) => openSideSheet(applicant, e)}
                            className="flex items-center gap-1.5 py-1.5 px-3 bg-white border border-cyan-400 text-cyan-600 rounded-lg font-semibold text-xs hover:bg-cyan-50 transition-colors">
                            <Calendar className="w-3.5 h-3.5" /> Book Table
                          </button>
                        )}
                        {applicant.status === 'booked' && (
                          <button className="flex items-center gap-1.5 py-1.5 px-3 bg-green-500 text-white rounded-lg font-semibold text-xs hover:bg-green-600 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" /> View Floor
                          </button>
                        )}
                        {applicant.status === 'content' && (
                          <button className="flex items-center gap-1.5 py-1.5 px-3 bg-amber-500 text-white rounded-lg font-semibold text-xs hover:bg-amber-600 transition-colors">
                            <FileText className="w-3.5 h-3.5" /> Review Draft
                          </button>
                        )}
                        {applicant.status === 'done' && (
                          <button className="flex items-center gap-1.5 py-1.5 px-3 bg-white border border-gray-200 text-gray-600 rounded-lg font-semibold text-xs hover:bg-gray-50 transition-colors">
                            <BarChart2 className="w-3.5 h-3.5" /> Analytics
                          </button>
                        )}
                        {applicant.status !== 'awaiting' && (
                          <button
                            onClick={() => setChatTarget({ name: applicant.name, handle: applicant.handle, img: applicant.img })}
                            title="Chat"
                            className="w-8 h-8 border border-gray-200 bg-white rounded-lg flex items-center justify-center text-gray-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors flex-shrink-0"
                          >
                            <img src="/chat-icon.png" alt="Chat" className="w-4 h-4 object-contain" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No applicants for this filter.</div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            {selected && (
              <div className="flex-1 flex flex-col bg-white border-l border-gray-200 overflow-hidden">
                <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100 flex-shrink-0">
                  <img src={selected.img} alt={selected.name} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg text-gray-900">
                      {selected.name} <span className="text-gray-400 font-normal text-sm">{selected.handle}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {selected.followers} followers Â· {selected.engagement} engagement Â· {selected.offer}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[selected.status].badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status].dot}`} />
                        {STATUS_CONFIG[selected.status].label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selected.status === 'awaiting' && (
                      <button onClick={(e) => openSideSheet(selected, e)}
                        className="flex items-center gap-1.5 py-2 px-4 bg-cyan-500 text-white rounded-lg font-semibold text-sm hover:bg-cyan-600 transition-colors">
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
                    {selected.status !== 'awaiting' && (
                      <button
                        onClick={() => setChatTarget({ name: selected.name, handle: selected.handle, img: selected.img })}
                        title="Chat"
                        className="flex items-center gap-1.5 py-2 px-3 border border-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                      >
                        <img src="/chat-icon.png" alt="Chat" className="w-4 h-4 object-contain" /> Chat
                      </button>
                    )}
                    <button onClick={() => setSelected(null)} className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Timeline â€” uses live deliverables from campaign settings */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">Campaign Timeline</div>
                    <div className="space-y-0">
                      {timelineSteps.map((step, idx) => {
                        const done = getTimelineDone(selected.status).includes(idx);
                        const active = getTimelineActive(selected.status) === idx;
                        const isLast = idx === timelineSteps.length - 1;
                        return (
                          <div key={step.key} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white border-gray-300 text-gray-400'
                              }`}>
                                {done ? 'âœ“' : active ? 'Â·' : ''}
                              </div>
                              {!isLast && <div className={`w-0.5 h-6 mt-0.5 ${done ? 'bg-green-200' : 'bg-gray-200'}`} />}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className={`text-sm ${done ? 'text-gray-600 font-medium' : active ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium'}`}>
                                {step.label}
                              </div>
                              {step.date && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                  <Clock className="w-3 h-3" /> Due {step.date}
                                </div>
                              )}
                              {active && selected.status === 'awaiting' && (
                                <button onClick={(e) => openSideSheet(selected, e)}
                                  className="mt-2 flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:underline">
                                  <Calendar className="w-3.5 h-3.5" /> Book table now
                                </button>
                              )}
                              {selected.status === 'booked' && idx === 2 && (
                                <div className="text-xs text-green-600 font-semibold mt-0.5">
                                  {selected.date} Â· {selected.time} Â· {selected.pax} pax
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selected.status === 'done' && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Reach', value: selected.reach || '42K', icon: Users },
                        { label: 'Engagement', value: selected.engagement, icon: Activity },
                        { label: 'Offer', value: selected.offer.split(':')[0], icon: UploadIcon },
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
          </>
        )}
      </div>

      {/* Side Sheet â€” Quick Reservation */}
      {showSideSheet && sheetCampaign && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setShowSideSheet(false)} />
          <div className="w-[320px] bg-white border-l border-gray-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="font-bold text-sm">Quick Reservation</div>
                <div className="text-xs text-gray-400 mt-0.5">{sheetCampaign.name} Â· {sheetCampaign.offer.split(':')[0]}</div>
              </div>
              <button onClick={() => setShowSideSheet(false)}
                className="w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <img src={sheetCampaign.img} alt={sheetCampaign.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-sm text-gray-900">{sheetCampaign.name}</div>
                  <div className="text-xs text-gray-500">{sheetCampaign.followers} Â· {sheetCampaign.engagement} eng</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Pick a Date</div>
                <div className="flex gap-1.5">
                  {DATES.map((day, idx) => (
                    <button key={day} onClick={() => setSelectedDate(idx)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                        selectedDate === idx ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300'
                      }`}>{day}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Time</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIMES.map((time, idx) => (
                    <button key={time} onClick={() => setSelectedTime(idx)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                        selectedTime === idx ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300'
                      }`}>{time}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Guests (Pax)</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPax(Math.max(1, pax - 1))}
                    className="w-9 h-9 border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center text-lg">âˆ’</button>
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2 text-center text-sm font-bold text-gray-900">{pax} guests</div>
                  <button onClick={() => setPax(pax + 1)}
                    className="w-9 h-9 border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center text-lg">+</button>
                </div>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {campaignMeta?.perk ?? 'Marketing: Barter'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Auto-tagged Â· visible to front desk on the day</div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Notes (optional)</div>
                <textarea placeholder="e.g. window table preferred, dietary requirementsâ€¦"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 placeholder-gray-400 min-h-[72px] outline-none focus:ring-2 focus:ring-cyan-300 resize-none" />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              {confirmed.has(sheetCampaign.id) ? (
                <button className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Reservation Confirmed!
                </button>
              ) : (
                <button onClick={handleConfirm}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-sm transition-colors">
                  Confirm â€” Push to Floor
                </button>
              )}
              <div className="text-xs text-gray-400 text-center mt-2">Pushes to Floor & Live waitlist</div>
            </div>
          </div>
        </div>
      )}

      <ChatDrawer
        open={chatTarget !== null}
        onClose={() => setChatTarget(null)}
        name={chatTarget?.name ?? ''}
        handle={chatTarget?.handle}
        img={chatTarget?.img}
      />
    </div>
  );
}
