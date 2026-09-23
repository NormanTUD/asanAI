// Paste everything below (the IIFE) into the browser DevTools console on the
// page with the topic chooser (e.g. intro.php), then physically click the
// Polymath button and report what it logs.
(function () {
  const b = document.querySelector('[data-core-persona="polymath"]');
  console.log('hosts:', document.querySelectorAll('[data-topics-inline]').length,
    '| persona buttons:', document.querySelectorAll('[data-core-persona]').length);
  let el = b, i = 0;
  while (el && el !== document.documentElement && i < 12) {
    const cs = getComputedStyle(el);
    console.log('  ' + el.tagName + (el.className ? '.' + String(el.className).split(' ').slice(0, 2).join('.') : '')
      + '  pointer-events=' + cs.pointerEvents + '  position=' + cs.position + '  z=' + cs.zIndex);
    el = el.parentElement;
    i++;
  }
  if (b) b.addEventListener('click', function () { console.log('>>> REACHED polymath click'); });
  console.log('>>> now click the Polymath button');
})();
