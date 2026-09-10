import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineTag,
} from 'react-icons/hi';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.data.categories);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error('Category name is required');

    setSaving(true);
    try {
      await api.post('/admin/categories', {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      });
      toast.success('Category created');
      setCreating(false);
      setCreateForm({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditForm({ name: cat.name, description: cat.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '' });
  };

  const handleUpdate = async (catId) => {
    if (!editForm.name.trim()) return toast.error('Category name is required');

    setSaving(true);
    try {
      await api.put(`/admin/categories/${catId}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      toast.success('Category updated');
      cancelEdit();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await api.put(`/admin/categories/${cat._id}`, {
        isActive: !cat.isActive,
      });
      toast.success(`Category ${cat.isActive ? 'deactivated' : 'activated'}`);
      fetchCategories();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/admin/categories/${cat._id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner large" />
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="page-toolbar">
        <div />
        <button
          className="btn btn-primary"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
        >
          <HiOutlinePlus /> New Category
        </button>
      </div>

      {/* Create Form */}
      {creating && (
        <form className="inline-form" onSubmit={handleCreate}>
          <div className="inline-form-fields">
            <input
              type="text"
              className="form-input"
              placeholder="Category name"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              autoFocus
            />
            <input
              type="text"
              className="form-input"
              placeholder="Description (optional)"
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
            />
            <div className="inline-form-actions">
              <button type="submit" className="icon-btn success" disabled={saving}>
                <HiOutlineCheck />
              </button>
              <button type="button" className="icon-btn" onClick={() => setCreating(false)}>
                <HiOutlineX />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Categories List */}
      {categories.length === 0 && !creating ? (
        <div className="page-empty">
          <HiOutlineTag className="empty-icon" style={{ fontSize: '3rem' }} />
          <h3>No categories</h3>
          <p className="text-muted">Create your first category to organize products</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className={!cat.isActive ? 'row-inactive' : ''}>
                  {editingId === cat._id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          className="form-input compact"
                          value={editForm.name}
                          onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                          autoFocus
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input compact"
                          value={editForm.description}
                          onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                        />
                      </td>
                      <td>
                        <span className={`badge ${cat.isActive ? 'badge-success' : 'badge-default'}`}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="icon-btn success"
                            onClick={() => handleUpdate(cat._id)}
                            disabled={saving}
                          >
                            <HiOutlineCheck />
                          </button>
                          <button className="icon-btn" onClick={cancelEdit}>
                            <HiOutlineX />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="font-medium">{cat.name}</td>
                      <td className="text-muted">{cat.description || '—'}</td>
                      <td>
                        <button
                          className={`badge clickable ${cat.isActive ? 'badge-success' : 'badge-default'}`}
                          onClick={() => handleToggleActive(cat)}
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn" onClick={() => startEdit(cat)} title="Edit">
                            <HiOutlinePencil />
                          </button>
                          <button className="icon-btn danger" onClick={() => handleDelete(cat)} title="Delete">
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
