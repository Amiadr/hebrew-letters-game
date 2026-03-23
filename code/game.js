// Hebrew Letters Game - Main Game Logic

const HEBREW_ALPHABET = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת','ך','ם','ן','ף','ץ'];

const CONFUSABLE_MAP = {
    'ח': ['כ','ה','ך'], 'כ': ['ח','ה','ב','ך','ק'], 'ה': ['ח','כ','א','ע'],
    'ך': ['כ','ח','ה','ב'], 'ט': ['ת'], 'ת': ['ט'],
    'ד': ['ר'], 'ר': ['ד'], 'ו': ['ז','ן','ב'], 'ז': ['ו'],
    'ב': ['כ','ך','ו'], 'מ': ['ם'], 'ם': ['מ'],
    'נ': ['ן'], 'ן': ['נ','ו'], 'פ': ['ף'], 'ף': ['פ'],
    'צ': ['ץ'], 'ץ': ['צ'],
    'ק': ['כ'], 'ס': ['ש'], 'ש': ['ס'],
    'א': ['ע','ה'], 'ע': ['א','ה']
};

let gameState = {
    allWords: [], sessionWords: [],
    currentWordIndex: 0, currentLetterIndex: 0,
    correctLetters: [], disabledLetters: [],
    skippedWordIds: new Set(),
    buttonsCount: 4,
    buttonsRows: 1,
    hintEnabled: true,
    hintAfterErrors: 2,
    currentLetterErrors: 0,  // errors on the current letter (resets per letter)
    currentWordErrors: 0,    // errors on the current word (resets per word)
    wordStats: [],           // { word, category, categoryIcon, errors, wasSkipped }
    letterAnimationEnabled: true,
    playerName: ''
};

let successTimer = null;
let timerDuration = 5;

// ===== RANDOM =====
function seededShuffle(arr, seed) {
    let s = seed >>> 0;
    const rand = () => { s = Math.imul(1664525, s) + 1013904223 >>> 0; return s / 0x100000000; };
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getDistractors(targetLetter, count) {
    const confusable = CONFUSABLE_MAP[targetLetter] || [];
    const pool = HEBREW_ALPHABET.filter(l => l !== targetLetter && !confusable.includes(l));
    return seededShuffle(pool, Math.floor(Date.now() / 10)).slice(0, count - 1);
}

function getButtons(targetLetter, count) {
    return seededShuffle([targetLetter, ...getDistractors(targetLetter, count)], Math.floor(Date.now()));
}

// ===== WORD POOL — no-repeat across sessions =====
// Tracks played word IDs in settings so words cycle fully before repeating.
async function getNextSessionWords(active, wordsPerGame) {
    const target = Math.min(wordsPerGame, active.length);

    let played = (await getSetting('playedWordIds')) || [];
    // Drop IDs that no longer exist in the active word list
    played = played.filter(id => active.some(w => w.id === id));

    // Words not yet played in this cycle
    let available = active.filter(w => !played.includes(w.id));

    // If not enough unplayed words to fill a session, start a fresh cycle
    if (available.length < target) {
        played = [];
        available = [...active];
        await setSetting('playedWordIds', []);
    }

    const seed = Math.floor(Date.now() / 1000);
    const session = seededShuffle(available, seed).slice(0, target);

    // Persist which words have now been scheduled
    await setSetting('playedWordIds', [...played, ...session.map(w => w.id)]);
    return session;
}

// ===== GAME FLOW =====
async function startGame() {
    showScreen('screen-game');
    document.getElementById('game-loading').style.display = 'flex';
    document.getElementById('game-content').style.display = 'none';

    timerDuration = (await getSetting('timerDuration')) ?? 5;
    const wordsPerGame = (await getSetting('wordsPerGame')) ?? 10;

    // Button layout — use saved settings, or auto-detect from screen width
    const isMobile = window.innerWidth <= 600;
    const savedCount = await getSetting('buttonsCount');
    const savedRows  = await getSetting('buttonsRows');
    gameState.buttonsCount = savedCount ?? 4;
    gameState.buttonsRows  = savedRows  ?? 1;

    // Hint settings
    const hintEnabled     = await getSetting('hintEnabled');
    const hintAfterErrors = await getSetting('hintAfterErrors');
    gameState.hintEnabled     = hintEnabled !== false; // default true
    gameState.hintAfterErrors = hintAfterErrors ?? 2;

    // Letter animation & player name
    gameState.letterAnimationEnabled = (await getSetting('letterAnimationEnabled')) !== false;
    const pnEnabled = (await getSetting('playerNameEnabled')) !== false;
    const pnValue   = (await getSetting('playerName')) || '';
    gameState.playerName = (pnEnabled && pnValue) ? pnValue : '';

    // Reset stats for new game
    gameState.wordStats = [];
    gameState.currentWordErrors = 0;
    gameState.currentLetterErrors = 0;

    const allWords = await getAllWords();
    const showSilent = await getSetting('showSilentLetterWords');
    const imageIds = await getAllImageIds();
    const active = allWords.filter(w => {
        if (w.active === false) return false;
        if (!showSilent && w.hasSilentLetter === true) return false;
        if (!w.imageURL && !imageIds.has(w.id)) return false;
        return true;
    });
    if (active.length === 0) {
        showScreen('screen-start');
        alert('אין מילים זמינות. נסה לשנות את הגדרת "מילים עם אות שקטה" בהגדרות.');
        return;
    }

    gameState.sessionWords = await getNextSessionWords(active, wordsPerGame);
    gameState.currentWordIndex = 0;
    gameState.skippedWordIds = new Set();

    document.getElementById('game-loading').style.display = 'none';
    document.getElementById('game-content').style.display = 'flex';
    showCurrentWord();
}

function confirmStopGame() {
    if (confirm('לעצור את המשחק ולחזור לתפריט הראשי?')) {
        if (successTimer) { clearTimeout(successTimer); successTimer = null; }
        showScreen('screen-start');
    }
}

function skipWord() {
    if (successTimer) { clearTimeout(successTimer); successTimer = null; }
    const popup = document.getElementById('popup-word-success');
    popup.classList.add('hidden');
    popup.querySelectorAll('.star').forEach(s => s.classList.remove('star-pop'));

    const word = gameState.sessionWords[gameState.currentWordIndex];
    if (!word) return;

    // Each word may be skipped only once — after that the button is disabled
    if (gameState.skippedWordIds.has(word.id)) return;
    gameState.skippedWordIds.add(word.id);

    // Remove from current position and append to the end
    // The child must eventually solve every word
    gameState.sessionWords.splice(gameState.currentWordIndex, 1);
    gameState.sessionWords.push(word);
    // currentWordIndex now points to what was the next word — no increment needed
    showCurrentWord();
}

function showCurrentWord() {
    const word = gameState.sessionWords[gameState.currentWordIndex];
    if (!word) { showEndScreen(); return; }

    gameState.currentLetterIndex = 0;
    gameState.correctLetters = new Array(word.word.length).fill('');
    gameState.disabledLetters = [];
    gameState.currentLetterErrors = 0;
    gameState.currentWordErrors = 0;

    // Progress
    const idx = gameState.currentWordIndex;
    const total = gameState.sessionWords.length;
    document.getElementById('progress-text').textContent = `מילה ${idx + 1} מתוך ${total}`;
    document.getElementById('progress-fill').style.width = `${(idx / total) * 100}%`;

    // Skip button — disabled once a word has already been moved to end
    const skipBtn = document.getElementById('skip-word-btn');
    if (skipBtn) {
        const alreadySkipped = gameState.skippedWordIds.has(word.id);
        skipBtn.disabled = alreadySkipped;
        skipBtn.style.opacity = alreadySkipped ? '0.35' : '1';
    }

    // Category
    document.getElementById('category-icon').textContent = word.categoryIcon || '📦';
    document.getElementById('category-name').textContent = word.category || '';

    // Image
    loadWordImage(word);
    renderWordSlots();
    renderLetterButtons();
}

async function loadWordImage(word) {
    const imgEl = document.getElementById('word-image');
    const placeholder = createPlaceholderSVG(word.categoryIcon || '📷');
    imgEl.src = placeholder;
    const src = await getWordImageSrc(word);
    if (src) imgEl.src = src;
}

function renderWordSlots() {
    const word = gameState.sessionWords[gameState.currentWordIndex];
    const container = document.getElementById('word-slots');
    container.innerHTML = '';
    word.word.split('').forEach((letter, i) => {
        const slot = document.createElement('div');
        slot.className = 'letter-slot' + (gameState.correctLetters[i] ? ' filled' : '');
        slot.id = `slot-${i}`;
        slot.textContent = gameState.correctLetters[i] || '';
        container.appendChild(slot);
    });
}

function renderLetterButtons() {
    const word = gameState.sessionWords[gameState.currentWordIndex];
    if (gameState.currentLetterIndex >= word.word.length) return;
    const target = word.word[gameState.currentLetterIndex];

    const count = gameState.buttonsCount;
    const rows  = gameState.buttonsRows;
    const cols  = Math.ceil(count / rows);

    const buttons = getButtons(target, count);
    const container = document.getElementById('letter-buttons');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    buttons.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = letter;
        btn.dataset.letter = letter;
        if (gameState.disabledLetters.includes(letter)) {
            btn.disabled = true;
            // Add semi-transparent overlay (letter still visible under it)
            const overlay = document.createElement('div');
            overlay.className = 'wrong-overlay';
            overlay.textContent = '✗';
            btn.appendChild(overlay);
        }
        btn.addEventListener('click', () => handleLetterClick(letter, btn));
        container.appendChild(btn);
    });
}

function handleLetterClick(letter, btn) {
    if (btn.disabled) return;
    if (typeof getAudioCtx === 'function') getAudioCtx(); // resume audio context
    const word = gameState.sessionWords[gameState.currentWordIndex];
    const target = word.word[gameState.currentLetterIndex];

    if (letter === target) {
        // Correct!
        playSuccess();
        btn.classList.add('btn-correct');
        btn.disabled = true;
        const slotIdx = gameState.currentLetterIndex;
        gameState.correctLetters[slotIdx] = letter;
        gameState.currentLetterIndex++;
        gameState.currentLetterErrors = 0; // reset for next letter
        gameState.disabledLetters = [];
        const slot   = document.getElementById(`slot-${slotIdx}`);
        const isLast = gameState.currentLetterIndex >= word.word.length;
        const landLetter = () => {
            if (slot) {
                slot.textContent = letter;
                slot.classList.add('filled', 'slot-pop');
                setTimeout(() => slot.classList.remove('slot-pop'), 400);
            }
            if (isLast) {
                setTimeout(showWordSuccess, 500);
            } else {
                setTimeout(renderLetterButtons, 300);
            }
        };
        if (gameState.letterAnimationEnabled && slot) {
            animateLetterToSlot(letter, btn, slot, landLetter);
        } else {
            landLetter();
        }
    } else {
        // Wrong
        playError();
        btn.disabled = true;
        btn.classList.add('btn-shake');
        const overlay = document.createElement('div');
        overlay.className = 'wrong-overlay';
        overlay.textContent = '✗';
        btn.appendChild(overlay);
        gameState.disabledLetters.push(letter);
        gameState.currentLetterErrors++;
        gameState.currentWordErrors++;
        setTimeout(() => btn.classList.remove('btn-shake'), 400);
        // Show hint if threshold reached
        if (gameState.hintEnabled && gameState.currentLetterErrors >= gameState.hintAfterErrors) {
            showLetterHint(target);
        }
    }
}

function showLetterHint(targetLetter) {
    document.querySelectorAll('.letter-btn').forEach(btn => {
        if (btn.dataset.letter === targetLetter && !btn.disabled) {
            btn.classList.add('btn-hint');
        }
    });
}

async function showWordSuccess() {
    playCelebration();
    timerDuration = (await getSetting('timerDuration')) ?? 5;

    // Record stats for this word
    const word = gameState.sessionWords[gameState.currentWordIndex];
    gameState.wordStats.push({
        word:         word.word,
        category:     word.category     || '',
        categoryIcon: word.categoryIcon || '📦',
        errors:       gameState.currentWordErrors,
        wasSkipped:   gameState.skippedWordIds.has(word.id)
    });

    // Personalised greeting
    const name = gameState.playerName;
    document.getElementById('popup-congrats-text').textContent = name ? `כל הכבוד, ${name}!` : 'כל הכבוד!';

    // Populate word + image in popup
    document.getElementById('popup-word-label').textContent = word.word;
    const popupImg = document.getElementById('popup-word-image');
    if (popupImg) {
        popupImg.src = createPlaceholderSVG(word.categoryIcon || '📷');
        getWordImageSrc(word).then(url => { if (url && popupImg) popupImg.src = url; });
    }

    const popup = document.getElementById('popup-word-success');
    popup.classList.remove('hidden');
    popup.querySelectorAll('.star').forEach((s, i) => setTimeout(() => s.classList.add('star-pop'), i * 150));

    // Timer bar
    const bar = document.getElementById('timer-bar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.style.transition = `width ${timerDuration}s linear`;
        bar.style.width = '0%';
    }));
    successTimer = setTimeout(nextWord, timerDuration * 1000);
}

function nextWordNow() {
    if (successTimer) { clearTimeout(successTimer); successTimer = null; }
    nextWord();
}

function nextWord() {
    if (successTimer) { clearTimeout(successTimer); successTimer = null; }
    const popup = document.getElementById('popup-word-success');
    popup.classList.add('hidden');
    popup.querySelectorAll('.star').forEach(s => s.classList.remove('star-pop'));
    const bar = document.getElementById('timer-bar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    gameState.currentWordIndex++;
    if (gameState.currentWordIndex >= gameState.sessionWords.length) {
        showEndScreen();
    } else {
        showCurrentWord();
    }
}

function showEndScreen() {
    playCelebration();
    document.getElementById('end-score').textContent = gameState.sessionWords.length;
    const name = gameState.playerName;
    document.getElementById('end-title-text').textContent = name ? `כל הכבוד, ${name}!` : 'כל הכבוד!';
    showScreen('screen-end');
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ===== LETTER FLY ANIMATION =====
function animateLetterToSlot(letter, btnEl, slotEl, onDone) {
    const bR = btnEl.getBoundingClientRect();
    const sR = slotEl.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.textContent = letter;
    fly.style.cssText = `
        position:fixed;
        left:${bR.left + bR.width  / 2}px;
        top:${bR.top  + bR.height / 2}px;
        transform:translate(-50%,-50%) scale(1);
        font-size:2.4rem; font-weight:900; font-family:inherit;
        color:white;
        background:linear-gradient(135deg,#43A047,#2E7D32);
        border-radius:14px; padding:6px 14px;
        box-shadow:0 4px 14px rgba(0,0,0,.3);
        z-index:999; pointer-events:none;
        transition:left .38s cubic-bezier(.34,1.3,.64,1),
                   top .38s cubic-bezier(.34,1.3,.64,1),
                   transform .38s cubic-bezier(.34,1.3,.64,1),
                   opacity .12s .28s;
    `;
    document.body.appendChild(fly);
    fly.getBoundingClientRect(); // force reflow before transition
    fly.style.left      = `${sR.left + sR.width  / 2}px`;
    fly.style.top       = `${sR.top  + sR.height / 2}px`;
    fly.style.transform = 'translate(-50%,-50%) scale(0.7)';
    fly.style.opacity   = '0';
    setTimeout(() => { fly.remove(); onDone(); }, 420);
}

// ===== START SCREEN — PLAYER NAME =====
async function initStartScreen() {
    const enabled = (await getSetting('playerNameEnabled')) !== false;
    const name    = (await getSetting('playerName')) || '';
    const section = document.getElementById('player-name-section');
    if (section) section.style.display = enabled ? 'flex' : 'none';
    const input = document.getElementById('player-name-input');
    if (input) input.value = name;
    updateWordFilterLabel();
}

async function savePlayerName(val) {
    await setSetting('playerName', val.trim());
}

async function updateWordFilterLabel() {
    const showSilent = await getSetting('showSilentLetterWords');
    const label = document.getElementById('word-filter-label');
    if (label) label.textContent = showSilent ? 'סינון מילים: הגייה מפורשת + אות שקטה' : 'סינון מילים: הגייה מפורשת בלבד';
}

async function openWordFilterPopup() {
    const showSilent = await getSetting('showSilentLetterWords');
    const toggle = document.getElementById('word-filter-popup-toggle');
    if (toggle) toggle.checked = showSilent === true;
    const popup = document.getElementById('word-filter-popup');
    if (popup) popup.style.display = 'flex';
}

function closeWordFilterPopup(e) {
    if (e && e.target !== document.getElementById('word-filter-popup')) return;
    const popup = document.getElementById('word-filter-popup');
    if (popup) popup.style.display = 'none';
}

async function setShowSilentLetterWordsFromPopup(enabled) {
    await setSetting('showSilentLetterWords', enabled);
    updateWordFilterLabel();
    // sync settings screen toggle if open
    const settingsToggle = document.getElementById('silent-letter-toggle');
    if (settingsToggle) settingsToggle.checked = enabled;
    const settingsLabel = document.getElementById('silent-letter-label');
    if (settingsLabel) settingsLabel.textContent = enabled ? 'מופעל' : 'כבוי';
}

// ===== PARENT / TEACHER REPORT =====
function showParentReport() {
    const stats = gameState.wordStats;
    const totalWords    = stats.length;
    const totalErrors   = stats.reduce((sum, s) => sum + s.errors, 0);
    const perfectWords  = stats.filter(s => s.errors === 0 && !s.wasSkipped).length;
    const skippedCount  = stats.filter(s => s.wasSkipped).length;

    let html = `
        <div class="report-summary">
            <div class="report-stat">
                <span class="report-stat-num">${totalWords}</span>
                <span class="report-stat-lbl">מילים הושלמו</span>
            </div>
            <div class="report-stat">
                <span class="report-stat-num">${perfectWords}</span>
                <span class="report-stat-lbl">ללא שגיאות ⭐</span>
            </div>
            <div class="report-stat">
                <span class="report-stat-num">${totalErrors}</span>
                <span class="report-stat-lbl">סה"כ שגיאות</span>
            </div>
            <div class="report-stat">
                <span class="report-stat-num">${skippedCount}</span>
                <span class="report-stat-lbl">דולגו</span>
            </div>
        </div>`;

    if (stats.length > 0) {
        html += `<table class="report-table">
            <thead><tr>
                <th>מילה</th>
                <th>קטגוריה</th>
                <th>שגיאות</th>
                <th></th>
            </tr></thead>
            <tbody>`;
        stats.forEach(s => {
            const errColor = s.errors === 0 ? '#2E7D32' : s.errors <= 2 ? '#F57F17' : '#C62828';
            const skippedBadge = s.wasSkipped
                ? ' <span style="font-size:.75rem;background:#FFF3E0;color:#E65100;border-radius:6px;padding:2px 6px;">דולג</span>'
                : '';
            html += `<tr>
                <td><strong>${s.categoryIcon} ${s.word}</strong>${skippedBadge}</td>
                <td>${s.category}</td>
                <td style="color:${errColor}; font-weight:bold;">${s.errors}</td>
                <td>${s.errors === 0 ? '⭐' : ''}</td>
            </tr>`;
        });
        html += '</tbody></table>';
    } else {
        html += '<p style="text-align:center; color:#888; padding:20px;">אין נתונים להצגה</p>';
    }

    document.getElementById('report-content').innerHTML = html;
    document.getElementById('report-modal').classList.remove('hidden');
}

function closeParentReport() {
    document.getElementById('report-modal').classList.add('hidden');
}
