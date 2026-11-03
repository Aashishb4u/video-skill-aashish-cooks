// Card content templates. Each one is drawn at a natural size (w x h) and the engine scales it
// to fit the card (588x268) or the full screen (624x560). `ideal` is the screen time (s) its
// default choreography is paced for; shorter or longer windows speed it up or slow it down.
'use strict';
const TPL = {};
const at = (e, x, y, w, h) => { e.style.position = 'absolute'; e.style.left = x + 'px'; e.style.top = y + 'px'; if (w != null) e.style.width = w + 'px'; if (h != null) e.style.height = h + 'px'; return e; };
const prefixSplit = s => { const m = String(s).match(/^(\/[a-z0-9]+-)(.*)$/i); return m ? `<span class="brick">${esc(m[1])}</span>${esc(m[2])}` : esc(s); };

// ---------- headline: serif line that types in, with an italic accent line ----------
TPL['headline'] = {
  w: 600, h: 200, ideal: 1.6, status: '',
  build(r, o, x) {
    const a = at(el('div', 'serif', r), 0, 30, 600); a.style.cssText += 'font-size:44px;line-height:1.15;text-align:center;font-weight:450;';
    const end = x.typeWords(a, o.text || o.title || 'Your headline here', x.at(0));
    if (o.accent) { const b = at(el('div', 'serif brick', r), 0, 88, 600); b.style.cssText += 'font-size:44px;font-style:italic;text-align:center;'; x.typeWords(b, o.accent, end + .05); }
  },
};

// ---------- repo-card: repo name types, chips pop, price panel lands ----------
TPL['repo-card'] = {
  w: 588, h: 268, ideal: 1.6, status: 'open-source',
  build(r, o, x) {
    const nm = at(el('div', 'mono', r), 0, 20, 330); nm.style.cssText += 'display:flex;align-items:center;gap:8px;font-size:21px;font-weight:500;white-space:nowrap;';
    el('span', '', nm, ICON.book); const nt = el('span', '', nm);
    const tEnd = x.type(nt, o.name || 'my-skill', x.at(0), { cps: 34, hold: .2 });
    const pub = el('span', 'pill', nm, esc(o.visibility || 'Public')); pub.style.cssText += 'height:22px;font-size:11px;margin-left:6px;';
    x.show(pub, tEnd);
    const d = at(el('div', 'sans', r, esc(o.desc || 'Eleven Claude skills that run a YouTube channel.')), 0, 62, 330); d.style.cssText += 'font-size:17px;line-height:1.45;color:#3F3726;';
    x.show(d, x.at(.25), { dy: 6 });
    const chips = at(el('div', '', r), 0, 140, 340); chips.style.cssText += 'display:flex;gap:8px;flex-wrap:wrap;';
    list(o.chips ?? 'MIT License|Open source|11 skills').forEach((c, i) => { const p = el('span', 'pill' + (i === 1 ? ' blush' : ''), chips, esc(c)); p.style.cssText += 'height:30px;font-size:14px;'; x.show(p, x.at(.4 + i * .08)); });
    const u = at(el('div', 'mono', r, esc(o.url || 'github.com/···/' + (o.name || 'my-skill'))), 0, 200, 340); u.style.cssText += 'font-size:12.5px;color:#6E6656;';
    x.show(u, x.at(.65));
    const pan = at(el('div', 'panel', r), 352, 0, 236, 268);
    const pr = at(el('div', 'caps', pan, esc(o.price_title || 'Price')), 22, 22);
    const big = at(el('div', 'serif', pan, esc(o.price ?? '₹0')), 18, 50); big.style.cssText += 'font-size:92px;line-height:1;font-weight:500;letter-spacing:-.02em;';
    const it = at(el('div', 'serif brick', pan, esc(o.price_label || 'free to use')), 22, 172); it.style.cssText += 'font-size:27px;font-style:italic;';
    const nt2 = at(el('div', 'sans', pan, esc(o.price_note || 'No signup · No API key')), 22, 220); nt2.style.cssText += 'font-size:13px;color:#3F3726;';
    x.show(pan, x.at(.2), { dy: 10 });
    x.show(pr, x.at(.35)); x.show(big, x.time(o.price_at, .55), { blur: 14, scale: 1.08, dur: .3 }); x.cue('money', x.time(o.price_at, .55));
    x.show(it, x.time(o.price_at, .55) + .25 * x.k); x.show(nt2, x.time(o.price_at, .55) + .35 * x.k);
  },
};

// ---------- connect: logo A ~ squiggle ~ logo B, with a tick ----------
TPL['connect'] = {
  w: 600, h: 560, ideal: 2.0, status: 'connected', maxFull: 1.0,
  build(r, o, x) {
    const A = o.a || 'Claude', B = o.b || 'YouTube';
    if (o.title) { const h = at(el('div', 'serif', r), 0, 40, 600); h.style.cssText += 'font-size:38px;text-align:center;'; x.typeWords(h, o.title, x.at(1.3)); }
    const mk = (src, label, cx, color, t) => {
      const w = at(el('div', '', r), cx - 60, 190, 120, 170); w.style.cssText += 'display:flex;flex-direction:column;align-items:center;gap:18px;';
      w.appendChild(x.logo(src, label, 104, color));
      const l = el('div', 'serif', w, esc(label)); l.style.cssText += 'font-size:30px;';
      x.show(w, t, { scale: .7, blur: 10, dur: .3 });
    };
    mk(o.a_logo, A, 150, 'var(--terra)', x.at(0));
    mk(o.b_logo, B, 450, 'var(--accent)', x.at(.45));
    const svg = at(el('div', '', r), 215, 222, 170, 40);
    svg.innerHTML = `<svg width="170" height="40" viewBox="0 0 170 40"><path d="M4 22 C 30 2, 48 2, 70 20 S 110 40, 132 20 S 158 8, 166 18" fill="none" stroke="#C0544A" stroke-width="3.2" stroke-linecap="round"/></svg>`;
    x.draw(svg.querySelector('path'), x.at(.85), .5 * x.k);
    const ok = at(el('div', 'badge', r), 289, 216, 22, 22); ok.innerHTML = ICON.check; x.show(ok, x.at(1.25), { scale: .4, dur: .25 }); x.cue('tick-last', x.at(1.25));
  },
};

// ---------- orbit-ring: headline, chips around a ring that draws and ticks, toggle flips ON ----------
TPL['orbit-ring'] = {
  w: 600, h: 600, ideal: 2.4, status: 'connected', maxFull: 1.0,
  build(r, o, x) {
    const h1 = at(el('div', 'serif', r), 0, 0, 600); h1.style.cssText += 'font-size:38px;text-align:center;font-weight:450;line-height:1.15;';
    const e1 = x.typeWords(h1, o.title || 'Your whole YouTube channel,', x.at(0), { gap: .07 });
    if (o.accent !== '') { const h2 = at(el('div', 'serif brick', r), 0, 46, 600); h2.style.cssText += 'font-size:38px;font-style:italic;text-align:center;'; x.typeWords(h2, o.accent || 'end-to-end.', e1); }
    const items = list(o.items ?? 'Ideas|Scripts|Thumbnails|Editing|Upload|Comments|Analytics');
    const cx = 300, cy = 345, R = 196, n = items.length;
    const ring = at(el('div', '', r), cx - R - 6, cy - R - 6, 2 * R + 12, 2 * R + 12);
    ring.innerHTML = `<svg width="${2 * R + 12}" height="${2 * R + 12}"><path d="M ${R + 6} 6 A ${R} ${R} 0 1 1 ${R + 5.99} 6" fill="none" stroke="var(--accent)" stroke-width="4" style="filter:drop-shadow(0 0 4px rgba(211,1,53,.35))"/></svg>`;
    const tRing = x.at(1.05), dRing = .7 * x.k;
    x.draw(ring.querySelector('path'), tRing, dRing, 'inout'); x.cue('cook', tRing, dRing);
    items.forEach((it, i) => {
      const ang = -Math.PI / 2 + (2 * Math.PI * i) / n, px = cx + R * Math.cos(ang), py = cy + R * Math.sin(ang);
      const [lab, icn] = splitIcon(it);
      const c = el('div', 'chip', r, `<span style="width:26px;height:26px;border-radius:8px;background:var(--blush);display:flex;align-items:center;justify-content:center">${ico(iconFor(lab, icn), 15, 'var(--brick)', 2.2)}</span>${esc(lab)}`);
      c.style.position = 'absolute'; c.style.left = px + 'px'; c.style.top = py + 'px'; c.style.fontSize = '17px'; c.style.height = '40px';
      x.show(c, x.at(.45 + i * .07), { base: 'translate(-50%,-50%)', scale: .85 });
      const b = el('div', 'badge', c); b.innerHTML = ICON.check; b.style.right = '-8px'; b.style.top = '-9px';
      x.show(b, tRing + dRing * EASE.inout(i / n) * .98 + .05, { scale: .3, dur: .2 });
    });
    // centre: two small logos joined by a squiggle
    if (o.center != null && o.center !== '' && o.a == null) { // a word or icon in the middle instead of two logos
      const [ct, ci] = splitIcon(o.center);
      const mid = at(el('div', '', r), cx - 140, cy - 46, 280, 60); mid.style.cssText += 'display:flex;align-items:center;justify-content:center;gap:10px;font:500 30px Newsreader,"Tiro Devanagari Marathi",serif;';
      if (ci) mid.insertAdjacentHTML('beforeend', ico(ci, 30, 'var(--terra)', 2));
      el('span', '', mid, esc(ct)); x.show(mid, x.at(.3), { scale: .85 });
    } else if (o.center !== '') {
      const mid = at(el('div', '', r), cx - 90, cy - 40, 180, 50); mid.style.cssText += 'display:flex;align-items:center;justify-content:space-between;';
      mid.appendChild(x.logo(o.a_logo, o.a || 'Claude', 44, 'var(--terra)'));
      el('div', '', mid, `<svg width="60" height="20"><path d="M2 12 C 14 0, 22 0, 30 10 S 46 20, 58 8" fill="none" stroke="#C0544A" stroke-width="2.6" stroke-linecap="round"/></svg>`);
      mid.appendChild(x.logo(o.b_logo, o.b || 'YouTube', 44, 'var(--accent)'));
      x.show(mid, x.at(.3), { scale: .8 });
    }
    // toggle
    if (o.toggle === '') return;
    const tg = at(el('div', '', r), cx - 90, cy + 40, 180, 34); tg.style.cssText += 'display:flex;align-items:center;gap:12px;justify-content:center;font:600 18px DM Sans;';
    el('span', '', tg, esc(o.toggle || 'Autopilot'));
    const track = el('span', '', tg); track.style.cssText = 'position:relative;width:52px;height:28px;border-radius:14px;background:#D9D5C6;display:block;';
    const knob = el('span', '', track); knob.style.cssText = 'position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);';
    const on = el('span', '', tg, 'ON'); on.style.cssText = 'color:var(--brick);font-size:15px;letter-spacing:.06em;';
    x.show(tg, x.at(.6));
    const tOn = x.time(o.toggle_at, 1.85); x.cue('tick', tOn);
    x.tick(t => { const p = prog(t, tOn, .22, 'inout'); knob.style.left = (3 + 24 * p) + 'px'; track.style.background = p > .5 ? 'var(--terra)' : '#D9D5C6'; on.style.opacity = p; });
  },
};

// ---------- counter-grid: serif title types, big number counts with chips popping into a grid ----------
TPL['counter-grid'] = {
  w: 588, h: 268, ideal: 2.6, status: 'skills',
  build(r, o, x) {
    const items = list(o.items ?? '/yt-script|/yt-package|/yt-edit|/yt-comment|/yt-plan|/yt-viral|/yt-retention|/yt-shorts|/yt-seo|/yt-chapters|/yt-audit');
    if (o.path) { const p = at(el('div', 'mono', r), 2, 0, 400); p.style.cssText += 'font-size:12.5px;color:#6E6656;'; x.type(p, o.path, x.at(0), { cps: 40, caret: false }); }
    const ti = at(el('div', 'serif', r), 0, 19, 430); ti.style.cssText += 'font-size:40px;font-weight:500;letter-spacing:-.01em;white-space:nowrap;';
    x.typeWords(ti, o.title || 'Your Skill', x.at(.25), { gap: .14 });
    const num = at(el('div', 'serif', r), 430, 0, 158); num.style.cssText += 'font-size:64px;line-height:1;text-align:right;color:var(--terra);font-weight:500;';
    const lab = at(el('div', 'sans', r, esc(o.label || 'agent skills')), 388, 74, 200); lab.style.cssText += 'font-size:14px;text-align:right;font-weight:500;';
    const ticks = list(o.ticks).map(Number);
    const t1 = x.at(.75), t2 = Math.max(t1 + .3, x.end - .45);
    const times = items.map((_, i) => ticks[i] != null && !isNaN(ticks[i]) ? ticks[i] : lerp(t1, t2, items.length > 1 ? i / (items.length - 1) : 0));
    const cols = 4, cw = 140, ch = 46;
    items.forEach((it, i) => {
      const c = at(el('div', 'chip mono', r, prefixSplit(it)), (i % cols) * (cw + 9), 104 + Math.floor(i / cols) * (ch + 8), cw); c.style.cssText += 'font-size:15px;justify-content:flex-start;';
      x.show(c, times[i], { scale: .85, dy: 6 });
    });
    num.style.height = '66px'; x.show(lab, times[0]);
    const total = o.total != null ? +o.total : items.length;
    x.roll(num, times.map((tt, i) => [tt, String(i === items.length - 1 ? total : i + 1)]));
  },
};

// ---------- chat-install: Claude-style chat box, link pastes, prompt types, installs ----------
TPL['chat-install'] = {
  w: 588, h: 268, ideal: 5.0, status: 'install',
  build(r, o, x) {
    const steps = list(o.steps ?? 'Paste link|Ask to install|Ready');
    const row = at(el('div', '', r), 0, 6, 588, 26); row.style.cssText += 'display:flex;align-items:center;gap:12px;font:500 14px DM Sans;color:var(--brick);';
    const dots = steps.map((s, i) => {
      if (i) { const ln = el('span', '', row); ln.style.cssText = 'flex:1;height:1px;background:#D8CFC0;max-width:70px'; }
      const w = el('span', '', row); w.style.cssText = 'display:flex;align-items:center;gap:8px;white-space:nowrap';
      const d = el('span', '', w, String(i + 1)); d.style.cssText = 'width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 11px DM Sans;background:var(--blush);color:var(--brick)';
      el('span', '', w, esc(s)); return d;
    });
    const box = at(el('div', 'panel', r), 0, 46, 588, 136); box.style.cssText += 'border-radius:16px;';
    const ph = at(el('div', 'sans', box, esc(o.placeholder || 'How can I help you today?')), 22, 20); ph.style.cssText += 'font-size:16px;color:#7A7262;';
    const line = at(el('div', '', box), 20, 16, 548, 34); line.style.cssText += 'display:flex;align-items:center;gap:10px;';
    const chip = el('span', 'mono', line); chip.style.cssText = 'display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 12px;border-radius:9px;background:#F1ECDF;border:1px solid #E3DCCB;font-size:13.5px;white-space:nowrap';
    chip.innerHTML = ICON.link + esc(o.link || 'github.com/···/my-skill');
    const typed = el('span', 'sans', line); typed.style.cssText = 'font-size:18px;white-space:nowrap';
    const plus = at(el('div', '', box), 18, 88, 30, 30); plus.style.cssText += 'border:1px solid #DDD5C4;border-radius:8px;display:flex;align-items:center;justify-content:center;'; plus.innerHTML = ICON.plus;
    const send = at(el('div', '', box), 534, 86, 34, 34); send.style.cssText += 'border-radius:9px;display:flex;align-items:center;justify-content:center;background:#E9C9BE;'; send.innerHTML = ICON.up;
    const stat = at(el('div', 'sans', r), 4, 200, 584, 30); stat.style.cssText += 'display:flex;align-items:center;gap:10px;font-size:16px;font-weight:600;';
    const sp = el('span', '', stat, ico('loader-circle', 18, 'var(--terra)', 2.4)); const ok = el('span', 'badge', stat, ICON.check); ok.style.position = 'relative'; ok.style.background = 'var(--terra)';
    const msg = el('span', '', stat);
    const tLink = x.time(o.link_at, .5), tType = x.time(o.type_at, 1.4), tSend = x.time(o.send_at, 2.6), tDone = x.time(o.done_at, 3.9);
    x.show(chip, tLink, { scale: .9 });
    x.type(typed, o.prompt || 'install this skill', tType, { cps: 16, hold: 99 });
    x.cue('tick', tSend); x.cue('cook', tSend + .15, tDone - tSend - .15); x.cue('tick-last', tDone);
    x.tick(t => {
      ph.style.opacity = t < tLink ? 1 : 0; line.style.opacity = t < tLink ? 0 : 1;
      const step = t >= tDone ? 2 : t >= tType ? 1 : t >= tLink ? 0 : -1;
      dots.forEach((d, i) => { const on = i <= step; d.style.background = on ? 'var(--terra)' : 'var(--blush)'; d.style.color = on ? '#fff' : 'var(--brick)'; });
      const ready = t >= tSend; send.style.background = ready ? 'var(--terra)' : '#E9C9BE';
      send.style.transform = `scale(${t >= tSend && t < tSend + .12 ? .88 : 1})`;
      box.style.boxShadow = t >= tLink && t < tDone ? '0 0 0 3px rgba(204,99,80,.18), 0 6px 18px rgba(60,40,20,.10)' : '';
      const installing = t >= tSend + .15 && t < tDone, done = t >= tDone;
      stat.style.opacity = installing || done ? 1 : 0;
      sp.style.display = installing ? '' : 'none'; ok.style.display = done ? '' : 'none';
      sp.style.transform = `rotate(${t * 220}deg)`;
      if (installing) { msg.textContent = o.installing || `Installing ${(o.link || 'skill').split('/').pop()}…`; msg.style.cssText = `font-weight:500;color:#6E6656;background:linear-gradient(90deg,#6E6656 30%,#D9CFBF 50%,#6E6656 70%);background-size:300% 100%;-webkit-background-clip:text;color:transparent;background-position:${(1 - ((t * .9) % 1)) * 100}% 0`; }
      else if (done) { msg.textContent = o.done || 'Installed. Ready to use'; msg.style.cssText = 'font-weight:600;color:var(--ink)'; }
    });
  },
};

// ---------- dm-cta: link + guide chips, comment types and posts, a DM notification pops in ----------
TPL['dm-cta'] = {
  w: 588, h: 268, ideal: 2.2, status: 'link via DM',
  build(r, o, x) {
    const L = at(el('div', '', r), 0, 0, 236, 268);
    const cap = at(el('div', 'caps', L, esc(o.label || 'In your DMs')), 2, 0);
    const card = (y, ic, a, b, t) => { const c = at(el('div', 'panel', L), 0, y, 230, 58); c.style.cssText += 'border-radius:12px;display:flex;align-items:center;gap:10px;padding:0 12px;';
      const i = el('span', '', c, ic); i.style.cssText = 'width:30px;height:30px;border-radius:8px;background:var(--blush);display:flex;align-items:center;justify-content:center;flex:none';
      const tx = el('div', '', c); el('div', 'mono', tx, esc(a)).style.cssText = 'font-size:13.5px;font-weight:500;white-space:nowrap'; el('div', 'sans', tx, esc(b)).style.cssText = 'font-size:11px;color:#7A7262';
      x.show(c, t, { dy: 8 }); };
    card(22, ICON.link, o.link_title || 'my-skill', o.link_sub || 'github.com/···', x.at(0));
    card(90, ICON.doc, o.guide || 'Setup guide', o.guide_sub || 'Step-by-step install', x.at(.12));
    const cta = at(el('div', 'serif brick', L, esc(o.cta || 'Comment anything.')), 2, 170, 236); cta.style.cssText += 'font-size:27px;font-style:italic;';
    x.show(cta, x.at(.3));
    const R = at(el('div', '', r), 252, 0, 336, 268);
    const f = at(el('div', 'panel', R), 0, 18, 336, 48); f.style.cssText += 'border-radius:24px;display:flex;align-items:center;gap:10px;padding:0 8px 0 8px;';
    const av = el('span', '', f, esc((o.user || 'Y').charAt(0).toUpperCase())); av.style.cssText = 'width:30px;height:30px;border-radius:50%;background:#2F5D50;color:#fff;font:600 13px DM Sans;display:flex;align-items:center;justify-content:center;flex:none';
    const tx = el('span', 'sans', f); tx.style.cssText = 'flex:1;font-size:16px;white-space:nowrap';
    const post = el('span', 'sans', f, 'Post'); post.style.cssText = 'font-size:14px;font-weight:600;padding:0 10px';
    const heart = el('span', '', f, ICON.heart); heart.style.cssText = 'padding:0 8px;display:none';
    x.show(f, x.at(.15));
    const tC = x.time(o.comment_at, .45), tP = x.time(o.post_at, 1.0), tD = x.time(o.dm_at, 1.35);
    x.type(tx, o.comment || 'Link please!', tC, { cps: 18, hold: .15 });
    const sent = at(el('div', 'sans', R, esc(o.sent || 'DM on its way')), 14, 74); sent.style.cssText += 'font-size:12px;color:#7A7262;';
    x.tick(t => { const p = t >= tP; post.style.display = p ? 'none' : ''; heart.style.display = p ? '' : 'none'; post.style.color = t >= tC + .3 ? 'var(--ink)' : '#B4AC9C'; sent.style.opacity = prog(t, tP + .1, .2); });
    const dm = at(el('div', 'panel', R), 0, 104, 336, 112); dm.style.cssText += 'border-radius:16px;padding:14px 16px;box-shadow:0 12px 30px rgba(60,40,20,.18);';
    const top = el('div', '', dm); top.style.cssText = 'display:flex;align-items:center;gap:10px';
    const a2 = top.appendChild(x.logo(o.avatar, o.from || 'A', 32, '#3F3726')); a2.style.borderRadius = '50%';
    el('div', 'sans', top, `<b style="font-size:15px">${esc(o.dm_title || 'New message')}</b> <span style="font-size:12px;color:#8A8070">now</span><div style="font-size:13px;color:#3F3726">${esc(o.dm_text || 'Here is the link + setup guide')}</div>`);
    const lk = el('div', 'mono', dm, ICON.link + ' ' + esc(o.dm_link || o.link_sub || 'github.com/···')); lk.style.cssText = 'margin-top:10px;display:inline-flex;align-items:center;gap:6px;font-size:12.5px;background:#F1ECDF;border-radius:8px;padding:5px 10px';
    x.show(dm, tD, { dy: 16, scale: .92, dur: .28 }); x.cue('tick', tP); x.cue('notify', tD);
  },
};

// ---------- stat: one big number that counts or lands, an accent line, an icon tile, optional bar ----------
TPL['stat'] = {
  w: 588, h: 222, ideal: 2.0, status: '',
  build(r, o, x) {
    const lab = at(el('div', 'caps', r, esc(o.label || '')), 2, 0, 420); x.show(lab, x.at(0));
    const big = at(el('div', 'serif', r), 0, 22, 430); big.style.cssText += 'font-size:84px;line-height:1;font-weight:500;letter-spacing:-.02em;white-space:nowrap;';
    const tNum = x.time(o.value_at, .15);
    if (o.to != null && !isNaN(parseFloat(o.to))) {
      const to = parseFloat(o.to), from = parseFloat(o.from ?? 0), dec = (String(o.to).split('.')[1] || '').length;
      const n = el('span', '', big); el('span', 'unit', big, esc(o.unit ? ' ' + o.unit : '')).style.cssText = 'font-size:40px;color:var(--brick);font-style:italic';
      x.count(n, from, to, tNum, (o.count_dur ?? .9) * x.k, v => v.toFixed(dec)); x.show(big, tNum - .05, { dy: 14 });
    } else { big.textContent = o.value ?? ''; x.show(big, tNum, { dy: 16, blur: 12, scale: 1.04 }); }
    if (/[₹$€£]|\brs\b|price|cost|free/i.test(String(o.value ?? '') + ' ' + (o.icon || ''))) x.cue('money', tNum);
    let y = 116;
    if (o.accent) { const a = at(el('div', 'serif brick', r, esc(o.accent)), 0, y, 440); a.style.cssText += 'font-size:30px;font-style:italic;line-height:1.15;'; x.show(a, x.at(.55), { dy: 10 }); y += 46; }
    if (o.note) { const n = at(el('div', 'sans', r, esc(o.note)), 2, y, 430); n.style.cssText += 'font-size:16px;color:#3F3726;line-height:1.35;'; x.show(n, x.at(.75), { dy: 8 }); }
    if (o.icon !== '') {
      const tile = at(el('div', '', r), 460, 10, 128, 128); tile.style.cssText += 'border-radius:28px;background:var(--blush);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(149,73,63,.10)';
      tile.innerHTML = ico(o.icon || 'sparkles', 60, 'var(--brick)', 1.8); x.show(tile, x.at(.1), { scale: .85, dy: 6 });
    }
    if (o.bar != null) {
      const tr = at(el('div', '', r), 460, 160, 128, 8); tr.style.cssText += 'border-radius:4px;background:var(--track);overflow:hidden';
      const fl = el('div', '', tr); fl.style.cssText = 'height:100%;width:0;background:var(--accent);border-radius:4px';
      const tb = x.time(o.bar_at, .5); x.show(tr, tb - .1, { dy: 0 });
      x.tick(t => { fl.style.width = (clamp(+o.bar) * 100 * prog(t, tb, .9, 'quint')) + '%'; });
      if (o.bar_label) { const bl = at(el('div', 'sans', r, esc(o.bar_label)), 460, 176, 128); bl.style.cssText += 'font-size:12.5px;color:#6E6656;text-align:center'; x.show(bl, tb + .2); }
    }
  },
};

// ---------- compare: two rows that race. The short bar fills fast, the long one keeps going ----------
TPL['compare'] = {
  w: 588, h: 262, ideal: 2.6, status: 'compare', maxFull: 1.08,
  build(r, o, x) {
    let y = 0;
    if (o.title) { const h = at(el('div', 'serif', r), 0, 0, 588); h.style.cssText += 'font-size:34px;line-height:1.15;font-weight:450;'; x.typeWords(h, o.title, x.at(0)); y = 58; }
    const rows = [
      { label: o.a || 'A', value: o.a_value || '', n: +(o.a_n ?? 1), icon: o.a_icon || iconFor(o.a), color: 'var(--terra)', t: x.time(o.a_at, .35) },
      { label: o.b || 'B', value: o.b_value || '', n: +(o.b_n ?? 3), icon: o.b_icon || iconFor(o.b), color: 'var(--accent)', t: x.time(o.b_at, 1.0) },
    ];
    const maxN = Math.max(...rows.map(r => r.n), 1e-6);
    rows.forEach((rw, i) => {
      const top = y + i * 100;
      const row = at(el('div', '', r), 0, top, 588, 86);
      const tile = at(el('div', '', row), 0, 0, 52, 52); tile.style.cssText += 'border-radius:14px;background:var(--blush);display:flex;align-items:center;justify-content:center;';
      tile.innerHTML = ico(rw.icon, 26, 'var(--brick)', 2);
      const lb = at(el('div', 'serif', row, esc(rw.label)), 68, 2, 300); lb.style.cssText += 'font-size:30px;line-height:1.1;';
      const vl = at(el('div', 'sans', row), 300, 6, 288); vl.style.cssText += 'font-size:24px;font-weight:700;text-align:right;white-space:nowrap;';
      vl.textContent = rw.value;
      const tr = at(el('div', '', row), 68, 58, 520, 12); tr.style.cssText += 'border-radius:6px;background:var(--track);overflow:hidden;';
      const fl = el('div', '', tr); fl.style.cssText = `height:100%;width:0;border-radius:6px;background:${rw.color};`;
      x.show(row, rw.t - .25, { dy: 14 });
      x.show(vl, rw.t + (i ? 1.1 : .35) * x.k, { dy: 8, blur: 8 });
      const frac = rw.n / maxN, d = (i ? 1.4 : .45) * x.k;
      x.tick(t => { fl.style.width = (frac * 100 * prog(t, rw.t, d, i ? 'inout' : 'quint')) + '%'; });
    });
    if (o.note) { const n = at(el('div', 'serif brick', r, esc(o.note)), 0, y + 200, 588); n.style.cssText += 'font-size:24px;font-style:italic;'; x.show(n, x.at(2.2), { dy: 8 }); }
  },
};

// ---------- checklist: rows arrive, then each one ticks on its spoken word ----------
TPL['checklist'] = {
  w: 588, h: 260, ideal: 3.0, status: 'checklist',
  size(o) { const n = list(o.items).length || 3, F = o._full; return { w: 588, h: (o.title ? (F ? 84 : 56) : 0) + n * (F ? 86 : 54) - 6 }; },
  build(r, o, x) {
    const items = list(o.items ?? 'Item one|Item two|Item three');
    const F = !!o._full, RH = F ? 86 : 54;
    let y = 0;
    if (o.title) { const h = at(el('div', 'serif', r), 0, 0, 588); h.style.cssText += `font-size:${F ? 48 : 32}px;line-height:1.1;font-weight:450;white-space:nowrap;`; x.typeWords(h, o.title, x.at(0)); y = F ? 84 : 56; }
    const ticks = list(o.ticks).map(Number);
    const t1 = x.at(.5), t2 = Math.max(t1 + .3, x.end - .5);
    items.forEach((it, i) => {
      const [lab, icn] = splitIcon(it);
      const tt = !isNaN(ticks[i]) && ticks[i] != null ? ticks[i] : lerp(t1, t2, items.length > 1 ? i / (items.length - 1) : 0);
      const row = at(el('div', 'panel', r), 0, y + i * RH, 588, RH - 6); row.style.cssText += `border-radius:${F ? 16 : 12}px;display:flex;align-items:center;gap:${F ? 18 : 14}px;padding:0 ${F ? 22 : 16}px;box-shadow:0 2px 8px rgba(60,40,20,.07);`;
      const box = el('span', '', row); box.style.cssText = `position:relative;width:${F ? 36 : 26}px;height:${F ? 36 : 26}px;border-radius:50%;border:2px solid #CFC6B4;flex:none;`;
      const fill = el('span', '', box, ICON.check); fill.style.cssText = 'position:absolute;inset:-2px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;opacity:0;';
      const tx = el('span', 'sans', row, esc(lab)); tx.style.cssText = `flex:1;font-size:${F ? 27 : 20}px;font-weight:500;white-space:nowrap;`;
      if (icn || o.icons !== false) row.insertAdjacentHTML('beforeend', ico(iconFor(lab, icn), F ? 28 : 20, '#8A8070', 2));
      x.show(row, x.at(.15 + i * .1), { dy: 14 });
      x.cue(i === items.length - 1 ? 'tick-last' : 'tick', tt);
      x.tick(t => { const p = prog(t, tt, .3, 'quint'); fill.style.opacity = p; fill.style.transform = `scale(${lerp(.4, 1, p)})`;
        row.style.background = p > .5 ? '#FFF7F2' : ''; tx.style.color = p > .5 ? 'var(--ink)' : '#3F3726'; });
    });
  },
};

// ---------- figure: a hairline isometric line figure (33 to choose from), with an optional text column ----------
TPL['figure'] = {
  w: 588, h: 268, ideal: 3.0, status: '',
  size(o) { return o._full ? { w: 588, h: 640 } : (o.title || o.text || o.label ? { w: 588, h: 268 } : { w: 335, h: 268 }); },
  build(r, o, x) {
    if (o._full) { // full screen: big figure on top, text centred under it
      const host = at(el('div', '', r), 24, 0, 540, 432);
      x.figure(host, o, x.t0 + .15);
      const col = at(el('div', '', r), 0, 446, 588, 194); col.style.cssText += 'display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;';
      if (o.title) { const h = el('div', 'serif', col); h.style.cssText = 'font-size:46px;line-height:1.1;font-weight:450;'; x.typeWords(h, o.title, x.at(.15)); }
      if (o.text) { const tx = el('div', 'sans', col, esc(o.text)); tx.style.cssText = 'font-size:21px;line-height:1.4;color:#3F3726;max-width:520px;'; x.show(tx, x.at(.5), { dy: 10 }); }
      if (o.label) { const lb = el('div', 'serif brick', col, esc(o.label)); lb.style.cssText = 'font-size:30px;font-style:italic;'; x.show(lb, x.at(.75), { dy: 8 }); }
      return;
    }
    const side = !!(o.title || o.text || o.label);
    const fw = 335, fh = 268;
    const host = at(el('div', '', r), 0, 0, fw, fh);
    x.figure(host, o, x.t0 + .15);
    if (!side) return;
    const col = at(el('div', '', r), fw + 12, 0, 588 - fw - 12, fh); col.style.cssText += 'display:flex;flex-direction:column;justify-content:center;gap:10px;';
    if (o.title) { const h = el('div', 'serif', col); h.style.cssText = 'font-size:32px;line-height:1.12;font-weight:450;'; x.typeWords(h, o.title, x.at(.15)); }
    if (o.text) { const tx = el('div', 'sans', col, esc(o.text)); tx.style.cssText = 'font-size:17px;line-height:1.4;color:#3F3726;'; x.show(tx, x.at(.5), { dy: 10 }); }
    if (o.label) { const lb = el('div', 'serif brick', col, esc(o.label)); lb.style.cssText = 'font-size:24px;font-style:italic;'; x.show(lb, x.at(.75), { dy: 8 }); }
  },
};

window.TPL = TPL;
