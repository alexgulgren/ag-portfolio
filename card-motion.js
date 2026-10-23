// Card demos play only when someone engages with them, so the page is calm at rest. With a mouse that's hover (CSS :hover);
// on touch screens, which can't hover, a card counts as engaged while at least 40% of it is on screen, marked with .is-playing.
// Cards marked data-autoplay (the onboarding demo) play whenever they're on screen, on every device.
const isEngaged = (card) => card.matches(':hover') || card.classList.contains('is-playing');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-playing', e.isIntersecting)), { threshold: 0.4 });
  const cards = matchMedia('(hover: hover)').matches ? '.case[data-autoplay]' : '.case';
  document.querySelectorAll(cards).forEach((card) => io.observe(card));
}

// Motion on the AI Assistant case card, in the same hand-built style as the hero graphic.
// Each 8 second loop: a transcript search types its query and the matches light up, while a
// playhead runs along the feedback timeline, dropping AI markers and filler-word dots as it passes
// them and opening an AI comment at the first marker, and the speaking-pace line draws in step.
// Then everything resets and plays again. It plays while the card is engaged; otherwise it rests on the finished frame.
(() => {
  const search = document.querySelector('.fx-search');
  const timeline = document.querySelector('.fx-timeline');
  const pace = document.querySelector('.fx-pace');
  if (!search || !timeline || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const marks = [...search.querySelectorAll('mark')];
  const markers = [...timeline.querySelectorAll('.fx-mark')].map((el) => [el, parseFloat(el.style.getPropertyValue('--at')) / 100]);
  const dots = [...timeline.querySelectorAll('.fx-dots i')].map((el) => [el, parseFloat(el.style.getPropertyValue('--x')) / 100]);
  const bubble = timeline.querySelector('.fx-bubble');
  const lines = [...bubble.querySelectorAll('.fx-lines i')];
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const on = (el, yes = true) => el.classList.toggle('on', yes);
  const all = [...marks, ...markers.map(([el]) => el), ...dots.map(([el]) => el), bubble, ...lines];
  const set = (q, p) => { search.style.setProperty('--q', q); timeline.style.setProperty('--p', p); pace?.style.setProperty('--p', p); };

  // Between loops: if nobody is engaging with the card, show the finished frame and wait
  const card = search.closest('.case');
  const ready = async () => {
    if (isEngaged(card) && !document.hidden) return;
    all.forEach((el) => on(el)); set(1, 1);
    while (!isEngaged(card) || document.hidden) await wait(150);
  };

  async function typeQuery() {
    for (let n = 0; n <= 5; n++) {
      search.style.setProperty('--q', n / 5);
      await wait(260);
    }
    for (const mark of marks) { on(mark); await wait(240); }
  }

  async function playTimeline() {
    const length = 6200, t0 = performance.now();
    let commented = false;
    for (;;) {
      const p = Math.min(1, (performance.now() - t0) / length);
      timeline.style.setProperty('--p', p);
      pace?.style.setProperty('--p', p);
      markers.forEach(([el, at]) => { if (p >= at) on(el); });
      dots.forEach(([el, x]) => { if (p >= x) on(el); });
      if (!commented && p >= markers[0][1]) {
        commented = true;
        on(bubble);
        setTimeout(() => on(lines[0]), 250);
        setTimeout(() => on(lines[1]), 500);
      }
      if (p === 1) return;
      await wait(16);
    }
  }

  (async () => {
    search.classList.add('run');
    timeline.classList.add('run');
    for (;;) {
      await ready();
      all.forEach((el) => on(el, false));
      set(0, 0);
      await wait(400);
      await Promise.all([typeQuery(), playTimeline()]);
      await wait(1400);
    }
  })();
})();

// Before → after on the platform redesign card. With a mouse, the divider follows the pointer and
// eases back to the middle on leave. Without hover (touch screens), it sweeps back and forth.
(() => {
  const art = document.querySelector('.compare');
  const cmp = art?.querySelector('.cmp');
  if (!cmp || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const SCREEN_LEFT = 0.14254, SCREEN_WIDTH = 0.72075;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let split = 0.5, hovering = false;
  const set = (v) => { split = Math.min(1, Math.max(0, v)); cmp.style.setProperty('--s', split); };
  const tween = async (to, ms) => {
    const from = split, t0 = performance.now();
    for (;;) {
      const t = Math.min(1, (performance.now() - t0) / ms);
      set(from + (to - from) * (0.5 - Math.cos(Math.PI * t) / 2));
      if (t === 1) return;
      await wait(16);
    }
  };

  if (matchMedia('(hover: hover)').matches) {
    art.addEventListener('pointermove', (e) => {
      hovering = true;
      const r = cmp.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width - SCREEN_LEFT) / SCREEN_WIDTH);
    });
    art.addEventListener('pointerleave', () => { hovering = false; tween(0.5, 450); });
    return;
  }

  (async () => {
    for (;;) {
      const r = art.getBoundingClientRect();
      if (document.hidden || r.bottom < 0 || r.top > innerHeight || hovering) { await wait(400); continue; }
      await tween(0.85, 1800);
      await wait(900);
      await tween(0.15, 2400);
      await wait(900);
      await tween(0.5, 1200);
      await wait(1500);
    }
  })();
})();
