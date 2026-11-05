import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Icon from "./components/Icon.jsx";
import listingProducts from "./data/listingProducts.js";
import { clearAuthError, loginAccount, loginOwnerAccount, registerAccount, setAuthError, updateAuthenticatedUser } from "./store/authSlice.js";
import { setPromotion } from "./store/promotionSlice.js";
import "./ScreenPages.css";
import { apiRequest } from "./api.js";

const toteImage = listingProducts[0].image;
const vesselImage = listingProducts[2].image;
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

function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="screen-breadcrumb">
      {items.map((item, index) => (
        <span className="screen-crumb" key={`${item.label}-${index}`}>
          {index > 0 && <Icon name="chevronRight" size={13} />}
          {item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}
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
  const [expanded, setExpanded] = useState("Details");
  const [added, setAdded] = useState(false);
  const product = catalogProduct;
  if (!product) {
    return <main className="page-shell screen-content"><p>Product not found. <button className="text-link" onClick={() => navigate("accessories")} type="button">Browse accessories</button></p></main>;
  }
  const favorite = favorites.includes(product.id);

  function addProduct() {
    addToBag({ ...product, color });
    setAdded(true);
  }

  return (
    <main className="page-shell screen-content product-detail-page">
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: product.category, href: "/accessories" },
        { label: product.name },
      ]} />
      <div className="detail-layout">
        <div className="detail-gallery">
          {[0, 1, 2, 3].map((imageIndex) => (
            <div className={`detail-gallery-tile detail-gallery-tile-${imageIndex + 1}`} key={imageIndex}>
              <img alt={`${product.name}, view ${imageIndex + 1}`} src={product.image || toteImage} />
              {imageIndex === 0 && <span className="gallery-caption">AUREL / OBJECTS FOR EVERY DAY</span>}
            </div>
          ))}
        </div>
        <section className="detail-information">
          <p className="eyebrow section-eyebrow">AUREL / {product.category.toUpperCase()}</p>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            <Icon name="star" size={14} /> <strong>{product.rating || "4.8"}</strong>
            <a href="#reviews">128 reviews</a>
          </div>
          <div className="detail-price">${Number(product.price).toFixed(2)}</div>
          <p className="installment-note">or 4 payments of ${(product.price / 4).toFixed(2)}</p>
          <p className={`stock-status ${product.stock <= 0 ? "is-out-of-stock" : ""}`}><span /> {product.stock > 0 ? "In stock · Ships today" : "Currently out of stock"}</p>
          <p className="detail-description">
            A sculptural everyday tote in vegetable-tanned leather, finished by hand in small batches.
          </p>
          <div className="detail-option">
            <div className="option-label"><span>Color</span><strong>{color}</strong></div>
            <div className="detail-colors">
              {["Umber", "Ink"].map((item) => (
                <button
                  aria-label={`${item}${color === item ? ", selected" : ""}`}
                  aria-pressed={color === item}
                  className={`detail-color detail-color-${item.toLowerCase()} ${color === item ? "is-selected" : ""}`}
                  key={item}
                  onClick={() => setColor(item)}
                  title={item}
                  type="button"
                />
              ))}
            </div>
          </div>
          <div className="detail-option quantity-option">
            <span className="option-heading">Quantity</span>
            <Quantity value={quantity} onChange={(amount) => setQuantity((value) => Math.max(1, value + amount))} />
          </div>
          <div className="detail-actions">
            <button className="screen-button-dark detail-add" disabled={product.stock <= 0 || quantity > product.stock} onClick={addProduct}>
              {added ? "Added to bag" : "Add to bag"} <Icon name={added ? "check" : "bag"} size={16} />
            </button>
            <Button
              aria-pressed={favorite}
              className={`detail-wishlist ${favorite ? "is-favorite" : ""}`}
              onClick={() => toggleFavorite(product.id)}
            >
              <Icon name="heart" size={16} /> {favorite ? "Saved to wishlist" : "Save to wishlist"}
            </Button>
          </div>
          {added && (
            <div className="inline-success" role="status">
              <Icon name="check" size={15} /> Added to your bag.
              <button onClick={() => navigate("cart")} type="button">View bag</button>
            </div>
          )}
          <div className="shipping-note"><Icon name="bag" size={17} /> Complimentary shipping over $150</div>
        </section>
      </div>
      <div className="detail-accordions">
        {[
          ["Details", "Vegetable-tanned leather with a softly structured silhouette and considered interior space."],
          ["Shipping & returns", "Complimentary shipping over $150. Returns accepted within 30 days of delivery."],
          ["Care", "Keep away from prolonged moisture and store in the included dust bag when not in use."],
        ].map(([title, body]) => (
          <section className="detail-accordion" key={title}>
            <button aria-expanded={expanded === title} onClick={() => setExpanded(expanded === title ? "" : title)} type="button">
              {title}<Icon className={expanded === title ? "is-open" : ""} name="chevronDown" size={16} />
            </button>
            {expanded === title && <p>{body}</p>}
          </section>
        ))}
      </div>
      <section className="recommendations">
        <div className="recommendation-title"><div><p className="eyebrow section-eyebrow">Consider these, too</p><h2>You may also like</h2></div><a href="/accessories">View accessories <Icon name="arrow" size={14} /></a></div>
        <div className="recommendation-grid">
          {[listingProducts[1], listingProducts[2]].map((item) => (
            <button className="recommendation-card" key={item.id} onClick={() => navigate("accessories")} type="button">
              <img alt={item.name} src={item.image} /><span><small>{item.category}</small><strong>{item.name}</strong><b>${item.price.toFixed(2)}</b></span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function ShoppingCart({ bag, changeQuantity, removeFromBag, navigate }) {
  const dispatch = useDispatch();
  const promotion = useSelector((state) => state.promotion);
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const subtotal = bag.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promotion === "AUREL10" ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + tax;
  const isEmpty = bag.length === 0;

  function applyPromo(event) {
    event.preventDefault();
    if (promo.trim().toUpperCase() === "AUREL10") {
      dispatch(setPromotion("AUREL10"));
      setPromoMessage("AUREL10 applied — 10% off.");
    } else {
      dispatch(setPromotion(null));
      setPromoMessage("That code didn’t quite work. Try AUREL10.");
    }
  }

  return (
    <main className="page-shell screen-content cart-page">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Your bag" }]} />
      <PageTitle title="Your bag" description={`${bag.reduce((sum, item) => sum + item.quantity, 0)} items`} />
      <div className={`cart-layout${isEmpty ? " cart-layout-empty" : ""}`}>
        <div className="cart-main">
          {bag.length ? (
            <div className="cart-items-card">
              {bag.map((item) => (
                <article className="cart-line-item" key={item.id}>
                  <img alt={item.name} src={item.image || vesselImage} />
                  <div className="cart-item-copy">
                    <p className="eyebrow section-eyebrow">{item.category}</p>
                    <h2>{item.name}</h2>
                    <p>${Number(item.price).toFixed(2)}</p>
                    <Quantity value={item.quantity} onChange={(amount) => changeQuantity(item.id, amount)} />
                  </div>
                  <div className="cart-item-actions">
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                    <button aria-label={`Remove ${item.name} from bag`} onClick={() => removeFromBag(item.id)} title="Remove from bag" type="button"><Icon name="trash" size={16} /></button>
                  </div>
                </article>
              ))}
              <form className="promo-form" onSubmit={applyPromo}>
                <label htmlFor="promo-code">A little something extra</label>
                <div><input id="promo-code" onChange={(event) => setPromo(event.target.value)} placeholder="Promo code" value={promo} /><Button type="submit">Apply</Button></div>
                {promoMessage && <p aria-live="polite">{promoMessage}</p>}
              </form>
              <p className="delivery-unlocked"><Icon name="check" size={15} /> Free delivery unlocked</p>
            </div>
          ) : (
            <div className="cart-empty">
              <span className="empty-preview-mark">A.</span>
              <h2>Your bag is waiting.</h2>
              <p>Find something thoughtful for your everyday.</p>
              <Button className="screen-button-dark" onClick={() => navigate("accessories")}>Add items to cart <Icon name="arrow" size={15} /></Button>
            </div>
          )}
          {!isEmpty && (
            <div className="cart-reassurance">
              <span><Icon name="check" size={17} /><b>Checkout preview</b><small>Your details aren&apos;t sent in this demo.</small></span>
              <span><Icon name="arrow" size={17} /><b>Easy 30-day returns</b><small>Plenty of time to decide.</small></span>
            </div>
          )}
        </div>
        {!isEmpty && <aside className="order-summary-card">
          <p className="eyebrow section-eyebrow">A considered choice</p>
          <h2>Order summary</h2>
          <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discount > 0 && <div className="summary-row summary-discount"><span>Discount</span><span>−${discount.toFixed(2)}</span></div>}
          <div className="summary-row"><span>Shipping</span><span>Free</span></div>
          <div className="summary-row"><span>Estimated tax</span><span>${tax.toFixed(2)}</span></div>
          <div className="summary-row summary-total"><strong>Total</strong><strong>${total.toFixed(2)}</strong></div>
          <Button className="screen-button-dark checkout-cta" disabled={!bag.length} onClick={() => navigate("checkout")}>Proceed to checkout <Icon name="arrow" size={16} /></Button>
          <p className="secure-note"><Icon name="check" size={14} /> No payment data is collected in this demo.</p>
          <div className="payment-marks"><span>VISA</span><span>Mastercard</span><span>Apple Pay</span></div>
        </aside>}
      </div>
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
        navigate("profile");
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
            <Button className="screen-button-dark account-submit" disabled={status === "loading"} type="submit">{status === "loading" ? "Please wait…" : tab === "sign-in" ? "Sign in" : "Create account"} <Icon name="arrow" size={15} /></Button>
          </form>
          <div className="account-divider"><span />or continue with<span /></div>
          <Button className="google-button" onClick={() => setMessage("Google sign-in is not connected in this demo.")}><b>G</b> Continue with Google</Button>
          {tab === "sign-in" && <a className="forgot-link" href="#forgot-password" onClick={(event) => { event.preventDefault(); setMessage("Password reset is not connected in this demo. No email was sent."); }}>Forgot password?</a>}
          {showAlert && (error || message) && <div className="account-alert" role="status"><span>{error || message}</span><button aria-label="Dismiss alert" onClick={() => { setShowAlert(false); setMessage(""); dispatch(clearAuthError()); }} type="button"><Icon name="close" size={15} /></button></div>}
          <p className="account-switch">{tab === "sign-in" ? "New to AUREL?" : "Already have an account?"} <button onClick={() => { setTab(tab === "sign-in" ? "create-account" : "sign-in"); setMessage(""); setShowAlert(true); dispatch(clearAuthError()); }} type="button">{tab === "sign-in" ? "Create an account" : "Sign in"}</button></p>
          <a className="owner-signin" href="/owner" onClick={(event) => { event.preventDefault(); navigate("owner"); }}>Owner workspace preview <Icon name="arrow" size={13} /></a>
        </div>
      </section>
    </main>
  );
}

function CustomerProfile({ navigate, favorites, onLogout, products, toggleFavorite }) {
  const dispatch = useDispatch();
  const { user, error } = useSelector((state) => state.auth);
  const [section, setSection] = useState("Profile");
  const [preferences, setPreferences] = useState(user?.preferences || { earlyAccess: true, journalNotes: false });
  const [editing, setEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [name, setName] = useState(user?.fullname || "");
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
      .then(({ orders: customerOrders }) => setOrders(customerOrders))
      .catch((requestError) => setProfileMessage(requestError.message));
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
      setEditing(false);
      setEditingAddress(false);
      setProfileMessage("Your account details are saved.");
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

  return (
    <main className="page-shell screen-content profile-page">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Account" }]} />
      <PageTitle title={`Good morning, ${displayName.split(" ")[0]}`} description="Manage your account and keep track of your orders." action={<Button onClick={onLogout}>Sign out <Icon name="arrow" size={14} /></Button>} />
      {error && <p className="account-alert" role="status">{error}</p>}
      {profileMessage && <p className="account-alert" role="status">{profileMessage}</p>}
      <div className="profile-layout">
        <nav aria-label="Account sections" className="profile-nav">
          <div className="profile-nav-person"><span>{displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><div><strong>{displayName}</strong><small>Customer account</small></div></div>
          {sections.map((item, index) => <button aria-current={section === item ? "page" : undefined} className={section === item ? "is-active" : ""} key={item} onClick={() => setSection(item)} type="button"><Icon name={["account", "bag", "location", "heart"][index]} size={16} />{item}<Icon className="profile-nav-arrow" name="chevronRight" size={14} /></button>)}
        </nav>
        <div className="profile-main">
          {section === "Profile" && (
            <>
              <section className="profile-card">
                <div className="profile-card-header"><div><p className="eyebrow section-eyebrow">YOUR DETAILS</p><h2>Profile</h2></div><Button disabled={saving} onClick={() => editing ? saveProfile({ fullname: name.trim() }) : setEditing(true)}>{saving ? "Saving…" : editing ? "Save profile" : "Edit profile"}</Button></div>
                <div className="profile-person"><span className="profile-avatar">{displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><div>{editing ? <input aria-label="Your name" className="profile-name-input" onChange={(event) => setName(event.target.value)} value={name} /> : <h3>{displayName}</h3>}<p>{user?.email}</p><small>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "today"}</small></div></div>
              </section>
              <section className="profile-card preferences-card">
                <div><p className="eyebrow section-eyebrow">A NOTE FROM US</p><h2>Your preferences</h2></div>
                <PreferenceRow title="Early access to edits" description="Be first to discover new collections." checked={preferences.earlyAccess} onChange={(value) => changePreference("earlyAccess", value)} />
                <PreferenceRow title="Journal notes" description="Receive thoughtful notes from AUREL." checked={preferences.journalNotes} onChange={(value) => changePreference("journalNotes", value)} />
              </section>
            </>
          )}
          {section === "Orders" && <section className="profile-card"><p className="eyebrow section-eyebrow">YOUR PURCHASES</p><h2>Recent orders</h2><OrderHistory orders={orders} /></section>}
          {section === "Addresses" && <section className="profile-card"><p className="eyebrow section-eyebrow">WHERE TO</p><h2>Your addresses</h2><div className="address-card"><Icon name="location" size={19} /><div>{editingAddress ? <><label>Recipient<input onChange={(event) => setAddress((current) => ({ ...current, recipient: event.target.value }))} value={address.recipient} /></label><label>Street<input onChange={(event) => setAddress((current) => ({ ...current, street: event.target.value }))} value={address.street} /></label><label>City<input onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))} value={address.city} /></label><label>Postal code<input onChange={(event) => setAddress((current) => ({ ...current, postalCode: event.target.value }))} value={address.postalCode} /></label><label>Country<input onChange={(event) => setAddress((current) => ({ ...current, country: event.target.value }))} value={address.country} /></label></> : <><strong>{address.recipient || displayName}</strong><p>{address.street ? `${address.street}, ` : ""}{address.city}{address.postalCode ? ` ${address.postalCode}` : ""}</p><small>{address.country} · Default address</small></>}</div><Button disabled={saving} onClick={() => editingAddress ? saveAddress() : setEditingAddress(true)}>{saving ? "Saving…" : editingAddress ? "Save address" : "Edit"}</Button></div></section>}
          {section === "Profile" && <section className="profile-card order-history-card"><div className="profile-card-header"><div><p className="eyebrow section-eyebrow">YOUR PURCHASES</p><h2>Recent orders</h2></div><button className="profile-view-all" onClick={() => setSection("Orders")} type="button">View all <Icon name="arrow" size={13} /></button></div><OrderHistory orders={orders.slice(0, 3)} /></section>}
          <section className="profile-card wishlist-preview"><div><span className="wishlist-preview-icon"><Icon name="heart" size={19} /></span><div><h2>Your wishlist</h2><p>{favorites.length ? `${favorites.length} saved piece${favorites.length === 1 ? "" : "s"} waiting for you.` : "Your saved pieces will appear here."}</p></div></div><Button onClick={() => favorites.length ? setSection("Wishlist") : navigate("accessories")}>{favorites.length ? "View wishlist" : "Browse the edit"} <Icon name="arrow" size={14} /></Button></section>
          {section === "Wishlist" && <section className="profile-card"><p className="eyebrow section-eyebrow">KEPT CLOSE</p><h2>Wishlist</h2>{favorites.length ? <div className="recommendation-grid">{products.filter((product) => favorites.includes(product.id)).map((product) => <article className="recommendation-card" key={product.id}><img alt={product.name} src={product.image || vesselImage} /><span><strong>{product.name}</strong><b>${Number(product.price).toFixed(2)}</b><Button onClick={() => toggleFavorite(product.id)}>Remove from wishlist</Button></span></article>)}</div> : <p className="profile-wishlist-message">Your saved pieces will appear here.</p>}<Button onClick={() => navigate("accessories")}>Browse the edit <Icon name="arrow" size={14} /></Button></section>}
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
      <aside className="owner-sidebar">
        <a className="owner-logo" href="/owner" onClick={(event) => { event.preventDefault(); navigate("owner"); }}>AUREL<span>Owner workspace</span></a>
        <p className="owner-nav-label">WORKSPACE</p>
        <nav aria-label="Owner navigation">{adminNav.map(([label, icon, path]) => <button aria-current={path && page === path ? "page" : undefined} className={path && page === path ? "is-active" : ""} disabled={!path} key={label} onClick={() => { if (path) navigate(routePages[path]); }} title={path ? undefined : `${label} is not available yet`} type="button"><Icon name={icon} size={17} />{label}{path && page === path && <span />}</button>)}</nav>
        <div className="owner-sidebar-bottom"><span className="owner-avatar">{(user?.fullname || "Owner").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span><strong>{user?.fullname || "Store owner"}</strong><small>{user?.role === "admin" ? "Owner Admin" : "Owner"}</small></span><button aria-label="Sign out" onClick={onLogout} type="button">↗</button></div>
      </aside>
      <div className="owner-workspace">
        <header className="owner-topbar"><div><span>Owner</span><Icon name="chevronRight" size={13} /><b>{currentLabel}</b></div><button aria-label="Notifications are not available yet" disabled type="button"><Icon name="bell" size={18} /><i /></button></header>
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
    return <main className="account-access" aria-live="polite">Checking owner access…</main>;
  }

  return (
    <main className="account-access owner-access">
      <section className="account-form-side">
        <div className="account-card">
          <a className="account-wordmark" href="/" onClick={(event) => { event.preventDefault(); navigate("home"); }}>AUREL</a>
          <p className="eyebrow section-eyebrow">OWNER WORKSPACE</p>
          <h2>{bootstrap ? "Create your store admin" : "Welcome back"}</h2>
          <p className="account-intro">{bootstrap ? "One-time setup for the first admin account." : "Sign in to manage your catalog and inventory."}</p>
          <form className="account-form" onSubmit={submit}>
            {bootstrap && <label className="account-field"><span>Your name</span><input autoComplete="name" name="fullname" minLength={3} required /></label>}
            <label className="account-field"><span>Email</span><input autoComplete="email" name="email" required type="email" /></label>
            <label className="account-field"><span>Password</span><input autoComplete="current-password" minLength={8} name="password" required type="password" /></label>
            <Button className="screen-button-dark account-submit" disabled={status === "loading"} type="submit">{status === "loading" ? "Please wait…" : bootstrap ? "Create admin" : "Sign in"} <Icon name="arrow" size={15} /></Button>
          </form>
          {(error || message) && <p className="account-alert" role="alert">{message || error}</p>}
          <button className="text-link" onClick={() => { setBootstrap((value) => !value); setMessage(""); dispatch(clearAuthError()); }} type="button">{bootstrap ? "Already have an owner account? Sign in" : "First local setup? Create the first admin"}</button>
        </div>
      </section>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/owners/customers")
      .then(({ customers: result }) => setCustomers(result))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <OwnerShell page="/owner/customers" navigate={navigate} user={user} onLogout={onLogout}>
      <PageTitle eyebrow="YOUR COMMUNITY" title="Customers" description={`${customers.length} registered customer${customers.length === 1 ? "" : "s"}.`} />
      {error && <p className="account-alert" role="alert">{error}</p>}
      <section className="admin-card product-management-card">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr>{["Customer", "Joined", "Orders", "Lifetime spend"].map((item) => <th key={item}>{item}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="4">Loading customers…</td></tr> : customers.length ? customers.map((customer) => (
                <tr key={customer._id}>
                  <td><strong>{customer.fullname}</strong><small>{customer.email}</small></td>
                  <td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}</td>
                  <td>{customer.orders}</td>
                  <td>${Number(customer.spent).toFixed(2)}</td>
                </tr>
              )) : <tr><td colSpan="4">No customer accounts yet.</td></tr>}
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
    cart: <ShoppingCart bag={bag} changeQuantity={changeQuantity} navigate={navigate} removeFromBag={removeFromBag} />,
    checkout: <Checkout bag={bag} navigate={navigate} onOrderPlaced={onOrderPlaced} />,
    account: <AccountAccess navigate={navigate} />,
    profile: <CustomerProfile favorites={favorites} navigate={navigate} onLogout={onLogout} products={products} toggleFavorite={toggleFavorite} />,
    owner: ownerEntry,
    ownerProducts,
    ownerInventory,
    ownerOrders,
    ownerCustomers,
  };
  return routes[page] || routes.home;
}
