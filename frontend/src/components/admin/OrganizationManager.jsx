import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  createOrganization, 
  listOrganizations, 
  inviteMember, 
  listOrganizationMembers, 
  removeMember 
} from '../../services/api';
import Loading from '../Loading';

export default function OrganizationManager() {
  const { isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    email: '',
    role: 'admin'
  });

  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedOrg) {
      loadMembers(selectedOrg.id);
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    setLoading(true);
    const { data, error } = await listOrganizations();
    if (error) {
      alert(`Failed to load organizations: ${error}`);
    } else if (data) {
      setOrganizations(data.organizations || []);
      if (data.organizations && data.organizations.length > 0 && !selectedOrg) {
        setSelectedOrg(data.organizations[0]);
      }
    }
    setLoading(false);
  };

  const loadMembers = async (orgId) => {
    const { data, error } = await listOrganizationMembers(orgId);
    if (error) {
      alert(`Failed to load members: ${error}`);
    } else if (data) {
      setMembers(data.members || []);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    const { data, error } = await createOrganization({
      name: formData.name,
      slug: formData.slug,
      description: formData.description
    });

    if (error) {
      alert(`Failed to create organization: ${error}`);
    } else {
      alert('Organization created successfully!');
      setShowCreateForm(false);
      setFormData({ name: '', slug: '', description: '', email: '', role: 'admin' });
      await loadOrganizations();
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;

    const { data, error } = await inviteMember(selectedOrg.id, {
      email: formData.email,
      role: formData.role
    });

    if (error) {
      alert(`Failed to invite member: ${error}`);
    } else {
      alert('Member invited successfully!');
      setShowInviteForm(false);
      setFormData({ name: '', slug: '', description: '', email: '', role: 'admin' });
      await loadMembers(selectedOrg.id);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedOrg) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    const { data, error } = await removeMember(selectedOrg.id, memberId);
    if (error) {
      alert(`Failed to remove member: ${error}`);
    } else {
      alert('Member removed successfully!');
      await loadMembers(selectedOrg.id);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-bg text-text p-6">
        <div className="glass border border-border rounded-lg p-6 text-center">
          <p className="text-text-secondary">Super admin access required</p>
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold gradient-text">Organizations</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all glow-hover"
          >
            + Create Organization
          </button>
        </div>

        {showCreateForm && (
          <div className="glass border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Organization</h2>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Name
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
                  Slug (URL-friendly identifier)
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                  placeholder="my-organization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', slug: '', description: '', email: '', role: 'admin' });
                  }}
                  className="px-4 py-2 glass border border-border rounded-lg hover:bg-panel-hover transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organizations List */}
          <div className="lg:col-span-1">
            <div className="glass border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Organizations</h2>
              <div className="space-y-2">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedOrg?.id === org.id
                        ? 'bg-accent/20 border border-accent/30'
                        : 'glass border border-border hover:bg-panel-hover'
                    }`}
                  >
                    <div className="font-medium text-text">{org.name}</div>
                    <div className="text-sm text-muted">{org.slug}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="lg:col-span-2">
            {selectedOrg ? (
              <div className="glass border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedOrg.name}</h2>
                    <p className="text-sm text-muted">{selectedOrg.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                  >
                    + Invite Member
                  </button>
                </div>

                {showInviteForm && (
                  <div className="glass border border-border rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-3">Invite Team Member</h3>
                    <form onSubmit={handleInviteMember} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Role
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                        >
                          <option value="admin">Admin</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                        >
                          Invite
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInviteForm(false);
                            setFormData({ name: '', slug: '', description: '', email: '', role: 'admin' });
                          }}
                          className="px-4 py-2 glass border border-border rounded-lg hover:bg-panel-hover transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold mb-3">Team Members</h3>
                  {members.length === 0 ? (
                    <p className="text-muted text-center py-4">No members yet</p>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="glass border border-border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-text">
                            {member.users?.email || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted">
                            Role: {member.role} | Joined: {new Date(member.joined_at || member.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="glass border border-border rounded-lg p-6 text-center">
                <p className="text-muted">Select an organization to view members</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

