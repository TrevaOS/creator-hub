import { MessageSquare } from 'lucide-react';

export default function MarketingChat() {
  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-600 font-semibold">Marketing</p>
            <h1 className="text-3xl font-bold text-slate-900">Chat</h1>
            <p className="mt-2 text-sm text-slate-500">Manage conversations across campaigns and creator outreach.</p>
          </div>
          <div className="rounded-2xl bg-cyan-50 text-cyan-700 px-4 py-3 inline-flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Live chat
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500 mb-4">This section is now available in the marketing workspace. Open a chat conversation from campaigns or creator matches to keep your outreach in one place.</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Recent inbound chat</p>
              <p className="mt-2 text-sm text-slate-500">Start a thread with creators who have pitched already.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Creator outreach</p>
              <p className="mt-2 text-sm text-slate-500">Follow up on active campaigns and map conversations to deal progress.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
