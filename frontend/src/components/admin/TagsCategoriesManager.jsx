import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createTag, listTags, updateTag, deleteTag, createCategory, listCategories, updateCategory, deleteCategory } from '../../services/api';
import Loading from '../Loading';

export default function TagsCategoriesManager() {
  const { isAdmin } = useAuth();
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tags'); // 'tags' or 'categories'
  const [showTagForm, setShowTagForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [tagForm, setTagForm] = useState({ name: '', color: '#6366f1', description: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#6366f1', description: '' });

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    const [tagsRes, categoriesRes] = await Promise.all([
      listTags(),
      listCategories()
    ]);
    
    if (!tagsRes.error && tagsRes.data) {
      setTags(tagsRes.data.tags || []);
    }
    if (!categoriesRes.error && categoriesRes.data) {
      setCategories(categoriesRes.data.categories || []);
    }
    setLoading(false);
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    const { error } = editingTag 
      ? await updateTag(editingTag.id, tagForm)
      : await createTag(tagForm);
    if (error) {
      alert(`Failed to ${editingTag ? 'update' : 'create'} tag: ${error}`);
    } else {
      alert(`Tag ${editingTag ? 'updated' : 'created'} successfully!`);
      setShowTagForm(false);
      setEditingTag(null);
      setTagForm({ name: '', color: '#6366f1', description: '' });
      await loadData();
    }
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    setTagForm({ name: tag.name, color: tag.color || '#6366f1', description: tag.description || '' });
    setShowTagForm(true);
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all tickets.')) {
      return;
    }
    const { error } = await deleteTag(tagId);
    if (error) {
      alert(`Failed to delete tag: ${error}`);
    } else {
      alert('Tag deleted successfully!');
      await loadData();
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const { error } = editingCategory
      ? await updateCategory(editingCategory.id, categoryForm)
      : await createCategory(categoryForm);
    if (error) {
      alert(`Failed to ${editingCategory ? 'update' : 'create'} category: ${error}`);
    } else {
      alert(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', color: '#6366f1', description: '' });
      await loadData();
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, color: category.color || '#6366f1', description: category.description || '' });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This will remove it from all tickets.')) {
      return;
    }
    const { error } = await deleteCategory(categoryId);
    if (error) {
      alert(`Failed to delete category: ${error}`);
    } else {
      alert('Category deleted successfully!');
      await loadData();
    }
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
        <h1 className="text-3xl font-bold gradient-text mb-6">Tags & Categories</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'tags'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Tags
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Categories
          </button>
        </div>

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Tags</h2>
              <button
                onClick={() => setShowTagForm(true)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
              >
                + Create Tag
              </button>
            </div>

            {showTagForm && (
              <div className="glass border border-border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">{editingTag ? 'Edit Tag' : 'Create Tag'}</h3>
                <form onSubmit={handleCreateTag} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={tagForm.name}
                      onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Color (Hex)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={tagForm.color}
                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                        className="w-16 h-10 rounded border border-border"
                      />
                      <input
                        type="text"
                        value={tagForm.color}
                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                        className="flex-1 px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Description
                    </label>
                    <textarea
                      value={tagForm.description}
                      onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                      rows="2"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                    >
                      {editingTag ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTagForm(false);
                        setEditingTag(null);
                        setTagForm({ name: '', color: '#6366f1', description: '' });
                      }}
                      className="px-4 py-2 glass border border-border rounded-lg hover:bg-panel-hover transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="glass border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color || '#6366f1' }}
                      />
                      <h3 className="font-semibold">{tag.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="px-2 py-1 text-xs bg-accent/10 text-accent border border-accent/30 rounded hover:bg-accent/20 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {tag.description && (
                    <p className="text-sm text-text-secondary">{tag.description}</p>
                  )}
                </div>
              ))}
              {tags.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted">
                  No tags yet. Create one to get started!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Categories</h2>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
              >
                + Create Category
              </button>
            </div>

            {showCategoryForm && (
              <div className="glass border border-border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Color (Hex)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                        className="w-16 h-10 rounded border border-border"
                      />
                      <input
                        type="text"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                        className="flex-1 px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Description
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-panel border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                      rows="2"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all"
                    >
                      {editingCategory ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryForm(false);
                        setEditingCategory(null);
                        setCategoryForm({ name: '', color: '#6366f1', description: '' });
                      }}
                      className="px-4 py-2 glass border border-border rounded-lg hover:bg-panel-hover transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="glass border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color || '#6366f1' }}
                      />
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="px-2 py-1 text-xs bg-accent/10 text-accent border border-accent/30 rounded hover:bg-accent/20 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-text-secondary">{category.description}</p>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted">
                  No categories yet. Create one to get started!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

