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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('all'); // 'all', 'assigned', 'unassigned'

  useEffect(() => {
    loadData();
  }, [statusFilter, view]);

  const loadData = async () => {
    setLoading(true);
    
    // Load all tickets
    const { data: allTickets } = await listTickets(statusFilter || undefined);
    if (allTickets) {
      setTickets(allTickets.tickets || []);
    }

    // Load assigned tickets
    const { data: assigned } = await getAssignedTickets();
    if (assigned) {
      setAssignedTickets(assigned.tickets || []);
    }

    // Load stats
    const { data: statsData } = await getStats();
    if (statsData) {
      setStats(statsData);
    }

    setLoading(false);
  };

  const displayTickets = view === 'assigned' ? assignedTickets : tickets;

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

          {/* Filters */}
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

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Filter</h3>
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
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              {view === 'assigned' ? 'My Assigned Tickets' : 'All Tickets'}
            </h2>
            <p className="text-sm text-gray-400">Manage and respond to support tickets</p>
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
        </main>
      </div>
    </div>
  );
}

