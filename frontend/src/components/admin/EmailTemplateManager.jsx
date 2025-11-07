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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Email Templates</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Template'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {editingTemplate ? 'Edit Email Template' : 'New Email Template'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Type *
              </label>
              <select
                value={formData.template_type}
                onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject (use {{variable}} for placeholders)"
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Body (Plain Text) *
            </label>
            <textarea
              value={formData.body_text}
              onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
              placeholder="Email body text (use {{variable}} for placeholders)"
              required
              rows={8}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Body (HTML) - Optional
            </label>
            <textarea
              value={formData.body_html}
              onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
              placeholder="HTML email body (use {{variable}} for placeholders)"
              rows={8}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-orange-500 bg-gray-900 border-gray-700 rounded focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">
              Active
            </label>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-300 mb-2">Available Variables:</div>
            <div className="text-xs text-gray-400 space-y-1">
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
              className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              {editingTemplate ? 'Update' : 'Create'} Template
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No email templates configured</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-white">{template.name}</span>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    {template.template_type}
                  </span>
                  {template.is_active ? (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleEdit(template)}
                  className="px-3 py-1.5 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-gray-400 mb-2">
                <div className="font-medium">Subject:</div>
                <div className="text-white">{template.subject}</div>
              </div>
              <div className="text-sm text-gray-400">
                <div className="font-medium">Body Preview:</div>
                <div className="text-white line-clamp-2">{template.body_text}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

