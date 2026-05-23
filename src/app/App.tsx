import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InboundMatches from './pages/InboundMatches';
import OutboundDiscovery from './pages/OutboundDiscovery';
import CampaignManager from './pages/CampaignManager';
import CampaignsList from './pages/CampaignsList';
import FloorLive from './pages/FloorLive';
import Settings from './pages/Settings';
import CreatorHubApp from './creatorhub/CreatorHubApp';
import AdminApp from './admin/AdminApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/creatorhub/*" element={<CreatorHubApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/admin-dashboard/*" element={<Navigate to="/admin" replace />} />
        <Route path="/marketing" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="floor" element={<FloorLive />} />
          <Route path="inbound" element={<InboundMatches />} />
          <Route path="discover" element={<OutboundDiscovery />} />
          <Route path="campaigns" element={<CampaignsList />} />
          <Route path="campaigns/:campaignId" element={<CampaignManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Navigate to="/marketing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
