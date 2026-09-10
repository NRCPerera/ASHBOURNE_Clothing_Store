import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

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
    month: 'short',
    day: 'numeric',
  });
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders?page=${page}&limit=10`);
        setOrders(res.data.data.orders);
        setTotalPages(res.data.data.pagination.pages || 1);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, page, navigate]);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p>Retrieving your order history...</p>
      </div>
    );
  }

  return (
    <div className="orders-page container fade-in">
      <div className="orders-header">
        <h1>Order History</h1>
        <p className="orders-subtitle">
          Review your past purchases, shipment statuses, and digital receipts
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="cart-empty-page" style={{ padding: 'var(--space-3xl) 0' }}>
          <div className="cart-empty-icon" style={{ fontSize: '3rem' }}>📦</div>
          <h2>No Orders Found</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 'var(--space-md) 0 var(--space-xl)' }}>
            You haven't placed any orders with ASHBOURNE yet.
          </p>
          <Link to="/products" className="btn btn-primary btn-md">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <div key={order._id} className="order-history-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-card-id">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="order-card-date">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="order-badges">
                    <span className={`status-pill status-${order.orderStatus}`}>
                      {order.orderStatus}
                    </span>
                    <span className={`status-pill status-${order.paymentStatus}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-card-items-preview">
                    <span className="order-item-count">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}:
                    </span>
                    <span className="order-item-names">
                      {order.items.map((i) => i.productName).join(', ')}
                    </span>
                  </div>

                  <div className="order-card-footer">
                    <div className="order-card-total">
                      <span>Total:</span>
                      <strong>LKR {formatPrice(order.total)}</strong>
                    </div>

                    <Link
                      to={`/orders/${order._id}`}
                      className="btn btn-outline btn-sm"
                    >
                      View Order Details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 'var(--space-2xl)' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
