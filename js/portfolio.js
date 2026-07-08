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

export function getYoutubeVideoId(input) {
  if (!input) return '';
  const s = String(input).trim();

  // If already an ID (exactly 11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  // Parse URL when possible (covers shorts/, watch/, embed/)
  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`);
    const host = url.hostname.replace(/^www\./, '');

    // youtu.be/<id>
    if (host === 'youtu.be') {
      const p = url.pathname.split('/').filter(Boolean)[0];
      const id = p?.match(/^[a-zA-Z0-9_-]{11}/)?.[0];
      if (id) return id;
    }

    // youtube.com/watch?v=<id>
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = url.searchParams.get('v');
      const idFromV = v?.match(/^[a-zA-Z0-9_-]{11}/)?.[0];
      if (idFromV) return idFromV;

      // youtube.com/shorts/<id>
      const shortsPath = url.pathname.match(/\/shorts\/([^/?#]+)/);
      if (shortsPath?.[1]) {
        const id = shortsPath[1].match(/^[a-zA-Z0-9_-]{11}/)?.[0];
        if (id) return id;
      }

      // youtube.com/embed/<id>
      const embedPath = url.pathname.match(/\/embed\/([^/?#]+)/);
      if (embedPath?.[1]) {
        const id = embedPath[1].match(/^[a-zA-Z0-9_-]{11}/)?.[0];
        if (id) return id;
      }

      // Sometimes people pass /<id> as the path
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      const id = last?.match(/^[a-zA-Z0-9_-]{11}/)?.[0];
      if (id) return id;
    }
  } catch {
    // ignore, regex fallbacks below
  }

  // Regex fallbacks (handle malformed watch params like: watch?v=<id>?feature=share)
  // watch?v=
  const watchMatch = s.match(/[?&]v=([^&#]+)/);
  if (watchMatch?.[1]) {
    const id = watchMatch[1].match(/^[a-zA-Z0-9_-]{11}/)?.[0];
    if (id) return id;
  }

  // youtu.be/
  const shortMatch = s.match(/youtu\.be\/([^?&#/]+)/);
  if (shortMatch?.[1]) {
    const id = shortMatch[1].match(/^[a-zA-Z0-9_-]{11}/)?.[0];
    if (id) return id;
  }

  // /shorts/
  const shortsMatch = s.match(/\/shorts\/([^?&#/]+)/);
  if (shortsMatch?.[1]) {
    const id = shortsMatch[1].match(/^[a-zA-Z0-9_-]{11}/)?.[0];
    if (id) return id;
  }

  // /embed/
  const embedMatch = s.match(/\/embed\/([^?&#/]+)/);
  if (embedMatch?.[1]) {
    const id = embedMatch[1].match(/^[a-zA-Z0-9_-]{11}/)?.[0];
    if (id) return id;
  }

  // Final: extract first valid 11-char token
  const anyIdMatch = s.match(/([a-zA-Z0-9_-]{11})/);
  if (anyIdMatch?.[1]) return anyIdMatch[1];

  console.warn('[portfolio] Invalid YouTube URL/ID, cannot extract video id:', input);
  return '';
}

function normalizeYoutubeId(input) {
  return getYoutubeVideoId(input);
}




export function getYouTubeEmbedUrl(youtubeURL) {
  const id = normalizeYoutubeId(youtubeURL);
  if (!id) return '';
  // Autoplay + modest branding.
  // Note: mute=0 is default; some browsers may block autoplay with sound.
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
}

function normalizeThumbId(youtubeURLOrId) {
  return normalizeYoutubeId(youtubeURLOrId);
}

export function getYouTubeThumbnail(youtubeURLOrId) {
  const id = normalizeThumbId(youtubeURLOrId);
  if (!id) return '';
  // Use img.youtube.com per requirement
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

export function getYouTubeThumbnailFallback(youtubeURLOrId) {
  const id = normalizeThumbId(youtubeURLOrId);
  if (!id) return '';
  // Fallback thumbnail
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



function getPlatformAndTypeFromUrl(url) {
  const s = String(url || '').toLowerCase();

  const platform = (() => {
    if (s.includes('youtube.com') || s.includes('youtu.be')) return 'YouTube';
    if (s.includes('instagram.com')) return 'Instagram';
    if (s.includes('vimeo.com')) return 'Vimeo';
    return 'Local';
  })();

  const contentType = (() => {
    // Priority: explicit platform-specific paths first

    // YouTube
    if (s.includes('youtube.com') || s.includes('youtu.be')) {
      if (s.includes('/shorts/')) return 'Shorts';
      if (s.includes('/embed/')) return 'Long Form';
      return 'Long Form';
    }

    // Instagram
    if (s.includes('instagram.com')) {
      // Reels: /reel/<id> or /reels/<id>
      if (s.includes('/reel/')) return 'Reels';
      if (s.includes('/reels/')) return 'Reels';
      // Posts: /p/<id>
      if (s.includes('/p/')) return 'Post';
      return 'Post';
    }

    // TikTok
    if (s.includes('tiktok.com')) {
      return 'TikTok';
    }

    // Vimeo
    if (s.includes('vimeo.com')) {
      return 'Long Form';
    }

    // Local
    if (s.includes('.mp4') || s.includes('.webm') || s.includes('.ogg') || s.includes('.mkv')) {
      return 'Video';
    }

    console.warn('[portfolio] Could not determine content type from URL:', url);
    return 'Video';
  })();


  return { platform, contentType };
}

export function buildPortfolioCard(item) {

  const rawUrl = item.url || item.videoURL || item.URL || item.youtubeURL || '';

  const { platform, contentType } = getPlatformAndTypeFromUrl(rawUrl);

  const thumbCustom = (item.thumbnail || '').trim();
  const thumb = thumbCustom
    ? thumbCustom
    : (platform === 'YouTube'
        ? getYouTubeThumbnail(rawUrl)
        : '');

  const category = contentType;


  const el = document.createElement('article');
  el.className = 'card pcard';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `Play: ${item.title}`);

  // Store data for modal
  el.dataset.title = item.title || '';
  el.dataset.category = category;
  el.dataset.platform = platform;


  el.dataset.description = item.description || '';
  el.dataset.url = item.url || item.URL || '';
  el.dataset.youtube = item.url || item.URL || '';
  el.dataset.ig = item.url || item.URL || item.igURL || '';


  el.innerHTML = `
    <div class="pcard__thumbWrap">
      <img
        class="pcard__thumb"
        loading="lazy"
        decoding="async"
        src="${escapeHtml(thumb)}"
        data-thumb-fallback="${escapeHtml(getYouTubeThumbnailFallback(item.url || item.youtubeURL || ''))}"
        alt="${escapeHtml(item.title || 'Video thumbnail')}" >

      <div class="pcard__shade" aria-hidden="true"></div>
      <div class="pcard__play" aria-hidden="true">▶</div>
    </div>

    <div class="pcard__content">
      <h3 class="pcard__title">${escapeHtml(item.title || '')}</h3>
      <div class="pcard__meta">
        <span class="pcard__pill">${escapeHtml(category)}</span>
        <span class="pcard__pill pcard__pill--accent">${escapeHtml(platform)}</span>
      </div>
    </div>
  `;


  return el;
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

