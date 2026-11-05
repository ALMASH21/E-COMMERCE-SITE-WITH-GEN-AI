import { useMemo, useState } from "react";
import Icon from "./components/Icon.jsx";

const filterGroups = {
  category: ["Bags", "Textiles", "Belts", "Eyewear", "Home", "Beauty", "Objects"],
  price: ["Under $100", "$100–$250", "Over $250"],
  color: ["Sand", "Ivory", "Blush", "Olive", "Terracotta"],
};

const priceMatches = {
  "Under $100": (price) => price < 100,
  "$100–$250": (price) => price >= 100 && price <= 250,
  "Over $250": (price) => price > 250,
};

function ProductTile({ product, isFavorite, onToggleFavorite, onQuickAdd, onOpenProduct }) {
  return (
    <article className="listing-product-card">
      <div className={`listing-product-image ${product.tile ? `tile-${product.tile}` : ""}`}>
        {product.image ? (
          <img alt={product.name} loading="lazy" src={product.image} />
        ) : (
          <div className="tile-copy">
            <span>{product.category}</span>
            <strong>{product.name}</strong>
            <i aria-hidden="true" />
          </div>
        )}
        {product.badge && (
          <span className={`product-badge ${product.badge === "Sale" ? "product-badge--sale" : ""}`}>
            {product.badge}
          </span>
        )}
        <button
          aria-label={`${isFavorite ? "Remove" : "Add"} ${product.name} ${isFavorite ? "from" : "to"} wishlist`}
          aria-pressed={isFavorite}
          className={`icon-button listing-favorite ${isFavorite ? "is-favorite" : ""}`}
          onClick={() => onToggleFavorite(product.id)}
          type="button"
        >
          <Icon name="heart" size={17} />
        </button>
        <button className="listing-quick-add" disabled={product.stock <= 0} onClick={() => onQuickAdd(product)} type="button">
          {product.stock <= 0 ? "Sold out" : "Quick add"} <Icon name="plus" size={15} />
        </button>
      </div>
      <div className="listing-product-meta">
        <div>
          <p>{product.category}</p>
          <button className="listing-product-name" onClick={onOpenProduct} type="button">{product.name}</button>
        </div>
        <span className="listing-price">${product.price}</span>
      </div>
      <p className="listing-rating"><Icon name="star" size={13} /> {product.rating}</p>
    </article>
  );
}

function FilterSection({ title, name, open, onToggle, children }) {
  return (
    <section className="filter-section">
      <button
        aria-controls={`filter-options-${name}`}
        aria-expanded={open}
        className="filter-section-toggle"
        onClick={() => onToggle(name)}
        type="button"
      >
        {title}
        <Icon className={open ? "filter-chevron is-open" : "filter-chevron"} name="chevronDown" size={16} />
      </button>
      {open && <div className="filter-section-content" id={`filter-options-${name}`}>{children}</div>}
    </section>
  );
}

export default function ProductListing({
  search,
  favorites,
  onToggleFavorite,
  onAddToBag,
  onOpenProduct,
  products = [],
}) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedColors, setSelectedColors] = useState([]);
  const [inStock, setInStock] = useState(false);
  const [handFinished, setHandFinished] = useState(false);
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState("grid");
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    color: true,
    availability: true,
  });

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const matchesPrice = !selectedPrice || priceMatches[selectedPrice](product.price);
      const matchesColor =
        selectedColors.length === 0 || selectedColors.includes(product.color);
      const matchesStock = !inStock || product.inStock;
      const matchesHandwork = !handFinished || product.handFinished;
      const matchesSearch =
        !query || `${product.name} ${product.category}`.toLowerCase().includes(query);
      return (
        matchesCategory &&
        matchesPrice &&
        matchesColor &&
        matchesStock &&
        matchesHandwork &&
        matchesSearch
      );
    });

    if (sort === "price-low") return filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-high") return filtered.sort((a, b) => b.price - a.price);
    if (sort === "newest") return filtered.reverse();
    return filtered;
  }, [handFinished, inStock, products, search, selectedCategories, selectedColors, selectedPrice, sort]);

  const activeFilters = [
    ...selectedCategories,
    ...(selectedPrice ? [selectedPrice] : []),
    ...selectedColors,
    ...(!inStock ? [] : ["In stock"]),
    ...(!handFinished ? [] : ["Hand-finished"]),
  ];

  function toggleSection(name) {
    setOpenSections((current) => ({ ...current, [name]: !current[name] }));
  }

  function toggleValue(values, setValues, value) {
    setValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function clearFilters() {
    setSelectedCategories([]);
    setSelectedPrice("");
    setSelectedColors([]);
    setInStock(false);
    setHandFinished(false);
  }

  function removeFilter(value) {
    if (value === "In stock") setInStock(false);
    else if (value === "Hand-finished") setHandFinished(false);
    else if (value === selectedPrice) setSelectedPrice("");
    else {
      setSelectedCategories((current) => current.filter((item) => item !== value));
      setSelectedColors((current) => current.filter((item) => item !== value));
    }
  }

  function handleToolbarCategory(value) {
    setSelectedCategories(value === "all" ? [] : [value]);
  }

  return (
    <main className="page-shell listing-shell">
      <nav aria-label="Breadcrumb" className="listing-breadcrumb">
        <a href="/">Home</a>
        <Icon name="chevronRight" size={14} />
        <span aria-current="page">Accessories</span>
      </nav>

      <section className="listing-heading">
        <div>
          <p className="eyebrow section-eyebrow">The finishing touches</p>
          <h1>Accessories</h1>
          <p className="listing-description">The finishing pieces, chosen with intention.</p>
        </div>
        <span className="listing-count">{products.length} pieces</span>
      </section>

      <div className="listing-toolbar">
        <button
          aria-expanded={filtersVisible}
          className={`filter-toggle ${filtersVisible ? "is-selected" : ""}`}
          onClick={() => setFiltersVisible((current) => !current)}
          type="button"
        >
          <Icon name="sliders" size={16} />
          Filters
          {activeFilters.length > 0 && <span className="toolbar-filter-count">{activeFilters.length}</span>}
        </button>
        <div className="listing-toolbar-controls">
          <label className="listing-select-wrap">
            <span className="sr-only">Category</span>
            <select
              aria-label="Category"
              onChange={(event) => handleToolbarCategory(event.target.value)}
              value={selectedCategories.length === 1 ? selectedCategories[0] : "all"}
            >
              <option value="all">All accessories</option>
              {filterGroups.category.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Icon name="chevronDown" size={14} />
          </label>
          <label className="listing-select-wrap price-select">
            <span className="sr-only">Price</span>
            <select
              aria-label="Price"
              onChange={(event) => setSelectedPrice(event.target.value)}
              value={selectedPrice}
            >
              <option value="">Any price</option>
              {filterGroups.price.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Icon name="chevronDown" size={14} />
          </label>
          <label className="listing-select-wrap sort-select">
            <span className="sr-only">Sort products</span>
            <select aria-label="Sort products" onChange={(event) => setSort(event.target.value)} value={sort}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
            <Icon name="chevronDown" size={14} />
          </label>
          <div aria-label="Product view" className="view-toggle">
            <button
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={view === "grid" ? "is-active" : ""}
              onClick={() => setView("grid")}
              type="button"
            >
              <Icon name="grid" size={15} />
            </button>
            <button
              aria-label="Compact view"
              aria-pressed={view === "compact"}
              className={view === "compact" ? "is-active" : ""}
              onClick={() => setView("compact")}
              type="button"
            >
              <Icon name="list" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className={`listing-layout ${filtersVisible ? "" : "listing-layout--wide"}`}>
        {filtersVisible && (
          <aside aria-label="Product filters" className="listing-sidebar">
            <div className="sidebar-heading">
              <h2>Refine by</h2>
              <button onClick={clearFilters} type="button">Clear all</button>
            </div>

            <FilterSection name="category" title="Category" open={openSections.category} onToggle={toggleSection}>
              {filterGroups.category.map((item) => (
                <label className="filter-choice" key={item}>
                  <input
                    checked={selectedCategories.includes(item)}
                    onChange={() => toggleValue(selectedCategories, setSelectedCategories, item)}
                    type="checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </FilterSection>

            <FilterSection name="price" title="Price" open={openSections.price} onToggle={toggleSection}>
              {filterGroups.price.map((item) => (
                <label className="filter-choice" key={item}>
                  <input
                    checked={selectedPrice === item}
                    name="price"
                    onChange={() => setSelectedPrice(selectedPrice === item ? "" : item)}
                    type="radio"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </FilterSection>

            <FilterSection name="color" title="Color" open={openSections.color} onToggle={toggleSection}>
              <div aria-label="Filter by color" className="color-options">
                {filterGroups.color.map((item) => (
                  <button
                    aria-label={`${item}${selectedColors.includes(item) ? ", selected" : ""}`}
                    aria-pressed={selectedColors.includes(item)}
                    className={`color-swatch swatch-${item.toLowerCase()} ${selectedColors.includes(item) ? "is-selected" : ""}`}
                    key={item}
                    onClick={() => toggleValue(selectedColors, setSelectedColors, item)}
                    title={item}
                    type="button"
                  />
                ))}
              </div>
              {selectedColors.length > 0 && (
                <p className="color-selection">{selectedColors.join(", ")}</p>
              )}
            </FilterSection>

            <FilterSection name="availability" title="Availability" open={openSections.availability} onToggle={toggleSection}>
              <label className="filter-choice">
                <input checked={inStock} onChange={(event) => setInStock(event.target.checked)} type="checkbox" />
                <span>In stock</span>
              </label>
              <label className="filter-choice">
                <input checked={handFinished} onChange={(event) => setHandFinished(event.target.checked)} type="checkbox" />
                <span>Hand-finished</span>
              </label>
            </FilterSection>

            <div className="filter-empty-preview">
              <span className="empty-preview-mark">A.</span>
              <div>
                <p>{activeFilters.length ? `${activeFilters.length} filters applied` : "A considered edit"}</p>
                <span>{activeFilters.length ? "Remove a filter above to broaden your selection." : "Choose a filter to refine your selection."}</span>
              </div>
            </div>
          </aside>
        )}

        <section aria-label="Accessory products" className="listing-results">
          <div className="results-toolbar">
            <div className="active-filter-chips">
              {activeFilters.length > 0 ? (
                activeFilters.map((filter) => (
                  <button className="filter-chip" key={filter} onClick={() => removeFilter(filter)} type="button">
                    {filter}<Icon name="close" size={12} />
                  </button>
                ))
              ) : (
                <span className="results-hint">A few of our most-loved finishing pieces</span>
              )}
            </div>
            <span className="showing-count">{visibleProducts.length} of {products.length}</span>
          </div>

          {visibleProducts.length > 0 ? (
            <div className={`listing-product-grid ${view === "compact" ? "is-compact" : ""}`}>
              {visibleProducts.map((product) => (
                <ProductTile
                  isFavorite={favorites.includes(product.id)}
                  key={product.id}
                  onQuickAdd={onAddToBag}
                  onOpenProduct={() => onOpenProduct(product.id)}
                  onToggleFavorite={onToggleFavorite}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="listing-no-results">
              <span className="empty-preview-mark">A.</span>
              <h2>A little too considered.</h2>
              <p>No pieces match those filters. Try broadening your selection.</p>
              <button className="button button-dark" onClick={clearFilters} type="button">Clear filters</button>
            </div>
          )}

          <p className="listing-bottom-note">Showing {products.length} considered accessories</p>
        </section>
      </div>
    </main>
  );
}
