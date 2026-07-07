export const CATEGORIES = [
  'Long Form',
  'Shorts',
  'Podcast',
  'Gaming',
  'Cinematic',
  'Commercial',
  'Documentary',
  'Motion Graphics'
];

function normalizeYoutubeId(input) {
  if (!input) return '';
  const s = String(input).trim();

  // If already an ID (no separators)
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  // youtube.com/watch?v=
  const watchMatch = s.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return watchMatch[1];

  // youtu.be/<id>
  const shortMatch = s.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) return shortMatch[1];

  // /embed/<id>
  const embedMatch = s.match(/\/embed\/([^?&/]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  return '';
}

export function getYouTubeEmbedUrl(youtubeURL) {
  const id = normalizeYoutubeId(youtubeURL);
  if (!id) return '';
  // Autoplay + modest branding.
  // Note: mute=0 is default; some browsers may block autoplay with sound.
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
}

export function getYouTubeThumbnail(youtubeURLOrId) {
  const id = normalizeYoutubeId(youtubeURLOrId);
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function renderCategoryChips(filtersEl, onSelect) {
  const frag = document.createDocumentFragment();

  // Always include All first
  const allBtn = document.createElement('button');
  allBtn.className = 'chip chip--active';
  allBtn.type = 'button';
  allBtn.dataset.filter = 'All';
  allBtn.textContent = 'All';
  frag.appendChild(allBtn);

  for (const c of CATEGORIES) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.dataset.filter = c;
    btn.textContent = c;
    frag.appendChild(btn);
  }

  filtersEl.innerHTML = '';
  filtersEl.appendChild(frag);

  filtersEl.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const chip = t.closest('button[data-filter]');
    if (!chip) return;

    for (const b of filtersEl.querySelectorAll('button.chip')) {
      b.classList.remove('chip--active');
    }
    chip.classList.add('chip--active');

    onSelect(chip.dataset.filter || 'All');
  }, { passive: true });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}



export function buildPortfolioCard(item) {
  const thumbCustom = (item.thumbnail || '').trim();
  const thumb = thumbCustom ? thumbCustom : getYouTubeThumbnail(item.youtubeURL);
  const category = item.category || '';
  const platform = item.platform || inferPlatformFromCategory(category);

  const el = document.createElement('article');
  el.className = 'card pcard';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `Play: ${item.title}`);

  // Store data for modal
  el.dataset.title = item.title || '';
  el.dataset.category = category;
  el.dataset.platform = platform;
  el.dataset.duration = item.duration || '';
  el.dataset.description = item.description || '';
  el.dataset.youtube = item.youtubeURL || '';

  el.innerHTML = `
    <div class="pcard__thumbWrap">
      <img class="pcard__thumb" loading="lazy" decoding="async" src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title || 'Video thumbnail')}">
      <div class="pcard__shade" aria-hidden="true"></div>
      <div class="pcard__play" aria-hidden="true">▶</div>
    </div>
    <div class="pcard__content">
      <h3 class="pcard__title">${escapeHtml(item.title || '')}</h3>
      <div class="pcard__meta">
        <span class="pcard__pill">${escapeHtml(category)}</span>
        <span class="pcard__pill pcard__pill--accent">${escapeHtml(platform)}</span>
        <span class="pcard__pill">${escapeHtml(item.duration || '')}</span>
      </div>
    </div>
  `;


  return el;
}

export function inferPlatformFromCategory(category) {
  // This app asks for platform; allow JSON to override via item.platform.
  // If missing, use category heuristic (optional).
  const c = String(category).toLowerCase();
  if (c.includes('short')) return 'Shorts';
  if (c.includes('podcast')) return 'Podcast';
  return 'YouTube';
}

export function attachModalOpenHandlers(gridEl, onOpen) {
  gridEl.addEventListener('click', (e) => {
    const card = (e.target instanceof Element) ? e.target.closest('.pcard') : null;
    if (!card) return;
    onOpen(card.dataset);
  });

  gridEl.addEventListener('keydown', (e) => {
    const card = (e.target instanceof Element) ? e.target.closest('.pcard') : null;
    if (!card) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(card.dataset);
    }
  });
}

