import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePhotograph,
  HiOutlineArrowLeft,
} from 'react-icons/hi';

const EMPTY_VARIANT = { size: '', color: '', sku: '', stock: 0, priceOverride: '' };

function ProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    basePrice: '',
    images: [],
    variants: [{ ...EMPTY_VARIANT }],
    isActive: true,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCategories();
    if (isEditing) loadProduct();
  }, [id]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.data.categories);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/products/${id}`);
      const p = data.data.product;
      setForm({
        name: p.name || '',
        description: p.description || '',
        category: p.category?._id || '',
        brand: p.brand || '',
        basePrice: p.basePrice?.toString() || '',
        images: p.images || [],
        variants: p.variants?.length > 0
          ? p.variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              stock: v.stock,
              priceOverride: v.priceOverride != null ? v.priceOverride.toString() : '',
            }))
          : [{ ...EMPTY_VARIANT }],
        isActive: p.isActive,
      });
    } catch {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...EMPTY_VARIANT }],
    }));
  };

  const removeVariant = (index) => {
    if (form.variants.length <= 1) {
      toast.error('Product must have at least one variant');
      return;
    }
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, data.data.url],
      }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) return toast.error('Product name is required');
    if (!form.category) return toast.error('Category is required');
    if (!form.basePrice || parseFloat(form.basePrice) < 0) return toast.error('Valid base price is required');
    if (form.variants.some((v) => !v.size || !v.color || !v.sku)) {
      return toast.error('All variants must have size, color, and SKU');
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        brand: form.brand.trim(),
        basePrice: parseFloat(form.basePrice),
        images: form.images,
        variants: form.variants.map((v) => ({
          size: v.size.trim(),
          color: v.color.trim(),
          sku: v.sku.trim().toUpperCase(),
          stock: parseInt(v.stock, 10) || 0,
          priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
        })),
      };

      if (isEditing) {
        // Update product info
        await api.put(`/admin/products/${id}`, {
          name: payload.name,
          description: payload.description,
          category: payload.category,
          brand: payload.brand,
          basePrice: payload.basePrice,
          images: payload.images,
          isActive: form.isActive,
        });
        // Update variants separately
        await api.put(`/admin/products/${id}/variants`, {
          variants: payload.variants,
        });
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created');
      }
      navigate('/products');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner large" />
        <p>Loading product…</p>
      </div>
    );
  }

  return (
    <div className="product-form-page">
      <button className="btn btn-ghost back-btn" onClick={() => navigate('/products')}>
        <HiOutlineArrowLeft /> Back to Products
      </button>

      <form className="product-form" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="form-section">
          <h2 className="form-section-title">Basic Information</h2>
          <div className="form-grid">
            <div className="form-group span-2">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Premium Cotton T-Shirt"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className="form-input"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                name="brand"
                className="form-input"
                placeholder="e.g. ASHBOURNE"
                value={form.brand}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Base Price (LKR) *</label>
              <input
                type="number"
                name="basePrice"
                className="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={handleChange}
                required
              />
            </div>
            {isEditing && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="toggle-input"
                  />
                  <span className="toggle-switch" />
                  <span>{form.isActive ? 'Active' : 'Inactive'}</span>
                </label>
              </div>
            )}
            <div className="form-group span-2">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-input form-textarea"
                placeholder="Product description…"
                rows={4}
                value={form.description}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="form-section">
          <h2 className="form-section-title">Images</h2>
          <div className="image-grid">
            {form.images.map((url, idx) => (
              <div key={idx} className="image-item">
                <img src={url} alt={`Product ${idx + 1}`} />
                <button
                  type="button"
                  className="image-remove"
                  onClick={() => removeImage(idx)}
                >
                  <HiOutlineTrash />
                </button>
              </div>
            ))}
            <label className={`image-upload ${uploading ? 'uploading' : ''}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                hidden
              />
              {uploading ? (
                <div className="spinner" />
              ) : (
                <>
                  <HiOutlinePhotograph className="upload-icon" />
                  <span>Upload</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Variants */}
        <div className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Variants</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addVariant}>
              <HiOutlinePlus /> Add Variant
            </button>
          </div>
          <div className="variants-list">
            {form.variants.map((variant, idx) => (
              <div key={idx} className="variant-card">
                <div className="variant-header">
                  <span className="variant-number">Variant {idx + 1}</span>
                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => removeVariant(idx)}
                    >
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
                <div className="variant-fields">
                  <div className="form-group">
                    <label className="form-label">Size *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. M, L, XL"
                      value={variant.size}
                      onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Black"
                      value={variant.color}
                      onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ASH-TS-BLK-M"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price Override</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Use base price"
                      min="0"
                      step="0.01"
                      value={variant.priceOverride}
                      onChange={(e) => handleVariantChange(idx, 'priceOverride', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/products')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <span className="btn-loading">
                <span className="spinner" />
                Saving…
              </span>
            ) : isEditing ? (
              'Update Product'
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductFormPage;
