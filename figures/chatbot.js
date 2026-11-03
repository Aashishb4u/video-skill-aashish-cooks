// chatbot: an original friendly AI bot (not any company's mascot) with a chat bubble that types.
// Its eyes blink and follow the pointer, the antenna tip glows, the bubble shows typing dots and then
// a reply. For "Claude", ChatGPT, assistants, chatbots, "ask the AI". Use a brand's own logo only from a file.
CF.add('chatbot', {
  label: 'a friendly AI bot chatting',
  aliases: ['claude-bot', 'ai-bot', 'bot', 'assistant', 'ai-assistant', 'chat-bot', 'gpt-bot'],
  box: [[-26, -50, 0], [96, 20, 66]],
  make(K) {
    const body = K.plate(K.rr(-15, -11, 15, 11, 7), 1.2);
    const neck = K.plate(K.circle(0, 0, 5, 24), .6);
    const head = K.plate(K.rr(-22, -16, 22, 16, 10), 1.6);
    const visor = K.line('ink'), eyes = [K.line('pl'), K.line('pl')], mouth = K.line('nf hi');
    const stem = K.line('nf'), tip = K.dot(3.2, 'accent');
    const bubble = K.plate(K.shape([[30, -46], [92, -46], [96, -42], [96, -14], [92, -10], [44, -10], [34, -2], [36, -10], [30, -10], [26, -14], [26, -42]]), 1);
    const dots = [0, 1, 2].map(() => K.dot(2.4, 'ink'));
    const lines = [K.line('nf hi'), K.line('nf'), K.line('nf')];
    // a closed loop on the head's front face (plane y = 16), in (x, z)
    const loop = (cx, cz, rx, rz, n = 20) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [cx + rx * Math.cos(a), 16.05, cz + rz * Math.sin(a)]; });
    const rrLoop = (x0, z0, x1, z1, r) => { const out = []; for (const [cx, cz, a0] of [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, 90], [x0 + r, z0 + r, 180], [x1 - r, z0 + r, 270]]) for (let k = 0; k <= 5; k++) { const a = (a0 + 90 * k / 5) * Math.PI / 180; out.push([cx + r * Math.cos(a), 16.05, cz + r * Math.sin(a)]); } return out; };
    const LOOP = 4.2;
    return (t, p) => {
      const amt = .4 + .6 * K.amt;
      const bob = Math.sin(t * 2) * 1.2 * amt, look = p ? K.clamp((p[0] - .4) * 2, -1, 1) : Math.sin(t * .9) * .5;
      const lk = K.follow('look', look, 6);
      body.at(0, 18);
      neck.at(18, 22);
      const z0 = 22 + bob, z1 = 52 + bob;
      head.at(z0, z1).lit(true);
      visor.set(rrLoop(-16, z0 + 8, 16, z0 + 24, 6), true);
      // blink: eyes squash for a moment every few seconds
      const bl = K.pulse(t + .3, 3.1, .06), ez = z0 + 16;
      eyes.forEach((e, i) => e.set(loop((i ? 6 : -6) + lk * 3, ez, 2.8, 3.6 * (1 - .85 * bl)), true).cls('pl'));
      mouth.set([[-4 + lk * 2, 16.05, z0 + 11], [4 + lk * 2, 16.05, z0 + 11]]);
      stem.set([[0, 0, z1], [0, 0, z1 + 9]]);
      tip.at(0, 0, z1 + 10, 1 + .5 * K.pulse(t, 1.2, .4) * amt);
      // bubble: typing dots, then the reply lines draw on
      const ph = (t % LOOP), typing = ph < 1.8;
      const zb = 44 + Math.sin(t * 1.6 + 1) * 1.5 * amt;
      bubble.at(zb - 2.5, zb).lit(!typing);
      dots.forEach((d, i) => d.at(52 + i * 8, -28, zb + (typing ? Math.max(0, Math.sin((ph * 6 - i * .9))) * 2.5 * amt : 0)).hide(!typing));
      const L = [[[34, -38, zb], [86, -38, zb]], [[34, -29, zb], [80, -29, zb]], [[34, -20, zb], [66, -20, zb]]];
      lines.forEach((l, i) => l.partial(L[i], typing ? 0 : K.out(K.win(ph, 1.8 + i * .35, .45))));
    };
  },
});
