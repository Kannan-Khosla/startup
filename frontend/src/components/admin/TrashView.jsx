import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrashTickets, restoreTickets, permanentlyDeleteTickets } from '../../services/api';
import Loading from '../Loading';

function Badge({ status }) {
  const className = {
    open: 'bg-green-500/20 text-green-400 border-green-500/50',
    human_assigned: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    closed: 'bg-muted/20 text-muted border-border',
  }[status] || 'bg-muted/20 text-muted border-border';
  
  return (
    <span className={`text-xs px-3 py-1 rounded-full border font-medium ${className}`}>
      {status?.replace('_', ' ') || 'open'}
    </span>
  );
}

export default function TrashView() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadTrash();
  }, [page, pageSize]);

  const loadTrash = async () => {
    setLoading(true);
    const { data, error } = await getTrashTickets(page, pageSize);
    if (error) {
      alert(`Failed to load trash: ${error}`);
    } else if (data) {
      setTickets(data.tickets || []);
      setPagination(data.pagination || null);
    }
    setLoading(false);
  };

  const handleSelectTicket = (ticketId) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTickets.size === tickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(tickets.map(t => t.id)));
    }
  };

  const handleRestore = async () => {
    if (selectedTickets.size === 0) return;

    if (!confirm(`Are you sure you want to restore ${selectedTickets.size} ticket(s)?`)) {
      return;
    }

    setRestoring(true);
    const { data, error } = await restoreTickets(Array.from(selectedTickets));
    
    if (error) {
      alert(`Failed to restore tickets: ${error}`);
    } else {
      setSelectedTickets(new Set());
      await loadTrash();
    }
    setRestoring(false);
  };

  const handlePermanentDelete = async () => {
    if (selectedTickets.size === 0) return;

    if (!confirm(`⚠️ WARNING: This will permanently delete ${selectedTickets.size} ticket(s). This action CANNOT be undone. Are you absolutely sure?`)) {
      return;
    }

    setDeleting(true);
    const { data, error } = await permanentlyDeleteTickets(Array.from(selectedTickets));
    
    if (error) {
      alert(`Failed to permanently delete tickets: ${error}`);
    } else {
      setSelectedTickets(new Set());
      await loadTrash();
    }
    setDeleting(false);
  };

  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-2">Trash</h1>
        <p className="text-sm text-muted">Deleted tickets are kept for 30 days before permanent deletion</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">
            {pagination ? `${pagination.total_count} ticket(s) in trash` : 'Loading...'}
          </p>
        </div>
        {selectedTickets.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">
              {selectedTickets.size} selected
            </span>
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              {restoring ? 'Restoring...' : 'Restore'}
            </button>
            <button
              onClick={handlePermanentDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              {deleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-lg mb-2">Trash is empty</p>
          <p className="text-sm">Deleted tickets will appear here</p>
        </div>
      ) : (
        <>
          {tickets.length > 0 && (
            <div className="flex items-center gap-3 mb-3 p-3 glass border border-border rounded-lg">
              <input
                type="checkbox"
                checked={selectedTickets.size > 0 && selectedTickets.size === tickets.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-accent bg-panel border-border rounded focus:ring-accent"
              />
              <span className="text-sm text-text-secondary">
                Select all ({tickets.length})
              </span>
            </div>
          )}
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="glass border border-border rounded-lg p-4 hover:border-accent/50 hover:bg-panel-hover transition-all hover-lift"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTickets.has(ticket.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectTicket(ticket.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 text-accent bg-panel border-border rounded focus:ring-accent"
                  />
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/admin/ticket/${ticket.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-text-secondary">{ticket.context}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={ticket.status} />
                        {ticket.days_until_permanent_deletion !== undefined && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            ticket.days_until_permanent_deletion <= 7
                              ? 'bg-red-500/20 text-red-400'
                              : ticket.days_until_permanent_deletion <= 14
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-muted/20 text-muted'
                          }`}>
                            {ticket.days_until_permanent_deletion} days left
                          </span>
                        )}
                      </div>
                    </div>
                    {ticket.assigned_to && (
                      <p className="text-xs text-muted mb-1">Assigned to: {ticket.assigned_to}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                      {ticket.deleted_at && (
                        <span>Deleted: {new Date(ticket.deleted_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 0 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.has_prev || loading}
                className="px-4 py-2 glass border border-border rounded-lg text-text hover:bg-panel-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        pageNum === pagination.page
                          ? 'bg-accent text-white glow'
                          : 'glass border border-border text-text hover:bg-panel-hover'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                disabled={!pagination.has_next || loading}
                className="px-4 py-2 glass border border-border rounded-lg text-text hover:bg-panel-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

