import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineExclamation,
  HiOutlineUsers,
  HiOutlineArrowRight,
} from 'react-icons/hi';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner large" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page-empty">
        <p>Failed to load dashboard data.</p>
        <button className="btn btn-primary" onClick={fetchStats}>Retry</button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: HiOutlineCube,
      color: 'blue',
      link: '/products',
    },
    {
      label: 'Categories',
      value: stats.totalCategories,
      icon: HiOutlineTag,
      color: 'purple',
      link: '/categories',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: HiOutlineClipboardList,
      color: 'green',
      link: '/orders',
    },
    {
      label: 'Revenue',
      value: `LKR ${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: HiOutlineCurrencyDollar,
      color: 'gold',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers,
      icon: HiOutlineUsers,
      color: 'teal',
    },
    {
      label: 'Low Stock Alerts',
      value: stats.lowStockCount,
      icon: HiOutlineExclamation,
      color: stats.lowStockCount > 0 ? 'red' : 'green',
    },
  ];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <div className="dashboard-page">
      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map((card) => (
          <div key={card.label} className={`stat-card stat-${card.color}`}>
            <div className="stat-card-top">
              <div className="stat-icon-wrap">
                <card.icon className="stat-icon" />
              </div>
              {card.link && (
                <Link to={card.link} className="stat-link">
                  <HiOutlineArrowRight />
                </Link>
              )}
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom Grid: Recent Orders + Low Stock */}
      <div className="dashboard-grid">
        {/* Recent Orders */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Recent Orders</h2>
            <Link to="/orders" className="card-action">View all</Link>
          </div>
          <div className="card-body">
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <Link to={`/orders/${order._id}`} className="text-link">
                          {order.user?.name || 'Unknown'}
                        </Link>
                      </td>
                      <td className="font-mono">LKR {order.total?.toLocaleString()}</td>
                      <td>
                        <span className={`badge badge-${getStatusClass(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="text-muted">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state small">
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Low Stock Alerts</h2>
            <Link to="/products" className="card-action">Manage</Link>
          </div>
          <div className="card-body">
            {stats.lowStockItems && stats.lowStockItems.length > 0 ? (
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStockItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <Link to={`/products/${item.productId}/edit`} className="text-link">
                          {item.productName}
                        </Link>
                      </td>
                      <td className="text-muted">{item.size} / {item.color}</td>
                      <td>
                        <span className={`badge ${item.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {item.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state small">
                <HiOutlineExclamation className="empty-icon" />
                <p>All items well stocked</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Order Status Overview</h2>
          </div>
          <div className="card-body">
            <div className="status-breakdown">
              {Object.entries(stats.orderStatusBreakdown || {}).map(([status, count]) => (
                <div key={status} className="status-row">
                  <span className={`badge badge-${getStatusClass(status)}`}>{status}</span>
                  <div className="status-bar-track">
                    <div
                      className={`status-bar-fill fill-${getStatusClass(status)}`}
                      style={{
                        width: `${Math.min((count / Math.max(stats.totalOrders, 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="status-count">{count}</span>
                </div>
              ))}
              {Object.keys(stats.orderStatusBreakdown || {}).length === 0 && (
                <div className="empty-state small">
                  <p>No orders to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
