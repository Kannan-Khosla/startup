import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getTicket, 
  adminReply, 
  assignTicketToAdmin, 
  closeTicket, 
  listTickets, 
  listAttachments,
  getTicketTags,
  addTagsToTicket,
  removeTagFromTicket,
  listTags,
  listCategories,
  setTicketCategory
} from '../../services/api';
import Loading from '../Loading';
import AttachmentList from '../AttachmentList';
import FileUpload from '../FileUpload';
import EmailComposer from '../EmailComposer';
import EmailThread from '../EmailThread';

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

function MessageBubble({ message, ticketId, currentUserId, userRole, messageAttachments, onAttachmentsChange }) {
  const isAI = message.sender === 'ai';
  const isAdmin = message.sender === 'admin';
  const isCustomer = message.sender === 'customer';
  const isSystem = message.sender === 'system';
  const attachments = messageAttachments?.[message.id] || [];

  return (
    <div
      className={`max-w-[70%] mb-4 ${
        isAI || isAdmin
          ? 'ml-auto'
          : 'mr-auto'
      }`}
    >
      <div
        className={`p-4 rounded-lg border ${
          isAI
            ? 'bg-orange-500/20 border-orange-500/50 text-white'
            : isAdmin
            ? 'bg-blue-500/20 border-blue-500/50 text-white'
            : isSystem
            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
            : 'bg-gray-800 border-gray-700 text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase ${
            isAI ? 'text-orange-300' : 
            isAdmin ? 'text-blue-300' : 
            isSystem ? 'text-yellow-300' : 
            'text-gray-300'
          }`}>
            {message.sender}
          </span>
          <span className="text-xs text-gray-500">{formatTimestamp(message.created_at)}</span>
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</div>
        {attachments.length > 0 && (
          <AttachmentList
            attachments={attachments}
            ticketId={ticketId}
            currentUserId={currentUserId}
            userRole={userRole}
            onDelete={onAttachmentsChange}
          />
        )}
      </div>
    </div>
  );
}

export default function AdminTicketView() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [closing, setClosing] = useState(false);
  const [messageAttachments, setMessageAttachments] = useState({});
  const [ticketAttachments, setTicketAttachments] = useState([]);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'emails'
  const [ticketTags, setTicketTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadThread();
    loadAdmins();
    loadTicketTags();
    loadAvailableTags();
    loadAvailableCategories();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAttachments = async () => {
    // Load all ticket attachments
    const { data: ticketAttachmentsData, error } = await listAttachments(ticketId);
    if (error) {
      console.error('Failed to load attachments:', error);
      return;
    }
    
    if (ticketAttachmentsData?.attachments) {
      console.log('Loaded attachments:', ticketAttachmentsData.attachments);
      setTicketAttachments(ticketAttachmentsData.attachments);
      
      // Group attachments by message_id
      const grouped = {};
      ticketAttachmentsData.attachments.forEach(att => {
        if (att.message_id) {
          if (!grouped[att.message_id]) {
            grouped[att.message_id] = [];
          }
          grouped[att.message_id].push(att);
        }
      });
      setMessageAttachments(grouped);
    } else {
      console.log('No attachments found');
      setTicketAttachments([]);
      setMessageAttachments({});
    }
  };

  const loadThread = async () => {
    setLoading(true);
    const { data, error } = await getTicket(ticketId);
    if (error) {
      alert(`Failed to load ticket: ${error}`);
      navigate('/admin');
    } else if (data) {
      setTicket(data.ticket);
      setMessages(data.messages || []);
      await loadAttachments();
    }
    setLoading(false);
  };

  const loadAdmins = async () => {
    const { data } = await listTickets();
    // Extract unique admin emails from tickets
    const adminEmails = new Set();
    if (data?.tickets) {
      data.tickets.forEach(t => {
        if (t.assigned_to) adminEmails.add(t.assigned_to);
      });
    }
    setAdmins(Array.from(adminEmails));
  };

  const handleSendReply = async () => {
    if (!message.trim() || sending) return;

    const msg = message.trim();
    setMessage('');
    setSending(true);

    const { error } = await adminReply(ticketId, msg);
    
    if (error) {
      alert(`Failed to send reply: ${error}`);
    } else {
      await loadThread();
    }
    
    setSending(false);
  };

  const handleAssign = async () => {
    if (!assignTo.trim() || assigning) return;

    setAssigning(true);
    const { error } = await assignTicketToAdmin(ticketId, assignTo.trim());
    
    if (error) {
      alert(`Failed to assign ticket: ${error}`);
    } else {
      setAssignTo('');
      await loadThread();
      alert('Ticket assigned successfully');
    }
    
    setAssigning(false);
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;

    setClosing(true);
    const { error } = await closeTicket(ticketId);
    
    if (error) {
      alert(`Failed to close ticket: ${error}`);
    } else {
      await loadThread();
      alert('Ticket closed successfully');
    }
    
    setClosing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const loadTicketTags = async () => {
    const { data, error } = await getTicketTags(ticketId);
    if (!error && data) {
      setTicketTags(data.tags || []);
    }
  };

  const loadAvailableTags = async () => {
    const { data, error } = await listTags();
    if (!error && data) {
      setAvailableTags(data.tags || []);
    }
  };

  const loadAvailableCategories = async () => {
    const { data, error } = await listCategories();
    if (!error && data) {
      setAvailableCategories(data.categories || []);
    }
  };

  const handleAddTag = async (tagId) => {
    const { error } = await addTagsToTicket(ticketId, [tagId]);
    if (error) {
      alert(`Failed to add tag: ${error}`);
    } else {
      await loadTicketTags();
      setShowTagSelector(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    const { error } = await removeTagFromTicket(ticketId, tagId);
    if (error) {
      alert(`Failed to remove tag: ${error}`);
    } else {
      await loadTicketTags();
    }
  };

  const handleSetCategory = async (category) => {
    const { error } = await setTicketCategory(ticketId, category);
    if (error) {
      alert(`Failed to set category: ${error}`);
    } else {
      await loadThread();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div>Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">{ticket.subject}</h1>
              <p className="text-sm text-gray-400">{ticket.context}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              disabled={closing || ticket.status === 'closed'}
              className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {closing ? 'Closing...' : 'Close Ticket'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-700">
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'messages'
                    ? 'text-orange-400 border-b-2 border-orange-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                💬 Messages
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'emails'
                    ? 'text-orange-400 border-b-2 border-orange-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📧 Emails
              </button>
            </div>

            {/* Show all ticket attachments (standalone attachments without message_id) */}
            {ticketAttachments.filter(att => !att.message_id).length > 0 && (
              <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                  📎 Ticket Attachments ({ticketAttachments.filter(att => !att.message_id).length})
                </h3>
                <AttachmentList
                  attachments={ticketAttachments.filter(att => !att.message_id)}
                  ticketId={ticketId}
                  currentUserId={user?.id}
                  userRole={user?.role || 'admin'}
                  onDelete={loadAttachments}
                />
              </div>
            )}

            {/* Email Composer */}
            {showEmailComposer && (
              <div className="mb-6">
                <EmailComposer
                  ticketId={ticketId}
                  initialSubject={ticket.subject ? `Re: ${ticket.subject}` : ''}
                  onSent={async (data) => {
                    setShowEmailComposer(false);
                    await loadThread();
                    setActiveTab('emails');
                  }}
                  onCancel={() => setShowEmailComposer(false)}
                />
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <MessageBubble
                        key={idx}
                        message={msg}
                        ticketId={ticketId}
                        currentUserId={user?.id}
                        userRole={user?.role || 'admin'}
                        messageAttachments={messageAttachments}
                        onAttachmentsChange={loadAttachments}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </>
            )}

            {/* Emails Tab */}
            {activeTab === 'emails' && (
              <EmailThread ticketId={ticketId} />
            )}
          </div>
        </main>

        {/* Sidebar Actions */}
        <aside className="w-80 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Ticket Info</h3>
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="ml-2 text-white">{ticket.status}</span>
                </div>
                {ticket.assigned_to && (
                  <div>
                    <span className="text-gray-400">Assigned to:</span>
                    <span className="ml-2 text-white">{ticket.assigned_to}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Created:</span>
                  <span className="ml-2 text-white">{new Date(ticket.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Email Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowEmailComposer(!showEmailComposer)}
                disabled={ticket.status === 'closed'}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {showEmailComposer ? '✕ Cancel Email' : '📧 Send Email'}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Assign Ticket</h3>
            <div className="space-y-3">
              <input
                type="email"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                placeholder="Admin email"
                list="admins"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <datalist id="admins">
                {admins.map((email, idx) => (
                  <option key={idx} value={email} />
                ))}
              </datalist>
              <button
                onClick={handleAssign}
                disabled={assigning || !assignTo.trim()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>

          {/* Tags Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Tags</h3>
              <button
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="text-xs px-2 py-1 bg-accent/20 text-accent border border-accent/30 rounded hover:bg-accent/30 transition-all"
              >
                + Add
              </button>
            </div>
            {showTagSelector && (
              <div className="mb-3 p-3 bg-gray-900 border border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                {availableTags.filter(tag => !ticketTags.find(tt => tt.id === tag.id)).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="w-full text-left px-3 py-2 mb-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-white transition-colors"
                  >
                    {tag.name}
                  </button>
                ))}
                {availableTags.filter(tag => !ticketTags.find(tt => tt.id === tag.id)).length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">No tags available</p>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {ticketTags.map(tag => (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full text-xs flex items-center gap-2"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : 'rgba(99, 102, 241, 0.2)',
                    color: tag.color || '#818cf8',
                    border: `1px solid ${tag.color ? `${tag.color}50` : 'rgba(99, 102, 241, 0.3)'}`
                  }}
                >
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              {ticketTags.length === 0 && (
                <p className="text-xs text-gray-500">No tags</p>
              )}
            </div>
          </div>

          {/* Category Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Category</h3>
            <select
              value={ticket.category || ''}
              onChange={(e) => handleSetCategory(e.target.value || null)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">None</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </aside>
      </div>

      {/* Reply Input */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          <FileUpload
            ticketId={ticketId}
            onUploadSuccess={async () => {
              await loadAttachments();
              await loadThread();
            }}
            disabled={sending || ticket.status === 'closed'}
          />
          <div className="flex gap-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your reply as admin and press Enter..."
              disabled={sending || ticket.status === 'closed'}
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendReply}
              disabled={sending || !message.trim() || ticket.status === 'closed'}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

