import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCube,
} from 'react-icons/hi';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [deleting, setDeleting] = useState(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/products', { params });
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (searchInput.trim()) params.search = searchInput.trim();
    setSearchParams(params);
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(product._id);
    try {
      await api.delete(`/admin/products/${product._id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await api.put(`/admin/products/${product._id}`, {
        isActive: !product.isActive,
      });
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'}`);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update product');
    }
  };

  const getTotalStock = (product) => {
    return product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
  };

  const goToPage = (p) => {
    const params = { page: p.toString() };
    if (search) params.search = search;
    setSearchParams(params);
  };

  return (
    <div className="products-page">
      {/* Toolbar */}
      <div className="page-toolbar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search products or SKUs…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
        <Link to="/products/new" className="btn btn-primary">
          <HiOutlinePlus /> New Product
        </Link>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner large" />
        </div>
      ) : products.length === 0 ? (
        <div className="page-empty">
          <HiOutlineCube className="empty-icon" style={{ fontSize: '3rem' }} />
          <h3>No products found</h3>
          <p className="text-muted">
            {search ? `No results for "${search}"` : 'Start by creating your first product'}
          </p>
          {!search && (
            <Link to="/products/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <HiOutlinePlus /> Create Product
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = getTotalStock(product);
                  return (
                    <tr key={product._id} className={!product.isActive ? 'row-inactive' : ''}>
                      <td>
                        <div className="product-cell">
                          <div
                            className="product-thumb"
                            style={{
                              backgroundImage: product.images?.[0]
                                ? `url(${product.images[0]})`
                                : 'none',
                            }}
                          >
                            {!product.images?.[0] && (
                              <HiOutlineCube className="thumb-placeholder" />
                            )}
                          </div>
                          <div>
                            <div className="product-name">{product.name}</div>
                            <div className="product-variants-count text-muted">
                              {product.variants?.length || 0} variant{product.variants?.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-default">
                          {product.category?.name || '—'}
                        </span>
                      </td>
                      <td className="font-mono">
                        LKR {product.basePrice?.toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            totalStock === 0
                              ? 'badge-danger'
                              : totalStock <= 5
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}
                        >
                          {totalStock}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${product.isActive ? 'badge-success' : 'badge-default'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="icon-btn"
                            onClick={() => handleToggleActive(product)}
                            title={product.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {product.isActive ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                          </button>
                          <Link
                            to={`/products/${product._id}/edit`}
                            className="icon-btn"
                            title="Edit"
                          >
                            <HiOutlinePencil />
                          </Link>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDelete(product)}
                            disabled={deleting === product._id}
                            title="Delete"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </span>
              <div className="pagination-btns">
                <button
                  className="icon-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  <HiOutlineChevronLeft />
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((p) => {
                    return p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1;
                  })
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pagination-dots">…</span>}
                      <button
                        className={`pagination-btn ${p === pagination.page ? 'active' : ''}`}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  className="icon-btn"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  <HiOutlineChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProductsPage;

