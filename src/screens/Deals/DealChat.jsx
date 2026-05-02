import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase';
import styles from './DealChat.module.css';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DealChat() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deals, setDeals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(dealId || null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setSelectedDealId(dealId || null);
  }, [dealId]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: accepted } = await supabase
        .from('creator_hub_accepted_deals')
        .select('deal_id, creator_hub_deals(*)')
        .eq('user_id', user.id);
      const rows = (accepted || []).map((r) => r.creator_hub_deals).filter(Boolean);
      setDeals(rows);
      if (!selectedDealId && rows.length > 0) setSelectedDealId(rows[0].id);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedDealId) return;
    (async () => {
      const { data } = await supabase
        .from('creator_hub_messages')
        .select('*')
        .eq('deal_id', selectedDealId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    })();

    const channel = supabase
      .channel(`deal_chat_${selectedDealId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'creator_hub_messages', filter: `deal_id=eq.${selectedDealId}` }, (payload) => {
        setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDealId]);

  const selectedDeal = useMemo(() => deals.find((d) => String(d.id) === String(selectedDealId)) || null, [deals, selectedDealId]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || !selectedDealId || !user?.id) return;
    setDraft('');
    await supabase.from('creator_hub_messages').insert({
      deal_id: selectedDealId,
      sender_id: user.id,
      content,
    });
  }

  return (
    <main className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1>Inbox</h1>
      </div>

      <div className={styles.layout}>
        <aside className={styles.listPane}>
          {deals.map((deal) => {
            const active = String(deal.id) === String(selectedDealId);
            return (
              <button key={deal.id} className={`${styles.thread} ${active ? styles.threadActive : ''}`} onClick={() => setSelectedDealId(deal.id)}>
                <div className={styles.avatar}>{(deal.brand_name || 'B').charAt(0).toUpperCase()}</div>
                <div className={styles.threadText}>
                  <strong>{deal.brand_name || 'Brand'}</strong>
                  <span>{deal.category || deal.deliverables || 'Deal chat'}</span>
                </div>
              </button>
            );
          })}
        </aside>

        <section className={styles.chatPane}>
          {!selectedDeal ? (
            <div className={styles.empty}>Select a conversation</div>
          ) : (
            <>
              <div className={styles.chatHead}>
                <strong>{selectedDeal.brand_name || 'Brand'}</strong>
                <span>{selectedDeal.category || 'Active deal'}</span>
              </div>
              <div className={styles.messages}>
                {messages.map((msg) => {
                  const mine = String(msg.sender_id) === String(user?.id);
                  return (
                    <div key={msg.id} className={`${styles.msg} ${mine ? styles.msgMine : styles.msgOther}`}>
                      <p>{msg.content}</p>
                      <small>{formatTime(msg.created_at)}</small>
                    </div>
                  );
                })}
              </div>
              <div className={styles.composer}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type you message" />
                <button onClick={sendMessage} disabled={!draft.trim()}><Send size={16} /></button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

