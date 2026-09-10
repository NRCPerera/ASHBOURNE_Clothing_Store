import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineLocationMarker,
  HiOutlineUser,
  HiOutlineMail,
} from 'react-icons/hi';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/admin/orders/${id}`);
      setOrder(data.data.order);
    } catch {
      toast.error('Failed to load order');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (newStatus) => {
    setUpdatingOrder(true);
    try {
      const { data } = await api.put(`/admin/orders/${id}/status`, {
        orderStatus: newStatus,
      });
      setOrder(data.data.order);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingOrder(false);
    }
  };

  const handlePaymentStatusUpdate = async (newStatus) => {
    setUpdatingPayment(true);
    try {
      const { data } = await api.put(`/admin/orders/${id}/status`, {
        paymentStatus: newStatus,
      });
      setOrder(data.data.order);
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const getStatusClass = (status) => {
    const map = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipped: 'purple',
      delivered: 'success',
      cancelled: 'danger',
      paid: 'success',
      failed: 'danger',
      refunded: 'warning',
    };
    return map[status] || 'default';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOrderId = (id) => `#${id.slice(-6).toUpperCase()}`;

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner large" />
        <p>Loading order…</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="order-detail-page">
      <button className="btn btn-ghost back-btn" onClick={() => navigate('/orders')}>
        <HiOutlineArrowLeft /> Back to Orders
      </button>

      {/* Order Header */}
      <div className="order-header-card">
        <div className="order-header-top">
          <div>
            <h2 className="order-id">Order {formatOrderId(order._id)}</h2>
            <p className="text-muted">{formatDate(order.createdAt)}</p>
          </div>
          <div className="order-badges">
            <span className={`badge badge-lg badge-${getStatusClass(order.orderStatus)}`}>
              {order.orderStatus}
            </span>
            <span className={`badge badge-lg badge-${getStatusClass(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="order-detail-grid">
        {/* Order Items */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Items ({order.items?.length || 0})</h2>
          </div>
          <div className="card-body">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-muted text-sm">SKU: {item.variantSku}</div>
                    </td>
                    <td className="text-muted">{item.size} / {item.color}</td>
                    <td className="font-mono">LKR {item.price?.toLocaleString()}</td>
                    <td>{item.quantity}</td>
                    <td className="font-mono">LKR {(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="text-right font-medium">Subtotal</td>
                  <td className="font-mono">LKR {order.subtotal?.toLocaleString()}</td>
                </tr>
                {order.discount > 0 && (
                  <tr>
                    <td colSpan={4} className="text-right text-muted">Discount</td>
                    <td className="font-mono text-success">−LKR {order.discount?.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan={4} className="text-right font-medium">Total</td>
                  <td className="font-mono font-medium">LKR {order.total?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="order-sidebar">
          {/* Customer Info */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Customer</h2>
            </div>
            <div className="card-body">
              <div className="info-row">
                <HiOutlineUser className="info-icon" />
                <span>{order.user?.name || 'Unknown'}</span>
              </div>
              <div className="info-row">
                <HiOutlineMail className="info-icon" />
                <span>{order.user?.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">Shipping Address</h2>
            </div>
            <div className="card-body">
              <div className="info-row">
                <HiOutlineLocationMarker className="info-icon" />
                <div>
                  <div>{order.shippingAddress?.street}</div>
                  <div>{order.shippingAddress?.city}{order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}</div>
                  <div>{order.shippingAddress?.postalCode}</div>
                  <div>{order.shippingAddress?.country}</div>
                  {order.shippingAddress?.phone && (
                    <div className="text-muted">📞 {order.shippingAddress.phone}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Update */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <HiOutlineTruck className="inline-icon" /> Order Status
              </h2>
            </div>
            <div className="card-body">
              <div className="status-update-group">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status}
                    className={`status-btn ${order.orderStatus === status ? 'active' : ''} status-${getStatusClass(status)}`}
                    onClick={() => handleOrderStatusUpdate(status)}
                    disabled={updatingOrder || order.orderStatus === status}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Status Update */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="card-title">
                <HiOutlineCreditCard className="inline-icon" /> Payment Status
              </h2>
            </div>
            <div className="card-body">
              <div className="status-update-group">
                {PAYMENT_STATUSES.map((status) => (
                  <button
                    key={status}
                    className={`status-btn ${order.paymentStatus === status ? 'active' : ''} status-${getStatusClass(status)}`}
                    onClick={() => handlePaymentStatusUpdate(status)}
                    disabled={updatingPayment || order.paymentStatus === status}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;
