import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './store/AuthContext';
import TabBar from './components/TabBar';
import Auth from './screens/Auth/Auth';
import Onboarding from './screens/Onboarding/Onboarding';
import Dashboard from './screens/Dashboard/Dashboard';
import Analytics from './screens/Analytics/Analytics';
import Search from './screens/Search/Search';
import Deals from './screens/Deals/Deals';
import DealDetail from './screens/Deals/DealDetail';
import DealChat from './screens/Deals/DealChat';
import Setup from './screens/Setup/Setup';
import OAuthCallback from './screens/OAuthCallback/OAuthCallback';
import AdminDashboard from './screens/AdminDashboard/AdminDashboard';

const TABBED_ROUTES = ['/dashboard', '/analytics', '/search', '/deals', '/setup'];

function ProtectedRoute({ children }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();
  const isSuperAdmin = isAdmin || profile?.role_type === 'superadmin' || profile?.role_type === 'org_admin';

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid var(--brand)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );

  if (!user) return <Navigate to="/auth" replace />;
  const profileComplete = Boolean(
    profile?.name?.trim() &&
    profile?.username?.trim()
  );
  if (!profileComplete && !isSuperAdmin && location.pathname !== '/setup') return <Navigate to="/setup" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid var(--brand)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );

  if (!user) return <Navigate to="/auth" replace />;
  const roleType = profile?.role_type || '';
  if (!['superadmin', 'org_admin'].includes(roleType) && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppShell() {
  const location = useLocation();
  const isDealSubRoute = location.pathname.startsWith('/deals/chat/') || location.pathname.startsWith('/deals/');
  const showTabBar = TABBED_ROUTES.some(r => location.pathname.startsWith(r)) && !isDealSubRoute;

  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
        <Route path="/deals/:id" element={<ProtectedRoute><DealDetail /></ProtectedRoute>} />
        <Route path="/deals/chat/:dealId" element={<ProtectedRoute><DealChat /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />

        {/* OAuth callbacks — no auth guard needed, handles redirect from platform */}
        <Route path="/oauth/:platform" element={<OAuthCallback />} />
        <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {showTabBar && <TabBar />}
    </>
  );
}

export default function App() {
  return <AppShell />;
}
