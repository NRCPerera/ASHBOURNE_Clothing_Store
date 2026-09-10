import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import ProductFilter from '../components/ProductFilter';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const filters = {
    category: searchParams.get('category') || '',
    size: searchParams.get('size') || '',
    color: searchParams.get('color') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '-createdAt',
    page: searchParams.get('page') || '1',
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      params.limit = 12;

      const res = await api.get('/products', { params });
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams.toString()]); // eslint-disable-line

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data.data.categories);
    });
  }, []);

  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, value);
    });
    // Reset to page 1 when filters change
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange({ ...filters, search: searchQuery });
  };

  const handleSortChange = (e) => {
    handleFilterChange({ ...filters, sort: e.target.value });
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine active filter count
  const activeFilterCount = ['category', 'size', 'color', 'minPrice', 'maxPrice', 'search']
    .filter((key) => filters[key])
    .length;

  return (
    <div className="products-page container fade-in">
      <div className="products-header">
        <div>
          <h1>
            {filters.search ? `Search: "${filters.search}"` : 'All Products'}
          </h1>
          <span className="products-count">
            {pagination.total} product{pagination.total !== 1 ? 's' : ''}
            {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active)`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <form onSubmit={handleSearch} className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <select
            className="sort-select"
            value={filters.sort}
            onChange={handleSortChange}
          >
            <option value="-createdAt">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div className="products-layout">
        <ProductFilter
          categories={categories}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <div>
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        className={page === pagination.page ? 'active' : ''}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search query.</p>
              <button
                className="btn btn-outline"
                style={{ marginTop: 'var(--space-md)' }}
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
