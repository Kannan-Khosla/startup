import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { listTickets, getStats, getAssignedTickets, deleteTickets, getTicketTags } from '../../services/api';
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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [assignedPagination, setAssignedPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contextFilter, setContextFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('all'); // 'all', 'assigned'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [ticketTagsMap, setTicketTagsMap] = useState({});

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters or view changes
    setSelectedTickets(new Set()); // Clear selection when filters change
  }, [statusFilter, contextFilter, assignedToFilter, dateFrom, dateTo, searchQuery, view]);

  useEffect(() => {
    loadData();
  }, [statusFilter, contextFilter, assignedToFilter, dateFrom, dateTo, searchQuery, view, page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    
    const filters = {
      ...(searchQuery && { search: searchQuery }),
      ...(statusFilter && { status: statusFilter }),
      ...(contextFilter && { context: contextFilter }),
      ...(assignedToFilter && { assigned_to: assignedToFilter }),
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo && { date_to: dateTo }),
      page,
      page_size: pageSize,
    };
    
    // Load all tickets
    const { data: allTickets } = await listTickets(filters);
    if (allTickets) {
      setTickets(allTickets.tickets || []);
      setPagination(allTickets.pagination || null);
    }

    // Load assigned tickets
    const { data: assigned } = await getAssignedTickets(filters);
    if (assigned) {
      setAssignedTickets(assigned.tickets || []);
      setAssignedPagination(assigned.pagination || null);
    }

    // Load stats
    const { data: statsData } = await getStats();
    if (statsData) {
      setStats(statsData);
    }

    // Load tags for all tickets
    const allTicketIds = [
      ...(allTickets?.tickets || []).map(t => t.id),
      ...(assigned?.tickets || []).map(t => t.id)
    ];
    const uniqueTicketIds = [...new Set(allTicketIds)];
    
    const tagsPromises = uniqueTicketIds.map(async (ticketId) => {
      const { data } = await getTicketTags(ticketId);
      return { ticketId, tags: data?.tags || [] };
    });
    
    const tagsResults = await Promise.all(tagsPromises);
    const tagsMap = {};
    tagsResults.forEach(({ ticketId, tags }) => {
      tagsMap[ticketId] = tags;
    });
    setTicketTagsMap(tagsMap);

    setLoading(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setContextFilter('');
    setAssignedToFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setSelectedTickets(new Set());
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
    const closedTickets = displayTickets.filter(t => t.status === 'closed');
    if (selectedTickets.size === closedTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(closedTickets.map(t => t.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTickets.size === 0) return;
    
    // Verify all selected tickets are closed
    const selectedTicketsList = displayTickets.filter(t => selectedTickets.has(t.id));
    const notClosed = selectedTicketsList.filter(t => t.status !== 'closed');
    
    if (notClosed.length > 0) {
      alert(`Cannot delete tickets that are not closed. Found ${notClosed.length} open/assigned ticket(s).`);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTickets.size} ticket(s)? They will be moved to trash for 30 days.`)) {
      return;
    }

    setDeleting(true);
    const { data, error } = await deleteTickets(Array.from(selectedTickets));
    
    if (error) {
      alert(`Failed to delete tickets: ${error}`);
    } else {
      setSelectedTickets(new Set());
      await loadData();
    }
    setDeleting(false);
  };

  const displayTickets = view === 'assigned' ? assignedTickets : tickets;
  const displayPagination = view === 'assigned' ? assignedPagination : pagination;
  const closedTicketsCount = displayTickets.filter(t => t.status === 'closed').length;
  const selectedClosedCount = displayTickets.filter(t => selectedTickets.has(t.id) && t.status === 'closed').length;

  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <aside className="w-80 glass border-r border-border p-6 overflow-y-auto">
          {/* Stats */}
          {stats && (
            <div className="mb-6 p-4 glass border border-border rounded-lg">
              <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wide">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-panel-hover">
                  <span className="text-text-secondary">Total:</span>
                  <span className="text-text font-bold text-lg">{stats.total_tickets || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-green-400">Open:</span>
                  <span className="text-green-400 font-bold text-lg">{stats.open_tickets || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-panel-hover">
                  <span className="text-text-secondary">Closed:</span>
                  <span className="text-text font-bold text-lg">{stats.closed_tickets || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wide">Search</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/50 transition-all"
            />
          </div>

          {/* View */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wide">View</h3>
            <div className="space-y-2">
              <button
                onClick={() => setView('all')}
                className={`w-full px-4 py-2 rounded-lg text-left transition-all ${
                  view === 'all'
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'glass border border-border text-text-secondary hover:text-text hover:bg-panel-hover'
                }`}
              >
                All Tickets
              </button>
              <button
                onClick={() => setView('assigned')}
                className={`w-full px-4 py-2 rounded-lg text-left transition-all ${
                  view === 'assigned'
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'glass border border-border text-text-secondary hover:text-text hover:bg-panel-hover'
                }`}
              >
                My Assigned
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                {showFilters ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showFilters && (
              <div className="space-y-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/50 transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="human_assigned">Assigned</option>
                  <option value="closed">Closed</option>
                </select>
                
                <input
                  type="text"
                  value={contextFilter}
                  onChange={(e) => setContextFilter(e.target.value)}
                  placeholder="Context/Brand"
                  className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/50 transition-all"
                />
                
                {view === 'all' && (
                  <input
                    type="text"
                    value={assignedToFilter}
                    onChange={(e) => setAssignedToFilter(e.target.value)}
                    placeholder="Assigned to (email)"
                    className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/50 transition-all"
                  />
                )}
                
                <div className="space-y-2">
                  <label className="text-xs text-muted">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/50 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/50 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted">Items per page</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/50 transition-all"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-panel-hover text-text-secondary rounded-lg hover:bg-panel-hover hover:text-text transition-all text-sm border border-border"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          <button
            onClick={loadData}
            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all font-medium shadow-lg shadow-indigo-500/30 glow-hover"
          >
            Refresh
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text mb-2">
                {view === 'assigned' ? 'My Assigned Tickets' : 'All Tickets'}
              </h2>
              <p className="text-sm text-muted">Manage and respond to support tickets</p>
            </div>
            <div className="flex items-center gap-4">
              {selectedTickets.size > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary">
                    {selectedTickets.size} selected
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={deleting || selectedClosedCount === 0}
                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    {deleting ? 'Deleting...' : `Delete ${selectedClosedCount} Closed`}
                  </button>
                </div>
              )}
              {displayPagination && (
                <div className="text-sm text-muted">
                  Showing {displayTickets.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, displayPagination.total_count)} of {displayPagination.total_count} tickets
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : displayTickets.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-lg mb-2">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayTickets.length > 0 && closedTicketsCount > 0 && (
                <div className="flex items-center gap-3 mb-3 p-3 glass border border-border rounded-lg">
                  <input
                    type="checkbox"
                    checked={closedTicketsCount > 0 && selectedTickets.size === closedTicketsCount && 
                             displayTickets.filter(t => t.status === 'closed').every(t => selectedTickets.has(t.id))}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-accent bg-panel border-border rounded focus:ring-accent"
                  />
                  <span className="text-sm text-text-secondary">
                    Select all closed tickets ({closedTicketsCount})
                  </span>
                </div>
              )}
              {displayTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="glass border border-border rounded-lg p-4 hover:border-accent/50 hover:bg-panel-hover transition-all hover-lift"
                >
                  <div className="flex items-start gap-3">
                    {ticket.status === 'closed' && (
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
                    )}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/admin/ticket/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text mb-1">{ticket.subject}</h3>
                          <p className="text-sm text-text-secondary">{ticket.context}</p>
                        </div>
                        <Badge status={ticket.status} />
                      </div>
                      {ticket.assigned_to && (
                        <p className="text-xs text-muted mb-1">Assigned to: {ticket.assigned_to}</p>
                      )}
                      {ticket.category && (
                        <p className="text-xs text-muted mb-1">
                          Category: <span className="text-accent">{ticket.category}</span>
                        </p>
                      )}
                      {(ticketTagsMap[ticket.id] || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 mb-1">
                          {ticketTagsMap[ticket.id].map(tag => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{
                                backgroundColor: tag.color ? `${tag.color}20` : 'rgba(99, 102, 241, 0.2)',
                                color: tag.color || '#818cf8',
                                border: `1px solid ${tag.color ? `${tag.color}50` : 'rgba(99, 102, 241, 0.3)'}`
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted">
                        Created: {new Date(ticket.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {displayPagination && displayPagination.total_pages > 0 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!displayPagination.has_prev || loading}
                className="px-4 py-2 glass border border-border rounded-lg text-text hover:bg-panel-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, displayPagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (displayPagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (displayPagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (displayPagination.page >= displayPagination.total_pages - 2) {
                    pageNum = displayPagination.total_pages - 4 + i;
                  } else {
                    pageNum = displayPagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        pageNum === displayPagination.page
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
                onClick={() => setPage(p => Math.min(displayPagination.total_pages, p + 1))}
                disabled={!displayPagination.has_next || loading}
                className="px-4 py-2 glass border border-border rounded-lg text-text hover:bg-panel-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

