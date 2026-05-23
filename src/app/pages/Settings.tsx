import { useState } from 'react';
import { User, Bell, CreditCard, Users, Link as LinkIcon, Shield, ChevronRight, Check, Camera, Instagram, Mail, Phone } from 'lucide-react';

type SettingsSection = 'profile' | 'notifications' | 'billing' | 'team' | 'integrations' | 'security';

const SECTIONS: { id: SettingsSection; icon: React.ElementType; label: string; desc: string }[] = [
  { id: 'profile', icon: User, label: 'Profile', desc: 'Venue info, branding, location' },
  { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Email, push, Slack alerts' },
  { id: 'billing', icon: CreditCard, label: 'Billing', desc: 'Plan, usage, invoices' },
  { id: 'team', icon: Users, label: 'Team', desc: 'Members and permissions' },
  { id: 'integrations', icon: LinkIcon, label: 'Integrations', desc: 'Instagram, calendar, webhooks' },
  { id: 'security', icon: Shield, label: 'Security', desc: 'Password, 2FA, sessions' },
];

const TEAM_MEMBERS = [
  { name: 'Rahul M.', email: 'rahul@smokehouse.in', role: 'Owner', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face' },
  { name: 'Sneha T.', email: 'sneha@smokehouse.in', role: 'Manager', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face' },
  { name: 'Dev K.', email: 'dev@smokehouse.in', role: 'Staff', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' },
];

export default function Settings() {
  const [active, setActive] = useState<SettingsSection>('profile');
  const [saved, setSaved] = useState(false);
  const [venueName, setVenueName] = useState('Smokehouse');
  const [location, setLocation] = useState('Indiranagar, Bangalore');
  const [email, setEmail] = useState('tech@treva.in');
  const [phone, setPhone] = useState('+91 98765 43210');

  const [notifs, setNotifs] = useState({
    newPitch: true,
    accepted: true,
    bookingReminder: false,
    contentDue: true,
    weeklyReport: true,
    pushEnabled: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your workspace and preferences</p>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-white border-r border-gray-200 py-4 flex-shrink-0 overflow-y-auto">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                  isActive ? 'bg-gray-50 border-r-2 border-cyan-500 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-500' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>{s.label}</div>
                  <div className="text-xs text-gray-400 truncate">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">

            {/* Profile */}
            {active === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-4">Venue Profile</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=80&h=80&fit=crop&crop=face"
                          alt="Venue"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200"
                        />
                        <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center border-2 border-white hover:bg-gray-700 transition-colors">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Venue Logo</div>
                        <div className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 2MB · Shown on creator pitches</div>
                        <button className="mt-2 text-xs font-semibold text-cyan-600 hover:underline">Upload new photo</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Venue Name</label>
                        <input
                          value={venueName}
                          onChange={e => setVenueName(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Location</label>
                        <input
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Contact Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-gray-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Venue Description</label>
                      <textarea
                        defaultValue="Award-winning BBQ & craft beer venue in the heart of Indiranagar. Known for brisket, ribs, and weekend brunches."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-gray-50 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    saved ? 'bg-green-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Notifications */}
            {active === 'notifications' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-4">Notification Preferences</h2>
                <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                  {[
                    { key: 'newPitch', label: 'New creator pitch', desc: 'When a creator sends you a collaboration request' },
                    { key: 'accepted', label: 'Collab accepted', desc: 'When a creator accepts your invitation' },
                    { key: 'bookingReminder', label: 'Booking reminders', desc: '24h before a creator visit' },
                    { key: 'contentDue', label: 'Content deadlines', desc: 'When content drafts are due' },
                    { key: 'weeklyReport', label: 'Weekly report', desc: 'Summary of your marketing performance' },
                    { key: 'pushEnabled', label: 'Push notifications', desc: 'Browser and mobile push alerts' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleNotif(item.key as keyof typeof notifs)}
                        className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${
                          notifs[item.key as keyof typeof notifs] ? 'bg-cyan-500' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          notifs[item.key as keyof typeof notifs] ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing */}
            {active === 'billing' && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-900 mb-4">Billing & Plan</h2>
                <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">Growth Plan</div>
                    <div className="text-sm text-gray-600 mt-0.5">₹4,999/month · Unlimited campaigns · 5 team members</div>
                    <div className="text-xs text-gray-400 mt-1">Next billing: June 9, 2026</div>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                    Change Plan
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="font-semibold text-sm text-gray-900 mb-3">Usage This Month</div>
                  {[
                    { label: 'Active Campaigns', used: 5, max: 'Unlimited', pct: 25 },
                    { label: 'Creator Invites', used: 28, max: 100, pct: 28 },
                    { label: 'Pitch Credits', used: 14, max: 50, pct: 28 },
                  ].map(u => (
                    <div key={u.label} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-600">{u.label}</span>
                        <span className="text-xs text-gray-400">{u.used} / {u.max}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${u.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                  <div className="px-5 py-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">Recent Invoices</div>
                    <button className="text-xs text-cyan-600 font-semibold hover:underline">Download all</button>
                  </div>
                  {['May 2026', 'Apr 2026', 'Mar 2026'].map(month => (
                    <div key={month} className="px-5 py-3 flex items-center justify-between">
                      <div className="text-sm text-gray-700">{month}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">₹4,999</span>
                        <button className="text-xs text-cyan-600 font-semibold hover:underline">PDF</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team */}
            {active === 'team' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">Team Members</h2>
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors">
                    + Invite Member
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                  {TEAM_MEMBERS.map(member => (
                    <div key={member.email} className="flex items-center gap-4 px-5 py-4">
                      <img src={member.img} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-gray-100" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-400">{member.email}</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        member.role === 'Owner' ? 'bg-gray-900 text-white border-gray-900' :
                        member.role === 'Manager' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {member.role}
                      </span>
                      {member.role !== 'Owner' && (
                        <button className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">Remove</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integrations */}
            {active === 'integrations' && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-4">Integrations</h2>
                <div className="space-y-3">
                  {[
                    { name: 'Instagram', desc: 'Sync creator profiles and follower data', icon: Instagram, connected: true, handle: '@smokehouse_blr' },
                    { name: 'Google Calendar', desc: 'Sync reservations and creator visits', icon: LinkIcon, connected: false },
                    { name: 'Slack', desc: 'Get notifications in your workspace', icon: Bell, connected: false },
                    { name: 'Zapier', desc: 'Connect to 5,000+ apps with webhooks', icon: LinkIcon, connected: false },
                  ].map(int => {
                    const Icon = int.icon;
                    return (
                      <div key={int.name} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900">{int.name}</div>
                          <div className="text-xs text-gray-400">{int.connected ? int.handle || 'Connected' : int.desc}</div>
                        </div>
                        {int.connected ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                              <Check className="w-3.5 h-3.5" /> Connected
                            </span>
                            <button className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">Disconnect</button>
                          </div>
                        ) : (
                          <button className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors">
                            Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Security */}
            {active === 'security' && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-gray-900 mb-4">Security</h2>
                <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Password</div>
                      <div className="text-xs text-gray-400 mt-0.5">Last changed 3 months ago</div>
                    </div>
                    <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                      Change Password
                    </button>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Two-Factor Auth</div>
                      <div className="text-xs text-gray-400 mt-0.5">Add an extra layer of security</div>
                    </div>
                    <button className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Active Sessions</div>
                    {[
                      { device: 'Chrome · Mac OS', location: 'Bangalore, IN', time: 'Now' },
                      { device: 'Safari · iPhone 15', location: 'Bangalore, IN', time: '2 days ago' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div>
                          <div className="text-xs font-medium text-gray-800">{s.device}</div>
                          <div className="text-xs text-gray-400">{s.location} · {s.time}</div>
                        </div>
                        {i !== 0 && (
                          <button className="text-xs text-red-500 hover:underline font-medium">Revoke</button>
                        )}
                        {i === 0 && <span className="text-xs font-semibold text-green-600">Current</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
