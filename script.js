/**
 * Ali Kamil — personal site
 * Dependency-free enhancement layer:
 *  - light/dark theme toggle (persisted)
 *  - reveals the hero card once fonts/layout are ready
 *  - reveals sections on scroll
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

  // ---- Scroll progress bar ----
  var progressBar = document.getElementById('scrollProgress');
  var scrollHost = card || document.documentElement;

  function updateProgress() {
    if (!progressBar) return;
    var scrollTop = scrollHost.scrollTop;
    var scrollHeight = scrollHost.scrollHeight - scrollHost.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  if (progressBar && scrollHost) {
    scrollHost.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ---- Dot navigation: smooth scroll + active state ----
  var dotItems = document.querySelectorAll('.dot-nav__item');
  var namedSections = document.querySelectorAll('[data-section]');

  dotItems.forEach(function (dot) {
    dot.addEventListener('click', function (e) {
      var targetId = dot.getAttribute('href');
      var targetEl = targetId && document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      }
    });
  });

  function setActiveDot(name) {
    dotItems.forEach(function (dot) {
      dot.classList.toggle('is-active', dot.getAttribute('data-target') === name);
    });
  }

  // ---- Section scroll reveal ----
  var sections = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    sections.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

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

  if (namedSections.length && dotItems.length) {
    var activeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveDot(entry.target.getAttribute('data-section'));
          }
        });
      },
      { threshold: 0.5 }
    );
    namedSections.forEach(function (el) { activeObserver.observe(el); });
  }
})();
