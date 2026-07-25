/**
 * Ali Kamil — personal site
 * Dependency-free enhancement layer:
 *  - light/dark theme toggle (persisted)
 *  - reveals the hero card once fonts/layout are ready
 *  - reveals sections on scroll
 *  - horizontal tab switching (experience / education / skills / contact)
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

  // ---- Section scroll reveal ----
  var sections = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    sections.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    sections.forEach(function (el) { revealObserver.observe(el); });
  }

  // ---- Tab switching ----
  var tabButtons = document.querySelectorAll('.tab-btn');
  var tabPanels = document.querySelectorAll('.tab-panel');

  function activateTab(name) {
    tabButtons.forEach(function (btn) {
      var isMatch = btn.getAttribute('data-tab') === name;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    tabPanels.forEach(function (panel) {
      var isMatch = panel.getAttribute('data-panel') === name;
      panel.classList.toggle('is-active', isMatch);
      if (isMatch) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(btn.getAttribute('data-tab'));
    });
  });
})();
