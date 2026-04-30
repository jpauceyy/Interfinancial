import './index.css';

// 1. Hash Routing
function handleHashChange() {
  const hash = window.location.hash || '#home';
  const pageId = hash.replace('#', '');
  
  // Hide all pages
  document.querySelectorAll('.page-container').forEach((el: Element) => {
    (el as HTMLElement).style.display = 'none';
  });
  
  // Show active page
  const activePage = document.getElementById(`page-${pageId}`);
  if (activePage) {
    activePage.style.display = 'block';
  } else {
    // fallback to home
    const homePage = document.getElementById('page-home');
    if (homePage) homePage.style.display = 'block';
  }
  
  // Update nav active states
  document.querySelectorAll('.nav-links a, .mobile-link').forEach((el: Element) => {
    const a = el as HTMLAnchorElement;
    if (a.getAttribute('href') === hash) {
      a.classList.add('text-primary-600');
      a.classList.remove('text-slate-600');
    } else {
      a.classList.remove('text-primary-600');
      a.classList.add('text-slate-600');
    }
  });

  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', handleHashChange);
// Initial load
handleHashChange();

// 2. Mobile Menu
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    if (mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.remove('hidden');
      mobileMenu.classList.add('flex');
    } else {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
    }
  });

  // Close menu when a link is clicked
  const mobileLinks = mobileMenu.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
    });
  });
}

// 3. Calculator
function calculateMortgage() {
  const priceInput = document.getElementById('calc-price') as HTMLInputElement | null;
  const depositInput = document.getElementById('calc-deposit') as HTMLInputElement | null;
  const rateInput = document.getElementById('calc-rate') as HTMLInputElement | null;
  const termInput = document.getElementById('calc-term') as HTMLInputElement | null;
  const monthlyEl = document.getElementById('calc-monthly');
  const loanEl = document.getElementById('calc-loan');

  if (!priceInput || !depositInput || !rateInput || !termInput || !monthlyEl || !loanEl) return;

  const p = Number(priceInput.value) || 0;
  const d = Number(depositInput.value) || 0;
  const r = Number(rateInput.value) || 0;
  const t = Number(termInput.value) || 0;

  const principal = p - d;
  loanEl.textContent = `£${principal > 0 ? principal.toLocaleString() : 0}`;

  if (principal <= 0 || r <= 0 || t <= 0) {
    monthlyEl.textContent = '£0';
    return;
  }

  const monthlyRate = r / 100 / 12;
  const numberOfPayments = t * 12;
  
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  monthlyEl.textContent = `£${Math.round(monthlyPayment).toLocaleString()}`;
}

['calc-price', 'calc-deposit', 'calc-rate', 'calc-term'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', calculateMortgage);
  }
});

