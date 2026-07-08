# TODO

- [x] Locate how portfolio cards render and how modal opens content.
- [x] Identify that portfolio.json items use `URL` for Instagram but code only reads `youtubeURL`.
- [x] Add Instagram support in `js/portfolio.js` so modal can embed Instagram Reels when `URL`/instagram link exists.
- [x] Add parsing of platform/type from Instagram URLs for filtering/category chips (uses existing URL detection).
- [x] Update `openModalFromDataset` to render:
  - YouTube iframe when YouTube URL/ID is present
  - Instagram embed iframe when Instagram URL is present
  - Fallback message otherwise
- [ ] Verify in browser that Instagram card opens correctly from the Portfolio section.


