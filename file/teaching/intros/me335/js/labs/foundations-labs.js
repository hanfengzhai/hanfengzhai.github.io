(function () {
  'use strict';

  const ME335 = (window.ME335 = window.ME335 || {});
  const registerLab = function (id, fn) {
    if (typeof ME335.registerLab === 'function') {
      ME335.registerLab(id, fn);
    } else {
      ME335.labs = ME335.labs || {};
      ME335.labs[id] = fn;
    }
  };

  /* =========================================================================
   * Shared Typography, Color, Numerical Linear Algebra, Canvas & DOM Helpers
   * STRICT MINIMUM FONT FLOOR: Every ctx.font size is >= 15px.
   * ========================================================================= */

  const FONT_SANS = '500 15px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const FONT_SANS_BOLD = '600 15px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const FONT_TITLE = '600 16px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const FONT_MONO = '500 15px "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';
  const FONT_MONO_BOLD = '600 15px "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';

  // 8-point Gauss-Legendre rule on [-1, 1] for machine-precision 1D integration
  const GL8_X = [
    -0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498,
     0.1834346424956498,  0.5255324099163290,  0.7966664774136267,  0.9602898564975363
  ];
  const GL8_W = [
    0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620,
    0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763
  ];

  function integrate1D(fn, a, b, nPanels) {
    const panels = nPanels || 12;
    const h = (b - a) / panels;
    let sum = 0;
    for (let p = 0; p < panels; p++) {
      const x0 = a + p * h;
      const mid = x0 + 0.5 * h;
      const half = 0.5 * h;
      for (let q = 0; q < 8; q++) {
        sum += GL8_W[q] * fn(mid + half * GL8_X[q]);
      }
    }
    return sum * 0.5 * h;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function fmt(v, digits) {
    const d = typeof digits === 'number' ? digits : 2;
    if (!isFinite(v)) return 'Inf';
    const clean = Math.abs(v) < Math.pow(10, -(d + 2)) ? 0 : v;
    return clean.toFixed(d);
  }

  function fmtSci(v) {
    if (!isFinite(v)) return 'Inf';
    const av = Math.abs(v);
    if (av === 0) return '0.00';
    if (av >= 1e-2 && av < 1e3) return v.toFixed(av < 1 ? 3 : 2);
    return v.toExponential(2);
  }

  function solveLinearSystem(A, b) {
    const n = b.length;
    const M = new Array(n);
    const rhs = new Array(n);
    for (let i = 0; i < n; i++) {
      M[i] = A[i].slice();
      rhs[i] = b[i];
    }

    for (let k = 0; k < n; k++) {
      let piv = k;
      let maxVal = Math.abs(M[k][k]);
      for (let i = k + 1; i < n; i++) {
        const av = Math.abs(M[i][k]);
        if (av > maxVal) {
          maxVal = av;
          piv = i;
        }
      }
      if (maxVal < 1e-14) {
        return null;
      }
      if (piv !== k) {
        const tmpRow = M[k];
        M[k] = M[piv];
        M[piv] = tmpRow;
        const tmpB = rhs[k];
        rhs[k] = rhs[piv];
        rhs[piv] = tmpB;
      }
      const diag = M[k][k];
      for (let i = k + 1; i < n; i++) {
        const factor = M[i][k] / diag;
        if (factor === 0) continue;
        M[i][k] = 0;
        for (let j = k + 1; j < n; j++) {
          M[i][j] -= factor * M[k][j];
        }
        rhs[i] -= factor * rhs[k];
      }
    }

    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = rhs[i];
      for (let j = i + 1; j < n; j++) {
        s -= M[i][j] * x[j];
      }
      x[i] = s / M[i][i];
    }
    return x;
  }

  function computeConditionNumber1(A) {
    const n = A.length;
    let normA = 0;
    for (let j = 0; j < n; j++) {
      let colSum = 0;
      for (let i = 0; i < n; i++) colSum += Math.abs(A[i][j]);
      if (colSum > normA) normA = colSum;
    }
    let normInv = 0;
    for (let j = 0; j < n; j++) {
      const e = new Array(n).fill(0);
      e[j] = 1;
      const col = solveLinearSystem(A, e);
      if (!col) return Infinity;
      let colSum = 0;
      for (let i = 0; i < n; i++) colSum += Math.abs(col[i]);
      if (colSum > normInv) normInv = colSum;
    }
    return normA * normInv;
  }

  function parseColorRgb(color) {
    if (!color || typeof color !== 'string') return [209, 77, 65];
    if (color.charAt(0) === '#') {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      const num = parseInt(hex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }
    const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (m) {
      return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
    }
    return [128, 128, 128];
  }

  function withAlpha(color, alpha) {
    const rgb = parseColorRgb(color);
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + clamp(alpha, 0, 1).toFixed(3) + ')';
  }

  function mixRgb(c1, c2, t) {
    const k = clamp(t, 0, 1);
    return [
      Math.round(lerp(c1[0], c2[0], k)),
      Math.round(lerp(c1[1], c2[1], k)),
      Math.round(lerp(c1[2], c2[2], k))
    ];
  }

  function thermalFill(tNorm, pal, alphaScale) {
    const t = clamp(tNorm, 0, 1);
    const a = typeof alphaScale === 'number' ? alphaScale : 0.85;
    const c0 = parseColorRgb(pal.surface);
    const c1 = parseColorRgb(pal.teal);
    const c2 = parseColorRgb(pal.amber);
    const c3 = parseColorRgb(pal.cardinal);
    let rgb;
    if (t < 0.36) {
      rgb = mixRgb(c0, c1, t / 0.36);
    } else if (t < 0.72) {
      rgb = mixRgb(c1, c2, (t - 0.36) / 0.36);
    } else {
      rgb = mixRgb(c2, c3, (t - 0.72) / 0.28);
    }
    const alpha = clamp((0.08 + 0.92 * Math.pow(t, 0.78)) * a, 0.04, 0.96);
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha.toFixed(3) + ')';
  }

  function fitCanvas(canvas, fallbackMinH, responsiveOpts) {
    if (!canvas) return null;
    const parent = canvas.parentElement || canvas;
    let rect = parent.getBoundingClientRect();
    const rawW = Math.floor(rect.width);
    if (rawW >= 24) {
      if (responsiveOpts && responsiveOpts.breakpoint && responsiveOpts.minH) {
        if (rawW < responsiveOpts.breakpoint) {
          const targetH = Math.round(responsiveOpts.minH) + 'px';
          if (parent.style.minHeight !== targetH) {
            parent.style.minHeight = targetH;
            parent.dataset.responsiveMinH = '1';
            rect = parent.getBoundingClientRect();
          }
        } else if (parent.dataset.responsiveMinH === '1') {
          parent.style.minHeight = '';
          delete parent.dataset.responsiveMinH;
          rect = parent.getBoundingClientRect();
        }
      }
      if (rect.height < 90 && fallbackMinH) {
        parent.style.minHeight = fallbackMinH + 'px';
        rect = parent.getBoundingClientRect();
      }
    }
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w < 24 || h < 24) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const tw = Math.round(w * dpr);
    const th = Math.round(h * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h, dpr: dpr };
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, lineWidth, headLen) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1.5) return;
    const lw = lineWidth || 2.1;
    const hl = Math.min(headLen || 10, len * 0.48);
    const ux = dx / len;
    const uy = dy / len;
    const bx = x2 - ux * hl;
    const by = y2 - uy * hl;
    const px = -uy * (hl * 0.42);
    const py = ux * (hl * 0.42);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(bx, by);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(bx + px, by + py);
    ctx.lineTo(bx - px, by - py);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawDashed(ctx, x1, y1, x2, y2, color, dash, lw) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 1.4;
    ctx.setLineDash(dash || [5, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawRoundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r || 2, 2, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function drawLabelPill(ctx, text, x, y, pal, opts) {
    const o = opts || {};
    ctx.save();
    ctx.font = o.font || FONT_SANS_BOLD;
    const metrics = ctx.measureText(text);
    const padX = o.padX || 8;
    const boxH = o.boxH || 24;
    const boxW = metrics.width + padX * 2;
    const align = o.align || 'center';
    let rx = x - boxW * 0.5;
    if (align === 'left') rx = x;
    if (align === 'right') rx = x - boxW;
    let ry = y - boxH * 0.5;

    if (o.clampTo) {
      const pad = typeof o.clampPad === 'number' ? o.clampPad : 4;
      const minX = o.clampTo.x + pad;
      const maxX = Math.max(minX, o.clampTo.x + o.clampTo.w - boxW - pad);
      const minY = o.clampTo.y + pad;
      const maxY = Math.max(minY, o.clampTo.y + o.clampTo.h - boxH - pad);
      rx = clamp(rx, minX, maxX);
      ry = clamp(ry, minY, maxY);
    }

    drawRoundRect(ctx, rx, ry, boxW, boxH, 2);
    ctx.fillStyle = o.bg || pal.surface;
    ctx.fill();
    ctx.strokeStyle = o.border || pal.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = o.color || pal.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, rx + boxW * 0.5, ry + boxH * 0.5 + 0.5);
    ctx.restore();
  }

  function drawHatchWall(ctx, x, y1, y2, dirSign, pal, accent) {
    ctx.save();
    ctx.strokeStyle = accent || pal.teal;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();

    ctx.strokeStyle = withAlpha(accent || pal.teal, 0.6);
    ctx.lineWidth = 1.5;
    const step = 10;
    const depth = 10 * (dirSign || -1);
    for (let y = y1 + 3; y <= y2 - 2; y += step) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depth, y + 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDivider(ctx, x1, y1, x2, y2, pal) {
    ctx.save();
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlotFrame(ctx, box, pal, title, xLabel, yLabel) {
    ctx.save();
    if (title) {
      ctx.font = FONT_SANS_BOLD;
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(title, box.x + 8, box.y + 6);
    }
    if (xLabel) {
      ctx.font = FONT_SANS;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(xLabel, box.x + box.w - 8, box.y + box.h - 4);
    }
    if (yLabel) {
      ctx.font = FONT_SANS;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(yLabel, box.x + 8, box.y + (title ? 26 : 6));
    }
    ctx.restore();
  }

  function formatMathHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/_([A-Za-z0-9α-ωΑ-Ω]+)/g, '<sub>$1</sub>')
      .replace(/\^([A-Za-z0-9+\-]+)/g, '<sup>$1</sup>');
  }

  function createLabDom(mountEl, opts) {
    const o = opts || {};
    mountEl.innerHTML = '';

    const shell = document.createElement('div');
    shell.className = 'lab-shell';

    let toolbar = null;
    if (o.hasToolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'lab-toolbar';
      shell.appendChild(toolbar);
    }

    const touchAction = o.touchAction || 'pan-y';
    const stage = document.createElement('div');
    stage.className = 'lab-stage';
    stage.style.position = 'relative';
    stage.style.touchAction = touchAction;
    if (o.cursor) stage.style.cursor = o.cursor;

    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.touchAction = touchAction;
    canvas.style.cursor = o.cursor || 'default';
    stage.appendChild(canvas);
    shell.appendChild(stage);

    let readoutRow = null;
    const readouts = {};
    if (o.readouts && o.readouts.length) {
      readoutRow = document.createElement('div');
      readoutRow.className = 'lab-readout-row';
      o.readouts.forEach(function (item) {
        const chip = document.createElement('div');
        chip.className = 'lab-readout-chip';
        const keyEl = document.createElement('span');
        keyEl.className = 'lab-readout-key';
        keyEl.innerHTML = formatMathHtml(item.label);
        const valEl = document.createElement('span');
        valEl.className = 'lab-readout-val';
        valEl.textContent = item.value || '--';
        chip.appendChild(keyEl);
        chip.appendChild(valEl);
        readoutRow.appendChild(chip);
        readouts[item.id] = { chip: chip, key: keyEl, val: valEl };
      });
      shell.appendChild(readoutRow);
    }

    let controlsGrid = null;
    const sliders = {};
    if (o.sliders && o.sliders.length) {
      controlsGrid = document.createElement('div');
      controlsGrid.className = 'lab-controls-grid';
      o.sliders.forEach(function (s) {
        const wrap = document.createElement('div');
        wrap.className = 'lab-control';

        const head = document.createElement('div');
        head.className = 'lab-control-head';
        const labelEl = document.createElement('span');
        labelEl.innerHTML = formatMathHtml(s.label);
        const valEl = document.createElement('output');
        valEl.className = 'mono';
        valEl.textContent = s.format ? s.format(s.value) : String(s.value);
        head.appendChild(labelEl);
        head.appendChild(valEl);

        const input = document.createElement('input');
        input.type = 'range';
        input.className = 'lab-slider';
        input.min = String(s.min);
        input.max = String(s.max);
        input.step = String(s.step);
        input.value = String(s.value);
        input.setAttribute('aria-label', s.label);

        wrap.appendChild(head);
        wrap.appendChild(input);
        controlsGrid.appendChild(wrap);
        sliders[s.id] = { wrap: wrap, labelEl: labelEl, valEl: valEl, input: input, spec: s };
      });
      shell.appendChild(controlsGrid);
    }

    let captionEl = null;
    if (o.caption) {
      captionEl = document.createElement('div');
      captionEl.className = 'lab-caption';
      captionEl.innerHTML = formatMathHtml(o.caption);
      shell.appendChild(captionEl);
    }

    mountEl.appendChild(shell);

    return {
      shell: shell,
      toolbar: toolbar,
      stage: stage,
      canvas: canvas,
      readoutRow: readoutRow,
      readouts: readouts,
      controlsGrid: controlsGrid,
      sliders: sliders,
      captionEl: captionEl
    };
  }

  function createPillGroup(parent, items, activeId, onChange) {
    const group = document.createElement('div');
    group.className = 'lab-pill-group';
    const buttons = {};

    function setActive(id) {
      Object.keys(buttons).forEach(function (k) {
        buttons[k].classList.toggle('is-active', k === id);
      });
    }

    items.forEach(function (item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lab-pill' + (item.id === activeId ? ' is-active' : '');
      btn.innerHTML = formatMathHtml(item.label);
      btn.addEventListener('click', function () {
        if (!item.actionOnly) setActive(item.id);
        onChange(item.id);
      });
      group.appendChild(btn);
      buttons[item.id] = btn;
    });

    parent.appendChild(group);
    return { group: group, buttons: buttons, setActive: setActive };
  }

  /* =========================================================================
   * LAB 1: 'hero-fem-mesh' (Slide 01 Full-Bleed Triangulated FEM Thermal Mesh)
   * ========================================================================= */
  registerLab('hero-fem-mesh', function (mountEl, api) {
    mountEl.innerHTML = '';
    mountEl.style.touchAction = 'pan-y';
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.touchAction = 'pan-y';
    mountEl.appendChild(canvas);

    const pointer = {
      active: false,
      tx: 0.72,
      ty: 0.44,
      x: 0.72,
      y: 0.44,
      lastMoveMs: 0
    };

    function onPointerMove(ev) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const nx = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      const ny = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
      if (ev.pointerType === 'touch') {
        pointer.tx = lerp(pointer.tx, nx, 0.35);
        pointer.ty = lerp(pointer.ty, ny, 0.35);
      } else {
        pointer.tx = nx;
        pointer.ty = ny;
      }
      pointer.active = true;
      pointer.lastMoveMs = performance.now();
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });

    let meshCache = null;
    let timeSec = 0;

    function buildMesh(w, h) {
      const isNarrow = w < 520;
      const dx = isNarrow ? 50 : clamp(Math.round(Math.min(w, h) / 11.5), 54, 72);
      const dy = dx * 0.866;
      const cols = Math.ceil(w / dx) + 4;
      const rows = Math.ceil(h / dy) + 4;
      const ox = -dx * 1.5;
      const oy = -dy * 1.5;

      const nodes = [];
      for (let j = 0; j < rows; j++) {
        const shift = (j % 2) * 0.5 * dx;
        for (let i = 0; i < cols; i++) {
          const seed = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
          const r1 = seed - Math.floor(seed);
          const seed2 = Math.sin(i * 39.346 + j * 11.135) * 24634.6345;
          const r2 = seed2 - Math.floor(seed2);
          const jx = (r1 - 0.5) * dx * 0.34;
          const jy = (r2 - 0.5) * dy * 0.34;
          nodes.push({
            x: ox + i * dx + shift + jx,
            y: oy + j * dy + jy
          });
        }
      }

      const tris = [];
      for (let j = 0; j < rows - 1; j++) {
        const even = j % 2 === 0;
        for (let i = 0; i < cols - 1; i++) {
          const a = j * cols + i;
          const b = a + 1;
          const c = (j + 1) * cols + i;
          const d = c + 1;
          if (even) {
            tris.push([a, b, c]);
            tris.push([b, d, c]);
          } else {
            tris.push([a, b, d]);
            tris.push([a, d, c]);
          }
        }
      }
      return { w: w, h: h, nodes: nodes, tris: tris };
    }

    function renderFrame(dt, tNow) {
      const fit = fitCanvas(canvas);
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const isDark = pal.theme === 'dark';

      if (!meshCache || Math.abs(meshCache.w - w) > 8 || Math.abs(meshCache.h - h) > 8) {
        meshCache = buildMesh(w, h);
      }

      if (typeof tNow === 'number') timeSec = tNow;
      const stepDt = dt || 0.016;
      const idleSec = (performance.now() - pointer.lastMoveMs) / 1000;
      let targetX = pointer.tx;
      let targetY = pointer.ty;
      if (!pointer.active || idleSec > 4.5) {
        targetX = 0.72 + 0.14 * Math.cos(timeSec * 0.48);
        targetY = 0.44 + 0.16 * Math.sin(timeSec * 0.66);
      }

      const alpha = 1 - Math.exp(-7.5 * stepDt);
      pointer.x = lerp(pointer.x, targetX, alpha);
      pointer.y = lerp(pointer.y, targetY, alpha);

      const sx = pointer.x * w;
      const sy = pointer.y * h;
      const sx2 = (0.58 + 0.18 * Math.sin(timeSec * 0.34)) * w;
      const sy2 = (0.76 + 0.10 * Math.cos(timeSec * 0.42)) * h;
      const sig = Math.max(130, Math.min(w, h) * 0.27);
      const inv2Sig2 = 1 / (2 * sig * sig);
      const sig2 = sig * 0.85;
      const inv2Sig2b = 1 / (2 * sig2 * sig2);

      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, w, h);

      const nodes = meshCache.nodes;
      const tris = meshCache.tris;
      const nodalT = new Float32Array(nodes.length);

      for (let i = 0; i < nodes.length; i++) {
        const nx = nodes[i].x;
        const ny = nodes[i].y;
        const d1 = (nx - sx) * (nx - sx) + (ny - sy) * (ny - sy);
        const d2 = (nx - sx2) * (nx - sx2) + (ny - sy2) * (ny - sy2);
        const wave = 0.06 * (0.5 + 0.5 * Math.sin(nx * 0.008 - timeSec * 0.7) * Math.cos(ny * 0.008 + timeSec * 0.5));
        nodalT[i] = clamp(Math.exp(-d1 * inv2Sig2) + 0.36 * Math.exp(-d2 * inv2Sig2b) + wave, 0, 1);
      }

      // Shade triangles by centroid thermal value and collect flux arrows
      const fluxes = [];
      for (let e = 0; e < tris.length; e++) {
        const t = tris[e];
        const n0 = nodes[t[0]], n1 = nodes[t[1]], n2 = nodes[t[2]];
        const T0 = nodalT[t[0]], T1 = nodalT[t[1]], T2 = nodalT[t[2]];
        const Tc = (T0 + T1 + T2) / 3;

        if (Tc > 0.08) {
          ctx.beginPath();
          ctx.moveTo(n0.x, n0.y);
          ctx.lineTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.closePath();
          ctx.fillStyle = thermalFill(Tc, pal, isDark ? 0.34 : 0.25);
          ctx.fill();
        }

        if (Tc > 0.26) {
          // Exact P1 constant gradient grad(T) on triangle
          const twoA = (n1.x - n0.x) * (n2.y - n0.y) - (n2.x - n0.x) * (n1.y - n0.y);
          if (Math.abs(twoA) > 40) {
            const gx = ((n1.y - n2.y) * T0 + (n2.y - n0.y) * T1 + (n0.y - n1.y) * T2) / twoA;
            const gy = ((n2.x - n1.x) * T0 + (n0.x - n2.x) * T1 + (n1.x - n0.x) * T2) / twoA;
            const gMag = Math.hypot(gx, gy);
            if (gMag > 1e-4) {
              fluxes.push({
                cx: (n0.x + n1.x + n2.x) / 3,
                cy: (n0.y + n1.y + n2.y) / 3,
                qx: -gx / gMag,
                qy: -gy / gMag,
                mag: clamp(gMag * sig * 0.85, 0.2, 1),
                T: Tc
              });
            }
          }
        }
      }

      // Draw crisp triangular mesh edges
      ctx.lineWidth = isDark ? 1.0 : 1.1;
      ctx.strokeStyle = isDark ? 'rgba(236, 232, 224, 0.11)' : 'rgba(26, 25, 23, 0.16)';
      ctx.beginPath();
      for (let e = 0; e < tris.length; e++) {
        const t = tris[e];
        const n0 = nodes[t[0]], n1 = nodes[t[1]], n2 = nodes[t[2]];
        ctx.moveTo(n0.x, n0.y);
        ctx.lineTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.lineTo(n0.x, n0.y);
      }
      ctx.stroke();

      // Highlight warm element edges near pointer
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, sig * 1.08, 0, Math.PI * 2);
      ctx.clip();
      ctx.lineWidth = 1.35;
      ctx.strokeStyle = withAlpha(pal.teal, isDark ? 0.36 : 0.42);
      ctx.beginPath();
      for (let e = 0; e < tris.length; e++) {
        const t = tris[e];
        const n0 = nodes[t[0]], n1 = nodes[t[1]], n2 = nodes[t[2]];
        ctx.moveTo(n0.x, n0.y);
        ctx.lineTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.lineTo(n0.x, n0.y);
      }
      ctx.stroke();
      ctx.restore();

      // Draw nodal dots in active zone
      for (let i = 0; i < nodes.length; i++) {
        const T = nodalT[i];
        if (T > 0.18) {
          ctx.beginPath();
          ctx.arc(nodes[i].x, nodes[i].y, 2.2 + 1.8 * T, 0, Math.PI * 2);
          ctx.fillStyle = withAlpha(T > 0.65 ? pal.cardinal : pal.teal, 0.35 + 0.55 * T);
          ctx.fill();
        }
      }

      // Draw subtle Fourier heat flux vectors q = -k grad(T)
      for (let k = 0; k < fluxes.length; k++) {
        const f = fluxes[k];
        const len = 8 + 11 * f.mag;
        drawArrow(
          ctx,
          f.cx - f.qx * len * 0.45,
          f.cy - f.qy * len * 0.45,
          f.cx + f.qx * len * 0.55,
          f.cy + f.qy * len * 0.55,
          withAlpha(f.T > 0.62 ? pal.cardinal : pal.amber, 0.32 + 0.45 * f.T),
          1.4,
          6
        );
      }

      // Thermal source indicator ring
      ctx.save();
      ctx.strokeStyle = withAlpha(pal.cardinal, isDark ? 0.55 : 0.45);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(sx, sy, 13 + 2.4 * Math.sin(timeSec * 3.0), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = pal.cardinal;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const stopLoop = api.registerAnimationLoop(function (dt, tNow) {
      renderFrame(dt, tNow);
    });
    renderFrame(0.016, 0);

    return {
      onResize: function () { renderFrame(0.016, timeSec); },
      onThemeChange: function () { renderFrame(0.016, timeSec); },
      onSlideEnter: function () { renderFrame(0.016, timeSec); },
      destroy: function () {
        stopLoop();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerleave', onPointerLeave);
      }
    };
  });

  /* =========================================================================
   * LAB 2: 'domain-dimensions' (Slide 02: 1D / 2D / 3D Mesh Discretization)
   * Direct interactive realization of FEARev.pdf Figs. 1-3.
   * ========================================================================= */
  registerLab('domain-dimensions', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'nel', label: 'Elements Ω_e', value: '4' },
        { id: 'nodes', label: 'Nodes', value: '5' },
        { id: 'bcs', label: 'BCs', value: 'Γ_D + Γ_N' }
      ],
      sliders: [
        {
          id: 'refine',
          label: 'Mesh Refinement Level',
          min: 1,
          max: 3,
          step: 1,
          value: 1,
          format: function (v) { return v === 1 ? 'Coarse (FEARev)' : v === 2 ? 'Medium' : 'Fine'; }
        }
      ]
    });

    let mode = '1d';
    let refineLevel = 1;

    createPillGroup(dom.toolbar, [
      { id: '1d', label: '1D Bar' },
      { id: '2d', label: '2D Plate' },
      { id: '3d', label: '3D Block' }
    ], '1d', function (id) {
      mode = id;
      render();
    });

    const badge = document.createElement('span');
    badge.className = 'lab-badge-status';
    badge.textContent = 'FEARev Figs. 1-3';
    dom.toolbar.appendChild(badge);

    dom.sliders.refine.input.addEventListener('input', function () {
      refineLevel = parseInt(dom.sliders.refine.input.value, 10);
      dom.sliders.refine.valEl.textContent = dom.sliders.refine.spec.format(refineLevel);
      render();
    });

    function render() {
      const fit = fitCanvas(dom.canvas, 240, { breakpoint: 480, minH: 270 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const box = { x: 8, y: 8, w: w - 16, h: h - 16 };

      ctx.clearRect(0, 0, w, h);

      // Subtle drafting grid
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 28; gx < w; gx += 28) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
      for (let gy = 28; gy < h; gy += 28) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
      ctx.stroke();

      if (mode === '1d') {
        const nEl = refineLevel === 1 ? 4 : refineLevel === 2 ? 6 : 8;
        const nNodes = nEl + 1;
        dom.readouts.nel.val.textContent = String(nEl);
        dom.readouts.nodes.val.textContent = String(nNodes);
        dom.readouts.bcs.val.innerHTML = formatMathHtml('x=0 u_D · x=L t_N');
        badge.textContent = 'Fig. 1 · 1D';

        const padL = clamp(w * 0.14, 56, 86);
        const padR = clamp(w * 0.18, 74, 110);
        const x0 = padL;
        const x1 = w - padR;
        const barW = Math.max(120, x1 - x0);
        const cy = h * 0.52;
        const barH = 30;
        const dx = barW / nEl;

        // Element fills alternating gently
        for (let e = 0; e < nEl; e++) {
          const ex = x0 + e * dx;
          ctx.fillStyle = withAlpha(e % 2 === 0 ? pal.blue : pal.teal, pal.theme === 'dark' ? 0.16 : 0.12);
          ctx.fillRect(ex, cy - barH * 0.5, dx, barH);
          ctx.strokeStyle = pal.axis;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(ex, cy - barH * 0.5, dx, barH);

          if (nEl <= 6 || e % 2 === 0) {
            ctx.font = FONT_MONO_BOLD;
            ctx.fillStyle = pal.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Ω' + (e + 1), ex + dx * 0.5, cy);
          }
        }

        // Hatched Dirichlet wall at x = 0 (kept clear above x1 node label)
        drawHatchWall(ctx, x0, cy - 38, cy + 20, -1, pal, pal.teal);
        drawLabelPill(ctx, 'Γ_D: u = u_D', x0 + 6, cy - 58, pal, {
          color: pal.teal,
          border: withAlpha(pal.teal, 0.55),
          align: 'left',
          clampTo: box
        });

        // Neumann traction arrow at x = L
        const arrowEnd = Math.min(w - 18, x1 + 56);
        drawArrow(ctx, x1 + 6, cy, arrowEnd, cy, pal.cardinal, 2.8, 11);
        drawLabelPill(ctx, 'Γ_N: t_N', x1 + 4, cy - 42, pal, {
          color: pal.cardinal,
          border: withAlpha(pal.cardinal, 0.55),
          align: 'center',
          clampTo: box
        });

        // Nodal circles & labels
        for (let i = 0; i < nNodes; i++) {
          const nx = x0 + i * dx;
          ctx.beginPath();
          ctx.arc(nx, cy, 5.2, 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? pal.teal : pal.surface;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = i === 0 ? pal.teal : pal.cardinal;
          ctx.stroke();

          if (nNodes <= 7 || i === 0 || i === nNodes - 1 || i % 2 === 0) {
            ctx.font = FONT_MONO;
            ctx.fillStyle = pal.textMuted;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('x' + (i + 1), nx, cy + barH * 0.5 + 16);
          }
        }

        // Borderless top header text
        ctx.font = FONT_SANS_BOLD;
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('1D Linear Mesh: Ω = ⋃ Ω_e', w * 0.5, 12);

      } else if (mode === '2d') {
        const n = refineLevel === 1 ? 2 : refineLevel === 2 ? 3 : 4;
        const nEl = n * n;
        const nNodes = (n + 1) * (n + 1);
        dom.readouts.nel.val.textContent = String(nEl) + ' (' + n + '×' + n + ')';
        dom.readouts.nodes.val.textContent = String(nNodes);
        dom.readouts.bcs.val.innerHTML = formatMathHtml('Left Γ_D · Right Γ_N');
        badge.textContent = 'Fig. 2 · 2D';

        const side = clamp(Math.min(w * 0.52, h * 0.64), 126, 230);
        const ox = w * 0.5 - side * 0.52;
        const oy = h * 0.54 - side * 0.5;
        const cell = side / n;

        // Draw elements
        let elemNum = 1;
        for (let row = 0; row < n; row++) {
          for (let col = 0; col < n; col++) {
            const ex = ox + col * cell;
            const ey = oy + row * cell;
            const isFocus = row === 0 && col === n - 1;
            ctx.fillStyle = isFocus
              ? withAlpha(pal.amber, pal.theme === 'dark' ? 0.22 : 0.16)
              : withAlpha(pal.blue, pal.theme === 'dark' ? 0.10 : 0.08);
            ctx.fillRect(ex, ey, cell, cell);
            ctx.strokeStyle = pal.axis;
            ctx.lineWidth = 1.3;
            ctx.strokeRect(ex, ey, cell, cell);
            if (n <= 2 || isFocus) {
              ctx.font = FONT_MONO_BOLD;
              ctx.fillStyle = isFocus ? pal.amber : pal.text;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(n <= 2 ? 'Ω' + elemNum : 'Ω_e', ex + cell * 0.5, ey + cell * 0.5);
            }
            elemNum++;
          }
        }

        // Left Dirichlet edge
        drawHatchWall(ctx, ox, oy - 4, oy + side + 4, -1, pal, pal.teal);
        drawLabelPill(ctx, 'Γ_D: u=u_D', ox - 16, oy + side * 0.5, pal, {
          color: pal.teal,
          border: withAlpha(pal.teal, 0.55),
          align: 'right',
          clampTo: box
        });

        // Right Neumann flux arrows
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(ox + side, oy);
        ctx.lineTo(ox + side, oy + side);
        ctx.stroke();

        const arrowCount = Math.min(4, n + 1);
        for (let k = 0; k < arrowCount; k++) {
          const ay = oy + (side / (arrowCount + 1)) * (k + 1);
          drawArrow(ctx, ox + side + 5, ay, ox + side + 44, ay, pal.cardinal, 2.2, 9);
        }
        drawLabelPill(ctx, 'Γ_N: t_N', ox + side + 48, oy + side * 0.5, pal, {
          color: pal.cardinal,
          border: withAlpha(pal.cardinal, 0.55),
          align: 'left',
          clampTo: box
        });

        // Nodes
        for (let r = 0; r <= n; r++) {
          for (let c = 0; c <= n; c++) {
            const nx = ox + c * cell;
            const ny = oy + r * cell;
            ctx.beginPath();
            ctx.arc(nx, ny, 4.2, 0, Math.PI * 2);
            ctx.fillStyle = c === 0 ? pal.teal : pal.surface;
            ctx.fill();
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = c === 0 ? pal.teal : pal.text;
            ctx.stroke();
          }
        }

        ctx.font = FONT_SANS_BOLD;
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('2D Mesh: ∂Ω = Γ_D ∪ Γ_N', w * 0.5, 10);

      } else {
        // 3D Isometric / Oblique Hexahedral Block
        const n = refineLevel === 1 ? 2 : refineLevel === 2 ? 3 : 4;
        const nEl = n * n * n;
        const nNodes = (n + 1) * (n + 1) * (n + 1);
        dom.readouts.nel.val.textContent = String(nEl) + ' (' + n + '³)';
        dom.readouts.nodes.val.textContent = String(nNodes);
        dom.readouts.bcs.val.innerHTML = formatMathHtml('Left Γ_D · Right Γ_N');
        badge.textContent = 'Fig. 3 · 3D';

        const L = clamp(Math.min(w * 0.34, h * 0.44), 86, 150);
        const depthX = L * 0.50;
        const depthY = -L * 0.34;
        const fx = w * 0.5 - L * 0.72;
        const fy = h * 0.62 - L * 0.36;

        function proj(u, v, z) {
          return {
            x: fx + u * L + z * depthX,
            y: fy + (1 - v) * L + z * depthY
          };
        }

        // Front face fill
        const p000 = proj(0, 0, 0), p100 = proj(1, 0, 0), p110 = proj(1, 1, 0), p010 = proj(0, 1, 0);
        const p001 = proj(0, 0, 1), p101 = proj(1, 0, 1), p111 = proj(1, 1, 1), p011 = proj(0, 1, 1);

        // Hidden back edges
        drawDashed(ctx, p000.x, p000.y, p001.x, p001.y, withAlpha(pal.axis, 0.55), [4, 4], 1.2);
        drawDashed(ctx, p001.x, p001.y, p101.x, p101.y, withAlpha(pal.axis, 0.55), [4, 4], 1.2);
        drawDashed(ctx, p001.x, p001.y, p011.x, p011.y, withAlpha(pal.axis, 0.55), [4, 4], 1.2);

        // Left Dirichlet face (shaded subtle teal hint behind front)
        ctx.fillStyle = withAlpha(pal.teal, pal.theme === 'dark' ? 0.14 : 0.11);
        ctx.beginPath();
        ctx.moveTo(p000.x, p000.y); ctx.lineTo(p010.x, p010.y);
        ctx.lineTo(p011.x, p011.y); ctx.lineTo(p001.x, p001.y);
        ctx.closePath();
        ctx.fill();

        // Front face
        ctx.fillStyle = withAlpha(pal.blue, pal.theme === 'dark' ? 0.14 : 0.10);
        ctx.beginPath();
        ctx.moveTo(p000.x, p000.y); ctx.lineTo(p100.x, p100.y);
        ctx.lineTo(p110.x, p110.y); ctx.lineTo(p010.x, p010.y);
        ctx.closePath();
        ctx.fill();

        // Top face
        ctx.fillStyle = withAlpha(pal.surface2, pal.theme === 'dark' ? 0.72 : 0.85);
        ctx.beginPath();
        ctx.moveTo(p010.x, p010.y); ctx.lineTo(p110.x, p110.y);
        ctx.lineTo(p111.x, p111.y); ctx.lineTo(p011.x, p011.y);
        ctx.closePath();
        ctx.fill();

        // Right face (Neumann surface)
        ctx.fillStyle = withAlpha(pal.cardinal, pal.theme === 'dark' ? 0.18 : 0.13);
        ctx.beginPath();
        ctx.moveTo(p100.x, p100.y); ctx.lineTo(p101.x, p101.y);
        ctx.lineTo(p111.x, p111.y); ctx.lineTo(p110.x, p110.y);
        ctx.closePath();
        ctx.fill();

        // Highlight one corner hexahedron element Omega_e
        const d1 = 1 / n;
        const eTop = [proj(1 - d1, 1, 0), proj(1, 1, 0), proj(1, 1, d1), proj(1 - d1, 1, d1)];
        ctx.fillStyle = withAlpha(pal.amber, pal.theme === 'dark' ? 0.34 : 0.28);
        ctx.beginPath();
        ctx.moveTo(eTop[0].x, eTop[0].y); ctx.lineTo(eTop[1].x, eTop[1].y);
        ctx.lineTo(eTop[2].x, eTop[2].y); ctx.lineTo(eTop[3].x, eTop[3].y);
        ctx.closePath();
        ctx.fill();

        // Grid lines on Front, Top, and Right faces
        ctx.strokeStyle = pal.axis;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let k = 0; k <= n; k++) {
          const t = k / n;
          // Front
          let a = proj(t, 0, 0), b = proj(t, 1, 0);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          a = proj(0, t, 0); b = proj(1, t, 0);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          // Top
          a = proj(t, 1, 0); b = proj(t, 1, 1);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          a = proj(0, 1, t); b = proj(1, 1, t);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          // Right
          a = proj(1, 0, t); b = proj(1, 1, t);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          a = proj(1, t, 0); b = proj(1, t, 1);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        }
        ctx.stroke();

        // Dirichlet clamp line on left front edge
        drawHatchWall(ctx, p000.x, p010.y, p000.y, -1, pal, pal.teal);
        drawLabelPill(ctx, 'Γ_D: u=u_D', p000.x - 14, 0.5 * (p000.y + p010.y), pal, {
          color: pal.teal,
          border: withAlpha(pal.teal, 0.55),
          align: 'right',
          clampTo: box
        });

        // Neumann arrows out of right face
        for (let k = 0; k < 3; k++) {
          const anchor = proj(1, 0.25 + k * 0.25, 0.5);
          drawArrow(ctx, anchor.x + 2, anchor.y, anchor.x + 42, anchor.y, pal.cardinal, 2.2, 9);
        }
        const rightMid = proj(1, 0.5, 0.5);
        drawLabelPill(ctx, 'Γ_N: t_N', rightMid.x + 46, rightMid.y, pal, {
          color: pal.cardinal,
          border: withAlpha(pal.cardinal, 0.55),
          align: 'left',
          clampTo: box
        });

        // Label highlighted element
        const ec = proj(1 - 0.5 * d1, 1, 0.5 * d1);
        drawLabelPill(ctx, 'Ω_e', ec.x + 6, ec.y - 22, pal, {
          color: pal.amber,
          border: withAlpha(pal.amber, 0.6),
          clampTo: box
        });

        // Visible corner nodes on front/top/right
        const visPts = [p000, p100, p110, p010, p101, p111, p011];
        visPts.forEach(function (pt, idx) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = (idx === 0 || idx === 3 || idx === 6) ? pal.teal : pal.cardinal;
          ctx.fill();
        });

        ctx.font = FONT_SANS_BOLD;
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('3D Hexahedral Mesh: Ω ⊂ ℝ³', w * 0.5, 10);
      }
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render
    };
  });

  /* =========================================================================
   * LAB 3: 'fem-pipeline' (Slide 03: Interactive 3-Stage Course Progression)
   * ========================================================================= */
  registerLab('fem-pipeline', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: false,
      cursor: 'pointer'
    });

    const stages = [
      {
        id: 'part-1',
        num: '01',
        title: 'I. Variational & 1D',
        sub1: 'Weak form a(u,v) = l(v)',
        sub2: 'S, V, Hat, Hermite & LG',
        targetId: 'strong-to-weak',
        accentKey: 'cardinal',
        edgeLabel: 'Discretize'
      },
      {
        id: 'part-2',
        num: '02',
        title: 'II. 2D/3D & Solvers',
        sub1: 'Iso-maps, Gauss, P1/Q4',
        sub2: 'Elasticity, BCs & UFL',
        targetId: 'element-families',
        accentKey: 'teal',
        edgeLabel: 'Analyze'
      },
      {
        id: 'part-3',
        num: '03',
        title: 'III. Math Theory',
        sub1: 'L² & H¹ Sobolev Norms',
        sub2: "Céa's Lemma & O(hᵖ)",
        targetId: 'sobolev-norms',
        accentKey: 'amber',
        edgeLabel: ''
      }
    ];

    let hoveredIdx = -1;
    let boxes = [];
    let timeSec = 0;

    function hitIndex(pos) {
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
          return i;
        }
      }
      return -1;
    }

    dom.canvas.addEventListener('pointermove', function (ev) {
      const rect = dom.canvas.getBoundingClientRect();
      const idx = hitIndex({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
      if (idx !== hoveredIdx) {
        hoveredIdx = idx;
        dom.canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
      }
    });

    dom.canvas.addEventListener('pointerleave', function () {
      hoveredIdx = -1;
      dom.canvas.style.cursor = 'default';
    });

    dom.canvas.addEventListener('click', function (ev) {
      const rect = dom.canvas.getBoundingClientRect();
      const idx = hitIndex({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
      if (idx >= 0) {
        api.goToSlide(stages[idx].targetId);
      }
    });

    function render(dt, tNow) {
      const fit = fitCanvas(dom.canvas, 210, { breakpoint: 740, minH: 360 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const vertical = w < 740;
      if (typeof tNow === 'number') timeSec = tNow;

      ctx.clearRect(0, 0, w, h);

      // Subtle architectural grid
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 32; gx < w; gx += 32) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
      for (let gy = 32; gy < h; gy += 32) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
      ctx.stroke();

      boxes = [];
      const padX = vertical ? 16 : 24;
      const padY = vertical ? 16 : Math.max(22, (h - 156) * 0.5);

      if (!vertical) {
        const gap = clamp(w * 0.095, 98, 118);
        const cardW = (w - 2 * padX - 2 * gap) / 3;
        const cardH = clamp(h - 2 * padY, 118, 168);
        const cy = (h - cardH) * 0.5;
        for (let i = 0; i < 3; i++) {
          boxes.push({ x: padX + i * (cardW + gap), y: cy, w: cardW, h: cardH });
        }
      } else {
        const gap = 30;
        const cardW = w - 2 * padX;
        const cardH = (h - 2 * padY - 2 * gap) / 3;
        for (let i = 0; i < 3; i++) {
          boxes.push({ x: padX, y: padY + i * (cardH + gap), w: cardW, h: cardH });
        }
      }

      // Draw connecting arrows + animated pulse
      const pulsePhase = (timeSec * 0.42) % 1;
      for (let i = 0; i < 2; i++) {
        const a = boxes[i];
        const b = boxes[i + 1];
        const accent = pal[stages[i].accentKey];
        if (!vertical) {
          const x1 = a.x + a.w + 4;
          const x2 = b.x - 4;
          const my = a.y + a.h * 0.5;
          drawArrow(ctx, x1, my, x2, my, pal.axis, 2.2, 10);
          ctx.font = FONT_MONO;
          ctx.fillStyle = pal.textMuted;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(stages[i].edgeLabel, 0.5 * (x1 + x2), my - 10);

          const px = lerp(x1, x2 - 8, pulsePhase);
          ctx.beginPath();
          ctx.arc(px, my, 4.2, 0, Math.PI * 2);
          ctx.fillStyle = accent;
          ctx.fill();
        } else {
          const mx = a.x + a.w * 0.5;
          const y1 = a.y + a.h + 4;
          const y2 = b.y - 4;
          drawArrow(ctx, mx, y1, mx, y2, pal.axis, 2.2, 10);
          const py = lerp(y1, y2 - 8, pulsePhase);
          ctx.beginPath();
          ctx.arc(mx, py, 4.0, 0, Math.PI * 2);
          ctx.fillStyle = accent;
          ctx.fill();
        }
      }

      // Draw stage cards
      for (let i = 0; i < 3; i++) {
        const b = boxes[i];
        const st = stages[i];
        const accent = pal[st.accentKey];
        const isHov = hoveredIdx === i;

        drawRoundRect(ctx, b.x, b.y, b.w, b.h, 2);
        ctx.fillStyle = isHov ? pal.surface2 : pal.surface;
        ctx.fill();
        ctx.strokeStyle = isHov ? accent : pal.border;
        ctx.lineWidth = isHov ? 2.0 : 1.2;
        ctx.stroke();

        // Top semantic rule bar
        ctx.fillStyle = accent;
        ctx.fillRect(b.x, b.y, b.w, 4);

        // Number + Open cue
        ctx.font = FONT_MONO_BOLD;
        ctx.fillStyle = accent;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(st.num, b.x + 14, b.y + 14);

        ctx.font = FONT_MONO;
        ctx.fillStyle = isHov ? accent : pal.textMuted;
        ctx.textAlign = 'right';
        ctx.fillText('Open →', b.x + b.w - 14, b.y + 14);

        // Title
        ctx.font = FONT_TITLE;
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(st.title, b.x + 14, b.y + 38);

        // Two clean lines
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.fillText(st.sub1, b.x + 14, b.y + 66);
        if (b.h >= 106) {
          ctx.fillText(st.sub2, b.x + 14, b.y + 88);
        }
      }
    }

    const stopLoop = api.registerAnimationLoop(function (dt, tNow) {
      render(dt, tNow);
    });
    render(0.016, 0);

    return {
      onResize: function () { render(0.016, timeSec); },
      onThemeChange: function () { render(0.016, timeSec); },
      onSlideEnter: function () { render(0.016, timeSec); },
      destroy: function () { stopLoop(); }
    };
  });

  /* =========================================================================
   * LAB 4: 'weighted-residuals' (Slide 05: Real 1D MWR Solver)
   * BVP: -u'' = 1 + 4x on (0,1), u(0) = 0, u'(1) = 0
   * Exact: u(x) = 3x - 0.5 x^2 - (2/3) x^3
   * Non-orthogonal admissible basis: phi_k(x) = sin^k(pi*x/2), k = 1..M
   * ========================================================================= */
  registerLab('weighted-residuals', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'rL2', label: '||R_Ω||_L2', value: '--' },
        { id: 'uL2', label: '||u - û||_L2', value: '--' },
        { id: 'uMax', label: 'Max |e|', value: '--' }
      ]
    });

    let method = 'galerkin';
    let degreeM = 2;

    createPillGroup(dom.toolbar, [
      { id: 'galerkin', label: 'Galerkin' },
      { id: 'collocation', label: 'Collocation' },
      { id: 'subdomain', label: 'Subdomain' },
      { id: 'leastsquares', label: 'Least Sq.' }
    ], 'galerkin', function (id) {
      method = id;
      render();
    });

    createPillGroup(dom.toolbar, [
      { id: '1', label: 'M=1' },
      { id: '2', label: 'M=2' },
      { id: '3', label: 'M=3' }
    ], '2', function (id) {
      degreeM = parseInt(id, 10);
      render();
    });

    function fLoad(x) {
      return 1 + 4 * x;
    }

    function uExact(x) {
      return 3 * x - 0.5 * x * x - (2 / 3) * x * x * x;
    }

    // Admissible basis phi_k(x) = sin^k(pi*x/2) satisfying phi_k(0)=0 and phi_k'(1)=0
    const HALF_PI = 0.5 * Math.PI;
    const HALF_PI_SQ = HALF_PI * HALF_PI;

    function phiVal(k, x) {
      return Math.pow(Math.sin(HALF_PI * x), k);
    }

    function phiDeriv1(k, x) {
      const s = Math.sin(HALF_PI * x);
      const c = Math.cos(HALF_PI * x);
      return k * HALF_PI * (k === 1 ? 1 : Math.pow(s, k - 1)) * c;
    }

    // Returns L(phi_k) = -phi_k''(x)
    function negPhiDeriv2(k, x) {
      const s = Math.sin(HALF_PI * x);
      const c = Math.cos(HALF_PI * x);
      if (k === 1) {
        return HALF_PI_SQ * s;
      }
      const term1 = k * (k - 1) * (k === 2 ? 1 : Math.pow(s, k - 2)) * c * c;
      const term2 = k * Math.pow(s, k);
      return -HALF_PI_SQ * (term1 - term2);
    }

    function solveMWR(meth, M) {
      const A = Array.from({ length: M }, function () { return new Array(M).fill(0); });
      const b = new Array(M).fill(0);
      const collPts = [];

      if (meth === 'galerkin') {
        for (let i = 0; i < M; i++) {
          b[i] = integrate1D(function (x) { return fLoad(x) * phiVal(i + 1, x); }, 0, 1, 16);
          for (let j = 0; j < M; j++) {
            A[i][j] = integrate1D(function (x) {
              return phiDeriv1(i + 1, x) * phiDeriv1(j + 1, x);
            }, 0, 1, 16);
          }
        }
      } else if (meth === 'collocation') {
        for (let i = 0; i < M; i++) {
          const xi = (i + 1) / (M + 1);
          collPts.push(xi);
          b[i] = fLoad(xi);
          for (let j = 0; j < M; j++) {
            A[i][j] = negPhiDeriv2(j + 1, xi);
          }
        }
      } else if (meth === 'subdomain') {
        for (let i = 0; i < M; i++) {
          const x0 = i / M;
          const x1 = (i + 1) / M;
          b[i] = integrate1D(fLoad, x0, x1, 8);
          for (let j = 0; j < M; j++) {
            A[i][j] = integrate1D(function (x) { return negPhiDeriv2(j + 1, x); }, x0, x1, 8);
          }
        }
      } else {
        // Least Squares: minimize integral (R_Omega)^2 dx
        for (let i = 0; i < M; i++) {
          b[i] = integrate1D(function (x) { return fLoad(x) * negPhiDeriv2(i + 1, x); }, 0, 1, 16);
          for (let j = 0; j < M; j++) {
            A[i][j] = integrate1D(function (x) {
              return negPhiDeriv2(i + 1, x) * negPhiDeriv2(j + 1, x);
            }, 0, 1, 16);
          }
        }
      }

      const c = solveLinearSystem(A, b) || new Array(M).fill(0);

      function uHat(x) {
        let s = 0;
        for (let j = 0; j < M; j++) s += c[j] * phiVal(j + 1, x);
        return s;
      }

      function resOmega(x) {
        let lu = 0;
        for (let j = 0; j < M; j++) lu += c[j] * negPhiDeriv2(j + 1, x);
        return lu - fLoad(x);
      }

      const rL2 = Math.sqrt(integrate1D(function (x) {
        const r = resOmega(x);
        return r * r;
      }, 0, 1, 16));

      const uL2 = Math.sqrt(integrate1D(function (x) {
        const e = uExact(x) - uHat(x);
        return e * e;
      }, 0, 1, 16));

      let maxErr = 0;
      for (let s = 0; s <= 120; s++) {
        const x = s / 120;
        const e = Math.abs(uExact(x) - uHat(x));
        if (e > maxErr) maxErr = e;
      }

      return { c: c, uHat: uHat, resOmega: resOmega, rL2: rL2, uL2: uL2, maxErr: maxErr, collPts: collPts };
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 290, { breakpoint: 480, minH: 340 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      const sol = solveMWR(method, degreeM);
      dom.readouts.rL2.val.textContent = fmt(sol.rL2, 3);
      dom.readouts.uL2.val.textContent = fmt(sol.uL2, 4);
      dom.readouts.uMax.val.textContent = fmt(sol.maxErr, 4);

      ctx.clearRect(0, 0, w, h);

      const pad = 8;
      const gap = 12;
      const topH = Math.round((h - 2 * pad - gap) * 0.54);
      const botH = h - 2 * pad - gap - topH;
      const topBox = { x: pad, y: pad, w: w - 2 * pad, h: topH };
      const botBox = { x: pad, y: pad + topH + gap, w: w - 2 * pad, h: botH };

      drawDivider(ctx, pad, topBox.y + topBox.h + gap * 0.5, w - pad, topBox.y + topBox.h + gap * 0.5, pal);
      drawPlotFrame(ctx, topBox, pal, 'Exact u(x) vs. Trial û(x)', 'x ∈ [0, 1]', '');
      drawPlotFrame(ctx, botBox, pal, 'Strong Residual: R_Ω(x) = -û"(x) - (1+4x)', 'x', '');

      // Top plot coordinates
      const tx0 = topBox.x + 48;
      const tx1 = topBox.x + topBox.w - 18;
      const ty0 = topBox.y + 34;
      const ty1 = topBox.y + topBox.h - 24;
      const uMaxY = 2.15;

      function mapTopX(x) { return tx0 + x * (tx1 - tx0); }
      function mapTopY(y) { return ty1 - (y / uMaxY) * (ty1 - ty0); }

      // Grid & axes top
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx0, ty0); ctx.lineTo(tx0, ty1); ctx.lineTo(tx1, ty1);
      ctx.stroke();

      [0, 1, 2].forEach(function (yv) {
        const py = mapTopY(yv);
        drawDashed(ctx, tx0, py, tx1, py, pal.grid, [3, 4], 1);
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(yv), tx0 - 8, py);
      });

      // Exact u(x) dashed teal
      ctx.save();
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        const px = mapTopX(x);
        const py = mapTopY(uExact(x));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Trial uHat(x) solid cardinal
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        const px = mapTopX(x);
        const py = mapTopY(clamp(sol.uHat(x), -0.2, uMaxY));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Compact top legend (top-right inside frame)
      const legX = tx1 - 6;
      const legY = topBox.y + 15;
      ctx.font = FONT_SANS;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = pal.teal;
      ctx.fillText('--- Exact u', legX - 78, legY);
      ctx.fillStyle = pal.cardinal;
      ctx.fillText('─ Trial û', legX, legY);

      // Bottom plot: Residual R_Omega(x)
      const bx0 = botBox.x + 48;
      const bx1 = botBox.x + botBox.w - 18;
      const by0 = botBox.y + 34;
      const by1 = botBox.y + botBox.h - 22;

      const Nsamp = 120;
      const rVals = new Array(Nsamp + 1);
      let rMaxAbs = 1.2;
      for (let i = 0; i <= Nsamp; i++) {
        const rv = sol.resOmega(i / Nsamp);
        rVals[i] = rv;
        if (Math.abs(rv) > rMaxAbs) rMaxAbs = Math.abs(rv);
      }
      rMaxAbs = Math.min(8, Math.ceil(rMaxAbs * 1.12 * 2) / 2);

      function mapBotX(x) { return bx0 + x * (bx1 - bx0); }
      function mapBotY(y) { return 0.5 * (by0 + by1) - (y / rMaxAbs) * 0.46 * (by1 - by0); }
      const yZero = mapBotY(0);

      // Subdomain shaded bands when Subdomain active
      if (method === 'subdomain') {
        for (let i = 0; i < degreeM; i++) {
          const sx0 = mapBotX(i / degreeM);
          const sx1 = mapBotX((i + 1) / degreeM);
          ctx.fillStyle = withAlpha(i % 2 === 0 ? pal.blue : pal.amber, 0.11);
          ctx.fillRect(sx0, by0, sx1 - sx0, by1 - by0);
          if (i > 0) {
            drawDashed(ctx, sx0, by0, sx0, by1, withAlpha(pal.amber, 0.55), [4, 4], 1.2);
          }
        }
      }

      // Residual axes & zero line
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx0, by0); ctx.lineTo(bx0, by1);
      ctx.stroke();
      drawDashed(ctx, bx0, yZero, bx1, yZero, pal.axis, [4, 4], 1.3);

      // Y ticks
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('+' + fmt(rMaxAbs, 1), bx0 - 6, mapBotY(rMaxAbs));
      ctx.fillText('0', bx0 - 6, yZero);
      ctx.fillText('-' + fmt(rMaxAbs, 1), bx0 - 6, mapBotY(-rMaxAbs));

      // Shaded area under residual
      ctx.beginPath();
      ctx.moveTo(mapBotX(0), yZero);
      for (let i = 0; i <= Nsamp; i++) {
        ctx.lineTo(mapBotX(i / Nsamp), mapBotY(clamp(rVals[i], -rMaxAbs, rMaxAbs)));
      }
      ctx.lineTo(mapBotX(1), yZero);
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.amber, pal.theme === 'dark' ? 0.18 : 0.14);
      ctx.fill();

      // Residual curve
      ctx.strokeStyle = pal.amber;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= Nsamp; i++) {
        const px = mapBotX(i / Nsamp);
        const py = mapBotY(clamp(rVals[i], -rMaxAbs, rMaxAbs));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Mark collocation points where R_Omega(x_i) = 0
      if (method === 'collocation') {
        sol.collPts.forEach(function (xi) {
          const cx = mapBotX(xi);
          ctx.beginPath();
          ctx.arc(cx, yZero, 5.2, 0, Math.PI * 2);
          ctx.fillStyle = pal.cardinal;
          ctx.fill();
          ctx.strokeStyle = pal.surface;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        });
      }
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render
    };
  });

  /* =========================================================================
   * LAB 5: 'spaces-nitsche' (Slide 06: PS2 Ex. 2.20 Nitsche Weak Dirichlet
   * & Affine Space S = u_bar + V Diagram)
   * ========================================================================= */
  registerLab('spaces-nitsche', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'u0', label: 'u_h(0)', value: '--' },
        { id: 'err0', label: '|u_h(0)-g_0|', value: '--' },
        { id: 'l2', label: '||u-u_h||_L2', value: '--' }
      ],
      sliders: [
        {
          id: 'mu',
          label: 'Nitsche Parameter μ',
          min: 0.5,
          max: 40,
          step: 0.5,
          value: 18,
          format: function (v) { return fmt(v, 1); }
        },
        {
          id: 'g0',
          label: 'Dirichlet Target g_0 = u(0)',
          min: 0,
          max: 2,
          step: 0.05,
          value: 1.0,
          format: function (v) { return fmt(v, 2); }
        }
      ]
    });

    let mu = 18.0;
    let g0 = 1.0;

    const modeBadge = document.createElement('span');
    modeBadge.className = 'lab-badge-status is-safe';
    modeBadge.textContent = 'SPD μ>9';
    dom.toolbar.appendChild(modeBadge);

    const resetPills = createPillGroup(dom.toolbar, [
      { id: 'preset-low', label: 'μ=3', actionOnly: true },
      { id: 'preset-mid', label: 'μ=18', actionOnly: true },
      { id: 'preset-hi', label: 'μ=40', actionOnly: true }
    ], '', function (id) {
      if (id === 'preset-low') mu = 3.0;
      if (id === 'preset-mid') mu = 18.0;
      if (id === 'preset-hi') mu = 40.0;
      dom.sliders.mu.input.value = String(mu);
      dom.sliders.mu.valEl.textContent = fmt(mu, 1);
      render();
    });
    void resetPills;

    dom.sliders.mu.input.addEventListener('input', function () {
      mu = parseFloat(dom.sliders.mu.input.value);
      dom.sliders.mu.valEl.textContent = fmt(mu, 1);
      render();
    });

    dom.sliders.g0.input.addEventListener('input', function () {
      g0 = parseFloat(dom.sliders.g0.input.value);
      dom.sliders.g0.valEl.textContent = fmt(g0, 2);
      render();
    });

    // Exact non-cubic solution on (0,1): u(x) = g0 + 0.5x + 0.55 sin(1.4 pi x)
    const OMEGA = 1.4 * Math.PI;
    const AMP = 0.55;
    const dL = 0.5 + AMP * OMEGA * Math.cos(OMEGA);

    function uExact(x, gVal) {
      return gVal + 0.5 * x + AMP * Math.sin(OMEGA * x);
    }

    function fRhs(x) {
      return AMP * OMEGA * OMEGA * Math.sin(OMEGA * x);
    }

    // Solve 4x4 cubic polynomial Nitsche system (PS2 Ex. 2.20 & Ex. 2.40): basis {1, x, x^2, x^3}
    function solveNitscheCubic(muVal, gVal) {
      // Exact trace-inverse threshold for P3 on [0,1] is mu_crit = 9.0
      const nearSing = Math.abs(muVal - 9.0) < 0.12;
      const muEval = nearSing ? (muVal >= 9.0 ? 9.18 : 8.82) : muVal;

      const A = Array.from({ length: 4 }, function () { return [0, 0, 0, 0]; });
      const b = [0, 0, 0, 0];

      for (let i = 0; i < 4; i++) {
        // f*x^i integrated accurately
        const intF = integrate1D(function (x) { return fRhs(x) * Math.pow(x, i); }, 0, 1, 14);
        const vi0 = i === 0 ? 1 : 0;
        const vip0 = i === 1 ? 1 : 0;
        const vi1 = 1;
        b[i] = intF + dL * vi1 + gVal * vip0 + muEval * gVal * vi0;

        for (let j = 0; j < 4; j++) {
          const intGrad = (i > 0 && j > 0) ? (i * j) / (i + j - 1) : 0;
          const vj0 = j === 0 ? 1 : 0;
          const vjp0 = j === 1 ? 1 : 0;
          A[i][j] = intGrad + vjp0 * vi0 + vj0 * vip0 + muEval * vj0 * vi0;
        }
      }

      const c = solveLinearSystem(A, b) || [gVal, 0.5, 0, 0];
      function uHat(x) {
        return c[0] + c[1] * x + c[2] * x * x + c[3] * x * x * x;
      }
      const err0 = Math.abs(c[0] - gVal);
      const l2 = Math.sqrt(integrate1D(function (x) {
        const e = uExact(x, gVal) - uHat(x);
        return e * e;
      }, 0, 1, 14));

      return { c: c, uHat: uHat, err0: err0, l2: l2, nearSing: nearSing };
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 270, { breakpoint: 540, minH: 430 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const stacked = w < 540;

      const sol = solveNitscheCubic(mu, g0);
      dom.readouts.u0.val.textContent = fmt(sol.c[0], 3);
      dom.readouts.err0.val.textContent = fmt(sol.err0, 4);
      dom.readouts.l2.val.textContent = fmt(sol.l2, 4);

      if (sol.nearSing) {
        modeBadge.className = 'lab-badge-status is-danger';
        modeBadge.textContent = 'Near Sing. μ≈9';
      } else if (mu < 9.0) {
        modeBadge.className = 'lab-badge-status is-warn';
        modeBadge.textContent = 'Indef. μ<9';
      } else {
        modeBadge.className = 'lab-badge-status is-safe';
        modeBadge.textContent = 'SPD μ>9';
      }

      ctx.clearRect(0, 0, w, h);

      const pad = 8;
      const gap = 12;
      let leftBox, rightBox;
      if (!stacked) {
        const lw = Math.round((w - 2 * pad - gap) * 0.41);
        leftBox = { x: pad, y: pad, w: lw, h: h - 2 * pad };
        rightBox = { x: pad + lw + gap, y: pad, w: w - 2 * pad - gap - lw, h: h - 2 * pad };
        drawDivider(ctx, leftBox.x + leftBox.w + gap * 0.5, pad, leftBox.x + leftBox.w + gap * 0.5, h - pad, pal);
      } else {
        const th = Math.round((h - 2 * pad - gap) * 0.44);
        leftBox = { x: pad, y: pad, w: w - 2 * pad, h: th };
        rightBox = { x: pad, y: pad + th + gap, w: w - 2 * pad, h: h - 2 * pad - gap - th };
        drawDivider(ctx, pad, leftBox.y + leftBox.h + gap * 0.5, w - pad, leftBox.y + leftBox.h + gap * 0.5, pal);
      }

      // LEFT PANEL: Affine Space S = u_bar + V Geometric Schematic
      drawPlotFrame(ctx, leftBox, pal, 'Affine S = ū + V', '', '');
      const vx1 = leftBox.x + leftBox.w * 0.10;
      const vy1 = leftBox.y + leftBox.h * 0.80;
      const vx2 = leftBox.x + leftBox.w * 0.90;
      const vy2 = leftBox.y + leftBox.h * 0.64;
      const tOrigin = 0.18;
      const ox = lerp(vx1, vx2, tOrigin);
      const oy = lerp(vy1, vy2, tOrigin);

      // Linear subspace V passing through origin 0
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(vx1, vy1);
      ctx.lineTo(vx2, vy2);
      ctx.stroke();

      // Origin 0 (placed strictly on V, label offset cleanly below-right)
      ctx.beginPath();
      ctx.arc(ox, oy, 5, 0, Math.PI * 2);
      ctx.fillStyle = pal.teal;
      ctx.fill();
      ctx.font = FONT_MONO_BOLD;
      ctx.fillStyle = pal.teal;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('0 ∈ V', ox + 8, Math.min(oy + 14, leftBox.y + leftBox.h - 20));

      // Translate upward by lift u_bar proportional to g0
      const liftMax = Math.min(leftBox.h * 0.42, 108);
      const liftY = (g0 / 2.0) * liftMax;
      const liftX = -(g0 / 2.0) * 14;

      // Shaded parallelogram strip between V and S
      if (liftY > 4) {
        ctx.fillStyle = withAlpha(pal.cardinal, pal.theme === 'dark' ? 0.10 : 0.08);
        ctx.beginPath();
        ctx.moveTo(vx1, vy1);
        ctx.lineTo(vx2, vy2);
        ctx.lineTo(vx2 + liftX, vy2 - liftY);
        ctx.lineTo(vx1 + liftX, vy1 - liftY);
        ctx.closePath();
        ctx.fill();
      }

      // Affine trial hyperplane S
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(vx1 + liftX, vy1 - liftY);
      ctx.lineTo(vx2 + liftX, vy2 - liftY);
      ctx.stroke();

      // Lift arrow u_bar
      if (liftY > 8) {
        drawArrow(ctx, ox, oy, ox + liftX, oy - liftY, pal.amber, 2.3, 9);
        ctx.font = FONT_MONO_BOLD;
        ctx.fillStyle = pal.amber;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('ū', ox + liftX * 0.5 + 8, oy - liftY * 0.5);
      }

      // Labels V and S (V label offset below diagonal line across full label width)
      ctx.font = FONT_SANS_BOLD;
      ctx.fillStyle = pal.teal;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      const vLabelW = ctx.measureText('V (v=0)').width;
      const vLineDrop = (vLabelW / Math.max(1, vx2 - vx1)) * (vy1 - vy2);
      const vLabelY = Math.min(vy2 + Math.ceil(vLineDrop) + 8, leftBox.y + leftBox.h - 20);
      ctx.fillText('V (v=0)', vx2 - 2, vLabelY);

      ctx.fillStyle = pal.cardinal;
      ctx.textBaseline = 'bottom';
      ctx.fillText(g0 < 0.01 ? 'S = V (g₀=0)' : 'S (u=g₀)', vx2 + liftX - 2, vy2 - liftY - 8);

      // RIGHT PANEL: Live Nitsche Ex. 2.20 Cubic Solution
      drawPlotFrame(ctx, rightBox, pal, 'Ex. 2.20 Nitsche P3', 'x ∈ [0, 1]', '');

      const px0 = rightBox.x + 48;
      const px1 = rightBox.x + rightBox.w - 16;
      const legOnRow2 = rightBox.w < 300;
      const py0 = rightBox.y + (legOnRow2 ? 46 : 36);
      const py1 = rightBox.y + rightBox.h - 24;

      // Dynamic clean Y range anchored around exact solution
      const yMin = Math.min(-0.3, g0 - 0.5);
      const yMax = Math.max(2.6, g0 + 1.5);
      function mx(x) { return px0 + x * (px1 - px0); }
      function my(y) { return py1 - ((y - yMin) / (yMax - yMin)) * (py1 - py0); }

      // Axes & ticks
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.lineTo(px1, py1);
      ctx.stroke();

      const yStep = 1.0;
      for (let yv = Math.ceil(yMin); yv <= Math.floor(yMax); yv += yStep) {
        const yy = my(yv);
        drawDashed(ctx, px0, yy, px1, yy, pal.grid, [3, 4], 1);
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(yv), px0 - 7, yy);
      }

      // Exact solution (dashed teal)
      ctx.save();
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.3;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        const xx = mx(x);
        const yy = my(clamp(uExact(x, g0), yMin, yMax));
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.restore();

      // Nitsche P3 solution (solid cardinal)
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        const xx = mx(x);
        const yy = my(clamp(sol.uHat(x), yMin, yMax));
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();

      // Target g0 marker at x=0 and solved u_h(0) marker
      const yTarget = my(clamp(g0, yMin, yMax));
      const ySolved = my(clamp(sol.c[0], yMin, yMax));

      if (Math.abs(ySolved - yTarget) > 3) {
        ctx.strokeStyle = pal.amber;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px0, yTarget);
        ctx.lineTo(px0, ySolved);
        ctx.stroke();
      }

      // Hollow ring at target g0
      ctx.beginPath();
      ctx.arc(px0, yTarget, 6.2, 0, Math.PI * 2);
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = pal.teal;
      ctx.stroke();

      // Solid dot at u_h(0)
      ctx.beginPath();
      ctx.arc(px0, ySolved, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = pal.cardinal;
      ctx.fill();

      // Compact legend top-right (drops cleanly to row 2 if panel is narrow)
      const legY = legOnRow2 ? rightBox.y + 26 : rightBox.y + 6;
      ctx.font = FONT_SANS;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = pal.teal;
      ctx.fillText('--- Exact', px1 - 68, legY);
      ctx.fillStyle = pal.cardinal;
      ctx.fillText('─ u_h', px1 - 2, legY);
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render
    };
  });

  /* =========================================================================
   * LAB 6: 'advection-diffusion-1d' (Slide 07: PS3 Live 1D Galerkin + SUPG)
   * BVP: -D u'' + mu u' = 1 on (0,1), u(0) = u(1) = 0
   * ========================================================================= */
  registerLab('advection-diffusion-1d', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'peh', label: 'Pe_h', value: '--' },
        { id: 'err', label: 'Max |e_h|', value: '--' },
        { id: 'k12', label: 'K_12', value: '--' }
      ],
      sliders: [
        {
          id: 'nEl',
          label: 'Elements N',
          min: 3,
          max: 24,
          step: 1,
          value: 6,
          format: function (v) { return String(Math.round(v)); }
        },
        {
          id: 'peclet',
          label: 'Convection Ratio μ / D',
          min: 0.5,
          max: 60,
          step: 0.5,
          value: 28,
          format: function (v) { return fmt(v, 1); }
        }
      ]
    });

    let nEl = 6;
    let ratio = 28.0; // mu / D (with D = 1)
    let showHats = false;
    let useSupg = false;

    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'lab-pill-group';

    const btnHats = document.createElement('button');
    btnHats.type = 'button';
    btnHats.className = 'lab-pill';
    btnHats.textContent = 'Hat Basis';
    btnHats.addEventListener('click', function () {
      showHats = !showHats;
      btnHats.classList.toggle('is-active', showHats);
      render();
    });

    const btnSupg = document.createElement('button');
    btnSupg.type = 'button';
    btnSupg.className = 'lab-pill';
    btnSupg.textContent = 'SUPG';
    btnSupg.addEventListener('click', function () {
      useSupg = !useSupg;
      btnSupg.classList.toggle('is-active', useSupg);
      render();
    });

    toggleGroup.appendChild(btnHats);
    toggleGroup.appendChild(btnSupg);
    dom.toolbar.appendChild(toggleGroup);

    const statusBadge = document.createElement('span');
    statusBadge.className = 'lab-badge-status is-danger';
    statusBadge.innerHTML = '<span>' + formatMathHtml('Pe_h > 1 Oscillatory') + '</span>';
    dom.toolbar.appendChild(statusBadge);

    dom.sliders.nEl.input.addEventListener('input', function () {
      nEl = parseInt(dom.sliders.nEl.input.value, 10);
      dom.sliders.nEl.valEl.textContent = String(nEl);
      render();
    });

    dom.sliders.peclet.input.addEventListener('input', function () {
      ratio = parseFloat(dom.sliders.peclet.input.value);
      dom.sliders.peclet.valEl.textContent = fmt(ratio, 1);
      render();
    });

    function exactU(x, P) {
      if (P < 1e-4) return 0.5 * x * (1 - x);
      const expNegP = Math.exp(-P);
      const frac = (Math.exp(P * (x - 1)) - expNegP) / (1 - expNegP);
      return (x - frac) / P;
    }

    function solve1DFEM(N, P, supgOn) {
      const dx = 1 / N;
      const D = 1.0;
      const mu = P * D;
      const peh = (mu * dx) / (2 * D);

      // Optimal 1D SUPG diffusivity: D_supg = xi_bar * mu * dx / 2
      let dEff = D;
      if (supgOn) {
        const xiBar = peh < 1e-3 ? (peh / 3) : (1 / Math.tanh(peh) - 1 / peh);
        dEff = D + xiBar * 0.5 * mu * dx;
      }

      const nFree = N - 1;
      const K = Array.from({ length: nFree }, function () { return new Array(nFree).fill(0); });
      const F = new Array(nFree).fill(dx);

      // Assemble element-by-element using trial-first convention K_ab = a(N_b, N_a)
      const diff = dEff / dx;
      const adv = 0.5 * mu;
      const ke = [
        [diff - adv, -diff + adv],
        [-diff - adv, diff + adv]
      ];

      for (let e = 0; e < N; e++) {
        const gNodes = [e, e + 1];
        for (let a = 0; a < 2; a++) {
          const ga = gNodes[a] - 1; // interior index 0..N-2
          if (ga < 0 || ga >= nFree) continue;
          for (let b = 0; b < 2; b++) {
            const gb = gNodes[b] - 1;
            if (gb < 0 || gb >= nFree) continue;
            K[ga][gb] += ke[a][b];
          }
        }
      }

      const Ufree = solveLinearSystem(K, F) || new Array(nFree).fill(0);
      const U = new Array(N + 1).fill(0);
      for (let i = 0; i < nFree; i++) U[i + 1] = Ufree[i];

      const k12Raw = 0.5 * mu - D / dx;
      let maxErr = 0;
      for (let i = 0; i <= N; i++) {
        const e = Math.abs(U[i] - exactU(i * dx, P));
        if (e > maxErr) maxErr = e;
      }

      return { U: U, peh: peh, k12: k12Raw, maxErr: maxErr, dx: dx };
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 270, { breakpoint: 480, minH: 310 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      const resGal = solve1DFEM(nEl, ratio, false);
      const resAct = useSupg ? solve1DFEM(nEl, ratio, true) : resGal;

      dom.readouts.peh.val.textContent = fmt(resGal.peh, 2);
      dom.readouts.err.val.textContent = fmtSci(resAct.maxErr);
      dom.readouts.k12.val.textContent = (resGal.k12 > 0 ? '+' : '') + fmt(resGal.k12, 1);

      if (useSupg) {
        statusBadge.className = 'lab-badge-status is-info';
        statusBadge.innerHTML = '<span>SUPG Stabilized</span>';
      } else if (resGal.peh <= 1.0) {
        statusBadge.className = 'lab-badge-status is-safe';
        statusBadge.innerHTML = '<span>' + formatMathHtml('Pe_h ≤ 1 Stable') + '</span>';
      } else {
        statusBadge.className = 'lab-badge-status is-danger';
        statusBadge.innerHTML = '<span>' + formatMathHtml('Pe_h > 1 Oscillatory') + '</span>';
      }

      ctx.clearRect(0, 0, w, h);

      const pad = 8;
      const hatH = showHats ? Math.round(h * 0.27) : 0;
      const gap = showHats ? 10 : 0;
      const mainBox = { x: pad, y: pad, w: w - 2 * pad, h: h - 2 * pad - hatH - gap };

      drawPlotFrame(ctx, mainBox, pal, '1D Advection–Diffusion', 'x ∈ [0, 1]', '');

      const px0 = mainBox.x + 54;
      const px1 = mainBox.x + mainBox.w - 18;
      const py0 = mainBox.y + 38;
      const py1 = mainBox.y + mainBox.h - 24;

      // Determine robust y-bounds around exact & active FEM curve
      let yMax = 0;
      let yMin = 0;
      for (let i = 0; i <= 120; i++) {
        const u = exactU(i / 120, ratio);
        if (u > yMax) yMax = u;
      }
      for (let i = 0; i <= nEl; i++) {
        const u = resAct.U[i];
        if (u > yMax) yMax = u;
        if (u < yMin) yMin = u;
      }
      const span = Math.max(1e-3, yMax - yMin);
      const plotMax = yMax + span * 0.14;
      const plotMin = Math.min(0, yMin - span * 0.10);

      function mx(x) { return px0 + x * (px1 - px0); }
      function my(y) { return py1 - ((y - plotMin) / (plotMax - plotMin)) * (py1 - py0); }

      // Axes & zero line
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.lineTo(px1, py1);
      ctx.stroke();

      const y0Px = my(0);
      drawDashed(ctx, px0, y0Px, px1, y0Px, pal.axis, [3, 4], 1.1);

      // Subtle vertical mesh lines
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < nEl; i++) {
        const gx = mx(i / nEl);
        ctx.moveTo(gx, py0);
        ctx.lineTo(gx, py1);
      }
      ctx.stroke();

      // Y ticks
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(fmtSci(plotMax), px0 - 7, py0 + 4);
      ctx.fillText('0', px0 - 7, y0Px);

      // Exact boundary-layer curve (dashed teal)
      ctx.save();
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const x = i / 160;
        const xx = mx(x);
        const yy = my(exactU(x, ratio));
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.restore();

      // If SUPG is ON, draw ghost Galerkin curve lightly for direct comparison
      if (useSupg && resGal.peh > 1.0) {
        ctx.strokeStyle = withAlpha(pal.cardinal, 0.35);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i <= nEl; i++) {
          const xx = mx(i / nEl);
          const yy = my(clamp(resGal.U[i], plotMin, plotMax));
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }

      // Active FEM curve
      const curveColor = useSupg ? pal.blue : pal.cardinal;
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= nEl; i++) {
        const xx = mx(i / nEl);
        const yy = my(resAct.U[i]);
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();

      // Nodal markers
      const dotR = nEl > 14 ? 3.2 : 4.4;
      for (let i = 0; i <= nEl; i++) {
        const xx = mx(i / nEl);
        const yy = my(resAct.U[i]);
        ctx.beginPath();
        ctx.arc(xx, yy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = pal.surface;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = curveColor;
        ctx.stroke();
      }

      // Legend
      ctx.font = FONT_SANS;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = pal.teal;
      ctx.fillText('--- Exact', px1 - 92, mainBox.y + 8);
      ctx.fillStyle = curveColor;
      ctx.fillText(useSupg ? '─ SUPG' : '─ Galerkin', px1 - 4, mainBox.y + 8);

      // Optional Hat Basis Strip
      if (showHats) {
        const hatBox = { x: pad, y: mainBox.y + mainBox.h + gap, w: w - 2 * pad, h: hatH };
        drawDivider(ctx, pad, mainBox.y + mainBox.h + gap * 0.5, w - pad, mainBox.y + mainBox.h + gap * 0.5, pal);
        drawPlotFrame(ctx, hatBox, pal, 'Hat Basis N_a(x)', '', '');
        const hy0 = hatBox.y + 28;
        const hy1 = hatBox.y + hatBox.h - 10;
        const colors = [pal.cardinal, pal.teal, pal.amber, pal.blue];
        for (let a = 1; a < nEl; a++) {
          const xL = mx((a - 1) / nEl);
          const xM = mx(a / nEl);
          const xR = mx((a + 1) / nEl);
          ctx.strokeStyle = withAlpha(colors[(a - 1) % colors.length], 0.85);
          ctx.lineWidth = 1.9;
          ctx.beginPath();
          ctx.moveTo(xL, hy1);
          ctx.lineTo(xM, hy0);
          ctx.lineTo(xR, hy1);
          ctx.stroke();
        }
      }
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render
    };
  });

  /* =========================================================================
   * LAB 7: 'lg-assembly-lab' (Slide 08: PS4 LG(a,e) Scatter Studio)
   * Toggles P1 Non-Uniform (4 nodes) vs P2 Ex. 3.11 (7 nodes)
   * Steps through Elem 1 | Elem 2 | Elem 3 | All
   * ========================================================================= */
  registerLab('lg-assembly-lab', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'lgCol', label: 'LG(:, e)', value: '3 Columns' },
        { id: 'size', label: 'Global K', value: '4 × 4' },
        { id: 'ov', label: 'Overlap Nodes', value: 'Nodes 2, 3' }
      ]
    });

    let meshType = 'p1';
    let stepMode = 'all'; // '1' | '2' | '3' | 'all'

    createPillGroup(dom.toolbar, [
      { id: 'p1', label: 'P1 (4)' },
      { id: 'p2', label: 'P2 Ex. 3.11 (7)' }
    ], 'p1', function (id) {
      meshType = id;
      render();
    });

    createPillGroup(dom.toolbar, [
      { id: '1', label: 'e1' },
      { id: '2', label: 'e2' },
      { id: '3', label: 'e3' },
      { id: 'all', label: 'All' }
    ], 'all', function (id) {
      stepMode = id;
      render();
    });

    function getMeshSpec(type) {
      if (type === 'p1') {
        // Exact PS4 non-uniform mesh: {-1, -0.5, 0.5, 1}
        const coords = [-1, -0.5, 0.5, 1];
        const lg = [
          [1, 2, 3],
          [2, 3, 4]
        ];
        const keList = [0, 1, 2].map(function (e) {
          const le = coords[e + 1] - coords[e];
          const c = 1 / le;
          return [[c, -c], [-c, c]];
        });
        return {
          nNodes: 4,
          nLocal: 2,
          coords: coords,
          lg: lg,
          keList: keList,
          overlaps: 'Nodes 2, 3'
        };
      }
      // Exact PS4 Ex. 3.11: 3 quadratic P2 elements, 7 global nodes on [-1, 1]
      const coords = [-1, -0.67, -0.33, 0, 0.33, 0.67, 1];
      const lg = [
        [1, 3, 5],
        [2, 4, 6],
        [3, 5, 7]
      ];
      const keBase = [
        [7, -8, 1],
        [-8, 16, -8],
        [1, -8, 7]
      ];
      return {
        nNodes: 7,
        nLocal: 3,
        coords: coords,
        lg: lg,
        keList: [keBase, keBase, keBase],
        overlaps: 'Nodes 3, 5'
      };
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 310, { breakpoint: 540, minH: 470 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const spec = getMeshSpec(meshType);
      const elemColors = [pal.cardinal, pal.teal, pal.amber];
      const activeIdx = stepMode === 'all' ? -1 : parseInt(stepMode, 10) - 1;
      const stacked = w < 520;

      // Update readouts
      if (activeIdx < 0) {
        dom.readouts.lgCol.val.textContent = spec.nLocal + '×3 table';
      } else {
        const colVals = [];
        for (let a = 0; a < spec.nLocal; a++) colVals.push(spec.lg[a][activeIdx]);
        dom.readouts.lgCol.val.textContent = '[' + colVals.join(', ') + ']';
      }
      dom.readouts.size.val.textContent = spec.nNodes + ' × ' + spec.nNodes;
      dom.readouts.ov.val.textContent = spec.overlaps;

      ctx.clearRect(0, 0, w, h);

      const pad = 8;
      const gap = 12;
      const meshH = 90;
      const meshBox = { x: pad, y: pad, w: w - 2 * pad, h: meshH };
      const lowerY = pad + meshH + gap;
      const lowerH = h - lowerY - pad;

      // Hairline horizontal divider below 1D mesh
      drawDivider(ctx, pad, pad + meshH + gap * 0.5, w - pad, pad + meshH + gap * 0.5, pal);

      // TOP ZONE: 1D Mesh Schematic
      drawPlotFrame(ctx, meshBox, pal, meshType === 'p1' ? 'PS4 Non-Uniform P1 Mesh' : 'PS4 Ex. 3.11 P2 Mesh (7 DOFs)', '', '');
      const mx0 = meshBox.x + 34;
      const mx1 = meshBox.x + meshBox.w - 34;
      const myLine = meshBox.y + 52;

      function mapX(coord) {
        return mx0 + ((coord + 1) / 2) * (mx1 - mx0);
      }

      // Draw element segments
      for (let e = 0; e < 3; e++) {
        const nStart = spec.lg[0][e] - 1;
        const nEnd = spec.lg[spec.nLocal - 1][e] - 1;
        const xA = mapX(spec.coords[nStart]);
        const xB = mapX(spec.coords[nEnd]);
        const isAct = activeIdx === -1 || activeIdx === e;
        const col = elemColors[e];

        ctx.strokeStyle = isAct ? col : withAlpha(pal.axis, 0.35);
        ctx.lineWidth = isAct ? 5.5 : 2.2;
        ctx.beginPath();
        ctx.moveTo(xA, myLine);
        ctx.lineTo(xB, myLine);
        ctx.stroke();

        // Element tag above segment
        ctx.font = FONT_MONO_BOLD;
        ctx.fillStyle = isAct ? col : pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('e' + (e + 1), 0.5 * (xA + xB), myLine - 9);
      }

      // Draw global nodes
      for (let A = 0; A < spec.nNodes; A++) {
        const nx = mapX(spec.coords[A]);
        ctx.beginPath();
        ctx.arc(nx, myLine, 5.2, 0, Math.PI * 2);
        ctx.fillStyle = pal.surface;
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = pal.text;
        ctx.stroke();

        ctx.font = FONT_MONO_BOLD;
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(A + 1), nx, myLine + 10);
      }

      // LOWER ZONES: Left = LG Table, Right = Global K Scatter Grid
      let lgBox, kBox;
      if (!stacked) {
        const lw = Math.round((w - 2 * pad - gap) * 0.43);
        lgBox = { x: pad, y: lowerY, w: lw, h: lowerH };
        kBox = { x: pad + lw + gap, y: lowerY, w: w - 2 * pad - gap - lw, h: lowerH };
        drawDivider(ctx, lgBox.x + lgBox.w + gap * 0.5, lowerY + 2, lgBox.x + lgBox.w + gap * 0.5, h - pad, pal);
      } else {
        const lh = Math.round((lowerH - gap) * 0.42);
        lgBox = { x: pad, y: lowerY, w: w - 2 * pad, h: lh };
        kBox = { x: pad, y: lowerY + lh + gap, w: w - 2 * pad, h: lowerH - lh - gap };
        drawDivider(ctx, pad, lowerY + lh + gap * 0.5, w - pad, lowerY + lh + gap * 0.5, pal);
      }

      // BOTTOM-LEFT: LG(a, e) Connectivity Table
      drawPlotFrame(ctx, lgBox, pal, 'Connectivity LG(a, e)', '', '');
      const tX0 = lgBox.x + 42;
      const tY0 = lgBox.y + 54;
      const colW = Math.min(54, (lgBox.w - 56) / 3);
      const rowH = Math.min(34, (lgBox.h - 72) / spec.nLocal);

      // Column headers e=1,2,3
      for (let e = 0; e < 3; e++) {
        const cx = tX0 + (e + 0.5) * colW;
        const isAct = activeIdx === -1 || activeIdx === e;
        ctx.font = FONT_MONO_BOLD;
        ctx.fillStyle = isAct ? elemColors[e] : pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('e=' + (e + 1), cx, tY0 - 6);
      }

      // Row headers a=1..nLocal and cells
      for (let a = 0; a < spec.nLocal; a++) {
        const ry = tY0 + a * rowH;
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('a=' + (a + 1), tX0 - 8, ry + rowH * 0.5);

        for (let e = 0; e < 3; e++) {
          const rx = tX0 + e * colW;
          const isAct = activeIdx === -1 || activeIdx === e;
          ctx.fillStyle = isAct ? withAlpha(elemColors[e], pal.theme === 'dark' ? 0.22 : 0.16) : pal.surface;
          ctx.fillRect(rx + 2, ry + 2, colW - 4, rowH - 4);
          ctx.strokeStyle = isAct ? elemColors[e] : pal.border;
          ctx.lineWidth = isAct ? 1.8 : 1;
          ctx.strokeRect(rx + 2, ry + 2, colW - 4, rowH - 4);

          ctx.font = FONT_MONO_BOLD;
          ctx.fillStyle = isAct ? pal.text : pal.textMuted;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(spec.lg[a][e]), rx + colW * 0.5, ry + rowH * 0.5 + 0.5);
        }
      }

      // Scatter rule hint inside LG box bottom (kept strictly inside with >= 10px margin)
      const tableBot = tY0 + spec.nLocal * rowH;
      const lgAvailH = lgBox.y + lgBox.h - tableBot;
      if (lgAvailH > 26) {
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const cxLg = lgBox.x + lgBox.w * 0.5;
        const singleHint = 'K[LG(a,e),LG(b,e)] += kᵉ';
        if (ctx.measureText(singleHint).width <= lgBox.w - 20) {
          ctx.fillText(singleHint, cxLg, lgBox.y + lgBox.h - 8);
        } else if (lgAvailH > 44) {
          ctx.fillText('K[LG(a,e), LG(b,e)]', cxLg, lgBox.y + lgBox.h - 26);
          ctx.fillText('+= kᵉ(a, b)', cxLg, lgBox.y + lgBox.h - 8);
        } else {
          ctx.fillText('K[A, B] += kᵉ', cxLg, lgBox.y + lgBox.h - 8);
        }
      }

      // BOTTOM-RIGHT: Global Stiffness Matrix K Scatter Grid
      drawPlotFrame(ctx, kBox, pal, 'Global K (' + spec.nNodes + '×' + spec.nNodes + ' Scatter)', '', '');

      // Accumulate contributions per cell
      const N = spec.nNodes;
      const contrib = Array.from({ length: N }, function () {
        return Array.from({ length: N }, function () { return { elems: [], sum: 0 }; });
      });

      for (let e = 0; e < 3; e++) {
        if (activeIdx !== -1 && activeIdx !== e) continue;
        const ke = spec.keList[e];
        for (let a = 0; a < spec.nLocal; a++) {
          const ga = spec.lg[a][e] - 1;
          for (let b = 0; b < spec.nLocal; b++) {
            const gb = spec.lg[b][e] - 1;
            contrib[ga][gb].elems.push(e);
            contrib[ga][gb].sum += ke[a][b];
          }
        }
      }

      const gridTop = kBox.y + 42;
      const gridLeft = kBox.x + 34;
      const availW = kBox.w - 48;
      const availH = kBox.h - 54;
      const cellSz = Math.floor(Math.min(availW / N, availH / N));
      const gX0 = gridLeft + Math.round((availW - cellSz * N) * 0.5);
      const gY0 = gridTop + Math.round((availH - cellSz * N) * 0.5);

      // Column & row index labels
      for (let i = 0; i < N; i++) {
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(i + 1), gX0 + (i + 0.5) * cellSz, gY0 - 4);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), gX0 - 6, gY0 + (i + 0.5) * cellSz);
      }

      // Draw cells
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cx = gX0 + c * cellSz;
          const cy = gY0 + r * cellSz;
          const cell = contrib[r][c];

          if (cell.elems.length === 0) {
            ctx.fillStyle = withAlpha(pal.surface, 0.45);
            ctx.fillRect(cx + 1, cy + 1, cellSz - 2, cellSz - 2);
            ctx.strokeStyle = pal.border;
            ctx.lineWidth = 0.8;
            ctx.strokeRect(cx + 1, cy + 1, cellSz - 2, cellSz - 2);
          } else if (cell.elems.length === 1) {
            const col = elemColors[cell.elems[0]];
            ctx.fillStyle = withAlpha(col, pal.theme === 'dark' ? 0.30 : 0.22);
            ctx.fillRect(cx + 1, cy + 1, cellSz - 2, cellSz - 2);
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx + 1, cy + 1, cellSz - 2, cellSz - 2);
          } else {
            // Overlapping diagonal entry receiving sum from two adjacent elements!
            const col1 = elemColors[cell.elems[0]];
            const col2 = elemColors[cell.elems[1]];
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx + 1, cy + 1);
            ctx.lineTo(cx + cellSz - 1, cy + 1);
            ctx.lineTo(cx + 1, cy + cellSz - 1);
            ctx.closePath();
            ctx.fillStyle = withAlpha(col1, pal.theme === 'dark' ? 0.42 : 0.32);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx + cellSz - 1, cy + 1);
            ctx.lineTo(cx + cellSz - 1, cy + cellSz - 1);
            ctx.lineTo(cx + 1, cy + cellSz - 1);
            ctx.closePath();
            ctx.fillStyle = withAlpha(col2, pal.theme === 'dark' ? 0.42 : 0.32);
            ctx.fill();
            ctx.restore();

            ctx.strokeStyle = pal.text;
            ctx.lineWidth = 1.8;
            ctx.strokeRect(cx + 1, cy + 1, cellSz - 2, cellSz - 2);
          }

          // Display value or overlap symbol inside cell if cell is roomy enough for >= 15px font
          if (cell.elems.length > 0 && cellSz >= 24) {
            ctx.font = FONT_MONO_BOLD;
            ctx.fillStyle = pal.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = cell.elems.length > 1
              ? (meshType === 'p1' ? String(Math.round(cell.sum)) : '+')
              : (meshType === 'p1' ? String(Math.round(cell.sum)) : '•');
            ctx.fillText(label, cx + cellSz * 0.5, cy + cellSz * 0.5 + 0.5);
          }
        }
      }
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render
    };
  });

  /* =========================================================================
   * LAB 8: 'hermite-beam-lab' (Slide 09: PS5 C1 Hermite Beam & Basis Curves)
   * Mode 1: Real 4-Element (6x6 free) Clamped Euler-Bernoulli Beam Solver
   * Mode 2: Parent Cubic Hermite Basis Functions N1..N4 on xi in [0, 1]
   * ========================================================================= */
  registerLab('hermite-beam-lab', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'umid', label: 'u_h(0.5)', value: '--' },
        { id: 'uex', label: 'Exact u(0.5)', value: '--' },
        { id: 'mmid', label: 'M(0.5)', value: '--' }
      ],
      sliders: [
        {
          id: 'load',
          label: 'Uniform Load f',
          min: 4,
          max: 48,
          step: 2,
          value: 24,
          format: function (v) { return fmt(v, 0); }
        },
        {
          id: 'ei',
          label: 'Flexural Rigidity EI',
          min: 0.5,
          max: 4.0,
          step: 0.1,
          value: 1.0,
          format: function (v) { return fmt(v, 1); }
        }
      ]
    });

    let mode = 'beam'; // 'beam' | 'basis'
    let loadF = 24.0;
    let eiVal = 1.0;

    createPillGroup(dom.toolbar, [
      { id: 'beam', label: '4-Elem Beam' },
      { id: 'basis', label: 'Basis N1..N4' }
    ], 'beam', function (id) {
      mode = id;
      dom.sliders.load.input.disabled = mode !== 'beam';
      dom.sliders.ei.input.disabled = mode !== 'beam';
      render();
    });

    const badge = document.createElement('span');
    badge.className = 'lab-badge-status is-safe';
    badge.textContent = 'C¹ · 6×6 SPD';
    dom.toolbar.appendChild(badge);

    dom.sliders.load.input.addEventListener('input', function () {
      loadF = parseFloat(dom.sliders.load.input.value);
      dom.sliders.load.valEl.textContent = fmt(loadF, 0);
      render();
    });

    dom.sliders.ei.input.addEventListener('input', function () {
      eiVal = parseFloat(dom.sliders.ei.input.value);
      dom.sliders.ei.valEl.textContent = fmt(eiVal, 1);
      render();
    });

    // Cubic Hermite parent shape functions on xi in [0, 1] with element length le
    function hermiteN(xi, le) {
      const m = 1 - xi;
      return [
        m * m * (1 + 2 * xi),
        le * xi * m * m,
        xi * xi * (3 - 2 * xi),
        le * xi * xi * (xi - 1)
      ];
    }

    // Second derivatives d^2 N_a / dx^2 = (1 / le^2) d^2 N_a / dxi^2
    function hermiteNdd(xi, le) {
      const inv2 = 1 / (le * le);
      return [
        inv2 * (-6 + 12 * xi),
        (1 / le) * (-4 + 6 * xi),
        inv2 * (6 - 12 * xi),
        (1 / le) * (-2 + 6 * xi)
      ];
    }

    function solveClampedBeam4(f, EI) {
      const nEl = 4;
      const le = 1 / nEl;
      const nTot = 2 * (nEl + 1); // 10 DOFs
      const K = Array.from({ length: nTot }, function () { return new Array(nTot).fill(0); });
      const F = new Array(nTot).fill(0);

      const c = EI / (le * le * le);
      const ke = [
        [12 * c, 6 * le * c, -12 * c, 6 * le * c],
        [6 * le * c, 4 * le * le * c, -6 * le * c, 2 * le * le * c],
        [-12 * c, -6 * le * c, 12 * c, -6 * le * c],
        [6 * le * c, 2 * le * le * c, -6 * le * c, 4 * le * le * c]
      ];
      const fe = [
        f * le / 2,
        f * le * le / 12,
        f * le / 2,
        -f * le * le / 12
      ];

      for (let e = 0; e < nEl; e++) {
        const dofs = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3];
        for (let a = 0; a < 4; a++) {
          F[dofs[a]] += fe[a];
          for (let b = 0; b < 4; b++) {
            K[dofs[a]][dofs[b]] += ke[a][b];
          }
        }
      }

      // Free DOFs: indices 2..7 (global 1-based {3,4,5,6,7,8}, eliminating {1,2,9,10})
      const free = [2, 3, 4, 5, 6, 7];
      const Kred = free.map(function (i) {
        return free.map(function (j) { return K[i][j]; });
      });
      const Fred = free.map(function (i) { return F[i]; });
      const Ured = solveLinearSystem(Kred, Fred) || new Array(6).fill(0);

      const U = new Array(nTot).fill(0);
      for (let k = 0; k < free.length; k++) U[free[k]] = Ured[k];

      function evalU(x) {
        const e = Math.min(nEl - 1, Math.max(0, Math.floor(x * nEl)));
        const xi = (x - e * le) / le;
        const N = hermiteN(xi, le);
        const base = 2 * e;
        return N[0] * U[base] + N[1] * U[base + 1] + N[2] * U[base + 2] + N[3] * U[base + 3];
      }

      function evalMoment(x, elemOverride) {
        const e = typeof elemOverride === 'number' ? elemOverride : Math.min(nEl - 1, Math.max(0, Math.floor(x * nEl)));
        const xi = clamp((x - e * le) / le, 0, 1);
        const Ndd = hermiteNdd(xi, le);
        const base = 2 * e;
        const udd = Ndd[0] * U[base] + Ndd[1] * U[base + 1] + Ndd[2] * U[base + 2] + Ndd[3] * U[base + 3];
        return EI * udd;
      }

      function exactU(x) {
        return (f / (24 * EI)) * x * x * (1 - x) * (1 - x);
      }

      function exactM(x) {
        // M(x) = EI u''(x) = (f/12)(6x^2 - 6x + 1)
        return (f / 12) * (6 * x * x - 6 * x + 1);
      }

      return { U: U, nEl: nEl, le: le, evalU: evalU, evalMoment: evalMoment, exactU: exactU, exactM: exactM };
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 290, { breakpoint: 480, minH: 340 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      ctx.clearRect(0, 0, w, h);

      const pad = 10;

      if (mode === 'beam') {
        const sol = solveClampedBeam4(loadF, eiVal);
        const uMid = sol.evalU(0.5);
        const uExMid = sol.exactU(0.5);
        const mMid = sol.exactM(0.5);

        dom.readouts.umid.val.textContent = fmt(uMid, 4);
        dom.readouts.uex.val.textContent = fmt(uExMid, 4);
        dom.readouts.mmid.val.textContent = fmt(mMid, 2);
        badge.textContent = 'C¹ · 6×6 SPD';

        const gap = 12;
        const topH = Math.round((h - 2 * pad - gap) * 0.54);
        const botH = h - 2 * pad - gap - topH;
        const topBox = { x: pad, y: pad, w: w - 2 * pad, h: topH };
        const botBox = { x: pad, y: pad + topH + gap, w: w - 2 * pad, h: botH };

        drawDivider(ctx, pad, topBox.y + topBox.h + gap * 0.5, w - pad, topBox.y + topBox.h + gap * 0.5, pal);
        drawPlotFrame(ctx, topBox, pal, 'Deflection: Exact Quartic vs C¹ Hermite u_h', 'x ∈ [0, 1]', '');
        drawPlotFrame(ctx, botBox, pal, 'Bending Moment: M(x) = EI u"(x)', 'x', '');

        // Top: Deflection (68px left margin so y-ticks clear the clamped wall hatch cleanly)
        const px0 = topBox.x + 68;
        const px1 = topBox.x + topBox.w - 22;
        const py0 = topBox.y + 38;
        const py1 = topBox.y + topBox.h - 24;
        const uScale = Math.max(0.02, uExMid * 1.24);

        function mx(x) { return px0 + x * (px1 - px0); }
        function myU(v) { return py1 - (v / uScale) * (py1 - py0); }

        // Clamped hatched walls at x=0 and x=1
        drawHatchWall(ctx, px0, py0, py1, -1, pal, pal.teal);
        drawHatchWall(ctx, px1, py0, py1, 1, pal, pal.teal);

        // Baseline
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px0, py1); ctx.lineTo(px1, py1);
        ctx.stroke();

        // Exact quartic (dashed teal)
        ctx.save();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.6;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const x = i / 120;
          const xx = mx(x);
          const yy = myU(sol.exactU(x));
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        ctx.restore();

        // Hermite FEM u_h (solid cardinal)
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const x = i / 120;
          const xx = mx(x);
          const yy = myU(sol.evalU(x));
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();

        // Nodal deflection dots + slope tangent ticks
        for (let node = 0; node <= 4; node++) {
          const xn = node * 0.25;
          const un = sol.U[2 * node];
          const tn = sol.U[2 * node + 1];
          const cx = mx(xn);
          const cy = myU(un);

          // Draw slope tangent segment
          const dpx = 14;
          const dpy = -(tn / uScale) * (py1 - py0) * (dpx / (px1 - px0));
          ctx.strokeStyle = pal.amber;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(cx - dpx, cy - dpy);
          ctx.lineTo(cx + dpx, cy + dpy);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = pal.surface;
          ctx.fill();
          ctx.lineWidth = 2.1;
          ctx.strokeStyle = pal.cardinal;
          ctx.stroke();
        }

        // Y peak label (cleared cleanly left of clamped-wall hatch ticks)
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(fmt(uScale, 3), px0 - 16, py0 + 4);
        ctx.fillText('0', px0 - 16, py1);

        // Bottom: Bending Moment M(x) = EI u''(x)
        const by0 = botBox.y + 34;
        const by1 = botBox.y + botBox.h - 20;
        const mLim = Math.max(0.5, (loadF / 12) * 1.25);

        function myM(m) {
          return 0.5 * (by0 + by1) - (m / mLim) * 0.45 * (by1 - by0);
        }
        const mZero = myM(0);

        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px0, by0); ctx.lineTo(px0, by1);
        ctx.stroke();
        drawDashed(ctx, px0, mZero, px1, mZero, pal.axis, [4, 4], 1.2);

        // Exact parabolic moment (dashed teal)
        ctx.save();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const x = i / 100;
          const xx = mx(x);
          const yy = myM(sol.exactM(x));
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        ctx.restore();

        // Piecewise-linear Hermite moment per element (shows discontinuous jumps at nodes!)
        ctx.strokeStyle = pal.amber;
        ctx.lineWidth = 2.5;
        for (let e = 0; e < 4; e++) {
          const xL = e * 0.25;
          const xR = (e + 1) * 0.25;
          const mL = sol.evalMoment(xL, e);
          const mR = sol.evalMoment(xR, e);
          ctx.beginPath();
          ctx.moveTo(mx(xL), myM(mL));
          ctx.lineTo(mx(xR), myM(mR));
          ctx.stroke();
        }

        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('+' + fmt(mLim, 1), px0 - 8, myM(mLim));
        ctx.fillText('0', px0 - 8, mZero);

      } else {
        // MODE 2: Parent Cubic Hermite Basis Functions N1..N4 on xi in [0, 1]
        dom.readouts.umid.val.textContent = 'N1(0)=1, N3(1)=1';
        dom.readouts.uex.val.textContent = "N2'(0)=1, N4'(1)=1";
        dom.readouts.mmid.val.textContent = 'deg = 3 (Cubic)';
        badge.textContent = 'Parent ξ ∈ [0, 1]';

        const box = { x: pad, y: pad, w: w - 2 * pad, h: h - 2 * pad };
        drawPlotFrame(ctx, box, pal, 'Cubic Hermite Shape Functions N1..N4 (l_e = 1)', 'ξ ∈ [0, 1]', '');

        const px0 = box.x + 54;
        const px1 = box.x + box.w - 22;
        const py0 = box.y + 44;
        const py1 = box.y + box.h - 32;

        const yMin = -0.24;
        const yMax = 1.15;
        function mx(xi) { return px0 + xi * (px1 - px0); }
        function my(v) { return py1 - ((v - yMin) / (yMax - yMin)) * (py1 - py0); }

        const yZero = my(0);
        const yOne = my(1);

        // Axes & guide lines
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px0, py0); ctx.lineTo(px0, py1);
        ctx.moveTo(px1, py0); ctx.lineTo(px1, py1);
        ctx.stroke();

        drawDashed(ctx, px0, yZero, px1, yZero, pal.axis, [4, 4], 1.2);
        drawDashed(ctx, px0, yOne, px1, yOne, pal.grid, [3, 4], 1.1);

        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('1.0', px0 - 8, yOne);
        ctx.fillText('0.0', px0 - 8, yZero);

        const curveDefs = [
          { idx: 0, label: 'N1 (u1)', color: pal.cardinal },
          { idx: 1, label: 'N2 (θ1)', color: pal.amber },
          { idx: 2, label: 'N3 (u2)', color: pal.teal },
          { idx: 3, label: 'N4 (θ2)', color: pal.blue }
        ];

        curveDefs.forEach(function (cd) {
          ctx.strokeStyle = cd.color;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const xi = i / 100;
            const vals = hermiteN(xi, 1.0);
            const xx = mx(xi);
            const yy = my(vals[cd.idx]);
            if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        });

        // Slope tangent indicators for N2 at xi=0 (slope +1) and N4 at xi=1 (slope +1)
        drawArrow(ctx, mx(0), my(0), mx(0.22), my(0.22), pal.amber, 2.0, 8);
        drawArrow(ctx, mx(0.78), my(-0.22), mx(1.0), my(0), pal.blue, 2.0, 8);

        // Value dots at (0,1) and (1,1)
        [
          { x: 0, y: 1, c: pal.cardinal },
          { x: 1, y: 1, c: pal.teal },
          { x: 0, y: 0, c: pal.amber },
          { x: 1, y: 0, c: pal.blue }
        ].forEach(function (pt) {
          ctx.beginPath();
          ctx.arc(mx(pt.x), my(pt.y), 5, 0, Math.PI * 2);
          ctx.fillStyle = pt.c;
          ctx.fill();
        });

        // Clean horizontal legend row along bottom inside plot
        const spacing = (px1 - px0) / 4;
        curveDefs.forEach(function (cd, k) {
          ctx.font = FONT_MONO_BOLD;
          ctx.fillStyle = cd.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(cd.label, px0 + (k + 0.5) * spacing, box.y + box.h - 6);
        });
      }
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render
    };
  });

  /* =========================================================================
   * LAB 9: 'bc-methods-compare' (Slide 10: Essential vs Natural BC Methods)
   * BVP: -u'' = 2 on (0,1), u(0) = 1, u'(1) = 0.5
   * Exact: u(x) = 1 + 2.5x - x^2 (4-element P1 mesh, h = 0.25)
   * Compares Elimination/Lift, Penalty (beta), Nitsche (mu), Lagrange Mult.
   * ========================================================================= */
  registerLab('bc-methods-compare', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'err0', label: '|u_h(0)−1|', value: '0.0000' },
        { id: 'kappa', label: 'Cond. κ_1', value: '--' },
        { id: 'type', label: 'Matrix', value: '4×4 SPD' }
      ],
      sliders: [
        {
          id: 'param',
          label: 'Method Parameter',
          min: 0,
          max: 7,
          step: 0.25,
          value: 2.0,
          format: function () { return 'N/A'; }
        }
      ]
    });

    let method = 'elim'; // 'elim' | 'penalty' | 'nitsche' | 'lm'
    let logBeta = 2.0; // beta = 10^logBeta
    let muNitsche = 16.0;

    function syncSliderSpec() {
      const sl = dom.sliders.param;
      if (method === 'penalty') {
        if (dom.controlsGrid) dom.controlsGrid.style.display = '';
        sl.wrap.style.display = '';
        sl.input.disabled = false;
        sl.input.min = '0';
        sl.input.max = '7';
        sl.input.step = '0.25';
        sl.input.value = String(logBeta);
        sl.labelEl.innerHTML = formatMathHtml('Penalty log_10(β)');
        sl.valEl.textContent = '10^' + fmt(logBeta, 2);
      } else if (method === 'nitsche') {
        if (dom.controlsGrid) dom.controlsGrid.style.display = '';
        sl.wrap.style.display = '';
        sl.input.disabled = false;
        sl.input.min = '5';
        sl.input.max = '80';
        sl.input.step = '1';
        sl.input.value = String(muNitsche);
        sl.labelEl.innerHTML = formatMathHtml('Nitsche Parameter μ (μ > 1/h = 4)');
        sl.valEl.textContent = fmt(muNitsche, 0);
      } else {
        if (dom.controlsGrid) dom.controlsGrid.style.display = 'none';
        sl.wrap.style.display = 'none';
        sl.input.disabled = true;
      }
    }

    createPillGroup(dom.toolbar, [
      { id: 'elim', label: 'Elimination / Lift' },
      { id: 'penalty', label: 'Penalty (β)' },
      { id: 'nitsche', label: 'Nitsche (μ)' },
      { id: 'lm', label: 'Lagrange Mult.' }
    ], 'elim', function (id) {
      method = id;
      syncSliderSpec();
      render();
    });

    const badge = document.createElement('span');
    badge.className = 'lab-badge-status is-safe';
    badge.textContent = 'SPD · Exact BC';
    dom.toolbar.appendChild(badge);

    dom.sliders.param.input.addEventListener('input', function () {
      const val = parseFloat(dom.sliders.param.input.value);
      if (method === 'penalty') {
        logBeta = val;
        dom.sliders.param.valEl.textContent = '10^' + fmt(logBeta, 2);
      } else if (method === 'nitsche') {
        muNitsche = val;
        dom.sliders.param.valEl.textContent = fmt(muNitsche, 0);
      }
      render();
    });

    function exactU(x) {
      return 1 + 2.5 * x - x * x;
    }

    function solveBCMethod(meth) {
      const nEl = 4;
      const h = 1 / nEl; // 0.25
      const N = nEl + 1; // 5 nodes
      const g0 = 1.0;
      const tN = 0.5;
      const fVal = 2.0;

      // Build unreduced 5x5 stiffness K and load F (including natural BC tN*v(1))
      const K = Array.from({ length: N }, function () { return new Array(N).fill(0); });
      const F = new Array(N).fill(0);
      for (let e = 0; e < nEl; e++) {
        K[e][e] += 1 / h;
        K[e][e + 1] -= 1 / h;
        K[e + 1][e] -= 1 / h;
        K[e + 1][e + 1] += 1 / h;
        F[e] += 0.5 * fVal * h;
        F[e + 1] += 0.5 * fVal * h;
      }
      F[N - 1] += tN;

      if (meth === 'elim') {
        // Lift u_0 = g0, solve 4x4 reduced SPD system
        const Kred = [];
        const Fred = [];
        for (let i = 1; i < N; i++) {
          const row = [];
          for (let j = 1; j < N; j++) row.push(K[i][j]);
          Kred.push(row);
          Fred.push(F[i] - K[i][0] * g0);
        }
        const Ufree = solveLinearSystem(Kred, Fred) || [1, 1, 1, 1];
        const U = [g0].concat(Ufree);
        return {
          U: U,
          err0: 0,
          kappa: computeConditionNumber1(Kred),
          matType: '4×4 SPD',
          badgeClass: 'is-safe',
          badgeText: 'SPD · Exact BC',
          sysSize: 4,
          extraInfo: 'Lift u_h^g'
        };
      }

      if (meth === 'penalty') {
        const beta = Math.pow(10, logBeta);
        const Kp = K.map(function (r) { return r.slice(); });
        const Fp = F.slice();
        Kp[0][0] += beta;
        Fp[0] += beta * g0;
        const U = solveLinearSystem(Kp, Fp) || new Array(N).fill(g0);
        const err0 = Math.abs(U[0] - g0);
        const kap = computeConditionNumber1(Kp);
        return {
          U: U,
          err0: err0,
          kappa: kap,
          matType: '5×5 SPD',
          badgeClass: kap > 1e5 ? 'is-danger' : (err0 > 0.05 ? 'is-warn' : 'is-safe'),
          badgeText: kap > 1e5 ? 'Ill-Conditioned' : (err0 > 0.05 ? 'Weak BC Error' : 'Balanced SPD'),
          sysSize: 5,
          extraInfo: 'β = 10^' + fmt(logBeta, 1)
        };
      }

      if (meth === 'nitsche') {
        // Consistent symmetric Nitsche: + u'(0)v(0) + u(0)v'(0) + mu u(0)v(0)
        // On first P1 element: u'(0) = (u_1 - u_0)/h, v'(0) = (v_1 - v_0)/h
        const Kn = K.map(function (r) { return r.slice(); });
        const Fn = F.slice();
        // v'(0) coefficients: node 0 -> -1/h, node 1 -> +1/h
        // u'(0)v(0): row 0 gets [-1/h, +1/h]
        Kn[0][0] += -1 / h;
        Kn[0][1] += 1 / h;
        // u(0)v'(0): col 0 gets [-1/h, +1/h]
        Kn[0][0] += -1 / h;
        Kn[1][0] += 1 / h;
        // + mu u(0)v(0)
        Kn[0][0] += muNitsche;
        // RHS: + g0 v'(0) + mu g0 v(0)
        Fn[0] += g0 * (-1 / h) + muNitsche * g0;
        Fn[1] += g0 * (1 / h);

        const U = solveLinearSystem(Kn, Fn) || new Array(N).fill(g0);
        const err0 = Math.abs(U[0] - g0);
        const kap = computeConditionNumber1(Kn);
        return {
          U: U,
          err0: err0,
          kappa: kap,
          matType: '5×5 SPD',
          badgeClass: 'is-safe',
          badgeText: 'Consistent SPD',
          sysSize: 5,
          extraInfo: 'μ = ' + fmt(muNitsche, 0)
        };
      }

      // Lagrange Multiplier: 6x6 symmetric indefinite saddle-point system
      const Kl = Array.from({ length: N + 1 }, function () { return new Array(N + 1).fill(0); });
      const Fl = F.slice().concat([g0]);
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) Kl[i][j] = K[i][j];
      }
      Kl[0][N] = 1;
      Kl[N][0] = 1;
      const solVec = solveLinearSystem(Kl, Fl) || new Array(N + 1).fill(0);
      const U = solVec.slice(0, N);
      const lam = solVec[N];
      return {
        U: U,
        err0: Math.abs(U[0] - g0),
        kappa: computeConditionNumber1(Kl),
        matType: '6×6 Indef.',
        badgeClass: 'is-warn',
        badgeText: 'Indefinite Saddle',
        sysSize: 6,
        extraInfo: 'λ = ' + fmt(lam, 2)
      };
    }

    syncSliderSpec();

    function render() {
      const fit = fitCanvas(dom.canvas, 210, { breakpoint: 560, minH: 390 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const stacked = w < 560;

      const res = solveBCMethod(method);
      dom.readouts.err0.val.textContent = fmtSci(res.err0);
      dom.readouts.kappa.val.textContent = fmtSci(res.kappa);
      dom.readouts.type.val.textContent = res.matType;
      badge.className = 'lab-badge-status ' + res.badgeClass;
      badge.textContent = res.badgeText;

      ctx.clearRect(0, 0, w, h);

      const pad = 6;
      const gap = 14;
      let leftBox, rightBox;
      if (!stacked) {
        const lw = Math.round((w - 2 * pad - gap) * 0.56);
        leftBox = { x: pad, y: pad, w: lw, h: h - 2 * pad };
        rightBox = { x: pad + lw + gap, y: pad, w: w - 2 * pad - gap - lw, h: h - 2 * pad };
        drawDivider(ctx, leftBox.x + leftBox.w + gap * 0.5, pad, leftBox.x + leftBox.w + gap * 0.5, h - pad, pal);
      } else {
        const lh = Math.round((h - 2 * pad - gap) * 0.54);
        leftBox = { x: pad, y: pad, w: w - 2 * pad, h: lh };
        rightBox = { x: pad, y: pad + lh + gap, w: w - 2 * pad, h: h - 2 * pad - gap - lh };
        drawDivider(ctx, pad, leftBox.y + leftBox.h + gap * 0.5, w - pad, leftBox.y + leftBox.h + gap * 0.5, pal);
      }

      // LEFT: Live 4-element solution plot
      drawPlotFrame(ctx, leftBox, pal, "-u\" = 2, u(0) = 1, u'(1) = 0.5", 'x ∈ [0, 1]', '');

      const px0 = leftBox.x + 48;
      const px1 = leftBox.x + leftBox.w - 18;
      const py0 = leftBox.y + 34;
      const py1 = leftBox.y + leftBox.h - 22;

      const yMin = 0.4;
      const yMax = Math.max(3.1, res.U[0] + 0.5, res.U[4] + 0.35);
      function mx(x) { return px0 + x * (px1 - px0); }
      function my(y) { return py1 - ((y - yMin) / (yMax - yMin)) * (py1 - py0); }

      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.lineTo(px1, py1);
      ctx.stroke();

      [1, 2, 3].forEach(function (yv) {
        if (yv > yMax) return;
        const yy = my(yv);
        drawDashed(ctx, px0, yy, px1, yy, pal.grid, [3, 4], 1);
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(yv), px0 - 7, yy);
      });

      // Exact parabola (dashed teal)
      ctx.save();
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        const xx = mx(x);
        const yy = my(exactU(x));
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      ctx.restore();

      // Solved P1 curve (solid cardinal)
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 4; i++) {
        const xx = mx(i * 0.25);
        const yy = my(clamp(res.U[i], yMin, yMax));
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();

      // Nodes
      for (let i = 0; i <= 4; i++) {
        const xx = mx(i * 0.25);
        const yy = my(clamp(res.U[i], yMin, yMax));
        ctx.beginPath();
        ctx.arc(xx, yy, 4.4, 0, Math.PI * 2);
        ctx.fillStyle = pal.surface;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = pal.cardinal;
        ctx.stroke();
      }

      // Target u(0)=1 ring at x=0
      const yT = my(1.0);
      ctx.beginPath();
      ctx.arc(px0, yT, 6.2, 0, Math.PI * 2);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = pal.teal;
      ctx.stroke();

      // RIGHT: Live Matrix Structure Schematic
      drawPlotFrame(ctx, rightBox, pal, 'System Structure (' + res.matType + ')', '', '');

      const n = res.sysSize;
      const mTop = rightBox.y + 30;
      const availW = rightBox.w - 24;
      const availH = rightBox.h - 56;
      const cell = Math.floor(Math.min(availW / n, availH / n, 30));
      const gW = cell * n;
      const gH = cell * n;
      const gx = rightBox.x + Math.round((rightBox.w - gW) * 0.5);
      const gy = mTop + Math.round((availH - gH) * 0.5);

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const cx = gx + c * cell;
          const cy = gy + r * cell;
          let fill = withAlpha(pal.surface, 0.45);
          let stroke = pal.border;
          let tag = '';

          if (method === 'lm' && (r === n - 1 || c === n - 1)) {
            if (r === n - 1 && c === n - 1) {
              fill = withAlpha(pal.cardinal, 0.16);
              stroke = pal.cardinal;
              tag = '0';
            } else if ((r === 0 && c === n - 1) || (r === n - 1 && c === 0)) {
              fill = withAlpha(pal.amber, 0.36);
              stroke = pal.amber;
              tag = '1';
            }
          } else {
            const isTridiag = Math.abs(r - c) <= 1;
            if (isTridiag) {
              fill = withAlpha(pal.teal, pal.theme === 'dark' ? 0.24 : 0.18);
              stroke = pal.teal;
            }
            if (method === 'penalty' && r === 0 && c === 0) {
              fill = withAlpha(pal.cardinal, 0.42);
              stroke = pal.cardinal;
              tag = 'β';
            }
            if (method === 'nitsche' && r <= 1 && c <= 1 && (r === 0 || c === 0)) {
              fill = withAlpha(pal.amber, 0.34);
              stroke = pal.amber;
              if (r === 0 && c === 0) tag = 'μ';
            }
          }

          ctx.fillStyle = fill;
          ctx.fillRect(cx + 1, cy + 1, cell - 2, cell - 2);
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1.1;
          ctx.strokeRect(cx + 1, cy + 1, cell - 2, cell - 2);

          if (tag && cell >= 18) {
            ctx.font = FONT_MONO_BOLD;
            ctx.fillStyle = pal.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tag, cx + cell * 0.5, cy + cell * 0.5 + 0.5);
          }
        }
      }

      // Bottom summary annotation inside matrix card
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(res.extraInfo + '  ·  Symm: Yes', rightBox.x + rightBox.w * 0.5, rightBox.y + rightBox.h - 6);
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render
    };
  });
})();
