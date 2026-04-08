import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase';
import styles from './DealChat.module.css';

const MOCK_MESSAGES = [
  { id: '1', sender_id: 'brand', content: 'Hi! We loved your profile and would love to collaborate. Are you available for a quick call to discuss?', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', sender_id: 'me', content: "Thanks! I'd love to hear more about the campaign. What's the timeline?", created_at: new Date(Date.now() - 3000000).toISOString() },
  { id: '3', sender_id: 'brand', content: 'We\'re looking at a 2-week window. You\'d need to deliver 2 Reels and 3 Stories. The content brief is attached above.', created_at: new Date(Date.now() - 2400000).toISOString() },
  { id: '4', sender_id: 'me', content: 'Sounds good! Can we discuss the rate? I usually charge ₹20,000 for this scope.', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '5', sender_id: 'brand', content: 'We can work with ₹22,000 for this campaign. Does that work for you?', created_at: new Date(Date.now() - 900000).toISOString() },
];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DealChat() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [briefOpen, setBriefOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !dealId) return;

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`deal_chat_${dealId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `deal_id=eq.${dealId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, dealId]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content) return;

    const msg = {
      id: Date.now().toString(),
      sender_id: 'me',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, msg]);
    setInput('');

    if (user && dealId && dealId !== 'undefined') {
      try {
        await supabase.from('messages').insert({
          deal_id: dealId,
          sender_id: user.id,
          content,
        });
      } catch (e) {
        // message already shown optimistically
      }
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
      {/* Top bar */}
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

      {/* Pinned brief */}
      <div className={styles.briefCard}>
        <button className={styles.briefToggle} onClick={() => setBriefOpen(!briefOpen)}>
          <span className={styles.briefTitle}>📋 Deal Brief — StyleCo × You</span>
          {briefOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {briefOpen && (
          <div className={styles.briefContent}>
            <p><strong>Deliverables:</strong> 2 Reels + 3 Stories</p>
            <p><strong>Timeline:</strong> 2 weeks</p>
            <p><strong>Payout:</strong> ₹15,000–₹25,000</p>
            <p><strong>Platform:</strong> Instagram</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(msg => {
          const isMe = msg.sender_id === 'me' || msg.sender_id === user?.id;
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

      {/* Input bar */}
      <div className={styles.inputBar}>
        <button className={styles.attachBtn} aria-label="Attach file">
          <Paperclip size={20} />
        </button>
        <textarea
          className={styles.textInput}
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
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
