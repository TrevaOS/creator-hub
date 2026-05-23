import { useState } from 'react';
import { Users, Clock, Star, Plus, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'collab';

interface Table {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  guest?: string;
  tag?: string;
  time?: string;
  img?: string;
}

const TABLES: Table[] = [
  { id: 't1', number: 1, seats: 2, status: 'available' },
  { id: 't2', number: 2, seats: 4, status: 'occupied', guest: 'Walk-in', time: '7:30 PM' },
  { id: 't3', number: 3, seats: 4, status: 'collab', guest: 'Devi P.', tag: 'Marketing: Barter', time: '8:00 PM', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=40&h=40&fit=crop&crop=face' },
  { id: 't4', number: 4, seats: 2, status: 'reserved', guest: 'Ananya M.', time: '8:30 PM' },
  { id: 't5', number: 5, seats: 6, status: 'occupied', guest: 'Walk-in', time: '7:00 PM' },
  { id: 't6', number: 6, seats: 4, status: 'available' },
  { id: 't7', number: 7, seats: 2, status: 'available' },
  { id: 't8', number: 8, seats: 8, status: 'reserved', guest: 'Sharma Group', time: '9:00 PM' },
  { id: 't9', number: 9, seats: 4, status: 'occupied', guest: 'Walk-in', time: '7:45 PM' },
  { id: 't10', number: 10, seats: 2, status: 'collab', guest: 'Maya R.', tag: 'Marketing: Barter', time: '8:00 PM', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face' },
  { id: 't11', number: 11, seats: 4, status: 'available' },
  { id: 't12', number: 12, seats: 6, status: 'occupied', guest: 'Walk-in', time: '6:30 PM' },
];

const WAITLIST = [
  { name: 'Ravi S.', pax: 3, wait: '5 min', type: 'walk-in' },
  { name: 'Nisha K.', pax: 2, wait: '12 min', type: 'walk-in' },
  { name: 'Priya S. · @dineanddash', pax: 2, wait: '20 min', type: 'collab', tag: 'Marketing: Barter', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face' },
  { name: 'Arjun T.', pax: 4, wait: '28 min', type: 'walk-in' },
];

const TABLE_STATUS_STYLE: Record<TableStatus, { bg: string; border: string; label: string; text: string }> = {
  available: { bg: 'bg-green-50', border: 'border-green-200', label: 'Available', text: 'text-green-600' },
  occupied: { bg: 'bg-gray-100', border: 'border-gray-300', label: 'Occupied', text: 'text-gray-500' },
  reserved: { bg: 'bg-blue-50', border: 'border-blue-200', label: 'Reserved', text: 'text-blue-600' },
  collab: { bg: 'bg-cyan-50', border: 'border-cyan-300', label: 'Collab', text: 'text-cyan-700' },
};

export default function FloorLive() {
  const [tables, setTables] = useState<Table[]>(TABLES);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tab, setTab] = useState<'floor' | 'waitlist'>('floor');

  const occupied = tables.filter(t => t.status === 'occupied' || t.status === 'collab').length;
  const reserved = tables.filter(t => t.status === 'reserved').length;
  const collabs = tables.filter(t => t.status === 'collab').length;

  const seatTable = (tableId: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'occupied', guest: 'Walk-in', time: 'Now' } : t));
    setSelectedTable(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Floor & Live</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time table management · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setTab('floor')} className={`px-4 py-2 text-xs font-semibold transition-colors ${tab === 'floor' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Floor Plan</button>
            <button onClick={() => setTab('waitlist')} className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${tab === 'waitlist' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Waitlist
              <span className="bg-cyan-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{WAITLIST.length}</span>
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Reservation
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-6 flex-shrink-0">
        {[
          { label: 'Tables Occupied', value: `${occupied}/${tables.length}`, pct: `${Math.round((occupied / tables.length) * 100)}%`, color: 'text-gray-900', dot: 'bg-gray-400' },
          { label: 'Active Reservations', value: reserved, pct: 'tonight', color: 'text-blue-600', dot: 'bg-blue-400' },
          { label: 'Marketing Collabs', value: collabs, pct: 'on floor', color: 'text-cyan-600', dot: 'bg-cyan-400' },
          { label: 'Waitlist', value: WAITLIST.length, pct: `${WAITLIST[0]?.pax || 0}–${WAITLIST[WAITLIST.length-1]?.pax || 0} pax`, color: 'text-orange-600', dot: 'bg-orange-400' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${stat.dot}`} />
            <div>
              <span className={`text-lg font-black ${stat.color}`}>{stat.value}</span>
              <span className="text-xs text-gray-400 ml-2">{stat.label} · {stat.pct}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Floor Plan / Waitlist */}
        <div className="flex-1 overflow-auto p-6">
          {tab === 'floor' && (
            <div>
              <div className="grid grid-cols-4 gap-3">
                {tables.map(table => {
                  const style = TABLE_STATUS_STYLE[table.status];
                  const isSelected = selectedTable?.id === table.id;
                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelectedTable(isSelected ? null : table)}
                      className={`border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-sm ${style.bg} ${style.border} ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-1' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Table {table.number}</div>
                          <div className="text-sm font-bold text-gray-900 mt-0.5">{table.seats} seats</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                          {style.label}
                        </span>
                      </div>

                      {table.status === 'available' && (
                        <div className={`text-xs font-semibold ${style.text} flex items-center gap-1`}>
                          <Circle className="w-3 h-3" /> Open
                        </div>
                      )}
                      {(table.status === 'occupied' || table.status === 'reserved' || table.status === 'collab') && table.guest && (
                        <div className="flex items-center gap-2">
                          {table.img ? (
                            <img src={table.img} alt={table.guest} className="w-7 h-7 rounded-full object-cover border border-white shadow-sm" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 border border-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-500">
                              {table.guest[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800 truncate">{table.guest}</div>
                            {table.time && <div className="text-[10px] text-gray-400">{table.time}</div>}
                          </div>
                        </div>
                      )}
                      {table.status === 'collab' && table.tag && (
                        <div className="mt-2">
                          <span className="bg-cyan-100 text-cyan-700 border border-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {table.tag}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 px-1">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Legend:</div>
                {Object.entries(TABLE_STATUS_STYLE).map(([status, s]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm border ${s.bg} ${s.border}`} />
                    <span className="text-xs text-gray-500 font-medium capitalize">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'waitlist' && (
            <div className="max-w-2xl space-y-3">
              <div className="text-sm text-gray-500 mb-4">{WAITLIST.length} parties waiting · avg 16 min</div>
              {WAITLIST.map((entry, idx) => (
                <div key={idx} className={`bg-white border rounded-xl px-5 py-4 flex items-center gap-4 ${entry.type === 'collab' ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200'}`}>
                  <div className="text-xl font-black text-gray-200 w-6 text-center">{idx + 1}</div>
                  {entry.img ? (
                    <img src={entry.img} alt={entry.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-400 flex-shrink-0">
                      {entry.pax}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{entry.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> {entry.pax} pax</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {entry.wait} wait</span>
                      {entry.tag && <span className="bg-cyan-100 text-cyan-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200">{entry.tag}</span>}
                    </div>
                  </div>
                  <button className="py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors">
                    Seat Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table Detail Panel */}
        {selectedTable && tab === 'floor' && (
          <div className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-sm text-gray-900">Table {selectedTable.number}</div>
                <button onClick={() => setSelectedTable(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
              </div>
              <div className="text-xs text-gray-400">{selectedTable.seats} seats · {TABLE_STATUS_STYLE[selectedTable.status].label}</div>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {selectedTable.status === 'available' && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">This table is open</div>
                  <button className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-colors">
                    Make Reservation
                  </button>
                  <button
                    onClick={() => seatTable(selectedTable.id)}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Seat Walk-in
                  </button>
                </div>
              )}

              {selectedTable.status !== 'available' && (
                <div className="space-y-3">
                  {selectedTable.img && (
                    <img src={selectedTable.img} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 mx-auto" />
                  )}
                  {selectedTable.guest && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-0.5">Guest</div>
                      <div className="font-semibold text-sm text-gray-900">{selectedTable.guest}</div>
                      {selectedTable.time && <div className="text-xs text-gray-400 mt-0.5">{selectedTable.time}</div>}
                      {selectedTable.tag && (
                        <span className="mt-2 inline-block bg-cyan-100 text-cyan-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200">
                          {selectedTable.tag}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedTable.status === 'collab' && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 mb-1">
                        <Star className="w-3.5 h-3.5 fill-cyan-500 text-cyan-500" /> Marketing Collab
                      </div>
                      <div className="text-xs text-cyan-600">This is an influencer booking. Content expected post-visit.</div>
                    </div>
                  )}
                  {selectedTable.status === 'reserved' && (
                    <button
                      onClick={() => seatTable(selectedTable.id)}
                      className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Mark as Seated
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'available', guest: undefined, tag: undefined, time: undefined, img: undefined } : t));
                      setSelectedTable(null);
                    }}
                    className="w-full py-2 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Clear Table
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
