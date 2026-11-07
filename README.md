# Project 04 — Capstone: API Showcase Portfolio

> **🛠️ Stack for this lesson** — Vanilla JS / browser fetch / 2+ public APIs of your choice.
> 📥 Template: [/learn/w35/template/project-04-portfolio-capstone](/learn/w35/template/project-04-portfolio-capstone)

The capstone for W35. Pick 2+ APIs that interest you and build a polished, dual-panel app that puts everything you've learned together: fetch, parsing, caching, error handling, pagination, search, filters, favorites, and a deployment. The HTML, CSS (with dark mode), pagination UI, modal, and state structure are wired up. You write the integration layer and the polish.

**Time:** ~6–8 hours · **Concept:** Capstone for the entire course

---

## Pick Your APIs

Six suggested combinations — or invent your own. The shape of the codebase assumes one **primary** and one **secondary** API.

| # | Pair | What it's for |
|---|------|---------------|
| 1 | NewsAPI + OpenWeatherMap | news with weather context |
| 2 | TMDB + OMDB | movie/TV cross-reference |
| 3 | Spoonacular + Nutritionix | recipes with nutrition |
| 4 | GitHub + Stack Overflow | developer trends |
| 5 | Spotify/Last.fm + Genius | music + lyrics |
| 6 | CoinGecko + NewsAPI | crypto with financial news |

Don't over-pick — one of these is enough. Document your choice in your reflection.

## What You'll Build

Eight TODOs in `script.js`:

| # | TODO | Where |
|---|------|-------|
| 1 | API keys + config | top of `script.js` |
| 2 | `fetchPrimaryAPI` + `fetchSecondaryAPI` with pagination | API fetch section |
| 3 | Category filter + sort | `applyFilters` + sort code |
| 4 | Search across both panels | `searchData` |
| 5 | Cache get/set + favorites in `localStorage` | cache + favorites section |
| 6 | Toast/error UX (already partly done — finish the empty states) | display section |
| 7 | Modal detail view (click a card → full detail) | modal section |
| 8 | List view layout toggle (alongside the existing grid) | rendering section |

## Run It

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Required

1. **Two real APIs**, both producing live data (sample data is for scaffolding only — remove it).
2. **Pagination** works on both panels (≥3 pages).
3. **Search** filters both panels in real time.
4. **Filter + sort** dropdowns work and compose with search.
5. **Favorites** persist across reloads (`localStorage`).
6. **Cache** any fetched response with a TTL (≥5 min).
7. **Dark mode** toggle persists (already wired — just confirm it survives reloads).
8. **Detail view** modal shows full info on card click.
9. **Deploy** the final version to Vercel and paste the live URL into the README.

## Suggested Time Split

- 30 min: pick APIs, get keys, smoke-test endpoints in DevTools
- 90 min: TODOs 1, 2 (config + fetch with pagination)
- 60 min: TODOs 3, 4 (filter, sort, search)
- 60 min: TODO 5 (cache + favorites)
- 45 min: TODOs 6, 7, 8 (UX polish)
- 60 min: deploy + write the README live URL section

## Verify

- [ ] Both panels show real data from their respective APIs (Network tab confirms).
- [ ] Paging forward fetches more results; paging back returns to earlier ones.
- [ ] Search narrows both panels simultaneously.
- [ ] At least one filter and one sort option work, including in combination with search.
- [ ] Favoriting an item, refreshing, and reopening shows the same favorites.
- [ ] Re-fetching the same query within the cache TTL hits cache (visible as a cache-hit log or stat).
- [ ] Clicking a card opens a modal with full details and a close button.
- [ ] Switching to list view shows a different layout; switching back returns to grid.
- [ ] Production URL on Vercel returns the same UI without console errors.

## Stretch

Pick one and write a short note in your reflection about what you tried:
- Add a **chart** that visualizes some derived metric (Chart.js — you wrote one in Activity 07).
- Add **Service Worker** offline support (cache the shell + last 5 fetched pages).
- Add **error monitoring** with Sentry (Vercel marketplace).

## Grading Rubric

| Category | Weight | What we look for |
|----------|--------|-----------------|
| Two real APIs integrated | 20% | Both backed by real data; no mock leftovers |
| Pagination | 10% | At least 3 pages per panel |
| Search + filters | 15% | Compose correctly; real-time |
| Caching | 10% | TTL respected; cache hits logged |
| Favorites + persistence | 10% | Survive reload |
| UX polish | 15% | Loading, empty, error, modal, list/grid toggle, dark mode |
| Deployment | 10% | Live URL in README; HTTPS; no console errors |
| Code quality | 10% | No commented-out solutions; clear structure |

## 🪞 Reflect on Your Work

Answer in 2-3 sentences each, in this README under your TODO commits. Your tutor reads these as part of grading.

1. **What did you learn that you didn't know before?** Pick the most surprising thing across the whole project — one of the APIs surprised you, the cache TTL hit a corner case, your deploy revealed a bug local dev hid.
2. **How did you collaborate with AI?** If you used Claude / ChatGPT / Cursor / Copilot, what part of the work did *you* contribute — the prompt, the verification, the design decision, the bug-fix? If you didn't use AI, what was the hardest thing to figure out alone?
3. **How do you know your code works?** Describe one specific thing you did to confirm — comparing to live data, recording timing of cached vs uncached, sharing the deployed URL with someone else and watching them use it.

> AI is a great collaborator. Owning your thinking, verifying the output, and explaining your design choices is what *learning* looks like in this course.

## Submit

When the Verify checklist is green, paste your **live Vercel URL** at the top of this README, then head to **[/learn/w35/certification](/learn/w35/certification)** and submit. Include a 60-second screen recording demoing search → filter → modal → favorite → page change.

<!-- claude-template-fix: readme-v3 -->
