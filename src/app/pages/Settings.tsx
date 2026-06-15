import { useState } from 'react';
import { User, Check, Camera, Mail, Phone } from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your workspace and preferences</p>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-white border-r border-gray-200 py-4 flex-shrink-0">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-50 border-r-2 border-cyan-500 text-gray-900">
            <User className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Profile</div>
              <div className="text-xs text-gray-400 truncate">Venue info, branding, location</div>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4">Venue Profile</h2>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-300" />
                    </div>
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
                      placeholder="Your venue name"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Location</label>
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="City, Neighbourhood"
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
                        placeholder="you@venue.com"
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
                        placeholder="+91 98765 43210"
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Venue Description</label>
                  <textarea
                    placeholder="Tell creators about your venue…"
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
        </div>
      </div>
    </div>
  );
}
