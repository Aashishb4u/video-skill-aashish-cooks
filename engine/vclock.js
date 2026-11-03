// Virtual clock for frame-exact rendering of real-time widgets (hairline figures).
// performance.now / requestAnimationFrame are replaced so time only moves when VCLOCK.step() says so.
'use strict';
(function () {
  const realNow = performance.now.bind(performance);
  let now = 0, rafId = 1, queue = new Map();
  performance.now = () => now;
  window.requestAnimationFrame = cb => { const id = rafId++; queue.set(id, cb); return id; };
  window.cancelAnimationFrame = id => { queue.delete(id); };
  // Figures only animate while visible; in a render every frame is "visible".
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(target) { this.cb([{ target, isIntersecting: true, intersectionRatio: 1, boundingClientRect: target.getBoundingClientRect() }], this); }
    unobserve() { } disconnect() { } takeRecords() { return []; }
  };
  window.VCLOCK = {
    realNow,
    get now() { return now; },
    // advance to ms (absolute) and run one animation frame
    frame(ms) {
      now = ms;
      const cbs = [...queue.values()]; queue.clear();
      for (const cb of cbs) { try { cb(now); } catch (e) { console.error(e); } }
    },
  };
})();
