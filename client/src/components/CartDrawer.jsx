import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const FREE_SHIPPING_THRESHOLD = 10000;

function formatPrice(price) {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export default function CartDrawer() {
  const {
    cart,
    itemCount,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const navigate = useNavigate();

  // Prevent background scrolling when cart drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  const freeShippingDiff = FREE_SHIPPING_THRESHOLD - subtotal;
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    closeCart();
    navigate('/cart');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cart-backdrop ${isCartOpen ? 'active' : ''}`}
        onClick={closeCart}
        aria-hidden={!isCartOpen}
      />

      {/* Drawer */}
      <aside
        className={`cart-drawer ${isCartOpen ? 'open' : ''}`}
        aria-label="Shopping Cart"
      >
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <h3>Shopping Bag</h3>
            <span className="cart-drawer-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>
          <button
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Free shipping banner */}
        <div className="cart-shipping-bar">
          <div className="cart-shipping-text">
            {freeShippingDiff <= 0 ? (
              <span className="shipping-unlocked">
                ✨ You've unlocked <strong>Free Standard Shipping</strong>!
              </span>
            ) : (
              <span>
                Add <strong>LKR {formatPrice(freeShippingDiff)}</strong> more for{' '}
                <strong>Free Shipping</strong>
              </span>
            )}
          </div>
          <div className="cart-shipping-progress">
            <div
              className="cart-shipping-progress-fill"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Drawer Content */}
        <div className="cart-drawer-items">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon">🛍️</div>
              <h4>Your bag is empty</h4>
              <p>Looks like you haven't added anything to your bag yet.</p>
              <Link
                to="/products"
                className="btn btn-primary btn-md"
                onClick={closeCart}
              >
                Explore Collection
              </Link>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cart.map((item) => (
                <li key={item.variantSku} className="cart-item">
                  <Link
                    to={`/products/${item.productSlug}`}
                    onClick={closeCart}
                    className="cart-item-image-link"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="cart-item-image-placeholder">
                        ASHBOURNE
                      </div>
                    )}
                  </Link>

                  <div className="cart-item-details">
                    <div className="cart-item-top">
                      <Link
                        to={`/products/${item.productSlug}`}
                        onClick={closeCart}
                        className="cart-item-name"
                      >
                        {item.name}
                      </Link>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.variantSku)}
                        title="Remove item"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="cart-item-variant">
                      <span className="variant-tag">Size: {item.size}</span>
                      <span className="variant-tag">Color: {item.color}</span>
                    </div>

                    <div className="cart-item-price">
                      LKR {formatPrice(item.price)}
                    </div>

                    <div className="cart-item-bottom">
                      <div className="quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateQuantity(item.variantSku, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            updateQuantity(item.variantSku, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-line-total">
                        LKR {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>

                    {item.quantity >= item.stock && (
                      <div className="cart-stock-warning">
                        Max available stock ({item.stock})
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span className="summary-subtotal">
                  LKR {formatPrice(subtotal)}
                </span>
              </div>
              <p className="cart-taxes-note">
                Shipping and promotional discounts calculated at checkout
              </p>
            </div>

            <div className="cart-drawer-actions">
              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={handleCheckoutClick}
              >
                Proceed to Checkout
              </button>
              <button
                className="btn btn-outline btn-md btn-block"
                onClick={handleViewCartClick}
              >
                View Full Bag
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
