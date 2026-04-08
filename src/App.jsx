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

const TABBED_ROUTES = ['/dashboard', '/analytics', '/search', '/deals', '/setup'];

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

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
        border: '3px solid var(--cane)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );

  const isDemo = !user && localStorage.getItem('ch_onboarded');
  if (!user && !isDemo) return <Navigate to="/auth" replace />;
  return children;
}

function AppShell() {
  const location = useLocation();
  const showTabBar = TABBED_ROUTES.some(r => location.pathname.startsWith(r));

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
