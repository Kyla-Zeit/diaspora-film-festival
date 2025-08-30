// ===== Nav shadow on scroll for contrast =====
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 10) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // set initial state
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


// ===== Overlay menu toggle (burger stays in the nav; sits above overlay) =====
(function () {
  const toggle  = document.getElementById('menu-toggle');
  const overlay = document.getElementById('menu-overlay');
  if (!toggle || !overlay) return;
  const closeBtn = document.getElementById('menu-close');

  const queryFocusable = () =>
    Array.from(
      overlay.querySelectorAll(`
        a[href], button:not([disabled]), textarea, input, select,
        [tabindex]:not([tabindex="-1"])
      `)
    );

  const isOpen = () => overlay.classList.contains('is-open');

  const open = () => {
    // show overlay
    overlay.classList.add('is-open');
    document.body.classList.add('menu-open');

    // morph burger to X
    toggle.classList.add('is-open');

    // ARIA
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    overlay.setAttribute('aria-hidden', 'false');

    // Focus first focusable in overlay
    const focusables = queryFocusable();
    const first = focusables.find((el) => el.offsetParent !== null) || focusables[0];
    setTimeout(() => first?.focus({ preventScroll: true }), 20);
  };

  const close = () => {
    overlay.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    toggle.classList.remove('is-open');

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    overlay.setAttribute('aria-hidden', 'true');

    setTimeout(() => toggle.focus({ preventScroll: true }), 10);
  };

  // Toggle click
  toggle.addEventListener('click', () => (isOpen() ? close() : open()));

  // Explicit close button
  if (closeBtn) closeBtn.addEventListener('click', close);

  // Click outside panel closes
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Clicking a link closes the menu
  overlay.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => close())
  );

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });

  // Simple focus trap while open
  overlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isOpen()) return;

    const focusables = queryFocusable().filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus(); return;
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus(); return;
    }
  });
})();
