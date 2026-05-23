import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router';
import { LayoutDashboard, BarChart3, UsersRound, LifeBuoy } from 'lucide-react';
import AdminDashboard from './pages/AdminDashboard';
import AdminCampaigns from './pages/AdminCampaigns';
import AdminCreatorOps from './pages/AdminCreatorOps';
import AdminSupport from './pages/AdminSupport';

const NAV_ITEMS = [
  { to: '/admin', exact: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/campaigns', exact: false, label: 'Campaign Health', icon: BarChart3 },
  { to: '/admin/creators', exact: false, label: 'Creator Ops', icon: UsersRound },
  { to: '/admin/support', exact: false, label: 'Support Desk', icon: LifeBuoy },
];

const ADMIN_USER = {
  name: 'Ops Command',
  role: 'Platform Admin',
  avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=80&h=80&q=80&crop=faces',
};

export default function AdminApp() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-200 bg-white">
        <div className="px-6 py-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Creator Dock</div>
          <div className="mt-3 text-xl font-semibold text-slate-900">Admin Control</div>
        </div>
        <nav className="flex-1 px-3 space-y-2">
          {NAV_ITEMS.map(({ to, exact, label, icon: Icon }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-100 text-cyan-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-500" />}
              </NavLink>
            );
          })}
        </nav>
        <div className="px-6 py-5 border-t border-slate-200 flex items-center gap-3 bg-slate-50/80">
          <img src={ADMIN_USER.avatar} alt={ADMIN_USER.name} className="h-9 w-9 rounded-full object-cover" />
          <div>
            <div className="text-sm font-semibold text-slate-900">{ADMIN_USER.name}</div>
            <div className="text-xs text-slate-500">{ADMIN_USER.role}</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-cyan-600">Control Center</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Creator Hub + Marketing Ops</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wide">System Status</div>
                <div className="text-sm font-semibold text-emerald-600">All services nominal</div>
              </div>
              <button className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 hover:bg-cyan-100">
                Trigger Sync
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-100">
          <div className="relative">
            <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-br from-cyan-200/50 via-sky-200/50 to-transparent blur-3xl" aria-hidden />
            <div className="relative px-4 sm:px-6 lg:px-10 py-8">
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="campaigns" element={<AdminCampaigns />} />
                <Route path="creators" element={<AdminCreatorOps />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="*" element={<Navigate to="." replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
