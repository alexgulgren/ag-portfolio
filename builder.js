// Hero motion graphic: product screens get built by hand, the way you would in a design tool.
// The cursor draws each piece with a rectangle tool (blue outline and a live W × H label),
// the shape fills in on release, repeated pieces are Option-dragged as duplicates, and on the
// workflow board a task gets dragged to the next column. Then it clears and builds the next screen.
(() => {
  const root = document.querySelector('.builder');
  if (!root) return;
  const page = root.querySelector('.page');
  const cursor = root.querySelector('.b-cursor');

  // Pieces are [op, kind, x, y, width, height, id?] in percent of the page area.
  // op: 'draw' with the rectangle tool, 'dup' Option-drags a copy of the previous piece,
  // 'move' drags the piece with the given id to a new spot. A width of 0 means a circle or square.
  const SCREENS = [
    // Analytics dashboard
    [
      ['draw', 'side', 0, 0, 22, 100], ['draw', 'logo', 4, 4, 0, 7],
      ['draw', 'item-on', 4, 18, 14, 4], ['draw', 'item', 4, 26, 14, 4], ['dup', 'item', 4, 34, 14, 4], ['dup', 'item', 4, 42, 14, 4],
      ['draw', 'bar', 27, 5, 30, 6], ['draw', 'avatar', 89, 4, 0, 8],
      ['draw', 'stat', 27, 16, 21, 18], ['dup', 'stat', 50.5, 16, 21, 18], ['dup', 'stat', 74, 16, 21, 18],
      ['draw', 'panel', 27, 39, 45, 55],
      ['draw', 'col', 32, 70, 6, 19], ['draw', 'col', 41, 58, 6, 31], ['draw', 'col-hi', 50, 50, 6, 39], ['draw', 'col-sun', 59, 63, 6, 26],
      ['draw', 'row', 75, 40, 20, 10], ['dup', 'row', 75, 52, 20, 10], ['dup', 'row', 75, 64, 20, 10], ['dup', 'row', 75, 76, 20, 10],
    ],
    // Video feedback review
    [
      ['draw', 'video', 4, 5, 58, 55], ['draw', 'track', 4, 65, 58, 3], ['draw', 'progress', 4, 65, 30, 3],
      ['draw', 'marker', 14, 63, 0, 7], ['dup', 'marker', 31, 63, 0, 7], ['dup', 'marker', 49, 63, 0, 7],
      ['draw', 'chip', 4, 75, 15, 7], ['dup', 'chip', 21, 75, 15, 7], ['dup', 'chip', 38, 75, 15, 7],
      ['draw', 'line', 4, 87, 42, 3], ['draw', 'line', 4, 92, 28, 3],
      ['draw', 'panel', 66, 5, 30, 90],
      ['draw', 'comment', 69, 10, 24, 15], ['dup', 'comment', 69, 29, 24, 15], ['dup', 'comment', 69, 48, 24, 15],
      ['draw', 'field', 69, 80, 17, 9], ['draw', 'send', 88, 80, 0, 9],
    ],
    // Workflow board: tasks move through columns
    [
      ['draw', 'side', 0, 0, 14, 100], ['draw', 'logo', 3, 4, 0, 7],
      ['draw', 'item-on', 3, 18, 8, 4], ['draw', 'item', 3, 26, 8, 4], ['dup', 'item', 3, 34, 8, 4],
      ['draw', 'bar', 18, 5, 26, 6], ['draw', 'btn', 80, 4, 15, 8],
      ['draw', 'head', 18, 19, 24, 3.5], ['dup', 'head', 45, 19, 24, 3.5], ['dup', 'head', 72, 19, 24, 3.5],
      ['draw', 'task', 18, 26, 24, 17], ['dup', 'task', 18, 46, 24, 17, 'a'], ['dup', 'task', 18, 66, 24, 17, 'b'],
      ['draw', 'task-on', 45, 26, 24, 17], ['draw', 'task-review', 72, 26, 24, 17],
      ['move', 'task', 45, 46, 24, 17, 'b'], ['move', 'task', 72, 46, 24, 17, 'a'],
    ],
  ];
  const INNER = { comment: '<b></b><i></i><i></i>' };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // Timer-driven tween so the motion keeps going wherever timers run
  const tween = (ms, step) => new Promise((resolve) => {
    const t0 = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / ms);
      step(1 - (1 - t) ** 3);
      if (t < 1) setTimeout(tick, 16); else resolve();
    };
    tick();
  });

  // Turn a spec into a piece; circles get a width that matches their height on screen
  const piece = ([op, kind, x, y, w, h, id]) => ({ op, kind, x, y, w: w || (h * page.clientHeight) / page.clientWidth, h, id });

  // Cursor position in px within the page area
  let at = [0, 0];
  const place = ([x, y]) => { cursor.style.transform = `translate(${page.offsetLeft + x}px, ${page.offsetTop + y}px)`; };
  const toPx = (x, y) => [(x / 100) * page.clientWidth, (y / 100) * page.clientHeight];
  async function moveTo(to, ms) {
    const from = at;
    await tween(ms, (e) => place([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e]));
    at = to;
  }
  async function press(on) {
    cursor.classList.toggle('press', on);
    await wait(90);
  }

  const shape = (p) => {
    const el = document.createElement('div');
    el.className = `prim k-${p.kind}`;
    el.innerHTML = INNER[p.kind] || '';
    Object.assign(el.style, { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` });
    page.append(el);
    return el;
  };
  const center = (el) => {
    const r = el.getBoundingClientRect(), box = page.getBoundingClientRect();
    return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
  };

  // Rectangle tool: press at one corner, drag to the other, release to fill
  async function draw(p) {
    const start = toPx(p.x, p.y), end = toPx(p.x + p.w, p.y + p.h);
    cursor.classList.add('draw');
    await moveTo(start, 300);
    await press(true);
    const el = shape(p);
    el.classList.add('drawing');
    const dragMs = 200 + Math.min(240, Math.hypot(end[0] - start[0], end[1] - start[1]) * 1.3);
    await tween(dragMs, (e) => {
      el.style.width = `${p.w * e}%`;
      el.style.height = `${p.h * e}%`;
      place([start[0] + (end[0] - start[0]) * e, start[1] + (end[1] - start[1]) * e]);
      el.dataset.size = `${Math.round(el.offsetWidth)} × ${Math.round(el.offsetHeight)}`;
    });
    at = end;
    await press(false);
    el.classList.remove('drawing');
    el.classList.add('filled');
    cursor.classList.remove('draw');
    return el;
  }

  // Grab a piece and drag it (or, for 'dup', an Option-drag copy of it) to a new spot
  async function drag(p, source, copy) {
    const grab = center(source);
    await moveTo(grab, 260);
    cursor.classList.toggle('dup', copy);
    await press(true);
    const el = copy ? shape(p) : source;
    el.classList.add('filled', copy ? 'copying' : 'lifted');
    const sx = parseFloat(source.style.left), sy = parseFloat(source.style.top);
    const delta = toPx(p.x - sx, p.y - sy);
    await tween(copy ? 300 : 520, (e) => {
      el.style.left = `${sx + (p.x - sx) * e}%`;
      el.style.top = `${sy + (p.y - sy) * e}%`;
      place([grab[0] + delta[0] * e, grab[1] + delta[1] * e]);
    });
    at = [grab[0] + delta[0], grab[1] + delta[1]];
    await press(false);
    el.classList.remove('copying', 'lifted');
    cursor.classList.remove('dup');
    return el;
  }

  async function build(screen) {
    const byId = {};
    let last = null;
    for (const spec of screen) {
      await ready();
      const p = piece(spec);
      if (p.op === 'move') { await drag(p, byId[p.id], false); continue; }
      last = p.op === 'dup' ? await drag(p, last, true) : await draw(p);
      if (p.id) byId[p.id] = last;
    }
  }

  async function clear() {
    await wait(1800);
    page.querySelectorAll('.prim').forEach((el) => el.classList.add('out'));
    await wait(450);
    page.replaceChildren();
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    SCREENS[0].map(piece).forEach((p) => shape(p).classList.add('filled'));
    cursor.hidden = true;
    return;
  }

  // Only animate while the graphic is on screen and the tab is visible
  const onScreen = () => {
    const r = root.getBoundingClientRect();
    return !document.hidden && r.bottom > 0 && r.top < innerHeight;
  };
  const ready = async () => { while (!onScreen()) await wait(400); };

  (async () => {
    at = [page.clientWidth * 0.6, page.clientHeight * 0.5];
    place(at);
    for (let n = 0; ; n++) {
      await build(SCREENS[n % SCREENS.length]);
      await ready();
      await clear();
    }
  })();
})();
