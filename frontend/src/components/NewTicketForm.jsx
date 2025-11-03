import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { createTicket } from '../services/api';

export default function NewTicketForm() {
  const { openTicket, loadTickets } = useApp();
  const [context, setContext] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('Hello, I need help.');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const ctx = context.trim();
    const subj = subject.trim();
    const msg = message.trim() || 'Hello, I need help.';

    if (!ctx || !subj) {
      alert('Please fill in context and subject');
      return;
    }

    setCreating(true);
    const { data, error } = await createTicket(ctx, subj, msg);

    if (error) {
      alert(`Failed to create ticket: ${error}`);
    } else {
      await loadTickets();
      if (data?.ticket_id) {
        openTicket(data.ticket_id);
      }
    }

    setCreating(false);
  };

  return (
    <div className="grid grid-cols-[1fr_1fr_160px] gap-4 p-6">
      <input
        type="text"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Context (e.g., acme)"
        disabled={creating}
        className="border-2 border-border bg-white text-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30 focus:border-[#ff6b35] transition-all duration-200 disabled:opacity-50 placeholder:text-muted/60 shadow-sm hover:shadow-md hover-lift font-medium"
      />
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject (e.g., Password reset)"
        disabled={creating}
        className="border-2 border-border bg-white text-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30 focus:border-[#ff6b35] transition-all duration-200 disabled:opacity-50 placeholder:text-muted/60 shadow-sm hover:shadow-md hover-lift font-medium"
      />
      <button
        onClick={handleCreate}
        disabled={creating || !context.trim() || !subject.trim()}
        className="w-full bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white rounded-xl hover:from-[#ff8c42] hover:to-[#ff6b35] hover:shadow-xl hover:shadow-[#ff6b35]/50 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg px-4 py-3 font-bold text-sm shadow-lg shadow-[#ff6b35]/30 hover-lift"
      >
        {creating ? '...' : 'Create / Continue'}
      </button>
    </div>
  );
}

