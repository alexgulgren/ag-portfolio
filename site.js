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
