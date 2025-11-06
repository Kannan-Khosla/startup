import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCustomerTickets, createTicket } from '../../services/api';
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

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [context, setContext] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contextFilter, setContextFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters change
  }, [statusFilter, contextFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, contextFilter, dateFrom, dateTo, searchQuery, page, pageSize]);

  const loadTickets = async () => {
    setLoading(true);
    const filters = {
      ...(searchQuery && { search: searchQuery }),
      ...(statusFilter && { status: statusFilter }),
      ...(contextFilter && { context: contextFilter }),
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo && { date_to: dateTo }),
      page,
      page_size: pageSize,
    };
    const { data, error } = await getCustomerTickets(filters);
    if (!error && data) {
      setTickets(data.tickets || []);
      setPagination(data.pagination || null);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setContextFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleCreateTicket = async () => {
    if (!context.trim() || !subject.trim() || !message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setCreating(true);
    const { data, error } = await createTicket(context.trim(), subject.trim(), message.trim());
    
    if (error) {
      alert(`Failed to create ticket: ${error}`);
    } else if (data?.ticket_id) {
      navigate(`/customer/ticket/${data.ticket_id}`);
      setContext('');
      setSubject('');
      setMessage('');
    }
    setCreating(false);
    loadTickets();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Support Portal</h1>
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
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Ticket</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Context (e.g., Product Issue)"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message"
                rows={3}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <button
                onClick={handleCreateTicket}
                disabled={creating || !context.trim() || !subject.trim() || !message.trim()}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {creating ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>

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
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">My Tickets</h2>
              <p className="text-sm text-gray-400">Manage and track your support tickets</p>
            </div>
            {pagination && (
              <div className="text-sm text-gray-400">
                Showing {tickets.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, pagination.total_count)} of {pagination.total_count} tickets
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">No tickets yet</p>
              <p className="text-sm">Create a new ticket to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/customer/ticket/${ticket.id}`)}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500/50 hover:bg-gray-750 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{ticket.subject}</h3>
                    <Badge status={ticket.status} />
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{ticket.context}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 0 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.has_prev || loading}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pageNum === pagination.page
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
                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                disabled={!pagination.has_next || loading}
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

