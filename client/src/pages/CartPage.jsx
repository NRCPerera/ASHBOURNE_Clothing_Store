import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const FREE_SHIPPING_THRESHOLD = 10000;
const STANDARD_SHIPPING_FEE = 500;

function formatPrice(price) {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export default function CartPage() {
  const {
    cart,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const estimatedTotal = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="cart-page-container">
        <div className="cart-empty-page fade-in">
          <div className="cart-empty-icon" style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>
            🛍️
          </div>
          <h1>Your Shopping Bag is Empty</h1>
          <p>
            Explore our timeless silhouettes, premium textiles, and understated luxury collections.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-lg)' }}>
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <div className="cart-page-header">
        <div>
          <h1>Shopping Bag</h1>
          <p className="cart-page-subtitle">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={clearCart}
          style={{ color: 'var(--color-text-muted)' }}
        >
          Clear All
        </button>
      </div>

      <div className="cart-page-grid">
        {/* Cart Items Column */}
        <div className="cart-page-items">
          <div className="cart-table-header">
            <span>Product</span>
            <span>Quantity</span>
            <span>Price</span>
            <span>Total</span>
            <span />
          </div>

          <div className="cart-page-list">
            {cart.map((item) => (
              <div key={item.variantSku} className="cart-page-row">
                <div className="cart-page-product">
                  <Link to={`/products/${item.productSlug}`} className="cart-page-thumb">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="cart-thumb-placeholder">ASHBOURNE</div>
                    )}
                  </Link>
                  <div className="cart-page-product-info">
                    <Link to={`/products/${item.productSlug}`} className="cart-page-product-name">
                      {item.name}
                    </Link>
                    <div className="cart-page-product-meta">
                      <span>Size: <strong>{item.size}</strong></span>
                      <span>Color: <strong>{item.color}</strong></span>
                    </div>
                    <div className="cart-page-sku">SKU: {item.variantSku}</div>
                  </div>
                </div>

                <div className="cart-page-qty">
                  <div className="quantity-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.variantSku, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.variantSku, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {item.quantity >= item.stock && (
                    <span className="cart-stock-notice">Max stock ({item.stock})</span>
                  )}
                </div>

                <div className="cart-page-unit-price">
                  LKR {formatPrice(item.price)}
                </div>

                <div className="cart-page-total-price">
                  LKR {formatPrice(item.price * item.quantity)}
                </div>

                <div className="cart-page-actions">
                  <button
                    className="cart-remove-btn"
                    onClick={() => removeFromCart(item.variantSku)}
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-page-continue">
            <Link to="/products" className="btn btn-outline btn-sm">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Sticky Column */}
        <div className="cart-page-sidebar">
          <div className="cart-summary-card">
            <h3>Order Summary</h3>

            <div className="summary-list">
              <div className="summary-item">
                <span>Subtotal</span>
                <span>LKR {formatPrice(subtotal)}</span>
              </div>
              <div className="summary-item">
                <span>Estimated Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <strong style={{ color: 'var(--color-success)' }}>FREE</strong>
                  ) : (
                    `LKR ${formatPrice(shipping)}`
                  )}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <div className="shipping-hint">
                  Free shipping on orders over LKR {formatPrice(FREE_SHIPPING_THRESHOLD)}. Add LKR {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more to qualify.
                </div>
              )}
              <div className="summary-divider" />
              <div className="summary-item summary-total">
                <span>Estimated Total</span>
                <span className="summary-total-amount">
                  LKR {formatPrice(estimatedTotal)}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 'var(--space-lg)' }}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout →
            </button>

            <div className="cart-perks">
              <div className="cart-perk">
                <span className="perk-icon">🔒</span>
                <span>Secure SSL checkout & encrypted data</span>
              </div>
              <div className="cart-perk">
                <span className="perk-icon">📦</span>
                <span>Islandwide tracked dispatch within 24-48 hrs</span>
              </div>
              <div className="cart-perk">
                <span className="perk-icon">↺</span>
                <span>Easy 7-day exchange & return policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
