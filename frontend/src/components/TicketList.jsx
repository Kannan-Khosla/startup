import { useApp } from '../contexts/AppContext';
import Loading from './Loading';
import { getStats } from '../services/api';

function Badge({ status }) {
  const className = {
    open: 'text-white border-[#ff6b35] bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] shadow-lg shadow-[#ff6b35]/30',
    closed: 'text-white border-[#22c55e] bg-gradient-to-r from-[#22c55e] to-[#16a34a] shadow-lg shadow-[#22c55e]/30',
    human_assigned: 'text-white border-[#f59e0b] bg-gradient-to-r from-[#f59e0b] to-[#e67e22] shadow-lg shadow-[#f59e0b]/30',
  }[status] || 'text-muted border-border bg-gray-100';
  
  return (
    <span className={`text-[11px] px-3 py-1 rounded-full border-2 font-bold shadow-md transition-all duration-200 hover:scale-110 ${className}`}>
      {status}
    </span>
  );
}

export default function TicketList() {
  const {
    tickets,
    statusFilter,
    baseUrl,
    loading,
    loadTickets,
    openTicket,
    updateStatusFilter,
    updateBaseUrl,
  } = useApp();

  const handleStatsClick = async () => {
    const { data, error } = await getStats();
    if (error) {
      alert(`Failed to fetch stats: ${error}`);
    } else {
      alert(
        `Total: ${data.total_tickets}\n` +
        `Open: ${data.open_tickets}\n` +
        `Closed: ${data.closed_tickets}`
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 animate-fade-in">
        <div className="font-bold text-3xl mb-6 tracking-tight">
          <span className="bg-gradient-to-r from-[#0f149a] via-[#0f149a] to-[#ff6b35] bg-clip-text text-transparent">
            Support Desk
          </span>
        </div>
        <div className="text-muted text-xs mb-2 font-semibold uppercase tracking-wider">Backend base URL</div>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => updateBaseUrl(e.target.value)}
          className="w-full border-2 border-border bg-white text-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30 focus:border-[#ff6b35] transition-all duration-200 placeholder:text-muted/50 shadow-sm hover:shadow-md"
          placeholder="http://localhost:8000"
        />
      </div>
      
      <div className="flex gap-3 mb-4 animate-slide-up">
        <select
          value={statusFilter}
          onChange={(e) => updateStatusFilter(e.target.value)}
          className="flex-1 border-2 border-border bg-white text-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/30 focus:border-[#ff6b35] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md font-medium"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="human_assigned">Human assigned</option>
          <option value="closed">Closed</option>
        </select>
        <button
          onClick={loadTickets}
          className="px-5 py-3 border-2 border-[#0f149a] bg-gradient-to-r from-[#0f149a] to-[#1a20b0] text-white rounded-xl hover:from-[#1a20b0] hover:to-[#0f149a] hover:shadow-lg hover:shadow-[#0f149a]/40 hover:scale-105 transition-all duration-300 text-sm font-bold shadow-md hover-lift"
        >
          ↻
        </button>
      </div>

      <div className="flex gap-3 mb-6 animate-scale-in">
        <button
          onClick={handleStatsClick}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-[#0f149a] to-[#1a20b0] text-white border-0 rounded-xl hover:from-[#1a20b0] hover:to-[#0f149a] hover:shadow-lg hover:shadow-[#0f149a]/40 hover:scale-105 transition-all duration-300 text-sm font-bold shadow-md hover-lift"
        >
          View Stats
        </button>
      </div>

      <div className="flex-1 overflow-auto -mx-2 px-2">
        {loading ? (
          <Loading />
        ) : !tickets || tickets.length === 0 ? (
          <div className="text-muted text-center py-12 text-sm font-light">No tickets yet</div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((ticket, idx) => (
              <div
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="border-2 border-border bg-white rounded-xl p-4 cursor-pointer hover:border-[#ff6b35] hover:bg-orange-50/30 hover:shadow-lg hover:shadow-[#ff6b35]/25 transition-all duration-300 group animate-fade-in hover-lift"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="font-semibold text-sm text-text group-hover:text-[#ff6b35] transition-colors line-clamp-2 flex-1">
                    {ticket.subject || 'Untitled'}
                  </div>
                  <Badge status={ticket.status} />
                </div>
                <div className="text-muted text-xs font-light">{ticket.context || ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

