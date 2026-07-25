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

  function closeAllTabs() {
    panels.forEach(function (panel) {
      panel.classList.remove('is-visible');
      panel.hidden = true;
    });
    navLinks.forEach(function (link) {
      link.classList.remove('is-active');
      link.setAttribute('aria-selected', 'false');
    });
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

  // ---- Projects: load live from GitHub API, cache in localStorage for
  // 6 hours to avoid hitting the unauthenticated rate limit on every visit,
  // fall back to the static list already in the HTML if all else fails ----
  var projectGrid = document.querySelector('.project-grid');
  if (projectGrid) {
    var GITHUB_USER = 'lo-oxll';
    var CACHE_KEY = 'gh-repos-cache';
    var CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
    var langColors = { JavaScript: 'lang-js', HTML: 'lang-html', CSS: 'lang-css' };

    function renderRepos(repos) {
      if (!Array.isArray(repos) || !repos.length) return false;
      var frag = document.createDocumentFragment();
      repos
        .filter(function (r) { return !r.fork; })
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

          var desc = document.createElement('p');
          desc.className = 'project-card__desc';
          desc.textContent = repo.description || 'بدون وصف';

          a.appendChild(top);
          a.appendChild(desc);
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
        if (!parsed || !parsed.timestamp || !parsed.repos) return null;
        if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
        return parsed.repos;
      } catch (e) {
        return null;
      }
    }

    function writeCache(repos) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), repos: repos }));
      } catch (e) {}
    }

    var cached = readCache();
    if (cached) {
      renderRepos(cached);
    } else {
      showSkeleton();
      fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?sort=updated&per_page=12')
        .then(function (res) {
          if (!res.ok) throw new Error('github api error');
          return res.json();
        })
        .then(function (repos) {
          if (renderRepos(repos)) writeCache(repos);
        })
        .catch(function () {
          // Restore the static list already in the HTML — this is the
          // expected path once GitHub's unauthenticated rate limit
          // (60 requests/hour per IP) is hit, or the request otherwise fails.
          projectGrid.innerHTML = staticMarkup;
        });
    }
  }

  // ---- Register service worker for offline support ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
