import { useState, useEffect } from 'react';
import { listEmailAccounts, createEmailAccount, testEmailAccount } from '../../services/api';
import Loading from '../Loading';

export default function EmailAccountManager() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [testing, setTesting] = useState({});

  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    provider: 'smtp',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    api_key: '',
    credentials: null,
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const { data, error } = await listEmailAccounts();
    if (error) {
      alert(`Failed to load email accounts: ${error}`);
    } else if (data) {
      setAccounts(data.accounts || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { data, error } = await createEmailAccount(formData);
    
    if (error) {
      alert(`Failed to save email account: ${error}`);
    } else {
      await loadAccounts();
      setShowForm(false);
      resetForm();
    }
  };

  const handleTest = async (accountId) => {
    setTesting({ ...testing, [accountId]: true });
    const { data, error } = await testEmailAccount(accountId);
    
    if (error) {
      alert(`Connection test failed: ${error}`);
    } else {
      alert(`Connection test successful: ${data.message}`);
    }
    
    setTesting({ ...testing, [accountId]: false });
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      email: account.email,
      display_name: account.display_name || '',
      provider: account.provider,
      smtp_host: account.smtp_host || '',
      smtp_port: account.smtp_port || 587,
      smtp_username: account.smtp_username || '',
      smtp_password: '', // Don't show password
      api_key: '', // Don't show API key
      credentials: null,
      is_active: account.is_active,
      is_default: account.is_default,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      display_name: '',
      provider: 'smtp',
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      api_key: '',
      credentials: null,
      is_active: true,
      is_default: false,
    });
    setEditingAccount(null);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Email Accounts</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Email Account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {editingAccount ? 'Edit Email Account' : 'New Email Account'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider *
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="smtp">SMTP</option>
              <option value="sendgrid">SendGrid</option>
              <option value="ses">AWS SES</option>
              <option value="mailgun">Mailgun</option>
              <option value="other">Other</option>
            </select>
          </div>

          {formData.provider === 'smtp' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    value={formData.smtp_host}
                    onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Port *
                  </label>
                  <input
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Username *
                  </label>
                  <input
                    type="text"
                    value={formData.smtp_username}
                    onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Password *
                  </label>
                  <input
                    type="password"
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                    required={!editingAccount}
                    placeholder={editingAccount ? "Leave blank to keep current" : ""}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </>
          )}

          {formData.provider === 'sendgrid' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SendGrid API Key *
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                required={!editingAccount}
                placeholder={editingAccount ? "Leave blank to keep current" : ""}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-orange-500 bg-gray-900 border-gray-700 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-300">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 text-orange-500 bg-gray-900 border-gray-700 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-300">Default</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              {editingAccount ? 'Update' : 'Create'} Account
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
        {accounts.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No email accounts configured</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-white">
                    {account.display_name || account.email}
                  </span>
                  {account.is_default && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                  {account.is_active ? (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {account.email} • {account.provider.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTest(account.id)}
                  disabled={testing[account.id]}
                  className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                >
                  {testing[account.id] ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={() => handleEdit(account)}
                  className="px-3 py-1.5 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

