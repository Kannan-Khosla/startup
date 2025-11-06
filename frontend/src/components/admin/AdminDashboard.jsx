import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { listTickets, getStats, getAssignedTickets } from '../../services/api';
import Loading from '../Loading';

function Badge({ status }) {
  const className = {
    open: 'bg-green-500/20 text-green-400 border-green-500/50',
    human_assigned: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  }[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  
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

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters or view changes
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
  };

  const displayTickets = view === 'assigned' ? assignedTickets : tickets;
  const displayPagination = view === 'assigned' ? assignedPagination : pagination;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
          {/* Stats */}
          {stats && (
            <div className="mb-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white font-semibold">{stats.total_tickets || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Open:</span>
                  <span className="text-white font-semibold">{stats.open_tickets || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Closed:</span>
                  <span className="text-white font-semibold">{stats.closed_tickets || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Search</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* View */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">View</h3>
            <div className="space-y-2">
              <button
                onClick={() => setView('all')}
                className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                  view === 'all'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                    : 'bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-750'
                }`}
              >
                All Tickets
              </button>
              <button
                onClick={() => setView('assigned')}
                className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                  view === 'assigned'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                    : 'bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-750'
                }`}
              >
                My Assigned
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                {showFilters ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showFilters && (
              <div className="space-y-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                {view === 'all' && (
                  <input
                    type="text"
                    value={assignedToFilter}
                    onChange={(e) => setAssignedToFilter(e.target.value)}
                    placeholder="Assigned to (email)"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                )}
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Items per page</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          <button
            onClick={loadData}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Refresh
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {view === 'assigned' ? 'My Assigned Tickets' : 'All Tickets'}
              </h2>
              <p className="text-sm text-gray-400">Manage and respond to support tickets</p>
            </div>
            {displayPagination && (
              <div className="text-sm text-gray-400">
                Showing {displayTickets.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, displayPagination.total_count)} of {displayPagination.total_count} tickets
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : displayTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/admin/ticket/${ticket.id}`)}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500/50 hover:bg-gray-750 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-gray-400">{ticket.context}</p>
                    </div>
                    <Badge status={ticket.status} />
                  </div>
                  {ticket.assigned_to && (
                    <p className="text-xs text-gray-500 mb-1">Assigned to: {ticket.assigned_to}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Created: {new Date(ticket.created_at).toLocaleString()}
                  </p>
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
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pageNum === displayPagination.page
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 border border-gray-700 text-white hover:bg-gray-700'
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
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

