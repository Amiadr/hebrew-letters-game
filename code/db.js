// IndexedDB wrapper for Hebrew Letters Game
const DB_NAME = 'hebrewLettersGame';
const DB_VERSION = 3;
const STORE_WORDS = 'words';
const STORE_IMAGES = 'images';
const STORE_SETTINGS = 'settings';
const STORE_SESSIONS = 'sessions';

let db = null;
let _suppressSyncNotify = false;

// Notify sync.js of changes (only when app is fully initialized)
function _onDataChange()       { if (!_suppressSyncNotify && window._appReady && typeof notifyDataChanged  === 'function') notifyDataChanged(); }
function _onImageChange(id)    { if (!_suppressSyncNotify && window._appReady && typeof notifyImageChanged === 'function') notifyImageChanged(id); }
function _onSessionsChange()   { if (!_suppressSyncNotify && window._appReady && typeof notifySessionsChanged === 'function') notifySessionsChanged(); }

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { db = request.result; resolve(db); };
        request.onupgradeneeded = (event) => {
            const d = event.target.result;
            if (!d.objectStoreNames.contains(STORE_WORDS)) {
                const ws = d.createObjectStore(STORE_WORDS, { keyPath: 'id' });
                ws.createIndex('word', 'word', { unique: false });
                ws.createIndex('category', 'category', { unique: false });
            }
            if (!d.objectStoreNames.contains(STORE_IMAGES)) {
                d.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
            }
            if (!d.objectStoreNames.contains(STORE_SETTINGS)) {
                d.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
            }
            if (!d.objectStoreNames.contains(STORE_SESSIONS)) {
                const ss = d.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
                ss.createIndex('startedAt', 'startedAt', { unique: false });
            }
        };
    });
}

function txGet(storeName, key) {
    return new Promise((resolve, reject) => {
        const t = db.transaction(storeName, 'readonly');
        const req = t.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function txPut(storeName, value) {
    return new Promise((resolve, reject) => {
        const t = db.transaction(storeName, 'readwrite');
        const req = t.objectStore(storeName).put(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function txGetAll(storeName) {
    return new Promise((resolve, reject) => {
        const t = db.transaction(storeName, 'readonly');
        const req = t.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getAllWords() { return txGetAll(STORE_WORDS); }
async function getWord(id) { return txGet(STORE_WORDS, id); }
async function saveWord(w) { await txPut(STORE_WORDS, w); _onDataChange(); }
async function getImage(id) { return txGet(STORE_IMAGES, id); }
async function saveImage(img) { await txPut(STORE_IMAGES, img); _onImageChange(img.id); }
async function getAllImageIds() {
    return new Promise((resolve, reject) => {
        const t = db.transaction(STORE_IMAGES, 'readonly');
        const req = t.objectStore(STORE_IMAGES).getAllKeys();
        req.onsuccess = () => resolve(new Set(req.result));
        req.onerror = () => reject(req.error);
    });
}

async function getSetting(key) {
    const rec = await txGet(STORE_SETTINGS, key);
    return rec !== undefined ? rec.value : null;
}
async function setSetting(key, value) { await txPut(STORE_SETTINGS, { key, value }); _onDataChange(); }

// ===== GAME SESSIONS (history for the statistics screen) =====
async function getAllSessions() {
    const list = await txGetAll(STORE_SESSIONS);
    return list.sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
}
async function saveSession(session) { await txPut(STORE_SESSIONS, session); _onSessionsChange(); }
async function deleteSession(id) {
    await new Promise((resolve, reject) => {
        const t = db.transaction(STORE_SESSIONS, 'readwrite');
        t.objectStore(STORE_SESSIONS).delete(id);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
    _onSessionsChange();
}
async function clearAllSessions() {
    await new Promise((resolve, reject) => {
        const t = db.transaction(STORE_SESSIONS, 'readwrite');
        t.objectStore(STORE_SESSIONS).clear();
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
    _onSessionsChange();
}
// Merge sessions coming from another source (Drive / import). Returns how many were new.
async function mergeSessions(list) {
    if (!Array.isArray(list)) return 0;
    const existing = new Set((await txGetAll(STORE_SESSIONS)).map(s => s.id));
    let added = 0;
    _suppressSyncNotify = true;
    try {
        for (const s of list) {
            if (!s || !s.id || existing.has(s.id)) continue;
            await txPut(STORE_SESSIONS, s);
            added++;
        }
    } finally { _suppressSyncNotify = false; }
    return added;
}

async function deleteWordById(id) {
    // If this is a default word, record it as deleted so sync won't re-add it
    if (typeof id === 'string' && id.startsWith('def_')) {
        const deleted = (await getSetting('deletedDefaultIds')) || [];
        if (!deleted.includes(id)) {
            deleted.push(id);
            await setSetting('deletedDefaultIds', deleted);
        }
    }
    await new Promise((resolve, reject) => {
        const t = db.transaction([STORE_WORDS, STORE_IMAGES], 'readwrite');
        t.objectStore(STORE_WORDS).delete(id);
        t.objectStore(STORE_IMAGES).delete(id);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
    _onDataChange();
    _onImageChange(id);
}

async function deleteImage(id) {
    await new Promise((resolve, reject) => {
        const t = db.transaction(STORE_IMAGES, 'readwrite');
        t.objectStore(STORE_IMAGES).delete(id);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
    _onImageChange(id);
}

async function clearAllData() {
    return new Promise((resolve, reject) => {
        const t = db.transaction([STORE_WORDS, STORE_IMAGES], 'readwrite');
        t.objectStore(STORE_WORDS).clear();
        t.objectStore(STORE_IMAGES).clear();
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
}

// Returns the best image source for a word: uploaded dataURL > external imageURL > null
async function getWordImageSrc(wordData) {
    if (!wordData) return null;
    const img = await getImage(wordData.id);
    if (img?.dataURL) return img.dataURL;
    if (wordData.imageURL) return wordData.imageURL;
    return null;
}

async function exportAllData() {
    const words = await getAllWords();
    const exported = [];
    for (const word of words) {
        const img = await getImage(word.id);
        exported.push({ ...word, imageDataURL: img?.dataURL || null });
    }
    const timerDuration  = await getSetting('timerDuration');
    const categories     = await getSetting('categories');
    const pixabayKey     = await getSetting('pixabayKey');
    const unsplashKey    = await getSetting('unsplashKey');
    const pexelsKey      = await getSetting('pexelsKey');
    const wordsPerGame   = await getSetting('wordsPerGame');
    const buttonsCount   = await getSetting('buttonsCount');
    const buttonsRows    = await getSetting('buttonsRows');
    const hintEnabled         = await getSetting('hintEnabled');
    const hintAfterErrors     = await getSetting('hintAfterErrors');
    const playerNameEnabled      = await getSetting('playerNameEnabled');
    const letterAnimationEnabled = await getSetting('letterAnimationEnabled');
    const showSilentLetterWords  = await getSetting('showSilentLetterWords');
    const deletedDefaultIds      = await getSetting('deletedDefaultIds');
    const gameMode               = await getSetting('gameMode');
    const sessions               = await getAllSessions();
    return {
        version: 2,
        exportDate: new Date().toISOString().split('T')[0],
        settings: {
            timerDuration:        timerDuration ?? 5,
            categories:           categories || null,
            pixabayKey:           pixabayKey  || '',
            unsplashKey:          unsplashKey || '',
            pexelsKey:            pexelsKey   || '',
            wordsPerGame:         wordsPerGame ?? 10,
            buttonsCount:         buttonsCount ?? 4,
            buttonsRows:          buttonsRows  ?? null,
            hintEnabled:          hintEnabled !== false,
            hintAfterErrors:      hintAfterErrors ?? 2,
            playerNameEnabled:    playerNameEnabled !== false,
            letterAnimationEnabled: letterAnimationEnabled !== false,
            showSilentLetterWords:  showSilentLetterWords === true,
            deletedDefaultIds:      deletedDefaultIds || [],
            gameMode:               gameMode || 'letters'
        },
        words: exported,
        sessions
    };
}

async function importAllData(data) {
    if (!data || !data.words) throw new Error('קובץ יבוא לא תקין');
    _suppressSyncNotify = true;
    await clearAllData();
    for (const entry of data.words) {
        const { imageDataURL, ...wordMeta } = entry;
        await saveWord(wordMeta);
        if (imageDataURL) await saveImage({ id: wordMeta.id, dataURL: imageDataURL });
    }
    if (data.settings?.timerDuration != null)
        await setSetting('timerDuration', Number(data.settings.timerDuration));
    if (data.settings?.categories)
        await setSetting('categories', data.settings.categories);
    if (data.settings?.pixabayKey  != null) await setSetting('pixabayKey',  data.settings.pixabayKey);
    if (data.settings?.unsplashKey != null) await setSetting('unsplashKey', data.settings.unsplashKey);
    if (data.settings?.pexelsKey   != null) await setSetting('pexelsKey',   data.settings.pexelsKey);
    if (data.settings?.wordsPerGame != null)
        await setSetting('wordsPerGame', Number(data.settings.wordsPerGame));
    if (data.settings?.buttonsCount != null)
        await setSetting('buttonsCount', Number(data.settings.buttonsCount));
    if (data.settings?.buttonsRows != null)
        await setSetting('buttonsRows', Number(data.settings.buttonsRows));
    if (data.settings?.hintEnabled != null)
        await setSetting('hintEnabled', Boolean(data.settings.hintEnabled));
    if (data.settings?.hintAfterErrors != null)
        await setSetting('hintAfterErrors', Number(data.settings.hintAfterErrors));
    if (data.settings?.playerNameEnabled != null)
        await setSetting('playerNameEnabled', Boolean(data.settings.playerNameEnabled));
    if (data.settings?.letterAnimationEnabled != null)
        await setSetting('letterAnimationEnabled', Boolean(data.settings.letterAnimationEnabled));
    if (data.settings?.showSilentLetterWords != null)
        await setSetting('showSilentLetterWords', Boolean(data.settings.showSilentLetterWords));
    if (Array.isArray(data.settings?.deletedDefaultIds))
        await setSetting('deletedDefaultIds', data.settings.deletedDefaultIds);
    if (['letters', 'reading', 'mixed'].includes(data.settings?.gameMode))
        await setSetting('gameMode', data.settings.gameMode);
    _suppressSyncNotify = false;
    // Game history is merged (never cleared) so an import can't erase it
    if (Array.isArray(data.sessions)) await mergeSessions(data.sessions);
}

// Migration: add _customFields:[] to words that don't have it yet
async function migrateCustomFields() {
    const words = await getAllWords();
    for (const word of words) {
        if (!Array.isArray(word._customFields)) {
            word._customFields = [];
            await saveWord(word);
        }
    }
}

// Category helpers
const DEFAULT_CATEGORY_LIST = [
    { name: 'בעלי חיים', icon: '🐾' },
    { name: 'חפצים',     icon: '📦' },
    { name: 'טבע',       icon: '🌿' },
    { name: 'אוכל',      icon: '🍎' },
    { name: 'גוף',       icon: '👋' },
    { name: 'אחר',       icon: '⭐' }
];

async function getCategories() {
    const saved = await getSetting('categories');
    return saved || DEFAULT_CATEGORY_LIST;
}

async function saveCategories(cats) {
    return setSetting('categories', cats);
}
