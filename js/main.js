/**
 * ROOTS APPAREL MANUFACTURING — CORE JAVASCRIPT
 * Vanilla JS | Lightweight | Zero Dependencies | Fully Accessible
 */

(function () {
  'use strict';

  // Where website enquiries are sent. Kept in one place so it cannot drift
  // out of sync with the address shown in the contact section and footer.
  const CONTACT_EMAIL = 'rootsbusinessconnect@gmail.com';

  // ------------------------------------------------------------------------
  // 0. Homepage entry state — a refresh starts at the hero
  //
  // Reading a section leaves its id in the address bar (#contact), and both the
  // hash and the browser's own scroll restoration would otherwise reopen the
  // page halfway down on the next refresh. The homepage should introduce itself
  // from the top.
  //
  // Scoped tightly, because the alternative is breaking navigation:
  //   reload        -> hero, hash dropped via replaceState (no second request,
  //                    so no redirect loop)
  //   navigate      -> untouched, so a link or a typed URL ending in #contact
  //                    still lands on the contact section
  //   back_forward  -> untouched, so the browser restores position as expected
  //
  // Runs at parse time rather than on DOMContentLoaded so it beats the
  // browser's own scroll-to-fragment step.
  // ------------------------------------------------------------------------
  function initHomeEntryState() {
    if (!document.querySelector('.hero')) return;

    let navType = '';
    try {
      const entry = performance.getEntriesByType('navigation')[0];
      navType = entry ? entry.type : '';
    } catch (e) { /* older browsers fall through to the legacy check below */ }

    if (!navType && performance.navigation) {
      navType = performance.navigation.type === 1 ? 'reload' : 'navigate';
    }

    if (navType !== 'reload') return;

    const supportsRestore = 'scrollRestoration' in history;
    const previous = supportsRestore ? history.scrollRestoration : null;
    // Suppressed for this load only. Handing it back afterwards keeps
    // back/forward returning the reader to where they were.
    if (supportsRestore) history.scrollRestoration = 'manual';

    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    window.scrollTo(0, 0);

    window.addEventListener('load', () => {
      window.scrollTo(0, 0);
      if (supportsRestore) history.scrollRestoration = previous || 'auto';
    }, { once: true });
  }

  initHomeEntryState();

  // ------------------------------------------------------------------------
  // 0a. Brand title card
  //
  // The card reveals, holds and clears entirely in CSS (style.css section 23)
  // with animation-fill-mode: both, so the page is released whether or not
  // this file runs. Previously the overlay was dismissed by a setTimeout, and
  // a script error anywhere above this point left a fixed, opaque,
  // pointer-events: all element over the whole site indefinitely.
  //
  // All that is left here is taking the finished node out of the document.
  // ------------------------------------------------------------------------
  function initLogoLoader() {
    const loader = document.getElementById('roots-loader');
    if (!loader) return;

    let done = false;
    const drop = () => {
      if (done) return;
      done = true;
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    };

    loader.addEventListener('animationend', (e) => {
      if (e.target === loader && e.animationName === 'rootsLoaderClear') drop();
    });

    // Belt and braces: if animationend never fires (an interrupted animation,
    // a browser that skips it in a background tab), remove it anyway. The
    // overlay is already invisible and inert by this point either way.
    setTimeout(drop, 4000);
  }

  // ------------------------------------------------------------------------
  // 0b. Hero content recession on scroll (entrance itself is CSS-only)
  // ------------------------------------------------------------------------
  function initHeroScrollEffect() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const hero = document.querySelector('.hero');
    const heroWrap = document.querySelector('.hero-wrap');
    if (!hero || !heroWrap) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          const heroHeight = hero.offsetHeight;
          if (scrollY <= heroHeight) {
            const progress = scrollY / heroHeight;
            heroWrap.style.opacity = (1 - progress * 0.85).toFixed(3);
            heroWrap.style.transform = `translate3d(0, -${(scrollY * 0.06).toFixed(1)}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ------------------------------------------------------------------------
  // 0c. Floating WhatsApp button — hold it back over the hero
  //
  // The hero's "SCROLL TO DISCOVER" marker sits in the bottom-right corner,
  // exactly where the floating button lives, and the hero already carries the
  // primary CTA. So the button waits until the hero has been scrolled past.
  // One IntersectionObserver, no scroll listener. Pages without a .hero (the
  // measurements page) return early and simply keep the button visible.
  // ------------------------------------------------------------------------
  function initWhatsAppReveal() {
    const btn = document.querySelector('.wa-float');
    const hero = document.querySelector('.hero');
    if (!btn || !hero || typeof IntersectionObserver !== 'function') return;

    btn.classList.add('is-held');
    let hasEntered = false;

    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isOverHero = entry.intersectionRatio > 0.25;
          if (isOverHero) {
            btn.classList.add('is-held');
            btn.classList.remove('has-entered');
          } else {
            btn.classList.remove('is-held');
            if (!hasEntered) {
              hasEntered = true;
              btn.classList.add('has-entered');
            }
          }
        });
      },
      { threshold: [0, 0.25, 0.5] }
    ).observe(hero);
  }

  // ------------------------------------------------------------------------
  // 1. Process Stages Interactive Switcher with Keyboard Arrow Navigation
  // ------------------------------------------------------------------------
  // Candidate widths offered to the browser for the process visual.
  const PROCESS_WIDTHS = [600, 900, 1200, 1600, 2200];

  const processStages = [
    {
      name: 'DESIGN',
      copy: 'Transforming creative concepts into production-ready apparel with technical precision.',
      image: 'https://images.unsplash.com/photo-1721664195489-7448042bf305?auto=format&fit=crop&q=85',
      alt: 'A hand tracing a paper garment pattern beside scissors'
    },
    {
      name: 'SOURCING',
      copy: 'Expert material and fabric sourcing for every brief, from premium denim to sustainable linen.',
      image: 'https://images.unsplash.com/photo-1621882844178-fa8129633ce4?auto=format&fit=crop&q=85',
      alt: 'Rolls of fabric stacked together'
    },
    {
      name: 'DEVELOPMENT',
      copy: 'Sampling, fitting, and technical refinement with meticulous attention to detail.',
      image: 'https://images.unsplash.com/photo-1578353022142-09264fd64295?auto=format&fit=crop&q=85',
      alt: 'Thread spools, scissors, a measuring tape and a pattern on a work surface'
    },
    {
      name: 'MANUFACTURING',
      copy: 'Precision apparel production scaled for your brand with state-of-the-art machinery.',
      image: 'https://images.unsplash.com/photo-1589793463357-5fb813435467?auto=format&fit=crop&q=85',
      alt: 'Rows of operators at sewing machines in a garment factory'
    },
    {
      name: 'QUALITY',
      copy: 'Comprehensive multi-point inspection and artisan finishing at every single stage.',
      image: 'https://images.unsplash.com/photo-1772291320136-7bfb40006088?auto=format&fit=crop&q=85',
      alt: 'Hands inspecting the seam of a pale garment'
    },
    {
      name: 'DELIVERY',
      copy: 'Market-ready, securely packed final production delivered reliably across global destinations.',
      image: 'https://images.unsplash.com/photo-1549040634-41fbcd2eb623?auto=format&fit=crop&q=85',
      alt: 'Finished pressed shirts hanging on a rail'
    }
  ];

  function initProcessSwitcher() {
    const visualContainer = document.querySelector('.process-visual');
    if (!visualContainer) return;

    const img = visualContainer.querySelector('img');
    const num = visualContainer.querySelector('.process-caption > span');
    const title = visualContainer.querySelector('.process-caption h3');
    const copy = visualContainer.querySelector('.process-caption p');
    const buttons = Array.from(document.querySelectorAll('.timeline button'));

    if (!img || !buttons.length) return;

    const activateStage = (index) => {
      const stage = processStages[index];
      if (!stage) return;

      buttons.forEach((b, i) => {
        const isSelected = i === index;
        b.classList.toggle('active', isSelected);
        b.setAttribute('aria-selected', String(isSelected));
        b.tabIndex = isSelected ? 0 : -1;
      });

      // Serve a width that suits the viewport rather than a fixed 1600px file.
      // The frame is ~343px wide on a phone and ~2150px on a 2560px display, so
      // one size meant phones downloaded roughly five times the pixels they use.
      // Unsplash returns any width from the same photo id, so this is bytes
      // only — the crop and the picture are unchanged.
      img.srcset = PROCESS_WIDTHS.map((w) => `${stage.image}&w=${w} ${w}w`).join(', ');
      img.sizes = '(max-width: 800px) 88vw, 84vw';
      img.src = `${stage.image}&w=1200`;
      img.alt = stage.alt;
      if (num) num.textContent = String(index + 1).padStart(2, '0');
      if (title) title.textContent = stage.name;
      if (copy) copy.textContent = stage.copy;

      visualContainer.setAttribute('aria-labelledby', buttons[index].id);
    };

    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => activateStage(index));

      // Keyboard arrow navigation for tabs
      btn.addEventListener('keydown', (e) => {
        let newIndex = index;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          newIndex = (index + 1) % buttons.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          newIndex = (index - 1 + buttons.length) % buttons.length;
        } else if (e.key === 'Home') {
          newIndex = 0;
        } else if (e.key === 'End') {
          newIndex = buttons.length - 1;
        } else {
          return;
        }

        e.preventDefault();
        buttons[newIndex].focus();
        activateStage(newIndex);
      });
    });
  }

  // ------------------------------------------------------------------------
  // 2. Accessible Capability Accordion Switcher
  // ------------------------------------------------------------------------
  function initCapabilityAccordion() {
    const triggers = document.querySelectorAll('.capability-trigger');
    if (!triggers.length) return;

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const panelId = trigger.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);

        if (!panel) return;

        // Toggle state
        trigger.setAttribute('aria-expanded', String(!isExpanded));
        panel.hidden = isExpanded;
      });
    });
  }

  // ------------------------------------------------------------------------
  // 3. Why ROOTS Benefit Selector
  // ------------------------------------------------------------------------
  function initBenefitSelector() {
    const benefitItems = document.querySelectorAll('.benefit-list .benefit-item');
    if (!benefitItems.length) return;

    benefitItems.forEach((item) => {
      const activate = () => {
        benefitItems.forEach((b) => b.classList.remove('selected'));
        item.classList.add('selected');
      };

      item.addEventListener('mouseenter', activate);
      item.addEventListener('focus', activate);
      item.addEventListener('click', activate);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  // ------------------------------------------------------------------------
  // 4. Mobile Navigation Drawer with Focus Trapping & Accessibility
  // ------------------------------------------------------------------------
  function initMobileMenu() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const drawer = document.querySelector('.mobile-nav-drawer');
    const mainContent = document.getElementById('main-content');
    const footer = document.querySelector('footer');

    if (!toggleBtn || !drawer) return;

    const getFocusableElements = () => {
      return Array.from(
        drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
    };

    const toggleMenu = (open, restoreFocus) => {
      const isOpen = typeof open === 'boolean' ? open : !drawer.classList.contains('is-open');
      toggleBtn.classList.toggle('is-active', isOpen);
      drawer.classList.toggle('is-open', isOpen);
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      drawer.setAttribute('aria-hidden', String(!isOpen));

      if (mainContent) mainContent.setAttribute('aria-hidden', String(isOpen));
      if (footer) footer.setAttribute('aria-hidden', String(isOpen));

      document.body.style.overflow = isOpen ? 'hidden' : '';

      if (isOpen) {
        const focusable = getFocusableElements();
        if (focusable.length) focusable[0].focus();
      } else if (restoreFocus !== false) {
        toggleBtn.focus();
      }
    };

    toggleBtn.addEventListener('click', () => toggleMenu());

    // The drawer is a full-screen overlay that only exists below the width at
    // which the header nav appears. Without this, rotating a tablet from
    // portrait to landscape while the drawer is open left it covering the
    // desktop layout with no visible control to dismiss it. Focus is not
    // restored here because the toggle button is display:none at these widths.
    const navQuery = window.matchMedia('(min-width: 1081px)');
    const closeIfDesktop = (e) => {
      if (e.matches && drawer.classList.contains('is-open')) toggleMenu(false, false);
    };
    if (typeof navQuery.addEventListener === 'function') {
      navQuery.addEventListener('change', closeIfDesktop);
    } else if (typeof navQuery.addListener === 'function') {
      navQuery.addListener(closeIfDesktop);
    }

    // Close when clicking a link inside drawer
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Focus trapping and Escape key
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleMenu(false);
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (!focusable.length) return;

        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        toggleMenu(false);
      }
    });
  }

  // ------------------------------------------------------------------------
  // 5. Header Scroll State
  // ------------------------------------------------------------------------
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 80) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ------------------------------------------------------------------------
  // 6. Active Navigation Scroll Spy
  // ------------------------------------------------------------------------
  function initScrollSpy() {
    const navLinks = document.querySelectorAll('.site-header nav a[href^="#"]');
    const sections = document.querySelectorAll('main > section[id]');
    if (!navLinks.length || !sections.length) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));
  }

  // ------------------------------------------------------------------------
  // 7. Contact Form Validation with Honeypot Anti-Spam
  // ------------------------------------------------------------------------
  function initContactForm() {
    const form = document.querySelector('.contact form');
    if (!form) return;

    let statusEl = form.querySelector('.form-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'form-status';
      form.prepend(statusEl);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check anti-spam honeypot
      const hpInput = form.querySelector('[name="_hp_company"]');
      if (hpInput && hpInput.value.trim().length > 0) {
        // Silent drop for automated bot submission
        return;
      }

      const nameInput = form.querySelector('[name="name"]');
      const companyInput = form.querySelector('[name="company"]');
      const emailInput = form.querySelector('[name="email"]');

      if (!nameInput?.value.trim() || !companyInput?.value.trim() || !emailInput?.value.trim()) {
        statusEl.className = 'form-status error';
        statusEl.textContent = 'Please fill in all required fields (Name, Company, Email).';
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        statusEl.className = 'form-status error';
        statusEl.textContent = 'Please enter a valid email address.';
        return;
      }

      // ----------------------------------------------------------------
      // No submission endpoint is configured for this site, so the enquiry
      // cannot be transmitted from the browser. Previously this branch told
      // the visitor their enquiry "has been noted" and then cleared the form
      // — the lead was destroyed and ROOTS never learned it existed.
      //
      // Instead: hand the completed enquiry to the visitor's email client so
      // it genuinely reaches ROOTS, keep their entries on screen, and say
      // plainly what happened. Set CONTACT_ENDPOINT to a POST URL later to
      // enable real background submission.
      // ----------------------------------------------------------------
      const get = (n) => {
        const el = form.querySelector('[name="' + n + '"]');
        return el && el.value.trim() ? el.value.trim() : '';
      };

      const lines = [
        ['Name', get('name')],
        ['Company / brand', get('company')],
        ['Email', get('email')],
        ['Phone', get('phone')],
        ['Looking to manufacture', get('manufacture')],
        ['Project details', get('message')]
      ].filter((r) => r[1]).map((r) => r[0] + ': ' + r[1]);

      const subject = 'Manufacturing enquiry — ' + get('company');
      const body = 'New manufacturing enquiry from the ROOTS website.\n\n' + lines.join('\n') + '\n';
      const mailto = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      statusEl.className = 'form-status success';
      statusEl.replaceChildren();

      const intro = document.createElement('p');
      intro.innerHTML =
        'Your email app is opening with this enquiry ready to send — ' +
        '<strong>it is not sent until you press send there.</strong>';
      statusEl.appendChild(intro);

      const fallback = document.createElement('p');
      fallback.append('If nothing opened, ');
      // The fallback link carries the whole enquiry too, so a visitor whose
      // browser blocks the automatic handoff still sends a complete message.
      const link = document.createElement('a');
      link.href = mailto;
      link.textContent = 'open the enquiry in your email app';
      fallback.appendChild(link);
      fallback.append(', or write to ' + CONTACT_EMAIL + ' / +91 18296 376 673. ');
      fallback.append('Your details below are kept so nothing is lost.');
      statusEl.appendChild(fallback);

      // Deliberately not calling form.reset(): the enquiry has not been
      // delivered yet, so the visitor must keep what they typed.
      window.location.href = mailto;
    });
  }

  // ------------------------------------------------------------------------
  // DOM Ready Initialization
  // ------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initLogoLoader();
    initHeroScrollEffect();
    initWhatsAppReveal();
    initProcessSwitcher();
    initCapabilityAccordion();
    initBenefitSelector();
    initMobileMenu();
    initHeaderScroll();
    initScrollSpy();
    initContactForm();
  });
})();

