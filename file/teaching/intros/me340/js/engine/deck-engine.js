(function () {
  'use strict';

  const ME340 = (window.ME340 = window.ME340 || {});
  ME340.labs = ME340.labs || {};

  const PALETTES = {
    dark: {
      theme: 'dark',
      bg: '#141413',
      surface: '#1A1A18',
      surface2: '#232320',
      grid: 'rgba(236, 232, 224, 0.045)',
      axis: 'rgba(236, 232, 224, 0.42)',
      text: '#ECE8DF',
      textMuted: '#9E988C',
      cardinal: '#D14D41',
      cardinalSoft: 'rgba(209, 77, 65, 0.16)',
      teal: '#52A391',
      tealSoft: 'rgba(82, 163, 145, 0.16)',
      amber: '#D49B38',
      amberSoft: 'rgba(212, 155, 56, 0.16)',
      blue: '#6B96C2',
      blueSoft: 'rgba(107, 150, 194, 0.16)',
      border: 'rgba(236, 232, 224, 0.16)',
      white: '#F5F2EB'
    },
    light: {
      theme: 'light',
      bg: '#F6F4EE',
      surface: '#FFFFFF',
      surface2: '#ECE8DF',
      grid: 'rgba(26, 25, 23, 0.045)',
      axis: 'rgba(26, 25, 23, 0.42)',
      text: '#1A1917',
      textMuted: '#5C5850',
      cardinal: '#8C1515',
      cardinalSoft: 'rgba(140, 21, 21, 0.11)',
      teal: '#175E54',
      tealSoft: 'rgba(23, 94, 84, 0.11)',
      amber: '#9A5A12',
      amberSoft: 'rgba(154, 90, 18, 0.11)',
      blue: '#23538A',
      blueSoft: 'rgba(35, 83, 138, 0.11)',
      border: 'rgba(26, 25, 23, 0.16)',
      white: '#FFFFFF'
    }
  };

  const state = {
    currentIndex: 0,
    theme: 'dark',
    autoplay: false,
    autoplayDurationMs: 8000,
    autoplayStartMs: 0,
    drawerOpen: false,
    drawerMode: 'slide',
    overviewOpen: false,
    helpOpen: false,
    lastInputWasPointer: false,
    slideEls: [],
    mountedLabs: new Map(),
    animLoops: new Map(),
    rafId: null,
    lastRafMs: 0,
    resizeObserver: null
  };

  ME340.registerLab = function (labId, factoryFn) {
    ME340.labs[labId] = factoryFn;
  };

  ME340.getThemePalette = function () {
    return PALETTES[state.theme] || PALETTES.dark;
  };

  ME340.renderMath = function (el) {
    if (!el || typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false,
        strict: 'ignore',
        output: 'htmlAndMathml'
      });
    } catch (err) {
      // Keep raw text readable if math rendering fails
      console.warn('KaTeX render warning:', err);
    }
  };

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getDeck() {
    return ME340.DECK_DATA || { meta: {}, parts: {}, slides: [], lectureMap: [], allSymbols: [], references: [] };
  }

  function parseInitialSlide(slides) {
    const hash = window.location.hash || '';
    if (!hash) return 0;
    // Legacy Reveal.js hash format #/0 .. #/22
    const revealMatch = hash.match(/^#\/(\d+)/);
    if (revealMatch) {
      const idx = parseInt(revealMatch[1], 10);
      return Math.max(0, Math.min(slides.length - 1, idx));
    }
    // Numeric 1-based #1 .. #23
    const numMatch = hash.match(/^#(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      return Math.max(0, Math.min(slides.length - 1, idx));
    }
    // Named slide id
    const clean = hash.replace(/^#\/?/, '');
    const byId = slides.findIndex(function (s) { return s.id === clean; });
    return byId >= 0 ? byId : 0;
  }

  function createLabApi(slideIndex) {
    return {
      getPalette: function () {
        return ME340.getThemePalette();
      },
      goToSlide: function (target) {
        ME340.goToSlide(target);
      },
      renderMath: function (el) {
        ME340.renderMath(el);
      },
      registerAnimationLoop: function (fn) {
        if (!state.animLoops.has(slideIndex)) {
          state.animLoops.set(slideIndex, new Set());
        }
        const bucket = state.animLoops.get(slideIndex);
        bucket.add(fn);
        ensureRafLoop();
        return function unregister() {
          bucket.delete(fn);
        };
      }
    };
  }

  function ensureRafLoop() {
    if (state.rafId !== null) return;
    state.lastRafMs = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - state.lastRafMs) / 1000));
      state.lastRafMs = now;
      const timeSec = now / 1000;

      if (!document.hidden) {
        const activeBucket = state.animLoops.get(state.currentIndex);
        if (activeBucket && activeBucket.size > 0) {
          activeBucket.forEach(function (fn) {
            try {
              fn(dt, timeSec);
            } catch (e) {
              console.error('Lab loop error:', e);
            }
          });
        }
        if (state.autoplay) {
          tickAutoplay(now);
        }
      }

      const hasLoops = Array.from(state.animLoops.values()).some(function (s) { return s.size > 0; });
      if (hasLoops || state.autoplay) {
        state.rafId = requestAnimationFrame(frame);
      } else {
        state.rafId = null;
      }
    }
    state.rafId = requestAnimationFrame(frame);
  }

  function mountLabForSlide(slideIndex) {
    const deck = getDeck();
    const slide = deck.slides[slideIndex];
    if (!slide || !slide.labId) return;
    if (state.mountedLabs.has(slideIndex)) return;

    const factory = ME340.labs[slide.labId];
    const slideEl = state.slideEls[slideIndex];
    if (!factory || !slideEl) return;

    const mountEl = slideEl.querySelector('.lab-mount[data-lab="' + slide.labId + '"]');
    if (!mountEl) return;

    try {
      const instance = factory(mountEl, createLabApi(slideIndex)) || {};
      state.mountedLabs.set(slideIndex, instance);
      ME340.renderMath(mountEl);
      if (state.resizeObserver) {
        state.resizeObserver.observe(mountEl);
      }
    } catch (err) {
      console.error('Failed to mount lab', slide.labId, err);
      mountEl.innerHTML = '<div class="lab-fallback">Interactive lab unavailable (' + escapeHtml(slide.labId) + ').</div>';
    }
  }

  function buildSlideFooterSymbols(slide) {
    if (!slide.symbols || slide.symbols.length === 0) return '';
    const chips = slide.symbols.map(function (item, idx) {
      return (
        '<button type="button" class="sym-chip" data-sym-idx="' + idx + '" title="Inspect notation">' +
        '<span class="sym-chip-math">' + item.sym + '</span>' +
        '<span class="sym-chip-label">' + escapeHtml(item.short || item.desc) + '</span>' +
        '</button>'
      );
    }).join('');
    return '<div class="slide-footer-bar"><span class="sym-strip-kicker">Symbols</span><div class="sym-chip-row">' + chips + '</div></div>';
  }

  function buildHeroSlide(slide, deck) {
    const meta = deck.meta || {};
    return (
      '<div class="hero-bg-lab lab-mount" data-lab="' + slide.labId + '" aria-label="Interactive elastic continuum canvas"></div>' +
      '<div class="hero-scrim" aria-hidden="true"></div>' +
      '<div class="hero-foreground">' +
        '<div class="hero-top-pill-row">' +
          '<span class="hero-course-pill"><span class="hero-course-text">Stanford University · <span class="nowrap">Mechanical Engineering</span></span></span>' +
          '<span class="hero-term-pill">' + escapeHtml(meta.term || 'Winter 2025-26') + '</span>' +
        '</div>' +
        '<h1 class="hero-title">' + escapeHtml(slide.title) + '</h1>' +
        '<p class="hero-subtitle">' + escapeHtml(slide.subtitle || 'An interactive course map for elasticity, plasticity, and fracture mechanics.') + '</p>' +
        '<div class="hero-meta-links">' +
          '<a class="hero-link-pill" href="' + escapeHtml(meta.exploreUrl || 'https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&q=ME340') + '" target="_blank" rel="noopener">ME 340 Catalog ↗</a>' +
          '<a class="hero-link-pill" href="' + escapeHtml(meta.pdfUrl || 'https://hanfengzhai.com/file/teaching/intros/ME340_Intro.pdf') + '" target="_blank" rel="noopener">Printable PDF ↗</a>' +
          '<a class="hero-link-pill" href="' + escapeHtml(meta.notesUrl || 'https://hanfengzhai.com/file/teaching/notes/elasticity_notes.pdf') + '" target="_blank" rel="noopener">Study Notes ↗</a>' +
        '</div>' +
        '<div class="hero-author-card">' +
          '<div class="stanford-emblem" aria-hidden="true">' +
            '<svg viewBox="0 0 40 40" width="36" height="36" fill="none">' +
              '<rect x="2" y="2" width="36" height="36" rx="1" fill="none" stroke="var(--cardinal)" stroke-width="1.6"/>' +
              '<path d="M20 8L14 18h4l-4 8h5v6h2v-6h5l-4-8h4L20 8z" fill="var(--teal)"/>' +
            '</svg>' +
          '</div>' +
          '<div class="hero-author-text">' +
            '<div class="hero-author-name">' + escapeHtml(meta.author || 'Hanfeng Zhai') + '</div>' +
            '<div class="hero-author-dept">' + escapeHtml(meta.department || 'Department of Mechanical Engineering, Stanford University') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="hero-cta-row">' +
          '<button type="button" class="btn-primary" data-action="start-deck">Explore Course Map →</button>' +
        '</div>' +
        '<p class="hero-canvas-hint">Move pointer across the stage to apply traction to the continuum mesh.</p>' +
      '</div>'
    );
  }

  function buildStandardHeader(slide, idx, total, deck) {
    const partInfo = (deck.parts && deck.parts[slide.partId]) || { label: slide.partLabel || 'ME 340' };
    const badges = (slide.lectureBadges || []).map(function (b) {
      return '<span class="lecture-pill">' + escapeHtml(b) + '</span>';
    }).join('');
    return (
      '<div class="slide-header">' +
        '<div class="slide-meta-row">' +
          '<span class="part-pill part-' + escapeHtml(slide.partId) + '">' + escapeHtml(partInfo.label) + '</span>' +
          badges +
          '<span class="slide-index-tag">' + pad2(idx + 1) + ' / ' + pad2(total) + '</span>' +
        '</div>' +
        '<h2 class="slide-title">' + slide.title + '</h2>' +
        (slide.lead ? '<p class="slide-lead">' + slide.lead + '</p>' : '') +
      '</div>'
    );
  }

  function buildOutlineSlide(slide, idx, total, deck) {
    const cards = (slide.outlineItems || []).map(function (item, k) {
      return (
        '<button type="button" class="outline-card part-' + escapeHtml(item.partId) + '" data-jump="' + escapeHtml(item.targetId) + '">' +
          '<div class="outline-card-top">' +
            '<span class="outline-num">' + pad2(k + 1) + '</span>' +
            '<span class="outline-part-tag">' + escapeHtml(item.partTag) + '</span>' +
          '</div>' +
          '<h3 class="outline-card-title">' + escapeHtml(item.title) + '</h3>' +
          '<p class="outline-card-desc">' + item.summary + '</p>' +
          '<span class="outline-jump-hint">Open section →</span>' +
        '</button>'
      );
    }).join('');
    return (
      '<div class="slide-inner">' +
        buildStandardHeader(slide, idx, total, deck) +
        '<div class="slide-body">' +
          '<div class="outline-grid">' + cards + '</div>' +
        '</div>' +
        '<div class="slide-footer-bar"><span class="sym-strip-kicker">Tip</span><span class="footer-note-text">Click any module card to jump directly, or use ← → keys, swipe, or press G for the full grid.</span></div>' +
      '</div>'
    );
  }

  function buildAtlasSlide(slide, idx, total, deck) {
    const groups = deck.lectureMap || [];
    const colsHtml = groups.map(function (grp) {
      const rows = grp.lectures.map(function (lec) {
        const jumpAttr = lec.targetId ? ' data-jump="' + escapeHtml(lec.targetId) + '"' : '';
        const clickable = lec.targetId ? ' is-clickable' : '';
        return (
          '<button type="button" class="lecture-row' + clickable + '"' + jumpAttr + '>' +
            '<span class="lecture-num">' + pad2(lec.num) + '</span>' +
            '<span class="lecture-name">' + escapeHtml(lec.title) + '</span>' +
            (lec.targetId ? '<span class="lecture-arrow" aria-hidden="true">↗</span>' : '') +
          '</button>'
        );
      }).join('');
      return (
        '<div class="atlas-col part-' + escapeHtml(grp.partId) + '" data-atlas-part="' + escapeHtml(grp.partId) + '">' +
          '<div class="atlas-col-head">' +
            '<span class="atlas-col-kicker">' + escapeHtml(grp.kicker) + '</span>' +
            '<h3 class="atlas-col-title">' + escapeHtml(grp.title) + '</h3>' +
          '</div>' +
          '<div class="atlas-list">' + rows + '</div>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="slide-inner">' +
        buildStandardHeader(slide, idx, total, deck) +
        '<div class="slide-body">' +
          '<div class="atlas-toolbar">' +
            '<div class="lab-pill-group" role="group" aria-label="Filter course parts">' +
              '<button type="button" class="lab-pill is-active" data-atlas-filter="all">All Parts (23 Lectures)</button>' +
              '<button type="button" class="lab-pill" data-atlas-filter="part-1">Part I: Elasticity</button>' +
              '<button type="button" class="lab-pill" data-atlas-filter="part-2">Part II: Plasticity</button>' +
              '<button type="button" class="lab-pill" data-atlas-filter="part-3">Part III: Fracture</button>' +
            '</div>' +
            '<a class="hero-link-pill" href="' + escapeHtml((deck.meta && deck.meta.notesUrl) || 'https://hanfengzhai.com/file/teaching/notes/elasticity_notes.pdf') + '" target="_blank" rel="noopener">Consolidated Study Notes (PDF) ↗</a>' +
          '</div>' +
          '<div class="atlas-columns">' + colsHtml + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildClosingSlide(slide, idx, total, deck) {
    const refs = (deck.references || []).map(function (ref, k) {
      const linkHtml = ref.url
        ? '<a class="ref-link" href="' + escapeHtml(ref.url) + '" target="_blank" rel="noopener">' + escapeHtml(ref.linkLabel || 'Open resource') + ' ↗</a>'
        : '';
      return (
        '<article class="ref-card">' +
          '<div class="ref-num">' + pad2(k + 1) + '</div>' +
          '<div class="ref-body">' +
            '<div class="ref-kind">' + escapeHtml(ref.kind) + '</div>' +
            '<h3 class="ref-title">' + escapeHtml(ref.title) + '</h3>' +
            '<p class="ref-authors">' + escapeHtml(ref.citation) + '</p>' +
            linkHtml +
          '</div>' +
        '</article>'
      );
    }).join('');

    return (
      '<div class="slide-inner">' +
        buildStandardHeader(slide, idx, total, deck) +
        '<div class="slide-body">' +
          '<div class="closing-grid">' +
            '<div class="ref-list">' + refs + '</div>' +
            '<div class="closing-signoff">' +
              '<div class="signoff-kicker">Stanford ME 340</div>' +
              '<h3 class="signoff-heading">Thank you.</h3>' +
              '<p class="signoff-sub">Explore the live mechanics canvases, open the full notation glossary with <kbd>S</kbd>, or switch to archival paper mode with <kbd>T</kbd> for printing.</p>' +
              '<div class="signoff-actions">' +
                '<button type="button" class="btn-primary" data-jump="hero">↺ Back to Start</button>' +
                '<button type="button" class="btn-ghost" data-action="open-overview">Browse All 23 Slides</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildStandardSlide(slide, idx, total, deck) {
    const layout = slide.layout || 'split';
    let bodyInner = '';

    if (layout === 'split') {
      bodyInner =
        '<div class="split-grid">' +
          '<div class="col-content">' + (slide.contentHtml || '') + '</div>' +
          '<div class="col-lab">' +
            '<div class="lab-mount" data-lab="' + escapeHtml(slide.labId || '') + '"></div>' +
          '</div>' +
        '</div>';
    } else if (layout === 'bento') {
      bodyInner =
        '<div class="bento-grid">' +
          '<div class="bento-content">' + (slide.contentHtml || '') + '</div>' +
          '<div class="bento-lab">' +
            '<div class="lab-mount" data-lab="' + escapeHtml(slide.labId || '') + '"></div>' +
          '</div>' +
        '</div>';
    } else if (layout === 'compare') {
      bodyInner =
        '<div class="compare-layout">' +
          '<div class="compare-equations">' + (slide.contentHtml || '') + '</div>' +
          '<div class="compare-lab">' +
            '<div class="lab-mount" data-lab="' + escapeHtml(slide.labId || '') + '"></div>' +
          '</div>' +
        '</div>';
    } else if (layout === 'flow') {
      bodyInner =
        '<div class="flow-layout">' +
          '<div class="flow-lab-wrap">' +
            '<div class="lab-mount" data-lab="' + escapeHtml(slide.labId || '') + '"></div>' +
          '</div>' +
          '<div class="flow-story">' + (slide.contentHtml || '') + '</div>' +
        '</div>';
    } else if (layout === 'lab-wide') {
      bodyInner =
        '<div class="lab-wide-layout">' +
          (slide.contentHtml ? '<div class="wide-header-note">' + slide.contentHtml + '</div>' : '') +
          '<div class="lab-mount lab-mount-wide" data-lab="' + escapeHtml(slide.labId || '') + '"></div>' +
        '</div>';
    } else {
      bodyInner = '<div class="single-col">' + (slide.contentHtml || '') + '</div>';
    }

    return (
      '<div class="slide-inner">' +
        buildStandardHeader(slide, idx, total, deck) +
        '<div class="slide-body">' + bodyInner + '</div>' +
        buildSlideFooterSymbols(slide) +
      '</div>'
    );
  }

  function renderAllSlides() {
    const deck = getDeck();
    const stage = document.getElementById('stage');
    if (!stage) return;
    stage.innerHTML = '';
    state.slideEls = [];

    const total = deck.slides.length;
    deck.slides.forEach(function (slide, idx) {
      const sec = document.createElement('section');
      sec.className = 'slide layout-' + slide.layout + ' part-' + slide.partId;
      sec.dataset.index = String(idx);
      sec.dataset.id = slide.id;
      sec.setAttribute('aria-hidden', 'true');

      if (slide.layout === 'hero') {
        sec.innerHTML = buildHeroSlide(slide, deck);
      } else if (slide.layout === 'index') {
        sec.innerHTML = buildOutlineSlide(slide, idx, total, deck);
      } else if (slide.layout === 'atlas') {
        sec.innerHTML = buildAtlasSlide(slide, idx, total, deck);
      } else if (slide.layout === 'closing') {
        sec.innerHTML = buildClosingSlide(slide, idx, total, deck);
      } else {
        sec.innerHTML = buildStandardSlide(slide, idx, total, deck);
      }

      stage.appendChild(sec);
      state.slideEls.push(sec);
    });

    // Render KaTeX across all slide prose & symbol chips
    ME340.renderMath(stage);
    wireSlideInteractions(stage);
  }

  function wireSlideInteractions(stage) {
    stage.addEventListener('click', function (e) {
      const jumpBtn = e.target.closest('[data-jump]');
      if (jumpBtn) {
        ME340.goToSlide(jumpBtn.dataset.jump);
        return;
      }

      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        if (action === 'start-deck') {
          ME340.goToSlide(1);
        } else if (action === 'open-overview') {
          toggleOverview(true);
        }
        return;
      }

      const symChip = e.target.closest('.sym-chip');
      if (symChip) {
        const idx = parseInt(symChip.dataset.symIdx, 10);
        openSymbolDrawer('slide', idx);
        return;
      }

      const filterBtn = e.target.closest('[data-atlas-filter]');
      if (filterBtn) {
        const filter = filterBtn.dataset.atlasFilter;
        const container = filterBtn.closest('.slide-body');
        if (!container) return;
        container.querySelectorAll('[data-atlas-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b === filterBtn);
        });
        container.querySelectorAll('.atlas-col').forEach(function (col) {
          const match = filter === 'all' || col.dataset.atlasPart === filter;
          col.classList.toggle('is-hidden', !match);
        });
      }
    });

    // Any direct pointer interaction inside a lab pauses autoplay so it never interrupts exploration
    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.lab-mount')) {
        if (state.autoplay) setAutoplay(false);
      }
    });
  }

  function updateChrome() {
    const deck = getDeck();
    const total = deck.slides.length;
    const slide = deck.slides[state.currentIndex];
    if (!slide) return;

    const partInfo = (deck.parts && deck.parts[slide.partId]) || { label: slide.partLabel || 'ME 340' };
    const topPart = document.getElementById('topbar-part');
    const topTitle = document.getElementById('topbar-title');
    const counter = document.getElementById('slide-counter');
    const symCount = document.getElementById('symbol-count');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const fill = document.getElementById('progress-fill');
    const track = document.getElementById('progress-track');

    if (topPart) {
      topPart.textContent = partInfo.shortLabel || partInfo.label;
      topPart.className = 'topbar-part-badge part-' + slide.partId;
    }
    if (topTitle) {
      topTitle.textContent = slide.plainTitle || slide.title.replace(/<[^>]+>/g, '');
    }
    if (counter) {
      counter.textContent = pad2(state.currentIndex + 1) + ' / ' + pad2(total);
    }
    if (symCount) {
      const count = (slide.symbols && slide.symbols.length) || 0;
      symCount.textContent = String(count);
      symCount.classList.toggle('is-empty', count === 0);
    }
    if (btnPrev) btnPrev.disabled = state.currentIndex <= 0;
    if (btnNext) btnNext.disabled = state.currentIndex >= total - 1;

    const pct = total > 1 ? (state.currentIndex / (total - 1)) * 100 : 100;
    if (fill) fill.style.width = pct + '%';
    if (track) track.setAttribute('aria-valuenow', String(state.currentIndex + 1));

    document.querySelectorAll('.progress-tick').forEach(function (tick, i) {
      tick.classList.toggle('is-current', i === state.currentIndex);
      tick.classList.toggle('is-visited', i < state.currentIndex);
    });

    document.querySelectorAll('.overview-card').forEach(function (card, i) {
      card.classList.toggle('is-current', i === state.currentIndex);
    });

    if (state.drawerOpen && state.drawerMode === 'slide') {
      renderSymbolDrawerList();
    }
  }

  ME340.goToSlide = function (target, opts) {
    const deck = getDeck();
    const total = deck.slides.length;
    if (!total) return;

    let nextIdx = state.currentIndex;
    if (typeof target === 'number') {
      nextIdx = target;
    } else if (typeof target === 'string') {
      const byId = deck.slides.findIndex(function (s) { return s.id === target; });
      if (byId >= 0) nextIdx = byId;
    }
    nextIdx = Math.max(0, Math.min(total - 1, nextIdx));

    const prevIdx = state.currentIndex;
    const isInitial = opts && opts.initial;
    if (!isInitial && nextIdx === prevIdx) return;

    const dir = nextIdx >= prevIdx ? 'dir-next' : 'dir-prev';

    // Notify previous lab on leave
    if (!isInitial && state.mountedLabs.has(prevIdx)) {
      const prevLab = state.mountedLabs.get(prevIdx);
      if (prevLab && typeof prevLab.onSlideLeave === 'function') {
        prevLab.onSlideLeave();
      }
    }

    state.currentIndex = nextIdx;

    state.slideEls.forEach(function (el, i) {
      el.classList.remove('dir-next', 'dir-prev', 'is-leaving');
      if (i === nextIdx) {
        el.classList.add('is-active', dir);
        el.setAttribute('aria-hidden', 'false');
        el.scrollTop = 0;
      } else {
        if (!isInitial && i === prevIdx) {
          el.classList.add('is-leaving', dir);
        }
        el.classList.remove('is-active');
        el.setAttribute('aria-hidden', 'true');
      }
    });

    // Mount active lab + preload neighbor labs
    mountLabForSlide(nextIdx);
    if (nextIdx + 1 < total) mountLabForSlide(nextIdx + 1);
    if (nextIdx - 1 >= 0) mountLabForSlide(nextIdx - 1);

    const activeLab = state.mountedLabs.get(nextIdx);
    if (activeLab) {
      if (typeof activeLab.onResize === 'function') activeLab.onResize();
      if (typeof activeLab.onSlideEnter === 'function') activeLab.onSlideEnter();
    }

    if (state.autoplay) {
      state.autoplayStartMs = performance.now();
    }

    // Update URL hash cleanly without scrolling
    const desiredHash = '#' + (nextIdx + 1);
    if (window.location.hash !== desiredHash) {
      try {
        history.replaceState(null, '', desiredHash);
      } catch (e) {
        window.location.hash = desiredHash;
      }
    }

    updateChrome();
    ensureRafLoop();
  };

  function buildProgressTicks() {
    const deck = getDeck();
    const wrap = document.getElementById('progress-ticks');
    const track = document.getElementById('progress-track');
    const tooltip = document.getElementById('progress-tooltip');
    if (!wrap || !track) return;

    wrap.innerHTML = '';
    const total = deck.slides.length;
    deck.slides.forEach(function (slide, i) {
      const tick = document.createElement('button');
      tick.type = 'button';
      tick.className = 'progress-tick part-' + slide.partId;
      tick.style.left = (total > 1 ? (i / (total - 1)) * 100 : 0) + '%';
      tick.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + (slide.plainTitle || slide.title));
      tick.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (state.autoplay) setAutoplay(false);
        ME340.goToSlide(i);
      });
      tick.addEventListener('mouseenter', function () {
        if (!tooltip) return;
        tooltip.textContent = pad2(i + 1) + ' · ' + (slide.plainTitle || slide.title.replace(/<[^>]+>/g, ''));
        tooltip.style.left = tick.style.left;
        tooltip.classList.add('is-visible');
      });
      tick.addEventListener('mouseleave', function () {
        if (tooltip) tooltip.classList.remove('is-visible');
      });
      wrap.appendChild(tick);
    });

    track.addEventListener('click', function (ev) {
      const rect = track.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const targetIdx = Math.round(frac * (total - 1));
      if (state.autoplay) setAutoplay(false);
      ME340.goToSlide(targetIdx);
    });
  }

  function buildOverviewGrid() {
    const deck = getDeck();
    const grid = document.getElementById('overview-grid');
    if (!grid) return;
    grid.innerHTML = '';

    deck.slides.forEach(function (slide, i) {
      const partInfo = (deck.parts && deck.parts[slide.partId]) || { shortLabel: 'ME 340' };
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'overview-card part-' + slide.partId;
      card.innerHTML =
        '<div class="overview-card-head">' +
          '<span class="overview-num">' + pad2(i + 1) + '</span>' +
          '<span class="overview-part">' + escapeHtml(partInfo.shortLabel || partInfo.label) + '</span>' +
          (slide.labId ? '<span class="overview-lab-dot" title="Interactive physics lab">LAB</span>' : '') +
        '</div>' +
        '<div class="overview-card-title">' + escapeHtml(slide.plainTitle || slide.title.replace(/<[^>]+>/g, '')) + '</div>' +
        (slide.lectureBadges && slide.lectureBadges.length
          ? '<div class="overview-card-lec">' + escapeHtml(slide.lectureBadges[0]) + '</div>'
          : '<div class="overview-card-lec">' + escapeHtml(slide.overviewHint || 'Course Map') + '</div>');

      card.addEventListener('click', function (e) {
        toggleOverview(false, { viaPointer: isPointerClick(e) });
        ME340.goToSlide(i);
      });
      grid.appendChild(card);
    });
  }

  function renderSymbolDrawerList(highlightIndex) {
    const deck = getDeck();
    const listEl = document.getElementById('symbol-list');
    const searchEl = document.getElementById('symbol-search');
    if (!listEl) return;

    const query = (searchEl && searchEl.value || '').trim().toLowerCase();
    const currentSlide = deck.slides[state.currentIndex];
    const items = state.drawerMode === 'slide'
      ? (currentSlide && currentSlide.symbols ? currentSlide.symbols : [])
      : (deck.allSymbols || []);

    const filtered = items.filter(function (item) {
      if (!query) return true;
      const hay = (item.sym + ' ' + item.desc + ' ' + (item.short || '') + ' ' + (item.part || '')).toLowerCase();
      return hay.indexOf(query) !== -1;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="symbol-empty">No matching symbols on this view. Switch to "All Symbols" to browse the full notation guide.</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (item, idx) {
      const hl = highlightIndex === idx ? ' is-highlighted' : '';
      return (
        '<div class="symbol-item' + hl + '">' +
          '<div class="symbol-math-badge">' + item.sym + '</div>' +
          '<div class="symbol-desc-col">' +
            '<div class="symbol-desc-text">' + item.desc + '</div>' +
            (item.part ? '<div class="symbol-part-meta">' + escapeHtml(item.part) + '</div>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('');

    ME340.renderMath(listEl);
  }

  function openSymbolDrawer(mode, highlightIdx) {
    state.drawerOpen = true;
    if (mode) state.drawerMode = mode;

    const drawer = document.getElementById('symbol-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const btn = document.getElementById('btn-symbols');
    const tabSlide = document.getElementById('tab-sym-slide');
    const tabAll = document.getElementById('tab-sym-all');

    if (tabSlide) {
      tabSlide.classList.toggle('is-active', state.drawerMode === 'slide');
      tabSlide.setAttribute('aria-selected', state.drawerMode === 'slide' ? 'true' : 'false');
    }
    if (tabAll) {
      tabAll.classList.toggle('is-active', state.drawerMode === 'all');
      tabAll.setAttribute('aria-selected', state.drawerMode === 'all' ? 'true' : 'false');
    }
    if (drawer) {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
    }
    if (backdrop) {
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
    }
    if (btn) btn.setAttribute('aria-expanded', 'true');

    renderSymbolDrawerList(highlightIdx);
  }

  function isPointerClick(ev) {
    return Boolean((ev && ev.detail > 0) || state.lastInputWasPointer);
  }

  function hasHorizontalScrollAncestor(el, stopEl) {
    let node = el;
    while (node && node !== stopEl && node !== document.body) {
      if (node.scrollWidth > node.clientWidth + 2) {
        const style = window.getComputedStyle(node);
        const ox = style && style.overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function closeSymbolDrawer(opts) {
    state.drawerOpen = false;
    const drawer = document.getElementById('symbol-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const btn = document.getElementById('btn-symbols');
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (opts && opts.viaPointer) {
      if (btn && document.activeElement === btn) btn.blur();
      if (drawer && drawer.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }
  }

  function toggleOverview(force, opts) {
    const next = typeof force === 'boolean' ? force : !state.overviewOpen;
    state.overviewOpen = next;
    const modal = document.getElementById('overview-modal');
    const btn = document.getElementById('btn-overview');
    if (modal) {
      modal.classList.toggle('is-open', next);
      modal.setAttribute('aria-hidden', next ? 'false' : 'true');
    }
    if (btn) btn.setAttribute('aria-expanded', next ? 'true' : 'false');
    if (next && state.autoplay) setAutoplay(false);
    if (!next && opts && opts.viaPointer) {
      if (btn && document.activeElement === btn) btn.blur();
      if (modal && modal.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }
  }

  function toggleHelp(force, opts) {
    const next = typeof force === 'boolean' ? force : !state.helpOpen;
    state.helpOpen = next;
    const modal = document.getElementById('help-modal');
    const btn = document.getElementById('btn-help');
    if (modal) {
      modal.classList.toggle('is-open', next);
      modal.setAttribute('aria-hidden', next ? 'false' : 'true');
    }
    if (!next && opts && opts.viaPointer) {
      if (btn && document.activeElement === btn) btn.blur();
      if (modal && modal.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }
  }

  function applyTheme(theme) {
    state.theme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
      localStorage.setItem('me340_theme', state.theme);
    } catch (e) {}

    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon) icon.textContent = state.theme === 'dark' ? '☀' : '☾';
    if (label) label.textContent = state.theme === 'dark' ? 'Paper' : 'Studio';

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', state.theme === 'light' ? '#F6F4EE' : '#141413');
    }

    const palette = ME340.getThemePalette();
    state.mountedLabs.forEach(function (lab) {
      if (lab && typeof lab.onThemeChange === 'function') {
        lab.onThemeChange(palette);
      }
    });
  }

  function setAutoplay(enabled) {
    state.autoplay = Boolean(enabled);
    const btn = document.getElementById('btn-autoplay');
    const arc = document.getElementById('autoplay-arc');
    if (btn) {
      btn.classList.toggle('is-active', state.autoplay);
      btn.setAttribute('aria-pressed', state.autoplay ? 'true' : 'false');
    }
    if (state.autoplay) {
      state.autoplayStartMs = performance.now();
      ensureRafLoop();
    } else if (arc) {
      arc.style.strokeDashoffset = '50.265';
    }
  }

  function tickAutoplay(now) {
    const deck = getDeck();
    const elapsed = now - state.autoplayStartMs;
    const frac = Math.min(1, elapsed / state.autoplayDurationMs);
    const arc = document.getElementById('autoplay-arc');
    if (arc) {
      arc.style.strokeDashoffset = String(50.265 * (1 - frac));
    }
    if (elapsed >= state.autoplayDurationMs) {
      if (state.currentIndex < deck.slides.length - 1) {
        ME340.goToSlide(state.currentIndex + 1);
      } else {
        setAutoplay(false);
      }
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const root = document.documentElement;
      if (root.requestFullscreen) {
        root.requestFullscreen().catch(function () {});
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  function wireControls() {
    const bind = function (id, fn) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    const blurIfPointer = function (e) {
      if (isPointerClick(e) && e && e.currentTarget && document.activeElement === e.currentTarget) {
        e.currentTarget.blur();
      }
    };

    document.addEventListener('pointerdown', function () {
      state.lastInputWasPointer = true;
    }, { capture: true, passive: true });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key.indexOf('Arrow') === 0) {
        state.lastInputWasPointer = false;
      }
    }, true);

    bind('btn-home', function (e) {
      if (state.autoplay) setAutoplay(false);
      ME340.goToSlide(0);
      blurIfPointer(e);
    });
    bind('btn-prev', function (e) {
      if (state.autoplay) setAutoplay(false);
      ME340.goToSlide(state.currentIndex - 1);
      blurIfPointer(e);
    });
    bind('btn-next', function (e) {
      if (state.autoplay) setAutoplay(false);
      ME340.goToSlide(state.currentIndex + 1);
      blurIfPointer(e);
    });
    bind('btn-symbols', function (e) {
      const viaPointer = isPointerClick(e);
      if (state.drawerOpen) {
        closeSymbolDrawer({ viaPointer: viaPointer });
      } else {
        openSymbolDrawer('slide');
        if (viaPointer) blurIfPointer(e);
      }
    });
    bind('btn-close-drawer', function (e) {
      closeSymbolDrawer({ viaPointer: isPointerClick(e) });
    });
    bind('drawer-backdrop', function () {
      closeSymbolDrawer({ viaPointer: true });
    });
    bind('tab-sym-slide', function (e) {
      state.drawerMode = 'slide';
      openSymbolDrawer('slide');
      blurIfPointer(e);
    });
    bind('tab-sym-all', function (e) {
      state.drawerMode = 'all';
      openSymbolDrawer('all');
      blurIfPointer(e);
    });

    const searchEl = document.getElementById('symbol-search');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        renderSymbolDrawerList();
      });
    }

    bind('btn-overview', function (e) {
      const viaPointer = isPointerClick(e);
      toggleOverview(undefined, { viaPointer: viaPointer });
      if (viaPointer) blurIfPointer(e);
    });
    bind('btn-close-overview', function (e) {
      toggleOverview(false, { viaPointer: isPointerClick(e) });
    });
    const overviewModal = document.getElementById('overview-modal');
    if (overviewModal) {
      overviewModal.addEventListener('click', function (e) {
        if (e.target === overviewModal) toggleOverview(false, { viaPointer: true });
      });
    }

    bind('btn-help', function (e) {
      const viaPointer = isPointerClick(e);
      toggleHelp(undefined, { viaPointer: viaPointer });
      if (viaPointer) blurIfPointer(e);
    });
    bind('btn-close-help', function (e) {
      toggleHelp(false, { viaPointer: isPointerClick(e) });
    });
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
      helpModal.addEventListener('click', function (e) {
        if (e.target === helpModal) toggleHelp(false, { viaPointer: true });
      });
    }

    bind('btn-theme', function (e) {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      blurIfPointer(e);
    });
    bind('btn-autoplay', function (e) {
      setAutoplay(!state.autoplay);
      blurIfPointer(e);
    });
    bind('btn-fullscreen', function (e) {
      toggleFullscreen();
      blurIfPointer(e);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
      const target = e.target;
      const tag = (target && target.tagName) || '';
      const inputType = tag === 'INPUT' ? String(target.type || 'text').toLowerCase() : '';
      const isRange = tag === 'INPUT' && inputType === 'range';
      const isTyping = tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && !isRange && inputType !== 'button' && inputType !== 'checkbox' && inputType !== 'radio');

      if (e.key === 'Escape') {
        if (state.helpOpen) toggleHelp(false);
        else if (state.overviewOpen) toggleOverview(false);
        else if (state.drawerOpen) closeSymbolDrawer();
        return;
      }

      if (isTyping) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isRange && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Home' || e.key === 'End')) {
        return;
      }

      if (state.overviewOpen || state.helpOpen) {
        if (e.key === 'g' || e.key === 'G' || e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          toggleOverview(false);
        } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          toggleHelp(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          if (state.autoplay) setAutoplay(false);
          ME340.goToSlide(state.currentIndex + 1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          if (state.autoplay) setAutoplay(false);
          ME340.goToSlide(state.currentIndex - 1);
          break;
        case 'Home':
          e.preventDefault();
          if (state.autoplay) setAutoplay(false);
          ME340.goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          if (state.autoplay) setAutoplay(false);
          ME340.goToSlide(getDeck().slides.length - 1);
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          setAutoplay(!state.autoplay);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'g':
        case 'G':
        case 'o':
        case 'O':
          e.preventDefault();
          toggleOverview();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          if (state.drawerOpen) closeSymbolDrawer();
          else openSymbolDrawer('slide');
          break;
        case 't':
        case 'T':
          e.preventDefault();
          applyTheme(state.theme === 'dark' ? 'light' : 'dark');
          break;
        case '?':
        case 'h':
        case 'H':
          e.preventDefault();
          toggleHelp();
          break;
      }
    });

    // Touch swipe (ignored inside interactive lab canvases, scrollable math, or form inputs)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchIgnored = false;
    const stage = document.getElementById('stage');
    if (stage) {
      stage.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1 || state.drawerOpen || state.overviewOpen || state.helpOpen) {
          touchIgnored = true;
          return;
        }
        const rawTarget = e.target;
        const target = rawTarget && rawTarget.nodeType === 1 ? rawTarget : (rawTarget && rawTarget.parentElement);
        touchIgnored = Boolean(
          target && (
            target.closest('.lab-stage, input, select, textarea, .symbol-list, .katex-display, .eq-math, .airy-banner-math, .compare-footnote') ||
            hasHorizontalScrollAncestor(target, stage)
          )
        );
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      stage.addEventListener('touchcancel', function () {
        touchIgnored = true;
      }, { passive: true });

      stage.addEventListener('touchend', function (e) {
        if (touchIgnored || e.changedTouches.length !== 1) return;
        if (state.drawerOpen || state.overviewOpen || state.helpOpen) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.8) {
          if (state.autoplay) setAutoplay(false);
          if (dx < 0) ME340.goToSlide(state.currentIndex + 1);
          else ME340.goToSlide(state.currentIndex - 1);
        }
      }, { passive: true });
    }

    // Hash navigation
    window.addEventListener('hashchange', function () {
      const idx = parseInitialSlide(getDeck().slides);
      if (idx !== state.currentIndex) {
        ME340.goToSlide(idx);
      }
    });

    // ResizeObserver for crisp Canvas scaling (debounced via rAF to avoid loop notifications)
    if (typeof ResizeObserver === 'function') {
      let roRaf = 0;
      state.resizeObserver = new ResizeObserver(function () {
        if (roRaf) cancelAnimationFrame(roRaf);
        roRaf = requestAnimationFrame(function () {
          roRaf = 0;
          const activeLab = state.mountedLabs.get(state.currentIndex);
          if (activeLab && typeof activeLab.onResize === 'function') {
            activeLab.onResize();
          }
        });
      });
    }
    window.addEventListener('resize', function () {
      const activeLab = state.mountedLabs.get(state.currentIndex);
      if (activeLab && typeof activeLab.onResize === 'function') {
        activeLab.onResize();
      }
    });
  }

  ME340.init = function () {
    const deck = getDeck();
    if (!deck.slides || deck.slides.length === 0) {
      console.error('ME340.DECK_DATA is empty or missing.');
      return;
    }

    // Restore persisted theme if set; default is Dark Studio
    let savedTheme = 'dark';
    try {
      const stored = localStorage.getItem('me340_theme');
      if (stored === 'light' || stored === 'dark') savedTheme = stored;
    } catch (e) {}

    renderAllSlides();
    buildProgressTicks();
    buildOverviewGrid();
    wireControls();
    applyTheme(savedTheme);

    const startIdx = parseInitialSlide(deck.slides);
    ME340.goToSlide(startIdx, { initial: true });

    // Re-run KaTeX on window load in case deferred CDN finished slightly later
    window.addEventListener('load', function () {
      const stage = document.getElementById('stage');
      if (stage) ME340.renderMath(stage);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    ME340.init();
  });
})();
