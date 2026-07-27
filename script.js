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

  // ---- Projects: read the pre-built, ordered list from projects.json ----
  // projects.json is generated by a GitHub Action (see
  // scripts/fetch-pinned.mjs) from the account's Pinned Repositories,
  // in the exact order they're pinned. That means:
  //  - reordering pins on github.com reorders the cards here
  //  - pinning a new repo adds a new card in the right spot
  //  - unpinning / deleting a repo removes its card
  // No client-side sorting is done — the JSON order is authoritative.
  // If the file can't be loaded (offline, first deploy, etc.) the
  // static cards already baked into the HTML are kept as-is.
  var projectGrid = document.querySelector('.project-grid');
  if (projectGrid) {
    var GITHUB_USER = 'lo-oxll';
    var langColors = { JavaScript: 'lang-js', HTML: 'lang-html', CSS: 'lang-css' };

    function showEmptyState() {
      var p = document.createElement('p');
      p.className = 'project-card__desc';
      p.textContent = 'تعذر تحميل المشاريع حالياً. يمكنك تصفحها مباشرة على GitHub من الزر أدناه.';
      projectGrid.innerHTML = '';
      projectGrid.appendChild(p);
    }

    function renderRepos(repos) {
      if (!Array.isArray(repos) || !repos.length) return false;
      var frag = document.createDocumentFragment();
      repos.forEach(function (repo) {
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

    fetch('projects.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('projects.json not found');
        return res.json();
      })
      .then(function (repos) {
        if (!renderRepos(repos)) showEmptyState();
      })
      .catch(function () {
        // Never fall back to a hardcoded list — it can go stale and
        // resurrect projects that were since unpinned or deleted.
        showEmptyState();
      });
  }

  // ---- Register service worker for offline support ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
