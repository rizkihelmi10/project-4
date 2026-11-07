// W35 Project 04 — API Showcase Portfolio (capstone)
// Two data sources side by side, with paging, cache, search, filters and favorites.
// 6 TODOs: pair config, fetch + paging, filter + sort, search, cache + favourites, list view.
// Verify: the page loads with sample cards in both panels and no error banner. The preview allows 20 API calls per run: press Refresh to start a new run.

// ===================================
// Helpers for the data sources (PRE-BUILT)
// ===================================

// A picture drawn in code, so no outside placeholder site is needed.
function placeholderImage(label) {
    const safe = String(label).replace(/[<>&"]/g, '');
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="300" height="180" fill="#e2e8f0"/>'
        + '<text x="150" y="98" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#475569">' + safe + '</text></svg>'
    );
}

async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
    return response.json();
}

// ===================================
// Loaders: one per data source (PRE-BUILT)
// Each loader takes a page number and answers { items, totalPages }, where every item has
// { id, title, description, image, category, date, timestamp, author, url }.
// The preview allows 20 API calls per run, so every loader fetches only a few items per page.
// ===================================

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';
const NEWS_PER_PAGE = 3;

async function loadHackerNews(page) {
    const ids = await getJson(`${HN_BASE}/topstories.json`);
    const start = (page - 1) * NEWS_PER_PAGE;
    const stories = await Promise.all(ids.slice(start, start + NEWS_PER_PAGE).map(id => getJson(`${HN_BASE}/item/${id}.json`)));
    return {
        items: stories.map(story => ({
            id: `hn-${story.id}`,
            title: story.title,
            description: `${story.score} points · ${story.descendants ?? 0} comments`,
            image: placeholderImage(`${story.score} pts`),
            category: story.type || 'story',
            date: new Date(story.time * 1000).toLocaleDateString(),
            timestamp: story.time * 1000,
            author: story.by,
            url: story.url || '#'
        })),
        totalPages: Math.min(5, Math.ceil(ids.length / NEWS_PER_PAGE))
    };
}

const WEATHER_CITIES = ['Kuala Lumpur', 'Penang', 'Kuching', 'Kota Kinabalu', 'Johor Bahru', 'Ipoh'];
const CITIES_PER_PAGE = 3;

async function loadWeather(page) {
    const start = (page - 1) * CITIES_PER_PAGE;
    const cities = WEATHER_CITIES.slice(start, start + CITIES_PER_PAGE);
    const readings = await Promise.all(cities.map(city => getJson(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)));
    return {
        items: readings.map((raw, i) => {
            const now = raw.current_condition[0];
            const description = now.weatherDesc[0].value.trim();
            return {
                id: `weather-${cities[i]}`,
                title: cities[i],
                description: `${now.temp_C}°C, ${description}, humidity ${now.humidity}%`,
                image: placeholderImage(`${now.temp_C}°C`),
                category: description,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                author: 'wttr.in',
                url: '#'
            };
        }),
        totalPages: Math.ceil(WEATHER_CITIES.length / CITIES_PER_PAGE)
    };
}

const ITEMS_PER_PAGE = 6;

async function loadProducts(category, page) {
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const data = await getJson(`https://dummyjson.com/products/category/${category}?limit=${ITEMS_PER_PAGE}&skip=${skip}&select=title,description,thumbnail,rating,price,brand,category`);
    return {
        items: data.products.map(p => ({
            id: `product-${p.id}`,
            title: p.title,
            description: `$${p.price} · rated ${p.rating} / 5`,
            image: p.thumbnail || placeholderImage('No image'),
            category: p.brand || p.category,
            date: 'Recent',
            timestamp: 0,
            author: p.brand || '',
            url: '#'
        })),
        totalPages: Math.min(5, Math.max(1, Math.ceil(data.total / ITEMS_PER_PAGE)))
    };
}

async function loadRecipes(path, page) {
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const data = await getJson(`https://dummyjson.com/recipes${path}?limit=${ITEMS_PER_PAGE}&skip=${skip}&select=name,image,cuisine,rating,caloriesPerServing,difficulty`);
    return {
        items: data.recipes.map(r => ({
            id: `recipe-${r.id}`,
            title: r.name,
            description: `${r.cuisine} · ${r.caloriesPerServing} kcal per serving · ${r.difficulty}`,
            image: r.image || placeholderImage('No image'),
            category: r.cuisine,
            date: 'Recent',
            timestamp: 0,
            author: '',
            url: '#'
        })),
        totalPages: Math.min(5, Math.max(1, Math.ceil(data.total / ITEMS_PER_PAGE)))
    };
}

// ===================================
// API Configuration
// ===================================

const API_CONFIGS = {
    'news-weather': {
        primary: { name: 'Hacker News', load: loadHackerNews },
        secondary: { name: 'Weather (wttr.in)', load: loadWeather }
    },
    'phones-laptops': {
        primary: { name: 'Phones', load: page => loadProducts('smartphones', page) },
        secondary: { name: 'Laptops', load: page => loadProducts('laptops', page) }
    },
    'recipe-snacks': {
        primary: { name: 'All recipes', load: page => loadRecipes('', page) },
        secondary: { name: 'Snack recipes', load: page => loadRecipes('/meal-type/Snack', page) }
    }
    // TODO 1: add a pair of your own here, and give its button in index.html a matching
    // data-combo (the "People + Quotes" button is waiting for 'people-quotes'). Each side
    // needs { name, load } where load(page) answers { items, totalPages } like the loaders
    // above. Any of the sites listed in the lesson will do; no key is needed.
    // Verify: clicking your pair's button fills both panels with your data.
};

// ===================================
// State Management (PRE-BUILT)
// ===================================

const state = {
    currentCombo: 'news-weather',
    theme: 'light',
    view: 'grid',

    // Primary API state
    primaryData: [],
    primaryPage: 1,
    primaryTotalPages: 1,
    primaryFiltered: [],

    // Secondary API state
    secondaryData: [],
    secondaryPage: 1,
    secondaryTotalPages: 1,
    secondaryFiltered: [],

    // Search & Filter state
    searchQuery: '',
    filterCategory: 'all',
    sortBy: 'date-desc',

    // User data
    favorites: [],

    // Statistics
    stats: {
        itemsViewed: 0,
        searches: 0,
        cacheHits: 0,
        totalFavorites: 0
    }
};

// ===================================
// Cache Management
// ===================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class CacheManager {
    // TODO 5: read localStorage[key], return parsed data if younger than
    // CACHE_DURATION, else clean up + return null.
    // Verify: re-fetching within 5 min increments stats.cacheHits.
    static get(key) {
        return null;
    }

    // TODO 5: write { data, timestamp } JSON to localStorage[key].
    static set(key, data) {
        // your localStorage write here
    }

    static clear(key) {
        localStorage.removeItem(key);
    }

    static clearAll() {
        Object.keys(localStorage)
            .filter(key => key.startsWith('cache_'))
            .forEach(key => localStorage.removeItem(key));
    }
}

// ===================================
// API Fetch Functions
// ===================================

// TODO 2: fetchPrimaryAPI — use API_CONFIGS[state.currentCombo].primary.load(page), which answers
// { items, totalPages }. Check the cache first (key like `cache_${state.currentCombo}_primary_${page}`,
// count a hit in state.stats.cacheHits), otherwise load and cache the answer. Update
// state.primaryData / primaryPage / primaryTotalPages and call displayPrimaryData.
// Verify: paging shows different items; fetching the same page again within 5 minutes counts a cache hit.
async function fetchPrimaryAPI(page = 1) {
    const panelId = 'primary';
    showLoading(panelId);
    hideError(panelId);

    try {
        // your cache check + load + state update here. Replace the sample data below.
        const sampleData = generateSampleData('primary', 10);
        state.primaryData = sampleData;
        state.primaryPage = page;
        state.primaryTotalPages = 5;

        displayPrimaryData();
        hideLoading(panelId);
    } catch (error) {
        console.error('Primary API Error:', error);
        showError(panelId, error.message);
        hideLoading(panelId);
    }
}

// TODO 2 (cont.): fetchSecondaryAPI — same shape as fetchPrimaryAPI, but pulls
// from .secondary in the active config. Reuse the cache via a different key
// (e.g. `cache_${state.currentCombo}_secondary_${page}`).
async function fetchSecondaryAPI(page = 1) {
    const panelId = 'secondary';
    showLoading(panelId);
    hideError(panelId);

    try {
        const sampleData = generateSampleData('secondary', 10);
        state.secondaryData = sampleData;
        state.secondaryPage = page;
        state.secondaryTotalPages = 5;

        displaySecondaryData();
        hideLoading(panelId);
    } catch (error) {
        console.error('Secondary API Error:', error);
        showError(panelId, error.message);
        hideLoading(panelId);
    }
}

// ===================================
// Display Functions (PRE-BUILT)
// ===================================

// The category dropdown lists the categories of the items loaded in either panel.
function refreshCategoryOptions() {
    const select = document.getElementById('filterCategory');
    const categories = [...new Set([...state.primaryData, ...state.secondaryData].map(item => item.category).filter(Boolean))].sort();
    select.textContent = '';
    select.appendChild(new Option('All Categories', 'all'));
    categories.forEach(category => select.appendChild(new Option(category, category)));
    select.value = categories.includes(state.filterCategory) ? state.filterCategory : 'all';
    state.filterCategory = select.value;
}

function displayPrimaryData() {
    refreshCategoryOptions();
    const grid = document.getElementById('primaryGrid');
    const countEl = document.getElementById('primaryCount');

    // Apply filters and search
    const filteredData = applyFiltersAndSearch(state.primaryData);
    state.primaryFiltered = filteredData;

    // Update count
    countEl.textContent = `${filteredData.length} items`;

    // Clear grid
    grid.textContent = '';

    // Display items
    if (filteredData.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No items found';
        grid.appendChild(emptyMsg);
        return;
    }

    filteredData.forEach(item => {
        const card = createDataCard(item, 'primary');
        grid.appendChild(card);
    });

    updatePagination('primary');
}

function displaySecondaryData() {
    refreshCategoryOptions();
    const grid = document.getElementById('secondaryGrid');
    const countEl = document.getElementById('secondaryCount');

    // Apply filters and search
    const filteredData = applyFiltersAndSearch(state.secondaryData);
    state.secondaryFiltered = filteredData;

    // Update count
    countEl.textContent = `${filteredData.length} items`;

    // Clear grid
    grid.textContent = '';

    // Display items
    if (filteredData.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No items found';
        grid.appendChild(emptyMsg);
        return;
    }

    filteredData.forEach(item => {
        const card = createDataCard(item, 'secondary');
        grid.appendChild(card);
    });

    updatePagination('secondary');
}

function createDataCard(item, source) {
    const card = document.createElement('div');
    card.className = 'data-card';
    card.dataset.id = item.id;

    const isFavorite = state.favorites.some(fav => fav.id === item.id && fav.source === source);

    // Favorite button
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `favorite-btn ${isFavorite ? 'active' : ''}`;
    favoriteBtn.textContent = isFavorite ? '⭐' : '☆';
    favoriteBtn.onclick = (e) => toggleFavorite(e, item.id, source);

    // Image
    const img = document.createElement('img');
    img.src = item.image || placeholderImage('No image');
    img.alt = item.title || 'Item image';
    img.className = 'card-image';
    img.onerror = function () { this.src = placeholderImage('No image'); };

    // Title
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;

    // Description
    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = item.description || 'No description available';

    // Meta
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const dateSpan = document.createElement('span');
    dateSpan.textContent = item.date || 'Recent';
    const categorySpan = document.createElement('span');
    categorySpan.textContent = item.category || 'General';
    meta.appendChild(dateSpan);
    meta.appendChild(categorySpan);

    // Assemble card
    card.appendChild(favoriteBtn);
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(meta);

    // Click handler for detail view
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('favorite-btn')) {
            showDetailModal(item);
            state.stats.itemsViewed++;
            updateStats();
        }
    });

    return card;
}

// ===================================
// Filter and Search Functions
// ===================================

function applyFiltersAndSearch(data) {
    let filtered = [...data];

    // TODO 4: Implement search functionality
    // 1. Check if state.searchQuery is not empty
    // 2. Filter items where title or description contains search query (case-insensitive)
    // (handleSearch below already counts the search in state.stats.searches)
    // Verify: searching a word that appears in one card keeps only the matching cards in both panels.

    if (state.searchQuery) {
        console.log('TODO 4: Implement search filtering');
    }

    // TODO 3: Implement category filtering
    // 1. Check if state.filterCategory is not 'all'
    // 2. Filter items by category
    // Verify: choosing a category keeps only items with that category.

    if (state.filterCategory !== 'all') {
        console.log('TODO 3: Implement category filtering');
    }

    // TODO 3: Implement sorting
    // Sort based on state.sortBy value (items have a numeric `timestamp`, a `title`):
    // - 'date-desc': newest first
    // - 'date-asc': oldest first
    // - 'name-asc': A-Z
    // - 'name-desc': Z-A
    // - 'relevance': by match score
    // Verify: Name A-Z puts the cards in alphabetical order.

    console.log('TODO 3: Implement sorting logic');

    return filtered;
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    state.searchQuery = searchInput.value.trim();
    state.stats.searches++;

    // Re-display both panels with new search
    displayPrimaryData();
    displaySecondaryData();
    updateStats();
}

function handleFilterChange() {
    const categorySelect = document.getElementById('filterCategory');
    const sortSelect = document.getElementById('sortBy');

    state.filterCategory = categorySelect.value;
    state.sortBy = sortSelect.value;

    // Re-display both panels with new filters
    displayPrimaryData();
    displaySecondaryData();
}

// ===================================
// Pagination Functions
// ===================================

function updatePagination(panelId) {
    const paginationEl = document.getElementById(`${panelId}Pagination`);
    const prevBtn = document.getElementById(`${panelId}PrevBtn`);
    const nextBtn = document.getElementById(`${panelId}NextBtn`);
    const pageInfo = document.getElementById(`${panelId}PageInfo`);

    const currentPage = state[`${panelId}Page`];
    const totalPages = state[`${panelId}TotalPages`];

    // Show/hide pagination
    if (totalPages <= 1) {
        paginationEl.classList.add('hidden');
        return;
    }

    paginationEl.classList.remove('hidden');

    // Update page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    // Update button states
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function changePage(panelId, direction) {
    // TODO 2: Implement page navigation
    // 1. Work out the new page from state.primaryPage or state.secondaryPage (stay between 1 and the total)
    // 2. Call fetchPrimaryAPI() or fetchSecondaryAPI() with the new page
    // Verify: Next and Previous change the page number and the cards in that panel only.

    console.log(`TODO 2: Implement page navigation for ${panelId}, direction: ${direction}`);
}

// ===================================
// Favorites System
// ===================================

function toggleFavorite(event, itemId, source) {
    event.stopPropagation();

    // TODO 5: Implement favorites toggle
    // 1. Find the item in primaryData or secondaryData
    // 2. Check if item is already in favorites
    // 3. If yes, remove it; if no, add it (store { ...item, source })
    // 4. Update state.favorites
    // 5. Save to localStorage using saveFavorites()
    // 6. Update UI to reflect changes (displayFavorites and both panels)
    // Verify: the star fills and the item appears in the Favorites list; clicking again removes it.

    console.log('TODO 5: Implement toggleFavorite()');
}

function displayFavorites() {
    const favoritesList = document.getElementById('favoritesList');

    if (state.favorites.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No favorites yet. Click the ⭐ on items to save them!';
        favoritesList.textContent = '';
        favoritesList.appendChild(emptyMsg);
        state.stats.totalFavorites = 0;
        updateStats();
        return;
    }

    favoritesList.textContent = '';
    state.favorites.forEach(item => {
        const favItem = document.createElement('div');
        favItem.className = 'favorite-item';
        favItem.onclick = () => showDetailModal(item);

        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = item.title;
        const br = document.createElement('br');
        const meta = document.createElement('small');
        meta.textContent = `${item.source} - ${item.category || 'General'}`;

        info.appendChild(title);
        info.appendChild(br);
        info.appendChild(meta);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-icon';
        removeBtn.textContent = '✕';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFavorite(item.id, item.source);
        };

        favItem.appendChild(info);
        favItem.appendChild(removeBtn);
        favoritesList.appendChild(favItem);
    });

    state.stats.totalFavorites = state.favorites.length;
    updateStats();
}

function removeFavorite(itemId, source) {
    const index = state.favorites.findIndex(fav => fav.id === itemId && fav.source === source);
    if (index > -1) {
        state.favorites.splice(index, 1);
        saveFavorites();
        displayFavorites();
        displayPrimaryData();
        displaySecondaryData();
    }
}

function saveFavorites() {
    // TODO 5: Implement saving favorites to LocalStorage (key: 'favorites')
    console.log('TODO 5: Implement saveFavorites()');
}

function loadFavorites() {
    // TODO 5: Implement loading favorites from LocalStorage and showing them with displayFavorites()
    // Verify: after a page refresh the same favourites are still listed.
    console.log('TODO 5: Implement loadFavorites()');
}

// The preview cannot show confirm pop-ups, so Clear All asks with a second click.
let clearFavoritesPending = false;

function clearFavorites() {
    const btn = document.getElementById('clearFavoritesBtn');
    if (!clearFavoritesPending) {
        clearFavoritesPending = true;
        btn.textContent = 'Click again to confirm';
        setTimeout(() => { clearFavoritesPending = false; btn.textContent = 'Clear All'; }, 3000);
        return;
    }
    clearFavoritesPending = false;
    btn.textContent = 'Clear All';
    state.favorites = [];
    saveFavorites();
    displayFavorites();
    displayPrimaryData();
    displaySecondaryData();
}

// ===================================
// Modal Functions (PRE-BUILT)
// ===================================

function showDetailModal(item) {
    const modal = document.getElementById('detailModal');
    const detailContent = document.getElementById('detailContent');

    // Clear content
    detailContent.textContent = '';

    // Title
    const title = document.createElement('h2');
    title.textContent = item.title;
    detailContent.appendChild(title);

    // Image
    if (item.image) {
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title;
        img.style.cssText = 'width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin: 1rem 0;';
        detailContent.appendChild(img);
    }

    // Category
    const categoryP = document.createElement('p');
    const categoryStrong = document.createElement('strong');
    categoryStrong.textContent = 'Category: ';
    categoryP.appendChild(categoryStrong);
    categoryP.appendChild(document.createTextNode(item.category || 'General'));
    detailContent.appendChild(categoryP);

    // Date
    const dateP = document.createElement('p');
    const dateStrong = document.createElement('strong');
    dateStrong.textContent = 'Date: ';
    dateP.appendChild(dateStrong);
    dateP.appendChild(document.createTextNode(item.date || 'Recent'));
    detailContent.appendChild(dateP);

    // Description
    const descP = document.createElement('p');
    descP.textContent = item.description || 'No description available';
    detailContent.appendChild(descP);

    // Author (if exists)
    if (item.author) {
        const authorP = document.createElement('p');
        const authorStrong = document.createElement('strong');
        authorStrong.textContent = 'Author: ';
        authorP.appendChild(authorStrong);
        authorP.appendChild(document.createTextNode(item.author));
        detailContent.appendChild(authorP);
    }

    // Source address (shown as text: the preview cannot open new tabs)
    if (item.url && item.url !== '#') {
        const linkP = document.createElement('p');
        const linkStrong = document.createElement('strong');
        linkStrong.textContent = 'Source: ';
        linkP.appendChild(linkStrong);
        linkP.appendChild(document.createTextNode(item.url));
        detailContent.appendChild(linkP);
    }

    modal.classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// ===================================
// UI Helper Functions (PRE-BUILT)
// ===================================

function showLoading(panelId) {
    document.getElementById(`${panelId}Loading`).classList.remove('hidden');
    document.getElementById(`${panelId}Grid`).style.opacity = '0.3';
}

function hideLoading(panelId) {
    document.getElementById(`${panelId}Loading`).classList.add('hidden');
    document.getElementById(`${panelId}Grid`).style.opacity = '1';
}

function showToast(message) {
    // Small, self-removing message at the bottom of the page (textContent only)
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
        background: '#1f2937', color: '#fff', padding: '10px 16px', borderRadius: '8px',
        zIndex: '1000', maxWidth: '90vw'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function showError(panelId, message) {
    const errorEl = document.getElementById(`${panelId}Error`);
    errorEl.querySelector('.error-message').textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError(panelId) {
    document.getElementById(`${panelId}Error`).classList.add('hidden');
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('themeToggle').textContent = state.theme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('theme', state.theme);
}

function updateStats() {
    document.getElementById('totalItemsViewed').textContent = state.stats.itemsViewed;
    document.getElementById('totalSearches').textContent = state.stats.searches;
    document.getElementById('totalFavorites').textContent = state.stats.totalFavorites;
    document.getElementById('cacheHits').textContent = state.stats.cacheHits;
}

// ===================================
// Sample Data Generator (FOR TESTING)
// The starter shows this until your TODO 2 loads real data. Remove it once that works.
// ===================================

function generateSampleData(source, count) {
    const titles = [
        'Breaking News: Technology Advances',
        'Weather Update: Sunny Skies Ahead',
        'Latest Trends in Web Development',
        'Health Tips for Modern Living',
        'Entertainment News: New Releases',
        'Sports Highlights: Championship Games',
        'Science Discovery: Amazing Findings',
        'Travel Destinations: Top Picks'
    ];

    const categories = ['Technology', 'Weather', 'Health', 'Entertainment', 'Sports', 'Science', 'Travel'];

    return Array.from({ length: count }, (_, i) => ({
        id: `${source}-${i}`,
        title: titles[i % titles.length],
        description: 'This is sample data for UI testing. Replace with real API data in TODO 2.',
        image: placeholderImage(`Sample ${i + 1}`),
        category: categories[i % categories.length],
        date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
        timestamp: Date.now() - i * 86400000,
        author: `Author ${i + 1}`,
        url: '#'
    }));
}

// ===================================
// Event Listeners (PRE-BUILT)
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // API selection buttons
    document.querySelectorAll('.api-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const config = API_CONFIGS[btn.dataset.combo];
            if (!config) { showToast('Add this pair to API_CONFIGS (TODO 1)'); return; }

            document.querySelectorAll('.api-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentCombo = btn.dataset.combo;

            // Update panel titles
            document.getElementById('primaryApiTitle').textContent = config.primary.name;
            document.getElementById('secondaryApiTitle').textContent = config.secondary.name;

            // Fetch new data
            fetchPrimaryAPI(1);
            fetchSecondaryAPI(1);
        });
    });

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        state.searchQuery = '';
        displayPrimaryData();
        displaySecondaryData();
    });

    // Filters
    document.getElementById('filterCategory').addEventListener('change', handleFilterChange);
    document.getElementById('sortBy').addEventListener('change', handleFilterChange);

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.view = btn.id === 'gridViewBtn' ? 'grid' : 'list';
            // TODO 8: Implement list view layout. styles.css has a `.list-view` class for the two grids
            // (#primaryGrid and #secondaryGrid): switch it on for the list view and off for the grid view.
            // Verify: the ☰ button stacks the cards in one column; ⊞ puts them back in a grid.
        });
    });

    // Pagination
    document.getElementById('primaryPrevBtn').addEventListener('click', () => changePage('primary', -1));
    document.getElementById('primaryNextBtn').addEventListener('click', () => changePage('primary', 1));
    document.getElementById('secondaryPrevBtn').addEventListener('click', () => changePage('secondary', -1));
    document.getElementById('secondaryNextBtn').addEventListener('click', () => changePage('secondary', 1));

    // Favorites
    document.getElementById('clearFavoritesBtn').addEventListener('click', clearFavorites);

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        CacheManager.clearAll();
        fetchPrimaryAPI(state.primaryPage);
        fetchSecondaryAPI(state.secondaryPage);
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeDetailModal);
    document.querySelector('.modal-overlay').addEventListener('click', closeDetailModal);

    // Error retry buttons
    document.querySelectorAll('.btn-retry').forEach(btn => {
        btn.addEventListener('click', () => {
            fetchPrimaryAPI(state.primaryPage);
            fetchSecondaryAPI(state.secondaryPage);
        });
    });

    // Initialize
    loadFavorites();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        state.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeToggle').textContent = savedTheme === 'light' ? '🌙' : '☀️';
    }

    // Load initial data
    fetchPrimaryAPI(1);
    fetchSecondaryAPI(1);
});
