(function () {
  'use strict';

  const ME340 = (window.ME340 = window.ME340 || {});
  const registerLab = function (id, fn) {
    if (typeof ME340.registerLab === 'function') {
      ME340.registerLab(id, fn);
    } else {
      ME340.labs = ME340.labs || {};
      ME340.labs[id] = fn;
    }
  };

  /* =========================================================================
   * Shared Typography, Color, Canvas & UI Helpers (All labels >= 15px)
   * ========================================================================= */

  const FONT_SANS = '500 15px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const FONT_SANS_BOLD = '600 15px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const FONT_TITLE = '600 16px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const FONT_MONO = '500 15px "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';
  const FONT_MONO_BOLD = '600 15px "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';
  const FONT_SERIF = 'italic 16px "IBM Plex Sans", Georgia, serif';

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function fmt(v, digits) {
    const d = typeof digits === 'number' ? digits : 2;
    const clean = Math.abs(v) < Math.pow(10, -(d + 1)) ? 0 : v;
    return clean.toFixed(d);
  }

  function fmtSigned(v, digits) {
    const d = typeof digits === 'number' ? digits : 1;
    const clean = Math.abs(v) < Math.pow(10, -(d + 1)) ? 0 : v;
    return (clean > 0 ? '+' : '') + clean.toFixed(d);
  }

  function parseColorRgb(color) {
    if (!color || typeof color !== 'string') return [229, 72, 77];
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

  function stressFill(normVal, pal, alphaScale) {
    const a = typeof alphaScale === 'number' ? alphaScale : 0.85;
    const v = clamp(normVal, -1, 1);
    const neutral = parseColorRgb(pal.surface2);
    const pos = parseColorRgb(pal.cardinal);
    const posPeak = parseColorRgb(pal.amber);
    const neg = parseColorRgb(pal.blue);
    const negPeak = parseColorRgb(pal.teal);
    let rgb;
    if (v >= 0) {
      rgb = v < 0.72
        ? mixRgb(neutral, pos, v / 0.72)
        : mixRgb(pos, posPeak, (v - 0.72) / 0.28);
    } else {
      const av = -v;
      rgb = av < 0.72
        ? mixRgb(neutral, neg, av / 0.72)
        : mixRgb(neg, negPeak, (av - 0.72) / 0.28);
    }
    const alpha = clamp((0.12 + 0.88 * Math.abs(v)) * a, 0.06, 0.96);
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha.toFixed(3) + ')';
  }

  function energyFill(tNorm, pal, alphaScale) {
    const t = clamp(tNorm, 0, 1);
    const a = typeof alphaScale === 'number' ? alphaScale : 0.9;
    const c0 = parseColorRgb(pal.surface);
    const c1 = parseColorRgb(pal.teal);
    const c2 = parseColorRgb(pal.amber);
    const c3 = parseColorRgb(pal.cardinal);
    let rgb;
    if (t < 0.35) {
      rgb = mixRgb(c0, c1, t / 0.35);
    } else if (t < 0.7) {
      rgb = mixRgb(c1, c2, (t - 0.35) / 0.35);
    } else {
      rgb = mixRgb(c2, c3, (t - 0.7) / 0.3);
    }
    const alpha = clamp((0.08 + 0.92 * Math.pow(t, 0.75)) * a, 0.04, 0.96);
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

  function attachSelectiveTouchLock(canvas, shouldLockFn) {
    function onTouchStart(ev) {
      if (ev.touches && ev.touches.length === 1) {
        const t = ev.touches[0];
        const rect = canvas.getBoundingClientRect();
        const pos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
        if (shouldLockFn(pos)) {
          ev.preventDefault();
        }
      }
    }
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    return function detach() {
      canvas.removeEventListener('touchstart', onTouchStart);
    };
  }

  function getPointerPos(canvas, ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top
    };
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, lineWidth, headLen) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1.5) return;
    const lw = lineWidth || 2.2;
    const hl = Math.min(headLen || 11, len * 0.48);
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

  function drawDoubleArrow(ctx, x1, y1, x2, y2, color, lineWidth, headLen) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 6) return;
    const mx = 0.5 * (x1 + x2);
    const my = 0.5 * (y1 + y2);
    drawArrow(ctx, mx, my, x2, y2, color, lineWidth, headLen);
    drawArrow(ctx, mx, my, x1, y1, color, lineWidth, headLen);
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
    const rad = Math.min(r, 2, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
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
    const padX = o.padX || 6;
    const boxH = o.boxH || 22;
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
    ctx.fillStyle = o.bg || withAlpha(pal.bg, 0.84);
    ctx.fill();

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
    const depth = 11 * (dirSign || -1);
    for (let y = y1 + 3; y <= y2 - 2; y += step) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depth, y + 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlotFrame(ctx, box, pal, title, xLabel, yLabel) {
    ctx.save();
    // Tufte-open plot frame: transparent background + subtle hairline top divider (no heavy boxed fill)
    ctx.strokeStyle = withAlpha(pal.border, 0.85);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x + 8, box.y + 1);
    ctx.lineTo(box.x + box.w - 8, box.y + 1);
    ctx.stroke();

    if (title) {
      ctx.font = FONT_SANS_BOLD;
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(title, box.x + 10, box.y + 7);
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
      ctx.fillText(yLabel, box.x + 10, box.y + (title ? 27 : 7));
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
   * LAB 1: 'hero-mesh' (Slide 1 Full-Bleed Elastic Continuum Mesh)
   * ========================================================================= */
  registerLab('hero-mesh', function (mountEl, api) {
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
      ty: 0.46,
      x: 0.72,
      y: 0.46,
      vx: 0,
      vy: 0,
      strength: 0.85,
      lastMoveMs: 0
    };

    function onPointerMove(ev) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const nx = clamp((ev.clientX - rect.left) / rect.width, -0.05, 1.05);
      const ny = clamp((ev.clientY - rect.top) / rect.height, -0.05, 1.05);
      if (ev.pointerType === 'touch') {
        // Gentle passive follow on touch so vertical page scrolling stays calm and uninterrupted
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

    let timeSec = 0;

    function renderFrame(dt, tNow) {
      const fit = fitCanvas(canvas);
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const isDark = pal.theme === 'dark';

      if (typeof tNow === 'number') timeSec = tNow;
      const stepDt = dt || 0.016;

      // Smooth virtual elastic probe when cursor is idle
      const idleSec = (performance.now() - pointer.lastMoveMs) / 1000;
      let targetX = pointer.tx;
      let targetY = pointer.ty;
      if (!pointer.active || idleSec > 4.5) {
        targetX = 0.68 + 0.16 * Math.cos(timeSec * 0.55);
        targetY = 0.46 + 0.17 * Math.sin(timeSec * 0.78);
      }

      const prevX = pointer.x;
      const prevY = pointer.y;
      const alpha = 1 - Math.exp(-8.0 * stepDt);
      pointer.x = lerp(pointer.x, targetX, alpha);
      pointer.y = lerp(pointer.y, targetY, alpha);
      const dvx = (pointer.x - prevX) / Math.max(stepDt, 0.004);
      const dvy = (pointer.y - prevY) / Math.max(stepDt, 0.004);
      pointer.vx = lerp(pointer.vx, clamp(dvx * w, -480, 480), 0.18);
      pointer.vy = lerp(pointer.vy, clamp(dvy * h, -480, 480), 0.18);

      const cx = pointer.x * w;
      const cy = pointer.y * h;

      // Background base
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle radial elastic halo under cursor
      const haloR = Math.min(w, h) * 0.44;
      const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, haloR);
      grad.addColorStop(0, withAlpha(pal.cardinal, isDark ? 0.16 : 0.10));
      grad.addColorStop(0.45, withAlpha(pal.teal, isDark ? 0.09 : 0.06));
      grad.addColorStop(1, withAlpha(pal.bg, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Build finite-element grid spanning viewport + margin
      const isNarrow = w < 480;
      const spacing = isNarrow
        ? clamp(Math.round(Math.min(w, h) / 10), 38, 52)
        : clamp(Math.round(Math.min(w, h) / 14), 44, 62);
      const cols = Math.ceil(w / spacing) + 3;
      const rows = Math.ceil(h / spacing) + 3;
      const ox = -spacing;
      const oy = -spacing;

      const nu = 0.30;
      const sigmaEnv = isNarrow
        ? Math.max(105, Math.min(w, h) * 0.28)
        : Math.max(135, Math.min(w, h) * 0.26);
      const inv2Sig2 = 1 / (2 * sigmaEnv * sigmaEnv);
      const rCore2 = 34 * 34;

      const pxArr = new Float32Array(cols * rows);
      const pyArr = new Float32Array(cols * rows);

      // Point-force direction mixes gentle breathing traction + pointer drag velocity
      const fx = 0.42 * pointer.vx + 28 * Math.cos(timeSec * 0.9);
      const fy = 0.42 * pointer.vy + 28 * Math.sin(timeSec * 0.9);
      const radialAmp = 34 + 6 * Math.sin(timeSec * 1.6);

      for (let j = 0; j < rows; j++) {
        const y0 = oy + j * spacing;
        for (let i = 0; i < cols; i++) {
          const x0 = ox + i * spacing;
          const idx = j * cols + i;

          // Ambient breathing shear/dilatation wave
          const uAmbX = 5.2 * Math.sin(x0 * 0.0085 + timeSec * 0.95) * Math.cos(y0 * 0.007 - timeSec * 0.6);
          const uAmbY = 4.6 * Math.cos(x0 * 0.0072 - timeSec * 0.75) * Math.sin(y0 * 0.009 + timeSec * 0.85);

          // Regularized Kelvin-like displacement around pointer
          const dx = x0 - cx;
          const dy = y0 - cy;
          const r2 = dx * dx + dy * dy;
          const regR2 = r2 + rCore2;
          const env = Math.exp(-r2 * inv2Sig2);

          // Radial indentation + Kelvin directional kernel
          const radScale = (radialAmp * env) / Math.sqrt(regR2);
          const urx = dx * radScale;
          const ury = dy * radScale;

          const logTerm = -(3 - 4 * nu) * 0.5 * Math.log(regR2 / (sigmaEnv * sigmaEnv * 4));
          const dotF = dx * fx + dy * fy;
          const kScale = 0.048 * env;
          const ukx = kScale * (logTerm * fx + (dx * dotF) / regR2);
          const uky = kScale * (logTerm * fy + (dy * dotF) / regR2);

          pxArr[idx] = x0 + uAmbX + urx + ukx;
          pyArr[idx] = y0 + uAmbY + ury + uky;
        }
      }

      // Compute quad strain energy and draw heatmap + principal crosses
      const crosses = [];
      const lam = nu / ((1 + nu) * (1 - 2 * nu));
      const mu = 1 / (2 * (1 + nu));
      const invSp = 1 / spacing;

      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const i00 = j * cols + i;
          const i10 = i00 + 1;
          const i01 = i00 + cols;
          const i11 = i01 + 1;

          const x00 = pxArr[i00], y00 = pyArr[i00];
          const x10 = pxArr[i10], y10 = pyArr[i10];
          const x11 = pxArr[i11], y11 = pyArr[i11];
          const x01 = pxArr[i01], y01 = pyArr[i01];

          // Average element displacement gradient
          const dudx = 0.5 * ((x10 - x00) + (x11 - x01)) * invSp - 1;
          const dudy = 0.5 * ((x01 - x00) + (x11 - x10)) * invSp;
          const dvdx = 0.5 * ((y10 - y00) + (y11 - y01)) * invSp;
          const dvdy = 0.5 * ((y01 - y00) + (y11 - y10)) * invSp - 1;

          const exx = dudx;
          const eyy = dvdy;
          const exy = 0.5 * (dudy + dvdx);
          const tr = exx + eyy;

          const sxx = lam * tr + 2 * mu * exx;
          const syy = lam * tr + 2 * mu * eyy;
          const sxy = 2 * mu * exy;
          const energy = 0.5 * (sxx * exx + syy * eyy + 2 * sxy * exy);
          const eNorm = clamp(Math.sqrt(Math.max(0, energy)) * 2.9, 0, 1);

          if (eNorm > 0.08) {
            ctx.beginPath();
            ctx.moveTo(x00, y00);
            ctx.lineTo(x10, y10);
            ctx.lineTo(x11, y11);
            ctx.lineTo(x01, y01);
            ctx.closePath();
            ctx.fillStyle = energyFill(eNorm, pal, isDark ? 0.34 : 0.24);
            ctx.fill();
          }

          const qx = 0.25 * (x00 + x10 + x11 + x01);
          const qy = 0.25 * (y00 + y10 + y11 + y01);
          const dist2 = (qx - cx) * (qx - cx) + (qy - cy) * (qy - cy);
          if (dist2 < sigmaEnv * sigmaEnv * 1.15 && eNorm > 0.14) {
            const avg = 0.5 * (sxx + syy);
            const rad = Math.hypot(0.5 * (sxx - syy), sxy);
            const s1 = avg + rad;
            const s2 = avg - rad;
            const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
            crosses.push({ x: qx, y: qy, s1: s1, s2: s2, ang: ang, weight: eNorm });
          }
        }
      }

      // Draw crisp deformed mesh lines
      ctx.lineWidth = isDark ? 1.05 : 1.15;
      ctx.strokeStyle = isDark ? 'rgba(236, 232, 224, 0.11)' : 'rgba(26, 25, 23, 0.18)';
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        const base = j * cols;
        ctx.moveTo(pxArr[base], pyArr[base]);
        for (let i = 1; i < cols; i++) {
          ctx.lineTo(pxArr[base + i], pyArr[base + i]);
        }
      }
      for (let i = 0; i < cols; i++) {
        ctx.moveTo(pxArr[i], pyArr[i]);
        for (let j = 1; j < rows; j++) {
          ctx.lineTo(pxArr[j * cols + i], pyArr[j * cols + i]);
        }
      }
      ctx.stroke();

      // Highlight deformed mesh segments near the cursor
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, sigmaEnv * 1.05, 0, Math.PI * 2);
      ctx.clip();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = withAlpha(pal.teal, isDark ? 0.36 : 0.48);
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        const base = j * cols;
        ctx.moveTo(pxArr[base], pyArr[base]);
        for (let i = 1; i < cols; i++) {
          ctx.lineTo(pxArr[base + i], pyArr[base + i]);
        }
      }
      for (let i = 0; i < cols; i++) {
        ctx.moveTo(pxArr[i], pyArr[i]);
        for (let j = 1; j < rows; j++) {
          ctx.lineTo(pxArr[j * cols + i], pyArr[j * cols + i]);
        }
      }
      ctx.stroke();
      ctx.restore();

      // Draw principal stress crosses near cursor
      for (let k = 0; k < crosses.length; k++) {
        const c = crosses[k];
        const ca = Math.cos(c.ang);
        const sa = Math.sin(c.ang);
        const l1 = clamp(Math.abs(c.s1) * 26, 4, 15);
        const l2 = clamp(Math.abs(c.s2) * 26, 4, 15);
        const aAlpha = clamp(0.28 + c.weight * 0.65, 0.2, 0.88);

        ctx.lineWidth = 1.8;
        ctx.strokeStyle = withAlpha(c.s1 >= 0 ? pal.cardinal : pal.teal, aAlpha);
        ctx.beginPath();
        ctx.moveTo(c.x - ca * l1, c.y - sa * l1);
        ctx.lineTo(c.x + ca * l1, c.y + sa * l1);
        ctx.stroke();

        ctx.strokeStyle = withAlpha(c.s2 >= 0 ? pal.cardinal : pal.blue, aAlpha * 0.9);
        ctx.beginPath();
        ctx.moveTo(c.x + sa * l2, c.y - ca * l2);
        ctx.lineTo(c.x - sa * l2, c.y + ca * l2);
        ctx.stroke();
      }

      // Subtle cursor traction ring
      ctx.save();
      ctx.strokeStyle = withAlpha(pal.cardinal, isDark ? 0.52 : 0.42);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + 2.5 * Math.sin(timeSec * 3.2), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = pal.cardinal;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
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
   * LAB 2: 'continuum-mini' (Slide 2 Bento Visual: Omega_0 -> Omega)
   * ========================================================================= */
  registerLab('continuum-mini', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'lam', label: 'Load λ', value: '0.65' },
        { id: 'umax', label: 'Max |u|', value: '0.32 L' },
        { id: 'jac', label: 'Area J', value: '1.08' }
      ],
      sliders: [
        {
          id: 'load',
          label: 'Load λ',
          min: 0,
          max: 1,
          step: 0.01,
          value: 0.65,
          format: function (v) { return Math.round(v * 100) + '%'; }
        }
      ],
      caption: 'Reference body Ω₀ maps smoothly to deformed Ω via x = X + u(X).'
    });

    let autoPlay = true;
    let loadVal = 0.65;
    let phase = 0.8;

    const pills = createPillGroup(dom.toolbar, [
      { id: 'auto', label: 'Auto Morph' },
      { id: 'manual', label: 'Manual Load' }
    ], 'auto', function (id) {
      autoPlay = id === 'auto';
      render();
    });

    dom.sliders.load.input.addEventListener('input', function () {
      autoPlay = false;
      pills.setActive('manual');
      loadVal = parseFloat(dom.sliders.load.input.value);
      dom.sliders.load.valEl.textContent = Math.round(loadVal * 100) + '%';
      render();
    });

    // Parametric organic blob boundary in reference coords [-1, 1]
    function blobPoint(theta) {
      const r = 0.82 + 0.14 * Math.cos(2 * theta - 0.5) + 0.08 * Math.sin(3 * theta + 0.4);
      return { X: r * Math.cos(theta), Y: r * Math.sin(theta) };
    }

    function deformMap(X, Y, lam) {
      const ux = lam * (0.48 + 0.24 * X + 0.18 * Y + 0.05 * X * Y);
      const uy = lam * (-0.06 - 0.14 * Y + 0.12 * X + 0.05 * X * X);
      return { x: X + ux, y: Y + uy, ux: ux, uy: uy };
    }

    // Tracked interior material points
    const particles = [];
    for (let gy = -0.45; gy <= 0.46; gy += 0.45) {
      for (let gx = -0.45; gx <= 0.46; gx += 0.45) {
        particles.push({ X: gx, Y: gy });
      }
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 210, { breakpoint: 480, minH: 245 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const isNarrow = w < 480;

      ctx.clearRect(0, 0, w, h);

      // Subtle background grid
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      const gStep = 28;
      ctx.beginPath();
      for (let gx = gStep; gx < w; gx += gStep) {
        ctx.moveTo(gx, 0); ctx.lineTo(gx, h);
      }
      for (let gy = gStep; gy < h; gy += gStep) {
        ctx.moveTo(0, gy); ctx.lineTo(w, gy);
      }
      ctx.stroke();

      const scale = Math.min(w * (isNarrow ? 0.24 : 0.26), h * 0.30);
      const cx0 = w * (isNarrow ? 0.35 : 0.36);
      const cy0 = h * 0.53;

      function toPx(mx, my) {
        return { x: cx0 + mx * scale, y: cy0 - my * scale };
      }

      // Draw reference contour Omega_0 (dashed)
      const N = 72;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const p0 = blobPoint(th);
        const s0 = toPx(p0.X, p0.Y);
        if (i === 0) ctx.moveTo(s0.x, s0.y);
        else ctx.lineTo(s0.x, s0.y);
      }
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.teal, pal.theme === 'dark' ? 0.10 : 0.08);
      ctx.fill();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw deformed continuum Omega
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const p0 = blobPoint(th);
        const d = deformMap(p0.X, p0.Y, loadVal);
        const sd = toPx(d.x, d.y);
        if (i === 0) ctx.moveTo(sd.x, sd.y);
        else ctx.lineTo(sd.x, sd.y);
      }
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.cardinal, pal.theme === 'dark' ? 0.17 : 0.12);
      ctx.fill();
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Clipped deformed material grid inside Omega
      ctx.clip();
      ctx.strokeStyle = withAlpha(pal.cardinal, 0.34);
      ctx.lineWidth = 1.1;
      for (let v = -0.9; v <= 0.91; v += 0.3) {
        ctx.beginPath();
        for (let s = -1.1; s <= 1.11; s += 0.1) {
          const d = deformMap(s, v, loadVal);
          const p = toPx(d.x, d.y);
          if (s <= -1.05) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        ctx.beginPath();
        for (let s = -1.1; s <= 1.11; s += 0.1) {
          const d = deformMap(v, s, loadVal);
          const p = toPx(d.x, d.y);
          if (s <= -1.05) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Draw particle tracks X -> x and displacement vectors u(X)
      let maxU = 0;
      for (let k = 0; k < particles.length; k++) {
        const pt = particles[k];
        const p0 = toPx(pt.X, pt.Y);
        const d = deformMap(pt.X, pt.Y, loadVal);
        const pd = toPx(d.x, d.y);
        const uMag = Math.hypot(d.ux, d.uy);
        if (uMag > maxU) maxU = uMag;

        // Dotted trajectory trail
        if (loadVal > 0.03) {
          ctx.save();
          ctx.strokeStyle = withAlpha(pal.amber, 0.55);
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          for (let s = 0; s <= 12; s++) {
            const ds = deformMap(pt.X, pt.Y, (s / 12) * loadVal);
            const ps = toPx(ds.x, ds.y);
            if (s === 0) ctx.moveTo(ps.x, ps.y); else ctx.lineTo(ps.x, ps.y);
          }
          ctx.stroke();
          ctx.restore();

          drawArrow(ctx, p0.x, p0.y, pd.x, pd.y, pal.amber, 1.9, 8.5);
        }

        // Reference particle dot
        ctx.fillStyle = pal.teal;
        ctx.beginPath();
        ctx.arc(p0.x, p0.y, 3.6, 0, Math.PI * 2);
        ctx.fill();

        // Deformed particle dot
        ctx.fillStyle = pal.cardinal;
        ctx.beginPath();
        ctx.arc(pd.x, pd.y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels (>= 15px, anchored cleanly to avoid collision at any loadVal or narrow width)
      const bounds = { x: 0, y: 0, w: w, h: h };
      drawLabelPill(ctx, 'Ω₀ Reference', 10, 20, pal, { color: pal.teal, align: 'left', clampTo: bounds });
      drawLabelPill(ctx, 'Ω Deformed', w - 10, 20, pal, { color: pal.cardinal, align: 'right', clampTo: bounds });
      if (loadVal > 0.15) {
        drawLabelPill(ctx, 'u(X) = x − X', w * 0.5, h - 18, pal, { color: pal.amber, clampTo: bounds });
      }

      // Exact Jacobian det(F) at origin
      const F11 = 1 + 0.24 * loadVal;
      const F12 = 0.18 * loadVal;
      const F21 = 0.12 * loadVal;
      const F22 = 1 - 0.14 * loadVal;
      const J = F11 * F22 - F12 * F21;

      dom.readouts.lam.val.textContent = fmt(loadVal, 2);
      dom.readouts.umax.val.textContent = fmt(maxU, 2) + ' L';
      dom.readouts.jac.val.textContent = fmt(J, 3);
    }

    const stopLoop = api.registerAnimationLoop(function (dt) {
      if (!autoPlay) return;
      phase += dt * 1.15;
      loadVal = 0.5 + 0.48 * Math.sin(phase);
      dom.sliders.load.input.value = loadVal.toFixed(2);
      dom.sliders.load.valEl.textContent = Math.round(loadVal * 100) + '%';
      render();
    });

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () { stopLoop(); }
    };
  });

  /* =========================================================================
   * LAB 3: 'tensor-playground' (Slide 5: Einstein Summation & Contraction)
   * ========================================================================= */
  registerLab('tensor-playground', function (mountEl, api) {
    const EXPRESSIONS = {
      dot: {
        id: 'dot',
        label: 'Dot: a_i b_i',
        tokens: [
          { sym: 'a', indices: ['i'] },
          { sym: 'b', indices: ['i'] }
        ],
        free: [],
        dummy: ['i'],
        rank: '0 (Scalar)',
        terms: '3 terms',
        expanded: 'a₁b₁ + a₂b₂ + a₃b₃ = (2)(4) + (−1)(2) + (3)(1) = 9',
        expandedNarrow: ['a₁b₁ + a₂b₂ + a₃b₃', '= 2·4 + (−1)·2 + 3·1 = 9'],
        summary: 'Repeated index i contracts two vectors into one scalar.'
      },
      trace: {
        id: 'trace',
        label: 'Trace: σ_ii',
        tokens: [
          { sym: 'σ', indices: ['i', 'i'] }
        ],
        free: [],
        dummy: ['i'],
        rank: '0 (Scalar)',
        terms: '3 diag.',
        expanded: 'σ₁₁ + σ₂₂ + σ₃₃ = 120 + 40 + (−30) = 130 MPa',
        expandedNarrow: ['σ₁₁ + σ₂₂ + σ₃₃', '= 120 + 40 − 30 = 130 MPa'],
        summary: 'Repeated index i sums the diagonal entries of σ.'
      },
      div: {
        id: 'div',
        label: 'Div: σ_ij,j',
        tokens: [
          { sym: '∂/∂x', indices: ['j'] },
          { sym: 'σ', indices: ['i', 'j'] }
        ],
        free: ['i'],
        dummy: ['j'],
        rank: '1 (Vector)',
        terms: '3 × 3',
        expanded: 'i = 1: σ₁₁,₁ + σ₁₂,₂ + σ₁₃,₃   (same for i = 2, 3)',
        expandedNarrow: ['i = 1: σ₁₁,₁ + σ₁₂,₂ + σ₁₃,₃', '(same sum for i = 2, 3)'],
        summary: 'Dummy j sums across columns; free i labels 3 balance rows.'
      },
      hooke: {
        id: 'hooke',
        label: 'Hooke: C_ijkl ε_kl',
        tokens: [
          { sym: 'C', indices: ['i', 'j', 'k', 'l'] },
          { sym: 'ε', indices: ['k', 'l'] }
        ],
        free: ['i', 'j'],
        dummy: ['k', 'l'],
        rank: '2 (Tensor)',
        terms: '9 × 9',
        expanded: 'σᵢⱼ = Σₖ Σₗ Cᵢⱼₖₗ εₖₗ = λ εₖₖ δᵢⱼ + 2μ εᵢⱼ',
        expandedNarrow: ['σᵢⱼ = Σₖ Σₗ Cᵢⱼₖₗ εₖₗ', '= λ εₖₖ δᵢⱼ + 2μ εᵢⱼ'],
        summary: 'Double contraction over (k, l) maps strain ε to stress σ_ij.'
      }
    };

    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'free', label: 'Free', value: 'None' },
        { id: 'dummy', label: 'Dummy', value: 'i' },
        { id: 'rank', label: 'Rank', value: '0 (Scalar)' },
        { id: 'terms', label: 'Terms', value: '3 terms' }
      ],
      caption: 'Click or hover an index chip on the canvas to inspect free vs. summed contractions.'
    });

    let currentId = 'dot';
    let focusIndex = 'i';
    let animTick = 0;
    let indexChipHits = [];

    createPillGroup(dom.toolbar, [
      { id: 'dot', label: 'Dot: a_i b_i' },
      { id: 'trace', label: 'Trace: σ_ii' },
      { id: 'div', label: 'Div: σ_ij,j' },
      { id: 'hooke', label: 'Hooke: C_ijkl ε_kl' }
    ], currentId, function (id) {
      currentId = id;
      const expr = EXPRESSIONS[id];
      focusIndex = expr.dummy[0] || expr.free[0] || null;
      render();
    });

    const idxHint = document.createElement('span');
    idxHint.className = 'lab-toolbar-hint';
    idxHint.textContent = 'Hover index';
    dom.toolbar.appendChild(idxHint);

    function hitIndexChip(pos) {
      for (let i = 0; i < indexChipHits.length; i++) {
        const c = indexChipHits[i];
        if (pos.x >= c.x && pos.x <= c.x + c.w && pos.y >= c.y && pos.y <= c.y + c.h) {
          return c.ch;
        }
      }
      return null;
    }

    function onCanvasMove(ev) {
      const ch = hitIndexChip(getPointerPos(dom.canvas, ev));
      dom.canvas.style.cursor = ch ? 'pointer' : 'default';
      if (ch && ch !== focusIndex) {
        focusIndex = ch;
        render();
      }
    }

    function onCanvasDown(ev) {
      const ch = hitIndexChip(getPointerPos(dom.canvas, ev));
      if (ch && ch !== focusIndex) {
        focusIndex = ch;
        render();
      }
    }

    dom.canvas.addEventListener('pointermove', onCanvasMove);
    dom.canvas.addEventListener('pointerdown', onCanvasDown);

    function drawIndexHeader(ctx, expr, w, topY, pal) {
      // Measure total width of visual tensor symbol + index chips
      const isNarrow = w < 460;
      const chipW = isNarrow ? 25 : 28;
      const chipH = 26;
      const symW = isNarrow ? 40 : 46;
      const wideSymW = isNarrow ? 58 : 64;
      const gap = isNarrow ? 12 : 22;
      const chipGap = isNarrow ? 3 : 4;

      const slots = [];
      indexChipHits = [];
      let totalW = 0;
      expr.tokens.forEach(function (tok, ti) {
        const tw = (tok.sym.length > 2 ? wideSymW : symW) + tok.indices.length * (chipW + chipGap);
        totalW += tw + (ti > 0 ? gap : 0);
      });

      let curX = (w - totalW) * 0.5;
      expr.tokens.forEach(function (tok, ti) {
        if (ti > 0) curX += gap;
        const baseW = tok.sym.length > 2 ? wideSymW : symW;
        drawRoundRect(ctx, curX, topY, baseW, 38, 8);
        ctx.fillStyle = pal.surface2;
        ctx.fill();
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.font = FONT_TITLE;
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tok.sym, curX + baseW * 0.5, topY + 19);
        curX += baseW + chipGap;

        tok.indices.forEach(function (ch) {
          const isDummy = expr.dummy.indexOf(ch) !== -1;
          const isFocus = focusIndex === ch;
          const col = isDummy ? pal.teal : pal.cardinal;
          const cx = curX + chipW * 0.5;
          const cy = topY + 24;

          drawRoundRect(ctx, curX, topY + 11, chipW, chipH, 6);
          ctx.fillStyle = withAlpha(col, isFocus ? 0.32 : 0.14);
          ctx.fill();
          ctx.strokeStyle = withAlpha(col, isFocus ? 1.0 : 0.65);
          ctx.lineWidth = isFocus ? 2.4 : 1.5;
          ctx.stroke();

          ctx.font = FONT_MONO_BOLD;
          ctx.fillStyle = col;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ch, cx, cy);

          indexChipHits.push({ ch: ch, x: curX - 4, y: topY + 7, w: chipW + 8, h: chipH + 8 });
          slots.push({ ch: ch, x: cx, yTop: topY + 11, yBot: topY + 37, isDummy: isDummy, isFocus: isFocus });
          curX += chipW + chipGap;
        });
      });

      // Draw contraction arcs connecting matching dummy indices
      expr.dummy.forEach(function (dName, dIdx) {
        const pair = slots.filter(function (s) { return s.ch === dName; });
        if (pair.length >= 2) {
          const a = pair[0];
          const b = pair[1];
          const isFocus = focusIndex === dName;
          const arcLift = 16 + dIdx * 10;
          ctx.save();
          ctx.strokeStyle = withAlpha(pal.teal, isFocus ? 1.0 : 0.52);
          ctx.lineWidth = isFocus ? 2.6 : 1.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.yTop - 2);
          ctx.bezierCurveTo(a.x, a.yTop - arcLift, b.x, b.yTop - arcLift, b.x, b.yTop - 2);
          ctx.stroke();
          ctx.restore();
        }
      });

      // Draw open stems under free indices
      slots.filter(function (s) { return !s.isDummy; }).forEach(function (s) {
        ctx.save();
        ctx.strokeStyle = withAlpha(pal.cardinal, s.isFocus ? 1.0 : 0.55);
        ctx.lineWidth = s.isFocus ? 2.6 : 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x, s.yBot + 2);
        ctx.lineTo(s.x, s.yBot + 14);
        ctx.stroke();
        ctx.fillStyle = pal.cardinal;
        ctx.beginPath();
        ctx.arc(s.x, s.yBot + 15, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function drawMatrixBox(ctx, x, y, cellW, cellH, rows, cols, values, highlightFn, title, pal) {
      ctx.save();
      if (title) {
        ctx.font = FONT_SANS_BOLD;
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(title, x + (cols * cellW) * 0.5, y - 6);
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const rx = x + c * cellW;
          const ry = y + r * cellH;
          const hl = highlightFn(r, c);
          drawRoundRect(ctx, rx + 2, ry + 2, cellW - 4, cellH - 4, 6);
          ctx.fillStyle = hl ? withAlpha(hl, 0.25) : withAlpha(pal.surface2, 0.72);
          ctx.fill();
          ctx.strokeStyle = hl ? hl : pal.border;
          ctx.lineWidth = hl ? 2.1 : 1.1;
          ctx.stroke();

          ctx.font = FONT_MONO;
          ctx.fillStyle = hl ? pal.text : pal.textMuted;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(values[r][c]), rx + cellW * 0.5, ry + cellH * 0.5 + 0.5);
        }
      }
      ctx.restore();
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 270, {
        breakpoint: 460,
        minH: currentId === 'hooke' ? 405 : 300
      });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const expr = EXPRESSIONS[currentId];
      const isNarrow = w < 460;

      ctx.clearRect(0, 0, w, h);

      // Update readout chips
      dom.readouts.free.val.textContent = expr.free.length ? expr.free.join(', ') : 'None';
      dom.readouts.dummy.val.textContent = expr.dummy.join(', ');
      dom.readouts.rank.val.textContent = expr.rank;
      dom.readouts.terms.val.textContent = expr.terms;

      const activeStep = Math.floor(animTick) % 3;

      // 1. Top visual index blocks & contraction arcs
      drawIndexHeader(ctx, expr, w, isNarrow ? 24 : 28, pal);

      // 2. Middle visual contraction diagram
      const midY = isNarrow ? 94 : 98;
      const midH = Math.max(104, h - (isNarrow ? 168 : 156));
      const cellH = clamp(Math.floor(midH / 3.4), 28, 36);

      if (currentId === 'dot') {
        const cw = isNarrow ? clamp(Math.floor(w * 0.16), 48, 60) : clamp(Math.floor(w * 0.14), 48, 72);
        const gap1 = isNarrow ? 34 : 46;
        const gap2 = isNarrow ? 38 : 50;
        const resW = cw + 14;
        const totalW = cw + gap1 + cw + gap2 + resW;
        const sx = (w - totalW) * 0.5;
        const aVals = [['2'], ['−1'], ['3']];
        const bVals = [['4'], ['2'], ['1']];

        drawMatrixBox(ctx, sx, midY + 14, cw, cellH, 3, 1, aVals, function (r) {
          return r === activeStep ? pal.teal : null;
        }, 'aᵢ', pal);

        const bx = sx + cw + gap1;
        drawMatrixBox(ctx, bx, midY + 14, cw, cellH, 3, 1, bVals, function (r) {
          return r === activeStep ? pal.teal : null;
        }, 'bᵢ', pal);

        // Connection line for active summation term
        const ay = midY + 14 + (activeStep + 0.5) * cellH;
        drawArrow(ctx, sx + cw + 4, ay, bx - 4, ay, pal.teal, 2.2, 8);

        // Result scalar box
        const rx = bx + cw + gap2;
        const ry = midY + 14 + cellH;
        drawArrow(ctx, bx + cw + 5, ay, rx - 5, ry + cellH * 0.5, pal.amber, 2.0, 8);
        drawMatrixBox(ctx, rx, ry, resW, cellH, 1, 1, [['9']], function () {
          return pal.amber;
        }, 'Scalar', pal);
      } else if (currentId === 'trace') {
        const gapT = isNarrow ? 30 : 46;
        const resW = isNarrow ? 72 : 84;
        const cw = isNarrow ? clamp(Math.floor((w - gapT - resW - 24) / 3), 50, 62) : clamp(Math.floor(w * 0.12), 50, 68);
        const matW = cw * 3;
        const sx = (w - (matW + gapT + resW)) * 0.5;
        const sig = [
          ['120', '35', '0'],
          ['35', '40', '−15'],
          ['0', '−15', '−30']
        ];
        drawMatrixBox(ctx, sx, midY + 14, cw, cellH, 3, 3, sig, function (r, c) {
          if (r === c) return r === activeStep ? pal.amber : pal.teal;
          return null;
        }, 'Stress σᵢⱼ (MPa)', pal);

        const rx = sx + matW + gapT;
        const ry = midY + 14 + cellH;
        drawArrow(ctx, sx + matW + 6, ry + cellH * 0.5, rx - 6, ry + cellH * 0.5, pal.teal, 2.2, 9);
        drawMatrixBox(ctx, rx, ry, resW, cellH, 1, 1, [['130']], function () {
          return pal.teal;
        }, 'tr(σ)', pal);
      } else if (currentId === 'div') {
        const gapD = isNarrow ? 26 : 48;
        const resW = isNarrow ? 64 : 82;
        const cw = isNarrow ? clamp(Math.floor((w - gapD - resW - 22) / 3), 60, 72) : clamp(Math.floor(w * 0.13), 56, 76);
        const matW = cw * 3;
        const sx = (w - (matW + gapD + resW)) * 0.5;
        const divs = [
          ['σ₁₁,₁', 'σ₁₂,₂', 'σ₁₃,₃'],
          ['σ₂₁,₁', 'σ₂₂,₂', 'σ₂₃,₃'],
          ['σ₃₁,₁', 'σ₃₂,₂', 'σ₃₃,₃']
        ];
        const freeRow = activeStep;
        drawMatrixBox(ctx, sx, midY + 14, cw, cellH, 3, 3, divs, function (r) {
          if (r === freeRow) return focusIndex === 'i' ? pal.cardinal : pal.teal;
          return null;
        }, 'Derivatives σᵢⱼ,ⱼ', pal);

        const rx = sx + matW + gapD;
        const rowY = midY + 14 + (freeRow + 0.5) * cellH;
        drawArrow(ctx, sx + matW + 5, rowY, rx - 5, rowY, focusIndex === 'i' ? pal.cardinal : pal.teal, 2.2, 9);

        drawMatrixBox(ctx, rx, midY + 14, resW, cellH, 3, 1, [['−f₁'], ['−f₂'], ['−f₃']], function (r) {
          return r === freeRow ? pal.cardinal : null;
        }, isNarrow ? 'Vec (i)' : 'Vector (i)', pal);
      } else {
        // Hooke: C_ijkl eps_kl = sigma_ij
        const eps = [
          ['0.20', '0.05', '0.00'],
          ['0.05', '−0.06', '0.00'],
          ['0.00', '0.00', '−0.06']
        ];
        const sig = [
          ['400', '77', '0'],
          ['77', '0', '0'],
          ['0', '0', '0']
        ];
        const freeR = activeStep % 2;
        const freeC = (activeStep === 2) ? 1 : freeR;

        if (isNarrow) {
          // Stack Strain 3x3 above Stress 3x3 vertically so 5-char numbers never overflow cells
          const cw = clamp(Math.floor((w - 56) / 3), 62, 82);
          const chStack = 29;
          const matW = cw * 3;
          const sx = (w - matW) * 0.5;
          const topMatY = 102;
          drawMatrixBox(ctx, sx, topMatY, cw, chStack, 3, 3, eps, function () {
            return (focusIndex === 'k' || focusIndex === 'l') ? pal.teal : null;
          }, 'Strain εₖₗ (%)', pal);

          const arrTop = topMatY + chStack * 3 + 5;
          const arrBot = arrTop + 30;
          drawArrow(ctx, w * 0.5, arrTop, w * 0.5, arrBot, pal.teal, 2.4, 9);
          ctx.font = FONT_SANS_BOLD;
          ctx.fillStyle = pal.text;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('Cᵢⱼₖₗ', w * 0.5 + 12, 0.5 * (arrTop + arrBot));

          const botMatY = arrBot + 24;
          drawMatrixBox(ctx, sx, botMatY, cw, chStack, 3, 3, sig, function (r, c) {
            if (r === freeR && c === freeC) return pal.cardinal;
            return null;
          }, 'Stress σᵢⱼ (MPa)', pal);
        } else {
          const gapM = clamp(Math.floor(w * 0.11), 46, 62);
          const cw = clamp(Math.floor((w - gapM - 28) / 6), 54, 66);
          const matW = cw * 3;
          const sx = (w - (matW * 2 + gapM)) * 0.5;

          drawMatrixBox(ctx, sx, midY + 14, cw, cellH, 3, 3, eps, function () {
            return (focusIndex === 'k' || focusIndex === 'l') ? pal.teal : null;
          }, 'Strain εₖₗ (%)', pal);

          const ax1 = sx + matW + 6;
          const ax2 = sx + matW + gapM - 6;
          const ay = midY + 14 + 1.5 * cellH;
          drawArrow(ctx, ax1, ay, ax2, ay, pal.teal, 2.4, 9);
          ctx.font = FONT_SANS_BOLD;
          ctx.fillStyle = pal.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('Cᵢⱼₖₗ', 0.5 * (ax1 + ax2), ay - 7);

          drawMatrixBox(ctx, sx + matW + gapM, midY + 14, cw, cellH, 3, 3, sig, function (r, c) {
            if (r === freeR && c === freeC) return pal.cardinal;
            return null;
          }, 'Stress σᵢⱼ (MPa)', pal);
        }
      }

      // 3. Bottom Expanded Sum Strip (>= 15px monospace, auto-wraps cleanly on narrow screens)
      ctx.font = FONT_MONO;
      const maxTxtW = w - 36;
      let lines = [expr.expanded];
      if (ctx.measureText(expr.expanded).width > maxTxtW) {
        if (expr.expandedNarrow && expr.expandedNarrow.length) {
          lines = expr.expandedNarrow;
        } else {
          const splitIdx = expr.expanded.indexOf('=');
          if (splitIdx > 6 && splitIdx < expr.expanded.length - 6) {
            lines = [
              expr.expanded.slice(0, splitIdx).trim(),
              '= ' + expr.expanded.slice(splitIdx + 1).trim()
            ];
          }
        }
      }
      const boxH = lines.length > 1 ? 48 : 30;
      const boxY = h - boxH - 6;
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(14, boxY);
      ctx.lineTo(w - 14, boxY);
      ctx.stroke();

      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (lines.length === 1) {
        ctx.fillText(lines[0], w * 0.5, boxY + boxH * 0.5 + 1);
      } else {
        ctx.fillText(lines[0], w * 0.5, boxY + 15);
        ctx.fillText(lines[1], w * 0.5, boxY + 34);
      }
    }

    const stopLoop = api.registerAnimationLoop(function (dt) {
      animTick += dt * 0.72;
      render();
    });

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {
        stopLoop();
        dom.canvas.removeEventListener('pointermove', onCanvasMove);
        dom.canvas.removeEventListener('pointerdown', onCanvasDown);
      }
    };
  });

  /* =========================================================================
   * LAB 4: 'continuum-map' (Slide 6: Continuum Deformation Lab Omega_0 -> Omega)
   * ========================================================================= */
  registerLab('continuum-map', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      cursor: 'grab',
      readouts: [
        { id: 'X', label: 'X', value: '(0.45, 0.30)' },
        { id: 'x', label: 'x', value: '(0.58, 0.34)' },
        { id: 'u', label: 'u', value: '(+0.13, +0.04)' },
        { id: 'eps', label: 'ε₁₁, ε₂₂, ε₁₂', value: '0.22, -0.07, 0.09' }
      ],
      sliders: [
        {
          id: 'e11',
          label: 'Stretch ε₁₁',
          min: -0.25,
          max: 0.35,
          step: 0.01,
          value: 0.22,
          format: function (v) { return fmtSigned(v, 2); }
        },
        {
          id: 'g12',
          label: 'Shear γ₁₂',
          min: -0.40,
          max: 0.40,
          step: 0.01,
          value: 0.18,
          format: function (v) { return fmtSigned(v, 2); }
        },
        {
          id: 'rot',
          label: 'Rotation ω',
          min: -25,
          max: 25,
          step: 1,
          value: 6,
          format: function (v) { return fmtSigned(v, 0) + '°'; }
        }
      ],
      caption: 'Drag the teal point X inside Ω₀ to trace displacement u(X) to x in Ω.'
    });

    const st = {
      e11: 0.22,
      g12: 0.18,
      rotDeg: 6,
      biaxial: false,
      overlay: false,
      px: 0.44,
      py: 0.28,
      dragging: false
    };

    const presetPills = createPillGroup(dom.toolbar, [
      { id: 'uniaxial', label: 'Uniaxial' },
      { id: 'shear', label: 'Shear' },
      { id: 'biaxial', label: 'Biaxial' },
      { id: 'reset', label: 'Reset' }
    ], 'uniaxial', function (id) {
      if (id === 'uniaxial') {
        st.e11 = 0.25; st.g12 = 0.00; st.rotDeg = 0; st.biaxial = false;
      } else if (id === 'shear') {
        st.e11 = 0.00; st.g12 = 0.34; st.rotDeg = 0; st.biaxial = false;
      } else if (id === 'biaxial') {
        st.e11 = 0.22; st.g12 = 0.00; st.rotDeg = 0; st.biaxial = true;
      } else {
        st.e11 = 0.00; st.g12 = 0.00; st.rotDeg = 0; st.biaxial = false;
      }
      syncSliders();
      render();
    });

    createPillGroup(dom.toolbar, [
      { id: 'split', label: 'Split' },
      { id: 'overlay', label: 'Overlay' }
    ], 'split', function (id) {
      st.overlay = id === 'overlay';
      render();
    });

    function syncSliders() {
      dom.sliders.e11.input.value = String(st.e11);
      dom.sliders.e11.valEl.textContent = fmtSigned(st.e11, 2);
      dom.sliders.g12.input.value = String(st.g12);
      dom.sliders.g12.valEl.textContent = fmtSigned(st.g12, 2);
      dom.sliders.rot.input.value = String(st.rotDeg);
      dom.sliders.rot.valEl.textContent = fmtSigned(st.rotDeg, 0) + '°';
    }

    dom.sliders.e11.input.addEventListener('input', function () {
      st.e11 = parseFloat(dom.sliders.e11.input.value);
      dom.sliders.e11.valEl.textContent = fmtSigned(st.e11, 2);
      presetPills.setActive('');
      render();
    });
    dom.sliders.g12.input.addEventListener('input', function () {
      st.g12 = parseFloat(dom.sliders.g12.input.value);
      dom.sliders.g12.valEl.textContent = fmtSigned(st.g12, 2);
      presetPills.setActive('');
      render();
    });
    dom.sliders.rot.input.addEventListener('input', function () {
      st.rotDeg = parseFloat(dom.sliders.rot.input.value);
      dom.sliders.rot.valEl.textContent = fmtSigned(st.rotDeg, 0) + '°';
      presetPills.setActive('');
      render();
    });

    function blobRadius(theta) {
      return 0.86 + 0.10 * Math.cos(2 * theta + 0.4) + 0.06 * Math.sin(3 * theta - 0.5);
    }

    function computeDeformation(X1, X2) {
      const e11 = st.e11;
      const e22 = st.biaxial ? st.e11 : -0.30 * st.e11;
      const e12 = 0.5 * st.g12;
      const wRad = (st.rotDeg * Math.PI) / 180;

      // Exact small-displacement gradient H = eps + W
      const H11 = e11;
      const H22 = e22;
      const H12 = e12 - wRad;
      const H21 = e12 + wRad;

      const u1 = H11 * X1 + H12 * X2;
      const u2 = H21 * X1 + H22 * X2;
      return {
        x1: X1 + u1,
        x2: X2 + u2,
        u1: u1,
        u2: u2,
        e11: e11,
        e22: e22,
        e12: e12
      };
    }

    let lastLayout = { cx0: 140, cy0: 140, scale: 80, handleX: 175, handleY: 118, isStacked: false, splitPos: 220 };

    function isTouchOnHandle(pos) {
      return Math.hypot(pos.x - lastLayout.handleX, pos.y - lastLayout.handleY) <= 44;
    }

    function updatePointFromPointer(ev) {
      const p = getPointerPos(dom.canvas, ev);
      let mx = (p.x - lastLayout.cx0) / lastLayout.scale;
      let my = (lastLayout.cy0 - p.y) / lastLayout.scale;
      const r = Math.hypot(mx, my);
      const th = Math.atan2(my, mx);
      const maxR = blobRadius(th) * 0.88;
      if (r > maxR && r > 1e-6) {
        mx = (mx / r) * maxR;
        my = (my / r) * maxR;
      }
      st.px = mx;
      st.py = my;
      render();
    }

    function onDown(ev) {
      const p = getPointerPos(dom.canvas, ev);
      if (ev.pointerType === 'touch') {
        if (!isTouchOnHandle(p)) return;
      } else if (!st.overlay) {
        const inRef = lastLayout.isStacked ? (p.y <= lastLayout.splitPos + 14) : (p.x <= lastLayout.splitPos + 14);
        if (!inRef) return;
      }
      st.dragging = true;
      dom.stage.style.cursor = 'grabbing';
      if (dom.canvas.setPointerCapture) {
        try { dom.canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      updatePointFromPointer(ev);
    }
    function onMove(ev) {
      if (!st.dragging) return;
      updatePointFromPointer(ev);
    }
    function onUp() {
      st.dragging = false;
      dom.stage.style.cursor = 'grab';
    }

    const detachTouchLock = attachSelectiveTouchLock(dom.canvas, isTouchOnHandle);
    dom.canvas.addEventListener('pointerdown', onDown);
    dom.canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    function render() {
      const fit = fitCanvas(dom.canvas, 260, {
        breakpoint: 460,
        minH: st.overlay ? 275 : 405
      });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      ctx.clearRect(0, 0, w, h);

      const isStacked = !st.overlay && w < 460;
      const splitY = Math.floor(h * 0.48);
      const splitX = Math.floor(w * 0.50);

      let scale, cx0, cy0, cx1, cy1;
      if (st.overlay) {
        scale = Math.min(w * 0.30, h * 0.34);
        cx0 = w * 0.50; cy0 = h * 0.54;
        cx1 = w * 0.50; cy1 = h * 0.54;
      } else if (isStacked) {
        scale = clamp(Math.min(w * 0.23, (splitY - 52) * 0.44), 46, 62);
        cx0 = w * 0.50; cy0 = 36 + (splitY - 40) * 0.50;
        cx1 = w * 0.50; cy1 = splitY + 34 + (h - splitY - 64) * 0.50;
      } else {
        scale = Math.min(w * 0.175, h * 0.33);
        cx0 = w * 0.27; cy0 = h * 0.54;
        cx1 = w * 0.73; cy1 = h * 0.54;
      }

      function toRef(X1, X2) { return { x: cx0 + X1 * scale, y: cy0 - X2 * scale }; }
      function toDef(x1, x2) { return { x: cx1 + x1 * scale, y: cy1 - x2 * scale }; }

      // Background subtle divider in side-by-side / stacked mode
      if (!st.overlay) {
        if (isStacked) {
          drawDashed(ctx, 16, splitY, w - 16, splitY, pal.border, [5, 5], 1.2);
        } else {
          drawDashed(ctx, splitX, 16, splitX, h - 16, pal.border, [5, 5], 1.2);
        }
      }

      // Coordinate axes at centers
      const axLen = scale * 1.12;
      drawArrow(ctx, cx0 - axLen, cy0, cx0 + axLen, cy0, pal.grid, 1.3, 7);
      drawArrow(ctx, cx0, cy0 + axLen * 0.85, cx0, cy0 - axLen * 0.85, pal.grid, 1.3, 7);
      if (!st.overlay) {
        drawArrow(ctx, cx1 - axLen, cy1, cx1 + axLen, cy1, pal.grid, 1.3, 7);
        drawArrow(ctx, cx1, cy1 + axLen * 0.85, cx1, cy1 - axLen * 0.85, pal.grid, 1.3, 7);
      }

      const N = 80;
      // 1. Reference Body Omega_0
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const r = blobRadius(th);
        const p = toRef(r * Math.cos(th), r * Math.sin(th));
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.teal, pal.theme === 'dark' ? 0.13 : 0.10);
      ctx.fill();
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.2;
      if (st.overlay) ctx.setLineDash([6, 5]);
      ctx.stroke();

      // Reference material grid inside Omega_0
      ctx.clip();
      ctx.setLineDash([]);
      ctx.strokeStyle = withAlpha(pal.teal, 0.30);
      ctx.lineWidth = 1.1;
      for (let g = -0.9; g <= 0.91; g += 0.3) {
        const a = toRef(-1.2, g), b = toRef(1.2, g);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        const c = toRef(g, -1.2), d = toRef(g, 1.2);
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
      }
      ctx.restore();

      // 2. Deformed Body Omega
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const r = blobRadius(th);
        const dm = computeDeformation(r * Math.cos(th), r * Math.sin(th));
        const p = toDef(dm.x1, dm.x2);
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.cardinal, pal.theme === 'dark' ? 0.16 : 0.12);
      ctx.fill();
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Deformed material grid inside Omega
      ctx.clip();
      ctx.strokeStyle = withAlpha(pal.cardinal, 0.34);
      ctx.lineWidth = 1.15;
      for (let g = -0.9; g <= 0.91; g += 0.3) {
        const a = computeDeformation(-1.2, g), b = computeDeformation(1.2, g);
        const pa = toDef(a.x1, a.x2), pb = toDef(b.x1, b.x2);
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        const c = computeDeformation(g, -1.2), d = computeDeformation(g, 1.2);
        const pc = toDef(c.x1, c.x2), pd = toDef(d.x1, d.x2);
        ctx.beginPath(); ctx.moveTo(pc.x, pc.y); ctx.lineTo(pd.x, pd.y); ctx.stroke();
      }
      ctx.restore();

      // Tracked particle X -> x
      const def = computeDeformation(st.px, st.py);
      const pRef = toRef(st.px, st.py);
      const pDef = toDef(def.x1, def.x2);

      lastLayout = {
        cx0: cx0,
        cy0: cy0,
        scale: scale,
        handleX: pRef.x,
        handleY: pRef.y,
        isStacked: isStacked,
        splitPos: isStacked ? splitY : splitX
      };

      // Draw mapping / displacement arrow
      if (st.overlay) {
        drawArrow(ctx, pRef.x, pRef.y, pDef.x, pDef.y, pal.amber, 2.8, 11);
      } else {
        // Curved transfer arrow from X in Omega_0 to x in Omega
        ctx.save();
        const midX = isStacked
          ? clamp(0.5 * (pRef.x + pDef.x) + (st.px >= 0 ? 54 : -54), 18, w - 18)
          : 0.5 * (pRef.x + pDef.x);
        const midY = isStacked
          ? 0.5 * (pRef.y + pDef.y)
          : Math.min(pRef.y, pDef.y) - 34;
        ctx.strokeStyle = pal.amber;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pRef.x, pRef.y);
        ctx.quadraticCurveTo(midX, midY, pDef.x, pDef.y);
        ctx.stroke();
        ctx.restore();

        // Arrowhead at pDef
        const tx = pDef.x - midX;
        const ty = pDef.y - midY;
        const tl = Math.hypot(tx, ty) || 1;
        drawArrow(ctx, pDef.x - (tx / tl) * 18, pDef.y - (ty / tl) * 18, pDef.x, pDef.y, pal.amber, 2.2, 10);

        // Also show local u vector anchored at origin of deformed side
        const pDefOrigin = toDef(st.px, st.py);
        drawArrow(ctx, pDefOrigin.x, pDefOrigin.y, pDef.x, pDef.y, pal.amber, 2.5, 9);
      }

      // Draggable handle X
      ctx.fillStyle = withAlpha(pal.teal, 0.26);
      ctx.beginPath(); ctx.arc(pRef.x, pRef.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.teal;
      ctx.beginPath(); ctx.arc(pRef.x, pRef.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pal.white;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Mapped point x
      ctx.fillStyle = withAlpha(pal.cardinal, 0.25);
      ctx.beginPath(); ctx.arc(pDef.x, pDef.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.cardinal;
      ctx.beginPath(); ctx.arc(pDef.x, pDef.y, 5.8, 0, Math.PI * 2); ctx.fill();

      // Labels (>= 15px, clamped safely inside canvas)
      const bounds = { x: 0, y: 0, w: w, h: h };
      if (st.overlay) {
        drawLabelPill(ctx, 'Ω₀ (dashed) → Ω (solid)', w * 0.5, 22, pal, { color: pal.text, clampTo: bounds });
      } else if (isStacked) {
        drawLabelPill(ctx, 'Reference Ω₀', cx0, 20, pal, { color: pal.teal, clampTo: bounds });
        drawLabelPill(ctx, 'Deformed Ω', cx1, splitY + 20, pal, { color: pal.cardinal, clampTo: bounds });
        drawLabelPill(ctx, 'x = X + u(X)', w * 0.5, h - 18, pal, { color: pal.amber, clampTo: bounds });
      } else {
        drawLabelPill(ctx, 'Reference Ω₀', cx0, 22, pal, { color: pal.teal, clampTo: bounds });
        drawLabelPill(ctx, 'Deformed Ω', cx1, 22, pal, { color: pal.cardinal, clampTo: bounds });
        drawLabelPill(ctx, 'x = X + u(X)', w * 0.5, h - 22, pal, { color: pal.amber, clampTo: bounds });
      }

      ctx.font = FONT_SANS_BOLD;
      ctx.fillStyle = pal.teal;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('X', clamp(pRef.x + 12, 10, w - 20), clamp(pRef.y - 8, 36, h - 12));

      ctx.fillStyle = pal.cardinal;
      ctx.fillText('x', clamp(pDef.x + 12, 10, w - 20), clamp(pDef.y - 8, 36, h - 34));

      // Update readouts
      dom.readouts.X.val.textContent = '(' + fmt(st.px, 2) + ', ' + fmt(st.py, 2) + ')';
      dom.readouts.x.val.textContent = '(' + fmt(def.x1, 2) + ', ' + fmt(def.x2, 2) + ')';
      dom.readouts.u.val.textContent = '(' + fmtSigned(def.u1, 2) + ', ' + fmtSigned(def.u2, 2) + ')';
      dom.readouts.eps.val.textContent = fmt(def.e11, 2) + ', ' + fmt(def.e22, 2) + ', ' + fmt(def.e12, 2);
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {
        detachTouchLock();
        dom.canvas.removeEventListener('pointerdown', onDown);
        dom.canvas.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
    };
  });

  /* =========================================================================
   * LAB 5: 'stress-traction' (Slide 7: Cauchy Traction + Live Mohr's Circle)
   * ========================================================================= */
  registerLab('stress-traction', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      cursor: 'pointer',
      readouts: [
        { id: 'sn', label: 'σ_n', value: '115.6 MPa' },
        { id: 'tau', label: 'τ', value: '-8.2 MPa' },
        { id: 'princ', label: 'σ₁, σ₂', value: '120, 0' },
        { id: 'tmax', label: 'τ_max', value: '60.2 MPa' }
      ],
      sliders: [
        { id: 'sxx', label: 'σ_xx', min: -150, max: 150, step: 5, value: 100, format: function (v) { return fmtSigned(v, 0); } },
        { id: 'syy', label: 'σ_yy', min: -150, max: 150, step: 5, value: 20, format: function (v) { return fmtSigned(v, 0); } },
        { id: 'txy', label: 'τ_xy', min: -100, max: 100, step: 5, value: 45, format: function (v) { return fmtSigned(v, 0); } },
        { id: 'theta', label: 'Angle θ', min: -90, max: 90, step: 1, value: 28, format: function (v) { return fmtSigned(v, 0) + '°'; } }
      ],
      caption: 'Drag the plane normal n on the left or adjust stress components to rotate on Mohr circle.'
    });

    if (dom.controlsGrid) dom.controlsGrid.classList.add('is-4col');

    const st = { sxx: 100, syy: 20, txy: 45, thetaDeg: 28, dragging: false };

    function syncSliders() {
      dom.sliders.sxx.input.value = String(st.sxx);
      dom.sliders.sxx.valEl.textContent = fmtSigned(st.sxx, 0);
      dom.sliders.syy.input.value = String(st.syy);
      dom.sliders.syy.valEl.textContent = fmtSigned(st.syy, 0);
      dom.sliders.txy.input.value = String(st.txy);
      dom.sliders.txy.valEl.textContent = fmtSigned(st.txy, 0);
      dom.sliders.theta.input.value = String(Math.round(st.thetaDeg));
      dom.sliders.theta.valEl.textContent = fmtSigned(Math.round(st.thetaDeg), 0) + '°';
    }

    createPillGroup(dom.toolbar, [
      { id: 'general', label: 'General' },
      { id: 'uniaxial', label: 'Uniaxial' },
      { id: 'shear', label: 'Shear' },
      { id: 'principal', label: 'Principal', actionOnly: true }
    ], 'general', function (id) {
      if (id === 'general') {
        st.sxx = 100; st.syy = 20; st.txy = 45; st.thetaDeg = 28;
      } else if (id === 'uniaxial') {
        st.sxx = 120; st.syy = 0; st.txy = 0; st.thetaDeg = 45;
      } else if (id === 'shear') {
        st.sxx = 0; st.syy = 0; st.txy = 80; st.thetaDeg = 45;
      } else if (id === 'principal') {
        const thP = 0.5 * Math.atan2(2 * st.txy, st.sxx - st.syy) * (180 / Math.PI);
        st.thetaDeg = clamp(Math.round(thP), -90, 90);
      }
      syncSliders();
      render();
    });

    ['sxx', 'syy', 'txy', 'theta'].forEach(function (k) {
      dom.sliders[k].input.addEventListener('input', function () {
        const val = parseFloat(dom.sliders[k].input.value);
        if (k === 'theta') st.thetaDeg = val;
        else st[k] = val;
        dom.sliders[k].valEl.textContent = k === 'theta' ? fmtSigned(val, 0) + '°' : fmtSigned(val, 0);
        render();
      });
    });

    let elemCenter = { x: 140, y: 140, radius: 60, hitBox: { x0: 0, y0: 0, x1: 260, y1: 260 } };

    function isTouchOnElement(pos) {
      return Math.hypot(pos.x - elemCenter.x, pos.y - elemCenter.y) <= elemCenter.radius * 1.55;
    }

    function updateAngleFromPointer(ev) {
      const p = getPointerPos(dom.canvas, ev);
      const dx = p.x - elemCenter.x;
      const dy = elemCenter.y - p.y; // y-up
      if (Math.hypot(dx, dy) < 8) return;
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (deg > 90) deg -= 180;
      if (deg < -90) deg += 180;
      st.thetaDeg = clamp(Math.round(deg), -90, 90);
      syncSliders();
      render();
    }

    function onDown(ev) {
      const p = getPointerPos(dom.canvas, ev);
      const hb = elemCenter.hitBox;
      const inside = ev.pointerType === 'touch'
        ? isTouchOnElement(p)
        : (p.x >= hb.x0 && p.x <= hb.x1 && p.y >= hb.y0 && p.y <= hb.y1);
      if (inside) {
        st.dragging = true;
        if (dom.canvas.setPointerCapture) {
          try { dom.canvas.setPointerCapture(ev.pointerId); } catch (e) {}
        }
        updateAngleFromPointer(ev);
      }
    }
    function onMove(ev) {
      if (!st.dragging) return;
      updateAngleFromPointer(ev);
    }
    function onUp() { st.dragging = false; }

    const detachTouchLock = attachSelectiveTouchLock(dom.canvas, isTouchOnElement);
    dom.canvas.addEventListener('pointerdown', onDown);
    dom.canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    function render() {
      const fit = fitCanvas(dom.canvas, 280, { breakpoint: 500, minH: 430 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      ctx.clearRect(0, 0, w, h);

      const th = (st.thetaDeg * Math.PI) / 180;
      const nx = Math.cos(th);
      const ny = Math.sin(th);
      const sx = -ny;
      const sy = nx;

      // Exact Cauchy traction & Mohr formulas
      const tx = st.sxx * nx + st.txy * ny;
      const ty = st.txy * nx + st.syy * ny;
      const sn = tx * nx + ty * ny;
      const tau = tx * sx + ty * sy;

      const C = 0.5 * (st.sxx + st.syy);
      const R = Math.hypot(0.5 * (st.sxx - st.syy), st.txy);
      const s1 = C + R;
      const s2 = C - R;

      const isStacked = w < 500;
      const splitX = Math.floor(w * 0.48);
      const splitY = Math.floor(h * 0.47);
      const bounds = { x: 0, y: 0, w: w, h: h };

      if (isStacked) {
        drawDashed(ctx, 14, splitY, w - 14, splitY, pal.border, [4, 5], 1.2);
      } else {
        drawDashed(ctx, splitX, 14, splitX, h - 14, pal.border, [4, 5], 1.2);
      }

      /* --- PANEL 1 (TOP on mobile, LEFT on desktop): Material element & cut plane --- */
      const cutBounds = isStacked
        ? { x: 0, y: 0, w: w, h: splitY }
        : { x: 0, y: 0, w: splitX, h: h };
      const ecx = isStacked ? w * 0.50 : splitX * 0.50;
      const ecy = isStacked ? 34 + (splitY - 58) * 0.52 : h * 0.53;
      const half = isStacked
        ? clamp(Math.min(w * 0.155, (splitY - 68) * 0.37), 36, 52)
        : clamp(Math.min(splitX * 0.23, h * 0.23), 40, 66);
      elemCenter = {
        x: ecx,
        y: ecy,
        radius: half,
        hitBox: isStacked
          ? { x0: 0, y0: 0, x1: w, y1: splitY }
          : { x0: 0, y0: 0, x1: splitX + 12, y1: h }
      };

      drawLabelPill(ctx, 'Cut Plane: t = σ·n', ecx, 20, pal, { color: pal.text, clampTo: cutBounds });

      // Ghost full square element + subtle external stress arrows (sigma_xx, sigma_yy)
      ctx.save();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(ecx - half, ecy - half, half * 2, half * 2);
      ctx.restore();

      const extScale = clamp(half * 0.36, 14, 24) / 150;
      if (Math.abs(st.sxx) > 8) {
        const lxx = clamp(Math.abs(st.sxx) * extScale, 9, 24);
        const cxx = withAlpha(st.sxx >= 0 ? pal.cardinal : pal.blue, 0.55);
        if (st.sxx > 0) {
          drawArrow(ctx, ecx + half + 3, ecy, ecx + half + 3 + lxx, ecy, cxx, 1.8, 7);
          drawArrow(ctx, ecx - half - 3, ecy, ecx - half - 3 - lxx, ecy, cxx, 1.8, 7);
        } else {
          drawArrow(ctx, ecx + half + 3 + lxx, ecy, ecx + half + 3, ecy, cxx, 1.8, 7);
          drawArrow(ctx, ecx - half - 3 - lxx, ecy, ecx - half - 3, ecy, cxx, 1.8, 7);
        }
      }
      if (Math.abs(st.syy) > 8) {
        const lyy = clamp(Math.abs(st.syy) * extScale, 9, 22);
        const cyy = withAlpha(st.syy >= 0 ? pal.cardinal : pal.blue, 0.55);
        if (st.syy > 0) {
          drawArrow(ctx, ecx, ecy - half - 3, ecx, ecy - half - 3 - lyy, cyy, 1.8, 7);
          drawArrow(ctx, ecx, ecy + half + 3, ecx, ecy + half + 3 + lyy, cyy, 1.8, 7);
        } else {
          drawArrow(ctx, ecx, ecy - half - 3 - lyy, ecx, ecy - half - 3, cyy, 1.8, 7);
          drawArrow(ctx, ecx, ecy + half + 3 + lyy, ecx, ecy + half + 3, cyy, 1.8, 7);
        }
      }

      // Retained half-body behind cut plane (dot((p-c), n) <= 0 in y-up)
      ctx.save();
      ctx.beginPath();
      ctx.rect(ecx - half, ecy - half, half * 2, half * 2);
      ctx.clip();

      const big = half * 4;
      ctx.beginPath();
      ctx.moveTo(ecx + sx * big, ecy - sy * big);
      ctx.lineTo(ecx - sx * big, ecy + sy * big);
      ctx.lineTo(ecx - sx * big - nx * big, ecy + sy * big + ny * big);
      ctx.lineTo(ecx + sx * big - nx * big, ecy - sy * big + ny * big);
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.blue, pal.theme === 'dark' ? 0.18 : 0.12);
      ctx.fill();
      ctx.strokeStyle = pal.blue;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Cut plane line
      const cutL = half * 1.28;
      ctx.save();
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(ecx - sx * cutL, ecy + sy * cutL);
      ctx.lineTo(ecx + sx * cutL, ecy - sy * cutL);
      ctx.stroke();
      ctx.restore();

      // Unit normal n (draggable)
      const nLen = half * 0.80;
      const nTipX = ecx + nx * nLen;
      const nTipY = ecy - ny * nLen;
      drawArrow(ctx, ecx, ecy, nTipX, nTipY, pal.textMuted, 2.0, 9);
      ctx.fillStyle = pal.blue;
      ctx.beginPath();
      ctx.arc(nTipX, nTipY, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.white;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Stress vector scale
      const maxVec = Math.max(150, Math.abs(s1), Math.abs(s2));
      const vScale = (half * 1.22) / maxVec;

      // Normal component sigma_n * n (cardinal)
      const snX = ecx + sn * nx * vScale;
      const snY = ecy - sn * ny * vScale;
      drawArrow(ctx, ecx, ecy, snX, snY, pal.cardinal, 3.0, 11);

      // Shear component tau * s (teal)
      const tauX = ecx + tau * sx * vScale;
      const tauY = ecy - tau * sy * vScale;
      drawArrow(ctx, ecx, ecy, tauX, tauY, pal.teal, 3.0, 11);

      // Resultant traction t = sigma * n (amber)
      const tX = ecx + tx * vScale;
      const tY = ecy - ty * vScale;
      drawDashed(ctx, snX, snY, tX, tY, withAlpha(pal.amber, 0.55), [4, 4], 1.2);
      drawDashed(ctx, tauX, tauY, tX, tY, withAlpha(pal.amber, 0.55), [4, 4], 1.2);
      drawArrow(ctx, ecx, ecy, tX, tY, pal.amber, 3.0, 11);

      // Vector labels n & t with explicit non-overlap separation (>= 15px)
      const nLblX = clamp(nTipX + nx * 16, cutBounds.x + 14, cutBounds.x + cutBounds.w - 14);
      const nLblY = clamp(nTipY - ny * 16, cutBounds.y + 38, cutBounds.y + cutBounds.h - 28);
      ctx.font = FONT_SANS_BOLD;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = pal.blue;
      ctx.fillText('n', nLblX, nLblY);

      const tDist = Math.hypot(tX - ecx, tY - ecy);
      if (tDist > 16) {
        const tux = (tX - ecx) / tDist;
        const tuy = (tY - ecy) / tDist;
        let tLblX = tX + tux * 16;
        let tLblY = tY + tuy * 16;
        if (Math.hypot(tLblX - nLblX, tLblY - nLblY) < 22) {
          // Offset cleanly perpendicular to t (away from n) when t aligns with n
          const perpX = -tuy;
          const perpY = tux;
          const sign = ((tLblX + perpX * 18 - nLblX) * (tLblX + perpX * 18 - nLblX) +
                        (tLblY + perpY * 18 - nLblY) * (tLblY + perpY * 18 - nLblY)) >=
                       ((tLblX - perpX * 18 - nLblX) * (tLblX - perpX * 18 - nLblX) +
                        (tLblY - perpY * 18 - nLblY) * (tLblY - perpY * 18 - nLblY)) ? 1 : -1;
          tLblX += sign * perpX * 18;
          tLblY += sign * perpY * 18;
        }
        tLblX = clamp(tLblX, cutBounds.x + 14, cutBounds.x + cutBounds.w - 14);
        tLblY = clamp(tLblY, cutBounds.y + 38, cutBounds.y + cutBounds.h - 28);
        ctx.fillStyle = pal.amber;
        ctx.fillText('t', tLblX, tLblY);
      }

      // Centered non-overflowing vector legend row inside cut-plane panel
      ctx.font = FONT_SANS;
      ctx.textBaseline = 'middle';
      const legY = cutBounds.y + cutBounds.h - 14;
      const s1Txt = 'σₙ';
      const s2Txt = 'τ';
      const s3Txt = 't = σₙn + τs';
      const w1 = ctx.measureText(s1Txt).width;
      const w2 = ctx.measureText(s2Txt).width;
      const w3 = ctx.measureText(s3Txt).width;
      const legGap = 14;
      const legTotal = w1 + w2 + w3 + legGap * 2;
      const legX = clamp(ecx - legTotal * 0.5, cutBounds.x + 10, cutBounds.x + cutBounds.w - legTotal - 10);
      ctx.textAlign = 'left';
      ctx.fillStyle = pal.cardinal;
      ctx.fillText(s1Txt, legX, legY);
      ctx.fillStyle = pal.teal;
      ctx.fillText(s2Txt, legX + w1 + legGap, legY);
      ctx.fillStyle = pal.amber;
      ctx.fillText(s3Txt, legX + w1 + w2 + legGap * 2, legY);

      /* --- PANEL 2 (BOTTOM on mobile, RIGHT on desktop): Live Mohr's Circle --- */
      const mBox = isStacked
        ? { x: 10, y: splitY + 34, w: w - 20, h: h - splitY - 44 }
        : { x: splitX + 16, y: 40, w: w - splitX - 30, h: h - 54 };
      const mPad = isStacked ? 26 : 24;
      drawPlotFrame(ctx, mBox, pal, '', 'σₙ (MPa)', 'τ (MPa)');
      drawLabelPill(ctx, "Mohr's Circle (2θ)", mBox.x + mBox.w * 0.5, isStacked ? splitY + 18 : 20, pal, {
        color: pal.text,
        clampTo: bounds
      });

      // Coordinate bounds centered comfortably around circle & origin
      const maxAbs = Math.max(120, Math.abs(s1) + 25, Math.abs(s2) + 25, R + 30);
      const mCx = mBox.x + mBox.w * 0.5;
      const mCy = mBox.y + mBox.h * 0.52;
      const mScale = Math.min((mBox.w - mPad * 2) / (2.45 * maxAbs), (mBox.h - mPad * 2) / (2.45 * maxAbs));

      function toMohr(sigV, tauV) {
        return { x: mCx + sigV * mScale, y: mCy - tauV * mScale };
      }

      // Axes through (0, 0)
      const oPx = toMohr(0, 0);
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(mBox.x + 12, oPx.y);
      ctx.lineTo(mBox.x + mBox.w - 12, oPx.y);
      ctx.moveTo(oPx.x, mBox.y + 12);
      ctx.lineTo(oPx.x, mBox.y + mBox.h - 14);
      ctx.stroke();

      // Circle
      const cPx = toMohr(C, 0);
      const rPx = Math.max(2, R * mScale);
      ctx.save();
      ctx.fillStyle = withAlpha(pal.blue, pal.theme === 'dark' ? 0.11 : 0.08);
      ctx.strokeStyle = pal.blue;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cPx.x, cPx.y, rPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Reference theta=0 point (sxx, txy) and rotated point (sn, tau)
      const pRef = toMohr(st.sxx, st.txy);
      const pCur = toMohr(sn, tau);
      const pOpp = toMohr(2 * C - sn, -tau);

      // Diameter line for current plane
      drawDashed(ctx, pOpp.x, pOpp.y, pCur.x, pCur.y, withAlpha(pal.amber, 0.72), [4, 4], 1.6);

      // Reference radius line (theta = 0)
      drawDashed(ctx, cPx.x, cPx.y, pRef.x, pRef.y, pal.textMuted, [3, 4], 1.2);
      ctx.fillStyle = pal.textMuted;
      ctx.beginPath(); ctx.arc(pRef.x, pRef.y, 4, 0, Math.PI * 2); ctx.fill();

      // 2*theta arc
      if (rPx > 14 && Math.abs(st.thetaDeg) > 2) {
        const a0 = Math.atan2(pRef.y - cPx.y, pRef.x - cPx.x);
        const a1 = Math.atan2(pCur.y - cPx.y, pCur.x - cPx.x);
        ctx.save();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(cPx.x, cPx.y, Math.min(26, rPx * 0.45), a0, a1, st.thetaDeg < 0);
        ctx.stroke();
        ctx.restore();
      }

      // Principal stress markers sigma_1, sigma_2 (collision-safe against pCur, each other, and axis labels)
      const p1 = toMohr(s1, 0);
      const p2 = toMohr(s2, 0);
      const tightCircle = rPx < 20;
      [
        { p: p1, txt: 'σ₁', dx: 8, align: 'left', preferAbove: tightCircle },
        { p: p2, txt: 'σ₂', dx: -8, align: 'right', preferAbove: false }
      ].forEach(function (item) {
        ctx.fillStyle = pal.teal;
        ctx.beginPath(); ctx.arc(item.p.x, item.p.y, 4.5, 0, Math.PI * 2); ctx.fill();
        let lx = item.p.x + item.dx;
        if (item.align === 'left') lx = clamp(lx, mBox.x + 12, mBox.x + mBox.w - 28);
        else lx = clamp(lx, mBox.x + 28, mBox.x + mBox.w - 12);

        let placeAbove = item.preferAbove;
        // Avoid colliding with moving point pCur or bottom-right axis label
        if (!placeAbove && Math.hypot(lx - pCur.x, (item.p.y + 14) - pCur.y) < 24) {
          placeAbove = true;
        }
        if (!placeAbove && item.p.y + 24 > mBox.y + mBox.h - 24 && lx > mBox.x + mBox.w - 94) {
          placeAbove = true;
        }
        ctx.font = FONT_SANS_BOLD;
        ctx.fillStyle = pal.teal;
        ctx.textAlign = item.align;
        ctx.textBaseline = placeAbove ? 'bottom' : 'top';
        ctx.fillText(item.txt, lx, placeAbove ? item.p.y - 10 : item.p.y + 10);
      });

      // Live rotating point (sigma_n, tau)
      ctx.fillStyle = withAlpha(pal.cardinal, 0.28);
      ctx.beginPath(); ctx.arc(pCur.x, pCur.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.cardinal;
      ctx.beginPath(); ctx.arc(pCur.x, pCur.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pal.white;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Update readouts (avoid -0 formatting)
      const s1c = Math.abs(s1) < 0.5 ? 0 : s1;
      const s2c = Math.abs(s2) < 0.5 ? 0 : s2;
      const snc = Math.abs(sn) < 0.05 ? 0 : sn;
      const tauc = Math.abs(tau) < 0.05 ? 0 : tau;
      dom.readouts.sn.val.textContent = fmtSigned(snc, 1) + ' MPa';
      dom.readouts.tau.val.textContent = fmtSigned(tauc, 1) + ' MPa';
      dom.readouts.princ.val.textContent = fmt(s1c, 0) + ', ' + fmt(s2c, 0);
      dom.readouts.tmax.val.textContent = fmt(R, 1) + ' MPa';
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {
        detachTouchLock();
        dom.canvas.removeEventListener('pointerdown', onDown);
        dom.canvas.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
    };
  });

  /* =========================================================================
   * LAB 6: 'hooke-energy' (Slide 8: Hooke's Law & Strain Energy Density)
   * ========================================================================= */
  registerLab('hooke-energy', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      cursor: 'ew-resize',
      readouts: [
        { id: 'sig', label: 'σ*', value: '600 MPa' },
        { id: 'w', label: 'w', value: '0.90 MJ/m³' },
        { id: 'lat', label: 'ε_lat', value: '−0.090%' },
        { id: 'vol', label: 'ΔV/V', value: '+0.120%' }
      ],
      sliders: [
        { id: 'E', label: 'Modulus E', min: 50, max: 300, step: 5, value: 200, format: function (v) { return v + ' GPa'; } },
        { id: 'nu', label: 'Poisson ν', min: 0.00, max: 0.48, step: 0.01, value: 0.30, format: function (v) { return fmt(v, 2); } },
        { id: 'eps', label: 'Strain ε*', min: 0.00, max: 0.50, step: 0.01, value: 0.30, format: function (v) { return fmt(v, 2) + '%'; } }
      ],
      caption: 'Area under σ(ε) equals stored strain energy density w = ½σ*ε*. Scrub the plot to vary ε*.'
    });

    const st = { E: 200, nu: 0.30, epsPct: 0.30, dragging: false };

    function syncSliders() {
      dom.sliders.E.input.value = String(st.E);
      dom.sliders.E.valEl.textContent = st.E + ' GPa';
      dom.sliders.nu.input.value = String(st.nu);
      dom.sliders.nu.valEl.textContent = fmt(st.nu, 2);
      dom.sliders.eps.input.value = String(st.epsPct);
      dom.sliders.eps.valEl.textContent = fmt(st.epsPct, 2) + '%';
    }

    createPillGroup(dom.toolbar, [
      { id: 'steel', label: 'Steel' },
      { id: 'al', label: 'Aluminum' },
      { id: 'cork', label: 'Cork (ν=0)' },
      { id: 'rubber', label: 'Incompressible' }
    ], 'steel', function (id) {
      if (id === 'steel') { st.E = 210; st.nu = 0.30; }
      else if (id === 'al') { st.E = 70; st.nu = 0.33; }
      else if (id === 'cork') { st.E = 50; st.nu = 0.00; }
      else { st.E = 50; st.nu = 0.48; }
      syncSliders();
      render();
    });

    dom.sliders.E.input.addEventListener('input', function () {
      st.E = parseFloat(dom.sliders.E.input.value);
      dom.sliders.E.valEl.textContent = st.E + ' GPa';
      render();
    });
    dom.sliders.nu.input.addEventListener('input', function () {
      st.nu = parseFloat(dom.sliders.nu.input.value);
      dom.sliders.nu.valEl.textContent = fmt(st.nu, 2);
      render();
    });
    dom.sliders.eps.input.addEventListener('input', function () {
      st.epsPct = parseFloat(dom.sliders.eps.input.value);
      dom.sliders.eps.valEl.textContent = fmt(st.epsPct, 2) + '%';
      render();
    });

    let plotGeom = { x0: 40, x1: 240, y0: 10, y1: 240 };

    function scrubStrain(ev) {
      const p = getPointerPos(dom.canvas, ev);
      if (p.x >= plotGeom.x0 - 15 && p.x <= plotGeom.x1 + 15) {
        const frac = clamp((p.x - plotGeom.x0) / Math.max(10, plotGeom.x1 - plotGeom.x0), 0, 1);
        st.epsPct = Math.round(frac * 50) / 100;
        syncSliders();
        render();
      }
    }
    function onDown(ev) {
      const p = getPointerPos(dom.canvas, ev);
      if (p.y < plotGeom.y0 - 8 || p.y > plotGeom.y1 + 8 || p.x < plotGeom.x0 - 24 || p.x > plotGeom.x1 + 24) {
        return;
      }
      st.dragging = true;
      if (dom.canvas.setPointerCapture) {
        try { dom.canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      scrubStrain(ev);
    }
    function onMove(ev) { if (st.dragging) scrubStrain(ev); }
    function onUp() { st.dragging = false; }

    dom.canvas.addEventListener('pointerdown', onDown);
    dom.canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    function render() {
      const fit = fitCanvas(dom.canvas, 260, { breakpoint: 520, minH: 430 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      ctx.clearRect(0, 0, w, h);

      const eps = st.epsPct * 0.01;
      const sigMPa = st.E * 1000 * eps; // GPa * strain * 1000 = MPa
      const wMJ = 0.5 * sigMPa * eps;   // MPa * 1 = MJ/m^3
      const epsLatPct = -st.nu * st.epsPct;
      const dVolPct = (1 - 2 * st.nu) * st.epsPct;

      const isStacked = w < 520;
      const splitX = Math.floor(w * 0.54);
      const bounds = { x: 0, y: 0, w: w, h: h };

      /* --- PANEL 1 (TOP on mobile, LEFT on desktop): Stress-Strain Curve & Shaded Energy Triangle --- */
      const pBox = isStacked
        ? { x: 10, y: 10, w: w - 20, h: Math.floor(h * 0.51) }
        : { x: 10, y: 12, w: splitX - 20, h: h - 24 };
      const plotTitle = pBox.w < 250 ? 'Hooke Law σ = Eε' : 'Linear Hooke Law σ = Eε';
      drawPlotFrame(ctx, pBox, pal, plotTitle, 'ε (%)', 'σ (MPa)');

      const axL = pBox.x + 54;
      const axR = pBox.x + pBox.w - 20;
      const axT = pBox.y + 46;
      const axB = pBox.y + pBox.h - 36;
      plotGeom = { x0: axL, x1: axR, y0: pBox.y, y1: pBox.y + pBox.h };

      const epsMax = 0.50;
      const sigMax = 1500;

      function toPlot(ePct, sVal) {
        return {
          x: axL + (ePct / epsMax) * (axR - axL),
          y: axB - (sVal / sigMax) * (axB - axT)
        };
      }

      // Grid lines
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      [0.25, 0.50].forEach(function (ev) {
        const px = toPlot(ev, 0).x;
        ctx.beginPath(); ctx.moveTo(px, axT); ctx.lineTo(px, axB); ctx.stroke();
      });
      [500, 1000, 1500].forEach(function (sv) {
        const py = toPlot(0, sv).y;
        ctx.beginPath(); ctx.moveTo(axL, py); ctx.lineTo(axR, py); ctx.stroke();
      });

      // Axes
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(axL, axT - 6); ctx.lineTo(axL, axB); ctx.lineTo(axR + 6, axB);
      ctx.stroke();

      // Axis ticks (>= 15px)
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      [0, 500, 1000, 1500].forEach(function (sv) {
        ctx.fillText(String(sv), axL - 6, toPlot(0, sv).y);
      });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      [0, 0.25, 0.50].forEach(function (ev) {
        ctx.fillText(fmt(ev, 2), toPlot(ev, 0).x, axB + 6);
      });

      // Shaded strain energy density triangle
      const p0 = toPlot(0, 0);
      const pStar = toPlot(st.epsPct, sigMPa);
      const pBase = toPlot(st.epsPct, 0);

      if (st.epsPct > 0.005) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(pStar.x, pStar.y);
        ctx.lineTo(pBase.x, pBase.y);
        ctx.closePath();
        ctx.fillStyle = withAlpha(pal.teal, pal.theme === 'dark' ? 0.28 : 0.20);
        ctx.fill();
        ctx.restore();
      }

      // Full elastic slope line (clipped to box)
      const sigAtMax = st.E * 1000 * (epsMax * 0.01);
      const endE = sigAtMax > sigMax ? (sigMax / (st.E * 1000)) * 100 : epsMax;
      const pEnd = toPlot(endE, Math.min(sigAtMax, sigMax));
      ctx.strokeStyle = pal.blue;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();

      // Active segment & drop lines
      drawDashed(ctx, pStar.x, pStar.y, pBase.x, pBase.y, pal.cardinal, [4, 4], 1.4);
      drawDashed(ctx, axL, pStar.y, pStar.x, pStar.y, pal.cardinal, [4, 4], 1.4);

      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(pStar.x, pStar.y);
      ctx.stroke();

      // Live point (eps*, sig*)
      ctx.fillStyle = withAlpha(pal.cardinal, 0.25);
      ctx.beginPath(); ctx.arc(pStar.x, pStar.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.cardinal;
      ctx.beginPath(); ctx.arc(pStar.x, pStar.y, 5.5, 0, Math.PI * 2); ctx.fill();

      // Strain-energy density label w = ½σ*ε* inside triangle if large enough
      const triW = pBase.x - p0.x;
      const triH = p0.y - pStar.y;
      if (triW > 84 && triH > 36) {
        ctx.font = FONT_SANS_BOLD;
        ctx.fillStyle = pal.teal;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const wx = clamp(p0.x + triW * 0.64, axL + 44, axR - 44);
        const wy = clamp(p0.y - triH * 0.28, axT + 14, axB - 14);
        ctx.fillText('w = ½σ*ε*', wx, wy);
      }

      /* --- PANEL 2 (BOTTOM on mobile, RIGHT on desktop): Deforming 2D Elastic Coupon --- */
      const botTop = pBox.y + pBox.h + 10;
      const availW = isStacked ? w : (w - splitX);
      const availH = isStacked ? (h - botTop) : h;
      const rCx = isStacked ? w * 0.50 : (splitX + availW * 0.50);
      const rCy = isStacked ? (botTop + 34 + (availH - 42) * 0.50) : (h * 0.53);
      drawLabelPill(ctx, 'Poisson Coupon Response', rCx, isStacked ? botTop + 14 : 22, pal, {
        color: pal.text,
        clampTo: bounds
      });

      const baseW = isStacked
        ? clamp(availW * 0.33, 86, 126)
        : clamp(availW * 0.42, 74, 134);
      const baseH = isStacked
        ? clamp(availH * 0.26, 44, 62)
        : clamp(h * 0.34, 60, 104);

      // Exaggerate strain cleanly for visual intuition
      const visScale = 68;
      const maxDefW = Math.max(baseW, availW - 96);
      const defW = Math.min(maxDefW, baseW * (1 + eps * visScale));
      const defH = baseH * Math.max(0.35, 1 - st.nu * eps * visScale);

      // Reference dashed outline
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = pal.textMuted;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(rCx - baseW * 0.5, rCy - baseH * 0.5, baseW, baseH);
      ctx.restore();

      // Deformed coupon
      const dx0 = rCx - defW * 0.5;
      const dy0 = rCy - defH * 0.5;
      drawRoundRect(ctx, dx0, dy0, defW, defH, 5);
      ctx.fillStyle = stressFill(sigMPa / 1200, pal, 0.45);
      ctx.fill();
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Internal deformed grid
      ctx.save();
      ctx.strokeStyle = withAlpha(pal.cardinal, 0.35);
      ctx.lineWidth = 1.1;
      for (let i = 1; i <= 5; i++) {
        const gx = dx0 + (i / 6) * defW;
        ctx.beginPath(); ctx.moveTo(gx, dy0); ctx.lineTo(gx, dy0 + defH); ctx.stroke();
      }
      for (let j = 1; j <= 3; j++) {
        const gy = dy0 + (j / 4) * defH;
        ctx.beginPath(); ctx.moveTo(dx0, gy); ctx.lineTo(dx0 + defW, gy); ctx.stroke();
      }
      ctx.restore();

      // Applied tensile load arrows (clamped to never exit canvas)
      const maxArrRoom = Math.max(12, (availW - defW) * 0.5 - 12);
      const arrowLen = clamp(16 + (sigMPa / 1500) * 26, 12, Math.min(40, maxArrRoom));
      if (sigMPa > 1) {
        drawArrow(ctx, dx0 + defW + 4, rCy, dx0 + defW + 4 + arrowLen, rCy, pal.cardinal, 2.6, 9);
        drawArrow(ctx, dx0 - 4, rCy, dx0 - 4 - arrowLen, rCy, pal.cardinal, 2.6, 9);
      }

      // Lateral contraction arrows
      if (st.nu > 0.02 && st.epsPct > 0.03) {
        drawArrow(ctx, rCx, rCy - baseH * 0.5 - 14, rCx, dy0 - 3, pal.teal, 2.2, 8);
        drawArrow(ctx, rCx, rCy + baseH * 0.5 + 14, rCx, dy0 + defH + 3, pal.teal, 2.2, 8);
      }

      // Dimension callouts (>= 15px, non-colliding)
      ctx.font = FONT_SANS_BOLD;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = pal.cardinal;
      ctx.fillText('Axial: +' + fmt(st.epsPct, 2) + '%', rCx, Math.min(h - 20, rCy + baseH * 0.5 + 18));
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = pal.teal;
      const latY = isStacked
        ? Math.max(botTop + 44, rCy - baseH * 0.5 - 18)
        : (rCy - baseH * 0.5 - 20);
      ctx.fillText('Lateral: ' + fmtSigned(epsLatPct, 3) + '%', rCx, latY);

      // Update readouts
      dom.readouts.sig.val.textContent = fmt(sigMPa, 0) + ' MPa';
      dom.readouts.w.val.textContent = fmt(wMJ, 2) + ' MJ/m³';
      dom.readouts.lat.val.textContent = fmtSigned(epsLatPct, 3) + '%';
      dom.readouts.vol.val.textContent = fmtSigned(dVolPct, 3) + '%';
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {
        dom.canvas.removeEventListener('pointerdown', onDown);
        dom.canvas.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
    };
  });

  /* =========================================================================
   * LAB 7: 'bvp-domain' (Slide 9: Boundary-Value Problem Inspector)
   * ========================================================================= */
  registerLab('bvp-domain', function (mountEl, api) {
    const FOCUS_LABELS = {
      all: 'Full BVP',
      kin: 'Kinematics',
      su: 'Dirichlet Sᵤ',
      st: 'Neumann Sₜ',
      body: 'Body Force f'
    };

    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'focus', label: 'Focus', value: 'Full BVP' },
        { id: 'tip', label: 'Tip Defl.', value: '−0.17 L' },
        { id: 'load', label: 'Load Scale', value: '65%' }
      ],
      sliders: [
        {
          id: 'load',
          label: 'Load Scale',
          min: 0,
          max: 1,
          step: 0.01,
          value: 0.65,
          format: function (v) { return Math.round(v * 100) + '%'; }
        }
      ],
      caption: 'Toggle BVP ingredients to isolate kinematics, Dirichlet S_u, Neumann S_t, and body force f.'
    });

    const st = { focus: 'all', load: 0.65, phase: 0 };

    createPillGroup(dom.toolbar, [
      { id: 'all', label: 'All' },
      { id: 'kin', label: 'Kinematics' },
      { id: 'su', label: 'S_u' },
      { id: 'st', label: 'S_t' },
      { id: 'body', label: 'Body f' }
    ], 'all', function (id) {
      st.focus = id;
      render();
    });

    dom.sliders.load.input.addEventListener('input', function () {
      st.load = parseFloat(dom.sliders.load.input.value);
      dom.sliders.load.valEl.textContent = Math.round(st.load * 100) + '%';
      render();
    });

    function deformBody(u, v, load) {
      // u in [0, 1] along body length, v in [-1, 1] across thickness
      // Satisfies strict Dirichlet BC: u_disp(0, v) = 0 identically!
      const bend = load * 0.26 * u * u * (1.5 - 0.5 * u);
      const ax = load * 0.10 * u;
      const rotSlope = load * 0.36 * u * (1 - 0.5 * u);
      const halfThick = 0.42 - 0.08 * u + 0.07 * Math.sin(u * Math.PI);
      const x0 = u;
      const y0 = v * halfThick;
      return {
        x: x0 + ax + rotSlope * y0,
        y: y0 - bend
      };
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 265, { breakpoint: 460, minH: 280 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const isNarrow = w < 460;

      ctx.clearRect(0, 0, w, h);

      const Lpx = isNarrow
        ? Math.min(w * 0.56, h * 0.88)
        : Math.min(w * 0.58, h * 1.15);
      const ox = w * (isNarrow ? 0.17 : 0.20);
      const oy = h * (isNarrow ? 0.41 : 0.44);
      const f = st.focus;

      function toPx(mx, my) {
        return { x: ox + mx * Lpx, y: oy - my * Lpx };
      }

      const alphaKin = (f === 'all' || f === 'kin') ? 1.0 : 0.22;
      const alphaSu = (f === 'all' || f === 'su') ? 1.0 : 0.22;
      const alphaSt = (f === 'all' || f === 'st') ? 1.0 : 0.22;
      const alphaBody = (f === 'all' || f === 'body') ? 1.0 : 0.22;

      // 1. Reference undeformed body outline (dashed)
      ctx.save();
      ctx.beginPath();
      const N = 36;
      for (let i = 0; i <= N; i++) {
        const p = deformBody(i / N, 1, 0);
        const s = toPx(p.x, p.y);
        if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
      }
      for (let i = N; i >= 0; i--) {
        const p = deformBody(i / N, -1, 0);
        const s = toPx(p.x, p.y);
        ctx.lineTo(s.x, s.y);
      }
      ctx.closePath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = withAlpha(pal.textMuted, 0.42);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();

      // 2. Deformed continuum body V
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const p = deformBody(i / N, 1, st.load);
        const s = toPx(p.x, p.y);
        if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
      }
      for (let i = N; i >= 0; i--) {
        const p = deformBody(i / N, -1, st.load);
        const s = toPx(p.x, p.y);
        ctx.lineTo(s.x, s.y);
      }
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.blue, pal.theme === 'dark' ? 0.14 : 0.10);
      ctx.fill();
      ctx.strokeStyle = withAlpha(pal.text, 0.72);
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Animated internal stress trajectories inside V
      ctx.clip();
      const tracks = [-0.66, -0.32, 0.0, 0.32, 0.66];
      tracks.forEach(function (vVal) {
        const isTension = vVal > 0.05;
        const isNeutral = Math.abs(vVal) <= 0.05;
        const col = isNeutral ? pal.textMuted : (isTension ? pal.cardinal : pal.blue);
        ctx.save();
        ctx.strokeStyle = withAlpha(col, alphaKin * (0.28 + 0.55 * st.load));
        ctx.lineWidth = isNeutral ? 1.3 : 2.1;
        ctx.setLineDash([10, 7]);
        ctx.lineDashOffset = (isTension ? -1 : 1) * st.phase * 28;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const p = deformBody(i / N, vVal, st.load);
          const s = toPx(p.x, p.y);
          if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        ctx.restore();
      });

      // Vertical material cross-sections showing shear/bending kinematics
      if (f === 'kin' || f === 'all') {
        ctx.strokeStyle = withAlpha(pal.teal, alphaKin * 0.28);
        ctx.lineWidth = 1.1;
        for (let k = 1; k < 6; k++) {
          const uk = k / 6;
          const pTop = toPx(deformBody(uk, 1, st.load).x, deformBody(uk, 1, st.load).y);
          const pBot = toPx(deformBody(uk, -1, st.load).x, deformBody(uk, -1, st.load).y);
          ctx.beginPath(); ctx.moveTo(pTop.x, pTop.y); ctx.lineTo(pBot.x, pBot.y); ctx.stroke();
        }
      }
      ctx.restore();

      // 3. Dirichlet Boundary S_u (clamped left wall, teal hatch)
      ctx.save();
      ctx.globalAlpha = alphaSu;
      const topSu = toPx(0, 0.46);
      const botSu = toPx(0, -0.46);
      drawHatchWall(ctx, ox, topSu.y, botSu.y, -1, pal, pal.teal);
      ctx.restore();

      // 4. Neumann Boundary S_t (traction arrows along upper-right & tip, cardinal)
      ctx.save();
      ctx.globalAlpha = alphaSt;
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      for (let i = Math.floor(N * 0.58); i <= N; i++) {
        const p = deformBody(i / N, 1, st.load);
        const s = toPx(p.x, p.y);
        if (i === Math.floor(N * 0.58)) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();

      const tLen = 18 + 30 * st.load;
      [0.64, 0.76, 0.88, 0.99].forEach(function (uPos) {
        const p = deformBody(uPos, 1, st.load);
        const s = toPx(p.x, p.y);
        drawArrow(ctx, s.x - tLen * 0.25, s.y - tLen, s.x, s.y - 2, pal.cardinal, 2.4, 9);
      });
      ctx.restore();

      // 5. Body Force f inside V (amber downward field arrows)
      ctx.save();
      ctx.globalAlpha = alphaBody;
      const fLen = 14 + 18 * st.load;
      [0.24, 0.48, 0.72].forEach(function (uPos) {
        [-0.25, 0.25].forEach(function (vPos) {
          const p = deformBody(uPos, vPos, st.load);
          const s = toPx(p.x, p.y);
          drawArrow(ctx, s.x, s.y - fLen * 0.5, s.x, s.y + fLen * 0.5, pal.amber, 2.2, 8);
        });
      });
      ctx.restore();

      // 6. Focus callout pills (>= 15px, clamped cleanly inside canvas)
      const bounds = { x: 0, y: 0, w: w, h: h };
      drawLabelPill(ctx, 'Sᵤ: u = 0', isNarrow ? 10 : clamp(ox + 6, 58, w - 58), clamp(topSu.y - 20, 20, h - 22), pal, {
        color: pal.teal,
        align: isNarrow ? 'left' : 'center',
        clampTo: bounds
      });
      const stPt = toPx(deformBody(0.84, 1, st.load).x, deformBody(0.84, 1, st.load).y);
      drawLabelPill(ctx, 'Sₜ: σ·n = t̄', isNarrow ? w - 10 : clamp(stPt.x + 18, 90, w - 76), clamp(stPt.y - tLen - 16, 20, h - 22), pal, {
        color: pal.cardinal,
        align: isNarrow ? 'right' : 'center',
        clampTo: bounds
      });

      const vCenter = toPx(deformBody(0.48, -0.78, st.load).x, deformBody(0.48, -0.78, st.load).y);
      const focusText = f === 'kin'
        ? 'ε = ½(∇u + ∇uᵀ)'
        : f === 'body'
          ? 'Body Force f in V'
          : 'Body V: ∇·σ + f = 0';
      drawLabelPill(ctx, focusText, isNarrow ? w * 0.5 : clamp(vCenter.x, 100, w - 100), isNarrow ? h - 18 : clamp(vCenter.y + 34, 24, h - 20), pal, {
        color: f === 'body' ? pal.amber : pal.text,
        clampTo: bounds
      });

      dom.readouts.focus.val.textContent = FOCUS_LABELS[st.focus] || 'Full BVP';
      dom.readouts.tip.val.textContent = fmtSigned(-0.26 * st.load, 2) + ' L';
      dom.readouts.load.val.textContent = Math.round(st.load * 100) + '%';
    }

    const stopLoop = api.registerAnimationLoop(function (dt) {
      st.phase += dt * (0.4 + 1.1 * st.load);
      render();
    });

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () { stopLoop(); }
    };
  });

  /* =========================================================================
   * LAB 8: 'elastic-rod' (Slide 10: 1D Elastic Rod Analytical Simulator)
   * ========================================================================= */
  registerLab('elastic-rod', function (mountEl, api) {
    const L0 = 2.0; // meters

    const dom = createLabDom(mountEl, {
      readouts: [
        { id: 'uTip', label: 'u(L₀)', value: '5.60 mm' },
        { id: 'nWall', label: 'N(0)', value: '100 kN' },
        { id: 'epsMax', label: 'max|ε|', value: '0.400%' },
        { id: 'len', label: 'L', value: '2.006 m' }
      ],
      sliders: [
        { id: 'P', label: 'Tip P', min: -50, max: 100, step: 5, value: 40, format: function (v) { return fmtSigned(v, 0) + ' kN'; } },
        { id: 'f', label: 'Load f₀', min: 0, max: 80, step: 5, value: 30, format: function (v) { return v + ' kN/m'; } },
        { id: 'EA', label: 'Rigidity EA', min: 10, max: 60, step: 2, value: 25, format: function (v) { return v + ' MN'; } }
      ],
      caption: 'Exact 1D elasticity: N(x) = P + f₀(L₀ − x), N(0) = P + f₀L₀, and u(x) = [(P + f₀L₀)x − ½f₀x²] / EA (L₀ = 2 m).'
    });

    const st = { P: 40, f: 30, EA: 25 };

    ['P', 'f', 'EA'].forEach(function (k) {
      dom.sliders[k].input.addEventListener('input', function () {
        st[k] = parseFloat(dom.sliders[k].input.value);
        dom.sliders[k].valEl.textContent = dom.sliders[k].spec.format(st[k]);
        render();
      });
    });

    function solveRod(x) {
      // P in kN, f0 in kN/m, EA in MN = 1000 kN -> u in meters, multiply by 1000 for mm
      const EA_kN = st.EA * 1000;
      const N = st.P + st.f * (L0 - x);
      const u_m = ((st.P + st.f * L0) * x - 0.5 * st.f * x * x) / EA_kN;
      return { N: N, u_mm: u_m * 1000, eps: N / EA_kN };
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 290, { breakpoint: 520, minH: 435 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const isNarrow = w < 520;

      ctx.clearRect(0, 0, w, h);

      const tip = solveRod(L0);
      const wall = solveRod(0);
      const maxEps = Math.max(Math.abs(wall.eps), Math.abs(tip.eps));

      /* --- TOP SECTION: Animated Physical Rod --- */
      const rodY = isNarrow ? 66 : Math.max(46, h * 0.21);
      const rodH = isNarrow ? 26 : clamp(h * 0.11, 24, 34);
      const rodX0 = isNarrow ? 30 : 46;
      const baseLenPx = isNarrow
        ? Math.min(w * 0.54, w - 122)
        : Math.min(w * 0.62, w - 165);
      // Uniform smooth visual displacement scale so large stretches never distort interior strain gradient
      const maxStretchPos = Math.max(20, w - rodX0 - baseLenPx - (isNarrow ? 60 : 68));
      const maxStretchNeg = baseLenPx * 0.24;
      let maxPosU = 0;
      let maxNegU = 0;
      for (let i = 0; i <= 32; i++) {
        const ui = solveRod((i / 32) * L0).u_mm;
        if (ui > maxPosU) maxPosU = ui;
        if (ui < maxNegU) maxNegU = ui;
      }
      const scalePos = maxPosU > 1e-4 ? Math.min(5.2, maxStretchPos / maxPosU) : 5.2;
      const scaleNeg = maxNegU < -1e-4 ? Math.min(5.2, maxStretchNeg / (-maxNegU)) : 5.2;
      const uVisScale = Math.min(scalePos, scaleNeg);
      const stretchPx = tip.u_mm * uVisScale;
      const defLenPx = baseLenPx + stretchPx;

      // Clamped wall at x = 0
      drawHatchWall(ctx, rodX0, rodY - rodH * 0.95, rodY + rodH * 0.95, -1, pal, pal.teal);

      // Reference L0 ghost outline
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = pal.textMuted;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(rodX0, rodY - rodH * 0.5, baseLenPx, rodH);
      ctx.restore();

      // Deformed rod colored by exact N(x)
      const segs = 32;
      for (let i = 0; i < segs; i++) {
        const s0 = i / segs;
        const s1 = (i + 1) / segs;
        const r0 = solveRod(s0 * L0);
        const r1 = solveRod(s1 * L0);
        const xm0 = rodX0 + s0 * baseLenPx + r0.u_mm * uVisScale;
        const xm1 = rodX0 + s1 * baseLenPx + r1.u_mm * uVisScale;
        const nMid = 0.5 * (r0.N + r1.N);
        ctx.fillStyle = stressFill(nMid / 180, pal, 0.72);
        ctx.fillRect(xm0, rodY - rodH * 0.5, Math.max(1, xm1 - xm0 + 0.6), rodH);
      }

      // Rod border
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 2.0;
      ctx.strokeRect(rodX0, rodY - rodH * 0.5, defLenPx, rodH);

      // Material cross-section tick marks showing local elongation
      ctx.strokeStyle = withAlpha(pal.text, 0.45);
      ctx.lineWidth = 1.2;
      for (let m = 1; m < 8; m++) {
        const sm = m / 8;
        const rm = solveRod(sm * L0);
        const px = rodX0 + sm * baseLenPx + rm.u_mm * uVisScale;
        ctx.beginPath();
        ctx.moveTo(px, rodY - rodH * 0.5);
        ctx.lineTo(px, rodY + rodH * 0.5);
        ctx.stroke();
      }

      // Distributed body force arrows f0
      if (st.f > 0) {
        const nFArr = isNarrow ? 4 : 5;
        const fArrowL = clamp(12 + st.f * (isNarrow ? 0.22 : 0.28), 12, isNarrow ? 26 : 34);
        for (let k = 1; k <= nFArr; k++) {
          const px = rodX0 + (k / (nFArr + 1)) * defLenPx;
          drawArrow(ctx, px - fArrowL * 0.5, rodY - rodH * 0.5 - 12, px + fArrowL * 0.5, rodY - rodH * 0.5 - 12, pal.amber, 2.1, 8);
        }
        ctx.font = FONT_SANS_BOLD;
        ctx.fillStyle = pal.amber;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('f₀ = ' + st.f + ' kN/m', clamp(rodX0 + defLenPx * 0.5, 76, w - 76), rodY - rodH * 0.5 - 20);
      }

      // End force arrow P (right end x = L0)
      const endX = rodX0 + defLenPx;
      if (Math.abs(st.P) >= 1) {
        const maxArrow = Math.max(18, w - endX - 10);
        const nLen = clamp(Math.abs(st.P) * 0.50, 18, Math.min(50, maxArrow));
        const dir = st.P >= 0 ? 1 : -1;
        const ax1 = dir > 0 ? endX + 4 : endX + 4 + nLen;
        const ax2 = dir > 0 ? endX + 4 + nLen : endX + 4;
        drawArrow(ctx, ax1, rodY, ax2, rodY, st.P >= 0 ? pal.cardinal : pal.blue, 2.8, 10);
        ctx.font = FONT_SANS_BOLD;
        ctx.fillStyle = st.P >= 0 ? pal.cardinal : pal.blue;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('P', clamp(endX + 8, 12, w - 18), rodY - 12);
      }

      // L0 vs L markers
      ctx.font = FONT_SANS;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('x = 0', Math.max(26, rodX0), rodY + rodH * 0.5 + 8);
      ctx.fillText('L₀', rodX0 + baseLenPx, rodY + rodH * 0.5 + 8);

      /* --- BOTTOM SECTION: Synced Plots u(x) and N(x) (stacked on narrow screens) --- */
      let uBox, nBox;
      if (isNarrow) {
        const topStart = Math.max(rodY + rodH * 0.5 + 34, 134);
        const gapV = 10;
        const eachH = Math.max(120, Math.floor((h - topStart - gapV - 10) * 0.5));
        uBox = { x: 10, y: topStart, w: w - 20, h: eachH };
        nBox = { x: 10, y: topStart + eachH + gapV, w: w - 20, h: h - (topStart + eachH + gapV) - 10 };
      } else {
        const plotY = Math.max(rodY + rodH * 0.5 + 34, h * 0.42);
        const plotH = Math.max(100, h - plotY - 10);
        const halfW = Math.floor((w - 30) * 0.5);
        uBox = { x: 10, y: plotY, w: halfW, h: plotH };
        nBox = { x: 20 + halfW, y: plotY, w: w - halfW - 30, h: plotH };
      }

      function draw1DPlot(box, title, yUnit, color, sampleFn, yMin, yMax) {
        drawPlotFrame(ctx, box, pal, title, 'x / L₀', '');
        const axL = box.x + 54;
        const axR = box.x + box.w - 18;
        const axT = box.y + 34;
        const axB = box.y + box.h - 28;

        function toP(xVal, yVal) {
          return {
            x: axL + (xVal / L0) * (axR - axL),
            y: axB - ((yVal - yMin) / Math.max(1e-6, yMax - yMin)) * (axB - axT)
          };
        }

        // Zero line
        const zY = toP(0, 0).y;
        ctx.strokeStyle = pal.axis;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(axL, zY); ctx.lineTo(axR, zY);
        ctx.moveTo(axL, axT); ctx.lineTo(axL, axB);
        ctx.stroke();

        // Area fill under curve
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(axL, zY);
        for (let i = 0; i <= 40; i++) {
          const xv = (i / 40) * L0;
          const pt = toP(xv, sampleFn(xv));
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(axR, zY);
        ctx.closePath();
        ctx.fillStyle = withAlpha(color, pal.theme === 'dark' ? 0.20 : 0.14);
        ctx.fill();
        ctx.restore();

        // Curve
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const xv = (i / 40) * L0;
          const pt = toP(xv, sampleFn(xv));
          if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Endpoint dot
        const endPt = toP(L0, sampleFn(L0));
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(endPt.x, endPt.y, 4.8, 0, Math.PI * 2); ctx.fill();

        // Y-axis max/min labels (>= 15px)
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(fmt(yMax, yUnit === 'mm' ? 1 : 0), axL - 6, axT + 2);
        ctx.fillText(fmt(yMin, yUnit === 'mm' ? 1 : 0), axL - 6, axB - 2);
      }

      const uMinBound = Math.min(-2.5, maxNegU * 1.22);
      const uMaxBound = Math.max(2.5, maxPosU * 1.22);
      const uTitle = uBox.w < 230 ? 'u(x) [mm]' : 'Displacement u(x) [mm]';
      draw1DPlot(uBox, uTitle, 'mm', pal.teal, function (x) { return solveRod(x).u_mm; }, uMinBound, uMaxBound);

      const nMinBound = Math.min(-30, wall.N * 1.18, tip.N * 1.18);
      const nMaxBound = Math.max(30, wall.N * 1.18, tip.N * 1.18);
      const nTitle = nBox.w < 230 ? 'N(x) [kN]' : 'Axial Force N(x) [kN]';
      draw1DPlot(nBox, nTitle, 'kN', pal.cardinal, function (x) { return solveRod(x).N; }, nMinBound, nMaxBound);

      // Update readouts
      dom.readouts.uTip.val.textContent = fmtSigned(tip.u_mm, 2) + ' mm';
      dom.readouts.nWall.val.textContent = fmtSigned(wall.N, 0) + ' kN';
      dom.readouts.epsMax.val.textContent = fmt(maxEps * 100, 3) + '%';
      dom.readouts.len.val.textContent = fmt(L0 + tip.u_mm * 0.001, 4) + ' m';
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {}
    };
  });

  /* =========================================================================
   * LAB 9: 'plane-2d-toggle' (Slide 11: Plane Stress vs. Plane Strain 3D Slab)
   * ========================================================================= */
  registerLab('plane-2d-toggle', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 's33', label: 'σ₃₃', value: '0.0 MPa' },
        { id: 'e33', label: 'ε₃₃', value: '-0.116%' },
        { id: 'lamE', label: 'λ / E', value: '0.73' },
        { id: 'muE', label: 'μ / E', value: '0.38' }
      ],
      sliders: [
        { id: 'nu', label: 'Poisson ν', min: 0.00, max: 0.48, step: 0.01, value: 0.33, format: function (v) { return fmt(v, 2); } },
        { id: 'exx', label: 'Stretch ε_xx', min: -0.30, max: 0.50, step: 0.02, value: 0.35, format: function (v) { return fmtSigned(v, 2) + '%'; } }
      ],
      caption: 'Compare free out-of-plane thinning (Plane Stress) against clamped reaction stress σ₃₃ (Plane Strain).'
    });

    const st = { mode: 'pstress', nu: 0.33, exxPct: 0.35 };

    createPillGroup(dom.toolbar, [
      { id: 'pstress', label: 'Plane Stress (Thin)' },
      { id: 'pstrain', label: 'Plane Strain (Long)' }
    ], 'pstress', function (id) {
      st.mode = id;
      render();
    });

    dom.sliders.nu.input.addEventListener('input', function () {
      st.nu = parseFloat(dom.sliders.nu.input.value);
      dom.sliders.nu.valEl.textContent = fmt(st.nu, 2);
      render();
    });
    dom.sliders.exx.input.addEventListener('input', function () {
      st.exxPct = parseFloat(dom.sliders.exx.input.value);
      dom.sliders.exx.valEl.textContent = fmtSigned(st.exxPct, 2) + '%';
      render();
    });

    function render() {
      const fit = fitCanvas(dom.canvas, 240, { breakpoint: 480, minH: 260 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      ctx.clearRect(0, 0, w, h);

      const E = 200; // GPa
      const nu = st.nu;
      const exx = st.exxPct * 0.01;
      const isPStress = st.mode === 'pstress';
      const isWide = w >= 660;
      const isNarrow = w < 480;

      // Exact linear elasticity with sigma_yy = 0
      let sxxMPa, s33MPa, eyy, e33;
      if (isPStress) {
        sxxMPa = E * 1000 * exx;
        s33MPa = 0;
        eyy = -nu * exx;
        e33 = -(nu / (1 - nu)) * (exx + eyy); // equals -nu * exx
      } else {
        sxxMPa = (E * 1000 * exx) / (1 - nu * nu);
        s33MPa = nu * sxxMPa; // nu * (sigma_xx + sigma_yy)
        eyy = -(nu / (1 - nu)) * exx;
        e33 = 0;
      }

      const lamOverE = nu / ((1 + nu) * (1 - 2 * nu));
      const muOverE = 1 / (2 * (1 + nu));
      const accent = isPStress ? pal.teal : pal.cardinal;

      // Left slab viewport (full width on narrow/medium, left half on wide desktop)
      const slabW = isWide ? Math.floor(w * 0.46) : w;
      const scale = isWide
        ? Math.min(slabW * 0.28, h * 0.72)
        : Math.min(slabW * (isNarrow ? 0.24 : 0.27), h * (isNarrow ? 0.56 : 0.46));
      const ox = isWide ? slabW * 0.52 : slabW * (isNarrow ? 0.52 : 0.50);
      const oy = h * (isNarrow ? 0.57 : 0.56);

      function proj(x1, x2, x3) {
        const sx = ox + (0.86 * x1 - 0.68 * x3) * scale;
        const sy = oy + (0.28 * x1 - 0.92 * x2 + 0.42 * x3) * scale;
        return { x: sx, y: sy };
      }

      function drawIsoBox(Lx, Ly, Lz, opts) {
        const hx = Lx * 0.5, hy = Ly * 0.5, hz = Lz * 0.5;
        const c = {
          nnn: proj(-hx, -hy, -hz), pnn: proj(hx, -hy, -hz),
          npn: proj(-hx, hy, -hz),  ppn: proj(hx, hy, -hz),
          nnp: proj(-hx, -hy, hz),  pnp: proj(hx, -hy, hz),
          npp: proj(-hx, hy, hz),   ppp: proj(hx, hy, hz)
        };

        if (opts.dashed) {
          ctx.save();
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = opts.stroke;
          ctx.lineWidth = opts.lw || 1.4;
          const edges = [
            [c.nnn, c.pnn], [c.pnn, c.ppn], [c.ppn, c.npn], [c.npn, c.nnn],
            [c.nnp, c.pnp], [c.pnp, c.ppp], [c.ppp, c.npp], [c.npp, c.nnp],
            [c.nnn, c.nnp], [c.pnn, c.pnp], [c.ppn, c.ppp], [c.npn, c.npp]
          ];
          edges.forEach(function (e) {
            ctx.beginPath(); ctx.moveTo(e[0].x, e[0].y); ctx.lineTo(e[1].x, e[1].y); ctx.stroke();
          });
          ctx.restore();
          return c;
        }

        const faces = [
          { pts: [c.npn, c.ppn, c.ppp, c.npp], fill: opts.fillTop },
          { pts: [c.pnn, c.ppn, c.ppp, c.pnp], fill: opts.fillRight },
          { pts: [c.nnp, c.pnp, c.ppp, c.npp], fill: opts.fillFront }
        ];
        faces.forEach(function (f) {
          ctx.beginPath();
          ctx.moveTo(f.pts[0].x, f.pts[0].y);
          for (let i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i].x, f.pts[i].y);
          ctx.closePath();
          ctx.fillStyle = f.fill;
          ctx.fill();
          ctx.strokeStyle = opts.stroke;
          ctx.lineWidth = 2.0;
          ctx.stroke();
        });
        return c;
      }

      // Base geometry
      const baseLx = 0.84;
      const baseLy = 0.62;
      const baseLz = isPStress ? 0.24 : 0.72;

      // Exaggerated deformation for visual clarity
      const vis = 72;
      const defLx = baseLx * (1 + exx * vis);
      const defLy = baseLy * Math.max(0.45, 1 + eyy * vis);
      const defLz = baseLz * Math.max(0.32, 1 + e33 * vis * 1.45);

      // In Plane Strain mode: back rigid clamping plate at x3 = -baseLz/2
      if (!isPStress) {
        const wPad = 0.16;
        const bz = -baseLz * 0.5 - 0.02;
        const b1 = proj(-baseLx * 0.68 - wPad, -baseLy * 0.65, bz);
        const b2 = proj(baseLx * 0.68 + wPad, -baseLy * 0.65, bz);
        const b3 = proj(baseLx * 0.68 + wPad, baseLy * 0.65, bz);
        const b4 = proj(-baseLx * 0.68 - wPad, baseLy * 0.65, bz);
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(b3.x, b3.y); ctx.lineTo(b4.x, b4.y);
        ctx.closePath();
        ctx.fillStyle = withAlpha(pal.teal, pal.theme === 'dark' ? 0.14 : 0.10);
        ctx.fill();
        ctx.strokeStyle = withAlpha(pal.teal, 0.72);
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Reference dashed box
      drawIsoBox(baseLx, baseLy, baseLz, { dashed: true, stroke: pal.textMuted, lw: 1.4 });

      // Deformed solid slab
      drawIsoBox(defLx, defLy, defLz, {
        dashed: false,
        stroke: accent,
        fillTop: withAlpha(accent, pal.theme === 'dark' ? 0.28 : 0.22),
        fillRight: withAlpha(accent, pal.theme === 'dark' ? 0.20 : 0.16),
        fillFront: withAlpha(accent, pal.theme === 'dark' ? 0.13 : 0.10)
      });

      // Front rigid clamping wall & sigma_33 arrows (Plane Strain) vs thinning arrow (Plane Stress)
      if (!isPStress) {
        const wPad = 0.16;
        const fz = baseLz * 0.5 + 0.02;
        const f1 = proj(-baseLx * 0.68 - wPad, -baseLy * 0.65, fz);
        const f2 = proj(baseLx * 0.68 + wPad, -baseLy * 0.65, fz);
        const f3 = proj(baseLx * 0.68 + wPad, baseLy * 0.65, fz);
        const f4 = proj(-baseLx * 0.68 - wPad, baseLy * 0.65, fz);
        ctx.beginPath();
        ctx.moveTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.lineTo(f3.x, f3.y); ctx.lineTo(f4.x, f4.y);
        ctx.closePath();
        ctx.fillStyle = withAlpha(pal.teal, pal.theme === 'dark' ? 0.08 : 0.06);
        ctx.fill();
        ctx.strokeStyle = withAlpha(pal.teal, 0.65);
        ctx.lineWidth = 1.6;
        ctx.stroke();

        if (Math.abs(s33MPa) > 2) {
          const sign = s33MPa >= 0 ? 1 : -1;
          const aLen = clamp(Math.abs(s33MPa) / 550, 0.14, 0.42);
          [
            [-0.22, 0.12],
            [0.20, 0.12],
            [0.0, -0.14]
          ].forEach(function (pt) {
            const pA = proj(pt[0], pt[1], defLz * 0.5 + 0.03);
            const pB = proj(pt[0], pt[1], defLz * 0.5 + 0.03 + sign * aLen);
            if (sign > 0) drawArrow(ctx, pA.x, pA.y, pB.x, pB.y, pal.cardinal, 2.8, 10);
            else drawArrow(ctx, pB.x, pB.y, pA.x, pA.y, pal.blue, 2.8, 10);
          });
        }
      } else if (Math.abs(e33) > 0.0001) {
        const pOut = proj(0, 0, baseLz * 0.5 + 0.30);
        const pFace = proj(0, 0, defLz * 0.5 + 0.03);
        if (e33 < 0) drawArrow(ctx, pOut.x, pOut.y, pFace.x, pFace.y, pal.teal, 2.6, 10);
        else drawArrow(ctx, pFace.x, pFace.y, pOut.x, pOut.y, pal.teal, 2.6, 10);
      }

      // Applied in-plane stretch arrows along +x1 and -x1
      if (Math.abs(exx) > 0.0001) {
        const dir = exx >= 0 ? 1 : -1;
        const pR1 = proj(defLx * 0.5 + 0.04, 0, 0);
        const pR2 = proj(defLx * 0.5 + 0.30, 0, 0);
        const pL1 = proj(-defLx * 0.5 - 0.04, 0, 0);
        const pL2 = proj(-defLx * 0.5 - 0.30, 0, 0);
        if (dir > 0) {
          drawArrow(ctx, pR1.x, pR1.y, pR2.x, pR2.y, pal.amber, 2.6, 10);
          drawArrow(ctx, pL1.x, pL1.y, pL2.x, pL2.y, pal.amber, 2.6, 10);
        } else {
          drawArrow(ctx, pR2.x, pR2.y, pR1.x, pR1.y, pal.blue, 2.6, 10);
          drawArrow(ctx, pL2.x, pL2.y, pL1.x, pL1.y, pal.blue, 2.6, 10);
        }
      }

      // 3D Coordinate Triad in bottom-left corner
      const trX = isNarrow ? 36 : 44;
      const trY = h - (isNarrow ? 32 : 38);
      const trL = isNarrow ? 24 : 32;
      drawArrow(ctx, trX, trY, trX + trL, trY + Math.round(trL * 0.32), pal.axis, 1.8, 7);
      drawArrow(ctx, trX, trY, trX, trY - trL, pal.axis, 1.8, 7);
      drawArrow(ctx, trX, trY, trX - Math.round(trL * 0.70), trY + Math.round(trL * 0.44), pal.axis, 1.8, 7);
      ctx.font = FONT_SANS_BOLD;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('x₁', trX + trL + 4, trY + Math.round(trL * 0.34));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('x₂', trX, trY - trL - 4);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('x₃', Math.max(16, trX - Math.round(trL * 0.74) - 2), trY + Math.round(trL * 0.42));

      // Mode annotation (>= 15px)
      ctx.font = FONT_SANS_BOLD;
      ctx.fillStyle = accent;
      ctx.textBaseline = 'top';
      if (isWide) {
        const statusTxt = isPStress ? 'Free faces (σ₃₃ = 0)' : 'Clamped ends (ε₃₃ = 0)';
        ctx.textAlign = 'left';
        ctx.fillText(statusTxt, 14, 12);
      } else {
        const statusTxt = isPStress
          ? (isNarrow ? 'Plane Stress: σ₃₃ = 0' : 'Free out-of-plane faces (σ₃₃ = 0)')
          : (isNarrow ? 'Plane Strain: ε₃₃ = 0' : 'Clamped out-of-plane ends (ε₃₃ = 0)');
        ctx.textAlign = isNarrow ? 'center' : 'right';
        ctx.fillText(statusTxt, isNarrow ? w * 0.5 : w - 14, 10);
      }

      if (isWide) {
        /* --- DESKTOP RIGHT PANEL: Live 3D Stress & Strain Component Bars (fills widescreen cleanly) --- */
        const pBox = { x: slabW + 10, y: 10, w: w - slabW - 22, h: h - 20 };
        const pTitle = pBox.w >= 430 ? '3D Normal Stress & Strain Components' : '3D State Components';
        drawPlotFrame(ctx, pBox, pal, pTitle, '', '');

        const twoCol = pBox.w >= 400;
        const topY = pBox.y + 38;
        const footY = pBox.y + pBox.h - 14;
        const bodyBot = footY - 18;

        function drawBarGroup(gx, gy, gw, gh, heading, items, maxAbs, unitSuffix) {
          ctx.font = FONT_SANS_BOLD;
          ctx.fillStyle = pal.textMuted;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(heading, gx, gy);

          const listTop = gy + 24;
          const rowStep = Math.max(24, (gh - 24) / items.length);
          const lblW = 34;
          const valW = unitSuffix === '%' ? 74 : 68;
          const trackX = gx + lblW + 6;
          const trackW = Math.max(52, gw - lblW - valW - 14);
          const zeroX = trackX + trackW * 0.5;
          const barH = clamp(Math.floor(rowStep * 0.42), 10, 16);

          // Shared vertical zero axis through all 3 bars
          ctx.strokeStyle = pal.axis;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(zeroX, listTop + 2);
          ctx.lineTo(zeroX, listTop + rowStep * items.length - 4);
          ctx.stroke();

          items.forEach(function (it, idx) {
            const ry = listTop + (idx + 0.5) * rowStep;
            // Component symbol
            ctx.font = FONT_MONO_BOLD;
            ctx.fillStyle = it.highlight ? accent : pal.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(it.sym, gx, ry);

            // Track background
            drawRoundRect(ctx, trackX, ry - barH * 0.5, trackW, barH, 2);
            ctx.fillStyle = withAlpha(pal.surface, pal.theme === 'dark' ? 0.72 : 0.90);
            ctx.fill();
            ctx.strokeStyle = it.highlight ? withAlpha(accent, 0.55) : pal.border;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Signed bar fill from zeroX
            const norm = clamp(it.val / maxAbs, -1, 1);
            const bw = Math.abs(norm) * (trackW * 0.48);
            if (bw > 1.2) {
              const bx = norm >= 0 ? zeroX : zeroX - bw;
              ctx.fillStyle = it.highlight ? accent : (norm >= 0 ? pal.cardinal : pal.blue);
              ctx.fillRect(bx, ry - barH * 0.5 + 1, bw, barH - 2);
            }

            // Right-aligned numeric readout (>= 15px mono)
            ctx.font = FONT_MONO;
            ctx.fillStyle = it.highlight ? accent : pal.text;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const cleanV = Math.abs(it.val) < (unitSuffix === '%' ? 0.0005 : 0.05) ? 0 : it.val;
            const txt = unitSuffix === '%'
              ? (cleanV === 0 ? '0.00%' : fmtSigned(cleanV, 2) + '%')
              : (cleanV === 0 ? '0' : fmtSigned(cleanV, 0));
            ctx.fillText(txt, gx + gw, ry);
          });
        }

        const stressItems = [
          { sym: 'σ₁₁', val: sxxMPa, highlight: false },
          { sym: 'σ₂₂', val: 0, highlight: false },
          { sym: 'σ₃₃', val: s33MPa, highlight: true }
        ];
        const strainItems = [
          { sym: 'ε₁₁', val: exx * 100, highlight: false },
          { sym: 'ε₂₂', val: eyy * 100, highlight: false },
          { sym: 'ε₃₃', val: e33 * 100, highlight: true }
        ];

        const innerX = pBox.x + 14;
        const innerW = pBox.w - 28;
        const innerH = Math.max(96, bodyBot - topY);

        if (twoCol) {
          const colGap = 24;
          const colW = Math.floor((innerW - colGap) * 0.5);
          drawBarGroup(innerX, topY, colW, innerH, 'Stress (MPa)', stressItems, 1300, 'MPa');
          drawDashed(ctx, innerX + colW + colGap * 0.5, topY + 2, innerX + colW + colGap * 0.5, bodyBot - 4, pal.border, [4, 4], 1.1);
          drawBarGroup(innerX + colW + colGap, topY, innerW - colW - colGap, innerH, 'Strain (%)', strainItems, 0.55, '%');
        } else {
          const compactItems = [
            { sym: 'σ₁₁', val: sxxMPa, highlight: false },
            { sym: 'σ₃₃', val: s33MPa, highlight: true }
          ];
          const halfH = Math.floor((innerH - 8) * 0.5);
          drawBarGroup(innerX, topY, innerW, halfH, 'Stress (MPa)', compactItems, 1300, 'MPa');
          drawBarGroup(innerX, topY + halfH + 8, innerW, innerH - halfH - 8, 'Strain (%)', [
            { sym: 'ε₁₁', val: exx * 100, highlight: false },
            { sym: 'ε₃₃', val: e33 * 100, highlight: true }
          ], 0.55, '%');
        }

        // Constitutive relation footer inside desktop right panel (>= 15px mono)
        const lawTxt = isPStress
          ? (pBox.w >= 490 ? 'σ₃₃ = 0   ·   ε₃₃ = −[ν/(1−ν)](ε₁₁ + ε₂₂)' : 'σ₃₃ = 0  ·  ε₃₃ = −νε₁₁')
          : 'ε₃₃ = 0   ·   σ₃₃ = ν(σ₁₁ + σ₂₂)';
        ctx.font = FONT_MONO;
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lawTxt, pBox.x + pBox.w * 0.5, footY);
      } else {
        // Mobile / compact bottom-right out-of-plane badge
        const badgeTxt = isPStress
          ? 'ε₃₃ = ' + fmtSigned(e33 * 100, 2) + '%'
          : 'σ₃₃ = ' + fmtSigned(s33MPa, 0) + ' MPa';
        ctx.font = FONT_MONO_BOLD;
        ctx.fillStyle = accent;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(badgeTxt, w - 12, h - 10);
      }

      // Update readouts
      dom.readouts.s33.val.textContent = fmtSigned(s33MPa, 1) + ' MPa';
      dom.readouts.e33.val.textContent = fmtSigned(e33 * 100, 3) + '%';
      dom.readouts.lamE.val.textContent = fmt(lamOverE, 2);
      dom.readouts.muE.val.textContent = fmt(muOverE, 2);
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {}
    };
  });

  /* =========================================================================
   * LAB 10: 'airy-gallery' (Slide 12 Wide Lab: 4-in-1 2D Airy Solutions)
   * ========================================================================= */
  registerLab('airy-gallery', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      readouts: [
        { id: 'r1', label: 'Metric 1', value: '--' },
        { id: 'r2', label: 'Metric 2', value: '--' },
        { id: 'r3', label: 'Metric 3', value: '--' },
        { id: 'r4', label: 'Airy Form', value: '--' }
      ],
      sliders: [
        { id: 'p1', label: 'Load q₀', min: 10, max: 100, step: 2, value: 55, format: function (v) { return v + ' kN/m'; } },
        { id: 'p2', label: 'Section x/L', min: 0.10, max: 0.90, step: 0.02, value: 0.50, format: function (v) { return fmt(v, 2); } }
      ],
      caption: 'Select a classical 2D biharmonic Airy stress solution (∇⁴φ = 0) from Lectures 6 to 10.'
    });

    const st = {
      tab: 'beam',
      beamQ: 55,
      beamX: 0.50,
      fourierN: 2,
      fourierP: 60,
      flamantP: 80,
      flamantR: 0.45,
      contactP: 55,
      contactR: 0.50
    };

    const TAB_CONFIG = {
      beam: {
        s1: { label: 'Load q₀', min: 10, max: 100, step: 2, get: function () { return st.beamQ; }, set: function (v) { st.beamQ = v; }, fmt: function (v) { return v + ' kN/m'; } },
        s2: { label: 'Cut x / L', min: 0.10, max: 0.90, step: 0.02, get: function () { return st.beamX; }, set: function (v) { st.beamX = v; }, fmt: function (v) { return fmt(v, 2); } },
        caption: 'Beam (L, 2h): σ_xx = −My/I + Timoshenko correction · polynomial Airy φ(x,y)'
      },
      fourier: {
        s1: { label: 'Mode n', min: 1, max: 6, step: 1, get: function () { return st.fourierN; }, set: function (v) { st.fourierN = v; }, fmt: function (v) { return 'n = ' + v; } },
        s2: { label: 'Pressure p₀', min: 20, max: 100, step: 5, get: function () { return st.fourierP; }, set: function (v) { st.fourierP = v; }, fmt: function (v) { return v + ' MPa'; } },
        caption: 'Fourier: p(x) = p₀ cos(2πnx/L) · σ_yy = −p₀(1+ky)e^(-ky) cos(kx) (Saint-Venant decay)'
      },
      halfspace: {
        s1: { label: 'Line Load P', min: 20, max: 150, step: 5, get: function () { return st.flamantP; }, set: function (v) { st.flamantP = v; }, fmt: function (v) { return v + ' kN/m'; } },
        s2: { label: 'Radius r', min: 0.20, max: 1.00, step: 0.02, get: function () { return st.flamantR; }, set: function (v) { st.flamantR = v; }, fmt: function (v) { return fmt(v, 2) + ' m'; } },
        caption: 'Flamant half-space: φ = −(P/π)rθ sinθ · σ_rr = −(2P/πr)cosθ, σ_θθ = τ_rθ = 0'
      },
      contact: {
        s1: { label: 'Load P', min: 10, max: 120, step: 2, get: function () { return st.contactP; }, set: function (v) { st.contactP = v; }, fmt: function (v) { return v + ' kN/m'; } },
        s2: { label: 'Radius R', min: 0.25, max: 1.00, step: 0.05, get: function () { return st.contactR; }, set: function (v) { st.contactR = v; }, fmt: function (v) { return fmt(v, 2) + ' m'; } },
        caption: 'Hertz contact: p(x) = p₀√(1−(x/a)²), a ∝ √P · peak subsurface shear τ_max at z ≈ 0.786a'
      }
    };

    function applyTabConfig() {
      const cfg = TAB_CONFIG[st.tab];
      [
        { sl: dom.sliders.p1, c: cfg.s1 },
        { sl: dom.sliders.p2, c: cfg.s2 }
      ].forEach(function (pair) {
        pair.sl.labelEl.innerHTML = formatMathHtml(pair.c.label);
        pair.sl.input.min = String(pair.c.min);
        pair.sl.input.max = String(pair.c.max);
        pair.sl.input.step = String(pair.c.step);
        pair.sl.input.value = String(pair.c.get());
        pair.sl.valEl.textContent = pair.c.fmt(pair.c.get());
      });
      if (dom.captionEl) dom.captionEl.innerHTML = formatMathHtml(cfg.caption);
    }

    createPillGroup(dom.toolbar, [
      { id: 'beam', label: 'Beam (Lec. 6)' },
      { id: 'fourier', label: 'Fourier (Lec. 7–8)' },
      { id: 'halfspace', label: 'Half Space (Lec. 9)' },
      { id: 'contact', label: 'Contact (Lec. 10)' }
    ], 'beam', function (id) {
      st.tab = id;
      applyTabConfig();
      render();
    });

    dom.sliders.p1.input.addEventListener('input', function () {
      const cfg = TAB_CONFIG[st.tab].s1;
      const v = parseFloat(dom.sliders.p1.input.value);
      cfg.set(v);
      dom.sliders.p1.valEl.textContent = cfg.fmt(v);
      render();
    });
    dom.sliders.p2.input.addEventListener('input', function () {
      const cfg = TAB_CONFIG[st.tab].s2;
      const v = parseFloat(dom.sliders.p2.input.value);
      cfg.set(v);
      dom.sliders.p2.valEl.textContent = cfg.fmt(v);
      render();
    });

    function setReadout(id, keyText, valText) {
      dom.readouts[id].key.innerHTML = formatMathHtml(keyText);
      dom.readouts[id].val.textContent = valText;
    }

    function drawBeam(ctx, w, h, pal) {
      const isStacked = w < 540;
      const splitX = Math.floor(w * 0.65);
      const splitY = Math.floor(h * 0.50);
      const q = st.beamQ; // kN/m
      const L = 4.0;      // m
      const halfH = 0.25; // m (depth 2h = 0.5m)
      const I = (2 * Math.pow(halfH, 3)) / 3; // per unit thickness
      const xCut = st.beamX * L;

      // Exact bending moment & deflection
      function moment(x) { return 0.5 * q * (L * x - x * x); } // kN*m
      function sigXX(x, y) {
        // y in [-h, +h] upward: top (+h) compression < 0, bottom (-h) tension > 0
        const M = moment(x);
        const bend = -(M * y) / I; // kPa -> /1000 for MPa
        const timo = q * ((y * y * y) / (2 * Math.pow(halfH, 3)) - (3 * y) / (10 * halfH));
        return (bend + timo) * 0.001; // MPa
      }
      function deflNorm(x) {
        const xi = x / L;
        return xi * (1 - 2 * xi * xi + xi * xi * xi) / (5 / 16); // normalized to 1 at midspan
      }

      const maxDeflPx = isStacked
        ? (q / 100) * Math.min(26, splitY * 0.13)
        : (q / 100) * Math.min(48, h * 0.16);
      const bx0 = isStacked ? 24 : 36;
      const bLen = isStacked ? (w - 48) : (splitX - 66);
      const bCy = isStacked ? Math.round(splitY * 0.56) : h * 0.48;
      const bHalfPx = isStacked ? clamp(splitY * 0.14, 22, 28) : clamp(h * 0.16, 28, 46);

      // Compact non-colliding inline legend at top on narrow screens
      if (isStacked) {
        ctx.font = FONT_SANS_BOLD;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillStyle = pal.blue;
        ctx.fillText('Top: Comp. (−)', 12, 8);
        ctx.textAlign = 'right';
        ctx.fillStyle = pal.cardinal;
        ctx.fillText('Bottom: Tens. (+)', w - 12, 8);
      }

      // Draw deformed colored beam strips
      const nx = 44;
      const ny = 10;
      const maxSigRef = Math.max(2.0, Math.abs(sigXX(L * 0.5, halfH)));

      for (let ix = 0; ix < nx; ix++) {
        const s0 = ix / nx;
        const s1 = (ix + 1) / nx;
        const x0 = bx0 + s0 * bLen;
        const x1 = bx0 + s1 * bLen;
        const d0 = maxDeflPx * deflNorm(s0 * L);
        const d1 = maxDeflPx * deflNorm(s1 * L);
        const xm = 0.5 * (s0 + s1) * L;

        for (let iy = 0; iy < ny; iy++) {
          const v0 = -1 + (2 * iy) / ny;
          const v1 = -1 + (2 * (iy + 1)) / ny;
          const ym = 0.5 * (v0 + v1) * halfH;
          const sig = sigXX(xm, ym);

          const p00 = { x: x0, y: bCy + d0 - v0 * bHalfPx };
          const p10 = { x: x1, y: bCy + d1 - v0 * bHalfPx };
          const p11 = { x: x1, y: bCy + d1 - v1 * bHalfPx };
          const p01 = { x: x0, y: bCy + d0 - v1 * bHalfPx };

          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();
          ctx.fillStyle = stressFill(sig / maxSigRef, pal, 0.88);
          ctx.fill();
        }
      }

      // Beam outer contour & neutral axis
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let i = 0; i <= nx; i++) {
        const s = i / nx;
        const px = bx0 + s * bLen;
        const py = bCy + maxDeflPx * deflNorm(s * L) - bHalfPx;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      for (let i = nx; i >= 0; i--) {
        const s = i / nx;
        const px = bx0 + s * bLen;
        const py = bCy + maxDeflPx * deflNorm(s * L) + bHalfPx;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Neutral axis dashed
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = withAlpha(pal.text, 0.65);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= nx; i++) {
        const s = i / nx;
        const px = bx0 + s * bLen;
        const py = bCy + maxDeflPx * deflNorm(s * L);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Pin & roller supports at ends
      [bx0, bx0 + bLen].forEach(function (sx) {
        const sy = bCy + bHalfPx + 2;
        ctx.fillStyle = pal.teal;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 10, sy + 16);
        ctx.lineTo(sx + 10, sy + 16);
        ctx.closePath();
        ctx.fill();
      });

      // Distributed downward load arrows q(x)
      const qLen = isStacked
        ? clamp(14 + q * 0.22, 16, 36)
        : clamp(16 + q * 0.34, 18, 48);
      const nQArr = isStacked ? 6 : 7;
      for (let k = 1; k <= nQArr; k++) {
        const s = k / (nQArr + 1);
        const px = bx0 + s * bLen;
        const topY = bCy + maxDeflPx * deflNorm(s * L) - bHalfPx;
        drawArrow(ctx, px, topY - qLen - 4, px, topY - 3, pal.amber, 2.2, 8);
      }

      // Section cut vertical line at x/L
      const cutPx = bx0 + st.beamX * bLen;
      const cutD = maxDeflPx * deflNorm(xCut);
      const cutPad = isStacked ? 10 : 14;
      drawDashed(ctx, cutPx, bCy + cutD - bHalfPx - cutPad, cutPx, bCy + cutD + bHalfPx + cutPad, pal.amber, [4, 4], 2.2);

      if (!isStacked) {
        const legText = bLen < 360
          ? 'Top: Comp. (−)  |  Bottom: Tens. (+)'
          : 'Top: Compression (−)  |  Bottom: Tension (+)';
        drawLabelPill(ctx, legText, bx0 + bLen * 0.5, h - 20, pal, {
          color: pal.text,
          clampTo: { x: 0, y: 0, w: splitX, h: h }
        });
      }

      // Profile box: sigma_xx(xCut, y) vs y (bottom on mobile, right on desktop)
      const pBox = isStacked
        ? { x: 10, y: splitY + 4, w: w - 20, h: h - splitY - 14 }
        : { x: splitX + 10, y: 12, w: w - splitX - 20, h: h - 24 };
      const pTitle = (isStacked || pBox.w < 300)
        ? 'σₓₓ(y) at x/L=' + fmt(st.beamX, 2)
        : 'Profile σₓₓ(y) at x/L=' + fmt(st.beamX, 2);
      drawPlotFrame(ctx, pBox, pal, pTitle, 'σₓₓ (MPa)', '');

      const midX = pBox.x + pBox.w * 0.50;
      const topY = pBox.y + 42;
      const botY = pBox.y + pBox.h - 32;
      const maxPlotSig = 5.4; // MPa fixed visual scale matching max q=100 kN/m (4.8 MPa)
      const sScale = (pBox.w * 0.40) / maxPlotSig;

      // Vertical zero line & horizontal neutral axis
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(midX, topY); ctx.lineTo(midX, botY);
      ctx.moveTo(pBox.x + 14, 0.5 * (topY + botY)); ctx.lineTo(pBox.x + pBox.w - 14, 0.5 * (topY + botY));
      ctx.stroke();

      // Profile curve & horizontal arrows
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const frac = i / 30; // 0 bottom (-h) to 1 top (+h)
        const yVal = lerp(-halfH, halfH, frac);
        const sVal = sigXX(xCut, yVal);
        const px = clamp(midX + sVal * sScale, pBox.x + 14, pBox.x + pBox.w - 14);
        const py = lerp(botY, topY, frac);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      for (let j = 0; j <= 6; j++) {
        if (j === 3) continue;
        const frac = j / 6;
        const yVal = lerp(-halfH, halfH, frac);
        const sVal = sigXX(xCut, yVal);
        const px = clamp(midX + sVal * sScale, pBox.x + 16, pBox.x + pBox.w - 16);
        const py = lerp(botY, topY, frac);
        drawArrow(ctx, midX, py, px, py, sVal >= 0 ? pal.cardinal : pal.blue, 2.0, 8);
      }

      // Place y = +h (-) on the empty RIGHT side of top compression arrows,
      // and y = -h (+) on the empty LEFT side of bottom tension arrows -> mathematically zero overlap!
      const compactY = pBox.w < 210;
      ctx.font = FONT_SANS_BOLD;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = pal.blue;
      ctx.textAlign = 'left';
      ctx.fillText(compactY ? 'y=+h (−)' : 'y = +h (−)', midX + (compactY ? 6 : 10), topY + 2);
      ctx.fillStyle = pal.cardinal;
      ctx.textAlign = 'right';
      ctx.fillText(compactY ? 'y=−h (+)' : 'y = −h (+)', midX - (compactY ? 6 : 10), botY - 2);

      const sigBot = sigXX(xCut, -halfH);
      const midDeflMm = (5 * q * Math.pow(L, 4)) / (384 * 200e6 * I) * 1000;
      setReadout('r1', 'σ_xx(x, -h)', fmtSigned(sigBot, 1) + ' MPa');
      setReadout('r2', 'Moment M(x)', fmt(moment(xCut), 1) + ' kN·m');
      setReadout('r3', 'Midspan δ', fmt(midDeflMm, 2) + ' mm');
      setReadout('r4', 'Airy φ(x,y)', 'Polynomial');
    }

    function drawFourier(ctx, w, h, pal) {
      const isStacked = w < 540;
      const splitX = Math.floor(w * 0.65);
      const splitY = Math.floor(h * 0.50);
      const n = st.fourierN;
      const p0 = st.fourierP;
      const k = 2 * Math.PI * n; // L = 1 normalized

      const fBox = isStacked
        ? { x: 14, y: 50, w: w - 28, h: splitY - 58 }
        : { x: 16, y: 62, w: splitX - 30, h: h - 78 };
      const depthMax = 0.65; // y/L from 0 to 0.65

      // 2D field heatmap of sigma_yy(x, y) = -p0 (1 + k y) e^(-ky) cos(kx)
      const cols = 64;
      const rows = 28;
      const cw = fBox.w / cols;
      const ch = fBox.h / rows;
      for (let r = 0; r < rows; r++) {
        const yNorm = ((r + 0.5) / rows) * depthMax;
        const env = (1 + k * yNorm) * Math.exp(-k * yNorm);
        for (let c = 0; c < cols; c++) {
          const xNorm = (c + 0.5) / cols;
          const sNorm = -(p0 / 100) * env * Math.cos(k * xNorm);
          ctx.fillStyle = stressFill(sNorm, pal, 0.90);
          ctx.fillRect(fBox.x + c * cw, fBox.y + r * ch, cw + 0.7, ch + 0.7);
        }
      }

      // Half-strip outline
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(fBox.x, fBox.y, fBox.w, fBox.h);

      // Surface cosine pressure wave p(x) = p0 cos(2*pi*n*x/L)
      const ampPx = isStacked
        ? (8 + (p0 / 100) * 10)
        : (12 + (p0 / 100) * 16);
      const waveBaseY = fBox.y - (isStacked ? 22 : 18);
      ctx.strokeStyle = pal.amber;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const xn = i / 120;
        const px = fBox.x + xn * fBox.w;
        const py = waveBaseY - ampPx * Math.cos(k * xn);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Surface arrows showing alternating compression / tension
      const nArrows = Math.min(isStacked ? 18 : 24, n * 6);
      for (let j = 0; j <= nArrows; j++) {
        const xn = j / nArrows;
        const val = Math.cos(k * xn);
        if (Math.abs(val) < 0.25) continue;
        const px = fBox.x + xn * fBox.w;
        const len = Math.abs(val) * ampPx;
        if (val > 0) drawArrow(ctx, px, fBox.y - 4 - len, px, fBox.y - 2, pal.blue, 1.8, 7);
        else drawArrow(ctx, px, fBox.y - 2, px, fBox.y - 4 - len, pal.cardinal, 1.8, 7);
      }

      // Saint-Venant wavelength depth marker y = L / (2n)
      const decayY = Math.min(depthMax, 1 / (2 * n));
      const decayPx = fBox.y + (decayY / depthMax) * fBox.h;
      drawDashed(ctx, fBox.x, decayPx, fBox.x + fBox.w, decayPx, pal.teal, [6, 5], 2.0);
      const decayLabel = isStacked
        ? 'Decay y ≈ λ/2 = L/' + (2 * n)
        : 'Decay depth y ≈ λ/2 = L/' + (2 * n);
      drawLabelPill(ctx, decayLabel, fBox.x + fBox.w * 0.5, clamp(decayPx, fBox.y + 18, fBox.y + fBox.h - 18), pal, {
        color: pal.teal,
        clampTo: fBox
      });

      // Decay envelope plot: (1 + ky) e^(-ky) vs y/L (bottom on mobile, right on desktop)
      const pBox = isStacked
        ? { x: 10, y: splitY + 4, w: w - 20, h: h - splitY - 14 }
        : { x: splitX + 10, y: 12, w: w - splitX - 20, h: h - 24 };
      drawPlotFrame(ctx, pBox, pal, '|σᵧᵧ| / p₀ vs. y/L', '', '');
      const axL = pBox.x + 52;
      const axR = pBox.x + pBox.w - 18;
      const axT = pBox.y + 42;
      const axB = pBox.y + pBox.h - 32;

      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(axL, axT); ctx.lineTo(axL, axB); ctx.lineTo(axR, axB);
      ctx.stroke();

      // Numeric ticks along Stress / p0 axis (0, 0.5, 1.0)
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      [0, 0.5, 1.0].forEach(function (tv) {
        const tx = axL + tv * (axR - axL);
        ctx.beginPath();
        ctx.moveTo(tx, axB); ctx.lineTo(tx, axB + 4);
        ctx.stroke();
        ctx.fillText(tv === 0 ? '0' : tv.toFixed(1), tx, axB + 5);
      });

      // Compare mode n=1 dashed vs current mode n solid
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = pal.textMuted;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const yv = (i / 40) * depthMax;
        const env1 = (1 + 2 * Math.PI * yv) * Math.exp(-2 * Math.PI * yv);
        const px = axL + env1 * (axR - axL);
        const py = axT + (yv / depthMax) * (axB - axT);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const yv = (i / 50) * depthMax;
        const env = (1 + k * yv) * Math.exp(-k * yv);
        const px = axL + env * (axR - axL);
        const py = axT + (yv / depthMax) * (axB - axT);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('0', axL - 6, axT);
      ctx.fillText('0.65', axL - 6, axB);

      const envAt03 = (1 + k * 0.30) * Math.exp(-k * 0.30);
      setReadout('r1', 'Mode n', String(n));
      setReadout('r2', 'Wavelength λ', 'L / ' + n);
      setReadout('r3', 'At y = 0.3L', fmt(envAt03 * 100, 1) + '%');
      setReadout('r4', 'Airy φ(x,y)', 'e^(−ky) cos(kx)');
    }

    function drawHalfSpace(ctx, w, h, pal) {
      const isStacked = w < 540;
      const splitX = Math.floor(w * 0.65);
      const splitY = Math.floor(h * 0.50);
      const P = st.flamantP; // kN/m
      const rProbe = st.flamantR;

      const hsBox = isStacked
        ? { x: 14, y: 46, w: w - 28, h: splitY - 54 }
        : { x: 14, y: 54, w: splitX - 28, h: h - 68 };
      const ox = hsBox.x + hsBox.w * 0.5;
      const oy = hsBox.y;
      const scale = Math.min(hsBox.w * 0.46, hsBox.h * 0.88);

      // Background 2D heatmap of compressive |sigma_rr| = (2P / (pi r)) cos(theta)
      const cols = 64;
      const rows = 34;
      const cw = hsBox.w / cols;
      const ch = hsBox.h / rows;
      for (let r = 0; r < rows; r++) {
        const py = hsBox.y + (r + 0.5) * ch;
        const dy = (py - oy) / scale;
        for (let c = 0; c < cols; c++) {
          const px = hsBox.x + (c + 0.5) * cw;
          const dx = (px - ox) / scale;
          const rad = Math.hypot(dx, dy) + 0.05;
          const cosTh = dy / rad;
          const sigRR = -(2 * P * cosTh) / (Math.PI * rad); // kPa (negative compression)
          const norm = clamp(sigRR / 320, -1, 0);
          ctx.fillStyle = stressFill(norm, pal, 0.85);
          ctx.fillRect(hsBox.x + c * cw, hsBox.y + r * ch, cw + 0.7, ch + 0.7);
        }
      }

      // Free surface y = 0
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(hsBox.x, oy); ctx.lineTo(hsBox.x + hsBox.w, oy);
      ctx.stroke();

      // Exact circular isochromatics tangent to surface at origin: r = D cos(theta)
      ctx.save();
      ctx.beginPath();
      ctx.rect(hsBox.x, hsBox.y, hsBox.w, hsBox.h);
      ctx.clip();
      const levels = [50, 90, 150, 240]; // kPa
      levels.forEach(function (lvl) {
        const diam = ((2 * P) / (Math.PI * lvl)) * scale;
        if (diam < 8 || diam > hsBox.h * 2.2) return;
        ctx.strokeStyle = withAlpha(pal.white, pal.theme === 'dark' ? 0.55 : 0.72);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ox, oy + diam * 0.5, diam * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Probe semicircle of radius rProbe + radial stress fan vectors
      const rPx = rProbe * scale;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = pal.amber;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(ox, oy, rPx, 0, Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      for (let deg = -65; deg <= 65; deg += 26) {
        const th = (deg * Math.PI) / 180; // from downward vertical
        const cosT = Math.cos(th);
        const sinT = Math.sin(th);
        const sx = ox + sinT * rPx;
        const sy = oy + cosT * rPx;
        const mag = clamp((P / 120) * (0.45 / rProbe) * cosT * (isStacked ? 32 : 42), 8, isStacked ? 40 : 52);
        drawArrow(ctx, sx, sy, sx + sinT * mag, sy + cosT * mag, pal.amber, 2.2, 8);
      }
      ctx.restore();

      // Downward concentrated line load arrow P
      const pLen = isStacked
        ? clamp(22 + P * 0.10, 22, 36)
        : clamp(24 + P * 0.16, 24, 46);
      drawArrow(ctx, ox, oy - pLen, ox, oy - 3, pal.cardinal, 3.2, 11);
      drawLabelPill(ctx, 'P = ' + P + ' kN/m', ox + 14, oy - pLen * 0.58, pal, {
        color: pal.cardinal,
        align: 'left',
        clampTo: { x: 0, y: 0, w: isStacked ? w : splitX, h: oy }
      });

      // Radial decay curve along theta = 0 (bottom on mobile, right on desktop)
      const pBox = isStacked
        ? { x: 10, y: splitY + 4, w: w - 20, h: h - splitY - 14 }
        : { x: splitX + 10, y: 12, w: w - splitX - 20, h: h - 24 };
      drawPlotFrame(ctx, pBox, pal, '|σᵣᵣ| ∝ 1/r vs. r (m)', '', '');
      const axL = pBox.x + 54;
      const axR = pBox.x + pBox.w - 18;
      const axT = pBox.y + 42;
      const axB = pBox.y + pBox.h - 32;

      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(axL, axT); ctx.lineTo(axL, axB); ctx.lineTo(axR, axB);
      ctx.stroke();

      // Numeric ticks along Depth r axis (0.14 .. 1.0 m) & vertical stress scale
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      [0.2, 0.6, 1.0].forEach(function (rv) {
        const tx = axL + ((rv - 0.14) / 0.86) * (axR - axL);
        ctx.beginPath();
        ctx.moveTo(tx, axB); ctx.lineTo(tx, axB + 4);
        ctx.stroke();
        ctx.fillText(rv.toFixed(1), tx, axB + 5);
      });
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('450', axL - 6, axT);
      ctx.fillText('0', axL - 6, axB);

      const maxSigPlot = 450;
      ctx.strokeStyle = pal.blue;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const rv = lerp(0.14, 1.0, i / 50);
        const sv = Math.min(maxSigPlot, (2 * P) / (Math.PI * rv));
        const px = axL + ((rv - 0.14) / 0.86) * (axR - axL);
        const py = axB - (sv / maxSigPlot) * (axB - axT);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const sigAtProbe = (2 * P) / (Math.PI * rProbe);
      const prX = axL + ((rProbe - 0.14) / 0.86) * (axR - axL);
      const prY = axB - (Math.min(maxSigPlot, sigAtProbe) / maxSigPlot) * (axB - axT);
      ctx.fillStyle = pal.amber;
      ctx.beginPath(); ctx.arc(prX, prY, 5.5, 0, Math.PI * 2); ctx.fill();

      setReadout('r1', 'Load P', P + ' kN/m');
      setReadout('r2', 'σ_rr(r, 0)', '−' + fmt(sigAtProbe, 1) + ' kPa');
      setReadout('r3', 'σ_θθ, τ_rθ', '0, 0');
      setReadout('r4', 'Airy φ(r,θ)', '−(P/π) rθ sinθ');
    }

    function drawContact(ctx, w, h, pal) {
      const isStacked = w < 540;
      const splitX = Math.floor(w * 0.65);
      const splitY = Math.floor(h * 0.51);
      const P = st.contactP; // kN/m
      const R = st.contactR; // m
      const Estar = 2.5e5;   // kPa effective modulus (0.25 GPa compliant contact)

      // Exact Hertz 2D relations: a = sqrt(4 P R / (pi E*)), p0 = 2 P / (pi a)
      const a = Math.sqrt((4 * P * R) / (Math.PI * Estar)) * 100; // cm
      const p0 = (2 * P) / (Math.PI * (a / 100)); // kPa
      const p0MPa = p0 * 0.001;
      const tauPeakMPa = 0.30028 * p0MPa;
      const zPeak = 0.78615 * a;

      const cBox = isStacked
        ? { x: 14, y: 66, w: w - 28, h: splitY - 72 }
        : { x: 14, y: 66, w: splitX - 28, h: h - 80 };
      const ox = cBox.x + cBox.w * 0.5;
      const oy = cBox.y;
      const pxPerUnit = Math.min(cBox.w * 0.145, cBox.h * 0.28);
      const aPx = clamp(a * pxPerUnit, 24, cBox.w * 0.38);

      // Exact McEwen (1949) / Johnson (1985) 2D subsurface max shear tau_max(x, z) heatmap
      const cols = 64;
      const rows = 30;
      const cw = cBox.w / cols;
      const ch = cBox.h / rows;
      const aPhys = aPx; // work in pixel-normalized x/a, z/a!

      for (let r = 0; r < rows; r++) {
        const z = (r + 0.5) * ch;
        for (let c = 0; c < cols; c++) {
          const x = (cBox.x + (c + 0.5) * cw) - ox;
          const B = aPhys * aPhys - x * x + z * z;
          const D = Math.hypot(B, 2 * x * z);
          const m = Math.sqrt(Math.max(0, 0.5 * (D + B)));
          const n = Math.sqrt(Math.max(0, 0.5 * (D - B)));
          const denom = m * m + n * n + 1e-6;
          const sxx = -(1 / aPhys) * (m * (1 + (z * z + n * n) / denom) - 2 * z);
          const szz = -(1 / aPhys) * m * (1 - (z * z + n * n) / denom);
          const txz = -(1 / aPhys) * n * ((m * m - z * z) / denom) * (x >= 0 ? 1 : -1);
          const tauNorm = Math.hypot(0.5 * (sxx - szz), txz); // in units of p0
          ctx.fillStyle = energyFill(clamp(tauNorm / 0.31, 0, 1), pal, 0.88);
          ctx.fillRect(cBox.x + c * cw, cBox.y + r * ch, cw + 0.7, ch + 0.7);
        }
      }

      // Free surface line & contact patch [-a, +a]
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(cBox.x, oy); ctx.lineTo(cBox.x + cBox.w, oy);
      ctx.stroke();

      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(ox - aPx, oy); ctx.lineTo(ox + aPx, oy);
      ctx.stroke();

      // Semi-elliptical Hertzian contact pressure p(x) = p0 sqrt(1 - (x/a)^2)
      const pHeight = isStacked
        ? clamp(12 + (p0MPa / 5.0) * 20, 12, 30)
        : clamp(14 + (p0MPa / 5.0) * 34, 14, 48);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ox - aPx, oy);
      for (let i = 0; i <= 48; i++) {
        const u = -1 + (2 * i) / 48;
        const px = ox + u * aPx;
        const py = oy - pHeight * Math.sqrt(Math.max(0, 1 - u * u));
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.cardinal, 0.25);
      ctx.fill();
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();

      // Curved indenter arc pressing down
      const rArc = clamp(120 + R * 160, 150, 300);
      ctx.save();
      ctx.beginPath();
      ctx.rect(cBox.x, 0, cBox.w, oy + 2);
      ctx.clip();
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(ox, oy - rArc + 2, rArc, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
      ctx.restore();

      // Highlight subsurface peak shear point z = 0.786 a
      const zPeakPx = oy + 0.78615 * aPx;
      if (zPeakPx < cBox.y + cBox.h - 10) {
        ctx.fillStyle = pal.white;
        ctx.beginPath(); ctx.arc(ox, zPeakPx, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        drawLabelPill(ctx, 'Max τ at z = 0.786a', ox, clamp(zPeakPx + 24, oy + 26, cBox.y + cBox.h - 16), pal, {
          color: pal.cardinal,
          clampTo: cBox
        });
      }

      drawLabelPill(ctx, 'Contact Patch [−a, +a]', ox, 18, pal, {
        color: pal.text,
        clampTo: { x: 0, y: 0, w: isStacked ? w : splitX, h: 42 }
      });

      // Centerline stress ratios vs z/a (bottom on mobile, right on desktop)
      const pBox = isStacked
        ? { x: 10, y: splitY + 4, w: w - 20, h: h - splitY - 14 }
        : { x: splitX + 10, y: 12, w: w - splitX - 20, h: h - 24 };
      drawPlotFrame(ctx, pBox, pal, 'Stress / p₀ vs. z/a', '', '');
      const axL = pBox.x + 48;
      const axR = pBox.x + pBox.w - 16;
      const axT = pBox.y + 42;
      const axB = pBox.y + pBox.h - 30;
      const zMaxRatio = 2.5;

      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(axL, axT); ctx.lineTo(axL, axB); ctx.lineTo(axR, axB);
      ctx.stroke();

      // Numeric ticks along Stress / p0 axis (0, 0.5, 1.0) & depth z/a (0, 2.5)
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      [0, 0.5, 1.0].forEach(function (tv) {
        const tx = axL + tv * (axR - axL);
        ctx.beginPath();
        ctx.moveTo(tx, axB); ctx.lineTo(tx, axB + 4);
        ctx.stroke();
        ctx.fillText(tv === 0 ? '0' : tv.toFixed(1), tx, axB + 5);
      });
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('0', axL - 6, axT);
      ctx.fillText('2.5', axL - 6, axB);

      function plotCenterline(fn, col, lw) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i <= 50; i++) {
          const z = (i / 50) * zMaxRatio;
          const val = clamp(fn(z), 0, 1.05);
          const px = axL + val * (axR - axL);
          const py = axT + (z / zMaxRatio) * (axB - axT);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // |sigma_zz|/p0, |sigma_xx|/p0, tau_max/p0
      plotCenterline(function (z) { return 1 / Math.sqrt(1 + z * z); }, pal.blue, 2.0);
      plotCenterline(function (z) { return (1 + 2 * z * z) / Math.sqrt(1 + z * z) - 2 * z; }, pal.teal, 2.0);
      plotCenterline(function (z) { return z - (z * z) / Math.sqrt(1 + z * z); }, pal.cardinal, 2.8);

      // Mark subsurface peak dot
      const pkX = axL + 0.30028 * (axR - axL);
      const pkY = axT + (0.78615 / zMaxRatio) * (axB - axT);
      ctx.fillStyle = pal.cardinal;
      ctx.beginPath(); ctx.arc(pkX, pkY, 5, 0, Math.PI * 2); ctx.fill();

      ctx.font = FONT_SANS_BOLD;
      ctx.fillStyle = pal.cardinal;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('τ max', pkX + 8, pkY);
      ctx.fillStyle = pal.blue;
      ctx.textAlign = 'right';
      ctx.fillText('|σzz|', axR - 4, axB - 14);

      setReadout('r1', 'Half-Width a', fmt(a, 2) + ' cm');
      setReadout('r2', 'Peak p₀', fmt(p0MPa, 2) + ' MPa');
      setReadout('r3', 'Peak τ_max', fmt(tauPeakMPa, 2) + ' MPa');
      setReadout('r4', 'Peak Depth z', fmt(zPeak, 2) + ' cm (0.786a)');
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 310, { breakpoint: 540, minH: 410 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();

      ctx.clearRect(0, 0, w, h);

      if (st.tab === 'beam') drawBeam(ctx, w, h, pal);
      else if (st.tab === 'fourier') drawFourier(ctx, w, h, pal);
      else if (st.tab === 'halfspace') drawHalfSpace(ctx, w, h, pal);
      else drawContact(ctx, w, h, pal);
    }

    applyTabConfig();
    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {}
    };
  });

  /* =========================================================================
   * LAB 11: 'polar-hole-wedge' (Slide 13: Kirsch Hole & Williams Wedge)
   * ========================================================================= */
  registerLab('polar-hole-wedge', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      cursor: 'crosshair',
      readouts: [
        { id: 'r1', label: 'Rim Peak', value: '3σ∞ (300 MPa)' },
        { id: 'r2', label: 'Probe', value: '1.00a, 90°' },
        { id: 'r3', label: 'σ_θθ', value: '+300.0 MPa' },
        { id: 'r4', label: 'σ_rr', value: '0.0 MPa' }
      ],
      sliders: [
        { id: 's1', label: 'Tension σ∞', min: 50, max: 200, step: 5, value: 100, format: function (v) { return v + ' MPa'; } },
        { id: 's2', label: 'Radius r/a', min: 1.00, max: 3.00, step: 0.05, value: 1.00, format: function (v) { return fmt(v, 2); } }
      ],
      caption: 'Move pointer across the plate to probe Kirsch stresses, or switch to Wedge to morph 2α toward a crack.'
    });

    const st = {
      mode: 'kirsch',
      sigInf: 100,
      probeR: 1.00,
      probeThetaDeg: 90,
      wedgeDeg: 270,
      dragging: false
    };

    function setReadout(id, k, v) {
      dom.readouts[id].key.innerHTML = formatMathHtml(k);
      dom.readouts[id].val.textContent = v;
    }

    function applyModeUI() {
      if (st.mode === 'kirsch') {
        dom.sliders.s1.labelEl.textContent = 'Tension σ∞';
        dom.sliders.s1.input.min = '50'; dom.sliders.s1.input.max = '200'; dom.sliders.s1.input.step = '5';
        dom.sliders.s1.input.value = String(st.sigInf);
        dom.sliders.s1.valEl.textContent = st.sigInf + ' MPa';

        dom.sliders.s2.wrap.style.display = '';
        dom.sliders.s2.labelEl.textContent = 'Radius r/a';
        dom.sliders.s2.input.min = '1.00'; dom.sliders.s2.input.max = '3.00'; dom.sliders.s2.input.step = '0.05';
        dom.sliders.s2.input.value = String(st.probeR);
        dom.sliders.s2.valEl.textContent = fmt(st.probeR, 2);
        dom.captionEl.innerHTML = formatMathHtml('Hover or drag on the plate to inspect Kirsch hoop stress σ_θθ(r, θ) around the hole.');
      } else {
        dom.sliders.s1.labelEl.textContent = 'Wedge 2α';
        dom.sliders.s1.input.min = '60'; dom.sliders.s1.input.max = '360'; dom.sliders.s1.input.step = '2';
        dom.sliders.s1.input.value = String(st.wedgeDeg);
        dom.sliders.s1.valEl.textContent = st.wedgeDeg + '°';

        dom.sliders.s2.wrap.style.display = 'none';
        dom.captionEl.innerHTML = formatMathHtml('Drag the wedge flank or slide Solid Wedge Angle 2α from 60° to 360° (slit crack r^(-1/2) singularity).');
      }
    }

    createPillGroup(dom.toolbar, [
      { id: 'kirsch', label: 'Kirsch Hole (Lec. 11)' },
      { id: 'wedge', label: 'Wedge / Notch (Lec. 12)' }
    ], 'kirsch', function (id) {
      st.mode = id;
      applyModeUI();
      render();
    });

    dom.sliders.s1.input.addEventListener('input', function () {
      const v = parseFloat(dom.sliders.s1.input.value);
      if (st.mode === 'kirsch') {
        st.sigInf = v;
        dom.sliders.s1.valEl.textContent = v + ' MPa';
      } else {
        st.wedgeDeg = v;
        dom.sliders.s1.valEl.textContent = v + '°';
      }
      render();
    });
    dom.sliders.s2.input.addEventListener('input', function () {
      st.probeR = parseFloat(dom.sliders.s2.input.value);
      dom.sliders.s2.valEl.textContent = fmt(st.probeR, 2);
      render();
    });

    // Exact Williams Mode I eigenvalue solver: sin(2*alpha*lam) + lam*sin(2*alpha) = 0
    function solveWilliamsLambda(twoAlphaDeg) {
      if (twoAlphaDeg >= 359.9) return 0.5;
      if (Math.abs(twoAlphaDeg - 180) < 0.2) return 1.0;
      const twoA = (twoAlphaDeg * Math.PI) / 180;
      if (twoAlphaDeg > 180) {
        // Unique real singular root in [0.5, 1.0] via exact bisection
        let lo = 0.5;
        let hi = 1.0;
        for (let iter = 0; iter < 36; iter++) {
          const mid = 0.5 * (lo + hi);
          const g = Math.sin(twoA * mid) + mid * Math.sin(twoA);
          if (g > 0) lo = mid; else hi = mid;
        }
        return 0.5 * (lo + hi);
      }
      // Convex wedge (< 180 deg): non-singular Re(lambda) > 1 (smooth exact Williams Mode I curve)
      // Tabulated exact Williams Re(lambda) for 2alpha in [60, 180] deg
      const table = [
        [60, 4.059], [90, 2.740], [120, 2.094], [150, 1.490], [180, 1.000]
      ];
      for (let i = 0; i < table.length - 1; i++) {
        if (twoAlphaDeg >= table[i][0] && twoAlphaDeg <= table[i + 1][0]) {
          const t = (twoAlphaDeg - table[i][0]) / (table[i + 1][0] - table[i][0]);
          return lerp(table[i][1], table[i + 1][1], t);
        }
      }
      return 1.0;
    }

    // Exact Kirsch stresses normalized by sigma_inf
    function kirschNorm(rOverA, thetaRad) {
      const a2 = 1 / (rOverA * rOverA);
      const a4 = a2 * a2;
      const c2 = Math.cos(2 * thetaRad);
      const s2 = Math.sin(2 * thetaRad);
      const srr = 0.5 * (1 - a2) + 0.5 * (1 - 4 * a2 + 3 * a4) * c2;
      const stt = 0.5 * (1 + a2) - 0.5 * (1 + 3 * a4) * c2;
      const srt = -0.5 * (1 + 2 * a2 - 3 * a4) * s2;
      return { srr: srr, stt: stt, srt: srt };
    }

    let geom = {
      cx: 140,
      cy: 140,
      aPx: 36,
      hitBox: { x0: 0, y0: 0, x1: 280, y1: 280 },
      plateBox: { x0: 30, y0: 30, x1: 250, y1: 250 },
      handleX: 140,
      handleY: 80
    };

    function isTouchInteractive(pos) {
      if (st.mode === 'kirsch') {
        const pb = geom.plateBox;
        return pos.x >= pb.x0 && pos.x <= pb.x1 && pos.y >= pb.y0 && pos.y <= pb.y1;
      }
      return Math.hypot(pos.x - geom.handleX, pos.y - geom.handleY) <= 44;
    }

    function handlePointer(ev, isClickOrDrag) {
      const p = getPointerPos(dom.canvas, ev);
      const hb = geom.hitBox;
      if (p.x < hb.x0 || p.x > hb.x1 || p.y < hb.y0 || p.y > hb.y1) return;
      const dx = p.x - geom.cx;
      const dy = geom.cy - p.y; // y-up
      const dist = Math.hypot(dx, dy);
      if (dist < 6) return;

      if (st.mode === 'kirsch') {
        const rRatio = clamp(dist / Math.max(12, geom.aPx), 1.0, 3.0);
        let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (deg < 0) deg += 360;
        st.probeR = Math.round(rRatio * 20) / 20;
        st.probeThetaDeg = Math.round(deg);
        dom.sliders.s2.input.value = String(st.probeR);
        dom.sliders.s2.valEl.textContent = fmt(st.probeR, 2);
        render();
      } else if (isClickOrDrag) {
        // Angle measured symmetrically from +x axis (material centered around +x, notch opening around -x)
        const angAbs = Math.abs(Math.atan2(dy, dx)) * (180 / Math.PI); // 0..180
        st.wedgeDeg = clamp(Math.round((angAbs * 2) / 2) * 2, 60, 360);
        dom.sliders.s1.input.value = String(st.wedgeDeg);
        dom.sliders.s1.valEl.textContent = st.wedgeDeg + '°';
        render();
      }
    }

    function onDown(ev) {
      const p = getPointerPos(dom.canvas, ev);
      if (ev.pointerType === 'touch' && !isTouchInteractive(p)) return;
      st.dragging = true;
      if (dom.canvas.setPointerCapture) {
        try { dom.canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      handlePointer(ev, true);
    }
    function onMove(ev) {
      if (ev.pointerType === 'touch' && !st.dragging) return;
      if (st.mode === 'kirsch' || st.dragging) {
        handlePointer(ev, st.dragging);
      }
    }
    function onUp() { st.dragging = false; }

    const detachTouchLock = attachSelectiveTouchLock(dom.canvas, isTouchInteractive);
    dom.canvas.addEventListener('pointerdown', onDown);
    dom.canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    function drawKirsch(ctx, w, h, pal) {
      const isStacked = w < 520;
      const splitX = Math.floor(w * 0.56);
      const splitY = Math.floor(h * 0.51);
      const cx = isStacked ? w * 0.50 : splitX * 0.50;
      const cy = isStacked ? splitY * 0.50 : h * 0.53;
      const aPx = isStacked
        ? clamp(Math.min(w * 0.105, splitY * 0.155), 22, 34)
        : clamp(Math.min(splitX * 0.145, h * 0.165), 24, 42);

      const plateW = isStacked
        ? Math.min(w - 56, aPx * 5.8)
        : Math.min(splitX - 36, aPx * 6.4);
      const plateH = isStacked
        ? Math.min(splitY - 24, aPx * 4.7)
        : Math.min(h - 46, aPx * 5.0);
      const px0 = cx - plateW * 0.5;
      const py0 = cy - plateH * 0.5;

      const panelBounds = isStacked
        ? { x: 0, y: 0, w: w, h: splitY }
        : { x: 0, y: 0, w: splitX, h: h };
      geom = {
        cx: cx,
        cy: cy,
        aPx: aPx,
        hitBox: isStacked ? { x0: 0, y0: 0, x1: w, y1: splitY } : { x0: 0, y0: 0, x1: splitX, y1: h },
        plateBox: { x0: px0, y0: py0, x1: px0 + plateW, y1: py0 + plateH },
        handleX: cx,
        handleY: cy
      };

      // 2D hoop stress heatmap outside the circular hole
      const cols = 54;
      const rows = 40;
      const cw = plateW / cols;
      const ch = plateH / rows;
      for (let r = 0; r < rows; r++) {
        const y = py0 + (r + 0.5) * ch;
        const dy = cy - y;
        for (let c = 0; c < cols; c++) {
          const x = px0 + (c + 0.5) * cw;
          const dx = x - cx;
          const dist = Math.hypot(dx, dy);
          if (dist < aPx) continue;
          const k = kirschNorm(dist / aPx, Math.atan2(dy, dx));
          ctx.fillStyle = stressFill(k.stt / 3.0, pal, 0.86);
          ctx.fillRect(px0 + c * cw, py0 + r * ch, cw + 0.7, ch + 0.7);
        }
      }

      // Plate border & hole cutout
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(px0, py0, plateW, plateH);

      ctx.fillStyle = pal.surface;
      ctx.beginPath(); ctx.arc(cx, cy, aPx, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Polar hoop stress petal curve around the hole rim r = a
      ctx.save();
      ctx.lineWidth = 2.6;
      for (let i = 0; i < 120; i++) {
        const th0 = (i / 120) * Math.PI * 2;
        const th1 = ((i + 1) / 120) * Math.PI * 2;
        const s0 = 1 - 2 * Math.cos(2 * th0); // -1 to +3
        const s1 = 1 - 2 * Math.cos(2 * th1);
        const r0 = aPx + s0 * aPx * 0.34;
        const r1 = aPx + s1 * aPx * 0.34;
        ctx.strokeStyle = (s0 + s1) >= 0 ? pal.cardinal : pal.blue;
        ctx.beginPath();
        ctx.moveTo(cx + r0 * Math.cos(th0), cy - r0 * Math.sin(th0));
        ctx.lineTo(cx + r1 * Math.cos(th1), cy - r1 * Math.sin(th1));
        ctx.stroke();
      }
      ctx.restore();

      // Remote tension arrows on left and right edges
      const arrL = isStacked ? 16 : 18;
      [-0.32, 0, 0.32].forEach(function (frac) {
        const ay = cy + frac * plateH;
        drawArrow(ctx, px0 + plateW + 2, ay, px0 + plateW + arrL, ay, pal.cardinal, 2.2, 8);
        drawArrow(ctx, px0 - 2, ay, px0 - arrL, ay, pal.cardinal, 2.2, 8);
      });

      // Probe marker
      const prRad = (st.probeThetaDeg * Math.PI) / 180;
      const prX = cx + st.probeR * aPx * Math.cos(prRad);
      const prY = cy - st.probeR * aPx * Math.sin(prRad);
      drawDashed(ctx, cx, cy, prX, prY, pal.amber, [4, 3], 1.6);
      ctx.fillStyle = pal.amber;
      ctx.beginPath(); ctx.arc(prX, prY, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pal.white;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rim annotations (>= 15px, placed clear of the hoop-stress petal curve and clamped cleanly)
      drawLabelPill(ctx, '3σ∞', cx, isStacked ? 16 : clamp(cy - aPx * 2.15 - 8, 18, cy - aPx - 16), pal, {
        color: pal.cardinal,
        clampTo: panelBounds
      });
      drawLabelPill(ctx, '−σ∞', clamp(cx + aPx + 30, cx + aPx + 24, panelBounds.w - 30), cy, pal, {
        color: pal.blue,
        clampTo: panelBounds
      });

      /* --- SUBPLOT (BOTTOM on mobile, RIGHT on desktop): Hoop Stress vs. Theta (0 to 180 deg) --- */
      const pBox = isStacked
        ? { x: 10, y: splitY + 4, w: w - 20, h: h - splitY - 14 }
        : { x: splitX + 12, y: 12, w: w - splitX - 24, h: h - 24 };
      drawPlotFrame(ctx, pBox, pal, 'Hoop Stress σθθ / σ∞', 'Angle θ (°)', '');
      const axL = pBox.x + 48;
      const axR = pBox.x + pBox.w - 18;
      const axT = pBox.y + 42;
      const axB = pBox.y + pBox.h - 32;

      function toP(deg, val) {
        return {
          x: axL + (deg / 180) * (axR - axL),
          y: axB - ((val - (-1.2)) / 4.4) * (axB - axT)
        };
      }

      // Zero line & grid
      const yZero = toP(0, 0).y;
      const yOne = toP(0, 1).y;
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(axL, yZero); ctx.lineTo(axR, yZero);
      ctx.moveTo(axL, axT); ctx.lineTo(axL, axB);
      ctx.stroke();
      drawDashed(ctx, axL, yOne, axR, yOne, pal.grid, [4, 4], 1.2);

      // Reference rim curve r = a (dashed)
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = pal.textMuted;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let d = 0; d <= 180; d += 3) {
        const pt = toP(d, 1 - 2 * Math.cos((2 * d * Math.PI) / 180));
        if (d === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Active radius curve r = probeR
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let d = 0; d <= 180; d += 3) {
        const k = kirschNorm(st.probeR, (d * Math.PI) / 180);
        const pt = toP(d, k.stt);
        if (d === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Probe dot folded to [0, 180]
      const foldDeg = st.probeThetaDeg > 180 ? 360 - st.probeThetaDeg : st.probeThetaDeg;
      const kProbe = kirschNorm(st.probeR, prRad);
      const dotP = toP(foldDeg, kProbe.stt);
      ctx.fillStyle = pal.amber;
      ctx.beginPath(); ctx.arc(dotP.x, dotP.y, 5.8, 0, Math.PI * 2); ctx.fill();

      // Axis ticks (>= 15px)
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      [-1, 0, 1, 3].forEach(function (v) {
        ctx.fillText(v < 0 ? '−' + Math.abs(v) : String(v), axL - 6, toP(0, v).y);
      });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      [0, 90, 180].forEach(function (d) {
        ctx.fillText(d + '°', toP(d, 0).x, axB + 5);
      });

      setReadout('r1', 'Rim Peak', '3σ∞ (' + fmt(3 * st.sigInf, 0) + ' MPa)');
      setReadout('r2', 'Probe', fmt(st.probeR, 2) + 'a, ' + Math.round(foldDeg) + '°');
      setReadout('r3', 'σ_θθ', fmtSigned(kProbe.stt * st.sigInf, 1) + ' MPa');
      setReadout('r4', 'σ_rr', fmtSigned(kProbe.srr * st.sigInf, 1) + ' MPa');
    }

    function drawWedge(ctx, w, h, pal) {
      const isStacked = w < 520;
      const splitX = Math.floor(w * 0.55);
      const splitY = Math.floor(h * 0.50);
      const cx = isStacked ? w * 0.50 : splitX * 0.50;
      const cy = isStacked ? splitY * 0.50 : h * 0.53;
      const R = isStacked
        ? clamp(Math.min(w * 0.24, splitY * 0.31), 48, 66)
        : clamp(Math.min(splitX * 0.38, h * 0.38), 64, 118);

      const twoAlpha = st.wedgeDeg;
      const halfRad = ((twoAlpha * 0.5) * Math.PI) / 180;
      const lam = solveWilliamsLambda(twoAlpha);
      const order = lam - 1;
      const isSingular = twoAlpha > 180.5;

      const hx = cx + R * Math.cos(halfRad);
      const hy = cy - R * Math.sin(halfRad);
      const panelBounds = isStacked
        ? { x: 0, y: 0, w: w, h: splitY }
        : { x: 0, y: 0, w: splitX, h: h };
      geom = {
        cx: cx,
        cy: cy,
        aPx: R * 0.35,
        hitBox: isStacked ? { x0: 0, y0: 0, x1: w, y1: splitY } : { x0: 0, y0: 0, x1: splitX, y1: h },
        plateBox: { x0: cx - R, y0: cy - R, x1: cx + R, y1: cy + R },
        handleX: hx,
        handleY: hy
      };

      // Draw solid elastic wedge sector spanning [-alpha, +alpha] around +x axis
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, -halfRad, halfRad, false);
      ctx.closePath();

      // Radial stress intensity gradient inside wedge
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, R);
      if (isSingular) {
        const sev = clamp(-order / 0.5, 0.15, 1.0);
        g.addColorStop(0, withAlpha(pal.cardinal, 0.45 + 0.48 * sev));
        g.addColorStop(0.32, withAlpha(pal.amber, 0.24 + 0.32 * sev));
        g.addColorStop(1, withAlpha(pal.blue, pal.theme === 'dark' ? 0.14 : 0.10));
      } else {
        g.addColorStop(0, withAlpha(pal.teal, 0.12));
        g.addColorStop(1, withAlpha(pal.teal, 0.24));
      }
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = isSingular ? pal.cardinal : pal.teal;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();

      // Highlight sharp slit crack line when 2alpha near 360
      if (twoAlpha >= 352) {
        ctx.strokeStyle = pal.bg;
        ctx.lineWidth = 3.6;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - R - 2, cy); ctx.stroke();
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - R - 2, cy); ctx.stroke();
      }

      // Draggable flank handle on top flank
      ctx.fillStyle = pal.amber;
      ctx.beginPath(); ctx.arc(hx, hy, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pal.white;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Solid angle arc indicator 2*alpha
      ctx.save();
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.34, -halfRad, halfRad, false);
      ctx.stroke();
      ctx.restore();

      drawLabelPill(ctx, 'Solid Wedge Angle 2α = ' + twoAlpha + '°', cx, isStacked ? 18 : 22, pal, {
        color: isSingular ? pal.cardinal : pal.teal,
        clampTo: panelBounds
      });
      drawLabelPill(ctx, isSingular ? 'σ ~ r^(' + fmt(order, 2) + ')' : 'Regular (No Singularity)', cx, isStacked ? splitY - 16 : h - 22, pal, {
        color: isSingular ? pal.cardinal : pal.teal,
        clampTo: panelBounds
      });

      /* --- SUBPLOT (BOTTOM on mobile, RIGHT on desktop): Exact Williams Singularity Curve (lam - 1 vs 2*alpha) --- */
      const pBox = isStacked
        ? { x: 10, y: splitY + 4, w: w - 20, h: h - splitY - 14 }
        : { x: splitX + 12, y: 12, w: w - splitX - 24, h: h - 24 };
      drawPlotFrame(ctx, pBox, pal, 'Singularity Order (λ − 1)', 'Solid Wedge Angle 2α (°)', '');
      const axL = pBox.x + 54;
      const axR = pBox.x + pBox.w - 18;
      const axT = pBox.y + 42;
      const axB = pBox.y + pBox.h - 32;

      function toP(deg, ordVal) {
        return {
          x: axL + ((deg - 60) / 300) * (axR - axL),
          y: axB - ((ordVal - (-0.6)) / 1.4) * (axB - axT)
        };
      }

      // Shaded singular zone (ord < 0)
      const y0 = toP(180, 0).y;
      ctx.fillStyle = withAlpha(pal.cardinal, pal.theme === 'dark' ? 0.12 : 0.08);
      ctx.fillRect(toP(180, 0).x, y0, axR - toP(180, 0).x, axB - y0);

      // Axes & zero line
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(axL, y0); ctx.lineTo(axR, y0);
      ctx.moveTo(axL, axT); ctx.lineTo(axL, axB);
      ctx.stroke();

      // -0.5 LEFM asymptote line
      const yHalf = toP(360, -0.5).y;
      drawDashed(ctx, axL, yHalf, axR, yHalf, pal.cardinal, [5, 4], 1.3);

      // Exact curve for 2alpha in [140, 360] (clamped at top of plot for convex wedges)
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      let started = false;
      for (let d = 140; d <= 360; d += 4) {
        const oVal = clamp(solveWilliamsLambda(d) - 1, -0.55, 0.78);
        const pt = toP(d, oVal);
        if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Live dot on Williams curve
      const curPt = toP(twoAlpha, clamp(order, -0.55, 0.78));
      ctx.fillStyle = withAlpha(pal.amber, 0.30);
      ctx.beginPath(); ctx.arc(curPt.x, curPt.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.amber;
      ctx.beginPath(); ctx.arc(curPt.x, curPt.y, 5.2, 0, Math.PI * 2); ctx.fill();

      // Ticks (>= 15px)
      ctx.font = FONT_MONO;
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('0.0', axL - 6, y0);
      ctx.fillText('−0.5', axL - 6, yHalf);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      [60, 180, 270, 360].forEach(function (d) {
        ctx.fillText(d + '°', toP(d, 0).x, axB + 5);
      });

      const regime = twoAlpha >= 356
        ? 'LEFM Crack'
        : twoAlpha > 180.5
          ? 'Singular Notch'
          : twoAlpha > 179.5
            ? 'Half-Space'
            : 'Regular';

      setReadout('r1', 'Wedge 2α', twoAlpha + '°');
      setReadout('r2', 'λ', fmt(lam, 3));
      setReadout('r3', 'Order', isSingular ? 'r^(' + fmt(order, 2) + ')' : 'Finite');
      setReadout('r4', 'Regime', regime);
    }

    function render() {
      const fit = fitCanvas(dom.canvas, 285, { breakpoint: 520, minH: 430 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      ctx.clearRect(0, 0, w, h);
      if (st.mode === 'kirsch') drawKirsch(ctx, w, h, pal);
      else drawWedge(ctx, w, h, pal);
    }

    applyModeUI();
    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {
        detachTouchLock();
        dom.canvas.removeEventListener('pointerdown', onDown);
        dom.canvas.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
    };
  });

  /* =========================================================================
   * LAB 12: 'kelvin-image' (Slide 14: Kelvin Green's Function & Half-Space Image)
   * ========================================================================= */
  registerLab('kelvin-image', function (mountEl, api) {
    const dom = createLabDom(mountEl, {
      hasToolbar: true,
      cursor: 'grab',
      readouts: [
        { id: 'mode', label: 'Domain', value: 'Half-Space' },
        { id: 'depth', label: 'Depth d', value: '0.70 L' },
        { id: 'surf', label: 'Surf |u|', value: '1/r Kelvin' },
        { id: 'bc', label: 'Free BC', value: 'σᵧᵧ = τₓᵧ = 0' }
      ],
      sliders: [
        { id: 'depth', label: 'Depth d', min: 0.25, max: 1.50, step: 0.05, value: 0.70, format: function (v) { return fmt(v, 2) + ' L'; } },
        { id: 'angle', label: 'Angle φ', min: -90, max: 90, step: 5, value: 0, format: function (v) { return fmtSigned(v, 0) + '°'; } },
        { id: 'nu', label: 'Poisson ν', min: 0.00, max: 0.48, step: 0.02, value: 0.30, format: function (v) { return fmt(v, 2); } }
      ],
      caption: 'Drag point force P vertically to change depth d, or switch between Infinite Kelvin and Half-Space Image.'
    });

    const st = {
      mode: 'image',
      depth: 0.70,
      angleDeg: 0, // 0 deg = downward vertical force (+y into solid)
      nu: 0.30,
      dragging: false
    };

    createPillGroup(dom.toolbar, [
      { id: 'kelvin', label: 'Kelvin (Infinite Space)' },
      { id: 'image', label: 'Half-Space Image (Mindlin)' }
    ], 'image', function (id) {
      st.mode = id;
      render();
    });

    ['depth', 'angle', 'nu'].forEach(function (k) {
      dom.sliders[k].input.addEventListener('input', function () {
        const val = parseFloat(dom.sliders[k].input.value);
        if (k === 'angle') st.angleDeg = val;
        else st[k] = val;
        dom.sliders[k].valEl.textContent = dom.sliders[k].spec.format(val);
        render();
      });
    });

    // Exact 3D Kelvin Green's function displacement on slice z = 0 (y downward)
    function kelvinDisp(dx, dy, Px, Py, nu) {
      const r2 = dx * dx + dy * dy + 0.022;
      const r = Math.sqrt(r2);
      const pref = 1 / (4 * Math.PI * (1 - nu) * r);
      const k = 3 - 4 * nu;
      const dot = (dx * Px + dy * Py) / r2;
      return {
        ux: pref * (k * Px + dx * dot),
        uy: pref * (k * Py + dy * dot)
      };
    }

    // Exact Mindlin (1936) half-space displacement for source at (0, d) with free surface y = 0 (y >= 0 downward)
    function mindlinDisp(x, y, d, Px, Py, nu) {
      const r1Sq = x * x + (y - d) * (y - d) + 0.022;
      const r2Sq = x * x + (y + d) * (y + d) + 0.022;
      const R1 = Math.sqrt(r1Sq);
      const R2 = Math.sqrt(r2Sq);
      const R1_3 = R1 * r1Sq;
      const R2_3 = R2 * r2Sq;
      const R2_5 = R2_3 * r2Sq;
      const c = 1 / (4 * Math.PI * (1 - nu));
      const k = 3 - 4 * nu;
      const R2yd = R2 + y + d + 1e-4;

      // Vertical load Py contribution
      const ux_y = Py * c * x * (
        (y - d) / R1_3 +
        (k * (y - d)) / R2_3 -
        (4 * (1 - nu) * (1 - 2 * nu)) / (R2 * R2yd) +
        (6 * d * y * (y + d)) / R2_5
      );
      const uy_y = Py * c * (
        k / R1 +
        (8 * (1 - nu) * (1 - nu) - k) / R2 +
        ((y - d) * (y - d)) / R1_3 +
        (k * (y + d) * (y + d) - 2 * d * y) / R2_3 +
        (6 * d * y * (y + d) * (y + d)) / R2_5
      );

      // Horizontal load Px contribution
      const ux_x = Px * c * (
        k / R1 +
        1 / R2 +
        (x * x) / R1_3 +
        (k * x * x) / R2_3 +
        (2 * d * y / R2_3) * (1 - (3 * x * x) / r2Sq) +
        (4 * (1 - nu) * (1 - 2 * nu) / R2yd) * (1 - (x * x) / (R2 * R2yd))
      );
      const uy_x = Px * c * x * (
        (y - d) / R1_3 +
        (k * (y - d)) / R2_3 -
        (6 * d * y * (y + d)) / R2_5 +
        (4 * (1 - nu) * (1 - 2 * nu)) / (R2 * R2yd)
      );

      return { ux: ux_y + ux_x, uy: uy_y + uy_x };
    }

    let layout = { ox: 200, surfY: 90, scale: 95, realY: 160 };

    function isTouchOnForce(pos) {
      if (st.mode !== 'image') return false;
      return Math.hypot(pos.x - layout.ox, pos.y - layout.realY) <= 44;
    }

    function updateDepthFromPointer(ev) {
      const p = getPointerPos(dom.canvas, ev);
      const newD = clamp((p.y - layout.surfY) / Math.max(20, layout.scale), 0.25, 1.50);
      st.depth = Math.round(newD * 20) / 20;
      dom.sliders.depth.input.value = String(st.depth);
      dom.sliders.depth.valEl.textContent = fmt(st.depth, 2) + ' L';
      render();
    }

    function onDown(ev) {
      if (st.mode !== 'image') return;
      const p = getPointerPos(dom.canvas, ev);
      if (ev.pointerType === 'touch' && !isTouchOnForce(p)) return;
      st.dragging = true;
      dom.stage.style.cursor = 'grabbing';
      if (dom.canvas.setPointerCapture) {
        try { dom.canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      updateDepthFromPointer(ev);
    }
    function onMove(ev) {
      if (st.dragging && st.mode === 'image') updateDepthFromPointer(ev);
    }
    function onUp() {
      st.dragging = false;
      dom.stage.style.cursor = 'grab';
    }

    const detachTouchLock = attachSelectiveTouchLock(dom.canvas, isTouchOnForce);
    dom.canvas.addEventListener('pointerdown', onDown);
    dom.canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    function render() {
      const fit = fitCanvas(dom.canvas, 290, { breakpoint: 480, minH: 310 });
      if (!fit) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = api.getPalette();
      const isNarrow = w < 480;

      ctx.clearRect(0, 0, w, h);

      const phi = (st.angleDeg * Math.PI) / 180;
      const Px = Math.sin(phi);
      const Py = Math.cos(phi); // 0 deg -> +y downward into solid
      const isImage = st.mode === 'image';

      const ox = w * 0.50;
      const surfY = isImage ? Math.round(h * (isNarrow ? 0.30 : 0.27)) : Math.round(h * 0.50);
      const scale = isImage ? Math.min(w * 0.25, (h - surfY) * 0.52) : Math.min(w * 0.24, h * 0.34);
      const realY = surfY + st.depth * scale;
      layout = { ox: ox, surfY: surfY, scale: scale, realY: realY };

      // 1. Displacement magnitude contour heatmap
      const yStart = isImage ? surfY : 8;
      const yEnd = h - 8;
      const xStart = 10;
      const xEnd = w - 10;
      const cols = 64;
      const rows = 36;
      const cw = (xEnd - xStart) / cols;
      const ch = (yEnd - yStart) / rows;

      for (let r = 0; r < rows; r++) {
        const py = yStart + (r + 0.5) * ch;
        const ym = (py - surfY) / scale;
        for (let c = 0; c < cols; c++) {
          const px = xStart + (c + 0.5) * cw;
          const xm = (px - ox) / scale;
          const u = isImage
            ? mindlinDisp(xm, ym, st.depth, Px, Py, st.nu)
            : kelvinDisp(xm, ym, Px, Py, st.nu);
          const mag = Math.hypot(u.ux, u.uy);
          const norm = clamp(Math.log(1 + mag * 3.8) / 1.9, 0, 1);
          ctx.fillStyle = energyFill(norm, pal, pal.theme === 'dark' ? 0.58 : 0.44);
          ctx.fillRect(xStart + c * cw, yStart + r * ch, cw + 0.7, ch + 0.7);
        }
      }

      // 2. Vector field arrows u(x)
      const vCols = isNarrow ? 9 : 13;
      const vRows = isImage ? 6 : 8;
      for (let r = 0; r < vRows; r++) {
        const py = lerp(yStart + 18, yEnd - 16, r / Math.max(1, vRows - 1));
        const ym = (py - surfY) / scale;
        for (let c = 0; c < vCols; c++) {
          const px = lerp(xStart + 22, xEnd - 22, c / Math.max(1, vCols - 1));
          const xm = (px - ox) / scale;
          const srcY = isImage ? st.depth : 0;
          if (Math.hypot(xm, ym - srcY) < 0.24) continue;
          const u = isImage
            ? mindlinDisp(xm, ym, st.depth, Px, Py, st.nu)
            : kelvinDisp(xm, ym, Px, Py, st.nu);
          const mag = Math.hypot(u.ux, u.uy);
          if (mag < 1e-4) continue;
          const len = clamp(mag * 42, 7, isNarrow ? 20 : 24);
          const uxN = (u.ux / mag) * len;
          const uyN = (u.uy / mag) * len;
          drawArrow(ctx, px - uxN * 0.45, py - uyN * 0.45, px + uxN * 0.55, py + uyN * 0.55, withAlpha(pal.text, 0.78), 1.6, 6.5);
        }
      }

      // 3. Mode-specific geometry (Mirror image + Free surface vs. Infinite Space)
      let maxSurfU = 0;
      const bounds = { x: 0, y: 0, w: w, h: h };
      if (isImage) {
        // Mirror domain backdrop (y < 0)
        ctx.fillStyle = withAlpha(pal.surface2, pal.theme === 'dark' ? 0.45 : 0.65);
        ctx.fillRect(xStart, 6, xEnd - xStart, surfY - 6);

        // Reference flat surface y = 0 (dashed)
        drawDashed(ctx, xStart, surfY, xEnd, surfY, pal.textMuted, [6, 5], 1.5);

        // Deformed free surface profile u_y(x, 0) (exact Mindlin!)
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        for (let i = 0; i <= 90; i++) {
          const px = lerp(xStart, xEnd, i / 90);
          const xm = (px - ox) / scale;
          const uSurf = mindlinDisp(xm, 0, st.depth, Px, Py, st.nu);
          const magS = Math.hypot(uSurf.ux, uSurf.uy);
          if (magS > maxSurfU) maxSurfU = magS;
          const py = surfY + clamp(uSurf.uy * 26, -24, 34);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Mirror axis connecting image (-d) and real source (+d)
        const imgY = Math.max(22, surfY - st.depth * scale);
        drawDashed(ctx, ox, imgY, ox, realY, pal.amber, [5, 4], 1.8);

        // Mirror image force at y = -d
        ctx.save();
        ctx.fillStyle = withAlpha(pal.teal, 0.22);
        ctx.beginPath(); ctx.arc(ox, imgY, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.0;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        drawArrow(ctx, ox, imgY, ox + Px * 28, imgY + Py * 28, pal.teal, 2.4, 9);
        ctx.restore();

        const topZone = { x: 0, y: 0, w: w, h: surfY };
        drawLabelPill(ctx, 'y = 0 (t = 0)', xStart + 4, surfY - 16, pal, {
          color: pal.text,
          align: 'left',
          clampTo: topZone
        });
        drawLabelPill(
          ctx,
          isNarrow ? 'Image (−d)' : 'Image Source (−d)',
          w - 10,
          clamp(imgY, 18, isNarrow ? Math.max(18, surfY - 42) : surfY - 18),
          pal,
          { color: pal.teal, align: 'right', clampTo: topZone }
        );

        // Draggable Real Point Force P at y = +d
        ctx.fillStyle = withAlpha(pal.cardinal, 0.28);
        ctx.beginPath(); ctx.arc(ox, realY, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pal.cardinal;
        ctx.beginPath(); ctx.arc(ox, realY, 6.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = pal.white;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        drawArrow(ctx, ox, realY, ox + Px * 36, realY + Py * 36, pal.cardinal, 3.2, 11);

        // Place P pill on the side opposite the load arrow so it never collides with the vector
        const pOnLeft = Px > 0.15;
        const pZone = { x: 0, y: surfY + 6, w: w, h: h - surfY - 6 };
        drawLabelPill(
          ctx,
          isNarrow ? 'P (+d, drag)' : 'P at +d (drag)',
          pOnLeft ? ox - 24 : ox + 24,
          clamp(realY, surfY + 24, h - 20),
          pal,
          {
            color: pal.cardinal,
            align: pOnLeft ? 'right' : 'left',
            clampTo: pZone
          }
        );
      } else {
        // Infinite Kelvin Space: radial rings + central point force P
        [0.45, 0.90, 1.35].forEach(function (rr) {
          ctx.save();
          ctx.setLineDash([4, 5]);
          ctx.strokeStyle = withAlpha(pal.teal, 0.48);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(ox, surfY, rr * scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });

        ctx.fillStyle = withAlpha(pal.cardinal, 0.28);
        ctx.beginPath(); ctx.arc(ox, surfY, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pal.cardinal;
        ctx.beginPath(); ctx.arc(ox, surfY, 6.4, 0, Math.PI * 2); ctx.fill();
        drawArrow(ctx, ox, surfY, ox + Px * 42, surfY + Py * 42, pal.cardinal, 3.2, 11);
        drawLabelPill(ctx, 'Kelvin Point Force P: u ~ 1/r', ox, 20, pal, {
          color: pal.cardinal,
          clampTo: bounds
        });
      }

      // Update readouts
      dom.readouts.mode.val.textContent = isImage ? 'Half-Space' : 'Infinite';
      dom.readouts.depth.val.textContent = isImage ? fmt(st.depth, 2) + ' L' : '(0, 0)';
      dom.readouts.surf.val.textContent = isImage ? fmt(maxSurfU, 2) + ' P/μL' : 'Gᵢⱼ Pⱼ';
      dom.readouts.bc.val.textContent = isImage ? 'σᵧᵧ = τₓᵧ = 0' : '1/r decay';
    }

    render();

    return {
      onResize: render,
      onThemeChange: render,
      onSlideEnter: render,
      destroy: function () {
        detachTouchLock();
        dom.canvas.removeEventListener('pointerdown', onDown);
        dom.canvas.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
    };
  });
})();
