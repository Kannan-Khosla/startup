import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createRoutingRule, listRoutingRules, deleteRoutingRule } from '../../services/api';
import Loading from '../Loading';

export default function RoutingRulesManager() {
  const { isAdmin } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 0,
    is_active: true,
    conditions: {
      keywords: [],
      issue_types: [],
      tags: [],
      context: [],
      priority: []
    },
    action_type: 'assign_to_agent',
    action_value: ''
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newIssueType, setNewIssueType] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newContext, setNewContext] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadRules();
    }
  }, [isAdmin]);

  const loadRules = async () => {
    setLoading(true);
    const { data, error } = await listRoutingRules();
    if (error) {
      alert(`Failed to load routing rules: ${error}`);
    } else if (data) {
      setRules(data.rules || []);
    }
    setLoading(false);
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    const { data, error } = await createRoutingRule(formData);

    if (error) {
      alert(`Failed to create routing rule: ${error}`);
    } else {
      alert('Routing rule created successfully!');
      setShowCreateForm(false);
      resetForm();
      await loadRules();
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this routing rule?')) return;

    const { data, error } = await deleteRoutingRule(ruleId);
    if (error) {
      alert(`Failed to delete routing rule: ${error}`);
    } else {
      alert('Routing rule deleted successfully!');
      await loadRules();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 0,
      is_active: true,
      conditions: {
        keywords: [],
        issue_types: [],
        tags: [],
        context: [],
        priority: []
      },
      action_type: 'assign_to_agent',
      action_value: ''
    });
    setNewKeyword('');
    setNewIssueType('');
    setNewTag('');
    setNewContext('');
  };

  const addCondition = (type, value) => {
    if (!value.trim()) return;
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        [type]: [...formData.conditions[type], value.trim()]
      }
    });
    if (type === 'keywords') setNewKeyword('');
    if (type === 'issue_types') setNewIssueType('');
    if (type === 'tags') setNewTag('');
    if (type === 'context') setNewContext('');
  };

  const removeCondition = (type, index) => {
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        [type]: formData.conditions[type].filter((_, i) => i !== index)
      }
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg text-text p-6">
        <div className="glass border border-border rounded-lg p-6 text-center">
          <p className="text-text-secondary">Admin access required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text p-6 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold gradient-text">Routing Rules</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all glow-hover"
          >
            + Create Rule
          </button>
        </div>

        {showCreateForm && (
          <div className="glass border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Routing Rule</h2>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Priority (higher = evaluated first)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                  rows="2"
                />
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <h3 className="font-semibold">Conditions (all must match)</h3>
                
                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Keywords (in subject/message)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition('keywords', newKeyword))}
                      className="flex-1 px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                      placeholder="Enter keyword and press Enter"
                    />
                    <button
                      type="button"
                      onClick={() => addCondition('keywords', newKeyword)}
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.conditions.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-accent/20 text-accent border border-accent/30 rounded-full text-sm flex items-center gap-2"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeCondition('keywords', idx)}
                          className="text-accent hover:text-accent-hover"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Issue Types */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Issue Types
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newIssueType}
                      onChange={(e) => setNewIssueType(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition('issue_types', newIssueType))}
                      className="flex-1 px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                      placeholder="e.g., Technical, Billing"
                    />
                    <button
                      type="button"
                      onClick={() => addCondition('issue_types', newIssueType)}
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.conditions.issue_types.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm flex items-center gap-2"
                      >
                        {it}
                        <button
                          type="button"
                          onClick={() => removeCondition('issue_types', idx)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition('tags', newTag))}
                      className="flex-1 px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                      placeholder="Tag name"
                    />
                    <button
                      type="button"
                      onClick={() => addCondition('tags', newTag)}
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.conditions.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeCondition('tags', idx)}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Action Type
                  </label>
                  <select
                    value={formData.action_type}
                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                    className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                  >
                    <option value="assign_to_agent">Assign to Agent</option>
                    <option value="set_priority">Set Priority</option>
                    <option value="add_tag">Add Tag</option>
                    <option value="set_category">Set Category</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Action Value
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.action_value}
                    onChange={(e) => setFormData({ ...formData, action_value: e.target.value })}
                    className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                    placeholder={formData.action_type === 'assign_to_agent' ? 'agent@email.com' : 'value'}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-accent bg-panel border-border rounded"
                />
                <label className="text-sm text-text-secondary">Active</label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                >
                  Create Rule
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 glass border border-border rounded-lg hover:bg-panel-hover transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="glass border border-border rounded-lg p-6 text-center">
              <p className="text-muted">No routing rules yet. Create one to get started!</p>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="glass border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{rule.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rule.is_active 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-muted/20 text-muted border border-border'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-muted">Priority: {rule.priority}</span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-text-secondary mb-3">{rule.description}</p>
                    )}
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-text-secondary">Conditions: </span>
                        {rule.conditions && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {rule.conditions.keywords?.map((kw, idx) => (
                              <span key={idx} className="px-2 py-1 bg-accent/20 text-accent border border-accent/30 rounded text-xs">
                                Keyword: {kw}
                              </span>
                            ))}
                            {rule.conditions.issue_types?.map((it, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs">
                                Type: {it}
                              </span>
                            ))}
                            {rule.conditions.tags?.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs">
                                Tag: {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text-secondary">Action: </span>
                        <span className="text-sm text-text">
                          {rule.action_type.replace('_', ' ')} → {rule.action_value}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all text-sm ml-4"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

