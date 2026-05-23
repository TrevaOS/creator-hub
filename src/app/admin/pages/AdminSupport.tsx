import { SUPPORT_TICKETS, BRAND_CAMPAIGNS, SupportTicketStatus } from '../../data/creatorHubData';

const statusPalette: Record<SupportTicketStatus, string> = {
  Open: '#0ea5e9',
  'In Progress': '#f59e0b',
  Waiting: '#64748b',
  Resolved: '#22c55e',
};

export default function AdminSupport() {
  const openTickets = SUPPORT_TICKETS.filter((ticket) => ticket.status !== 'Resolved');
  const resolvedTickets = SUPPORT_TICKETS.filter((ticket) => ticket.status === 'Resolved');

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SupportMetric label="Open" value={openTickets.length} tone="sky" helper="Tickets needing touchpoints" />
        <SupportMetric label="Resolved" value={resolvedTickets.length} tone="emerald" helper="Closed in the last 7 days" />
        <SupportMetric label="High priority" value={openTickets.filter((ticket) => ticket.priority === 'High').length} tone="amber" helper="Escalations on watch" />
        <SupportMetric label="Awaiting response" value={openTickets.filter((ticket) => ticket.status === 'Waiting').length} tone="slate" helper="Waiting on brand/creator" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <TicketColumn title="Live queue" tickets={openTickets} empty="All clear" />
        <TicketColumn title="Recently cleared" tickets={resolvedTickets} empty="No tickets resolved yet" />
      </section>
    </div>
  );
}

function TicketColumn({
  title,
  tickets,
  empty,
}: {
  title: string;
  tickets: typeof SUPPORT_TICKETS;
  empty: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/5 border border-slate-200/70">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">{tickets.length} tickets</span>
      </header>
      <div className="mt-6 space-y-4">
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">{empty}</div>
        ) : (
          tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)
        )}
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: (typeof SUPPORT_TICKETS)[number]; }) {
  const badgeColor = statusPalette[ticket.status];
  const brand = ticket.brandId ? BRAND_CAMPAIGNS.find((campaign) => campaign.id === ticket.brandId) : undefined;
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{ticket.title}</div>
          <div className="mt-1 text-xs text-slate-500">{ticket.summary}</div>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: `${badgeColor}15`, color: badgeColor }}
        >
          {ticket.status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-wide text-slate-500">
        <span>Priority {ticket.priority}</span>
        <span>{ticket.channel}</span>
        <span>{ticket.type}</span>
        <span>Owner · {ticket.owner.name}</span>
      </div>
      {brand && (
        <div className="mt-3 flex items-center gap-3">
          <img src={brand.thumb} alt={brand.name} className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <div className="text-sm font-semibold text-slate-900">{brand.name}</div>
            <div className="text-xs text-slate-500">Audience fit {brand.audienceFit}% · {brand.marketing.pipelineStage}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SupportMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone: 'sky' | 'emerald' | 'amber' | 'slate';
}) {
  const toneClass = {
    sky: 'bg-sky-500/10 text-sky-600 border border-sky-200',
    emerald: 'bg-emerald-500/10 text-emerald-600 border border-emerald-200',
    amber: 'bg-amber-500/10 text-amber-600 border border-amber-200',
    slate: 'bg-slate-500/10 text-slate-600 border border-slate-200',
  }[tone];

  return (
    <div className={`rounded-2xl ${toneClass} p-5 shadow-sm shadow-slate-900/5 backdrop-blur-sm`}>
      <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-2 text-xs text-slate-500/80">{helper}</div>
    </div>
  );
}
