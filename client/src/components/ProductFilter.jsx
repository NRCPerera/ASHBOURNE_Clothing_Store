import { useState, useEffect } from 'react';

export default function ProductFilter({
  categories,
  filters,
  onFilterChange,
  onClear,
}) {
  const [localPriceMin, setLocalPriceMin] = useState(filters.minPrice || '');
  const [localPriceMax, setLocalPriceMax] = useState(filters.maxPrice || '');

  // Available sizes and colors (from all product variants)
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Black', 'White', 'Navy', 'Grey', 'Olive', 'Burgundy', 'Cream'];

  useEffect(() => {
    setLocalPriceMin(filters.minPrice || '');
    setLocalPriceMax(filters.maxPrice || '');
  }, [filters.minPrice, filters.maxPrice]);

  const handleCheckboxChange = (type, value) => {
    const current = filters[type] ? filters[type].split(',') : [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    onFilterChange({
      ...filters,
      [type]: updated.length > 0 ? updated.join(',') : '',
    });
  };

  const handlePriceApply = () => {
    onFilterChange({
      ...filters,
      minPrice: localPriceMin,
      maxPrice: localPriceMax,
    });
  };

  const isChecked = (type, value) => {
    const current = filters[type] ? filters[type].split(',') : [];
    return current.includes(value);
  };

  return (
    <aside className="filter-sidebar">
      {/* Categories */}
      <div className="filter-section">
        <h3>Category</h3>
        {categories.map((cat) => (
          <label key={cat._id} className="filter-option">
            <input
              type="checkbox"
              checked={filters.category === cat._id}
              onChange={() =>
                onFilterChange({
                  ...filters,
                  category: filters.category === cat._id ? '' : cat._id,
                })
              }
            />
            {cat.name}
          </label>
        ))}
      </div>

      {/* Size */}
      <div className="filter-section">
        <h3>Size</h3>
        {sizes.map((size) => (
          <label key={size} className="filter-option">
            <input
              type="checkbox"
              checked={isChecked('size', size)}
              onChange={() => handleCheckboxChange('size', size)}
            />
            {size}
          </label>
        ))}
      </div>

      {/* Color */}
      <div className="filter-section">
        <h3>Color</h3>
        {colors.map((color) => (
          <label key={color} className="filter-option">
            <input
              type="checkbox"
              checked={isChecked('color', color)}
              onChange={() => handleCheckboxChange('color', color)}
            />
            {color}
          </label>
        ))}
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <h3>Price Range</h3>
        <div className="filter-price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={localPriceMin}
            onChange={(e) => setLocalPriceMin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePriceApply()}
          />
          <span>—</span>
          <input
            type="number"
            placeholder="Max"
            value={localPriceMax}
            onChange={(e) => setLocalPriceMax(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePriceApply()}
          />
        </div>
        <div className="filter-actions">
          <button className="btn btn-sm btn-outline" onClick={handlePriceApply}>
            Apply
          </button>
        </div>
      </div>

      {/* Clear All */}
      <button className="btn btn-ghost btn-sm" onClick={onClear}>
        ✕ Clear All Filters
      </button>
    </aside>
  );
}
