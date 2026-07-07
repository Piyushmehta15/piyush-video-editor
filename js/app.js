import { CATEGORIES, renderCategoryChips, getYouTubeEmbedUrl, buildPortfolioCard, attachModalOpenHandlers } from './portfolio.js';

const $ = (sel) => document.querySelector(sel);

const loadingEl = $('#loading');
const gridEl = $('#portfolioGrid');
const emptyEl = $('#portfolioEmpty');
const searchInput = $('#searchInput');
const filtersEl = document.querySelector('.filters');

const modal = $('#videoModal');
const modalPlayer = $('#modalPlayer');
const modalTitle = $('#modalTitle');
const modalSub = $('#modalSub');

let allVideos = [];
let activeCategory = 'All';
let activeQuery = '';

function setLoadingDone() {
  if (!loadingEl) return;
  loadingEl.style.opacity = '0';
  loadingEl.style.transition = 'opacity .35s ease';
  setTimeout(() => loadingEl.remove(), 420);
}

function getFilteredVideos() {
  const q = activeQuery.trim().toLowerCase();

  return allVideos.filter((v) => {
    const catOk = activeCategory === 'All' || (v.category || '') === activeCategory;
    if (!catOk) return false;

    if (!q) return true;
    const title = (v.title || '').toLowerCase();
    return title.includes(q);
  });
}

function renderPortfolio() {
  const items = getFilteredVideos();
  gridEl.innerHTML = '';

  if (!items.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  const frag = document.createDocumentFragment();
  for (const item of items) {
    frag.appendChild(buildPortfolioCard(item));
  }
  gridEl.appendChild(frag);
}

function openModalFromDataset(ds) {
  const title = ds.title || 'Video';
  const category = ds.category || '';
  const platform = ds.platform || '';
  const duration = ds.duration || '';
  const youtubeURL = ds.youtube || '';

  modalTitle.textContent = title;
  modalSub.textContent = [category, platform, duration].filter(Boolean).join(' • ');

  const embedUrl = getYouTubeEmbedUrl(youtubeURL);
  modalPlayer.innerHTML = embedUrl
    ? `<iframe
        title="${title}"
        src="${embedUrl}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>`
    : `<p style="color:rgba(255,255,255,.72);padding:14px">Video not available.</p>`;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');

  // Accessibility: focus close button
  const closeBtn = modal.querySelector('[data-close="true"]');
  closeBtn?.focus();
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  // Stop playback by removing iframe.
  modalPlayer.innerHTML = '';
}

async function loadPortfolioJson() {
  const res = await fetch('./data/portfolio.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load portfolio.json: ${res.status}`);
  return res.json();
}

function setupCounters() {
  const statEls = Array.from(document.querySelectorAll('[data-count]'));
  if (!statEls.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animate = (el) => {
    const target = Number(el.dataset.count || 0);
    const duration = 900;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.floor(target * eased);
      el.textContent = val.toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    };

    if (prefersReduced) {
      el.textContent = target.toLocaleString();
      return;
    }
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      animate(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: 0.35 });

  for (const el of statEls) io.observe(el);
}

function setupBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  const onScroll = () => {
    const show = window.scrollY > 600;
    btn.classList.toggle('is-visible', show);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function setupNav() {
  const toggle = $('#navToggle');
  const mobile = $('#navMobile');
  const links = Array.from(document.querySelectorAll('.nav__link[data-nav]'));

  const setActive = (id) => {
    links.forEach(a => a.classList.toggle('is-active', a.dataset.nav === id));
  };

  // Mobile toggle
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const isOpen = mobile.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobile.addEventListener('click', (e) => {
      const t = e.target;
      const a = t && t.closest && t.closest('.nav__mobileLink');
      if (!a) return;
      mobile.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  // Scrollspy
  const sectionIds = ['home', 'portfolio', 'services', 'about', 'testimonials', 'contact'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  const io = new IntersectionObserver((entries) => {
    // choose most visible
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => (b.intersectionRatio - a.intersectionRatio))[0];
    if (!visible) return;
    setActive(visible.target.id);
  }, { threshold: [0.2, 0.35, 0.5] });

  for (const s of sections) io.observe(s);
}

function setupRipple() {
  document.addEventListener('pointermove', () => {}, { passive: true });

  const buttons = document.querySelectorAll('[data-ripple]');
  buttons.forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--x', `${x}%`);
      btn.style.setProperty('--y', `${y}%`);
    }, { passive: true });
  });
}

function setupModal() {
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.getAttribute('data-close') === 'true') {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
  });

  // Space to pause/play (best-effort). YouTube iframe API not used; so just keep minimal.
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key !== ' ') return;
    // Without YouTube Player API we cannot reliably control playback.
    // We intentionally keep this as a no-op for reliability.
  });
}

function setupPortfolioFiltersAndSearch() {
  renderCategoryChips(filtersEl, (cat) => {
    activeCategory = cat;
    renderPortfolio();
  });

  searchInput?.addEventListener('input', (e) => {
    activeQuery = e.target.value || '';
    renderPortfolio();
  });
}

function setupCopyEmail() {
  const copyBtn = $('#copyEmail');
  const emailEl = $('#emailText');
  if (!copyBtn || !emailEl) return;

  copyBtn.addEventListener('click', async () => {
    const email = (emailEl.textContent || '').trim();
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      copyBtn.textContent = '✓';
      setTimeout(() => (copyBtn.textContent = '⧉'), 1100);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      copyBtn.textContent = '✓';
      setTimeout(() => (copyBtn.textContent = '⧉'), 1100);
    }
  });
}

function setupYear() {
  const y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());
}

async function boot() {
  try {
    const data = await loadPortfolioJson();
    allVideos = Array.isArray(data) ? data : (data?.items || []);
  } catch {
    allVideos = [];
  }

  renderPortfolio();
  setupPortfolioFiltersAndSearch();
  setupCounters();
  setupBackToTop();
  setupNav();
  setupRipple();
  setupModal();
  setupCopyEmail();
  setupYear();

  attachModalOpenHandlers(gridEl, (ds) => {
    openModalFromDataset(ds);
  });

  setLoadingDone();
}

boot();

