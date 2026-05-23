import { BRAND_CAMPAIGNS, MARKETING_PIPELINE_META, MARKETING_STATUS_META } from '../../data/creatorHubData';

const tonePalette: Record<string, string> = {
  emerald: '#047857',
  cyan: '#0e7490',
  amber: '#b45309',
  gray: '#475569',
  purple: '#6d28d9',
  sky: '#0284c7',
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function AdminCampaigns() {
  const active = BRAND_CAMPAIGNS.filter((campaign) => campaign.marketing.status === 'Active');
  const upcoming = BRAND_CAMPAIGNS.filter((campaign) => campaign.marketing.status === 'Upcoming');
  const paused = BRAND_CAMPAIGNS.filter((campaign) => campaign.marketing.status === 'Paused');

  const totalsByStage = BRAND_CAMPAIGNS.reduce<Record<string, number>>((acc, campaign) => {
    acc[campaign.marketing.pipelineStage] = (acc[campaign.marketing.pipelineStage] ?? 0) + 1;
    return acc;
  }, {});

  const totalsByStatus = BRAND_CAMPAIGNS.reduce<Record<string, number>>((acc, campaign) => {
    acc[campaign.marketing.status] = (acc[campaign.marketing.status] ?? 0) + 1;
    return acc;
  }, {});

  const highestBudget = [...BRAND_CAMPAIGNS]
    .sort((a, b) => b.marketing.budget - a.marketing.budget)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active" value={active.length} helper="Live campaigns across both workspaces" tone="emerald" />
        <MetricCard label="Upcoming" value={upcoming.length} helper="Entering production this month" tone="cyan" />
        <MetricCard label="Paused" value={paused.length} helper="Need ops follow-up" tone="amber" />
        <MetricCard
          label="Managed budget"
          value={currency.format(active.reduce((sum, c) => sum + c.marketing.budget, 0))}
          helper="Across active campaigns"
          tone="slate"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/5 border border-slate-200/70">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pipeline coverage</h2>
              <p className="text-sm text-slate-500">Distribution across pipeline stages</p>
            </div>
          </header>
          <div className="mt-5 space-y-4">
            {Object.entries(totalsByStage).map(([stage, count]) => {
              const meta = MARKETING_PIPELINE_META[stage as keyof typeof MARKETING_PIPELINE_META];
              const pct = Math.round((count / BRAND_CAMPAIGNS.length) * 100);
              const color = tonePalette[meta.tone];
              return (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>{meta.label}</span>
                    <span>{count} · {pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/5 border border-slate-200/70">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Status snapshot</h2>
              <p className="text-sm text-slate-500">Where campaigns sit this week</p>
            </div>
          </header>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(totalsByStatus).map(([status, count]) => {
              const meta = MARKETING_STATUS_META[status as keyof typeof MARKETING_STATUS_META];
              const color = tonePalette[meta.tone];
              const helper =
                meta.label === 'Active'
                  ? 'In-flight collaborations'
                  : meta.label === 'Upcoming'
                    ? 'Pre-production or awaiting launch'
                    : meta.label === 'Paused'
                      ? 'Follow-up required'
                      : 'Closed out engagements';
              return (
                <div key={status} className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
                  <div className="text-xs uppercase tracking-wide" style={{ color }}>{meta.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{count}</div>
                  <div className="mt-1 text-xs text-slate-500">{helper}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/5 border border-slate-200/70">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Top budgets in play</h2>
            <p className="text-sm text-slate-500">High-value collaborations to monitor closely</p>
          </div>
        </header>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Campaign</th>
                <th className="py-3 pr-4">Owner</th>
                <th className="py-3 pr-4">Pipeline</th>
                <th className="py-3 pr-4">Budget</th>
                <th className="py-3">Spend to date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highestBudget.map((campaign) => {
                const stageMeta = MARKETING_PIPELINE_META[campaign.marketing.pipelineStage];
                const badgeColor = tonePalette[stageMeta.tone];
                return (
                  <tr key={campaign.id} className="text-slate-700">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900">{campaign.name}</div>
                      <div className="text-xs text-slate-500">{campaign.tagline}</div>
                    </td>
                    <td className="py-3 pr-4 text-sm">{campaign.marketing.owner.name}</td>
                    <td className="py-3 pr-4 text-sm">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: `${badgeColor}15`,
                          color: badgeColor,
                        }}
                      >
                        {stageMeta.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm font-medium text-slate-900">{currency.format(campaign.marketing.budget)}</td>
                    <td className="py-3 text-sm text-slate-600">{currency.format(campaign.marketing.spendToDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number | string;
  helper: string;
  tone: 'emerald' | 'cyan' | 'amber' | 'slate';
}) {
  const toneClass = {
    emerald: 'bg-emerald-500/10 text-emerald-600 border border-emerald-200',
    cyan: 'bg-cyan-500/10 text-cyan-600 border border-cyan-200',
    amber: 'bg-amber-500/10 text-amber-600 border border-amber-200',
    slate: 'bg-slate-500/10 text-slate-600 border border-slate-200',
  }[tone];

  return (
    <div className={`rounded-2xl ${toneClass} p-5 shadow-sm shadow-slate-900/5 backdrop-blur-sm`}
    >
      <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-2 text-xs text-slate-500/80">{helper}</div>
    </div>
  );
}
