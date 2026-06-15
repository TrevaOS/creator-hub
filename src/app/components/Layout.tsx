import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, Heart, Search, Calendar, Settings, Smartphone, MessageSquare } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { path: '/marketing/dashboard', icon: Home, label: 'Dashboard', section: 'main' },
    { section: 'divider', label: 'Marketing' },
    { path: '/marketing/inbound', icon: Heart, label: 'Inbound', section: 'marketing', badge: 12 },
    { path: '/marketing/discover', icon: Search, label: 'Discover', section: 'marketing' },
    { path: '/marketing/campaigns', icon: Calendar, label: 'Campaigns', section: 'marketing' },
    { path: '/marketing/chat', icon: MessageSquare, label: 'Chat', section: 'marketing' },
    { section: 'divider', label: 'Creator' },
    { path: '/creatorhub/home', icon: Smartphone, label: 'Creator Hub', section: 'creator' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-950 text-white flex flex-col flex-shrink-0 border-r border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-cyan-500/30">
              C
            </div>
            <div>
              <div className="font-bold text-sm text-white">Creator Dock</div>
              <div className="text-xs text-gray-400">Marketing OS</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item, idx) => {
            if (item.section === 'divider') {
              return (
                <div key={idx} className="pt-5 pb-1.5 px-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  {item.label}
                </div>
              );
            }

            const Icon = item.icon!;
            const active = isActive(item.path!);

            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-cyan-400' : ''}`} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && (
                  <span className="bg-cyan-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => navigate('/marketing/settings')}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all ${isActive('/marketing/settings') ? 'bg-cyan-500/15' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-bold text-white truncate">Settings</div>
              <div className="text-[10px] text-gray-400">Venue profile & config</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        <Outlet />
      </div>
    </div>
  );
}
