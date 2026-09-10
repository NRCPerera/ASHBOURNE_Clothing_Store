import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';

function formatPrice(price) {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const justPlaced = searchParams.get('placed') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleSimulatePayment = async () => {
    try {
      setPaying(true);
      const res = await api.post(`/orders/${id}/pay-demo`);
      setOrder(res.data.data.order);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment simulation failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: 'var(--space-3xl) 0', textAlign: 'center' }}>
        <div className="cart-empty-page">
          <h2>Order Not Found</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 'var(--space-md) 0' }}>
            {error || "We couldn't retrieve the details for this order."}
          </p>
          <Link to="/orders" className="btn btn-outline btn-md">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-page container fade-in">
      {justPlaced && (
        <div className="order-success-banner">
          <div className="order-success-icon">✓</div>
          <div>
            <h3>Thank you for your order!</h3>
            <p>
              Your order confirmation has been logged. We are preparing your ASHBOURNE packaging.
            </p>
          </div>
        </div>
      )}

      <div className="order-header">
        <div className="order-header-left">
          <Link to="/orders" className="back-link">
            ← Back to Orders
          </Link>
          <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="order-header-badges">
          <span className={`status-pill status-${order.orderStatus}`}>
            Order: {order.orderStatus}
          </span>
          <span className={`status-pill status-${order.paymentStatus}`}>
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="order-detail-grid">
        {/* Left Column — Items & Delivery */}
        <div className="order-main-col">
          {/* Items Card */}
          <div className="order-card">
            <h3>Items in Order ({order.items.length})</h3>
            <div className="order-items-table">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <div className="order-item-info">
                    <span className="order-item-name">{item.productName}</span>
                    <div className="order-item-tags">
                      <span>Size: {item.size}</span>
                      <span>Color: {item.color}</span>
                      <span>SKU: {item.variantSku}</span>
                    </div>
                  </div>
                  <div className="order-item-qty">
                    Qty: <strong>{item.quantity}</strong>
                  </div>
                  <div className="order-item-price">
                    LKR {formatPrice(item.price)}
                  </div>
                  <div className="order-item-line-total">
                    LKR {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="order-card" style={{ marginTop: 'var(--space-xl)' }}>
            <h3>Shipping Details</h3>
            <div className="order-address-box">
              <p><strong>Street:</strong> {order.shippingAddress?.street}</p>
              <p>
                <strong>City & Region:</strong> {order.shippingAddress?.city}
                {order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}{' '}
                ({order.shippingAddress?.postalCode})
              </p>
              <p><strong>Country:</strong> {order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && (
                <p><strong>Contact Phone:</strong> {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — Summary & Actions */}
        <div className="order-sidebar-col">
          <div className="order-card">
            <h3>Payment Summary</h3>
            <div className="summary-list">
              <div className="summary-item">
                <span>Subtotal</span>
                <span>LKR {formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-item" style={{ color: 'var(--color-success)' }}>
                  <span>Discount</span>
                  <span>−LKR {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="summary-item">
                <span>Shipping</span>
                <span>
                  {order.subtotal >= 10000 || order.total === order.subtotal - order.discount ? (
                    <strong style={{ color: 'var(--color-success)' }}>FREE</strong>
                  ) : (
                    'LKR 500.00'
                  )}
                </span>
              </div>
              <div className="summary-divider" />
              <div className="summary-item summary-total">
                <span>Total Paid / Due</span>
                <span className="summary-total-amount">
                  LKR {formatPrice(order.total)}
                </span>
              </div>
            </div>

            {order.paymentStatus === 'pending' && (
              <div className="order-pay-actions" style={{ marginTop: 'var(--space-xl)' }}>
                <button
                  className="btn btn-primary btn-md btn-block"
                  onClick={handleSimulatePayment}
                  disabled={paying}
                >
                  {paying ? 'Processing...' : '⚡ Complete Demo Payment Now'}
                </button>
                <p className="demo-pay-hint">
                  Simulates successful checkout completion and reserves inventory.
                </p>
              </div>
            )}

            <div className="order-actions-footer" style={{ marginTop: 'var(--space-xl)' }}>
              <Link to="/products" className="btn btn-outline btn-sm btn-block">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
