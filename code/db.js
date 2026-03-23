// IndexedDB wrapper for Hebrew Letters Game
const DB_NAME = 'hebrewLettersGame';
const DB_VERSION = 2;
const STORE_WORDS = 'words';
const STORE_IMAGES = 'images';
const STORE_SETTINGS = 'settings';

let db = null;

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
async function saveWord(w) { return txPut(STORE_WORDS, w); }
async function getImage(id) { return txGet(STORE_IMAGES, id); }
async function saveImage(img) { return txPut(STORE_IMAGES, img); }
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
async function setSetting(key, value) { return txPut(STORE_SETTINGS, { key, value }); }

async function deleteWordById(id) {
    // If this is a default word, record it as deleted so sync won't re-add it
    if (typeof id === 'string' && id.startsWith('def_')) {
        const deleted = (await getSetting('deletedDefaultIds')) || [];
        if (!deleted.includes(id)) {
            deleted.push(id);
            await setSetting('deletedDefaultIds', deleted);
        }
    }
    return new Promise((resolve, reject) => {
        const t = db.transaction([STORE_WORDS, STORE_IMAGES], 'readwrite');
        t.objectStore(STORE_WORDS).delete(id);
        t.objectStore(STORE_IMAGES).delete(id);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
}

async function deleteImage(id) {
    return new Promise((resolve, reject) => {
        const t = db.transaction(STORE_IMAGES, 'readwrite');
        t.objectStore(STORE_IMAGES).delete(id);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
    });
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
    const wordsPerGame   = await getSetting('wordsPerGame');
    const buttonsCount   = await getSetting('buttonsCount');
    const buttonsRows    = await getSetting('buttonsRows');
    const hintEnabled         = await getSetting('hintEnabled');
    const hintAfterErrors     = await getSetting('hintAfterErrors');
    const playerNameEnabled      = await getSetting('playerNameEnabled');
    const letterAnimationEnabled = await getSetting('letterAnimationEnabled');
    const showSilentLetterWords  = await getSetting('showSilentLetterWords');
    const deletedDefaultIds      = await getSetting('deletedDefaultIds');
    return {
        version: 2,
        exportDate: new Date().toISOString().split('T')[0],
        settings: {
            timerDuration:        timerDuration ?? 5,
            categories:           categories || null,
            pixabayKey:           pixabayKey || '',
            wordsPerGame:         wordsPerGame ?? 10,
            buttonsCount:         buttonsCount ?? 4,
            buttonsRows:          buttonsRows  ?? null,
            hintEnabled:          hintEnabled !== false,
            hintAfterErrors:      hintAfterErrors ?? 2,
            playerNameEnabled:    playerNameEnabled !== false,
            letterAnimationEnabled: letterAnimationEnabled !== false,
            showSilentLetterWords:  showSilentLetterWords === true,
            deletedDefaultIds:      deletedDefaultIds || []
        },
        words: exported
    };
}

async function importAllData(data) {
    if (!data || !data.words) throw new Error('קובץ יבוא לא תקין');
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
    if (data.settings?.pixabayKey != null)
        await setSetting('pixabayKey', data.settings.pixabayKey);
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
