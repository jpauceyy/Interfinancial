import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/dm-sans';
import './index.css';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = matchMedia('(min-width: 768px)');

/* ---------- splash: ~1.9s, once per session ---------- */
const splash = $('#splash');
let seen = false;
try { seen = sessionStorage.getItem('if-splash') === '1'; sessionStorage.setItem('if-splash', '1'); } catch (_) {}
if (!splash || seen) {
  splash?.remove();
  document.documentElement.classList.add('loaded');
} else {
  setTimeout(() => document.documentElement.classList.add('loaded'), 1450);
  setTimeout(() => splash.remove(), 2050);
}

/* ---------- calculator partial -> every slot ---------- */
const tpl = $('#calculator-tpl');
$$('[data-slot="calculator"]').forEach((slot) => slot.appendChild(tpl.content.cloneNode(true)));

/* ---------- split headings into masked words ---------- */
function splitWords(el) {
  let i = 0;
  const walk = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.innerHTML = '<span></span>';
          w.firstChild.textContent = part;
          w.firstChild.style.setProperty('--wi', i++);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child);
      }
    }
  };
  walk(el);
  el.classList.add('split');
  el.classList.remove('rv');
}
$$('main h2.h-xl, main h2.h-lg, main h2.h-md, main h1.h-xl:not([data-hero])').forEach(splitWords);

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }),
  { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
);
const watch = (root) => $$('.rv:not(.in), .split:not(.in), .img-rv:not(.in)', root).forEach((el) => io.observe(el));

/* ---------- bezel: blurred surround with a rounded window ---------- */
const bezel = $('#bezel');
const bzImg = $('#bz-img');
const bzShade = $('#bz-shade');
const bzPattern = $('#bz');
const bzPhoto = $('image', bzPattern);
function bezelPath(W, H, e) {
  const x = Math.round((W < 768 ? 8 : clamp(W * 0.026, 12, 44)) * (1 - e));
  const y = Math.round((W < 768 ? 8 : clamp(W * 0.014, 10, 20)) * (1 - e));
  const r = Math.round((W < 768 ? 22 : clamp(W * 0.024, 20, 40)) * (1 - e * 0.7));
  const w = W - x * 2;
  const h = H - y * 2;
  return `M0 0H${W}V${H}H0Z M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}
let lastBezel = '';
function drawBezel(e = 0) {
  const W = innerWidth;
  const H = innerHeight;
  const key = `${W}x${H}:${e.toFixed(3)}`;
  if (key === lastBezel) return;
  lastBezel = key;
  bezel.setAttribute('viewBox', `0 0 ${W} ${H}`);
  [bzPattern, bzPhoto].forEach((n) => { n.setAttribute('width', W); n.setAttribute('height', H); });
  const d = bezelPath(W, H, e);
  bzImg.setAttribute('d', d);
  bzShade.setAttribute('d', d);
}

/* ---------- hash routing ---------- */
const pages = $$('.page');
const navLinks = $$('[data-nav]');
const ctaBand = $('#cta-band');
const nav = $('#nav');
let panels = [];
// where an element sits in the document ignoring sticky offsets
function naturalTop(el) {
  const panel = el.closest('.panel');
  if (!panel || panel._top === undefined) return el.getBoundingClientRect().top + scrollY;
  return panel._top + (el.getBoundingClientRect().top - panel.getBoundingClientRect().top);
}

function route() {
  const id = decodeURIComponent(location.hash.slice(1)) || 'home';
  let page = document.getElementById(`page-${id}`);
  let target = null;
  if (!page) {
    target = document.getElementById(id);
    page = target?.closest('.page') || document.getElementById('page-home');
  }
  const pageId = page.id.replace('page-', '');
  pages.forEach((p) => { p.hidden = p !== page; });
  ctaBand.hidden = pageId === 'contact';
  watch(page);
  if (!ctaBand.hidden) watch(ctaBand);
  watch($('footer'));

  navLinks.forEach((a) => {
    const on = a.getAttribute('href') === `#${pageId}`;
    a.classList.toggle('bg-night', on);
    a.classList.toggle('text-white', on);
  });
  setMenu(false);
  layout();

  if (target) scrollTo({ top: naturalTop(target) - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
  else scrollTo(0, 0);
}
addEventListener('hashchange', route);

/* ---------- mobile menu ---------- */
const menuBtn = $('#menu-btn');
const menu = $('#mobile-menu');
function setMenu(open) {
  menu.classList.toggle('opacity-0', !open);
  menu.classList.toggle('invisible', !open);
  menu.classList.toggle('-translate-y-2', !open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  $('use', menuBtn).setAttribute('href', open ? '#i-close' : '#i-menu');
  document.body.style.overflow = open ? 'hidden' : '';
}
menuBtn.addEventListener('click', () => setMenu(menu.classList.contains('invisible')));
addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

/* ---------- layout: sticky stacking + pinned track sizing ---------- */
function layout() {
  const vh = innerHeight;
  // pinned horizontal track: section is tall enough to scroll the track across
  $$('[data-hscroll]').forEach((sec) => {
    const track = $('.hs-track', sec);
    if (!wide.matches) { sec.style.height = ''; track.style.transform = ''; sec._travel = 0; return; }
    const travel = Math.max(0, track.scrollWidth - $('.hs-pin', sec).clientWidth);
    sec._travel = travel;
    sec.style.height = `${vh + travel}px`;
  });
  // each section sticks once its bottom reaches the viewport bottom, so the next one slides over it
  panels = $$('main .panel').filter((p) => p.getClientRects().length);
  // record each section's natural (unstuck) document offset before making it sticky
  panels.forEach((p) => { p.style.position = 'relative'; p.style.transform = ''; p._p = undefined; });
  panels.forEach((p) => { p._top = p.getBoundingClientRect().top + scrollY; });
  panels.forEach((p) => {
    p.style.position = 'sticky';
    p.style.top = `${Math.min(0, vh - p.offsetHeight)}px`;
    if (!p._shade) { p._shade = document.createElement('div'); p._shade.className = 'shade'; p.prepend(p._shade); }
  });
  // footer wordmark spans the frame edge to edge
  const wm = $('#wordmark');
  if (wm) {
    wm.style.fontSize = '100px';
    const avail = wm.parentElement.clientWidth - 32;
    wm.style.fontSize = `${Math.floor((100 * avail) / wm.scrollWidth)}px`;
  }
  drawBezel(0);
  frame();
}
addEventListener('resize', () => { lastBezel = ''; layout(); });
new ResizeObserver(() => layout()).observe($('main'));

/* ---------- typewriter on the hero's last line ---------- */
const typeEl = $('[data-type]');
if (typeEl && !reduceMotion) {
  const full = typeEl.textContent;
  const caret = Object.assign(document.createElement('span'), { className: 'caret' });
  caret.setAttribute('aria-hidden', 'true');
  typeEl.after(caret);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  (async function loop() {
    await wait(5200);
    for (let n = full.length; n >= 0; n--) { typeEl.textContent = full.slice(0, n); await wait(38); }
    await wait(350);
    for (let n = 1; n <= full.length; n++) { typeEl.textContent = full.slice(0, n); await wait(70); }
    loop();
  })();
}

/* ---------- scroll-linked effects (one rAF loop) ---------- */
const drift = $('[data-drift]');
const expand = () => $$('[data-expand]').find((el) => el.offsetParent !== null);
let ticking = false;
function frame() {
  ticking = false;
  const vh = innerHeight;
  const motion = !reduceMotion;

  nav.classList.toggle('shadow-lg', scrollY > 40);
  if (drift && motion) drift.style.transform = `translate3d(0, ${Math.min(scrollY, 900) * 0.12}px, 0) scale(1.08)`;

  // stacking: as the next section covers this one, shrink and dim it slightly
  for (let i = 0; i < panels.length - 1; i++) {
    const cur = panels[i];
    const nt = panels[i + 1].getBoundingClientRect().top;
    const p = nt < vh ? clamp((vh - nt) / vh) : 0;
    if (cur._p === p) continue;
    cur._p = p;
    cur._shade.style.opacity = (p * 0.6).toFixed(3);
    if (motion) {
      cur.style.transform = p ? `scale(${(1 - p * 0.06).toFixed(4)})` : '';
      cur.style.transformOrigin = '50% 0';
    }
  }

  // photo section: window expands to full-bleed at mid-scroll, statement lines slide apart
  const ex = expand();
  let e = 0;
  if (ex) {
    const top = ex._top - scrollY;
    const t = clamp((vh - top) / (ex.offsetHeight + vh));
    if (motion) {
      e = smooth(clamp(1 - Math.abs(t - 0.5) / 0.25));
      $$('[data-slide]', ex).forEach((el) => {
        el.style.transform = `translate3d(${(Number(el.dataset.slide) * (t - 0.5) * 28).toFixed(2)}vw, 0, 0)`;
      });
    }
  }
  drawBezel(e);

  // pinned horizontal card track
  $$('[data-hscroll]').forEach((sec) => {
    if (!sec._travel || sec.offsetParent === null) return;
    const t = clamp(-(sec._top - scrollY) / (sec.offsetHeight - vh));
    $('.hs-track', sec).style.transform = `translate3d(${(-t * sec._travel).toFixed(1)}px, 0, 0)`;
  });

  // footer wordmark slides into place
  const wm = $('#wordmark');
  if (wm && motion) {
    const r = wm.getBoundingClientRect();
    const t = clamp((vh - r.top) / (vh * 0.8));
    wm.style.transform = `translate3d(${((1 - smooth(t)) * 45).toFixed(2)}%, 0, 0)`;
  }
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });

/* ---------- calculator (any number of instances) ---------- */
$$('.calc').forEach((calc) => {
  const val = (k) => Number($(`[data-calc="${k}"]`, calc).value) || 0;
  const out = (k) => $(`[data-out="${k}"]`, calc);
  const money = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;
  const update = () => {
    const loan = Math.max(val('price') - val('deposit'), 0);
    const r = val('rate') / 100 / 12;
    const n = val('term') * 12;
    out('loan').textContent = money(loan);
    if (!loan || n <= 0) { out('monthly').textContent = '£0'; return; }
    const m = r === 0 ? loan / n : (loan * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    out('monthly').textContent = money(m);
  };
  calc.addEventListener('input', update);
  update();
});

route();
