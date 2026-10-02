// Hebrew Letters Game — Statistics screen
// Reads the game history (sessions store) and renders pedagogical insights for the teacher.

let _statsSessions = [];      // all sessions (chronological)
let _statsFilter   = { player: '__all__', range: 'all' };
let _statsExpanded = new Set();

// ===== OPEN / FILTERS =====
async function openStats() {
    showScreen('screen-stats');
    _statsSessions = await getAllSessions();
    _renderPlayerFilter();
    renderStats();
}

function refreshStatsIfOpen() {
    if (document.querySelector('#screen-stats.active')) openStats();
}

function _renderPlayerFilter() {
    const sel = document.getElementById('stats-player-filter');
    if (!sel) return;
    const names = [...new Set(_statsSessions.map(s => s.playerName || ''))];
    const prev = _statsFilter.player;
    sel.innerHTML = '<option value="__all__">כל השחקנים</option>';
    names.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n || '(ללא שם)';
        sel.appendChild(opt);
    });
    sel.value = [...sel.options].some(o => o.value === prev) ? prev : '__all__';
    _statsFilter.player = sel.value;
}

function onStatsFilterChange() {
    _statsFilter.player = document.getElementById('stats-player-filter').value;
    _statsFilter.range  = document.getElementById('stats-range-filter').value;
    renderStats();
}

function _filteredSessions() {
    const now = Date.now();
    const rangeMs = { '7': 7, '30': 30, '90': 90 }[_statsFilter.range];
    return _statsSessions.filter(s => {
        if (_statsFilter.player !== '__all__' && (s.playerName || '') !== _statsFilter.player) return false;
        if (rangeMs && now - s.startedAt > rangeMs * 86400000) return false;
        return true;
    });
}

// ===== HELPERS =====
const _esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const _fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('he-IL');
const _pct = (a, b) => b ? Math.round((a / b) * 100) + '%' : '–';
const MODE_LABEL = { letters: '🔤 בניית מילה', reading: '📖 קריאה', mixed: '🔀 מעורב' };

function _fmtDuration(ms) {
    const sec = Math.round((ms || 0) / 1000);
    if (sec < 60) return `${sec} שנ'`;
    const m = Math.floor(sec / 60), s = sec % 60;
    if (m < 60) return `${m}:${String(s).padStart(2, '0')} דק'`;
    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} שע'`;
}
function _fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
           ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}
function _errColor(n) { return n === 0 ? '#2E7D32' : n < 1 ? '#558B2F' : n <= 2 ? '#F57F17' : '#C62828'; }

// ===== AGGREGATION =====
function _aggregate(sessions) {
    const words = sessions.flatMap(s => s.words.map(w => ({ ...w, _session: s })));
    const perWord = {};
    const perCat  = {};
    const perLetter = {};   // target letter → { shown, errors, confusedWith: {chosen: n} }
    const readingConfusions = {}; // "target→chosen" → n
    const perMode = { letters: [], reading: [] };

    for (const w of words) {
        const k = w.word;
        perWord[k] ||= { word: k, category: w.category, plays: 0, errors: 0, timeMs: 0, perfect: 0, hints: 0, skips: 0, timeline: [] };
        const pw = perWord[k];
        pw.plays++; pw.errors += w.errors; pw.timeMs += w.timeMs || 0;
        if (w.errors === 0 && !w.skipped) pw.perfect++;
        if (w.hintShown) pw.hints++;
        if (w.skipped) pw.skips++;
        pw.timeline.push({ ts: w._session.startedAt, errors: w.errors });

        const c = w.category || 'אחר';
        perCat[c] ||= { category: c, plays: 0, errors: 0, timeMs: 0, perfect: 0 };
        perCat[c].plays++; perCat[c].errors += w.errors; perCat[c].timeMs += w.timeMs || 0;
        if (w.errors === 0) perCat[c].perfect++;

        if (w.mode === 'letters') {
            // every letter of the word was a target once
            for (const ch of w.word) {
                perLetter[ch] ||= { letter: ch, shown: 0, errors: 0, confusedWith: {} };
                perLetter[ch].shown++;
            }
            for (const pick of (w.wrongPicks || [])) {
                const pl = perLetter[pick.target] ||= { letter: pick.target, shown: 0, errors: 0, confusedWith: {} };
                pl.errors++;
                pl.confusedWith[pick.chosen] = (pl.confusedWith[pick.chosen] || 0) + 1;
            }
        } else if (w.mode === 'reading') {
            for (const pick of (w.wrongPicks || [])) {
                const key = `${pick.target}→${pick.chosen}`;
                readingConfusions[key] = (readingConfusions[key] || 0) + 1;
            }
        }
        if (perMode[w.mode]) perMode[w.mode].push(w);
    }
    return { words, perWord, perCat, perLetter, readingConfusions, perMode };
}

// ===== RENDER =====
function renderStats() {
    const sessions = _filteredSessions();
    const box = document.getElementById('stats-content');
    if (!box) return;
    if (sessions.length === 0) {
        box.innerHTML = `<div class="stats-empty">
            <div style="font-size:3rem">📈</div>
            <p>אין עדיין משחקים מתועדים${_statsSessions.length ? ' בסינון הנוכחי' : ''}.</p>
            <p style="font-size:.9rem;color:#999">כל משחק שמסתיים (או נעצר אחרי מילה אחת לפחות) נשמר כאן אוטומטית.</p>
        </div>`;
        return;
    }
    const agg = _aggregate(sessions);
    box.innerHTML =
        _renderSummary(sessions, agg) +
        _renderTrend(sessions) +
        _renderHardWords(agg) +
        _renderLetters(agg) +
        _renderCategoriesAndModes(agg) +
        _renderSessionsTable(sessions);
}

// --- Summary tiles ---
function _renderSummary(sessions, agg) {
    const words = agg.words;
    const totalErrors = words.reduce((a, w) => a + w.errors, 0);
    const perfect = words.filter(w => w.errors === 0 && !w.skipped).length;
    const hints = words.filter(w => w.hintShown).length;
    const playMs = sessions.reduce((a, s) => a + (s.durationMs || 0), 0);
    const avgWordSec = _avg(words.map(w => (w.timeMs || 0) / 1000));
    const completed = sessions.filter(s => s.completed).length;
    const tiles = [
        { n: sessions.length, l: 'משחקים', sub: `${completed} הושלמו` },
        { n: words.length, l: 'מילים שוחקו' },
        { n: _fmtDuration(playMs), l: 'זמן משחק כולל' },
        { n: _fmt1(_avg(words.map(w => w.errors))), l: 'שגיאות למילה', color: _errColor(_avg(words.map(w => w.errors))), sub: `${totalErrors} סה"כ` },
        { n: _pct(perfect, words.length), l: 'מילים ללא שגיאה ⭐' },
        { n: _fmt1(avgWordSec) + ' שנ\'', l: 'זמן ממוצע למילה' },
        { n: _pct(hints, words.length), l: 'מילים עם רמז 💡' },
        { n: words.filter(w => w.skipped).length, l: 'דילוגים ⏪' }
    ];
    return `<div class="stats-section"><h3>📊 סיכום</h3><div class="stats-tiles">` +
        tiles.map(t => `<div class="stats-tile">
            <span class="stats-tile-num" style="${t.color ? 'color:' + t.color : ''}">${t.n}</span>
            <span class="stats-tile-lbl">${t.l}</span>
            ${t.sub ? `<span class="stats-tile-sub">${t.sub}</span>` : ''}
        </div>`).join('') + `</div></div>`;
}

// --- Progress over time (last 20 sessions) ---
function _renderTrend(sessions) {
    const last = sessions.slice(-20);
    if (last.length < 2) {
        return `<div class="stats-section"><h3>📈 התקדמות לאורך זמן</h3>
            <p class="stats-note">הגרף יופיע לאחר 2 משחקים לפחות.</p></div>`;
    }
    const errSeries  = last.map(s => _avg(s.words.map(w => w.errors)));
    const timeSeries = last.map(s => _avg(s.words.map(w => (w.timeMs || 0) / 1000)));
    const labels     = last.map(s => new Date(s.startedAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }));
    // Simple trend verdict: compare first half vs second half
    const half = Math.floor(last.length / 2);
    const e1 = _avg(errSeries.slice(0, half)), e2 = _avg(errSeries.slice(half));
    let verdict = '';
    if (last.length >= 4) {
        if (e2 < e1 * 0.8)      verdict = '✅ מגמת שיפור: פחות שגיאות במשחקים האחרונים.';
        else if (e2 > e1 * 1.2) verdict = '⚠️ יותר שגיאות במשחקים האחרונים. ייתכן שכדאי להקטין את מספר הכפתורים או לחזור למילים קלות.';
        else                    verdict = '➡️ רמת שגיאות יציבה.';
    }
    return `<div class="stats-section"><h3>📈 התקדמות לאורך זמן</h3>
        ${verdict ? `<p class="stats-verdict">${verdict}</p>` : ''}
        <div class="stats-charts">
            ${_lineChart(errSeries, labels, 'ממוצע שגיאות למילה בכל משחק', '#E53935')}
            ${_lineChart(timeSeries, labels, 'זמן ממוצע למילה (שניות)', '#1976D2')}
        </div></div>`;
}

function _lineChart(values, labels, title, color) {
    const W = 420, H = 170, padL = 34, padR = 10, padT = 14, padB = 30;
    const max = Math.max(1, ...values) * 1.15;
    const n = values.length;
    const x = i => padL + (n === 1 ? (W - padL - padR) / 2 : i * (W - padL - padR) / (n - 1));
    const y = v => padT + (H - padT - padB) * (1 - v / max);
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const grid = [0, 0.5, 1].map(f => {
        const v = max * f / 1.15, yy = y(v);
        return `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="#eee"/>
                <text x="${padL - 6}" y="${yy + 4}" font-size="10" fill="#999" text-anchor="end">${_fmt1(v)}</text>`;
    }).join('');
    const step = Math.ceil(n / 6);
    const xl = labels.map((l, i) => i % step === 0 || i === n - 1
        ? `<text x="${x(i)}" y="${H - 8}" font-size="10" fill="#999" text-anchor="middle">${l}</text>` : '').join('');
    const dots = values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${color}"><title>${labels[i]}: ${_fmt1(v)}</title></circle>`).join('');
    return `<figure class="stats-chart">
        <figcaption>${title}</figcaption>
        <svg viewBox="0 0 ${W} ${H}" direction="ltr">
            ${grid}
            <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
            ${dots}${xl}
        </svg></figure>`;
}

// --- Hardest / easiest words ---
function _renderHardWords(agg) {
    const list = Object.values(agg.perWord);
    if (list.length === 0) return '';
    const scored = list.map(w => ({ ...w, avgErr: w.errors / w.plays, avgSec: w.timeMs / w.plays / 1000 }));
    const hard = scored.filter(w => w.avgErr > 0 || w.hints > 0 || w.skips > 0)
                       .sort((a, b) => b.avgErr - a.avgErr || b.avgSec - a.avgSec).slice(0, 10);
    const mastered = scored.filter(w => w.plays >= 2 && w.avgErr === 0).sort((a, b) => a.avgSec - b.avgSec).slice(0, 12);
    const row = w => `<tr>
        <td><strong>${_esc(w.word)}</strong><br><span class="stats-muted">${_esc(w.category || '')}</span></td>
        <td>${w.plays}</td>
        <td style="color:${_errColor(w.avgErr)};font-weight:bold">${_fmt1(w.avgErr)}</td>
        <td>${_fmt1(w.avgSec)}</td>
        <td>${_pct(w.perfect, w.plays)}</td>
        <td>${w.hints ? '💡' + w.hints : ''} ${w.skips ? '⏪' + w.skips : ''}</td>
    </tr>`;
    return `<div class="stats-section"><h3>🧩 מילים מאתגרות</h3>
        ${hard.length ? `<div class="stats-table-wrap"><table class="report-table">
            <thead><tr><th>מילה</th><th>פעמים</th><th>שגיאות (ממוצע)</th><th>שניות</th><th>ללא שגיאה</th><th></th></tr></thead>
            <tbody>${hard.map(row).join('')}</tbody></table></div>
            <p class="stats-note">מילים עם ממוצע שגיאות גבוה מומלץ לתרגל בנפרד (למשל להשבית זמנית מילים אחרות בניהול).</p>`
          : '<p class="stats-note">כל המילים נפתרו ללא שגיאות. כל הכבוד! 🎉</p>'}
        ${mastered.length ? `<h4 class="stats-subtitle">✅ מילים שנשלטות היטב (שוחקו לפחות פעמיים ללא שגיאה)</h4>
            <div class="stats-chips">${mastered.map(w => `<span class="stats-chip">${_esc(w.word)}</span>`).join('')}</div>` : ''}
    </div>`;
}

// --- Letters: error rate per target letter + confusion pairs ---
function _renderLetters(agg) {
    const letters = Object.values(agg.perLetter).filter(l => l.shown > 0);
    if (letters.length === 0) return '';
    const withRate = letters.map(l => ({ ...l, rate: l.errors / l.shown }));
    const hardest = withRate.filter(l => l.errors > 0).sort((a, b) => b.rate - a.rate || b.errors - a.errors).slice(0, 10);
    const maxRate = Math.max(...hardest.map(l => l.rate), 0.01);
    const pairs = [];
    for (const l of letters) for (const [chosen, n] of Object.entries(l.confusedWith)) pairs.push({ target: l.letter, chosen, n });
    pairs.sort((a, b) => b.n - a.n);
    const bars = hardest.map(l => `<div class="stats-bar-row">
        <span class="stats-bar-label stats-letter">${l.letter}</span>
        <div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${Math.round(l.rate / maxRate * 100)}%;background:${_errColor(l.rate * 3)}"></div></div>
        <span class="stats-bar-val">${l.errors} / ${l.shown} <span class="stats-muted">(${Math.round(l.rate * 100)}%)</span></span>
    </div>`).join('');
    return `<div class="stats-section"><h3>🔤 אותיות</h3>
        ${hardest.length ? `<p class="stats-note">שגיאות ביחס למספר הפעמים שהאות הייתה המטרה (מצב בניית מילה בלבד).</p>
            <div class="stats-bars">${bars}</div>` : '<p class="stats-note">אין שגיאות באותיות. 🎉</p>'}
        ${pairs.length ? `<h4 class="stats-subtitle">🔁 בלבולים נפוצים (נדרשה האות ← נלחצה האות)</h4>
            <div class="stats-chips">${pairs.slice(0, 12).map(p =>
                `<span class="stats-chip stats-chip-pair"><b>${p.target}</b> ← <b>${p.chosen}</b> <span class="stats-muted">×${p.n}</span></span>`).join('')}</div>` : ''}
    </div>`;
}

// --- Categories + mode comparison + reading confusions ---
function _renderCategoriesAndModes(agg) {
    const cats = Object.values(agg.perCat).map(c => ({ ...c, avgErr: c.errors / c.plays })).sort((a, b) => b.avgErr - a.avgErr);
    const maxErr = Math.max(...cats.map(c => c.avgErr), 0.01);
    const catBars = cats.map(c => `<div class="stats-bar-row">
        <span class="stats-bar-label">${_esc(c.category)}</span>
        <div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${Math.round(c.avgErr / maxErr * 100)}%;background:${_errColor(c.avgErr)}"></div></div>
        <span class="stats-bar-val">${_fmt1(c.avgErr)} <span class="stats-muted">(${c.plays} מילים)</span></span>
    </div>`).join('');

    const modeRow = (key, label) => {
        const ws = agg.perMode[key];
        if (!ws.length) return '';
        return `<tr><td>${label}</td><td>${ws.length}</td>
            <td style="color:${_errColor(_avg(ws.map(w => w.errors)))};font-weight:bold">${_fmt1(_avg(ws.map(w => w.errors)))}</td>
            <td>${_fmt1(_avg(ws.map(w => (w.timeMs || 0) / 1000)))}</td>
            <td>${_pct(ws.filter(w => w.errors === 0).length, ws.length)}</td></tr>`;
    };
    const modes = modeRow('letters', MODE_LABEL.letters) + modeRow('reading', MODE_LABEL.reading);

    const rc = Object.entries(agg.readingConfusions).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const rcHtml = rc.length ? `<h4 class="stats-subtitle">📖 בלבולים במצב קריאה (המילה ← התמונה שנבחרה)</h4>
        <div class="stats-chips">${rc.map(([k, n]) => {
            const [t, c] = k.split('→');
            return `<span class="stats-chip stats-chip-pair"><b>${_esc(t)}</b> ← <b>${_esc(c)}</b> <span class="stats-muted">×${n}</span></span>`;
        }).join('')}</div>` : '';

    return `<div class="stats-section"><h3>🗂️ קטגוריות ומצבי משחק</h3>
        <p class="stats-note">ממוצע שגיאות למילה לפי קטגוריה.</p>
        <div class="stats-bars">${catBars}</div>
        ${modes ? `<h4 class="stats-subtitle">🎯 השוואת מצבים</h4>
        <div class="stats-table-wrap"><table class="report-table">
            <thead><tr><th>מצב</th><th>מילים</th><th>שגיאות (ממוצע)</th><th>שניות</th><th>ללא שגיאה</th></tr></thead>
            <tbody>${modes}</tbody></table></div>` : ''}
        ${rcHtml}
    </div>`;
}

// --- Sessions list (expandable) ---
function _renderSessionsTable(sessions) {
    const rows = [...sessions].reverse().map(s => {
        const errs = s.words.reduce((a, w) => a + w.errors, 0);
        const open = _statsExpanded.has(s.id);
        const detail = open ? `<tr class="stats-detail-row"><td colspan="7">
            <table class="report-table stats-inner-table"><thead><tr>
                <th>מילה</th><th>מצב</th><th>שגיאות</th><th>זמן</th><th>פירוט</th></tr></thead><tbody>
            ${s.words.map(w => `<tr>
                <td><strong>${_esc(w.word)}</strong> ${w.skipped ? '<span class="stats-badge">דולג</span>' : ''} ${w.hintShown ? '💡' : ''}</td>
                <td>${w.mode === 'reading' ? '📖' : '🔤'}</td>
                <td style="color:${_errColor(w.errors)};font-weight:bold">${w.errors}</td>
                <td>${_fmtDuration(w.timeMs)}</td>
                <td class="stats-muted">${(w.wrongPicks || []).map(p => w.mode === 'reading'
                    ? `בחר "${_esc(p.chosen)}"` : `${p.target}←${p.chosen}`).join(', ')}</td>
            </tr>`).join('')}</tbody></table>
            <div style="text-align:left;margin-top:6px">
                <button class="stats-del-btn" onclick="deleteStatsSession('${s.id}')">🗑️ מחק משחק זה</button>
            </div>
        </td></tr>` : '';
        return `<tr class="stats-session-row" onclick="toggleStatsSession('${s.id}')">
            <td>${open ? '▾' : '◂'} ${_fmtDate(s.startedAt)}</td>
            <td>${_esc(s.playerName) || '<span class="stats-muted">–</span>'}</td>
            <td>${MODE_LABEL[s.gameMode] || s.gameMode}</td>
            <td>${s.words.length}${s.completed ? '' : ` <span class="stats-muted">/ ${s.wordsPlanned}</span>`}</td>
            <td style="color:${_errColor(errs / Math.max(1, s.words.length))};font-weight:bold">${errs}</td>
            <td>${_fmtDuration(s.durationMs)}</td>
            <td>${s.completed ? '✅' : '<span title="נעצר באמצע">⏹️</span>'}</td>
        </tr>${detail}`;
    }).join('');
    return `<div class="stats-section"><h3>🗓️ רשימת משחקים <span class="stats-muted" style="font-weight:normal;font-size:.85rem">(לחץ על שורה לפירוט)</span></h3>
        <div class="stats-table-wrap"><table class="report-table stats-sessions-table">
            <thead><tr><th>תאריך</th><th>שחקן</th><th>מצב</th><th>מילים</th><th>שגיאות</th><th>משך</th><th></th></tr></thead>
            <tbody>${rows}</tbody></table></div></div>`;
}

function toggleStatsSession(id) {
    if (_statsExpanded.has(id)) _statsExpanded.delete(id); else _statsExpanded.add(id);
    renderStats();
}

async function deleteStatsSession(id) {
    if (!confirm('למחוק את המשחק הזה מההיסטוריה?')) return;
    await deleteSession(id);
    _statsExpanded.delete(id);
    _statsSessions = await getAllSessions();
    _renderPlayerFilter();
    renderStats();
    showAdminToast('המשחק נמחק מההיסטוריה');
}

async function clearStatsHistory() {
    if (!confirm(`למחוק את כל ההיסטוריה (${_statsSessions.length} משחקים)? פעולה זו אינה הפיכה.`)) return;
    await clearAllSessions();
    _statsSessions = [];
    _statsExpanded.clear();
    _renderPlayerFilter();
    renderStats();
    showAdminToast('ההיסטוריה נמחקה');
}

// ===== EXPORT =====
function _downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
}

function exportStatsJSON() {
    const sessions = _filteredSessions();
    _downloadFile(`hebrew-letters-history-${new Date().toISOString().split('T')[0]}.json`,
        JSON.stringify({ version: 1, exportDate: new Date().toISOString(), sessions }, null, 2), 'application/json');
    showAdminToast(`יוצאו ${sessions.length} משחקים`);
}

function exportStatsCSV() {
    const sessions = _filteredSessions();
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['תאריך', 'שחקן', 'מצב משחק', 'הושלם', 'מילה', 'קטגוריה', 'מצב מילה', 'שגיאות', 'שניות', 'רמז', 'דולג', 'בחירות שגויות'].map(q).join(',')];
    for (const s of sessions) for (const w of s.words) {
        lines.push([
            new Date(s.startedAt).toLocaleString('he-IL'), s.playerName, MODE_LABEL[s.gameMode] || s.gameMode,
            s.completed ? 'כן' : 'לא', w.word, w.category, w.mode === 'reading' ? 'קריאה' : 'בניית מילה',
            w.errors, Math.round((w.timeMs || 0) / 1000), w.hintShown ? 'כן' : '', w.skipped ? 'כן' : '',
            (w.wrongPicks || []).map(p => `${p.target}>${p.chosen}`).join(' ')
        ].map(q).join(','));
    }
    _downloadFile(`hebrew-letters-history-${new Date().toISOString().split('T')[0]}.csv`,
        '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
    showAdminToast(`יוצאו ${sessions.length} משחקים ל-CSV`);
}
