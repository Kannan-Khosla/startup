import { useState, useEffect } from 'react';
import { listEmailTemplates, createEmailTemplate } from '../../services/api';
import Loading from '../Loading';

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body_text: '',
    body_html: '',
    template_type: 'custom',
    variables: null,
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, [filterType]);

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await listEmailTemplates(filterType || null, null);
    if (error) {
      alert(`Failed to load email templates: ${error}`);
    } else if (data) {
      setTemplates(data.templates || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { data, error } = await createEmailTemplate(formData);
    
    if (error) {
      alert(`Failed to save email template: ${error}`);
    } else {
      await loadTemplates();
      setShowForm(false);
      resetForm();
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body_text: template.body_text,
      body_html: template.body_html || '',
      template_type: template.template_type,
      variables: template.variables ? (typeof template.variables === 'string' ? JSON.parse(template.variables) : template.variables) : null,
      is_active: template.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body_text: '',
      body_html: '',
      template_type: 'custom',
      variables: null,
      is_active: true,
    });
    setEditingTemplate(null);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold gradient-text">Email Templates</h2>
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent hover:border-accent/50 transition-all"
            >
              <option value="">All Types</option>
              <option value="ticket_created">Ticket Created</option>
              <option value="ticket_reply">Ticket Reply</option>
              <option value="ticket_closed">Ticket Closed</option>
              <option value="ticket_assigned">Ticket Assigned</option>
              <option value="custom">Custom</option>
            </select>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all glow-hover"
            >
              {showForm ? 'Cancel' : '+ Add Template'}
            </button>
          </div>
        </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">
            {editingTemplate ? 'Edit Email Template' : 'New Email Template'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Template Type *
              </label>
              <select
                value={formData.template_type}
                onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                required
                className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="ticket_created">Ticket Created</option>
                <option value="ticket_reply">Ticket Reply</option>
                <option value="ticket_closed">Ticket Closed</option>
                <option value="ticket_assigned">Ticket Assigned</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject (use {{variable}} for placeholders)"
              required
              className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Body (Plain Text) *
            </label>
            <textarea
              value={formData.body_text}
              onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
              placeholder="Email body text (use {{variable}} for placeholders)"
              required
              rows={8}
              className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Body (HTML) - Optional
            </label>
            <textarea
              value={formData.body_html}
              onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
              placeholder="HTML email body (use {{variable}} for placeholders)"
              rows={8}
              className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-accent bg-panel border-border rounded focus:ring-accent"
            />
            <label htmlFor="isActive" className="text-sm text-text-secondary">
              Active
            </label>
          </div>

          <div className="bg-panel border border-border rounded-lg p-4">
            <div className="text-sm font-medium text-text-secondary mb-2">Available Variables:</div>
            <div className="text-xs text-muted space-y-1">
              <div>{{ticket_id}} - Ticket ID</div>
              <div>{{customer_name}} - Customer name</div>
              <div>{{customer_email}} - Customer email</div>
              <div>{{subject}} - Ticket subject</div>
              <div>{{message}} - Ticket message</div>
              <div>{{admin_name}} - Admin name</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition-all"
            >
              {editingTemplate ? 'Update' : 'Create'} Template
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-6 py-2 glass border border-border text-text font-semibold rounded-lg hover:bg-panel-hover transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center text-muted py-8">
            <p>No email templates configured</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="glass border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-text">{template.name}</span>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    {template.template_type}
                  </span>
                  {template.is_active ? (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs bg-muted/20 text-muted px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleEdit(template)}
                  className="px-3 py-1.5 text-xs glass border border-border text-text rounded hover:bg-panel-hover transition-all"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-text-secondary mb-2">
                <div className="font-medium">Subject:</div>
                <div className="text-text">{template.subject}</div>
              </div>
              <div className="text-sm text-text-secondary">
                <div className="font-medium">Body Preview:</div>
                <div className="text-text line-clamp-2">{template.body_text}</div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}

