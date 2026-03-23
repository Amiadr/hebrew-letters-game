// Hebrew Letters Game — Image utilities
// Wikipedia/Commons JSONP search (used for adding images in admin)

// ===== JSONP helper (works from file:// — no CORS restriction) =====
function jsonpCall(baseUrl, params) {
    return new Promise((resolve, reject) => {
        const cb = '__jsonpCb_' + Math.random().toString(36).slice(2, 8);
        const script = document.createElement('script');
        const timeout = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 9000);
        window[cb] = (data) => { cleanup(); resolve(data); };
        function cleanup() {
            clearTimeout(timeout);
            delete window[cb];
            if (script.parentNode) script.parentNode.removeChild(script);
        }
        script.onerror = () => { cleanup(); reject(new Error('script error')); };
        script.src = baseUrl + 'format=json&origin=*&callback=' + cb + '&' + params;
        document.head.appendChild(script);
    });
}

const WIKI_API    = 'https://en.wikipedia.org/w/api.php?';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php?';

// Search Wikimedia Commons for image files (namespace 6)
async function searchCommonsImages(query, limit, offset = 0) {
    try {
        const data = await jsonpCall(COMMONS_API,
            'action=query&generator=search&gsrnamespace=6&gsrlimit=' + limit +
            (offset > 0 ? '&gsroffset=' + offset : '') +
            '&gsrsearch=' + encodeURIComponent(query) +
            '&prop=imageinfo&iiprop=url&iiurlwidth=280');
        const pages = data?.query?.pages || {};
        return Object.values(pages)
            .filter(p => {
                const url  = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url || '';
                const name = (p.title || '').toLowerCase();
                // Only real photos/illustrations (no SVG), exclude obvious non-subject files
                if (!/\.(jpe?g|png|gif|webp)$/i.test(url)) return false;
                if (/logo|icon|flag|map|diagram|banner|symbol|coat.of.arms|coa_|seal_of|blank|wikip/i.test(name)) return false;
                return true;
            })
            .map(p => ({
                url: p.imageinfo[0].thumburl || p.imageinfo[0].url,
                title: (p.title || '').replace(/^File:/i, '')
            }));
    } catch (e) { return []; }
}

// Get images that are actually used inside a Wikipedia article about the query term.
// Much more relevant than file-name search because every image is editorially related.
async function searchWikiArticleImages(query, limit) {
    try {
        // Step 1: find the best-matching Wikipedia article for this query
        const searchData = await jsonpCall(WIKI_API,
            'action=query&list=search&srsearch=' + encodeURIComponent(query) +
            '&srlimit=1&srnamespace=0');
        const title = searchData?.query?.search?.[0]?.title;
        if (!title) return [];

        // Step 2: fetch all images embedded in that article
        const data = await jsonpCall(WIKI_API,
            'action=query&generator=images&gimlimit=' + Math.min(limit, 50) +
            '&titles=' + encodeURIComponent(title) +
            '&prop=imageinfo&iiprop=url&iiurlwidth=280');
        const pages = data?.query?.pages || {};
        return Object.values(pages)
            .filter(p => {
                const url  = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url || '';
                const name = (p.title || '').toLowerCase();
                if (!/\.(jpe?g|png|webp)$/i.test(url)) return false;
                if (/logo|icon|flag|map|diagram|banner|symbol|coat.of.arms|blank|coa_|seal_of|wikip/i.test(name)) return false;
                return true;
            })
            .map(p => ({
                url: p.imageinfo[0].thumburl || p.imageinfo[0].url,
                title: (p.title || '').replace(/^File:/i, '')
            }));
    } catch (e) { return []; }
}

// Download an external image and convert it to a dataURL (for offline storage).
// Uses canvas; works when the server sends CORS headers (Wikimedia, Pixabay do).
// Returns null if CORS blocks the conversion — caller falls back to URL reference.
function fetchImageAsDataURL(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const MAX = 400;
                let w = img.naturalWidth  || MAX;
                let h = img.naturalHeight || MAX;
                if (w > MAX || h > MAX) {
                    const s = Math.min(MAX / w, MAX / h);
                    w = Math.round(w * s);
                    h = Math.round(h * s);
                }
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL('image/jpeg', 0.85));
            } catch (e) {
                resolve(null); // CORS tainted — can't read pixels
            }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

// Search Pixabay (requires API key, supports JSONP)
function searchPixabayImages(apiKey, query, limit, page = 1) {
    return new Promise(resolve => {
        const cb = '__pixabayCb_' + Math.random().toString(36).slice(2, 8);
        const script = document.createElement('script');
        const timeout = setTimeout(() => { cleanup(); resolve([]); }, 9000);
        window[cb] = (data) => {
            cleanup();
            resolve((data.hits || []).map(h => ({
                url: h.webformatURL,
                title: h.tags || ''
            })));
        };
        function cleanup() {
            clearTimeout(timeout); delete window[cb];
            if (script.parentNode) script.parentNode.removeChild(script);
        }
        script.onerror = () => { cleanup(); resolve([]); };
        script.src =
            'https://pixabay.com/api/?key=' + encodeURIComponent(apiKey) +
            '&q=' + encodeURIComponent(query) +
            '&image_type=all&safesearch=true&per_page=' + limit +
            '&page=' + page +
            '&callback=' + cb;
        document.head.appendChild(script);
    });
}

// Main search function used by admin panel (page starts at 1)
async function searchImages(query, limit = 20, page = 1) {
    if (!query) return [];

    // Pixabay — best quality, safesearch for children; use if API key is set
    const pixabayKey = await getSetting('pixabayKey');
    if (pixabayKey && pixabayKey.trim()) {
        const results = await searchPixabayImages(pixabayKey.trim(), query, limit, page);
        if (results.length > 0) return results;
    }

    // Page 1 — Wikipedia article images are the most relevant (editorially curated)
    if (page === 1) {
        const wikiResults = await searchWikiArticleImages(query, limit);
        if (wikiResults.length >= 3) return wikiResults;
        // Too few article images → fall through to Commons
    }

    // Load-more pages / sparse article → Wikimedia Commons file search
    const offset = (page - 1) * limit;
    return searchCommonsImages(query, limit, offset);
}

// SVG placeholder (used while Wikipedia image loads, or as fallback)
function createPlaceholderSVG(icon, bgColor = '#E3F2FD') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" rx="20" fill="${bgColor}"/>
      <text x="100" y="125" text-anchor="middle" font-size="80">${icon}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const SILENT_LETTER_WORDS = new Set([
    'ציפור','סוס','חתול','פרה','כיסא','שולחן','בית','כוס','מיטה','מנורה',
    'שעון','תיק','כוכב','עננים','תפוח','בננה','עוגה','גלידה','ענבים','אבטיח',
    'עין','ראש','אוזן','פיל','תות','פה'
]);

async function migrateSilentLetterField() {
    const words = await getAllWords();
    const needsMigration = words.filter(w => w.hasSilentLetter === undefined);
    if (needsMigration.length === 0) return;
    for (const word of needsMigration) {
        word.hasSilentLetter = SILENT_LETTER_WORDS.has(word.word);
        await saveWord(word);
    }
}

async function initializeDefaultWords() {
    const existing = await getAllWords();
    if (existing.length > 0) return;

    if (typeof DEFAULT_GAME_DATA !== 'undefined' && DEFAULT_GAME_DATA?.words?.length > 0) {
        await importAllData(DEFAULT_GAME_DATA);
    }
}

async function syncDefaultWords() {
    if (typeof DEFAULT_GAME_DATA === 'undefined' || !DEFAULT_GAME_DATA?.words?.length) return;

    const existing        = await getAllWords();
    const existingIds     = new Set(existing.map(w => w.id));
    const existingTexts   = new Set(existing.map(w => w.word));
    const deletedIds      = new Set((await getSetting('deletedDefaultIds')) || []);

    let added = 0;
    for (const entry of DEFAULT_GAME_DATA.words) {
        if (!entry.id?.startsWith('def_')) continue;   // only default words
        if (existingIds.has(entry.id))     continue;   // already present
        if (deletedIds.has(entry.id))      continue;   // user deleted it
        if (existingTexts.has(entry.word)) continue;   // user has same text under different id

        const { imageDataURL, ...wordMeta } = entry;
        await saveWord(wordMeta);
        if (imageDataURL) await saveImage({ id: wordMeta.id, dataURL: imageDataURL });
        added++;
    }
    if (added > 0) console.log(`syncDefaultWords: added ${added} new default words`);
}

