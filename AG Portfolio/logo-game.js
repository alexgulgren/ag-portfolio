// The AG logo as an editable vector. Drag anchor points to distort it with a pen tool,
// or press Play: some points get scrambled and you put the logo back together against the clock.
(() => {
  const svg = document.querySelector('.vec');
  if (!svg) return;

  // Paths traced from AG.ai, in a 1080 × 1080 artboard with y pointing down.
  // Each path is a list of subpaths: { start, segs: [{ p } | { c1, c2, p }] }.
  const LOGO = [[{"start":[568.62,359.21],"segs":[{"c1":[568.62,375.02],"c2":[555.81,387.83],"p":[540.0,387.83]},{"c1":[524.19,387.83],"c2":[511.38,375.02],"p":[511.38,359.21]},{"c1":[511.38,343.4],"c2":[524.19,330.58],"p":[540.0,330.58]},{"c1":[555.81,330.58],"c2":[568.62,343.4],"p":[568.62,359.21]}]}],[{"start":[365.38,500.12],"segs":[{"p":[378.58,482.57]},{"p":[378.6,482.58]},{"p":[540.0,267.38]},{"p":[710.56,494.79]},{"p":[714.58,500.12]},{"p":[687.57,500.12]},{"c1":[653.15,456.56],"c2":[599.84,428.6],"p":[540.0,428.6]},{"c1":[480.16,428.6],"c2":[426.85,456.56],"p":[392.43,500.12]}]},{"start":[565.21,591.44],"segs":[{"c1":[560.06,586.4],"c2":[552.99,583.29],"p":[545.21,583.29]},{"c1":[529.41,583.29],"c2":[516.59,596.1],"p":[516.59,611.92]},{"c1":[516.59,627.73],"c2":[529.41,640.54],"p":[545.21,640.54]},{"c1":[552.99,640.54],"c2":[560.06,637.43],"p":[565.21,632.39]},{"p":[687.54,632.39]},{"c1":[679.67,706.92],"c2":[616.61,764.99],"p":[540.0,764.99]},{"c1":[458.05,764.99],"c2":[391.63,698.56],"p":[391.63,616.62]},{"c1":[391.63,534.67],"c2":[458.05,468.25],"p":[540.0,468.25]},{"c1":[594.36,468.25],"c2":[641.88,497.48],"p":[667.71,541.07]},{"p":[793.68,541.07]},{"p":[540.0,202.84]},{"p":[286.32,541.07]},{"p":[367.79,541.07]},{"c1":[357.61,564.18],"c2":[351.98,589.75],"p":[351.98,616.62]},{"c1":[351.98,720.45],"c2":[436.16,804.64],"p":[540.0,804.64]},{"c1":[643.84,804.64],"c2":[728.02,720.45],"p":[728.02,616.62]},{"c1":[728.02,608.07],"c2":[727.46,599.67],"p":[726.33,591.44]}]}],[{"start":[805.23,611.92],"segs":[{"c1":[805.23,758.41],"c2":[686.48,877.16],"p":[539.99,877.16]},{"c1":[393.5,877.16],"c2":[274.77,758.41],"p":[274.77,611.92]},{"c1":[274.77,605.02],"c2":[275.02,598.2],"p":[275.54,591.44]},{"p":[313.01,591.44]},{"c1":[312.4,598.19],"c2":[312.09,605.02],"p":[312.09,611.92]},{"c1":[312.09,737.79],"c2":[414.12,839.83],"p":[539.99,839.83]},{"c1":[665.88,839.83],"c2":[767.91,737.79],"p":[767.91,611.92]},{"c1":[767.91,605.02],"c2":[767.6,598.19],"p":[766.99,591.44]},{"p":[804.46,591.44]},{"c1":[804.98,598.2],"c2":[805.23,605.02],"p":[805.23,611.92]}]}]];

  const NS = 'http://www.w3.org/2000/svg';
  const badge = svg.closest('.badge');
  const status = badge.querySelector('.game-status');
  const playBtn = badge.querySelector('.play');
  const resetBtn = badge.querySelector('.reset');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  let paths = clone(LOGO);

  // Anchors: every point a segment ends on. Points that sit on top of each other move as one.
  const anchors = [];
  LOGO.forEach((path, i) => path.forEach((sub, j) => {
    [[-1, sub.start], ...sub.segs.map((seg, k) => [k, seg.p])].forEach(([k, pt]) => {
      let a = anchors.find((b) => b.i === i && b.j === j && dist(b.home, pt) < 2);
      if (!a) anchors.push(a = { i, j, home: [...pt], refs: [] });
      a.refs.push(k);
    });
  }));

  const pos = (a) => {
    const sub = paths[a.i][a.j], k = a.refs[0];
    return k < 0 ? sub.start : sub.segs[k].p;
  };
  // Moving an anchor carries its bezier handles with it, like the pen tool in Figma.
  function moveTo(a, to) {
    const from = pos(a), dx = to[0] - from[0], dy = to[1] - from[1];
    const shift = (pt) => { if (pt) { pt[0] += dx; pt[1] += dy; } };
    const sub = paths[a.i][a.j];
    a.refs.forEach((k) => {
      if (k < 0) { shift(sub.start); shift(sub.segs[0]?.c1); return; }
      shift(sub.segs[k].p); shift(sub.segs[k].c2); shift(sub.segs[k + 1]?.c1);
    });
  }

  const d = (path) => path.map((sub) => `M${sub.start} ` + sub.segs.map((s) => (s.c1 ? `C${s.c1} ${s.c2} ${s.p}` : `L${s.p}`)).join(' ') + 'Z').join(' ');
  const el = (name, attrs, parent) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    parent.append(node);
    return node;
  };

  const ghost = el('g', { class: 'ghost' }, svg);
  LOGO.forEach((path) => el('path', { d: d(path) }, ghost));
  const shapes = LOGO.map(() => el('path', { class: 'shape' }, svg));
  const handles = el('g', { class: 'handles' }, svg);
  const layer = el('g', { class: 'anchors' }, svg);
  anchors.forEach((a) => {
    a.node = el('g', { class: 'pt' }, layer);
    el('circle', { class: 'hit', r: 0 }, a.node);
    el('rect', { class: 'knob' }, a.node);
  });

  // Knobs stay a constant size on screen whatever size the frame is.
  let unit = 1;
  function sizeKnobs() {
    unit = svg.viewBox.baseVal.width / (svg.clientWidth || 1);
    anchors.forEach((a) => {
      a.node.querySelector('.hit').setAttribute('r', 14 * unit);
      const knob = a.node.querySelector('.knob');
      knob.setAttribute('width', 8 * unit); knob.setAttribute('height', 8 * unit);
      knob.setAttribute('x', -4 * unit); knob.setAttribute('y', -4 * unit);
    });
    render();
  }

  let active = null;
  const tolerance = () => 10 * unit;
  const offTarget = () => anchors.filter((a) => dist(pos(a), a.home) > tolerance());

  function render() {
    shapes.forEach((shape, i) => shape.setAttribute('d', d(paths[i])));
    anchors.forEach((a) => {
      const [x, y] = pos(a);
      a.node.setAttribute('transform', `translate(${x} ${y})`);
      a.node.classList.toggle('off', game.on && dist(pos(a), a.home) > tolerance());
    });
    handles.replaceChildren();
    if (active) {
      const sub = paths[active.i][active.j], at = pos(active);
      const ctrl = [];
      active.refs.forEach((k) => {
        if (k < 0) ctrl.push(sub.segs[0]?.c1);
        else ctrl.push(sub.segs[k].c2, sub.segs[k + 1]?.c1);
      });
      ctrl.filter(Boolean).forEach((c) => {
        el('line', { x1: at[0], y1: at[1], x2: c[0], y2: c[1] }, handles);
        el('circle', { cx: c[0], cy: c[1], r: 3 * unit }, handles);
      });
    }
    const moved = anchors.some((a) => dist(pos(a), a.home) > 0.5);
    badge.classList.toggle('distorted', moved);
    resetBtn.disabled = !moved && !game.on;
  }

  // Game state
  const game = { on: false, level: 1, start: 0, moves: 0, timer: 0 };
  const clock = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const say = (text) => { status.textContent = text; };
  const best = (level, ms) => {
    try {
      const key = `ag-logo-best-${level}`, prev = Number(localStorage.getItem(key)) || Infinity;
      if (ms < prev) localStorage.setItem(key, ms);
      return Math.min(ms, prev);
    } catch { return ms; }
  };

  function tick() {
    say(`${offTarget().length} left · ${clock(performance.now() - game.start)}`);
  }

  function play() {
    paths = clone(LOGO);
    const count = Math.min(anchors.length, 2 + game.level * 2);
    const picks = [...anchors].sort(() => Math.random() - 0.5).slice(0, count);
    const targets = picks.map((a) => {
      const angle = Math.random() * Math.PI * 2, r = 50 + Math.random() * 70;
      return [a.home[0] + Math.cos(angle) * r, a.home[1] + Math.sin(angle) * r];
    });
    game.on = true; game.moves = 0;
    badge.classList.add('playing');
    playBtn.textContent = `Level ${game.level}`;
    playBtn.disabled = true;
    const begin = () => {
      game.start = performance.now();
      clearInterval(game.timer);
      game.timer = setInterval(tick, 200);
      tick();
    };
    if (reduced.matches) { picks.forEach((a, n) => moveTo(a, targets[n])); render(); begin(); return; }
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 450), e = 1 - (1 - t) ** 3;
      picks.forEach((a, n) => moveTo(a, [a.home[0] + (targets[n][0] - a.home[0]) * e, a.home[1] + (targets[n][1] - a.home[1]) * e]));
      render();
      if (t < 1) requestAnimationFrame(step); else begin();
    };
    requestAnimationFrame(step);
  }

  function win() {
    const ms = performance.now() - game.start;
    clearInterval(game.timer);
    game.on = false;
    badge.classList.remove('playing');
    const top = best(game.level, ms);
    say(`Pixel perfect · ${clock(ms)} · ${game.moves} moves${top < ms ? ` · best ${clock(top)}` : ''}`);
    game.level += 1;
    playBtn.textContent = 'Next level';
    playBtn.disabled = false;
    confetti();
    render();
  }

  function reset() {
    clearInterval(game.timer);
    game.on = false;
    badge.classList.remove('playing');
    paths = clone(LOGO);
    active = null;
    playBtn.textContent = 'Play';
    playBtn.disabled = false;
    say('Drag any point');
    render();
  }

  function confetti() {
    if (reduced.matches) return;
    const burst = document.createElement('span');
    burst.className = 'confetti';
    burst.setAttribute('aria-hidden', 'true');
    for (let n = 0; n < 28; n++) {
      const bit = document.createElement('i');
      const angle = Math.random() * Math.PI * 2, r = 80 + Math.random() * 140;
      bit.style.setProperty('--x', `${Math.cos(angle) * r}px`);
      bit.style.setProperty('--y', `${Math.sin(angle) * r}px`);
      bit.style.setProperty('--r', `${Math.random() * 540 - 270}deg`);
      bit.style.setProperty('--c', ['var(--accent)', 'var(--teal)', 'var(--select)', 'var(--ink)'][n % 4]);
      burst.append(bit);
    }
    badge.append(burst);
    setTimeout(() => burst.remove(), 1200);
  }

  // Pen tool: drag anchors. Snaps home when released close enough during a game.
  const toSvg = (e) => {
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return [pt.x, pt.y];
  };
  anchors.forEach((a) => {
    a.node.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      try { a.node.setPointerCapture(e.pointerId); } catch {}
      active = a;
      const grab = toSvg(e), from = [...pos(a)];
      const move = (ev) => {
        const now = toSvg(ev);
        moveTo(a, [from[0] + now[0] - grab[0], from[1] + now[1] - grab[1]]);
        render();
      };
      const up = () => {
        a.node.removeEventListener('pointermove', move);
        a.node.removeEventListener('pointerup', up);
        a.node.removeEventListener('pointercancel', up);
        if (game.on) {
          game.moves += 1;
          if (dist(pos(a), a.home) <= tolerance() * 1.6) {
            moveTo(a, a.home);
            a.node.classList.remove('snap'); void a.node.getBBox(); a.node.classList.add('snap');
          }
          render();
          if (!offTarget().length) win(); else tick();
        } else {
          const moved = anchors.filter((b) => dist(pos(b), b.home) > 0.5).length;
          say(moved ? `${moved} point${moved > 1 ? 's' : ''} moved` : 'Drag any point');
        }
      };
      a.node.addEventListener('pointermove', move);
      a.node.addEventListener('pointerup', up);
      a.node.addEventListener('pointercancel', up);
      render();
    });
  });

  playBtn.addEventListener('click', play);
  resetBtn.addEventListener('click', reset);
  new ResizeObserver(sizeKnobs).observe(svg);
  sizeKnobs();
})();
