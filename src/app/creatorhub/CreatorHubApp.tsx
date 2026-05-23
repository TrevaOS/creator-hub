import { Routes, Route, Navigate, useLocation, NavLink, useNavigate } from 'react-router';
import { Home, Inbox, User } from 'lucide-react';
import CreatorHome from './pages/CreatorHome';
import CreatorInbox from './pages/CreatorInbox';
import CreatorProfile from './pages/CreatorProfile';
import { CREATOR } from './data/creator';

export function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-100 flex z-50">
      {[
        { path: '/creatorhub/home', icon: Home, label: 'HOME' },
        { path: '/creatorhub/inbox', icon: Inbox, label: 'INBOX' },
        { path: '/creatorhub/profile', icon: User, label: 'PROFILE' },
      ].map(({ path, icon: Icon, label }) => {
        const active = isActive(path);
        return (
          <NavLink
            key={path}
            to={path}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                active ? 'bg-gray-900' : ''
              }`}
            >
              <Icon
                className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`}
              />
            </div>
            <span
              className={`text-[9px] font-bold tracking-wider ${
                active ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </NavLink>
        );
      })}
    </div>
  );
}

export function TopBar({
  title,
  right,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-50">
      <button
        onClick={() => navigate('/creatorhub/profile')}
        className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden"
        aria-label="Open profile"
      >
        <img
          src={CREATOR.avatar}
          alt={CREATOR.name}
          className="w-full h-full object-cover"
        />
      </button>
      {title ?? (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gray-900 flex items-center justify-center">
            <div className="w-2 h-2 bg-cyan-400 rounded-sm" />
          </div>
          <span className="font-bold text-base text-gray-900">Creator Hub</span>
        </div>
      )}
      {right ?? (
        <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center bg-white">
          <div className="flex flex-col gap-[3px] items-end">
            <div className="w-4 h-[2px] bg-gray-700 rounded" />
            <div className="w-4 h-[2px] bg-gray-700 rounded" />
            <div className="w-2.5 h-[2px] bg-gray-700 rounded" />
          </div>
        </button>
      )}
    </div>
  );
}

export default function CreatorHubApp() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-300">
      <div className="relative w-full max-w-[390px] h-screen bg-gray-50 flex flex-col overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
          <Routes>
            <Route index element={<Navigate to="/creatorhub/home" replace />} />
            <Route path="home" element={<CreatorHome />} />
            <Route path="inbox/*" element={<CreatorInbox />} />
            <Route path="profile/*" element={<CreatorProfile />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
