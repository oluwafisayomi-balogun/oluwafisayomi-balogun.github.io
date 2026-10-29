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
   6.  Featured projects drift check
   7.  Live chess.com rating
   8.  GitHub contribution graph
   9.  Lagos local time
   10. Footer year
   11. Page-leave loading bar

   NOTE: This script is at the END of <body> in index.html.
   All HTML elements exist before this code runs, so
   document.getElementById() always finds what it's looking for.
================================================================ */


/* ================================================================
   0. PRELOADER
   Shown on the first page load of a browsing session, then again
   only after 15 minutes have passed — not on refreshes or internal
   link clicks between pages (e.g. /projects -> /#about), which
   would replay it annoyingly.
================================================================ */
const preloader = document.getElementById('preloader');

if (preloader) {
  const REPLAY_AFTER_MS = 15 * 60 * 1000;
  let lastShown = 0;
  try {
    lastShown = Number(sessionStorage.getItem('preloaderShownAt')) || 0;
  } catch (e) {}
  const recentlyShown = Date.now() - lastShown < REPLAY_AFTER_MS;

  if (recentlyShown) {
    preloader.remove();
  } else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    preloader.remove();
  } else {
    try {
      sessionStorage.setItem('preloaderShownAt', String(Date.now()));
    } catch (e) {}
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

/* On the homepage, clicking the logo should just scroll to top —
   not navigate to "/" again (full reload) or leave a stray "#"
   in the URL. */
const navLogo = document.querySelector('.nav-logo');
if (navLogo && (location.pathname === '/' || location.pathname === '/index.html')) {
  navLogo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


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

// Single place that sets open/closed, keeping ARIA and focusability in
// sync. `inert` takes the closed menu's links out of the tab order.
function setMenuOpen(open) {
  hamburger.classList.toggle('open', open);
  mobileMenu.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  mobileMenu.inert = !open;
}
setMenuOpen(false);

// Toggle menu open/closed on hamburger click
hamburger.addEventListener('click', () => {
  setMenuOpen(!mobileMenu.classList.contains('open'));
});

// Close menu when any link inside it is clicked
mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

// Escape closes the menu and returns focus to the hamburger
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    setMenuOpen(false);
    hamburger.focus();
  }
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

   threshold: 0 — triggers as soon as any part of the element enters
   the viewport. (A % threshold made tall blocks, like the stack grid
   on mobile, wait far too long to appear.)

   Staggered setTimeout(i * 40) creates a short cascade when multiple
   elements enter the viewport at the same time.

   Elements already on screen when the page loads (e.g. the whole top
   of /projects) skip the animation entirely — dropping .reveal before
   first paint means they show up with the page instead of fading in
   after it, which read as the page lagging.

   unobserve() stops watching after reveal — animates only once.
================================================================ */
const revealObserver = new IntersectionObserver((entries) => {
  // Count only entering elements: `entries` also holds ones that just
  // left the viewport, and indexing by those delayed reveals by 500ms+
  // after a fast scroll.
  let i = 0;
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i++ * 40); // stagger each element by 40ms

      revealObserver.unobserve(entry.target); // reveal once only
    }
  });
}, {
  threshold: 0,
});

document.querySelectorAll('.reveal').forEach((el) => {
  if (el.getBoundingClientRect().top < window.innerHeight) {
    el.classList.remove('reveal');
  } else {
    revealObserver.observe(el);
  }
});


/* ================================================================
   6. FEATURED PROJECTS DRIFT CHECK (homepage only)
   The homepage's featured project-list is hand-maintained and must
   always mirror the first N rows of projects/index.html, in the same
   order. Nothing else catches it if they fall out of sync, so this
   fetches /projects at runtime and compares titles, warning loudly
   (not just in the console) if they don't match.

   Gated on #projects existing — only index.html has that id.
   Fails silently on file:// (fetch is blocked cross-file there); it
   only ever runs for real once the site is actually served over http.
================================================================ */
const homepageProjectsSection = document.getElementById('projects');
if (homepageProjectsSection) {
  const featuredTitles = Array.from(
    homepageProjectsSection.querySelectorAll('.project-row-title')
  ).map((el) => el.textContent.trim());

  fetch('/projects/')
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
            'the top of /projects, in order.\n' +
            'Homepage: ' + featuredTitles.join(' | ') + '\n' +
            '/projects: ' + topTitles.join(' | ')
        );

        const banner = document.createElement('div');
        banner.textContent =
          '⚠ Featured projects are out of sync with /projects — see console.';
        banner.style.cssText =
          'position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
          'background:#c0392b;color:#fff;font:14px var(--font-mono, monospace);' +
          'padding:10px 16px;text-align:center;';
        document.body.appendChild(banner);
      }
    })
    .catch(() => {});
}


/* ================================================================
   7. LIVE CHESS.COM RATING
   Public chess.com API, no auth. Shows the highest of the player's
   rapid/blitz/bullet ratings. Cached in localStorage for an hour.
   If the request fails, the "pulled live" clause is removed so the
   sentence still reads naturally.
================================================================ */
(function () {
  var el = document.getElementById('chess-elo');
  if (!el) return;

  var USER = 'fisayo1123';
  var KEY = 'chess-elo';
  var TTL = 60 * 60 * 1000;

  try {
    var c = JSON.parse(localStorage.getItem(KEY));
    if (c && Date.now() - c.t < TTL) { el.textContent = c.v; return; }
  } catch (e) {}

  fetch('https://api.chess.com/pub/player/' + USER + '/stats')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      var best = null;
      ['chess_rapid', 'chess_blitz', 'chess_bullet'].forEach(function (m) {
        var r = d[m] && d[m].last && d[m].last.rating;
        if (r && (!best || r > best.r)) best = { r: r, m: m.replace('chess_', '') };
      });
      if (!best) throw new Error('no rating');
      var v = best.r + ' (' + best.m + ')';
      el.textContent = v;
      try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
    })
    .catch(function () {
      var live = document.getElementById('chess-live');
      if (live) live.remove();
    });
})();


/* ================================================================
   8. GITHUB CONTRIBUTION GRAPH
   GitHub has no unauthenticated endpoint for the contribution
   calendar, so this uses github-contributions-api.jogruber.de, a
   public proxy that scrapes the profile page. Cached in localStorage
   for an hour. If the request fails, the whole subsection is removed.

   Layout matches GitHub: one column per week, Sunday at the top.
================================================================ */
(function () {
  var box = document.getElementById('github-graph');
  if (!box) return;

  var USER = 'oluwafisayomi-balogun';
  var KEY = 'gh-contrib';
  var TTL = 60 * 60 * 1000;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function render(d) {
    var days = d.contributions;
    var cells = box.querySelector('.gh-cells');
    var months = box.querySelector('.gh-months');
    var frag = document.createDocumentFragment();

    // Blank cells so the first day lands on its weekday row
    var lead = new Date(days[0].date + 'T00:00:00Z').getUTCDay();
    for (var i = 0; i < lead; i++) {
      var pad = document.createElement('span');
      pad.className = 'gh-cell';
      pad.style.visibility = 'hidden';
      frag.appendChild(pad);
    }

    var totalWeeks = Math.ceil((lead + days.length) / 7);
    box.style.setProperty('--gh-weeks', totalWeeks);
    var lastMonth = -1;
    days.forEach(function (day, i) {
      var date = new Date(day.date + 'T00:00:00Z');
      var cell = document.createElement('span');
      cell.className = 'gh-cell';
      cell.dataset.level = day.level;
      cell.title = day.count + ' contribution' + (day.count === 1 ? '' : 's') +
        ' on ' + MONTHS[date.getUTCMonth()] + ' ' + date.getUTCDate();
      frag.appendChild(cell);

      // Label a month at the first week column it appears in, skipping
      // labels that would collide at the very start or end.
      var m = date.getUTCMonth();
      if (m !== lastMonth) {
        var week = Math.floor((lead + i) / 7);
        if (lastMonth !== -1 || date.getUTCDate() < 8) {
          if (week < totalWeeks - 2) {
            var label = document.createElement('span');
            label.textContent = MONTHS[m];
            label.style.gridColumn = week + 1;
            months.appendChild(label);
          }
        }
        lastMonth = m;
      }
    });
    cells.appendChild(frag);

    box.querySelector('.gh-total').textContent =
      d.total.lastYear + ' contributions in the last year';

    // Most recent weeks matter most: start scrolled to the right
    var scroller = box.querySelector('.gh-scroll');
    scroller.scrollLeft = scroller.scrollWidth;
  }

  try {
    var c = JSON.parse(localStorage.getItem(KEY));
    if (c && Date.now() - c.t < TTL) { render(c.v); return; }
  } catch (e) {}

  fetch('https://github-contributions-api.jogruber.de/v4/' + USER + '?y=last')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (!d.contributions || !d.contributions.length) throw new Error('no data');
      render(d);
      try { localStorage.setItem(KEY, JSON.stringify({ v: d, t: Date.now() })); } catch (e) {}
    })
    .catch(function () { box.remove(); });
})();


/* ================================================================
   9. LAGOS LOCAL TIME
   Shows the current time in Lagos inside the hero sentence, so
   visitors in other time zones can see my hours at a glance.
   Hidden in the HTML until this runs, so no-JS visitors just see
   "Nigeria (WAT)". Re-renders every 15s to stay on the minute.
================================================================ */
(function () {
  var wrap = document.getElementById('lagos-time');
  if (!wrap) return;
  var clock = wrap.querySelector('.lagos-clock');
  var fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    hour: 'numeric',
    minute: '2-digit',
  });

  function tick() {
    var now = new Date();
    clock.textContent = fmt.format(now);
    clock.dateTime = now.toISOString();
  }

  tick();
  wrap.hidden = false;
  setInterval(tick, 15 * 1000);
})();


/* ================================================================
   10. FOOTER YEAR
   Keeps the © year current. The HTML holds a hard-coded year as
   the fallback for no-JS visitors.
================================================================ */
document.querySelectorAll('.footer-year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});


/* ================================================================
   11. PAGE-LEAVE LOADING BAR
   On a slow mobile connection the old page can sit on screen for a
   few seconds after tapping a link to another page, with the
   browser's own progress bar barely moving — so people tap again.
   This shows an animated bar at the top the instant they tap.

   Only for same-site links to a different page: not new tabs,
   not #anchors on this page, not mailto:. Cleared on pageshow so
   it's gone when coming back via the back button.
================================================================ */
(function () {
  var bar = document.createElement('div');
  bar.className = 'page-loading';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    var url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    root.classList.add('is-leaving');
  });

  window.addEventListener('pageshow', function () {
    root.classList.remove('is-leaving');
  });
})();


/* ================================================================
   TEMPORARY — MOBILE PERF DEBUG OVERLAY. Remove after.
   ?debug  shows live stats at the bottom of the screen.
   ?nofx   turns off the background effects (noise, checkerboard,
           glow blobs, frosted nav) for comparison.
   Both stick for the rest of the tab session, across pages;
   ?debug=0 / ?nofx=0 turn them off again.
================================================================ */
(function () {
  var BUILD = 'dbg2';
  var params = new URLSearchParams(location.search);
  function flag(name) {
    try {
      if (params.has(name)) sessionStorage.setItem(name, params.get(name) === '0' ? '' : '1');
      return sessionStorage.getItem(name) === '1';
    } catch (e) { return params.has(name) && params.get(name) !== '0'; }
  }
  if (flag('nofx')) root.classList.add('nofx');
  if (!flag('debug')) return;

  var box = document.createElement('pre');
  box.style.cssText =
    'position:fixed;left:0;right:0;bottom:0;z-index:99999;margin:0;padding:6px 8px;' +
    'font:11px/1.35 monospace;background:rgba(0,0,0,.85);color:#7f7;' +
    'pointer-events:none;white-space:pre-wrap;';
  document.body.appendChild(box);

  var cssBuild = getComputedStyle(root).getPropertyValue('--build').trim().replace(/"/g, '');
  // Rendered from rAF, not setInterval: iOS holds timers back while
  // scrolling, which is exactly when these numbers matter.
  var maxGap = 0, bigGaps = 0, last = performance.now(), lastRender = 0;
  function frame(t) {
    var gap = t - last;
    last = t;
    if (gap > maxGap) maxGap = gap;
    if (gap > 100) bigGaps++;
    if (t - lastRender > 250) { lastRender = t; render(); }
    requestAnimationFrame(frame);
  }

  var paints = {};
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) { paints[e.name] = Math.round(e.startTime); });
    }).observe({ type: 'paint', buffered: true });
  } catch (e) {}

  function render() {
    var n = performance.getEntriesByType('navigation')[0] || {};
    var r = function (v) { return v ? Math.round(v) : '-'; };
    var reveals = document.querySelectorAll('.reveal');
    var hidden = 0;
    reveals.forEach(function (el) { if (+getComputedStyle(el).opacity < 0.99) hidden++; });
    box.textContent =
      'js ' + BUILD + ' css ' + (cssBuild || 'OLD') + (root.classList.contains('nofx') ? '  NOFX' : '') +
      '  hover:none ' + matchMedia('(hover: none)').matches + '  dpr ' + devicePixelRatio + '  ' + innerWidth + 'x' + innerHeight + '\n' +
      'nav: ' + (n.type || '?') + ' dns ' + r(n.domainLookupEnd - n.domainLookupStart) +
      ' conn ' + r(n.connectEnd - n.connectStart) + ' ttfb ' + r(n.responseStart) +
      ' html ' + r(n.responseEnd) + ' dcl ' + r(n.domContentLoadedEventEnd) + ' load ' + r(n.loadEventEnd) +
      ' fcp ' + (paints['first-contentful-paint'] || '-') + '\n' +
      'hidden reveals ' + hidden + '/' + reveals.length +
      '  frame gaps >100ms ' + bigGaps + '  worst ' + Math.round(maxGap) + 'ms';
  }
  render();
  requestAnimationFrame(frame);
})();
