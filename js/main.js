/**
 * ROOTS APPAREL MANUFACTURING — CORE JAVASCRIPT
 * Vanilla JS | Lightweight | Zero Dependencies | Fully Accessible
 */

(function () {
  'use strict';

  // Where website enquiries are sent. Kept in one place so it cannot drift
  // out of sync with the address shown in the contact section and footer.
  const CONTACT_EMAIL = 'rootsbusinessconnect@gmail.com';

  // Google Sheets Webhook URL: Replace with your deployed Google Apps Script Web App URL.
  // Instructions are in google-apps-script.js
  const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzAuIVChWKgNyISkzhc2uXSMK55eT3yduKzA5TsJ5pn-mZuQEui5FCD3e6CU3mDk6-Jpg/exec';

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
  // The nine stage photographs are self-hosted WebP. 1600 is the top tier and
  // carries no suffix; the layout asks for 84vw, so 1600 covers a 1x desktop and
  // 1200 covers a 2x phone. Previously these were Unsplash URLs and the width was
  // a query parameter the CDN resolved — now each width is a file that must exist.
  const PROCESS_WIDTHS = [600, 1200, 1600];
  const PROCESS_TOP = 1600;

  // base -> "…-600.webp 600w, …-1200.webp 1200w, ….webp 1600w"
  const processSrcset = (base) =>
    PROCESS_WIDTHS.map((w) => `${base}${w === PROCESS_TOP ? '' : '-' + w}.webp ${w}w`).join(', ');
  const processSrc = (base) => `${base}-1200.webp`;

  const processStages = [
    {
      name: 'CONFIRM THE ORDER',
      copy: 'Customer order received and confirmed with all details.',
      image: 'assets/images/process/roots-process-01-order',
      alt: 'Two people reviewing handwritten notes beside a laptop'
    },
    {
      name: 'PRODUCTION PLANNING',
      copy: 'Plan production schedule, allocate resources, and set timelines.',
      image: 'assets/images/process/roots-process-02-planning',
      alt: 'A hand sketching a planning diagram on paper'
    },
    {
      name: 'RAW MATERIALS SOURCING',
      copy: 'Source high-quality denim fabric, trims, buttons, labels and other materials.',
      image: 'assets/images/process/roots-process-03-sourcing',
      alt: 'Rolls of undyed natural-fibre fabric stacked in storage'
    },
    {
      name: 'DESIGNING',
      copy: 'Create garment designs, patterns and tech packs.',
      image: 'assets/images/process/roots-process-04-designing',
      alt: 'A hand tracing a garment design pattern and technical drawing'
    },
    {
      name: 'SAMPLING',
      copy: 'Develop samples, get approvals and make necessary changes.',
      image: 'assets/images/process/roots-process-05-sampling',
      alt: 'Thread cones, a ruler and shears laid out on a work surface'
    },
    {
      name: 'BULK PRODUCTION',
      copy: 'Cutting, stitching and assembling in bulk as per approved sample.',
      image: 'assets/images/process/roots-process-06-production',
      alt: 'An overhead garment conveyor rail running through a production floor'
    },
    {
      name: 'WASHING',
      copy: 'Apply washing, bleaching and special effects for desired look and feel.',
      image: 'assets/images/process/roots-process-07-washing',
      alt: 'A basket of laundered garments'
    },
    {
      name: 'FINISHING',
      copy: 'Ironing, quality check, tagging, folding and final inspection.',
      image: 'assets/images/process/roots-process-08-finishing',
      alt: 'Hands pressing a seam on a white garment'
    },
    {
      name: 'DELIVERY',
      copy: 'Pack, label and ship to customers on time.',
      image: 'assets/images/process/roots-process-09-delivery',
      alt: 'Finished shirts hanging on a rail'
    }
  ];

  // ------------------------------------------------------------------------
  // 1. Process Stages Interactive Switcher with Physics-Based Sliding & Touch
  // ------------------------------------------------------------------------
  function initProcessSwitcher() {
    const visualContainer = document.querySelector('.process-visual');
    if (!visualContainer) return;

    let imgActive = visualContainer.querySelector('.process-img.is-active');
    let imgIncoming = visualContainer.querySelector('.process-img.is-incoming');
    if (!imgActive) imgActive = visualContainer.querySelector('img');

    const caption = visualContainer.querySelector('.process-caption');
    const num = visualContainer.querySelector('.process-stage-num');
    const title = visualContainer.querySelector('.process-title') || visualContainer.querySelector('.process-caption h3');
    const copy = visualContainer.querySelector('.process-desc') || visualContainer.querySelector('.process-caption p');
    const timeline = document.querySelector('.timeline');
    const buttons = Array.from(document.querySelectorAll('.timeline button'));

    if (!imgActive || !buttons.length) return;

    let currentIndex = buttons.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    if (currentIndex < 0) currentIndex = 0;

    const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Sliding indicator rail synchronization
    const updateSlider = (btn) => {
      if (!timeline || !btn) return;
      const x = btn.offsetLeft;
      const w = btn.offsetWidth;
      timeline.style.setProperty('--slider-x', `${x}px`);
      timeline.style.setProperty('--slider-w', `${w}px`);
      timeline.classList.add('has-slider');
    };

    // Centre the active stage in the timeline's own horizontal rail.
    //
    // This used to call activeBtn.scrollIntoView({ block: 'nearest', inline:
    // 'center' }). scrollIntoView walks EVERY scrollable ancestor, the document
    // included, so on desktop — where .timeline is a plain grid with no
    // overflow — it scrolled the whole page down to the process section.
    // `behavior: 'auto'` does not opt out either: it resolves to the computed
    // `scroll-behavior`, which is `smooth` on html, so the page glided away
    // from wherever the reader was.
    //
    // Resize fires continuously while a desktop window is dragged and every
    // time a mobile address bar shows or hides, so that was a page jump the
    // reader never asked for. Setting scrollLeft on the rail itself cannot
    // move the document.
    const centreInRail = (btn, smooth) => {
      if (!timeline || !btn) return;
      if (timeline.scrollWidth <= timeline.clientWidth) return;  // not a rail at this width
      const target = btn.offsetLeft - (timeline.clientWidth - btn.offsetWidth) / 2;
      const max = timeline.scrollWidth - timeline.clientWidth;
      const left = Math.max(0, Math.min(target, max));
      if (smooth && !prefersReduced() && typeof timeline.scrollTo === 'function') {
        timeline.scrollTo({ left, behavior: 'smooth' });
      } else {
        timeline.scrollLeft = left;
      }
    };

    // Position slider immediately on current active button
    updateSlider(buttons[currentIndex]);

    let resizeQueued = false;
    window.addEventListener('resize', () => {
      if (resizeQueued) return;
      resizeQueued = true;
      window.requestAnimationFrame(() => {
        resizeQueued = false;
        const activeBtn = buttons[currentIndex] || buttons[0];
        updateSlider(activeBtn);
        centreInRail(activeBtn, false);
      });
    }, { passive: true });

    // The roving tabindex the tablist pattern requires. It was previously only
    // established inside activateStage, i.e. after the first interaction, so on
    // page load all nine tabs sat in the tab order — a keyboard visitor had to
    // press Tab nine times to get past the process section instead of once.
    buttons.forEach((b, i) => { b.tabIndex = i === currentIndex ? 0 : -1; });

    let captionTimer = 0;

    const activateStage = (index, userInitiated) => {
      if (index === currentIndex && !userInitiated) return;
      const stage = processStages[index];
      if (!stage) return;

      currentIndex = index;

      buttons.forEach((b, i) => {
        const isSelected = i === index;
        b.classList.toggle('active', isSelected);
        b.setAttribute('aria-selected', String(isSelected));
        b.tabIndex = isSelected ? 0 : -1;
        if (isSelected) {
          updateSlider(b);
          if (userInitiated) {
            // Same reason as centreInRail's comment: scrollIntoView would be
            // free to move the document as well as the rail. A keyboard user
            // arrowing along the tablist should never lose their scroll
            // position to a control that is already on screen.
            centreInRail(b, true);
          }
        }
      });

      visualContainer.setAttribute('aria-labelledby', buttons[index].id);

      if (prefersReduced()) {
        imgActive.srcset = processSrcset(stage.image);
        imgActive.sizes = '(max-width: 800px) 88vw, 84vw';
        imgActive.src = processSrc(stage.image);
        imgActive.alt = stage.alt;
        if (num) num.textContent = String(index + 1).padStart(2, '0');
        if (title) title.textContent = stage.name;
        if (copy) copy.textContent = stage.copy;
        return;
      }

      // Smooth crossfade & stagger
      if (caption) caption.classList.add('is-transitioning');

      // Update incoming image layer
      if (imgIncoming) {
        imgIncoming.srcset = processSrcset(stage.image);
        imgIncoming.sizes = '(max-width: 800px) 88vw, 84vw';
        imgIncoming.src = processSrc(stage.image);
        imgIncoming.alt = stage.alt;
        imgIncoming.removeAttribute('aria-hidden');

        // Swap visual layers
        imgActive.classList.remove('is-active');
        imgActive.classList.add('is-settling');
        imgActive.setAttribute('aria-hidden', 'true');

        imgIncoming.classList.remove('is-incoming', 'is-settling');
        imgIncoming.classList.add('is-active');

        // Swap pointers
        const temp = imgActive;
        imgActive = imgIncoming;
        imgIncoming = temp;
        imgIncoming.classList.add('is-incoming');
      } else {
        imgActive.srcset = processSrcset(stage.image);
        imgActive.src = processSrc(stage.image);
        imgActive.alt = stage.alt;
      }

      // Editorial micro-stagger for caption text.
      //
      // Cleared first: each call used to queue its own 140 ms timer with no
      // handle kept, so swiping or arrowing through stages faster than that
      // left several in flight at once. They fire in the order they were
      // queued, not the order the user chose, so the caption could settle on a
      // stage the visitor had already moved past — and the last one to land
      // also cleared `is-transitioning`, ending the fade for a stage that was
      // no longer showing.
      clearTimeout(captionTimer);
      captionTimer = setTimeout(() => {
        if (num) num.textContent = String(index + 1).padStart(2, '0');
        if (title) title.textContent = stage.name;
        if (copy) copy.textContent = stage.copy;
        if (caption) caption.classList.remove('is-transitioning');
      }, 140);
    };

    // Keyboard arrow navigation
    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => activateStage(index, true));

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
        activateStage(newIndex, true);
      });
    });

    // Touch gesture swipe on process visual card
    let touchStartX = 0;
    let touchStartY = 0;
    let isTrackingTouch = false;

    visualContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isTrackingTouch = true;
    }, { passive: true });

    visualContainer.addEventListener('touchend', (e) => {
      if (!isTrackingTouch || e.changedTouches.length !== 1) return;
      isTrackingTouch = false;

      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;

      // Check if gesture is a decisive horizontal swipe (> 45px and 1.5x vertical delta)
      if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX < 0) {
          // Swipe Left -> Next Stage
          const nextIndex = (currentIndex + 1) % processStages.length;
          activateStage(nextIndex, true);
        } else {
          // Swipe Right -> Previous Stage
          const prevIndex = (currentIndex - 1 + processStages.length) % processStages.length;
          activateStage(prevIndex, true);
        }
      }
    }, { passive: true });
  }

  // ------------------------------------------------------------------------
  // 2. Accessible Capability Accordion with Physics-Based Smooth Expansion
  // ------------------------------------------------------------------------
  function initCapabilityAccordion() {
    const items = document.querySelectorAll('.capability-item');
    if (!items.length) return;

    items.forEach((item, index) => {
      const trigger = item.querySelector('.capability-trigger');
      const panel = item.querySelector('.capability-panel');
      if (!trigger || !panel) return;

      trigger.addEventListener('click', () => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const willExpand = !isExpanded;

        // Smoothly close any other open panel to maintain a clean editorial flow
        if (willExpand) {
          items.forEach((sibling) => {
            if (sibling !== item && sibling.classList.contains('is-open')) {
              const sibTrigger = sibling.querySelector('.capability-trigger');
              const sibPanel = sibling.querySelector('.capability-panel');
              if (sibTrigger) sibTrigger.setAttribute('aria-expanded', 'false');
              sibling.classList.remove('is-open');
              if (sibPanel) sibPanel.classList.remove('is-open');
            }
          });
        }

        trigger.setAttribute('aria-expanded', String(willExpand));
        item.classList.toggle('is-open', willExpand);
        panel.classList.toggle('is-open', willExpand);
      });

      // Keyboard arrow navigation
      trigger.addEventListener('keydown', (e) => {
        let targetIndex = -1;
        if (e.key === 'ArrowDown') {
          targetIndex = (index + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
          targetIndex = (index - 1 + items.length) % items.length;
        } else if (e.key === 'Home') {
          targetIndex = 0;
        } else if (e.key === 'End') {
          targetIndex = items.length - 1;
        }

        if (targetIndex >= 0) {
          e.preventDefault();
          const targetTrigger = items[targetIndex].querySelector('.capability-trigger');
          if (targetTrigger) targetTrigger.focus();
        }
      });
    });
  }

  // ------------------------------------------------------------------------
  // 2a. Section Scroll Reveals (Subtle & Non-Intrusive)
  // ------------------------------------------------------------------------
  function initSectionScrollReveals() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver !== 'function') return;

    const standardTargets = document.querySelectorAll(
      '.intro-grid, .story-copy, .process-head, .capabilities-head, .focus-head'
    );
    // `.why-roots-head`, `.mission-content` and `.vision-content` were also
    // listed here and match no element in index.html — the real markup is
    // `.why-grid` and `.mission-half`. Three of the eleven selectors therefore
    // did nothing, and the WHY ROOTS / MISSION / VISION sections have never
    // revealed on scroll.
    //
    // Removed rather than repointed: those three sections currently arrive
    // still, which gives the long dark middle of the page a rest between the
    // moving ones. Reinstating them is a design decision, not a bug fix — if
    // it is wanted, add '.why-grid, .mission-half' to this list.
    const quietTargets = document.querySelectorAll(
      '.quality-content, .closing-content, .contact-details'
    );

    if (!standardTargets.length && !quietTargets.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    standardTargets.forEach((target) => {
      target.classList.add('reveal-on-scroll');
      observer.observe(target);
    });

    quietTargets.forEach((target) => {
      target.classList.add('reveal-on-scroll', 'reveal-quiet');
      observer.observe(target);
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
      document.body.classList.toggle('mobile-nav-open', isOpen);

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
      // Without these the validation messages were painted silently: the text
      // appeared above the form but nothing announced it, and nothing marked
      // which field was at fault. The measurements form already works this way;
      // this brings the homepage enquiry form in line with it.
      statusEl.setAttribute('role', 'status');
      statusEl.setAttribute('aria-live', 'polite');
      form.prepend(statusEl);
    }

    // Marks the offending fields, announces the reason, and puts the caret in
    // the first one so a keyboard or screen-reader user is taken to the problem
    // rather than left to hunt for it.
    const fail = (message, fields) => {
      statusEl.className = 'form-status error';
      statusEl.textContent = message;
      const bad = (fields || []).filter(Boolean);
      bad.forEach((el) => el.setAttribute('aria-invalid', 'true'));
      if (bad.length) bad[0].focus();
    };

    const clearInvalid = () => {
      form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    };

    // A field stops being "the problem" as soon as it is edited.
    form.querySelectorAll('input, textarea, select').forEach((el) => {
      el.addEventListener('input', () => el.removeAttribute('aria-invalid'));
      el.addEventListener('change', () => el.removeAttribute('aria-invalid'));
    });

    form.addEventListener('submit', async (e) => {
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

      clearInvalid();

      const empty = [nameInput, companyInput, emailInput].filter((el) => !el?.value.trim());
      if (empty.length) {
        fail('Please fill in all required fields (Name, Company, Email).', empty);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        fail('Please enter a valid email address, for example name@brand.com.', [emailInput]);
        return;
      }

      const get = (n) => {
        const el = form.querySelector('[name="' + n + '"]');
        return el && el.value.trim() ? el.value.trim() : '';
      };

      const lines = [
        ['Name', get('name')],
        ['Company / brand', get('company')],
        ['Email', get('email')],
        ['Phone', get('phone')],
        ['Location / City', get('location')],
        ['GST Number', get('gst')],
        ['Looking to manufacture', get('manufacture')],
        ['Project details', get('message')]
      ].filter((r) => r[1]).map((r) => r[0] + ': ' + r[1]);

      const subject = 'Manufacturing enquiry — ' + get('company');
      const body = 'New manufacturing enquiry from the ROOTS website.\n\n' + lines.join('\n') + '\n';
      const mailto = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      // Helper to open email app if Google Sheets is not configured or fails
      const triggerEmailFallback = (customMessage) => {
        statusEl.className = 'form-status hand-off';
        statusEl.replaceChildren();

        const intro = document.createElement('p');
        intro.innerHTML = customMessage || (
          'Your email app is opening with this enquiry ready to send — ' +
          '<strong>it is not sent until you press send there.</strong>'
        );
        statusEl.appendChild(intro);

        const fallback = document.createElement('p');
        fallback.append('If nothing opened, ');
        const link = document.createElement('a');
        link.href = mailto;
        link.textContent = 'open the enquiry in your email app';
        fallback.appendChild(link);
        fallback.append(', or write to ' + CONTACT_EMAIL + ' / +91 82963 76673. ');
        fallback.append('Your details below are kept so nothing is lost.');
        statusEl.appendChild(fallback);

        window.location.href = mailto;
      };

      // Check if a real Google Apps Script endpoint is configured
      const isEndpointConfigured = GOOGLE_SHEET_URL &&
        GOOGLE_SHEET_URL.trim().length > 0 &&
        !GOOGLE_SHEET_URL.includes('YOUR_COPIED_URL');

      if (!isEndpointConfigured) {
        triggerEmailFallback(
          'Google Sheet endpoint not configured yet. Opening your email app to send this enquiry — ' +
          '<strong>it is not sent until you press send there.</strong>'
        );
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'SEND ENQUIRY';

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.setAttribute('aria-busy', 'true');
          submitBtn.innerHTML = 'SENDING ENQUIRY... <span aria-hidden="true">⏳</span>';
        }

        // Prepare URL-encoded form data
        // The endpoint's reply must be READ before anything is claimed.
        //
        // This previously posted with `mode: 'no-cors'`. An opaque response
        // resolves successfully whatever the server did — 500, 404, a revoked
        // deployment, an un-authorised script — because the browser refuses to
        // let the page see it. The code then announced "Enquiry received
        // successfully … recorded in our production schedule" and called
        // form.reset(), so a failed submission looked exactly like a delivered
        // one and the visitor's enquiry was wiped. That is the lead-destroying
        // false confirmation this handler was rewritten to remove.
        //
        // google-apps-script.js answers {status:'success'|'error'} as JSON, so
        // a real confirmation is available. Content-Type text/plain keeps the
        // request "simple" so the browser sends no CORS preflight — Apps Script
        // serves no OPTIONS handler — and doPost already falls back to parsing
        // e.postData.contents as JSON when e.parameter is empty.
        const payload = {};
        new FormData(form).forEach((value, key) => { payload[key] = value; });

        const response = await fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);

        const result = JSON.parse(await response.text());
        if (!result || result.status !== 'success') {
          throw new Error(result && result.message ? result.message : 'endpoint reported failure');
        }

        // Only now is the enquiry known to have been stored.
        statusEl.className = 'form-status success';
        statusEl.replaceChildren();

        const successTitle = document.createElement('p');
        const strongEl = document.createElement('strong');
        strongEl.textContent = 'Enquiry sent.';
        successTitle.appendChild(strongEl);
        statusEl.appendChild(successTitle);

        const successMsg = document.createElement('p');
        successMsg.textContent = 'Thank you, ' + (get('name') || 'partner') +
          '. We have your enquiry and a ROOTS representative will reply to ' + get('email') + ' shortly.';
        statusEl.appendChild(successMsg);

        // Safe to clear: the enquiry is on the server, not only on this screen.
        form.reset();

      } catch (err) {
        // On network or transmission failure, provide instant fallback to email
        triggerEmailFallback(
          'We encountered an issue submitting your enquiry directly. We have opened your email app to ensure your message reaches us without delay.'
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });
  }

  // ------------------------------------------------------------------------
  // 8. Luxury Custom Select Component
  // ------------------------------------------------------------------------
  function initCustomSelect() {
    const wrap = document.getElementById('custom-manufacture-wrap');
    if (!wrap) return;

    const trigger = wrap.querySelector('.custom-select-trigger');
    const valueEl = wrap.querySelector('.custom-select-value');
    const options = wrap.querySelectorAll('.custom-select-option');
    const nativeSelect = wrap.querySelector('#contact-manufacture');
    const form = wrap.closest('form');

    if (!trigger || !valueEl || !nativeSelect) return;

    const closeDropdown = () => {
      wrap.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const openDropdown = () => {
      wrap.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      const selected = wrap.querySelector('.custom-select-option.is-selected') || options[0];
      if (selected) selected.focus();
    };

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrap.classList.contains('is-open');
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    const selectOption = (opt) => {
      const val = opt.getAttribute('data-value') || '';
      const labelText = val ? opt.querySelector('.opt-label')?.textContent.trim() : 'Select apparel category...';

      // Sync native select value
      nativeSelect.value = val;
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));

      // Update trigger UI
      valueEl.textContent = labelText;
      trigger.setAttribute('data-selected', val ? 'true' : 'false');

      // Update option states
      options.forEach((o) => {
        const isThis = o === opt;
        o.classList.toggle('is-selected', isThis);
        o.setAttribute('aria-selected', isThis ? 'true' : 'false');
      });

      closeDropdown();
      trigger.focus();
    };

    options.forEach((opt) => {
      opt.setAttribute('tabindex', '0');
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectOption(opt);
      });

      opt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectOption(opt);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = opt.nextElementSibling;
          if (next && next.classList.contains('custom-select-option')) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = opt.previousElementSibling;
          if (prev && prev.classList.contains('custom-select-option')) prev.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown();
          trigger.focus();
        }
      });
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        closeDropdown();
      }
    });

    if (form) {
      form.addEventListener('reset', () => {
        setTimeout(() => {
          valueEl.textContent = 'Select apparel category...';
          trigger.setAttribute('data-selected', 'false');
          options.forEach((o, i) => {
            const isPlaceholder = i === 0;
            o.classList.toggle('is-selected', isPlaceholder);
            o.setAttribute('aria-selected', isPlaceholder ? 'true' : 'false');
          });
        }, 0);
      });
    }
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
    initSectionScrollReveals();
    initBenefitSelector();
    initMobileMenu();
    initHeaderScroll();
    initScrollSpy();
    initContactForm();
    initCustomSelect();
  });
})();

