(function () {
  'use strict';

  const ME340 = (window.ME340 = window.ME340 || {});
  if (typeof ME340.registerLab !== 'function') {
    ME340.labs = ME340.labs || {};
    ME340.registerLab = function (id, fn) {
      ME340.labs[id] = fn;
    };
  }

  /* ==========================================================================
   * Shared High-DPI Canvas, Math, DOM, and Drawing Utilities
   * ========================================================================== */

  const FONT_SANS = '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const FONT_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function setFont(ctx, px, mono, weight) {
    const size = Math.max(15, Math.round(px || 15));
    const w = weight || 500;
    ctx.font = w + ' ' + size + 'px ' + (mono ? FONT_MONO : FONT_SANS);
  }

  function withAlpha(color, alpha) {
    const a = clamp(alpha, 0, 1);
    if (!color || typeof color !== 'string') return 'rgba(128,128,128,' + a + ')';
    if (color.charAt(0) === '#') {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      const n = parseInt(hex, 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')';
    }
    const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (m) {
      return 'rgba(' + m[1] + ',' + m[2] + ',' + m[3] + ',' + a.toFixed(3) + ')';
    }
    return color;
  }

  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    let w = Math.floor(rect.width);
    let h = Math.floor(rect.height);
    if ((w < 10 || h < 10) && canvas.parentElement) {
      const pr = canvas.parentElement.getBoundingClientRect();
      w = Math.floor(pr.width);
      h = Math.floor(pr.height);
    }
    if (w < 10 || h < 10) {
      return { ctx: null, w: 0, h: 0, dpr: 1, ready: false };
    }
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ctx: null, w: 0, h: 0, dpr: dpr, ready: false };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h, dpr: dpr, ready: true };
  }

  function fillStageBg(ctx, w, h, pal) {
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, w, h);
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const rad = Math.max(0, Math.min(r, 2, w * 0.5, h * 0.5));
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, lw, headLen) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) return;
    const hl = Math.min(headLen || 10, len * 0.45);
    const ang = Math.atan2(dy, dx);
    const ux = dx / len;
    const uy = dy / len;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw || 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * hl * 0.72, y2 - uy * hl * 0.72);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(ang - 0.42), y2 - hl * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - hl * Math.cos(ang + 0.42), y2 - hl * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function getPointerPos(canvas, ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top
    };
  }

  function createBag() {
    const list = [];
    const loops = [];
    const observers = [];
    return {
      on: function (el, type, fn, opts) {
        if (!el) return;
        el.addEventListener(type, fn, opts);
        list.push({ el: el, type: type, fn: fn, opts: opts });
      },
      loop: function (api, fn) {
        if (api && typeof api.registerAnimationLoop === 'function') {
          const unreg = api.registerAnimationLoop(fn);
          if (typeof unreg === 'function') loops.push(unreg);
        }
      },
      observe: function (el, fn) {
        if (typeof ResizeObserver === 'function' && el) {
          let rafId = 0;
          const ro = new ResizeObserver(function () {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(function () {
              rafId = 0;
              fn();
            });
          });
          ro.observe(el);
          observers.push({
            disconnect: function () {
              if (rafId) cancelAnimationFrame(rafId);
              ro.disconnect();
            }
          });
        }
      },
      clear: function () {
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          item.el.removeEventListener(item.type, item.fn, item.opts);
        }
        list.length = 0;
        for (let j = 0; j < loops.length; j++) {
          loops[j]();
        }
        loops.length = 0;
        for (let k = 0; k < observers.length; k++) {
          observers[k].disconnect();
        }
        observers.length = 0;
      }
    };
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) {
      if (cls && (cls.indexOf('lab-caption') !== -1 || cls.indexOf('lab-pill') !== -1 || cls.indexOf('lab-badge-status') !== -1)) {
        node.innerHTML = formatMathHtml(text);
      } else {
        node.textContent = text;
      }
    }
    return node;
  }

  function formatMathHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/_([A-Za-z0-9α-ωΑ-Ω]+)/g, '<sub>$1</sub>')
      .replace(/\^([A-Za-z0-9+\-]+)/g, '<sup>$1</sup>');
  }

  function createReadoutChip(keyText, valText) {
    const chip = el('div', 'lab-readout-chip');
    const k = el('span', 'lab-readout-key');
    k.innerHTML = formatMathHtml(keyText);
    const v = el('span', 'lab-readout-val', valText);
    chip.appendChild(k);
    chip.appendChild(v);
    return { chip: chip, keyEl: k, valEl: v };
  }

  function createSliderControl(labelText, opts, onInput) {
    const wrap = el('div', 'lab-control');
    const head = el('div', 'lab-control-head');
    const lbl = el('span');
    lbl.innerHTML = formatMathHtml(labelText);
    const val = el('span', 'lab-readout-val', opts.format ? opts.format(opts.value) : String(opts.value));
    head.appendChild(lbl);
    head.appendChild(val);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'lab-slider';
    input.min = String(opts.min);
    input.max = String(opts.max);
    input.step = String(opts.step);
    input.value = String(opts.value);
    input.setAttribute('aria-label', labelText);

    wrap.appendChild(head);
    wrap.appendChild(input);

    const handler = function () {
      const num = parseFloat(input.value);
      val.textContent = opts.format ? opts.format(num) : String(num);
      if (onInput) onInput(num);
    };

    return {
      wrap: wrap,
      input: input,
      valEl: val,
      handler: handler,
      setValue: function (num) {
        input.value = String(num);
        val.textContent = opts.format ? opts.format(num) : String(num);
      }
    };
  }

  function setStatusBadge(badgeEl, text, level) {
    badgeEl.innerHTML = formatMathHtml(text);
    badgeEl.classList.remove('is-safe', 'is-warn', 'is-danger');
    if (level === 'safe') badgeEl.classList.add('is-safe');
    else if (level === 'warn') badgeEl.classList.add('is-warn');
    else if (level === 'danger') badgeEl.classList.add('is-danger');
  }

  /* ==========================================================================
   * LAB 1: course-pipeline (Slide 3: Three-part course structure)
   * ========================================================================== */

  ME340.registerLab('course-pipeline', function (mountEl, api) {
    const bag = createBag();
    const parts = [
      {
        idx: 0,
        short: 'Part I · Elasticity',
        title: 'Part I',
        sub: 'Elasticity',
        sym: 'σ, ε, u',
        colorKey: 'cardinal',
        softKey: 'cardinalSoft',
        targetId: 'continuum',
        jumpLabel: 'Jump to Part I →',
        fields: 'σ, ε, u',
        gate: 'Linear elastic (f < 0)',
        methods: 'Airy φ · Green G'
      },
      {
        idx: 1,
        short: 'Part II · Plasticity',
        title: 'Part II',
        sub: 'Plasticity',
        sym: 'εᵖ, f = 0',
        colorKey: 'teal',
        softKey: 'tealSoft',
        targetId: 'elas-to-plas',
        jumpLabel: 'Jump to Part II →',
        fields: 'εᵖ, J₂, α',
        gate: 'Yield gate f > 0',
        methods: 'Mises/Tresca · Return Map'
      },
      {
        idx: 2,
        short: 'Part III · Fracture',
        title: 'Part III',
        sub: 'Fracture',
        sym: 'KI, J',
        colorKey: 'amber',
        softKey: 'amberSoft',
        targetId: 'fracture-lefm',
        jumpLabel: 'Jump to Part III →',
        fields: 'KI, G, J',
        gate: 'Toughness KI = KIc',
        methods: 'LEFM · J-Integral'
      }
    ];

    let activeIdx = 0;
    let hoverIdx = -1;
    let phase = 0;
    let nodeRects = [];

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const pillBtns = parts.map(function (p, i) {
      const b = el('button', 'lab-pill' + (i === 0 ? ' is-active' : ''), p.short);
      b.type = 'button';
      pillGroup.appendChild(b);
      return b;
    });
    const jumpBtn = el('button', 'lab-pill is-active', parts[0].jumpLabel);
    jumpBtn.type = 'button';
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(jumpBtn);

    const stage = el('div', 'lab-stage');
    const canvas = el('canvas', 'lab-canvas');
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'pointer';
    stage.appendChild(canvas);

    const readouts = el('div', 'lab-readout-row');
    const rFields = createReadoutChip('State Fields', parts[0].fields);
    const rGate = createReadoutChip('Regime Gate', parts[0].gate);
    const rMeth = createReadoutChip('Core Tools', parts[0].methods);
    readouts.appendChild(rFields.chip);
    readouts.appendChild(rGate.chip);
    readouts.appendChild(rMeth.chip);

    const caption = el('p', 'lab-caption', 'Click any pillar on the canvas to inspect its mechanics signature and jump to that part.');

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(readouts);
    shell.appendChild(caption);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function selectPart(idx) {
      activeIdx = clamp(idx, 0, 2);
      pillBtns.forEach(function (b, i) {
        b.classList.toggle('is-active', i === activeIdx);
      });
      const p = parts[activeIdx];
      jumpBtn.textContent = p.jumpLabel;
      rFields.valEl.textContent = p.fields;
      rGate.valEl.textContent = p.gate;
      rMeth.valEl.textContent = p.methods;
      draw();
    }

    pillBtns.forEach(function (b, i) {
      bag.on(b, 'click', function () {
        selectPart(i);
      });
    });

    bag.on(jumpBtn, 'click', function () {
      api.goToSlide(parts[activeIdx].targetId);
    });

    function hitNode(pt) {
      for (let i = 0; i < nodeRects.length; i++) {
        const r = nodeRects[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
          return i;
        }
      }
      return -1;
    }

    bag.on(canvas, 'pointermove', function (ev) {
      const idx = hitNode(getPointerPos(canvas, ev));
      if (idx !== hoverIdx) {
        hoverIdx = idx;
        canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
      }
    });

    bag.on(canvas, 'pointerleave', function () {
      hoverIdx = -1;
    });

    bag.on(canvas, 'click', function (ev) {
      const idx = hitNode(getPointerPos(canvas, ev));
      if (idx >= 0) selectPart(idx);
    });

    function drawElasticMini(ctx, x, y, w, h, color, t, boost) {
      const cols = 6;
      const rows = 3;
      const amp = (boost ? 6.5 : 3.5);
      const padX = 10;
      const padY = 8;
      const gw = w - padX * 2;
      const gh = h - padY * 2;
      ctx.save();
      ctx.strokeStyle = withAlpha(color, boost ? 0.92 : 0.62);
      ctx.lineWidth = boost ? 1.8 : 1.3;

      function pt(c, r) {
        const u = c / (cols - 1);
        const v = r / (rows - 1);
        const wave = Math.sin(u * Math.PI * 2 - t * 2.6) * amp;
        const shear = (0.5 - v) * Math.cos(t * 1.9) * amp * 0.7;
        return {
          x: x + padX + u * gw + shear,
          y: y + padY + v * gh + wave * 0.65
        };
      }

      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const p = pt(c, r);
          if (c === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const p = pt(c, r);
          if (r === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawPlasticMini(ctx, x, y, w, h, color, pal, t, boost) {
      const cx = x + w * 0.5;
      const cy = y + h * 0.52;
      const rx = Math.min(w * 0.36, h * 0.44);
      const ry = rx * 0.62;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-Math.PI / 5);

      ctx.fillStyle = withAlpha(color, boost ? 0.22 : 0.12);
      ctx.strokeStyle = withAlpha(color, boost ? 0.95 : 0.72);
      ctx.lineWidth = boost ? 2.0 : 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating stress vector touching yield boundary
      const ang = t * 1.2;
      const vx = rx * Math.cos(ang);
      const vy = ry * Math.sin(ang);
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(vx, vy);
      ctx.stroke();

      // Outward normal tick
      const nx = Math.cos(ang) / rx;
      const ny = Math.sin(ang) / ry;
      const nlen = Math.hypot(nx, ny) || 1;
      const scale = boost ? 12 : 8;
      ctx.strokeStyle = pal.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx + (nx / nlen) * scale, vy + (ny / nlen) * scale);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(vx, vy, boost ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawFractureMini(ctx, x, y, w, h, color, pal, t, boost) {
      const cx = x + w * 0.5;
      const cy = y + h * 0.52;
      const halfA = w * 0.16;
      const pulse = 1 + 0.14 * Math.sin(t * 3.4);
      const scale = Math.min(w, h) * (boost ? 0.24 : 0.19) * pulse;

      ctx.save();
      // Near-tip butterfly lobes at both tips
      [-1, 1].forEach(function (side) {
        const tx = cx + side * halfA;
        [1.0, 0.62].forEach(function (lvl, idx) {
          ctx.beginPath();
          for (let k = 0; k <= 48; k++) {
            const th = -Math.PI + (k / 48) * Math.PI * 2;
            const c = Math.cos(th * 0.5);
            const f = c * (1 + Math.sin(th * 0.5) * Math.sin(1.5 * th));
            const rr = scale * lvl * f * f;
            const px = tx + side * rr * Math.cos(th);
            const py = cy + rr * Math.sin(th);
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = withAlpha(color, idx === 0 ? (boost ? 0.26 : 0.15) : (boost ? 0.42 : 0.24));
          ctx.fill();
          ctx.strokeStyle = withAlpha(color, boost ? 0.85 : 0.55);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });
      });

      // Center crack slit
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx - halfA, cy);
      ctx.lineTo(cx + halfA, cy);
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      fillStageBg(ctx, w, h, pal);

      // Subtle architectural grid
      ctx.save();
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      for (let gx = 32; gx < w; gx += 36) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 32; gy < h; gy += 36) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      ctx.restore();

      const padX = Math.max(14, w * 0.03);
      const gap = w >= 680 ? Math.max(114, Math.min(132, w * 0.13)) : Math.max(48, Math.min(82, w * 0.11));
      const cardW = Math.max(100, (w - padX * 2 - gap * 2) / 3);
      const topY = Math.max(10, h * 0.05);
      const appH = Math.max(36, Math.min(44, h * 0.18));
      const appY = h - appH - 8;
      const cardH = Math.max(96, Math.min(appY - topY - 22, 185));
      const midY = topY + cardH * 0.5;
      const appX = padX;
      const appW = w - padX * 2;

      nodeRects = parts.map(function (_, i) {
        return {
          x: padX + i * (cardW + gap),
          y: topY,
          w: cardW,
          h: cardH
        };
      });

      // Draw conduits + animated stress/energy flow particles between nodes
      const gateLabels = ['f > 0', 'KI = KIc'];
      const pendingGates = [];
      for (let i = 0; i < 2; i++) {
        const leftR = nodeRects[i];
        const rightR = nodeRects[i + 1];
        const x1 = leftR.x + leftR.w;
        const x2 = rightR.x;
        const cLeft = pal[parts[i].colorKey];
        const cRight = pal[parts[i + 1].colorKey];

        // Track line
        const lineGrad = ctx.createLinearGradient(x1, midY, x2, midY);
        lineGrad.addColorStop(0, cLeft);
        lineGrad.addColorStop(1, cRight);
        ctx.save();
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1 + 2, midY);
        ctx.lineTo(x2 - 8, midY);
        ctx.stroke();
        drawArrow(ctx, x2 - 14, midY, x2 - 2, midY, cRight, 2.5, 9);

        // Moving particles across conduit
        for (let k = 0; k < 3; k++) {
          const u = (phase * 0.45 + k / 3) % 1;
          const px = lerp(x1 + 4, x2 - 10, u);
          ctx.fillStyle = u < 0.5 ? cLeft : cRight;
          ctx.beginPath();
          ctx.arc(px, midY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        pendingGates.push({ cx: (x1 + x2) * 0.5, cy: midY - 26, text: gateLabels[i] });
      }

      // Vertical feeder conduits down into Applications foundation bar
      for (let i = 0; i < 3; i++) {
        const r = nodeRects[i];
        const cx = r.x + r.w * 0.5;
        const y1 = r.y + r.h;
        const y2 = appY;
        const col = pal[parts[i].colorKey];
        const isLit = i === activeIdx || i === hoverIdx;

        ctx.save();
        ctx.strokeStyle = withAlpha(col, isLit ? 0.85 : 0.42);
        ctx.lineWidth = isLit ? 2.4 : 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, y1 + 2);
        ctx.lineTo(cx, y2 - 4);
        ctx.stroke();
        ctx.setLineDash([]);

        // Downward flowing particle
        const u = (phase * 0.55 + i * 0.31) % 1;
        const py = lerp(y1 + 5, y2 - 6, u);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(cx, py, isLit ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw 3 pillar cards
      for (let i = 0; i < 3; i++) {
        const p = parts[i];
        const r = nodeRects[i];
        const col = pal[p.colorKey];
        const soft = pal[p.softKey];
        const isActive = i === activeIdx;
        const isHover = i === hoverIdx;
        const boost = isActive || isHover;

        ctx.save();
        roundRectPath(ctx, r.x, r.y, r.w, r.h, 12);
        ctx.fillStyle = isActive ? soft : pal.surface2;
        ctx.fill();
        ctx.strokeStyle = boost ? col : pal.border;
        ctx.lineWidth = isActive ? 2.5 : (isHover ? 1.8 : 1.2);
        ctx.stroke();

        // Header text (>= 15px)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        setFont(ctx, cardW < 165 ? 15 : 16, false, 600);
        ctx.fillStyle = boost ? col : pal.text;
        const headText = cardW < 165 ? (p.title.replace('Part ', '') + ' · ' + p.sub) : (p.title + ' · ' + p.sub);
        ctx.fillText(headText, r.x + r.w * 0.5, r.y + 10);

        setFont(ctx, 15, true, 500);
        ctx.fillStyle = pal.textMuted;
        ctx.fillText(p.sym, r.x + r.w * 0.5, r.y + 32);

        // Mini physical signature area
        const miniX = r.x + 8;
        const miniY = r.y + 54;
        const miniW = r.w - 16;
        const miniH = Math.max(40, r.h - 62);
        if (i === 0) {
          drawElasticMini(ctx, miniX, miniY, miniW, miniH, col, phase, boost);
        } else if (i === 1) {
          drawPlasticMini(ctx, miniX, miniY, miniW, miniH, col, pal, phase, boost);
        } else {
          drawFractureMini(ctx, miniX, miniY, miniW, miniH, col, pal, phase, boost);
        }
        ctx.restore();
      }

      // Render threshold gate pills above cards so labels are never clipped
      for (let g = 0; g < pendingGates.length; g++) {
        const gt = pendingGates[g];
        ctx.save();
        setFont(ctx, 15, true, 500);
        const tw = ctx.measureText(gt.text).width + 18;
        roundRectPath(ctx, gt.cx - tw * 0.5, gt.cy - 14, tw, 28, 7);
        ctx.fillStyle = pal.surface2;
        ctx.fill();
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gt.text, gt.cx, gt.cy + 0.5);
        ctx.restore();
      }

      // Foundation Applications bar
      ctx.save();
      roundRectPath(ctx, appX, appY, appW, appH, 10);
      ctx.fillStyle = pal.surface2;
      ctx.fill();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      setFont(ctx, 15, false, 500);
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Applications: Contact · Vessels · Fatigue', appX + appW * 0.5, appY + appH * 0.5);
      ctx.restore();
    }

    bag.loop(api, function (dt) {
      phase += dt;
      draw();
    });

    bag.observe(stage, draw);

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () {
        bag.clear();
      }
    };
  });

  /* ==========================================================================
   * LAB 2: dislocation-glide (Slide 15: Dislocations and defect fields)
   * ========================================================================== */

  ME340.registerLab('dislocation-glide', function (mountEl, api) {
    const bag = createBag();
    const NX = 13;
    const NY = 8;
    const Y_SLIP = 3.5;
    const NU = 0.33;
    const B_NM = 0.256; // Copper FCC Burgers vector magnitude (nm)
    const TAU_PEIERLS = 18; // MPa lattice friction threshold
    const L_SPAN = NX - 1; // 12 lattice spacings

    let xc = 5.4; // core position in lattice units b
    let targetXc = null;
    let tau = 65; // MPa
    let playing = false;
    let showCircuit = true;
    let dragging = false;
    let animT = 0;

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const btnPlay = el('button', 'lab-pill', '▶ Play Glide');
    const btnStep = el('button', 'lab-pill', 'Step +b');
    const btnCircuit = el('button', 'lab-pill is-active', 'Burgers Circuit');
    const btnReset = el('button', 'lab-pill', 'Reset');
    [btnPlay, btnStep, btnCircuit, btnReset].forEach(function (b) {
      b.type = 'button';
      pillGroup.appendChild(b);
    });
    const statusBadge = el('span', 'lab-badge-status is-safe', 'Core Inside Lattice');
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(statusBadge);

    const stage = el('div', 'lab-stage');
    const canvas = el('canvas', 'lab-canvas');
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    stage.appendChild(canvas);

    const controls = el('div', 'lab-controls-grid');
    const tauCtrl = createSliderControl(
      'Remote Shear Stress τ∞',
      {
        min: -120,
        max: 160,
        step: 5,
        value: tau,
        format: function (v) {
          return (v > 0 ? '+' : '') + Math.round(v) + ' MPa';
        }
      },
      function (v) {
        tau = v;
        updateReadouts();
        draw();
      }
    );
    controls.appendChild(tauCtrl.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rPos = createReadoutChip('Core x_c / L', '0.45');
    const rBurgers = createReadoutChip('Burgers |b|', B_NM.toFixed(3) + ' nm');
    const rPK = createReadoutChip('PK Force f_PK', '16.6 mN/m');
    const rGamma = createReadoutChip('Plastic Shear γᵖ', '5.6%');
    readouts.appendChild(rPos.chip);
    readouts.appendChild(rBurgers.chip);
    readouts.appendChild(rPK.chip);
    readouts.appendChild(rGamma.chip);

    const caption = el('p', 'lab-caption', 'Apply shear τ∞ and press Play Glide, or drag the ⊥ core across the slip plane to form a permanent step b.');

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controls);
    shell.appendChild(readouts);
    shell.appendChild(caption);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    bag.on(tauCtrl.input, 'input', tauCtrl.handler);

    bag.on(btnPlay, 'click', function () {
      if (xc >= L_SPAN + 1.0 && tau >= 0) {
        xc = 1.2;
      } else if (xc <= -0.8 && tau < 0) {
        xc = L_SPAN - 1.2;
      }
      targetXc = null;
      playing = !playing;
      btnPlay.textContent = playing ? '❚❚ Pause' : '▶ Play Glide';
      btnPlay.classList.toggle('is-active', playing);
    });

    bag.on(btnStep, 'click', function () {
      playing = false;
      btnPlay.textContent = '▶ Play Glide';
      btnPlay.classList.remove('is-active');
      if (xc >= L_SPAN + 1.1) {
        xc = 1.2;
        targetXc = 2.2;
      } else {
        targetXc = clamp(Math.round(xc) + 1.0, 0.5, L_SPAN + 1.5);
      }
    });

    bag.on(btnCircuit, 'click', function () {
      showCircuit = !showCircuit;
      btnCircuit.classList.toggle('is-active', showCircuit);
      draw();
    });

    bag.on(btnReset, 'click', function () {
      playing = false;
      targetXc = null;
      btnPlay.textContent = '▶ Play Glide';
      btnPlay.classList.remove('is-active');
      xc = 5.4;
      tau = 65;
      tauCtrl.setValue(tau);
      updateReadouts();
      draw();
    });

    // Lattice mapping helper stored per frame for pointer dragging
    let geom = { ox: 60, oy: 40, sp: 32 };

    function latticePos(i, j, coreX) {
      const dx = i - coreX;
      const dy = j - Y_SLIP;
      const r0 = 0.55;
      const r2 = dx * dx + dy * dy + r0 * r0;
      const theta = Math.atan2(dy, dx);
      const ux = (1 / (2 * Math.PI)) * (theta + (dx * dy) / (2 * (1 - NU) * r2));
      const uy = -(1 / (2 * Math.PI)) * (
        ((1 - 2 * NU) / (4 * (1 - NU))) * Math.log(r2 / 25) +
        (dx * dx - dy * dy) / (4 * (1 - NU) * r2)
      ) * 0.28;
      // Add subtle elastic homogeneous shear tilt from applied tau
      const shearTilt = (tau / 160) * 0.14 * (dy / 3.5);
      return {
        lx: i + ux + shearTilt,
        ly: j + uy
      };
    }

    function toCanvas(lx, ly) {
      return {
        x: geom.ox + lx * geom.sp,
        y: geom.oy + (NY - 1 - ly) * geom.sp
      };
    }

    function updateReadouts() {
      const frac = clamp(xc / L_SPAN, 0, 1);
      const exited = xc >= L_SPAN + 0.8;
      const enteredLeft = xc <= -0.4;
      rPos.valEl.textContent = exited ? 'Exited (1.00)' : (enteredLeft ? '0.00' : frac.toFixed(2));
      // f_PK = tau * b: MPa * nm = (1e6 N/m^2)*(1e-9 m) = 1e-3 N/m = mN/m
      const fpk = tau * B_NM;
      rPK.valEl.textContent = (fpk >= 0 ? '+' : '') + fpk.toFixed(1) + ' mN/m';
      // Orowan plastic shear gamma^p = (b / H) * (x_c / L), with H = NY * b
      const gammaP = (1 / NY) * frac * 100;
      rGamma.valEl.textContent = gammaP.toFixed(1) + '%';

      if (exited) {
        setStatusBadge(statusBadge, 'Slip Step Formed (+b)', 'warn');
      } else if (Math.abs(tau) > TAU_PEIERLS) {
        setStatusBadge(statusBadge, playing ? 'Gliding via f_PK' : 'Ready to Glide', 'safe');
      } else {
        setStatusBadge(statusBadge, 'Pinned (|τ∞| < τ_P)', 'warn');
      }
    }

    bag.on(canvas, 'pointerdown', function (ev) {
      dragging = true;
      playing = false;
      targetXc = null;
      btnPlay.textContent = '▶ Play Glide';
      btnPlay.classList.remove('is-active');
      canvas.style.cursor = 'grabbing';
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      const pt = getPointerPos(canvas, ev);
      xc = clamp((pt.x - geom.ox) / geom.sp, -0.5, L_SPAN + 1.5);
      updateReadouts();
      draw();
    });

    bag.on(canvas, 'pointermove', function (ev) {
      if (!dragging) return;
      const pt = getPointerPos(canvas, ev);
      xc = clamp((pt.x - geom.ox) / geom.sp, -0.5, L_SPAN + 1.5);
      updateReadouts();
      draw();
    });

    function endDrag(ev) {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = 'grab';
      try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
    }

    bag.on(canvas, 'pointerup', endDrag);
    bag.on(canvas, 'pointercancel', endDrag);

    function draw() {
      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      fillStageBg(ctx, w, h, pal);

      // Compute clean lattice spacing centered in canvas
      const marginX = 56;
      const marginTop = 44;
      const marginBot = 42;
      const spX = (w - marginX * 2) / (NX + 0.5);
      const spY = (h - marginTop - marginBot) / (NY - 1);
      const sp = Math.max(16, Math.min(spX, spY, 44));
      geom.sp = sp;
      geom.ox = (w - (NX - 1) * sp) * 0.5;
      geom.oy = marginTop + ((h - marginTop - marginBot) - (NY - 1) * sp) * 0.5;

      // Precompute atomic coordinates
      const pts = [];
      for (let j = 0; j < NY; j++) {
        const row = [];
        for (let i = 0; i < NX; i++) {
          const lp = latticePos(i, j, xc);
          const cp = toCanvas(lp.lx, lp.ly);
          row.push({ lx: lp.lx, ly: lp.ly, x: cp.x, y: cp.y });
        }
        pts.push(row);
      }

      // Draw slip plane dashed horizontal line
      const slipY = toCanvas(0, Y_SLIP).y;
      ctx.save();
      ctx.strokeStyle = withAlpha(pal.teal, 0.45);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(geom.ox - sp * 1.1, slipY);
      ctx.lineTo(geom.ox + (NX - 0.1) * sp, slipY);
      ctx.stroke();
      ctx.setLineDash([]);

      setFont(ctx, 15, false, 500);
      const slipLblX = 10;
      const slipLblW = ctx.measureText('Slip plane').width + 10;
      roundRectPath(ctx, slipLblX - 4, slipY - 24, slipLblW, 20, 4);
      ctx.fillStyle = withAlpha(pal.surface, 0.85);
      ctx.fill();
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Slip plane', slipLblX, slipY - 5);
      ctx.restore();

      // Remote shear stress arrows top and bottom
      if (Math.abs(tau) > 2) {
        const dir = tau >= 0 ? 1 : -1;
        const len = 34 + (Math.abs(tau) / 160) * 52;
        const topArrowY = Math.max(18, geom.oy - 22);
        const botArrowY = Math.min(h - 18, geom.oy + (NY - 1) * sp + 22);
        const midX = w * 0.5;
        drawArrow(ctx, midX - dir * len * 0.5, topArrowY, midX + dir * len * 0.5, topArrowY, pal.amber, 2.4, 9);
        drawArrow(ctx, midX + dir * len * 0.5, botArrowY, midX - dir * len * 0.5, botArrowY, pal.amber, 2.4, 9);
        setFont(ctx, 15, true, 500);
        ctx.fillStyle = pal.amber;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('τ∞', midX + len * 0.5 + 10, topArrowY);
      }

      // Identify extra half-plane column while core is inside lattice
      const coreInside = xc >= 0.3 && xc <= L_SPAN - 0.3;
      const extraCol = Math.round(xc);

      // Draw crystal bonds
      ctx.save();
      ctx.lineWidth = 1.5;
      // Horizontal bonds
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX - 1; i++) {
          const p1 = pts[j][i];
          const p2 = pts[j][i + 1];
          ctx.strokeStyle = withAlpha(pal.textMuted, 0.32);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      // Vertical bonds within upper half (j=4..7) and lower half (j=0..3)
      for (let i = 0; i < NX; i++) {
        const isExtra = coreInside && i === extraCol;
        for (let j = 0; j < NY - 1; j++) {
          if (j === 3) continue; // slip plane handled separately
          const p1 = pts[j][i];
          const p2 = pts[j + 1][i];
          ctx.strokeStyle = isExtra && j >= 4 ? pal.cardinal : withAlpha(pal.textMuted, 0.34);
          ctx.lineWidth = isExtra && j >= 4 ? 2.8 : 1.4;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      // Bonds across the slip plane (j=4 to nearest j=3 within 0.45b)
      for (let i = 0; i < NX; i++) {
        const topA = pts[4][i];
        let bestM = -1;
        let bestDist = 0.45;
        for (let m = 0; m < NX; m++) {
          const d = Math.abs(topA.lx - pts[3][m].lx);
          if (d < bestDist) {
            bestDist = d;
            bestM = m;
          }
        }
        if (bestM >= 0) {
          const botA = pts[3][bestM];
          const fade = clamp(1 - bestDist / 0.45, 0.25, 1);
          ctx.strokeStyle = withAlpha(pal.textMuted, 0.34 * fade);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(topA.x, topA.y);
          ctx.lineTo(botA.x, botA.y);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Draw Burgers circuit around core when inside interior
      if (showCircuit && xc >= 2.0 && xc <= 9.6) {
        const iR = clamp(Math.round(xc) + 2, 4, NX - 2);
        const iL = iR - 4;
        const circuitNodes = [
          pts[1][iR],
          pts[2][iR],
          pts[3][iR],
          pts[4][iR],
          pts[5][iR],
          pts[5][iR - 1],
          pts[5][iR - 2],
          pts[5][iR - 3],
          pts[5][iL],
          pts[4][iL],
          pts[3][iL + 1],
          pts[2][iL + 1],
          pts[1][iL + 1],
          pts[1][iL + 2],
          pts[1][iL + 3],
          pts[1][iR],
          pts[1][iR + 1]
        ];
        ctx.save();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.6;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let k = 0; k < circuitNodes.length; k++) {
          const p = circuitNodes[k];
          if (k === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // Highlight Burgers closure vector b from Start (iR, 1) to Finish (iR+1, 1)
        const sPt = pts[1][iR];
        const fPt = pts[1][iR + 1];
        drawArrow(ctx, sPt.x, sPt.y + 8, fPt.x, fPt.y + 8, pal.cardinal, 3.2, 10);
        setFont(ctx, 15, true, 600);
        ctx.fillStyle = pal.cardinal;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('b', (sPt.x + fPt.x) * 0.5, sPt.y + 13);
        ctx.restore();
      }

      // Draw atoms
      const atomR = Math.max(4.5, Math.min(7.5, sp * 0.21));
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const p = pts[j][i];
          const isExtraAtom = coreInside && i === extraCol && j >= 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, isExtraAtom ? atomR * 1.15 : atomR, 0, Math.PI * 2);
          ctx.fillStyle = isExtraAtom
            ? pal.cardinal
            : (j >= 4 ? pal.blue : pal.textMuted);
          ctx.fill();
          ctx.strokeStyle = pal.bg;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Draw dislocation core symbol (⊥) and Peach-Kohler force arrow
      if (coreInside) {
        const coreCanvas = toCanvas(xc, Y_SLIP);
        const glowR = sp * (0.62 + 0.08 * Math.sin(animT * 3.5));
        const glow = ctx.createRadialGradient(coreCanvas.x, coreCanvas.y, 2, coreCanvas.x, coreCanvas.y, glowR);
        glow.addColorStop(0, withAlpha(pal.cardinal, 0.42));
        glow.addColorStop(1, withAlpha(pal.cardinal, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(coreCanvas.x, coreCanvas.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Crisp ⊥ symbol
        ctx.save();
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(coreCanvas.x, coreCanvas.y - 12);
        ctx.lineTo(coreCanvas.x, coreCanvas.y + 4);
        ctx.moveTo(coreCanvas.x - 10, coreCanvas.y + 4);
        ctx.lineTo(coreCanvas.x + 10, coreCanvas.y + 4);
        ctx.stroke();

        // Peach-Kohler force vector
        if (Math.abs(tau) > 4) {
          const fDir = tau >= 0 ? 1 : -1;
          const fLen = 20 + (Math.abs(tau) / 160) * 34;
          drawArrow(ctx, coreCanvas.x + fDir * 12, coreCanvas.y, coreCanvas.x + fDir * (12 + fLen), coreCanvas.y, pal.amber, 2.5, 9);
          setFont(ctx, 15, true, 600);
          ctx.fillStyle = pal.amber;
          ctx.textAlign = fDir > 0 ? 'left' : 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('f_PK', coreCanvas.x + fDir * (16 + fLen * 0.4), coreCanvas.y - 6);
        }
        ctx.restore();
      } else if (xc >= L_SPAN + 0.6) {
        // Dislocation exited right free edge -> highlight permanent plastic slip step b
        const topEdge = pts[4][NX - 1];
        const botEdge = pts[3][NX - 1];
        ctx.save();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(botEdge.x, slipY - 12);
        ctx.lineTo(botEdge.x, slipY + 12);
        ctx.moveTo(topEdge.x, slipY - 12);
        ctx.lineTo(topEdge.x, slipY + 12);
        ctx.stroke();
        drawArrow(ctx, botEdge.x, slipY, topEdge.x, slipY, pal.teal, 2.6, 8);
        setFont(ctx, 15, true, 600);
        ctx.fillStyle = pal.teal;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Slip step = b', Math.min(w - 10, topEdge.x + 12), slipY - 15);
        ctx.restore();
      }
    }

    bag.loop(api, function (dt) {
      animT += dt;
      let changed = false;
      if (targetXc !== null && !dragging) {
        const diff = targetXc - xc;
        if (Math.abs(diff) < 0.02) {
          xc = targetXc;
          targetXc = null;
        } else {
          xc += Math.sign(diff) * Math.min(Math.abs(diff), dt * 2.8);
        }
        changed = true;
      } else if (playing && !dragging) {
        const eff = Math.abs(tau) - TAU_PEIERLS;
        if (eff > 0) {
          const dir = tau >= 0 ? 1 : -1;
          const peierlsMod = 1 + 0.22 * Math.cos(xc * Math.PI * 2);
          const speed = (eff / 100) * 2.6 * peierlsMod;
          xc = clamp(xc + dir * speed * dt, -0.5, L_SPAN + 1.4);
          if ((dir > 0 && xc >= L_SPAN + 1.35) || (dir < 0 && xc <= -0.45)) {
            playing = false;
            btnPlay.textContent = '▶ Play Glide';
            btnPlay.classList.remove('is-active');
          }
          changed = true;
        }
      }
      if (changed) updateReadouts();
      draw();
    });

    bag.observe(stage, draw);
    updateReadouts();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {
        playing = false;
        btnPlay.textContent = '▶ Play Glide';
        btnPlay.classList.remove('is-active');
      },
      destroy: function () {
        bag.clear();
      }
    };
  });

  /* ==========================================================================
   * LAB 3: elas-plas-cycle (Slide 16: From elasticity to plasticity)
   * ========================================================================== */

  ME340.registerLab('elas-plas-cycle', function (mountEl, api) {
    const bag = createBag();
    const E_MOD = 200e3; // 200,000 MPa (200 GPa)
    const SIGMA_Y = 250; // 250 MPa
    const EPS_Y = SIGMA_Y / E_MOD; // 0.00125 (0.125%)

    let hardeningRatio = 0.15; // H / E (0 or 0.15)
    let state = {
      eps: 0,
      epsP: 0,
      alpha: 0,
      sigma: 0,
      regime: 'Elastic',
      peakEps: 0,
      peakSigma: 0,
      path: [{ eps: 0, sigma: 0, regime: 'Elastic' }]
    };

    let demo = { active: false, t: 0 };

    function getKp() {
      // Tangent modulus H = E*Kp / (E + Kp) => Kp = E*H / (E - H)
      if (hardeningRatio <= 1e-6) return 0;
      const H = hardeningRatio * E_MOD;
      return (E_MOD * H) / (E_MOD - H);
    }

    function stepToStrain(newEps) {
      const deps = newEps - state.eps;
      if (Math.abs(deps) < 1e-9) return;
      const Kp = getKp();
      // Sub-step if large jump so path bends sharply at exact yield corner
      const nSub = Math.max(1, Math.min(24, Math.ceil(Math.abs(deps) / 0.00018)));
      const dInc = deps / nSub;

      for (let s = 0; s < nSub; s++) {
        const epsNext = state.eps + dInc;
        const sigTr = E_MOD * (epsNext - state.epsP);
        const radius = SIGMA_Y + Kp * state.alpha;
        const fTr = Math.abs(sigTr) - radius;

        let sigNext = sigTr;
        let reg = 'Elastic';

        if (fTr > 1e-9) {
          const dGamma = fTr / (E_MOD + Kp);
          const sgn = sigTr >= 0 ? 1 : -1;
          state.epsP += sgn * dGamma;
          state.alpha += dGamma;
          sigNext = sigTr - sgn * E_MOD * dGamma;
          reg = 'Yielding';
        } else {
          if (state.alpha > 1e-7 && (sigNext * dInc < 0 || Math.abs(sigNext) < radius * 0.999)) {
            reg = 'Unloading';
          } else {
            reg = 'Elastic';
          }
        }

        state.eps = epsNext;
        state.sigma = sigNext;
        state.regime = reg;

        if (state.eps > state.peakEps) {
          state.peakEps = state.eps;
          state.peakSigma = state.sigma;
        }

        const last = state.path[state.path.length - 1];
        if (!last || Math.abs(last.eps - state.eps) > 0.00004 || Math.abs(last.sigma - state.sigma) > 1.5 || last.regime !== reg) {
          state.path.push({ eps: state.eps, sigma: state.sigma, regime: reg });
          if (state.path.length > 600) state.path.shift();
        }
      }
    }

    function resetState() {
      state = {
        eps: 0,
        epsP: 0,
        alpha: 0,
        sigma: 0,
        regime: 'Elastic',
        peakEps: 0,
        peakSigma: 0,
        path: [{ eps: 0, sigma: 0, regime: 'Elastic' }]
      };
      strainCtrl.setValue(0);
    }

    function runCompletedDemoSnapshot() {
      resetState();
      // Trace 0 -> 0.44% -> unload to sigma = 0
      stepToStrain(0.0044);
      const residual = state.epsP;
      stepToStrain(residual);
      strainCtrl.setValue(Number((state.eps * 100).toFixed(3)));
      updateReadouts();
    }

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');

    const hardGroup = el('div', 'lab-pill-group');
    const btnH0 = el('button', 'lab-pill', 'Perfectly Plastic (H = 0)');
    const btnH15 = el('button', 'lab-pill is-active', 'Linear Hardening (H = 0.15E)');
    btnH0.type = 'button';
    btnH15.type = 'button';
    hardGroup.appendChild(btnH0);
    hardGroup.appendChild(btnH15);

    const actGroup = el('div', 'lab-pill-group');
    const btnDemo = el('button', 'lab-pill is-active', 'Run Load → Yield → Unload');
    const btnReset = el('button', 'lab-pill', 'Reset');
    btnDemo.type = 'button';
    btnReset.type = 'button';
    actGroup.appendChild(btnDemo);
    actGroup.appendChild(btnReset);

    const statusBadge = el('span', 'lab-badge-status is-warn', 'Unloading');

    toolbar.appendChild(hardGroup);
    toolbar.appendChild(actGroup);
    toolbar.appendChild(statusBadge);

    const stage = el('div', 'lab-stage');
    const canvas = el('canvas', 'lab-canvas');
    stage.appendChild(canvas);

    const controls = el('div', 'lab-controls-grid');
    const strainCtrl = createSliderControl(
      'Applied Strain ε (%)',
      {
        min: -0.25,
        max: 0.55,
        step: 0.005,
        value: 0,
        format: function (v) {
          return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
        }
      },
      function (vPct) {
        demo.active = false;
        stepToStrain(vPct / 100);
        updateReadouts();
        draw();
      }
    );
    controls.appendChild(strainCtrl.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rSig = createReadoutChip('σ / σ_Y', '0.00');
    const rEps = createReadoutChip('Total ε', '0.000%');
    const rEpsE = createReadoutChip('Elastic εᵉ', '0.000%');
    const rEpsP = createReadoutChip('Plastic εᵖ', '0.000%');
    readouts.appendChild(rSig.chip);
    readouts.appendChild(rEps.chip);
    readouts.appendChild(rEpsE.chip);
    readouts.appendChild(rEpsP.chip);

    const caption = el('p', 'lab-caption', 'Drag Applied Strain past 0.125% to yield, then pull back to see parallel elastic unloading and permanent εᵖ.');

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controls);
    shell.appendChild(readouts);
    shell.appendChild(caption);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    bag.on(strainCtrl.input, 'input', strainCtrl.handler);

    function switchHardening(ratio) {
      hardeningRatio = ratio;
      btnH0.classList.toggle('is-active', ratio === 0);
      btnH15.classList.toggle('is-active', ratio > 0);
      demo.active = false;
      runCompletedDemoSnapshot();
      draw();
    }

    bag.on(btnH0, 'click', function () { switchHardening(0); });
    bag.on(btnH15, 'click', function () { switchHardening(0.15); });

    bag.on(btnDemo, 'click', function () {
      resetState();
      demo.active = true;
      demo.t = 0;
      updateReadouts();
    });

    bag.on(btnReset, 'click', function () {
      demo.active = false;
      resetState();
      updateReadouts();
      draw();
    });

    function updateReadouts() {
      const epsE = state.eps - state.epsP;
      rSig.valEl.textContent = (state.sigma / SIGMA_Y).toFixed(2);
      rEps.valEl.textContent = (state.eps * 100).toFixed(3) + '%';
      rEpsE.valEl.textContent = (epsE * 100).toFixed(3) + '%';
      rEpsP.valEl.textContent = (state.epsP * 100).toFixed(3) + '%';

      if (state.regime === 'Yielding') {
        setStatusBadge(statusBadge, 'Yielding', 'danger');
      } else if (state.regime === 'Unloading') {
        setStatusBadge(statusBadge, 'Unloading', 'warn');
      } else {
        setStatusBadge(statusBadge, 'Elastic', 'safe');
      }
    }

    function draw() {
      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      fillStageBg(ctx, w, h, pal);

      const padL = 62;
      const padR = 24;
      const padT = 26;
      const padB = 56;
      const pw = Math.max(80, w - padL - padR);
      const ph = Math.max(80, h - padT - padB);

      const epsMin = -0.0028;
      const epsMax = 0.0058;
      const sigMin = -1.45;
      const sigMax = 1.70;

      function xOf(eps) {
        return padL + ((eps - epsMin) / (epsMax - epsMin)) * pw;
      }
      function yOf(sigNorm) {
        return padT + ((sigMax - sigNorm) / (sigMax - sigMin)) * ph;
      }

      const x0 = xOf(0);
      const y0 = yOf(0);

      // Background grid
      ctx.save();
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      [-0.002, -0.001, 0, 0.001, 0.002, 0.003, 0.004, 0.005].forEach(function (eVal) {
        const gx = xOf(eVal);
        ctx.beginPath();
        ctx.moveTo(gx, padT);
        ctx.lineTo(gx, padT + ph);
        ctx.stroke();
      });
      [-1.0, -0.5, 0, 0.5, 1.0, 1.5].forEach(function (sVal) {
        const gy = yOf(sVal);
        ctx.beginPath();
        ctx.moveTo(padL, gy);
        ctx.lineTo(padL + pw, gy);
        ctx.stroke();
      });

      // Yield level reference lines (+sigma_Y and -sigma_Y)
      ctx.strokeStyle = withAlpha(pal.teal, 0.45);
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.4;
      [1, -1].forEach(function (lvl) {
        const yy = yOf(lvl);
        ctx.beginPath();
        ctx.moveTo(padL, yy);
        ctx.lineTo(padL + pw, yy);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Main axes
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + pw, y0);
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, padT + ph);
      ctx.stroke();

      // Axis labels (>= 15px)
      setFont(ctx, 15, false, 500);
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('+σ_Y', padL - 8, yOf(1));
      ctx.fillText('0', padL - 8, y0);
      ctx.fillText('-σ_Y', padL - 8, yOf(-1));

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = pal.textMuted;
      ctx.fillText('Strain ε (%)', padL + pw * 0.5, padT + ph + 32);

      // Tick numbers on strain axis
      setFont(ctx, 15, true, 400);
      [0, 0.002, 0.004].forEach(function (ev) {
        ctx.fillText((ev * 100).toFixed(1) + '%', xOf(ev), padT + ph + 8);
      });
      ctx.restore();

      // Reference monotonic envelope (subtle dashed guide)
      ctx.save();
      ctx.strokeStyle = withAlpha(pal.textMuted, 0.25);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(xOf(0), yOf(0));
      ctx.lineTo(xOf(EPS_Y), yOf(1));
      const envEndSig = 1 + (hardeningRatio * (0.0052 - EPS_Y) * E_MOD) / SIGMA_Y;
      ctx.lineTo(xOf(0.0052), yOf(envEndSig));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Color-coded horizontal brackets for permanent plastic strain epsP and elastic recovery epsE
      if (state.peakEps > EPS_Y + 0.0002 && state.epsP > 0.0001) {
        const xp0 = xOf(0);
        const xEp = xOf(state.epsP);
        const xPk = xOf(state.peakEps);
        const yPk = yOf(state.peakSigma / SIGMA_Y);
        const brY = y0 + 18;

        ctx.save();
        // Vertical drop from peak to strain axis
        ctx.strokeStyle = withAlpha(pal.amber, 0.5);
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(xPk, yPk);
        ctx.lineTo(xPk, brY + 6);
        ctx.stroke();
        ctx.setLineDash([]);

        // Permanent plastic strain bracket (0 -> epsP)
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(xp0, brY - 5);
        ctx.lineTo(xp0, brY + 5);
        ctx.moveTo(xp0, brY);
        ctx.lineTo(xEp, brY);
        ctx.moveTo(xEp, brY - 5);
        ctx.lineTo(xEp, brY + 5);
        ctx.stroke();

        // Elastic recovery bracket (epsP -> peakEps)
        ctx.strokeStyle = pal.amber;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(xEp + 2, brY);
        ctx.lineTo(xPk, brY);
        ctx.moveTo(xPk, brY - 5);
        ctx.lineTo(xPk, brY + 5);
        ctx.stroke();

        setFont(ctx, 15, true, 600);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = pal.teal;
        if (xEp - xp0 > 24) ctx.fillText('εᵖ', (xp0 + xEp) * 0.5, brY + 7);
        ctx.fillStyle = pal.amber;
        if (xPk - xEp > 24) ctx.fillText('εᵉ', (xEp + xPk) * 0.5, brY + 7);
        ctx.restore();
      }

      // Draw actual stress-strain path colored by segment regime
      const path = state.path;
      ctx.save();
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        ctx.strokeStyle =
          b.regime === 'Yielding' ? pal.teal : (b.regime === 'Unloading' ? pal.amber : pal.cardinal);
        ctx.beginPath();
        ctx.moveTo(xOf(a.eps), yOf(a.sigma / SIGMA_Y));
        ctx.lineTo(xOf(b.eps), yOf(b.sigma / SIGMA_Y));
        ctx.stroke();
      }
      ctx.restore();

      // Slope labels E and H
      ctx.save();
      setFont(ctx, 15, true, 500);
      ctx.fillStyle = pal.cardinal;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('E', xOf(EPS_Y * 0.55) - 6, yOf(0.55));

      ctx.fillStyle = pal.teal;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const hLblY = yOf(1 + (hardeningRatio * (0.0030 - EPS_Y) * E_MOD) / SIGMA_Y) - 8;
      ctx.fillText(hardeningRatio > 0 ? 'H = 0.15E' : 'H = 0', xOf(0.0028), hLblY);
      ctx.restore();

      // Current state glowing dot
      const cx = xOf(state.eps);
      const cy = yOf(state.sigma / SIGMA_Y);
      const dotColor =
        state.regime === 'Yielding' ? pal.teal : (state.regime === 'Unloading' ? pal.amber : pal.cardinal);
      ctx.save();
      ctx.fillStyle = withAlpha(dotColor, 0.28);
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.bg;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    bag.loop(api, function (dt) {
      if (!demo.active) return;
      demo.t += dt;
      // Phase 1 (0..1.5s): ramp 0 -> 0.44%
      // Phase 2 (1.5..2.6s): unload from 0.44% -> exact residual epsP where sigma = 0
      if (demo.t <= 1.5) {
        const u = demo.t / 1.5;
        stepToStrain(0.0044 * u);
      } else if (demo.t <= 2.65) {
        const u = (demo.t - 1.5) / 1.15;
        const targetEps = lerp(0.0044, state.epsP, clamp(u, 0, 1));
        stepToStrain(targetEps);
      } else {
        stepToStrain(state.epsP);
        demo.active = false;
      }
      strainCtrl.setValue(Number((state.eps * 100).toFixed(3)));
      updateReadouts();
      draw();
    });

    bag.observe(stage, draw);
    runCompletedDemoSnapshot();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () { demo.active = false; },
      destroy: function () {
        bag.clear();
      }
    };
  });

  /* ==========================================================================
   * LAB 4: yield-surfaces (Slide 17: Yield criteria: von Mises and Tresca)
   * ========================================================================== */

  ME340.registerLab('yield-surfaces', function (mountEl, api) {
    const bag = createBag();
    const SQRT2 = Math.SQRT2;
    const SQRT3 = Math.sqrt(3);
    const SQRT6 = Math.sqrt(6);
    const R_VM_PI = Math.sqrt(2 / 3); // radius of von Mises circle in pi-plane (in units of sigma_Y)

    // Store physical plane stress state (sigma_1 / sigma_Y, sigma_2 / sigma_Y, sigma_3 = 0)
    // Start inside the famous pure-shear sliver where Tresca yields and von Mises is still safe!
    let s1 = 0.54;
    let s2 = -0.54;
    let viewMode = 'plane'; // 'plane' | 'pi'
    let dragging = false;
    let mapInfo = { cx: 200, cy: 150, scale: 90 };

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');

    const viewGroup = el('div', 'lab-pill-group');
    const btnPlane = el('button', 'lab-pill is-active', 'Plane Stress (σ₁, σ₂)');
    const btnPi = el('button', 'lab-pill', 'π-Plane (σ₃ = const)');
    btnPlane.type = 'button';
    btnPi.type = 'button';
    viewGroup.appendChild(btnPlane);
    viewGroup.appendChild(btnPi);

    const presetGroup = el('div', 'lab-pill-group');
    const btnSliver = el('button', 'lab-pill', 'Shear Sliver');
    const btnUni = el('button', 'lab-pill', 'Uniaxial');
    const btnBi = el('button', 'lab-pill', 'Equibiaxial');
    [btnSliver, btnUni, btnBi].forEach(function (b) {
      b.type = 'button';
      presetGroup.appendChild(b);
    });

    const statusBadge = el('span', 'lab-badge-status is-warn', 'Tresca Yields · Mises Safe');

    toolbar.appendChild(viewGroup);
    toolbar.appendChild(presetGroup);
    toolbar.appendChild(statusBadge);

    const stage = el('div', 'lab-stage');
    const canvas = el('canvas', 'lab-canvas');
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    stage.appendChild(canvas);

    const readouts = el('div', 'lab-readout-row');
    const rS1 = createReadoutChip('σ₁ / σ_Y', '0.54');
    const rS2 = createReadoutChip('σ₂ / σ_Y', '-0.54');
    const rVM = createReadoutChip('Mises σ_eq / σ_Y', '0.94');
    const rTr = createReadoutChip('Tresca / σ_Y', '1.08');
    readouts.appendChild(rS1.chip);
    readouts.appendChild(rS2.chip);
    readouts.appendChild(rVM.chip);
    readouts.appendChild(rTr.chip);

    const caption = el('p', 'lab-caption', 'Drag the stress point anywhere in stress space to compare Tresca and von Mises boundaries.');

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(readouts);
    shell.appendChild(caption);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function toPi(a1, a2) {
      // Orthonormal pi-plane basis with sigma_3 = 0:
      // a = (0, 1, -1)/sqrt(2), b = (2, -1, -1)/sqrt(6)
      return {
        px: a2 / SQRT2,
        py: (2 * a1 - a2) / SQRT6
      };
    }

    function fromPi(px, py) {
      const a2 = SQRT2 * px;
      const a1 = (SQRT6 * py + a2) * 0.5;
      return { s1: a1, s2: a2 };
    }

    function computeMetrics() {
      const vm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);
      const tr = Math.max(Math.abs(s1 - s2), Math.abs(s1), Math.abs(s2));
      return { vm: vm, tr: tr };
    }

    function updateReadouts() {
      const m = computeMetrics();
      rS1.valEl.textContent = (s1 >= 0 ? '+' : '') + s1.toFixed(2);
      rS2.valEl.textContent = (s2 >= 0 ? '+' : '') + s2.toFixed(2);
      rVM.valEl.textContent = m.vm.toFixed(2);
      rTr.valEl.textContent = m.tr.toFixed(2);

      if (m.vm >= 1.0) {
        setStatusBadge(statusBadge, 'Yielding (Both Exceeded)', 'danger');
      } else if (m.tr >= 1.0) {
        setStatusBadge(statusBadge, 'Tresca Yields · Mises Safe', 'warn');
      } else {
        setStatusBadge(statusBadge, 'Elastic (Both Safe)', 'safe');
      }
    }

    function applyPointer(ev) {
      const pt = getPointerPos(canvas, ev);
      const ux = (pt.x - mapInfo.cx) / mapInfo.scale;
      const uy = -(pt.y - mapInfo.cy) / mapInfo.scale;
      if (viewMode === 'plane') {
        s1 = clamp(ux, -1.55, 1.55);
        s2 = clamp(uy, -1.55, 1.55);
      } else {
        // Clamp radius cleanly in pi-plane
        const r = Math.hypot(ux, uy);
        const maxR = R_VM_PI * 1.58;
        const k = r > maxR ? maxR / r : 1;
        const back = fromPi(ux * k, uy * k);
        s1 = clamp(back.s1, -1.8, 1.8);
        s2 = clamp(back.s2, -1.8, 1.8);
      }
      updateReadouts();
      draw();
    }

    bag.on(canvas, 'pointerdown', function (ev) {
      dragging = true;
      canvas.style.cursor = 'grabbing';
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      applyPointer(ev);
    });

    bag.on(canvas, 'pointermove', function (ev) {
      if (!dragging) return;
      applyPointer(ev);
    });

    function endDrag(ev) {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = 'grab';
      try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
    }

    bag.on(canvas, 'pointerup', endDrag);
    bag.on(canvas, 'pointercancel', endDrag);

    bag.on(btnPlane, 'click', function () {
      viewMode = 'plane';
      btnPlane.classList.add('is-active');
      btnPi.classList.remove('is-active');
      draw();
    });

    bag.on(btnPi, 'click', function () {
      viewMode = 'pi';
      btnPi.classList.add('is-active');
      btnPlane.classList.remove('is-active');
      draw();
    });

    bag.on(btnSliver, 'click', function () {
      s1 = 0.54; s2 = -0.54;
      updateReadouts(); draw();
    });
    bag.on(btnUni, 'click', function () {
      s1 = 1.00; s2 = 0.00;
      updateReadouts(); draw();
    });
    bag.on(btnBi, 'click', function () {
      s1 = 0.85; s2 = 0.85;
      updateReadouts(); draw();
    });

    function draw() {
      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      fillStageBg(ctx, w, h, pal);

      const cx = w * 0.5;
      const cy = h * 0.52;
      const halfSpan = Math.min(w, h) * 0.43;
      const scale = viewMode === 'plane' ? halfSpan / 1.48 : halfSpan / (R_VM_PI * 1.45);
      mapInfo = { cx: cx, cy: cy, scale: scale };

      function sx(u) { return cx + u * scale; }
      function sy(v) { return cy - v * scale; }

      // Background grid
      ctx.save();
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      const step = viewMode === 'plane' ? 0.5 : R_VM_PI * 0.5;
      for (let k = -4; k <= 4; k++) {
        const g = k * step;
        ctx.beginPath();
        ctx.moveTo(sx(g), 10);
        ctx.lineTo(sx(g), h - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, sy(g));
        ctx.lineTo(w - 10, sy(g));
        ctx.stroke();
      }
      ctx.restore();

      if (viewMode === 'plane') {
        // Plane-stress axes
        ctx.save();
        ctx.strokeStyle = pal.axis;
        ctx.lineWidth = 1.6;
        const axReach = Math.min(w * 0.44, halfSpan * 1.18);
        drawArrow(ctx, cx - axReach, cy, cx + axReach, cy, pal.axis, 1.5, 8);
        drawArrow(ctx, cx, cy + halfSpan, cx, cy - halfSpan, pal.axis, 1.5, 8);
        setFont(ctx, 15, true, 500);
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const s1LabelX = Math.min(w - 72, cx + axReach + 8);
        ctx.fillText('σ₁/σY', s1LabelX, cy);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('σ₂/σY', cx + 10, Math.max(8, cy - halfSpan - 4));
        ctx.restore();

        // von Mises tilted ellipse: s1 = cos(t) + sin(t)/sqrt(3), s2 = cos(t) - sin(t)/sqrt(3)
        ctx.save();
        ctx.beginPath();
        for (let k = 0; k <= 140; k++) {
          const th = (k / 140) * Math.PI * 2;
          const e1 = Math.cos(th) + Math.sin(th) / SQRT3;
          const e2 = Math.cos(th) - Math.sin(th) / SQRT3;
          const px = sx(e1);
          const py = sy(e2);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        // Fill sliver in amberSoft first, then fill Tresca interior over it cleanly
        ctx.fillStyle = pal.amberSoft;
        ctx.fill();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        // Tresca hexagon in plane stress
        const hex = [
          [1, 0], [1, 1], [0, 1], [-1, 0], [-1, -1], [0, -1]
        ];
        ctx.beginPath();
        hex.forEach(function (v, idx) {
          const px = sx(v[0]);
          const py = sy(v[1]);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fillStyle = pal.tealSoft;
        ctx.fill();
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else {
        // pi-plane projected principal stress axes at 90 deg (s1), -30 deg (s2), -150 deg (s3)
        const axes = [
          { ang: Math.PI / 2, lbl: 'σ₁' },
          { ang: -Math.PI / 6, lbl: 'σ₂' },
          { ang: -5 * Math.PI / 6, lbl: 'σ₃' }
        ];
        const axLen = R_VM_PI * 1.32;
        ctx.save();
        axes.forEach(function (ax) {
          const ex = sx(axLen * Math.cos(ax.ang));
          const ey = sy(axLen * Math.sin(ax.ang));
          const bx = sx(-axLen * 0.72 * Math.cos(ax.ang));
          const by = sy(-axLen * 0.72 * Math.sin(ax.ang));
          ctx.strokeStyle = withAlpha(pal.axis, 0.45);
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(cx, cy);
          ctx.stroke();
          ctx.setLineDash([]);
          drawArrow(ctx, cx, cy, ex, ey, pal.axis, 1.6, 8);
          setFont(ctx, 15, true, 600);
          ctx.fillStyle = pal.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ax.lbl, sx((axLen + 0.14) * Math.cos(ax.ang)), sy((axLen + 0.14) * Math.sin(ax.ang)));
        });

        // von Mises circle of radius R_VM_PI
        const rPx = R_VM_PI * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
        ctx.fillStyle = pal.amberSoft;
        ctx.fill();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        // Inscribed Tresca regular hexagon (vertices at 90, 30, -30, -90, -150, 150 deg)
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const ang = Math.PI / 2 - (k * Math.PI) / 3;
          const px = cx + rPx * Math.cos(ang);
          const py = cy - rPx * Math.sin(ang);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = pal.tealSoft;
        ctx.fill();
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Draw stress state vector and glowing draggable handle
      let hx, hy;
      if (viewMode === 'plane') {
        hx = sx(s1);
        hy = sy(s2);
      } else {
        const pi = toPi(s1, s2);
        hx = sx(pi.px);
        hy = sy(pi.py);
      }
      const m = computeMetrics();
      const handleCol = m.vm >= 1.0 ? pal.cardinal : (m.tr >= 1.0 ? pal.amber : pal.teal);

      ctx.save();
      ctx.strokeStyle = withAlpha(handleCol, 0.85);
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crisp precision drafting target ring (no neon glow halo)
      ctx.strokeStyle = handleCol;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx, hy, dragging ? 13 : 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = handleCol;
      ctx.beginPath();
      ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.bg;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Compact legend in top-left corner (>= 15px)
      const lx = 14;
      const ly = 14;
      setFont(ctx, 15, false, 500);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 8);
      ctx.lineTo(lx + 20, ly + 8);
      ctx.stroke();
      ctx.fillStyle = pal.text;
      ctx.fillText('von Mises', lx + 26, ly + 8);

      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(lx, ly + 30);
      ctx.lineTo(lx + 20, ly + 30);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText('Tresca', lx + 26, ly + 30);
      ctx.restore();
    }

    bag.observe(stage, draw);
    updateReadouts();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () {
        bag.clear();
      }
    };
  });

  /* ==========================================================================
   * LAB 5: radial-return (Slide 18: J2 associated flow rule)
   * ========================================================================== */

  ME340.registerLab('radial-return', function (mountEl, api) {
    const bag = createBag();
    const RY = Math.SQRT2; // Yield circle radius sqrt(2)*k in units of k
    const K_MPA = 150; // Pure shear yield k = 150 MPa
    const G_MPA = 80e3; // Shear modulus G = 80 GPa

    // Previous stress state s^n (anchor inside yield circle) and draggable trial stress s^tr (in units of k)
    const sn = { x: -0.52, y: -0.34 };
    let str = { x: 1.48, y: 1.12 }; // starts outside circle (f_tr > 0)
    let dragging = false;
    let snapAnim = 1.0; // 0 -> 1 return snap animation
    let pulseT = 0;
    let map = { cx: 200, cy: 150, scale: 80 };

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');

    const pillGroup = el('div', 'lab-pill-group');
    const btnPlastic = el('button', 'lab-pill is-active', 'Plastic Trial (f > 0)');
    const btnElastic = el('button', 'lab-pill', 'Elastic Trial (f < 0)');
    const btnReplay = el('button', 'lab-pill', '↺ Replay Return');
    [btnPlastic, btnElastic, btnReplay].forEach(function (b) {
      b.type = 'button';
      pillGroup.appendChild(b);
    });

    const statusBadge = el('span', 'lab-badge-status is-danger', 'Radial Return Active');
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(statusBadge);

    const stage = el('div', 'lab-stage');
    const canvas = el('canvas', 'lab-canvas');
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    stage.appendChild(canvas);

    const readouts = el('div', 'lab-readout-row');
    const rFtr = createReadoutChip('f_tr / k²', '+0.72');
    const rDlam = createReadoutChip('2G·Δλ', '0.31');
    const rDepsP = createReadoutChip('|Δεᵖ|', '0.41‰');
    readouts.appendChild(rFtr.chip);
    readouts.appendChild(rDlam.chip);
    readouts.appendChild(rDepsP.chip);

    const caption = el('p', 'lab-caption', 'Drag the trial stress σᵗʳ across the yield circle f = J₂ - k² = 0 to trigger orthogonal J₂ radial return.');

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(readouts);
    shell.appendChild(caption);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function computeReturn() {
      const rTr = Math.hypot(str.x, str.y);
      const j2 = 0.5 * rTr * rTr; // in units of k^2
      const fTr = j2 - 1.0; // f_tr / k^2
      const isPlastic = fTr > 1e-6;
      const nx = rTr > 1e-6 ? str.x / rTr : 1;
      const ny = rTr > 1e-6 ? str.y / rTr : 0;

      let twoGDlam = 0;
      let dGamma = 0;
      let sNext = { x: str.x, y: str.y };

      if (isPlastic) {
        twoGDlam = rTr / RY - 1.0;
        dGamma = rTr - RY; // in units of k
        sNext = { x: nx * RY, y: ny * RY };
      }

      // |Delta eps^p| = (dGamma * K_MPA) / (2 * G_MPA) -> in per-mille (x 1000)
      const dEpsPPerMille = ((dGamma * K_MPA) / (2 * G_MPA)) * 1000;

      return {
        rTr: rTr,
        fTr: fTr,
        isPlastic: isPlastic,
        nx: nx,
        ny: ny,
        twoGDlam: twoGDlam,
        dGamma: dGamma,
        sNext: sNext,
        dEpsPPerMille: dEpsPPerMille
      };
    }

    function updateReadouts() {
      const c = computeReturn();
      rFtr.valEl.textContent = (c.fTr >= 0 ? '+' : '') + c.fTr.toFixed(2);
      rDlam.valEl.textContent = c.twoGDlam.toFixed(3);
      rDepsP.valEl.textContent = c.dEpsPPerMille.toFixed(2) + '‰';

      btnPlastic.classList.toggle('is-active', c.isPlastic);
      btnElastic.classList.toggle('is-active', !c.isPlastic);

      if (c.isPlastic) {
        setStatusBadge(statusBadge, 'Radial Return Active', 'danger');
      } else {
        setStatusBadge(statusBadge, 'Elastic Step Accepted', 'safe');
      }
    }

    function applyPointer(ev) {
      const pt = getPointerPos(canvas, ev);
      const ux = (pt.x - map.cx) / map.scale;
      const uy = -(pt.y - map.cy) / map.scale;
      const r = Math.hypot(ux, uy);
      const maxR = RY * 1.72;
      const fac = r > maxR ? maxR / r : 1;
      str.x = ux * fac;
      str.y = uy * fac;
      snapAnim = 1.0;
      updateReadouts();
      draw();
    }

    bag.on(canvas, 'pointerdown', function (ev) {
      dragging = true;
      canvas.style.cursor = 'grabbing';
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      applyPointer(ev);
    });
    bag.on(canvas, 'pointermove', function (ev) {
      if (!dragging) return;
      applyPointer(ev);
    });
    function endDrag(ev) {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = 'grab';
      try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
    }
    bag.on(canvas, 'pointerup', endDrag);
    bag.on(canvas, 'pointercancel', endDrag);

    bag.on(btnPlastic, 'click', function () {
      str = { x: 1.48, y: 1.12 };
      snapAnim = 0.0;
      updateReadouts();
      draw();
    });

    bag.on(btnElastic, 'click', function () {
      str = { x: 0.72, y: 0.54 };
      snapAnim = 1.0;
      updateReadouts();
      draw();
    });

    bag.on(btnReplay, 'click', function () {
      const c = computeReturn();
      if (!c.isPlastic) {
        str = { x: 1.48, y: 1.12 };
      }
      snapAnim = 0.0;
      updateReadouts();
      draw();
    });

    function draw() {
      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      fillStageBg(ctx, w, h, pal);

      const cx = w * 0.48;
      const cy = h * 0.54;
      const scale = Math.min(w, h) * 0.42 / (RY * 1.42);
      map = { cx: cx, cy: cy, scale: scale };

      function sx(u) { return cx + u * scale; }
      function sy(v) { return cy - v * scale; }

      const c = computeReturn();

      // Concentric deviatoric reference circles
      ctx.save();
      [0.5, 1.5].forEach(function (mult) {
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, RY * mult * scale, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Deviatoric axes
      const axSpan = RY * 1.62 * scale;
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - axSpan, cy);
      ctx.lineTo(cx + axSpan, cy);
      ctx.moveTo(cx, cy - axSpan);
      ctx.lineTo(cx, cy + axSpan);
      ctx.stroke();

      // Yield circle f = J_2 - k^2 = 0 (radius sqrt(2)k)
      const rPx = RY * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
      ctx.fillStyle = pal.tealSoft;
      ctx.fill();
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Circle radius annotation
      setFont(ctx, 15, true, 500);
      ctx.fillStyle = pal.teal;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('f = J₂ - k² = 0  (R = √2 k)', 14, 14);
      ctx.restore();

      const pO = { x: cx, y: cy };
      const pN = { x: sx(sn.x), y: sy(sn.y) };
      const pTr = { x: sx(str.x), y: sy(str.y) };
      const pNext = { x: sx(c.sNext.x), y: sy(c.sNext.y) };

      // Elastic predictor path s^n -> s^tr
      ctx.save();
      ctx.strokeStyle = withAlpha(pal.blue, 0.72);
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(pN.x, pN.y);
      ctx.lineTo(pTr.x, pTr.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Anchor point s^n
      ctx.fillStyle = pal.blue;
      ctx.beginPath();
      ctx.arc(pN.x, pN.y, 4.8, 0, Math.PI * 2);
      ctx.fill();
      setFont(ctx, 15, true, 500);
      ctx.fillStyle = pal.blue;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('σⁿ', pN.x - 8, pN.y + 4);

      // Radial line from origin to s^tr
      ctx.strokeStyle = withAlpha(pal.textMuted, 0.35);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(pO.x, pO.y);
      ctx.lineTo(pTr.x, pTr.y);
      ctx.stroke();
      ctx.restore();

      if (c.isPlastic) {
        // Tangent line at s^{n+1} + right-angle orthogonality square
        const tx = -c.ny;
        const ty = c.nx;
        const tanLen = 44;
        ctx.save();
        ctx.strokeStyle = withAlpha(pal.textMuted, 0.55);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pNext.x - tx * tanLen, pNext.y + ty * tanLen);
        ctx.lineTo(pNext.x + tx * tanLen, pNext.y - ty * tanLen);
        ctx.stroke();
        ctx.setLineDash([]);

        // Small 90-degree orthogonality corner mark
        const sq = 10;
        const rx = c.nx * sq;
        const ry = -c.ny * sq;
        const txs = tx * sq;
        const tys = -ty * sq;
        ctx.strokeStyle = pal.textMuted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pNext.x + rx, pNext.y + ry);
        ctx.lineTo(pNext.x + rx + txs, pNext.y + ry + tys);
        ctx.lineTo(pNext.x + txs, pNext.y + tys);
        ctx.stroke();

        // Outward normal flow direction ∂f/∂σ = s
        const normLen = 42;
        const normEndX = pNext.x + c.nx * normLen;
        const normEndY = pNext.y - c.ny * normLen;
        drawArrow(ctx, pNext.x, pNext.y, normEndX, normEndY, pal.amber, 2.4, 9);

        // Smooth animated return correction vector -Δγ n from s^tr -> s^{n+1}
        const animFrac = clamp(snapAnim, 0, 1);
        const curX = lerp(pTr.x, pNext.x, animFrac);
        const curY = lerp(pTr.y, pNext.y, animFrac);
        drawArrow(ctx, pTr.x, pTr.y, curX, curY, pal.cardinal, 3.2, 11);

        // Animated traveling pulse along return vector
        const pu = (pulseT * 0.75) % 1;
        const px = lerp(pTr.x, pNext.x, pu);
        const py = lerp(pTr.y, pNext.y, pu);
        ctx.fillStyle = pal.cardinal;
        ctx.beginPath();
        ctx.arc(px, py, 3.8, 0, Math.PI * 2);
        ctx.fill();

        // Corrected state dot s^{n+1} on circle
        ctx.fillStyle = withAlpha(pal.teal, 0.3);
        ctx.beginPath();
        ctx.arc(pNext.x, pNext.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.teal;
        ctx.beginPath();
        ctx.arc(pNext.x, pNext.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pal.white;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Crisp labels (>= 15px)
        setFont(ctx, 15, true, 600);
        ctx.fillStyle = pal.teal;
        ctx.textAlign = c.nx >= 0 ? 'right' : 'left';
        ctx.textBaseline = c.ny >= 0 ? 'top' : 'bottom';
        ctx.fillText('σⁿ⁺¹', pNext.x - c.nx * 14, pNext.y + c.ny * 14);

        ctx.fillStyle = pal.cardinal;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const midRx = (pTr.x + pNext.x) * 0.5 + (-c.ny) * 14;
        const midRy = (pTr.y + pNext.y) * 0.5 + (-c.nx) * 14;
        ctx.fillText('-Δγ n', clamp(midRx, 14, w - 66), clamp(midRy, 22, h - 22));

        ctx.fillStyle = pal.amber;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('∂f/∂σ = s', 14, h - 14);
        ctx.restore();
      } else {
        // Elastic step accepted notice on canvas
        ctx.save();
        setFont(ctx, 15, false, 600);
        ctx.fillStyle = pal.teal;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Elastic step accepted (Δλ = 0)', 14, h - 14);
        ctx.restore();
      }

      // Draggable trial stress handle s^tr
      const trCol = c.isPlastic ? pal.cardinal : pal.teal;
      ctx.save();
      ctx.fillStyle = withAlpha(trCol, 0.25);
      ctx.beginPath();
      ctx.arc(pTr.x, pTr.y, dragging ? 16 : 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = trCol;
      ctx.beginPath();
      ctx.arc(pTr.x, pTr.y, 6.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.white;
      ctx.lineWidth = 2;
      ctx.stroke();

      setFont(ctx, 15, true, 600);
      ctx.fillStyle = pal.text;
      ctx.textAlign = c.nx >= 0 ? 'left' : 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('σᵗʳ', clamp(pTr.x + (c.nx >= 0 ? 12 : -12), 20, w - 30), Math.max(24, pTr.y - 8));
      ctx.restore();
    }

    bag.loop(api, function (dt) {
      pulseT += dt;
      if (snapAnim < 1.0) {
        snapAnim = Math.min(1.0, snapAnim + dt * 1.9);
      }
      draw();
    });

    bag.observe(stage, draw);
    updateReadouts();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () {
        bag.clear();
      }
    };
  });

  /* ==========================================================================
   * LAB 6: fracture-lefm (Slide 19: Fracture: LEFM and energy release)
   * ========================================================================== */

  ME340.registerLab('fracture-lefm', function (mountEl, api) {
    const bag = createBag();
    const E_GPA = 200;
    const NU = 0.30;
    const E_PRIME_GPA = E_GPA / (1 - NU * NU); // ~219.78 GPa (plane strain)
    const SIGMA_Y_MPA = 450;

    let sigmaInf = 180; // MPa (50..400)
    let crackA_mm = 10; // mm (2..25)
    let kIc = 45; // MPa sqrt(m) (25..80)
    let showPlasticZone = true;
    let showJContour = true;
    let pulseT = 0;

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');

    const toggleGroup = el('div', 'lab-pill-group');
    const btnPZ = el('button', 'lab-pill is-active', 'Plastic Zone r_p');
    const btnJ = el('button', 'lab-pill is-active', 'J-Contour Γ');
    btnPZ.type = 'button';
    btnJ.type = 'button';
    toggleGroup.appendChild(btnPZ);
    toggleGroup.appendChild(btnJ);

    const statusBadge = el('span', 'lab-badge-status is-safe', 'Safe · Subcritical');
    toolbar.appendChild(toggleGroup);
    toolbar.appendChild(statusBadge);

    const stage = el('div', 'lab-stage');
    const canvas = el('canvas', 'lab-canvas');
    stage.appendChild(canvas);

    const controls = el('div', 'lab-controls-grid');
    const sigCtrl = createSliderControl(
      'Remote Stress σ∞',
      { min: 50, max: 400, step: 5, value: sigmaInf, format: function (v) { return Math.round(v) + ' MPa'; } },
      function (v) { sigmaInf = v; updateReadouts(); draw(); }
    );
    const aCtrl = createSliderControl(
      'Half-Crack a',
      { min: 2, max: 25, step: 0.5, value: crackA_mm, format: function (v) { return v.toFixed(1) + ' mm'; } },
      function (v) { crackA_mm = v; updateReadouts(); draw(); }
    );
    const kicCtrl = createSliderControl(
      'Toughness K_Ic',
      { min: 25, max: 80, step: 1, value: kIc, format: function (v) { return Math.round(v) + ' MPa√m'; } },
      function (v) { kIc = v; updateReadouts(); draw(); }
    );
    controls.appendChild(sigCtrl.wrap);
    controls.appendChild(aCtrl.wrap);
    controls.appendChild(kicCtrl.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rKI = createReadoutChip('K_I', '31.9 MPa√m');
    const rRatio = createReadoutChip('K_I / K_Ic', '0.71');
    const rG = createReadoutChip('Release G', '4.63 kJ/m²');
    readouts.appendChild(rKI.chip);
    readouts.appendChild(rRatio.chip);
    readouts.appendChild(rG.chip);

    const caption = el('p', 'lab-caption', 'Increase σ∞ or crack half-length a to grow the r⁻¹/² near-tip stress lobes and approach K_Ic.');

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controls);
    shell.appendChild(readouts);
    shell.appendChild(caption);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    bag.on(sigCtrl.input, 'input', sigCtrl.handler);
    bag.on(aCtrl.input, 'input', aCtrl.handler);
    bag.on(kicCtrl.input, 'input', kicCtrl.handler);

    bag.on(btnPZ, 'click', function () {
      showPlasticZone = !showPlasticZone;
      btnPZ.classList.toggle('is-active', showPlasticZone);
      draw();
    });
    bag.on(btnJ, 'click', function () {
      showJContour = !showJContour;
      btnJ.classList.toggle('is-active', showJContour);
      draw();
    });

    function computeLEFM() {
      const aM = crackA_mm * 1e-3;
      const kI = sigmaInf * Math.sqrt(Math.PI * aM); // MPa sqrt(m)
      const ratio = kI / kIc;
      // G = K_I^2 / E' -> (MPa^2 * m) / GPa = 10^12 / 10^9 J/m^2 = 10^3 J/m^2 = kJ/m^2
      const gKJ = (kI * kI) / E_PRIME_GPA;
      return { kI: kI, ratio: ratio, gKJ: gKJ };
    }

    function updateReadouts() {
      const m = computeLEFM();
      rKI.valEl.textContent = m.kI.toFixed(1) + ' MPa√m';
      rRatio.valEl.textContent = m.ratio.toFixed(2);
      rG.valEl.textContent = m.gKJ.toFixed(2) + ' kJ/m²';

      if (m.ratio >= 1.0) {
        setStatusBadge(statusBadge, 'CRITICAL FRACTURE · K_I >= K_Ic', 'danger');
      } else if (m.ratio >= 0.75) {
        setStatusBadge(statusBadge, 'Warning · Approaching K_Ic', 'warn');
      } else {
        setStatusBadge(statusBadge, 'Safe · Subcritical', 'safe');
      }
    }

    function draw() {
      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const m = computeLEFM();

      fillStageBg(ctx, w, h, pal);

      // Reserve right margin for K_I / K_Ic vertical toughness bar
      const gaugeW = 94;
      const plateAreaW = Math.max(160, w - gaugeW - 10);
      const padX = Math.max(16, plateAreaW * 0.07);
      const padY = 44;
      const plateX = padX;
      const plateY = padY;
      const plateW = plateAreaW - padX * 2;
      const plateH = Math.max(100, h - padY * 2);
      const cx = plateX + plateW * 0.5;
      const cy = plateY + plateH * 0.5;

      // Remote tension arrows above and below plate
      const nArrows = 5;
      const arrLen = 16 + ((sigmaInf - 50) / 350) * 16;
      for (let i = 0; i < nArrows; i++) {
        const ax = plateX + plateW * (0.14 + (i / (nArrows - 1)) * 0.72);
        drawArrow(ctx, ax, plateY - 4, ax, plateY - 4 - arrLen, pal.blue, 2.0, 7);
        drawArrow(ctx, ax, plateY + plateH + 4, ax, plateY + plateH + 4 + arrLen, pal.blue, 2.0, 7);
      }
      setFont(ctx, 15, true, 600);
      ctx.fillStyle = pal.blue;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('σ∞', plateX + 2, plateY - 18);

      // Plate rectangle with clip so near-tip contours stay cleanly inside specimen
      ctx.save();
      roundRectPath(ctx, plateX, plateY, plateW, plateH, 6);
      ctx.fillStyle = pal.surface2;
      ctx.fill();
      ctx.clip();

      // Crack half-length in pixels proportional to a (2..25 mm)
      const pxPerMm = (plateW * 0.30) / 25;
      const halfA = Math.max(12, crackA_mm * pxPerMm);
      const tipL = cx - halfA;
      const tipR = cx + halfA;

      // Analytical Mode-I iso-stress butterfly contours:
      // sigma_yy(r, theta) = (K_I / sqrt(2*pi*r)) * cos(th/2) * [1 + sin(th/2)*sin(3*th/2)]
      // => r(theta) = (1 / 2pi) * (K_I / sigma_level)^2 * (f(theta))^2
      // Scale visual mm -> px cleanly so contours react dramatically to K_I
      const pxPerMeter = plateW * 3.8;
      const levels = [
        { sig: 260, col: pal.blue, alpha: 0.16 },
        { sig: 380, col: pal.teal, alpha: 0.22 },
        { sig: 520, col: pal.amber, alpha: 0.28 },
        { sig: 720, col: pal.cardinal, alpha: 0.38 },
        { sig: 1000, col: pal.cardinal, alpha: 0.56 }
      ];

      [-1, 1].forEach(function (side) {
        const tx = side > 0 ? tipR : tipL;
        levels.forEach(function (lvl) {
          const rScaleM = (1 / (2 * Math.PI)) * Math.pow(m.kI / lvl.sig, 2);
          const rScalePx = Math.min(plateH * 0.42, rScaleM * pxPerMeter);
          if (rScalePx < 2) return;

          ctx.beginPath();
          for (let k = 0; k <= 72; k++) {
            const th = -Math.PI + (k / 72) * Math.PI * 2;
            const c = Math.cos(th * 0.5);
            const f = c * (1 + Math.sin(th * 0.5) * Math.sin(1.5 * th));
            const rr = rScalePx * f * f;
            const px = tx + side * rr * Math.cos(th);
            const py = cy + rr * Math.sin(th);
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = withAlpha(lvl.col, lvl.alpha);
          ctx.fill();
          ctx.strokeStyle = withAlpha(lvl.col, Math.min(0.85, lvl.alpha + 0.35));
          ctx.lineWidth = 1.1;
          ctx.stroke();
        });

        // Optional Irwin Plane-Strain Plastic Zone r_p(theta)
        if (showPlasticZone) {
          const rpScaleM = (1 / (2 * Math.PI)) * Math.pow(m.kI / SIGMA_Y_MPA, 2);
          const rpPx = Math.min(plateH * 0.38, rpScaleM * pxPerMeter);
          if (rpPx > 2.5) {
            ctx.beginPath();
            for (let k = 0; k <= 64; k++) {
              const th = -Math.PI + (k / 64) * Math.PI * 2;
              const c2 = Math.pow(Math.cos(th * 0.5), 2);
              const s2 = Math.pow(Math.sin(th * 0.5), 2);
              const rr = rpPx * c2 * ((1 - 2 * NU) * (1 - 2 * NU) + 3 * s2);
              const px = tx + side * rr * Math.cos(th);
              const py = cy + rr * Math.sin(th);
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = pal.text;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      });

      // Optional J-Integral path-independent contour Gamma around right crack tip
      if (showJContour) {
        const jR = Math.min(plateH * 0.34, Math.max(26, halfA * 0.55 + 18));
        ctx.save();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(tipR, cy, jR, -Math.PI * 0.88, Math.PI * 0.88);
        ctx.stroke();
        // Counterclockwise tangent arrow at top of Gamma
        drawArrow(ctx, tipR + 8, cy - jR, tipR - 8, cy - jR, pal.teal, 2.2, 8);
        setFont(ctx, 15, true, 600);
        ctx.fillStyle = pal.teal;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Γ', tipR + jR * 0.65, cy - jR * 0.68);
        ctx.restore();
      }

      // Critical fracture animated pulse ring at both crack tips
      if (m.ratio >= 1.0) {
        const wave = (pulseT * 1.4) % 1;
        const pR = 6 + wave * 34;
        [-1, 1].forEach(function (side) {
          const tx = side > 0 ? tipR : tipL;
          ctx.strokeStyle = withAlpha(pal.cardinal, (1 - wave) * 0.9);
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(tx, cy, pR, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // Opened center crack ellipse (opening displacement scales with K_I)
      const openHalfH = clamp(1.8 + m.kI * 0.08, 2, 7.5);
      ctx.beginPath();
      ctx.moveTo(tipL, cy);
      ctx.quadraticCurveTo(cx, cy - openHalfH, tipR, cy);
      ctx.quadraticCurveTo(cx, cy + openHalfH, tipL, cy);
      ctx.closePath();
      ctx.fillStyle = pal.bg;
      ctx.fill();
      ctx.strokeStyle = m.ratio >= 1.0 ? pal.cardinal : pal.text;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Dimension label 2a
      setFont(ctx, 15, true, 600);
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('2a = ' + (2 * crackA_mm).toFixed(0) + ' mm', cx, cy + openHalfH + 8);
      ctx.restore();

      // Plate border stroke
      roundRectPath(ctx, plateX, plateY, plateW, plateH, 6);
      ctx.strokeStyle = m.ratio >= 1.0 ? pal.cardinal : pal.border;
      ctx.lineWidth = m.ratio >= 1.0 ? 2.2 : 1.5;
      ctx.stroke();

      // Vertical K_I vs K_Ic gauge bar on right
      const gx = plateAreaW + 12;
      const gw = 26;
      const gy = plateY;
      const gh = plateH;
      const maxK = Math.max(95, kIc * 1.35);
      const fillFrac = clamp(m.kI / maxK, 0, 1);
      const critFrac = clamp(kIc / maxK, 0, 1);

      ctx.save();
      roundRectPath(ctx, gx, gy, gw, gh, 6);
      ctx.fillStyle = pal.surface2;
      ctx.fill();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      const fillH = gh * fillFrac;
      const barCol = m.ratio >= 1.0 ? pal.cardinal : (m.ratio >= 0.75 ? pal.amber : pal.teal);
      roundRectPath(ctx, gx + 2, gy + gh - fillH + 2, gw - 4, Math.max(0, fillH - 4), 4);
      ctx.fillStyle = barCol;
      ctx.fill();

      // K_Ic threshold line
      const critY = gy + gh * (1 - critFrac);
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(gx - 6, critY);
      ctx.lineTo(gx + gw + 6, critY);
      ctx.stroke();

      setFont(ctx, 15, true, 600);
      ctx.fillStyle = pal.cardinal;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('KIc', gx + gw + 8, critY);

      ctx.fillStyle = pal.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('KI', gx + gw * 0.5, gy - 6);
      ctx.restore();
    }

    bag.loop(api, function (dt) {
      pulseT += dt;
      draw();
    });

    bag.observe(stage, draw);
    updateReadouts();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () {
        bag.clear();
      }
    };
  });

  /* ==========================================================================
   * LAB 7: workflow-stepper (Slide 20: Standard workflow)
   * ========================================================================== */

  ME340.registerLab('workflow-stepper', function (mountEl, api) {
    const bag = createBag();
    const routes = {
      airy: {
        label: '2D Airy φ',
        colorKey: 'cardinal',
        softKey: 'cardinalSoft',
        methodTag: '∇⁴φ = 0',
        solveTag: 'σ from φ, BCs',
        methodCheck: 'Airy ∇⁴φ = 0',
        solveCheck: 'Match edge BCs'
      },
      green: {
        label: '3D Green G',
        colorKey: 'teal',
        softKey: 'tealSoft',
        methodTag: 'Kelvin G_ij',
        solveTag: '∫ G·f dV',
        methodCheck: 'Kelvin G_ij',
        solveCheck: '∫ G·f superposition'
      },
      fem: {
        label: 'FEM Benchmark',
        colorKey: 'amber',
        softKey: 'amberSoft',
        methodTag: 'Weak Form',
        solveTag: 'Mesh + Solver',
        methodCheck: 'Analytic + FEM',
        solveCheck: 'Converge h → 0'
      }
    };

    const steps = [
      {
        num: 1,
        title: '1. Model',
        sub: 'Geometry & BCs',
        checks: ['2D/3D Symmetry', 'Hooke (E, ν, σ_Y)', 'BCs on S_u, S_t']
      },
      {
        num: 2,
        title: '2. Method',
        sub: '',
        checks: []
      },
      {
        num: 3,
        title: '3. Solve',
        sub: '',
        checks: []
      },
      {
        num: 4,
        title: '4. Check',
        sub: 'Verify Physics',
        checks: ['∇·σ + f = 0', 'BCs on S_u, S_t', 'Finite energy U']
      },
      {
        num: 5,
        title: '5. Extract',
        sub: 'Design Metrics',
        checks: ['Peak σ_eq, K_I', 'Margin vs σ_Y', 'Analytic vs FEM']
      }
    ];

    let activeStep = 3; // Highlight 4. Check on entry so full pipeline & FEM branch shine
    let routeKey = 'airy';
    let pulseT = 0;
    let boxRects = [];

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');

    const stepGroup = el('div', 'lab-pill-group');
    const stepBtns = steps.map(function (st, idx) {
      const b = el('button', 'lab-pill' + (idx === activeStep ? ' is-active' : ''), st.title);
      b.type = 'button';
      stepGroup.appendChild(b);
      return b;
    });

    const routeGroup = el('div', 'lab-pill-group');
    const routeKeys = ['airy', 'green', 'fem'];
    const routeBtns = routeKeys.map(function (rk) {
      const b = el('button', 'lab-pill' + (rk === routeKey ? ' is-active' : ''), routes[rk].label);
      b.type = 'button';
      routeGroup.appendChild(b);
      return b;
    });

    toolbar.appendChild(stepGroup);
    toolbar.appendChild(routeGroup);

    const stage = el('div', 'lab-stage');
    const canvas = el('canvas', 'lab-canvas');
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'pointer';
    stage.appendChild(canvas);

    const readouts = el('div', 'lab-readout-row');
    const rC1 = createReadoutChip('Check 1', '');
    const rC2 = createReadoutChip('Check 2', '');
    const rC3 = createReadoutChip('Check 3', '');
    readouts.appendChild(rC1.chip);
    readouts.appendChild(rC2.chip);
    readouts.appendChild(rC3.chip);

    const caption = el('p', 'lab-caption', 'Select a workflow step or switch solution route to trace analytic derivations and the FEM verification branch.');

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(readouts);
    shell.appendChild(caption);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function getChecks(stepIdx) {
      const rt = routes[routeKey];
      if (stepIdx === 1) {
        return [rt.methodCheck, 'Compat. / Kernel', 'FEM if needed'];
      }
      if (stepIdx === 2) {
        return [rt.solveCheck, 'Dimensionless', 'Far-field limits'];
      }
      return steps[stepIdx].checks;
    }

    function updateUI() {
      stepBtns.forEach(function (b, i) {
        b.classList.toggle('is-active', i === activeStep);
      });
      routeBtns.forEach(function (b, i) {
        b.classList.toggle('is-active', routeKeys[i] === routeKey);
      });
      const checks = getChecks(activeStep);
      rC1.keyEl.textContent = steps[activeStep].title + ' · A';
      rC1.valEl.textContent = checks[0] || '';
      rC2.keyEl.textContent = steps[activeStep].title + ' · B';
      rC2.valEl.textContent = checks[1] || '';
      rC3.keyEl.textContent = steps[activeStep].title + ' · C';
      rC3.valEl.textContent = checks[2] || '';
      draw();
    }

    stepBtns.forEach(function (b, i) {
      bag.on(b, 'click', function () {
        activeStep = i;
        updateUI();
      });
    });

    routeBtns.forEach(function (b, i) {
      bag.on(b, 'click', function () {
        routeKey = routeKeys[i];
        updateUI();
      });
    });

    bag.on(canvas, 'click', function (ev) {
      const pt = getPointerPos(canvas, ev);
      for (let i = 0; i < boxRects.length; i++) {
        const r = boxRects[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
          if (r.kind === 'fem') {
            routeKey = 'fem';
            activeStep = 3;
          } else {
            activeStep = r.stepIdx;
          }
          updateUI();
          break;
        }
      }
    });

    function drawEdgeWithPulse(ctx, pts, color, active, dashed, phaseOff) {
      ctx.save();
      ctx.strokeStyle = active ? color : withAlpha(color, 0.35);
      ctx.lineWidth = active ? 2.8 : 1.7;
      if (dashed) ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
        else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead on final segment
      const n = pts.length;
      if (n >= 2) {
        const pA = pts[n - 2];
        const pB = pts[n - 1];
        const ang = Math.atan2(pB[1] - pA[1], pB[0] - pA[0]);
        const hl = 9;
        ctx.fillStyle = active ? color : withAlpha(color, 0.45);
        ctx.beginPath();
        ctx.moveTo(pB[0], pB[1]);
        ctx.lineTo(pB[0] - hl * Math.cos(ang - 0.42), pB[1] - hl * Math.sin(ang - 0.42));
        ctx.lineTo(pB[0] - hl * Math.cos(ang + 0.42), pB[1] - hl * Math.sin(ang + 0.42));
        ctx.closePath();
        ctx.fill();
      }

      // Animated pulse dot along polyline
      if (active) {
        let totalLen = 0;
        const segLens = [];
        for (let i = 1; i < pts.length; i++) {
          const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          segLens.push(d);
          totalLen += d;
        }
        if (totalLen > 1) {
          let targetD = ((pulseT * 0.65 + (phaseOff || 0)) % 1) * totalLen;
          for (let i = 0; i < segLens.length; i++) {
            if (targetD <= segLens[i] || i === segLens.length - 1) {
              const f = segLens[i] > 0 ? targetD / segLens[i] : 0;
              const px = lerp(pts[i][0], pts[i + 1][0], f);
              const py = lerp(pts[i][1], pts[i + 1][1], f);
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(px, py, 4.5, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            targetD -= segLens[i];
          }
        }
      }
      ctx.restore();
    }

    function draw() {
      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const rt = routes[routeKey];
      const rtCol = pal[rt.colorKey];
      const rtSoft = pal[rt.softKey];

      fillStageBg(ctx, w, h, pal);

      // 2-tier clean branched layout:
      // Top row:    [1. Model]   -> [2. Method] -> [3. Solve]
      // Bottom row: [FEM if needed] -> [4. Check] -> [5. Extract]
      const padX = Math.max(16, w * 0.045);
      const gapX = Math.max(26, w * 0.065);
      const boxW = Math.max(108, (w - padX * 2 - gapX * 2) / 3);
      const boxH = Math.max(58, Math.min(76, h * 0.27));
      const row1Y = Math.max(20, h * 0.14);
      const row2Y = Math.min(h - boxH - 22, Math.max(row1Y + boxH + 46, h * 0.60));

      const c0 = padX;
      const c1 = padX + boxW + gapX;
      const c2 = padX + (boxW + gapX) * 2;

      const bModel = { kind: 'step', stepIdx: 0, x: c0, y: row1Y, w: boxW, h: boxH, title: '1. Model', sub: 'Geometry & BCs' };
      const bMethod = { kind: 'step', stepIdx: 1, x: c1, y: row1Y, w: boxW, h: boxH, title: '2. Method', sub: rt.methodTag };
      const bSolve = { kind: 'step', stepIdx: 2, x: c2, y: row1Y, w: boxW, h: boxH, title: '3. Solve', sub: rt.solveTag };
      const bFem = { kind: 'fem', stepIdx: -1, x: c0, y: row2Y, w: boxW, h: boxH, title: 'FEM if needed', sub: 'Numerical check' };
      const bCheck = { kind: 'step', stepIdx: 3, x: c1, y: row2Y, w: boxW, h: boxH, title: '4. Check', sub: '∇·σ = 0 · BCs' };
      const bExtract = { kind: 'step', stepIdx: 4, x: c2, y: row2Y, w: boxW, h: boxH, title: '5. Extract', sub: 'Peak σ, K_I' };
      boxRects = [bModel, bMethod, bSolve, bFem, bCheck, bExtract];

      const midRowY = (row1Y + boxH + row2Y) * 0.5;
      const femActive = routeKey === 'fem';

      // Edges
      // 1 -> 2
      drawEdgeWithPulse(
        ctx,
        [[bModel.x + boxW, row1Y + boxH * 0.5], [bMethod.x - 2, row1Y + boxH * 0.5]],
        rtCol,
        activeStep >= 0,
        false,
        0.0
      );
      // 2 -> 3
      drawEdgeWithPulse(
        ctx,
        [[bMethod.x + boxW, row1Y + boxH * 0.5], [bSolve.x - 2, row1Y + boxH * 0.5]],
        rtCol,
        activeStep >= 1,
        false,
        0.25
      );
      // 3 -> 4 (step down cleanly through center corridor)
      drawEdgeWithPulse(
        ctx,
        [
          [bSolve.x + boxW * 0.5, row1Y + boxH],
          [bSolve.x + boxW * 0.5, midRowY],
          [bCheck.x + boxW * 0.5, midRowY],
          [bCheck.x + boxW * 0.5, row2Y - 2]
        ],
        rtCol,
        activeStep >= 2,
        false,
        0.5
      );
      // 4 -> 5
      drawEdgeWithPulse(
        ctx,
        [[bCheck.x + boxW, row2Y + boxH * 0.5], [bExtract.x - 2, row2Y + boxH * 0.5]],
        rtCol,
        activeStep >= 3,
        false,
        0.75
      );

      // Dashed FEM branch: 2. Method -> FEM if needed -> 4. Check
      drawEdgeWithPulse(
        ctx,
        [
          [bMethod.x + boxW * 0.35, row1Y + boxH],
          [bMethod.x + boxW * 0.35, midRowY],
          [bFem.x + boxW * 0.5, midRowY],
          [bFem.x + boxW * 0.5, row2Y - 2]
        ],
        pal.amber,
        femActive || activeStep === 3,
        true,
        0.15
      );
      drawEdgeWithPulse(
        ctx,
        [[bFem.x + boxW, row2Y + boxH * 0.5], [bCheck.x - 2, row2Y + boxH * 0.5]],
        pal.amber,
        femActive || activeStep === 3,
        true,
        0.6
      );

      // Draw all boxes (clean uniform rounded borders, zero AI-style left bars!)
      boxRects.forEach(function (b) {
        const isFemBox = b.kind === 'fem';
        const isSelected = !isFemBox && b.stepIdx === activeStep;
        const isPassed = !isFemBox && b.stepIdx < activeStep;
        const accent = isFemBox ? pal.amber : rtCol;
        const soft = isFemBox ? pal.amberSoft : rtSoft;

        ctx.save();
        roundRectPath(ctx, b.x, b.y, b.w, b.h, 10);
        ctx.fillStyle = isSelected || (isFemBox && femActive) ? soft : pal.surface2;
        ctx.fill();
        if (isFemBox) ctx.setLineDash([6, 4]);
        ctx.strokeStyle = isSelected || (isFemBox && femActive)
          ? accent
          : (isPassed ? withAlpha(accent, 0.55) : pal.border);
        ctx.lineWidth = isSelected || (isFemBox && femActive) ? 2.5 : 1.4;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        setFont(ctx, b.w < 142 ? 15 : 16, false, 600);
        ctx.fillStyle = isSelected || (isFemBox && femActive) ? accent : pal.text;
        ctx.fillText(b.title, b.x + b.w * 0.5, b.y + b.h * 0.34);

        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.fillText(b.sub, b.x + b.w * 0.5, b.y + b.h * 0.72);
        ctx.restore();
      });
    }

    bag.loop(api, function (dt) {
      pulseT += dt;
      draw();
    });

    bag.observe(stage, draw);
    updateUI();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () {
        bag.clear();
      }
    };
  });

  /* ==========================================================================
   * LAB 8: takeaways-bridge (Slide 22: Takeaways)
   * ========================================================================== */

  ME340.registerLab('takeaways-bridge', function (mountEl, api) {
    const bag = createBag();
    const components = {
      notch: {
        label: 'Notched Plate',
        elasticName: 'Kirsch / Airy φ',
        elasticSub: 'K_t ≈ 3 at notch root',
        plasticSub: 'Local J₂ root yield',
        fractureSub: 'Root flaw K_I vs K_Ic',
        ktFactor: 1.45,
        kFactor: 0.92,
        errPct: '0.8%'
      },
      vessel: {
        label: 'Pressure Vessel',
        elasticName: 'Lamé Thick Cylinder',
        elasticSub: 'Hoop σ_θ peak at r = a',
        plasticSub: 'Autofrettage J₂ ring',
        fractureSub: 'Axial crack K_I, J',
        ktFactor: 1.32,
        kFactor: 0.88,
        errPct: '1.1%'
      },
      roller: {
        label: 'Contact Roller',
        elasticName: 'Hertz Contact G_ij',
        elasticSub: 'Max shear at z = 0.78a',
        plasticSub: 'Subsurface J₂ pocket',
        fractureSub: 'Spalling crack K_I, J',
        ktFactor: 1.52,
        kFactor: 0.95,
        errPct: '1.4%'
      }
    };

    let compKey = 'notch';
    let loadFrac = 0.78; // 0.20 .. 1.15
    let focusStage = -1; // -1 = all, 0 = Elasticity, 1 = Plasticity, 2 = Fracture, 3 = Benchmark
    let animT = 0;
    let stageRects = [];

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');

    const compGroup = el('div', 'lab-pill-group');
    const compKeys = ['notch', 'vessel', 'roller'];
    const compBtns = compKeys.map(function (ck) {
      const b = el('button', 'lab-pill' + (ck === compKey ? ' is-active' : ''), components[ck].label);
      b.type = 'button';
      compGroup.appendChild(b);
      return b;
    });

    const statusBadge = el('span', 'lab-badge-status is-warn', 'Contained Plasticity');
    toolbar.appendChild(compGroup);
    toolbar.appendChild(statusBadge);

    const stage = el('div', 'lab-stage');
    const canvas = el('canvas', 'lab-canvas');
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'pointer';
    stage.appendChild(canvas);

    const controls = el('div', 'lab-controls-grid');
    const loadCtrl = createSliderControl(
      'Service Load Level',
      {
        min: 0.20,
        max: 1.15,
        step: 0.01,
        value: loadFrac,
        format: function (v) { return Math.round(v * 100) + '%'; }
      },
      function (v) {
        loadFrac = v;
        updateReadouts();
        draw();
      }
    );
    controls.appendChild(loadCtrl.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rModel = createReadoutChip('Elastic Model', components[compKey].elasticName);
    const rMises = createReadoutChip('Hotspot σ_eq / σ_Y', '1.13');
    const rFract = createReadoutChip('Crack K_I / K_Ic', '0.72');
    const rBench = createReadoutChip('Matlab Benchmark', '< 0.8% diff');
    readouts.appendChild(rModel.chip);
    readouts.appendChild(rMises.chip);
    readouts.appendChild(rFract.chip);
    readouts.appendChild(rBench.chip);

    const caption = el('p', 'lab-caption', 'Ramp the load or switch components to trace one structure from elastic field to J₂ yield, fracture K_I, and Matlab validation.');

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controls);
    shell.appendChild(readouts);
    shell.appendChild(caption);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    bag.on(loadCtrl.input, 'input', loadCtrl.handler);

    compBtns.forEach(function (b, i) {
      bag.on(b, 'click', function () {
        compKey = compKeys[i];
        compBtns.forEach(function (btn, j) {
          btn.classList.toggle('is-active', j === i);
        });
        updateReadouts();
        draw();
      });
    });

    bag.on(canvas, 'click', function (ev) {
      const pt = getPointerPos(canvas, ev);
      let hit = -1;
      for (let i = 0; i < stageRects.length; i++) {
        const r = stageRects[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
          hit = i;
          break;
        }
      }
      focusStage = (hit === focusStage) ? -1 : hit;
      draw();
    });

    function computeState() {
      const c = components[compKey];
      const misesRatio = loadFrac * c.ktFactor;
      const kRatio = loadFrac * c.kFactor;
      return { c: c, misesRatio: misesRatio, kRatio: kRatio };
    }

    function updateReadouts() {
      const st = computeState();
      rModel.valEl.textContent = st.c.elasticName;
      rMises.valEl.textContent = st.misesRatio.toFixed(2);
      rFract.valEl.textContent = st.kRatio.toFixed(2);
      rBench.valEl.textContent = '< ' + st.c.errPct + ' diff';

      if (st.kRatio >= 1.0) {
        setStatusBadge(statusBadge, 'Fracture Threshold', 'danger');
      } else if (st.misesRatio >= 1.0) {
        setStatusBadge(statusBadge, 'Contained Plasticity', 'warn');
      } else {
        setStatusBadge(statusBadge, 'Elastic Regime', 'safe');
      }
    }

    function drawNotchedPlate(ctx, x, y, w, h, st, pal) {
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      const pw = Math.min(w * 0.72, 136);
      const ph = Math.min(h * 0.70, 170);
      const nr = pw * 0.21;
      const px = cx - pw * 0.5;
      const py = cy - ph * 0.5;

      // Tension arrows
      drawArrow(ctx, cx - pw * 0.25, py - 4, cx - pw * 0.25, py - 20, pal.cardinal, 2, 7);
      drawArrow(ctx, cx + pw * 0.25, py - 4, cx + pw * 0.25, py - 20, pal.cardinal, 2, 7);
      drawArrow(ctx, cx - pw * 0.25, py + ph + 4, cx - pw * 0.25, py + ph + 20, pal.cardinal, 2, 7);
      drawArrow(ctx, cx + pw * 0.25, py + ph + 4, cx + pw * 0.25, py + ph + 20, pal.cardinal, 2, 7);

      // Notched plate contour
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + pw, py);
      ctx.lineTo(px + pw, cy - nr);
      ctx.arc(px + pw, cy, nr, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(px + pw, py + ph);
      ctx.lineTo(px, py + ph);
      ctx.lineTo(px, cy + nr);
      ctx.arc(px, cy, nr, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
      ctx.fillStyle = pal.surface2;
      ctx.fill();
      ctx.save();
      ctx.clip();

      // Elastic field streamlines
      const elAlpha = focusStage === -1 || focusStage === 0 ? 0.65 : 0.22;
      ctx.strokeStyle = withAlpha(pal.cardinal, elAlpha);
      ctx.lineWidth = 1.4;
      [-0.32, -0.16, 0, 0.16, 0.32].forEach(function (frac) {
        ctx.beginPath();
        for (let k = 0; k <= 24; k++) {
          const u = k / 24;
          const yy = py + u * ph;
          const pinch = Math.exp(-Math.pow((yy - cy) / (nr * 1.4), 2)) * 0.38;
          const xx = cx + frac * pw * (1 - pinch);
          if (k === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      });

      // Local J2 plastic zone at notch roots when misesRatio >= 0.85
      const rootL = px + nr;
      const rootR = px + pw - nr;
      if (st.misesRatio > 0.82) {
        const zp = clamp((st.misesRatio - 0.82) * 28, 4, pw * 0.26);
        const plAlpha = focusStage === -1 || focusStage === 1 ? 0.52 : 0.18;
        [rootL, rootR].forEach(function (rx) {
          const g = ctx.createRadialGradient(rx, cy, 1, rx, cy, zp);
          g.addColorStop(0, withAlpha(pal.teal, plAlpha + 0.25));
          g.addColorStop(1, withAlpha(pal.teal, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(rx, cy, zp, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Incipient crack at right notch root
      const crackLen = 6 + clamp(st.kRatio, 0, 1.2) * 16;
      ctx.strokeStyle = st.kRatio >= 1 ? pal.cardinal : pal.amber;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(rootR, cy);
      ctx.lineTo(rootR - crackLen, cy);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      return { hx: rootR, hy: cy };
    }

    function drawPressureVessel(ctx, x, y, w, h, st, pal) {
      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      const rOut = Math.min(w, h) * 0.36;
      const rIn = rOut * 0.48;

      ctx.save();
      // Thick-walled ring
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
      ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
      ctx.fillStyle = pal.surface2;
      ctx.fill('evenodd');

      // Elastic hoop stress gradient glow near inner wall
      const elG = ctx.createRadialGradient(cx, cy, rIn, cx, cy, rOut);
      elG.addColorStop(0, withAlpha(pal.cardinal, focusStage === -1 || focusStage === 0 ? 0.42 : 0.14));
      elG.addColorStop(1, withAlpha(pal.cardinal, 0.03));
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
      ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
      ctx.fillStyle = elG;
      ctx.fill('evenodd');

      // Autofrettage J2 plastic ring growing radially from r_in
      if (st.misesRatio > 0.85) {
        const rPlas = rIn + clamp((st.misesRatio - 0.85) / 0.9, 0.05, 0.72) * (rOut - rIn);
        ctx.beginPath();
        ctx.arc(cx, cy, rPlas, 0, Math.PI * 2);
        ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
        ctx.fillStyle = withAlpha(pal.teal, focusStage === -1 || focusStage === 1 ? 0.34 : 0.12);
        ctx.fill('evenodd');
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, rPlas, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Inner pressure arrows p_i
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2;
        const x1 = cx + (rIn * 0.32) * Math.cos(ang);
        const y1 = cy + (rIn * 0.32) * Math.sin(ang);
        const x2 = cx + (rIn * 0.86) * Math.cos(ang);
        const y2 = cy + (rIn * 0.86) * Math.sin(ang);
        drawArrow(ctx, x1, y1, x2, y2, pal.blue, 1.7, 6);
      }

      // Axial flaw at right inner wall
      const crackLen = 6 + clamp(st.kRatio, 0, 1.2) * (rOut - rIn) * 0.45;
      ctx.strokeStyle = st.kRatio >= 1 ? pal.cardinal : pal.amber;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx + rIn, cy);
      ctx.lineTo(cx + rIn + crackLen, cy);
      ctx.stroke();

      // Vessel borders
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      return { hx: cx + rIn + crackLen * 0.7, hy: cy };
    }

    function drawContactRoller(ctx, x, y, w, h, st, pal) {
      const cx = x + w * 0.5;
      const surfY = y + h * 0.56;
      const cylR = Math.min(w * 0.21, h * 0.20);
      const halfW = Math.min(w * 0.42, 92);
      const subH = Math.min(h * 0.34, 86);

      ctx.save();
      // Elastic half-space block
      roundRectPath(ctx, cx - halfW, surfY, halfW * 2, subH, 6);
      ctx.fillStyle = pal.surface2;
      ctx.fill();
      ctx.save();
      ctx.clip();

      // Hertzian subsurface stress contours peaking at z = 0.78a
      const contactA = cylR * 0.58;
      const peakZ = surfY + contactA * 0.78;
      [2.2, 1.5, 0.9].forEach(function (mult, idx) {
        ctx.beginPath();
        ctx.ellipse(cx, peakZ, contactA * mult, contactA * mult * 0.58, 0, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(pal.cardinal, (focusStage === -1 || focusStage === 0 ? 0.14 : 0.05) * (idx + 1));
        ctx.fill();
        ctx.strokeStyle = withAlpha(pal.cardinal, 0.45);
        ctx.lineWidth = 1.1;
        ctx.stroke();
      });

      // Subsurface J2 plastic pocket around z = 0.78a
      if (st.misesRatio > 0.85) {
        const rx = contactA * clamp((st.misesRatio - 0.85) * 1.15, 0.22, 1.0);
        const ry = rx * 0.56;
        ctx.beginPath();
        ctx.ellipse(cx, peakZ, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(pal.teal, focusStage === -1 || focusStage === 1 ? 0.42 : 0.14);
        ctx.fill();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Subsurface rolling-contact spalling crack
      const clen = 6 + clamp(st.kRatio, 0, 1.2) * 16;
      ctx.strokeStyle = st.kRatio >= 1 ? pal.cardinal : pal.amber;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx - clen * 0.4, peakZ);
      ctx.lineTo(cx + clen * 0.6, peakZ - 4);
      ctx.stroke();
      ctx.restore();

      // Half-space border
      roundRectPath(ctx, cx - halfW, surfY, halfW * 2, subH, 6);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Roller cylinder pressing down
      ctx.beginPath();
      ctx.arc(cx, surfY - cylR + 2, cylR, 0, Math.PI * 2);
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.strokeStyle = pal.blue;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Downward contact force arrow P
      drawArrow(ctx, cx, surfY - cylR * 2 - 14, cx, surfY - cylR * 2 + 4, pal.blue, 2.4, 8);
      ctx.restore();

      return { hx: cx + 10, hy: peakZ };
    }

    function draw() {
      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const st = computeState();

      fillStageBg(ctx, w, h, pal);

      const leftW = Math.max(150, w * 0.41);
      const rightX = leftW + 24;
      const rightW = Math.max(180, w - rightX - 16);

      // Left zone: live engineering component schematic
      let hotspot;
      if (compKey === 'notch') {
        hotspot = drawNotchedPlate(ctx, 10, 26, leftW - 14, h - 42, st, pal);
      } else if (compKey === 'vessel') {
        hotspot = drawPressureVessel(ctx, 10, 26, leftW - 14, h - 42, st, pal);
      } else {
        hotspot = drawContactRoller(ctx, 10, 26, leftW - 14, h - 42, st, pal);
      }

      // Component label at top-left (>= 15px)
      setFont(ctx, 15, false, 600);
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(st.c.label, 14, 10);

      // Right zone: 4 stacked synthesis cards
      const cards = [
        { title: 'I · Elasticity', sub: st.c.elasticSub, col: pal.cardinal, soft: pal.cardinalSoft, active: true },
        { title: 'II · Plasticity', sub: st.c.plasticSub, col: pal.teal, soft: pal.tealSoft, active: st.misesRatio >= 0.85 },
        { title: 'III · Fracture', sub: st.c.fractureSub, col: pal.amber, soft: pal.amberSoft, active: st.kRatio >= 0.5 },
        { title: 'Analytic vs Matlab', sub: 'Diff < ' + st.c.errPct, col: pal.blue, soft: pal.blueSoft, active: true }
      ];

      const padT = 8;
      const padB = 8;
      const gapY = clamp(h * 0.03, 5, 10);
      const cardH = Math.max(40, (h - padT - padB - gapY * 3) / 4);
      stageRects = [];

      // Curved feeder streams from component hotspot -> each synthesis card
      cards.forEach(function (card, idx) {
        const cy = padT + idx * (cardH + gapY);
        const midY = cy + cardH * 0.5;
        stageRects.push({ x: rightX, y: cy, w: rightW, h: cardH });

        const isFocused = focusStage === idx;
        const dimmed = focusStage >= 0 && !isFocused;

        // Smooth Bezier bridge from hotspot to card left edge
        const cpx1 = lerp(hotspot.hx, rightX, 0.45);
        const cpx2 = lerp(hotspot.hx, rightX, 0.55);
        ctx.save();
        ctx.strokeStyle = withAlpha(card.col, dimmed ? 0.16 : (card.active ? 0.72 : 0.28));
        ctx.lineWidth = isFocused ? 2.6 : 1.7;
        ctx.beginPath();
        ctx.moveTo(hotspot.hx, hotspot.hy);
        ctx.bezierCurveTo(cpx1, hotspot.hy, cpx2, midY, rightX - 2, midY);
        ctx.stroke();

        // Flowing particle along Bezier bridge
        if (!dimmed && card.active) {
          const t = (animT * 0.45 + idx * 0.24) % 1;
          const mt = 1 - t;
          const bx = mt * mt * mt * hotspot.hx + 3 * mt * mt * t * cpx1 + 3 * mt * t * t * cpx2 + t * t * t * (rightX - 2);
          const by = mt * mt * mt * hotspot.hy + 3 * mt * mt * t * hotspot.hy + 3 * mt * t * t * midY + t * t * t * midY;
          ctx.fillStyle = card.col;
          ctx.beginPath();
          ctx.arc(bx, by, 3.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Card container
        roundRectPath(ctx, rightX, cy, rightW, cardH, 9);
        ctx.fillStyle = isFocused ? card.soft : pal.surface2;
        ctx.fill();
        ctx.strokeStyle = isFocused || card.active ? withAlpha(card.col, dimmed ? 0.3 : 0.9) : pal.border;
        ctx.lineWidth = isFocused ? 2.2 : 1.3;
        ctx.stroke();

        // Text on left side of card (>= 15px)
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        setFont(ctx, 15, false, 600);
        ctx.fillStyle = dimmed ? pal.textMuted : card.col;
        ctx.fillText(card.title, rightX + 10, cy + cardH * 0.30);

        setFont(ctx, 15, false, 400);
        ctx.fillStyle = pal.text;
        ctx.fillText(card.sub, rightX + 10, cy + cardH * 0.72);

        // Live mini parity plot inside Card 4 (Analytic vs Matlab)
        if (idx === 3 && rightW > 240 && cardH >= 44) {
          const mx = rightX + rightW - 72;
          const my = cy + 6;
          const mw = 62;
          const mh = cardH - 12;
          ctx.strokeStyle = pal.border;
          ctx.lineWidth = 1;
          ctx.strokeRect(mx, my, mw, mh);
          // Analytic curve
          ctx.strokeStyle = pal.blue;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let k = 0; k <= 16; k++) {
            const u = k / 16;
            const px = mx + 4 + u * (mw - 8);
            const py = my + mh - 4 - Math.pow(u, 0.65) * (mh - 8);
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          // Discrete Matlab benchmark dots right on the curve
          ctx.fillStyle = pal.amber;
          [0.18, 0.42, 0.68, 0.90].forEach(function (u) {
            const px = mx + 4 + u * (mw - 8);
            const py = my + mh - 4 - Math.pow(u, 0.65) * (mh - 8);
            ctx.beginPath();
            ctx.arc(px, py, 2.8, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.restore();
      });
    }

    bag.loop(api, function (dt) {
      animT += dt;
      draw();
    });

    bag.observe(stage, draw);
    updateReadouts();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () {
        bag.clear();
      }
    };
  });
})();
