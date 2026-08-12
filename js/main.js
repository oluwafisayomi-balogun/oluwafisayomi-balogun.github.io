/* ================================================================
   FISAYO BALOGUN — PORTFOLIO JAVASCRIPT
   File: js/main.js

   TABLE OF CONTENTS
   -----------------
   0.  Preloader
   1.  Scroll to top on load
   2.  Nav scroll behaviour
   3.  Hamburger menu (mobile)
   4.  Theme toggle (light/dark)
   5.  Scroll reveal

   NOTE: This script is at the END of <body> in index.html.
   All HTML elements exist before this code runs, so
   document.getElementById() always finds what it's looking for.
================================================================ */


/* ================================================================
   0. PRELOADER
   Shown on every load, including refresh (no sessionStorage skip —
   that's the point). Hides once the page has finished loading,
   with a minimum display time so it doesn't just flash by on fast
   connections/cache hits.
================================================================ */
const preloader = document.getElementById('preloader');

if (preloader) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    preloader.remove();
  } else {
    const MIN_DISPLAY_MS = 2450;
    const shownAt = Date.now();

    const hidePreloader = () => {
      const remaining = MIN_DISPLAY_MS - (Date.now() - shownAt);
      setTimeout(() => {
        preloader.classList.add('is-hidden');
        preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
      }, Math.max(0, remaining));
    };

    if (document.readyState === 'complete') {
      hidePreloader();
    } else {
      window.addEventListener('load', hidePreloader);
    }
  }
}


/* ================================================================
   1. SCROLL TO TOP ON LOAD
   Forces the page to start at the top on every load/refresh.
   Browsers sometimes remember scroll position — this overrides that.
================================================================ */
window.scrollTo(0, 0);


/* ================================================================
   2. NAV SCROLL BEHAVIOUR
   Adds .scrolled to <nav> when user scrolls past 20px.
   CSS uses this class to show the frosted glass background.

   classList.toggle(class, condition):
   - adds class if condition is true
   - removes it if condition is false
================================================================ */
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});


/* ================================================================
   3. HAMBURGER MENU (MOBILE)
   Toggles the mobile nav menu open/closed.

   hamburger button  → gets .open class (bars animate into X)
   mobileMenu panel  → gets .open class (slides down from top)

   Clicking a menu link also closes the menu so the page scrolls
   smoothly to the section without leaving the menu open.
================================================================ */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

// Toggle menu open/closed on hamburger click
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

// Close menu when any link inside it is clicked
mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});


/* ================================================================
   4. THEME TOGGLE (LIGHT/DARK)
   Sets data-theme="dark" on <html> when active. CSS variables in
   styles.css read that attribute — see :root[data-theme="dark"].

   The INITIAL theme (saved choice → OS preference → light) is
   applied by a small inline script in <head>, before this file
   loads — that avoids a flash of the wrong theme on page load.
   This section only handles the click toggle.

   Every element with class "theme-toggle" flips the theme when
   clicked (there's one in the desktop nav and one in the mobile
   menu — both stay in sync since they just read/set the same
   <html> attribute).
================================================================ */
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('.theme-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const applyTheme = () => {
      root.dataset.theme = next;
      localStorage.setItem('theme', next);
    };

    // Circular reveal that grows from the clicked button.
    // We wait for transition.ready (the point at which the pseudo-element
    // tree actually exists) and then drive the clip-path directly via WAAPI
    // on that pseudo-element. Pre-injecting a @keyframes rule before the
    // pseudo tree exists lets Chrome's default snapshot-sizing apply first,
    // which is what made the reveal start from the viewport center instead
    // of the button in Chrome (Safari happened to not show this).
    if (!reducedMotion && document.startViewTransition) {
      const { left, top, width, height } = btn.getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(applyTheme);
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: 'ease',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    } else {
      applyTheme();
    }
  });
});


/* ================================================================
   5. SCROLL REVEAL
   Watches every .reveal element with IntersectionObserver.
   Adds .visible when the element enters the viewport.
   CSS transitions in styles.css do the actual animation.

   threshold: 0.1 — triggers when 10% of the element is visible.

   Staggered setTimeout(i * 80) creates a cascade when multiple
   elements enter the viewport at the same time.

   unobserve() stops watching after reveal — animates only once.
================================================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80); // stagger each element by 80ms

      revealObserver.unobserve(entry.target); // reveal once only
    }
  });
}, {
  threshold: 0.1,
});

document.querySelectorAll('.reveal').forEach((el) => {
  revealObserver.observe(el);
});


/* ================================================================
   6. FEATURED PROJECTS DRIFT CHECK (homepage only)
   The homepage's featured project-list is hand-maintained and must
   always mirror the first N rows of projects.html, in the same order.
   Nothing else catches it if they fall out of sync, so this fetches
   projects.html at runtime and compares titles, warning loudly (not
   just in the console) if they don't match.

   Gated on #projects existing — only index.html has that id.
   Fails silently on file:// (fetch is blocked cross-file there); it
   only ever runs for real once the site is actually served over http.
================================================================ */
const homepageProjectsSection = document.getElementById('projects');
if (homepageProjectsSection) {
  const featuredTitles = Array.from(
    homepageProjectsSection.querySelectorAll('.project-row-title')
  ).map((el) => el.textContent.trim());

  fetch('projects.html')
    .then((res) => res.text())
    .then((html) => {
      const fullList = new DOMParser().parseFromString(html, 'text/html');
      const topTitles = Array.from(
        fullList.querySelectorAll('.project-row-title')
      )
        .slice(0, featuredTitles.length)
        .map((el) => el.textContent.trim());

      const inSync =
        featuredTitles.length === topTitles.length &&
        featuredTitles.every((title, i) => title === topTitles[i]);

      if (!inSync) {
        console.warn(
          '[projects out of sync] Homepage featured projects must match ' +
            'the top of projects.html, in order.\n' +
            'Homepage:      ' + featuredTitles.join(' | ') + '\n' +
            'projects.html: ' + topTitles.join(' | ')
        );

        const banner = document.createElement('div');
        banner.textContent =
          '⚠ Featured projects are out of sync with projects.html — see console.';
        banner.style.cssText =
          'position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
          'background:#c0392b;color:#fff;font:14px var(--font-mono, monospace);' +
          'padding:10px 16px;text-align:center;';
        document.body.appendChild(banner);
      }
    })
    .catch(() => {});
}
