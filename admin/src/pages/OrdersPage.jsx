import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineFilter,
  HiOutlineClipboardList,
} from 'react-icons/hi';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const orderStatus = searchParams.get('orderStatus') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (orderStatus) params.orderStatus = orderStatus;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const { data } = await api.get('/admin/orders', { params });
      setOrders(data.data.orders);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, orderStatus, paymentStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim(), page: undefined });
  };

  const updateParams = (updates) => {
    const current = Object.fromEntries(searchParams.entries());
    const next = { ...current, ...updates };
    // Remove empty values
    Object.keys(next).forEach((k) => {
      if (!next[k]) delete next[k];
    });
    setSearchParams(next);
  };

  const goToPage = (p) => updateParams({ page: p.toString() });

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOrderId = (id) => {
    return `#${id.slice(-6).toUpperCase()}`;
  };

  return (
    <div className="orders-page">
      {/* Toolbar */}
      <div className="page-toolbar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by customer name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
        <button
          className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <HiOutlineFilter /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filter-bar">
          <div className="filter-group">
            <label className="filter-label">Order Status</label>
            <select
              className="form-input compact"
              value={orderStatus}
              onChange={(e) => updateParams({ orderStatus: e.target.value, page: undefined })}
            >
              <option value="">All</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Payment Status</label>
            <select
              className="form-input compact"
              value={paymentStatus}
              onChange={(e) => updateParams({ paymentStatus: e.target.value, page: undefined })}
            >
              <option value="">All</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          {(orderStatus || paymentStatus) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => updateParams({ orderStatus: '', paymentStatus: '', page: undefined })}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner large" />
        </div>
      ) : orders.length === 0 ? (
        <div className="page-empty">
          <HiOutlineClipboardList className="empty-icon" style={{ fontSize: '3rem' }} />
          <h3>No orders found</h3>
          <p className="text-muted">
            {search || orderStatus || paymentStatus
              ? 'Try adjusting your search or filters'
              : 'Orders will appear here when customers make purchases'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/orders/${order._id}`} className="text-link font-mono">
                        {formatOrderId(order._id)}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{order.user?.name || 'Unknown'}</div>
                        <div className="text-muted text-sm">{order.user?.email || ''}</div>
                      </div>
                    </td>
                    <td>{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</td>
                    <td className="font-mono">LKR {order.total?.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${getStatusClass(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusClass(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
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
                  .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
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

export default OrdersPage;
