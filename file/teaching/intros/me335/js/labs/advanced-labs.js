(function () {
  'use strict';

  const ME335 = (window.ME335 = window.ME335 || {});
  const registerLab = function (id, fn) {
    if (typeof ME335.registerLab === 'function') ME335.registerLab(id, fn);
    else {
      ME335.labs = ME335.labs || {};
      ME335.labs[id] = fn;
    }
  };

  /* ==========================================================================
   * Shared High-DPI Canvas, Math, Linear Algebra, DOM, and Drawing Utilities
   * ========================================================================== */

  const FONT_SANS = '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  const FONT_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace';

  const FALLBACK_PALETTE = {
    theme: 'dark',
    bg: '#141413',
    surface: '#1A1A18',
    surface2: '#232320',
    grid: 'rgba(236, 232, 224, 0.05)',
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
  };

  function getPal(api) {
    const p = api && typeof api.getPalette === 'function' ? api.getPalette() : null;
    return p ? Object.assign({}, FALLBACK_PALETTE, p) : FALLBACK_PALETTE;
  }

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

  function parseHexRgb(color) {
    if (!color || typeof color !== 'string') return [128, 128, 128];
    if (color.charAt(0) === '#') {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      const n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
    return [128, 128, 128];
  }

  function withAlpha(color, alpha) {
    const a = clamp(alpha, 0, 1);
    const rgb = parseHexRgb(color);
    return 'rgba(' + Math.round(rgb[0]) + ',' + Math.round(rgb[1]) + ',' + Math.round(rgb[2]) + ',' + a.toFixed(3) + ')';
  }

  function mixRgb(c1, c2, t, alpha) {
    const a = parseHexRgb(c1);
    const b = parseHexRgb(c2);
    const f = clamp(t, 0, 1);
    const r = Math.round(lerp(a[0], b[0], f));
    const g = Math.round(lerp(a[1], b[1], f));
    const bl = Math.round(lerp(a[2], b[2], f));
    if (alpha !== undefined) {
      return 'rgba(' + r + ',' + g + ',' + bl + ',' + clamp(alpha, 0, 1).toFixed(3) + ')';
    }
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function thermalColor(t, pal, alpha) {
    const u = clamp(t, 0, 1);
    const stops = [pal.blue, pal.teal, pal.amber, pal.cardinal];
    const scaled = u * (stops.length - 1);
    const idx = Math.min(stops.length - 2, Math.floor(scaled));
    const frac = scaled - idx;
    return mixRgb(stops[idx], stops[idx + 1], frac, alpha);
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
        for (let j = 0; j < loops.length; j++) loops[j]();
        loops.length = 0;
        for (let k = 0; k < observers.length; k++) observers[k].disconnect();
        observers.length = 0;
      }
    };
  }

  function getStageWidth(stage, canvas) {
    const target = stage || (canvas && canvas.parentElement) || canvas;
    if (!target) return 0;
    let w = Math.floor(target.getBoundingClientRect().width);
    if (w < 10 && target.parentElement) {
      w = Math.floor(target.parentElement.getBoundingClientRect().width);
    }
    return w;
  }

  function syncStageHeight(stage, narrowH, applyNarrow) {
    if (!stage) return false;
    const want = applyNarrow && narrowH > 0 ? Math.round(narrowH) + 'px' : '';
    const wantFlex = applyNarrow && narrowH > 0 ? '0 0 auto' : '';
    if (stage.style.minHeight !== want || stage.style.height !== want || stage.style.flex !== wantFlex) {
      stage.style.minHeight = want;
      stage.style.height = want;
      stage.style.flex = wantFlex;
      return true;
    }
    return false;
  }

  function parseMathTokens(str) {
    const s = String(str);
    const out = [];
    let i = 0;
    let buf = '';
    function flush() {
      if (buf) {
        out.push({ kind: 'text', t: buf });
        buf = '';
      }
    }
    while (i < s.length) {
      const ch = s.charAt(i);
      if ((ch === '_' || ch === '^') && i + 1 < s.length) {
        const kind = ch === '_' ? 'sub' : 'sup';
        if (s.charAt(i + 1) === '{') {
          const close = s.indexOf('}', i + 2);
          if (close > i + 2) {
            flush();
            out.push({ kind: kind, t: s.slice(i + 2, close) });
            i = close + 1;
            continue;
          }
        } else {
          const rest = s.slice(i + 1);
          const m = rest.match(/^[A-Za-z0-9α-ωΑ-Ω∞*]+/);
          if (m) {
            flush();
            out.push({ kind: kind, t: m[0] });
            i += 1 + m[0].length;
            continue;
          }
        }
      }
      buf += ch;
      i++;
    }
    flush();
    return out;
  }

  function drawMathRun(ctx, str, x, y, opts) {
    const o = opts || {};
    const tokens = parseMathTokens(str);
    const hasScript = tokens.some(function (tk) { return tk.kind !== 'text'; });
    const basePx = Math.max(hasScript ? 16 : 15, Math.round(o.px || 15));
    const scriptPx = 15; // Strict >= 15px Canvas font floor
    const mono = Boolean(o.mono);
    const weight = o.weight || 500;
    const align = o.align || 'left';
    const baseline = o.baseline || 'middle';
    const color = o.color || ctx.fillStyle;

    ctx.save();
    const widths = [];
    let totalW = 0;
    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i];
      setFont(ctx, tk.kind === 'text' ? basePx : scriptPx, mono, weight);
      const tw = ctx.measureText(tk.t).width;
      widths.push(tw);
      totalW += tw;
    }

    let cx = x;
    if (align === 'center') cx = x - totalW * 0.5;
    else if (align === 'right') cx = x - totalW;

    let midY = y;
    if (baseline === 'top') midY = y + basePx * 0.56;
    else if (baseline === 'bottom') midY = y - basePx * 0.52;

    if (o.bg) {
      const padX = o.padX !== undefined ? o.padX : 6;
      const padY = o.padY !== undefined ? o.padY : 4;
      const boxH = basePx + padY * 2 + (hasScript ? 3 : 0);
      roundRectPath(ctx, cx - padX, midY - boxH * 0.5, totalW + padX * 2, boxH, o.radius || 2);
      ctx.fillStyle = o.bg;
      ctx.fill();
      if (o.border) {
        ctx.strokeStyle = o.border;
        ctx.lineWidth = o.borderWidth || 1.2;
        ctx.stroke();
      }
    }

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i];
      const isBase = tk.kind === 'text';
      setFont(ctx, isBase ? basePx : scriptPx, mono, weight);
      const dy = tk.kind === 'sub' ? 4.2 : (tk.kind === 'sup' ? -4.8 : 0);
      ctx.fillText(tk.t, cx, midY + dy);
      cx += widths[i];
    }
    ctx.restore();
    return totalW;
  }

  function bindHandleTouch(bag, stage, canvas, handlers) {
    if (stage) stage.style.touchAction = 'pan-y';
    if (canvas) canvas.style.touchAction = 'pan-y';

    let mouseDragging = false;
    let touchState = { mode: 'idle', startX: 0, startY: 0, moved: false };

    bag.on(canvas, 'pointerdown', function (ev) {
      if (ev.pointerType === 'touch') return;
      const pt = getPointerPos(canvas, ev);
      if (handlers.isNearHandle && !handlers.isNearHandle(pt)) {
        if (handlers.onTap) handlers.onTap(pt);
        return;
      }
      mouseDragging = true;
      canvas.style.cursor = 'grabbing';
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      handlers.onStart(pt);
    });

    bag.on(canvas, 'pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      const pt = getPointerPos(canvas, ev);
      if (mouseDragging) {
        handlers.onMove(pt);
      } else if (handlers.onHover) {
        handlers.onHover(pt);
      }
    });

    function endMouse(ev) {
      if (ev.pointerType === 'touch' || !mouseDragging) return;
      mouseDragging = false;
      canvas.style.cursor = 'grab';
      try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
      if (handlers.onEnd) handlers.onEnd();
    }

    bag.on(canvas, 'pointerup', endMouse);
    bag.on(canvas, 'pointercancel', endMouse);

    bag.on(canvas, 'touchstart', function (ev) {
      if (ev.touches.length !== 1) return;
      const t = ev.touches[0];
      const pt = getPointerPos(canvas, t);
      if (handlers.isNearHandle && handlers.isNearHandle(pt)) {
        touchState = { mode: 'drag', startX: t.clientX, startY: t.clientY, moved: false };
        ev.preventDefault();
        handlers.onStart(pt);
      } else {
        touchState = { mode: 'tap-or-scroll', startX: t.clientX, startY: t.clientY, moved: false };
      }
    }, { passive: false });

    bag.on(canvas, 'touchmove', function (ev) {
      if (ev.touches.length !== 1) return;
      const t = ev.touches[0];
      if (touchState.mode === 'drag') {
        ev.preventDefault();
        handlers.onMove(getPointerPos(canvas, t));
      } else if (touchState.mode === 'tap-or-scroll') {
        if (Math.hypot(t.clientX - touchState.startX, t.clientY - touchState.startY) > 10) {
          touchState.moved = true;
        }
      }
    }, { passive: false });

    bag.on(canvas, 'touchend', function (ev) {
      if (touchState.mode === 'drag') {
        if (handlers.onEnd) handlers.onEnd();
      } else if (touchState.mode === 'tap-or-scroll' && !touchState.moved && ev.changedTouches.length === 1) {
        const pt = getPointerPos(canvas, ev.changedTouches[0]);
        if (handlers.onTap) handlers.onTap(pt);
      }
      touchState.mode = 'idle';
    }, { passive: true });

    bag.on(canvas, 'touchcancel', function () {
      if (touchState.mode === 'drag' && handlers.onEnd) handlers.onEnd();
      touchState.mode = 'idle';
    }, { passive: true });
  }

  function formatMathHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/_{([^}]+)}/g, '<sub>$1</sub>')
      .replace(/\^{([^}]+)}/g, '<sup>$1</sup>')
      .replace(/_([A-Za-z0-9α-ωΑ-Ω∞]+)/g, '<sub>$1</sub>')
      .replace(/\^([A-Za-z0-9α-ωΑ-Ω*+\-−∞]+)/g, '<sup>$1</sup>');
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) {
      if (cls && cls.indexOf('lab-badge-status') !== -1) {
        node.innerHTML = '<span>' + formatMathHtml(text) + '</span>';
      } else if (cls && (cls.indexOf('lab-caption') !== -1 || cls.indexOf('lab-pill') !== -1)) {
        node.innerHTML = formatMathHtml(text);
      } else {
        node.textContent = text;
      }
    }
    return node;
  }

  function setMathText(node, text) {
    if (node) node.innerHTML = formatMathHtml(text);
  }

  function createReadoutChip(keyText, valText, mathVal) {
    const chip = el('div', 'lab-readout-chip');
    const k = el('span', 'lab-readout-key');
    k.innerHTML = formatMathHtml(keyText);
    const v = el('span', 'lab-readout-val');
    if (mathVal) v.innerHTML = formatMathHtml(valText);
    else v.textContent = valText;
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
    badgeEl.innerHTML = '<span>' + formatMathHtml(text) + '</span>';
    badgeEl.classList.remove('is-safe', 'is-warn', 'is-danger');
    if (level === 'safe') badgeEl.classList.add('is-safe');
    else if (level === 'warn') badgeEl.classList.add('is-warn');
    else if (level === 'danger') badgeEl.classList.add('is-danger');
  }

  /* Dense Gaussian elimination with partial pivoting (does not mutate inputs) */
  function solveDense(A, b) {
    const n = b.length;
    const M = new Array(n);
    const rhs = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      M[i] = new Float64Array(n);
      for (let j = 0; j < n; j++) M[i][j] = A[i][j];
      rhs[i] = b[i];
    }
    for (let k = 0; k < n; k++) {
      let piv = k;
      let maxAbs = Math.abs(M[k][k]);
      for (let i = k + 1; i < n; i++) {
        const v = Math.abs(M[i][k]);
        if (v > maxAbs) {
          maxAbs = v;
          piv = i;
        }
      }
      if (maxAbs < 1e-15) continue;
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
        const fac = M[i][k] / diag;
        if (fac === 0) continue;
        M[i][k] = 0;
        for (let j = k + 1; j < n; j++) {
          M[i][j] -= fac * M[k][j];
        }
        rhs[i] -= fac * rhs[k];
      }
    }
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let sum = rhs[i];
      for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
      const d = M[i][i];
      x[i] = Math.abs(d) > 1e-15 ? sum / d : 0;
    }
    return x;
  }

  /* Exact 1D Gauss-Legendre rules on [-1, 1] */
  const GAUSS_1D = {
    1: {
      pts: [0],
      wts: [2]
    },
    2: {
      pts: [-1 / Math.sqrt(3), 1 / Math.sqrt(3)],
      wts: [1, 1]
    },
    3: {
      pts: [-Math.sqrt(3 / 5), 0, Math.sqrt(3 / 5)],
      wts: [5 / 9, 8 / 9, 5 / 9]
    },
    4: {
      pts: [
        -Math.sqrt(3 / 7 + (2 / 7) * Math.sqrt(6 / 5)),
        -Math.sqrt(3 / 7 - (2 / 7) * Math.sqrt(6 / 5)),
        Math.sqrt(3 / 7 - (2 / 7) * Math.sqrt(6 / 5)),
        Math.sqrt(3 / 7 + (2 / 7) * Math.sqrt(6 / 5))
      ],
      wts: [
        (18 - Math.sqrt(30)) / 36,
        (18 + Math.sqrt(30)) / 36,
        (18 + Math.sqrt(30)) / 36,
        (18 - Math.sqrt(30)) / 36
      ]
    },
    6: {
      pts: [
        -0.9324695142031521,
        -0.6612093864662645,
        -0.2386191860831969,
        0.2386191860831969,
        0.6612093864662645,
        0.9324695142031521
      ],
      wts: [
        0.1713244923791704,
        0.3607615730481386,
        0.4679139345726910,
        0.4679139345726910,
        0.3607615730481386,
        0.1713244923791704
      ]
    }
  };

  /* ==========================================================================
   * LAB 1: isoparametric-gallery (Slide 11, widescreen lab-wide)
   * ========================================================================== */

  registerLab('isoparametric-gallery', function (mountEl, api) {
    const bag = createBag();

    const PRESETS = {
      q4: {
        label: 'Q4 Bilinear Quad',
        gaussLabel: '2x2 Gauss',
        refNodes: [[-1, -1], [1, -1], [1, 1], [-1, 1]],
        defPhys: [[-0.86, -0.78], [0.94, -0.52], [0.64, 0.90], [-0.74, 0.72]]
      },
      p1: {
        label: 'P1 Triangle',
        gaussLabel: '1-pt Centroid',
        refNodes: [[0, 0], [1, 0], [0, 1]],
        defPhys: [[-0.82, -0.72], [0.94, -0.46], [-0.14, 0.88]]
      },
      p2: {
        label: 'P2 Quad Triangle',
        gaussLabel: '3-pt Tri Gauss',
        refNodes: [[0, 0], [1, 0], [0, 1], [0.5, 0], [0.5, 0.5], [0, 0.5]],
        defPhys: [[-0.84, -0.72], [0.90, -0.58], [-0.26, 0.86], [0.06, -0.76], [0.50, 0.30], [-0.62, 0.14]]
      },
      bar1d: {
        label: '1D P2 Bar',
        gaussLabel: '2-pt 1D Gauss',
        refNodes: [[-1, 0], [0, 0], [1, 0]],
        defPhys: [[-0.88, 0], [0.18, 0], [0.90, 0]]
      }
    };

    let elemType = 'q4';
    let physNodes = PRESETS.q4.defPhys.map(function (p) { return [p[0], p[1]]; });
    let dragIdx = -1;
    let physScreenPts = [];
    let physBox = { x: 0, y: 0, w: 1, h: 1, cx: 0, cy: 0, scale: 1 };

    function resetNodes() {
      physNodes = PRESETS[elemType].defPhys.map(function (p) { return [p[0], p[1]]; });
    }

    function evalShape(type, xi, eta) {
      if (type === 'q4') {
        const N = [
          0.25 * (1 - xi) * (1 - eta),
          0.25 * (1 + xi) * (1 - eta),
          0.25 * (1 + xi) * (1 + eta),
          0.25 * (1 - xi) * (1 + eta)
        ];
        const dxi = [
          -0.25 * (1 - eta),
          0.25 * (1 - eta),
          0.25 * (1 + eta),
          -0.25 * (1 + eta)
        ];
        const deta = [
          -0.25 * (1 - xi),
          -0.25 * (1 + xi),
          0.25 * (1 + xi),
          0.25 * (1 - xi)
        ];
        return { N: N, dxi: dxi, deta: deta };
      }
      if (type === 'p1') {
        const l1 = 1 - xi - eta;
        return {
          N: [l1, xi, eta],
          dxi: [-1, 1, 0],
          deta: [-1, 0, 1]
        };
      }
      if (type === 'p2') {
        const l1 = 1 - xi - eta;
        const l2 = xi;
        const l3 = eta;
        const N = [
          l1 * (2 * l1 - 1),
          l2 * (2 * l2 - 1),
          l3 * (2 * l3 - 1),
          4 * l1 * l2,
          4 * l2 * l3,
          4 * l3 * l1
        ];
        const dxi = [
          -(4 * l1 - 1),
          4 * l2 - 1,
          0,
          4 * (l1 - l2),
          4 * l3,
          -4 * l3
        ];
        const deta = [
          -(4 * l1 - 1),
          0,
          4 * l3 - 1,
          -4 * l2,
          4 * l2,
          4 * (l1 - l3)
        ];
        return { N: N, dxi: dxi, deta: deta };
      }
      // 1D P2 Bar on [-1, 1], nodes at -1, 0, +1
      return {
        N: [0.5 * xi * (xi - 1), 1 - xi * xi, 0.5 * xi * (xi + 1)],
        dxi: [xi - 0.5, -2 * xi, xi + 0.5],
        deta: [0, 0, 0]
      };
    }

    function mapPointAndDetJ(type, nodes, xi, eta) {
      const sh = evalShape(type, xi, eta);
      let x = 0;
      let y = 0;
      let j11 = 0;
      let j12 = 0;
      let j21 = 0;
      let j22 = 0;
      for (let a = 0; a < nodes.length; a++) {
        x += nodes[a][0] * sh.N[a];
        y += nodes[a][1] * sh.N[a];
        j11 += nodes[a][0] * sh.dxi[a];
        j12 += nodes[a][0] * sh.deta[a];
        j21 += nodes[a][1] * sh.dxi[a];
        j22 += nodes[a][1] * sh.deta[a];
      }
      const detJ = type === 'bar1d' ? j11 : (j11 * j22 - j12 * j21);
      return { x: x, y: y, detJ: detJ };
    }

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const keys = ['q4', 'p1', 'p2', 'bar1d'];
    const pillBtns = keys.map(function (k) {
      const btn = el('button', 'lab-pill' + (k === elemType ? ' is-active' : ''), PRESETS[k].label);
      btn.type = 'button';
      pillGroup.appendChild(btn);
      return { key: k, btn: btn };
    });

    const rightTool = el('div', 'lab-pill-group');
    const resetBtn = el('button', 'lab-pill', 'Reset Geometry');
    resetBtn.type = 'button';
    const badgeEl = el('span', 'lab-badge-status is-safe', 'VALID (det J > 0)');
    rightTool.appendChild(resetBtn);
    rightTool.appendChild(badgeEl);

    toolbar.appendChild(pillGroup);
    toolbar.appendChild(rightTool);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const readouts = el('div', 'lab-readout-row');
    const rMin = createReadoutChip('min det(J)', '0.000');
    const rMax = createReadoutChip('max det(J)', '0.000');
    const rRatio = createReadoutChip('Ratio max/min', '1.00');
    const rGauss = createReadoutChip('Quadrature', PRESETS.q4.gaussLabel);
    readouts.appendChild(rMin.chip);
    readouts.appendChild(rMax.chip);
    readouts.appendChild(rRatio.chip);
    readouts.appendChild(rGauss.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function detJFillColor(det, minD, maxD, pal) {
      if (det <= 0) return withAlpha(pal.cardinal, pal.theme === 'dark' ? 0.62 : 0.48);
      const span = Math.max(1e-6, maxD - minD);
      const norm = span < 1e-4 ? 0.5 : clamp((det - minD) / span, 0, 1);
      return mixRgb(pal.blue, pal.teal, norm, pal.theme === 'dark' ? 0.34 : 0.24);
    }

    function computeStats() {
      let minD = Infinity;
      let maxD = -Infinity;
      if (elemType === 'q4') {
        const n = 14;
        for (let i = 0; i <= n; i++) {
          const xi = -1 + (2 * i) / n;
          for (let j = 0; j <= n; j++) {
            const eta = -1 + (2 * j) / n;
            const d = mapPointAndDetJ('q4', physNodes, xi, eta).detJ;
            if (d < minD) minD = d;
            if (d > maxD) maxD = d;
          }
        }
      } else if (elemType === 'p1' || elemType === 'p2') {
        const n = 14;
        for (let i = 0; i <= n; i++) {
          for (let j = 0; j <= n - i; j++) {
            const xi = i / n;
            const eta = j / n;
            const d = mapPointAndDetJ(elemType, physNodes, xi, eta).detJ;
            if (d < minD) minD = d;
            if (d > maxD) maxD = d;
          }
        }
      } else {
        const n = 40;
        for (let i = 0; i <= n; i++) {
          const xi = -1 + (2 * i) / n;
          const d = mapPointAndDetJ('bar1d', physNodes, xi, 0).detJ;
          if (d < minD) minD = d;
          if (d > maxD) maxD = d;
        }
      }
      return { minD: minD, maxD: maxD };
    }

    function draw2DPanel(ctx, x0, y0, pw, ph, isRef, stats, pal) {
      ctx.save();
      roundRectPath(ctx, x0, y0, pw, ph, 2);
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const headerH = 30;
      const cx = x0 + pw * 0.5;
      const cy = y0 + headerH + (ph - headerH - 12) * 0.5;
      const avail = Math.min(pw - 56, ph - headerH - 44);
      const scale = Math.max(40, avail * 0.42);

      if (!isRef) {
        physBox = { x: x0, y: y0, w: pw, h: ph, cx: cx, cy: cy, scale: scale };
      }

      // Panel title
      drawMathRun(ctx, isRef ? 'Reference Ω̂ (ξ, η)' : 'Physical Ω_e (drag vertices)', x0 + 12, y0 + 16, {
        px: 15,
        weight: 600,
        color: isRef ? pal.textMuted : pal.text,
        align: 'left'
      });

      function refToScreen(xi, eta) {
        if (elemType === 'q4') {
          return [cx + xi * scale, cy - eta * scale];
        }
        // Standard triangle [0,1]x[0,1] centered cleanly
        return [cx + (xi - 0.36) * scale * 1.55, cy - (eta - 0.36) * scale * 1.55];
      }

      function physToScreen(px, py) {
        return [cx + px * scale, cy - py * scale];
      }

      // Subtle reference axes
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 + 14, cy);
      ctx.lineTo(x0 + pw - 14, cy);
      ctx.moveTo(cx, y0 + headerH + 6);
      ctx.lineTo(cx, y0 + ph - 12);
      ctx.stroke();

      if (elemType === 'q4') {
        const sub = 12;
        // Shaded cells
        for (let i = 0; i < sub; i++) {
          for (let j = 0; j < sub; j++) {
            const xi0 = -1 + (2 * i) / sub;
            const xi1 = -1 + (2 * (i + 1)) / sub;
            const et0 = -1 + (2 * j) / sub;
            const et1 = -1 + (2 * (j + 1)) / sub;
            const corners = [[xi0, et0], [xi1, et0], [xi1, et1], [xi0, et1]];
            const mid = mapPointAndDetJ('q4', physNodes, 0.5 * (xi0 + xi1), 0.5 * (et0 + et1));
            ctx.beginPath();
            for (let c = 0; c < 4; c++) {
              let pt;
              if (isRef) {
                pt = refToScreen(corners[c][0], corners[c][1]);
              } else {
                const mp = mapPointAndDetJ('q4', physNodes, corners[c][0], corners[c][1]);
                pt = physToScreen(mp.x, mp.y);
              }
              if (c === 0) ctx.moveTo(pt[0], pt[1]);
              else ctx.lineTo(pt[0], pt[1]);
            }
            ctx.closePath();
            ctx.fillStyle = isRef ? withAlpha(pal.teal, 0.12) : detJFillColor(mid.detJ, stats.minD, stats.maxD, pal);
            ctx.fill();
          }
        }

        // Iso-lines
        ctx.strokeStyle = withAlpha(pal.text, 0.28);
        ctx.lineWidth = 1;
        for (let k = 1; k <= 5; k++) {
          const val = -1 + (2 * k) / 6;
          // Constant xi
          ctx.beginPath();
          for (let s = 0; s <= 16; s++) {
            const t = -1 + (2 * s) / 16;
            const pt = isRef ? refToScreen(val, t) : (function () {
              const mp = mapPointAndDetJ('q4', physNodes, val, t);
              return physToScreen(mp.x, mp.y);
            })();
            if (s === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          }
          ctx.stroke();
          // Constant eta
          ctx.beginPath();
          for (let s = 0; s <= 16; s++) {
            const t = -1 + (2 * s) / 16;
            const pt = isRef ? refToScreen(t, val) : (function () {
              const mp = mapPointAndDetJ('q4', physNodes, t, val);
              return physToScreen(mp.x, mp.y);
            })();
            if (s === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          }
          ctx.stroke();
        }

        // Outer boundary
        ctx.beginPath();
        for (let a = 0; a < 4; a++) {
          const rn = PRESETS.q4.refNodes[a];
          const pt = isRef ? refToScreen(rn[0], rn[1]) : physToScreen(physNodes[a][0], physNodes[a][1]);
          if (a === 0) ctx.moveTo(pt[0], pt[1]);
          else ctx.lineTo(pt[0], pt[1]);
        }
        ctx.closePath();
        ctx.strokeStyle = stats.minD <= 0 && !isRef ? pal.cardinal : pal.teal;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // 2x2 Gauss points
        const gp = 1 / Math.sqrt(3);
        const gPts = [[-gp, -gp], [gp, -gp], [gp, gp], [-gp, gp]];
        gPts.forEach(function (g) {
          const pt = isRef ? refToScreen(g[0], g[1]) : (function () {
            const mp = mapPointAndDetJ('q4', physNodes, g[0], g[1]);
            return physToScreen(mp.x, mp.y);
          })();
          ctx.fillStyle = pal.amber;
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 4.2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Triangle P1 or P2
        const sub = 12;
        for (let i = 0; i < sub; i++) {
          for (let j = 0; j < sub - i; j++) {
            const drawSubTri = function (pA, pB, pC) {
              const mc = mapPointAndDetJ(elemType, physNodes, (pA[0] + pB[0] + pC[0]) / 3, (pA[1] + pB[1] + pC[1]) / 3);
              const pts = [pA, pB, pC].map(function (q) {
                if (isRef) return refToScreen(q[0], q[1]);
                const mp = mapPointAndDetJ(elemType, physNodes, q[0], q[1]);
                return physToScreen(mp.x, mp.y);
              });
              ctx.beginPath();
              ctx.moveTo(pts[0][0], pts[0][1]);
              ctx.lineTo(pts[1][0], pts[1][1]);
              ctx.lineTo(pts[2][0], pts[2][1]);
              ctx.closePath();
              ctx.fillStyle = isRef ? withAlpha(pal.teal, 0.12) : detJFillColor(mc.detJ, stats.minD, stats.maxD, pal);
              ctx.fill();
            };
            const a = [i / sub, j / sub];
            const b = [(i + 1) / sub, j / sub];
            const c = [i / sub, (j + 1) / sub];
            drawSubTri(a, b, c);
            if (i + j + 1 < sub) {
              const d = [(i + 1) / sub, (j + 1) / sub];
              drawSubTri(b, d, c);
            }
          }
        }

        // Barycentric iso-lines
        ctx.strokeStyle = withAlpha(pal.text, 0.25);
        ctx.lineWidth = 1;
        for (let k = 1; k <= 4; k++) {
          const t = k / 5;
          const lines = [
            [[t, 0], [t, 1 - t]],
            [[0, t], [1 - t, t]],
            [[0, 1 - t], [1 - t, 0]]
          ];
          lines.forEach(function (seg) {
            ctx.beginPath();
            for (let s = 0; s <= 16; s++) {
              const f = s / 16;
              const xi = lerp(seg[0][0], seg[1][0], f);
              const eta = lerp(seg[0][1], seg[1][1], f);
              const pt = isRef ? refToScreen(xi, eta) : (function () {
                const mp = mapPointAndDetJ(elemType, physNodes, xi, eta);
                return physToScreen(mp.x, mp.y);
              })();
              if (s === 0) ctx.moveTo(pt[0], pt[1]);
              else ctx.lineTo(pt[0], pt[1]);
            }
            ctx.stroke();
          });
        }

        // Outer curved/straight boundary
        const edges = [
          [[0, 0], [1, 0]],
          [[1, 0], [0, 1]],
          [[0, 1], [0, 0]]
        ];
        ctx.beginPath();
        let started = false;
        edges.forEach(function (ed) {
          for (let s = 0; s <= 20; s++) {
            const f = s / 20;
            const xi = lerp(ed[0][0], ed[1][0], f);
            const eta = lerp(ed[0][1], ed[1][1], f);
            const pt = isRef ? refToScreen(xi, eta) : (function () {
              const mp = mapPointAndDetJ(elemType, physNodes, xi, eta);
              return physToScreen(mp.x, mp.y);
            })();
            if (!started) {
              ctx.moveTo(pt[0], pt[1]);
              started = true;
            } else {
              ctx.lineTo(pt[0], pt[1]);
            }
          }
        });
        ctx.closePath();
        ctx.strokeStyle = stats.minD <= 0 && !isRef ? pal.cardinal : pal.teal;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Gauss points
        const gPts = elemType === 'p1'
          ? [[1 / 3, 1 / 3]]
          : [[1 / 6, 1 / 6], [2 / 3, 1 / 6], [1 / 6, 2 / 3]];
        gPts.forEach(function (g) {
          const pt = isRef ? refToScreen(g[0], g[1]) : (function () {
            const mp = mapPointAndDetJ(elemType, physNodes, g[0], g[1]);
            return physToScreen(mp.x, mp.y);
          })();
          ctx.fillStyle = pal.amber;
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 4.4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw nodes and labels
      const nodesArr = isRef ? PRESETS[elemType].refNodes : physNodes;
      if (!isRef) physScreenPts = [];
      let meanX = 0;
      let meanY = 0;
      const screenNodes = nodesArr.map(function (nd) {
        const p = isRef ? refToScreen(nd[0], nd[1]) : physToScreen(nd[0], nd[1]);
        meanX += p[0];
        meanY += p[1];
        return p;
      });
      meanX /= screenNodes.length;
      meanY /= screenNodes.length;

      screenNodes.forEach(function (pt, idx) {
        if (!isRef) physScreenPts.push({ x: pt[0], y: pt[1] });
        const active = !isRef && dragIdx === idx;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], active ? 8 : (isRef ? 5.2 : 6.8), 0, Math.PI * 2);
        ctx.fillStyle = isRef ? pal.surface2 : (active ? pal.cardinal : pal.teal);
        ctx.fill();
        ctx.strokeStyle = isRef ? pal.teal : pal.white;
        ctx.lineWidth = 2;
        ctx.stroke();

        const vx = pt[0] - meanX;
        const vy = pt[1] - meanY;
        const vlen = Math.hypot(vx, vy) || 1;
        const lx = clamp(pt[0] + (vx / vlen) * 18, x0 + 14, x0 + pw - 14);
        const ly = clamp(pt[1] + (vy / vlen) * 18, y0 + headerH + 8, y0 + ph - 12);
        setFont(ctx, 15, true, 600);
        ctx.fillStyle = pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), lx, ly);
      });

      ctx.restore();
    }

    function draw1DBarPanels(ctx, leftBox, rightBox, stats, pal) {
      // Left panel: Reference [-1, 1] + P2 shape functions N1, N2, N3
      ctx.save();
      [leftBox, rightBox].forEach(function (b) {
        roundRectPath(ctx, b.x, b.y, b.w, b.h, 2);
        ctx.fillStyle = pal.surface;
        ctx.fill();
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      drawMathRun(ctx, 'Reference Ω̂ = [-1, 1] & P2 Basis', leftBox.x + 12, leftBox.y + 16, {
        px: 15,
        weight: 600,
        color: pal.textMuted
      });

      const lx0 = leftBox.x + 34;
      const lx1 = leftBox.x + leftBox.w - 28;
      const lyBase = leftBox.y + leftBox.h - 46;
      const lyTop = leftBox.y + 44;
      const lyH = lyBase - lyTop;

      // Baseline bar
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx0, lyBase);
      ctx.lineTo(lx1, lyBase);
      ctx.stroke();

      const cols = [pal.blue, pal.teal, pal.amber];
      for (let a = 0; a < 3; a++) {
        ctx.strokeStyle = cols[a];
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let s = 0; s <= 40; s++) {
          const xi = -1 + (2 * s) / 40;
          const val = evalShape('bar1d', xi, 0).N[a];
          const px = lerp(lx0, lx1, (xi + 1) * 0.5);
          const py = lyBase - val * lyH * 0.82;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Reference nodes and Gauss points
      [-1, 0, 1].forEach(function (xi, idx) {
        const px = lerp(lx0, lx1, (xi + 1) * 0.5);
        ctx.beginPath();
        ctx.arc(px, lyBase, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = cols[idx];
        ctx.fill();
        setFont(ctx, 15, true, 500);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(xi), px, lyBase + 10);
      });
      GAUSS_1D[2].pts.forEach(function (g) {
        const px = lerp(lx0, lx1, (g + 1) * 0.5);
        ctx.fillStyle = pal.amber;
        ctx.beginPath();
        ctx.arc(px, lyBase, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Right panel: Physical 1D P2 bar (draggable X1, X2, X3) + J(ξ) = dx/dξ curve
      drawMathRun(ctx, 'Physical Bar (drag X_1, X_2, X_3) & J(ξ)', rightBox.x + 12, rightBox.y + 16, {
        px: 15,
        weight: 600,
        color: pal.text
      });

      const rx0 = rightBox.x + 36;
      const rx1 = rightBox.x + rightBox.w - 28;
      const barY = rightBox.y + 62;
      physBox = { x: rightBox.x, y: rightBox.y, w: rightBox.w, h: rightBox.h, cx: (rx0 + rx1) * 0.5, cy: barY, scale: (rx1 - rx0) * 0.45 };

      function xToScreen(xv) {
        return physBox.cx + xv * physBox.scale;
      }

      // Quarter-point safe bracket for X2
      const xL = physNodes[0][0];
      const xR = physNodes[2][0];
      const q1 = lerp(xL, xR, 0.25);
      const q3 = lerp(xL, xR, 0.75);
      ctx.fillStyle = withAlpha(pal.teal, 0.14);
      ctx.fillRect(xToScreen(Math.min(q1, q3)), barY - 12, Math.abs(xToScreen(q3) - xToScreen(q1)), 24);

      // Bar segment
      ctx.strokeStyle = stats.minD <= 0 ? pal.cardinal : pal.teal;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(xToScreen(xL), barY);
      ctx.lineTo(xToScreen(xR), barY);
      ctx.stroke();

      // Draggable physical nodes
      physScreenPts = [];
      physNodes.forEach(function (nd, idx) {
        const px = xToScreen(nd[0]);
        physScreenPts.push({ x: px, y: barY });
        const active = dragIdx === idx;
        ctx.beginPath();
        ctx.arc(px, barY, active ? 8.5 : 7, 0, Math.PI * 2);
        ctx.fillStyle = active ? pal.cardinal : cols[idx];
        ctx.fill();
        ctx.strokeStyle = pal.white;
        ctx.lineWidth = 2;
        ctx.stroke();
        drawMathRun(ctx, 'X_' + (idx + 1), px, barY - 20, { px: 15, mono: true, align: 'center', color: pal.text });
      });

      // Lower plot: J(ξ) = dx/dξ across ξ in [-1, 1]
      const plotTop = barY + 34;
      const plotBot = rightBox.y + rightBox.h - 28;
      const plotH = Math.max(50, plotBot - plotTop);
      const jMin = Math.min(-0.3, stats.minD - 0.15);
      const jMax = Math.max(1.5, stats.maxD + 0.15);
      function jToY(jv) {
        return plotBot - ((jv - jMin) / (jMax - jMin)) * plotH;
      }

      // Zero line
      const yZero = jToY(0);
      ctx.strokeStyle = pal.cardinal;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(rx0, yZero);
      ctx.lineTo(rx1, yZero);
      ctx.stroke();
      ctx.setLineDash([]);

      setFont(ctx, 15, true, 500);
      ctx.fillStyle = pal.cardinal;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('J = 0', rx0 + 4, yZero - 3);

      // J(ξ) line
      ctx.strokeStyle = stats.minD <= 0 ? pal.cardinal : pal.teal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) {
        const xi = -1 + (2 * s) / 40;
        const jv = mapPointAndDetJ('bar1d', physNodes, xi, 0).detJ;
        const px = lerp(rx0, rx1, (xi + 1) * 0.5);
        const py = jToY(jv);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      drawMathRun(ctx, 'J(ξ) = dx/dξ (quarter-point rule)', rightBox.x + rightBox.w - 14, plotTop + 8, {
        px: 15,
        align: 'right',
        color: pal.textMuted
      });

      ctx.restore();
    }

    function updateReadouts(stats) {
      rMin.valEl.textContent = stats.minD.toFixed(3);
      rMax.valEl.textContent = stats.maxD.toFixed(3);
      rGauss.valEl.textContent = PRESETS[elemType].gaussLabel;

      if (stats.minD <= 0) {
        rRatio.valEl.textContent = 'INVERTED';
        setStatusBadge(badgeEl, 'INVERTED (det J <= 0)', 'danger');
      } else {
        const ratio = stats.maxD / stats.minD;
        rRatio.valEl.textContent = ratio.toFixed(2);
        if (ratio > 4.0) {
          setStatusBadge(badgeEl, 'HIGHLY DISTORTED', 'warn');
        } else {
          setStatusBadge(badgeEl, 'VALID (det J > 0)', 'safe');
        }
      }
    }

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 540;
      syncStageHeight(stage, 480, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = getPal(api);

      fillStageBg(ctx, w, h, pal);
      const stats = computeStats();
      updateReadouts(stats);

      const pad = 10;
      if (isNarrow) {
        const panelH = Math.floor((h - pad * 3 - 20) * 0.5);
        const topBox = { x: pad, y: pad, w: w - pad * 2, h: panelH };
        const botBox = { x: pad, y: pad * 2 + panelH + 20, w: w - pad * 2, h: h - (pad * 3 + panelH + 20) };
        if (elemType === 'bar1d') {
          draw1DBarPanels(ctx, topBox, botBox, stats, pal);
        } else {
          draw2DPanel(ctx, topBox.x, topBox.y, topBox.w, topBox.h, true, stats, pal);
          draw2DPanel(ctx, botBox.x, botBox.y, botBox.w, botBox.h, false, stats, pal);
        }
        drawArrow(ctx, w * 0.5, topBox.y + topBox.h + 2, w * 0.5, botBox.y - 2, pal.amber, 2.2, 8);
      } else {
        const midGap = 44;
        const leftW = Math.floor((w - pad * 2 - midGap) * 0.45);
        const rightW = w - pad * 2 - midGap - leftW;
        const leftBox = { x: pad, y: pad, w: leftW, h: h - pad * 2 };
        const rightBox = { x: pad + leftW + midGap, y: pad, w: rightW, h: h - pad * 2 };
        if (elemType === 'bar1d') {
          draw1DBarPanels(ctx, leftBox, rightBox, stats, pal);
        } else {
          draw2DPanel(ctx, leftBox.x, leftBox.y, leftBox.w, leftBox.h, true, stats, pal);
          draw2DPanel(ctx, rightBox.x, rightBox.y, rightBox.w, rightBox.h, false, stats, pal);
        }
        const midX1 = leftBox.x + leftBox.w + 6;
        const midX2 = rightBox.x - 6;
        const midY = h * 0.5;
        drawArrow(ctx, midX1, midY, midX2, midY, pal.amber, 2.2, 9);
        drawMathRun(ctx, 'x(ξ)', (midX1 + midX2) * 0.5, midY - 16, {
          px: 15,
          mono: true,
          align: 'center',
          color: pal.amber
        });
      }
    }

    function findNearestNode(pt) {
      let best = -1;
      let bestD = 26;
      for (let i = 0; i < physScreenPts.length; i++) {
        const d = Math.hypot(pt.x - physScreenPts[i].x, pt.y - physScreenPts[i].y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    }

    bindHandleTouch(bag, stage, canvas, {
      isNearHandle: function (pt) {
        return findNearestNode(pt) >= 0;
      },
      onStart: function (pt) {
        dragIdx = findNearestNode(pt);
        draw();
      },
      onMove: function (pt) {
        if (dragIdx < 0) return;
        const nx = clamp((pt.x - physBox.cx) / physBox.scale, -1.08, 1.08);
        if (elemType === 'bar1d') {
          physNodes[dragIdx][0] = nx;
        } else {
          const ny = clamp(-(pt.y - physBox.cy) / physBox.scale, -1.05, 1.05);
          physNodes[dragIdx][0] = nx;
          physNodes[dragIdx][1] = ny;
        }
        draw();
      },
      onHover: function (pt) {
        canvas.style.cursor = findNearestNode(pt) >= 0 ? 'grab' : 'default';
      },
      onEnd: function () {
        dragIdx = -1;
        draw();
      }
    });

    pillBtns.forEach(function (item) {
      bag.on(item.btn, 'click', function () {
        elemType = item.key;
        pillBtns.forEach(function (other) {
          other.btn.classList.toggle('is-active', other.key === elemType);
        });
        resetNodes();
        draw();
      });
    });

    bag.on(resetBtn, 'click', function () {
      resetNodes();
      draw();
    });

    bag.observe(stage, draw);
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 2: gauss-quadrature-lab (Slide 12)
   * ========================================================================== */

  registerLab('gauss-quadrature-lab', function (mountEl, api) {
    const bag = createBag();

    let mode = 'exactness'; // 'exactness' | 'hourglass'
    let Q = 2;
    let deg = 4;
    let hgAmp = 0.28;

    const SHIFT = 0.35;
    function exactIntegral(d) {
      return (Math.pow(1 + SHIFT, d + 1) - Math.pow(-1 + SHIFT, d + 1)) / (d + 1);
    }
    function gaussIntegral(qCount, d) {
      const rule = GAUSS_1D[qCount];
      let s = 0;
      for (let i = 0; i < rule.pts.length; i++) {
        s += rule.wts[i] * Math.pow(rule.pts[i] + SHIFT, d);
      }
      return s;
    }

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const btnExact = el('button', 'lab-pill is-active', '1D Exactness Cliff');
    const btnHG = el('button', 'lab-pill', 'Q4 Hourglass Mode');
    btnExact.type = 'button';
    btnHG.type = 'button';
    pillGroup.appendChild(btnExact);
    pillGroup.appendChild(btnHG);

    const badgeEl = el('span', 'lab-badge-status is-warn', 'INEXACT (d >= 2Q)');
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(badgeEl);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const controlsGrid = el('div', 'lab-controls-grid');
    const slQ = createSliderControl('Gauss Points Q', {
      min: 1,
      max: 4,
      step: 1,
      value: Q,
      format: function (v) { return String(Math.round(v)); }
    }, function (v) {
      Q = Math.round(v);
      draw();
    });
    const slDeg = createSliderControl('Degree d of (ξ+0.35)^d', {
      min: 1,
      max: 9,
      step: 1,
      value: deg,
      format: function (v) { return String(Math.round(v)); }
    }, function (v) {
      deg = Math.round(v);
      draw();
    });
    const slHg = createSliderControl('Hourglass Amplitude α', {
      min: 0.0,
      max: 0.42,
      step: 0.01,
      value: hgAmp,
      format: function (v) { return v.toFixed(2); }
    }, function (v) {
      hgAmp = v;
      draw();
    });
    bag.on(slQ.input, 'input', slQ.handler);
    bag.on(slDeg.input, 'input', slDeg.handler);
    bag.on(slHg.input, 'input', slHg.handler);

    controlsGrid.appendChild(slQ.wrap);
    controlsGrid.appendChild(slDeg.wrap);
    controlsGrid.appendChild(slHg.wrap);

    const readouts = el('div', 'lab-readout-row');
    const r1 = createReadoutChip('Exact I', '0.000');
    const r2 = createReadoutChip('Gauss I_Q', '0.000');
    const r3 = createReadoutChip('Rel. Error', '0.0e+0');
    const r4 = createReadoutChip('Exact Limit', '2Q - 1 = 3');
    readouts.appendChild(r1.chip);
    readouts.appendChild(r2.chip);
    readouts.appendChild(r3.chip);
    readouts.appendChild(r4.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controlsGrid);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function syncControlVisibility() {
      const isEx = mode === 'exactness';
      slQ.wrap.style.display = isEx ? '' : 'none';
      slDeg.wrap.style.display = isEx ? '' : 'none';
      slHg.wrap.style.display = isEx ? 'none' : '';
      btnExact.classList.toggle('is-active', isEx);
      btnHG.classList.toggle('is-active', !isEx);
    }

    function drawExactness(ctx, w, h, pal) {
      const padL = 56;
      const padR = 34;
      const padT = 28;
      const midGap = 38;
      const padB = 34;
      const topH = Math.floor((h - padT - midGap - padB) * 0.50);
      const botY = padT + topH + midGap;
      const botH = Math.max(70, h - botY - padB);
      const plotW = Math.max(120, w - padL - padR);

      // Compute integrand scale on [-1, 1]
      let gMin = 0;
      let gMax = 0;
      for (let s = 0; s <= 80; s++) {
        const xi = -1 + (2 * s) / 80;
        const gv = Math.pow(xi + SHIFT, deg);
        if (gv < gMin) gMin = gv;
        if (gv > gMax) gMax = gv;
      }
      const gPad = Math.max(0.2, (gMax - gMin) * 0.12);
      gMin -= gPad;
      gMax += gPad;

      function x1(xi) { return padL + ((xi + 1) * 0.5) * plotW; }
      function y1(val) { return padT + topH - ((val - gMin) / (gMax - gMin)) * topH; }

      // Top panel box
      ctx.fillStyle = pal.surface;
      ctx.fillRect(padL, padT, plotW, topH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, topH);

      // Zero line
      const yZero = y1(0);
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(padL, yZero);
      ctx.lineTo(padL + plotW, yZero);
      ctx.stroke();

      // Integrand area fill
      ctx.beginPath();
      ctx.moveTo(x1(-1), yZero);
      for (let s = 0; s <= 80; s++) {
        const xi = -1 + (2 * s) / 80;
        ctx.lineTo(x1(xi), y1(Math.pow(xi + SHIFT, deg)));
      }
      ctx.lineTo(x1(1), yZero);
      ctx.closePath();
      ctx.fillStyle = withAlpha(pal.teal, 0.16);
      ctx.fill();

      // Integrand curve
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let s = 0; s <= 80; s++) {
        const xi = -1 + (2 * s) / 80;
        const px = x1(xi);
        const py = y1(Math.pow(xi + SHIFT, deg));
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Gauss nodes & weight bars
      const rule = GAUSS_1D[Q];
      const barBaseY = padT + topH;
      for (let i = 0; i < rule.pts.length; i++) {
        const xi = rule.pts[i];
        const wt = rule.wts[i];
        const gv = Math.pow(xi + SHIFT, deg);
        const px = x1(xi);
        const py = y1(gv);
        // Weight bar along bottom of top plot
        const wBarH = (wt / 2) * topH * 0.42;
        ctx.fillStyle = withAlpha(pal.amber, 0.30);
        ctx.fillRect(px - 7, barBaseY - wBarH, 14, wBarH);
        // Vertical stem to curve
        ctx.strokeStyle = pal.amber;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(px, yZero);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        // Node dot
        ctx.fillStyle = pal.amber;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pal.bg;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      drawMathRun(ctx, 'g(ξ) = (ξ + 0.35)^' + deg + '  ·  Q = ' + Q + ' nodes & weights w_q', padL, padT - 12, {
        px: 15,
        weight: 600,
        color: pal.text
      });

      // Bottom panel: log10(rel err) vs degree d = 1..9
      ctx.fillStyle = pal.surface;
      ctx.fillRect(padL, botY, plotW, botH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, botY, plotW, botH);

      const minLog = -16;
      const maxLog = 0.5;
      function x2(d) { return padL + ((d - 0.6) / 8.8) * plotW; }
      function y2(lg) { return botY + botH - ((clamp(lg, minLog, maxLog) - minLog) / (maxLog - minLog)) * botH; }

      // Horizontal grid lines at -15, -10, -5, 0
      [-15, -10, -5, 0].forEach(function (lv) {
        const py = y2(lv);
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('10^' + lv, padL - 6, py);
      });

      // Exactness cliff boundary at 2Q - 0.5
      const cliffD = 2 * Q - 0.5;
      let cliffCx = null;
      if (cliffD <= 9.2) {
        cliffCx = x2(cliffD);
        ctx.fillStyle = withAlpha(pal.teal, 0.08);
        ctx.fillRect(padL, botY, Math.max(0, cliffCx - padL), botH);
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cliffCx, botY);
        ctx.lineTo(cliffCx, botY + botH);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Curve of log10 rel error for d = 1..9
      const pts = [];
      for (let d = 1; d <= 9; d++) {
        const ex = exactIntegral(d);
        const ap = gaussIntegral(Q, d);
        const rel = Math.abs(ap - ex) / Math.max(1e-16, Math.abs(ex));
        const lg = Math.log10(Math.max(1e-16, rel));
        pts.push({ d: d, rel: rel, lg: lg, px: x2(d), py: y2(lg) });
      }

      ctx.strokeStyle = pal.blue;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      pts.forEach(function (p, i) {
        if (i === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      });
      ctx.stroke();

      pts.forEach(function (p) {
        const isSel = p.d === deg;
        const isExact = p.d <= 2 * Q - 1;
        ctx.beginPath();
        ctx.arc(p.px, p.py, isSel ? 6.5 : 4.2, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? (isExact ? pal.teal : pal.cardinal) : pal.blue;
        ctx.fill();
        if (isSel) {
          ctx.strokeStyle = pal.white;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        setFont(ctx, 15, true, isSel ? 700 : 400);
        ctx.fillStyle = isSel ? pal.text : pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(p.d), p.px, botY + botH + 8);
      });

      // Cliff pill placed cleanly in the open mid-lower zone (y2(-7.5)) away from curve & dots
      if (cliffCx !== null) {
        const cliffTxt = 'Cliff d = 2Q = ' + (2 * Q);
        setFont(ctx, 15, true, 600);
        const estW = ctx.measureText(cliffTxt).width + 16;
        const putLeft = cliffCx + 10 + estW > padL + plotW - 4;
        const pillX = putLeft
          ? clamp(cliffCx - 10, padL + estW + 4, padL + plotW - 6)
          : clamp(cliffCx + 10, padL + 6, padL + plotW - estW - 4);
        drawMathRun(ctx, cliffTxt, pillX, y2(-7.5), {
          px: 15,
          mono: true,
          weight: 600,
          align: putLeft ? 'right' : 'left',
          baseline: 'middle',
          color: pal.cardinal,
          bg: withAlpha(pal.surface, 0.92),
          border: withAlpha(pal.cardinal, 0.45),
          padX: 7,
          padY: 3
        });
      }

      drawMathRun(ctx, 'Log_{10} Relative Error vs. Polynomial Degree d', padL, botY - 12, {
        px: 15,
        weight: 600,
        color: pal.text
      });

      // Update readouts
      const exCur = exactIntegral(deg);
      const apCur = gaussIntegral(Q, deg);
      const relCur = Math.abs(apCur - exCur) / Math.max(1e-16, Math.abs(exCur));
      setMathText(r1.keyEl, 'Exact I');
      r1.valEl.textContent = exCur.toFixed(5);
      setMathText(r2.keyEl, 'Gauss I_Q');
      r2.valEl.textContent = apCur.toFixed(5);
      setMathText(r3.keyEl, 'Rel. Error');
      r3.valEl.textContent = relCur < 1e-14 ? '< 1e-15 (exact)' : relCur.toExponential(2);
      setMathText(r4.keyEl, 'Exactness');
      r4.valEl.textContent = 'd <= ' + (2 * Q - 1);

      if (deg <= 2 * Q - 1) {
        setStatusBadge(badgeEl, 'EXACT (d <= 2Q - 1)', 'safe');
      } else {
        setStatusBadge(badgeEl, 'CLIFF ERROR (d >= 2Q)', 'danger');
      }
    }

    function drawHourglass(ctx, w, h, pal) {
      const pad = 10;
      const isNarrow = w < 480;
      const panels = isNarrow
        ? [
            { x: pad, y: pad, w: w - pad * 2, h: Math.floor((h - pad * 3) * 0.5), reduced: true },
            { x: pad, y: pad * 2 + Math.floor((h - pad * 3) * 0.5), w: w - pad * 2, h: Math.floor((h - pad * 3) * 0.5), reduced: false }
          ]
        : [
            { x: pad, y: pad, w: Math.floor((w - pad * 3) * 0.5), h: h - pad * 2, reduced: true },
            { x: pad * 2 + Math.floor((w - pad * 3) * 0.5), y: pad, w: w - pad * 3 - Math.floor((w - pad * 3) * 0.5), h: h - pad * 2, reduced: false }
          ];

      // Pure Q4 scalar hourglass field u_h(xi, eta) = hgAmp * xi * eta
      // Geometric butterfly distortion: x_a = xi_a + hgAmp * sign_a, y_a = eta_a + 0.55 * hgAmp * sign_a
      const refC = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      const signs = [1, -1, 1, -1];
      const defC = refC.map(function (c, i) {
        return [c[0] + signs[i] * hgAmp * 0.72, c[1] + signs[i] * hgAmp * 0.45];
      });

      const e1pt = 0.0; // grad u_h(0, 0) = (0, 0) identically
      const e2x2 = (4 / 3) * hgAmp * hgAmp; // exact 2x2 Gauss energy for u_h = alpha * xi * eta

      panels.forEach(function (p) {
        ctx.save();
        roundRectPath(ctx, p.x, p.y, p.w, p.h, 2);
        ctx.fillStyle = pal.surface;
        ctx.fill();
        ctx.strokeStyle = p.reduced && hgAmp > 0.02 ? withAlpha(pal.cardinal, 0.55) : pal.border;
        ctx.lineWidth = p.reduced && hgAmp > 0.02 ? 1.8 : 1.2;
        ctx.stroke();

        const title = p.reduced ? '1-pt Reduced: Zero Energy!' : '2x2 Full: Positive Energy';
        drawMathRun(ctx, title, p.x + 12, p.y + 18, {
          px: 15,
          weight: 600,
          color: p.reduced ? pal.cardinal : pal.teal
        });

        const cx = p.x + p.w * 0.5;
        const cy = p.y + 28 + (p.h - 60) * 0.5;
        const sc = Math.max(32, Math.min(p.w - 64, p.h - 94) * 0.36);

        // Undeformed dashed reference square
        ctx.strokeStyle = withAlpha(pal.textMuted, 0.45);
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx - sc, cy - sc, sc * 2, sc * 2);
        ctx.setLineDash([]);

        // Deformed hourglass quad
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const sx = cx + defC[i][0] * sc;
          const sy = cy - defC[i][1] * sc;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fillStyle = withAlpha(p.reduced ? pal.cardinal : pal.teal, 0.16);
        ctx.fill();
        ctx.strokeStyle = p.reduced ? pal.cardinal : pal.teal;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Nodal sign tags (+α / -α)
        for (let i = 0; i < 4; i++) {
          const sx = cx + defC[i][0] * sc;
          const sy = cy - defC[i][1] * sc;
          ctx.fillStyle = signs[i] > 0 ? pal.amber : pal.blue;
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();
          setFont(ctx, 15, true, 600);
          ctx.fillStyle = pal.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(signs[i] > 0 ? '+' : '−', sx + refC[i][0] * 14, sy - refC[i][1] * 13);
        }

        // Gauss points & gradient arrows
        if (p.reduced) {
          // Single centroid Gauss point (0, 0) where grad u_h = (0, 0)
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fillStyle = pal.cardinal;
          ctx.fill();
          ctx.strokeStyle = pal.white;
          ctx.lineWidth = 2;
          ctx.stroke();

          drawMathRun(ctx, '∇u_h(0,0) = 0', cx, p.y + p.h - 20, {
            px: 15,
            mono: true,
            align: 'center',
            color: pal.cardinal
          });
        } else {
          const gp = 1 / Math.sqrt(3);
          const gPts = [[-gp, -gp], [gp, -gp], [gp, gp], [-gp, gp]];
          gPts.forEach(function (g) {
            // Mapped position via Q4 bilinear interpolation of defC
            const N = [
              0.25 * (1 - g[0]) * (1 - g[1]),
              0.25 * (1 + g[0]) * (1 - g[1]),
              0.25 * (1 + g[0]) * (1 + g[1]),
              0.25 * (1 - g[0]) * (1 + g[1])
            ];
            let gx = 0;
            let gy = 0;
            for (let a = 0; a < 4; a++) {
              gx += defC[a][0] * N[a];
              gy += defC[a][1] * N[a];
            }
            const sx = cx + gx * sc;
            const sy = cy - gy * sc;
            ctx.fillStyle = pal.amber;
            ctx.beginPath();
            ctx.arc(sx, sy, 4.8, 0, Math.PI * 2);
            ctx.fill();
            // Nonzero gradient arrow: grad(alpha * xi * eta) = alpha * (eta, xi)
            if (hgAmp > 0.02) {
              const vecScale = sc * 0.85;
              const dx = hgAmp * g[1] * vecScale;
              const dy = -hgAmp * g[0] * vecScale;
              drawArrow(ctx, sx, sy, sx + dx, sy + dy, pal.teal, 2.2, 8);
            }
          });
          drawMathRun(ctx, 'E_{2x2} = (4/3)α^2 = ' + e2x2.toFixed(3), cx, p.y + p.h - 20, {
            px: 15,
            mono: true,
            align: 'center',
            color: pal.teal
          });
        }
        ctx.restore();
      });

      setMathText(r1.keyEl, 'E (1-pt)');
      r1.valEl.textContent = e1pt.toFixed(4);
      setMathText(r2.keyEl, 'E (2x2)');
      r2.valEl.textContent = e2x2.toFixed(4);
      setMathText(r3.keyEl, '|∇u_h(0,0)|');
      r3.valEl.textContent = '0.0000';
      setMathText(r4.keyEl, 'Rank Defic.');
      r4.valEl.textContent = '2 zero modes';

      if (hgAmp > 0.02) {
        setStatusBadge(badgeEl, 'ZERO-ENERGY HOURGLASS MODE', 'danger');
      } else {
        setStatusBadge(badgeEl, 'UNDEFORMED (α = 0)', 'safe');
      }
    }

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 460;
      syncStageHeight(stage, mode === 'exactness' ? 400 : 420, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const pal = getPal(api);
      fillStageBg(fit.ctx, fit.w, fit.h, pal);

      if (mode === 'exactness') drawExactness(fit.ctx, fit.w, fit.h, pal);
      else drawHourglass(fit.ctx, fit.w, fit.h, pal);
    }

    bag.on(btnExact, 'click', function () {
      mode = 'exactness';
      syncControlVisibility();
      draw();
    });
    bag.on(btnHG, 'click', function () {
      mode = 'hourglass';
      syncControlVisibility();
      draw();
    });

    bag.observe(stage, draw);
    syncControlVisibility();
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 3: assembly-2d-lab (Slide 13: Hanfeng's PS6 6-node, 4-triangle mesh)
   * ========================================================================== */

  registerLab('assembly-2d-lab', function (mountEl, api) {
    const bag = createBag();

    // Exact PS6 nodes (1-indexed labels, 0-indexed array) on [-1, 1] x [0, 1]
    const NODES = [
      { id: 1, x: -1, y: 0, free: 0 },
      { id: 2, x: -1, y: 1, free: 0 },
      { id: 3, x: 0, y: 0, free: 1 },
      { id: 4, x: 0, y: 1, free: 2 },
      { id: 5, x: 1, y: 0, free: 0 },
      { id: 6, x: 1, y: 1, free: 0 }
    ];

    // Exact PS6 CCW connectivity LG (1-indexed node IDs) and reduced LGe
    const ELEMS = [
      { e: 1, lg: [1, 3, 2], lge: [0, 1, 0], colorKey: 'cardinal' },
      { e: 2, lg: [2, 3, 4], lge: [0, 1, 2], colorKey: 'teal' },
      { e: 3, lg: [4, 3, 5], lge: [2, 1, 0], colorKey: 'amber' },
      { e: 4, lg: [4, 5, 6], lge: [2, 0, 0], colorKey: 'blue' }
    ];

    // Precompute exact P1 triangle areas and constant gradients grad(N_a^e)
    const ELEM_DATA = ELEMS.map(function (elObj) {
      const pts = elObj.lg.map(function (nid) { return NODES[nid - 1]; });
      const x1 = pts[0].x, y1 = pts[0].y;
      const x2 = pts[1].x, y2 = pts[1].y;
      const x3 = pts[2].x, y3 = pts[2].y;
      const twoA = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
      const area = 0.5 * twoA;
      const grads = [
        [(y2 - y3) / twoA, (x3 - x2) / twoA],
        [(y3 - y1) / twoA, (x1 - x3) / twoA],
        [(y1 - y2) / twoA, (x2 - x1) / twoA]
      ];
      return {
        e: elObj.e,
        lg: elObj.lg,
        lge: elObj.lge,
        colorKey: elObj.colorKey,
        area: area,
        cx: (x1 + x2 + x3) / 3,
        cy: (y1 + y2 + y3) / 3,
        grads: grads
      };
    });

    // Build cell contributor list for 6x6 K matrix
    const K_CONTRIB = [];
    for (let r = 0; r < 6; r++) {
      K_CONTRIB[r] = [];
      for (let c = 0; c < 6; c++) K_CONTRIB[r][c] = [];
    }
    ELEM_DATA.forEach(function (ed, ei) {
      for (let a = 0; a < 3; a++) {
        for (let b = 0; b < 3; b++) {
          const R = ed.lg[a] - 1;
          const C = ed.lg[b] - 1;
          if (K_CONTRIB[R][C].indexOf(ei) === -1) K_CONTRIB[R][C].push(ei);
        }
      }
    });

    let activeElem = 0; // 0..3 or -1 for All
    let reducedMode = false;
    let triPolys = [];

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const elemBtns = [
      { label: 'Elem 1', idx: 0 },
      { label: 'Elem 2', idx: 1 },
      { label: 'Elem 3', idx: 2 },
      { label: 'Elem 4', idx: 3 },
      { label: 'All', idx: -1 }
    ].map(function (spec) {
      const b = el('button', 'lab-pill' + (spec.idx === activeElem ? ' is-active' : ''), spec.label);
      b.type = 'button';
      pillGroup.appendChild(b);
      return { idx: spec.idx, btn: b };
    });

    const modeBtn = el('button', 'lab-pill', 'Full LG (6x6)');
    modeBtn.type = 'button';
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(modeBtn);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const readouts = el('div', 'lab-readout-row');
    const rLG = createReadoutChip('LG(:,e)', '[1, 3, 2]^T');
    const rLGe = createReadoutChip('LG^e(:,e)', '[0, 1, 0]^T');
    const rFree = createReadoutChip('Free DOFs', 'Nodes 3, 4 (2x2)');
    const rNNZ = createReadoutChip('Nonzeros', '24 / 36');
    readouts.appendChild(rLG.chip);
    readouts.appendChild(rLGe.chip);
    readouts.appendChild(rFree.chip);
    readouts.appendChild(rNNZ.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function pointInTri(px, py, tri) {
      const x1 = tri[0][0], y1 = tri[0][1];
      const x2 = tri[1][0], y2 = tri[1][1];
      const x3 = tri[2][0], y3 = tri[2][1];
      const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
      const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
      const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      return !(hasNeg && hasPos);
    }

    function updateReadouts() {
      if (activeElem === -1) {
        rLG.valEl.textContent = '3x4 full table';
        rLGe.valEl.textContent = '3,4 -> 1,2';
      } else {
        const ed = ELEM_DATA[activeElem];
        rLG.valEl.textContent = '[' + ed.lg.join(', ') + ']^T';
        rLGe.valEl.textContent = '[' + ed.lge.join(', ') + ']^T';
      }
      rFree.valEl.textContent = reducedMode ? 'Active 2x2 (3,4)' : 'Nodes 3, 4';
      rNNZ.valEl.textContent = reducedMode ? '4 / 4 (reduced)' : '24 / 36 (sparse)';
      modeBtn.textContent = reducedMode ? 'Reduced LGe (2x2)' : 'Full LG (6x6)';
      modeBtn.classList.toggle('is-active', reducedMode);
    }

    function drawMeshPanel(ctx, box, pal) {
      ctx.save();
      roundRectPath(ctx, box.x, box.y, box.w, box.h, 2);
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      drawMathRun(ctx, 'PS6 Mesh [-1,1]x[0,1] (click Ω^e)', box.x + 12, box.y + 18, {
        px: 15,
        weight: 600,
        color: pal.text
      });

      const padX = 34;
      const padT = 46;
      const padB = 42;
      const availW = Math.max(80, box.w - padX * 2);
      const availH = Math.max(60, box.h - padT - padB);
      // Domain aspect ratio is 2:1
      const sc = Math.min(availW / 2, availH / 1);
      const ox = box.x + box.w * 0.5;
      const oy = box.y + padT + (availH + sc) * 0.5;

      function toScr(x, y) {
        return [ox + x * sc, oy - y * sc];
      }

      triPolys = [];
      ELEM_DATA.forEach(function (ed, idx) {
        const col = pal[ed.colorKey];
        const isSel = activeElem === -1 || activeElem === idx;
        const pts = ed.lg.map(function (nid) {
          const nd = NODES[nid - 1];
          return toScr(nd.x, nd.y);
        });
        triPolys.push(pts);

        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.closePath();
        ctx.fillStyle = withAlpha(col, isSel ? (activeElem === -1 ? 0.22 : 0.30) : 0.06);
        ctx.fill();
        ctx.strokeStyle = isSel ? col : withAlpha(pal.textMuted, 0.35);
        ctx.lineWidth = isSel ? 2.2 : 1.1;
        ctx.stroke();

        // Element centroid label
        const cp = toScr(ed.cx, ed.cy);
        drawMathRun(ctx, 'Ω^' + ed.e, cp[0], cp[1], {
          px: 15,
          weight: isSel ? 700 : 500,
          align: 'center',
          color: isSel ? col : pal.textMuted
        });

        // If single element selected, show CCW local indices and grad N_a^e arrows
        if (activeElem === idx) {
          const arrowLen = Math.min(28, sc * 0.24);
          for (let a = 0; a < 3; a++) {
            const gx = ed.grads[a][0];
            const gy = ed.grads[a][1];
            const gmag = Math.hypot(gx, gy) || 1;
            const vx = (gx / gmag) * arrowLen;
            const vy = -(gy / gmag) * arrowLen;
            const anchorX = lerp(cp[0], pts[a][0], 0.36);
            const anchorY = lerp(cp[1], pts[a][1], 0.36);
            drawArrow(ctx, anchorX, anchorY, anchorX + vx, anchorY + vy, col, 1.8, 7);
          }
        }
      });

      // Boundary markers: Gamma_g (left & right vertical edges) vs Gamma_h (top & bottom insulated)
      const p1 = toScr(-1, 0), p2 = toScr(-1, 1), p5 = toScr(1, 0), p6 = toScr(1, 1);
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
      ctx.moveTo(p5[0], p5[1]); ctx.lineTo(p6[0], p6[1]);
      ctx.stroke();

      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(p2[0], p2[1]); ctx.lineTo(p6[0], p6[1]);
      ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p5[0], p5[1]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Boundary legend at bottom of mesh panel
      drawMathRun(ctx, 'Γ_g: Dirichlet (1,2,5,6)', box.x + 12, box.y + box.h - 16, {
        px: 15,
        color: pal.cardinal
      });
      if (box.w >= 330) {
        drawMathRun(ctx, 'Γ_h: ∂_n T = 0', box.x + box.w - 12, box.y + box.h - 16, {
          px: 15,
          align: 'right',
          color: pal.teal
        });
      }

      // Draw 6 nodes
      NODES.forEach(function (nd) {
        const pt = toScr(nd.x, nd.y);
        const isFree = nd.free > 0;
        if (isFree) {
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 10, 0, Math.PI * 2);
          ctx.strokeStyle = pal.amber;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 6, 0, Math.PI * 2);
        ctx.fillStyle = isFree ? pal.amber : pal.surface2;
        ctx.fill();
        ctx.strokeStyle = isFree ? pal.white : pal.cardinal;
        ctx.lineWidth = 2;
        ctx.stroke();

        const offY = nd.y > 0.5 ? -16 : 16;
        const offX = nd.x < -0.5 ? -12 : (nd.x > 0.5 ? 12 : 0);
        setFont(ctx, 15, true, 700);
        ctx.fillStyle = isFree ? pal.amber : pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(nd.id), pt[0] + offX, pt[1] + offY);
      });

      ctx.restore();
    }

    function drawSpyPanel(ctx, box, pal) {
      ctx.save();
      roundRectPath(ctx, box.x, box.y, box.w, box.h, 2);
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const headerTxt = reducedMode ? 'spy(K): Reduced 2x2 Free Block' : 'spy(K): 6x6 Global Scatter';
      drawMathRun(ctx, headerTxt, box.x + 12, box.y + 18, {
        px: 15,
        weight: 600,
        color: pal.text
      });

      const padT = 50;
      const padL = 36;
      const padB = 22;
      const padR = 16;
      const gridSide = Math.max(108, Math.min(box.w - padL - padR, box.h - padT - padB));
      const cell = gridSide / 6;
      const gx0 = box.x + padL + Math.max(0, (box.w - padL - padR - gridSide) * 0.5);
      const gy0 = box.y + padT + Math.max(0, (box.h - padT - padB - gridSide) * 0.5);

      for (let r = 0; r < 6; r++) {
        // Row & column labels (1..6)
        const isFreeIdx = (r === 2 || r === 3);
        setFont(ctx, 15, true, isFreeIdx ? 700 : 400);
        ctx.fillStyle = isFreeIdx ? pal.amber : pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(r + 1), gx0 - 8, gy0 + (r + 0.5) * cell);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(r + 1), gx0 + (r + 0.5) * cell, gy0 - 5);

        for (let c = 0; c < 6; c++) {
          const cx = gx0 + c * cell;
          const cy = gy0 + r * cell;
          const isFreeCell = (r === 2 || r === 3) && (c === 2 || c === 3);
          const contribs = K_CONTRIB[r][c];

          ctx.fillStyle = pal.surface2;
          ctx.fillRect(cx + 1, cy + 1, cell - 2, cell - 2);

          if (contribs.length > 0) {
            const activeContribs = activeElem === -1
              ? contribs
              : contribs.filter(function (ei) { return ei === activeElem; });

            if (activeContribs.length > 0) {
              const stripeW = (cell - 4) / activeContribs.length;
              activeContribs.forEach(function (ei, k) {
                const col = pal[ELEM_DATA[ei].colorKey];
                const alpha = reducedMode && !isFreeCell ? 0.18 : 0.78;
                ctx.fillStyle = withAlpha(col, alpha);
                ctx.fillRect(cx + 2 + k * stripeW, cy + 2, stripeW - 0.5, cell - 4);
              });
            } else {
              // Non-active nonzero entry shown softly
              ctx.fillStyle = withAlpha(pal.textMuted, reducedMode && !isFreeCell ? 0.08 : 0.22);
              ctx.fillRect(cx + 2, cy + 2, cell - 4, cell - 4);
            }
          }
        }
      }

      // Highlight the 2x2 free DOF submatrix (nodes 3, 4 -> indices 2, 3)
      ctx.strokeStyle = pal.amber;
      ctx.lineWidth = reducedMode ? 2.8 : 2.0;
      ctx.strokeRect(gx0 + 2 * cell, gy0 + 2 * cell, 2 * cell, 2 * cell);

      // Outer matrix border
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(gx0, gy0, gridSide, gridSide);

      ctx.restore();
    }

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 490;
      syncStageHeight(stage, 470, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const pal = getPal(api);
      fillStageBg(fit.ctx, fit.w, fit.h, pal);
      updateReadouts();

      const pad = 10;
      if (isNarrow) {
        const topH = Math.floor((fit.h - pad * 3) * 0.48);
        drawMeshPanel(fit.ctx, { x: pad, y: pad, w: fit.w - pad * 2, h: topH }, pal);
        drawSpyPanel(fit.ctx, { x: pad, y: pad * 2 + topH, w: fit.w - pad * 2, h: fit.h - topH - pad * 3 }, pal);
      } else {
        const leftW = Math.floor((fit.w - pad * 3) * 0.53);
        drawMeshPanel(fit.ctx, { x: pad, y: pad, w: leftW, h: fit.h - pad * 2 }, pal);
        drawSpyPanel(fit.ctx, { x: pad * 2 + leftW, y: pad, w: fit.w - leftW - pad * 3, h: fit.h - pad * 2 }, pal);
      }
    }

    function setElem(idx) {
      activeElem = idx;
      elemBtns.forEach(function (item) {
        item.btn.classList.toggle('is-active', item.idx === activeElem);
      });
      draw();
    }

    elemBtns.forEach(function (item) {
      bag.on(item.btn, 'click', function () { setElem(item.idx); });
    });

    bag.on(modeBtn, 'click', function () {
      reducedMode = !reducedMode;
      draw();
    });

    bag.on(canvas, 'click', function (ev) {
      const pt = getPointerPos(canvas, ev);
      for (let i = 0; i < triPolys.length; i++) {
        if (pointInTri(pt.x, pt.y, triPolys[i])) {
          setElem(i);
          return;
        }
      }
    });

    bag.observe(stage, draw);
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 4: heat-fin-solver (Slide 14: Exact Live Solver for Hanfeng's PS9 Fin)
   * ========================================================================== */

  registerLab('heat-fin-solver', function (mountEl, api) {
    const bag = createBag();

    // Exact PS9 vertices (1-indexed IDs)
    const BASE_NODES = [
      { id: 1, x: 0, y: 2, bc: 'left' },
      { id: 2, x: 0, y: 1, bc: 'left' },
      { id: 3, x: 0, y: 0, bc: 'left' },
      { id: 4, x: 3, y: 1, bc: 'top' },
      { id: 5, x: 3, y: 0, bc: 'free' },
      { id: 6, x: 6, y: 0, bc: 'top' }
    ];

    // Exact PS9 CCW connectivity LV = LG
    const BASE_TRIS = [
      [0, 1, 3], // Elem 1: (1, 2, 4)
      [1, 2, 4], // Elem 2: (2, 3, 5)
      [1, 4, 3], // Elem 3: (2, 5, 4)
      [3, 4, 5]  // Elem 4: (4, 5, 6)
    ];

    // Build P2 15-node mesh automatically from the 4 macro-triangles
    const P2_MESH = (function () {
      const nodes = BASE_NODES.map(function (n) {
        return { x: n.x, y: n.y, bc: n.bc, isCorner: true };
      });
      const edgeMap = {};
      function getMid(a, b) {
        const key = a < b ? a + '_' + b : b + '_' + a;
        if (edgeMap[key] !== undefined) return edgeMap[key];
        const na = nodes[a];
        const nb = nodes[b];
        const mx = 0.5 * (na.x + nb.x);
        const my = 0.5 * (na.y + nb.y);
        let bc = 'free';
        if (Math.abs(mx) < 1e-9) bc = 'left';
        else if (Math.abs(mx + 3 * my - 6) < 1e-9) bc = 'top';
        const idx = nodes.length;
        nodes.push({ x: mx, y: my, bc: bc, isCorner: false });
        edgeMap[key] = idx;
        return idx;
      }
      const elems = BASE_TRIS.map(function (t) {
        const m12 = getMid(t[0], t[1]);
        const m23 = getMid(t[1], t[2]);
        const m31 = getMid(t[2], t[0]);
        return [t[0], t[1], t[2], m12, m23, m31];
      });
      return { nodes: nodes, elems: elems };
    })();

    let k3 = 45;
    let k24 = 27;
    let tLeft = 100;
    const tTop = 50;
    const k1 = 14;
    let order = 'p1'; // 'p1' | 'p2'
    let showFlux = true;

    function solveP1(kv, TL) {
      const n = 6;
      const K = [];
      for (let i = 0; i < n; i++) K.push(new Float64Array(n));
      const gradsList = [];

      for (let e = 0; e < 4; e++) {
        const tri = BASE_TRIS[e];
        const p1 = BASE_NODES[tri[0]], p2 = BASE_NODES[tri[1]], p3 = BASE_NODES[tri[2]];
        const twoA = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
        const A = 0.5 * twoA;
        const g = [
          [(p2.y - p3.y) / twoA, (p3.x - p2.x) / twoA],
          [(p3.y - p1.y) / twoA, (p1.x - p3.x) / twoA],
          [(p1.y - p2.y) / twoA, (p2.x - p1.x) / twoA]
        ];
        gradsList.push(g);
        for (let a = 0; a < 3; a++) {
          for (let b = 0; b < 3; b++) {
            K[tri[a]][tri[b]] += kv[e] * A * (g[b][0] * g[a][0] + g[b][1] * g[a][1]);
          }
        }
      }

      // Row 5 (index 4) partition-of-unity row sum check
      let rowSum5 = 0;
      for (let c = 0; c < n; c++) rowSum5 += K[4][c];

      const T = new Float64Array(n);
      T[0] = TL; T[1] = TL; T[2] = TL; T[3] = tTop; T[5] = tTop;
      let rhs = 0;
      for (let c = 0; c < n; c++) {
        if (c !== 4) rhs -= K[4][c] * T[c];
      }
      T[4] = rhs / K[4][4];

      // Centroid temperatures & element constant heat fluxes q^e = -k^e grad T
      const centroids = [];
      const fluxes = [];
      for (let e = 0; e < 4; e++) {
        const tri = BASE_TRIS[e];
        const g = gradsList[e];
        const tc = (T[tri[0]] + T[tri[1]] + T[tri[2]]) / 3;
        const dTdx = g[0][0] * T[tri[0]] + g[1][0] * T[tri[1]] + g[2][0] * T[tri[2]];
        const dTdy = g[0][1] * T[tri[0]] + g[1][1] * T[tri[1]] + g[2][1] * T[tri[2]];
        centroids.push(tc);
        fluxes.push([-kv[e] * dTdx, -kv[e] * dTdy]);
      }

      return { T: T, rowSum5: rowSum5, centroids: centroids, fluxes: fluxes };
    }

    function evalP2Ref(xi, eta) {
      const l1 = 1 - xi - eta, l2 = xi, l3 = eta;
      return {
        N: [
          l1 * (2 * l1 - 1),
          l2 * (2 * l2 - 1),
          l3 * (2 * l3 - 1),
          4 * l1 * l2,
          4 * l2 * l3,
          4 * l3 * l1
        ],
        dxi: [-(4 * l1 - 1), 4 * l2 - 1, 0, 4 * (l1 - l2), 4 * l3, -4 * l3],
        deta: [-(4 * l1 - 1), 0, 4 * l3 - 1, -4 * l2, 4 * l2, 4 * (l1 - l3)]
      };
    }

    function solveP2(kv, TL) {
      const nodes = P2_MESH.nodes;
      const elems = P2_MESH.elems;
      const n = nodes.length; // 15
      const K = [];
      for (let i = 0; i < n; i++) K.push(new Float64Array(n));

      // Exact 3-point degree-2 triangle Gauss rule on reference triangle (area 0.5)
      const gPts = [[1 / 6, 1 / 6], [2 / 3, 1 / 6], [1 / 6, 2 / 3]];
      const gWt = 1 / 6; // sum = 0.5 = reference triangle area

      for (let e = 0; e < 4; e++) {
        const elNodes = elems[e];
        const p1 = nodes[elNodes[0]], p2 = nodes[elNodes[1]], p3 = nodes[elNodes[2]];
        // Straight-sided triangle -> constant affine Jacobian J
        const j11 = p2.x - p1.x, j12 = p3.x - p1.x;
        const j21 = p2.y - p1.y, j22 = p3.y - p1.y;
        const detJ = j11 * j22 - j12 * j21;
        // J^-T entries: d(xi)/dx = j22/detJ, d(eta)/dx = -j21/detJ, d(xi)/dy = -j12/detJ, d(eta)/dy = j11/detJ
        const i11 = j22 / detJ, i12 = -j21 / detJ;
        const i21 = -j12 / detJ, i22 = j11 / detJ;

        for (let q = 0; q < 3; q++) {
          const sh = evalP2Ref(gPts[q][0], gPts[q][1]);
          const gx = new Float64Array(6);
          const gy = new Float64Array(6);
          for (let a = 0; a < 6; a++) {
            gx[a] = i11 * sh.dxi[a] + i12 * sh.deta[a];
            gy[a] = i21 * sh.dxi[a] + i22 * sh.deta[a];
          }
          const wt = kv[e] * gWt * Math.abs(detJ);
          for (let a = 0; a < 6; a++) {
            for (let b = 0; b < 6; b++) {
              K[elNodes[a]][elNodes[b]] += wt * (gx[b] * gx[a] + gy[b] * gy[a]);
            }
          }
        }
      }

      let rowSum5 = 0;
      for (let c = 0; c < n; c++) rowSum5 += K[4][c];

      const T = new Float64Array(n);
      const freeIdx = [];
      for (let i = 0; i < n; i++) {
        if (nodes[i].bc === 'left') T[i] = TL;
        else if (nodes[i].bc === 'top') T[i] = tTop;
        else freeIdx.push(i);
      }

      const nf = freeIdx.length;
      const Afree = [];
      const bfree = new Float64Array(nf);
      for (let r = 0; r < nf; r++) {
        const gi = freeIdx[r];
        Afree.push(new Float64Array(nf));
        let rhs = 0;
        for (let c = 0; c < n; c++) {
          if (nodes[c].bc !== 'free') rhs -= K[gi][c] * T[c];
        }
        bfree[r] = rhs;
        for (let c = 0; c < nf; c++) {
          Afree[r][c] = K[gi][freeIdx[c]];
        }
      }
      const sol = solveDense(Afree, bfree);
      for (let r = 0; r < nf; r++) T[freeIdx[r]] = sol[r];

      // Centroid T_h and heat flux at centroid (xi=1/3, eta=1/3)
      const centroids = [];
      const fluxes = [];
      const shC = evalP2Ref(1 / 3, 1 / 3);
      for (let e = 0; e < 4; e++) {
        const elNodes = elems[e];
        const p1 = nodes[elNodes[0]], p2 = nodes[elNodes[1]], p3 = nodes[elNodes[2]];
        const j11 = p2.x - p1.x, j12 = p3.x - p1.x;
        const j21 = p2.y - p1.y, j22 = p3.y - p1.y;
        const detJ = j11 * j22 - j12 * j21;
        const i11 = j22 / detJ, i12 = -j21 / detJ;
        const i21 = -j12 / detJ, i22 = j11 / detJ;
        let tc = 0, dTdx = 0, dTdy = 0;
        for (let a = 0; a < 6; a++) {
          const val = T[elNodes[a]];
          tc += shC.N[a] * val;
          dTdx += (i11 * shC.dxi[a] + i12 * shC.deta[a]) * val;
          dTdy += (i21 * shC.dxi[a] + i22 * shC.deta[a]) * val;
        }
        centroids.push(tc);
        fluxes.push([-kv[e] * dTdx, -kv[e] * dTdy]);
      }

      return { T: T, rowSum5: rowSum5, centroids: centroids, fluxes: fluxes };
    }

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const btnP1 = el('button', 'lab-pill is-active', 'P1 (6 nodes, 1 free)');
    const btnP2 = el('button', 'lab-pill', 'P2 (15 nodes, 6 free)');
    btnP1.type = 'button';
    btnP2.type = 'button';
    pillGroup.appendChild(btnP1);
    pillGroup.appendChild(btnP2);

    const fluxBtn = el('button', 'lab-pill is-active', 'Flux Vectors');
    fluxBtn.type = 'button';
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(fluxBtn);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const controlsGrid = el('div', 'lab-controls-grid');
    const slK3 = createSliderControl('k^3 (Elem 3)', {
      min: 10, max: 90, step: 1, value: k3,
      format: function (v) { return String(Math.round(v)); }
    }, function (v) { k3 = v; draw(); });
    const slK24 = createSliderControl('k^2 = k^4', {
      min: 10, max: 60, step: 1, value: k24,
      format: function (v) { return String(Math.round(v)); }
    }, function (v) { k24 = v; draw(); });
    const slTL = createSliderControl('T_left (°C)', {
      min: 60, max: 150, step: 1, value: tLeft,
      format: function (v) { return Math.round(v) + '°C'; }
    }, function (v) { tLeft = v; draw(); });
    bag.on(slK3.input, 'input', slK3.handler);
    bag.on(slK24.input, 'input', slK24.handler);
    bag.on(slTL.input, 'input', slTL.handler);
    controlsGrid.appendChild(slK3.wrap);
    controlsGrid.appendChild(slK24.wrap);
    controlsGrid.appendChild(slTL.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rU5 = createReadoutChip('u_5 (Node 5)', '51.923°C');
    const rSum = createReadoutChip('Row Sum ΣK_5B', '0.00');
    const rC3 = createReadoutChip('T_h(x̄^3)', '67.31°C');
    const rFlux = createReadoutChip('Peak |q|', '0.0');
    readouts.appendChild(rU5.chip);
    readouts.appendChild(rSum.chip);
    readouts.appendChild(rC3.chip);
    readouts.appendChild(rFlux.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controlsGrid);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 460;
      syncStageHeight(stage, 310, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = getPal(api);
      fillStageBg(ctx, w, h, pal);

      const kv = [k1, k24, k3, k24];
      const res = order === 'p1' ? solveP1(kv, tLeft) : solveP2(kv, tLeft);

      const tMin = Math.min(tTop, tLeft);
      const tMax = Math.max(tTop, tLeft);
      const tSpan = Math.max(1e-6, tMax - tMin);

      // Map fin domain [0, 6] x [0, 2] nicely inside canvas
      const padL = 46;
      const padR = 26;
      const padT = 36;
      const padB = 56;
      const availW = Math.max(120, w - padL - padR);
      const availH = Math.max(90, h - padT - padB);
      const sc = Math.min(availW / 6, availH / 2);
      const ox = padL + (availW - 6 * sc) * 0.5;
      const oy = padT + (availH + 2 * sc) * 0.5;

      function toScr(x, y) {
        return [ox + x * sc, oy - y * sc];
      }

      // Smooth barycentric sub-triangle temperature shading
      const sub = order === 'p1' ? 6 : 8;
      for (let e = 0; e < 4; e++) {
        const tri = BASE_TRIS[e];
        const p1 = BASE_NODES[tri[0]], p2 = BASE_NODES[tri[1]], p3 = BASE_NODES[tri[2]];
        const elP2 = P2_MESH.elems[e];

        function evalT(xi, eta) {
          if (order === 'p1') {
            return (1 - xi - eta) * res.T[tri[0]] + xi * res.T[tri[1]] + eta * res.T[tri[2]];
          }
          const sh = evalP2Ref(xi, eta);
          let val = 0;
          for (let a = 0; a < 6; a++) val += sh.N[a] * res.T[elP2[a]];
          return val;
        }
        function mapXY(xi, eta) {
          return toScr(
            (1 - xi - eta) * p1.x + xi * p2.x + eta * p3.x,
            (1 - xi - eta) * p1.y + xi * p2.y + eta * p3.y
          );
        }

        for (let i = 0; i < sub; i++) {
          for (let j = 0; j < sub - i; j++) {
            const fillSub = function (a, b, c) {
              const tc = evalT((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3);
              const sa = mapXY(a[0], a[1]);
              const sb = mapXY(b[0], b[1]);
              const scPt = mapXY(c[0], c[1]);
              ctx.beginPath();
              ctx.moveTo(sa[0], sa[1]);
              ctx.lineTo(sb[0], sb[1]);
              ctx.lineTo(scPt[0], scPt[1]);
              ctx.closePath();
              ctx.fillStyle = thermalColor((tc - tMin) / tSpan, pal, pal.theme === 'dark' ? 0.72 : 0.62);
              ctx.fill();
            };
            const a = [i / sub, j / sub];
            const b = [(i + 1) / sub, j / sub];
            const c = [i / sub, (j + 1) / sub];
            fillSub(a, b, c);
            if (i + j + 1 < sub) fillSub(b, [(i + 1) / sub, (j + 1) / sub], c);
          }
        }

        // Element outline
        const s1 = toScr(p1.x, p1.y), s2 = toScr(p2.x, p2.y), s3 = toScr(p3.x, p3.y);
        ctx.beginPath();
        ctx.moveTo(s1[0], s1[1]);
        ctx.lineTo(s2[0], s2[1]);
        ctx.lineTo(s3[0], s3[1]);
        ctx.closePath();
        ctx.strokeStyle = withAlpha(pal.white, pal.theme === 'dark' ? 0.55 : 0.72);
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // Boundary overlays
      const n1 = toScr(0, 2), n3 = toScr(0, 0), n6 = toScr(6, 0);
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(n1[0], n1[1]); ctx.lineTo(n3[0], n3[1]);
      ctx.stroke();

      ctx.strokeStyle = pal.blue;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(n1[0], n1[1]); ctx.lineTo(n6[0], n6[1]);
      ctx.stroke();

      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(n3[0], n3[1]); ctx.lineTo(n6[0], n6[1]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Optional flux vectors & centroid readouts
      let peakFlux = 0;
      for (let e = 0; e < 4; e++) {
        const qm = Math.hypot(res.fluxes[e][0], res.fluxes[e][1]);
        if (qm > peakFlux) peakFlux = qm;
      }

      for (let e = 0; e < 4; e++) {
        const tri = BASE_TRIS[e];
        const cx = (BASE_NODES[tri[0]].x + BASE_NODES[tri[1]].x + BASE_NODES[tri[2]].x) / 3;
        const cy = (BASE_NODES[tri[0]].y + BASE_NODES[tri[1]].y + BASE_NODES[tri[2]].y) / 3;
        const sp = toScr(cx, cy);

        if (showFlux && peakFlux > 1e-6) {
          const qx = res.fluxes[e][0];
          const qy = res.fluxes[e][1];
          const qm = Math.hypot(qx, qy);
          const len = clamp((qm / peakFlux) * sc * 0.65, 14, sc * 0.75);
          const ux = qx / (qm || 1);
          const uy = -qy / (qm || 1);
          const arrowCol = pal.theme === 'dark' ? pal.white : pal.text;
          drawArrow(ctx, sp[0] - ux * len * 0.35, sp[1] - uy * len * 0.35, sp[0] + ux * len * 0.65, sp[1] + uy * len * 0.65, arrowCol, 2.3, 8);
        }

        // Centroid temperature tag on larger viewports
        if (sc >= 54) {
          const tagY = e === 2 ? sp[1] - 12 : sp[1] + 15;
          drawMathRun(ctx, res.centroids[e].toFixed(1) + '°', sp[0], tagY, {
            px: 15,
            mono: true,
            align: 'center',
            color: pal.text,
            bg: withAlpha(pal.bg, 0.76),
            padX: 4,
            padY: 1
          });
        }
      }

      // Draw P2 mid-edge nodes if active
      if (order === 'p2') {
        for (let i = 6; i < P2_MESH.nodes.length; i++) {
          const nd = P2_MESH.nodes[i];
          const sp = toScr(nd.x, nd.y);
          ctx.beginPath();
          ctx.arc(sp[0], sp[1], 4.5, 0, Math.PI * 2);
          ctx.fillStyle = nd.bc === 'free' ? pal.amber : pal.surface;
          ctx.fill();
          ctx.strokeStyle = pal.text;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      // Draw 6 primary vertices and highlight free Node 5
      BASE_NODES.forEach(function (nd, idx) {
        const sp = toScr(nd.x, nd.y);
        const isNode5 = idx === 4;
        if (isNode5) {
          ctx.beginPath();
          ctx.arc(sp[0], sp[1], 11, 0, Math.PI * 2);
          ctx.strokeStyle = pal.amber;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(sp[0], sp[1], 6, 0, Math.PI * 2);
        ctx.fillStyle = isNode5 ? pal.amber : (nd.bc === 'left' ? pal.cardinal : pal.blue);
        ctx.fill();
        ctx.strokeStyle = pal.white;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Crisp non-overlapping vertex numbers
        const oxN = nd.x === 0 ? -16 : (idx === 5 ? 14 : (idx === 3 ? 12 : 0));
        const oyN = idx === 4 ? 19 : (idx === 3 ? -14 : (idx === 0 ? -12 : 0));
        setFont(ctx, 15, true, 700);
        ctx.fillStyle = isNode5 ? pal.amber : pal.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(nd.id), sp[0] + oxN, sp[1] + oyN);
      });

      // Top thermal colorbar strip (with generous right margin for 100° / 150° tick)
      const barW = Math.min(132, Math.max(72, w * 0.24));
      const barH = 10;
      const barX = w - barW - 50;
      const barY = 12;
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = thermalColor(i / 39, pal, 0.9);
        ctx.fillRect(barX + (i / 40) * barW, barY, barW / 40 + 1, barH);
      }
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      setFont(ctx, 15, true, 500);
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(tMin.toFixed(0) + '°', barX - 6, barY + 5);
      ctx.textAlign = 'left';
      ctx.fillText(tMax.toFixed(0) + '°', barX + barW + 5, barY + 5);

      // Header left label (compact on narrow widths so it clears the colorbar)
      const hdrTxt = w < 520
        ? 'Γ_{g1}=' + Math.round(tLeft) + '° · Γ_{g2}=50°'
        : 'Γ_{g1}=' + Math.round(tLeft) + '°C · Γ_{g2}=50°C · Γ_h: q·n=0';
      drawMathRun(ctx, hdrTxt, 12, 16, {
        px: 15,
        weight: 600,
        color: pal.text
      });

      // Bottom legend: conductivities
      drawMathRun(ctx, 'k^e = {' + k1 + ', ' + Math.round(k24) + ', ' + Math.round(k3) + ', ' + Math.round(k24) + '}   |   u_5 = ' + res.T[4].toFixed(3) + '°C', 12, h - 14, {
        px: 15,
        mono: true,
        color: pal.textMuted
      });

      // Update readout chips
      const isDefaultP1 = order === 'p1' && Math.round(k3) === 45 && Math.round(k24) === 27 && Math.round(tLeft) === 100;
      rU5.valEl.textContent = isDefaultP1 ? '51.923°C (675/13)' : res.T[4].toFixed(3) + '°C';
      rSum.valEl.textContent = Math.abs(res.rowSum5) < 1e-10 ? '0.00' : res.rowSum5.toExponential(1);
      rC3.valEl.textContent = res.centroids[2].toFixed(2) + '°C';
      rFlux.valEl.textContent = peakFlux.toFixed(1) + ' W/m²';
    }

    bag.on(btnP1, 'click', function () {
      order = 'p1';
      btnP1.classList.add('is-active');
      btnP2.classList.remove('is-active');
      draw();
    });
    bag.on(btnP2, 'click', function () {
      order = 'p2';
      btnP2.classList.add('is-active');
      btnP1.classList.remove('is-active');
      draw();
    });
    bag.on(fluxBtn, 'click', function () {
      showFlux = !showFlux;
      fluxBtn.classList.toggle('is-active', showFlux);
      draw();
    });

    bag.observe(stage, draw);
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 5: elasticity-locking-lab (Slide 15: Real 2D Plane-Strain Cantilever)
   * ========================================================================== */

  registerLab('elasticity-locking-lab', function (mountEl, api) {
    const bag = createBag();

    const L = 4.0;
    const H = 1.0;
    const E = 1000.0;
    const P_LOAD = 1.0;
    const NX = 6;
    const NY = 2;
    const NNX = NX + 1;
    const NNY = NY + 1;
    const N_NODES = NNX * NNY; // 21 nodes
    const N_DOFS = N_NODES * 2; // 42 DOFs

    function nodeIdx(ix, iy) {
      return iy * NNX + ix;
    }

    function timoshenkoRef(nu) {
      const Ep = E / (1 - nu * nu);
      const I = (H * H * H) / 12;
      const G = E / (2 * (1 + nu));
      const wBend = (P_LOAD * L * L * L) / (3 * Ep * I);
      const wShear = (6 * P_LOAD * L) / (5 * G * H);
      return wBend + wShear;
    }

    function solveCantilever(nu, useSRI) {
      const mu = E / (2 * (1 + nu));
      const lam = (E * nu) / ((1 + nu) * (1 - 2 * nu));
      const dx = L / NX;
      const dy = H / NY;
      const detJ = 0.25 * dx * dy;

      const K = [];
      for (let i = 0; i < N_DOFS; i++) K.push(new Float64Array(N_DOFS));
      const F = new Float64Array(N_DOFS);

      const gp = 1 / Math.sqrt(3);
      const g2x2 = [[-gp, -gp], [gp, -gp], [gp, gp], [-gp, gp]];
      const g1x1 = [[0, 0]];

      function evalB(xi, eta) {
        const dxi = [
          -0.25 * (1 - eta),
          0.25 * (1 - eta),
          0.25 * (1 + eta),
          -0.25 * (1 + eta)
        ];
        const deta = [
          -0.25 * (1 - xi),
          -0.25 * (1 + xi),
          0.25 * (1 + xi),
          0.25 * (1 - xi)
        ];
        // 3 x 8 strain-displacement matrix flattened row-major
        const B0 = new Float64Array(8); // exx
        const B1 = new Float64Array(8); // eyy
        const B2 = new Float64Array(8); // gxy
        const invX = 2 / dx;
        const invY = 2 / dy;
        for (let a = 0; a < 4; a++) {
          const dNx = dxi[a] * invX;
          const dNy = deta[a] * invY;
          B0[2 * a] = dNx;
          B1[2 * a + 1] = dNy;
          B2[2 * a] = dNy;
          B2[2 * a + 1] = dNx;
        }
        return [B0, B1, B2];
      }

      // Compute single rectangle element stiffness ke (8x8) identically for all elements
      const ke = [];
      for (let i = 0; i < 8; i++) ke.push(new Float64Array(8));

      // Deviatoric / shear part D_mu: always 2x2 Gauss (weight 1 each)
      for (let q = 0; q < g2x2.length; q++) {
        const B = evalB(g2x2[q][0], g2x2[q][1]);
        const wt = detJ;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            ke[r][c] += wt * mu * (2 * B[0][r] * B[0][c] + 2 * B[1][r] * B[1][c] + B[2][r] * B[2][c]);
          }
        }
      }

      // Volumetric part D_lambda: 1x1 centroid (weight 4) for SRI, 2x2 Gauss (weight 1 each) for Full Q4
      const vPts = useSRI ? g1x1 : g2x2;
      const vWt = useSRI ? 4.0 * detJ : detJ;
      for (let q = 0; q < vPts.length; q++) {
        const B = evalB(vPts[q][0], vPts[q][1]);
        for (let r = 0; r < 8; r++) {
          const divR = B[0][r] + B[1][r];
          for (let c = 0; c < 8; c++) {
            ke[r][c] += vWt * lam * divR * (B[0][c] + B[1][c]);
          }
        }
      }

      // Scatter into global K
      for (let iy = 0; iy < NY; iy++) {
        for (let ix = 0; ix < NX; ix++) {
          const nds = [
            nodeIdx(ix, iy),
            nodeIdx(ix + 1, iy),
            nodeIdx(ix + 1, iy + 1),
            nodeIdx(ix, iy + 1)
          ];
          const dofs = [
            2 * nds[0], 2 * nds[0] + 1,
            2 * nds[1], 2 * nds[1] + 1,
            2 * nds[2], 2 * nds[2] + 1,
            2 * nds[3], 2 * nds[3] + 1
          ];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              K[dofs[r]][dofs[c]] += ke[r][c];
            }
          }
        }
      }

      // Consistent uniform downward shear traction on right edge (ix = NX)
      const tipWts = [0.25, 0.50, 0.25];
      for (let iy = 0; iy < NNY; iy++) {
        const nd = nodeIdx(NX, iy);
        F[2 * nd + 1] = -P_LOAD * tipWts[iy];
      }

      // Eliminate clamped left edge (ix = 0, all iy)
      const freeDofs = [];
      for (let iy = 0; iy < NNY; iy++) {
        for (let ix = 1; ix < NNX; ix++) {
          const nd = nodeIdx(ix, iy);
          freeDofs.push(2 * nd, 2 * nd + 1);
        }
      }

      const nf = freeDofs.length;
      const Kf = [];
      const Ff = new Float64Array(nf);
      for (let r = 0; r < nf; r++) {
        Kf.push(new Float64Array(nf));
        Ff[r] = F[freeDofs[r]];
        for (let c = 0; c < nf; c++) {
          Kf[r][c] = K[freeDofs[r]][freeDofs[c]];
        }
      }

      const Uf = solveDense(Kf, Ff);
      const U = new Float64Array(N_DOFS);
      for (let r = 0; r < nf; r++) U[freeDofs[r]] = Uf[r];

      // Mean tip downward deflection magnitude
      let wTip = 0;
      for (let iy = 0; iy < NNY; iy++) {
        wTip += -U[2 * nodeIdx(NX, iy) + 1] * tipWts[iy];
      }
      const wRef = timoshenkoRef(nu);
      return { U: U, wTip: wTip, wRef: wRef, ratio: wTip / wRef, lamMu: lam / mu };
    }

    // Precompute exact locking sweep curve across nu in [0.25, 0.4995]
    const NU_SWEEP = [
      0.25, 0.28, 0.30, 0.33, 0.36, 0.39, 0.42, 0.44, 0.45, 0.465,
      0.475, 0.482, 0.488, 0.492, 0.495, 0.497, 0.4985, 0.499, 0.4995
    ];
    const SWEEP_DATA = NU_SWEEP.map(function (nv) {
      const full = solveCantilever(nv, false);
      const sri = solveCantilever(nv, true);
      return { nu: nv, rFull: full.ratio, rSRI: sri.ratio };
    });

    let nuVal = 0.499;

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const presets = [
      { label: '0.30 Steel', val: 0.30 },
      { label: '0.45 Polymer', val: 0.45 },
      { label: '0.499 Rubber', val: 0.499 }
    ];
    const presetBtns = presets.map(function (p) {
      const b = el('button', 'lab-pill' + (Math.abs(p.val - nuVal) < 1e-4 ? ' is-active' : ''), p.label);
      b.type = 'button';
      pillGroup.appendChild(b);
      return { val: p.val, btn: b };
    });

    const badgeEl = el('span', 'lab-badge-status is-danger', 'VOLUMETRIC LOCKING');
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(badgeEl);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const controlsGrid = el('div', 'lab-controls-grid');
    const slNu = createSliderControl('Poisson Ratio ν (plane strain)', {
      min: 0.25,
      max: 0.4995,
      step: 0.0005,
      value: nuVal,
      format: function (v) { return v.toFixed(4); }
    }, function (v) {
      nuVal = v;
      syncPresets();
      draw();
    });
    bag.on(slNu.input, 'input', slNu.handler);
    controlsGrid.appendChild(slNu.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rLamMu = createReadoutChip('λ / μ', '499.0');
    const rFull = createReadoutChip('Full Q4 w/w_ref', '0.03');
    const rSRI = createReadoutChip('SRI Q4 w/w_ref', '0.88');
    readouts.appendChild(rLamMu.chip);
    readouts.appendChild(rFull.chip);
    readouts.appendChild(rSRI.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controlsGrid);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function syncPresets() {
      presetBtns.forEach(function (item) {
        item.btn.classList.toggle('is-active', Math.abs(item.val - nuVal) < 0.0012);
      });
    }

    function drawMeshOverlay(ctx, U, dispScale, ox, oy, sc, strokeCol, fillCol, lw) {
      const dx = L / NX;
      const dy = H / NY;
      ctx.save();
      for (let iy = 0; iy < NY; iy++) {
        for (let ix = 0; ix < NX; ix++) {
          const nds = [
            nodeIdx(ix, iy),
            nodeIdx(ix + 1, iy),
            nodeIdx(ix + 1, iy + 1),
            nodeIdx(ix, iy + 1)
          ];
          const coords = [
            [ix * dx, iy * dy],
            [(ix + 1) * dx, iy * dy],
            [(ix + 1) * dx, (iy + 1) * dy],
            [ix * dx, (iy + 1) * dy]
          ];
          ctx.beginPath();
          for (let a = 0; a < 4; a++) {
            const nd = nds[a];
            const px = ox + (coords[a][0] + U[2 * nd] * dispScale) * sc;
            const py = oy - (coords[a][1] + U[2 * nd + 1] * dispScale) * sc;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          if (fillCol) {
            ctx.fillStyle = fillCol;
            ctx.fill();
          }
          ctx.strokeStyle = strokeCol;
          ctx.lineWidth = lw;
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 460;
      syncStageHeight(stage, 410, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = getPal(api);
      fillStageBg(ctx, w, h, pal);

      const fullSol = solveCantilever(nuVal, false);
      const sriSol = solveCantilever(nuVal, true);

      // Update readouts & status badge
      rLamMu.valEl.textContent = fullSol.lamMu.toFixed(1);
      rFull.valEl.textContent = fullSol.ratio.toFixed(3);
      rSRI.valEl.textContent = sriSol.ratio.toFixed(3);
      if (fullSol.ratio < 0.25) {
        setStatusBadge(badgeEl, 'SEVERE LOCKING (Full Q4 freezes)', 'danger');
      } else if (fullSol.ratio < 0.65) {
        setStatusBadge(badgeEl, 'VOLUMETRIC STIFFENING', 'warn');
      } else {
        setStatusBadge(badgeEl, 'COMPRESSIBLE REGIME', 'safe');
      }

      const padL = 56;
      const padR = 20;
      const padT = 26;
      const midGap = 34;
      const padB = 34;
      const topH = Math.floor((h - padT - midGap - padB) * 0.52);
      const botY = padT + topH + midGap;
      const botH = Math.max(76, h - botY - padB);
      const plotW = Math.max(120, w - padL - padR);

      // Top panel: Deformed cantilever comparison
      ctx.fillStyle = pal.surface;
      ctx.fillRect(padL, padT, plotW, topH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, topH);

      const beamSc = Math.min((plotW - 56) / L, (topH - 28) / 2.25);
      const ox = padL + 26;
      const oy = padT + 18 + H * beamSc;
      const dispScale = 1.05 / Math.max(0.08, sriSol.wRef);

      // Clamped wall hatch on left
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(ox, oy - H * beamSc - 12);
      ctx.lineTo(ox, oy + 18);
      ctx.stroke();
      ctx.lineWidth = 1.1;
      for (let yy = oy - H * beamSc - 8; yy <= oy + 14; yy += 8) {
        ctx.beginPath();
        ctx.moveTo(ox, yy);
        ctx.lineTo(ox - 8, yy + 6);
        ctx.stroke();
      }

      // Undeformed outline
      ctx.strokeStyle = withAlpha(pal.textMuted, 0.45);
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(ox, oy - H * beamSc, L * beamSc, H * beamSc);
      ctx.setLineDash([]);

      // Draw SRI Q4 (Teal, bends smoothly) first, then Full Q4 (Cardinal, locks flat)
      drawMeshOverlay(ctx, sriSol.U, dispScale, ox, oy, beamSc, pal.teal, withAlpha(pal.teal, 0.16), 1.8);
      drawMeshOverlay(ctx, fullSol.U, dispScale, ox, oy, beamSc, pal.cardinal, withAlpha(pal.cardinal, 0.16), 1.9);

      // Tip load arrow P
      const tipX = ox + L * beamSc + 10;
      drawArrow(ctx, tipX, oy - H * beamSc - 4, tipX, oy + 12, pal.amber, 2.2, 8);
      setFont(ctx, 15, true, 600);
      ctx.fillStyle = pal.amber;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', tipX + 4, oy - H * beamSc * 0.3);

      // Top panel title & color key
      drawMathRun(ctx, '6x2 Q4 Cantilever: SRI (teal) vs Full Q4 (red)', padL, padT - 12, {
        px: 15,
        weight: 600,
        color: pal.text
      });

      // Bottom panel: Normalized tip deflection w / w_ref vs nu
      ctx.fillStyle = pal.surface;
      ctx.fillRect(padL, botY, plotW, botH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, botY, plotW, botH);

      function xNu(nv) { return padL + ((nv - 0.25) / (0.50 - 0.25)) * plotW; }
      function yRat(rv) { return botY + botH - (clamp(rv, 0, 1.05) / 1.05) * botH; }

      [0.0, 0.5, 1.0].forEach(function (rv) {
        const py = yRat(rv);
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(rv.toFixed(1), padL - 7, py);
      });

      [0.25, 0.35, 0.45, 0.50].forEach(function (nv) {
        const px = xNu(nv);
        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(nv.toFixed(2), px, botY + botH + 7);
      });

      // SRI curve (Teal)
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      SWEEP_DATA.forEach(function (pt, i) {
        const px = xNu(pt.nu), py = yRat(pt.rSRI);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Full Q4 curve (Cardinal)
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      SWEEP_DATA.forEach(function (pt, i) {
        const px = xNu(pt.nu), py = yRat(pt.rFull);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Live vertical cursor at nuVal
      const cx = xNu(nuVal);
      ctx.strokeStyle = pal.amber;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, botY);
      ctx.lineTo(cx, botY + botH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Live markers
      [
        { y: yRat(sriSol.ratio), col: pal.teal },
        { y: yRat(fullSol.ratio), col: pal.cardinal }
      ].forEach(function (m) {
        ctx.beginPath();
        ctx.arc(cx, m.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = m.col;
        ctx.fill();
        ctx.strokeStyle = pal.white;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      drawMathRun(ctx, 'Tip Deflection Ratio w / w_{ref} vs. Poisson ν', padL, botY - 12, {
        px: 15,
        weight: 600,
        color: pal.text
      });
    }

    presetBtns.forEach(function (item) {
      bag.on(item.btn, 'click', function () {
        nuVal = item.val;
        slNu.setValue(nuVal);
        syncPresets();
        draw();
      });
    });

    bag.observe(stage, draw);
    syncPresets();
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 6: constraints-ufl-lab (Slide 16: Penalty vs LM + Week 7 Poisson)
   * ========================================================================== */

  registerLab('constraints-ufl-lab', function (mountEl, api) {
    const bag = createBag();

    let tab = 'constraints'; // 'constraints' | 'poisson'
    let logBeta = 5.0; // beta = 10^logBeta
    let uflMode = 'fenics'; // 'firedrake' | 'fenics'
    let probeX = 0.25;
    let probeY = 0.25;
    let gridBox = { x: 0, y: 0, side: 1 };

    // --- Tab 1: Real 1D 6-element bar (-u'' = 2, u(0) = g = 1, u'(1) = 0) ---
    const N_BAR = 6;
    const NN_BAR = N_BAR + 1; // 7 nodes
    const H_BAR = 1.0 / N_BAR;
    const G_TARGET = 1.0;

    function build1DBarSystem() {
      const K = [];
      for (let i = 0; i < NN_BAR; i++) K.push(new Float64Array(NN_BAR));
      const F = new Float64Array(NN_BAR);
      for (let e = 0; e < N_BAR; e++) {
        K[e][e] += 1 / H_BAR;
        K[e][e + 1] -= 1 / H_BAR;
        K[e + 1][e] -= 1 / H_BAR;
        K[e + 1][e + 1] += 1 / H_BAR;
        // f(x) = 2 -> integral on element = 2 * H_BAR, split H_BAR to each node
        F[e] += H_BAR;
        F[e + 1] += H_BAR;
      }
      return { K: K, F: F };
    }

    const BAR_SYS = build1DBarSystem();

    // Exact Lagrange Multiplier saddle-point solve (8x8)
    const LM_SOL = (function () {
      const m = NN_BAR + 1;
      const A = [];
      for (let i = 0; i < m; i++) A.push(new Float64Array(m));
      const b = new Float64Array(m);
      for (let i = 0; i < NN_BAR; i++) {
        for (let j = 0; j < NN_BAR; j++) A[i][j] = BAR_SYS.K[i][j];
        b[i] = BAR_SYS.F[i];
      }
      A[0][NN_BAR] = 1;
      A[NN_BAR][0] = 1;
      b[NN_BAR] = G_TARGET;
      const x = solveDense(A, b);
      return { U: x.slice(0, NN_BAR), lam: x[NN_BAR] };
    })();

    function solvePenalty(pExp) {
      const beta = Math.pow(10, pExp);
      const K = [];
      for (let i = 0; i < NN_BAR; i++) {
        K.push(Float64Array.from(BAR_SYS.K[i]));
      }
      const F = Float64Array.from(BAR_SYS.F);
      K[0][0] += beta;
      F[0] += beta * G_TARGET;

      const U = solveDense(K, F);
      const bcErr = Math.abs(U[0] - G_TARGET);
      let maxSolErr = 0;
      for (let i = 0; i < NN_BAR; i++) {
        const d = Math.abs(U[i] - LM_SOL.U[i]);
        if (d > maxSolErr) maxSolErr = d;
      }

      // Compute real condition number kappa(K_beta) = lam_max / lam_min via power & inverse iteration
      let v = new Float64Array(NN_BAR);
      v[0] = 1;
      for (let it = 0; it < 28; it++) {
        const w = new Float64Array(NN_BAR);
        let nrm = 0;
        for (let i = 0; i < NN_BAR; i++) {
          let s = 0;
          for (let j = 0; j < NN_BAR; j++) s += K[i][j] * v[j];
          w[i] = s;
          nrm += s * s;
        }
        nrm = Math.sqrt(nrm) || 1;
        for (let i = 0; i < NN_BAR; i++) v[i] = w[i] / nrm;
      }
      let lamMax = 0;
      for (let i = 0; i < NN_BAR; i++) {
        let s = 0;
        for (let j = 0; j < NN_BAR; j++) s += K[i][j] * v[j];
        lamMax += v[i] * s;
      }

      let u = new Float64Array(NN_BAR);
      for (let i = 0; i < NN_BAR; i++) u[i] = (i + 1) / NN_BAR;
      for (let it = 0; it < 18; it++) {
        const w = solveDense(K, u);
        let nrm = 0;
        for (let i = 0; i < NN_BAR; i++) nrm += w[i] * w[i];
        nrm = Math.sqrt(nrm) || 1;
        for (let i = 0; i < NN_BAR; i++) u[i] = w[i] / nrm;
      }
      let lamMin = 0;
      for (let i = 0; i < NN_BAR; i++) {
        let s = 0;
        for (let j = 0; j < NN_BAR; j++) s += K[i][j] * u[j];
        lamMin += u[i] * s;
      }
      const kappa = lamMax / Math.max(1e-12, lamMin);
      return { beta: beta, bcErr: bcErr, maxSolErr: maxSolErr, kappa: kappa, U: U };
    }

    const PEN_SWEEP = [];
    for (let p = 0; p <= 12; p += 0.5) {
      PEN_SWEEP.push({ p: p, res: solvePenalty(p) });
    }

    // --- Tab 2: Live 2D P1 Poisson Solver on [-1, 1]^2 (16x16 grid = 17x17 nodes) ---
    const M_GRID = 16;
    const UNIT_POISSON = (function () {
      // Solve -Delta u = 1 on [-1, 1]^2 with u = 0 on boundary using Red-Black SOR
      const N = M_GRID + 1;
      const h = 2.0 / M_GRID;
      const h2 = h * h;
      const u = new Float64Array(N * N);
      const omega = 1.68;
      for (let sweep = 0; sweep < 140; sweep++) {
        let maxDiff = 0;
        for (let parity = 0; parity < 2; parity++) {
          for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
              if (((i + j) & 1) !== parity) continue;
              const idx = j * N + i;
              const gs = 0.25 * (u[idx - 1] + u[idx + 1] + u[idx - N] + u[idx + N] + h2);
              const nv = u[idx] + omega * (gs - u[idx]);
              const diff = Math.abs(nv - u[idx]);
              if (diff > maxDiff) maxDiff = diff;
              u[idx] = nv;
            }
          }
        }
        if (maxDiff < 1e-11) break;
      }
      return u;
    })();

    function evalUnitPoisson(x, y) {
      const N = M_GRID + 1;
      const fx = clamp((x + 1) * 0.5 * M_GRID, 0, M_GRID - 1e-9);
      const fy = clamp((y + 1) * 0.5 * M_GRID, 0, M_GRID - 1e-9);
      const i = Math.floor(fx);
      const j = Math.floor(fy);
      const tx = fx - i;
      const ty = fy - j;
      // Linear interpolation on split P1 triangles (diagonal from (i,j) to (i+1,j+1))
      const u00 = UNIT_POISSON[j * N + i];
      const u10 = UNIT_POISSON[j * N + (i + 1)];
      const u01 = UNIT_POISSON[(j + 1) * N + i];
      const u11 = UNIT_POISSON[(j + 1) * N + (i + 1)];
      if (tx >= ty) {
        return u00 + tx * (u10 - u00) + ty * (u11 - u10);
      }
      return u00 + ty * (u01 - u00) + tx * (u11 - u01);
    }

    function scalePoisson(unitVal) {
      if (uflMode === 'firedrake') return unitVal; // k=1, f=1, u_D=0
      // FEniCS: k=2e-4, f=0.2, u_D=1000 => f/k = 1000
      return 1000.0 + 1000.0 * unitVal;
    }

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const mainTabs = el('div', 'lab-pill-group');
    const btnTabCon = el('button', 'lab-pill is-active', 'Penalty vs Lagrange Mult.');
    const btnTabPoi = el('button', 'lab-pill', 'Week 7 Poisson [-1,1]^2');
    btnTabCon.type = 'button';
    btnTabPoi.type = 'button';
    mainTabs.appendChild(btnTabCon);
    mainTabs.appendChild(btnTabPoi);

    const subTabs = el('div', 'lab-pill-group');
    const btnFiredrake = el('button', 'lab-pill', 'Firedrake (k=1, f=1)');
    const btnFenics = el('button', 'lab-pill is-active', 'FEniCS (k=2e-4, u=1000)');
    btnFiredrake.type = 'button';
    btnFenics.type = 'button';
    subTabs.appendChild(btnFiredrake);
    subTabs.appendChild(btnFenics);

    const badgeEl = el('span', 'lab-badge-status is-safe', 'OPTIMAL WINDOW');
    toolbar.appendChild(mainTabs);
    toolbar.appendChild(subTabs);
    toolbar.appendChild(badgeEl);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const controlsGrid = el('div', 'lab-controls-grid');
    const slBeta = createSliderControl('Penalty β = 10^p (exponent p)', {
      min: 0,
      max: 12,
      step: 0.25,
      value: logBeta,
      format: function (v) { return '10^' + v.toFixed(2); }
    }, function (v) {
      logBeta = v;
      draw();
    });
    bag.on(slBeta.input, 'input', slBeta.handler);
    controlsGrid.appendChild(slBeta.wrap);

    const readouts = el('div', 'lab-readout-row');
    const r1 = createReadoutChip('Penalty β', '1.0e+5');
    const r2 = createReadoutChip('|u_h(0) - g|', '2.0e-5');
    const r3 = createReadoutChip('κ(K_β)', '2.1e+5');
    const r4 = createReadoutChip('LM Reaction λ', '2.000');
    readouts.appendChild(r1.chip);
    readouts.appendChild(r2.chip);
    readouts.appendChild(r3.chip);
    readouts.appendChild(r4.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controlsGrid);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function syncTabUi() {
      const isCon = tab === 'constraints';
      btnTabCon.classList.toggle('is-active', isCon);
      btnTabPoi.classList.toggle('is-active', !isCon);
      subTabs.style.display = isCon ? 'none' : 'flex';
      badgeEl.style.display = isCon ? 'inline-flex' : 'none';
      controlsGrid.style.display = isCon ? '' : 'none';
      btnFiredrake.classList.toggle('is-active', uflMode === 'firedrake');
      btnFenics.classList.toggle('is-active', uflMode === 'fenics');
    }

    function drawConstraintsTab(ctx, w, h, pal) {
      const cur = solvePenalty(logBeta);
      const padL = 62;
      const padR = 62;
      const padT = 34;
      const padB = 38;
      const plotW = Math.max(120, w - padL - padR);
      const plotH = Math.max(120, h - padT - padB);

      ctx.fillStyle = pal.surface;
      ctx.fillRect(padL, padT, plotW, plotH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, plotH);

      function xP(p) { return padL + (p / 12) * plotW; }
      function yErr(lg) { return padT + plotH - ((clamp(lg, -13, 1) - (-13)) / 14) * plotH; }
      function yKap(lg) { return padT + plotH - ((clamp(lg, 0, 14) - 0) / 14) * plotH; }

      // Shaded optimal sweet-spot window (10^4 .. 10^8)
      const sx1 = xP(4), sx2 = xP(8);
      ctx.fillStyle = withAlpha(pal.teal, 0.09);
      ctx.fillRect(sx1, padT, sx2 - sx1, plotH);
      setFont(ctx, 15, false, 600);
      ctx.fillStyle = pal.teal;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Sweet Spot', (sx1 + sx2) * 0.5, padT + 6);

      // Horizontal grid + left y-axis (error) + right y-axis (kappa)
      [-12, -8, -4, 0].forEach(function (ev) {
        const py = yErr(ev);
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, py);
        ctx.lineTo(padL + plotW, py);
        ctx.stroke();

        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.teal;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('10^' + ev, padL - 6, py);
      });

      [2, 6, 10, 14].forEach(function (kv) {
        const py = yKap(kv);
        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.cardinal;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('10^' + kv, padL + plotW + 6, py);
      });

      // X ticks
      [0, 3, 6, 9, 12].forEach(function (pv) {
        const px = xP(pv);
        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('10^' + pv, px, padT + plotH + 8);
      });

      // Lagrange Multiplier exact reference line at bottom
      const yLM = yErr(-12.6);
      ctx.strokeStyle = pal.amber;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, yLM);
      ctx.lineTo(padL + plotW, yLM);
      ctx.stroke();
      ctx.setLineDash([]);
      setFont(ctx, 15, true, 600);
      ctx.fillStyle = pal.amber;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Lagrange Mult: exact u(0) = g', padL + 8, yLM - 4);

      // Solution/constraint error curve (Teal): shows O(1/beta) + roundoff degradation at high beta
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      PEN_SWEEP.forEach(function (item, i) {
        const err = Math.max(1e-13, item.res.maxSolErr);
        const px = xP(item.p);
        const py = yErr(Math.log10(err));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Condition number kappa(K_beta) curve (Cardinal): O(beta)
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      PEN_SWEEP.forEach(function (item, i) {
        const px = xP(item.p);
        const py = yKap(Math.log10(Math.max(1, item.res.kappa)));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Active beta vertical line + markers
      const cx = xP(logBeta);
      ctx.strokeStyle = pal.textMuted;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, padT);
      ctx.lineTo(cx, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      const errCurY = yErr(Math.log10(Math.max(1e-13, cur.maxSolErr)));
      const kapCurY = yKap(Math.log10(Math.max(1, cur.kappa)));
      [{ y: errCurY, col: pal.teal }, { y: kapCurY, col: pal.cardinal }].forEach(function (m) {
        ctx.beginPath();
        ctx.arc(cx, m.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = m.col;
        ctx.fill();
        ctx.strokeStyle = pal.white;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      drawMathRun(ctx, 'Error ‖U_β - U_{LM}‖ (teal)  vs.  Condition κ(K_β) (red)', padL, padT - 14, {
        px: 15,
        weight: 600,
        color: pal.text
      });

      // Readouts & badge
      setMathText(r1.keyEl, 'Penalty β');
      r1.valEl.textContent = cur.beta.toExponential(1);
      setMathText(r2.keyEl, '|u_h(0) - g|');
      r2.valEl.textContent = cur.bcErr < 1e-14 ? '< 1e-14' : cur.bcErr.toExponential(2);
      setMathText(r3.keyEl, 'κ(K_β)');
      r3.valEl.textContent = cur.kappa.toExponential(2);
      setMathText(r4.keyEl, 'LM Reaction λ');
      r4.valEl.textContent = LM_SOL.lam.toFixed(3) + ' (exact)';

      if (logBeta < 3.5) setStatusBadge(badgeEl, 'WEAK CONSTRAINT (O(1/β))', 'warn');
      else if (logBeta <= 8.5) setStatusBadge(badgeEl, 'OPTIMAL PENALTY WINDOW', 'safe');
      else setStatusBadge(badgeEl, 'ILL-CONDITIONED (κ > 10^9)', 'danger');
    }

    function drawPoissonTab(ctx, w, h, pal) {
      const N = M_GRID + 1;
      const uMin = scalePoisson(0);
      const uMax = scalePoisson(UNIT_POISSON[(M_GRID / 2) * N + (M_GRID / 2)]);
      const uSpan = Math.max(1e-9, uMax - uMin);

      // UFL header bar
      const headerH = 34;
      roundRectPath(ctx, 10, 8, w - 20, headerH - 4, 2);
      ctx.fillStyle = pal.surface2;
      ctx.fill();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.stroke();
      setFont(ctx, 15, true, 500);
      ctx.fillStyle = pal.teal;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const uflTxt = w < 440
        ? 'a = k*dot(grad(u),grad(v))*dx; L = f*v*dx'
        : 'UFL:  a = k * dot(grad(u), grad(v)) * dx;  L = f * v * dx';
      ctx.fillText(uflTxt, 18, 8 + (headerH - 4) * 0.5);

      const padT = headerH + 16;
      const padB = 34;
      const barSpace = 72;
      const side = Math.max(110, Math.min(w - barSpace - 44, h - padT - padB));
      const gx = Math.floor((w - barSpace - side) * 0.5) + 12;
      const gy = padT + Math.floor((h - padT - padB - side) * 0.5);
      gridBox = { x: gx, y: gy, side: side };

      const cell = side / M_GRID;
      for (let j = 0; j < M_GRID; j++) {
        for (let i = 0; i < M_GRID; i++) {
          const x0 = gx + i * cell;
          const y0 = gy + (M_GRID - 1 - j) * cell;
          const x1 = x0 + cell;
          const y1 = y0 + cell;
          const u00 = UNIT_POISSON[j * N + i];
          const u10 = UNIT_POISSON[j * N + (i + 1)];
          const u01 = UNIT_POISSON[(j + 1) * N + i];
          const u11 = UNIT_POISSON[(j + 1) * N + (i + 1)];

          // Lower-right P1 triangle
          const v1 = scalePoisson((u00 + u10 + u11) / 3);
          ctx.beginPath();
          ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y0);
          ctx.closePath();
          ctx.fillStyle = thermalColor((v1 - uMin) / uSpan, pal, 0.88);
          ctx.fill();

          // Upper-left P1 triangle
          const v2 = scalePoisson((u00 + u11 + u01) / 3);
          ctx.beginPath();
          ctx.moveTo(x0, y1); ctx.lineTo(x1, y0); ctx.lineTo(x0, y0);
          ctx.closePath();
          ctx.fillStyle = thermalColor((v2 - uMin) / uSpan, pal, 0.88);
          ctx.fill();
        }
      }

      // Crisp P1 mesh wireframe (every 2 cells for clean Swiss drafting look)
      ctx.strokeStyle = withAlpha(pal.bg, 0.32);
      ctx.lineWidth = 0.9;
      for (let k = 0; k <= M_GRID; k += 2) {
        const px = gx + k * cell;
        const py = gy + k * cell;
        ctx.beginPath();
        ctx.moveTo(px, gy); ctx.lineTo(px, gy + side);
        ctx.moveTo(gx, py); ctx.lineTo(gx + side, py);
        ctx.stroke();
      }
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(gx, gy, side, side);

      // Axis corner labels (-1, +1)
      setFont(ctx, 15, true, 400);
      ctx.fillStyle = pal.textMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('(-1,-1)', gx, gy + side + 6);
      ctx.textAlign = 'right';
      ctx.fillText('(1,-1)', gx + side, gy + side + 6);

      // Vertical colorbar on right
      const cbX = gx + side + 18;
      const cbW = 14;
      for (let s = 0; s < 40; s++) {
        const frac = 1 - s / 39;
        ctx.fillStyle = thermalColor(frac, pal, 0.92);
        ctx.fillRect(cbX, gy + (s / 40) * side, cbW, side / 40 + 1);
      }
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(cbX, gy, cbW, side);

      setFont(ctx, 15, true, 500);
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(uflMode === 'firedrake' ? uMax.toFixed(3) : uMax.toFixed(0), cbX + cbW + 6, gy);
      ctx.textBaseline = 'bottom';
      ctx.fillText(uflMode === 'firedrake' ? '0.000' : '1000', cbX + cbW + 6, gy + side);

      // Interactive probe crosshair (default at (0.25, 0.25))
      const px = gx + ((probeX + 1) * 0.5) * side;
      const py = gy + ((1 - probeY) * 0.5) * side;
      ctx.strokeStyle = pal.white;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py);
      ctx.moveTo(px, py - 8); ctx.lineTo(px, py + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = pal.bg;
      ctx.fill();
      ctx.stroke();

      const uProbe = scalePoisson(evalUnitPoisson(probeX, probeY));
      setMathText(r1.keyEl, 'Framework');
      r1.valEl.textContent = uflMode === 'firedrake' ? 'Firedrake CG1' : 'FEniCS CG1';
      setMathText(r2.keyEl, 'Probe (x,y)');
      r2.valEl.textContent = '(' + probeX.toFixed(2) + ', ' + probeY.toFixed(2) + ')';
      setMathText(r3.keyEl, 'u_h(x,y)');
      r3.valEl.textContent = uflMode === 'firedrake' ? uProbe.toFixed(4) : uProbe.toFixed(2);
      setMathText(r4.keyEl, 'Peak u_max');
      r4.valEl.textContent = uflMode === 'firedrake' ? uMax.toFixed(4) : uMax.toFixed(2);
    }

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 460;
      syncStageHeight(stage, 360, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const pal = getPal(api);
      fillStageBg(fit.ctx, fit.w, fit.h, pal);

      if (tab === 'constraints') drawConstraintsTab(fit.ctx, fit.w, fit.h, pal);
      else drawPoissonTab(fit.ctx, fit.w, fit.h, pal);
    }

    function updateProbeFromPt(pt) {
      if (tab !== 'poisson') return;
      if (pt.x >= gridBox.x && pt.x <= gridBox.x + gridBox.side && pt.y >= gridBox.y && pt.y <= gridBox.y + gridBox.side) {
        probeX = clamp(((pt.x - gridBox.x) / gridBox.side) * 2 - 1, -1, 1);
        probeY = clamp(1 - ((pt.y - gridBox.y) / gridBox.side) * 2, -1, 1);
        draw();
      }
    }

    bag.on(canvas, 'pointermove', function (ev) {
      if (ev.pointerType !== 'touch' && tab === 'poisson') {
        updateProbeFromPt(getPointerPos(canvas, ev));
      }
    });
    bag.on(canvas, 'click', function (ev) {
      updateProbeFromPt(getPointerPos(canvas, ev));
    });

    bag.on(btnTabCon, 'click', function () {
      tab = 'constraints';
      syncTabUi();
      draw();
    });
    bag.on(btnTabPoi, 'click', function () {
      tab = 'poisson';
      probeX = 0.25;
      probeY = 0.25;
      syncTabUi();
      draw();
    });
    bag.on(btnFiredrake, 'click', function () {
      uflMode = 'firedrake';
      probeX = 0.0;
      probeY = 0.0;
      syncTabUi();
      draw();
    });
    bag.on(btnFenics, 'click', function () {
      uflMode = 'fenics';
      probeX = 0.25;
      probeY = 0.25;
      syncTabUi();
      draw();
    });

    bag.observe(stage, draw);
    syncTabUi();
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 7: sobolev-norms-lab (Slide 17: Hanfeng's PS8 Appendix B Norms)
   * ========================================================================== */

  registerLab('sobolev-norms-lab', function (mountEl, api) {
    const bag = createBag();

    const FUNCS = {
      smooth: {
        label: 'Smooth x^2',
        formula: 'v(x) = x^2   |   v\'(x) = 2x',
        inL2: true,
        inH1: true,
        evalV: function (x) { return x * x; },
        evalDV: function (x) { return 2 * x; },
        norms: function () {
          return { l2: Math.sqrt(2 / 5), h1s: Math.sqrt(8 / 3) };
        }
      },
      hat: {
        label: 'Hat Function (H^1)',
        formula: 'v(x) = 1 - |x|   |   v\'(x) = -sgn(x)',
        inL2: true,
        inH1: true,
        evalV: function (x) { return 1 - Math.abs(x); },
        evalDV: function (x) { return x < 0 ? 1 : -1; },
        norms: function () {
          return { l2: Math.sqrt(2 / 3), h1s: Math.sqrt(2) };
        }
      },
      heaviside: {
        label: 'Heaviside Step',
        formula: 'H_ε(x) = 0.5(1 + tanh(x/ε))   |   H\'_ε -> δ_0',
        inL2: true,
        inH1: false,
        evalV: function (x, eps) { return 0.5 * (1 + Math.tanh(x / Math.max(0.015, eps))); },
        evalDV: function (x, eps) {
          const e = Math.max(0.025, eps);
          const t = Math.tanh(x / e);
          return (1 - t * t) / (2 * e);
        },
        norms: function (eps) {
          // Exact asymptotic L2 & H1 seminorm of 0.5*(1 + tanh(x/eps)) on [-1, 1]
          const l2Sq = Math.max(0.5, 1.0 - eps);
          const h1sSq = 1 / (3 * eps);
          return { l2: Math.sqrt(l2Sq), h1s: Math.sqrt(h1sSq) };
        }
      },
      log: {
        label: 'PS8 Log: ln(1+x)',
        formula: 'v(x) = ln(1+x) on [-1+ε, 1]   |   v\'(x) = 1/(1+x)',
        inL2: true,
        inH1: false,
        evalV: function (x, eps) {
          return Math.log(Math.max(eps, 1 + x));
        },
        evalDV: function (x, eps) {
          return 1 / Math.max(eps, 1 + x);
        },
        norms: function (eps) {
          // Exact antiderivative of (ln t)^2 is t*(ln^2 t - 2 ln t + 2)
          const F = function (t) {
            const lt = Math.log(t);
            return t * (lt * lt - 2 * lt + 2);
          };
          const l2Sq = Math.max(0, F(2) - F(eps));
          const h1sSq = Math.max(0, 1 / eps - 0.5);
          return { l2: Math.sqrt(l2Sq), h1s: Math.sqrt(h1sSq) };
        }
      }
    };

    let funcKey = 'log';
    let sExp = 2.5; // eps = 10^-sExp

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const fKeys = ['smooth', 'hat', 'heaviside', 'log'];
    const pillBtns = fKeys.map(function (k) {
      const b = el('button', 'lab-pill' + (k === funcKey ? ' is-active' : ''), FUNCS[k].label);
      b.type = 'button';
      pillGroup.appendChild(b);
      return { key: k, btn: b };
    });

    const badgeEl = el('span', 'lab-badge-status is-danger', 'L^2 FINITE · H^1 DIVERGES');
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(badgeEl);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const controlsGrid = el('div', 'lab-controls-grid');
    const slEps = createSliderControl('Cutoff ε = 10^{-s} (shrink ε -> 0)', {
      min: 1.0,
      max: 5.0,
      step: 0.1,
      value: sExp,
      format: function (v) { return '10^-' + v.toFixed(1); }
    }, function (v) {
      sExp = v;
      draw();
    });
    bag.on(slEps.input, 'input', slEps.handler);
    controlsGrid.appendChild(slEps.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rL2 = createReadoutChip('‖v‖_{0,2} (L^2)', '1.48');
    const rH1s = createReadoutChip('|v|_{1,2} (H^1 semi)', '17.8');
    const rL2St = createReadoutChip('L^2(Ω)', 'FINITE');
    const rH1St = createReadoutChip('H^1(Ω)', 'DIVERGES');
    readouts.appendChild(rL2.chip);
    readouts.appendChild(rH1s.chip);
    readouts.appendChild(rL2St.chip);
    readouts.appendChild(rH1St.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controlsGrid);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 460;
      syncStageHeight(stage, 400, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = getPal(api);
      fillStageBg(ctx, w, h, pal);

      const fn = FUNCS[funcKey];
      const eps = Math.pow(10, -sExp);
      const curN = fn.norms(eps);

      rL2.valEl.textContent = curN.l2.toFixed(3);
      rH1s.valEl.textContent = curN.h1s > 99 ? curN.h1s.toFixed(1) : curN.h1s.toFixed(3);
      rL2St.valEl.textContent = fn.inL2 ? 'FINITE' : 'DIVERGES';
      rH1St.valEl.textContent = fn.inH1 ? 'FINITE' : 'DIVERGES';
      if (fn.inH1) {
        setStatusBadge(badgeEl, 'L^2: FINITE · H^1: FINITE', 'safe');
      } else {
        setStatusBadge(badgeEl, 'L^2: FINITE · H^1: DIVERGES', 'danger');
      }

      const padL = 56;
      const padR = 34;
      const padT = 28;
      const midGap = 38;
      const padB = 34;
      const topH = Math.floor((h - padT - midGap - padB) * 0.50);
      const botY = padT + topH + midGap;
      const botH = Math.max(72, h - botY - padB);
      const plotW = Math.max(120, w - padL - padR);

      // Top panel: v(x) (Teal) and weak derivative v'(x) (Cardinal) on [-1, 1]
      ctx.fillStyle = pal.surface;
      ctx.fillRect(padL, padT, plotW, topH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, topH);

      const yLo = funcKey === 'log' ? -4.2 : -2.4;
      const yHi = funcKey === 'log' ? 6.0 : (funcKey === 'heaviside' ? 5.5 : 2.6);
      function xMap(xv) { return padL + ((xv + 1) * 0.5) * plotW; }
      function yMap(yv) { return padT + topH - ((clamp(yv, yLo, yHi) - yLo) / (yHi - yLo)) * topH; }

      // Zero axes
      const y0 = yMap(0);
      const x0 = xMap(0);
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y0); ctx.lineTo(padL + plotW, y0);
      ctx.moveTo(x0, padT); ctx.lineTo(x0, padT + topH);
      ctx.stroke();

      // Plot v'(x) (Cardinal)
      const visEps = Math.max(0.03, Math.min(0.25, Math.pow(10, -0.45 * sExp)));
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, topH);
      ctx.clip();

      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      if (funcKey === 'hat') {
        // Piecewise constant derivative with jump at x=0
        ctx.beginPath();
        ctx.moveTo(xMap(-1), yMap(1)); ctx.lineTo(xMap(0), yMap(1));
        ctx.moveTo(xMap(0), yMap(-1)); ctx.lineTo(xMap(1), yMap(-1));
        ctx.stroke();
      } else {
        ctx.beginPath();
        const xStart = funcKey === 'log' ? -1 + Math.max(0.012, eps) : -1;
        for (let i = 0; i <= 140; i++) {
          const xv = lerp(xStart, 1, i / 140);
          const dv = fn.evalDV(xv, funcKey === 'heaviside' ? visEps : eps);
          const px = xMap(xv);
          const py = yMap(dv);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Plot v(x) (Teal)
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      const xStartV = funcKey === 'log' ? -1 + Math.max(0.004, eps) : -1;
      for (let i = 0; i <= 140; i++) {
        const xv = lerp(xStartV, 1, i / 140);
        const vv = fn.evalV(xv, funcKey === 'heaviside' ? visEps : eps);
        const px = xMap(xv);
        const py = yMap(vv);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Legend tags in top panel
      drawMathRun(ctx, fn.formula, padL, padT - 12, { px: 15, weight: 600, color: pal.text });
      setFont(ctx, 15, true, 600);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = pal.teal;
      ctx.fillText('v(x)', padL + plotW - 62, padT + 6);
      ctx.fillStyle = pal.cardinal;
      ctx.fillText('v\'(x)', padL + plotW - 10, padT + 6);

      // Bottom panel: log10 growth of ||v||_{0,2} vs |v|_{1,2} across s in [1, 5]
      ctx.fillStyle = pal.surface;
      ctx.fillRect(padL, botY, plotW, botH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, botY, plotW, botH);

      const lgMin = -0.5;
      const lgMax = 2.8;
      function xS(sv) { return padL + ((sv - 1) / 4) * plotW; }
      function yLg(val) {
        const lv = Math.log10(Math.max(0.1, val));
        return botY + botH - ((clamp(lv, lgMin, lgMax) - lgMin) / (lgMax - lgMin)) * botH;
      }

      [0, 1, 2].forEach(function (pv) {
        const py = botY + botH - ((pv - lgMin) / (lgMax - lgMin)) * botH;
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, py); ctx.lineTo(padL + plotW, py);
        ctx.stroke();
        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('10^' + pv, padL - 6, py);
      });

      [1, 2, 3, 4, 5].forEach(function (sv) {
        const px = xS(sv);
        const isRightEdge = sv === 5 && (px + 24 > w - 4);
        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = isRightEdge ? 'right' : 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('10^-' + sv, isRightEdge ? Math.min(w - 4, px + 14) : px, botY + botH + 7);
      });

      // Plot L2 curve (Teal) and H1 seminorm curve (Cardinal)
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const sv = 1 + (4 * i) / 40;
        const nv = fn.norms(Math.pow(10, -sv)).l2;
        const px = xS(sv), py = yLg(nv);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const sv = 1 + (4 * i) / 40;
        const nv = fn.norms(Math.pow(10, -sv)).h1s;
        const px = xS(sv), py = yLg(nv);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Current sExp cursor
      const cx = xS(sExp);
      ctx.strokeStyle = pal.amber;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, botY); ctx.lineTo(cx, botY + botH);
      ctx.stroke();
      ctx.setLineDash([]);

      [
        { y: yLg(curN.l2), col: pal.teal },
        { y: yLg(curN.h1s), col: pal.cardinal }
      ].forEach(function (m) {
        ctx.beginPath();
        ctx.arc(cx, m.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = m.col;
        ctx.fill();
        ctx.strokeStyle = pal.white;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      drawMathRun(ctx, 'Norm Growth as ε -> 0: ‖v‖_{0,2} (teal) vs |v|_{1,2} (red)', padL, botY - 12, {
        px: 15,
        weight: 600,
        color: pal.text
      });
    }

    pillBtns.forEach(function (item) {
      bag.on(item.btn, 'click', function () {
        funcKey = item.key;
        pillBtns.forEach(function (o) { o.btn.classList.toggle('is-active', o.key === funcKey); });
        draw();
      });
    });

    bag.observe(stage, draw);
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 8: cea-orthogonality-lab (Slide 18: Prof. Lew's Affine Céa's Lemma)
   * ========================================================================== */

  registerLab('cea-orthogonality-lab', function (mountEl, api) {
    const bag = createBag();

    let symMode = true; // true = Symmetric (a-Orthogonal), false = Non-Symmetric (Advection)
    let ratioMA = 2.0; // M / alpha in [1.0, 8.0]

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const btnSym = el('button', 'lab-pill is-active', 'Symmetric (a-Orthogonal)');
    const btnNonSym = el('button', 'lab-pill', 'Non-Symmetric (Advection)');
    btnSym.type = 'button';
    btnNonSym.type = 'button';
    pillGroup.appendChild(btnSym);
    pillGroup.appendChild(btnNonSym);

    const badgeEl = el('span', 'lab-badge-status is-safe', 'ENERGY OPTIMAL');
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(badgeEl);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const controlsGrid = el('div', 'lab-controls-grid');
    const slMA = createSliderControl('Continuity / Coercivity Ratio M/α', {
      min: 1.0,
      max: 8.0,
      step: 0.1,
      value: ratioMA,
      format: function (v) { return v.toFixed(1); }
    }, function (v) {
      ratioMA = v;
      draw();
    });
    bag.on(slMA.input, 'input', slMA.handler);
    controlsGrid.appendChild(slMA.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rMA = createReadoutChip('M / α', '2.0');
    const rCea = createReadoutChip('Céa (1 + M/α)', '3.00');
    const rAct = createReadoutChip('‖u-u_h‖ / ‖u-w_h*‖', '1.22');
    const rSymB = createReadoutChip('Sym. Bound √(M/α)', '1.41');
    readouts.appendChild(rMA.chip);
    readouts.appendChild(rCea.chip);
    readouts.appendChild(rAct.chip);
    readouts.appendChild(rSymB.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controlsGrid);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 460;
      syncStageHeight(stage, 320, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = getPal(api);
      fillStageBg(ctx, w, h, pal);

      // Compute exact projection factor
      const ceaBound = 1 + ratioMA;
      const symBound = Math.sqrt(ratioMA);
      // Actual realized ratio in Hilbert space geometry:
      // Symmetric: bounded strictly by sqrt(M/alpha) (anisotropic energy ellipse tangent to S_h)
      // Non-symmetric: oblique projection error grows linearly toward M/alpha < (1 + M/alpha)
      let tanShift;
      if (symMode) {
        // Realized shift for a 35-deg tilted SPD metric of condition M/alpha:
        // min_x [ x^T A x ] where A = R diag(M, alpha) R^T => shift = ((M-alpha)*sin(2phi)/2) / (M sin^2 + alpha cos^2)
        const phi = 0.62;
        const c = Math.cos(phi), s = Math.sin(phi);
        const a11 = ratioMA * c * c + s * s;
        const a12 = (ratioMA - 1) * s * c;
        tanShift = Math.abs(a12 / a11);
      } else {
        tanShift = 0.78 * Math.sqrt(Math.max(0, ratioMA * ratioMA - 1));
      }
      const actualRatio = Math.hypot(1, tanShift);

      rMA.valEl.textContent = ratioMA.toFixed(1);
      rCea.valEl.textContent = ceaBound.toFixed(2);
      rAct.valEl.textContent = actualRatio.toFixed(2);
      rSymB.valEl.textContent = symMode ? symBound.toFixed(2) : 'N/A (non-sym)';

      if (actualRatio < 1.15) {
        setStatusBadge(badgeEl, 'NEAR-ORTHOGONAL OPTIMAL', 'safe');
      } else if (symMode) {
        setStatusBadge(badgeEl, 'ENERGY-NORM OPTIMAL (≤ √(M/α))', 'safe');
      } else if (ratioMA > 4.0) {
        setStatusBadge(badgeEl, 'OBLIQUE DEGRADATION (stabilize!)', 'danger');
      } else {
        setStatusBadge(badgeEl, 'QUASI-OPTIMAL OBLIQUE PROJ.', 'warn');
      }

      // Geometric layout
      const uX = Math.max(88, Math.floor(w * 0.28));
      const dUnit = clamp(h * 0.30, 56, 108);
      const lineY = Math.floor(h * 0.62);
      const uY = lineY - dUnit;
      const vhY = Math.min(h - 32, lineY + 54);

      // Horizontal pixel scale so large oblique shifts stay inside right margin
      const maxAvailX = w - uX - 42;
      const maxShiftUnits = Math.max(1.0, tanShift);
      const pxPerUnit = Math.min(dUnit, maxAvailX / Math.max(2.0, maxShiftUnits * 1.12));

      const wStarX = uX;
      const wStarY = lineY;
      const uhX = uX + tanShift * pxPerUnit;
      const uhY = lineY;

      // Translucent Céa bound arc of radius (1 + M/alpha) * d (scaled consistently in pxPerUnit)
      const ceaRad = ceaBound * pxPerUnit;
      ctx.save();
      ctx.beginPath();
      ctx.rect(10, 10, w - 20, h - 20);
      ctx.clip();

      ctx.beginPath();
      ctx.arc(uX, uY, Math.min(ceaRad, w * 1.1), 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(pal.amber, 0.06);
      ctx.fill();
      ctx.strokeStyle = withAlpha(pal.amber, 0.45);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // If Symmetric, draw the tilted energy-norm ellipse centered at u tangent to S_h at u_h
      if (symMode && ratioMA > 1.05) {
        const phi = 0.62;
        const c = Math.cos(phi), s = Math.sin(phi);
        const a11 = ratioMA * c * c + s * s;
        const a22 = ratioMA * s * s + c * c;
        const a12 = (ratioMA - 1) * s * c;
        // Energy value at tangent point (dx = tanShift, dy = 1)
        const eVal = a11 * tanShift * tanShift - 2 * a12 * tanShift + a22;
        const rMajor = Math.sqrt(eVal / 1.0) * dUnit; // along alpha eigenvector
        const rMinor = Math.sqrt(eVal / ratioMA) * dUnit; // along M eigenvector
        ctx.save();
        ctx.translate(uX, uY);
        ctx.rotate(-phi);
        ctx.scale(pxPerUnit / dUnit, 1);
        ctx.beginPath();
        ctx.ellipse(0, 0, rMinor, rMajor, 0, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(pal.teal, 0.08);
        ctx.fill();
        ctx.strokeStyle = withAlpha(pal.teal, 0.55);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // Parallel linear test space V_h (dashed muted line)
      ctx.strokeStyle = withAlpha(pal.textMuted, 0.45);
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(22, vhY);
      ctx.lineTo(w - 22, vhY);
      ctx.stroke();
      ctx.setLineDash([]);
      drawMathRun(ctx, 'Linear test space V_h', w - 24, vhY + 15, {
        px: 15,
        align: 'right',
        color: pal.textMuted
      });

      // Shift arrow from V_h up to S_h = u_bar + V_h
      drawArrow(ctx, 42, vhY, 42, lineY + 2, pal.textMuted, 1.5, 7);
      drawMathRun(ctx, '+ū', 50, (vhY + lineY) * 0.5, { px: 15, color: pal.textMuted });

      // Affine trial space S_h = u_bar + V_h (bold solid line)
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(22, lineY);
      ctx.lineTo(w - 22, lineY);
      ctx.stroke();
      const shLabel = w < 460 ? 'S_h = ū + V_h' : 'Affine trial space S_h = ū + V_h';
      drawMathRun(ctx, shLabel, w - 24, lineY + 20, {
        px: 15,
        align: 'right',
        weight: 600,
        color: pal.text
      });

      // Right-angle 90 deg mark at w_h^*
      const sq = 12;
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(wStarX, wStarY - sq, sq, sq);

      // Vertical best-approximation vector u -> w_h^* (Teal)
      ctx.strokeStyle = pal.teal;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(uX, uY);
      ctx.lineTo(wStarX, wStarY);
      ctx.stroke();

      // Galerkin error vector u -> u_h (Cardinal)
      ctx.strokeStyle = pal.cardinal;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(uX, uY);
      ctx.lineTo(uhX, uhY);
      ctx.stroke();

      // Points: u, w_h^*, u_h
      const pts = [
        { x: uX, y: uY, col: pal.amber, lbl: 'Exact u', dx: 0, dy: -20, align: 'center' },
        { x: wStarX, y: wStarY, col: pal.teal, lbl: 'w_h^* (H^1 best)', dx: -8, dy: 20, align: 'center' }
      ];
      if (Math.abs(uhX - wStarX) > 10) {
        pts.push({ x: uhX, y: uhY, col: pal.cardinal, lbl: 'u_h (Galerkin)', dx: 10, dy: -20, align: 'left' });
      }
      pts.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = p.col;
        ctx.fill();
        ctx.strokeStyle = pal.white;
        ctx.lineWidth = 2;
        ctx.stroke();
        drawMathRun(ctx, p.lbl, clamp(p.x + p.dx, 56, w - 95), p.y + p.dy, {
          px: 15,
          weight: 600,
          align: p.align,
          color: p.col
        });
      });

      // Top-right theorem summary badge
      drawMathRun(ctx, 'a(u - u_h, v_h) = 0  ∀v_h ∈ V_h', w - 16, 20, {
        px: 15,
        mono: true,
        align: 'right',
        color: pal.amber,
        bg: withAlpha(pal.surface2, 0.85),
        border: pal.border,
        padX: 8,
        padY: 4
      });
    }

    bag.on(btnSym, 'click', function () {
      symMode = true;
      btnSym.classList.add('is-active');
      btnNonSym.classList.remove('is-active');
      draw();
    });
    bag.on(btnNonSym, 'click', function () {
      symMode = false;
      btnNonSym.classList.add('is-active');
      btnSym.classList.remove('is-active');
      if (ratioMA < 1.5) {
        ratioMA = 3.0;
        slMA.setValue(ratioMA);
      }
      draw();
    });

    bag.observe(stage, draw);
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 9: convergence-rates-lab (Slide 19: Real Live 1D P1/P2 Convergence)
   * ========================================================================== */

  registerLab('convergence-rates-lab', function (mountEl, api) {
    const bag = createBag();

    let probType = 'smooth'; // 'smooth' | 'singular'
    let elemOrder = 1; // 1 = P1, 2 = P2
    let gamma = 0.67;

    const N_LIST = [4, 8, 16, 32, 64];

    function solveBanded(A, b, bw) {
      // Gaussian elimination for symmetric/general banded matrix of size n and half-bandwidth bw
      const n = b.length;
      const M = new Array(n);
      const rhs = Float64Array.from(b);
      for (let i = 0; i < n; i++) M[i] = Float64Array.from(A[i]);

      for (let k = 0; k < n; k++) {
        const iMax = Math.min(n - 1, k + bw);
        const jMax = Math.min(n - 1, k + bw);
        const diag = M[k][k];
        if (Math.abs(diag) < 1e-15) continue;
        for (let i = k + 1; i <= iMax; i++) {
          const fac = M[i][k] / diag;
          if (fac === 0) continue;
          M[i][k] = 0;
          for (let j = k + 1; j <= jMax; j++) {
            M[i][j] -= fac * M[k][j];
          }
          rhs[i] -= fac * rhs[k];
        }
      }
      const x = new Float64Array(n);
      for (let i = n - 1; i >= 0; i--) {
        const jMax = Math.min(n - 1, i + bw);
        let s = rhs[i];
        for (let j = i + 1; j <= jMax; j++) s -= M[i][j] * x[j];
        x[i] = Math.abs(M[i][i]) > 1e-15 ? s / M[i][i] : 0;
      }
      return x;
    }

    function exactU(x) {
      if (probType === 'smooth') return Math.sin(Math.PI * x) / (Math.PI * Math.PI);
      return Math.pow(x, gamma) - x * x * x;
    }

    function exactDU(x) {
      if (probType === 'smooth') return Math.cos(Math.PI * x) / Math.PI;
      return gamma * Math.pow(x, gamma - 1) - 3 * x * x;
    }

    function run1DFEM(N, order) {
      const h = 1.0 / N;
      const nTotal = order * N + 1; // nodes 0 .. order*N
      const nFree = nTotal - 2; // interior nodes 1 .. nTotal-2
      const K = new Array(nFree);
      for (let i = 0; i < nFree; i++) K[i] = new Float64Array(nFree);
      const F = new Float64Array(nFree);

      const g6 = GAUSS_1D[6];

      // Exact antiderivatives for singular u(x) = x^gamma - x^3 on [a, b]
      function singI0(a, b) {
        return (Math.pow(b, gamma) - Math.pow(a, gamma)) - (b * b * b - a * a * a);
      }
      function singI1(a, b) {
        return (gamma / (gamma + 1)) * (Math.pow(b, gamma + 1) - Math.pow(a, gamma + 1)) - 0.75 * (Math.pow(b, 4) - Math.pow(a, 4));
      }

      if (order === 1) {
        const ke = [[1 / h, -1 / h], [-1 / h, 1 / h]];
        for (let e = 0; e < N; e++) {
          const xL = e * h;
          const xR = (e + 1) * h;
          const fe = [0, 0];
          if (probType === 'smooth') {
            for (let q = 0; q < 6; q++) {
              const xi = 0.5 * (g6.pts[q] + 1); // [0, 1]
              const x = xL + xi * h;
              const wt = 0.5 * h * g6.wts[q];
              const fx = Math.sin(Math.PI * x);
              fe[0] += wt * fx * (1 - xi);
              fe[1] += wt * fx * xi;
            }
          } else {
            const i0 = singI0(xL, xR);
            fe[0] = -i0 / h;
            fe[1] = i0 / h;
          }
          const gIdx = [e, e + 1];
          for (let a = 0; a < 2; a++) {
            const ga = gIdx[a] - 1;
            if (ga < 0 || ga >= nFree) continue;
            F[ga] += fe[a];
            for (let b = 0; b < 2; b++) {
              const gb = gIdx[b] - 1;
              if (gb < 0 || gb >= nFree) continue;
              K[ga][gb] += ke[a][b];
            }
          }
        }
      } else {
        const fac = 1 / (3 * h);
        const ke = [
          [7 * fac, -8 * fac, 1 * fac],
          [-8 * fac, 16 * fac, -8 * fac],
          [1 * fac, -8 * fac, 7 * fac]
        ];
        for (let e = 0; e < N; e++) {
          const xL = e * h;
          const xR = (e + 1) * h;
          const fe = [0, 0, 0];
          if (probType === 'smooth') {
            for (let q = 0; q < 6; q++) {
              const xi = 0.5 * (g6.pts[q] + 1);
              const x = xL + xi * h;
              const wt = 0.5 * h * g6.wts[q];
              const fx = Math.sin(Math.PI * x);
              const N1 = (1 - xi) * (1 - 2 * xi);
              const N2 = 4 * xi * (1 - xi);
              const N3 = xi * (2 * xi - 1);
              fe[0] += wt * fx * N1;
              fe[1] += wt * fx * N2;
              fe[2] += wt * fx * N3;
            }
          } else {
            const i0 = singI0(xL, xR);
            const i1 = singI1(xL, xR);
            const invH = 1 / h;
            const invH2 = invH * invH;
            // (N_a^e)'(x) = c1 * x + c0
            fe[0] = (4 * invH2) * i1 + (-4 * xL * invH2 - 3 * invH) * i0;
            fe[1] = (-8 * invH2) * i1 + (8 * xL * invH2 + 4 * invH) * i0;
            fe[2] = (4 * invH2) * i1 + (-4 * xL * invH2 - 1 * invH) * i0;
          }
          const gIdx = [2 * e, 2 * e + 1, 2 * e + 2];
          for (let a = 0; a < 3; a++) {
            const ga = gIdx[a] - 1;
            if (ga < 0 || ga >= nFree) continue;
            F[ga] += fe[a];
            for (let b = 0; b < 3; b++) {
              const gb = gIdx[b] - 1;
              if (gb < 0 || gb >= nFree) continue;
              K[ga][gb] += ke[a][b];
            }
          }
        }
      }

      const Uf = solveBanded(K, F, order);
      const U = new Float64Array(nTotal);
      for (let i = 0; i < nFree; i++) U[i + 1] = Uf[i];

      // Evaluate exact L2 and H1 errors
      let l2Sq = 0;
      let h1sSq = 0;
      for (let e = 0; e < N; e++) {
        const xL = e * h;
        const evalUh = function (xi) {
          if (order === 1) {
            return (1 - xi) * U[e] + xi * U[e + 1];
          }
          const u1 = U[2 * e], u2 = U[2 * e + 1], u3 = U[2 * e + 2];
          return u1 * (1 - xi) * (1 - 2 * xi) + u2 * 4 * xi * (1 - xi) + u3 * xi * (2 * xi - 1);
        };
        const evalDUh = function (xi) {
          if (order === 1) return (U[e + 1] - U[e]) / h;
          const u1 = U[2 * e], u2 = U[2 * e + 1], u3 = U[2 * e + 2];
          return (u1 * (4 * xi - 3) + u2 * (4 - 8 * xi) + u3 * (4 * xi - 1)) / h;
        };

        if (probType === 'singular' && e === 0) {
          // Duffy transform x = h * t^2 on [0, h] so x^gamma is smooth in t
          for (let q = 0; q < 6; q++) {
            const t = 0.5 * (g6.pts[q] + 1);
            const xi = t * t;
            const x = h * xi;
            const wt = 0.5 * g6.wts[q] * (2 * h * t);
            const diff = exactU(x) - evalUh(xi);
            l2Sq += wt * diff * diff;
          }
        } else {
          for (let q = 0; q < 6; q++) {
            const xi = 0.5 * (g6.pts[q] + 1);
            const x = xL + xi * h;
            const wt = 0.5 * h * g6.wts[q];
            const diff = exactU(x) - evalUh(xi);
            l2Sq += wt * diff * diff;
            if (probType === 'smooth') {
              const ddiff = exactDU(x) - evalDUh(xi);
              h1sSq += wt * ddiff * ddiff;
            }
          }
        }
      }

      if (probType === 'singular') {
        // Exact Galerkin orthogonality identity: |u - u_h|_H1^2 = |u|_H1^2 - U^T F
        const exactH1sSq = (gamma * gamma) / (2 * gamma - 1) - (6 * gamma) / (gamma + 2) + 9 / 5;
        let uhEnergy = 0;
        for (let i = 0; i < nFree; i++) uhEnergy += Uf[i] * F[i];
        h1sSq = Math.max(1e-26, exactH1sSq - uhEnergy);
      }

      const errL2 = Math.sqrt(Math.max(1e-28, l2Sq));
      const errH1 = Math.sqrt(Math.max(1e-28, l2Sq + h1sSq));
      return { N: N, h: h, errL2: errL2, errH1: errH1 };
    }

    function fitSlope(pts, key) {
      // Slope on finest 3 meshes (N=16, 32, 64) for crisp asymptotic order
      const sub = pts.slice(2);
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (let i = 0; i < sub.length; i++) {
        const lx = Math.log10(sub[i].h);
        const ly = Math.log10(Math.max(1e-16, sub[i][key]));
        sx += lx; sy += ly; sxx += lx * lx; sxy += lx * ly;
      }
      const n = sub.length;
      return (n * sxy - sx * sy) / Math.max(1e-12, n * sxx - sx * sx);
    }

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const probGroup = el('div', 'lab-pill-group');
    const btnSmooth = el('button', 'lab-pill is-active', 'Smooth: -u\'\' = sin(πx)');
    const btnSing = el('button', 'lab-pill', 'Singular: u = x^γ - x^3');
    btnSmooth.type = 'button';
    btnSing.type = 'button';
    probGroup.appendChild(btnSmooth);
    probGroup.appendChild(btnSing);

    const ordGroup = el('div', 'lab-pill-group');
    const btnP1 = el('button', 'lab-pill is-active', 'P1 Linear');
    const btnP2 = el('button', 'lab-pill', 'P2 Quadratic');
    btnP1.type = 'button';
    btnP2.type = 'button';
    ordGroup.appendChild(btnP1);
    ordGroup.appendChild(btnP2);

    toolbar.appendChild(probGroup);
    toolbar.appendChild(ordGroup);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const controlsGrid = el('div', 'lab-controls-grid');
    const slGam = createSliderControl('Singularity Exponent γ (u ~ x^γ)', {
      min: 0.65,
      max: 1.50,
      step: 0.01,
      value: gamma,
      format: function (v) { return v.toFixed(2); }
    }, function (v) {
      gamma = v;
      draw();
    });
    bag.on(slGam.input, 'input', slGam.handler);
    controlsGrid.appendChild(slGam.wrap);

    const readouts = el('div', 'lab-readout-row');
    const rH1 = createReadoutChip('Measured r_{H1}', '1.00');
    const rL2 = createReadoutChip('Measured r_{L2}', '2.00');
    const rThH1 = createReadoutChip('Theory H^1', '1.00');
    const rThL2 = createReadoutChip('Theory L^2', '2.00');
    readouts.appendChild(rH1.chip);
    readouts.appendChild(rL2.chip);
    readouts.appendChild(rThH1.chip);
    readouts.appendChild(rThL2.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(controlsGrid);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function syncUi() {
      btnSmooth.classList.toggle('is-active', probType === 'smooth');
      btnSing.classList.toggle('is-active', probType === 'singular');
      btnP1.classList.toggle('is-active', elemOrder === 1);
      btnP2.classList.toggle('is-active', elemOrder === 2);
      controlsGrid.style.display = probType === 'singular' ? '' : 'none';
    }

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 460;
      syncStageHeight(stage, 350, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = getPal(api);
      fillStageBg(ctx, w, h, pal);

      const results = N_LIST.map(function (N) { return run1DFEM(N, elemOrder); });
      const slopeH1 = fitSlope(results, 'errH1');
      const slopeL2 = fitSlope(results, 'errL2');
      const thH1 = probType === 'smooth' ? elemOrder : Math.min(elemOrder, gamma - 0.5);
      const thL2 = probType === 'smooth' ? elemOrder + 1 : Math.min(elemOrder + 1, gamma + 0.5);

      rH1.valEl.textContent = slopeH1.toFixed(2);
      rL2.valEl.textContent = slopeL2.toFixed(2);
      rThH1.valEl.textContent = thH1.toFixed(2);
      rThL2.valEl.textContent = thL2.toFixed(2);

      // Compute clean log-log axis bounds
      const xLogMin = Math.log10(1 / 80);
      const xLogMax = Math.log10(1 / 3.2);
      let yLogMin = Infinity;
      let yLogMax = -Infinity;
      results.forEach(function (r) {
        const l1 = Math.log10(Math.max(1e-12, r.errL2));
        const l2 = Math.log10(Math.max(1e-12, r.errH1));
        if (l1 < yLogMin) yLogMin = l1;
        if (l2 > yLogMax) yLogMax = l2;
      });
      yLogMin = Math.floor(yLogMin - 0.5);
      yLogMax = Math.ceil(yLogMax + 0.4);
      if (yLogMax - yLogMin < 2.5) yLogMin = yLogMax - 2.5;

      const padL = 64;
      const padR = 24;
      const padT = 36;
      const padB = 42;
      const plotW = Math.max(120, w - padL - padR);
      const plotH = Math.max(120, h - padT - padB);

      ctx.fillStyle = pal.surface;
      ctx.fillRect(padL, padT, plotW, plotH);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, plotH);

      function xMap(hv) {
        return padL + ((Math.log10(hv) - xLogMin) / (xLogMax - xLogMin)) * plotW;
      }
      function yMap(ev) {
        const lg = Math.log10(Math.max(1e-12, ev));
        return padT + plotH - ((clamp(lg, yLogMin, yLogMax) - yLogMin) / (yLogMax - yLogMin)) * plotH;
      }

      // Horizontal log grid lines
      const stepY = (yLogMax - yLogMin) > 5 ? 2 : 1;
      for (let lv = Math.ceil(yLogMin); lv <= Math.floor(yLogMax); lv += stepY) {
        const py = padT + plotH - ((lv - yLogMin) / (yLogMax - yLogMin)) * plotH;
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, py); ctx.lineTo(padL + plotW, py);
        ctx.stroke();

        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('10^' + lv, padL - 7, py);
      }

      // Vertical grid lines at N = 4, 8, 16, 32, 64
      N_LIST.forEach(function (N) {
        const px = xMap(1 / N);
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, padT); ctx.lineTo(px, padT + plotH);
        ctx.stroke();
        setFont(ctx, 15, true, 400);
        ctx.fillStyle = pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('1/' + N, px, padT + plotH + 8);
      });

      // Helper to plot curve + slope triangle
      function plotCurve(key, color, isSquare, triSide) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        results.forEach(function (r, idx) {
          const px = xMap(r.h);
          const py = yMap(r[key]);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        results.forEach(function (r) {
          const px = xMap(r.h);
          const py = yMap(r[key]);
          ctx.fillStyle = color;
          if (isSquare) {
            ctx.fillRect(px - 4.5, py - 4.5, 9, 9);
          } else {
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = pal.bg;
          ctx.lineWidth = 1.5;
          if (isSquare) ctx.strokeRect(px - 4.5, py - 4.5, 9, 9);
          else ctx.stroke();
        });

        // Slope triangle between N=16 (index 2) and N=32 (index 3)
        const pA = results[3]; // smaller h (left)
        const pB = results[2]; // larger h (right)
        const ax = xMap(pA.h), ay = yMap(pA[key]);
        const bx = xMap(pB.h), by = yMap(pB[key]);
        const cx = triSide === 'top' ? ax : bx;
        const cy = triSide === 'top' ? by : ay;

        ctx.strokeStyle = withAlpha(color, 0.78);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(cx, cy);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);

        const slopeVal = key === 'errH1' ? slopeH1 : slopeL2;
        const lbl = (key === 'errH1' ? 'H^1: ' : 'L^2: ') + slopeVal.toFixed(2);
        const lx = triSide === 'top' ? ax - 6 : bx + 6;
        const ly = clamp((ay + by) * 0.5 + (triSide === 'top' ? -8 : 8), padT + 18, padT + plotH - 18);
        drawMathRun(ctx, lbl, lx, ly, {
          px: 15,
          mono: true,
          weight: 600,
          align: triSide === 'top' ? 'right' : 'left',
          color: color,
          bg: withAlpha(pal.bg, 0.78),
          padX: 4,
          padY: 1
        });
      }

      plotCurve('errH1', pal.cardinal, true, 'top');
      plotCurve('errL2', pal.teal, false, 'bot');

      // Title and x-axis label
      const headTxt = 'Log-Log Error vs. Mesh Size h = 1/N  (' + (elemOrder === 1 ? 'P1' : 'P2') + ', ' + (probType === 'smooth' ? 'Smooth' : 'γ = ' + gamma.toFixed(2)) + ')';
      drawMathRun(ctx, headTxt, padL, padT - 14, { px: 15, weight: 600, color: pal.text });
    }

    bag.on(btnSmooth, 'click', function () { probType = 'smooth'; syncUi(); draw(); });
    bag.on(btnSing, 'click', function () { probType = 'singular'; syncUi(); draw(); });
    bag.on(btnP1, 'click', function () { elemOrder = 1; syncUi(); draw(); });
    bag.on(btnP2, 'click', function () { elemOrder = 2; syncUi(); draw(); });

    bag.observe(stage, draw);
    syncUi();
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 10: workflow-stepper-fea (Slide 20: 7-Step FEARev.pdf Workflow)
   * ========================================================================== */

  registerLab('workflow-stepper-fea', function (mountEl, api) {
    const bag = createBag();

    const STEPS = [
      {
        num: '01',
        short: 'Strong',
        title: '01 · Strong Form & BCs',
        eq: '-∇·(k∇u) = f in Ω,  u|_D = u_D,  k∂_n u|_N = t_N',
        check: 'Check: Γ_D ∩ Γ_N = ∅ and Γ_D ∪ Γ_N = ∂Ω',
        colorKey: 'cardinal'
      },
      {
        num: '02',
        short: 'Weak',
        title: '02 · Weak Form (IBP)',
        eq: 'a(u, v) = ∫ k∇u·∇v dΩ = ∫ fv dΩ + ∫_{ΓN} t_N v ds',
        check: 'Check: Natural BCs enter ℓ(v); test v = 0 on Γ_D',
        colorKey: 'cardinal'
      },
      {
        num: '03',
        short: 'Mesh',
        title: '03 · Mesh & Connectivity',
        eq: 'Ω = ∪ Ω_e,  LV(a,e) CCW  =>  signed area A > 0',
        check: 'Check: Positive Jacobian det(J) > 0 on every cell',
        colorKey: 'teal'
      },
      {
        num: '04',
        short: 'Shape',
        title: '04 · Shape Functions & Gauss',
        eq: 'k^e_{ab} = Σ_q w_q (∇N_b · k∇N_a) |det J(ξ_q)|',
        check: 'Check: Σ_a N_a ≡ 1 and Q exact for degree 2Q - 1',
        colorKey: 'teal'
      },
      {
        num: '05',
        short: 'LG/BC',
        title: '05 · LG Scatter & Essential BCs',
        eq: 'K_{LG(a,e), LG(b,e)} += k^e_{ab},   F -= K_{free,D} U_D',
        check: 'Check: Partition-of-unity row sum Σ_B K_{AB} = 0',
        colorKey: 'amber'
      },
      {
        num: '06',
        short: 'Solve',
        title: '06 · Solve KU = F & Fluxes',
        eq: 'U = K^{-1} F,   q^e = -k^e ∇u_h,   σ = C : ε(u_h)',
        check: 'Check: Algebraic residual ‖KU - F‖ / ‖F‖ < 1e-12',
        colorKey: 'blue'
      },
      {
        num: '07',
        short: 'Verify',
        title: '07 · Manufactured Verification',
        eq: '‖u - u_h‖_{0,2} = O(h^{k+1}),   ‖u - u_h‖_{1,2} = O(h^k)',
        check: 'Check: Patch test + log-log slope match theory',
        colorKey: 'blue'
      }
    ];

    let activeStep = 0;
    let tileRects = [];

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const navGroup = el('div', 'lab-pill-group');
    const btnPrev = el('button', 'lab-pill', '← Prev');
    const btnNext = el('button', 'lab-pill is-active', 'Next Step →');
    const btnReset = el('button', 'lab-pill', 'Reset');
    btnPrev.type = 'button';
    btnNext.type = 'button';
    btnReset.type = 'button';
    navGroup.appendChild(btnPrev);
    navGroup.appendChild(btnNext);
    navGroup.appendChild(btnReset);

    const badgeEl = el('span', 'lab-badge-status is-safe', 'STEP 01 / 07');
    toolbar.appendChild(navGroup);
    toolbar.appendChild(badgeEl);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const readouts = el('div', 'lab-readout-row');
    const rStage = createReadoutChip('Stage', '01 · Strong Form');
    const rSanity = createReadoutChip('Sanity Check', 'Γ_D ∩ Γ_N = ∅');
    readouts.appendChild(rStage.chip);
    readouts.appendChild(rSanity.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function drawMicroVisual(ctx, stepIdx, x, y, w, h, col, pal) {
      ctx.save();
      roundRectPath(ctx, x, y, w, h, 2);
      ctx.fillStyle = pal.surface2;
      ctx.fill();
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      const cx = x + w * 0.5;
      const cy = y + h * 0.5;

      if (stepIdx === 0) {
        // Strong form: blob domain Omega with Gamma_D (left) and Gamma_N (right)
        const rx = Math.min(w * 0.34, 86);
        const ry = Math.min(h * 0.34, 52);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(col, 0.14);
        ctx.fill();
        // Left arc Gamma_D
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, Math.PI * 0.5, Math.PI * 1.5);
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 3.2;
        ctx.stroke();
        // Right arc Gamma_N
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.6;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        drawMathRun(ctx, 'Ω: -Δu = f', cx, cy, { px: 15, weight: 600, align: 'center', color: pal.text });
        drawMathRun(ctx, 'Γ_D', cx - rx - 14, cy, { px: 15, align: 'right', color: pal.cardinal });
        drawMathRun(ctx, 'Γ_N', cx + rx + 14, cy, { px: 15, align: 'left', color: pal.teal });
      } else if (stepIdx === 1) {
        // Weak form: Integration by parts transfer diagram
        const bw = Math.min(115, w * 0.36);
        const bh = 38;
        roundRectPath(ctx, cx - bw - 22, cy - bh * 0.5, bw, bh, 2);
        ctx.fillStyle = pal.surface;
        ctx.fill();
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        drawMathRun(ctx, '∫ (-u\'\') v', cx - bw * 0.5 - 22, cy, { px: 15, align: 'center', color: pal.cardinal });

        drawArrow(ctx, cx - 18, cy, cx + 18, cy, pal.amber, 2.4, 8);
        drawMathRun(ctx, 'IBP', cx, cy - 16, { px: 15, align: 'center', color: pal.amber });

        roundRectPath(ctx, cx + 22, cy - bh * 0.5, bw, bh, 2);
        ctx.fillStyle = pal.surface;
        ctx.fill();
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        drawMathRun(ctx, '∫ u\'v\' - [u\'v]', cx + bw * 0.5 + 22, cy, { px: 15, align: 'center', color: pal.teal });
      } else if (stepIdx === 2) {
        // Mesh: 4-triangle mesh with CCW orientation markers
        const mw = Math.min(w * 0.62, 190);
        const mh = Math.min(h * 0.58, 86);
        const x0 = cx - mw * 0.5, y0 = cy - mh * 0.5;
        const pts = [[x0, y0 + mh], [x0, y0], [x0 + mw * 0.5, y0 + mh], [x0 + mw * 0.5, y0], [x0 + mw, y0 + mh], [x0 + mw, y0]];
        const tris = [[0, 2, 1], [1, 2, 3], [3, 2, 4], [3, 4, 5]];
        const tCols = [pal.cardinal, pal.teal, pal.amber, pal.blue];
        tris.forEach(function (t, i) {
          ctx.beginPath();
          ctx.moveTo(pts[t[0]][0], pts[t[0]][1]);
          ctx.lineTo(pts[t[1]][0], pts[t[1]][1]);
          ctx.lineTo(pts[t[2]][0], pts[t[2]][1]);
          ctx.closePath();
          ctx.fillStyle = withAlpha(tCols[i], 0.22);
          ctx.fill();
          ctx.strokeStyle = tCols[i];
          ctx.lineWidth = 1.8;
          ctx.stroke();
        });
        pts.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
          ctx.fillStyle = pal.text;
          ctx.fill();
        });
      } else if (stepIdx === 3) {
        // Shape & Gauss: hat functions + Gauss points on [-1, 1]
        const pw = Math.min(w * 0.66, 200);
        const ph = Math.min(h * 0.56, 76);
        const x0 = cx - pw * 0.5, y0 = cy + ph * 0.45;
        ctx.strokeStyle = pal.axis;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x0 + pw, y0);
        ctx.stroke();
        // N1, N2, N3 curves
        [pal.blue, pal.teal, pal.amber].forEach(function (c, a) {
          ctx.strokeStyle = c;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (let s = 0; s <= 32; s++) {
            const xi = -1 + (2 * s) / 32;
            const val = a === 0 ? 0.5 * xi * (xi - 1) : (a === 1 ? 1 - xi * xi : 0.5 * xi * (xi + 1));
            const px = x0 + ((xi + 1) * 0.5) * pw;
            const py = y0 - val * ph;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        });
        GAUSS_1D[3].pts.forEach(function (g) {
          const px = x0 + ((g + 1) * 0.5) * pw;
          ctx.fillStyle = pal.cardinal;
          ctx.beginPath();
          ctx.arc(px, y0, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (stepIdx === 4) {
        // Assembly spy(K): crisp 5x5 overlapping banded matrix
        const side = Math.min(w * 0.44, h * 0.72, 100);
        const cell = side / 5;
        const x0 = cx - side * 0.5, y0 = cy - side * 0.5;
        const bCols = [pal.cardinal, pal.teal, pal.amber, pal.blue];
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            ctx.fillStyle = pal.surface;
            ctx.fillRect(x0 + c * cell + 1, y0 + r * cell + 1, cell - 2, cell - 2);
            if (Math.abs(r - c) <= 1) {
              const bi = Math.min(3, Math.min(r, c));
              ctx.fillStyle = withAlpha(bCols[bi], 0.78);
              ctx.fillRect(x0 + c * cell + 2, y0 + r * cell + 2, cell - 4, cell - 4);
            }
          }
        }
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x0, y0, side, side);
      } else if (stepIdx === 5) {
        // Solve & Post-process: thermal contour plate with flux arrows
        const mw = Math.min(w * 0.62, 180);
        const mh = Math.min(h * 0.64, 86);
        const x0 = cx - mw * 0.5, y0 = cy - mh * 0.5;
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = thermalColor(1 - i / 19, pal, 0.82);
          ctx.fillRect(x0 + (i / 20) * mw, y0, mw / 20 + 1, mh);
        }
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x0, y0, mw, mh);
        for (let k = 0; k < 3; k++) {
          const ay = y0 + mh * (0.25 + k * 0.25);
          drawArrow(ctx, x0 + mw * 0.2, ay, x0 + mw * 0.78, ay, pal.white, 2.2, 8);
        }
      } else {
        // Verify: crisp log-log convergence lines with slope triangle
        const pw = Math.min(w * 0.62, 180);
        const ph = Math.min(h * 0.64, 86);
        const x0 = cx - pw * 0.5, y0 = cy - ph * 0.5;
        ctx.strokeStyle = pal.axis;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + ph); ctx.lineTo(x0 + pw, y0 + ph);
        ctx.stroke();
        // O(h) line
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x0 + 12, y0 + ph * 0.48); ctx.lineTo(x0 + pw - 12, y0 + ph * 0.14);
        ctx.stroke();
        // O(h^2) line
        ctx.strokeStyle = pal.teal;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x0 + 12, y0 + ph * 0.88); ctx.lineTo(x0 + pw - 12, y0 + ph * 0.28);
        ctx.stroke();
        drawMathRun(ctx, 'O(h^2)', x0 + pw - 10, y0 + ph * 0.68, { px: 15, align: 'right', color: pal.teal });
      }

      ctx.restore();
    }

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 490;
      syncStageHeight(stage, 390, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = getPal(api);
      fillStageBg(ctx, w, h, pal);

      const cur = STEPS[activeStep];
      const curCol = pal[cur.colorKey];
      setStatusBadge(badgeEl, 'STEP ' + cur.num + ' / 07', 'safe');
      rStage.valEl.textContent = cur.title;
      setMathText(rSanity.valEl, cur.check.replace(/^Check:\s*/, ''));

      const pad = 10;
      tileRects = [];

      // Top zone: 7 clickable numbered step tiles (4+3 two-row wrap on narrow, 7-in-1 row on desktop)
      let railBottomY;
      if (isNarrow) {
        const gap = 6;
        const row1 = 4, row2 = 3;
        const tileH = 44;
        const w1 = (w - pad * 2 - gap * (row1 - 1)) / row1;
        const w2 = (w - pad * 2 - gap * (row2 - 1)) / row2;
        for (let i = 0; i < 7; i++) {
          const isR1 = i < 4;
          const colIdx = isR1 ? i : i - 4;
          const tw = isR1 ? w1 : w2;
          const tx = pad + colIdx * (tw + gap);
          const ty = pad + (isR1 ? 0 : tileH + gap);
          tileRects.push({ x: tx, y: ty, w: tw, h: tileH });
        }
        railBottomY = pad + tileH * 2 + gap;
      } else {
        const gap = 8;
        const tileH = 54;
        const tw = (w - pad * 2 - gap * 6) / 7;
        for (let i = 0; i < 7; i++) {
          const tx = pad + i * (tw + gap);
          tileRects.push({ x: tx, y: pad, w: tw, h: tileH });
        }
        railBottomY = pad + tileH;
      }

      // Draw tiles + connectors
      tileRects.forEach(function (rc, idx) {
        const st = STEPS[idx];
        const col = pal[st.colorKey];
        const isAct = idx === activeStep;
        const isDone = idx < activeStep;

        if (!isNarrow && idx < 6) {
          const next = tileRects[idx + 1];
          ctx.strokeStyle = isDone ? col : pal.border;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(rc.x + rc.w, rc.y + rc.h * 0.5);
          ctx.lineTo(next.x, next.y + next.h * 0.5);
          ctx.stroke();
        }

        roundRectPath(ctx, rc.x, rc.y, rc.w, rc.h, 2);
        ctx.fillStyle = isAct ? withAlpha(col, 0.22) : (isDone ? pal.surface2 : pal.surface);
        ctx.fill();
        ctx.strokeStyle = isAct ? col : (isDone ? withAlpha(col, 0.55) : pal.border);
        ctx.lineWidth = isAct ? 2.2 : 1.1;
        ctx.stroke();

        setFont(ctx, 15, true, 700);
        ctx.fillStyle = isAct || isDone ? col : pal.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.num, rc.x + rc.w * 0.5, rc.y + rc.h * 0.34);

        if (rc.w >= 62) {
          setFont(ctx, 15, false, isAct ? 600 : 400);
          ctx.fillStyle = isAct ? pal.text : pal.textMuted;
          ctx.fillText(st.short, rc.x + rc.w * 0.5, rc.y + rc.h * 0.72);
        }
      });

      // Bottom detail plate for the active step
      const detailY = railBottomY + 12;
      const detailH = Math.max(120, h - detailY - pad);
      const detailW = w - pad * 2;
      roundRectPath(ctx, pad, detailY, detailW, detailH, 2);
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.strokeStyle = withAlpha(curCol, 0.72);
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Detail header & formula
      drawMathRun(ctx, cur.title, pad + 14, detailY + 20, { px: 16, weight: 700, color: curCol });

      // Micro visual inside detail plate
      const visTop = detailY + 38;
      const visBot = detailY + detailH - 58;
      const visH = Math.max(66, visBot - visTop);
      drawMicroVisual(ctx, activeStep, pad + 14, visTop, detailW - 28, visH, curCol, pal);

      // Core formula & verification line below micro visual
      drawMathRun(ctx, cur.eq, pad + 14, detailY + detailH - 38, {
        px: 15,
        mono: true,
        color: pal.text
      });
      drawMathRun(ctx, cur.check, pad + 14, detailY + detailH - 16, {
        px: 15,
        weight: 500,
        color: pal.teal
      });
    }

    bag.on(canvas, 'click', function (ev) {
      const pt = getPointerPos(canvas, ev);
      for (let i = 0; i < tileRects.length; i++) {
        const r = tileRects[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
          activeStep = i;
          draw();
          return;
        }
      }
    });

    bag.on(btnPrev, 'click', function () {
      activeStep = (activeStep + STEPS.length - 1) % STEPS.length;
      draw();
    });
    bag.on(btnNext, 'click', function () {
      activeStep = (activeStep + 1) % STEPS.length;
      draw();
    });
    bag.on(btnReset, 'click', function () {
      activeStep = 0;
      draw();
    });

    bag.observe(stage, draw);
    draw();

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });

  /* ==========================================================================
   * LAB 11: takeaways-fem-bridge (Slide 22: ME 335A -> 335B -> 335C Bridge)
   * ========================================================================== */

  registerLab('takeaways-fem-bridge', function (mountEl, api) {
    const bag = createBag();

    const TIERS = [
      {
        code: 'ME 335A',
        label: 'ME 335A · Elliptic',
        name: 'Linear Elliptic Statics',
        eq: 'K U = F',
        challenge: 'Locking, quadrature rank, Céa convergence',
        colorKey: 'teal'
      },
      {
        code: 'ME 335B',
        label: 'ME 335B · Dynamics',
        name: 'Linear Structural Dynamics',
        eq: 'M Ü + K U = F(t)',
        challenge: 'Mass matrix M, eigenmodes ω_n, Newmark stability',
        colorKey: 'amber'
      },
      {
        code: 'ME 335C',
        label: 'ME 335C · Nonlinear',
        name: 'Nonlinear Finite Elements',
        eq: 'K_T ΔU = -R(U)',
        challenge: 'Finite strain F, tangent K_T, Newton-Raphson',
        colorKey: 'cardinal'
      }
    ];

    let activeTier = 0;
    let animT = 0;
    let tierRects = [];

    const shell = el('div', 'lab-shell');
    const toolbar = el('div', 'lab-toolbar');
    const pillGroup = el('div', 'lab-pill-group');
    const pillBtns = TIERS.map(function (t, i) {
      const b = el('button', 'lab-pill' + (i === activeTier ? ' is-active' : ''), t.label);
      b.type = 'button';
      pillGroup.appendChild(b);
      return b;
    });
    const badgeEl = el('span', 'lab-badge-status is-safe', 'KU = F');
    toolbar.appendChild(pillGroup);
    toolbar.appendChild(badgeEl);

    const stage = el('div', 'lab-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'lab-canvas';
    stage.appendChild(canvas);

    const readouts = el('div', 'lab-readout-row');
    const rCourse = createReadoutChip('Course', TIERS[0].code);
    const rEq = createReadoutChip('System', TIERS[0].eq);
    const rKey = createReadoutChip('Focus', TIERS[0].challenge);
    readouts.appendChild(rCourse.chip);
    readouts.appendChild(rEq.chip);
    readouts.appendChild(rKey.chip);

    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(readouts);
    mountEl.innerHTML = '';
    mountEl.appendChild(shell);

    function selectTier(idx) {
      activeTier = idx;
      pillBtns.forEach(function (b, i) {
        b.classList.toggle('is-active', i === activeTier);
      });
      const t = TIERS[activeTier];
      rCourse.valEl.textContent = t.code;
      setMathText(rEq.valEl, t.eq);
      setMathText(rKey.valEl, t.challenge);
      setStatusBadge(badgeEl, t.eq, activeTier === 0 ? 'safe' : (activeTier === 1 ? 'warn' : 'danger'));
      draw();
    }

    function drawPreviewPane(ctx, box, pal) {
      const t = TIERS[activeTier];
      const col = pal[t.colorKey];

      ctx.save();
      roundRectPath(ctx, box.x, box.y, box.w, box.h, 2);
      ctx.fillStyle = pal.surface;
      ctx.fill();
      ctx.strokeStyle = withAlpha(col, 0.72);
      ctx.lineWidth = 1.6;
      ctx.stroke();

      drawMathRun(ctx, t.code + ': ' + t.name, box.x + 12, box.y + 18, {
        px: 15,
        weight: 700,
        color: col
      });

      const ix = box.x + 16;
      const iy = box.y + 38;
      const iw = Math.max(80, box.w - 32);
      const ih = Math.max(70, box.h - 70);

      if (activeTier === 0) {
        // Static 2D elliptic contour field on triangulated mesh
        const nx = 8, ny = 4;
        const cw = iw / nx, ch = ih / ny;
        for (let j = 0; j < ny; j++) {
          for (let i = 0; i < nx; i++) {
            const u = (i + 0.5) / nx;
            const v = (j + 0.5) / ny;
            const field = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * 0.65 + (1 - u) * 0.35;
            const x0 = ix + i * cw, y0 = iy + j * ch;
            ctx.fillStyle = thermalColor(field, pal, 0.80);
            ctx.fillRect(x0, y0, cw + 0.5, ch + 0.5);
            ctx.strokeStyle = withAlpha(pal.bg, 0.35);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x0, y0); ctx.lineTo(x0 + cw, y0 + ch);
            ctx.stroke();
          }
        }
        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(ix, iy, iw, ih);
        drawMathRun(ctx, '1 SPD solve -> nodal U_h', box.x + box.w * 0.5, box.y + box.h - 15, {
          px: 15,
          align: 'center',
          color: pal.textMuted
        });
      } else if (activeTier === 1) {
        // Live animated elastic beam eigenmode oscillation (Mode 1 + Mode 2 superposition)
        const midY = iy + ih * 0.5;
        const amp1 = ih * 0.32 * Math.sin(animT * 2.4);
        const amp2 = ih * 0.14 * Math.sin(animT * 5.6);

        // Baseline undeformed beam
        ctx.strokeStyle = withAlpha(pal.textMuted, 0.4);
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ix, midY); ctx.lineTo(ix + iw, midY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vibrating beam ribbon & FEM nodes
        const segs = 12;
        ctx.strokeStyle = pal.amber;
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        for (let s = 0; s <= 60; s++) {
          const xi = s / 60;
          const disp = amp1 * Math.sin(Math.PI * xi) + amp2 * Math.sin(2 * Math.PI * xi);
          const px = ix + xi * iw;
          const py = midY - disp;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        for (let s = 0; s <= segs; s++) {
          const xi = s / segs;
          const disp = amp1 * Math.sin(Math.PI * xi) + amp2 * Math.sin(2 * Math.PI * xi);
          const px = ix + xi * iw;
          const py = midY - disp;
          ctx.beginPath();
          ctx.arc(px, py, s === 0 || s === segs ? 5 : 3.8, 0, Math.PI * 2);
          ctx.fillStyle = s === 0 || s === segs ? pal.cardinal : pal.amber;
          ctx.fill();
        }
        drawMathRun(ctx, 'Modal: K φ_n = ω_n^2 M φ_n', box.x + box.w * 0.5, box.y + box.h - 15, {
          px: 15,
          align: 'center',
          color: pal.textMuted
        });
      } else {
        // Nonlinear Newton-Raphson quadratic residual convergence (log10 ||R_k|| vs iteration k=0..5)
        const resLogs = [0.0, -0.8, -1.9, -4.1, -8.4, -15.0];
        const padL = 46;
        const px0 = ix + padL, pw = Math.max(70, iw - padL - 10);
        const py0 = iy + 6, ph = Math.max(54, ih - 24);

        ctx.strokeStyle = pal.axis;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px0, py0); ctx.lineTo(px0, py0 + ph); ctx.lineTo(px0 + pw, py0 + ph);
        ctx.stroke();

        function xIt(k) { return px0 + (k / 5) * pw; }
        function yLog(lv) { return py0 + ph - ((clamp(lv, -15, 0) + 15) / 15) * ph; }

        [0, -5, -10, -15].forEach(function (lv) {
          const py = yLog(lv);
          ctx.strokeStyle = pal.grid;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px0, py); ctx.lineTo(px0 + pw, py);
          ctx.stroke();
          setFont(ctx, 15, true, 400);
          ctx.fillStyle = pal.textMuted;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText('10^' + lv, px0 - 6, py);
        });

        // Quadratic convergence polyline
        ctx.strokeStyle = pal.cardinal;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        resLogs.forEach(function (lv, k) {
          const px = xIt(k), py = yLog(lv);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        const pulseIdx = Math.floor(animT * 1.4) % resLogs.length;
        resLogs.forEach(function (lv, k) {
          const px = xIt(k), py = yLog(lv);
          const isPulse = k === pulseIdx;
          ctx.beginPath();
          ctx.arc(px, py, isPulse ? 6.5 : 4.5, 0, Math.PI * 2);
          ctx.fillStyle = isPulse ? pal.amber : pal.cardinal;
          ctx.fill();
          ctx.strokeStyle = pal.white;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          setFont(ctx, 15, true, 500);
          ctx.fillStyle = pal.textMuted;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('k=' + k, px, py0 + ph + 4);
        });

        const nrCap = box.w < 250 ? '‖R_{k+1}‖ ≤ C‖R_k‖^2' : 'Newton: ‖R_{k+1}‖ ≤ C‖R_k‖^2';
        drawMathRun(ctx, nrCap, box.x + box.w * 0.5, box.y + box.h - 15, {
          px: 15,
          align: 'center',
          color: pal.textMuted
        });
      }

      ctx.restore();
    }

    function draw() {
      const stageW = getStageWidth(stage, canvas);
      if (stageW < 10) return;
      const isNarrow = stageW < 520;
      syncStageHeight(stage, 390, isNarrow && window.innerWidth <= 980);

      const fit = fitCanvas(canvas);
      if (!fit.ready) return;
      const ctx = fit.ctx;
      const w = fit.w;
      const h = fit.h;
      const pal = getPal(api);
      fillStageBg(ctx, w, h, pal);

      const pad = 10;
      tierRects = [];

      if (isNarrow) {
        // 3 compact clickable tier bands on top + preview pane below
        const gap = 8;
        const bandH = 44;
        const bandW = (w - pad * 2 - gap * 2) / 3;
        for (let i = 0; i < 3; i++) {
          tierRects.push({ x: pad + i * (bandW + gap), y: pad, w: bandW, h: bandH });
        }
        tierRects.forEach(function (rc, i) {
          const t = TIERS[i];
          const col = pal[t.colorKey];
          const isAct = i === activeTier;
          roundRectPath(ctx, rc.x, rc.y, rc.w, rc.h, 2);
          ctx.fillStyle = isAct ? withAlpha(col, 0.22) : pal.surface;
          ctx.fill();
          ctx.strokeStyle = isAct ? col : pal.border;
          ctx.lineWidth = isAct ? 2.2 : 1.1;
          ctx.stroke();
          setFont(ctx, 15, true, 700);
          ctx.fillStyle = isAct ? col : pal.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(t.code, rc.x + rc.w * 0.5, rc.y + rc.h * 0.5);
        });
        drawPreviewPane(ctx, { x: pad, y: pad + bandH + 12, w: w - pad * 2, h: h - bandH - pad * 2 - 12 }, pal);
      } else {
        // Side-by-side: left 42% = 3 stacked clickable course bridge tiers, right 58% = live preview pane
        const leftW = Math.floor((w - pad * 3) * 0.42);
        const gapY = 12;
        const cardH = (h - pad * 2 - gapY * 2) / 3;

        for (let i = 0; i < 3; i++) {
          const cy = pad + i * (cardH + gapY);
          tierRects.push({ x: pad, y: cy, w: leftW, h: cardH });
        }

        tierRects.forEach(function (rc, i) {
          const t = TIERS[i];
          const col = pal[t.colorKey];
          const isAct = i === activeTier;

          if (i < 2) {
            const nxt = tierRects[i + 1];
            drawArrow(ctx, rc.x + rc.w * 0.5, rc.y + rc.h + 1, nxt.x + nxt.w * 0.5, nxt.y - 1, pal.textMuted, 1.8, 7);
          }

          roundRectPath(ctx, rc.x, rc.y, rc.w, rc.h, 2);
          ctx.fillStyle = isAct ? withAlpha(col, 0.18) : pal.surface;
          ctx.fill();
          ctx.strokeStyle = isAct ? col : pal.border;
          ctx.lineWidth = isAct ? 2.2 : 1.2;
          ctx.stroke();

          drawMathRun(ctx, t.code + ' · ' + (i === 0 ? 'Statics' : (i === 1 ? 'Dynamics' : 'Nonlinear')), rc.x + 12, rc.y + rc.h * 0.34, {
            px: 15,
            weight: 700,
            color: isAct ? col : pal.text
          });
          drawMathRun(ctx, t.eq, rc.x + 12, rc.y + rc.h * 0.72, {
            px: 15,
            mono: true,
            color: pal.textMuted
          });
        });

        const rightX = pad * 2 + leftW;
        drawPreviewPane(ctx, { x: rightX, y: pad, w: w - rightX - pad, h: h - pad * 2 }, pal);
      }
    }

    pillBtns.forEach(function (btn, idx) {
      bag.on(btn, 'click', function () { selectTier(idx); });
    });

    bag.on(canvas, 'click', function (ev) {
      const pt = getPointerPos(canvas, ev);
      for (let i = 0; i < tierRects.length; i++) {
        const r = tierRects[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
          selectTier(i);
          return;
        }
      }
    });

    bag.loop(api, function (dt) {
      if (activeTier === 1 || activeTier === 2) {
        animT += dt;
        draw();
      }
    });

    bag.observe(stage, draw);
    selectTier(0);

    return {
      onResize: draw,
      onThemeChange: draw,
      onSlideEnter: draw,
      onSlideLeave: function () {},
      destroy: function () { bag.clear(); }
    };
  });
})();
