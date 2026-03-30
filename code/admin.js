// Hebrew Letters Game - Admin Panel Logic

const EMOJI_LIST = [
    // 🐾 בעלי חיים — יבשה
    '🐾','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸',
    '🐵','🙈','🐔','🐧','🐦','🦅','🦉','🦚','🦜','🦢','🦩','🦃','🐢','🦎','🐍',
    '🦖','🦕','🐊','🐘','🦣','🦛','🦏','🐪','🦒','🦓','🐆','🐅','🦬','🐂','🐄',
    '🐖','🐑','🐐','🦙','🦘','🦥','🦦','🦨','🦡','🦔','🐇','🐿️','🦫','🐓','🦤',
    // 🐾 בעלי חיים — ים ואוויר
    '🐠','🐡','🐟','🦈','🐬','🐳','🐋','🦭','🐙','🦑','🦞','🦀','🦐','🪸','🦋',
    '🐛','🐝','🪲','🐞','🦗','🕷️','🦂','🦟',
    // 📦 חפצים, כלים וטכנולוגיה
    '📦','🏠','🚪','🛏️','🪑','🛋️','🪞','🪟','🛁','🚿','🪥','🧴','🧼','🧹','🧺',
    '🧻','🧽','🔑','🗝️','🪝','🔧','🔨','🪛','🔩','⚙️','🧲','💡','🔦','🕯️','🪔',
    '📷','📱','🖥️','⌨️','📺','📻','📡','☎️','📞','🔭','🔬','🧪','🧫','🧬','💊',
    '🎨','🖌️','✏️','🖊️','📝','📚','📖','📌','📍','🗓️','📊','📈','🎒','🏺','🎁',
    '🧸','🪆','🎠','🎡','🎢','🎪','🎭','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺',
    '🎸','🪗','🎻','🎲','🧩','♟️','🃏','🎯','🪃','🏹','🪁','🎮','🕹️','🃏','🎱',
    // 🌿 טבע, מזג אוויר ועולם
    '🌿','🌳','🌲','🌴','🌵','🎋','🌾','🍀','🍁','🍂','🌺','🌸','🌹','🌷','🌼',
    '🌻','💐','🌱','🪷','🪻','🍄','🌶️','🧅','🌰','🪨','🌊','🔥','❄️','💧','🍃',
    '☀️','🌙','⭐','🌟','💫','⚡','🌈','⛅','☁️','🌧️','⛈️','🌩️','🌨️','🌀','🌪️',
    '🏔️','⛰️','🌋','🏝️','🏜️','🌅','🌄','🌠','🌌','🌍','🌎','🌏','🌁','⛺','🪸',
    // 🍎 אוכל ושתייה
    '🍎','🍏','🍐','🍊','🍋','🍌','🍍','🥭','🍇','🍓','🫐','🍈','🍉','🍑','🍒',
    '🥝','🍅','🥥','🥑','🍆','🥦','🥬','🥒','🌽','🥕','🍠','🧅','🧄','🥜','🫘',
    '🍞','🥐','🥖','🫓','🥨','🧀','🥚','🍳','🧇','🥞','🧈','🥓','🍖','🍗','🌮',
    '🌯','🥙','🧆','🍜','🍝','🍛','🍲','🫕','🍱','🍣','🍤','🍙','🍚','🍘','🍥',
    '🧁','🎂','🍰','🍮','🍭','🍬','🍫','🍿','🧂','🍦','🍧','🍨','🍩','🍪','🫗',
    '☕','🍵','🧋','🥛','🍼','🧃','🥤','🧊','🍶','🍷','🥂','🫖','🍺','🥃','🧉',
    // 👋 גוף, בריאות ואנשים
    '👋','👁️','👂','🦷','💪','🦵','🦶','🤲','👐','🙌','👏','🤝','👍','✌️','🫶',
    '❤️','🧠','🦴','👃','🫦','👣','💅','🦾','💊','🩺','🩹','🏥','🚑','🧬','🩻',
    '👶','🧒','👦','👧','🧑','👨','👩','👴','👵','👨‍👩‍👧','🧑‍⚕️','🧑‍🏫','🧑‍🍳','🧑‍🎨','🧑‍🚒',
    // 😊 פרצופים ורגשות
    '😀','😁','😂','🤣','😊','😎','😍','🥰','😘','🤗','🤩','🥳','😴','🤔','😬',
    '😱','😭','😤','🤪','🥹','😇','🤓','😏','🙄','😐','🫠','🥸','😵','🤯','🫡',
    // 🏆 פעילויות וספורט
    '⭐','🎵','🏆','🎈','🎊','💫','🏅','🥇','🥈','🥉','🎖️','🏵️','🎗️','🎀','🎉',
    '⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥊','🥋','🎽','🏒','🏓','🏸','🏹','🎯',
    '🛷','⛸️','🎿','⛷️','🏂','🏊','🚵','🧗','🎣','🤿','🏋️','🤸','🚴','🏄','🧘',
    // 🚗 תחבורה
    '🚗','🚕','🛻','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🏍️',
    '🛵','🚲','🛴','🛹','🛼','🚂','🚃','🚄','🚇','🚊','🚀','🛸','✈️','🚁','🛶',
    '⛵','🚤','🛥️','🛳️','🚢','🛰️','🪂','⛽','🚏','🛣️','🌉','🗺️','🧭','⚓','🚧',
    // 🏡 מקומות ומבנים
    '🏡','🏠','🏢','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏭','🏯','🏰','⛩️','🕌',
    '🕍','⛪','💒','🗼','🗽','🗿','🏟️','🎠','🎡','🎢','🎪','🌆','🌇','🌃','🌉',
    // 👗 ביגוד ואביזרים
    '👒','🎩','🧢','⛑️','🪖','🧣','🧤','🧥','👚','👕','👔','👗','👘','🥻','👙',
    '🩱','🩲','🩳','👖','🩴','👞','👟','🥾','👠','👡','👢','🥿','👑','💍','💎',
];


let adminWords = [];
let pendingNewImage = null;
let pendingDeleteImage = false;
let editingWordId = null;
let selectedCategoryIcon = '⭐';
let newCatSelectedIcon = '⭐';
let currentSearchTerm = '';
let currentSearchPage = 1;

// ===== INIT / OPEN =====
async function openAdmin() {
    showScreen('screen-admin');
    showAdminTab('tab-words');
    await refreshAdminList();
}

async function refreshAdminList() {
    adminWords = await getAllWords();
    adminWords.sort((a, b) => (a.word || '').localeCompare(b.word || '', 'he'));
    renderAdminList();
    await refreshCategorySelect();
}

// ===== TABS =====
function showAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active-tab'));
    document.getElementById(tabId).style.display = '';
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active-tab');
}

// ===== WORD LIST =====
function renderAdminList() {
    const container = document.getElementById('admin-word-list');
    container.innerHTML = '';
    if (adminWords.length === 0) {
        container.innerHTML = '<p class="admin-empty">אין מילים עדיין. הוסף מילה חדשה!</p>';
        return;
    }
    adminWords.forEach(word => {
        const isActive = word.active !== false;
        const card = document.createElement('div');
        card.className = 'admin-word-card' + (isActive ? '' : ' inactive');
        card.dataset.wordId = word.id;
        card.innerHTML = `
            <div class="admin-card-img-wrap">
                <img id="admin-img-${word.id}" src="${createPlaceholderSVG(word.categoryIcon||'📷')}" alt="${word.word}" class="admin-card-img"/>
            </div>
            <div class="admin-card-info">
                <div class="admin-card-word-row">
                    <div class="admin-card-word">${word.word}</div>
                    <label class="admin-active-toggle" onclick="event.stopPropagation()">
                        <input type="checkbox" ${isActive ? 'checked' : ''}
                               onchange="toggleWordActive('${word.id}', this.checked)">
                        <span class="admin-toggle-slider"></span>
                    </label>
                </div>
                <div class="admin-card-cat-row">
                    <div class="admin-card-cat">${word.categoryIcon||''} ${word.category||''}</div>
                    <div class="admin-toggle-label ${isActive ? 'active' : 'inactive'}">${isActive ? 'פעיל' : 'מושבת'}</div>
                </div>
            </div>
            <div class="admin-card-actions">
                <button class="admin-btn-edit" onclick="openEditWord('${word.id}')">✏️ עריכה</button>
                <button class="admin-btn-delete" onclick="confirmDeleteWord('${word.id}','${word.word}')">🗑️</button>
            </div>`;
        container.appendChild(card);
        getWordImageSrc(word).then(url => {
            const img = document.getElementById(`admin-img-${word.id}`);
            if (img && url) img.src = url;
        });
    });
}

// ===== CATEGORY SELECT =====
async function refreshCategorySelect(keepValue) {
    const cats = await getCategories();
    const select = document.getElementById('input-category');
    const prev = keepValue || select?.value;
    if (!select) return;
    select.innerHTML = '';
    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.icon + ' ' + cat.name;
        select.appendChild(opt);
    });
    if (prev && [...select.options].some(o => o.value === prev)) select.value = prev;
    onCategorySelectChange();
}

function onCategorySelectChange() {
    const select = document.getElementById('input-category');
    if (!select) return;
    const val = select.value;
    // Update the icon preview next to the select
    getCategories().then(cats => {
        const cat = cats.find(c => c.name === val);
        const iconEl = document.getElementById('selected-cat-icon-preview');
        if (iconEl) iconEl.textContent = cat ? cat.icon : '⭐';
        selectedCategoryIcon = cat ? cat.icon : '⭐';
    });
}

// ===== CATEGORY MANAGER MODAL =====
async function openCategoryManager() {
    await renderCategoryManagerList();
    renderIconPicker('new-cat-icon-grid', newCatSelectedIcon, (icon) => {
        newCatSelectedIcon = icon;
        document.getElementById('new-cat-icon-preview').textContent = icon;
    });
    document.getElementById('new-cat-name').value = '';
    document.getElementById('cat-manager-modal').classList.remove('hidden');
}

function closeCategoryManager() {
    document.getElementById('cat-manager-modal').classList.add('hidden');
}

async function renderCategoryManagerList() {
    const cats = await getCategories();
    const container = document.getElementById('cat-manager-list');
    container.innerHTML = '';
    cats.forEach((cat, idx) => {
        const row = document.createElement('div');
        row.className = 'cat-manager-row';
        row.innerHTML = `
            <button class="cat-icon-btn" onclick="openIconPickerForCat(${idx})"
                    id="cat-icon-btn-${idx}" title="שנה איקון">${cat.icon}</button>
            <span class="cat-manager-name">${cat.name}</span>
            <button class="cat-delete-btn" onclick="deleteCategoryAt(${idx})" title="מחק קטגוריה">🗑️</button>`;
        container.appendChild(row);
    });
}

let editingCatIndex = -1;

async function openIconPickerForCat(idx) {
    editingCatIndex = idx;
    const cats = await getCategories();
    const currentIcon = cats[idx]?.icon || '⭐';
    renderIconPicker('edit-cat-icon-grid', currentIcon, async (icon) => {
        const c = await getCategories();
        c[idx].icon = icon;
        await saveCategories(c);
        const btn = document.getElementById(`cat-icon-btn-${idx}`);
        if (btn) btn.textContent = icon;
        await refreshCategorySelect();
    });
    document.getElementById('edit-cat-icon-popup').classList.remove('hidden');
}

function closeEditCatIconPopup() {
    document.getElementById('edit-cat-icon-popup').classList.add('hidden');
    editingCatIndex = -1;
}

async function deleteCategoryAt(idx) {
    const cats = await getCategories();
    const cat = cats[idx];
    const inUse = adminWords.some(w => w.category === cat.name);
    if (inUse) {
        alert(`הקטגוריה "${cat.name}" בשימוש. לא ניתן למחוק.`);
        return;
    }
    if (!confirm(`למחוק את הקטגוריה "${cat.name}"?`)) return;
    cats.splice(idx, 1);
    await saveCategories(cats);
    await renderCategoryManagerList();
    await refreshCategorySelect();
}

async function saveNewCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) { alert('יש להזין שם קטגוריה'); return; }
    const cats = await getCategories();
    if (cats.some(c => c.name === name)) { alert('קטגוריה זו כבר קיימת'); return; }
    cats.push({ name, icon: newCatSelectedIcon });
    await saveCategories(cats);
    await renderCategoryManagerList();
    await refreshCategorySelect(name);
    document.getElementById('new-cat-name').value = '';
    showAdminToast(`הקטגוריה "${name}" נוספה`);
}

// ===== ICON PICKER =====
function renderIconPicker(containerId, selectedIcon, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // ── Custom free-text emoji input (spans full grid width) ──
    const customRow = document.createElement('div');
    customRow.style.cssText = 'grid-column:1/-1; display:flex; gap:8px; align-items:center; padding:4px 2px 8px; border-bottom:1px solid #E0E0E0; margin-bottom:4px;';
    const lbl = document.createElement('label');
    lbl.style.cssText = 'font-size:.82rem; color:#666; white-space:nowrap; flex-shrink:0;';
    lbl.textContent = 'אמוג\'י חופשי:';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = 'הדבק/הקלד כל אמוג\'י 😊';
    inp.style.cssText = 'flex:1; padding:5px 8px; border:2px solid #E0E0E0; border-radius:8px; font-size:1.2rem; outline:none; font-family:inherit; direction:ltr; text-align:center;';
    inp.addEventListener('focus', () => inp.style.borderColor = '#1976D2');
    inp.addEventListener('blur',  () => inp.style.borderColor = '#E0E0E0');
    inp.addEventListener('input', () => {
        // Take the first grapheme cluster (emoji or character) from the input
        const first = [...inp.value.trim()][0];
        if (!first) return;
        container.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('selected'));
        onSelect(first);
    });
    customRow.appendChild(lbl);
    customRow.appendChild(inp);
    container.appendChild(customRow);

    // ── Emoji grid ──
    EMOJI_LIST.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-pick-btn' + (emoji === selectedIcon ? ' selected' : '');
        btn.textContent = emoji;
        btn.onclick = () => {
            container.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            inp.value = '';   // clear custom input when grid item chosen
            onSelect(emoji);
        };
        container.appendChild(btn);
    });
}

// ===== ADD / EDIT WORD =====
function openAddWord() {
    editingWordId = null;
    pendingNewImage = null;
    pendingDeleteImage = false;
    document.getElementById('form-title').textContent = 'הוסף מילה חדשה';
    document.getElementById('input-word').value = '';
    document.getElementById('input-silent-letter').checked = false;
    clearImagePreview();
    clearImageSearch();
    document.getElementById('img-search-term').value = '';
    refreshCategorySelect();
    document.getElementById('word-form-modal').classList.remove('hidden');
}

async function toggleWordActive(id, isActive) {
    const word = await getWord(id);
    if (!word) return;
    word.active = isActive;
    if (id.startsWith('def_')) {
        const cf = new Set(word._customFields || []);
        cf.add('active');
        word._customFields = Array.from(cf);
    }
    await saveWord(word);
    const card = document.querySelector(`.admin-word-card[data-word-id="${id}"]`);
    if (card) {
        card.classList.toggle('inactive', !isActive);
        const label = card.querySelector('.admin-toggle-label');
        if (label) {
            label.textContent = isActive ? 'פעיל' : 'מושבת';
            label.className = 'admin-toggle-label ' + (isActive ? 'active' : 'inactive');
        }
    }
}

async function openEditWord(id) {
    editingWordId = id;
    pendingNewImage = null;
    pendingDeleteImage = false;
    const word = adminWords.find(w => w.id === id);
    if (!word) return;
    document.getElementById('form-title').textContent = 'ערוך מילה';
    document.getElementById('input-word').value = word.word;
    document.getElementById('input-silent-letter').checked = word.hasSilentLetter === true;
    clearImagePreview();
    clearImageSearch();
    document.getElementById('img-search-term').value = '';
    await refreshCategorySelect(word.category);
    const url = await getWordImageSrc(word);
    if (url) showImagePreview(url, false);
    document.getElementById('word-form-modal').classList.remove('hidden');
}

function closeWordForm() {
    document.getElementById('word-form-modal').classList.add('hidden');
    pendingNewImage = null;
    pendingDeleteImage = false;
    editingWordId = null;
    clearImageSearch();
}

function clearImagePreview(userAction = false) {
    document.getElementById('img-preview').src = '';
    document.getElementById('img-preview-wrap').style.display = 'none';
    document.getElementById('img-placeholder').style.display = 'flex';
    const replEl = document.getElementById('img-upload-replace');
    if (replEl) replEl.style.display = 'none';
    pendingNewImage = null;
    if (userAction && editingWordId) pendingDeleteImage = true;
}

function showImagePreview(url, isNew = true) {
    document.getElementById('img-preview').src = url;
    document.getElementById('img-preview-wrap').style.display = 'block';
    document.getElementById('img-placeholder').style.display = 'none';
    const replEl = document.getElementById('img-upload-replace');
    if (replEl) replEl.style.display = '';
    if (isNew) pendingNewImage = { url };
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        showImagePreview(ev.target.result, true);
        pendingNewImage = { dataURL: ev.target.result };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

async function saveWordForm() {
    const wordText = document.getElementById('input-word').value.trim();
    const categoryName = document.getElementById('input-category').value;

    if (!wordText) { showFormError('יש להזין את המילה'); return; }
    if (!editingWordId && !pendingNewImage) { showFormError('יש לבחור תמונה'); return; }

    // Category icon
    const cats = await getCategories();
    const cat = cats.find(c => c.name === categoryName);
    const catIcon = cat?.icon || '⭐';

    // Duplicate word check
    const duplicate = adminWords.find(w => w.word === wordText && w.id !== editingWordId);
    if (duplicate) {
        const existUrl = await getWordImageSrc(duplicate);
        const newUrl = pendingNewImage?.dataURL || pendingNewImage?.url || null;
        if (await confirmDuplicate(wordText, existUrl, newUrl)) {
            await deleteWordById(duplicate.id);
        } else return;
    }

    const isEditing = !!editingWordId;
    const id = editingWordId || ('word_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));

    // Fetch existing word to preserve fields (imageURL, dateAdded, active, etc.)
    const existingWord = isEditing ? (await getWord(id)) : null;
    const customFields = new Set(existingWord?._customFields || []);

    const wordData = {
        ...(existingWord || {}),
        id,
        word: wordText,
        category: categoryName || 'אחר',
        categoryIcon: catIcon,
        dateAdded: existingWord?.dateAdded || new Date().toISOString().split('T')[0],
        active: existingWord?.active !== undefined ? existingWord.active : true,
        hasSilentLetter: document.getElementById('input-silent-letter').checked
    };

    // Track which fields the user changed on an existing default word
    if (isEditing && existingWord?.id?.startsWith('def_')) {
        if (wordText     !== existingWord.word)            customFields.add('word');
        if (categoryName !== existingWord.category)        customFields.add('category');
        if (wordData.hasSilentLetter !== existingWord.hasSilentLetter) customFields.add('hasSilentLetter');
    }

    if (pendingDeleteImage) {
        // User explicitly removed the image → delete from DB
        await deleteImage(id);
        wordData.imageURL = null;
        wordData._defWordVersion = existingWord?._defWordVersion ?? 0;
    } else if (pendingNewImage?.dataURL) {
        // Locally uploaded image → store in IndexedDB, clear any stale external URL
        await saveImage({ id, dataURL: pendingNewImage.dataURL });
        wordData.imageURL = null;
    } else if (pendingNewImage?.url) {
        // External URL — try to download and save locally so it works offline
        const dataURL = await fetchImageAsDataURL(pendingNewImage.url);
        if (dataURL) {
            await saveImage({ id, dataURL });
            wordData.imageURL = null;
        } else {
            await deleteImage(id);
            wordData.imageURL = pendingNewImage.url;
        }
    }
    // else: no new image selected → existing image preserved via spread above

    // Track image change only for default words
    if ((pendingDeleteImage || pendingNewImage) && id.startsWith('def_')) {
        customFields.add('image');
    }

    wordData._customFields = Array.from(customFields);

    await saveWord(wordData);
    closeWordForm();
    await refreshAdminList();
    showAdminToast(isEditing ? 'המילה עודכנה בהצלחה' : 'המילה נוספה בהצלחה');
}

function showFormError(msg) {
    const el = document.getElementById('form-error');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

// ===== IMAGE SEARCH =====
let imageSearchTimeout = null;

function onWordInputChange() {
    clearTimeout(imageSearchTimeout);
    const val = document.getElementById('input-word').value.trim();
    if (!val) return;
    // Prefill search term if empty
    const st = document.getElementById('img-search-term');
    if (!st.value.trim()) st.value = val;
}

async function triggerImageSearch() {
    const searchTerm = document.getElementById('img-search-term').value.trim()
                    || document.getElementById('input-word').value.trim();
    if (!searchTerm) { showFormError('הזן מילת חיפוש'); return; }

    currentSearchTerm = searchTerm;
    currentSearchPage = 1;

    const wrap = document.getElementById('img-search-results');
    wrap.innerHTML = '<div class="search-loading">🔍 מחפש תמונות...</div>';
    wrap.style.display = 'grid';

    const results = await searchImages(searchTerm, 20, 1);
    wrap.innerHTML = '';

    if (results.length === 0) {
        wrap.innerHTML = '<p class="search-empty">לא נמצאו תמונות. נסה מילה באנגלית.</p>';
        return;
    }

    appendSearchResults(wrap, results);
    if (results.length >= 20) addLoadMoreButton(wrap);
}

function appendSearchResults(wrap, results) {
    results.forEach(r => {
        const div = document.createElement('div');
        div.className = 'search-img-item';
        div.title = r.title;
        if (r.attribution) div.dataset.attribution = r.attribution;
        const img = document.createElement('img');
        img.src = r.url;
        img.alt = r.title;
        img.loading = 'lazy';
        img.onerror = () => div.style.display = 'none';
        div.addEventListener('click', (e) => selectSearchImage(r.url, e.currentTarget, r.attribution || ''));
        div.appendChild(img);
        wrap.appendChild(div);
    });
}

function addLoadMoreButton(wrap) {
    const btnWrap = document.createElement('div');
    btnWrap.id = 'load-more-wrap';
    btnWrap.style.cssText = 'grid-column:1/-1;text-align:center;padding:6px 0;';
    const btn = document.createElement('button');
    btn.id = 'load-more-btn';
    btn.type = 'button';
    btn.className = 'btn-search-img';
    btn.style.width = '100%';
    btn.textContent = '⬇ טען עוד תמונות';
    btn.onclick = loadMoreImages;
    btnWrap.appendChild(btn);
    wrap.appendChild(btnWrap);
}

async function loadMoreImages() {
    if (!currentSearchTerm) return;
    currentSearchPage++;

    const wrap = document.getElementById('img-search-results');
    const oldBtn = document.getElementById('load-more-wrap');
    if (oldBtn) oldBtn.remove();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'load-more-loading';
    loadingDiv.className = 'search-loading';
    loadingDiv.style.gridColumn = '1/-1';
    loadingDiv.textContent = '🔍 טוען עוד תמונות...';
    wrap.appendChild(loadingDiv);

    const results = await searchImages(currentSearchTerm, 20, currentSearchPage);
    loadingDiv.remove();

    if (results.length === 0) {
        const noMore = document.createElement('p');
        noMore.className = 'search-empty';
        noMore.style.gridColumn = '1/-1';
        noMore.textContent = 'אין עוד תמונות להצגה';
        wrap.appendChild(noMore);
        return;
    }

    appendSearchResults(wrap, results);
    if (results.length >= 20) addLoadMoreButton(wrap);
}

function selectSearchImage(url, el, attribution) {
    showImagePreview(url, true);
    pendingNewImage = { url };
    document.querySelectorAll('.search-img-item').forEach(i => i.classList.remove('selected'));
    if (el) el.classList.add('selected');
    const attrEl = document.getElementById('img-attribution-line');
    if (attrEl) {
        attrEl.textContent = attribution || '';
        attrEl.style.display = attribution ? '' : 'none';
    }
}

function clearImageSearch() {
    const wrap = document.getElementById('img-search-results');
    if (wrap) { wrap.innerHTML = ''; wrap.style.display = 'none'; }
    const attrEl = document.getElementById('img-attribution-line');
    if (attrEl) { attrEl.textContent = ''; attrEl.style.display = 'none'; }
    currentSearchTerm = '';
    currentSearchPage = 1;
}

// ===== DUPLICATE MODAL =====
function confirmDuplicate(word, existingUrl, newUrl) {
    return new Promise(resolve => {
        const modal = document.getElementById('duplicate-modal');
        document.getElementById('dup-word').textContent = word;
        document.getElementById('dup-existing-img').src = existingUrl || '';
        const newWrap = document.getElementById('dup-new-wrap');
        document.getElementById('dup-new-img').src = newUrl || '';
        newWrap.style.display = newUrl ? 'block' : 'none';
        modal.classList.remove('hidden');
        const cleanup = () => modal.classList.add('hidden');
        document.getElementById('dup-btn-confirm').onclick = () => { cleanup(); resolve(true); };
        document.getElementById('dup-btn-cancel').onclick = () => { cleanup(); resolve(false); };
    });
}

// ===== DELETE =====
function confirmDeleteWord(id, word) {
    if (confirm(`למחוק את המילה "${word}"?`)) {
        deleteWordById(id).then(() => { refreshAdminList(); showAdminToast('המילה נמחקה'); });
    }
}

// ===== SETTINGS =====
async function loadSettings() {
    const dur = (await getSetting('timerDuration')) ?? 5;
    document.getElementById('timer-slider').value = dur;
    document.getElementById('timer-value-label').textContent = dur + ' שניות';

    const key = (await getSetting('pixabayKey')) || '';
    document.getElementById('pixabay-key-input').value = key;
    updatePixabayStatus(key);

    const unsplashKey = (await getSetting('unsplashKey')) || '';
    document.getElementById('unsplash-key-input').value = unsplashKey;
    updateApiKeyStatus('unsplash-status', unsplashKey, 'Unsplash');

    const pexelsKey = (await getSetting('pexelsKey')) || '';
    document.getElementById('pexels-key-input').value = pexelsKey;
    updateApiKeyStatus('pexels-status', pexelsKey, 'Pexels');

    const wordsCount = (await getSetting('wordsPerGame')) ?? 10;
    const activeCount = (await getAllWords()).filter(w => w.active !== false).length;
    const maxWords = Math.max(activeCount, 3);
    const input = document.getElementById('words-count-input');
    input.max = maxWords;
    input.value = Math.min(wordsCount, maxWords);
    const rangeLabel = document.getElementById('words-count-range-label');
    if (rangeLabel) rangeLabel.textContent = `מילים (3–${maxWords})`;
    updateWordsCountPresets(Math.min(wordsCount, maxWords));

    const savedCount = (await getSetting('buttonsCount')) ?? 4;
    const savedRows  = (await getSetting('buttonsRows'))  ?? 1;
    updateButtonsCountUI(savedCount);
    updateButtonsRowsUI(savedRows);

    // Player name enabled
    const pnEnabled = await getSetting('playerNameEnabled');
    const pnToggle  = document.getElementById('player-name-enabled-toggle');
    if (pnToggle) {
        const on = pnEnabled !== false;
        pnToggle.checked = on;
        const lbl = document.getElementById('player-name-enabled-label');
        if (lbl) lbl.textContent = on ? 'מופעל' : 'כבוי';
    }

    // Silent letter words
    const slEnabled = await getSetting('showSilentLetterWords');
    const slToggle  = document.getElementById('silent-letter-toggle');
    if (slToggle) {
        const on = slEnabled === true;
        slToggle.checked = on;
        const lbl = document.getElementById('silent-letter-label');
        if (lbl) lbl.textContent = on ? 'מופעל' : 'כבוי';
    }

    // Letter animation
    const laEnabled = await getSetting('letterAnimationEnabled');
    const laToggle  = document.getElementById('letter-animation-toggle');
    if (laToggle) {
        const on = laEnabled !== false;
        laToggle.checked = on;
        const lbl = document.getElementById('letter-animation-label');
        if (lbl) lbl.textContent = on ? 'מופעל' : 'כבוי';
    }

    // Hint settings
    const hintEnabled     = await getSetting('hintEnabled');
    const hintAfterErrors = (await getSetting('hintAfterErrors')) ?? 2;
    const hintToggle = document.getElementById('hint-enabled-toggle');
    if (hintToggle) {
        const on = hintEnabled !== false;
        hintToggle.checked = on;
        const lbl = document.getElementById('hint-enabled-label');
        if (lbl) lbl.textContent = on ? 'מופעל' : 'כבוי';
        const sec = document.getElementById('hint-errors-section');
        if (sec) { sec.style.opacity = on ? '1' : '0.4'; sec.style.pointerEvents = on ? '' : 'none'; }
    }
    updateHintPresetsUI(hintAfterErrors);
}

function updateButtonsCountUI(count) {
    document.querySelectorAll('[data-btns]').forEach(btn => {
        btn.classList.toggle('active-preset', parseInt(btn.dataset.btns) === count);
    });
}

function updateButtonsRowsUI(rows) {
    document.querySelectorAll('[data-rows]').forEach(btn => {
        btn.classList.toggle('active-preset', parseInt(btn.dataset.rows) === rows);
    });
}

async function setButtonsCount(n) {
    await setSetting('buttonsCount', n);
    updateButtonsCountUI(n);
    showAdminToast(`${n} כפתורי אותיות בכל שאלה`);
}

async function setButtonsRows(n) {
    await setSetting('buttonsRows', n);
    updateButtonsRowsUI(n);
    showAdminToast(n === 1 ? 'כפתורים בשורה אחת' : 'כפתורים ב-2 שורות');
}

function updateWordsCountPresets(val) {
    const n = parseInt(val);
    document.querySelectorAll('.words-count-preset').forEach(btn => {
        btn.classList.toggle('active-preset', parseInt(btn.dataset.count) === n);
    });
}

async function setWordsPerGame(n) {
    await setSetting('wordsPerGame', n);
    document.getElementById('words-count-input').value = n;
    updateWordsCountPresets(n);
    showAdminToast(`המשחק יכלול ${n} מילים`);
}

async function saveWordsPerGame(val) {
    const input = document.getElementById('words-count-input');
    const maxAllowed = parseInt(input.max) || 50;
    const n = Math.max(3, Math.min(maxAllowed, parseInt(val) || 20));
    input.value = n;
    await setSetting('wordsPerGame', n);
    updateWordsCountPresets(n);
    showAdminToast(`המשחק יכלול ${n} מילים`);
}

async function onTimerSliderChange() {
    const val = parseInt(document.getElementById('timer-slider').value);
    document.getElementById('timer-value-label').textContent = val + ' שניות';
    await setSetting('timerDuration', val);
    showAdminToast('ההגדרות נשמרו');
}

async function savePixabayKey() {
    const key = document.getElementById('pixabay-key-input').value.trim();
    await setSetting('pixabayKey', key);
    updatePixabayStatus(key);
    showAdminToast(key ? 'מפתח Pixabay נשמר' : 'מפתח Pixabay נמחק');
}

async function saveUnsplashKey() {
    const key = document.getElementById('unsplash-key-input').value.trim();
    await setSetting('unsplashKey', key);
    updateApiKeyStatus('unsplash-status', key, 'Unsplash');
    showAdminToast(key ? 'מפתח Unsplash נשמר' : 'מפתח Unsplash נמחק');
}

async function savePexelsKey() {
    const key = document.getElementById('pexels-key-input').value.trim();
    await setSetting('pexelsKey', key);
    updateApiKeyStatus('pexels-status', key, 'Pexels');
    showAdminToast(key ? 'מפתח Pexels נשמר' : 'מפתח Pexels נמחק');
}

function updateApiKeyStatus(elementId, key, serviceName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (key) {
        el.textContent = '✅ ' + serviceName + ' פעיל';
        el.style.color = '#2E7D32';
    } else {
        el.textContent = '⚪ לא מוגדר';
        el.style.color = '#888';
    }
}

function updatePixabayStatus(key) {
    const el = document.getElementById('pixabay-status');
    if (!el) return;
    if (key) {
        el.textContent = '✅ Pixabay פעיל';
        el.style.color = '#2E7D32';
    } else {
        el.textContent = '⚪ Wikimedia Commons (ברירת מחדל)';
        el.style.color = '#888';
    }
}

// ===== PLAYER NAME & ANIMATION SETTINGS =====
async function setPlayerNameEnabled(enabled) {
    await setSetting('playerNameEnabled', enabled);
    const lbl = document.getElementById('player-name-enabled-label');
    if (lbl) lbl.textContent = enabled ? 'מופעל' : 'כבוי';
    // Reflect immediately on start screen
    const section = document.getElementById('player-name-section');
    if (section) section.style.display = enabled ? 'flex' : 'none';
    showAdminToast(enabled ? '👤 שם השחקן מופעל' : '👤 שם השחקן כבוי');
}

async function setLetterAnimation(enabled) {
    await setSetting('letterAnimationEnabled', enabled);
    const lbl = document.getElementById('letter-animation-label');
    if (lbl) lbl.textContent = enabled ? 'מופעל' : 'כבוי';
    showAdminToast(enabled ? '✨ אנימציה מופעלת' : '✨ אנימציה כבויה');
}

async function setShowSilentLetterWords(enabled) {
    await setSetting('showSilentLetterWords', enabled);
    const lbl = document.getElementById('silent-letter-label');
    if (lbl) lbl.textContent = enabled ? 'מופעל' : 'כבוי';
    showAdminToast(enabled ? '🔤 מילים עם אות שקטה כלולות' : '🔤 רק מילים עם הגייה מפורשת');
    if (typeof updateWordFilterLabel === 'function') updateWordFilterLabel();
}

// ===== HINT SETTINGS =====
async function setHintEnabled(enabled) {
    await setSetting('hintEnabled', enabled);
    const lbl = document.getElementById('hint-enabled-label');
    if (lbl) lbl.textContent = enabled ? 'מופעל' : 'כבוי';
    const sec = document.getElementById('hint-errors-section');
    if (sec) { sec.style.opacity = enabled ? '1' : '0.4'; sec.style.pointerEvents = enabled ? '' : 'none'; }
    showAdminToast(enabled ? '💡 רמז מופעל' : '💡 רמז כבוי');
}

async function setHintAfterErrors(n) {
    await setSetting('hintAfterErrors', n);
    updateHintPresetsUI(n);
    showAdminToast(`💡 רמז יופיע לאחר ${n} שגיאות`);
}

function updateHintPresetsUI(val) {
    const n = parseInt(val);
    document.querySelectorAll('[data-hint]').forEach(btn => {
        btn.classList.toggle('active-preset', parseInt(btn.dataset.hint) === n);
    });
}

// ===== EXPORT API KEYS MODAL =====
let _exportKeysResolve = null;

function resolveExportKeysModal(value) {
    document.getElementById('export-keys-modal').classList.add('hidden');
    if (_exportKeysResolve) { _exportKeysResolve(value); _exportKeysResolve = null; }
}

function askExportKeys(names) {
    return new Promise(resolve => {
        _exportKeysResolve = resolve;
        document.getElementById('export-keys-msg').textContent =
            'נמצאו מפתחות API (' + names + ').\nכיצד לייצא?';
        document.getElementById('export-keys-modal').classList.remove('hidden');
        setTimeout(() => document.getElementById('export-keys-default-btn')?.focus(), 50);
    });
}

// ===== EXPORT / IMPORT =====
async function exportData() {
    try {
        const data = await exportAllData();
        const keyFields = ['pixabayKey', 'unsplashKey', 'pexelsKey'];
        const foundKeys = keyFields.filter(k => data.settings?.[k]);
        if (foundKeys.length > 0) {
            const names = foundKeys.map(k => k.replace('Key', '')).join(', ');
            const choice = await askExportKeys(names);
            if (choice === null) return;                               // ביטול
            if (choice === false) foundKeys.forEach(k => { data.settings[k] = ''; }); // בלי מפתחות
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hebrew-letters-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showAdminToast('הייצוא הושלם בהצלחה');
    } catch (e) { alert('שגיאה בייצוא: ' + e.message); }
}

function triggerImport() { document.getElementById('import-file-input').click(); }
function triggerMerge()  { document.getElementById('merge-file-input').click(); }

// ===== MERGE CONFLICTS MODAL =====
let _mergeConflictsResolve = null;

function resolveMergeConflictsModal(value) {
    document.getElementById('merge-conflicts-modal').classList.add('hidden');
    if (_mergeConflictsResolve) { _mergeConflictsResolve(value); _mergeConflictsResolve = null; }
}

function askMergeConflicts(newCount, conflictWords) {
    return new Promise(resolve => {
        _mergeConflictsResolve = resolve;
        const MAX_SHOW = 8;
        const names = conflictWords.slice(0, MAX_SHOW).map(c => c.entry.word).join(', ');
        const extra  = conflictWords.length > MAX_SHOW ? ` ועוד ${conflictWords.length - MAX_SHOW} נוספות` : '';
        document.getElementById('merge-summary').textContent =
            newCount > 0 ? `${newCount} מילים חדשות יתווספו.` : 'אין מילים חדשות להוסיף.';
        document.getElementById('merge-conflict-list').textContent =
            `${conflictWords.length} מילים כבר קיימות אצלך: ${names}${extra}`;
        document.getElementById('merge-conflicts-modal').classList.remove('hidden');
        setTimeout(() => document.getElementById('merge-keep-btn')?.focus(), 50);
    });
}

// ===== MERGE =====
async function handleMerge(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    try {
        const data = JSON.parse(await file.text());
        if (!data?.words?.length) { alert('קובץ לא תקין'); return; }

        const existing     = await getAllWords();
        const existingMap  = new Map(existing.map(w => [w.id, w]));
        const existingText = new Map(existing.map(w => [w.word, w]));

        const newWords = [], conflictWords = [], defUpdates = [];

        for (const entry of data.words) {
            if (entry.id?.startsWith('def_')) {
                const local = existingMap.get(entry.id);
                if (local && (entry.wordVersion ?? 1) > (local._defWordVersion ?? 0))
                    defUpdates.push({ entry, local });
            } else {
                const local = existingText.get(entry.word);
                if (!local) newWords.push(entry);
                else conflictWords.push({ entry, local });
            }
        }

        // If nothing to do
        if (newWords.length === 0 && defUpdates.length === 0 && conflictWords.length === 0) {
            showAdminToast('אין מידע חדש לייבא');
            return;
        }

        // Resolve conflicts if any
        let overwriteConflicts = false;
        if (conflictWords.length > 0) {
            const choice = await askMergeConflicts(newWords.length + defUpdates.length, conflictWords);
            if (choice === null) return;
            overwriteConflicts = choice === 'overwrite';
        }

        // Apply def_ updates (respect _customFields)
        for (const { entry, local } of defUpdates) {
            const { imageDataURL, ...wordMeta } = entry;
            const cf      = local._customFields || [];
            const updated = { ...local, _defWordVersion: entry.wordVersion ?? 1 };
            if (!cf.includes('word'))           updated.word           = wordMeta.word;
            if (!cf.includes('category'))       updated.category       = wordMeta.category;
            if (!cf.includes('category'))       updated.categoryIcon   = wordMeta.categoryIcon;
            if (!cf.includes('hasSilentLetter')) updated.hasSilentLetter = wordMeta.hasSilentLetter;
            await saveWord(updated);
            if (imageDataURL && !cf.includes('image'))
                await saveImage({ id: local.id, dataURL: imageDataURL });
        }

        // Add new user words
        for (const entry of newWords) {
            const { imageDataURL, ...wordMeta } = entry;
            await saveWord(wordMeta);
            if (imageDataURL) await saveImage({ id: wordMeta.id, dataURL: imageDataURL });
        }

        // Overwrite conflicts if chosen (keep local ID)
        if (overwriteConflicts) {
            for (const { entry, local } of conflictWords) {
                const { imageDataURL, ...wordMeta } = entry;
                await saveWord({ ...wordMeta, id: local.id });
                if (imageDataURL) await saveImage({ id: local.id, dataURL: imageDataURL });
            }
        }

        await refreshAdminList();
        const total = defUpdates.length + newWords.length + (overwriteConflicts ? conflictWords.length : 0);
        showAdminToast(`המיזוג הושלם — ${total} מילים עודכנו`);
    } catch (err) { alert('שגיאה במיזוג: ' + err.message); }
}

// ===== IMPORT API KEYS MODAL =====
let _importKeysResolve = null;

function resolveImportKeysModal(value) {
    document.getElementById('import-keys-modal').classList.add('hidden');
    if (_importKeysResolve) { _importKeysResolve(value); _importKeysResolve = null; }
}

async function askImportKeys(foundKeys, conflictingKeys) {
    return new Promise(resolve => {
        _importKeysResolve = resolve;
        const infoEl = document.getElementById('import-keys-info');
        const foundNames     = foundKeys.map(k => k.replace('Key', '')).join(', ');
        const conflictNames  = conflictingKeys.map(k => k.replace('Key', '')).join(', ');
        const newKeys        = foundKeys.filter(k => !conflictingKeys.includes(k));
        const newNames       = newKeys.map(k => k.replace('Key', '')).join(', ');
        let info = 'מפתחות בקובץ: ' + foundNames;
        if (conflictingKeys.length > 0) info += '\nמפתחות קיימים שיידרסו: ' + conflictNames;
        if (newKeys.length > 0)         info += '\nמפתחות חדשים שיתווספו: ' + newNames;
        infoEl.style.whiteSpace = 'pre-line';
        infoEl.textContent = info;

        const newBtn  = document.getElementById('import-keys-default-btn');
        const noneBtn = document.querySelector('#import-keys-modal [onclick="resolveImportKeysModal(\'none\')"]');
        const allBtn  = document.querySelector('#import-keys-modal [onclick="resolveImportKeysModal(\'all\')"]');

        // Reset styles
        [newBtn, noneBtn, allBtn].forEach(b => {
            if (!b) return;
            b.className = 'btn-cancel-modal';
            b.style.background = '';
            b.style.color = '';
            b.style.display = '';
        });

        // Pick default button
        const primaryBtn = newKeys.length > 0 ? newBtn : noneBtn;
        if (newKeys.length === 0 && newBtn) newBtn.style.display = 'none';
        if (primaryBtn) {
            primaryBtn.className = 'btn-save';
            primaryBtn.style.background = '#1565C0';
            primaryBtn.style.color = 'white';
        }

        document.getElementById('import-keys-modal').classList.remove('hidden');
        setTimeout(() => primaryBtn?.focus(), 50);
    });
}

async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (!confirm('יבוא זה יחליף את כל המילים וההגדרות הקיימות. להמשיך?')) return;
    try {
        const data = JSON.parse(await file.text());
        const keyFields   = ['pixabayKey', 'unsplashKey', 'pexelsKey'];
        const foundKeys   = keyFields.filter(k => data.settings?.[k]);
        if (foundKeys.length > 0) {
            // Check which keys already exist locally
            const conflictingKeys = [];
            for (const k of foundKeys) {
                const existing = await getSetting(k);
                if (existing) conflictingKeys.push(k);
            }
            const choice = await askImportKeys(foundKeys, conflictingKeys);
            if (choice === null) return;                          // ביטול
            if (choice === 'none') {
                // Remove all API keys from import data so importAllData won't touch them
                keyFields.forEach(k => { if (data.settings) delete data.settings[k]; });
            } else if (choice === 'new') {
                // Remove only conflicting keys — new keys will still be imported
                conflictingKeys.forEach(k => { if (data.settings) delete data.settings[k]; });
            }
            // 'all' → import as-is
        }
        await importAllData(data);
        await refreshAdminList();
        await loadSettings();
        showAdminToast(`יובאו ${data.words.length} מילים בהצלחה`);
    } catch (err) { alert('שגיאה בייבוא: ' + err.message); }
}

// ===== TOAST =====
function showAdminToast(msg) {
    const t = document.getElementById('admin-toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}
