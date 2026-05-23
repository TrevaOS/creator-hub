import { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDollarSign,
  Clock,
  FileText,
  Flame,
  Handshake,
  Heart,
  LifeBuoy,
  MessageSquare,
  PlayCircle,
  Star,
} from 'lucide-react';
import {
  ADMIN_ALERTS,
  BRAND_CAMPAIGNS,
  CREATOR_ACTIVITY_EVENTS,
  MARKETING_PIPELINE_META,
  MARKETING_STATUS_META,
  SUPPORT_TICKETS,
  ActivityCategory,
  BrandCampaign,
  SupportTicket,
  SupportTicketStatus,
} from '../../data/creatorHubData';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const severityStyles: Record<'critical' | 'warning' | 'info', string> = {
  critical: 'bg-rose-50 text-rose-600 border border-rose-200',
  warning: 'bg-amber-50 text-amber-600 border border-amber-200',
  info: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
};

const statusClasses: Record<SupportTicketStatus, string> = {
  Open: 'bg-rose-50 text-rose-600 border border-rose-200',
  'In Progress': 'bg-amber-50 text-amber-600 border border-amber-200',
  Waiting: 'bg-slate-50 text-slate-600 border border-slate-200',
  Resolved: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
};

type ToneKey = 'emerald' | 'sky' | 'amber' | 'gray' | 'purple' | 'cyan';

export default function AdminDashboard() {
  const activeCampaigns = BRAND_CAMPAIGNS.filter((c) => c.marketing.status === 'Active');
  const totalActiveBudget = activeCampaigns.reduce((sum, c) => sum + c.marketing.budget, 0);
  const totalSpend = activeCampaigns.reduce((sum, c) => sum + c.marketing.spendToDate, 0);
  const avgFit = activeCampaigns.reduce((sum, c) => sum + c.audienceFit, 0) / Math.max(activeCampaigns.length, 1);

  const pipelineCounts = BRAND_CAMPAIGNS.reduce<Record<string, number>>((acc, campaign) => {
    acc[campaign.marketing.pipelineStage] = (acc[campaign.marketing.pipelineStage] ?? 0) + 1;
    return acc;
  }, {});

  const supportOpen = SUPPORT_TICKETS.filter((ticket) => ticket.status !== 'Resolved');
  const spotlights = buildSpotlights(activeCampaigns, supportOpen);

  return (
    <div className="space-y-10">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active campaign budgets"
          value={currency.format(totalActiveBudget)}
          delta="↑ 12% vs last cycle"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Spend captured"
          value={currency.format(totalSpend)}
          delta="₹3.8L pending invoices"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Avg audience fit"
          value={`${Math.round(avgFit)}%`}
          delta="Top: Forest & Flame (97%)"
          tone="cyan"
          icon={<Flame className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pipeline density</h2>
                <p className="text-sm text-slate-500">Campaign mix across Creator Hub + marketing</p>
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                Export snapshot
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(pipelineCounts).map(([stage, count]) => {
                const meta = MARKETING_PIPELINE_META[stage as keyof typeof MARKETING_PIPELINE_META];
                const classes = badgeTone(meta.tone);
                return (
                  <div key={stage} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{meta.label}</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <div className="text-3xl font-bold text-slate-900">{count}</div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${classes.container}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      Top campaign: {topCampaignNameForStage(stage as keyof typeof MARKETING_PIPELINE_META)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">System activity feed</h2>
                <p className="text-sm text-slate-500">Real-time actions across creator + marketing workflows</p>
              </div>
            </header>
            <div className="mt-4 space-y-3">
              {CREATOR_ACTIVITY_EVENTS.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="rounded-xl p-2.5 bg-cyan-100 text-cyan-700">
                    {iconForCategory(event.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{event.title}</div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString('en-IN', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {event.description && <p className="mt-1 text-xs text-slate-500">{event.description}</p>}
                    <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                      {event.category}
                      {event.amount ? ` · ${currency.format(event.amount)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Critical alerts</h2>
                <p className="text-sm text-slate-500">Ops attention required</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </header>
            <div className="mt-4 space-y-3">
              {ADMIN_ALERTS.map((alert) => (
                <div key={alert.id} className={`rounded-xl px-3.5 py-3 text-xs ${severityStyles[alert.severity]}`}>
                  <div className="font-semibold uppercase tracking-wide">{alert.label}</div>
                  <div className="mt-1 text-slate-600">{alert.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Support desk</h2>
                <p className="text-sm text-slate-500">Live tickets across Creator Hub + marketing</p>
              </div>
              <button className="text-xs font-semibold text-cyan-700 hover:underline">View all</button>
            </header>
            <div className="mt-4 space-y-3">
              {supportOpen.slice(0, 4).map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{ticket.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{ticket.summary}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClasses[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wide">
                    <span>
                      {ticket.type} · {ticket.priority} priority
                    </span>
                    <span>{ticket.owner.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">Creator & campaign spotlight</h2>
            <p className="mt-1 text-sm text-slate-500">Surface the highest-leverage opportunities</p>
            <div className="mt-4 space-y-3">
              {spotlights.map((spotlight) => (
                <div key={spotlight.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 flex items-start gap-3">
                  <div className={`rounded-xl p-2.5 ${spotlight.toneBg}`}>
                    {spotlight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{spotlight.title}</div>
                      <span className="text-[11px] uppercase tracking-wide text-slate-500">{spotlight.meta}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{spotlight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon,
  tone = 'emerald',
}: {
  label: string;
  value: string;
  delta: string;
  icon: ReactNode;
  tone?: 'emerald' | 'amber' | 'cyan';
}) {
  const toneConfig = {
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  }[tone];

  return (
    <div className={`rounded-2xl ${toneConfig} p-5 backdrop-blur`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white text-slate-800 flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-500">{delta}</div>
    </div>
  );
}

function badgeTone(tone: ToneKey) {
  switch (tone) {
    case 'emerald':
      return { container: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' };
    case 'sky':
      return { container: 'bg-sky-50 text-sky-700 border border-sky-200', dot: 'bg-sky-500' };
    case 'amber':
      return { container: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' };
    case 'purple':
      return { container: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' };
    case 'cyan':
      return { container: 'bg-cyan-50 text-cyan-700 border border-cyan-200', dot: 'bg-cyan-500' };
    case 'gray':
    default:
      return { container: 'bg-slate-50 text-slate-700 border border-slate-200', dot: 'bg-slate-400' };
  }
}

function topCampaignNameForStage(stage: keyof typeof MARKETING_PIPELINE_META) {
  const campaigns = BRAND_CAMPAIGNS.filter((campaign) => campaign.marketing.pipelineStage === stage);
  if (campaigns.length === 0) return 'None';
  const sorted = [...campaigns].sort((a, b) => b.audienceFit - a.audienceFit);
  return sorted[0].name;
}

const activityIcons: Record<ActivityCategory, ReactNode> = {
  pitch: <PlayCircle className="h-4 w-4" />,
  like: <Heart className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  negotiation: <Handshake className="h-4 w-4" />,
  profile: <FileText className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
  support: <LifeBuoy className="h-4 w-4" />,
};

function iconForCategory(category: ActivityCategory) {
  return activityIcons[category] ?? <MessageSquare className="h-4 w-4" />;
}

type SpotlightCard = {
  id: string;
  title: string;
  description: string;
  meta: string;
  icon: ReactNode;
  toneBg: string;
};

function buildSpotlights(activeCampaigns: BrandCampaign[], supportTickets: SupportTicket[]): SpotlightCard[] {
  const topFit = [...activeCampaigns].sort((a, b) => b.audienceFit - a.audienceFit)[0];
  const topBudget = [...activeCampaigns].sort((a, b) => b.marketing.budget - a.marketing.budget)[0];
  const urgentTicket = [...supportTickets].sort((a, b) => (a.priority === 'High' ? -1 : 1) - (b.priority === 'High' ? -1 : 1))[0];

  const cards: SpotlightCard[] = [];

  if (topFit) {
    cards.push({
      id: 'spot-fit',
      title: topFit.name,
      description: `${topFit.tagline}. Audience fit ${topFit.audienceFit}% / grade ${topFit.fitGrade}.`,
      meta: `${MARKETING_STATUS_META[topFit.marketing.status].label} · ${topFit.marketing.pipelineStage}`,
      icon: <Star className="h-4 w-4" />,
      toneBg: 'bg-amber-100 text-amber-700',
    });
  }

  if (topBudget) {
    cards.push({
      id: 'spot-budget',
      title: `Budget watch — ${topBudget.name}`,
      description: `₹${(topBudget.marketing.budget / 1000).toFixed(1)}K allocated · ${topBudget.marketing.owner.name} owning launch for ${new Date(topBudget.marketing.targetLaunch).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      })}.`,
      meta: 'High budget',
      icon: <CircleDollarSign className="h-4 w-4" />,
      toneBg: 'bg-emerald-100 text-emerald-700',
    });
  }

  if (urgentTicket) {
    cards.push({
      id: 'spot-support',
      title: `Support · ${urgentTicket.title}`,
      description: urgentTicket.summary,
      meta: `${urgentTicket.priority} priority · ${urgentTicket.owner.name}`,
      icon: <LifeBuoy className="h-4 w-4" />,
      toneBg: 'bg-rose-100 text-rose-700',
    });
  }

  return cards;
}
