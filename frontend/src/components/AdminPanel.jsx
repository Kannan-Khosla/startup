import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { assignAgent, closeTicket, setAdminToken } from '../services/api';

export default function AdminPanel() {
  const { currentTicketId, loadTickets, loadThread } = useApp();
  const [agentName, setAgentName] = useState('');
  const [adminToken, setAdminTokenState] = useState(
    localStorage.getItem('adminToken') || ''
  );
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Update admin token in localStorage
  const handleTokenChange = (token) => {
    setAdminTokenState(token);
    setAdminToken(token);
  };

  const handleAssign = async () => {
    if (!currentTicketId) return;

    const agent = agentName.trim() || 'agent-1';
    setStatus('Assigning...');
    setLoading(true);

    const { data, error } = await assignAgent(currentTicketId, agent);

    if (error) {
      setStatus(`Failed: ${error}`);
    } else if (data?.success) {
      setStatus(data.message || 'Assigned');
      await loadTickets();
      await loadThread(currentTicketId);
    } else {
      setStatus(data?.error || data?.detail || 'Failed to assign');
    }

    setLoading(false);
  };

  const handleClose = async () => {
    if (!currentTicketId) return;

    setStatus('Closing...');
    setLoading(true);

    const { data, error } = await closeTicket(currentTicketId);

    if (error) {
      setStatus(`Failed: ${error}`);
    } else if (data?.success) {
      setStatus(data.message || 'Closed');
      await loadTickets();
      await loadThread(currentTicketId);
    } else {
      setStatus(data?.error || data?.detail || 'Failed to close');
    }

    setLoading(false);
  };

  return (
    <div className="border-t-2 border-border bg-white p-5 flex gap-3 items-center flex-wrap">
      <input
        type="text"
        value={agentName}
        onChange={(e) => setAgentName(e.target.value)}
        placeholder="Agent name"
        disabled={loading || !currentTicketId}
        className="max-w-[200px] border-2 border-border bg-white text-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30 focus:border-[#ff6b35] transition-all duration-200 disabled:opacity-50 placeholder:text-muted/60 shadow-sm hover:shadow-md hover-lift font-medium"
      />
      <input
        type="text"
        value={adminToken}
        onChange={(e) => handleTokenChange(e.target.value)}
        placeholder="Admin token"
        disabled={loading || !currentTicketId}
        className="max-w-[200px] border-2 border-border bg-white text-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30 focus:border-[#ff6b35] transition-all duration-200 disabled:opacity-50 placeholder:text-muted/60 shadow-sm hover:shadow-md hover-lift font-medium"
      />
      <button
        onClick={handleAssign}
        disabled={loading || !currentTicketId}
        className="px-5 py-3 bg-gradient-to-r from-[#0f149a] to-[#1a20b0] text-white border-0 rounded-xl hover:from-[#1a20b0] hover:to-[#0f149a] hover:shadow-lg hover:shadow-[#0f149a]/30 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold shadow-sm hover-lift"
      >
        Assign
      </button>
      <button
        onClick={handleClose}
        disabled={loading || !currentTicketId}
        className="px-5 py-3 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white rounded-xl hover:from-[#dc2626] hover:to-[#ef4444] hover:shadow-lg active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold shadow-sm hover-lift"
      >
        Close Ticket
      </button>
      {status && (
        <div className="text-muted text-xs ml-auto font-light">{status}</div>
      )}
    </div>
  );
}

