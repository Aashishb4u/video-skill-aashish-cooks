// aashish-cooks engine. Everything on screen is a pure function of time t (seconds),
// so any frame can be rendered on its own: COOK.load(data) once, then COOK.frame(t, src) per frame.
'use strict';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const EASE = {
  out: p => 1 - Math.pow(1 - p, 3),
  quint: p => 1 - Math.pow(1 - p, 5),           // long soft settle: the default for things arriving
  inout: p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  smooth: p => (p < .5 ? 16 * Math.pow(p, 5) : 1 - Math.pow(-2 * p + 2, 5) / 2), // card moves
  lin: p => p,
};
const prog = (t, t0, d, e = 'quint') => EASE[e](clamp(d <= 0 ? (t >= t0 ? 1 : 0) : (t - t0) / d));
const lerp = (a, b, p) => a + (b - a) * p;
const lerpRect = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p), r: lerp(a.r, b.r, p), o: lerp(a.o ?? 1, b.o ?? 1, p) });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
const list = v => Array.isArray(v) ? v : (v == null || v === '' ? [] : String(v).split('|').map(s => s.trim()).filter(Boolean));
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Lucide icon by name (engine/lucide.js). ico('link', 16, '#95493F')
const ico = (name, size = 18, color = 'currentColor', sw = 2) => {
  const inner = (window.LUCIDE || {})[name] || (window.LUCIDE || {})['circle'] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">${inner}</svg>`;
};
const ICON = {
  check: ico('check', 12, '#fff', 3.4),
  book: ico('book-marked', 18, '#3F3726'),
  link: ico('link', 15, '#95493F', 2.2),
  doc: ico('file-text', 15, '#95493F', 2.2),
  plus: ico('plus', 15, '#3F3726', 2.2),
  up: ico('arrow-up', 17, '#fff', 2.6),
  heart: ico('heart', 16, '#3F3726'),
};
// Common words -> icon, for chips that name no icon ("Ideas" -> lightbulb).
const AUTO_ICON = { idea: 'lightbulb', ideas: 'lightbulb', script: 'pen-line', scripts: 'pen-line', thumbnail: 'image', thumbnails: 'image', editing: 'clapperboard', edit: 'clapperboard',
  upload: 'upload', comments: 'message-square', comment: 'message-square', analytics: 'chart-line', reviews: 'star', review: 'star', experience: 'award', clients: 'users', price: 'badge-indian-rupee',
  calendar: 'calendar-days', time: 'clock', hair: 'scissors', skin: 'sparkles', doctor: 'stethoscope', warning: 'triangle-alert', safe: 'shield-check' };
const iconFor = (label, explicit) => explicit || AUTO_ICON[String(label).toLowerCase().replace(/[^a-z]/g, '')] || 'circle-dot';
const splitIcon = s => { const m = String(s).match(/^(.*?)\s*:\s*([a-z0-9-]+)$/); return m ? [m[1], m[2]] : [s, null]; };

const FULL = { x: 0, y: 0, w: 720, h: 1280, r: 0, o: 1 };
const FULL_BOX = { x: 48, y: 214, w: 624, h: 560 };
const HDR = 58, FOOT = 46, BAR_FULL = 826;
const RISE_TOP = 115;            // below Instagram's top bar
const CAP_BOTTOM = 1088;         // captions end 15% above the bottom (Instagram name / caption area)
// hairline figure palettes, in the cooks theme
const FIG_TONES = {
  ink: { plate: '#FDFDF3', hi: '#0A0705', edge: '#6F6556', mid: '#A99E8A', lo: '#DDD5C4' },
  terra: { plate: '#FDFDF3', hi: '#CC6350', edge: '#9C6455', mid: '#C4A497', lo: '#EADBD1' },
  crimson: { plate: '#FDFDF3', hi: '#D30135', edge: '#9A4652', mid: '#C9A0A6', lo: '#EDD8DA' },
};

const COOK = {
  ticks: [], warnings: [], data: null,

  async load(data) {
    this.data = data;
    const P = data.plan || {};
    this.P = P; this.duration = data.duration || 30; this.assets = data.assets || {};
    this.track = data.track || null; this.cues = []; this.figs = [];
    if (P.accent) document.documentElement.style.setProperty('--accent', P.accent);
    // layout: "top" = card above the head (reference); "below" = card under the chin, captions above the head
    this.layout = P.layout === 'below' ? 'below' : 'top';
    this.cardY = +(P.card_y ?? (this.layout === 'below' ? 790 : 148));
    this.maxContent = this.layout === 'below' ? Math.min(272, 1168 - this.cardY - HDR - FOOT) : 268;
    // base camera: "frame": {"zoom", "y"} zooms from the top edge
    { const f = P.frame || {}; const z = f.zoom || 1; this.baseCam = { a: z, tx: 360 * (1 - z), ty: +(f.y || 0) }; }
    this.cams = []; this.grades = []; this.personFx = []; this.copies = []; this.freezes = [];
    this.buildHeader();
    this.buildCardTrack();
    this.buildBar();
    this.buildHooks();
    this.buildCaptions();
    this.buildMascots();
    this.buildIllustrations();
    this.buildEffects();
    await document.fonts.ready;
    // captions: Kalam Bold by default; "author" = Author Handwriting (personal-use licence), "caveat" = Caveat
    const cf = this.P.captions?.font || 'kalam';
    if (cf === 'author') {
      try { await document.fonts.load('39px "Author Handwriting"'); } catch (e) { }
      const ok = [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Author Handwriting' && f.status === 'loaded');
      if (ok) document.body.classList.add('hand'); else this.warnings.push('captions.font "author" asked for, but fonts/author_handwriting/ has no font file: using Kalam');
    } else if (cf === 'caveat') document.body.classList.add('caveat');
    try { await document.fonts.load('700 39px Kalam'); } catch (e) { }
    return this.warnings;
  },

  async frame(t, src, mask) {
    for (const [a, b, fsrc] of this.freezes) if (t >= a && t < b && fsrc) { src = fsrc; break; }  // freeze-frame effects
    this.src = src;
    const img = document.getElementById('frame');
    if (src && img.dataset.src !== src) {
      img.src = src; img.dataset.src = src;
      try { await img.decode(); } catch (e) { }
    }
    const per = document.getElementById('person');
    if (mask && per.dataset.mask !== mask) {
      const m = new Image(); m.src = mask; try { await m.decode(); } catch (e) { }
      per.style.backgroundImage = `url("${src}")`;
      per.style.webkitMaskImage = per.style.maskImage = `url("${mask}")`;
      per.dataset.mask = mask;
    }
    this.hasMask = !!mask;
    // effects that draw copies of the frame (swipe, rabbit-hole, reel-frame...) get the same picture, decoded
    const live = this.copies.filter(c => t >= c._a && t <= c._b && c.dataset.src !== src);
    for (const c of live) { c.src = src; c.dataset.src = src; }
    if (live.length) await Promise.all(live.map(c => c.decode().catch(() => { })));
    this.render(t);
    return true;
  },

  render(t) {
    this.t = t;
    this.renderCard(t);
    this.applyScene(t);
    for (const fn of this.ticks) fn(t);
    this.tickFigures(t);
  },

  buildHeader() {
    const P = this.P;
    const icons = document.querySelector('#hdr .icons');
    const files = list(P.icons);
    if (files.length) for (const f of files) {
      if (/^[a-z0-9-]+$/.test(f) && (window.LUCIDE || {})[f]) icons.insertAdjacentHTML('beforeend', ico(f, 20, 'var(--terra)', 2.2));
      else { const i = el('img', '', icons); i.src = f; }
    }
    else icons.innerHTML = ico(P.icon || 'sparkles', 20, 'var(--terra)', 2.2);
    document.querySelector('#hdr .title').textContent = P.title || 'Aashish Cooks';
  },

  // ---------- card track ----------
  contentH(T) { const s = Math.min(1, 588 / T.w); return Math.min(this.maxContent, Math.round(T.h * s)); },
  cardRect(h) { return { x: 40, y: this.cardY, w: 640, h, r: 22, o: 1 }; },
  riseRect(h) { return { x: 40, y: RISE_TOP, w: 640, h, r: 22, o: 1 }; },
  // top of the person (hair) on the stage at time t, from the face/mask track
  headTop(t) {
    const T = this.track; if (!T || !T.top || !T.top.length) return null;
    const i = clamp(Math.round(t * T.fps), 0, T.top.length - 1); return T.top[i];
  },
  // the space above the head over [s, e]: highest head point minus a gap
  riseZone(s, e) {
    const T = this.track;
    if (!T || !T.top || !T.top.length) { this.warnings.push(`rise-card at ${s}s: no head track, using a 300px card`); return 300; }
    let hi = Infinity;
    for (let i = Math.max(0, Math.floor(s * T.fps)); i <= Math.min(T.top.length - 1, Math.ceil(e * T.fps)); i++) if (T.top[i] != null) hi = Math.min(hi, T.top[i]);
    if (!isFinite(hi)) return 300;
    const h = Math.round(hi - 24 - RISE_TOP);
    if (h < 220) this.warnings.push(`rise-card at ${s}s: only ${Math.max(0, h)}px above the head (needs 220). The card will touch the head: reframe with more empty space on top`);
    return clamp(h, 220, 420);
  },

  buildCardTrack() {
    const KINDS = { 'card-in': 'in', 'card-swap': 'swap', 'boom-card': 'boom', 'boom-card-back': 'back', 'card-out': 'out', 'rise-card': 'rise', 'rise-out': 'out' };
    const evs = (this.P.effects || []).filter(e => KINDS[e.fx]).map(e => ({ ...e, kind: KINDS[e.fx], at: +(e.at ?? e.start ?? 0) })).sort((a, b) => a.at - b.at);
    this.events = []; this.blocks = [];
    // rise windows first: each rise-card's height comes from the space above the head while it is up
    const riseH = new Map();
    evs.forEach((ev, i) => { if (ev.kind === 'rise') { const end = (evs.slice(i + 1).find(x => x.kind === 'out') || {}).at ?? this.duration; riseH.set(ev, this.riseZone(ev.at, end + .5)); } });
    let mode = 'none', cur = null, home = 'card', rh = 300;
    const content = document.getElementById('content');
    for (const ev of evs) {
      const opening = ev.kind === 'in' || ev.kind === 'rise';
      if (opening && mode !== 'none') { this.warnings.push(`${ev.fx} at ${ev.at}s ignored: a card is already on screen (use card-swap)`); continue; }
      if (!opening && mode === 'none') { this.warnings.push(`${ev.fx} at ${ev.at}s ignored: no card on screen (start with card-in or rise-card)`); continue; }
      const from = mode;
      if (ev.kind === 'in') home = 'card';
      if (ev.kind === 'rise') { home = 'rise'; rh = riseH.get(ev); }
      mode = { in: 'card', rise: 'rise', swap: mode, boom: 'full', back: home, out: 'none' }[ev.kind];
      ev.home = home; ev.riseH = rh;
      this.cues.push({ at: ev.at, kind: ev.kind, from });
      if (ev.kind === 'boom' && from === 'full') this.warnings.push(`boom-card at ${ev.at}s: already full screen`);
      if (ev.kind === 'back' && from !== 'full') this.warnings.push(`boom-card-back at ${ev.at}s: already a card`);
      const newTpl = ev.show && ev.kind !== 'out';
      if ((newTpl || ev.kind === 'out') && cur) { cur.end = ev.at; cur.outKind = ev.kind; cur = null; }
      if (ev.kind === 'swap' && !ev.show) this.warnings.push(`card-swap at ${ev.at}s has no "show": nothing to swap to`);
      if (newTpl) {
        const T = TPL[ev.show];
        if (!T) { this.warnings.push(`unknown card content "${ev.show}" at ${ev.at}s. Known: ${Object.keys(TPL).join(', ')}`); continue; }
        const lead = { in: (ev.style === 'pill' ? .5 : .38), rise: .45, swap: .2, boom: .4, back: .42 }[ev.kind];
        if (mode === 'full') ev._full = true;   // content born full screen gets its big layout
        const sz = T.size ? T.size(ev) : { w: T.w, h: T.h };
        const root = el('div', 'seg', content);
        root.style.width = sz.w + 'px'; root.style.height = sz.h + 'px';
        cur = { T, opts: ev, root, w: sz.w, h: sz.h, start: ev.at, t0: ev.at + lead, end: this.duration + 1, inKind: ev.kind, outKind: null,
          status: ev.status ?? T.status ?? '', chapter: ev.chapter ?? ev.status ?? T.status ?? ev.show,
          ch: home === 'rise' ? rh - HDR - FOOT : this.contentH(sz), home };
        this.blocks.push(cur);
      } else if (cur && ev.status) {
        this.blocks.push({ ...cur, alias: true, start: ev.at, status: ev.status, chapter: ev.chapter ?? ev.status });
      }
      this.events.push({ ...ev, from, to: mode, block: cur });
    }
    // card height before/after each event (the card resizes to fit its content)
    let prevH = 268;
    for (const ev of this.events) { ev.hFrom = prevH; ev.hTo = ev.block ? ev.block.ch : prevH; prevH = ev.hTo; }
    for (const b of this.blocks) {
      if (b.alias) continue;
      const ctx = this.ctx(b);
      try { b.T.build(b.root, b.opts, ctx); } catch (e) { this.warnings.push(`${b.opts.show}: ${e.message}`); }
    }
    this.statusEl = document.querySelector('#status span');
  },

  ctx(b) {
    const C = this;
    const x = {
      t0: b.t0, get end() { return b.end; }, get dur() { return Math.max(.6, b.end - b.t0); },
      get k() { return clamp((b.end - b.t0) / (b.T.ideal || 2.2), .6, 1.6); },
      at(off) { return b.t0 + off * x.k; },
      time(v, off) { return v != null && v !== '' && !isNaN(+v) ? +v : x.at(off); },
      tick(fn) { C.ticks.push(fn); },
      cue(kind, at, dur) { if (at < b.end) C.cues.push({ at, kind, dur: dur ?? 0 }); },
      figure(host, o, s, e) { C.addFigure(host, o, s, e ?? b.end); },
      ico,
      // arrive: fade from blur while sliding up and settling (soft, no bounce)
      show(e, start, opt = {}) {
        const d = opt.dur ?? .42, s0 = opt.scale ?? .97, bl = opt.blur ?? 7, dy = opt.dy ?? 12, dx = opt.dx ?? 0;
        e.style.opacity = 0;
        C.ticks.push(t => {
          const p = prog(t, start, d, 'quint'), po = prog(t, start, d * .7, 'out');
          e.style.opacity = po;
          e.style.filter = p < .999 ? `blur(${(1 - po) * bl}px)` : '';
          e.style.transform = (opt.base || '') + ` translate(${(1 - p) * dx}px,${(1 - p) * dy}px) scale(${lerp(s0, 1, p)})`;
        });
      },
      hideAt(e, start, d = .25) { C.ticks.push(t => { if (t >= start) { const p = prog(t, start, d, 'out'); e.style.opacity = Math.min(+e.style.opacity || 1, 1 - p); e.style.filter = `blur(${p * 6}px)`; } }); },
      type(e, text, start, opt = {}) {
        const cps = opt.cps ?? 30; text = String(text ?? '');
        const chars = [...text];
        const span = el('span', '', e), caret = opt.caret === false ? null : el('i', 'caret', e);
        const endT = start + chars.length / cps, hold = opt.hold ?? .5;
        if (opt.sfx !== false && endT - start >= .3) x.cue('type', start, endT - start);
        C.ticks.push(t => {
          const n = t < start ? 0 : Math.min(chars.length, Math.floor((t - start) * cps + 1e-6));
          if (span._n !== n) { span.textContent = chars.slice(0, n).join(''); span._n = n; }
          if (caret) caret.style.opacity = (t >= start - .3 && t <= endT + hold) ? ((t < endT || Math.floor((t - endT) * 2.2) % 2 === 0) ? 1 : 0) : 0;
        });
        return endT;
      },
      typeWords(e, text, start, opt = {}) {
        const words = String(text ?? '').split(/\s+/).filter(Boolean), gap = opt.gap ?? .11;
        words.forEach((w, i) => { const s = el('span', '', e, esc(w) + (i < words.length - 1 ? ' ' : '')); s.style.display = 'inline-block'; s.style.whiteSpace = 'pre'; x.show(s, start + i * gap, { dur: .45, blur: 6, scale: 1, dy: 10 }); });
        return start + words.length * gap + .3;
      },
      count(e, from, to, start, d, fmt = v => Math.round(v)) {
        x.cue('cook', start, d);
        C.ticks.push(t => { e.textContent = fmt(lerp(from, to, prog(t, start, d, 'out'))); });
      },
      // odometer: steps = [[time, text], ...]; each change rolls the old value up and the new one in from below
      roll(e, steps) {
        if (steps.length > 1) x.cue('cook', steps[0][0], steps[steps.length - 1][0] - steps[0][0] + .2);
        e.style.position = e.style.position || 'absolute'; e.style.overflow = 'hidden';
        const a = el('span', '', e), b = el('span', '', e);
        for (const s of [a, b]) s.style.cssText = 'position:absolute;left:0;right:0;top:0;text-align:inherit;';
        C.ticks.push(t => {
          let i = -1; for (let j = 0; j < steps.length; j++) if (steps[j][0] <= t) i = j;
          const curT = i >= 0 ? steps[i][1] : '', prevT = i > 0 ? steps[i - 1][1] : '';
          const p = i >= 0 ? prog(t, steps[i][0], .32, 'quint') : 0, H = e.offsetHeight || 60;
          a.textContent = prevT; b.textContent = curT;
          a.style.transform = `translateY(${-p * H * .7}px)`; a.style.opacity = 1 - p;
          b.style.transform = `translateY(${(1 - p) * H * .7}px)`; b.style.opacity = i >= 0 ? p : 0;
          a.style.filter = `blur(${p * 3}px)`; b.style.filter = p < 1 ? `blur(${(1 - p) * 3}px)` : '';
        });
      },
      draw(path, start, d, ease = 'inout') {
        let len = null;
        C.ticks.push(t => {
          if (len == null) { len = path.getTotalLength(); path.style.strokeDasharray = len; }
          path.style.strokeDashoffset = len * (1 - prog(t, start, d, ease));
        });
      },
      logo(src, label, size, color) {
        if (src) { const i = el('img'); i.src = src; i.style.width = i.style.height = size + 'px'; i.style.objectFit = 'contain'; return i; }
        const m = el('div', 'mono-logo'); m.style.cssText += `width:${size}px;height:${size}px;background:${color};font-size:${size * .52}px`;
        m.textContent = String(label || '?').trim().charAt(0).toUpperCase(); return m;
      },
    };
    return x;
  },

  rectAt(t) {
    const E = this.events; let i = -1;
    for (let j = 0; j < E.length; j++) if (E[j].at <= t) i = j;
    if (i < 0) return { ...this.cardRect(268 + HDR + FOOT), o: 0, home: 'card' };
    const r = this.rectAtEv(E[i], t - E[i].at); r.home = E[i].home; return r;
  },
  rectAtEv(ev, dt) {
    const cy = this.cardY, rh = ev.riseH;
    const H0 = HDR + ev.hFrom + FOOT, H1 = HDR + ev.hTo + FOOT;
    const R = (m, h) => (m === 'full' ? FULL : m === 'rise' ? this.riseRect(rh) : this.cardRect(h));
    const sunk = { ...this.riseRect(rh), y: RISE_TOP + rh * .8, o: 0 };
    const pillStart = { x: 330, y: cy + 10, w: 60, h: 5, r: 3, o: 0 }, pillMid = { x: 262, y: cy + 3, w: 196, h: 32, r: 16, o: 1 };
    switch (ev.kind) {
      case 'rise': // starts low, behind the person, and slides up into the space above the head
        { const r = lerpRect({ ...sunk, o: 1 }, this.riseRect(rh), prog(dt, 0, .6, 'smooth')); r.o = prog(dt, 0, .14, 'lin'); return r; }
      case 'in':
        if (ev.style === 'pill') {
          if (dt < .14) return lerpRect(pillStart, { ...pillStart, w: 196, x: 262, o: 1 }, prog(dt, 0, .14, 'out'));
          if (dt < .24) return lerpRect({ ...pillStart, w: 196, x: 262, o: 1 }, pillMid, prog(dt, .14, .1, 'out'));
          return lerpRect(pillMid, R('card', H1), prog(dt, .24, .36, 'smooth'));
        }
        return lerpRect({ x: 40, y: cy, w: 200, h: 72, r: 18, o: 0 }, R('card', H1), prog(dt, 0, .46, 'smooth'));
      case 'out':
        if (ev.from === 'rise') { // sinks back down behind the person
          const r = lerpRect(this.riseRect(rh), { ...sunk, o: 1 }, prog(dt, 0, .5, 'smooth'));
          r.o = 1 - prog(dt, .32, .18, 'lin'); return r;
        }
        if (dt < .3) return lerpRect(R(ev.from, H0), pillMid, prog(dt, 0, .3, 'smooth'));
        return lerpRect(pillMid, { ...pillMid, w: 40, x: 340, h: 5, y: cy + 10, o: 0 }, prog(dt, .3, .16, 'out'));
      case 'boom': return lerpRect(R(ev.from, H0), FULL, prog(dt, .1, .5, 'smooth'));
      case 'back': return lerpRect(R(ev.from, H0), R(ev.home, H1), prog(dt, .06, .52, 'smooth'));
      default: // swap: same mode, height eases to the new content
        if (ev.to === 'full') return { ...FULL };
        if (ev.to === 'rise') return this.riseRect(rh);
        return R('card', lerp(H0, H1, prog(dt, .1, .42, 'smooth')));
    }
  },

  renderCard(t) {
    const r = this.rectAt(t);
    const f = clamp((r.h - 430) / (FULL.h - 430));            // 0 = card, 1 = full screen
    this.fullness = f; this.rect = r;
    const bg = document.getElementById('cardbg'), clip = document.getElementById('clip');
    const vis = r.o > .001;
    bg.style.display = clip.style.display = vis ? '' : 'none';
    const hdrY = r.home === 'rise' && f === 0 ? r.y : lerp(r.home === 'rise' ? RISE_TOP : this.cardY, 148, f);
    // the person is drawn over a rise card, so the card seems to come from behind them
    this.riseCond = r.home === 'rise' && r.o > .001 && f < .995;
    document.getElementById('person').style.opacity = this.riseCond ? 1 - f : 1;
    if (vis) {
      Object.assign(bg.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', borderRadius: r.r + 'px', opacity: r.o });
      bg.style.background = `rgba(${lerp(246, 242, f)},${lerp(241, 240, f)},${lerp(227, 227, f)},${lerp(.86, 1, f)})`;
      clip.style.clipPath = `inset(${r.y}px ${720 - r.x - r.w}px ${1280 - r.y - r.h}px ${r.x}px round ${r.r}px)`;
      const hdrO = clamp((r.w - 300) / 300) * r.o;
      for (const id of ['hdr', 'status', 'divider', 'bar']) document.getElementById(id).style.opacity = hdrO;
      document.getElementById('hdr').style.top = hdrY + 'px';
      document.getElementById('status').style.top = (hdrY + 10) + 'px';
      document.getElementById('divider').style.top = (hdrY + 46) + 'px';
      const barCard = r.y + r.h - 22;
      const barY = lerp(f < 1 ? barCard : BAR_FULL, BAR_FULL, f);
      document.getElementById('bar').style.top = barY + 'px';
      const meta = document.getElementById('meta'); meta.style.top = (barY - 34) + 'px'; meta.style.opacity = clamp((f - .6) / .4);
    }
    let blk = null; for (const b of this.blocks) if (b.start <= t) blk = b;
    const st = blk ? blk.status : '';
    const S = document.getElementById('status');
    if (this.statusEl.textContent !== st) this.statusEl.textContent = st;
    S.style.visibility = st ? 'visible' : 'hidden';
    if (blk) { const p = prog(t, blk.start + .05, .35); S.style.filter = p < 1 ? `blur(${(1 - p) * 4}px)` : ''; }
    for (const b of this.blocks) {
      if (b.alias) continue;
      const cb = { x: 66, y: hdrY + HDR, w: 588, h: b.ch };
      const box = { x: lerp(cb.x, FULL_BOX.x, f), y: lerp(cb.y, FULL_BOX.y, f), w: lerp(cb.w, FULL_BOX.w, f), h: lerp(cb.h, FULL_BOX.h, f) };
      const inP = prog(t, b.t0 - .04, .38, 'out');
      const outD = { swap: .2, boom: .16, back: .16, out: .2 }[b.outKind] ?? .2;
      const outP = b.outKind ? prog(t, b.end, outD, 'out') : 0;
      const a = Math.min(inP, 1 - outP);
      if (a <= .001) { b.root.style.display = 'none'; continue; }
      b.root.style.display = '';
      const s = Math.min(box.w / b.w, box.h / b.h, lerp(1, b.T.maxFull ?? 1.15, f));
      const tx = box.x + (box.w - b.w * s) / 2, ty = box.y + (box.h - b.h * s) / 2 * clamp(f * 2);
      const lift = (1 - inP) * 10 - outP * 8;               // content drifts up as it arrives and leaves
      b.root.style.transform = `translate(${tx}px,${ty + lift}px) scale(${s})`;
      b.root.style.opacity = a;
      b.root.style.filter = a < 1 ? `blur(${(1 - a) * 8}px)` : '';
    }
  },

  buildBar() {
    const D = this.duration;
    let ch = (this.P.chapters || null);
    if (ch) ch = ch.map(c => ({ at: +c.at, name: c.name || '' }));
    else {
      ch = this.blocks.filter(b => !b.alias).map(b => ({ at: b.start, name: b.chapter }));
      if (!ch.length || ch[0].at > .5) ch.unshift({ at: 0, name: this.P.intro || 'Intro' });
    }
    ch.sort((a, b) => a.at - b.at); ch[0].at = 0;
    this.chapters = ch;
    const bar = document.getElementById('bar'), W = 588, gap = 4;
    const segs = ch.map((c, i) => { const s = c.at, e = i + 1 < ch.length ? ch[i + 1].at : D; return { s, e }; }).filter(s => s.e > s.s);
    const usable = W - gap * (segs.length - 1);
    let x = 0;
    for (const s of segs) {
      const w = Math.max(6, usable * (s.e - s.s) / D);
      const d = el('div', 'sg', bar); d.style.left = x + 'px'; d.style.width = w + 'px';
      s.fill = el('b', '', d); s.x = x; s.w = w; x += w + gap;
    }
    const dot = el('div', 'dot', bar);
    const meta = document.getElementById('meta');
    this.ticks.push(t => {
      let dx = 0;
      for (const s of segs) { const p = clamp((t - s.s) / (s.e - s.s)); s.fill.style.width = (p * 100) + '%'; if (t >= s.s) dx = s.x + p * s.w; }
      dot.style.left = dx + 'px';
      let name = ''; for (const c of ch) if (c.at <= t) name = c.name;
      meta.querySelector('.time').textContent = `${fmtTime(t)} / ${fmtTime(D)}`;
      meta.querySelector('.chap').textContent = name ? '• ' + name : '';
      this.barX = 66 + dx;
    });
  },

  buildHooks() {
    const host = document.getElementById('hooks');
    const firstCard = (this.events[0] || {}).at ?? Infinity;
    for (const h of (this.P.effects || []).filter(e => e.fx === 'hook-title')) {
      const d = el('div', 'hook', host);
      const spans = list(h.text).map(line => el('span', '', d, esc(line)));
      if (h.y != null) d.style.top = h.y + 'px';
      const s = +(h.start ?? 0), e = +(h.end ?? Math.min(firstCard, s + 3));
      this.ticks.push(t => {
        d.style.display = t >= s && t < e ? '' : 'none';
        spans.forEach((sp, i) => { const p = s > 0 ? prog(t, s + i * .08, .4) : 1; sp.style.opacity = p; sp.style.transform = `translateY(${(1 - p) * 10}px)`; });
      });
    }
  },

  buildCaptions() {
    const cfg = this.P.captions ?? {};
    if (cfg === false || cfg.on === false) return;
    const words = (this.data.words || []).filter(w => w.w && String(w.w).trim());
    if (!words.length) { this.warnings.push('no word timings found, so no captions (run words.py first)'); return; }
    const norm = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, '');
    const emph = list(cfg.emphasis).map(p => p.split(/\s+/).map(norm));
    const flags = words.map(() => false);
    for (const ph of emph) for (let i = 0; i + ph.length <= words.length; i++) {
      if (ph.every((w, j) => norm(words[i + j].w) === w)) for (let j = 0; j < ph.length; j++) flags[i + j] = true;
    }
    const maxW = cfg.max_words || 4, phrases = [];
    let cur = [];
    words.forEach((w, i) => {
      const prev = words[i - 1];
      if (cur.length && (cur.length >= maxW || w.s - prev.e > .45 || /[.,!?;:।]$/.test(prev.w))) { phrases.push(cur); cur = []; }
      cur.push({ ...w, em: flags[i] });
    });
    if (cur.length) phrases.push(cur);
    const host = document.getElementById('caps'), C = this;
    const capBottom = cfg.bottom ?? CAP_BOTTOM;
    phrases.forEach((ph, i) => {
      const next = phrases[i + 1];
      const s = ph[0].s - .04, last = ph[ph.length - 1];
      const e = next && next[0].s - last.e < 1.2 ? next[0].s - .04 : last.e + .5;
      const pill = el('div', 'cap', host);
      const spans = ph.map(w => {
        const sp = el('span', 'w' + (w.em ? ' em' : ''), pill, esc(String(w.w).trim()));
        let path = null;
        if (w.em) {
          const svg = el('span', '', sp, `<svg viewBox="0 0 100 14" preserveAspectRatio="none"><path d="M3 10 C 30 6, 62 5, 97 7" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/></svg>`);
          path = svg.querySelector('path');
        }
        return { sp, w, path, len: null };
      });
      this.ticks.push(t => {
        const on = t >= s && t < e;
        pill.style.display = on ? 'block' : 'none';
        if (!on) return;
        const f = C.fullness || 0;
        pill.classList.toggle('paper', f > .5);
        pill.style.top = 'auto'; pill.style.bottom = (1280 - capBottom) + 'px';
        // never over the face: if the chin reaches the caption, tighten the caption
        let chin = C.chinAt(t); if (chin != null && C.fxMap) chin = C.fxMap.a * chin + C.fxMap.ty;   // where effect cameras moved the chin
        pill.classList.toggle('tight', f < .5 && chin != null && chin > capBottom - 84);
        const pin = prog(t, s, .3, 'quint');
        pill.style.transform = `translateX(-50%) translateY(${(1 - pin) * 6}px)`;
        for (const o of spans) {
          const p = prog(t, o.w.s - .03, .2, 'out');
          o.sp.style.opacity = t < o.w.s - .03 ? 0 : lerp(.2, 1, p);
          o.sp.style.filter = p < 1 ? `blur(${(1 - p) * 3}px)` : '';
          if (o.path) {
            if (o.len == null) { o.len = o.path.getTotalLength(); o.path.style.strokeDasharray = o.len; }
            o.path.style.strokeDashoffset = o.len * (1 - prog(t, o.w.s + .1, .4, 'inout'));
          }
        }
      });
    });
  },

  // ---------- screen effects support (effects.js) ----------
  faceAt(t) {
    const T = this.track; const i = T && T.cx ? clamp(Math.round(t * T.fps), 0, T.cx.length - 1) : -1;
    const cx = i >= 0 && T.cx[i] != null ? T.cx[i] : 360, cy = i >= 0 && T.cy[i] != null ? T.cy[i] : 560, w = i >= 0 && T.fw[i] != null ? T.fw[i] : 240;
    return { cx, cy, w, top: this.headTop(t) ?? cy - w * .9, chin: this.chinAt(t) ?? cy + w * .6 };
  },
  // the free space above the head over [s, e], without warnings (for floating effects)
  zoneFor(s, e) {
    const T = this.track; let hi = 520;
    if (T && T.top && T.top.length) { hi = Infinity; for (let i = Math.max(0, Math.floor(s * T.fps)); i <= Math.min(T.top.length - 1, Math.ceil(e * T.fps)); i++) if (T.top[i] != null) hi = Math.min(hi, T.top[i]); if (!isFinite(hi)) hi = 520; }
    const bottom = Math.max(RISE_TOP + 180, hi - 20); return { top: RISE_TOP, bottom, h: bottom - RISE_TOP };
  },
  camCss() { return this.camNow || ''; },
  applyScene(t) {
    // camera: compose the base frame setting with every active camera effect (zoom about a point, then pan)
    let a = this.baseCam.a, tx = this.baseCam.tx, ty = this.baseCam.ty, fa = 1, fty = 0;
    for (const fn of this.cams) { const c = fn(t); if (!c) continue; const z = c.z ?? 1, px = c.px ?? 360, py = c.py ?? 640;
      // x' = z*(x - px) + px + dx, applied after the current transform
      a = a * z; tx = z * (tx - px) + px + (c.dx || 0); ty = z * (ty - py) + py + (c.dy || 0);
      fa *= z; fty = z * (fty - py) + py + (c.dy || 0); }
    this.fxMap = fa === 1 && fty === 0 ? null : { a: fa, ty: fty };
    const css = `matrix(${a},0,0,${a},${tx},${ty})`; this.camNow = css;
    for (const id of ['frame', 'person', 'fxback']) { const e = document.getElementById(id); e.style.transformOrigin = '0 0'; e.style.transform = css; }
    let ff = '', pf = '';
    for (const fn of this.grades) { const g = fn(t); if (!g) continue; ff += ' ' + (g.frame || ''); pf += ' ' + (g.person ?? g.frame ?? ''); }
    document.getElementById('frame').style.filter = ff.trim();
    const per = document.getElementById('person');
    const fxp = this.personFx.some(([a2, b2]) => t >= a2 && t <= b2);
    per.style.display = this.hasMask && (this.riseCond || fxp) ? 'block' : 'none';
    per.style.filter = (pf.trim() + ' drop-shadow(0 10px 16px rgba(40,25,10,.38))').trim();
  },
  buildEffects() {
    if (!window.VFX) return;
    const back = document.getElementById('fxback'), front = document.getElementById('fxfront');
    for (const o of (this.P.effects || [])) {
      const name = (window.VFX_ALIAS || {})[o.fx] || o.fx, F = VFX[name];
      if (!F) continue;
      const s = +(o.start ?? o.at ?? 0), e = +(o.end ?? (s + +(o.dur ?? F.dur ?? 3)));
      const hb = el('div', 'fxl', back), hf = el('div', 'fxl', front);
      const C = this, b = { t0: s, end: e, T: { ideal: e - s } }, x = this.ctx(b);
      Object.assign(x, { s, e, back: hb, front: hf, o,
        face: t => C.faceAt(t), zone: () => C.zoneFor(s, e),
        cam: fn => C.cams.push(fn), grade: fn => C.grades.push(fn),
        person: (a2 = s - .05, b2 = e + .5) => C.personFx.push([a2, b2]),
        copy: host => { const i = el('img', 'fxcopy', host); i._a = s - .05; i._b = e + (F.tail ?? .7); C.copies.push(i); return i; },
        freeze: (a2, b2) => C.freezes.push([a2, b2, (C.assets.freeze || {})[String(+a2.toFixed(2))]]),
        images: list(o.images) });
      if (F.mask) x.person();
      const pad = F.tail ?? .7;
      this.ticks.push(t => { const on = t >= s - .05 && t <= e + pad; hb.style.display = hf.style.display = on ? '' : 'none'; });
      try { F.build(x, o); } catch (err) { this.warnings.push(`${o.fx}: ${err.message}`); }
      if (F.mask && !this.data.hasMasks) this.warnings.push(`${o.fx} needs the person cutout (MediaPipe); without it, it draws over the speaker`);
    }
  },

  chinAt(t) {
    const T = this.track; if (!T || !T.chin || !T.chin.length) return null;
    return T.chin[clamp(Math.round(t * T.fps), 0, T.chin.length - 1)];
  },

  // ---------- hairline figures, run on the virtual clock ----------
  addFigure(host, o, s, e) {
    const name = o.figure || 'terminal';
    if (!window.HL || !HL[name]) { this.warnings.push(`unknown figure "${name}". Known: ${Object.keys(window.HL || {}).join(', ')}`); return; }
    const tone = FIG_TONES[o.tone] || FIG_TONES.ink;
    for (const k in tone) host.style.setProperty('--hairline-' + k, tone[k]);
    host.style.setProperty('--hairline-stroke', String(o.stroke ?? 1.5));
    host.classList.add('fig');
    const moves = Array.isArray(o.moves) ? o.moves.map(m => m.map(Number)).sort((a, b) => a[0] - b[0]) : null;
    const F = { host, o, s, e, name, moves, fig: null, simT: 0, inside: false };
    for (const G of this.figs) if (s < G.e && G.s < e) this.warnings.push(`figures "${G.name}" and "${name}" overlap in time; only one runs at once`);
    this.figs.push(F);
  },
  figPoint(F, t) {
    const m = F.moves;
    if (m && m.length) {
      if (t <= m[0][0]) return [m[0][1], m[0][2]];
      for (let i = 1; i < m.length; i++) if (t < m[i][0]) { const p = EASE.inout((t - m[i - 1][0]) / (m[i][0] - m[i - 1][0])); return [lerp(m[i - 1][1], m[i][1], p), lerp(m[i - 1][2], m[i][2], p)]; }
      return [m[m.length - 1][1], m[m.length - 1][2]];
    }
    const u = t - F.s; // a slow drift across the figure so it stays alive
    return [.5 + .26 * Math.sin(u * 1.1), .52 + .2 * Math.sin(u * 1.7 + .6)];
  },
  tickFigures(t) {
    for (const F of this.figs) {
      const live = t >= F.s - .05 && t <= F.e + .25;
      if (!live) { if (F.fig) { F.fig.destroy(); F.fig = null; F.host.innerHTML = ''; } continue; }
      if (!F.fig || t < F.simT - 1e-6) {
        // one figure at a time on the shared clock: retire any other (it has faded out by now)
        for (const G of this.figs) if (G !== F && G.fig) { G.fig.destroy(); G.fig = null; G.host.innerHTML = ''; }
        if (F.fig) F.fig.destroy();
        F.host.innerHTML = ''; VCLOCK.frame(F.s * 1000);
        F.fig = HL[F.name](F.host, { intensity: F.o.intensity ?? .6 });
        F.simT = F.s; F.inside = false;
      }
      const STEP = 1 / 120;
      while (F.simT + STEP <= t + 1e-9) {
        F.simT += STEP;
        const r = F.host.getBoundingClientRect();
        if (r.width > 4) {
          const [px, py] = this.figPoint(F, F.simT), svg = F.host.querySelector('svg') || F.host;
          const fire = type => svg.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: r.left + px * r.width, clientY: r.top + py * r.height, pointerType: 'mouse', pointerId: 1, isPrimary: true }));
          if (!F.inside) { fire('pointerover'); fire('pointerenter'); F.inside = true; }
          fire('pointermove');
        }
        VCLOCK.frame(F.simT * 1000);
      }
    }
  },
  // standalone illustrate: a figure floating in the space above the head (or a given box), no card
  buildIllustrations() {
    const host = document.getElementById('figs');
    for (const o of (this.P.effects || []).filter(e => e.fx === 'illustrate')) {
      const s = +(o.start ?? o.at ?? 0), e = +(o.end ?? s + 3);
      let box = o.box;
      if (!box) { const zh = this.riseZone(s, e) ; const h = zh + 30, w = Math.min(600, h * 1.25); box = [(720 - w) / 2, RISE_TOP - 10, w]; }
      const [bx, by, bw] = box.map(Number), bh = bw * .8;
      const wrap = el('div', 'figwrap', host); Object.assign(wrap.style, { left: bx + 'px', top: by + 'px', width: bw + 'px', height: bh + 'px' });
      const fh = el('div', '', wrap); fh.style.cssText = 'position:absolute;inset:0';
      if (o.label) { const lb = el('div', 'serif brick figlabel', wrap, esc(o.label)); lb.style.top = (bh - 8) + 'px'; }
      this.addFigure(fh, o, s, e);
      this.cues.push({ at: s, kind: 'figure-in' });
      this.ticks.push(t => {
        const pin = prog(t, s, .45), pout = prog(t, e, .35, 'out');
        const a = Math.min(pin, 1 - pout);
        wrap.style.display = a > .001 ? '' : 'none';
        wrap.style.opacity = a; wrap.style.filter = a < 1 ? `blur(${(1 - a) * 8}px)` : '';
        wrap.style.transform = `translateY(${(1 - pin) * 16 - pout * 10}px) scale(${lerp(.96, 1, pin)})`;
      });
    }
  },

  buildMascots() {
    const box = document.getElementById('mascot');
    const ms = (this.P.effects || []).filter(e => e.fx === 'mascot' || e.fx === 'mascot-walk');
    if (!ms.length) return;
    const views = [];
    for (const m of ms) {
      const state = m.state || 'idle', a = this.assets.mascot && this.assets.mascot[state];
      if (!a) { this.warnings.push(`mascot state "${state}" has no file in mascot/ (add ${state}.gif or ${state}.svg)`); continue; }
      const v = el('div', '', box); v.style.position = 'absolute';
      let draw = () => { };
      if (a.type === 'frames') {
        const img = el('img', '', v); const total = a.durs.reduce((p, c) => p + c, 0) / 1000;
        draw = dt => { let x = ((dt % total) + total) % total * 1000, i = 0; while (i < a.durs.length - 1 && x >= a.durs[i]) { x -= a.durs[i]; i++; } if (img._i !== i) { img.src = a.frames[i]; img._i = i; } };
      } else if (a.type === 'svg') {
        v.innerHTML = a.text; const svg = v.querySelector('svg');
        if (svg) { svg.removeAttribute('width'); svg.removeAttribute('height'); if (svg.pauseAnimations) svg.pauseAnimations(); }
        draw = dt => {
          if (svg && svg.setCurrentTime) svg.setCurrentTime(Math.max(0, dt));
          for (const an of v.getAnimations({ subtree: true })) { an.pause(); an.currentTime = Math.max(0, dt) * 1000; }
        };
      } else { const img = el('img', '', v); img.src = a.url; }
      views.push({ m, v, draw, s: +(m.start ?? m.at ?? 0), e: +(m.end ?? this.duration), size: +(m.size ?? 112), pos: m.fx === 'mascot-walk' ? 'bar' : (m.pos || 'card') });
    }
    this.ticks.push(t => {
      for (const o of views) {
        const on = t >= o.s && t < o.e;
        o.v.style.display = on ? '' : 'none'; if (!on) continue;
        const r = this.rect || this.cardRect(372), sz = o.size; let x, y;
        if (o.pos === 'bar') { x = (this.barX || 66) - sz / 2; y = parseFloat(document.getElementById('bar').style.top || 488) - sz + 2; }
        else if (o.pos === 'corner') { x = 720 - sz - 40; y = 1040 - sz; }
        else if (o.pos === 'left') { x = r.x + 24; y = r.y - sz + 12; }
        else { x = r.x + r.w - sz - 30; y = r.y - sz + 12; }
        if (o.pos !== 'corner' && r.o < .05) { o.v.style.display = 'none'; continue; }
        const p = prog(t, o.s, .35);
        Object.assign(o.v.style, { left: x + 'px', top: y + 'px', width: sz + 'px', height: sz + 'px', opacity: p, transform: `translateY(${(1 - p) * 12}px)` });
        o.draw(t - o.s);
      }
    });
  },
};
window.COOK = COOK;
