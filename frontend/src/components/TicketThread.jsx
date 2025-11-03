import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import MessageBubble from './MessageBubble';
import AdminPanel from './AdminPanel';
import Loading from './Loading';
import { sendReply } from '../services/api';

export default function TicketThread() {
  const { thread, currentTicketId, loading, loadTickets, loadThread } = useApp();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread]);

  const handleSendReply = async () => {
    if (!currentTicketId || !message.trim()) return;
    
    const msg = message.trim();
    setMessage('');
    setSending(true);
    
    const { error } = await sendReply(currentTicketId, msg);
    
    if (error) {
      alert(`Failed to send reply: ${error}`);
    } else {
      // Reload thread and tickets
      await loadThread(currentTicketId);
      await loadTickets();
    }
    
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  if (!currentTicketId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-muted text-center space-y-3 animate-fade-in">
          <div className="text-5xl mb-4 animate-pulse-slow">💬</div>
          <div className="text-base font-medium text-text">Select a ticket from the left</div>
          <div className="text-sm text-muted font-light">to view the conversation</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 p-8 overflow-auto flex flex-col gap-5 -mx-2 px-2 bg-white">
        {loading ? (
          <Loading />
        ) : !thread || !thread.messages || thread.messages.length === 0 ? (
          <div className="text-muted text-center py-16 space-y-3 animate-fade-in">
            <div className="text-4xl mb-4 animate-pulse-slow">✨</div>
            <div className="text-base font-semibold text-text">No messages yet</div>
            <div className="text-sm text-muted font-light">Start the conversation</div>
          </div>
        ) : (
          <>
            {thread.messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="border-t-2 border-border bg-white p-5 flex gap-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a reply and press Enter..."
          disabled={sending || !currentTicketId}
          className="flex-1 border-2 border-border bg-white text-text rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30 focus:border-[#ff6b35] transition-all duration-200 disabled:opacity-50 placeholder:text-muted/60 shadow-sm hover:shadow-md hover-lift font-medium"
        />
        <button
          onClick={handleSendReply}
          disabled={sending || !currentTicketId || !message.trim()}
          className="px-8 py-3.5 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white rounded-xl hover:from-[#ff8c42] hover:to-[#ff6b35] hover:shadow-xl hover:shadow-[#ff6b35]/50 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg font-bold text-sm shadow-lg shadow-[#ff6b35]/30 hover-lift"
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>

      <AdminPanel />
    </div>
  );
}

