import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../contexts/CartContext';

const COLOR_MAP = {
  black: '#111111',
  white: '#f5f5f5',
  navy: '#1a2744',
  grey: '#6b7280',
  gray: '#6b7280',
  olive: '#556b2f',
  burgundy: '#722f37',
  cream: '#f5f0e1',
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart, openCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [mainImage, setMainImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${slug}`);
        const prod = res.data.data.product;
        setProduct(prod);

        // Pre-select first available color and size
        if (prod.variants?.length > 0) {
          const firstInStock = prod.variants.find((v) => v.stock > 0) || prod.variants[0];
          setSelectedColor(firstInStock.color);
          setSelectedSize(firstInStock.size);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // Reset quantity to 1 when selecting a different variant
  useEffect(() => {
    setQuantity(1);
  }, [selectedColor, selectedSize]);

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock === 0) return;
    addToCart(product, selectedVariant, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1600);
    openCart();
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', paddingTop: '20vh' }}>
        <h3>{error || 'Product not found'}</h3>
        <Link to="/products" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>
          ← Back to Products
        </Link>
      </div>
    );
  }

  const { name, description, basePrice, category, images, variants } = product;

  // Get unique colors and sizes
  const uniqueColors = [...new Set(variants.map((v) => v.color))];
  const uniqueSizes = [...new Set(variants.map((v) => v.size))];

  // Get the selected variant
  const selectedVariant = variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  // Get available sizes for selected color
  const sizesForColor = variants
    .filter((v) => v.color === selectedColor)
    .reduce((acc, v) => {
      acc[v.size] = v.stock;
      return acc;
    }, {});

  // Get effective price
  const effectivePrice =
    selectedVariant?.priceOverride != null
      ? selectedVariant.priceOverride
      : basePrice;

  const productImages = images?.length > 0
    ? images
    : ['https://placehold.co/800x1066/1a1a2e/c9a96e?text=No+Image'];

  return (
    <div className="product-detail container fade-in">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Products</Link>
        <span>/</span>
        {category && (
          <>
            <Link to={`/products?category=${category._id}`}>{category.name}</Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--color-text)' }}>{name}</span>
      </nav>

      <div className="product-detail-grid">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="product-gallery-main">
            <img
              src={productImages[mainImage]}
              alt={name}
            />
          </div>
          {productImages.length > 1 && (
            <div className="product-gallery-thumbs">
              {productImages.map((img, i) => (
                <div
                  key={i}
                  className={`product-gallery-thumb ${i === mainImage ? 'active' : ''}`}
                  onClick={() => setMainImage(i)}
                >
                  <img src={img} alt={`${name} ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          {category && (
            <div className="product-info-category">{category.name}</div>
          )}
          <h1>{name}</h1>
          <div className="product-info-price">
            <span className="currency">LKR </span>
            {formatPrice(effectivePrice)}
          </div>

          <p className="product-info-description">{description}</p>

          {/* Color Selector */}
          <div className="product-info-section">
            <h3>Color — {selectedColor}</h3>
            <div className="variant-options">
              {uniqueColors.map((color) => {
                const colorVariants = variants.filter((v) => v.color === color);
                const totalStock = colorVariants.reduce((sum, v) => sum + v.stock, 0);

                return (
                  <button
                    key={color}
                    className={`variant-btn ${selectedColor === color ? 'active' : ''} ${totalStock === 0 ? 'disabled' : ''}`}
                    onClick={() => {
                      if (totalStock > 0) {
                        setSelectedColor(color);
                        // Reset size if current size not available in new color
                        const available = colorVariants.find(
                          (v) => v.size === selectedSize && v.stock > 0
                        );
                        if (!available) {
                          const firstAvail = colorVariants.find((v) => v.stock > 0);
                          if (firstAvail) setSelectedSize(firstAvail.size);
                        }
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: COLOR_MAP[color.toLowerCase()] || color.toLowerCase(),
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    />
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="product-info-section">
            <h3>Size — {selectedSize}</h3>
            <div className="variant-options">
              {uniqueSizes.map((size) => {
                const stock = sizesForColor[size] ?? 0;
                return (
                  <button
                    key={size}
                    className={`variant-btn ${selectedSize === size ? 'active' : ''} ${stock === 0 ? 'disabled' : ''}`}
                    onClick={() => stock > 0 && setSelectedSize(size)}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Stock info */}
            {selectedVariant && (
              <div
                className={`stock-info ${
                  selectedVariant.stock === 0
                    ? 'out-of-stock'
                    : selectedVariant.stock <= 3
                    ? 'low-stock'
                    : 'in-stock'
                }`}
              >
                {selectedVariant.stock === 0
                  ? 'Out of stock'
                  : selectedVariant.stock <= 3
                  ? `Only ${selectedVariant.stock} left in stock`
                  : 'In stock'}
              </div>
            )}
          </div>

          {/* SKU */}
          {selectedVariant && (
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-xl)',
            }}>
              SKU: {selectedVariant.sku}
            </div>
          )}

          {/* Quantity Selector */}
          {selectedVariant && selectedVariant.stock > 0 && (
            <div className="product-info-section" style={{ marginBottom: 'var(--space-md)' }}>
              <h3>Quantity</h3>
              <div className="quantity-controls-large">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
                  disabled={quantity >= selectedVariant.stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
                <span className="qty-subtotal-hint">
                  Total: LKR {formatPrice(effectivePrice * quantity)}
                </span>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            className={`btn btn-primary btn-lg ${isAdded ? 'btn-success' : ''}`}
            style={{ width: '100%', transition: 'all var(--transition-base)' }}
            disabled={!selectedVariant || selectedVariant.stock === 0}
            onClick={handleAddToCart}
          >
            {!selectedVariant || selectedVariant.stock === 0
              ? 'Out of Stock'
              : isAdded
              ? '✓ Added to Shopping Bag'
              : `Add to Shopping Bag • LKR ${formatPrice(effectivePrice * quantity)}`}
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '0.82rem',
            color: 'var(--color-text-muted)',
            marginTop: 'var(--space-md)',
          }}>
            Free shipping on orders over LKR 10,000
          </p>
        </div>
      </div>
    </div>
  );
}
