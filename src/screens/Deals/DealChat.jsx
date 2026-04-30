import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { resolveOrgUserForAuthUser, supabase } from '../../services/supabase';
import styles from './DealChat.module.css';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DealChat() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [briefOpen, setBriefOpen] = useState(false);
  const [deal, setDeal] = useState(null);
  const [senderOrgUserId, setSenderOrgUserId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user || !dealId) return;

    let active = true;

    (async () => {
      const { data: dealData } = await supabase
        .from('creator_hub_deals')
        .select('*')
        .eq('id', dealId)
        .single();
      if (active) setDeal(dealData || null);

      const { data } = await supabase
        .from('creator_hub_messages')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (active) setMessages(data || []);

      const orgUser = await resolveOrgUserForAuthUser({
        userId: user.id,
        email: user.email,
        autoLink: true,
      });
      if (active) {
        setSenderOrgUserId(orgUser?.id || null);
      }
    })();

    const channel = supabase
      .channel(`deal_chat_${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creator_hub_messages',
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, dealId]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || !user || !dealId || dealId === 'undefined') return;

    const tempId = `tmp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    const { error } = await supabase.from('creator_hub_messages').insert({
      deal_id: dealId,
      sender_id: senderOrgUserId || user.id,
      content,
    });

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const brandName = deal?.brand_name || deal?.brand || 'Brand';

  return (
    <main className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.chatInfo}>
          <div className={styles.chatAvatar}>{(brandName || 'B').charAt(0).toUpperCase()}</div>
          <div>
            <p className={styles.chatName}>{brandName}</p>
            <p className={styles.chatStatus}>Online</p>
          </div>
        </div>
      </div>

      <div className={styles.briefCard}>
        <button className={styles.briefToggle} onClick={() => setBriefOpen(!briefOpen)}>
          <span className={styles.briefTitle}>Deal Brief - {brandName} x You</span>
          {briefOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {briefOpen && (
          <div className={styles.briefContent}>
            <p><strong>Deliverables:</strong> {deal?.deliverables || deal?.requirement || 'To be discussed'}</p>
            <p><strong>Timeline:</strong> Negotiation phase</p>
            <p><strong>Payout:</strong> INR {deal?.payout_min || 0} - INR {deal?.payout_max || 0}</p>
            <p><strong>Platform:</strong> {deal?.platform || 'TBD'}</p>
          </div>
        )}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>No messages yet. Start the conversation.</div>
        )}
        {messages.map((msg) => {
          const isMe = String(msg.sender_id) === String(senderOrgUserId || user?.id);
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgMe : styles.msgThem}`}>
              <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                <p className={styles.msgText}>{msg.content}</p>
                <span className={styles.msgTime}>{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar}>
        <button className={styles.attachBtn} aria-label="Attach file">
          <Paperclip size={20} />
        </button>
        <textarea
          className={styles.textInput}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Message input"
        />
        <button
          className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`}
          onClick={sendMessage}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </main>
  );
}
