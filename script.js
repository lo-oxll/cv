/**
 * Ali Kamil — personal site
 * Dependency-free enhancement layer:
 *  - light/dark theme toggle (persisted)
 *  - reveals the hero card once fonts/layout are ready
 *  - reveals sections on scroll
 *  - sticky nav with smooth scroll + scrollspy (active link tracking)
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

  // ---- Sticky nav: smooth scroll + active-link tracking ----
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));
  var navTargets = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return null;
      var target = document.getElementById(id.slice(1));
      return target ? { link: link, target: target } : null;
    })
    .filter(Boolean);

  // Click = smooth scroll to the section (delegated, so it always works
  // even if links are added/removed later).
  var navBar = document.querySelector('.site-nav__links');
  if (navBar) {
    navBar.addEventListener('click', function (event) {
      var link = event.target.closest('.site-nav__link');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      // Update the URL hash without an extra jump.
      if (history.pushState) {
        history.pushState(null, '', href);
      }
      setActiveLink(link);
    });
  }

  function setActiveLink(activeLink) {
    navLinks.forEach(function (link) {
      var isMatch = link === activeLink;
      link.classList.toggle('is-active', isMatch);
      link.setAttribute('aria-current', isMatch ? 'true' : 'false');
    });
  }

  // Scrollspy: highlight the nav link for whichever section is in view.
  if (navTargets.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var match = navTargets.find(function (item) { return item.target === entry.target; });
            if (match) setActiveLink(match.link);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    navTargets.forEach(function (item) { spy.observe(item.target); });
  }
})();
