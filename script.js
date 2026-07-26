/**
 * Ali Kamil — personal site
 * Dependency-free enhancement layer:
 *  - light/dark theme toggle (persisted)
 *  - reveals the hero card once fonts/layout are ready
 *  - section nav acts as tabs: each button shows exactly one
 *    panel (About / Experience / Education / Skills / Projects / Contact)
 *    and hides the rest — nothing is shown until a tab is picked
 *  - respects prefers-reduced-motion throughout
 */
(function () {
  'use strict';

  // ---- Theme toggle (light / dark) ----
  var root = document.documentElement;
  var toggleBtn = document.getElementById('themeToggle');

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
    if (toggleBtn) {
      toggleBtn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'
      );
    }
  }

  setTheme(getTheme());

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  var prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ---- Hero reveal ----
  var card = document.getElementById('card');
  if (card) {
    if (prefersReducedMotion) {
      card.style.opacity = '1';
      card.style.transform = 'none';
    } else {
      var revealHero = function () {
        card.classList.add('is-visible');
      };
      if (document.readyState === 'complete') {
        requestAnimationFrame(revealHero);
      } else {
        window.addEventListener('load', function () {
          requestAnimationFrame(revealHero);
        });
      }
      window.setTimeout(revealHero, 1200);
    }
  }

  // ---- Section nav as tabs ----
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.tab-panel'));
  var navBar = document.querySelector('.site-nav__links');
  var homeMark = document.querySelector('.site-nav__mark');
  var aboutSection = document.getElementById('about');

  function closeAllTabs() {
    panels.forEach(function (panel) {
      panel.classList.remove('is-visible');
      panel.hidden = true;
    });
    navLinks.forEach(function (link) {
      link.classList.remove('is-active');
      link.setAttribute('aria-selected', 'false');
    });
    // Back to the home view: bring "About" back.
    if (aboutSection) aboutSection.hidden = false;
  }

  function openTab(name) {
    var found = false;
    panels.forEach(function (panel) {
      if (panel.id === name) {
        found = true;
        panel.hidden = false;
        if (prefersReducedMotion) {
          panel.classList.add('is-visible');
        } else {
          // Force layout so the fade-in transition replays every time.
          panel.classList.remove('is-visible');
          void panel.offsetWidth;
          requestAnimationFrame(function () {
            panel.classList.add('is-visible');
          });
        }
      } else {
        panel.classList.remove('is-visible');
        panel.hidden = true;
      }
    });
    if (!found) return false;
    // A tab is now open: hide "About" so only the chosen section shows.
    if (aboutSection) aboutSection.hidden = true;
    navLinks.forEach(function (link) {
      var isMatch = link.getAttribute('data-tab-target') === name;
      link.classList.toggle('is-active', isMatch);
      link.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    return true;
  }

  if (navBar) {
    navBar.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-tab-target]');
      if (!btn) return;
      var name = btn.getAttribute('data-tab-target');
      var wasActive = btn.classList.contains('is-active');
      if (wasActive) {
        // Tapping the open tab again closes it and returns to the home view.
        closeAllTabs();
        if (history.replaceState) history.replaceState(null, '', '#hero');
      } else {
        openTab(name);
        if (history.replaceState) history.replaceState(null, '', '#' + name);
      }
    });
  }

  if (homeMark) {
    homeMark.addEventListener('click', function () {
      closeAllTabs();
    });
  }

  // Deep-link support: if the page is opened with e.g. #education,
  // open that tab directly instead of showing the empty home view.
  var initialHash = window.location.hash ? window.location.hash.slice(1) : '';
  if (initialHash && initialHash !== 'hero') {
    openTab(initialHash);
  }

  // ---- "Back to top" button: only after scrolling ----
  var skipTop = document.querySelector('.skip-top');
  if (skipTop) {
    var toggleSkipTop = function () {
      skipTop.classList.toggle('is-shown', window.scrollY > 300);
    };
    toggleSkipTop();
    window.addEventListener('scroll', toggleSkipTop, { passive: true });
  }

  // ---- Projects: load live from GitHub API every visit, using ETag
  // conditional requests so the grid always reflects the current state
  // of the GitHub account (added / edited / deleted repos) without
  // burning through the unauthenticated rate limit — a 304 "not
  // modified" response does not count against the 60 req/hour limit.
  // Falls back to the static list already in the HTML if the network
  // request fails or the visitor is offline. ----
  var projectGrid = document.querySelector('.project-grid');
  if (projectGrid) {
    var GITHUB_USER = 'lo-oxll';
    var CACHE_KEY = 'gh-repos-cache-v2';
    var langColors = { JavaScript: 'lang-js', HTML: 'lang-html', CSS: 'lang-css' };

    function renderRepos(repos) {
      if (!Array.isArray(repos) || !repos.length) return false;
      var frag = document.createDocumentFragment();
      repos
        .filter(function (r) { return !r.fork && !r.archived; })
        .forEach(function (repo) {
          var a = document.createElement('a');
          a.className = 'project-card';
          if (repo.homepage) {
            a.href = repo.homepage;
          } else if (repo.has_pages) {
            a.href = 'https://' + GITHUB_USER + '.github.io/' + repo.name + '/';
          } else {
            a.href = repo.html_url;
          }
          a.target = '_blank';
          a.rel = 'noopener noreferrer';

          var top = document.createElement('div');
          top.className = 'project-card__top';

          var name = document.createElement('span');
          name.className = 'project-card__name';
          name.setAttribute('lang', 'en');
          name.setAttribute('dir', 'ltr');
          name.textContent = repo.name;

          var lang = document.createElement('span');
          lang.className = 'project-card__lang';
          if (repo.language) {
            var dot = document.createElement('span');
            dot.className = 'lang-dot ' + (langColors[repo.language] || '');
            lang.appendChild(dot);
            lang.appendChild(document.createTextNode(' ' + repo.language));
          }

          top.appendChild(name);
          top.appendChild(lang);

          a.appendChild(top);
          if (repo.description) {
            var desc = document.createElement('p');
            desc.className = 'project-card__desc';
            desc.textContent = repo.description;
            a.appendChild(desc);
          }
          frag.appendChild(a);
        });
      if (!frag.childNodes.length) return false;
      projectGrid.innerHTML = '';
      projectGrid.appendChild(frag);
      return true;
    }

    var staticMarkup = projectGrid.innerHTML;

    function showSkeleton() {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < 6; i++) {
        var s = document.createElement('div');
        s.className = 'project-card project-card--skeleton';
        s.setAttribute('aria-hidden', 'true');
        frag.appendChild(s);
      }
      projectGrid.innerHTML = '';
      projectGrid.appendChild(frag);
    }

    function readCache() {
      try {
        var raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!parsed || !parsed.repos) return null;
        return parsed;
      } catch (e) {
        return null;
      }
    }

    function writeCache(etag, repos) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ etag: etag || null, repos: repos }));
      } catch (e) {}
    }

    var cache = readCache();
    // Show whatever we already have (cached repos, or the static
    // fallback baked into the HTML) instantly, then reconcile with
    // GitHub in the background so the grid never sits on a skeleton.
    if (cache && renderRepos(cache.repos)) {
      // already rendered from cache
    } else {
      showSkeleton();
    }

    var fetchHeaders = {};
    if (cache && cache.etag) fetchHeaders['If-None-Match'] = cache.etag;

    fetch(
      'https://api.github.com/users/' + GITHUB_USER + '/repos?sort=updated&per_page=100',
      { headers: fetchHeaders }
    )
      .then(function (res) {
        if (res.status === 304) {
          // Nothing changed on GitHub since last check — what's
          // already on screen (from cache) is up to date.
          return null;
        }
        if (!res.ok) throw new Error('github api error');
        var etag = res.headers.get('ETag');
        return res.json().then(function (repos) {
          return { etag: etag, repos: repos };
        });
      })
      .then(function (result) {
        if (!result) return; // 304, nothing to update
        if (renderRepos(result.repos)) {
          writeCache(result.etag, result.repos);
        }
      })
      .catch(function () {
        // Network failed and we had nothing cached to fall back to
        // from the skeleton state — restore the static list baked
        // into the HTML as the last resort.
        if (!cache) {
          projectGrid.innerHTML = staticMarkup;
        }
      });
  }

  // ---- Register service worker for offline support ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
