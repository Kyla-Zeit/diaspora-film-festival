// ===== Nav transparency + shadow on scroll =====
//
// Replace the simple “add scrolled class” logic with a more nuanced
// approach.  As the page scrolls down, we compute an alpha value
// between 0.98 (near the top) and 0.60 (after ~240px of scrolling).
// This alpha is assigned to the CSS custom property --nav-alpha,
// allowing the header background to fade smoothly via CSS.  We still
// toggle the .scrolled class when the user has moved a bit to add
// a drop shadow, improving contrast against the page.
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;

  // Clamp a value to a range.  Utility used below.
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setAlpha = () => {
    // Limit the scroll range we care about.  After 240px the alpha stays fixed.
    const y = Math.min(window.scrollY || 0, 240);
    // 0.98 at the top (y=0) down to 0.60 when y reaches 240px.
    const alpha = 0.98 - 0.38 * (y / 240);
    // Update the CSS variable.  Use toFixed(3) to reduce layout recalcs.
    document.documentElement.style.setProperty('--nav-alpha', alpha.toFixed(3));
    // Add a shadow soon after movement for contrast.  Use a small threshold
    // (8px) so a tiny scroll triggers the shadow.
    nav.classList.toggle('scrolled', y > 8);
  };

  window.addEventListener('scroll', setAlpha, { passive: true });
  window.addEventListener('resize', setAlpha);
  setAlpha(); // initialise on page load
})();


// ===== Fade-in animation on scroll =====
(function () {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  els.forEach((el) => observer.observe(el));

  // ================================
  // Fallback: reveal fade-ins already in view
  // On some tablet browsers (e.g. iPads), IntersectionObserver
  // may not fire until after a scroll. This helper ensures that
  // any fade-in element already within the viewport becomes
  // visible immediately on load/resize without requiring a scroll.
  const revealNow = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    els.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.96) {
        el.classList.add('visible');
      }
    });
  };
  // Run immediately on initialisation and on load/resize events
  revealNow();
  window.addEventListener('load', revealNow, { once: true });
  window.addEventListener('resize', revealNow, { passive: true });
})();


// ===== Smooth in-page scrolling =====
(function () {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      const target = id && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


// ===== Simple slider (click or dots + optional autoplay) =====
(function () {
  const slider = document.querySelector('.slider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.slide'));
  const dotsWrap = slider.querySelector('.dots');
  let idx = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));
  const autoplayMs = parseInt(slider.dataset.autoplay || '6000', 10);
  let timer;

  function go(to) {
    slides[idx].classList.remove('is-active');
    idx = (to + slides.length) % slides.length;
    slides[idx].classList.add('is-active');
    updateDots();
  }

  function updateDots() {
    dotsWrap.querySelectorAll('button').forEach((b, i) => {
      b.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
  }

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    b.addEventListener('click', () => {
      stop();
      go(i);
    });
    dotsWrap.appendChild(b);
  });
  updateDots();

  slider.addEventListener('click', () => {
    stop();
    go(idx + 1);
  });
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      stop();
      go(idx + 1);
    } else if (e.key === 'ArrowLeft') {
      stop();
      go(idx - 1);
    }
  });

  function start() {
    if (!autoplayMs) return;
    stop();
    timer = setInterval(() => go(idx + 1), autoplayMs);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  start();
})();

/**
 * Toggle and close handlers for the responsive navigation menu.
 *
 * This implementation adds explicit touch support to ensure that taps on
 * mobile devices trigger the menu reliably. Without handling both
 * `click` and `touchstart` events, some mobile browsers may drop
 * events or fire them in rapid succession, causing the menu to open
 * and immediately close (or not open at all). The logic below de‑dupes
 * the events so a `touchstart` followed by a `click` on the same element
 * will only toggle the menu once. It also prevents default behaviour
 * and stops propagation to avoid the overlay closing as soon as it opens.
 */
(function () {
  const toggle = document.getElementById('menu-toggle');
  const overlay = document.getElementById('menu-overlay');
  const closeBtn = document.getElementById('menu-close');
  if (!toggle || !overlay) return;

  const isOpen = () => overlay.classList.contains('is-open');
  const open = () => {
    overlay.classList.add('is-open');
    document.body.classList.add('menu-open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
  };
  const close = () => {
    overlay.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
  };

  // Track whether a touch event triggered a toggle. This helps prevent
  // the subsequent click event from firing a second time on some devices.
  let touched = false;

  /**
   * Unified handler for click and touchstart on the burger icon.
   * De‑duplicates touch/click combos and prevents default behaviour.
   */
  const handleToggle = (e) => {
    if (e.type === 'touchstart') touched = true;
    // Skip the click if we just handled a touchstart.
    if (e.type === 'click' && touched) {
      touched = false;
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    isOpen() ? close() : open();
  };

  // Register both click and touchstart with passive:false so that
  // preventDefault can take effect on mobile browsers.
  toggle.addEventListener('click', handleToggle, { passive: false });
  toggle.addEventListener('touchstart', handleToggle, { passive: false });

  if (closeBtn) closeBtn.addEventListener('click', close);

  // Close when clicking outside the menu panel. Use both click and
  // touchstart to mirror the toggle logic and avoid missing taps.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.addEventListener('touchstart', (e) => {
    if (e.target === overlay) {
      e.preventDefault();
      close();
    }
  }, { passive: false });
  
  // Close the menu when any internal link is clicked.
  overlay.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => close())
  );

  // Close on escape key press.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });
})();
