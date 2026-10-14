import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import './index.css';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }),
  { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
);

/* ---------- hash routing ---------- */
const pages = $$('.page');
const navLinks = $$('[data-nav]');
const ctaBand = $('#cta-band');
const nav = $('#nav');

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
  $$('.rv:not(.in)', page).forEach((el) => io.observe(el));
  if (!ctaBand.hidden) $$('.rv:not(.in)', ctaBand).forEach((el) => io.observe(el));

  navLinks.forEach((a) => {
    const on = a.getAttribute('href') === `#${pageId}`;
    a.classList.toggle('bg-night', on);
    a.classList.toggle('text-white', on);
  });
  setMenu(false);

  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }));
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

/* ---------- nav shadow once scrolled ---------- */
addEventListener('scroll', () => nav.classList.toggle('shadow-lg', scrollY > 40), { passive: true });

/* ---------- hero image drift (transform only, rAF-throttled) ---------- */
const drift = $$('[data-drift]');
if (drift.length && !reduceMotion) {
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(scrollY, 900);
      drift.forEach((el) => { el.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(1.08)`; });
      ticking = false;
    });
  }, { passive: true });
}

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
