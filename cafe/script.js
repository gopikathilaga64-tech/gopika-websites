// =========================================
// 1. MOBILE MENU (hamburger button)
// =========================================
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");
const navLinks = document.querySelectorAll(".nav-link");

navToggle.addEventListener("click", function () {
  const isOpen = nav.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", isOpen);
});

// Close the menu after a link is clicked
navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    nav.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", false);
  });
});

// =========================================
// 2. HEADER CHANGES WHEN YOU SCROLL
// =========================================
const header = document.getElementById("header");

function updateHeader() {
  if (window.scrollY > 60) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", updateHeader);
updateHeader(); // run once when the page loads

// =========================================
// 3. HIGHLIGHT THE ACTIVE NAV LINK
// =========================================
const sections = document.querySelectorAll("main section[id]");

const sectionObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function (link) {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === "#" + entry.target.id
          );
        });
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

sections.forEach(function (section) {
  sectionObserver.observe(section);
});

// =========================================
// 4. MENU CATEGORY BUTTONS (filter the menu)
// =========================================
const tabButtons = document.querySelectorAll(".tab-btn");
const menuItems = document.querySelectorAll(".menu-item");

tabButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    // make this button the active one
    tabButtons.forEach(function (btn) {
      btn.classList.remove("active");
    });
    button.classList.add("active");

    // show or hide the menu items
    const filter = button.dataset.filter;

    menuItems.forEach(function (item) {
      const matches = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("hide", !matches);
    });
  });
});

// =========================================
// 5. SCROLL REVEAL (items fade in as you scroll)
// =========================================
const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // animate only once
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach(function (item) {
  revealObserver.observe(item);
});
// =========================================
// 6. CONTACT FORM (Web3Forms email sending)
// =========================================
const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

contactForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const message = document.getElementById("message");
  const button = contactForm.querySelector('button[type="submit"]');

  formMessage.className = "form-message";

  if (
    !name.value.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ||
    !message.value.trim()
  ) {
    formMessage.textContent =
      "Please enter your name, a valid email, and your message.";
    formMessage.classList.add("error");
    return;
  }

  button.disabled = true;
  button.textContent = "Sending...";

  try {
    const response = await fetch(
      "https://api.web3forms.com/submit",
      {
        method: "POST",
        body: new FormData(contactForm)
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Sending failed");
    }

    formMessage.textContent =
      "Message sent successfully! Thank you, " + name.value.trim() + ".";
    formMessage.classList.add("success");
    contactForm.reset();

  } catch (error) {
    formMessage.textContent =
      "Message could not be sent. Please check your Web3Forms setup and try again.";
    formMessage.classList.add("error");
    console.error("Web3Forms error:", error);

  } finally {
    button.disabled = false;
    button.textContent = "Send Message";
  }
});
// =========================================
// 7. AUTOMATIC YEAR IN THE FOOTER
// =========================================
document.getElementById("year").textContent = new Date().getFullYear();
/* ========== ORDER DEMO ========== */
const orderItems = {};
const orderList = document.getElementById("orderItems");
const orderTotal = document.getElementById("orderTotal");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const orderMessage = document.getElementById("orderMessage");

document.querySelectorAll(".menu-item").forEach((card) => {
  const name = card.querySelector("h3").textContent.trim();
  const priceText = card.querySelector(".price").textContent;
  const price = Number(priceText.replace(/[^0-9.]/g, ""));

  const button = document.createElement("button");
  button.type = "button";
  button.className = "add-order-btn";
  button.textContent = "Add to Order";
  button.addEventListener("click", () => {
    if (!orderItems[name]) {
      orderItems[name] = { price, quantity: 0 };
    }
    orderItems[name].quantity++;
    orderMessage.textContent = "";
    renderOrder();
  });

  card.querySelector(".menu-info").appendChild(button);
});

function renderOrder() {
  orderList.innerHTML = "";
  let total = 0;
  let count = 0;

  Object.entries(orderItems).forEach(([name, item]) => {
    if (item.quantity <= 0) {
      delete orderItems[name];
      return;
    }

    count += item.quantity;
    total += item.price * item.quantity;

    const row = document.createElement("div");
    row.className = "order-row";

    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = name;
    const subtotal = document.createElement("p");
    subtotal.textContent =
      `$${(item.price * item.quantity).toFixed(2)}`;
    details.append(title, subtotal);

    const controls = document.createElement("div");
    controls.className = "order-controls";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", `Remove one ${name}`);
    minus.addEventListener("click", () => {
      item.quantity--;
      renderOrder();
    });

    const quantity = document.createElement("span");
    quantity.textContent = item.quantity;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `Add one ${name}`);
    plus.addEventListener("click", () => {
      item.quantity++;
      renderOrder();
    });

    controls.append(minus, quantity, plus);
    row.append(details, controls);
    orderList.appendChild(row);
  });

  if (count === 0) {
    orderList.innerHTML =
      '<p class="empty-order">No items added yet.</p>';
  }

  orderTotal.textContent = `$${total.toFixed(2)}`;
  placeOrderBtn.disabled = count === 0;
  placeOrderBtn.style.opacity = count === 0 ? "0.5" : "1";
}

placeOrderBtn.addEventListener("click", () => {
  const count = Object.values(orderItems)
    .reduce((sum, item) => sum + item.quantity, 0);

  if (count === 0) return;

  orderMessage.textContent =
    "Demo order placed successfully! Thank you for choosing Bean & Bloom Café.";

  Object.keys(orderItems).forEach((name) => delete orderItems[name]);
  renderOrder();
});

renderOrder();