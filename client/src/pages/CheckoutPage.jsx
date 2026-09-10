import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const FREE_SHIPPING_THRESHOLD = 10000;
const STANDARD_SHIPPING_FEE = 500;

function formatPrice(price) {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [shippingForm, setShippingForm] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Sri Lanka',
    phone: '',
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('demo'); // 'demo' | 'card' | 'cod'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate with user details if logged in
  useEffect(() => {
    if (user) {
      setShippingForm((prev) => ({
        ...prev,
        street: user.address?.street || prev.street,
        city: user.address?.city || prev.city,
        state: user.address?.state || prev.state,
        postalCode: user.address?.postalCode || prev.postalCode,
        country: user.address?.country || 'Sri Lanka',
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);

  const handleInputChange = (e) => {
    setShippingForm({ ...shippingForm, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await api.post('/orders/validate-coupon', {
        code: couponCode.trim(),
        amount: subtotal,
      });
      setAppliedCoupon(res.data.data);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (cart.length === 0) {
      setError('Your shopping bag is empty.');
      return;
    }

    if (!shippingForm.street || !shippingForm.city || !shippingForm.postalCode) {
      setError('Please fill out all required shipping address fields.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku,
          quantity: item.quantity,
        })),
        shippingAddress: shippingForm,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      };

      const res = await api.post('/orders', payload);
      const createdOrder = res.data.data.order;

      // If demo instant payment was chosen, trigger simulated payment confirmation
      if (paymentMethod === 'demo') {
        try {
          await api.post(`/orders/${createdOrder._id}/pay-demo`);
        } catch (payErr) {
          console.warn('Demo payment auto-trigger failed:', payErr);
        }
      }

      clearCart();
      navigate(`/orders/${createdOrder._id}?placed=true`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to place order. Please check your details and try again.'
      );
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-page container fade-in" style={{ padding: 'var(--space-3xl) 0', textAlign: 'center' }}>
        <div className="cart-empty-page">
          <div className="cart-empty-icon" style={{ fontSize: '3rem' }}>🛍️</div>
          <h2>Your bag is empty</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 'var(--space-md) 0 var(--space-xl)' }}>
            Please add items to your shopping bag before proceeding to checkout.
          </p>
          <Link to="/products" className="btn btn-primary btn-md">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page container fade-in">
      <div className="checkout-header">
        <h1>Secure Checkout</h1>
        <p className="checkout-subtitle">Complete your purchase with encrypted assurance</p>
      </div>

      {!isAuthenticated && (
        <div className="checkout-auth-alert">
          <span>Already registered with ASHBOURNE?</span>
          <Link to="/login?redirect=/checkout" className="btn btn-outline btn-sm">
            Sign In to Checkout faster
          </Link>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-xl)' }}>{error}</div>}

      <form onSubmit={handlePlaceOrder} className="checkout-grid">
        {/* Left Column — Delivery & Payment */}
        <div className="checkout-main">
          {/* Step 1: Shipping Address */}
          <div className="checkout-section">
            <div className="checkout-section-title">
              <span className="step-badge">1</span>
              <h3>Delivery Details</h3>
            </div>

            <div className="checkout-form-grid">
              <div className="form-group full-width">
                <label htmlFor="street">Street Address *</label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  placeholder="e.g. 42 Alfred House Gardens, Kollupitiya"
                  value={shippingForm.street}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">City / Town *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="e.g. Colombo"
                  value={shippingForm.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">Province / State</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="e.g. Western Province"
                  value={shippingForm.state}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="postalCode">Postal Code *</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  placeholder="e.g. 00300"
                  value={shippingForm.postalCode}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={shippingForm.country}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="phone">Contact Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +94 77 123 4567"
                  value={shippingForm.phone}
                  onChange={handleInputChange}
                  required
                />
                <span className="input-hint">Used by the courier for delivery coordination</span>
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method Selection */}
          <div className="checkout-section" style={{ marginTop: 'var(--space-2xl)' }}>
            <div className="checkout-section-title">
              <span className="step-badge">2</span>
              <h3>Payment Method</h3>
            </div>

            <div className="payment-options">
              {/* Option 1: Instant Demo Pay */}
              <label
                className={`payment-option ${paymentMethod === 'demo' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('demo')}
              >
                <div className="payment-radio">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="demo"
                    checked={paymentMethod === 'demo'}
                    onChange={() => setPaymentMethod('demo')}
                  />
                </div>
                <div className="payment-info">
                  <div className="payment-title">
                    <span>⚡ Instant Demo Payment</span>
                    <span className="badge badge-accent">Quick Test</span>
                  </div>
                  <p className="payment-desc">
                    Instantly marks your order as paid and automatically updates inventory without needing live card gateways.
                  </p>
                </div>
              </label>

              {/* Option 2: PayHere Sandbox */}
              <label
                className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="payment-radio">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                </div>
                <div className="payment-info">
                  <div className="payment-title">
                    <span>Credit or Debit Card</span>
                    <span className="payment-logos">Visa • MasterCard • AMEX</span>
                  </div>
                  <p className="payment-desc">
                    Secure payment processed via PayHere Gateway (Sandbox).
                  </p>
                </div>
              </label>

              {/* Option 3: Cash on Delivery */}
              <label
                className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <div className="payment-radio">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                </div>
                <div className="payment-info">
                  <div className="payment-title">
                    <span>Cash on Delivery</span>
                  </div>
                  <p className="payment-desc">
                    Pay in cash directly to the courier upon arrival at your doorstep.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column — Order Review & Summary */}
        <div className="checkout-sidebar">
          <div className="checkout-summary-card">
            <h3>Order Summary</h3>

            {/* Item list snapshot */}
            <div className="checkout-items-preview">
              {cart.map((item) => (
                <div key={item.variantSku} className="checkout-item-row">
                  <div className="checkout-item-thumb">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="thumb-stub">ASH</div>
                    )}
                    <span className="checkout-item-qty">{item.quantity}</span>
                  </div>
                  <div className="checkout-item-meta">
                    <span className="checkout-item-name">{item.name}</span>
                    <span className="checkout-item-attr">
                      {item.color} / {item.size}
                    </span>
                  </div>
                  <span className="checkout-item-price">
                    LKR {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className="checkout-coupon-box">
              {appliedCoupon ? (
                <div className="applied-coupon-pill">
                  <div>
                    <span className="coupon-code-badge">✓ {appliedCoupon.code}</span>
                    <span className="coupon-discount-text">
                      −LKR {formatPrice(appliedCoupon.discount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="coupon-remove-btn"
                    onClick={handleRemoveCoupon}
                    title="Remove coupon"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="coupon-input-group">
                  <input
                    type="text"
                    placeholder="Promotional code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <div className="form-error" style={{ marginTop: '6px' }}>{couponError}</div>}
            </div>

            {/* Price Calculations */}
            <div className="summary-list" style={{ marginTop: 'var(--space-md)' }}>
              <div className="summary-item">
                <span>Subtotal</span>
                <span>LKR {formatPrice(subtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="summary-item" style={{ color: 'var(--color-success)' }}>
                  <span>Discount</span>
                  <span>−LKR {formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="summary-item">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <strong style={{ color: 'var(--color-success)' }}>FREE</strong>
                  ) : (
                    `LKR ${formatPrice(shipping)}`
                  )}
                </span>
              </div>

              <div className="summary-divider" />

              <div className="summary-item summary-total">
                <span>Total Amount</span>
                <span className="summary-total-amount">
                  LKR {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 'var(--space-xl)' }}
              disabled={submitting}
            >
              {submitting ? 'Placing Order...' : `Place Order • LKR ${formatPrice(grandTotal)}`}
            </button>

            <p className="checkout-terms-note">
              By placing your order, you agree to ASHBOURNE's Terms of Luxury Service and Privacy Policy.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
