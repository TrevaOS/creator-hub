import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Search, Handshake, Settings } from 'lucide-react';
import styles from './TabBar.module.css';

const TABS = [
  { path: '/deals',     label: 'Deals',     Icon: Handshake },
  { path: '/analytics', label: 'Analytics', Icon: BarChart2 },
  { path: '/dashboard', label: 'Profile',   Icon: LayoutDashboard },
  { path: '/search',    label: 'Search',    Icon: Search },
  { path: '/setup',     label: 'Setup',     Icon: Settings },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.tabBar} role="navigation" aria-label="Main navigation">
      {TABS.map(({ path, label, Icon }) => {
        const active = location.pathname.startsWith(path);
        return (
          <button
            key={path}
            className={`${styles.tab} ${path === '/dashboard' ? styles.centerTab : ''} ${active ? styles.active : ''}`}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.iconWrap}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
              {active && <span className={styles.activeDot} />}
            </span>
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
