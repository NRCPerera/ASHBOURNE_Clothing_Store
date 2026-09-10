import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>ASHBOURNE</h3>
            <p>
              Curated clothing for the modern individual. Premium quality,
              timeless style, and sustainable craftsmanship — since 2024.
            </p>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?category=t-shirts">T-Shirts</Link></li>
              <li><Link to="/products?category=shirts">Shirts</Link></li>
              <li><Link to="/products?category=jeans">Jeans</Link></li>
              <li><Link to="/products?category=jackets">Jackets</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Help</h4>
            <ul>
              <li><a href="#">Shipping & Returns</a></li>
              <li><a href="#">Size Guide</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Sustainability</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} ASHBOURNE. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
