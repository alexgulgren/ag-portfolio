// Design-tool selection frames: an outline, corner handles and a live W × H label, like a selected layer in Figma.
const SELECTABLE = '[data-select], .principles article, .more article, .outcomes div, .options .chosen';

function addFrame(el) {
  const sel = document.createElement('span');
  sel.className = 'sel';
  sel.setAttribute('aria-hidden', 'true');
  sel.innerHTML = '<i data-corner="tl"></i><i data-corner="tr"></i><i data-corner="bl"></i><i data-corner="br"></i><b></b>';
  if (el.dataset.select) {
    const name = document.createElement('em');
    name.textContent = el.dataset.select;
    sel.prepend(name);
  }
  el.append(sel);
  const size = sel.querySelector('b');
  new ResizeObserver(() => { size.textContent = `${sel.offsetWidth} × ${sel.offsetHeight}`; }).observe(sel);
  return sel;
}

document.querySelectorAll(SELECTABLE).forEach(addFrame);
document.querySelectorAll('.options .chosen').forEach((el) => el.classList.add('is-selected'));

// Selected-line underline for the key headline word and for links on hover.
document.querySelectorAll('.word, .nav a, .back').forEach((el) => {
  const line = document.createElement('span');
  line.className = 'uline';
  line.setAttribute('aria-hidden', 'true');
  line.innerHTML = '<i></i><i></i>';
  el.append(line);
});

// Hero canvas layers (the logo frame). Click to select, drag to move,
// drag a corner to resize, double-click to reset. Clicking empty space deselects, like a design tool.
const layers = [...document.querySelectorAll('.layer')];
if (layers.length) {
  const DIR = { tl: [-1, -1], tr: [1, -1], bl: [-1, 1], br: [1, 1] };
  const narrow = matchMedia('(max-width: 860px)');
  const select = (layer) => layers.forEach((l) => l.classList.toggle('is-selected', l === layer));
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.layer')) select(null); });

  function drag(layer, target, onMove, cls, enabled = () => true) {
    target.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      select(layer);
      if (!enabled()) return;
      e.preventDefault();
      e.stopPropagation();
      target.setPointerCapture(e.pointerId);
      const x0 = e.clientX, y0 = e.clientY;
      const start = onMove(null);
      layer.classList.add(cls);
      const move = (ev) => onMove({ dx: ev.clientX - x0, dy: ev.clientY - y0, start });
      const up = () => {
        layer.classList.remove(cls);
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
      };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    });
  }

  layers.forEach((layer) => {
    const min = Number(layer.dataset.min) || 48, max = Number(layer.dataset.max) || 420;

    layer.querySelectorAll('.sel i').forEach((handle) => {
      const [sx, sy] = DIR[handle.dataset.corner];
      drag(layer, handle, (d) => {
        if (!d) return layer.offsetWidth;
        const delta = sx * d.dx + sy * d.dy * 0.8;
        layer.style.width = `${Math.round(Math.min(max, Math.max(min, d.start + delta / 2)))}px`;
      }, 'is-resizing');
    });

    drag(layer, layer.querySelector('.frame') || layer, (d) => {
      if (!d) return [parseFloat(layer.style.getPropertyValue('--dx')) || 0, parseFloat(layer.style.getPropertyValue('--dy')) || 0];
      layer.style.setProperty('--dx', `${d.start[0] + d.dx}px`);
      layer.style.setProperty('--dy', `${d.start[1] + d.dy}px`);
    }, 'is-moving', () => !narrow.matches);

    layer.addEventListener('dblclick', (e) => {
      if (e.target.closest('.pt, .game-bar')) return;
      layer.style.removeProperty('width');
      layer.style.removeProperty('--dx');
      layer.style.removeProperty('--dy');
    });
  });
}
