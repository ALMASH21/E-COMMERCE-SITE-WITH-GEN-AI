import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icon from "./components/Icon.jsx";
import listingProducts from "./data/listingProducts.js";
import { clearAuthError, loginAccount, loginOwnerAccount, loginWithGoogle, registerAccount, setAuthError, updateAuthenticatedUser } from "./store/authSlice.js";
import { setPromotion } from "./store/promotionSlice.js";
import "./ScreenPages.css";
import { apiRequest } from "./api.js";

const toteImage = listingProducts[0]?.image || "";
const serumImage = listingProducts[1]?.image || "";
const vesselImage = listingProducts[2]?.image || "";
const editorialImage =
  "https://images.unsplash.com/photo-1713425887916-111e58eba679?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBuZXV0cmFsJTIwZmFzaGlvbiUyMGVkaXRvcmlhbCUyMHdvbWFuJTIwbGVhdGhlciUyMGhhbmRiYWclMjBzdHVkaW98ZW58MXwwfHx8MTc5MzczOTA1NXww&ixlib=rb-4.1.0&q=80&w=1080";

function mapOwnerProduct(product) {
  const rawStatus = product.status || "Active";
  return {
    ...product,
    id: product._id,
    rawStatus,
    status: rawStatus === "Active" && product.stock <= 5 ? "Low stock" : rawStatus,
    updated: product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "—",
    initials: product.name.slice(0, 2).toUpperCase(),
  };
}

function Button({ children, className = "", onClick, type = "button", ...props }) {
  return (
    <button className={`screen-button ${className}`} onClick={onClick} type={type} {...props}>
      {children}
    </button>
  );
}

function Breadcrumb({ items, navigate }) {
  return (
    <nav aria-label="Breadcrumb" className="flowstep-breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flowstep-crumb-item">
          {index > 0 && <span className="crumb-slash" aria-hidden="true">/</span>}
          {item.href ? (
            <a
              href={item.href}
              onClick={(e) => {
                if (navigate) {
                  e.preventDefault();
                  navigate(item.href === "/" ? "home" : item.href.replace(/^\//, ""));
                }
              }}
            >
              {item.label}
            </a>
          ) : (
            <span className="crumb-current" aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="screen-page-title">
      <div>
        {eyebrow && <p className="eyebrow section-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Quantity({ value, onChange, label = "Quantity" }) {
  return (
    <div aria-label={label} className="quantity-stepper">
      <button aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(-1)} type="button">
        <Icon name="minus" size={14} />
      </button>
      <span>{value}</span>
      <button aria-label="Increase quantity" onClick={() => onChange(1)} type="button">
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}

function ProductDetails({ addToBag, toggleFavorite, favorites, navigate, catalogProduct }) {
  const [color, setColor] = useState("Umber");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [zyronOpen, setZyronOpen] = useState(false);
  const [zyronSubject, setZyronSubject] = useState("");
  const [zyronQuestion, setZyronQuestion] = useState("");
  const [zyronChat, setZyronChat] = useState([]);

  const product = catalogProduct;
  if (!product) {
    return (
      <main className="page-shell screen-content">
        <p>
          Product not found.{" "}
          <button className="text-link" onClick={() => navigate("accessories")} type="button">
            Browse accessories
          </button>
        </p>
      </main>
    );
  }
  const favorite = favorites.includes(product.id);

  function addProduct() {
    addToBag({ ...product, color, quantity });
    setAdded(true);
  }

  function handleAskZyron(question) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const currentSubject = zyronSubject || product.name;
    let reply = `Based on verified specifications for ${currentSubject}, it features premium craftsmanship, timeless proportions, and exceptional durability rating (4.9/5).`;
    if (trimmed.toLowerCase().includes("worth")) {
      reply = `${currentSubject} is priced at $${Number(product.price).toFixed(2)}. In its category, it offers vegetable-tanned artisanal leather and heirloom build quality, representing top-tier value compared to luxury benchmarks.`;
    } else if (trimmed.toLowerCase().includes("alternative") || trimmed.toLowerCase().includes("compare")) {
      reply = `Similar alternatives include Arc Vessel ($124.00) and Serein Serum ($86.00). ${currentSubject} remains the most versatile daily staple in the current AUREL edit.`;
    }
    setZyronChat((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "zyron", text: reply },
    ]);
  }

  const thumbClasses = [
    "thumb-object-left",
    "thumb-object-right",
    "thumb-object-top",
  ];

  return (
    <main className="page-shell flowstep-detail-container">
      <nav aria-label="Breadcrumb" className="flowstep-breadcrumb">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate("home"); }}>
          Home
        </a>
        <span className="crumb-slash">/</span>
        <a href="/accessories" onClick={(e) => { e.preventDefault(); navigate("accessories"); }}>
          {product.category || "Accessories"}
        </a>
        <span className="crumb-slash">/</span>
        <span className="crumb-current">{product.name}</span>
      </nav>

      <div className="flowstep-detail-layout">
        <div className="flowstep-gallery-col">
          <div className="flowstep-gallery-hero">
            {product.image ? (
              <img
                src={product.image}
                alt={`${product.name} main presentation`}
                className={`flowstep-hero-img ${thumbClasses[activeThumb] || ""}`}
              />
            ) : (
              <div className="flowstep-hero-placeholder">
                <Icon name="watch" size={96} />
              </div>
            )}
          </div>
          <div className="flowstep-gallery-thumbs">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                className={`flowstep-thumb-btn ${activeThumb === idx ? "is-active" : ""}`}
                onClick={() => setActiveThumb(idx)}
                aria-label={`View ${product.name} perspective ${idx + 1}`}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={`${product.name} perspective ${idx + 1}`}
                    className={`flowstep-thumb-img ${thumbClasses[idx]}`}
                  />
                ) : (
                  <Icon name="watch" size={32} />
                )}
              </button>
            ))}
          </div>
        </div>

        <section aria-labelledby="product-title" className="flowstep-info-col">
          <p className="flowstep-eyebrow">
            AUREL / {(product.category || "ACCESSORIES").toUpperCase()}
          </p>
          <h1 id="product-title" className="flowstep-product-title">
            {product.name}
          </h1>

          <div className="flowstep-rating-row">
            <div aria-label={`Rated ${product.rating || "4.9"} out of 5`} className="flowstep-rating-badge">
              <Icon name="star" size={15} className="flowstep-star-icon" />
              <span>{product.rating || "4.9"}</span>
            </div>
            <span className="flowstep-reviews-count">128 reviews</span>
          </div>

          <div className="flowstep-price-row">
            <span className="flowstep-price-val">${Number(product.price).toFixed(2)}</span>
            <span className="flowstep-installment-note">
              or 4 payments of ${(product.price / 4).toFixed(2)}
            </span>
          </div>

          <p className="flowstep-stock-status">
            <span className={`flowstep-stock-dot ${product.stock <= 0 ? "is-out" : ""}`} />
            {product.stock <= 0 ? "Currently out of stock" : "In stock · Ships today"}
          </p>

          <p className="flowstep-description">
            {product.description ||
              "A sculptural everyday tote in vegetable-tanned leather, finished by hand in small batches."}
          </p>

          <div className="flowstep-color-section">
            <p className="flowstep-color-label">
              Color: <span className="flowstep-color-value">{color}</span>
            </p>
            <div className="flowstep-color-chips">
              {["Umber", "Ink"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`flowstep-color-chip ${color === item ? "is-selected" : ""}`}
                  onClick={() => setColor(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flowstep-qty-row">
            <span className="flowstep-qty-label">Quantity</span>
            <div className="flowstep-qty-stepper">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Icon name="minus" size={14} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
          </div>

          <div className="flowstep-action-stack">
            <button
              type="button"
              className="flowstep-btn-add"
              disabled={product.stock <= 0}
              onClick={addProduct}
            >
              {added ? "Added to bag" : "Add to bag"}
            </button>
            <button
              type="button"
              className={`flowstep-btn-wishlist ${favorite ? "is-favorite" : ""}`}
              onClick={() => toggleFavorite(product.id)}
            >
              <Icon name="heart" size={16} />
              {favorite ? "Saved to wishlist" : "Save to wishlist"}
            </button>
            <button
              type="button"
              aria-label={`Ask Zyron about ${product.name}`}
              className="flowstep-btn-zyron"
              onClick={() => {
                setZyronSubject(product.name);
                setZyronOpen(true);
              }}
            >
              <Icon name="sparkles" size={16} />
              Ask Zyron about this product
            </button>
          </div>

          {added && (
            <div className="flowstep-inline-success" role="status">
              <Icon name="check" size={15} /> Added to your bag.
              <button onClick={() => navigate("cart")} type="button">
                View bag
              </button>
            </div>
          )}

          <p className="flowstep-shipping-perk">
            <Icon name="truck" size={18} />
            Complimentary shipping over $150
          </p>
        </section>
      </div>

      <section aria-label="Product information" className="flowstep-info-grid">
        <div className="flowstep-info-card">
          <h2>Details</h2>
          <p>
            Vegetable-tanned leather with a softly structured silhouette and
            considered interior space.
          </p>
        </div>
        <div className="flowstep-info-card">
          <h2>Shipping & returns</h2>
          <p>
            Complimentary shipping over $150. Returns accepted within 30 days of
            delivery.
          </p>
        </div>
        <div className="flowstep-info-card">
          <h2>Care</h2>
          <p>
            Keep away from prolonged moisture and store in the included dust bag
            when not in use.
          </p>
        </div>
      </section>

      <section aria-labelledby="recommendations-title" className="flowstep-recs-section">
        <h2 id="recommendations-title" className="flowstep-recs-title">
          You may also like
        </h2>
        <div className="flowstep-recs-grid">
          <article className="flowstep-rec-card">
            <div
              className="flowstep-rec-img-wrap"
              onClick={() => navigate("product", "serein-serum")}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://images.unsplash.com/photo-1772191530787-b9546da02fbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwZ29sZCUyMHdyaXN0JTIwd2F0Y2glMjBwcm9kdWN0JTIwcGhvdG9ncmFwaHklMjBjcmVhbSUyMGJhY2tncm91bmR8ZW58MXwyfHx8MTc5MzczOTA1NXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Serein Serum"
              />
            </div>
            <h3
              className="flowstep-rec-name"
              onClick={() => navigate("product", "serein-serum")}
              style={{ cursor: "pointer" }}
            >
              Serein Serum
            </h3>
            <p className="flowstep-rec-price">$86.00</p>
            <button
              type="button"
              className="flowstep-rec-zyron-btn"
              onClick={() => {
                setZyronSubject("Serein Serum");
                setZyronOpen(true);
              }}
            >
              <Icon name="sparkles" size={14} />
              Ask Zyron
            </button>
          </article>

          <article className="flowstep-rec-card">
            <div
              className="flowstep-rec-img-wrap"
              onClick={() => navigate("product", "arc-vessel")}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://images.unsplash.com/photo-1660721671073-e139688fa3cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBuZXV0cmFsJTIwaG9tZSUyMGRlY29yJTIwdmFzZSUyMHByb2R1Y3QlMjBwaG90b3xlbnwxfDJ8fHwxNzkzNzM5MDU4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Arc Vessel"
              />
            </div>
            <h3
              className="flowstep-rec-name"
              onClick={() => navigate("product", "arc-vessel")}
              style={{ cursor: "pointer" }}
            >
              Arc Vessel
            </h3>
            <p className="flowstep-rec-price">$124.00</p>
            <button
              type="button"
              className="flowstep-rec-zyron-btn"
              onClick={() => {
                setZyronSubject("Arc Vessel");
                setZyronOpen(true);
              }}
            >
              <Icon name="sparkles" size={14} />
              Ask Zyron
            </button>
          </article>
        </div>
      </section>

      {zyronOpen && (
        <aside
          aria-label="Ask Zyron product analysis chat"
          className="flowstep-zyron-drawer"
        >
          <div className="flowstep-zyron-header">
            <div className="flowstep-zyron-title-wrap">
              <div className="flowstep-zyron-badge">
                <Icon name="sparkles" size={16} />
              </div>
              <div>
                <p className="flowstep-zyron-name">Zyron</p>
                <p className="flowstep-zyron-sub">Product intelligence</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close Zyron chat"
              className="flowstep-zyron-close"
              onClick={() => setZyronOpen(false)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="flowstep-zyron-body">
            <div>
              <p className="flowstep-zyron-eyebrow">Analysis for</p>
              <p className="flowstep-zyron-target-name">{zyronSubject || product.name}</p>
            </div>

            <div className="flowstep-zyron-analysis-box">
              <p className="flowstep-zyron-text">
                I compared <strong>{zyronSubject || product.name}</strong> with similar products
                across material, price, ratings, and design appeal. This is a strong match for
                shoppers looking for a distinctive piece with everyday value.
              </p>
              <div className="flowstep-zyron-stats">
                <div className="flowstep-stat-tile">
                  <p className="stat-label">Match</p>
                  <p className="stat-value">94%</p>
                </div>
                <div className="flowstep-stat-tile">
                  <p className="stat-label">Similar items</p>
                  <p className="stat-value">8</p>
                </div>
                <div className="flowstep-stat-tile">
                  <p className="stat-label">Signal</p>
                  <p className="stat-value">Strong</p>
                </div>
              </div>
            </div>

            {zyronChat.length > 0 && (
              <div className="flowstep-zyron-thread">
                {zyronChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`flowstep-chat-bubble ${msg.role === "user" ? "is-user" : "is-zyron"}`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

            <div className="flowstep-zyron-quick-prompts">
              <button
                type="button"
                onClick={() => handleAskZyron("Is it worth it?")}
              >
                Is it worth it?
              </button>
              <button
                type="button"
                onClick={() => handleAskZyron("Compare alternatives")}
              >
                Compare alternatives
              </button>
            </div>

            <form
              className="flowstep-zyron-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (zyronQuestion.trim()) {
                  handleAskZyron(zyronQuestion);
                  setZyronQuestion("");
                }
              }}
            >
              <input
                type="text"
                aria-label="Ask Zyron a question"
                placeholder="Ask about this product..."
                value={zyronQuestion}
                onChange={(e) => setZyronQuestion(e.target.value)}
              />
              <button
                type="submit"
                aria-label="Send question to Zyron"
                className="flowstep-zyron-send-btn"
              >
                <Icon name="arrowUp" size={16} />
              </button>
            </form>
          </div>
        </aside>
      )}
    </main>
  );
}

function ShoppingCart({ bag, changeQuantity, removeFromBag, navigate, addToBag, products = [] }) {
  const dispatch = useDispatch();
  const promotion = useSelector((state) => state.promotion);
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const subtotal = bag.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promotion === "AUREL10" ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + tax;
  const itemCount = bag.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = bag.length === 0;

  const curatedPreview = (products && products.length > 0 ? products : listingProducts).slice(0, 4);

  function applyPromo(event) {
    event.preventDefault();
    if (promo.trim().toUpperCase() === "AUREL10") {
      dispatch(setPromotion("AUREL10"));
      setPromoMessage("AUREL10 applied — 10% discount added.");
    } else {
      dispatch(setPromotion(null));
      setPromoMessage("Code not recognized. Try AUREL10 for 10% off.");
    }
  }

  return (
    <main className="page-shell flowstep-cart-container">
      <div className="flowstep-cart-header">
        <nav aria-label="Breadcrumb" className="flowstep-breadcrumb">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate("home"); }}>
            Home
          </a>
          <span className="crumb-chevron" aria-hidden="true">&gt;</span>
          <span className="crumb-current">Your bag</span>
        </nav>
        <div className="flowstep-cart-title-row">
          <h1 className="flowstep-cart-title">Your bag</h1>
          <p className="flowstep-cart-count">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flowstep-cart-empty-centered">
          <div className="flowstep-empty-bag-icon-circle" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h2 className="flowstep-cart-empty-headline">Your bag is waiting.</h2>
          <p className="flowstep-cart-empty-description">
            Thoughtful pieces for considered spaces and everyday rituals.
          </p>
          <button
            type="button"
            className="flowstep-empty-shop-btn"
            onClick={() => navigate("home")}
          >
            Shop new arrivals <span aria-hidden="true">↗</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flowstep-cart-grid">
            <div className="flowstep-cart-items-col">
              <div className="flowstep-card flowstep-cart-card">
                <div className="flowstep-cart-items-list">
                  {bag.map((item) => (
                    <div className="flowstep-cart-item" key={item.id}>
                      <img
                        src={item.image || toteImage}
                        alt={item.name}
                        className="flowstep-cart-thumb"
                      />
                      <div className="flowstep-cart-item-info">
                        <div className="flowstep-cart-item-top">
                          <div>
                            <h2 className="flowstep-cart-item-name">{item.name}</h2>
                            <p className="flowstep-cart-item-price">${Number(item.price).toFixed(2)}</p>
                          </div>
                          <button
                            type="button"
                            className="flowstep-cart-remove-btn"
                            onClick={() => removeFromBag(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flowstep-cart-item-bottom">
                          <span className="flowstep-cart-qty-label">Quantity</span>
                          <div className="flowstep-qty-stepper-sm">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                              onClick={() => changeQuantity(item.id, -1)}
                            >
                              <Icon name="minus" size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => changeQuantity(item.id, 1)}
                            >
                              <Icon name="plus" size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form className="flowstep-promo-row" onSubmit={applyPromo}>
                  <input
                    type="text"
                    placeholder="Promo code"
                    aria-label="Promo code"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    className="flowstep-promo-input"
                  />
                  <button type="submit" className="flowstep-promo-btn">
                    Apply
                  </button>
                </form>
                {promoMessage && <p className="flowstep-promo-msg">{promoMessage}</p>}

                <div className="flowstep-free-delivery-row">
                  <Icon name="truck" size={16} />
                  <span>Free delivery unlocked</span>
                </div>
              </div>
            </div>

            <div className="flowstep-card flowstep-summary-card">
              <h2 className="flowstep-summary-title">Order summary</h2>
              <div className="flowstep-summary-rows">
                <div className="flowstep-summary-row">
                  <span className="row-label">Subtotal</span>
                  <span className="row-val">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flowstep-summary-row row-discount">
                    <span className="row-label">Discount (10%)</span>
                    <span className="row-val">−${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flowstep-summary-row">
                  <span className="row-label">Shipping</span>
                  <span className="row-val">Free</span>
                </div>
                <div className="flowstep-summary-row">
                  <span className="row-label">Estimated tax</span>
                  <span className="row-val">${tax.toFixed(2)}</span>
                </div>
                <div className="flowstep-summary-total-row">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isEmpty}
                className="flowstep-btn-primary flowstep-checkout-btn"
                onClick={() => navigate("checkout")}
              >
                Proceed to checkout
              </button>

              <div className="flowstep-payment-methods">
                <p className="payment-methods-title">Payment methods</p>
                <div className="payment-badges-row">
                  <span>VISA</span>
                  <span>Mastercard</span>
                  <span>Apple Pay</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flowstep-trust-strip">
            <div className="trust-item">
              <Icon name="shieldCheck" size={20} />
              <span>Secure checkout</span>
            </div>
            <div className="trust-divider" aria-hidden="true" />
            <div className="trust-item">
              <Icon name="rotateCcw" size={20} />
              <span>Easy 30-day returns</span>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function Checkout({ bag, navigate, onOrderPlaced }) {
  const promotion = useSelector((state) => state.promotion);
  const { user } = useSelector((state) => state.auth);
  const [delivery, setDelivery] = useState("standard");
  const [notice, setNotice] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const subtotal = bag.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promotion === "AUREL10" ? subtotal * 0.1 : 0;
  const shipping = delivery === "express" ? 18 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shipping + tax;

  async function submitCheckout(event) {
    event.preventDefault();
    if (user?.role !== "customer") {
      setNotice("Sign in to a customer account before placing an order.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    setPlacingOrder(true);
    setNotice("");
    try {
      const { order } = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: bag.map((item) => ({ productId: item.id, quantity: item.quantity })),
          shippingAddress: {
            fullname: `${firstName} ${lastName}`.trim(),
            email: formData.get("email"),
            street: formData.get("street"),
            city: formData.get("city"),
            country: formData.get("country"),
            postalCode: formData.get("postalCode"),
          },
          shippingMethod: delivery,
          promotionCode: promotion || undefined,
        }),
      });
      setOrderConfirmation(order);
      onOrderPlaced?.();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  if (orderConfirmation) {
    return (
      <div className="checkout-page">
        <header className="checkout-header"><a className="wordmark" href="/" onClick={(event) => { event.preventDefault(); navigate("home"); }}>AUREL</a></header>
        <main className="checkout-shell">
          <section className="cart-empty">
            <span className="empty-preview-mark">A.</span>
            <p className="eyebrow section-eyebrow">ORDER CONFIRMED</p>
            <h1>Thank you for your order.</h1>
            <p>Order {orderConfirmation.orderNumber} has been placed. Payment is not collected by this demo.</p>
            <Button className="screen-button-dark" onClick={() => navigate("profile")}>View your account <Icon name="arrow" size={15} /></Button>
          </section>
        </main>
      </div>
    );
  }

  if (!bag.length) {
    return (
      <div className="checkout-page">
        <header className="checkout-header"><a className="wordmark" href="/" onClick={(event) => { event.preventDefault(); navigate("home"); }}>AUREL</a><button onClick={() => navigate("cart")} type="button"><Icon name="chevronRight" size={14} /> Back to bag</button></header>
        <main className="checkout-shell">
          <section className="cart-empty">
            <span className="empty-preview-mark">A.</span>
            <h1>Your bag is waiting.</h1>
            <p>Add something thoughtful before checking out.</p>
            <Button className="screen-button-dark" onClick={() => navigate("accessories")}>Continue shopping <Icon name="arrow" size={15} /></Button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header"><a className="wordmark" href="/" onClick={(event) => { event.preventDefault(); navigate("home"); }}>AUREL</a><button onClick={() => navigate("cart")} type="button"><Icon name="chevronRight" size={14} /> Back to bag</button></header>
      <main className="checkout-shell">
        <div className="checkout-main">
          <nav aria-label="Checkout progress" className="checkout-progress">
            {[["1", "Delivery"], ["2", "Payment"], ["3", "Review"]].map(([number, label], index) => (
              <div aria-current={index === 0 ? "step" : undefined} className={`checkout-step ${index === 0 ? "is-current" : ""}`} key={label}>
                <span>{number}</span>{label}
              </div>
            ))}
          </nav>
          <form className="checkout-form" onSubmit={submitCheckout}>
            <section className="checkout-section">
              <div className="checkout-section-heading"><div><p className="eyebrow section-eyebrow">01 / YOUR DETAILS</p><h2>Contact</h2></div><a href="/account" onClick={(event) => { event.preventDefault(); navigate("account"); }}>Sign in</a></div>
              <label className="form-field"><span>Email</span><input autoComplete="email" defaultValue={user?.email || ""} name="email" placeholder="you@example.com" required type="email" /></label>
              <p className="field-note">Order updates will be sent to this address.</p>
            </section>
            <section className="checkout-section">
              <div className="checkout-section-heading"><div><p className="eyebrow section-eyebrow">02 / WHERE TO</p><h2>Shipping address</h2></div></div>
              <div className="form-grid">
                <label className="form-field"><span>First name</span><input autoComplete="given-name" defaultValue={user?.fullname?.split(" ")[0] || ""} name="firstName" required /></label>
                <label className="form-field"><span>Last name</span><input autoComplete="family-name" defaultValue={user?.fullname?.split(" ").slice(1).join(" ") || ""} name="lastName" required /></label>
                <label className="form-field form-field-wide"><span>Address</span><input autoComplete="street-address" name="street" placeholder="House number and street name" required /></label>
                <label className="form-field"><span>City</span><input autoComplete="address-level2" name="city" required /></label>
                <label className="form-field"><span>Country</span><select autoComplete="country-name" defaultValue="United States" name="country"><option>United States</option><option>Canada</option><option>United Kingdom</option></select></label>
                <label className="form-field"><span>Postal code</span><input autoComplete="postal-code" name="postalCode" placeholder="Enter a valid postal code for delivery" required /></label>
              </div>
            </section>
            <section className="checkout-section delivery-section">
              <div className="checkout-section-heading"><div><p className="eyebrow section-eyebrow">03 / MAKE IT YOURS</p><h2>Delivery method</h2></div></div>
              <label className={`delivery-choice ${delivery === "standard" ? "is-selected" : ""}`}><input checked={delivery === "standard"} name="delivery" onChange={() => setDelivery("standard")} type="radio" /><span className="delivery-choice-copy"><strong>Standard</strong><small>Free · 3–5 business days</small></span><b>Free</b></label>
              <label className={`delivery-choice ${delivery === "express" ? "is-selected" : ""}`}><input checked={delivery === "express"} name="delivery" onChange={() => setDelivery("express")} type="radio" /><span className="delivery-choice-copy"><strong>Express</strong><small>$18 · 1–2 business days</small></span><b>$18</b></label>
            </section>
            <Button className="screen-button-dark checkout-continue" disabled={placingOrder} type="submit">{placingOrder ? "Placing order…" : "Place order · no payment"} <Icon name="arrow" size={16} /></Button>
          </form>
          {notice && <div className="checkout-notice" role="alert"><Icon name="lock" size={16} /><span>{notice} {user?.role !== "customer" && <button className="text-link" onClick={() => navigate("account")} type="button">Sign in</button>}</span><button aria-label="Dismiss message" onClick={() => setNotice("")} type="button"><Icon name="close" size={15} /></button></div>}
        </div>
        <aside className="checkout-summary">
          <p className="eyebrow section-eyebrow">AUREL / YOUR SELECTION</p>
          <h2>Order summary</h2>
          {bag.map((item) => <div className="checkout-product" key={item.id}><div className="checkout-product-image"><img alt="" src={item.image || vesselImage} /><span>{item.quantity}</span></div><div><strong>{item.name}</strong><small>{item.id === "serein-serum" ? "30 ml" : "Natural"}</small></div><b>${(item.price * item.quantity).toFixed(2)}</b></div>)}
          <div className="checkout-summary-lines"><div><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>{discount > 0 && <div><span>AUREL10 discount</span><span>−${discount.toFixed(2)}</span></div>}<div><span>Shipping</span><span>{shipping ? `$${shipping.toFixed(2)}` : "Free"}</span></div><div><span>Estimated tax</span><span>${tax.toFixed(2)}</span></div><div className="checkout-total"><strong>Total</strong><strong>${total.toFixed(2)}</strong></div></div>
          <p className="encrypted-note"><Icon name="lock" size={15} /> Demo checkout · no payment details collected</p>
        </aside>
      </main>
    </div>
  );
}

function AccountAccess({ navigate }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [tab, setTab] = useState("sign-in");
  const [showPassword, setShowPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [message, setMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setMessage(decodeURIComponent(err));
      setShowAlert(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  function handleGoogleLogin() {
    setGoogleLoading(true);
    const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
    window.location.href = `${apiBase}/auth/google`;
  }

  function submitAccount(event) {
    event.preventDefault();
    setShowAlert(true);
    const form = new FormData(event.currentTarget);
    const credentials = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    };
    const phoneNo = String(form.get("phoneNo") || "").trim();
    const request = tab === "create-account"
      ? dispatch(registerAccount({
          ...credentials,
          fullname: String(form.get("fullname")),
          ...(phoneNo ? { phoneNo } : {}),
        }))
      : dispatch(loginAccount(credentials));
    dispatch(clearAuthError());
    setMessage("");
    request.then((result) => {
      if (loginAccount.fulfilled.match(result) || registerAccount.fulfilled.match(result)) {
        navigate("home");
      }
    });
  }

  return (
    <main className="account-access">
      <section className="account-editorial">
        <img alt="A warm editorial still life" src={editorialImage} />
        <div className="account-editorial-wash" />
        <a className="account-wordmark" href="/" onClick={(event) => { event.preventDefault(); navigate("home"); }}>AUREL</a>
        <div className="account-editorial-copy"><p>WELCOME TO AUREL</p><h1>Make room for<br />the considered.</h1><span>Thoughtful essentials for a life with more intention.</span></div>
        <span className="account-editorial-index">01 — AUREL / EST. 2024</span>
      </section>
      <section className="account-form-side">
        <div className="account-card">
          <div aria-label="Account options" className="account-tabs" role="group">
            <button aria-pressed={tab === "sign-in"} onClick={() => { setTab("sign-in"); setMessage(""); setShowAlert(true); dispatch(clearAuthError()); }} type="button">Sign in</button>
            <button aria-pressed={tab === "create-account"} onClick={() => { setTab("create-account"); setMessage(""); setShowAlert(true); dispatch(clearAuthError()); }} type="button">Create account</button>
          </div>
          <p className="eyebrow section-eyebrow">{tab === "sign-in" ? "A GOOD THING TO RETURN TO" : "A GOOD PLACE TO BEGIN"}</p>
          <h2>{tab === "sign-in" ? "Welcome back" : "Create your account"}</h2>
          <p className="account-intro">{tab === "sign-in" ? "Pick up right where you left off." : "A little more considered, from here on."}</p>
          <form className="account-form" onSubmit={submitAccount}>
            {tab === "create-account" && <label className="account-field"><span>Your name</span><input autoComplete="name" name="fullname" placeholder="Maya Patel" required /></label>}
            {tab === "create-account" && <label className="account-field"><span>Phone number <small>(optional)</small></span><input autoComplete="tel" maxLength={20} minLength={10} name="phoneNo" placeholder="+1 555 123 4567" type="tel" /></label>}
            <label className="account-field"><span>Email</span><input autoComplete="email" name="email" placeholder="you@example.com" required type="email" /></label>
            <label className="account-field"><span>Password</span><span className="password-input"><input autoComplete={tab === "sign-in" ? "current-password" : "new-password"} minLength={8} name="password" required type={showPassword ? "text" : "password"} /><button aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? "Hide" : "Show"}</button></span></label>
            <Button className="screen-button-dark account-submit" disabled={status === "loading" || googleLoading} type="submit">{status === "loading" ? "Please wait…" : tab === "sign-in" ? "Sign in" : "Create account"} <Icon name="arrow" size={15} /></Button>
          </form>
          <div className="account-divider"><span />or continue with<span /></div>
          <Button className="google-button" disabled={googleLoading} onClick={handleGoogleLogin} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 8, flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {googleLoading ? "Signing in with Google…" : "Continue with Google"}
          </Button>
          {tab === "sign-in" && <a className="forgot-link" href="#forgot-password" onClick={(event) => { event.preventDefault(); setMessage("Password reset is not connected in this demo. No email was sent."); }}>Forgot password?</a>}
          {showAlert && (error || message) && <div className="account-alert" role="status"><span>{error || message}</span><button aria-label="Dismiss alert" onClick={() => { setShowAlert(false); setMessage(""); dispatch(clearAuthError()); }} type="button"><Icon name="close" size={15} /></button></div>}
          <p className="account-switch">{tab === "sign-in" ? "New to AUREL?" : "Already have an account?"} <button onClick={() => { setTab(tab === "sign-in" ? "create-account" : "sign-in"); setMessage(""); setShowAlert(true); dispatch(clearAuthError()); }} type="button">{tab === "sign-in" ? "Create an account" : "Sign in"}</button></p>
          <a className="owner-signin" href="/owner" onClick={(event) => { event.preventDefault(); navigate("owner"); }}>Owner workspace preview <Icon name="arrow" size={13} /></a>
        </div>
      </section>
    </main>
  );
}

function CustomerProfile({ navigate, favorites, onLogout, products, toggleFavorite, addToBag }) {
  const dispatch = useDispatch();
  const { user, error } = useSelector((state) => state.auth);
  const [section, setSection] = useState("Profile");
  const [preferences, setPreferences] = useState(user?.preferences || { earlyAccess: true, journalNotes: false });
  const [editing, setEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [name, setName] = useState(user?.fullname || "");
  const [phoneNo, setPhoneNo] = useState(user?.phoneNo || "");
  const [address, setAddress] = useState(user?.addresses?.[0] || {
    recipient: user?.fullname || "",
    street: "",
    city: "",
    country: "United States",
    postalCode: "",
    isDefault: true,
  });
  const [orders, setOrders] = useState([]);
  const [profileMessage, setProfileMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const displayName = name || user?.fullname || "Customer";
  const sections = ["Profile", "Orders", "Addresses", "Wishlist"];

  useEffect(() => {
    apiRequest("/orders")
      .then(({ orders: customerOrders }) => setOrders(customerOrders || []))
      .catch((requestError) => setProfileMessage(requestError.message));
  }, []);

  // Time-based luxury greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  async function saveProfile(updates) {
    setSaving(true);
    setProfileMessage("");
    try {
      const { user: savedUser } = await apiRequest("/users/profile", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      dispatch(updateAuthenticatedUser(savedUser));
      setName(savedUser.fullname);
      if (savedUser.phoneNo !== undefined) setPhoneNo(savedUser.phoneNo);
      setEditing(false);
      setEditingAddress(false);
      setProfileMessage("Your account details have been saved.");
    } catch (requestError) {
      setProfileMessage(requestError.message);
      dispatch(setAuthError(requestError.message));
    } finally {
      setSaving(false);
    }
  }

  async function changePreference(key, value) {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await saveProfile({ preferences: updated });
  }

  function saveAddress() {
    saveProfile({ addresses: [{ ...address, isDefault: true }] });
  }

  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "A";

  const memberDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently joined";

  // Demo fallback orders if database has none yet
  const displayOrders = orders.length > 0 ? orders : [
    {
      _id: "demo-1",
      orderNumber: "AUR-10482",
      createdAt: new Date("2024-06-12"),
      items: [{ quantity: 2 }],
      total: 341.28,
      status: "In transit",
      thumb: toteImage,
    },
    {
      _id: "demo-2",
      orderNumber: "AUR-10391",
      createdAt: new Date("2024-05-28"),
      items: [{ quantity: 1 }],
      total: 68.0,
      status: "Delivered",
      thumb: serumImage,
    },
  ];

  return (
    <main className="page-shell flowstep-profile-shell">
      {/* Top Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flowstep-breadcrumb">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate("home"); }}>
          Home
        </a>
        <span className="crumb-chevron" aria-hidden="true">&gt;</span>
        <span className="crumb-current">Account</span>
      </nav>

      {/* Header Banner */}
      <div className="flowstep-profile-header">
        <div className="flowstep-profile-header-text">
          <h1 className="flowstep-profile-title">{`${greeting}, ${displayName.split(" ")[0]}`}</h1>
          <p className="flowstep-profile-subtitle">Manage your account and keep track of your orders.</p>
        </div>
        <button
          type="button"
          className="flowstep-signout-btn"
          onClick={onLogout}
        >
          Sign out <Icon name="arrow" size={14} />
        </button>
      </div>

      {error && <div className="account-alert" role="status"><span>{error}</span></div>}
      {profileMessage && <div className="account-alert" role="status"><span>{profileMessage}</span></div>}

      {/* 2-Column Responsive Layout */}
      <div className="flowstep-profile-grid">
        {/* Left Sidebar Card */}
        <aside aria-label="Account navigation" className="flowstep-profile-sidebar-card">
          <div className="flowstep-sidebar-user-block">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={displayName}
                className="flowstep-sidebar-avatar-img"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flowstep-sidebar-avatar-initials">{userInitials}</div>
            )}
            <div className="flowstep-sidebar-user-meta">
              <strong className="flowstep-sidebar-name">{displayName}</strong>
              <small className="flowstep-sidebar-badge">Customer account</small>
            </div>
          </div>

          <nav className="flowstep-sidebar-nav">
            <button
              type="button"
              className={`flowstep-nav-tab ${section === "Profile" ? "is-active" : ""}`}
              onClick={() => setSection("Profile")}
            >
              <div className="flowstep-tab-left">
                <Icon name="account" size={18} />
                <span>Profile</span>
              </div>
              <Icon name="chevronRight" size={14} className="flowstep-tab-arrow" />
            </button>

            <button
              type="button"
              className={`flowstep-nav-tab ${section === "Orders" ? "is-active" : ""}`}
              onClick={() => setSection("Orders")}
            >
              <div className="flowstep-tab-left">
                <Icon name="package" size={18} />
                <span>Orders</span>
              </div>
              {orders.length > 0 && <span className="flowstep-tab-count">{orders.length}</span>}
              <Icon name="chevronRight" size={14} className="flowstep-tab-arrow" />
            </button>

            <button
              type="button"
              className={`flowstep-nav-tab ${section === "Addresses" ? "is-active" : ""}`}
              onClick={() => setSection("Addresses")}
            >
              <div className="flowstep-tab-left">
                <Icon name="location" size={18} />
                <span>Addresses</span>
              </div>
              <Icon name="chevronRight" size={14} className="flowstep-tab-arrow" />
            </button>

            <button
              type="button"
              className={`flowstep-nav-tab ${section === "Wishlist" ? "is-active" : ""}`}
              onClick={() => setSection("Wishlist")}
            >
              <div className="flowstep-tab-left">
                <Icon name="heart" size={18} />
                <span>Wishlist</span>
              </div>
              {favorites.length > 0 && <span className="flowstep-tab-count">{favorites.length}</span>}
              <Icon name="chevronRight" size={14} className="flowstep-tab-arrow" />
            </button>
          </nav>
        </aside>

        {/* Right Main Content */}
        <div className="flowstep-profile-main-col">
          {section === "Profile" && (
            <>
              {/* Profile Card */}
              <section className="flowstep-card flowstep-profile-details-card">
                <div className="flowstep-card-header-row">
                  <div>
                    <p className="flowstep-section-eyebrow">YOUR DETAILS</p>
                    <h2 className="flowstep-section-heading">Profile</h2>
                  </div>
                  {editing ? (
                    <div className="flowstep-card-actions">
                      <button
                        type="button"
                        className="flowstep-btn-secondary"
                        onClick={() => {
                          setName(user?.fullname || "");
                          setPhoneNo(user?.phoneNo || "");
                          setEditing(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        className="flowstep-btn-primary"
                        onClick={() => saveProfile({ fullname: name.trim(), phoneNo: phoneNo.trim() })}
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flowstep-btn-secondary"
                      onClick={() => setEditing(true)}
                    >
                      Edit profile
                    </button>
                  )}
                </div>

                <div className="flowstep-user-detail-row">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={displayName}
                      className="flowstep-main-avatar-img"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flowstep-main-avatar-circle">{userInitials}</div>
                  )}

                  <div className="flowstep-user-detail-info">
                    {editing ? (
                      <div className="flowstep-edit-form">
                        <label className="flowstep-field-label">
                          <span>Full name</span>
                          <input
                            type="text"
                            className="flowstep-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                          />
                        </label>
                        <label className="flowstep-field-label">
                          <span>Phone number</span>
                          <input
                            type="tel"
                            className="flowstep-input"
                            value={phoneNo}
                            onChange={(e) => setPhoneNo(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                          />
                        </label>
                      </div>
                    ) : (
                      <>
                        <h3 className="flowstep-user-name">{displayName}</h3>
                        <p className="flowstep-user-email">{user?.email}</p>
                        {user?.phoneNo && <p className="flowstep-user-phone">{user.phoneNo}</p>}
                        <p className="flowstep-user-member-since">Member since {memberDate}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flowstep-card-divider" />

                {/* Preferences Section */}
                <div className="flowstep-preferences-block">
                  <p className="flowstep-section-eyebrow">A NOTE FROM US</p>
                  <h3 className="flowstep-preferences-title">Your preferences</h3>

                  <div className="flowstep-preference-list">
                    <label className="flowstep-toggle-row">
                      <div className="flowstep-toggle-info">
                        <strong>Early access to edits</strong>
                        <span>Be first to discover new collections.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.earlyAccess}
                        onChange={(e) => changePreference("earlyAccess", e.target.checked)}
                        className="flowstep-switch-input"
                      />
                      <span className="flowstep-switch-slider" aria-hidden="true" />
                    </label>

                    <label className="flowstep-toggle-row">
                      <div className="flowstep-toggle-info">
                        <strong>Journal notes</strong>
                        <span>Receive thoughtful notes from AUREL.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.journalNotes}
                        onChange={(e) => changePreference("journalNotes", e.target.checked)}
                        className="flowstep-switch-input"
                      />
                      <span className="flowstep-switch-slider" aria-hidden="true" />
                    </label>
                  </div>
                </div>
              </section>

              {/* Recent Orders Preview Card */}
              <section className="flowstep-card flowstep-orders-preview-card">
                <div className="flowstep-card-header-row">
                  <div>
                    <p className="flowstep-section-eyebrow">YOUR PURCHASES</p>
                    <h2 className="flowstep-section-heading">Recent orders</h2>
                  </div>
                  <button
                    type="button"
                    className="flowstep-text-link-btn"
                    onClick={() => setSection("Orders")}
                  >
                    View all <Icon name="arrow" size={13} />
                  </button>
                </div>

                <div className="flowstep-order-cards-list">
                  {displayOrders.slice(0, 2).map((order) => (
                    <div className="flowstep-order-row-card" key={order._id}>
                      <img
                        src={order.thumb || toteImage}
                        alt="Order thumbnail"
                        className="flowstep-order-thumb"
                      />
                      <div className="flowstep-order-col-id">
                        <strong>{order.orderNumber}</strong>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flowstep-order-col-items">
                        <span>
                          {order.items?.reduce((c, i) => c + (i.quantity || 1), 0) || 1}{" "}
                          {order.items?.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <div className="flowstep-order-col-total">
                        <strong>${Number(order.total).toFixed(2)}</strong>
                      </div>
                      <div className="flowstep-order-col-status">
                        <span className={`flowstep-status-chip status-${(order.status || "In transit").toLowerCase().replace(/\s+/g, "-")}`}>
                          <Icon name="package" size={14} />
                          <span>{order.status || "In transit"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Wishlist Preview Card */}
              <section className="flowstep-card flowstep-wishlist-preview-card">
                <div className="flowstep-wishlist-preview-left">
                  <div className="flowstep-wishlist-icon-circle">
                    <Icon name="heart" size={20} />
                  </div>
                  <div>
                    <p className="flowstep-section-eyebrow">KEPT CLOSE</p>
                    <h3 className="flowstep-wishlist-preview-title">Your wishlist</h3>
                    <p className="flowstep-wishlist-preview-desc">
                      {favorites.length > 0
                        ? `${favorites.length} saved piece${favorites.length === 1 ? "" : "s"} waiting for you.`
                        : "Your saved pieces will appear here."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flowstep-btn-primary"
                  onClick={() => (favorites.length ? setSection("Wishlist") : navigate("accessories"))}
                >
                  {favorites.length ? "View wishlist" : "Browse the edit"}{" "}
                  <Icon name="arrow" size={14} />
                </button>
              </section>
            </>
          )}

          {section === "Orders" && (
            <section className="flowstep-card flowstep-full-orders-card">
              <div className="flowstep-card-header-row">
                <div>
                  <p className="flowstep-section-eyebrow">YOUR PURCHASES</p>
                  <h2 className="flowstep-section-heading">All orders</h2>
                </div>
              </div>

              {displayOrders.length > 0 ? (
                <div className="flowstep-order-cards-list">
                  {displayOrders.map((order) => (
                    <div className="flowstep-order-row-card" key={order._id}>
                      <img
                        src={order.thumb || toteImage}
                        alt="Order thumbnail"
                        className="flowstep-order-thumb"
                      />
                      <div className="flowstep-order-col-id">
                        <strong>{order.orderNumber}</strong>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flowstep-order-col-items">
                        <span>
                          {order.items?.reduce((c, i) => c + (i.quantity || 1), 0) || 1}{" "}
                          {order.items?.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <div className="flowstep-order-col-total">
                        <strong>${Number(order.total).toFixed(2)}</strong>
                      </div>
                      <div className="flowstep-order-col-status">
                        <span className={`flowstep-status-chip status-${(order.status || "In transit").toLowerCase().replace(/\s+/g, "-")}`}>
                          <Icon name="package" size={14} />
                          <span>{order.status || "In transit"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flowstep-empty-tab-panel">
                  <Icon name="package" size={32} />
                  <p>You have not placed an order yet.</p>
                  <button
                    type="button"
                    className="flowstep-btn-primary"
                    onClick={() => navigate("home")}
                  >
                    Discover the collection
                  </button>
                </div>
              )}
            </section>
          )}

          {section === "Addresses" && (
            <section className="flowstep-card flowstep-addresses-card">
              <div className="flowstep-card-header-row">
                <div>
                  <p className="flowstep-section-eyebrow">WHERE TO</p>
                  <h2 className="flowstep-section-heading">Your addresses</h2>
                </div>
                {!editingAddress && (
                  <button
                    type="button"
                    className="flowstep-btn-secondary"
                    onClick={() => setEditingAddress(true)}
                  >
                    Edit address
                  </button>
                )}
              </div>

              {editingAddress ? (
                <div className="flowstep-address-edit-box">
                  <div className="flowstep-address-form-grid">
                    <label className="flowstep-field-label">
                      <span>Recipient</span>
                      <input
                        className="flowstep-input"
                        value={address.recipient}
                        onChange={(e) => setAddress((cur) => ({ ...cur, recipient: e.target.value }))}
                      />
                    </label>
                    <label className="flowstep-field-label">
                      <span>Street address</span>
                      <input
                        className="flowstep-input"
                        value={address.street}
                        onChange={(e) => setAddress((cur) => ({ ...cur, street: e.target.value }))}
                      />
                    </label>
                    <label className="flowstep-field-label">
                      <span>City</span>
                      <input
                        className="flowstep-input"
                        value={address.city}
                        onChange={(e) => setAddress((cur) => ({ ...cur, city: e.target.value }))}
                      />
                    </label>
                    <label className="flowstep-field-label">
                      <span>Postal code</span>
                      <input
                        className="flowstep-input"
                        value={address.postalCode}
                        onChange={(e) => setAddress((cur) => ({ ...cur, postalCode: e.target.value }))}
                      />
                    </label>
                    <label className="flowstep-field-label">
                      <span>Country</span>
                      <input
                        className="flowstep-input"
                        value={address.country}
                        onChange={(e) => setAddress((cur) => ({ ...cur, country: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="flowstep-card-actions mt-4">
                    <button
                      type="button"
                      className="flowstep-btn-secondary"
                      onClick={() => setEditingAddress(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      className="flowstep-btn-primary"
                      onClick={saveAddress}
                    >
                      {saving ? "Saving…" : "Save address"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flowstep-address-display-card">
                  <div className="flowstep-address-badge-row">
                    <span className="flowstep-default-chip">Default delivery address</span>
                  </div>
                  <h3 className="flowstep-address-recipient">{address.recipient || displayName}</h3>
                  <p className="flowstep-address-lines">
                    {address.street ? `${address.street}, ` : "124 Mercer St, Suite 4B, "}
                    {address.city ? `${address.city}, ` : "New York, NY "}
                    {address.postalCode || "10012"}
                  </p>
                  <p className="flowstep-address-country">{address.country || "United States"}</p>
                </div>
              )}
            </section>
          )}

          {section === "Wishlist" && (
            <section className="flowstep-card flowstep-wishlist-full-card">
              <div className="flowstep-card-header-row">
                <div>
                  <p className="flowstep-section-eyebrow">KEPT CLOSE</p>
                  <h2 className="flowstep-section-heading">Wishlist</h2>
                </div>
              </div>

              {favorites.length > 0 ? (
                <div className="flowstep-wishlist-items-grid">
                  {products
                    .filter((p) => favorites.includes(p.id))
                    .map((item) => (
                      <article className="flowstep-wishlist-product-card" key={item.id}>
                        <div
                          className="flowstep-wishlist-thumb-wrap"
                          onClick={() => navigate("product", item.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <img src={item.image || vesselImage} alt={item.name} />
                        </div>
                        <div className="flowstep-wishlist-card-body">
                          <p className="flowstep-wishlist-cat">{item.category}</p>
                          <h4
                            className="flowstep-wishlist-name"
                            onClick={() => navigate("product", item.id)}
                            style={{ cursor: "pointer" }}
                          >
                            {item.name}
                          </h4>
                          <span className="flowstep-wishlist-price">${Number(item.price).toFixed(2)}</span>
                          <div className="flowstep-wishlist-actions-row">
                            <button
                              type="button"
                              className="flowstep-btn-primary flowstep-btn-sm"
                              onClick={() => addToBag && addToBag(item)}
                            >
                              Add to bag
                            </button>
                            <button
                              type="button"
                              className="flowstep-btn-secondary flowstep-btn-sm"
                              onClick={() => toggleFavorite(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              ) : (
                <div className="flowstep-empty-tab-panel">
                  <Icon name="heart" size={32} />
                  <p>Your wishlist is currently empty.</p>
                  <button
                    type="button"
                    className="flowstep-btn-primary"
                    onClick={() => navigate("accessories")}
                  >
                    Browse the edit
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function PreferenceRow({ title, description, checked, onChange }) {
  return <label className="preference-row"><span><strong>{title}</strong><small>{description}</small></span><input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" /><i aria-hidden="true" /></label>;
}

function OrderHistory({ orders = [] }) {
  return (
    <div className="order-history">
      {orders.length ? orders.map((order) => <article key={order._id}><span className="order-icon"><Icon name="package" size={18} /></span><div className="order-history-info"><strong>{order.orderNumber}</strong><span>{new Date(order.createdAt).toLocaleDateString()} · {order.items.reduce((count, item) => count + item.quantity, 0)} items</span></div><b>${Number(order.total).toFixed(2)}</b><span className={`order-status order-${order.status.toLowerCase()}`}>{order.status}</span><span /></article>) : <p>{orders === null ? "Loading your orders…" : "You have not placed an order yet."}</p>}
    </div>
  );
}

const adminNav = [
  ["Dashboard", "dashboard", "/owner"],
  ["Products", "boxes", "/owner/products"],
  ["Inventory", "package", "/owner/inventory"],
  ["Orders", "bag", "/owner/orders"],
  ["Customers", "account", "/owner/customers"],
  ["Settings", "sliders", null],
];

function OwnerShell({ page, navigate, children, user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const routePages = {
    "/owner": "owner",
    "/owner/products": "ownerProducts",
    "/owner/inventory": "ownerInventory",
    "/owner/orders": "ownerOrders",
    "/owner/customers": "ownerCustomers",
  };
  const currentLabel = adminNav.find(([, , path]) => path === page)?.[0] || "Dashboard";
  return (
    <div className="owner-shell">
      {mobileMenuOpen && (
        <div
          className="owner-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`owner-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
        <div className="owner-sidebar-top-row">
          <a
            className="owner-logo"
            href="/owner"
            onClick={(event) => {
              event.preventDefault();
              setMobileMenuOpen(false);
              navigate("owner");
            }}
          >
            AUREL
            <span>Owner workspace</span>
          </a>
          <button
            type="button"
            className="owner-close-menu-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <p className="owner-nav-label">WORKSPACE</p>
        <nav aria-label="Owner navigation">
          {adminNav.map(([label, icon, path]) => (
            <button
              aria-current={path && page === path ? "page" : undefined}
              className={path && page === path ? "is-active" : ""}
              disabled={!path}
              key={label}
              onClick={() => {
                if (path) {
                  setMobileMenuOpen(false);
                  navigate(routePages[path]);
                }
              }}
              title={path ? undefined : `${label} is not available yet`}
              type="button"
            >
              <Icon name={icon} size={17} />
              {label}
              {path && page === path && <span />}
            </button>
          ))}
        </nav>

        <div className="owner-sidebar-bottom">
          <span className="owner-avatar">
            {user?.picture ? (
              <img
                src={user.picture}
                alt=""
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                referrerPolicy="no-referrer"
              />
            ) : (
              (user?.fullname || "Owner").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
            )}
          </span>
          <span>
            <strong>{user?.fullname || "Store owner"}</strong>
            <small>{user?.role === "admin" ? "Owner Admin" : "Owner"}</small>
          </span>
          <button aria-label="Sign out" onClick={onLogout} type="button">
            ↗
          </button>
        </div>
      </aside>

      <div className="owner-workspace">
        <header className="owner-topbar">
          <div className="owner-topbar-left">
            <button
              type="button"
              className="owner-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open owner menu"
            >
              <Icon name="menu" size={20} />
            </button>
            <div className="owner-breadcrumbs">
              <span>Owner</span>
              <Icon name="chevronRight" size={13} />
              <b>{currentLabel}</b>
            </div>
          </div>
          <div className="owner-topbar-right">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); navigate("home"); }}
              className="owner-view-store-btn"
            >
              View store ↗
            </a>
            <button aria-label="Notifications are not available yet" disabled type="button">
              <Icon name="bell" size={18} />
              <i />
            </button>
          </div>
        </header>
        <main className="owner-main">{children}</main>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, icon, comparisonText = "vs. last month" }) {
  return <article className="metric-card"><div className="metric-card-top"><span>{label}</span><i><Icon name={icon} size={17} /></i></div><strong>{value}</strong><small><Icon name="trend" size={13} />{trend} <span>{comparisonText}</span></small></article>;
}

function RevenueChart({ range, revenue = [] }) {
  const maxValue = Math.max(1, ...revenue.map((item) => item.revenue));
  const points = revenue.map((item, index) => {
    const x = revenue.length < 2 ? 202 : (405 * index) / (revenue.length - 1);
    const y = 132 - (item.revenue / maxValue) * 124;
    return `${x},${y}`;
  }).join(" ");
  const fillPath = points ? `M${points.replaceAll(" ", " L")} L405 146 L0 146 Z` : "";
  return <div className="revenue-chart"><div className="chart-y-labels"><span>${Math.round(maxValue).toLocaleString()}</span><span>${Math.round(maxValue * .66).toLocaleString()}</span><span>${Math.round(maxValue * .33).toLocaleString()}</span><span>$0</span></div><svg aria-label={`Revenue overview, ${range}`} role="img" viewBox="0 0 405 146" preserveAspectRatio="none"><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9b815f" stopOpacity=".23" /><stop offset="100%" stopColor="#9b815f" stopOpacity="0" /></linearGradient></defs>{points && <><path d={fillPath} fill="url(#revenue-fill)" /><polyline fill="none" points={points} stroke="#8f7757" strokeWidth="2" vectorEffect="non-scaling-stroke" />{points.split(" ").map((point) => { const [cx, cy] = point.split(","); return <circle cx={cx} cy={cy} fill="#f8f7f4" key={point} r="3" stroke="#8f7757" strokeWidth="2" />; })}</>}</svg><div className="chart-x-labels">{revenue.map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>)}</div></div>;
}

function OwnerAccess({ navigate }) {
  const dispatch = useDispatch();
  const { error, status, user } = useSelector((state) => state.auth);
  const [bootstrap, setBootstrap] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    dispatch(clearAuthError());
    setMessage("");
    if (bootstrap) {
      try {
        await apiRequest("/owners/create", {
          method: "POST",
          body: JSON.stringify({ fullname: formData.get("fullname"), email, password }),
        });
      } catch (requestError) {
        setMessage(requestError.message);
        return;
      }
    }
    const result = await dispatch(loginOwnerAccount({ email, password }));
    if (loginOwnerAccount.fulfilled.match(result)) navigate("owner");
  }

  if (status === "loading" && user?.role === "owner") {
    return <main className="flowstep-owner-auth-page" aria-live="polite"><div className="flowstep-owner-auth-card"><p>Checking owner access…</p></div></main>;
  }

  return (
    <main className="flowstep-owner-auth-page">
      <div className="flowstep-owner-auth-card">
        <div className="flowstep-owner-header">
          <a
            className="flowstep-owner-wordmark"
            href="/"
            onClick={(event) => { event.preventDefault(); navigate("home"); }}
            aria-label="AUREL storefront home"
          >
            AUREL
          </a>
          <span className="flowstep-owner-badge">Owner Workspace</span>
          <h1 className="flowstep-owner-title">
            {bootstrap ? "Create store admin" : "Welcome back"}
          </h1>
          <p className="flowstep-owner-sub">
            {bootstrap
              ? "One-time setup for the initial administrator account."
              : "Sign in to manage your catalog, orders, and inventory."}
          </p>
        </div>

        <form className="flowstep-owner-form" onSubmit={submit}>
          {bootstrap && (
            <label className="flowstep-owner-field">
              <span>Your name</span>
              <input
                autoComplete="name"
                name="fullname"
                placeholder="Maya Patel"
                minLength={3}
                required
                className="flowstep-owner-input"
              />
            </label>
          )}

          <label className="flowstep-owner-field">
            <span>Email address</span>
            <input
              autoComplete="email"
              name="email"
              placeholder="owner@aurel.com"
              required
              type="email"
              className="flowstep-owner-input"
            />
          </label>

          <label className="flowstep-owner-field">
            <span>Password</span>
            <div className="flowstep-owner-password-wrap">
              <input
                autoComplete="current-password"
                minLength={8}
                name="password"
                placeholder="••••••••"
                required
                type={showPassword ? "text" : "password"}
                className="flowstep-owner-input"
              />
              <button
                type="button"
                className="flowstep-owner-show-pass-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button
            className="flowstep-owner-submit-btn"
            disabled={status === "loading"}
            type="submit"
          >
            {status === "loading"
              ? "Please wait…"
              : bootstrap
              ? "Create admin account"
              : "Sign in to workspace"}{" "}
            <Icon name="arrow" size={15} />
          </button>
        </form>

        {(error || message) && (
          <div className="flowstep-owner-alert" role="alert">
            <span>{message || error}</span>
          </div>
        )}

        <div className="flowstep-owner-footer-links">
          <button
            className="flowstep-owner-toggle-btn"
            onClick={() => {
              setBootstrap((value) => !value);
              setMessage("");
              dispatch(clearAuthError());
            }}
            type="button"
          >
            {bootstrap
              ? "Already have an owner account? Sign in"
              : "First local setup? Create the first admin"}
          </button>

          <a
            className="flowstep-owner-back-link"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigate("home");
            }}
          >
            ← Return to customer store
          </a>
        </div>
      </div>
    </main>
  );
}

function OwnerDashboard({ navigate, user, onLogout }) {
  const [range, setRange] = useState("30 days");
  const [dashboard, setDashboard] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    apiRequest(`/owners/dashboard?range=${encodeURIComponent(range)}`)
      .then((result) => {
        setDashboard(result);
        setLoadError("");
      })
      .catch((requestError) => setLoadError(requestError.message));
  }, [range]);

  function exportReport() {
    const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const report = [
      ["Metric", "Value"],
      ["Net revenue", dashboard?.metrics.revenue || 0],
      ["Orders", dashboard?.metrics.orders || 0],
      ["Customers", dashboard?.metrics.customers || 0],
      ["Products", dashboard?.metrics.products || 0],
    ].map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const downloadUrl = URL.createObjectURL(new Blob([report], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "aurel-store-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  return (
    <OwnerShell page="/owner" navigate={navigate} user={user} onLogout={onLogout}>
      <PageTitle eyebrow="STORE OVERVIEW" title={`Good morning, ${user?.fullname?.split(" ")[0] || "there"}`} description="Live overview of your store." action={<div className="owner-title-actions"><Button onClick={exportReport}><Icon name="download" size={15} />Export report</Button><Button className="screen-button-dark" onClick={() => navigate("ownerProducts")}><Icon name="plus" size={15} />Add product</Button></div>} />
      {loadError && <p className="account-alert" role="alert">{loadError}</p>}
      <div className="metrics-grid"><MetricCard icon="dollar" label="Net revenue" value={`$${Number(dashboard?.metrics.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} trend={`${range} total`} comparisonText="" /><MetricCard icon="cart" label="Orders" value={dashboard?.metrics.orders ?? "—"} trend={`${range} total`} comparisonText="" /><MetricCard icon="account" label="Customers" value={dashboard?.metrics.customers ?? "—"} trend="registered accounts" comparisonText="" /><MetricCard icon="boxes" label="Products" value={dashboard?.metrics.products ?? "—"} trend="active catalog" comparisonText="" /></div>
      <div className="analytics-grid">
        <section className="admin-card revenue-card"><div className="admin-card-heading"><div><h2>Revenue overview</h2><p>Revenue performance over time</p></div><div className="chart-tabs">{["7 days", "30 days", "12 months"].map((item) => <button aria-pressed={range === item} className={range === item ? "is-active" : ""} key={item} onClick={() => setRange(item)} type="button">{item}</button>)}</div></div><RevenueChart range={range} revenue={dashboard?.revenue || []} /><div className="chart-legend"><span /><b>Revenue</b><small>USD</small></div></section>
        <section className="admin-card category-card"><div className="admin-card-heading"><div><h2>Top categories</h2><p>Share of total sales</p></div><span aria-hidden="true">···</span></div>{(dashboard?.categories || []).length ? dashboard.categories.map((item, index) => <div className="category-progress" key={item.name}><div><span><i className={`category-dot category-dot-${index % 4}`} />{item.name}</span><b>{item.share}%</b></div><span className="progress-track"><i style={{ width: `${item.share}%` }} /></span></div>) : <p>No sales data for this period yet.</p>}</section>
      </div>
      <section className="admin-card recent-orders-card"><div className="admin-card-heading"><div><h2>Recent orders</h2><p>Your latest customer orders</p></div><button className="admin-link-button" onClick={() => navigate("ownerOrders")} type="button">View all <Icon name="chevronRight" size={14} /></button></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr>{["Order", "Customer", "Date", "Amount", "Status"].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{(dashboard?.recentOrders || []).map((order) => <tr key={order._id}><td><span className="order-number-dot" />{order.orderNumber}</td><td>{order.customer?.fullname || "Customer"}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>${Number(order.total).toFixed(2)}</td><td className={`status-cell status-${order.status.toLowerCase()}`}>{order.status}</td></tr>)}{dashboard && !dashboard.recentOrders.length && <tr><td colSpan="5">No orders have been placed yet.</td></tr>}</tbody></table></div></section>
      <button className="low-stock-banner" onClick={() => navigate("ownerInventory")} type="button"><span className="alert-icon"><Icon name="alert" size={17} /></span><span><strong>{dashboard?.lowStock ?? "—"} products are low in stock</strong><small>Active products with five or fewer units available.</small></span><span className="low-stock-action">Review inventory <Icon name="arrow" size={14} /></span></button>
    </OwnerShell>
  );
}

function OwnerProducts({ navigate, user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [menu, setMenu] = useState("");
  const [view, setView] = useState("list");
  const [dialog, setDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  async function reloadProducts() {
    setLoading(true);
    try {
      const { products: catalog } = await apiRequest("/owners/products");
      setItems(catalog.map(mapOwnerProduct));
      setLoadError("");
    } catch (requestError) {
      setLoadError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    apiRequest("/owners/products")
      .then(({ products: catalog }) => {
        setItems(catalog.map(mapOwnerProduct));
        setLoadError("");
      })
      .catch((requestError) => setLoadError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase()) && (category === "all" || item.category === category) && (status === "all" || item.status === status));
  const productCounts = {
    total: items.length,
    active: items.filter((item) => item.rawStatus === "Active").length,
    drafts: items.filter((item) => item.status === "Draft").length,
    archived: items.filter((item) => item.status === "Archived").length,
  };

  async function action(product, actionName) {
    if (actionName === "Edit") {
      setEditingItem(product);
      setDialog(true);
      setMenu("");
      return;
    }
    setMenu("");
    try {
      if (actionName === "Delete") {
        await apiRequest(`/owners/products/${product.id}`, { method: "DELETE" });
      } else if (actionName === "Duplicate") {
        await apiRequest("/owners/products", {
          method: "POST",
          body: JSON.stringify({ name: `${product.name} (copy)`, category: product.category, price: product.price, stock: 0, image: product.image, status: "Draft" }),
        });
      } else if (actionName === "Archive") {
        await apiRequest(`/owners/products/${product.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "Archived" }),
        });
      }
      await reloadProducts();
    } catch (requestError) {
      setLoadError(requestError.message);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const nameInput = form.elements.namedItem("name");
    const productName = nameInput.value.trim();
    if (!productName) {
      nameInput.setCustomValidity("Enter a product name.");
      nameInput.reportValidity();
      return;
    }
    nameInput.setCustomValidity("");
    const formData = new FormData(form);
    const body = {
      name: productName,
      category: String(formData.get("category")),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock") || 0),
      status: String(formData.get("status")),
      image: String(formData.get("image") || ""),
    };
    setSaving(true);
    try {
      await apiRequest(
        editingItem ? `/owners/products/${editingItem.id}` : "/owners/products",
        { method: editingItem ? "PATCH" : "POST", body: JSON.stringify(body) }
      );
      await reloadProducts();
      setDialog(false);
    } catch (requestError) {
      setLoadError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!dialog) return undefined;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector("input")?.focus();
    function handleDialogKeyDown(event) {
      if (event.key === "Escape") {
        setDialog(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled)")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [dialog]);

  return (
    <OwnerShell page="/owner/products" navigate={navigate} user={user} onLogout={onLogout}>
      <PageTitle eyebrow="YOUR CATALOG" title="Products" description="Manage your catalog, pricing and availability." action={<Button className="screen-button-dark" onClick={() => { setEditingItem(null); setDialog(true); }}><Icon name="plus" size={15} />Add product</Button>} />
      {loadError && <p className="account-alert" role="alert">{loadError}</p>}
      <div className="product-kpis">{[["Total products", productCounts.total], ["Active", productCounts.active], ["Drafts", productCounts.drafts], ["Archived", productCounts.archived]].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>
      <section className="admin-card product-management-card">
        <div className="product-management-toolbar"><label className="admin-search"><Icon name="search" size={16} /><input aria-label="Search products" onChange={(event) => setSearch(event.target.value)} placeholder="Search products" value={search} /></label><select aria-label="Filter by category" onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">All categories</option>{[...new Set(items.map((item) => item.category))].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">All status</option><option>Active</option><option>Low stock</option><option>Draft</option><option>Archived</option></select><div className="admin-view-toggle"><button aria-label="List view" aria-pressed={view === "list"} className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} type="button"><Icon name="list" size={15} /></button><button aria-label="Grid view" aria-pressed={view === "grid"} className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} type="button"><Icon name="grid" size={15} /></button></div></div>
        {loading && <p aria-live="polite">Loading products…</p>}
        {!loading && view === "list" && (
          <div className="admin-table-scroll">
            <table className="admin-table management-table">
              <thead><tr>{["Product", "Category", "Price", "Stock", "Status", "Updated", ""].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
              <tbody>
                {filtered.length ? filtered.map((item) => (
                  <tr key={item.id}>
                    <td><div className="management-product"><span className="management-thumb">{item.image ? <img alt="" src={item.image} /> : item.initials}</span><strong>{item.name}</strong></div></td>
                    <td>{item.category}</td><td>${item.price}</td><td>{item.stock}</td>
                    <td><span className={`admin-status status-pill-${item.status.toLowerCase().replace(" ", "-")}`}><i />{item.status}</span></td>
                    <td>{item.updated}</td>
                    <td className="row-menu-cell">
                      <button aria-label={`Actions for ${item.name}`} onClick={() => setMenu(menu === item.id ? "" : item.id)} type="button"><Icon name="more" size={17} /></button>
                      {menu === item.id && <div className="row-action-menu">{["Edit", "Duplicate", "Archive", "Delete"].map((entry) => <button className={entry === "Delete" ? "is-danger" : ""} key={entry} onClick={() => action(item, entry)} type="button">{entry}</button>)}</div>}
                    </td>
                  </tr>
                )) : <tr><td colSpan="7">No products match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {!loading && view === "grid" && (
          <div className="management-grid">
            {filtered.length ? filtered.map((item) => (
              <article key={item.id}>
                <button aria-label={`Actions for ${item.name}`} className="management-grid-menu-button" onClick={() => setMenu(menu === item.id ? "" : item.id)} type="button"><Icon name="more" size={17} /></button>
                {menu === item.id && <div className="row-action-menu">{["Edit", "Duplicate", "Archive", "Delete"].map((entry) => <button className={entry === "Delete" ? "is-danger" : ""} key={entry} onClick={() => action(item, entry)} type="button">{entry}</button>)}</div>}
                <div className="management-grid-image">{item.image ? <img alt="" src={item.image} /> : item.initials}</div>
                <span className={`admin-status status-pill-${item.status.toLowerCase().replace(" ", "-")}`}><i />{item.status}</span>
                <h2>{item.name}</h2><p>{item.category} · ${item.price}</p>
              </article>
            )) : <p>No products match these filters.</p>}
          </div>
        )}
        <div className="management-pagination"><span>Showing {filtered.length ? 1 : 0}–{filtered.length} of {items.length} products</span></div>
      </section>
      {dialog && <div className="screen-modal-backdrop" onClick={() => setDialog(false)}><form aria-labelledby="product-dialog-title" aria-modal="true" className="screen-modal" onClick={(event) => event.stopPropagation()} onSubmit={saveProduct} ref={dialogRef} role="dialog"><button aria-label="Close dialog" className="modal-close" onClick={() => setDialog(false)} type="button"><Icon name="close" size={18} /></button><p className="eyebrow section-eyebrow">YOUR COLLECTION</p><h2 id="product-dialog-title">{editingItem ? "Edit product" : "Add a product"}</h2><label>Product name<input defaultValue={editingItem?.name || ""} name="name" onInput={(event) => event.currentTarget.setCustomValidity("")} placeholder="A thoughtful new thing" required /></label><label>Category<input defaultValue={editingItem?.category || "Accessories"} name="category" required /></label><label>Price<input defaultValue={editingItem?.price ?? ""} min="0" name="price" placeholder="0.00" required type="number" /></label><label>Stock<input defaultValue={editingItem?.stock ?? 0} min="0" name="stock" required type="number" /></label><label>Status<select defaultValue={editingItem?.rawStatus || "Active"} name="status"><option>Active</option><option>Draft</option><option>Archived</option></select></label><label>Image URL<input defaultValue={editingItem?.image || ""} name="image" type="url" /></label><Button className="screen-button-dark" disabled={saving} type="submit">{saving ? "Saving…" : editingItem ? "Save changes" : "Save product"}</Button></form></div>}
    </OwnerShell>
  );
}

function OwnerOrders({ navigate, user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/owners/orders")
      .then(({ orders: result }) => setOrders(result))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function updateOrder(orderId, status) {
    setError("");
    try {
      const { order } = await apiRequest(`/owners/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((item) => item._id === orderId ? order : item));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <OwnerShell page="/owner/orders" navigate={navigate} user={user} onLogout={onLogout}>
      <PageTitle eyebrow="STORE OPERATIONS" title="Orders" description="Review customer purchases and keep order status up to date." />
      {error && <p className="account-alert" role="alert">{error}</p>}
      <section className="admin-card product-management-card">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr>{["Order", "Customer", "Date", "Items", "Total", "Status"].map((item) => <th key={item}>{item}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6">Loading orders…</td></tr> : orders.length ? orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.customer?.fullname || "Customer"}<small>{order.customer?.email}</small></td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>{order.items.reduce((count, item) => count + item.quantity, 0)}</td>
                  <td>${Number(order.total).toFixed(2)}</td>
                  <td><select aria-label={`Update status for ${order.orderNumber}`} onChange={(event) => updateOrder(order._id, event.target.value)} value={order.status}><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td>
                </tr>
              )) : <tr><td colSpan="6">No orders have been placed yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </OwnerShell>
  );
}

function OwnerCustomers({ navigate, user, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/owners/customers")
      .then(({ customers: result }) => setCustomers(result || []))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter((c) =>
    `${c.fullname} ${c.email}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <OwnerShell page="/owner/customers" navigate={navigate} user={user} onLogout={onLogout}>
      <PageTitle eyebrow="YOUR COMMUNITY" title="Customers" description={`${customers.length} registered customer${customers.length === 1 ? "" : "s"}.`} />
      {error && <p className="account-alert" role="alert">{error}</p>}
      <section className="admin-card product-management-card">
        <div className="product-management-toolbar">
          <div className="admin-search">
            <Icon name="search" size={15} />
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr>{["Customer", "Joined", "Orders", "Lifetime spend"].map((item) => <th key={item}>{item}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="4">Loading customers…</td></tr> : filteredCustomers.length ? filteredCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {customer.picture ? (
                        <img
                          src={customer.picture}
                          alt=""
                          style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span style={{
                          display: "grid",
                          width: 34,
                          height: 34,
                          placeItems: "center",
                          borderRadius: "50%",
                          background: "#e8e4dc",
                          color: "#5c5548",
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          {(customer.fullname || "C").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <strong>{customer.fullname}</strong>
                        <small>{customer.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}</td>
                  <td>{customer.orders}</td>
                  <td>${Number(customer.spent).toFixed(2)}</td>
                </tr>
              )) : <tr><td colSpan="4">{search ? "No matching customers found." : "No customer accounts yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </OwnerShell>
  );
}

function OwnerInventory({ navigate, user, onLogout }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [toast, setToast] = useState(false);
  const [restockingId, setRestockingId] = useState("");
  useEffect(() => {
    apiRequest("/owners/products")
      .then(({ products }) => setRows(products.map((product) => ({
        ...product,
        id: product._id,
        sku: product.sku || product._id.slice(-8).toUpperCase(),
        onHand: product.stock,
        reserved: 0,
        reorder: product.reorderPoint ?? 10,
      }))))
      .catch((requestError) => setLoadError(requestError.message))
      .finally(() => setLoading(false));
  }, []);
  const filteredRows = rows.filter((row) => {
    const available = row.onHand - row.reserved;
    const status = row.onHand === 0 ? "Out of stock" : available <= row.reorder ? "Low stock" : "Healthy";
    return `${row.sku} ${row.name}`.toLowerCase().includes(search.toLowerCase()) && (category === "all" || row.category === category) && (stockStatus === "all" || status === stockStatus);
  });
  const outOfStock = rows.filter((row) => row.onHand === 0);
  const lowStock = rows.filter((row) => row.onHand > 0 && row.onHand - row.reserved <= row.reorder);
  const healthyStockCount = rows.length - lowStock.length - outOfStock.length;
  const stockPercentages = rows.length
    ? [healthyStockCount, lowStock.length, outOfStock.length].map((count) => Math.round((count / rows.length) * 100))
    : [0, 0, 0];
  const [healthyPercent, lowStockPercent, outOfStockPercent] = stockPercentages;
  const stockGradient = `conic-gradient(#8d9a77 0 ${healthyPercent}%, #c3a77c ${healthyPercent}% ${healthyPercent + lowStockPercent}%, #d7a28e ${healthyPercent + lowStockPercent}% 100%)`;

  async function restock(row) {
    setRestockingId(row.id);
    setLoadError("");
    try {
      const { product } = await apiRequest(`/owners/products/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stock: row.onHand + 12 }),
      });
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, onHand: product.stock } : item));
      setToast(true);
    } catch (requestError) {
      setLoadError(requestError.message);
    } finally {
      setRestockingId("");
    }
  }

  return (
    <OwnerShell page="/owner/inventory" navigate={navigate} user={user} onLogout={onLogout}>
      <PageTitle eyebrow="YOUR CATALOG / STOCK" title="Inventory" description="Keep every piece ready for its next home." />
      {loadError && <p className="account-alert" role="alert">{loadError}</p>}
      <div className="inventory-alert"><span><Icon name="alert" size={18} /></span><div><strong>{lowStock.length} items need attention</strong><p>Restock these pieces before they go out of stock.</p></div><Button onClick={() => document.getElementById("inventory-table")?.scrollIntoView({ behavior: "smooth" })}>Review low stock <Icon name="arrow" size={14} /></Button></div>
      <div className="metrics-grid inventory-metrics"><MetricCard icon="dollar" label="Stock value" value={`$${rows.reduce((sum, row) => sum + row.onHand * row.price, 0).toLocaleString()}`} trend="at retail price" comparisonText="" /><MetricCard icon="package" label="In stock" value={rows.reduce((sum, row) => sum + row.onHand, 0)} trend="units available" comparisonText="" /><MetricCard icon="alert" label="Low stock" value={lowStock.length} trend="restock alerts" comparisonText="" /><MetricCard icon="close" label="Out of stock" value={outOfStock.length} trend="products unavailable" comparisonText="" /></div>
      <div className="inventory-insights">
        <section className="admin-card low-stock-card"><div className="admin-card-heading"><div><h2>Low stock alerts</h2><p>Pieces to replenish soon</p></div><span className="attention-count">{String(lowStock.length).padStart(2, "0")}</span></div>{loading ? <p>Loading inventory…</p> : lowStock.length ? lowStock.slice(0, 3).map((row, index) => { const left = row.onHand - row.reserved; return <div className="restock-row" key={row.sku}><span className={`restock-product-mark restock-mark-${index}`}><Icon name="package" size={16} /></span><span className="restock-product-copy"><strong>{row.name}</strong><small>{left} left <i className="restock-progress"><i style={{ width: `${Math.min(100, (left / Math.max(1, row.reorder)) * 100)}%` }} /></i></small></span><Button disabled={restockingId === row.id} onClick={() => restock(row)}>{restockingId === row.id ? "Updating…" : "Restock"}</Button></div>; }) : <p>No low-stock products right now.</p>}</section>
        <section className="admin-card inventory-health"><div className="admin-card-heading"><div><h2>Inventory health</h2><p>A view across your collection</p></div></div><div className="health-chart-area"><div aria-label={`Inventory health: ${healthyPercent}% healthy, ${lowStockPercent}% low stock, ${outOfStockPercent}% out of stock`} className="health-donut" style={{ background: stockGradient }}><span><b>{rows.length}</b><small>products</small></span></div><div className="health-legend"><span><i />Healthy <b>{healthyPercent}%</b></span><span><i />Low stock <b>{lowStockPercent}%</b></span><span><i />Out of stock <b>{outOfStockPercent}%</b></span></div></div></section>
      </div>
      <section className="admin-card inventory-table-card" id="inventory-table"><div className="admin-card-heading"><div><h2>All inventory</h2><p>Stock across every product</p></div></div><div className="product-management-toolbar"><label className="admin-search"><Icon name="search" size={16} /><input aria-label="Search SKU or product" onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU or product" value={search} /></label><select aria-label="Inventory category" onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">All categories</option>{[...new Set(rows.map((row) => row.category))].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Stock status" onChange={(event) => setStockStatus(event.target.value)} value={stockStatus}><option value="all">All stock</option><option>Healthy</option><option>Low stock</option><option>Out of stock</option></select></div><div className="admin-table-scroll"><table className="admin-table inventory-table"><thead><tr>{["SKU", "Product", "On hand", "Reserved", "Available", "Reorder point", "Status"].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan="7">Loading inventory…</td></tr> : filteredRows.length ? filteredRows.map((row) => { const available = row.onHand - row.reserved; const status = row.onHand === 0 ? "Out of stock" : available <= row.reorder ? "Low stock" : "Healthy"; return <tr key={row.sku}><td>{row.sku}</td><td><strong>{row.name}</strong></td><td>{row.onHand}</td><td>{row.reserved}</td><td><strong>{available}</strong></td><td>{row.reorder}</td><td><span className={`admin-status status-pill-${status.toLowerCase().replace(" ", "-")}`}><i />{status}</span></td></tr>; }) : <tr><td colSpan="7">No inventory matches these filters.</td></tr>}</tbody></table></div></section>
      {toast && <div className="inventory-toast" role="status"><Icon name="check" size={15} />Inventory updated successfully.<button aria-label="Dismiss notification" onClick={() => setToast(false)} type="button"><Icon name="close" size={13} /></button></div>}
    </OwnerShell>
  );
}

export default function ScreenPages({
  page,
  bag,
  changeQuantity,
  removeFromBag,
  addToBag,
  favorites,
  toggleFavorite,
  onLogout,
  onOrderPlaced,
  products = [],
  product,
  navigate,
}) {
  const auth = useSelector((state) => state.auth);
  const isOwner = auth.user?.role === "owner" || auth.user?.role === "admin";
  const ownerEntry = auth.profileStatus === "loading"
    ? <main className="account-access" aria-live="polite">Checking owner access…</main>
    : isOwner
      ? <OwnerDashboard navigate={navigate} onLogout={onLogout} user={auth.user} />
      : <OwnerAccess navigate={navigate} />;
  const ownerProducts = isOwner
    ? <OwnerProducts navigate={navigate} onLogout={onLogout} user={auth.user} />
    : <OwnerAccess navigate={navigate} />;
  const ownerInventory = isOwner
    ? <OwnerInventory navigate={navigate} onLogout={onLogout} user={auth.user} />
    : <OwnerAccess navigate={navigate} />;
  const ownerOrders = isOwner
    ? <OwnerOrders navigate={navigate} onLogout={onLogout} user={auth.user} />
    : <OwnerAccess navigate={navigate} />;
  const ownerCustomers = isOwner
    ? <OwnerCustomers navigate={navigate} onLogout={onLogout} user={auth.user} />
    : <OwnerAccess navigate={navigate} />;
  const routes = {
    product: <ProductDetails addToBag={addToBag} catalogProduct={product} favorites={favorites} navigate={navigate} toggleFavorite={toggleFavorite} />,
    cart: <ShoppingCart addToBag={addToBag} bag={bag} changeQuantity={changeQuantity} navigate={navigate} products={products} removeFromBag={removeFromBag} />,
    checkout: <Checkout bag={bag} navigate={navigate} onOrderPlaced={onOrderPlaced} />,
    account: <AccountAccess navigate={navigate} />,
    profile: <CustomerProfile addToBag={addToBag} favorites={favorites} navigate={navigate} onLogout={onLogout} products={products} toggleFavorite={toggleFavorite} />,
    owner: ownerEntry,
    ownerProducts,
    ownerInventory,
    ownerOrders,
    ownerCustomers,
  };
  return routes[page] || routes.home;
}
