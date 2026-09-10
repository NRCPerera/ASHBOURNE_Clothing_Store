import { Link } from 'react-router-dom';

// Color name to CSS color mapping
const COLOR_MAP = {
  black: '#111111',
  white: '#f5f5f5',
  navy: '#1a2744',
  grey: '#6b7280',
  gray: '#6b7280',
  olive: '#556b2f',
  burgundy: '#722f37',
  cream: '#f5f0e1',
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export default function ProductCard({ product }) {
  const { name, slug, basePrice, category, images, variants } = product;

  // Get unique colors from variants
  const uniqueColors = [...new Set(variants?.map((v) => v.color) || [])];

  // Check if all variants are out of stock
  const totalStock = variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
  const isOutOfStock = totalStock === 0;

  // Get the main image
  const mainImage = images?.[0] || 'https://placehold.co/400x533/1a1a2e/c9a96e?text=No+Image';

  return (
    <Link to={`/products/${slug}`} className="product-card">
      <div className="product-card-image">
        <img
          src={mainImage}
          alt={name}
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="product-card-badge out-of-stock">Sold Out</div>
        )}
      </div>
      <div className="product-card-body">
        {category && (
          <div className="product-card-category">{category.name}</div>
        )}
        <h3 className="product-card-name">{name}</h3>
        <div className="product-card-price">
          <span className="currency">LKR </span>
          {formatPrice(basePrice)}
        </div>
        {uniqueColors.length > 0 && (
          <div className="product-card-colors">
            {uniqueColors.slice(0, 5).map((color) => (
              <div
                key={color}
                className="color-dot"
                style={{
                  backgroundColor:
                    COLOR_MAP[color.toLowerCase()] || color.toLowerCase(),
                }}
                title={color}
              />
            ))}
            {uniqueColors.length > 5 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                +{uniqueColors.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
