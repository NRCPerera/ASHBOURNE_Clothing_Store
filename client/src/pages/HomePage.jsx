import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products', { params: { limit: 8, sort: '-createdAt' } }),
          api.get('/categories'),
        ]);
        setFeaturedProducts(productsRes.data.data.products);
        setCategories(categoriesRes.data.data.categories);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Category image mapping (Unsplash)
  const categoryImages = {
    't-shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
    jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    jackets: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    accessories: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    shoes: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=400&fit=crop',
  };

  return (
    <div className="fade-in">
      {/* ─── Hero Section ─── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">New Season 2024</div>
          <h1>
            Elevate Your <span>Style</span>
          </h1>
          <p>
            Discover curated collections crafted from premium materials.
            Timeless design meets modern sophistication — for those who
            refuse to compromise.
          </p>
          <div className="hero-buttons">
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop Collection
            </Link>
            <Link to="/products?category=jackets" className="btn btn-outline btn-lg">
              New Arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Categories ─── */}
      {categories.length > 0 && (
        <section style={{ padding: 'var(--space-3xl) 0' }}>
          <div className="container">
            <h2 className="section-title">Shop by Category</h2>
            <div className="category-grid">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat._id}`}
                  className="category-card"
                >
                  <img
                    src={
                      cat.image ||
                      categoryImages[cat.slug] ||
                      `https://placehold.co/400x400/1a1a2e/c9a96e?text=${encodeURIComponent(cat.name)}`
                    }
                    alt={cat.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div className="category-card-overlay">
                    <span className="category-card-name">{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Featured Products ─── */}
      <section style={{ padding: '0 0 var(--space-3xl)' }}>
        <div className="container">
          <h2 className="section-title">Latest Arrivals</h2>
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>Loading products...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
                <Link to="/products" className="btn btn-outline">
                  View All Products →
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No products yet</h3>
              <p>Check back soon for our latest collection.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Value Proposition ─── */}
      <section style={{
        padding: 'var(--space-3xl) 0',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-2xl)',
            textAlign: 'center',
          }}>
            {[
              { icon: '✦', title: 'Premium Quality', desc: 'Crafted from the finest materials sourced globally' },
              { icon: '⟐', title: 'Free Shipping', desc: 'Complimentary delivery on all orders over LKR 10,000' },
              { icon: '↻', title: 'Easy Returns', desc: '30-day hassle-free return and exchange policy' },
              { icon: '◈', title: 'Secure Payments', desc: 'Your transactions are protected with PayHere' },
            ].map((item) => (
              <div key={item.title} style={{ padding: 'var(--space-lg)' }}>
                <div style={{
                  fontSize: '1.8rem',
                  marginBottom: 'var(--space-md)',
                  color: 'var(--color-accent)',
                }}>
                  {item.icon}
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: 'var(--space-sm)',
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
