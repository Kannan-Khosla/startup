import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CustomerDashboard from './customer/CustomerDashboard';
import CustomerTicketView from './customer/CustomerTicketView';

export default function CustomerPortal() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="/" element={<CustomerDashboard />} />
        <Route path="/ticket/:ticketId" element={<CustomerTicketView />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </div>
  );
}
