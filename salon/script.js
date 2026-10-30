/* ==========================================================
   LUXE BEAUTY SALON - script.js
   >>> PART 1 OF 3 STARTS HERE <<<
   ========================================================== */
"use strict";


/* ----------------------------------------------------------
   1. SHARED HELPERS
   ---------------------------------------------------------- */
const root = document.documentElement;

// True if the visitor asked their device for less motion
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// True on laptops and desktops with a mouse (false on phones and tablets)
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Short names for finding things on the page
function qs(selector, scope) {
  return (scope || document).querySelector(selector);
}

function qsa(selector, scope) {
  return Array.from((scope || document).querySelectorAll(selector));
}

const siteHeader = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const primaryNav = document.getElementById("primaryNav");


/* ----------------------------------------------------------
   2. HEADER: gets a dark bar when you scroll,
      hides when you scroll down, returns when you scroll up
   ---------------------------------------------------------- */
function initHeaderScroll() {
  if (!siteHeader) return;

  let lastY = window.scrollY;
  let waiting = false;

  function update() {
    waiting = false;
    const y = window.scrollY;

    siteHeader.classList.toggle("is-scrolled", y > 40);

    // never hide the header while the phone menu is open
    if (document.body.classList.contains("menu-open")) {
      lastY = y;
      return;
    }

    // always show it near the top of the page
    if (y < 200) {
      siteHeader.classList.remove("is-hidden");
      lastY = y;
      return;
    }

    const change = y - lastY;
    if (Math.abs(change) < 6) return; // ignore tiny movements

    siteHeader.classList.toggle("is-hidden", change > 0); // down = hide, up = show
    lastY = y;
  }

  // requestAnimationFrame keeps scrolling smooth
  window.addEventListener("scroll", function () {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  // if someone tabs into the header with the keyboard, show it
  siteHeader.addEventListener("focusin", function () {
    siteHeader.classList.remove("is-hidden");
  });

  update();
}


/* ----------------------------------------------------------
   3. MOBILE MENU (hamburger button and full-screen overlay)
   ---------------------------------------------------------- */
function initMenu() {
  if (!menuToggle || !primaryNav || !siteHeader) return;

  function isOpen() {
    return primaryNav.classList.contains("is-open");
  }

  function setMenu(open) {
    primaryNav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    if (open) {
      siteHeader.classList.remove("is-hidden");
    }
  }

  menuToggle.addEventListener("click", function () {
    setMenu(!isOpen());
  });

  // close the menu after choosing a link
  qsa("a", primaryNav).forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (!isOpen()) return;

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
  window.matchMedia("(min-width: 961px)").addEventListener("change", function (event) {
    if (event.matches) setMenu(false);
  });
}


/* ----------------------------------------------------------
   4. ACTIVE MENU LINK (highlights the section you are reading)
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
   5. FOOTER YEAR
   ---------------------------------------------------------- */
function initYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* ==========================================================
   >>> PART 1 ENDS HERE <<<  (Part 2 goes directly below)
   ========================================================== */
   /* ==========================================================
   >>> PART 2 OF 3 STARTS HERE <<<
   ========================================================== */


/* ----------------------------------------------------------
   6. SCROLL REVEAL
   Items with data-reveal fade up when they enter the screen.
   Several items that appear together arrive one after another.
   ---------------------------------------------------------- */
function initReveal() {
  const items = qsa("[data-reveal]");
  if (!items.length) return;

  // This class makes the CSS hide the items until they are revealed.
  root.classList.add("reveal-ready");

  // Very old browsers: show everything instead of hiding it
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (item) {
      item.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    const entering = entries.filter(function (entry) {
      return entry.isIntersecting;
    });

    entering.forEach(function (entry, index) {
      // small delay between items that appear at the same moment
      entry.target.style.setProperty("--d", Math.min(index * 0.12, 0.6) + "s");
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target); // reveal only once
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  items.forEach(function (item) {
    observer.observe(item);
  });
}


/* ----------------------------------------------------------
   7. NUMBER COUNTERS (the stats in the About section)
   ---------------------------------------------------------- */
function runCounter(element) {
  const target = parseInt(element.getAttribute("data-count"), 10);
  if (isNaN(target)) return;

  const duration = 1600;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // starts fast, ends slowly
    element.textContent = Math.round(target * eased);

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function initCounters() {
  const counters = qsa("[data-count]");

  // The HTML already holds the final numbers, so nothing breaks if we skip this.
  if (!counters.length || prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(function (counter) {
    counter.textContent = "0";
    observer.observe(counter);
  });
}


/* ----------------------------------------------------------
   8. SCROLL DEPTH / PARALLAX
   With GSAP and ScrollTrigger: smooth, scroll-linked depth.
   Without them: a simple built-in version for the hero.
   ---------------------------------------------------------- */
function initParallax() {
  const hero = qs(".hero");
  const heroMedia = qs(".hero-media");
  const heroContent = qs(".hero-content");

  if (!hero || !heroMedia || !heroContent || prefersReducedMotion) return;

  const gsapReady = typeof window.gsap !== "undefined" &&
                    typeof window.ScrollTrigger !== "undefined";

  if (gsapReady) {
    // ----- GSAP version -----
    gsap.registerPlugin(ScrollTrigger);

    // hero photo drifts down slowly as you scroll away
    gsap.to(heroMedia, {
      yPercent: 12,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // hero text lifts and fades out
    gsap.to(heroContent, {
      yPercent: -10,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "70% top",
        scrub: true
      }
    });

    // the two About photos move at different speeds for depth
    const aboutVisual = qs(".about-visual");
    if (aboutVisual) {
      gsap.to(".about-img-1", {
        yPercent: -6,
        ease: "none",
        scrollTrigger: { trigger: aboutVisual, start: "top bottom", end: "bottom top", scrub: true }
      });

      gsap.to(".about-img-2", {
        yPercent: 10,
        ease: "none",
        scrollTrigger: { trigger: aboutVisual, start: "top bottom", end: "bottom top", scrub: true }
      });
    }

    // measure everything again once all images have loaded
    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });

    return;
  }

  // ----- Fallback version (GSAP not found) -----
  let waiting = false;

  function update() {
    waiting = false;

    const heroHeight = hero.offsetHeight;
    const y = window.scrollY;
    if (y > heroHeight) return;

    const progress = y / heroHeight;

    heroMedia.style.transform = "translate3d(0," + (progress * heroHeight * 0.12).toFixed(1) + "px,0)";
    heroContent.style.transform = "translate3d(0," + (-progress * heroHeight * 0.08).toFixed(1) + "px,0)";
    heroContent.style.opacity = String(Math.max(0, 1 - progress * 1.4));
  }

  window.addEventListener("scroll", function () {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}


/* ----------------------------------------------------------
   9. 3D TILT on the treatment cards (mouse only)
   ---------------------------------------------------------- */
function initTilt() {
  if (!hasFinePointer || prefersReducedMotion) return;

  qsa("[data-tilt]").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;

      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;   // 0 to 1 across the card
      const py = (event.clientY - rect.top) / rect.height;   // 0 to 1 down the card

      // the CSS turns these values into a tilt and a soft light
      card.style.setProperty("--tilt-y", ((px - 0.5) * 10).toFixed(2) + "deg");
      card.style.setProperty("--tilt-x", ((0.5 - py) * 8).toFixed(2) + "deg");
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


/* ----------------------------------------------------------
   10. MAGNETIC BUTTONS (mouse only)
   ---------------------------------------------------------- */
function initMagnetic() {
  if (!hasFinePointer || prefersReducedMotion) return;

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
      if (event.pointerType !== "mouse") return;

      const moveX = (event.clientX - centerX) * 0.25;
      const moveY = (event.clientY - centerY) * 0.35;
      button.style.transform = "translate(" + moveX.toFixed(1) + "px," + moveY.toFixed(1) + "px)";
    });

    button.addEventListener("pointerleave", function () {
      button.style.transform = "";
    });
  });
}


/* ----------------------------------------------------------
   11. GOLD DUST (tiny floating particles on the hero)
   Pauses when the hero is off-screen or the tab is hidden.
   ---------------------------------------------------------- */
function initGoldDust() {
  const canvas = document.getElementById("goldDust");
  const hero = qs(".hero");

  if (!canvas || !hero || prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let particles = [];
  let frameId = 0;
  let lastTime = 0;
  let heroVisible = true;

  function makeParticle(startAnywhere) {
    return {
      x: Math.random() * width,
      y: startAnywhere ? Math.random() * height : height + 10,
      radius: 0.6 + Math.random() * 1.6,
      speed: 0.12 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 0.18,
      alpha: 0.25 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // fewer particles on phones to save battery
    const count = width < 700 ? 26 : 56;
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(makeParticle(true));
    }
  }

  function draw(time) {
    const step = Math.min(time - lastTime, 50) / 16.7;
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];

      p.y -= p.speed * step;
      p.x += p.drift * step;

      // start a new particle once one drifts away
      if (p.y < -10 || p.x < -10 || p.x > width + 10) {
        p = particles[i] = makeParticle(false);
      }

      const twinkle = 0.55 + 0.45 * Math.sin(time * 0.0012 + p.phase);

      ctx.beginPath();
      ctx.fillStyle = "rgba(236, 211, 165, " + (p.alpha * twinkle).toFixed(3) + ")";
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    frameId = requestAnimationFrame(draw);
  }

  function start() {
    if (frameId) return;
    lastTime = performance.now();
    frameId = requestAnimationFrame(draw);
  }

  function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function updateRunning() {
    if (heroVisible && !document.hidden) {
      start();
    } else {
      stop();
    }
  }

  resize();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      updateRunning();
    }).observe(hero);
  }

  document.addEventListener("visibilitychange", updateRunning);

  let resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  updateRunning();
}

/* ==========================================================
   >>> PART 2 ENDS HERE <<<  (Part 3 goes directly below)
   ========================================================== */
   /* ==========================================================
   >>> PART 3 OF 3 STARTS HERE <<<
   ========================================================== */


/* ----------------------------------------------------------
   12. BEFORE / AFTER SLIDERS (demo panels)
   The hidden range input moves the gold handle and the reveal.
   ---------------------------------------------------------- */
function initCompare() {
  qsa("[data-compare]").forEach(function (box) {
    const range = qs(".compare-range", box);
    if (!range) return;

    function update() {
      const value = Number(range.value);

      // the CSS uses --pos to place the handle and reveal the "after" side
      box.style.setProperty("--pos", value + "%");

      // a spoken description for screen readers
      range.setAttribute(
        "aria-valuetext",
        "Before shown " + value + " percent, after shown " + (100 - value) + " percent"
      );
    }

    range.addEventListener("input", update);
    update();
  });
}


/* ----------------------------------------------------------
   13. TESTIMONIAL SLIDER (placeholder testimonials)
   ---------------------------------------------------------- */
function initReviews() {
  const slider = document.getElementById("reviewsSlider");
  const prevButton = document.getElementById("reviewPrev");
  const nextButton = document.getElementById("reviewNext");
  const dotsBox = document.getElementById("reviewDots");

  if (!slider || !prevButton || !nextButton || !dotsBox) return;

  const slides = qsa(".review", slider);
  if (slides.length < 2) return;

  let index = slides.findIndex(function (slide) {
    return slide.classList.contains("is-active");
  });
  if (index < 0) index = 0;

  // one small dot for each testimonial
  const dots = slides.map(function () {
    const dot = document.createElement("span");
    dot.className = "dot";
    dotsBox.appendChild(dot);
    return dot;
  });

  function show(newIndex) {
    index = (newIndex + slides.length) % slides.length; // loops around

    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === index);
    });

    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === index);
    });
  }

  // Tell screen readers about changes only after the visitor uses the controls
  function makeAnnounced() {
    const track = qs(".reviews-track", slider);
    if (track) track.setAttribute("aria-live", "polite");
  }

  prevButton.addEventListener("click", function () {
    makeAnnounced();
    show(index - 1);
  });

  nextButton.addEventListener("click", function () {
    makeAnnounced();
    show(index + 1);
  });

  // Left and right arrow keys work too
  slider.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      makeAnnounced();
      show(index - 1);
    } else if (event.key === "ArrowRight") {
      makeAnnounced();
      show(index + 1);
    }
  });

  // Swipe left or right on touch screens
  let startX = null;
  slider.style.touchAction = "pan-y";

  slider.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "touch") startX = event.clientX;
  });

  slider.addEventListener("pointerup", function (event) {
    if (startX === null) return;

    const distance = event.clientX - startX;
    startX = null;

    if (Math.abs(distance) > 50) {
      makeAnnounced();
      show(distance < 0 ? index + 1 : index - 1);
    }
  });

  show(index);
}


/* ----------------------------------------------------------
   14. DEMO BOOKING FORM
   Checks every field and shows a summary.
   NOTHING is sent anywhere and NO booking is made.
   ---------------------------------------------------------- */
function initBooking() {
  const form = document.getElementById("bookingForm");
  const result = document.getElementById("bookingResult");
  const nameInput = document.getElementById("bookName");
  const serviceSelect = document.getElementById("bookService");
  const dateInput = document.getElementById("bookDate");
  const timeSelect = document.getElementById("bookTime");

  if (!form || !result || !nameInput || !serviceSelect || !dateInput || !timeSelect) return;

  const fields = [nameInput, serviceSelect, dateInput, timeSelect];

  // letters (any language), spaces, apostrophes, dots and hyphens; 2 to 80 characters
  const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.\-]{1,79}$/u;

  /* ----- small date helpers ----- */
  function pad(number) {
    return String(number).padStart(2, "0");
  }

  // builds "YYYY-MM-DD" from the visitor's own local date
  function toDateString(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function getTodayMidnight() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function parseDate(value) {
    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  // the date picker only allows today up to one year ahead
  const firstDay = getTodayMidnight();
  const lastDay = new Date(firstDay);
  lastDay.setFullYear(lastDay.getFullYear() + 1);
  dateInput.min = toDateString(firstDay);
  dateInput.max = toDateString(lastDay);

  /* ----- showing and clearing errors ----- */
  function showError(field, message) {
    const group = field.closest(".form-group");
    if (!group) return;

    group.classList.add("error");
    const errorBox = qs(".error-text", group);
    if (errorBox) errorBox.textContent = message;
    field.setAttribute("aria-invalid", "true");
  }

  function clearError(field) {
    const group = field.closest(".form-group");
    if (!group) return;

    group.classList.remove("error");
    const errorBox = qs(".error-text", group);
    if (errorBox) errorBox.textContent = "";
    field.removeAttribute("aria-invalid");
  }

  // an error disappears as soon as the visitor fixes that field
  fields.forEach(function (field) {
    field.addEventListener("input", function () { clearError(field); });
    field.addEventListener("change", function () { clearError(field); });
  });

  /* ----- the result box (built safely: text only, never HTML) ----- */
  function showResult(type, title, lines, note) {
    result.className = "form-result is-" + type;
    result.textContent = "";

    const heading = document.createElement("strong");
    heading.textContent = title;
    result.appendChild(heading);

    if (lines && lines.length) {
      const list = document.createElement("ul");

      lines.forEach(function (line) {
        const item = document.createElement("li");
        item.textContent = line[0] + ": " + line[1];
        list.appendChild(item);
      });

      result.appendChild(list);
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = note;
    result.appendChild(paragraph);
  }

  /* ----- "Book" arrows in the Services list pre-select the service ----- */
  qsa(".service-book").forEach(function (link) {
    link.addEventListener("click", function () {
      const value = link.getAttribute("data-service");

      const exists = Array.from(serviceSelect.options).some(function (option) {
        return option.value === value;
      });

      if (exists) {
        serviceSelect.value = value;
        clearError(serviceSelect);
      }
    });
  });

  /* ----- submit ----- */
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    fields.forEach(clearError);
    result.className = "form-result";
    result.textContent = "";

    const problems = [];
    const now = new Date();
    const todayMidnight = getTodayMidnight();
    const lastAllowed = new Date(todayMidnight);
    lastAllowed.setFullYear(lastAllowed.getFullYear() + 1);

    // Name
    const nameValue = nameInput.value.trim();
    if (!nameValue) {
      problems.push([nameInput, "Please enter your full name."]);
    } else if (!namePattern.test(nameValue)) {
      problems.push([nameInput, "Please use letters only, between 2 and 80 characters."]);
    }

    // Service
    if (!serviceSelect.value) {
      problems.push([serviceSelect, "Please choose a service."]);
    }

    // Date
    let chosenDate = null;
    if (!dateInput.value) {
      problems.push([dateInput, "Please choose a date."]);
    } else {
      const parsed = parseDate(dateInput.value);

      if (!parsed) {
        problems.push([dateInput, "That date does not look right. Please choose it again."]);
      } else if (parsed < todayMidnight) {
        problems.push([dateInput, "Please choose today or a future date."]);
      } else if (parsed > lastAllowed) {
        problems.push([dateInput, "Please choose a date within the next 12 months."]);
      } else if (parsed.getDay() === 0) {
        problems.push([dateInput, "We are closed on Sundays. Please choose another day."]);
      } else {
        chosenDate = parsed;
      }
    }

    // Time
    if (!timeSelect.value) {
      problems.push([timeSelect, "Please choose a time."]);
    } else if (chosenDate && chosenDate.getTime() === todayMidnight.getTime()) {
      const hour = Number(timeSelect.value.split(":")[0]);
      if (now.getHours() >= hour) {
        problems.push([timeSelect, "That time has already passed today. Please choose a later time."]);
      }
    }

    // If anything is wrong, show it and stop
    if (problems.length) {
      problems.forEach(function (problem) {
        showError(problem[0], problem[1]);
      });

      showResult(
        "error",
        "Please check your details",
        null,
        "Fix the highlighted fields and try again."
      );

      problems[0][0].focus();
      return;
    }

    // Everything is correct: show a clearly labelled DEMO summary
    const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;
    const timeText = timeSelect.options[timeSelect.selectedIndex].text;
    const dateText = chosenDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    showResult(
      "success",
      "Demo summary only",
      [
        ["Name", nameValue],
        ["Service", serviceText],
        ["Date", dateText],
        ["Time", timeText]
      ],
      "This is a demo website with no server. No appointment has been booked, " +
      "nothing has been sent and nothing is confirmed. In a real salon, the team " +
      "would contact you to confirm a time."
    );

    form.reset();

    result.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest"
    });
  });
}


/* ----------------------------------------------------------
   15. START EVERYTHING
   Each feature runs on its own, so if one has a problem
   the others still work. Errors appear in the Console (F12).
   ---------------------------------------------------------- */
try {
  initReveal();
} catch (error) {
  // if reveal fails, make sure nothing stays hidden
  root.classList.remove("reveal-ready");
  console.error("Luxe site: initReveal failed", error);
}

[
  initYear,
  initHeaderScroll,
  initMenu,
  initActiveNav,
  initCounters,
  initParallax,
  initTilt,
  initMagnetic,
  initGoldDust,
  initCompare,
  initReviews,
  initBooking
].forEach(function (feature) {
  try {
    feature();
  } catch (error) {
    console.error("Luxe site: " + feature.name + " failed", error);
  }
});

/* ==========================================================
   >>> PART 3 ENDS HERE <<<  (this is the end of script.js)
   ========================================================== */