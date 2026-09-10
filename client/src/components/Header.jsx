import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          ASHBOURNE
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/products" onClick={() => setMenuOpen(false)}>
            Shop
          </NavLink>
          <NavLink to="/products?category=t-shirts" onClick={() => setMenuOpen(false)}>
            T-Shirts
          </NavLink>
          <NavLink to="/products?category=jeans" onClick={() => setMenuOpen(false)}>
            Jeans
          </NavLink>
          <NavLink to="/products?category=jackets" onClick={() => setMenuOpen(false)}>
            Jackets
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" onClick={() => setMenuOpen(false)}>
              My Orders
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          {/* Cart Icon Button */}
          <button
            className="header-cart-btn"
            onClick={openCart}
            aria-label={`Shopping bag with ${itemCount} items`}
          >
            <svg
              className="cart-icon-svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {itemCount > 0 && (
              <span className="cart-badge bounce">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div className="header-user-menu">
              <Link to="/orders" className="header-user-name" title="View My Orders">
                {user?.name?.split(' ')[0]}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
