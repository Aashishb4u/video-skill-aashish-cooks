// social-feed: an upright feed of posts. Every few seconds a new post pops out of the screen on top,
// the feed scrolls down, and the new post's heart pops. The pointer lifts the post under it.
// For Twitter / X, threads, "posting", going viral, a social app.
CF.add('social-feed', {
  label: 'a social feed of posts',
  aliases: ['twitter', 'x', 'x-feed', 'tweet', 'tweets', 'social', 'social-post', 'threads', 'feed'],
  box: [[0, -92, 0], [16, 0, 150]],
  make(K) {
    const W = 92, H = 150, PH = 38, GAP = 7, TOP = H - 12 - PH, A = 'x';
    const frame = K.plate(K.rr(0, 0, W, H, 12), 1.8, null, A);
    const screen = K.face(K.rr(4, 4, W - 4, H - 4, 9), 'nf lo', null, A);
    const notch = K.line('nf');
    const heart = (cx, cy, s) => {
      const pts = [];
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, x = 16 * Math.pow(Math.sin(a), 3), y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); pts.push([cx + x * s / 16, cy + y * s / 16]); }
      return K.shape(pts);
    };
    const posts = [0, 1, 2, 3].map(() => {
      const g = K.g();
      return {
        g, plate: K.plate(K.rr(8, 0, W - 8, PH, 6), 1.1, g, A),
        avatar: K.face(K.circle(0, 0, 5.2, 24), 'soft', g, A),
        name: K.line('nf hi', g), l1: K.line('nf', g), l2: K.line('nf', g),
        heart: K.face(heart(0, 0, 5), 'nf hi', g, A),
      };
    });
    const CYCLE = 2.6;
    return (t, p) => {
      const amt = .4 + .6 * K.amt;
      frame.at(0, 3.2);
      screen.at(3.2);
      notch.set([K.on(A, W / 2 - 10, H - 7, 3.2), K.on(A, W / 2 + 10, H - 7, 3.2)]);
      const k = Math.floor(t / CYCLE), ph = K.ease(K.win(t - k * CYCLE, 0, .75));
      posts.forEach((Q, i) => {
        const idx = ((i - k) % 4 + 4) % 4;            // 0 = the post arriving this cycle
        const slot = idx - 1 + ph;                    // -1 (arriving) .. 2 (bottom)
        const v = TOP - Math.max(0, slot) * (PH + GAP);
        let a = 1, out = 0;
        if (slot < 0) { a = K.clamp(1 + slot * 1.4, 0, 1); out = -slot * 22 * amt; }   // pops out of the screen
        if (slot > 2) a = K.clamp(3 - slot, 0, 1) * .9;
        if (v < 8) a = Math.min(a, K.clamp((v + PH * .2) / (PH * .6), 0, 1));        // slides out at the bottom
        const hov = Q.plate.hit(p) ? 1 : 0, lift = K.follow('h' + i, hov, 12);
        const h0 = 3.2 + out, h1 = h0 + 2.4 + lift * 6 * amt;
        Q.g.style.opacity = a; Q.g.style.display = a > .02 ? '' : 'none';
        Q.plate.at(h0, h1, 0, v).lit(lift > .5 || (slot > -.6 && slot < .4));
        Q.avatar.ring = K.circle(17, v + PH - 10, 5.2, 24); Q.avatar.at(h1);
        Q.name.set([K.on(A, 26, v + PH - 9, h1), K.on(A, 52, v + PH - 9, h1)]);
        Q.l1.set([K.on(A, 15, v + PH - 21, h1), K.on(A, W - 15, v + PH - 21, h1)]);
        Q.l2.set([K.on(A, 15, v + PH - 29, h1), K.on(A, W - 38, v + PH - 29, h1)]);
        const pop = idx === 1 ? K.win(t - k * CYCLE, .8, .35) : (idx > 1 ? 1 : 0);
        const sc = 1 + Math.sin(K.clamp(pop, 0, 1) * Math.PI) * .7 * amt;
        Q.heart.ring = heart(W - 19, v + 9, 5 * sc);
        Q.heart.at(h1).cls(pop > .5 ? 'accent' : 'nf hi');
      });
    };
  },
});
