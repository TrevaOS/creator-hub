import { CREATOR_ACTIVITY_EVENTS, BRAND_CAMPAIGNS } from '../../data/creatorHubData';

const categoryLabels: Record<string, string> = {
  pitch: 'Pitching',
  negotiation: 'Negotiations',
  star: 'Starred',
  like: 'Liked',
  support: 'Support',
  profile: 'Profile',
  note: 'Notes',
};

export default function AdminCreatorOps() {
  const byCategory = CREATOR_ACTIVITY_EVENTS.reduce<Record<string, number>>((acc, event) => {
    acc[event.category] = (acc[event.category] ?? 0) + 1;
    return acc;
  }, {});

  const topBrands = CREATOR_ACTIVITY_EVENTS.filter((event) => event.brandId)
    .map((event) => ({
      brand: BRAND_CAMPAIGNS.find((campaign) => campaign.id === event.brandId),
      event,
    }))
    .filter((entry) => entry.brand)
    .slice(0, 5);

  const lastUpdates = CREATOR_ACTIVITY_EVENTS.slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(byCategory).map(([category, total]) => (
          <div key={category} className="rounded-2xl bg-white p-5 shadow-lg shadow-slate-900/5 border border-slate-200/70">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{categoryLabels[category] ?? category}</div>
            <div className="mt-3 text-2xl font-semibold text-slate-900">{total}</div>
            <div className="mt-2 text-xs text-slate-500">Actions logged past 48h</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/5 border border-slate-200/70">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Air traffic</h2>
              <p className="text-sm text-slate-500">Latest creator interactions across the funnel</p>
            </div>
          </header>
          <div className="mt-6 space-y-4">
            {lastUpdates.map((event) => (
              <div key={event.id} className="flex items-start gap-3 border border-slate-100 rounded-xl p-4 bg-slate-50/70">
                <div className="h-9 w-9 rounded-full bg-slate-900/5 flex items-center justify-center text-xs font-semibold text-slate-600">
                  {(categoryLabels[event.category] ?? event.category).slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">{event.title}</div>
                    <div className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString('en-IN', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}</div>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-xs text-slate-500">{event.description}</p>
                  )}
                  <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                    {event.category}
                    {event.amount ? ` · ₹${Math.round(event.amount / 1000)}k` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/5 border border-slate-200/70">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Brands in focus</h2>
              <p className="text-sm text-slate-500">Campaigns touched most frequently this week</p>
            </div>
          </header>
          <div className="mt-6 space-y-4">
            {topBrands.map(({ brand, event }) => (
              <div key={`${event.id}-${brand!.id}`} className="flex items-start gap-3 border border-slate-100 rounded-xl p-4">
                <img src={brand!.thumb} alt={brand!.name} className="h-12 w-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">{brand!.name}</div>
                    <span className="text-xs text-slate-500">{brand!.marketing.pipelineStage}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Latest: {event.title}</p>
                  <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">Audience fit {brand!.audienceFit}% · {brand!.fitGrade}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
