import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase';
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
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user || !dealId) return;

    let active = true;

    (async () => {
      const { data } = await supabase
        .from('creator_hub_messages')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (active) setMessages(data || []);
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
      sender_id: user.id,
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

  return (
    <main className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.chatInfo}>
          <div className={styles.chatAvatar}>S</div>
          <div>
            <p className={styles.chatName}>StyleCo</p>
            <p className={styles.chatStatus}>Online</p>
          </div>
        </div>
      </div>

      <div className={styles.briefCard}>
        <button className={styles.briefToggle} onClick={() => setBriefOpen(!briefOpen)}>
          <span className={styles.briefTitle}>Deal Brief - StyleCo x You</span>
          {briefOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {briefOpen && (
          <div className={styles.briefContent}>
            <p><strong>Deliverables:</strong> 2 Reels + 3 Stories</p>
            <p><strong>Timeline:</strong> 2 weeks</p>
            <p><strong>Payout:</strong> INR 15,000-INR 25,000</p>
            <p><strong>Platform:</strong> Instagram</p>
          </div>
        )}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>No messages yet. Start the conversation.</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
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
