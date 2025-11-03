import { createContext, useContext, useState, useEffect } from 'react';
import { listTickets, getTicket } from '../services/api';
import { getBaseUrl, setBaseUrl } from '../services/api';

const AppContext = createContext();

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  const [tickets, setTickets] = useState([]);
  const [currentTicketId, setCurrentTicketId] = useState(null);
  const [thread, setThread] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [baseUrl, setBaseUrlState] = useState(getBaseUrl());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update base URL in localStorage when it changes
  const updateBaseUrl = (url) => {
    setBaseUrl(url);
    setBaseUrlState(url);
  };

  // Load tickets list
  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await listTickets(statusFilter);
    if (err) {
      setError(err);
      setTickets([]);
    } else {
      setTickets(data?.tickets || []);
    }
    setLoading(false);
  };

  // Load ticket thread
  const loadThread = async (ticketId) => {
    if (!ticketId) {
      setThread(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await getTicket(ticketId);
    if (err) {
      setError(err);
      setThread(null);
    } else {
      setThread(data);
    }
    setLoading(false);
  };

  // Open a ticket
  const openTicket = (ticketId) => {
    setCurrentTicketId(ticketId);
    loadThread(ticketId);
  };

  // Update status filter and reload tickets
  const updateStatusFilter = (status) => {
    setStatusFilter(status);
  };

  // Load tickets when filter changes
  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Load thread when current ticket changes
  useEffect(() => {
    if (currentTicketId) {
      loadThread(currentTicketId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTicketId]);

  const value = {
    tickets,
    currentTicketId,
    thread,
    statusFilter,
    baseUrl,
    loading,
    error,
    loadTickets,
    loadThread,
    openTicket,
    updateStatusFilter,
    updateBaseUrl,
    setError,
    setLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

