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
                title: h.tags || '',
                source: 'pixabay',
                attribution: ''
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

// Search Unsplash (requires API key, uses fetch + CORS)
async function searchUnsplashImages(apiKey, query, limit, page = 1) {
    try {
        const res = await fetch(
            'https://api.unsplash.com/search/photos?query=' + encodeURIComponent(query) +
            '&per_page=' + limit + '&page=' + page,
            { headers: { Authorization: 'Client-ID ' + apiKey } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results || []).map(p => ({
            url: p.urls.small,
            title: p.alt_description || p.description || '',
            source: 'unsplash',
            attribution: 'Photo by ' + p.user.name + ' on Unsplash'
        }));
    } catch (e) { return []; }
}

// Search Pexels (requires API key, uses fetch + CORS)
async function searchPexelsImages(apiKey, query, limit, page = 1) {
    try {
        const res = await fetch(
            'https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) +
            '&per_page=' + limit + '&page=' + page,
            { headers: { Authorization: apiKey } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.photos || []).map(p => ({
            url: p.src.medium,
            title: p.alt || '',
            source: 'pexels',
            attribution: 'Photo by ' + p.photographer + ' on Pexels'
        }));
    } catch (e) { return []; }
}

// Interleave results from multiple sources (round-robin)
function interleaveResults(arrays) {
    const result = [];
    const maxLen = Math.max(...arrays.map(a => a.length));
    for (let i = 0; i < maxLen; i++)
        for (const arr of arrays)
            if (i < arr.length) result.push(arr[i]);
    return result;
}

// Main search function used by admin panel (page starts at 1)
async function searchImages(query, limit = 20, page = 1) {
    if (!query) return [];

    const pixabayKey  = (await getSetting('pixabayKey'))  || '';
    const unsplashKey = (await getSetting('unsplashKey')) || '';
    const pexelsKey   = (await getSetting('pexelsKey'))   || '';

    const hasApiKey = pixabayKey.trim() || unsplashKey.trim() || pexelsKey.trim();
    if (hasApiKey) {
        const promises = [];
        if (pixabayKey.trim())  promises.push(searchPixabayImages(pixabayKey.trim(),  query, limit, page));
        if (unsplashKey.trim()) promises.push(searchUnsplashImages(unsplashKey.trim(), query, limit, page));
        if (pexelsKey.trim())   promises.push(searchPexelsImages(pexelsKey.trim(),   query, limit, page));
        const allResults = await Promise.all(promises);
        const combined = interleaveResults(allResults);
        if (combined.length > 0) return combined.slice(0, limit);
    }

    // Page 1 — Wikipedia article images are the most relevant (editorially curated)
    if (page === 1) {
        const wikiResults = await searchWikiArticleImages(query, limit);
        if (wikiResults.length >= 3)
            return wikiResults.map(r => ({ ...r, source: 'wikipedia', attribution: '' }));
    }

    // Load-more pages / sparse article → Wikimedia Commons file search
    const offset = (page - 1) * limit;
    const commonsResults = await searchCommonsImages(query, limit, offset);
    return commonsResults.map(r => ({ ...r, source: 'commons', attribution: '' }));
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

    if (typeof DEFAULT_GAME_DATA === 'undefined' || !DEFAULT_GAME_DATA?.words?.length) return;

    // Import words & images only — do NOT overwrite user settings (API keys etc.)
    for (const entry of DEFAULT_GAME_DATA.words) {
        const { imageDataURL, ...wordMeta } = entry;
        await saveWord(wordMeta);
        if (imageDataURL) await saveImage({ id: wordMeta.id, dataURL: imageDataURL });
    }
    // Import only non-sensitive default settings (not API keys)
    const s = DEFAULT_GAME_DATA.settings || {};
    if (s.timerDuration        != null) await setSetting('timerDuration',        s.timerDuration);
    if (s.wordsPerGame         != null) await setSetting('wordsPerGame',         s.wordsPerGame);
    if (s.buttonsCount         != null) await setSetting('buttonsCount',         s.buttonsCount);
    if (s.hintEnabled          != null) await setSetting('hintEnabled',          s.hintEnabled);
    if (s.hintAfterErrors      != null) await setSetting('hintAfterErrors',      s.hintAfterErrors);
    if (s.playerNameEnabled    != null) await setSetting('playerNameEnabled',    s.playerNameEnabled);
    if (s.letterAnimationEnabled != null) await setSetting('letterAnimationEnabled', s.letterAnimationEnabled);
    if (s.showSilentLetterWords  != null) await setSetting('showSilentLetterWords',  s.showSilentLetterWords);
}

async function syncDefaultWords() {
    if (typeof DEFAULT_GAME_DATA === 'undefined' || !DEFAULT_GAME_DATA?.words?.length) return;

    const existing      = await getAllWords();
    const existingMap   = new Map(existing.map(w => [w.id, w]));
    const existingTexts = new Set(existing.map(w => w.word));
    const deletedIds    = new Set((await getSetting('deletedDefaultIds')) || []);

    let added = 0, updated = 0;
    for (const entry of DEFAULT_GAME_DATA.words) {
        if (!entry.id?.startsWith('def_')) continue;

        const existingWord = existingMap.get(entry.id);

        if (!existingWord) {
            // New word — add if not deleted and no text collision
            if (deletedIds.has(entry.id))      continue;
            if (existingTexts.has(entry.word)) continue;
            const { imageDataURL, ...wordMeta } = entry;
            wordMeta._defWordVersion = entry.wordVersion || 1;
            wordMeta._customFields   = [];
            await saveWord(wordMeta);
            if (imageDataURL) await saveImage({ id: wordMeta.id, dataURL: imageDataURL });
            added++;
        } else {
            // Existing word — check if default-data has a newer version
            const storedVersion = existingWord._defWordVersion || 0;
            const newVersion    = entry.wordVersion || 1;
            if (newVersion <= storedVersion) continue;

            const customFields = existingWord._customFields || [];
            let changed = false;

            // Update image if not customised by user
            if (!customFields.includes('image') && entry.imageDataURL) {
                await saveImage({ id: entry.id, dataURL: entry.imageDataURL });
                changed = true;
            }

            // Future: update other fields here based on customFields

            existingWord._defWordVersion = newVersion;
            await saveWord(existingWord);
            if (changed) updated++;
        }
    }
    if (added   > 0) console.log(`syncDefaultWords: added ${added} new default words`);
    if (updated > 0) console.log(`syncDefaultWords: updated images for ${updated} default words`);
}

