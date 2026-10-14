import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import './index.css';

const pages = Array.from(document.querySelectorAll<HTMLElement>('.page'));
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav a, .mobile-menu a:not(.btn)'));
const header = document.getElementById('site-header')!;
const menuBtn = document.getElementById('menu-btn')!;
const menu = document.getElementById('mobile-menu')!;
const ctaBand = document.getElementById('cta-band')!;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Calculator partial -> every slot
const tpl = document.getElementById('calculator-tpl') as HTMLTemplateElement;
document.querySelectorAll<HTMLElement>('[data-slot="calculator"]').forEach((slot) => {
  slot.appendChild(tpl.content.cloneNode(true));
});

// Reveal on scroll (one shared observer, transform/opacity only)
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
);
const observeVisible = (page: HTMLElement) =>
  page.querySelectorAll('.rv:not(.in)').forEach((el) => io.observe(el));

// Hash routing: #page-name shows a page, any other #id scrolls to that element's page
function route() {
  const id = decodeURIComponent(location.hash.slice(1)) || 'home';
  let page = document.getElementById(`page-${id}`) as HTMLElement | null;
  let target: HTMLElement | null = null;
  if (!page) {
    target = document.getElementById(id);
    page = target?.closest<HTMLElement>('.page') ?? document.getElementById('page-home');
  }
  const pageId = page!.id.replace('page-', '');
  pages.forEach((p) => (p.hidden = p !== page));
  ctaBand.hidden = pageId === 'contact';
  observeVisible(page!);

  navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${pageId}`));
  setMenu(false);

  if (target) {
    requestAnimationFrame(() => target!.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }));
  } else {
    window.scrollTo(0, 0);
  }
  document.title = pageId === 'home' ? 'Interfinancial | Independent Mortgage & Insurance Brokers, Market Drayton' : `${page!.querySelector('.kicker')?.textContent ?? 'Interfinancial'} | Interfinancial`;
}
addEventListener('hashchange', route);

// Mobile menu
function setMenu(open: boolean) {
  menu.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuBtn.querySelector('use')!.setAttribute('href', open ? '#i-close' : '#i-menu');
  document.body.style.overflow = open ? 'hidden' : '';
}
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

// Header hairline once scrolled
addEventListener('scroll', () => header.classList.toggle('is-stuck', scrollY > 8), { passive: true });

// Calculator (works for any number of instances)
document.querySelectorAll<HTMLElement>('.calc').forEach((calc) => {
  const val = (k: string) => Number(calc.querySelector<HTMLInputElement>(`[data-calc="${k}"]`)!.value) || 0;
  const out = (k: string) => calc.querySelector<HTMLElement>(`[data-out="${k}"]`)!;
  const money = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;
  const update = () => {
    const loan = Math.max(val('price') - val('deposit'), 0);
    const r = val('rate') / 100 / 12;
    const n = val('term') * 12;
    out('loan').textContent = money(loan);
    if (!loan || n <= 0) return void (out('monthly').textContent = '£0');
    const m = r === 0 ? loan / n : (loan * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    out('monthly').textContent = money(m);
  };
  calc.addEventListener('input', update);
  update();
});

route();
