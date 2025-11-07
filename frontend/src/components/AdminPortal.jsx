import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import AdminTicketView from './admin/AdminTicketView';
import EmailAccountManager from './admin/EmailAccountManager';
import EmailTemplateManager from './admin/EmailTemplateManager';

export default function AdminPortal() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-xl font-bold text-white">
              Admin Portal
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isActive('/admin') || isActive('/admin/')
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Tickets
              </Link>
              <Link
                to="/admin/email-accounts"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isActive('/admin/email-accounts')
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Email Accounts
              </Link>
              <Link
                to="/admin/email-templates"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isActive('/admin/email-templates')
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Email Templates
              </Link>
            </nav>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/ticket/:ticketId" element={<AdminTicketView />} />
          <Route path="/email-accounts" element={<EmailAccountManager />} />
          <Route path="/email-templates" element={<EmailTemplateManager />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}
