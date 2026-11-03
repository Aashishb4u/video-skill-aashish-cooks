// Cooks figures: Aashish Cooks' own isometric line figures, drawn in the hairline look and
// driven the same way (video-time clock, a scripted pointer, tone and intensity).
// The projection and plate math below is adapted from @lucasmarkes/hairline (MIT, Lucas Marques).
//
// A figure file (figures/<name>.js) calls:
//   CF.add('name', { label, aliases: ['other-name'], box: [[x0, y0, z0], [x1, y1, z1]], make(K) { ...; return (t, p) => { ... } } })
// make(K) builds the parts once, back to front (later parts draw on top). The returned function runs
// every 1/120 s of video time: t = seconds since the figure started, p = pointer [u, v] (0-1 across
// the figure) or null. Read K.amt (intensity, 0-1) to scale motion. See references/figure-maker.md.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rad = d => d * Math.PI / 180;
  const r2 = n => Math.round(n * 100) / 100;
  const poly = pts => pts.length ? 'M' + pts.map(p => r2(p[0]) + ' ' + r2(p[1])).join('L') + 'Z' : '';
  const open = pts => pts.length < 2 ? '' : 'M' + pts.map(p => r2(p[0]) + ' ' + r2(p[1])).join('L');

  // ---- camera (hairline's iso projection) ----
  const Cam = (az, k, S) => ({ az: rad(az), k, S, ox: 0, oy: 0 });
  function proj(C) {
    const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
    return (x, y, z) => { const X = x * c - y * s, Y = x * s + y * c; return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * zf)]; };
  }
  function fit(C, pts, cx, cy, w, h) {
    // scale and centre the figure's box into w x h around (cx, cy)
    C.ox = 0; C.oy = 0; C.S = 1;
    let P = proj(C), a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const p of pts) { const q = P(p[0], p[1], p[2]); a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); }
    C.S = Math.min(w / Math.max(1e-6, b - a), h / Math.max(1e-6, d - c));
    P = proj(C); a = 1e9; b = -1e9; c = 1e9; d = -1e9;
    for (const p of pts) { const q = P(p[0], p[1], p[2]); a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); }
    C.ox = cx - (a + b) / 2; C.oy = cy - (c + d) / 2;
  }

  // ---- outlines on a plane: rings of {u, v, nu, nv} ----
  function rrect(u0, v0, u1, v1, r, n = 5) {
    r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
    const out = [];
    for (const [cu, cv, a0] of [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]])
      for (let k = 0; k <= n; k++) { const a = rad(a0 + 90 * k / n), ca = Math.cos(a), sa = Math.sin(a); out.push({ u: cu + r * ca, v: cv + r * sa, nu: ca, nv: sa }); }
    return out;
  }
  function circ(cx, cy, R, n = 40) {
    const out = [];
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); out.push({ u: cx + R * ca, v: cy + R * sa, nu: ca, nv: sa }); }
    return out;
  }
  // any closed shape from [u, v] points (normals from the centre: fine for convex-ish shapes)
  function shape(pts) {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return pts.map(([u, v]) => { const l = Math.hypot(u - cx, v - cy) || 1; return { u, v, nu: (u - cx) / l, nv: (v - cy) / l }; });
  }
  function hull(input) {
    const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  const facing = C => { const s = Math.sin(C.az), c = Math.cos(C.az); return q => q.nu * s + q.nv * c >= -1e-6; };
  function run(ring, keep) {
    const n = ring.length; let s = -1;
    for (let i = 0; i < n; i++) if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) { s = i; break; }
    if (s < 0) return keep(ring[0]) ? ring.slice() : [];
    const out = []; for (let k = 0; k < n && keep(ring[(s + k) % n]); k++) out.push(ring[(s + k) % n]); return out;
  }
  const moved = (ring, dx, dy) => (dx || dy) ? ring.map(q => ({ ...q, u: q.u + dx, v: q.v + dy })) : ring;
  const inside = (pt, pg) => { let c = false; for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) { const [xi, yi] = pg[i], [xj, yj] = pg[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; };

  // ---- look: same classes and colour variables as hairline (tone comes from --hairline-*) ----
  const CSS = `
[data-cf]{display:block;position:relative;--cf-sw:var(--hairline-stroke,1.5)}
[data-cf]>svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}
[data-cf] svg :where(path,polygon,ellipse,line,circle){fill:var(--hairline-plate,#fff);stroke:var(--hairline-mid,#c3c3c9);stroke-width:var(--cf-sw);vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}
[data-cf] svg .nf{fill:none}
[data-cf] svg .fo{stroke:none}
[data-cf] svg .sil{stroke:var(--hairline-edge,#a4a4ac)}
[data-cf] svg .hi{stroke:var(--hairline-hi,#232327)}
[data-cf] svg .lo{stroke:var(--hairline-lo,#e0e0e4)}
[data-cf] svg .dash{stroke-dasharray:1 3}
[data-cf] svg .ink{fill:var(--hairline-hi,#232327);stroke:none}
[data-cf] svg .soft{fill:var(--hairline-lo,#e0e0e4);stroke:none}
[data-cf] svg .accent{fill:var(--accent,#D30135);stroke:none}
[data-cf] svg .accent-line{fill:none;stroke:var(--accent,#D30135)}
[data-cf] svg .pl{fill:var(--hairline-plate,#fff);stroke:none}`;
  function injectCSS() {
    if (document.getElementById('cf-css')) return;
    const s = document.createElement('style'); s.id = 'cf-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  function mk(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---- the kit handed to every figure ----
  function makeKit(svg, C, amt) {
    const P = proj(C), front = facing(C);
    // where a plane point (u, v) at height h sits in 3D: 'z' lies flat (default), 'x' stands up facing
    // front-right (u runs left to right, v up), 'y' stands up facing front-left
    const AX = {
      z: (u, v, h) => [u, v, h],
      x: (u, v, h) => [h, -u, v],
      y: (u, v, h) => [u, h, v],
    };
    const at3 = (axis, u, v, h) => P(...(AX[axis] || AX.z)(u, v, h));
    // which rim points face the viewer (draws the bevel crease on the near edges, like hairline)
    const nearRim = axis => {
      if (axis === 'z' || !AX[axis]) return front;
      return q => { const a = at3(axis, 0, 0, 0), b = at3(axis, q.nu, q.nv, 0); return (b[1] - a[1]) > 1e-6 || (b[0] - a[0]) > 1e-6; };
    };
    const K = {
      P, amt, clamp, lerp,
      rr: (u0, v0, u1, v1, r = 4, n = 5) => rrect(u0, v0, u1, v1, r, n),
      circle: (cx, cy, r, n = 40) => circ(cx, cy, r, n),
      shape,
      // easing helpers (0-1 in, 0-1 out)
      ease: x => { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
      out: x => 1 - Math.pow(1 - clamp(x, 0, 1), 3),
      win: (t, a, d) => clamp((t - a) / d, 0, 1),                       // progress of a window that starts at a and lasts d
      pulse: (t, period, width = .25) => { const x = ((t % period) + period) % period / period; return x < width ? Math.sin(x / width * Math.PI) : 0; },
      g: () => mk('g', {}, svg),
      on: (axis, u, v, h) => (AX[axis] || AX.z)(u, v, h),   // a 3D point on a plane, for K.line()
      // an extruded plate (the hairline solid): outline ring, bevel inset for the crease
      plate(ring, bevel = 1.2, parent, axis = 'z') {
        const g = mk('g', {}, parent || svg), sil = mk('path', { class: 'sil' }, g), cr = mk('path', { class: 'nf lo' }, g);
        const cx = ring.reduce((s, q) => s + q.u, 0) / ring.length, cy = ring.reduce((s, q) => s + q.v, 0) / ring.length;
        const inner = ring.map(q => ({ ...q, u: q.u - q.nu * bevel, v: q.v - q.nv * bevel }));
        const part = {
          g, sil, ring, cx, cy,
          at(z0, z1, dx = 0, dy = 0) {
            const R = moved(ring, dx, dy), I = moved(inner, dx, dy);
            const top = R.map(q => at3(axis, q.u, q.v, z1)), bot = R.map(q => at3(axis, q.u, q.v, z0));
            sil.setAttribute('d', poly(hull(top.concat(bot))));
            cr.setAttribute('d', Math.abs(z1 - z0) > .05 ? open(run(I, nearRim(axis)).map(q => at3(axis, q.u, q.v, z1))) : '');
            part.top = top; part.z1 = z1; return part;
          },
          lit(on) { sil.classList.toggle('hi', !!on); return part; },
          hide(h) { g.style.display = h ? 'none' : ''; return part; },
          fade(a) { g.style.opacity = clamp(a, 0, 1); return part; },
          hit(p) { return !!(p && part.top && inside([p[0] * 400, p[1] * 320], part.top)); },
        };
        return part;
      },
      // a flat outline lying on a plane (screens, icons, text lines on top of a plate)
      face(ring, cls = 'nf', parent, axis = 'z') {
        const el = mk('path', { class: cls }, parent || svg);
        const part = {
          el, ring,
          at(z, dx = 0, dy = 0) { el.setAttribute('d', poly(moved(part.ring, dx, dy).map(q => at3(axis, q.u, q.v, z)))); return part; },
          cls(c) { el.setAttribute('class', c); return part; },
          hide(h) { el.style.display = h ? 'none' : ''; return part; },
          fade(a) { el.style.opacity = clamp(a, 0, 1); return part; },
        };
        return part;
      },
      // an open or closed polyline through 3D points
      line(cls = 'nf', parent) {
        const el = mk('path', { class: cls }, parent || svg);
        const part = {
          el,
          set(pts, closed = false) { const q = pts.map(p => P(p[0], p[1], p[2])); el.setAttribute('d', closed ? poly(q) : open(q)); return part; },
          // draw only the first share (0-1) of the line, for things that draw on
          partial(pts, share) {
            const q = pts.map(p => P(p[0], p[1], p[2])); let L = 0; const seg = [];
            for (let i = 1; i < q.length; i++) { const l = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); seg.push(l); L += l; }
            let left = L * clamp(share, 0, 1); const out = [q[0]];
            for (let i = 1; i < q.length && left > 0; i++) { const f = Math.min(1, left / (seg[i - 1] || 1)); out.push([lerp(q[i - 1][0], q[i][0], f), lerp(q[i - 1][1], q[i][1], f)]); left -= seg[i - 1]; }
            el.setAttribute('d', share > 0 ? open(out) : ''); return part;
          },
          cls(c) { el.setAttribute('class', c); return part; },
          hide(h) { el.style.display = h ? 'none' : ''; return part; },
          fade(a) { el.style.opacity = clamp(a, 0, 1); return part; },
        };
        return part;
      },
      // a dot lying on a plane (an ellipse in the iso view)
      dot(r, cls = 'ink', parent) {
        const el = mk('ellipse', { class: cls, rx: 1, ry: 1 }, parent || svg);
        const part = {
          el,
          at(x, y, z, scale = 1) { const q = P(x, y, z); el.setAttribute('cx', r2(q[0])); el.setAttribute('cy', r2(q[1])); el.setAttribute('rx', r2(r * C.S * scale)); el.setAttribute('ry', r2(r * C.S * C.k * scale)); return part; },
          cls(c) { el.setAttribute('class', c); return part; },
          hide(h) { el.style.display = h ? 'none' : ''; return part; },
          fade(a) { el.style.opacity = clamp(a, 0, 1); return part; },
        };
        return part;
      },
      // how close the pointer is to a 3D point (1 = on it, 0 = beyond radius r in figure units 0-1)
      near(p, x, y, z, r = .18) { if (!p) return 0; const q = P(x, y, z); return clamp(1 - Math.hypot(p[0] - q[0] / 400, p[1] - q[1] / 320) / r, 0, 1); },
      // smooth a value towards a target (frame-exact: the clock steps in fixed 1/120 s ticks)
      _s: {},
      follow(key, target, rate = 10) { const s = K._s; if (!(key in s)) s[key] = target; s[key] += (target - s[key]) * (1 - Math.exp(-rate * K.dt)); return s[key]; },
      dt: 1 / 120,
    };
    return K;
  }

  const REG = {};
  const CF = window.CF = {
    // register a figure; also callable through HL[name] like the hairline figures
    add(name, spec) {
      const factory = (host, opts = {}) => {
        injectCSS();
        host.setAttribute('data-cf', name);
        const svg = mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, null);
        host.appendChild(svg);
        const [a, b] = spec.box || [[0, 0, 0], [100, 100, 40]];
        const corners = []; for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) corners.push([x, y, z]);
        const C = Cam(spec.az ?? 45, spec.k ?? .5, 1);
        fit(C, corners, 200, 160, spec.fitW ?? 370, spec.fitH ?? 290);
        const K = makeKit(svg, C, clamp(+(opts.intensity ?? .6), 0, 1));
        let update = () => { };
        try { update = spec.make(K) || update; } catch (e) { console.error(`figure ${name}:`, e); }
        const t0 = performance.now(); let last = t0, p = null;
        const step = () => {
          const now = performance.now(); K.dt = Math.min(.05, Math.max(1 / 240, (now - last) / 1000)); last = now;
          try { update((now - t0) / 1000, p); } catch (e) { console.error(`figure ${name}:`, e); }
        };
        const onMove = e => { const r = svg.getBoundingClientRect(); p = r.width > 0 ? [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] : null; step(); };
        const onLeave = () => { p = null; step(); };
        svg.addEventListener('pointermove', onMove); svg.addEventListener('pointerleave', onLeave);
        K.dt = 0; step();
        return { set() { }, update() { }, destroy() { svg.removeEventListener('pointermove', onMove); svg.removeEventListener('pointerleave', onLeave); svg.remove(); host.removeAttribute('data-cf'); } };
      };
      REG[name] = spec;
      window.HL = window.HL || {};
      for (const n of [name].concat(spec.aliases || [])) if (!window.HL[n]) window.HL[n] = factory;
      return factory;
    },
    list: () => Object.keys(REG),
  };
})();
