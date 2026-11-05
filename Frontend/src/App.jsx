import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./App.css";
import Icon from "./components/Icon.jsx";
import ProductListing from "./ProductListing.jsx";
import ScreenPages from "./ScreenPages.jsx";
import { fetchCurrentUser, logoutAccount, setAuthError } from "./store/authSlice.js";
import { addToCart, changeCartQuantity, clearCart, removeFromCart } from "./store/cartSlice.js";
import { setFavorites, toggleFavorite as toggleFavoriteAction } from "./store/favoritesSlice.js";
import { clearPromotion } from "./store/promotionSlice.js";
import { apiRequest, toCatalogProduct } from "./api.js";

const collections = [
  { title: "Soft Structure", detail: "Form, made effortless.", type: "photo" },
  { title: "Daily Rituals", detail: "A moment, made yours.", type: "lines" },
  { title: "Objects for Living", detail: "The art of the everyday.", type: "rings" },
];

function resolvePage(pathname) {
  if (pathname.startsWith("/accessories")) return "accessories";
  if (pathname.startsWith("/product")) return "product";
  if (pathname.startsWith("/cart")) return "cart";
  if (pathname.startsWith("/checkout")) return "checkout";
  if (pathname.startsWith("/account")) return "account";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/owner/products")) return "ownerProducts";
  if (pathname.startsWith("/owner/inventory")) return "ownerInventory";
  if (pathname.startsWith("/owner/orders")) return "ownerOrders";
  if (pathname.startsWith("/owner/customers")) return "ownerCustomers";
  if (pathname.startsWith("/owner")) return "owner";
  return "home";
}

function ProductCard({ product, isFavorite, onToggleFavorite, onAddToBag, onOpenProduct }) {
  return (
    <article className="product-card">
      <div className={`product-image ${product.image ? "" : "product-image--watch"}`}>
        {product.image ? (
          <img src={product.image} alt={product.alt} loading="lazy" />
        ) : (
          <Icon name="watch" size={76} className="watch-illustration" />
        )}
        <button
          aria-label={`${isFavorite ? "Remove" : "Add"} ${product.name} ${isFavorite ? "from" : "to"} wishlist`}
          aria-pressed={isFavorite}
          className={`icon-button favorite-button ${isFavorite ? "is-favorite" : ""}`}
          onClick={() => onToggleFavorite(product.id)}
          type="button"
        >
          <Icon name="heart" size={18} />
        </button>
        <button
          disabled={product.stock <= 0}
          className="quick-add"
          onClick={() => onAddToBag(product)}
          type="button"
        >
          {product.stock <= 0 ? "Sold out" : "Add to bag"} <Icon name="plus" size={15} />
        </button>
      </div>
      <p className="product-category">{product.category}</p>
      <div className="product-details">
        <button className="home-product-name" onClick={onOpenProduct} type="button">{product.name}</button>
        <div className="product-meta">
          <span>${product.price}</span>
          <span className="rating"><Icon name="star" size={13} /> {product.rating}</span>
        </div>
      </div>
    </article>
  );
}

function App() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [category, setCategory] = useState("New arrivals");
  const [page, setPage] = useState(() => resolvePage(window.location.pathname));
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(() => window.location.pathname.split("/")[2] || "");
  const [search, setSearch] = useState("");
  const favorites = useSelector((state) => state.favorites);
  const bag = useSelector((state) => state.cart);
  const promotion = useSelector((state) => state.promotion);
  const [panel, setPanel] = useState("");
  const panelRef = useRef(null);
  const panelTriggerRef = useRef(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const shownProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "New arrivals" ||
        (category === "Accessories"
          ? !["Beauty", "Objects", "Home"].includes(product.category)
          : product.category === category);
      const matchesSearch =
        !query ||
        `${product.name} ${product.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, products, search]);

  const bagCount = bag.reduce((count, item) => count + item.quantity, 0);
  const bagTotal = bag.reduce((total, item) => total + item.price * item.quantity, 0);
  const favoriteProducts = products.filter((product) => favorites.includes(product.id));

  useEffect(() => {
    function syncPage() {
      setPage(resolvePage(window.location.pathname));
      if (window.location.pathname.startsWith("/product/")) {
        setSelectedProductId(window.location.pathname.split("/")[2] || "");
      }
    }

    window.addEventListener("popstate", syncPage);
    return () => window.removeEventListener("popstate", syncPage);
  }, []);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    apiRequest("/products")
      .then(({ products: catalog }) => setProducts(catalog.map(toCatalogProduct)))
      .catch((error) => dispatch(setAuthError(error.message)));
  }, [dispatch]);

  useEffect(() => {
    dispatch(setFavorites((auth.user?.wishlist || []).map((product) => (
      typeof product === "string" ? product : product._id || product.id
    )).filter(Boolean)));
  }, [auth.user?.id, auth.user?.wishlist, dispatch]);

  useEffect(() => {
    if (bag.length === 0) dispatch(clearPromotion());
  }, [bag.length, dispatch]);

  useEffect(() => {
    if (!panel) return undefined;
    panelRef.current?.querySelector("button")?.focus();
    function handlePanelKeyDown(event) {
      if (event.key === "Escape") {
        setPanel("");
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled)")];
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
    document.addEventListener("keydown", handlePanelKeyDown);
    return () => {
      document.removeEventListener("keydown", handlePanelKeyDown);
      panelTriggerRef.current?.focus();
    };
  }, [panel]);

  const navigateTo = useCallback((nextPage, resourceId) => {
    const path = {
      home: "/",
      accessories: "/accessories",
      cart: "/cart",
      checkout: "/checkout",
      account: "/account",
      profile: "/profile",
      owner: "/owner",
      ownerProducts: "/owner/products",
      ownerInventory: "/owner/inventory",
      ownerOrders: "/owner/orders",
      ownerCustomers: "/owner/customers",
    }[nextPage] || nextPage;
    const destination = nextPage === "product"
      ? `/product/${resourceId || products[0]?.id || ""}`
      : path;
    if (window.location.pathname !== destination) {
      window.history.pushState({}, "", destination);
    }
    if (nextPage === "product" && resourceId) setSelectedProductId(resourceId);
    setPage(resolvePage(destination));
    setPanel("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [products]);

  function toggleFavorite(productId) {
    dispatch(toggleFavoriteAction(productId));
    if (auth.user?.role === "customer") {
      const method = favorites.includes(productId) ? "DELETE" : "PUT";
      apiRequest(`/users/wishlist/${productId}`, { method }).catch((error) => {
        dispatch(toggleFavoriteAction(productId));
        dispatch(setAuthError(error.message));
      });
    }
  }

  function addToBag(product) {
    dispatch(addToCart(product));
    if (!panel) panelTriggerRef.current = document.activeElement;
    setPanel("bag");
  }

  function togglePanel(name) {
    if (panel === name) {
      setPanel("");
      return;
    }
    panelTriggerRef.current = document.activeElement;
    setPanel(name);
  }

  function changeQuantity(productId, amount) {
    dispatch(changeCartQuantity({ productId, amount }));
  }

  function removeFromBag(productId) {
    dispatch(removeFromCart(productId));
  }

  function handleSubscribe(event) {
    event.preventDefault();
    setSubscribed(true);
  }

  const screenPageProps = {
    addToBag,
    bag,
    changeQuantity,
    favorites,
    navigate: navigateTo,
    promotion,
    onLogout: () => {
      dispatch(logoutAccount()).then((result) => {
        if (logoutAccount.fulfilled.match(result)) navigateTo("home");
      });
    },
    removeFromBag,
    toggleFavorite,
    products,
    product: products.find((item) => item.id === selectedProductId) || products[0],
    onOrderPlaced: () => {
      dispatch(clearPromotion());
      dispatch(clearCart());
    },
  };

  if (page === "profile" && auth.status !== "authenticated") {
    if (auth.profileStatus === "idle" || auth.profileStatus === "loading") {
      return <main className="account-access" aria-live="polite">Checking your account…</main>;
    }
    return <ScreenPages page="account" {...screenPageProps} />;
  }

  if (["checkout", "account", "owner", "ownerProducts", "ownerInventory", "ownerOrders", "ownerCustomers"].includes(page)) {
    return <ScreenPages page={page} {...screenPageProps} />;
  }

  return (
    <div className="storefront">
      <div className="announcement">
        Complimentary delivery on orders over $150 <span aria-hidden="true">·</span> Thoughtfully packed, always
      </div>
      <header className="site-header">
        <div className="header-inner">
          <a className="wordmark" href="/" aria-label="Aurel home" onClick={(event) => { event.preventDefault(); navigateTo("home"); }}>
            AUREL
          </a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {["New arrivals", "Objects", "Accessories", "Beauty"].map((item) => (
              <button
                aria-current={
                  page === "accessories" && item === "Accessories"
                    ? "page"
                    : page === "home" && category === item
                      ? "page"
                      : undefined
                }
                className={`nav-link ${
                  (page === "accessories" && item === "Accessories") ||
                  (page === "home" && category === item)
                    ? "nav-link--active"
                    : ""
                }`}
                key={item}
                onClick={() => {
                  if (item === "Accessories") {
                    navigateTo("accessories");
                    return;
                  }
                  if (page !== "home") navigateTo("home");
                  setCategory(item);
                  document.getElementById("curated")?.scrollIntoView({ behavior: "smooth" });
                }}
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <label className="search-field">
              <Icon name="search" size={17} />
              <input
                aria-label="Search AUREL"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search AUREL"
                type="search"
                value={search}
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")} type="button">
                  <Icon name="close" size={15} />
                </button>
              )}
            </label>
            <button
              aria-label={`Wishlist${favorites.length ? `, ${favorites.length} saved` : ""}`}
              className={`icon-button header-icon ${panel === "wishlist" ? "is-active" : ""}`}
              onClick={() => togglePanel("wishlist")}
              type="button"
            >
              <Icon name="heart" size={20} />
              {favorites.length > 0 && <span className="icon-count">{favorites.length}</span>}
            </button>
            <button
              aria-label={`Shopping bag, ${bagCount} items`}
              className={`icon-button header-icon bag-trigger ${panel === "bag" ? "is-active" : ""}`}
              onClick={() => navigateTo("cart")}
              type="button"
            >
              <Icon name="bag" size={20} />
              <span className="icon-count">{bagCount}</span>
            </button>
            <button className="icon-button account-button" onClick={() => navigateTo("account")} aria-label="Account" type="button">
              <Icon name="account" size={20} />
            </button>
          </div>
        </div>
      </header>

      {page === "accessories" ? (
        <ProductListing
          favorites={favorites}
          products={products}
          onAddToBag={addToBag}
          onOpenProduct={(productId) => navigateTo("product", productId)}
          onToggleFavorite={toggleFavorite}
          search={search}
        />
      ) : page === "home" ? (
      <main className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> The new edit</p>
            <h1 id="hero-title">Objects with a<br className="desktop-break" /> point of view.</h1>
            <p className="hero-description">
              Thoughtful pieces for considered spaces and everyday rituals.
            </p>
            <div className="hero-links">
              <a className="button button-dark" href="#curated">
                Shop new arrivals <Icon name="arrow" size={16} />
              </a>
              <a className="text-link" href="#journal">Explore the journal</a>
            </div>
            <div className="hero-trust">
              <span className="trust-check"><Icon name="check" size={13} /></span>
              Free delivery over $150 <span className="trust-dot">·</span> 30-day returns
            </div>
          </div>
          <div className="hero-visual">
            <img
              alt="A quiet, sunlit still life from the AUREL collection"
              fetchPriority="high"
              src="https://images.unsplash.com/photo-1713425887916-111e58eba679?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBuZXV0cmFsJTIwZmFzaGlvbiUyMGVkaXRvcmlhbCUyMHdvbWFuJTIwbGVhdGhlciUyMGhhbmRiYWclMjBzdHVkaW98ZW58MXwwfHx8MTc5MzczOTA1NXww&ixlib=rb-4.1.0&q=80&w=1080"
            />
            <div className="hero-image-wash" />
            <div className="hero-caption">
              <div>
                <span className="caption-overline">A study in simplicity</span>
                <p>The quiet luxury edit</p>
              </div>
              <span className="caption-number">06—24</span>
            </div>
            <span className="image-index">01 / 04</span>
          </div>
        </section>

        <section className="curated-section" id="curated" aria-labelledby="curated-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow section-eyebrow">Good things, gathered</p>
              <h2 id="curated-title">
                {category === "New arrivals" ? "Curated for now" : category}
              </h2>
              <p className="section-subtitle">A considered edit of pieces we keep close</p>
            </div>
            <a className="text-link view-all" href="#collections">
              View the collection <Icon name="arrow" size={15} />
            </a>
          </div>
          {shownProducts.length > 0 ? (
            <div className="product-grid">
              {shownProducts.map((product) => (
                <ProductCard
                  isFavorite={favorites.includes(product.id)}
                  key={product.id}
                  onAddToBag={addToBag}
                  onOpenProduct={() => navigateTo("product", product.id)}
                  onToggleFavorite={toggleFavorite}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="empty-products">
              <p>Nothing in this edit just yet.</p>
              <button className="text-link" onClick={() => { setSearch(""); setCategory("New arrivals"); }} type="button">
                Browse all arrivals
              </button>
            </div>
          )}
        </section>

        <section className="collections-section" id="collections" aria-labelledby="collections-title">
          <div className="collection-heading">
            <div>
              <p className="eyebrow section-eyebrow">A little inspiration</p>
              <h2 id="collections-title">Trending collections</h2>
            </div>
            <span className="collection-note">Three moods, one point of view.</span>
          </div>
          <div className="collection-grid">
            {collections.map((collection, index) => (
              <a
                className={`collection-card collection-card--${collection.type}`}
                href="#curated"
                key={collection.title}
                onClick={() => setCategory(index === 1 ? "Beauty" : index === 2 ? "Objects" : "New arrivals")}
              >
                {collection.type === "photo" ? (
                  <>
                    <img
                      alt=""
                      loading="lazy"
                      src="https://images.unsplash.com/photo-1713425887916-111e58eba679?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBuZXV0cmFsJTIwZmFzaGlvbiUyMGVkaXRvcmlhbCUyMHdvbWFuJTIwbGVhdGhlciUyMGhhbmRiYWclMjBzdHVkaW98ZW58MXwwfHx8MTc5MzczOTA1NXww&ixlib=rb-4.1.0&q=80&w=1080"
                    />
                    <span className="collection-shade" />
                  </>
                ) : collection.type === "lines" ? (
                  <span className="line-texture" />
                ) : (
                  <span className="ring-texture"><i /><i /><i /></span>
                )}
                <span className="collection-index">0{index + 1} — COLLECTION</span>
                <span className="collection-title">{collection.title}</span>
                <span className="collection-detail">{collection.detail}</span>
                <span className="collection-arrow"><Icon name="arrow" size={17} /></span>
              </a>
            ))}
          </div>
        </section>

        <section className="newsletter" id="journal" aria-labelledby="newsletter-title">
          <div className="newsletter-mark" aria-hidden="true">A.</div>
          <div className="newsletter-copy">
            <p className="eyebrow section-eyebrow">A note from us</p>
            <h2 id="newsletter-title">A quieter kind of inbox.</h2>
            <p>Occasional notes on objects, rituals, and considered living.</p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
            <input
              autoComplete="email"
              id="newsletter-email"
              onChange={(event) => { setEmail(event.target.value); setSubscribed(false); }}
              placeholder="Your email address"
              required
              type="email"
              value={email}
            />
            <button className="button button-dark" type="submit">
              {subscribed ? "Signup unavailable" : "Subscribe"}
              <Icon name={subscribed ? "check" : "arrow"} size={16} />
            </button>
          </form>
          {subscribed && <p className="subscribe-success" role="status">Newsletter sign-up is not connected in this demo. No subscription was created.</p>}
        </section>
        <footer className="site-footer">
          <a className="footer-wordmark" href="#" aria-label="Aurel home">AUREL</a>
          <span>Thoughtful things, thoughtfully found.</span>
          <span>© AUREL 2025</span>
        </footer>
      </main>
      ) : (
        <ScreenPages page={page} {...screenPageProps} />
      )}

      {panel && (
        <div className="panel-backdrop" onClick={() => setPanel("")}>
          <aside
            aria-label={panel === "bag" ? "Your shopping bag" : "Your wishlist"}
            aria-modal="true"
            className="side-panel"
            onClick={(event) => event.stopPropagation()}
            ref={panelRef}
            role="dialog"
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow section-eyebrow">The good things</p>
                <h2>{panel === "bag" ? "Your bag" : "Your wishlist"}</h2>
              </div>
              <button aria-label="Close panel" className="icon-button" onClick={() => setPanel("")} type="button">
                <Icon name="close" size={20} />
              </button>
            </div>
            {panel === "bag" ? (
              bag.length ? (
                <>
                  <div className="panel-items">
                    {bag.map((item) => (
                      <article className="panel-item" key={item.id}>
                        <div className="panel-item-image">
                          {item.image ? <img alt="" src={item.image} /> : <Icon name="watch" size={36} />}
                        </div>
                        <div className="panel-item-copy">
                          <h3>{item.name}</h3>
                          <p>${item.price}</p>
                          <div className="quantity-control">
                            <button aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item.id, -1)} type="button"><Icon name="minus" size={14} /></button>
                            <span>{item.quantity}</span>
                            <button aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item.id, 1)} type="button"><Icon name="plus" size={14} /></button>
                          </div>
                        </div>
                        <span className="panel-item-total">${item.price * item.quantity}</span>
                      </article>
                    ))}
                  </div>
                  <div className="panel-summary">
                    <div><span>Subtotal</span><strong>${bagTotal}</strong></div>
                    <p>Complimentary delivery over $150</p>
                    <button className="button button-dark checkout-button" onClick={() => navigateTo("cart")} type="button">
                        View your bag <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="panel-empty"><Icon name="bag" size={30} /><p>Your bag is taking a quiet moment.</p><a className="text-link" href="#curated" onClick={() => setPanel("")}>Discover the edit</a></div>
              )
            ) : favorites.length ? (
              <div className="panel-items">
                {favoriteProducts.map((item) => (
                  <article className="panel-item" key={item.id}>
                    <div className="panel-item-image">
                      {item.image ? <img alt="" src={item.image} /> : <Icon name="watch" size={36} />}
                    </div>
                    <div className="panel-item-copy"><h3>{item.name}</h3><p>${item.price}</p><button className="text-link" onClick={() => addToBag(item)} type="button">Add to bag</button></div>
                    <button aria-label={`Remove ${item.name} from wishlist`} className="icon-button" onClick={() => toggleFavorite(item.id)} type="button"><Icon name="close" size={17} /></button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel-empty"><Icon name="heart" size={30} /><p>Keep the things you love close.</p><a className="text-link" href="#curated" onClick={() => setPanel("")}>Find your favorites</a></div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;
