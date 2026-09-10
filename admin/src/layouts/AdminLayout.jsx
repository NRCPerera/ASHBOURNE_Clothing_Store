import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineChevronLeft,
} from 'react-icons/hi';

const navItems = [
  { to: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { to: '/products', icon: HiOutlineCube, label: 'Products' },
  { to: '/categories', icon: HiOutlineTag, label: 'Categories' },
  { to: '/orders', icon: HiOutlineClipboardList, label: 'Orders' },
];

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Derive page title from location
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/products/new')) return 'New Product';
    if (path.includes('/edit')) return 'Edit Product';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/orders/')) return 'Order Details';
    if (path.startsWith('/orders')) return 'Orders';
    return 'Admin';
  };

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-brand">
              <span className="brand-text">ASHBOURNE</span>
              <span className="brand-sub">Admin</span>
            </div>
          )}
          <button
            className="sidebar-toggle desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HiOutlineChevronLeft className={`toggle-icon ${collapsed ? 'rotated' : ''}`} />
          </button>
          <button
            className="sidebar-toggle mobile-only"
            onClick={() => setMobileOpen(false)}
          >
            <HiOutlineX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="nav-icon" />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-link logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : undefined}>
            <HiOutlineLogout className="nav-icon" />
            {!collapsed && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`main-area ${collapsed ? 'expanded' : ''}`}>
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn mobile-only"
              onClick={() => setMobileOpen(true)}
            >
              <HiOutlineMenu />
            </button>
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>
          <div className="topbar-right">
            <div className="admin-info">
              <div className="admin-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="admin-details">
                <span className="admin-name">{user?.name || 'Admin'}</span>
                <span className="admin-role">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
