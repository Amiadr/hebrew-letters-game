// =====================================================
// Google Drive Sync — Hebrew Letters Game
// =====================================================

const GOOGLE_CLIENT_ID = '856748850670-te01oei8219md66s881itlakcfudg9j1.apps.googleusercontent.com';
const DRIVE_SCOPE      = 'https://www.googleapis.com/auth/drive.appdata';
const PROFILE_SCOPE    = 'https://www.googleapis.com/auth/userinfo.profile';
const METADATA_FILE    = 'hebrew-game-metadata.json';
const IMG_PREFIX       = 'img_';
const LS_USER          = 'gSyncUser';
const LS_LAST_SYNC     = 'gSyncLastTs';
const SYNC_DEBOUNCE_MS = 10000;

let _tokenClient   = null;
let _accessToken   = null;
let _tokenExpMs    = 0;
let _user          = null;      // { name, email, picture }
let _fileCache     = null;      // { filename → { id, modifiedTime } }
let _debounceTimer = null;
let _isSyncing     = false;
let _dirtyImages   = new Set(); // word IDs whose images changed locally
let _firstSync     = true;      // first sync after login → upload all images

// ── Initialization ────────────────────────────────
function initGoogleSync() {
    const saved = localStorage.getItem(LS_USER);
    if (saved) { try { _user = JSON.parse(saved); } catch {} }
    updateSyncUI();
}

// GIS library calls window.onGoogleLibraryLoad when ready
window.onGoogleLibraryLoad = function () {
    _tokenClient = google.accounts.oauth2.initTokenClient({
        client_id:      GOOGLE_CLIENT_ID,
        scope:          `${DRIVE_SCOPE} ${PROFILE_SCOPE}`,
        callback:       _onToken,
        error_callback: _onTokenError
    });
    // Silent refresh for returning users
    if (_user) _tokenClient.requestAccessToken({ prompt: '' });
};

// ── Auth ──────────────────────────────────────────
function loginWithGoogle() {
    if (!_tokenClient) { showAdminToast('ספריית Google לא נטענה עדיין'); return; }
    _tokenClient.requestAccessToken({ prompt: _user ? '' : 'select_account' });
}

async function _onToken(resp) {
    if (resp.error) {
        const silent = ['access_denied', 'interaction_required', 'consent_required'];
        if (!silent.includes(resp.error)) showAdminToast('שגיאה בהתחברות לגוגל');
        return;
    }
    _accessToken = resp.access_token;
    _tokenExpMs  = Date.now() + resp.expires_in * 1000 - 60_000;

    if (!_user) {
        // First login — fetch profile
        try {
            const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo',
                { headers: { Authorization: `Bearer ${_accessToken}` } });
            const p = await r.json();
            _user = { name: p.name, email: p.email, picture: p.picture || '' };
            localStorage.setItem(LS_USER, JSON.stringify(_user));
            _firstSync = true;
        } catch (e) { console.error('Profile fetch failed:', e); }
    }

    updateSyncUI();
    _fileCache = null;              // Invalidate cache after token refresh
    clearTimeout(_debounceTimer);   // Cancel pending debounce — sync immediately
    _runSync();
}

function _onTokenError(err) {
    // Silently ignore — common on silent refresh when no session
    console.debug('GIS token error:', err?.type);
}

function logoutFromGoogle() {
    if (_accessToken) google.accounts.oauth2.revoke(_accessToken, () => {});
    _accessToken = null;
    _tokenExpMs  = 0;
    _user        = null;
    _fileCache   = null;
    _firstSync   = true;
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_LAST_SYNC);
    updateSyncUI();
    showAdminToast('התנתקת מ-Google');
}

function _hasToken() {
    return !!_accessToken && Date.now() < _tokenExpMs;
}

// ── Drive API helpers ─────────────────────────────
async function _req(method, url, body) {
    if (!_hasToken()) {
        // Try silent refresh — sync will resume after _onToken fires
        if (_user) _tokenClient?.requestAccessToken({ prompt: '' });
        throw new Error('token_unavailable');
    }
    const headers = { Authorization: `Bearer ${_accessToken}` };
    const opts    = { method, headers };
    if (body !== undefined) opts.body = body;
    const r = await fetch(url, opts);
    if (r.status === 401) { _accessToken = null; throw new Error('token_invalid'); }
    if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(`Drive HTTP ${r.status}: ${txt}`);
    }
    return r;
}

async function _getFileList() {
    if (_fileCache) return _fileCache;
    const r = await _req('GET',
        'https://www.googleapis.com/drive/v3/files' +
        '?spaces=appDataFolder&fields=files(id,name,modifiedTime)&pageSize=1000');
    const { files = [] } = await r.json();
    _fileCache = {};
    for (const f of files) _fileCache[f.name] = { id: f.id, modifiedTime: f.modifiedTime };
    return _fileCache;
}

async function _readText(fileId) {
    const r = await _req('GET',
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
    return r.text();
}

async function _write(name, content) {
    const files = await _getFileList();
    const meta  = files[name]
        ? { name }
        : { name, parents: ['appDataFolder'] };
    const form  = new FormData();
    form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
    form.append('media',    new Blob([content],              { type: 'text/plain' }));
    const method = files[name] ? 'PATCH' : 'POST';
    const fileId = files[name]?.id;
    const url    = fileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const r      = await _req(method, url, form);
    const result = await r.json();
    _fileCache[name] = { id: result.id, modifiedTime: result.modifiedTime };
}

async function _del(name) {
    const files = await _getFileList();
    if (!files[name]) return;
    await _req('DELETE', `https://www.googleapis.com/drive/v3/files/${files[name].id}`);
    delete _fileCache[name];
}

// ── Sync entry points (called from db.js) ─────────
function notifyDataChanged() {
    if (!_user) return;
    _scheduleSync();
}

function notifyImageChanged(wordId) {
    if (!_user) return;
    _dirtyImages.add(wordId);
    _scheduleSync();
}

function _scheduleSync() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(_runSync, SYNC_DEBOUNCE_MS);
}

// Public: "Sync now" button
function syncNow() { _runSync(); }

// ── Core sync ─────────────────────────────────────
async function _runSync() {
    if (_isSyncing) return;
    if (!_hasToken()) {
        if (_user) _tokenClient?.requestAccessToken({ prompt: '' });
        return;
    }
    _isSyncing = true;
    _setStatus('syncing');
    try {
        const files   = await _getFileList();
        const localTs = parseInt(localStorage.getItem(LS_LAST_SYNC) || '0', 10);
        const driveTs = files[METADATA_FILE]
            ? new Date(files[METADATA_FILE].modifiedTime).getTime()
            : 0;

        if (driveTs > localTs + 5000) {
            // Drive is newer → pull
            await _syncDown(files);
        } else {
            // Local is newer (or same) → push
            await _syncUp(files);
        }
        localStorage.setItem(LS_LAST_SYNC, String(Date.now()));
        _dirtyImages.clear();
        _firstSync = false;
        _setStatus('ok');
    } catch (e) {
        if (e.message !== 'token_unavailable') {
            console.error('Sync failed:', e);
            _setStatus('error');
        }
    } finally {
        _isSyncing = false;
    }
}

// ── Upload (local → Drive) ────────────────────────
async function _syncUp(files) {
    const data    = await exportAllData();
    const isFirst = !files[METADATA_FILE]; // No metadata yet → new Drive, upload everything

    // Metadata (no image data)
    const metadata = {
        version:      2,
        lastModified: Date.now(),
        settings:     data.settings,
        words:        data.words.map(({ imageDataURL, ...meta }) => ({
            ...meta, hasImage: !!imageDataURL
        }))
    };
    await _write(METADATA_FILE, JSON.stringify(metadata));

    // Images — upload only what changed (or everything on first sync)
    for (const word of data.words) {
        const imgKey      = `${IMG_PREFIX}${word.id}`;
        const shouldWrite = isFirst || _firstSync || _dirtyImages.has(word.id);
        if (!shouldWrite) continue;
        if (word.imageDataURL) {
            await _write(imgKey, word.imageDataURL);
        } else {
            await _del(imgKey);
        }
    }

    // Remove image files for words that no longer exist locally
    const wordIds = new Set(data.words.map(w => w.id));
    for (const name of Object.keys(files)) {
        if (name.startsWith(IMG_PREFIX)) {
            const id = name.slice(IMG_PREFIX.length);
            if (!wordIds.has(id)) await _del(name);
        }
    }
}

// ── Download (Drive → local) ──────────────────────
async function _syncDown(files) {
    const rawMeta  = await _readText(files[METADATA_FILE].id);
    const metadata = JSON.parse(rawMeta);

    // Download images for each word
    const wordsWithImages = [];
    for (const wm of metadata.words) {
        let imageDataURL = null;
        const imgKey = `${IMG_PREFIX}${wm.id}`;
        if (wm.hasImage && files[imgKey]) {
            imageDataURL = await _readText(files[imgKey].id);
        }
        wordsWithImages.push({ ...wm, imageDataURL });
    }

    // Import into IndexedDB (replaces local data)
    await importAllData({ ...metadata, words: wordsWithImages });

    // Refresh admin UI if open (don't interrupt active game)
    const gameActive = document.querySelector('#screen-game.active');
    if (!gameActive) {
        if (typeof loadWords    === 'function') loadWords();
        if (typeof loadSettings === 'function') loadSettings();
    }
    showAdminToast('☁️ נתונים עודכנו מ-Google Drive');
}

// ── UI ────────────────────────────────────────────
function updateSyncUI() {
    const elOut = document.getElementById('sync-logged-out');
    const elIn  = document.getElementById('sync-logged-in');
    if (!elOut || !elIn) return;
    if (_user) {
        elOut.style.display = 'none';
        elIn.style.display  = 'block';
        const nameEl = document.getElementById('sync-user-name');
        if (nameEl) nameEl.textContent = _user.name;
        const avatarEl = document.getElementById('sync-user-avatar');
        if (avatarEl) {
            avatarEl.src           = _user.picture || '';
            avatarEl.style.display = _user.picture ? 'inline-block' : 'none';
        }
    } else {
        elOut.style.display = 'block';
        elIn.style.display  = 'none';
    }
    _setStatus('idle');
}

function _setStatus(state) {
    const el = document.getElementById('sync-status-text');
    if (!el) return;
    const now  = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const map  = {
        idle:    { text: '',                    color: '#888'    },
        syncing: { text: '🔄 מסנכרן...',        color: '#1565C0' },
        ok:      { text: `✅ סונכרן ב-${now}`,  color: '#2E7D32' },
        error:   { text: '❌ שגיאת סנכרון',     color: '#C62828' }
    };
    const s = map[state] || map.idle;
    el.textContent = s.text;
    el.style.color  = s.color;
}
