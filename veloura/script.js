/* ==========================================================
   VELOURA - script.js
   Works with your existing index.html and style.css.

   Sections:
    1  Shared helpers
    2  Photo fallbacks
    3  Mobile menu
    4  Scroll effects (header, hero, parallax)
    5  Active menu link
    6  Scroll reveal
    7  3D tilt and magnetic buttons
    8  Product filters
    9  Shopping bag
   10  Newsletter form (demo)
   11  Footer year
   12  3D hero sculpture (Three.js, with fallback)
   13  Start everything
   ========================================================== */
"use strict";


/* ----------------------------------------------------------
   1. SHARED HELPERS
   ---------------------------------------------------------- */
const root = document.documentElement;
const body = document.body;

// Questions we ask the browser about the visitor's device
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const wideScreenQuery = window.matchMedia("(min-width: 1101px)");

// True if the visitor asked their device for less motion
function reducedMotion() {
  return reduceMotionQuery.matches;
}

// True on laptops and desktops with a mouse (false on phones and tablets)
function hasFinePointer() {
  return finePointerQuery.matches;
}

// Short names for finding things on the page
function qs(selector, scope) {
  return (scope || document).querySelector(selector);
}

function qsa(selector, scope) {
  return Array.from((scope || document).querySelectorAll(selector));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Listens for changes in a media query (works in older browsers too)
function onQueryChange(query, callback) {
  if (query.addEventListener) {
    query.addEventListener("change", callback);
  } else if (query.addListener) {
    query.addListener(callback);
  }
}

// The main page elements we use in several places
const siteHeader = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const primaryNav = document.getElementById("primaryNav");
const hero = qs(".hero");
const heroMedia = qs(".hero-media");
const heroContent = qs(".hero-content");
const heroStage = qs(".hero-stage");

// How far the visitor has scrolled through the hero (0 to 1). Shared with the 3D sculpture.
let heroProgress = 0;

// The scroll-reveal watcher (created in section 6)
let revealObserver = null;


/* ----------------------------------------------------------
   2. PHOTO FALLBACKS
   If a photo is missing, we hide the broken-image icon.
   The dark and gold gradient behind it is shown instead.
   ---------------------------------------------------------- */
function watchImage(img) {
  function checkBroken() {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
      img.classList.add("is-broken");
    }
  }

  img.addEventListener("error", function () {
    img.classList.add("is-broken");
  });

  img.addEventListener("load", function () {
    img.classList.remove("is-broken");
  });

  checkBroken(); // covers photos that already failed before this script ran
}

function initImageFallbacks() {
  qsa(".media img, .hero-media img").forEach(watchImage);
}


/* ----------------------------------------------------------
   3. MOBILE MENU (hamburger button and full-screen overlay)
   ---------------------------------------------------------- */
function isMenuOpen() {
  return !!primaryNav && primaryNav.classList.contains("is-open");
}

function setMenu(open) {
  if (!primaryNav || !menuToggle || !siteHeader) return;

  primaryNav.classList.toggle("is-open", open);
  body.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

  if (open) {
    siteHeader.classList.remove("is-hidden");
  }
}

function initMenu() {
  if (!primaryNav || !menuToggle || !siteHeader) return;

  menuToggle.addEventListener("click", function () {
    setMenu(!isMenuOpen());
  });

  // close the menu after choosing a link
  qsa("a", primaryNav).forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (!isMenuOpen()) return;

    // Escape closes the menu and returns focus to the button
    if (event.key === "Escape") {
      setMenu(false);
      menuToggle.focus();
      return;
    }

    // keep Tab inside the open menu (a "focus trap")
    if (event.key === "Tab") {
      const focusable = qsa("a, button", siteHeader).filter(function (el) {
        return el.getClientRects().length > 0;
      });
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // if the window becomes wide again, reset the menu
  onQueryChange(wideScreenQuery, function () {
    if (wideScreenQuery.matches) setMenu(false);
  });
}


/* ----------------------------------------------------------
   4. SCROLL EFFECTS
   One scroll listener updates the header, the hero and the
   campaign photos. requestAnimationFrame keeps it smooth.
   ---------------------------------------------------------- */
let lastScrollY = window.scrollY;

// The header gets a dark bar when you scroll,
// hides when you scroll down and returns when you scroll up.
function updateHeader() {
  if (!siteHeader) return;

  const y = window.scrollY;
  siteHeader.classList.toggle("is-scrolled", y > 40);

  // never hide the header while the menu or the bag is open
  if (body.classList.contains("menu-open") || body.classList.contains("bag-open")) {
    lastScrollY = y;
    return;
  }

  // always show it near the top of the page
  if (y < 240) {
    siteHeader.classList.remove("is-hidden");
    lastScrollY = y;
    return;
  }

  const change = y - lastScrollY;
  if (Math.abs(change) < 6) return; // ignore tiny movements

  siteHeader.classList.toggle("is-hidden", change > 0); // down = hide, up = show
  lastScrollY = y;
}

// The hero photo drifts, and the text lifts and fades as you scroll away
function updateHero() {
  if (!hero) return;

  const height = hero.offsetHeight;
  if (!height) return;

  const y = window.scrollY;
  heroProgress = clamp(y / height, 0, 1);

  if (reducedMotion()) {
    if (heroMedia) heroMedia.style.transform = "";
    if (heroContent) {
      heroContent.style.transform = "";
      heroContent.style.opacity = "";
    }
    if (heroStage) heroStage.style.transform = "";
    return;
  }

  if (y > height * 1.2) return; // far below the hero, nothing to do

  if (heroMedia) {
    heroMedia.style.transform = "translate3d(0," + (heroProgress * height * 0.05).toFixed(1) + "px,0)";
  }

  if (heroContent) {
    heroContent.style.transform = "translate3d(0," + (-heroProgress * height * 0.08).toFixed(1) + "px,0)";
    heroContent.style.opacity = String(clamp(1 - heroProgress * 1.4, 0, 1));
  }

  if (heroStage) {
    heroStage.style.transform = "translate3d(0," + (-heroProgress * height * 0.05).toFixed(1) + "px,0)";
  }
}

// The campaign photos slide slowly inside their frames (data-parallax).
// The CSS reads the value --py and moves the photo.
const parallaxItems = qsa("[data-parallax]");

function updateParallax() {
  if (!parallaxItems.length) return;

  if (reducedMotion()) {
    parallaxItems.forEach(function (item) {
      item.style.removeProperty("--py");
    });
    return;
  }

  const viewHeight = window.innerHeight;

  parallaxItems.forEach(function (item) {
    const rect = item.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > viewHeight + 200) return; // not near the screen

    const strength = parseFloat(item.getAttribute("data-parallax")) || 0;
    const offset = rect.top + rect.height / 2 - viewHeight / 2;
    const limit = rect.height * 0.07; // the photo is a little taller than its frame

    item.style.setProperty("--py", clamp(-offset * strength, -limit, limit).toFixed(1) + "px");
  });
}

function initScrollEffects() {
  let waiting = false;

  function run() {
    waiting = false;
    updateHeader();
    updateHero();
    updateParallax();
  }

  window.addEventListener("scroll", function () {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(run);
    }
  }, { passive: true });

  window.addEventListener("resize", run);
  onQueryChange(reduceMotionQuery, run);

  // if someone tabs into the header with the keyboard, show it
  if (siteHeader) {
    siteHeader.addEventListener("focusin", function () {
      siteHeader.classList.remove("is-hidden");
    });
  }

  run();
}


/* ----------------------------------------------------------
   5. ACTIVE MENU LINK (highlights the section you are reading)
   ---------------------------------------------------------- */
function initActiveNav() {
  const links = qsa(".nav-link");
  const sections = qsa("main section[id]");

  if (!links.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      const id = entry.target.id;

      links.forEach(function (link) {
        const isCurrent = link.getAttribute("href") === "#" + id;
        link.classList.toggle("is-active", isCurrent);

        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  sections.forEach(function (section) {
    observer.observe(section);
  });
}


/* ----------------------------------------------------------
   6. SCROLL REVEAL
   Items with data-reveal fade up when they enter the screen.
   Several items that appear together arrive one after another.
   ---------------------------------------------------------- */
// Shows one item straight away (used by the filters too)
function revealNow(element) {
  element.classList.add("is-visible");

  if (revealObserver) {
    revealObserver.unobserve(element);
  }
}

function initReveal() {
  const items = qsa("[data-reveal]");
  if (!items.length) return;

  // Very old browsers: show everything instead of hiding it
  if (!("IntersectionObserver" in window)) return;

  // This class makes the CSS hide the items until they are revealed.
  root.classList.add("reveal-ready");

  revealObserver = new IntersectionObserver(function (entries) {
    const entering = entries.filter(function (entry) {
      return entry.isIntersecting;
    });

    entering.forEach(function (entry, index) {
      // small delay between items that appear at the same moment
      entry.target.style.setProperty("--d", Math.min(index * 0.12, 0.6) + "s");
      revealNow(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  items.forEach(function (item) {
    revealObserver.observe(item);
  });
}


/* ----------------------------------------------------------
   7. 3D TILT (product cards) AND MAGNETIC BUTTONS (mouse only)
   ---------------------------------------------------------- */
function initTilt() {
  qsa("[data-tilt]").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse" || !hasFinePointer() || reducedMotion()) return;

      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;   // 0 to 1 across the card
      const py = (event.clientY - rect.top) / rect.height;   // 0 to 1 down the card

      // the CSS turns these values into a tilt and a soft light
      card.style.setProperty("--tilt-y", ((px - 0.5) * 8).toFixed(2) + "deg");
      card.style.setProperty("--tilt-x", ((0.5 - py) * 6).toFixed(2) + "deg");
      card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    });

    card.addEventListener("pointerleave", function () {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
    });
  });
}

function initMagnetic() {
  qsa("[data-magnetic]").forEach(function (button) {
    let centerX = 0;
    let centerY = 0;

    // remember where the button's centre is before it moves
    button.addEventListener("pointerenter", function () {
      const rect = button.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    });

    button.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse" || !hasFinePointer() || reducedMotion()) return;

      const moveX = (event.clientX - centerX) * 0.22;
      const moveY = (event.clientY - centerY) * 0.3;
      button.style.transform = "translate(" + moveX.toFixed(1) + "px," + moveY.toFixed(1) + "px)";
    });

    button.addEventListener("pointerleave", function () {
      button.style.transform = "";
    });
  });
}


/* ----------------------------------------------------------
   8. PRODUCT FILTERS
   Works with the filter buttons, the collection cards and the
   footer "Shop" links (all of them have data-filter or data-filter-link).
   ---------------------------------------------------------- */
const FILTER_LABELS = {
  all: "All",
  women: "Women",
  men: "Men",
  accessories: "Accessories"
};

function initFilters() {
  const buttons = qsa(".filter-btn");
  const grid = document.getElementById("productGrid");
  const status = document.getElementById("filterStatus");
  const emptyMessage = document.getElementById("noProducts");

  if (!grid) return;

  const cards = qsa(".product-card", grid);

  function applyFilter(name, silent) {
    // only accept the names we know about
    if (!Object.prototype.hasOwnProperty.call(FILTER_LABELS, name)) {
      name = "all";
    }

    const animate = !silent && !reducedMotion();
    let shown = 0;

    // light up the chosen button
    buttons.forEach(function (button) {
      const isActive = button.getAttribute("data-filter") === name;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    // show the matching products and hide the rest
    cards.forEach(function (card) {
      const matches = name === "all" || card.getAttribute("data-category") === name;

      if (!matches) {
        card.hidden = true;
        card.classList.remove("is-entering");
        return;
      }

      card.hidden = false;
      revealNow(card); // make sure the card is never left invisible
      shown++;

      if (animate) {
        // restart the little entrance animation, one card after another
        card.classList.remove("is-entering");
        void card.offsetWidth;
        card.style.animationDelay = ((shown - 1) * 0.06).toFixed(2) + "s";
        card.classList.add("is-entering");
      }
    });

    if (emptyMessage) {
      emptyMessage.hidden = shown > 0;
    }

    // a spoken message for screen readers (and a small note for everyone)
    if (status) {
      status.textContent =
        "Showing " + shown + (shown === 1 ? " piece" : " pieces") +
        (name === "all" ? "" : " in " + FILTER_LABELS[name]);
    }
  }

  // clean up the entrance animation when it ends
  grid.addEventListener("animationend", function (event) {
    if (event.animationName === "cardIn" && event.target.classList.contains("product-card")) {
      event.target.classList.remove("is-entering");
      event.target.style.animationDelay = "";
    }
  });

  // the filter buttons
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-filter"), false);
    });
  });

  // collection cards and footer links: set the filter, then the page scrolls to New Arrivals
  qsa("[data-filter-link]").forEach(function (link) {
    link.addEventListener("click", function () {
      applyFilter(link.getAttribute("data-filter-link"), false);
    });
  });

  applyFilter("all", true);
}


/* ----------------------------------------------------------
   9. SHOPPING BAG
   - Adds items from the "Add to Bag" buttons
   - Quantity buttons, remove, clear, count and subtotal
   - Remembers your bag with localStorage
   - There is NO real checkout or payment in this demo
   ---------------------------------------------------------- */
const STORAGE_KEY = "veloura-bag-v1";
const MAX_QTY = 10; // most of one piece in the demo

const catalog = new Map(); // product id -> { id, name, price, category, image, alt }
let bag = [];              // [{ id, qty }]

// Money: whole dollars normally, cents only if a price has them
const moneyWhole = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0
});
const moneyCents = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2
});

function formatMoney(amount) {
  return Number.isInteger(amount) ? moneyWhole.format(amount) : moneyCents.format(amount);
}

// The bag elements (found when the page starts)
let bagButton, bagCount, bagOverlay, bagDrawer, bagCloseButton, bagItemsList;
let bagSubtotal, bagTitleCount, bagMessage, bagItemTemplate, toast;

let lastFocusedBeforeBag = null;
let overlayTimer = 0;
let toastTimer = 0;
const addedTimers = new WeakMap();

/* ----- Reading the products from your HTML ----- */
function buildCatalog() {
  qsa(".product-card[data-id]").forEach(function (card) {
    const id = card.getAttribute("data-id");
    const price = Number(card.getAttribute("data-price"));
    if (!id || !isFinite(price) || price < 0) return;

    const img = qs("img", card);

    catalog.set(id, {
      id: id,
      name: card.getAttribute("data-name") || id,
      price: price,
      category: card.getAttribute("data-category") || "",
      image: img ? img.getAttribute("src") || "" : "",
      alt: img ? img.getAttribute("alt") || "" : ""
    });
  });
}

/* ----- Saving and loading (localStorage) ----- */
function loadBag() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];

    const clean = [];
    const seen = new Set();

    data.forEach(function (entry) {
      if (!entry || typeof entry.id !== "string") return;
      if (!catalog.has(entry.id) || seen.has(entry.id)) return;

      const qty = Math.floor(Number(entry.qty));
      if (!(qty >= 1)) return;

      clean.push({ id: entry.id, qty: Math.min(qty, MAX_QTY) });
      seen.add(entry.id);
    });

    return clean;
  } catch (error) {
    return []; // storage blocked or unreadable: start with an empty bag
  }
}

function saveBag() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  } catch (error) {
    // storage is blocked (private mode, for example). The bag still works until you leave the page.
  }
}

/* ----- Small messages ----- */
function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 2600);
}

function setBagMessage(message) {
  if (bagMessage) bagMessage.textContent = message;
}

function bumpBagButton() {
  if (!bagButton || reducedMotion()) return;

  bagButton.classList.remove("is-bumping");
  void bagButton.offsetWidth;
  bagButton.classList.add("is-bumping");

  setTimeout(function () {
    bagButton.classList.remove("is-bumping");
  }, 700);
}

// the "Add to Bag" button briefly says "Added"
function flashAdded(button) {
  const label = qs("span", button);
  if (!label) return;

  if (!button.getAttribute("data-label")) {
    button.setAttribute("data-label", label.textContent);
  }

  label.textContent = "Added";
  button.classList.add("is-added");

  clearTimeout(addedTimers.get(button));
  addedTimers.set(button, setTimeout(function () {
    label.textContent = button.getAttribute("data-label");
    button.classList.remove("is-added");
  }, 1500));
}

/* ----- Drawing the bag ----- */
function findBagItem(id) {
  return qsa(".bag-item", bagItemsList).find(function (li) {
    return li.getAttribute("data-id") === id;
  });
}

function createBagItem(id) {
  const fragment = document.importNode(bagItemTemplate.content, true);
  const li = qs(".bag-item", fragment);

  li.setAttribute("data-id", id);

  const img = qs("img", li);
  if (img) watchImage(img);

  return li;
}

function updateBagItem(li, entry, product) {
  const img = qs(".bag-item-media img", li);
  if (img) {
    if (product.image && img.getAttribute("src") !== product.image) {
      img.classList.remove("is-broken");
      img.setAttribute("src", product.image);
    }
    img.alt = product.name;
  }

  qs(".bag-item-name", li).textContent = product.name;
  qs(".bag-item-price", li).textContent = formatMoney(product.price);
  qs(".qty-value", li).textContent = String(entry.qty);
  qs(".bag-item-line", li).textContent = formatMoney(product.price * entry.qty);

  const decrease = qs('[data-action="decrease"]', li);
  const increase = qs('[data-action="increase"]', li);
  const remove = qs('[data-action="remove"]', li);

  // at quantity 1 the minus button removes the item
  decrease.setAttribute(
    "aria-label",
    entry.qty > 1 ? "Decrease quantity of " + product.name : "Remove " + product.name + " from bag"
  );
  increase.setAttribute("aria-label", "Increase quantity of " + product.name);
  remove.setAttribute("aria-label", "Remove " + product.name + " from bag");
}

function renderBag() {
  let totalItems = 0;
  let subtotalCents = 0;

  bag.forEach(function (entry) {
    const product = catalog.get(entry.id);
    if (!product) return;

    totalItems += entry.qty;
    subtotalCents += Math.round(product.price * 100) * entry.qty;
  });

  // the number on the bag button
  bagCount.textContent = totalItems > 99 ? "99+" : String(totalItems);
  bagButton.classList.toggle("has-items", totalItems > 0);
  bagButton.setAttribute(
    "aria-label",
    "Open shopping bag, " + totalItems + (totalItems === 1 ? " item" : " items")
  );

  bagTitleCount.textContent = "(" + totalItems + ")";
  bagSubtotal.textContent = formatMoney(subtotalCents / 100);

  // keep the list in step with the bag (update, add or remove rows)
  const leftovers = new Map();
  qsa(".bag-item", bagItemsList).forEach(function (li) {
    leftovers.set(li.getAttribute("data-id"), li);
  });

  bag.forEach(function (entry) {
    const product = catalog.get(entry.id);
    if (!product) return;

    let li = leftovers.get(entry.id);

    if (li) {
      leftovers.delete(entry.id);
    } else {
      li = createBagItem(entry.id);
      bagItemsList.appendChild(li);
    }

    updateBagItem(li, entry, product);
  });

  leftovers.forEach(function (li) {
    li.remove();
  });

  // the CSS shows the empty message or the list, depending on this class
  bagDrawer.classList.toggle("is-empty", totalItems === 0);
}

/* ----- Changing the bag ----- */
function addToBag(id) {
  const product = catalog.get(id);
  if (!product) return { ok: false, reason: "unknown" };

  const entry = bag.find(function (item) { return item.id === id; });

  if (entry) {
    if (entry.qty >= MAX_QTY) return { ok: false, reason: "max" };
    entry.qty += 1;
  } else {
    bag.push({ id: id, qty: 1 });
  }

  saveBag();
  renderBag();
  return { ok: true, product: product };
}

function changeQuantity(id, change) {
  const entry = bag.find(function (item) { return item.id === id; });
  if (!entry) return;

  const newQty = entry.qty + change;

  if (newQty < 1) {
    removeFromBag(id);
    return;
  }

  if (newQty > MAX_QTY) {
    setBagMessage("You can add up to " + MAX_QTY + " of each piece in this demo.");
    return;
  }

  entry.qty = newQty;
  setBagMessage("");
  saveBag();
  renderBag();
}

function removeFromBag(id) {
  const li = findBagItem(id);

  function commit() {
    bag = bag.filter(function (item) { return item.id !== id; });
    setBagMessage("");
    saveBag();
    renderBag();

    // the button the visitor was using has gone, so move focus somewhere sensible
    if (bagDrawer.classList.contains("is-open")) {
      if (bag.length === 0) {
        const continueButton = document.getElementById("bagContinue");
        if (continueButton) continueButton.focus();
      } else {
        bagCloseButton.focus();
      }
    }
  }

  if (li && !reducedMotion()) {
    if (li.getAttribute("data-removing")) return; // already on its way out
    li.setAttribute("data-removing", "true");
    li.classList.add("is-removing"); // the CSS fades it out
    setTimeout(commit, 380);
  } else {
    commit();
  }
}

function clearBag() {
  bag = [];
  setBagMessage("");
  saveBag();
  renderBag();

  const continueButton = document.getElementById("bagContinue");
  if (continueButton) continueButton.focus();
}

/* ----- Opening and closing the drawer ----- */
function openBag() {
  if (bagDrawer.classList.contains("is-open")) return;

  setMenu(false);
  lastFocusedBeforeBag = document.activeElement;

  clearTimeout(overlayTimer);
  bagOverlay.hidden = false;
  void bagOverlay.offsetWidth; // lets the fade-in animation start

  bagOverlay.classList.add("is-visible");
  bagDrawer.classList.add("is-open");
  bagDrawer.setAttribute("aria-hidden", "false");
  bagButton.setAttribute("aria-expanded", "true");
  body.classList.add("bag-open");

  bagCloseButton.focus();
}

function closeBag() {
  if (!bagDrawer.classList.contains("is-open")) return;

  bagOverlay.classList.remove("is-visible");
  bagDrawer.classList.remove("is-open");
  bagDrawer.setAttribute("aria-hidden", "true");
  bagButton.setAttribute("aria-expanded", "false");
  body.classList.remove("bag-open");

  // hide the dark overlay completely once its fade-out has finished
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(function () {
    bagOverlay.hidden = true;
  }, reducedMotion() ? 0 : 500);

  if (lastFocusedBeforeBag && typeof lastFocusedBeforeBag.focus === "function") {
    lastFocusedBeforeBag.focus();
  }
}

function initBag() {
  bagButton = document.getElementById("bagButton");
  bagCount = document.getElementById("bagCount");
  bagOverlay = document.getElementById("bagOverlay");
  bagDrawer = document.getElementById("bagDrawer");
  bagCloseButton = document.getElementById("bagClose");
  bagItemsList = document.getElementById("bagItems");
  bagSubtotal = document.getElementById("bagSubtotal");
  bagTitleCount = document.getElementById("bagTitleCount");
  bagMessage = document.getElementById("bagMessage");
  bagItemTemplate = document.getElementById("bagItemTemplate");
  toast = document.getElementById("toast");

  // if any part of the bag is missing from the HTML, skip the bag instead of breaking the page
  if (!bagButton || !bagCount || !bagOverlay || !bagDrawer || !bagCloseButton ||
      !bagItemsList || !bagSubtotal || !bagTitleCount || !bagItemTemplate) {
    console.warn("Veloura: shopping bag elements not found, bag disabled.");
    return;
  }

  buildCatalog();
  bag = loadBag();
  bagButton.setAttribute("aria-expanded", "false");
  renderBag();

  // "Add to Bag" buttons on the product cards
  qsa(".quick-add").forEach(function (button) {
    button.addEventListener("click", function () {
      const card = button.closest(".product-card");
      if (!card) return;

      const result = addToBag(card.getAttribute("data-id"));

      if (result.ok) {
        flashAdded(button);
        bumpBagButton();
        setBagMessage("");
        showToast(result.product.name + " added to your bag");
      } else if (result.reason === "max") {
        showToast("You can add up to " + MAX_QTY + " of each piece in this demo.");
      }
    });
  });

  // open and close
  bagButton.addEventListener("click", openBag);
  bagCloseButton.addEventListener("click", closeBag);
  bagOverlay.addEventListener("click", closeBag);

  // plus, minus and remove buttons inside the bag
  bagItemsList.addEventListener("click", function (event) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const li = actionButton.closest(".bag-item");
    if (!li) return;

    const id = li.getAttribute("data-id");
    const action = actionButton.getAttribute("data-action");

    if (action === "increase") changeQuantity(id, 1);
    if (action === "decrease") changeQuantity(id, -1);
    if (action === "remove") removeFromBag(id);
  });

  // "Continue Shopping" in the empty bag
  const continueButton = document.getElementById("bagContinue");
  if (continueButton) {
    continueButton.addEventListener("click", function () {
      closeBag();

      const target = document.getElementById("arrivals");
      if (target) {
        target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      }
    });
  }

  // "Clear bag"
  const clearButton = document.getElementById("bagClear");
  if (clearButton) {
    clearButton.addEventListener("click", clearBag);
  }

  // "Checkout (Demo)": there is no real checkout, and the message says so
  const checkoutButton = document.getElementById("checkoutButton");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {
      setBagMessage(
        "Demo only: this website has no checkout or payment system. " +
        "No order was placed and nothing was charged."
      );
    });
  }

  // keyboard: Escape closes the bag, Tab stays inside it
  document.addEventListener("keydown", function (event) {
    if (!bagDrawer.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeBag();
      return;
    }

    if (event.key === "Tab") {
      const focusable = qsa("button:not([disabled])", bagDrawer).filter(function (el) {
        return el.getClientRects().length > 0;
      });
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && (document.activeElement === first || document.activeElement === bagDrawer)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // if the bag is changed in another browser tab, update this one too
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      bag = loadBag();
      renderBag();
    }
  });
}


/* ----------------------------------------------------------
   10. NEWSLETTER FORM (demo)
   Checks the email and shows a clearly labelled demo message.
   NOTHING is sent or stored anywhere.
   ---------------------------------------------------------- */
function initNewsletter() {
  const form = document.getElementById("newsletterForm");
  const input = document.getElementById("newsletterEmail");
  const result = document.getElementById("newsletterResult");

  if (!form || !input || !result) return;

  const group = input.closest(".form-group");
  const errorBox = group ? qs(".error-text", group) : null;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(message) {
    if (group) group.classList.add("error");
    if (errorBox) errorBox.textContent = message;
    input.setAttribute("aria-invalid", "true");
  }

  function clearError() {
    if (group) group.classList.remove("error");
    if (errorBox) errorBox.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  // the error disappears as soon as the visitor starts fixing it
  input.addEventListener("input", function () {
    clearError();

    if (result.classList.contains("is-error")) {
      result.className = "form-result";
      result.textContent = "";
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    clearError();
    result.className = "form-result";
    result.textContent = "";

    const value = input.value.trim();
    let problem = "";

    if (!value) {
      problem = "Please enter your email address.";
    } else if (value.length > 254) {
      problem = "That email address is too long.";
    } else if (!emailPattern.test(value) || value.indexOf("..") !== -1) {
      problem = "Please enter a valid email address, like name@example.com.";
    }

    if (problem) {
      setError(problem);
      result.textContent = "Please check your email address and try again.";
      result.classList.add("is-error");
      input.focus();
      return;
    }

    // The email looks fine. This is a demo, so we only show a message.
    result.textContent =
      "Demo only: your email looks valid, but this website has no server. " +
      "Nothing was stored or sent, and no subscription was created.";
    result.classList.add("is-success");
    form.reset();
  });
}


/* ----------------------------------------------------------
   11. FOOTER YEAR
   ---------------------------------------------------------- */
function initYear() {
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}


/* ----------------------------------------------------------
   12. 3D HERO SCULPTURE (Three.js)
   Draws a slowly turning gold sculpture on the hero canvas.
   If Three.js did not load, WebGL is not supported, or anything
   goes wrong, the CSS gold rings stay visible instead.
   ---------------------------------------------------------- */
/* ----------------------------------------------------------
   12. 3D HERO SCULPTURE (Three.js)
   A luxury perfume bottle built from code (no model files):
   thick glass, champagne-gold fittings, a soft glow and a few
   drifting gold particles.
   If Three.js did not load, WebGL is not supported, or anything
   goes wrong, the CSS bottle in the hero stays visible instead.
   ---------------------------------------------------------- */
function initHeroSculpture() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || !heroStage || !hero) return;

  // Three.js did not load (offline, for example): the CSS bottle stays.
  if (typeof window.THREE === "undefined") {
    console.info("Veloura: Three.js not loaded, showing the CSS bottle instead.");
    return;
  }

  const THREE = window.THREE;

  // ----- Easy settings: change these numbers to adjust the look -----
  const SETTINGS = {
    spinSpeed: 0.3,          // how fast the bottle turns (higher = faster)
    glassOpacity: 0.3,       // 0 = invisible glass, 1 = solid glass
    glassReflections: 2.2,   // how strongly the glass shows reflections
    goldReflections: 1.4,    // how shiny the gold looks
    liquidColor: 0xe3b96d,   // colour of the perfume
    goldColor: 0xd9b97e,     // colour of the cap and collar
    particleCount: 70,       // number of floating gold specks (fewer on phones)
    mouseStrength: 1         // 0 switches the mouse movement off
  };

  let renderer = null;
  let frameId = 0;
  let running = false;
  let heroVisible = true;
  let lastTime = 0;
  let elapsed = 0;
  let spin = 0.5;                  // the bottle's turn angle (starts slightly turned)

  const pointer = { x: 0, y: 0 };  // where the mouse is (-1 to 1)
  const smooth = { x: 0, y: 0 };   // the same, eased for smooth movement

  // Switch the 3D off and bring the CSS bottle back
  function disable() {
    running = false;
    cancelAnimationFrame(frameId);
    heroStage.classList.remove("is-webgl");
  }

  // A glass block with softly rounded corners and edges
  function roundedBox(width, height, depth, radius, bevel) {
    const w = width - bevel * 2;
    const h = height - bevel * 2;
    const r = Math.max(0.001, Math.min(radius, w / 2, h / 2));
    const x = -w / 2;
    const y = -h / 2;

    const shape = new THREE.Shape();
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(depth - bevel * 2, 0.001),
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 5,
      curveSegments: 10
    });

    geometry.center();
    return geometry;
  }

  // A soft round glow picture, drawn with code (used for the particles and the light)
  function makeGlowTexture() {
    const size = 128;
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = size;
    glowCanvas.height = size;

    const context = glowCanvas.getContext("2d");
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255, 244, 220, 1)");
    gradient.addColorStop(0.35, "rgba(236, 211, 165, 0.45)");
    gradient.addColorStop(1, "rgba(212, 180, 131, 0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(glowCanvas);
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    console.info("Veloura: WebGL is not available, showing the CSS bottle instead.");
    return;
  }

  try {
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const isSmallScreen = window.innerWidth < 700;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.35, 8.6);
    camera.lookAt(0, 0, 0);

    // Reflections: tall soft lights in a dark room, like a photo studio.
    // They create the long, soft highlights you see on real glass.
    try {
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x0a0908);

      const addPanel = function (width, height, color, strength, x, y, z) {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color).multiplyScalar(strength),
          side: THREE.DoubleSide
        });
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
        panel.position.set(x, y, z);
        panel.lookAt(0, 0, 0);
        envScene.add(panel);
      };

      addPanel(2.2, 14, 0xfff4e0, 7, -8, 0, 4);    // tall soft light, left
      addPanel(2.2, 14, 0xffffff, 5, 8, 1, 3);     // tall soft light, right
      addPanel(14, 5, 0xfff1d6, 4, 0, 9, 2);       // light from above
      addPanel(14, 2.5, 0xd4b483, 3.5, 0, -8, 5);  // warm gold light from below
      addPanel(7, 14, 0xe8c4c0, 1.6, 0, 0, -9);    // soft blush behind
      addPanel(3, 10, 0xffffff, 3, -4, 0, -7);     // thin edge light, back left
      addPanel(3, 10, 0xfff0d8, 3, 4, 0, -7);      // thin edge light, back right

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(envScene, 0.03).texture;
    } catch (error) {
      console.warn("Veloura: reflections could not be built, using plain lights.", error);
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));

    const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.2);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xe8c4c0, 1, 40);
    rimLight.position.set(-6, 2, -3);
    scene.add(rimLight);

    // Materials
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: SETTINGS.goldColor,
      metalness: 1,
      roughness: 0.16,
      envMapIntensity: SETTINGS.goldReflections
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: SETTINGS.glassOpacity,
      envMapIntensity: SETTINGS.glassReflections,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: SETTINGS.liquidColor,
      metalness: 0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
      emissive: 0x2a1805,
      envMapIntensity: 0.9,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1
    });

    // "stage" holds everything and moves with the mouse and the scroll.
    // "bottle" is the part that turns.
    const stage = new THREE.Group();
    scene.add(stage);

    const bottle = new THREE.Group();
    bottle.position.y = -0.33; // centres the bottle in the picture
    stage.add(bottle);

    // Thick glass base
    const base = new THREE.Mesh(roundedBox(1.74, 0.34, 1.14, 0.16, 0.06), glassMaterial);
    base.position.y = -1.25;
    base.renderOrder = 2;
    bottle.add(base);

    // Perfume inside the glass
    const liquid = new THREE.Mesh(roundedBox(1.32, 1.5, 0.7, 0.18, 0.08), liquidMaterial);
    liquid.position.y = -0.15;
    liquid.renderOrder = 1;
    bottle.add(liquid);

    // Glass body
    const body = new THREE.Mesh(roundedBox(1.62, 2.0, 1.0, 0.24, 0.12), glassMaterial);
    body.position.y = -0.1;
    body.renderOrder = 2;
    bottle.add(body);

    // Gold collar and ring
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.24, 48), goldMaterial);
    collar.position.y = 1.02;
    bottle.add(collar);

    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 16, 64), goldMaterial);
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.y = 0.9;
    bottle.add(collarRing);

    // Gold cap
    const cap = new THREE.Mesh(roundedBox(0.98, 0.95, 0.72, 0.16, 0.06), goldMaterial);
    cap.position.y = 1.6;
    bottle.add(cap);

    // A gold "V" for Veloura, on the front and on the back of the glass
    const vShape = new THREE.Shape();
    vShape.moveTo(-0.26, 0.3);
    vShape.lineTo(-0.11, 0.3);
    vShape.lineTo(0, -0.06);
    vShape.lineTo(0.11, 0.3);
    vShape.lineTo(0.26, 0.3);
    vShape.lineTo(0.05, -0.34);
    vShape.lineTo(-0.05, -0.34);
    vShape.lineTo(-0.26, 0.3);

    const vGeometry = new THREE.ExtrudeGeometry(vShape, { depth: 0.03, bevelEnabled: false });

    const vFront = new THREE.Mesh(vGeometry, goldMaterial);
    vFront.position.set(0, -0.1, 0.5);
    bottle.add(vFront);

    const vBack = new THREE.Mesh(vGeometry, goldMaterial);
    vBack.position.set(0, -0.1, -0.5);
    vBack.rotation.y = Math.PI;
    bottle.add(vBack);

    // Soft glow behind the bottle and on the floor under it
    const glowTexture = makeGlowTexture();

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xd4b483,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    halo.scale.set(6.5, 6.5, 1);
    halo.position.set(0, 0.1, -1.8);
    stage.add(halo);

    const floorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = -1.78;
    stage.add(floorGlow);

    // Tiny gold specks drifting slowly upwards
    const particleCount = isSmallScreen ? Math.round(SETTINGS.particleCount / 2) : SETTINGS.particleCount;
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    function placeParticle(i, anywhere) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.1 + Math.random() * 1.5;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = anywhere ? -1.8 + Math.random() * 4.4 : -1.9;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.7;
      speeds[i] = 0.06 + Math.random() * 0.16;
      phases[i] = Math.random() * Math.PI * 2;
    }

    for (let i = 0; i < particleCount; i++) {
      placeParticle(i, true);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      map: glowTexture,
      color: 0xecd3a5,
      size: isSmallScreen ? 0.12 : 0.1,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.frustumCulled = false;
    particles.renderOrder = 3;
    stage.add(particles);

    // Moves everything a tiny step (dt = seconds since the last frame)
    function updateScene(dt) {
      elapsed += dt;

      // the bottle gently follows the mouse
      smooth.x += (pointer.x - smooth.x) * Math.min(dt * 3, 1);
      smooth.y += (pointer.y - smooth.y) * Math.min(dt * 3, 1);

      const mouse = SETTINGS.mouseStrength;
      spin += dt * SETTINGS.spinSpeed;

      // scrolling down turns the bottle a little more and lifts it away
      bottle.rotation.y = spin + heroProgress * 0.9 + smooth.x * 0.45 * mouse;
      stage.rotation.x = smooth.y * 0.08 * mouse;
      stage.rotation.z = -smooth.x * 0.03 * mouse;
      stage.position.x = smooth.x * 0.15 * mouse;
      stage.position.y = Math.sin(elapsed * 0.8) * 0.06 + heroProgress * 0.7;
      stage.scale.setScalar(1 - heroProgress * 0.15);

      // the specks drift upwards and slowly circle the bottle
      if (dt > 0) {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += speeds[i] * dt;
          positions[i * 3] += Math.sin(elapsed * 0.6 + phases[i]) * 0.1 * dt;

          if (positions[i * 3 + 1] > 2.6) {
            placeParticle(i, false);
          }
        }

        particleGeometry.attributes.position.needsUpdate = true;
        particles.rotation.y += dt * 0.05;
        particleMaterial.opacity = 0.7 + Math.sin(elapsed * 0.9) * 0.15;
      }
    }

    function drawFrame(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      updateScene(dt);
      renderer.render(scene, camera);
    }

    function loop(now) {
      frameId = requestAnimationFrame(loop);
      drawFrame(now);
    }

    function start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      frameId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frameId);
    }

    // One still picture (used when the visitor prefers reduced motion)
    function drawOnce() {
      updateScene(0);
      renderer.render(scene, camera);
    }

    // Runs only when it is useful: hero on screen, tab visible, motion allowed
    function refresh() {
      if (reducedMotion()) {
        stop();
        drawOnce();
      } else if (!heroVisible || document.hidden) {
        stop();
      } else {
        start();
      }
    }

    function resize() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1.5 : 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (!running) drawOnce();
    }

    // If the browser takes the 3D context away, bring the CSS bottle back
    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
      disable();
    });

    // From here the canvas is shown and the CSS bottle is hidden
    heroStage.classList.add("is-webgl");
    resize();
    drawOnce();

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        refresh();
      }).observe(hero);
    }

    document.addEventListener("visibilitychange", refresh);
    onQueryChange(reduceMotionQuery, refresh);

    // mouse movement (laptops and desktops only)
    window.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse" || reducedMotion()) return;

      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    refresh();
  } catch (error) {
    // anything went wrong: switch the 3D off and show the CSS bottle
    console.warn("Veloura: the 3D hero could not start, showing the CSS bottle instead.", error);
    disable();
  }
}


/* ----------------------------------------------------------
   12. HERO GLITTER SPARKLES (Three.js)
   ---------------------------------------------------------- */
function initHeroSculpture() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || !heroStage || !hero) return;

  if (typeof window.THREE === "undefined") return;

  const THREE = window.THREE;
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 8;

    // Tiny floating gold sparkles
    const count = window.innerWidth < 700 ? 100 : 180;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      sizes[i] = 0.025 + Math.random() * 0.07;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      color: 0xe8c77b,
      size: 0.06,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sparkles = new THREE.Points(geometry, material);
    scene.add(sparkles);

    function resize() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function animate() {
      requestAnimationFrame(animate);

      const time = performance.now() * 0.001;
      sparkles.rotation.y = Math.sin(time * 0.15) * 0.08;
      sparkles.rotation.x = Math.cos(time * 0.12) * 0.04;

      material.opacity = 0.55 + Math.sin(time * 1.5) * 0.2;

      renderer.render(scene, camera);
    }

    heroStage.classList.add("is-webgl");
    resize();
    window.addEventListener("resize", resize);
    animate();
  } catch (error) {
    console.warn("Veloura glitter effect could not start:", error);
    heroStage.classList.remove("is-webgl");
  }
}
/* END OF script.js */

/* =====================================
   VELOURA - START EVERYTHING
===================================== */

function startVeloura() {
  initImageFallbacks();
  initMenu();
  initScrollEffects();
  initActiveNav();
  initReveal();
  initTilt();
  initMagnetic();
  initFilters();
  initProductSearch();
  initProductDetails();
  initBag();
  initNewsletter();
  initYear();
  initHeroSculpture();

  console.log("VELOURA website initialized successfully!");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startVeloura);
} else {
  startVeloura();
}

/* VELOURA PRODUCT SEARCH */

function initProductSearch() {
  const searchInput = document.getElementById("productSearch");
  const cards = document.querySelectorAll(".product-card");
  const status = document.getElementById("filterStatus");
  const emptyMessage = document.getElementById("noProducts");

  if (!searchInput) return;

  function searchProducts() {
    const query = searchInput.value.trim().toLowerCase();

    const activeFilter = document.querySelector(".filter-btn.is-active");
    const category = activeFilter
      ? activeFilter.getAttribute("data-filter")
      : "all";

    let shown = 0;

    cards.forEach(function (card) {
      const name = (card.getAttribute("data-name") || "").toLowerCase();
      const productCategory = card.getAttribute("data-category");

      const matchesName = name.includes(query);
      const matchesCategory =
        category === "all" || productCategory === category;

      const matches = matchesName && matchesCategory;

      card.hidden = !matches;

      if (matches) shown++;
    });

    if (emptyMessage) {
      emptyMessage.hidden = shown > 0;
    }

    if (status) {
      status.textContent = shown > 0
        ? "Showing " + shown + " matching product(s)"
        : "No products found";
    }
  }

  searchInput.addEventListener("input", searchProducts);

  document.querySelectorAll(".filter-btn").forEach(function (button) {
    button.addEventListener("click", searchProducts);
  });
}
/* =====================================
   VELOURA - PRODUCT DETAILS & CHECKOUT
===================================== */

function initProductDetails() {
  const productGrid = document.getElementById("productGrid");
  if (!productGrid) return;

  // Luxury-style popup design
  if (!document.getElementById("velouraPurchaseStyles")) {
    const style = document.createElement("style");
    style.id = "velouraPurchaseStyles";
    style.textContent = `
      .veloura-purchase-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,.88);
        display: flex; align-items: center; justify-content: center;
        padding: 20px; overflow-y: auto;
      }
      .veloura-purchase-panel {
        background: #15100f; color: #f5eee5;
        border: 1px solid #a98755; width: 100%;
        max-width: 850px; padding: 30px; position: relative;
        max-height: 90vh; overflow-y: auto;
      }
      .veloura-purchase-close {
        position: absolute; right: 18px; top: 12px;
        background: none; border: 0; color: #d8bd91;
        font-size: 28px; cursor: pointer;
      }
      .veloura-product-detail {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 28px; align-items: center;
      }
      .veloura-product-detail img {
        width: 100%; max-height: 430px; object-fit: cover;
      }
      .veloura-purchase-panel h2 {
        font-family: Georgia,serif; font-weight: 400;
        color: #d8bd91; margin: 12px 0;
      }
      .veloura-purchase-panel p { line-height: 1.7; }
      .veloura-buy-button {
        width: 100%; padding: 15px; margin-top: 20px;
        background: #c5a477; color: #17100c;
        border: 0; cursor: pointer; letter-spacing: 2px;
      }
      .veloura-checkout-form {
        display: grid; gap: 13px; margin-top: 20px;
      }
      .veloura-checkout-form input,
      .veloura-checkout-form textarea {
        width: 100%; padding: 13px; background: #211a18;
        border: 1px solid #6e5941; color: white;
        box-sizing: border-box; font: inherit;
      }
      @media(max-width:600px) {
        .veloura-product-detail { grid-template-columns: 1fr; }
        .veloura-purchase-panel { padding: 22px 16px; }
      }
    `;
    document.head.appendChild(style);
  }

  let selectedProduct = null;

  function openPurchaseWindow(content) {
    closePurchaseWindow();

    const overlay = document.createElement("div");
    overlay.className = "veloura-purchase-overlay";
    overlay.id = "velouraPurchaseOverlay";

    overlay.innerHTML = `
      <div class="veloura-purchase-panel">
        <button class="veloura-purchase-close" type="button"
          aria-label="Close">&times;</button>
        ${content}
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".veloura-purchase-close")
      .addEventListener("click", closePurchaseWindow);

    overlay.addEventListener("click", function(event) {
      if (event.target === overlay) closePurchaseWindow();
    });
  }

  function closePurchaseWindow() {
    const oldWindow = document.getElementById("velouraPurchaseOverlay");
    if (oldWindow) oldWindow.remove();
  }

  function showProductDetails(card) {
    const image = card.querySelector(".product-media img");
    selectedProduct = {
      name: card.dataset.name,
      price: Number(card.dataset.price),
      category: card.dataset.category,
      image: image ? image.getAttribute("src") : ""
    };

    openPurchaseWindow(`
      <div class="veloura-product-detail">
        <img src="${selectedProduct.image}" alt="${selectedProduct.name}">
        <div>
          <p>${selectedProduct.category.toUpperCase()}</p>
          <h2>${selectedProduct.name}</h2>
          <h3>$${selectedProduct.price.toLocaleString("en-US")}</h3>
          <p>A timeless piece from the VELOURA collection.</p>
          <button class="veloura-buy-button" id="velouraBuyNow">
            BUY NOW
          </button>
        </div>
      </div>
    `);

    document.getElementById("velouraBuyNow")
      .addEventListener("click", showCheckout);
  }

  function showCheckout() {
    if (!selectedProduct) return;

    openPurchaseWindow(`
      <h2>CHECKOUT</h2>
      <p>${selectedProduct.name} — $${selectedProduct.price.toLocaleString("en-US")}</p>

      <form class="veloura-checkout-form" id="velouraCheckoutForm">
        <input name="name" placeholder="Full Name" required>
        <input name="email" type="email" placeholder="Email Address" required>
        <input name="mobile" type="tel" placeholder="Mobile Number"
          pattern="[0-9]{10}" maxlength="10" required>
        <textarea name="address" placeholder="Full Address" rows="3" required></textarea>
        <input name="city" placeholder="City" required>
        <input name="state" placeholder="State" required>
        <input name="pincode" placeholder="Pincode"
          pattern="[0-9]{6}" maxlength="6" required>

        <button class="veloura-buy-button" type="submit">
          PAY NOW
        </button>
      </form>
      <p style="font-size:12px;color:#c5a477;">
        Demo checkout only. No real payment will be collected.
      </p>
    `);

    document.getElementById("velouraCheckoutForm")
      .addEventListener("submit", function(event) {
        event.preventDefault();
        alert("Thank you! This is a demo order. No payment was taken.");
        closePurchaseWindow();
      });
  }

  // Click a product card to view its details.
  productGrid.addEventListener("click", function(event) {
    if (event.target.closest(".quick-add")) return;

    const card = event.target.closest(".product-card");
    if (!card) return;

    showProductDetails(card);
  });
}

