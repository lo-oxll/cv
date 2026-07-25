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
})();
