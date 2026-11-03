// Screen effects for aashish-cooks: the 45 effects of claude-video-effects (Vibha Ramprakash, MIT),
// rebuilt in the cooks style: cream/ivory panels, ink, crimson, terracotta, Newsreader / DM Sans / DM Mono / Kalam,
// soft quint motion, and never over the face. Each effect gets x (time helpers from engine ctx) plus:
//   x.s, x.e (seconds), x.back (layer behind the speaker), x.front (layer in front), x.face(t), x.zone(),
//   x.cam(fn), x.grade(fn), x.person(), x.copy(host), x.freeze(a, b), x.images, x.cue(kind, at, dur)
'use strict';
const VFX = {};
const VFX_ALIAS = { 'the-noise': 'noise', 'the-lineup': 'lineup', bill: 'the-bill', 'to-do': 'todo', follow: 'tap', stamp: 'reject-stamp',
  countdown: 'countdown-flip', cover: 'cover-star', rain: 'shortcut-rain', pause: 'pause-point', 'glitter-spotlight': 'spotlight' };
const TILE_BG = ['#CC6350', '#2E2B28', '#E3B23C', '#5E6F2E', '#D30135', '#95493F', '#B9A3AE', '#BFD3DD', '#EE97A7'];
const TILE_IC = ['sparkles', 'play', 'flame', 'trending-up', 'zap', 'image', 'heart', 'star', 'eye'];

const fwin = (x, e, i = .35, o = .3) => x.tick(t => { const a = Math.min(prog(t, x.s, i), 1 - prog(t, x.e, o, 'out')); e.style.opacity = a; e.style.display = a > .001 ? '' : 'none'; });
const box = (parent, cls, x0, y0, w, h, css = '') => { const e = el('div', cls, parent); e.style.cssText += `position:absolute;left:${x0}px;top:${y0}px;${w != null ? `width:${w}px;` : ''}${h != null ? `height:${h}px;` : ''}${css}`; return e; };
// a reel tile: your image if given, else a placeholder in the palette with an icon and a label
function tile(x, i, w, h, label) {
  const t = el('div', ''); t.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:${Math.round(w * .09)}px;overflow:hidden;background:#FDFDF3;padding:${Math.max(3, Math.round(w * .025))}px;box-shadow:0 8px 22px rgba(40,25,10,.28);`;
  const inner = el('div', '', t); inner.style.cssText = `width:100%;height:100%;border-radius:${Math.round(w * .07)}px;overflow:hidden;position:relative;background:${TILE_BG[i % TILE_BG.length]};`;
  const img = x.images[i % Math.max(1, x.images.length)];
  if (x.images.length && img) { const im = el('img', '', inner); im.src = img; im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'; }
  else {
    inner.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:10%;top:12%">${ico(TILE_IC[i % TILE_IC.length], Math.round(w * .2), 'rgba(255,255,255,.92)', 2)}</div>`);
    const l = el('div', 'sans', inner, esc(label || '')); l.style.cssText = `position:absolute;left:10%;right:10%;bottom:10%;color:#fff;font:800 ${Math.round(w * .11)}px/1.05 'Archivo Black','DM Sans';text-transform:uppercase;`;
  }
  return t;
}
// a tile in front of the speaker fades out while it crosses the face (never cover the face)
const faceClear = (px, py, depth, f, sz) => depth <= 0 || py + sz * .8 < f.top ? 1 : clamp((Math.abs(px - f.cx) - (f.w * .5 + sz * .5)) / (sz * .5));
const lab = (x, i, d) => list(x.o.text)[i] || d || '';
const camPunch = (x, z, t0, d, hold, pivot) => x.cam(t => { if (t < t0 - .01 || t > x.e + .5) return null; const f = pivot || x.face(t);
  const p = prog(t, t0, d, 'quint') * (1 - prog(t, Math.max(t0 + d, x.e - (hold ?? .35)), hold ?? .35, 'inout')); return { z: 1 + (z - 1) * p, px: f.cx, py: f.cy }; });

// 1 noise: your reels pile up behind your head, one every quarter second
VFX.noise = { mask: true, dur: 3, build(x, o) {
  const n = Math.max(4, Math.round((x.e - x.s) * 4)), f0 = x.face(x.s), sz = +(o.size ?? 150);
  for (let i = 0; i < n; i++) {
    const a = (i * 137.5) % 360 * Math.PI / 180, r = 140 + (i * 53) % 170;
    const cx = f0.cx + Math.cos(a) * r * 1.3, cy = f0.top + 40 + Math.sin(a) * r * .8 - 60;
    const tl = tile(x, i, sz, sz * 1.6, lab(x, i)); x.back.appendChild(tl);
    tl.style.left = (cx - sz / 2) + 'px'; tl.style.top = (cy - sz * .8) + 'px';
    const t0 = x.s + i * .25, rot = ((i * 47) % 30) - 15;
    tl.style.opacity = 0;
    x.tick(t => { const p = prog(t, t0, .3, 'quint'), q = 1 - prog(t, x.e, .3, 'out'); tl.style.opacity = Math.min(p, q); tl.style.transform = `rotate(${rot}deg) scale(${lerp(.6, 1, p)})`; });
    x.cue('pop', t0, 0);
  }
} };

// 2 lineup: numbered tiles fan out in an arc above your head
VFX.lineup = { mask: true, dur: 3, build(x, o) {
  const items = list(o.text).length ? list(o.text) : ['One', 'Two', 'Three', 'Four', 'Five'], n = items.length, f0 = x.face(x.s), z = x.zone();
  items.forEach((it, i) => {
    const ang = lerp(-48, 48, n > 1 ? i / (n - 1) : .5) * Math.PI / 180, R = Math.min(330, z.h + 120);
    const w = 108, h = 150, cx = f0.cx + Math.sin(ang) * R, cy = f0.top + 30 - Math.cos(ang) * R * .8;
    const c = box(x.back, 'panel', cx - w / 2, cy - h / 2, w, h, 'border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;');
    el('div', 'serif', c, String(i + 1)).style.cssText = 'font-size:52px;line-height:1;color:var(--terra);font-weight:500';
    el('div', 'sans', c, esc(it)).style.cssText = 'font-size:14px;font-weight:600;text-align:center;padding:0 6px';
    const t0 = x.s + .1 + i * .12, rot = ang * 180 / Math.PI * .6;
    c.style.opacity = 0;
    x.tick(t => { const p = prog(t, t0, .45, 'quint'), q = 1 - prog(t, x.e, .3, 'out');
      c.style.opacity = Math.min(p, q); c.style.transform = `translate(${(f0.cx - cx) * (1 - p)}px,${(f0.top + 60 - cy) * (1 - p)}px) rotate(${rot * p}deg) scale(${lerp(.4, 1, p)})`; });
    x.cue('pop', t0);
  });
} };

// 3 locked-on: crimson brackets snap onto your face and the camera follows you in
VFX['locked-on'] = { dur: 3, build(x, o) {
  const z = +(o.zoom ?? 1.35); camPunch(x, Math.min(2, z), x.s, .5, .4);
  const g = box(x.front, '', 0, 0, 720, 1280); fwin(x, g, .2, .25);
  const corners = [0, 1, 2, 3].map(() => box(g, '', 0, 0, 44, 44));
  const tag = box(g, 'mono', 0, 0, null, null, 'background:var(--accent);color:#fff;font-size:15px;padding:4px 10px;border-radius:6px;white-space:nowrap'); tag.textContent = o.text || 'LOCKED ON';
  x.tick(t => { const f = x.face(t), p = prog(t, x.s, .35, 'quint'), sp = lerp(1.8, 1, p), w = f.w * 1.25 * sp, h = f.w * 1.55 * sp;
    const L = f.cx - w / 2, T = f.cy - h / 2;
    [[L, T, '0 0'], [L + w - 44, T, '0 0 0 0'], [L, T + h - 44, ''], [L + w - 44, T + h - 44, '']].forEach(([l, tp], i) => {
      const c = corners[i]; c.style.left = l + 'px'; c.style.top = tp + 'px';
      c.style.border = '0 solid var(--accent)'; c.style[['borderTopWidth', 'borderTopWidth', 'borderBottomWidth', 'borderBottomWidth'][i]] = '5px';
      c.style[['borderLeftWidth', 'borderRightWidth', 'borderLeftWidth', 'borderRightWidth'][i]] = '5px';
      c.style.borderRadius = ['10px 0 0 0', '0 10px 0 0', '0 0 0 10px', '0 0 10px 0'][i]; });
    tag.style.left = L + 'px'; tag.style.top = (T - 34) + 'px'; });
  x.cue('woosh', x.s); x.cue('tick', x.s + .3);
} };

// 4 orbit: your reels circle your head, behind at the top and in front at the bottom
VFX.orbit = { mask: true, dur: 4, build(x, o) {
  const n = +(o.count ?? 6), sz = +(o.size ?? 120), spd = +(o.speed ?? .5);
  const items = Array.from({ length: n }, (_, i) => { const t = tile(x, i, sz, sz * 1.5, lab(x, i)); return t; });
  x.tick(t => { const f = x.face(t), cx = f.cx, cy = f.top + f.w * .55, a0 = prog(t, x.s, .5);
    items.forEach((tl, i) => { const ang = (i / n) * Math.PI * 2 + (t - x.s) * spd * Math.PI * 2;
      const px = cx + Math.cos(ang) * 290, py = cy + Math.sin(ang) * 110, depth = Math.sin(ang);
      (depth < 0 ? x.back : x.front).appendChild(tl);
      const sc = lerp(.72, 1.05, (depth + 1) / 2) * lerp(.5, 1, a0);
      tl.style.left = (px - sz / 2) + 'px'; tl.style.top = (py - sz * .75) + 'px'; tl.style.transform = `scale(${sc})`;
      tl.style.opacity = Math.min(a0, 1 - prog(t, x.e, .3, 'out')) * lerp(.75, 1, (depth + 1) / 2) * faceClear(px, py, depth, f, sz); }); });
  x.cue('woosh', x.s);
} };

// 5 lean-in: a fast punch-in on one word
VFX['lean-in'] = { dur: 1.2, build(x, o) { camPunch(x, Math.min(2, +(o.zoom ?? 1.45)), x.s, .18 / (+(o.speed ?? 1)), .3); x.cue('woosh', x.s, 0); } };

// 6 backdrop-word: a giant serif word drops in behind you
VFX['backdrop-word'] = { mask: true, dur: 3, build(x, o) {
  const w = box(x.back, o.font === 'bold' ? '' : 'serif', 0, 0, 720, null, `text-align:center;white-space:nowrap;font-size:${+(o.size ?? 230)}px;line-height:.9;letter-spacing:-.03em;font-weight:${o.font === 'bold' ? 400 : 600};color:${o.color || 'var(--ink)'};`);
  if (o.font === 'bold') w.style.fontFamily = "'Archivo Black'";
  w.textContent = o.text || 'CLAUDE';
  x.tick(t => { const f = x.face(t), p = prog(t, x.s, .55, 'quint'), q = prog(t, x.e, .35, 'out'); w.style.top = (f.top - 120) + 'px';
    const fit = Math.min(1, 680 / Math.max(1, w.scrollWidth)); w.style.transform = `translateY(${(1 - p) * -260}px) scale(${fit})`; w.style.opacity = Math.min(p, 1 - q); });
  x.cue('woosh', x.s);
} };

// 7 spotlight: the room goes dark, you stay lit, a word glows behind you (look: "sparkle" = gold rays)
VFX.spotlight = { mask: true, dur: 3, build(x, o) {
  const sparkle = o.look === 'sparkle' || o.fx === 'glitter-spotlight', col = o.color || (sparkle ? '#E3B23C' : 'var(--terra)');
  x.grade(t => { const p = Math.min(prog(t, x.s, .4), 1 - prog(t, x.e, .35)); return p > 0 ? { frame: `brightness(${lerp(1, .28, p)}) saturate(${lerp(1, .6, p)})`, person: `brightness(${lerp(1, 1.04, p)})` } : null; });
  if (+(o.push ?? 1.12) > 1) camPunch(x, Math.min(2, +(o.push ?? 1.12)), x.s, (x.e - x.s) * .9, .3);
  const g = box(x.back, '', 0, 0, 720, 1280); fwin(x, g, .4, .35);
  const halo = box(g, '', 0, 0, 720, 1280);
  if (sparkle) { const rays = box(g, '', -360, -200, 1440, 1440, `background:repeating-conic-gradient(from 0deg, rgba(227,178,60,.22) 0 6deg, transparent 6deg 18deg);border-radius:50%;`); x.tick(t => { const f = x.face(t); rays.style.left = (f.cx - 720) + 'px'; rays.style.top = (f.cy - 720) + 'px'; rays.style.transform = `rotate(${(t - x.s) * 12}deg)`; });
    for (let i = 0; i < 14; i++) { const sp = box(g, '', 0, 0, 18, 18); sp.innerHTML = ico('sparkle', 18, '#F3D27A', 2); const a = i * 2.39, r = 150 + (i * 37) % 200;
      x.tick(t => { const f = x.face(t); sp.style.left = (f.cx + Math.cos(a) * r * 1.4) + 'px'; sp.style.top = (f.top + 40 + Math.sin(a) * r * .7) + 'px'; sp.style.opacity = .4 + .6 * Math.abs(Math.sin((t - x.s) * 3 + i)); }); } }
  const wd = box(g, 'serif', 0, 0, 720, null, `text-align:center;font-style:italic;font-size:${+(o.size ?? 150)}px;line-height:1;color:${col};text-shadow:0 0 30px ${sparkle ? 'rgba(243,210,122,.9)' : 'rgba(204,99,80,.85)'},0 0 80px ${sparkle ? 'rgba(227,178,60,.6)' : 'rgba(204,99,80,.5)'};white-space:nowrap;`);
  wd.textContent = o.text || '';
  x.tick(t => { const f = x.face(t); halo.style.background = `radial-gradient(ellipse ${f.w * 2.2}px ${f.w * 3}px at ${f.cx}px ${f.cy + f.w * .6}px, rgba(255,236,200,.28), transparent 70%)`;
    wd.style.top = (f.top - 150) + 'px'; const p = prog(t, x.s + .2, .6, 'quint'); wd.style.transform = `scale(${lerp(.85, 1, p)})`; wd.style.opacity = p; });
  x.cue('woosh', x.s);
} };

// 8 the-bill: your instructions print like a receipt into the wall above your head
VFX['the-bill'] = { mask: true, dur: 4, build(x, o) {
  const lines = list(o.text).length ? list(o.text) : ['Line one', 'Line two', 'Line three'], z = x.zone(), f0 = x.face(x.s);
  const w = 300, h = Math.max(260, 70 + lines.length * 34 + 70);
  const r = box(x.back, 'mono', f0.cx - w / 2, 0, w, h, 'background:#FDFDF3;box-shadow:0 10px 24px rgba(40,25,10,.25);padding:18px 20px;font-size:15px;color:var(--ink);' +
    '-webkit-mask:linear-gradient(#000,#000) top/100% calc(100% - 10px) no-repeat, radial-gradient(circle 6px at 8px 100%, transparent 98%, #000) bottom/16px 10px repeat-x;');
  el('div', 'caps', r, esc(o.title || 'Receipt')).style.cssText += 'text-align:center;margin-bottom:10px';
  const ls = lines.map((l, i) => { const d = el('div', '', r); d.style.cssText = 'display:flex;justify-content:space-between;border-bottom:1px dashed #D8CFC0;padding:6px 0'; el('span', '', d, esc(l)); el('span', 'brick', d, '✓'); return d; });
  el('div', 'serif', r, esc(o.total || 'Total: done')).style.cssText = 'margin-top:12px;font-size:24px;text-align:right';
  const yEnd = Math.min(z.bottom - h, f0.top - h + 40);
  x.tick(t => { const p = prog(t, x.s, (x.e - x.s) * .6, 'lin'), q = prog(t, x.e, .3, 'out'); r.style.top = lerp(yEnd - h, yEnd, EASE.out(p)) + 'px'; r.style.opacity = 1 - q;
    ls.forEach((d, i) => { d.style.opacity = p * (lines.length + 1) > i + .5 ? 1 : 0; }); });
  x.cue('cook', x.s, (x.e - x.s) * .6);
} };

// 9 moody: a colour grade (moody, bw, warm, cool, pop, film)
const GRADES = { moody: 'contrast(1.12) saturate(.78) brightness(.88) sepia(.14)', bw: 'grayscale(1) contrast(1.12)', warm: 'sepia(.22) saturate(1.15) brightness(1.03)',
  cool: 'hue-rotate(-12deg) saturate(.9) brightness(1.02)', pop: 'saturate(1.35) contrast(1.08)', film: 'sepia(.2) saturate(.9) contrast(1.06) brightness(.97)' };
// blend a filter string from neutral (p = 0) to full (p = 1)
const gradeAt = (g, p) => g.replace(/([a-z-]+)\(([\d.-]+)(deg)?\)/g, (m, fn, v, d) => `${fn}(${lerp(/brightness|contrast|saturate/.test(fn) ? 1 : 0, +v, p).toFixed(3)}${d || ''})`);
VFX.moody = { dur: 3, build(x, o) { const g = GRADES[o.grade] || GRADES.moody;
  x.grade(t => { const p = Math.min(prog(t, x.s, .4), 1 - prog(t, x.e, .4)); return p > .001 ? { frame: gradeAt(g, p) } : null; }); } };

// 10 swipe: a before/after slider sweeps across you (grade = the "after" look)
VFX.swipe = { dur: 2.5, build(x, o) {
  const g = GRADES[o.grade] || GRADES.film, host = box(x.front, '', 0, 0, 720, 1280); fwin(x, host, .05, .25);
  const c = x.copy(host); c.style.filter = g;
  const bar = box(host, '', 0, 0, 4, 1280, 'background:#FDFDF3;box-shadow:0 0 12px rgba(0,0,0,.35)');
  const knob = box(host, '', 0, 600, 48, 48, 'border-radius:50%;background:#FDFDF3;box-shadow:0 4px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center'); knob.innerHTML = ico('chevrons-left-right', 26, 'var(--accent)', 2.4);
  const tags = [['BEFORE', 40], ['AFTER', 560]].map(([s2, l]) => { const e2 = box(host, 'mono', l, 140, null, null, 'background:rgba(253,253,243,.9);padding:4px 10px;border-radius:6px;font-size:14px'); e2.textContent = s2; return e2; });
  x.tick(t => { const p = prog(t, x.s, (x.e - x.s) * .7, 'inout'), X = lerp(720, 0, p); c.style.transform = COOK.camCss();
    c.style.clipPath = `inset(0 0 0 ${X}px)`; bar.style.left = (X - 2) + 'px'; knob.style.left = (X - 24) + 'px'; });
  x.cue('woosh', x.s);
} };

// 11 todo: a checklist card ticks off as you talk (sits above your head)
function floatingList(x, o, spin) {
  const items = list(o.text).length ? list(o.text) : ['First', 'Second', 'Third'], z = x.zone(), f0 = x.face(x.s);
  const w = 420, rh = 50, h = 64 + items.length * rh;
  const c = box(x.back, 'panel', f0.cx - w / 2, Math.max(z.top, z.bottom - h + 30), w, h, 'border-radius:20px;padding:16px 20px;box-shadow:0 14px 34px rgba(40,25,10,.25)');
  el('div', 'serif', c, esc(o.title || (spin ? 'Claude is working' : 'To do'))).style.cssText = 'font-size:26px;margin-bottom:6px';
  const ticks = list(o.ticks).map(Number), t1 = x.s + .6, t2 = x.e - .4;
  items.forEach((it, i) => { const [label, meta] = String(it).split('::');
    const r = el('div', '', c); r.style.cssText = `display:flex;align-items:center;gap:12px;height:${rh}px;font:500 19px 'DM Sans','Mukta'`;
    const b = el('span', '', r); b.style.cssText = 'position:relative;width:26px;height:26px;border-radius:50%;border:2px solid #CFC6B4;flex:none;';
    const sp = el('span', '', b, ico('loader-circle', 22, 'var(--terra)', 2.4)); sp.style.cssText = 'position:absolute;left:0;top:0;display:none';
    const ok = el('span', '', b, ICON.check); ok.style.cssText = 'position:absolute;inset:-2px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;opacity:0';
    const tx = el('span', '', r, esc(label)); tx.style.flex = '1';
    if (meta) el('span', 'mono', r, esc(meta)).style.cssText = 'font-size:13px;color:#8A8070';
    const tt = !isNaN(ticks[i]) ? ticks[i] : lerp(t1, t2, items.length > 1 ? i / (items.length - 1) : 0);
    x.cue(i === items.length - 1 ? 'tick-last' : 'tick', tt);
    x.tick(t => { const p = prog(t, tt, .3, 'quint'); ok.style.opacity = p; ok.style.transform = `scale(${lerp(.4, 1, p)})`;
      sp.style.display = spin && t >= tt - .9 && t < tt ? '' : 'none'; sp.style.transform = `rotate(${t * 400}deg)`;
      tx.style.textDecoration = !spin && p > .5 ? 'line-through' : ''; tx.style.color = p > .5 && !spin ? '#8A8070' : ''; }); });
  x.person(); x.show(c, x.s, { dy: 30 }); x.hideAt(c, x.e);
  x.cue('pop', x.s);
}
VFX.todo = { mask: true, dur: 4, build(x, o) { floatingList(x, o, false); } };

// 12 comment-box: an Instagram-style comment bar types a word and posts it
VFX['comment-box'] = { dur: 3, build(x, o) {
  const z = x.zone(), w = 560, c = box(x.front, 'panel', 80, z.top + 40, w, 64, 'border-radius:32px;display:flex;align-items:center;gap:12px;padding:0 10px;');
  const av = el('span', '', c, esc((o.user || 'Y').charAt(0))); av.style.cssText = 'width:42px;height:42px;border-radius:50%;background:#2F5D50;color:#fff;font:600 18px DM Sans;display:flex;align-items:center;justify-content:center;flex:none';
  const tx = el('span', 'sans', c); tx.style.cssText = 'flex:1;font-size:22px';
  const post = el('span', 'sans', c, 'Post'); post.style.cssText = 'font-weight:700;font-size:19px;padding:0 14px;color:#B4AC9C';
  const tType = x.s + .5, endT = x.type(tx, o.text || 'EFFECTS', tType, { cps: 10 }), tPost = endT + .35;
  const bub = box(x.front, 'panel', 80, z.top + 120, null, null, 'border-radius:18px;padding:12px 16px;display:flex;gap:10px;align-items:center;font:500 18px DM Sans');
  bub.innerHTML = `<b>${esc(o.handle || '@you')}</b>&nbsp;${esc(o.text || 'EFFECTS')}&nbsp;${ico('heart', 18, 'var(--accent)', 2.2)}`;
  x.show(c, x.s, { dy: 16 }); x.hideAt(c, x.e); x.show(bub, tPost + .1, { dy: 14 }); x.hideAt(bub, x.e);
  x.tick(t => { post.style.color = t >= tType + .2 ? 'var(--accent)' : '#B4AC9C'; post.style.transform = `scale(${t >= tPost && t < tPost + .12 ? .88 : 1})`; });
  x.cue('tick', tPost); x.cue('notify', tPost + .1);
} };

// 13 tap: a Follow button pops up and flips to Following
VFX.tap = { dur: 2.5, build(x, o) {
  const z = x.zone(), X = o.x != null ? +o.x * 720 : 360, Y = o.y != null ? +o.y * 1280 : z.top + z.h * .55;
  const b = box(x.front, 'sans', X - 120, Y - 32, 240, 64, 'border-radius:32px;display:flex;align-items:center;justify-content:center;gap:10px;font:700 24px DM Sans;box-shadow:0 10px 24px rgba(40,25,10,.25)');
  const hand = box(x.front, '', X + 30, Y + 60, 40, 40); hand.innerHTML = ico('pointer', 40, 'var(--ink)', 2);
  const tAt = o.at != null && o.start != null ? +o.at : x.s + (x.e - x.s) * .5;
  x.show(b, x.s, { scale: .6, dy: 10 }); x.hideAt(b, x.e); x.show(hand, x.s + .2); x.hideAt(hand, x.e);
  x.tick(t => { const on = t >= tAt; b.style.background = on ? '#FDFDF3' : (o.color || 'var(--accent)'); b.style.color = on ? 'var(--ink)' : '#fff';
    b.innerHTML = on ? `${ico('check', 22, 'var(--accent)', 3)}Following` : `${ico('user-plus', 22, '#fff', 2.4)}Follow`;
    const pr = prog(t, tAt - .35, .3, 'inout'); hand.style.transform = `translate(${-30 * pr}px,${-40 * pr}px) scale(${t >= tAt - .05 && t < tAt + .1 ? .85 : 1})`; });
  x.cue('tick', tAt);
} };

// 14 pause-point: freezes the frame and points at you with a hand-drawn arrow
VFX['pause-point'] = { dur: 2.5, build(x, o) {
  x.freeze(x.s, x.e);
  x.grade(t => t >= x.s && t < x.e ? { frame: 'saturate(.85) contrast(1.05)' } : null);
  const g = box(x.front, '', 0, 0, 720, 1280); fwin(x, g, .12, .2);
  box(g, '', 0, 0, 720, 1280, 'background:radial-gradient(ellipse at center, transparent 55%, rgba(30,20,10,.35))');
  const pill = box(g, 'mono', 300, 130, null, null, 'background:rgba(253,253,243,.92);padding:6px 14px;border-radius:8px;font-size:15px;display:flex;gap:8px;align-items:center'); pill.innerHTML = `${ico('pause', 16, 'var(--accent)', 3)}PAUSED`;
  const f0 = x.face(x.s), lx = o.label_x != null ? +o.label_x * 720 : (f0.cx > 360 ? 70 : 440), ly = f0.top - 30;
  const label = box(g, '', lx, ly - 60, 230, null, `font:700 40px/1.05 Kalam,cursive;color:${o.color || 'var(--accent)'};text-shadow:0 2px 8px rgba(0,0,0,.25)`); label.textContent = o.text || 'this one';
  const ax = lx + 115, ay = ly + 10, tx2 = f0.cx + (lx < f0.cx ? -f0.w * .55 : f0.w * .55), ty2 = f0.cy - f0.w * .2;
  const svg = box(g, '', 0, 0, 720, 1280); svg.innerHTML = `<svg width="720" height="1280"><path d="M${ax} ${ay} C ${ax} ${ay + 90}, ${(ax + tx2) / 2} ${ty2 - 40}, ${tx2} ${ty2}" fill="none" stroke="${o.color || '#D30135'}" stroke-width="5" stroke-linecap="round"/><path d="M${tx2 + (lx < f0.cx ? -22 : 22)} ${ty2 - 16} L ${tx2} ${ty2} L ${tx2 + (lx < f0.cx ? -26 : 26)} ${ty2 + 10}" fill="none" stroke="${o.color || '#D30135'}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ps = svg.querySelectorAll('path'); x.draw(ps[0], x.s + .15, .45); x.draw(ps[1], x.s + .55, .15);
  x.show(label, x.s + .1, { dy: 0, scale: .8 }); x.cue('tick', x.s);
} };

// 15 uninstall: an uninstall bar runs, then the frame glitches apart
VFX.uninstall = { dur: 3, build(x, o) {
  const host = box(x.front, '', 0, 0, 720, 1280); fwin(x, host, .05, .2);
  const z = x.zone(), d = box(host, 'panel', 110, z.top + 40, 500, 132, 'border-radius:18px;padding:18px 22px;');
  el('div', 'sans', d, `${ico('trash-2', 20, 'var(--accent)', 2)}<span>Uninstalling <b>${esc(o.text || 'old habits')}</b>…</span>`).style.cssText = 'display:flex;gap:10px;align-items:center;font-size:20px';
  const tr = el('div', '', d); tr.style.cssText = 'margin-top:18px;height:10px;border-radius:5px;background:var(--track);overflow:hidden'; const fl = el('div', '', tr); fl.style.cssText = 'height:100%;width:0;background:var(--accent)';
  const pct = el('div', 'mono', d); pct.style.cssText = 'margin-top:8px;font-size:14px;color:#6E6656;text-align:right';
  const tg = x.s + (x.e - x.s) * .65, bands = [0, 1, 2, 3, 4].map(i => { const c = x.copy(host); c.style.clipPath = `inset(${i * 256}px 0 ${1280 - (i + 1) * 256}px 0)`; c.style.display = 'none'; return c; });
  x.tick(t => { const p = prog(t, x.s + .2, tg - x.s - .2, 'inout'); fl.style.width = p * 100 + '%'; pct.textContent = Math.round(p * 100) + '%';
    const gl = t >= tg && t < x.e; bands.forEach((c, i) => { c.style.display = gl ? '' : 'none'; const k = Math.sin((t - tg) * 40 + i * 2.1);
      c.style.transform = `${COOK.camCss()} translateX(${k * 30 * (1 - prog(t, tg, x.e - tg))}px)`; c.style.filter = i % 2 ? 'grayscale(1) contrast(1.35)' : 'sepia(.7) saturate(2.4) hue-rotate(-28deg) contrast(1.1)'; });
    d.style.transform = gl ? `translateX(${Math.sin(t * 90) * 8}px)` : ''; });
  x.cue('cook', x.s + .2, tg - x.s - .2); x.cue('glitch', tg);
} };

// 16 reel-frame: your video shrinks into a reel card on cream paper
VFX['reel-frame'] = { dur: 3, build(x, o) {
  const host = box(x.front, '', 0, 0, 720, 1280, 'background:var(--paper)'); fwin(x, host, .2, .3);
  const card = box(host, 'panel', 0, 0, 720, 1280, 'border-radius:28px;overflow:hidden;transform-origin:50% 45%;');
  const c = x.copy(card); c.style.position = 'absolute';
  const hdr = box(card, 'sans', 24, 24, null, null, 'display:flex;gap:10px;align-items:center;color:#fff;font:600 22px DM Sans;text-shadow:0 1px 4px rgba(0,0,0,.5)');
  hdr.innerHTML = `<span style="width:38px;height:38px;border-radius:50%;background:var(--terra);display:flex;align-items:center;justify-content:center">${ico('user', 20, '#fff', 2)}</span>${esc(o.text || '@yourhandle')}`;
  const side = box(card, '', 640, 760, 56, null, 'display:flex;flex-direction:column;gap:26px;align-items:center'); ['heart', 'message-circle', 'send', 'bookmark'].forEach(n => side.insertAdjacentHTML('beforeend', ico(n, 40, '#fff', 2)));
  x.tick(t => { const p = prog(t, x.s, .55, 'smooth'), q = prog(t, x.e - .45, .45, 'smooth'), k = p * (1 - q); card.style.transform = `scale(${lerp(1, .74, k)})`; card.style.borderRadius = lerp(0, 34, k) + 'px';
    c.style.transform = COOK.camCss(); hdr.style.opacity = side.style.opacity = k; });
  x.cue('woosh', x.s);
} };

// 17 shortcut-rain: keyboard keys rain down behind you
VFX['shortcut-rain'] = { mask: true, dur: 3, build(x, o) {
  const keys = list(o.text).length ? list(o.text) : ['⌘', 'C', 'V', 'Z', '⇧', '⌥', 'Tab', 'Esc', 'K', '/'], n = +(o.count ?? 22);
  for (let i = 0; i < n; i++) { const k = keys[i % keys.length], w = k.length > 2 ? 96 : 64;
    const c = box(x.back, 'mono', (i * 89 + 23) % 640, -100, w, 64, 'background:#FDFDF3;border-radius:12px;box-shadow:0 5px 0 #D8CFC0,0 10px 18px rgba(40,25,10,.25);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:500;color:var(--ink)'); c.textContent = k;
    const t0 = x.s + (i / n) * (x.e - x.s) * .8, rot = (i * 37) % 40 - 20, sp = 780 + (i * 61) % 400;
    x.tick(t => { const u = t - t0; c.style.visibility = u < 0 ? 'hidden' : 'visible'; c.style.top = (-100 + u * sp) + 'px'; c.style.transform = `rotate(${rot + u * 30}deg)`; c.style.opacity = 1 - prog(t, x.e, .3); }); }
  x.cue('type', x.s, x.e - x.s);
} };

// 18 reject-stamp: a big crimson stamp slams onto the screen
VFX['reject-stamp'] = { dur: 1.6, build(x, o) {
  const col = o.color || 'var(--accent)', Y = o.y != null ? +o.y * 1280 : x.zone().top + x.zone().h * .45;
  const s = box(x.front, 'mono', 0, 0, null, null, `left:50%;top:${Y}px;border:7px solid ${col};color:${col};border-radius:14px;padding:10px 28px;font:400 72px/1 'Archivo Black','DM Sans';letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;background:rgba(253,253,243,.12);mix-blend-mode:multiply;`);
  s.textContent = o.text || 'REJECTED'; const ang = +(o.angle ?? -12);
  x.tick(t => { const p = prog(t, x.s, .16, 'out'), q = prog(t, x.e, .25, 'out'); s.style.opacity = Math.min(p * 1.4, 1 - q); s.style.transform = `translate(-50%,-50%) rotate(${ang}deg) scale(${lerp(2.4, 1, p)})`; });
  x.cam(t => (t >= x.s + .16 && t < x.s + .5 ? { z: 1.01, dx: Math.sin((t - x.s) * 90) * 8 * (1 - prog(t, x.s + .16, .34)), px: 360, py: 640 } : null));
  x.cue('stamp', x.s + .14);
} };

// 19 countdown-flip: a 3, 2, 1 flip clock above your head
VFX['countdown-flip'] = { dur: 3, build(x, o) {
  const from = +(o.from ?? 3), z = x.zone(), step = (x.e - x.s) / from, f0 = x.face(x.s);
  const c = box(x.front, '', f0.cx - 100, Math.max(z.top, z.bottom - 250), 200, 230, 'perspective:600px');
  const card = box(c, 'serif', 0, 0, 200, 230, 'background:#FDFDF3;border-radius:22px;box-shadow:0 14px 30px rgba(40,25,10,.28);display:flex;align-items:center;justify-content:center;font-size:170px;line-height:1;color:var(--ink);overflow:hidden');
  box(c, '', 0, 114, 200, 2, 'background:rgba(40,25,10,.18)');
  x.show(c, x.s, { scale: .8 }); x.hideAt(c, x.e);
  x.tick(t => { const i = clamp(Math.floor((t - x.s) / step), 0, from - 1), u = (t - x.s) - i * step; card.textContent = String(from - i);
    card.style.color = from - i === 1 ? 'var(--accent)' : 'var(--ink)'; const p = prog(u, 0, .25, 'out'); card.style.transform = `rotateX(${(1 - p) * 80}deg)`; });
  for (let i = 0; i < from; i++) x.cue('tick', x.s + i * step);
} };

// 20 rabbit-hole: the frame tunnels into itself, spinning, framed in ivory
VFX['rabbit-hole'] = { dur: 2.5, build(x, o) {
  const host = box(x.front, '', 0, 0, 720, 1280, 'background:var(--paper);overflow:hidden'); fwin(x, host, .15, .25);
  const ratio = +(o.ratio ?? .72), n = 7, spin = +(o.spin ?? 14), spd = +(o.speed ?? 1);
  const layers = Array.from({ length: n }, () => { const w = box(host, '', 0, 0, 720, 1280, 'transform-origin:360px 640px;border-radius:22px;overflow:hidden;box-shadow:0 0 0 8px #FDFDF3,0 16px 40px rgba(0,0,0,.35)'); const c = x.copy(w); return w; });
  x.tick(t => { const u = (t - x.s) * spd; layers.forEach((w, k) => { const lvl = Math.max(0, k - (u * 1.2 % 1)), s2 = Math.pow(ratio, lvl);
    w.style.transform = `scale(${s2}) rotate(${lvl * spin}deg)`; w.style.zIndex = k; w.style.borderRadius = (k ? 22 / s2 : 0) + 'px'; }); });
  x.cue('woosh', x.s);
} };

// 21 cover-star: you become a magazine cover (editorial look), masthead behind your head
VFX['cover-star'] = { mask: true, dur: 4, build(x, o) {
  x.grade(t => (t >= x.s && t < x.e + .3 ? { frame: GRADES.film } : null));
  const g = box(x.back, '', 0, 0, 720, 1280); fwin(x, g, .4, .3);
  const f0 = x.face(x.s), mast = box(g, 'serif', 0, Math.max(60, f0.top - 210), 720, null, `text-align:center;font-size:${+(o.size ?? 170)}px;line-height:1;letter-spacing:-.04em;font-weight:600;color:${o.color || 'var(--accent)'};white-space:nowrap`);
  mast.textContent = o.text || 'COOKS';
  const fr = box(x.front, '', 0, 0, 720, 1280); fwin(x, fr, .4, .3);
  const issue = box(fr, 'mono', 40, 64, 640, null, 'display:flex;justify-content:space-between;font-size:15px;color:#FDFDF3;text-shadow:0 1px 4px rgba(0,0,0,.6)'); issue.innerHTML = `<span>${esc(o.issue || 'ISSUE 01')}</span><span>${esc(o.date || 'THE AI EDITION')}</span>`;
  const L = list(o.lines), R = list(o.right);
  L.forEach((l, i) => { const e2 = box(fr, 'serif', 34, 760 + i * 74, 260, null, `font-size:30px;line-height:1.05;font-style:italic;color:#FDFDF3;text-shadow:0 2px 10px rgba(0,0,0,.55)`); e2.innerHTML = esc(l); x.show(e2, x.s + .5 + i * .15, { dx: -20, dy: 0 }); });
  R.forEach((l, i) => { const e2 = box(fr, 'serif', 430, 760 + i * 74, 256, null, `font-size:30px;line-height:1.05;text-align:right;color:#FDFDF3;text-shadow:0 2px 10px rgba(0,0,0,.55)`); e2.innerHTML = esc(l); x.show(e2, x.s + .6 + i * .15, { dx: 20, dy: 0 }); });
  x.tick(t => { const p = prog(t, x.s, .6, 'quint'); mast.style.transform = `translateY(${(1 - p) * -60}px) scale(${Math.min(1, 700 / Math.max(1, mast.scrollWidth))})`; });
  x.cue('woosh', x.s);
} };

// 22 scribble: marker doodles draw themselves around you
VFX.scribble = { dur: 3, build(x, o) {
  const f0 = x.face(x.s), col = o.color || '#D30135', g = box(x.front, '', 0, 0, 720, 1280); fwin(x, g, .05, .3);
  const rx = f0.w * .85, ry = f0.w * 1.1, cx = f0.cx, cy = f0.cy - f0.w * .1;
  const wob = Array.from({ length: 26 }, (_, i) => { const a = i / 24 * Math.PI * 2.08 - 1.7, k = 1 + .05 * Math.sin(i * 2.7); return `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`; }).join(' ');
  const star = (sx, sy, r) => `M${sx - r} ${sy} L${sx + r} ${sy} M${sx} ${sy - r} L${sx} ${sy + r} M${sx - r * .7} ${sy - r * .7} L${sx + r * .7} ${sy + r * .7}`;
  g.innerHTML = `<svg width="720" height="1280" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="${wob}"/><path d="${star(cx - rx - 40, cy - ry + 10, 16)}"/><path d="${star(cx + rx + 34, cy - ry + 60, 12)}"/><path d="M${cx + rx + 10} ${cy + 30} q 40 -10 60 -60 m -18 6 l 18 -6 l 4 18"/></svg>`;
  const ps = g.querySelectorAll('path'); ps.forEach((p, i) => x.draw(p, x.s + .1 + i * .2, .5));
  if (o.text) { const l = box(g, '', cx + rx + 30, cy - 160, 220, null, `font:700 38px/1.05 Kalam,cursive;color:${col}`); l.textContent = o.text; x.show(l, x.s + .7, { dy: 0, scale: .8 }); }
  x.cue('cook', x.s + .1, .9);
} };

// 23 glass-widgets: frosted widgets float around your head (look "simple" = 3 widgets)
VFX['glass-widgets'] = { dur: 4, build(x, o) {
  const z = x.zone(), f0 = x.face(x.s), simple = o.look === 'simple';
  const W = [
    [40, z.top + 20, 250, 130, `<div class="caps">${esc(o.label || 'This week')}</div><div class="serif" style="font-size:58px;line-height:1;color:var(--terra)">${esc(o.text || '1.2M')}</div><div class="sans" style="font-size:14px;color:#6E6656">views</div>`],
    [430, z.top + 10, 250, 96, `<div style="display:flex;gap:12px;align-items:center"><span style="width:52px;height:52px;border-radius:50%;background:var(--terra);display:flex;align-items:center;justify-content:center">${ico('user', 26, '#fff', 2)}</span><div><b class="sans" style="font-size:18px">${esc(o.name || 'Your Name')}</b><div class="mono" style="font-size:13px;color:#6E6656">${esc(o.handle || '@you')}</div></div></div>`],
    [430, z.top + 120, 250, 120, `<div class="caps">Growth</div><svg width="210" height="70"><path d="M2 64 C 50 60, 70 40, 110 42 S 170 10, 208 4" fill="none" stroke="#D30135" stroke-width="4" stroke-linecap="round"/></svg>`],
    [60, z.top + 168, 200, 62, `<div style="display:flex;gap:8px;align-items:center;font:600 16px DM Sans">${ico('sparkles', 20, 'var(--terra)', 2)}${esc(o.pill || 'Made with Claude')}</div>`],
  ].slice(0, simple ? 3 : 4);
  W.forEach(([l, tp, w, h, html], i) => { const c = box(x.front, '', l, tp, w, h, 'border-radius:22px;padding:14px 18px;background:rgba(253,251,243,.62);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.7);box-shadow:0 14px 34px rgba(40,25,10,.22)'); c.innerHTML = html;
    x.show(c, x.s + i * .12, { dy: 18 }); x.hideAt(c, x.e); const ph = i * 1.3; x.tick(t => { c.style.translate = `0 ${Math.sin((t - x.s) * 1.6 + ph) * 5}px`; });
    const pth = c.querySelector('path'); if (pth) x.draw(pth, x.s + .5, .9); x.cue('pop', x.s + i * .12); });
} };

// 24 red-collage: black-and-white you, a giant crimson word behind, three lines slam in
VFX['red-collage'] = { mask: true, dur: 3.5, build(x, o) {
  x.grade(t => (t >= x.s && t < x.e + .2 ? { frame: GRADES.bw, person: GRADES.bw } : null));
  const f0 = x.face(x.s), w = box(x.back, '', 0, Math.max(40, f0.top - 260), 720, null, `text-align:center;font:400 220px/0.9 'Archivo Black';color:var(--accent);white-space:nowrap;letter-spacing:-.02em`); w.textContent = (o.text || 'NOW').toUpperCase();
  x.tick(t => { const p = prog(t, x.s, .35, 'out'); w.style.opacity = Math.min(p, 1 - prog(t, x.e, .3)); w.style.transform = `scale(${lerp(1.4, 1, p) * Math.min(1, 700 / Math.max(1, w.scrollWidth))})`; });
  (list(o.lines).length ? list(o.lines) : ['ONE', 'TWO', 'THREE']).forEach((l, i) => { const e2 = box(x.front, 'sans', i % 2 ? 300 : 40, 760 + i * 70, null, null, `background:#FDFDF3;padding:6px 16px;font:800 34px/1.1 'DM Sans';text-transform:uppercase;color:var(--ink);transform:rotate(${i % 2 ? 2 : -2}deg);box-shadow:0 6px 0 var(--accent)`); e2.textContent = l;
    const t0 = x.s + .4 + i * .3; x.show(e2, t0, { dur: .18, scale: 1.6, blur: 0, dy: 0 }); x.hideAt(e2, x.e); x.cue('stamp', t0); });
  if (o.tag) { const tg = box(x.front, 'mono', 40, 130, null, null, 'background:var(--accent);color:#fff;padding:5px 12px;border-radius:6px;font-size:15px'); tg.textContent = o.tag; x.show(tg, x.s + .2); x.hideAt(tg, x.e); }
} };

// 25 split-headline: a headline panel slides down and pushes you to the bottom half
// the video shrinks into a rounded card in the lower part; a paper panel above holds the headline or b-roll.
// (shrinking, not pushing down, keeps the face above the captions)
function splitTop(x, o, fill) {
  const Z = +(o.scale ?? .74), PX = 360, PY = 1240, kAt = t => prog(t, x.s, .55, 'smooth') * (1 - prog(t, x.e - .1, .5, 'smooth'));
  x.cam(t => { const k = kAt(t); return k > 0 ? { z: lerp(1, Z, k), px: PX, py: PY } : null; });
  const hole = box(x.front, '', 0, 0, 720, 1280, 'box-shadow:0 0 0 1600px var(--paper), 0 12px 30px rgba(40,25,10,.25)');
  const top = box(x.front, '', 0, 0, 720, Math.round(PY * (1 - Z)) - 14, 'overflow:hidden');
  x.tick(t => { const k = kAt(t), z = lerp(1, Z, k); hole.style.display = top.style.display = k > 0 ? '' : 'none';
    hole.style.left = (PX - PX * z) + 'px'; hole.style.top = (PY - PY * z) + 'px'; hole.style.width = (720 * z) + 'px'; hole.style.height = (1280 * z) + 'px';
    hole.style.borderRadius = (26 * k) + 'px'; top.style.opacity = k; });
  fill(top, Math.round(PY * (1 - Z)) - 14); x.cue('woosh', x.s);
}
VFX['split-headline'] = { dur: 3.5, build(x, o) { splitTop(x, o, (top, H) => {
  const lines = list(o.text).length ? list(o.text) : ['Your headline', 'goes here'], hl = String(o.hl || '').toLowerCase();
  const h = box(top, 'serif', 40, 96, 640, null, 'font-size:62px;line-height:1.06;font-weight:500');
  h.innerHTML = lines.map(l => esc(l).split(' ').map(w => hl && w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === hl ? `<span style="background:linear-gradient(transparent 55%, rgba(227,178,60,.55) 55%);color:var(--accent)">${w}</span>` : w).join(' ')).join('<br>');
  if (o.pill) { const p = box(top, 'mono', 40, 44, null, null, 'background:var(--blush);color:var(--brick);padding:4px 12px;border-radius:14px;font-size:15px'); p.textContent = o.pill; }
  x.show(h, x.s + .35, { dy: 14 }); }); } };

// 26 pastel-word: a blush room, a giant word behind you, a profile card that gets followed
VFX['pastel-word'] = { mask: true, dur: 4, build(x, o) {
  const room = box(x.back, '', 0, 0, 720, 1280, 'background:radial-gradient(ellipse at 50% 40%, #FBEDE6, #F2D9CF 70%)'); fwin(x, room, .4, .3);
  const f0 = x.face(x.s), w = box(room, 'serif', 0, Math.max(60, f0.top - 200), 720, null, 'text-align:center;font-size:200px;line-height:1;font-style:italic;color:var(--brick);white-space:nowrap'); w.textContent = o.text || 'hello';
  x.tick(t => { w.style.transform = `scale(${Math.min(1, 700 / Math.max(1, w.scrollWidth)) * lerp(.9, 1, prog(t, x.s, .7))})`; });
  const z = x.zone(), card = box(x.front, 'panel', 130, z.top + 20, 460, 92, 'border-radius:46px;display:flex;align-items:center;gap:14px;padding:0 14px');
  card.innerHTML = `<span style="width:64px;height:64px;border-radius:50%;background:var(--terra);display:flex;align-items:center;justify-content:center;flex:none">${ico('user', 30, '#fff', 2)}</span><div style="flex:1"><b class="sans" style="font-size:20px">${esc(o.name || 'Your Name')}</b><div class="mono" style="font-size:14px;color:#6E6656">${esc(o.handle || '@you')}</div></div>`;
  const btn = el('span', 'sans', card); btn.style.cssText = 'padding:10px 18px;border-radius:22px;font:700 18px DM Sans';
  const tf = x.s + (x.e - x.s) * .6; x.tick(t => { const on = t >= tf; btn.textContent = on ? 'Following' : 'Follow'; btn.style.background = on ? 'var(--chip)' : 'var(--accent)'; btn.style.color = on ? 'var(--ink)' : '#fff'; });
  x.show(card, x.s + .3, { dy: 14 }); x.hideAt(card, x.e); x.cue('tick', tf);
} };

// 27 check-pills: grid-paper room, boards behind you, a cursor clicks crimson pills
VFX['check-pills'] = { mask: true, dur: 4, build(x, o) {
  const room = box(x.back, '', 0, 0, 720, 1280, 'background-color:#F6F3E8;background-image:linear-gradient(#E4DDCB 1px,transparent 1px),linear-gradient(90deg,#E4DDCB 1px,transparent 1px);background-size:36px 36px'); fwin(x, room, .4, .3);
  for (let i = 0; i < 4; i++) { const tl = tile(x, i, 150, 220, ''); room.appendChild(tl); tl.style.left = [30, 190, 380, 540][i] + 'px'; tl.style.top = [150, 110, 120, 160][i] + 'px'; tl.style.transform = `rotate(${[-6, 3, -3, 6][i]}deg)`; }
  const pills = list(o.text).length ? list(o.text) : ['Hook', 'Story', 'CTA'], z = x.zone(), row = box(x.front, '', 40, z.bottom - 70, 640, 56, 'display:flex;gap:12px;justify-content:center');
  const els = pills.map(p => { const e2 = el('span', 'sans', row); e2.style.cssText = 'display:flex;align-items:center;gap:8px;padding:0 20px;height:52px;border-radius:26px;font:600 20px DM Sans;background:#FDFDF3;border:2px solid var(--accent);color:var(--accent);box-shadow:0 6px 16px rgba(40,25,10,.18)'; e2.innerHTML = esc(p); return e2; });
  const cur = box(x.front, '', 360, 1000, 40, 40); cur.innerHTML = ico('mouse-pointer-2', 38, 'var(--ink)', 2);
  x.show(row, x.s + .3, { dy: 14 }); x.hideAt(row, x.e); x.show(cur, x.s + .4); x.hideAt(cur, x.e);
  const step = (x.e - x.s - 1) / pills.length;
  x.tick(t => { let px = 360, py = z.bottom + 120; els.forEach((e2, i) => { const tc = x.s + .8 + i * step, r = e2.getBoundingClientRect();
    if (t >= tc - step * .8) { const k = prog(t, tc - step * .8, step * .7, 'inout'), tx = r.left + r.width / 2, ty = r.top + r.height / 2; px = lerp(px, tx, k); py = lerp(py, ty, k); }
    const on = t >= tc; e2.style.background = on ? 'var(--accent)' : '#FDFDF3'; e2.style.color = on ? '#fff' : 'var(--accent)'; });
    cur.style.left = px + 'px'; cur.style.top = py + 'px'; });
  pills.forEach((_, i) => x.cue('tick', x.s + .8 + i * step));
} };

// 28 timeline: a warm film grade with an editing timeline, REC timecode and a glowing playhead
VFX.timeline = { dur: 4, build(x, o) {
  x.grade(t => (t >= x.s && t < x.e + .2 ? { frame: 'sepia(.3) saturate(1.1) contrast(1.08) brightness(.92) hue-rotate(-8deg)' } : null));
  const z = x.zone(), g = box(x.front, '', 0, 0, 720, 1280); fwin(x, g, .3, .3);
  const rec = box(g, 'mono', 40, z.top - 10, null, null, 'display:flex;gap:10px;align-items:center;background:rgba(10,7,5,.55);color:#FDFDF3;padding:6px 12px;border-radius:8px;font-size:16px');
  const dot = el('span', '', rec); dot.style.cssText = 'width:12px;height:12px;border-radius:50%;background:var(--accent)'; const tc = el('span', '', rec);
  const p = box(g, 'panel', 40, z.top + 40, 640, 170, 'border-radius:18px;padding:16px 20px');
  el('div', 'serif', p, esc(o.text || 'Final cut')).style.cssText = 'font-size:28px';
  if (o.sub) el('div', 'sans', p, esc(o.sub)).style.cssText = 'font-size:15px;color:#6E6656';
  const tr = el('div', '', p); tr.style.cssText = 'position:relative;margin-top:14px;height:56px';
  const cols = ['#CC6350', '#E3B23C', '#5E6F2E', '#95493F', '#B9A3AE', '#D30135'];
  let xx = 0; for (let i = 0; i < 7; i++) { const w = 50 + (i * 37) % 70; const c = el('div', '', tr); c.style.cssText = `position:absolute;left:${xx}px;top:${i % 2 ? 30 : 0}px;width:${w}px;height:24px;border-radius:6px;background:${cols[i % cols.length]};opacity:.85`; xx += w + 6; }
  const ph = el('div', '', tr); ph.style.cssText = 'position:absolute;top:-8px;width:3px;height:72px;background:var(--accent);box-shadow:0 0 10px var(--accent)';
  x.tick(t => { const u = clamp((t - x.s) / (x.e - x.s)); ph.style.left = (u * 590) + 'px'; dot.style.opacity = Math.floor(t * 2) % 2 ? .3 : 1;
    const tt = (o.tc ? 0 : t); const fr = Math.floor(tt * 30) % 30; tc.textContent = o.tc || `REC 00:${String(Math.floor(tt / 60)).padStart(2, '0')}:${String(Math.floor(tt % 60)).padStart(2, '0')}:${String(fr).padStart(2, '0')}`; });
  x.cue('cook', x.s, x.e - x.s);
} };

// 29 headline-box: a punch-in with a two-line headline, the second line in an ivory box
VFX['headline-box'] = { dur: 3, build(x, o) {
  camPunch(x, Math.min(2, +(o.zoom ?? 1.2)), x.s, .35, .4);
  const lines = list(o.text).length ? list(o.text) : ['This changes', 'everything'], z = x.zone();
  const a = box(x.front, 'serif', 40, z.top + 30, 640, null, 'text-align:center;font-size:58px;line-height:1.05;color:#FDFDF3;text-shadow:0 3px 14px rgba(0,0,0,.55)'); a.textContent = lines[0];
  const b = box(x.front, 'serif', 0, z.top + 110, null, null, 'left:50%;font-size:58px;line-height:1.05;background:#FDFDF3;color:var(--ink);padding:4px 20px 8px;border-radius:12px;white-space:nowrap;box-shadow:0 10px 26px rgba(40,25,10,.3)'); b.textContent = lines[1] || '';
  x.show(a, x.s + .1, { dy: 14 }); x.show(b, x.s + .3, { dy: 14, base: 'translateX(-50%)' }); x.hideAt(a, x.e); x.hideAt(b, x.e); x.cue('woosh', x.s);
} };

// 30 profile-wall: your reels fill the wall behind you while a counter ticks up
VFX['profile-wall'] = { mask: true, dur: 4, build(x, o) {
  const n = +(o.count ?? 12), cols = 4, w = 168, h = 250;
  for (let i = 0; i < n; i++) { const tl = tile(x, i, w - 10, h - 10, lab(x, i)); x.back.appendChild(tl); tl.style.left = (8 + (i % cols) * (w + 8)) + 'px'; tl.style.top = (120 + Math.floor(i / cols) * (h + 8)) + 'px';
    const t0 = x.s + i * Math.min(.18, (x.e - x.s - 1) / n); tl.style.opacity = 0; x.tick(t => { const p = prog(t, t0, .3, 'quint'); tl.style.opacity = Math.min(p, 1 - prog(t, x.e, .3)); tl.style.transform = `scale(${lerp(.7, 1, p)})`; }); x.cue('pop', t0); }
  const z = x.zone(), c = box(x.front, 'panel', 470, z.top, 210, 110, 'border-radius:20px;padding:12px 18px');
  const num = el('div', 'serif', c); num.style.cssText = 'font-size:52px;line-height:1;color:var(--terra)'; el('div', 'caps', c, esc(o.label || 'reels posted'));
  x.count(num, 0, +(o.total ?? n * 10), x.s + .2, x.e - x.s - .6); x.show(c, x.s + .1); x.hideAt(c, x.e);
} };

// 31 tier-list: a tier list drops in and your item flies into S tier
VFX['tier-list'] = { dur: 4, build(x, o) {
  const z = x.zone(), H = 300, b = box(x.front, 'panel', 60, Math.max(z.top, z.bottom - H), 600, H, 'border-radius:20px;padding:14px 16px;overflow:visible');
  el('div', 'serif', b, esc(o.title || 'Tier list')).style.cssText = 'font-size:24px;margin-bottom:8px';
  const tiers = [['S', 'var(--accent)'], ['A', 'var(--terra)'], ['B', '#E3B23C'], ['C', '#5E6F2E']], others = list(o.others).length ? list(o.others) : ['GPT', 'Gemini', 'Llama', 'Grok'];
  const rows = tiers.map(([L, c], i) => { const r = el('div', '', b); r.style.cssText = 'display:flex;gap:8px;align-items:center;height:56px;border-top:1px solid #E6E1CF';
    el('span', 'serif', r, L).style.cssText = `width:46px;height:46px;border-radius:10px;background:${c};color:#fff;font-size:28px;display:flex;align-items:center;justify-content:center`;
    if (i > 0 && others[i - 1]) el('span', 'chip', r, esc(others[i - 1])); return r; });
  const item = box(x.front, 'chip', 0, 0, null, null, 'font-size:20px;height:44px;background:var(--ink);color:#FDFDF3;border:0'); item.innerHTML = `${ico('sparkles', 18, '#F3D27A', 2)}${esc(o.item || 'Claude')}`;
  x.show(b, x.s, { dy: -40 }); x.hideAt(b, x.e); x.hideAt(item, x.e);
  const tf = x.s + .7, d = .8;
  x.tick(t => { const r = rows[0].getBoundingClientRect(), f = x.face(t), p = prog(t, tf, d, 'smooth'), sx = f.cx - 60, sy = f.chin + 40, ex = r.left + 70, ey = r.top + 6;
    item.style.left = lerp(sx, ex, p) + 'px'; item.style.top = (lerp(sy, ey, p) - Math.sin(p * Math.PI) * 120) + 'px'; item.style.opacity = t < tf - .1 ? 0 : 1; });
  x.cue('woosh', tf); x.cue('tick-last', tf + d);
} };

// 32 broll-split: b-roll on top with a price-tag sticker, you below
VFX['broll-split'] = { dur: 3.5, build(x, o) { splitTop(x, o, (top, H) => {
  const t = tile(x, 0, 640, H - 40, o.label || ''); top.appendChild(t); t.style.left = '40px'; t.style.top = '20px'; t.style.borderRadius = '22px';
  const tag = box(top, 'sans', 480, 40, null, null, 'background:var(--accent);color:#fff;font:800 28px DM Sans;padding:10px 18px;border-radius:10px;transform:rotate(8deg);box-shadow:0 8px 18px rgba(0,0,0,.3)'); tag.textContent = o.text || '₹0';
  x.show(tag, x.s + .55, { scale: 1.5, dy: 0, dur: .25 }); x.cue('money', x.s + .55); }); } };

// 33 phone-fan: your reels fan out like a hand of phones under a headline
VFX['phone-fan'] = { dur: 3.5, build(x, o) {
  const z = x.zone(), lines = list(o.text);
  const h = box(x.front, 'serif', 40, z.top - 45, 640, null, 'text-align:center;font-size:40px;line-height:1.05;color:#FDFDF3;text-shadow:0 3px 14px rgba(0,0,0,.55)'); h.innerHTML = lines.map(esc).join('<br>');
  x.show(h, x.s, { dy: 12 }); x.hideAt(h, x.e);
  const n = 5, PW = 100, PH = 178, cx = 360, cy = Math.max(z.top + 60 + PH, z.bottom - 10);
  for (let i = 0; i < n; i++) { const ph = tile(x, i, PW, PH, ''); ph.style.borderRadius = '20px'; x.front.appendChild(ph); ph.style.left = (cx - PW / 2) + 'px'; ph.style.top = (cy - PH) + 'px'; ph.style.transformOrigin = '50% 140%';
    const ang = lerp(-34, 34, i / (n - 1)), t0 = x.s + .2 + i * .07;
    x.tick(t => { const p = prog(t, t0, .5, 'quint'); ph.style.transform = `rotate(${ang * p}deg)`; ph.style.opacity = Math.min(p * 2, 1 - prog(t, x.e, .3)); }); x.cue('pop', t0); }
} };

// 34 dot-reveal: your shot builds out of glowing dots, then snaps to the full picture
VFX['dot-reveal'] = { dur: 2, build(x, o) {
  const host = box(x.front, '', 0, 0, 720, 1280, 'background:var(--ink)'); fwin(x, host, .01, .15);
  const c = x.copy(host), cell = +(o.cell ?? 16), col = o.color || 'rgba(204,99,80,.9)';
  c.style.filter = `drop-shadow(0 0 4px ${col})`;
  x.tick(t => { const u = clamp((t - x.s) / Math.max(.3, (x.e - x.s) * .85)), r = lerp(1.6, cell * .75, EASE.inout(u)); c.style.transform = COOK.camCss();
    const m = u >= 1 ? 'none' : `radial-gradient(circle at center, #000 ${r}px, transparent ${r + 1}px)`; c.style.webkitMaskImage = c.style.maskImage = m;
    c.style.webkitMaskSize = c.style.maskSize = `${cell}px ${cell}px`; host.style.background = u >= 1 ? 'transparent' : 'var(--ink)'; });
  x.cue('cook', x.s, x.e - x.s - .2); x.cue('pop', x.e - .15);
} };

// 35 headline-wall: your headlines pile up behind your head, then a total pops in front
VFX['headline-wall'] = { mask: true, dur: 4, build(x, o) {
  const hs = list(o.text).length ? list(o.text) : ['AI changes everything::Tech Daily', 'Agents are here::The Brief', 'Claude ships again::Dev News'], f0 = x.face(x.s);
  hs.forEach((h, i) => { const [hd, meta] = String(h).split('::'); const c = box(x.back, 'panel', 60 + (i * 97) % 220, Math.max(110, f0.top - 260) + i * 60, 400, null, `border-radius:10px;padding:14px 18px;transform:rotate(${((i * 23) % 12) - 6}deg)`);
    el('div', 'mono', c, esc(meta || 'NEWS')).style.cssText = 'font-size:12px;color:var(--brick);margin-bottom:4px';
    el('div', 'serif', c, esc(hd)).style.cssText = 'font-size:28px;line-height:1.1';
    const t0 = x.s + .1 + i * Math.min(.45, (x.e - x.s - 1.2) / hs.length); x.show(c, t0, { dy: -24, scale: 1.08 }); x.hideAt(c, x.e); x.cue('pop', t0); });
  const z = x.zone(), tot = box(x.front, 'panel', 230, z.bottom - 100, 260, 90, 'border-radius:45px;display:flex;align-items:center;justify-content:center;gap:10px');
  tot.innerHTML = `<span class="serif" style="font-size:44px;color:var(--accent)">${esc(o.total || hs.length)}</span><span class="sans" style="font-size:17px">${esc(o.label || 'headlines')}</span>`;
  x.show(tot, x.e - .9, { scale: .7 }); x.hideAt(tot, x.e); x.cue('tick-last', x.e - .9);
} };

// 36 checklist: a task list where each step spins, then ticks
VFX.checklist = { mask: true, dur: 4, build(x, o) { floatingList(x, o, true); } };

// 37 liquid-glass-graph: a glass card where a graph climbs and the number counts up (look "bento" adds tiles)
function glassCard(parent, l, tp, w, h) { return box(parent, '', l, tp, w, h, 'border-radius:24px;padding:16px 20px;background:rgba(253,251,243,.6);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.75);box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 14px 34px rgba(40,25,10,.22)'); }
function graphInto(x, c, o, t0, w = 300, bars = false) {
  el('div', 'caps', c, esc(o.text || 'Growth')).style.marginBottom = '4px';
  const num = el('div', 'serif', c); num.style.cssText = 'font-size:48px;line-height:1;color:var(--accent)';
  const parse = v => { const m = String(v ?? '').match(/^([^\d-]*)([\d.]+)(.*)$/); return m ? [m[1], +m[2], m[3]] : ['', 0, '']; };
  const [pre, toN, suf] = parse(o.to ?? '197K'), [, fromN] = parse(o.from ?? 0), dec = (String(toN).split('.')[1] || '').length;
  x.count(num, fromN, toN, t0, .9, v => pre + v.toFixed(dec) + suf);
  if (bars) { const bw = el('div', '', c); bw.style.cssText = 'display:flex;gap:10px;align-items:flex-end;height:80px;margin-top:8px';
    [.35, .55, .48, .8, 1].forEach((k, i) => { const b2 = el('div', '', bw); b2.style.cssText = `width:36px;border-radius:8px 8px 3px 3px;background:${i === 4 ? 'var(--accent)' : 'rgba(204,99,80,.45)'}`; x.tick(t => { b2.style.height = (k * 80 * prog(t, t0 + i * .08, .5, 'quint')) + 'px'; }); });
  } else { const sv = el('div', '', c); sv.innerHTML = `<svg width="${w}" height="90"><path d="M2 86 C ${w * .2} 82, ${w * .35} 64, ${w * .5} 60 S ${w * .8} 30, ${w - 4} 6" fill="none" stroke="#D30135" stroke-width="4.5" stroke-linecap="round" style="filter:drop-shadow(0 2px 4px rgba(211,1,53,.35))"/></svg>`; x.draw(sv.querySelector('path'), t0, .9); }
  x.cue('cook', t0, .9);
}
VFX['liquid-glass-graph'] = { dur: 3.5, build(x, o) {
  const z = x.zone(), c = glassCard(x.front, 190, Math.max(z.top, z.bottom - 210), 340, 190); graphInto(x, c, o, x.s + .3);
  x.show(c, x.s, { dy: 18 }); x.hideAt(c, x.e);
  if (o.look === 'bento') { const tiles = [[40, o.donut || '29%::share'], [560, o.kpi || '672K::reach']];
    tiles.forEach(([l, v], i) => { const [n, s2] = String(v).split('::'), t2 = glassCard(x.front, l, Math.max(z.top, z.bottom - 150), 130, 120); t2.innerHTML = `<div class="serif" style="font-size:34px;color:var(--terra)">${esc(n)}</div><div class="caps">${esc(s2 || '')}</div>`; x.show(t2, x.s + .2 + i * .12, { dy: 14 }); x.hideAt(t2, x.e); }); }
} };

// 38 carousel-spin: your reels spin around you in a 3D carousel, then slow to a stop
VFX['carousel-spin'] = { mask: true, dur: 3.5, build(x, o) {
  const n = +(o.count ?? 8), sz = +(o.size ?? 130), turns = +(o.turns ?? 1.25);
  const items = Array.from({ length: n }, (_, i) => tile(x, i, sz, sz * 1.6, lab(x, i)));
  x.tick(t => { const f = x.face(t), u = EASE.out(clamp((t - x.s) / (x.e - x.s))), a0 = prog(t, x.s, .4), q = 1 - prog(t, x.e, .3, 'out');
    items.forEach((tl, i) => { const ang = (i / n) * Math.PI * 2 + u * turns * Math.PI * 2, depth = Math.cos(ang), px = f.cx + Math.sin(ang) * 300, py = f.cy - 40;
      (depth < 0 ? x.back : x.front).appendChild(tl); const sc = lerp(.62, 1.08, (depth + 1) / 2);
      tl.style.left = (px - sz / 2) + 'px'; tl.style.top = (py - sz * .8) + 'px'; tl.style.transform = `scale(${sc * lerp(.6, 1, a0)})`; tl.style.zIndex = Math.round(depth * 100) + 100;
      tl.style.opacity = Math.min(a0, q) * faceClear(px, py, depth, f, sz); }); });
  x.cue('woosh', x.s);
} };

// 39 match-cut: news pages cut on one word, locked in a crimson box behind your head
VFX['match-cut'] = { mask: true, dur: 2.5, build(x, o) {
  const word = o.text || 'Claude', f0 = x.face(x.s), W = 600, H = 360, L = 60, T = Math.max(100, f0.top - H + 40);
  const pages = Array.from({ length: 6 }, (_, i) => { const p = box(x.back, 'panel', L, T, W, H, 'border-radius:6px;padding:22px 26px;display:none');
    el('div', 'serif', p, esc(['The Daily', 'Tech Today', 'The Brief', 'Wired Up', 'Morning Post', 'Dev Weekly'][i])).style.cssText = 'font-size:26px;border-bottom:2px solid var(--ink);padding-bottom:6px;margin-bottom:12px';
    for (let k = 0; k < 6; k++) { const ln = el('div', '', p); ln.style.cssText = `height:10px;margin:12px 0;border-radius:4px;background:#E2DCCB;width:${60 + (k * 37 + i * 11) % 40}%`; }
    return p; });
  const bx = box(x.back, 'serif', L + W / 2, T + H / 2, null, null, `transform:translate(-50%,-50%);border:4px solid ${o.color || 'var(--accent)'};padding:2px 14px;font-size:54px;background:#FDFDF3;color:var(--ink);white-space:nowrap`); bx.textContent = word;
  x.tick(t => { const on = t >= x.s && t < x.e, k = Math.floor((t - x.s) / .14); pages.forEach((p, i) => { p.style.display = on && k % pages.length === i ? '' : 'none'; p.style.transform = `rotate(${((i * 17) % 6) - 3}deg)`; }); bx.style.display = on ? '' : 'none'; });
  for (let t = x.s; t < x.e; t += .28) x.cue('tick', t);
} };

// 40 apple-toggles: a settings card above you (tucked behind your head) flips its switches on
VFX['apple-toggles'] = { mask: true, dur: 4, build(x, o) {
  const rows = list(o.text).length ? list(o.text) : ['Auto captions', 'Silence cuts', 'B-roll'], ticks = list(o.ticks).map(Number), z = x.zone(), f0 = x.face(x.s), below = o.pos === 'below';
  const h = 30 + rows.length * 60, c = box(below ? x.front : x.back, 'panel', f0.cx - 220, below ? f0.chin + 20 : Math.max(z.top, f0.top - h + 50), 440, h, 'border-radius:22px;padding:14px 20px');
  rows.forEach((r, i) => { const rw = el('div', '', c); rw.style.cssText = `display:flex;align-items:center;height:60px;${i ? 'border-top:1px solid #E6E1CF;' : ''}font:500 21px 'DM Sans','Mukta'`;
    el('span', '', rw, esc(r)).style.flex = '1'; const tr = el('span', '', rw); tr.style.cssText = 'position:relative;width:58px;height:34px;border-radius:17px;background:#D9D5C6;display:block';
    const kn = el('span', '', tr); kn.style.cssText = 'position:absolute;top:3px;left:3px;width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25)';
    const tt = !isNaN(ticks[i]) ? ticks[i] : lerp(x.s + .6, x.e - .5, rows.length > 1 ? i / (rows.length - 1) : 0);
    x.tick(t => { const p = prog(t, tt, .25, 'inout'); kn.style.left = (3 + 24 * p) + 'px'; tr.style.background = p > .5 ? (o.color || 'var(--terra)') : '#D9D5C6'; }); x.cue('tick', tt); });
  x.show(c, x.s, { dy: 30 }); x.hideAt(c, x.e);
  if (+(o.zoom ?? 1.06) > 1) camPunch(x, +(o.zoom ?? 1.06), x.s, (x.e - x.s) * .8, .4);
} };

// 41 led-sign: the lights drop and a glowing LED sign types itself out behind you
VFX['led-sign'] = { mask: true, dur: 3.5, build(x, o) {
  x.grade(t => { const p = Math.min(prog(t, x.s, .4), 1 - prog(t, x.e, .35)); return p > 0 ? { frame: `brightness(${lerp(1, .3, p)}) saturate(${lerp(1, .7, p)})`, person: 'brightness(1)' } : null; });
  const lines = list(o.text).length ? list(o.text) : ['NOW', 'COOKING'], col = o.color || '#FF7A55', f0 = x.face(x.s);
  const g = box(x.back, 'mono', 0, Math.max(90, f0.top - 60 - lines.length * 100), 720, null, `text-align:center;font-size:96px;line-height:1.05;font-weight:500;color:${col};letter-spacing:.06em;text-shadow:0 0 12px ${col},0 0 40px ${col};` +
    '-webkit-mask:radial-gradient(circle,#000 2.2px,transparent 2.6px) 0 0/7px 7px;mask:radial-gradient(circle,#000 2.2px,transparent 2.6px) 0 0/7px 7px;');
  const spans = lines.map(() => el('div', '', g)); let t0 = x.s + .4;
  lines.forEach((l, i) => { t0 = x.type(spans[i], l, t0, { cps: 9, caret: false }) + .1; });
  x.tick(t => { g.style.opacity = 1 - prog(t, x.e, .35); });
  if (+(o.push ?? 1.08) > 1) camPunch(x, +(o.push ?? 1.08), x.s, (x.e - x.s) * .9, .3);
} };

// 42 slow-push: a slow cinematic push-in while the room melts out of focus
VFX['slow-push'] = { mask: true, dur: 4, build(x, o) {
  const z = Math.min(2, +(o.zoom ?? 1.6)), bl = +(o.blur ?? 10);
  x.cam(t => { if (t < x.s || t > x.e + .6) return null; const p = EASE.inout(clamp((t - x.s) / (x.e - x.s))) * (1 - prog(t, x.e, .5, 'smooth')); const f = x.face(t); return { z: 1 + (z - 1) * p, px: f.cx, py: f.cy }; });
  x.grade(t => { if (t < x.s || t > x.e + .6) return null; const p = clamp((t - x.s) / (x.e - x.s)) * (1 - prog(t, x.e, .5)); return { frame: `blur(${bl * p}px)`, person: '' }; });
} };

// 43 over-the-shoulder-zoom: the camera pushes into one top corner (a glass line graph pops), then the other (a bar graph)
VFX['over-the-shoulder-zoom'] = { dur: 5, build(x, o) {
  const z = Math.min(2, +(o.zoom ?? 2)), mid = (x.s + x.e) / 2, labels = list(o.text), tos = list(o.to);
  const seg = (a, b, px) => x.cam(t => { if (t < a || t > b) return null; const p = prog(t, a, .5, 'smooth') * (1 - prog(t, b - .5, .5, 'smooth')); return { z: 1 + (z - 1) * p, px, py: 300 }; });
  seg(x.s, mid, 120); seg(mid, x.e, 600);
  const c1 = glassCard(x.front, 300, 160, 340, 200), c2 = glassCard(x.front, 80, 160, 340, 220);
  graphInto(x, c1, { text: labels[0] || 'Views', to: tos[0] || '197K' }, x.s + .55); graphInto(x, c2, { text: labels[1] || 'Followers', to: tos[1] || '672K' }, mid + .55, 300, true);
  x.show(c1, x.s + .4, { dy: 18 }); x.hideAt(c1, mid - .3); x.show(c2, mid + .4, { dy: 18 }); x.hideAt(c2, x.e - .3);
  x.cue('woosh', x.s); x.cue('woosh', mid);
} };

// 44 messages: message notifications pop in one after another, stacking up
VFX.messages = { dur: 4, build(x, o) {
  const msgs = list(o.text).length ? list(o.text) : ['Hey! Saw your reel', 'How did you make this?', 'Send the link pls'], z = x.zone(), n = msgs.length, step = Math.min(.9, (x.e - x.s - .6) / n), CH = 92;
  const cards = msgs.map((m, i) => { const c = box(x.front, '', 70, 0, 580, 80, 'border-radius:22px;padding:12px 16px;display:flex;gap:12px;align-items:center;background:rgba(253,251,243,.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.7);box-shadow:0 10px 26px rgba(40,25,10,.22)');
    c.innerHTML = `<span style="width:46px;height:46px;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center;flex:none">${ico('message-circle', 24, '#fff', 2.2)}</span><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between"><b class="sans" style="font-size:16px">${esc(o.title || 'Messages')}</b><span class="sans" style="font-size:13px;color:#8A8070">now</span></div><div class="sans" style="font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m)}</div></div>`;
    return c; });
  const y0 = o.y != null ? +o.y * 1280 : z.top;
  x.tick(t => { const shown = cards.filter((_, j) => t >= x.s + .2 + j * step).length;
    cards.forEach((c, i) => { const t0 = x.s + .2 + i * step, p = prog(t, t0, .4, 'quint'), slot = shown - 1 - i;   // newest on top, older ones slide down
      c.style.top = (y0 + Math.max(0, slot) * CH) + 'px'; c.style.transition = 'none';
      c.style.opacity = Math.min(p, 1 - prog(t, x.e, .3)); c.style.transform = `translateY(${(1 - p) * -20}px) scale(${lerp(.94, 1, p)})`; c.style.visibility = t >= t0 ? 'visible' : 'hidden'; }); });
  msgs.forEach((_, i) => x.cue('notify', x.s + .2 + i * step));
} };

// 45 place-in-grid: you shrink into the centre tile of your 3x3 grid on frosted paper; 8 reels pop in with view counts
VFX['place-in-grid'] = { dur: 4, build(x, o) {
  const host = box(x.front, '', 0, 0, 720, 1280, 'background:var(--paper)'); fwin(x, host, .25, .3);
  const views = list(o.views).length ? list(o.views) : ['12K', '48K', '9.1K', '201K', '33K', '7.4K', '88K', '15K', '1.2M'];
  const tw = 210, th = 300, gx = 360 - tw * 1.5 - 8, gy = 640 - th * 1.5 - 8;
  const cell = i => [gx + (i % 3) * (tw + 8), gy + Math.floor(i / 3) * (th + 8)];
  const order = [0, 1, 2, 3, 5, 6, 7, 8];
  order.forEach((k, j) => { const [l, tp] = cell(k), tl = tile(x, j, tw, th, lab(x, j)); host.appendChild(tl); tl.style.left = l + 'px'; tl.style.top = tp + 'px';
    const v = box(tl, 'mono', 10, th - 34, null, null, 'display:flex;gap:6px;align-items:center;color:#fff;font-size:15px;text-shadow:0 1px 3px rgba(0,0,0,.6)'); v.innerHTML = `${ico('eye', 16, '#fff', 2)}${esc(views[j])}`;
    const t0 = x.s + .55 + j / 30; tl.style.opacity = 0; x.tick(t => { const p = prog(t, t0, .25, 'quint'); tl.style.opacity = p; tl.style.transform = `scale(${lerp(.8, 1, p)})`; }); });
  const me = box(host, '', 0, 0, 720, 1280, 'overflow:hidden;transform-origin:0 0'); const c = x.copy(me);
  const mv = box(me, 'mono', 0, 0, null, null, 'display:flex;gap:6px;align-items:center;color:#fff;font-size:30px;text-shadow:0 1px 3px rgba(0,0,0,.6)'); mv.innerHTML = `${ico('eye', 30, '#fff', 2)}${esc(views[8])}`;
  const [cl, ct] = cell(4);
  x.tick(t => { const p = prog(t, x.s, .55, 'smooth') * (1 - prog(t, x.e - .5, .5, 'smooth')), sc = lerp(1, tw / 720, p);
    me.style.transform = `translate(${lerp(0, cl, p)}px,${lerp(0, ct - (1280 * sc - th) / 2, p)}px) scale(${sc})`; me.style.clipPath = `inset(${lerp(0, (1280 - th / sc) / 2, p)}px 0 ${lerp(0, (1280 - th / sc) / 2, p)}px 0 round ${lerp(0, 22 / sc, p)}px)`;
    c.style.transform = COOK.camCss(); mv.style.left = '20px'; mv.style.top = (1280 / 2 + th / sc / 2 - 60) + 'px'; mv.style.opacity = p; });
  x.cue('woosh', x.s); order.forEach((_, j) => j % 3 === 0 && x.cue('pop', x.s + .55 + j / 30));
} };

window.VFX = VFX; window.VFX_ALIAS = VFX_ALIAS;
