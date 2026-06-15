import { Link } from 'react-router';
import {
  ArrowRight,
  Heart,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Activity,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Megaphone,
  IndianRupee,
  Eye,
  PlayCircle,
  Utensils,
  Wine,
  Camera,
  BarChart3,
} from 'lucide-react';
import { SEGMENT_GROUPS, CAMPAIGNS, type SegmentGroupId } from './CampaignsList';

const creators: { name: string; handle: string; action: string; time: string; type: string; img: string }[] = [];

const activityDotColor: Record<string, string> = {
  pitch: 'bg-cyan-500',
  accepted: 'bg-green-500',
  content: 'bg-amber-500',
  posted: 'bg-purple-500',
};

const topCreators: { name: string; handle: string; followers: string; eng: string; score: number; img: string }[] = [];

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

interface LiveCampaign {
  id: string;
  name: string;
  status: 'On Track' | 'At Risk' | 'Behind';
  applicants: number;
  approved: number;
  liveCreators: number;
  budget: number;
  spent: number;
  deliverablesTotal: number;
  deliverablesReceived: number;
  deliverablesPending: number;
  deliverablesOverdue: number;
  nextDueLabel: string;
  reach: string;
  daysLeft: number;
}

const LIVE_CAMPAIGNS: LiveCampaign[] = [];

type DeliverableStatus = 'Pending' | 'Submitted' | 'Approved' | 'Overdue';

interface DeliverableRow {
  id: string;
  campaign: string;
  campaignId: string;
  creator: string;
  creatorImg: string;
  type: string;
  dueLabel: string;
  due: string;
  status: DeliverableStatus;
}

const DELIVERABLES: DeliverableRow[] = [];

interface PastCampaign {
  id: string;
  name: string;
  endedOn: string;
  reach: string;
  posts: number;
  spent: number;
  budget: number;
  roi: string;
  cover: string;
}

const PAST_CAMPAIGNS: PastCampaign[] = [];

const STATUS_PILL: Record<LiveCampaign['status'], string> = {
  'On Track': 'bg-green-50 text-green-700 border-green-200',
  'At Risk': 'bg-amber-50 text-amber-700 border-amber-200',
  Behind: 'bg-rose-50 text-rose-700 border-rose-200',
};

const DELIVERABLE_PILL: Record<DeliverableStatus, string> = {
  Pending: 'bg-gray-100 text-gray-700 border-gray-200',
  Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  Approved: 'bg-green-50 text-green-700 border-green-200',
  Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your marketing overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/marketing/inbound" className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            <Heart className="w-3.5 h-3.5" />
            Review pitches
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {[
              { label: 'Active Campaigns', value: '0', sub: 'No active campaigns', trend: 'up', icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-50' },
              { label: 'New Pitches', value: '0', sub: 'No pitches yet', trend: 'up', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
              { label: 'Deliverables Due', value: '0', sub: 'All clear', trend: 'up', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Spend / Budget', value: '0', sub: 'No spend yet', trend: 'up', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Reach', value: '0', sub: 'No campaigns live', trend: 'up', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Avg Engagement', value: '0%', sub: 'No data yet', trend: 'up', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`w-4.5 h-4.5 ${stat.color}`} style={{ width: 18, height: 18 }} />
                    </div>
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">{stat.label}</div>
                  <div className={`text-xs font-semibold mt-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-rose-600'}`}>{stat.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Segment Spend Overview */}
          <SegmentSpendPanel />

          {/* Live Campaigns */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-cyan-500" /> Live Campaigns
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Real-time progress across active campaigns.</p>
              </div>
              <Link to="/marketing/campaigns" className="text-xs text-cyan-600 font-semibold hover:underline flex items-center gap-1">
                Manage all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {LIVE_CAMPAIGNS.length === 0 && (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
                No live campaigns yet. Create a campaign to see it here.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {LIVE_CAMPAIGNS.map((c) => {
                const budgetPct = Math.min(100, (c.spent / c.budget) * 100);
                const deliverablePct = Math.round((c.deliverablesReceived / c.deliverablesTotal) * 100);
                return (
                  <Link
                    key={c.id}
                    to={`/marketing/campaigns/${c.id}`}
                    className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-cyan-300 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {c.daysLeft} days left
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${STATUS_PILL[c.status]}`}>
                        {c.status === 'On Track' && <CheckCircle2 className="w-3 h-3" />}
                        {c.status === 'At Risk' && <AlertCircle className="w-3 h-3" />}
                        {c.status === 'Behind' && <AlertCircle className="w-3 h-3" />}
                        {c.status}
                      </span>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <MiniStat label="Applicants" value={c.applicants} />
                      <MiniStat label="Approved" value={c.approved} />
                      <MiniStat label="Live" value={c.liveCreators} accent="text-cyan-600" />
                    </div>

                    {/* Deliverables progress */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                        <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Deliverables</span>
                        <span>{c.deliverablesReceived}/{c.deliverablesTotal} received</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${deliverablePct}%` }} />
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> {c.deliverablesReceived} received
                        </span>
                        <span className="inline-flex items-center gap-1 text-gray-500 font-semibold">
                          <Clock className="w-3 h-3" /> {c.deliverablesPending} pending
                        </span>
                        {c.deliverablesOverdue > 0 && (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                            <AlertCircle className="w-3 h-3" /> {c.deliverablesOverdue} overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                        <span className="inline-flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Spend</span>
                        <span>{INR.format(c.spent)} / {INR.format(c.budget)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${budgetPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPct}%` }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Eye className="w-3 h-3" /> {c.reach} reach
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold truncate max-w-[60%]">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">Next: {c.nextDueLabel}</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Deliverables tracker + Past campaigns */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> Deliverables Tracker
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Upcoming & overdue posts from creators.</p>
                </div>
                <Link to="/marketing/campaigns" className="text-xs text-cyan-600 font-semibold hover:underline">View all</Link>
              </div>
              {DELIVERABLES.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No deliverables yet.</div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50">
                      <th className="text-left px-5 py-2.5">Creator</th>
                      <th className="text-left px-3 py-2.5">Campaign</th>
                      <th className="text-left px-3 py-2.5">Deliverable</th>
                      <th className="text-left px-3 py-2.5">Due</th>
                      <th className="text-left px-5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {DELIVERABLES.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <img src={d.creatorImg} alt={d.creator} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                            <span className="font-semibold text-gray-900 text-xs">{d.creator}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            to={`/marketing/campaigns/${d.campaignId}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold hover:bg-violet-100"
                          >
                            <Megaphone className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{d.campaign}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-700">{d.type}</td>
                        <td className={`px-3 py-3 text-xs font-semibold ${d.status === 'Overdue' ? 'text-rose-600' : 'text-gray-700'}`}>
                          {d.dueLabel}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${DELIVERABLE_PILL[d.status]}`}>
                            {d.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                            {d.status === 'Submitted' && <Clock className="w-3 h-3" />}
                            {d.status === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                            {d.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </section>

            {/* Past campaigns */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Past Campaigns</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Recently wrapped â€” quick recap.</p>
                </div>
                <Link to="/marketing/campaigns" className="text-xs text-cyan-600 font-semibold hover:underline">All</Link>
              </div>
              {PAST_CAMPAIGNS.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">No past campaigns yet.</div>
              )}
              <div className="divide-y divide-gray-50">
                {PAST_CAMPAIGNS.map((p) => (
                  <Link
                    key={p.id}
                    to={`/marketing/campaigns/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <img src={p.cover} alt={p.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Ended {p.endedOn}</div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-600">
                        <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {p.reach}</span>
                        <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> {p.posts}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <TrendingUp className="w-3 h-3" /> {p.roi}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Quick Actions */}
            <div className="col-span-1 space-y-3">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Quick Actions</h2>
              {[
                { to: '/marketing/inbound', icon: Heart, label: 'Review Pitches', sub: 'Inbound pitch requests', color: 'text-pink-600', bg: 'bg-pink-50 hover:bg-pink-100', border: 'border-pink-200' },
                { to: '/marketing/discover', icon: Search, label: 'Discover Creators', sub: 'Find creators nearby', color: 'text-cyan-600', bg: 'bg-cyan-50 hover:bg-cyan-100', border: 'border-cyan-200' },
                { to: '/marketing/campaigns', icon: Calendar, label: 'Manage Campaigns', sub: 'View all campaigns', color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100', border: 'border-violet-200' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 p-3.5 border ${item.border} ${item.bg} rounded-xl transition-all group`}
                  >
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-800">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.sub}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </Link>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
                <Link to="/marketing/inbound" className="text-xs text-cyan-600 font-semibold hover:underline">View all</Link>
              </div>
              {creators.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">No recent activity yet.</div>
              )}
              <div className="divide-y divide-gray-50">
                {creators.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <img src={c.img} alt={c.name} className="w-9 h-9 rounded-full object-cover" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${activityDotColor[c.type]} border-2 border-white`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{c.name}</span>
                        <span className="text-gray-400 text-xs ml-1">{c.handle}</span>
                        <span className="text-gray-600"> {c.action}</span>
                      </div>
                      <div className="text-xs text-gray-400">{c.time}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Creators */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Top Matched Creators</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ranked by AI match score Â· audience overlap Â· niche fit</p>
              </div>
              <Link to="/marketing/inbound" className="text-xs text-cyan-600 font-semibold hover:underline flex items-center gap-1">
                See ranked view <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {topCreators.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">No matched creators yet â€” discover creators to see top matches here.</div>
            )}
            <div className="divide-y divide-gray-50">
              {topCreators.map((c, idx) => (
                <div key={idx} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="text-2xl font-black text-gray-200 w-8 text-center">{idx + 1}</div>
                  <img src={c.img} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{c.name} <span className="text-gray-400 font-normal text-xs">{c.handle}</span></div>
                    <div className="text-xs text-gray-500">{c.followers} followers Â· {c.eng} engagement</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">Match Score</div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${c.score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{c.score}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-600">Top</span>
                    </div>
                  </div>
                  <Link
                    to="/marketing/inbound"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Accept
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

const SEGMENT_ICON: Record<SegmentGroupId, React.ComponentType<{ className?: string }>> = {
  food:     Utensils,
  ambience: Camera,
  drinks:   Wine,
};

function SegmentSpendPanel() {
  const segments = SEGMENT_GROUPS.map(g => {
    const gc = CAMPAIGNS.filter(c => c.groupId === g.id);
    return {
      ...g,
      spent: gc.reduce((s, c) => s + c.spent, 0),
      allocated: gc.reduce((s, c) => s + c.budget, 0),
      count: gc.length,
    };
  });
  const totalSpent = segments.reduce((s, g) => s + g.spent, 0);
  const totalBudget = SEGMENT_GROUPS.reduce((s, g) => s + g.totalBudget, 0);
  const INR2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Budget by Segment</h2>
          <span className="text-xs text-gray-400">Food Â· Ambience Â· Drinks</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total spent</div>
            <div className="text-base font-black text-gray-900">
              {INR2.format(totalSpent)}{' '}
              <span className="text-xs text-gray-400 font-normal">of {INR2.format(totalBudget)}</span>
            </div>
          </div>
          <Link to="/marketing/campaigns" className="text-xs text-cyan-600 font-semibold hover:underline flex items-center gap-1">
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
        {segments.map(g => {
          const width = totalBudget > 0 ? (g.spent / totalBudget) * 100 : 0;
          if (width < 0.5) return null;
          return (
            <div
              key={g.id}
              className="h-full rounded-sm transition-all"
              style={{ width: `${width}%`, background: g.accentHex }}
              title={`${g.name}: ${INR2.format(g.spent)}`}
            />
          );
        })}
        <div className="flex-1 h-full bg-gray-100 rounded-sm" />
      </div>

      {/* Per-segment rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {segments.map(g => {
          const IconComp = SEGMENT_ICON[g.id];
          const pct = g.totalBudget > 0 ? Math.min(100, (g.spent / g.totalBudget) * 100) : 0;
          const allocPct = g.totalBudget > 0 ? Math.min(100, (g.allocated / g.totalBudget) * 100) : 0;
          return (
            <div key={g.id} className={`${g.color} rounded-xl p-4 border ${g.borderColor}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
                  <IconComp className={`w-4 h-4 ${g.textColor}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${g.textColor}`}>{g.name}</div>
                  <div className="text-[10px] text-gray-500">{g.count} campaign{g.count !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Spent</span>
                  <span className={`font-bold ${g.textColor}`}>{INR2.format(g.spent)}</span>
                </div>
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full relative rounded-full" style={{ width: `${allocPct}%`, background: `${g.accentHex}40` }}>
                    <div className="h-full rounded-full" style={{ width: `${allocPct > 0 ? (pct / allocPct) * 100 : 0}%`, background: g.accentHex }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>{Math.round(pct)}% of {INR2.format(g.totalBudget)}</span>
                  <span className="font-semibold">{INR2.format(Math.max(0, g.totalBudget - g.allocated))} left</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5">
      <div className={`text-sm font-bold ${accent ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}
