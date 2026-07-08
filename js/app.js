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

  // Toggle 9:16 for Shorts category
  gridEl.classList.toggle('is-shorts', activeCategory === 'Shorts');

  // Thumbnail fallback: if maxres fails (404), try the fallback once.
  for (const img of gridEl.querySelectorAll('img[data-thumb-fallback]')) {
    const fallback = img.getAttribute('data-thumb-fallback') || '';
    if (!fallback) continue;

    // Avoid duplicate listeners when re-rendering
    if (img.dataset.fallbackBound === '1') continue;
    img.dataset.fallbackBound = '1';

    img.addEventListener('error', () => {
      // If maxres fails, switch to hqdefault.
      if (img.dataset.thumbTried === '1') return;
      img.dataset.thumbTried = '1';
      img.src = fallback;
    }, { once: true });
  }





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

  const url = ds.url || ds.youtube || ds.ig || '';

  // For backwards compatibility with older dataset keys.
  const youtubeURL = ds.youtube || (url || '');
  const instagramURL = ds.ig || url || '';




  modalTitle.textContent = title;
  modalSub.textContent = [category, platform].filter(Boolean).join(' • ');


  const embedUrl = getYouTubeEmbedUrl(youtubeURL);

  // Instagram: embed as iframe when URL is provided.
  // Note: Instagram embed sometimes blocks embedding in some contexts.
  const instagramEmbedUrl = instagramURL
    ? instagramURL
        // remove query params
        .split('?')[0]
    : '';


  const actualYoutubeUrl = youtubeURL || url || '';
  if (embedUrl || actualYoutubeUrl) {
    modalPlayer.innerHTML = `<iframe
        title="${title}"
        src="${embedUrl}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>`;
  } else if (instagramEmbedUrl) {
    modalPlayer.innerHTML = `<iframe
        title="${title}"
        src="${instagramEmbedUrl}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>`;
  } else {
    modalPlayer.innerHTML = `<p style="color:rgba(255,255,255,.72);padding:14px">Video not available.</p>`;
  }

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');

  // Accessibility: focus close button
  const closeBtn = modal.querySelector('[data-close="true"]');
  closeBtn?.focus();
}

function setupHeroFeaturedVideo() {
  const card = document.getElementById('heroFeatured');
  const video = document.getElementById('heroFeaturedVideo');
  if (!card || !video) return;

  // Ensure it tries to play on load (muted autoplay should work)
  video.muted = true;
  video.loop = true;

  const setFailed = () => {
    card.classList.add('is-failed');
  };

  video.addEventListener('error', setFailed, { once: true });

  // Best-effort autoplay
  const p = video.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      // Autoplay may be blocked; don't crash.
    });
  }

  // Click: open modal using the featured mp4
  card.addEventListener('click', () => {
    // Populate modal with Local MP4
    modalTitle.textContent = 'Featured Video';
    modalSub.textContent = ['Video', 'Local'].join(' • ');
    // Use <video> tag inside modal for local playback.
    modalPlayer.innerHTML = `
      <video
        controls
        preload="metadata"
        playsinline
        style="width:100%;height:100%;display:block;object-fit:contain;"
      >
        <source src="./media/WhatsApp Video 2026-07-07 at 18.21.17.mp4" type="video/mp4" />
      </video>
    `;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    const closeBtn = modal.querySelector('[data-close="true"]');
    closeBtn?.focus();
  });
}





function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  // Stop playback by removing iframe.
  modalPlayer.innerHTML = '';
}

async function loadPortfolioJson() {
  const res = await fetch('./data/portfolio_v2.json', { cache: 'no-store' });
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



