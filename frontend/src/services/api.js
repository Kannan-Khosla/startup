/**
 * API service for interacting with the FastAPI backend
 */

import { getToken } from './auth';

const DEFAULT_BASE_URL = 'http://localhost:8000';

/**
 * Get base URL from localStorage or use default
 */
export function getBaseUrl() {
  return localStorage.getItem('baseUrl') || DEFAULT_BASE_URL;
}

/**
 * Set base URL
 */
export function setBaseUrl(url) {
  localStorage.setItem('baseUrl', url);
}

/**
 * Get admin token from localStorage
 */
function getAdminToken() {
  return localStorage.getItem('adminToken') || '';
}

/**
 * Set admin token
 */
export function setAdminToken(token) {
  localStorage.setItem('adminToken', token);
}

/**
 * Make API request with error handling and JWT authentication
 */
async function apiRequest(url, options = {}) {
  const baseUrl = getBaseUrl().replace(/\/+$/, '');
  const fullUrl = `${baseUrl}${url}`;
  const token = getToken();
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Authentication required. Please login.');
      }
      throw new Error(data.detail || data.error || `HTTP ${response.status}`);
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || 'Request failed' };
  }
}

/**
 * List all tickets (admin) with search, filters, and pagination
 */
export async function listTickets(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.context) params.append('context', filters.context);
  if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.page) params.append('page', filters.page);
  if (filters.page_size) params.append('page_size', filters.page_size);
  
  const queryString = params.toString();
  const url = `/admin/tickets${queryString ? `?${queryString}` : ''}`;
  return apiRequest(url);
}

/**
 * Get ticket thread
 */
export async function getTicket(ticketId) {
  return apiRequest(`/ticket/${encodeURIComponent(ticketId)}`);
}

/**
 * Create or continue ticket
 */
export async function createTicket(context, subject, message) {
  return apiRequest('/ticket', {
    method: 'POST',
    body: JSON.stringify({ context, subject, message }),
  });
}

/**
 * Get customer tickets with search, filters, and pagination
 */
export async function getCustomerTickets(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.context) params.append('context', filters.context);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.page) params.append('page', filters.page);
  if (filters.page_size) params.append('page_size', filters.page_size);
  
  const queryString = params.toString();
  const url = `/customer/tickets${queryString ? `?${queryString}` : ''}`;
  return apiRequest(url);
}

/**
 * Rate an AI response
 */
export async function rateResponse(ticketId, messageId, rating) {
  return apiRequest(`/ticket/${encodeURIComponent(ticketId)}/rate`, {
    method: 'POST',
    body: JSON.stringify({ message_id: messageId, rating }),
  });
}

/**
 * Escalate to human
 */
export async function escalateToHuman(ticketId, reason = null) {
  return apiRequest(`/ticket/${encodeURIComponent(ticketId)}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Admin reply to ticket
 */
export async function adminReply(ticketId, message) {
  return apiRequest(`/ticket/${encodeURIComponent(ticketId)}/admin/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * Assign ticket to admin
 */
export async function assignTicketToAdmin(ticketId, adminEmail) {
  return apiRequest(`/admin/ticket/${encodeURIComponent(ticketId)}/assign-admin`, {
    method: 'POST',
    body: JSON.stringify({ admin_email: adminEmail }),
  });
}

/**
 * Get assigned tickets for admin with search, filters, and pagination
 */
export async function getAssignedTickets(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.context) params.append('context', filters.context);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.page) params.append('page', filters.page);
  if (filters.page_size) params.append('page_size', filters.page_size);
  
  const queryString = params.toString();
  const url = `/admin/tickets/assigned${queryString ? `?${queryString}` : ''}`;
  return apiRequest(url);
}

/**
 * Send reply to ticket
 */
export async function sendReply(ticketId, message) {
  return apiRequest(`/ticket/${encodeURIComponent(ticketId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * Assign agent to ticket
 */
export async function assignAgent(ticketId, agentName) {
  const token = getAdminToken();
  return apiRequest(
    `/admin/ticket/${encodeURIComponent(ticketId)}/assign?agent_name=${encodeURIComponent(agentName)}`,
    {
      method: 'POST',
      headers: token ? { 'X-Admin-Token': token } : {},
    }
  );
}

/**
 * Close ticket
 */
export async function closeTicket(ticketId) {
  const token = getAdminToken();
  return apiRequest(`/admin/ticket/${encodeURIComponent(ticketId)}/close`, {
    method: 'POST',
    headers: token ? { 'X-Admin-Token': token } : {},
  });
}

/**
 * Get statistics
 */
export async function getStats() {
  return apiRequest('/stats');
}

