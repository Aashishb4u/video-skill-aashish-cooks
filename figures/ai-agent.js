// ai-agent: a core chip wired to its tools (browser, terminal, file, mail). A pulse runs from the core
// to each tool in turn and the tool lights up and lifts while the agent uses it. The pointer lifts
// the tool under it. For AI agents, automation, "it does the work for you", tool use, MCP.
CF.add('ai-agent', {
  label: 'an AI agent using its tools',
  aliases: ['agent', 'agents', 'ai-agents', 'autonomous-agent', 'tool-use', 'automation-agent'],
  box: [[-78, -78, -2], [78, 78, 22]],
  make(K) {
    const D = 54, T = 15;                                   // tool distance and half size
    const base = K.face(K.rr(-76, -76, 76, 76, 16), 'nf dash');
    const tools = [[0, -D, 'browser'], [D, 0, 'terminal'], [0, D, 'file'], [-D, 0, 'mail']].map(([x, y, kind]) => {
      const wire = K.line('nf lo'), live = K.line('nf hi');
      const g = K.g();
      return { x, y, kind, wire, live, g, plate: K.plate(K.rr(x - T, y - T, x + T, y + T, 5), 1.1, g), icon: [K.line('nf', g), K.line('nf', g), K.line('nf', g)], pulse: K.dot(2.2, 'accent') };
    });
    const core = K.plate(K.rr(-20, -20, 20, 20, 7), 1.6);
    const ring = K.face(K.rr(-12, -12, 12, 12, 4), 'nf');
    const pins = [-12, -4, 4, 12].flatMap(o => [[o, -20, o, -25], [o, 20, o, 25], [-20, o, -25, o], [20, o, 25, o]]).map(() => K.line('nf'));
    const eye = K.dot(4, 'accent');
    // tool icons drawn as lines on the tool's top face
    const iconPts = (k, x, y, z) => {
      if (k === 'browser') return [[[x - 9, y - 9, z], [x + 9, y - 9, z], [x + 9, y + 9, z], [x - 9, y + 9, z], [x - 9, y - 9, z]], [[x - 9, y - 4, z], [x + 9, y - 4, z]], [[x - 6, y - 6.5, z], [x - 4, y - 6.5, z]]];
      if (k === 'terminal') return [[[x - 8, y - 6, z], [x - 2, y, z], [x - 8, y + 6, z]], [[x + 1, y + 6, z], [x + 8, y + 6, z]], []];
      if (k === 'file') return [[[x - 7, y - 9, z], [x + 3, y - 9, z], [x + 8, y - 4, z], [x + 8, y + 9, z], [x - 7, y + 9, z], [x - 7, y - 9, z]], [[x - 3, y, z], [x + 4, y, z]], [[x - 3, y + 4, z], [x + 4, y + 4, z]]];
      return [[[x - 9, y - 7, z], [x + 9, y - 7, z], [x + 9, y + 7, z], [x - 9, y + 7, z], [x - 9, y - 7, z]], [[x - 9, y - 7, z], [x, y + 1, z], [x + 9, y - 7, z]], []];
    };
    const STEP = 1.5;
    return (t, p) => {
      const amt = .4 + .6 * K.amt;
      base.at(-1);
      const k = Math.floor(t / STEP), ph = t - k * STEP, act = k % 4;
      tools.forEach((o, i) => {
        const from = [o.x * 20 / D * (o.x ? 1 : 0), o.y * 20 / D * (o.y ? 1 : 0)];
        const to = [o.x - Math.sign(o.x) * T, o.y - Math.sign(o.y) * T];
        const A = [from[0] + (o.x ? 5 * Math.sign(o.x) : 0), from[1] + (o.y ? 5 * Math.sign(o.y) : 0), 2], B = [to[0], to[1], 2];
        o.wire.set([A, B]);
        const using = i === act, go = using ? K.ease(K.win(ph, 0, .55)) : 0;
        o.live.partial([A, B], go).hide(!using);
        o.pulse.at(K.lerp(A[0], B[0], go), K.lerp(A[1], B[1], go), 2.5).hide(!using || go >= 1);
        const on = using && go >= 1;
        const lift = K.follow('l' + i, (on ? 1 : 0) + (o.plate.hit(p) ? 1 : 0), 10);
        const z0 = 0, z1 = 4 + Math.min(lift, 1.4) * 6 * amt;
        o.plate.at(z0, z1).lit(on || lift > .9);
        iconPts(o.kind, o.x, o.y, z1).forEach((pts, j) => o.icon[j].set(pts).cls(on ? 'nf hi' : 'nf'));
      });
      // the core breathes; its eye pulses as it thinks
      const zc = 8 + Math.sin(t * 2.2) * .8 * amt;
      core.at(0, zc).lit(true);
      ring.at(zc);
      const pinPts = [-12, -4, 4, 12].flatMap(o => [[[o, -20, 2], [o, -25, 2]], [[o, 20, 2], [o, 25, 2]], [[-20, o, 2], [-25, o, 2]], [[20, o, 2], [25, o, 2]]]);
      pins.forEach((l, j) => l.set(pinPts[j]));
      eye.at(0, 0, zc, 1 + .35 * Math.sin(t * 4.4) * amt);
    };
  },
});
