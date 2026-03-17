// ══════════════════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════════════════
const SECTIONS = [
  { id:'rice', icon:'🧊', label:'RICE Method', badge:'daily', tasks:[
    { id:'r1', name:'Ice shins (15–20 mins)',         meta:'Apply ice pack on both shins' },
    { id:'r2', name:'Ice ankle (15–20 mins)',          meta:'Ice pack on affected ankle' },
    { id:'r3', name:'Elevate leg above heart level',   meta:'Lie down — prop on 2–3 pillows' },
    { id:'r4', name:'Wear compression sleeve',         meta:'During any activity or walking' },
  ]},
  { id:'ankle', icon:'🦶', label:'Ankle Exercises', badge:'daily', tasks:[
    { id:'a1', name:'Calf raises',                     meta:'3 × 15 reps' },
    { id:'a2', name:'Single-leg balance',               meta:'30 seconds each leg' },
    { id:'a3', name:'Resistance band ankle circles',   meta:'20 reps each direction' },
    { id:'a4', name:'Heel-to-toe walks',               meta:'2 × across the room' },
    { id:'a5', name:'Seated calf raises',              meta:'3 × 15 reps' },
  ]},
  { id:'shin', icon:'🦵', label:'Shin Exercises', badge:'daily', tasks:[
    { id:'s1', name:'Toe raises',                      meta:'3 × 20 reps' },
    { id:'s2', name:'Shin taps (rapid toe lifts)',      meta:'30 seconds continuous' },
    { id:'s3', name:'Tibialis anterior raises',         meta:'3 × 15 — back to wall, lift toes' },
    { id:'s4', name:'Foam roll shins & calves',         meta:'5 mins after activity' },
  ]},
  { id:'glute', icon:'🍑', label:'Glutes & Hips', badge:'daily', tasks:[
    { id:'g1', name:'Glute bridges',                   meta:'3 × 15 reps' },
    { id:'g2', name:'Clamshells with band',             meta:'3 × 20 each side' },
    { id:'g3', name:'Side-lying leg raises',            meta:'3 × 15 each side' },
    { id:'g4', name:'Single-leg deadlifts',             meta:'3 × 10 each leg' },
    { id:'g5', name:'Step-ups on box/stair',            meta:'3 × 12 reps' },
  ]},
  { id:'supps', icon:'💊', label:'Supplements', badge:'daily', tasks:[
    { id:'sp1', name:'Vitamin D3 (1000–2000 IU)',       meta:'With breakfast' },
    { id:'sp2', name:'Magnesium (200–400 mg)',           meta:'With dinner' },
    { id:'sp3', name:'Omega-3 fish oil (1–2 g)',         meta:'With any meal' },
    { id:'sp4', name:'Collagen peptides (10 g)',         meta:'Before or after exercise' },
    { id:'sp5', name:'Calcium (500–1000 mg)',            meta:'With meals' },
  ]},
  { id:'habits', icon:'🌙', label:'Daily Habits', badge:'daily', tasks:[
    { id:'h1', name:'Sleep 7–9 hours',                 meta:'Most tissue repair happens here' },
    { id:'h2', name:'Drink 2.5–3 litres water',        meta:'Track throughout the day' },
    { id:'h3', name:'Morning stretch (10 mins)',        meta:'Calves, Achilles, hip flexors' },
    { id:'h4', name:'15–20 mins morning sunlight',      meta:'Natural Vitamin D' },
    { id:'h5', name:'Protein-rich meal',               meta:'1.6–2 g per kg bodyweight' },
    { id:'h6', name:'Anti-inflammatory foods',          meta:'Turmeric, ginger, omega-3 fish' },
  ]},
  { id:'cricket', icon:'🏏', label:'Cricket & Gear', badge:'once', tasks:[
    { id:'c1', name:'Warm up 10–15 mins before session', meta:'Dynamic stretching only' },
    { id:'c2', name:'Cool down after session',           meta:'5 mins walking + calf stretches' },
    { id:'ge1', name:'Get proper cricket shoes',          meta:'Spikes for grass / rubber for turf' },
    { id:'ge2', name:'Buy compression sleeves',           meta:'Wear during and after cricket' },
    { id:'ge3', name:'Get insoles / orthotics',           meta:'Especially for flat feet' },
    { id:'ge4', name:'Buy foam roller',                   meta:'Essential for shin management' },
    { id:'p1', name:'See physiotherapist',               meta:'Gait & ankle mechanics assessment' },
  ]},
];

const ALL_TASKS = SECTIONS.flatMap(s => s.tasks.map(t => ({ ...t, section: s.id })));
const TOTAL     = ALL_TASKS.length;

// ── Section prefix map for completion detection ───────────────────────────
const SEC_PREFIX = [
  { prefix:'ru', id:'rules'   },
  { prefix:'r',  id:'rice'    },
  { prefix:'sp', id:'supps'   },
  { prefix:'ms', id:'milestones' },
  { prefix:'ge', id:'cricket' },
  { prefix:'a',  id:'ankle'   },
  { prefix:'s',  id:'shin'    },
  { prefix:'g',  id:'glute'   },
  { prefix:'w',  id:'weeks'   },
  { prefix:'h',  id:'habits'  },
  { prefix:'p',  id:'cricket' },
  { prefix:'c',  id:'cricket' },
];

// ══════════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════════
let S = { startDate: null, log: {}, reminders: [] };

function todayStr() { return new Date().toISOString().slice(0,10); }
function todayLog()  {
  const d = todayStr();
  if (!S.log[d]) S.log[d] = {};
  return S.log[d];
}
function dayNumber() {
  const diff = new Date(todayStr()) - new Date(S.startDate);
  return Math.floor(diff / 86400000) + 1;
}

function load() {
  try {
    const raw = localStorage.getItem('cricket_pwa_v1');
    if (raw) S = JSON.parse(raw);
  } catch(_) {}
  if (!S.startDate)  S.startDate  = todayStr();
  if (!S.log)        S.log        = {};
  if (!S.reminders)  S.reminders  = [];
}

function save() {
  localStorage.setItem('cricket_pwa_v1', JSON.stringify(S));
  syncSWReminders();
  showToast('✓ Saved');
}

// ══════════════════════════════════════════════════════════════════════════
// SERVICE WORKER
// ══════════════════════════════════════════════════════════════════════════
let swReg = null;

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swReg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    console.log('[SW] registered');
  } catch(e) {
    console.warn('[SW] registration failed', e);
  }
}

function syncSWReminders() {
  if (!swReg || !swReg.active) return;
  swReg.active.postMessage({ type: 'SYNC_REMINDERS', reminders: S.reminders });
}

function sendTestNotification() {
  if (!swReg || !swReg.active) { alert('Service worker not ready. Reload the page.'); return; }
  swReg.active.postMessage({ type: 'TEST_NOTIFICATION' });
}

// ══════════════════════════════════════════════════════════════════════════
// PWA INSTALL
// ══════════════════════════════════════════════════════════════════════════
let deferredInstall = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  document.getElementById('install-banner').style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
  document.getElementById('install-banner').style.display = 'none';
});

function doInstall() {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  deferredInstall.userChoice.then(() => {
    deferredInstall = null;
    document.getElementById('install-banner').style.display = 'none';
  });
}

// ══════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════════════════
let currentPage = 'today';
let charts = {};

function showPage(id) {
  currentPage = id;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');

  if (id === 'progress') renderProgress();
  if (id === 'history')  renderHistory();
  if (id === 'reminders') { renderReminderStatus(); renderReminders(); }
}

// Handle URL shortcuts from manifest
const urlPage = new URLSearchParams(location.search).get('page');
if (urlPage) { window.addEventListener('load', () => showPage(urlPage)); }

// ══════════════════════════════════════════════════════════════════════════
// TODAY
// ══════════════════════════════════════════════════════════════════════════
function renderToday() {
  const log  = todayLog();
  const done = ALL_TASKS.filter(t => log[t.id]).length;
  const pct  = Math.round(done / TOTAL * 100);
  const streak = calcStreak();

  // Hero
  document.getElementById('day-num').textContent  = dayNumber();
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();
  document.getElementById('nav-streak').textContent  = streak;

  // Stats
  document.getElementById('s-done').textContent   = done;
  document.getElementById('s-left').textContent   = TOTAL - done;
  document.getElementById('s-streak').textContent = streak;

  // Ring
  const circ = 238.76;
  document.getElementById('ring-pct').textContent = pct + '%';
  document.getElementById('ring-fill').style.strokeDashoffset = circ - (circ * pct / 100);

  // Insight
  document.getElementById('insight-text').innerHTML = buildInsight();

  // Sections
  const container = document.getElementById('sections-wrap');
  container.innerHTML = '';
  SECTIONS.forEach(sec => {
    const secDone = sec.tasks.filter(t => log[t.id]).length;
    const el = document.createElement('div');
    el.className = 'section-block' + (sec.id !== 'cricket' ? ' open' : '');
    el.innerHTML = `
      <div class="section-header" onclick="toggleSection(this)">
        <span class="sec-icon">${sec.icon}</span>
        <span class="sec-label">${sec.label}</span>
        <span class="sec-count"><span class="done">${secDone}</span>/${sec.tasks.length}</span>
        <span class="sec-arrow">▼</span>
      </div>
      <div class="section-body">
        ${sec.tasks.map(t => `
          <div class="task ${log[t.id] ? 'done' : ''}" onclick="toggleTask('${t.id}')">
            <div class="cb"><span class="ck">✓</span></div>
            <div class="task-info">
              <div class="task-name">${t.name}</div>
              <div class="task-meta">${t.meta}</div>
            </div>
            <span class="badge badge-${sec.badge}">${sec.badge}</span>
          </div>
        `).join('')}
      </div>`;
    container.appendChild(el);
  });
}

function toggleSection(el) {
  el.closest('.section-block').classList.toggle('open');
}

function toggleTask(id) {
  const log = todayLog();
  log[id] = !log[id];
  save();
  renderToday();
  checkSectionDone(id);
}

function resetToday() {
  if (!confirm('Clear all of today\'s progress?')) return;
  S.log[todayStr()] = {};
  save();
  renderToday();
}

// ── Insights ──────────────────────────────────────────────────────────────
function buildInsight() {
  const log  = todayLog();
  const done = ALL_TASKS.filter(t => log[t.id]).length;
  const pct  = Math.round(done / TOTAL * 100);
  const streak = calcStreak();
  const dn   = dayNumber();
  const skipped = getSkippedSections(3);
  const avg7 = getLast7Avg();

  if (streak >= 7)    return `<strong>🔥 ${streak}-day streak!</strong> Serious consistency. Your tendons and bones are actively remodelling right now.`;
  if (pct === 100)    return `<strong>💯 Perfect day!</strong> Every single task done. Sleep well — your body is repairing tonight.`;
  if (skipped.length) return `<strong>Watch out:</strong> You've been skipping <strong>${skipped.slice(0,2).join(' & ')}</strong> for 3+ days. Prioritise these today.`;
  if (avg7 < 40 && dn > 5) return `<strong>Your 7-day average is ${avg7}%.</strong> Even hitting 60% consistently will keep your timeline on track.`;
  if (pct === 0 && dn > 1)  return `<strong>Day ${dn} waiting.</strong> Start with just RICE + supplements — that's already a win.`;
  if (dn <= 7)        return `<strong>Week 1 — Rest is the work.</strong> RICE method 2–3× daily. No fast running. Two weeks of this saves months of setback.`;
  if (dn <= 21)       return `<strong>Week ${Math.ceil(dn/7)} — Building the foundation.</strong> Exercise consistency now determines how fast you return to cricket.`;
  return `<strong>Day ${dn}.</strong> ${pct > 0 ? `${pct}% done today — keep the momentum.` : 'Tap any task to get started.'}`;
}

function getLast7Avg() {
  let total = 0, count = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    if (S.log[key]) {
      total += ALL_TASKS.filter(t => S.log[key][t.id]).length;
      count++;
    }
  }
  return count ? Math.round(total / count / TOTAL * 100) : 0;
}

function getSkippedSections(days) {
  const logDays = Object.keys(S.log);
  if (logDays.length < 2) return [];
  return SECTIONS.filter(sec => {
    for (let i = 1; i <= days; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      if (sec.tasks.some(t => (S.log[key] || {})[t.id])) return false;
    }
    return true;
  }).map(s => s.label);
}

// ── Section complete celebration ──────────────────────────────────────────
function checkSectionDone(id) {
  let secId = null;
  for (const e of SEC_PREFIX) { if (id.startsWith(e.prefix)) { secId = e.id; break; } }
  const sec = SECTIONS.find(s => s.id === secId);
  if (!sec) return;
  const log = todayLog();
  if (!sec.tasks.every(t => log[t.id])) return;

  const allDone = ALL_TASKS.every(t => log[t.id]);
  document.getElementById('cel-emoji').textContent = allDone ? '🎉' : sec.icon;
  document.getElementById('cel-title').textContent = allDone ? 'PERFECT DAY!' : `${sec.label} Done!`;
  document.getElementById('cel-msg').textContent   = allDone
    ? 'Every task completed. Incredible work — your recovery is on track!'
    : `All ${sec.label} tasks ticked off. Keep building!`;
  document.getElementById('overlay').classList.add('show');
}

function closeCelebrate() {
  document.getElementById('overlay').classList.remove('show');
}

// ══════════════════════════════════════════════════════════════════════════
// STREAKS
// ══════════════════════════════════════════════════════════════════════════
function calcStreak() {
  let streak = 0;
  const todayKey = todayStr();
  const todayDone = ALL_TASKS.filter(t => (S.log[todayKey] || {})[t.id]).length;
  const startOffset = todayDone > 0 ? 0 : 1;
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    if (ALL_TASKS.some(t => (S.log[key] || {})[t.id])) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function calcBestStreak() {
  const days = Object.keys(S.log).sort();
  let best = 0, cur = 0, prev = null;
  days.forEach(d => {
    const any = ALL_TASKS.some(t => S.log[d][t.id]);
    if (!any) { best = Math.max(best, cur); cur = 0; prev = null; return; }
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000;
      if (diff === 1) cur++; else { best = Math.max(best, cur); cur = 1; }
    } else cur = 1;
    prev = d;
  });
  return Math.max(best, cur);
}

// ══════════════════════════════════════════════════════════════════════════
// PROGRESS
// ══════════════════════════════════════════════════════════════════════════
function renderProgress() {
  const streak  = calcStreak();
  const best    = calcBestStreak();
  const days    = Object.keys(S.log).filter(d => ALL_TASKS.some(t => S.log[d][t.id]));
  const pcts    = days.map(d => Math.round(ALL_TASKS.filter(t => S.log[d][t.id]).length / TOTAL * 100));
  const avg     = pcts.length ? Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length) : 0;

  document.getElementById('ps-streak').textContent = streak;
  document.getElementById('ps-best').textContent   = best;
  document.getElementById('ps-days').textContent   = days.length;
  document.getElementById('ps-avg').textContent    = avg + '%';

  buildHeatmap();
  buildDailyChart();
  buildCategoryChart();
  buildWeeklyChart();
  buildInsights();
}

function getPct(dateStr) {
  const log = S.log[dateStr] || {};
  return Math.round(ALL_TASKS.filter(t => log[t.id]).length / TOTAL * 100);
}

function buildHeatmap() {
  const wrap = document.getElementById('heatmap');
  wrap.innerHTML = '';
  // Build 12 weeks (84 days) ending today, grouped by week columns
  const weeks = [];
  const end = new Date(todayStr());
  const start = new Date(end); start.setDate(start.getDate() - 83);
  // pad to Monday
  const startDow = start.getDay() === 0 ? 6 : start.getDay() - 1;
  const paddedStart = new Date(start); paddedStart.setDate(paddedStart.getDate() - startDow);

  const d = new Date(paddedStart);
  while (d <= end || d.getDay() !== 1) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    weeks.push(week);
  }

  // Days row labels
  const dayLabels = ['M','T','W','T','F','S','S'];
  const labelCol = document.createElement('div');
  labelCol.style.cssText = 'display:flex;flex-direction:column;gap:3px;margin-right:4px;flex-shrink:0';
  dayLabels.forEach(l => {
    const s = document.createElement('div');
    s.style.cssText = `width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--muted);font-family:'JetBrains Mono',monospace;`;
    s.textContent = l;
    labelCol.appendChild(s);
  });

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;gap:3px;overflow-x:auto;flex:1';

  weeks.forEach(week => {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:3px;flex-shrink:0';
    week.forEach(day => {
      const cell = document.createElement('div');
      cell.className = 'hm-cell';
      const key = day.toISOString().slice(0,10);
      const isFuture = day > new Date(todayStr());
      if (isFuture || day < new Date(start)) {
        cell.classList.add('pct-future');
      } else {
        const p = getPct(key);
        if (p === 0)       cell.classList.add('pct-0');
        else if (p < 33)   cell.classList.add('pct-low');
        else if (p < 66)   cell.classList.add('pct-mid');
        else if (p < 100)  cell.classList.add('pct-high');
        else               cell.classList.add('pct-full');
        cell.title = `${key}: ${p}%`;
      }
      col.appendChild(cell);
    });
    grid.appendChild(col);
  });

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;overflow-x:auto;';
  row.appendChild(labelCol);
  row.appendChild(grid);
  wrap.appendChild(row);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'hm-legend';
  legend.innerHTML = `
    <span>LESS</span>
    <div class="hm-legend-cell" style="background:var(--border)"></div>
    <div class="hm-legend-cell" style="background:#0a3320"></div>
    <div class="hm-legend-cell" style="background:#0d5c30"></div>
    <div class="hm-legend-cell" style="background:#1a9950"></div>
    <div class="hm-legend-cell" style="background:var(--green)"></div>
    <span>MORE</span>`;
  wrap.appendChild(legend);
}

function buildDailyChart() {
  const labels = [], data = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    labels.push(d.toLocaleDateString('en-GB', { month:'short', day:'numeric' }));
    data.push(getPct(key));
  }
  if (charts.daily) charts.daily.destroy();
  charts.daily = new Chart(document.getElementById('chart-daily'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data, fill: true,
        borderColor: '#00e676',
        backgroundColor: 'rgba(0,230,118,0.07)',
        tension: 0.4, borderWidth: 2,
        pointBackgroundColor: '#00e676',
        pointRadius: 3, pointHoverRadius: 6,
      }]
    },
    options: chartOpts({ yMax: 100, yCallback: v => v + '%' })
  });
}

function buildCategoryChart() {
  const days = Object.keys(S.log);
  const labels = [], data = [], colors = ['#00e676','#ffd740','#448aff','#ff9100','#e040fb','#ff5252','#00bcd4'];
  SECTIONS.forEach((sec, i) => {
    labels.push(sec.icon + ' ' + sec.label.split(' ')[0]);
    if (!days.length) { data.push(0); return; }
    const rates = days.map(d => sec.tasks.filter(t => (S.log[d]||{})[t.id]).length / sec.tasks.length * 100);
    data.push(Math.round(rates.reduce((a,b)=>a+b,0)/rates.length));
  });
  if (charts.cat) charts.cat.destroy();
  charts.cat = new Chart(document.getElementById('chart-category'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + '99'),
        borderColor: colors,
        borderWidth: 2, borderRadius: 6,
      }]
    },
    options: chartOpts({ yMax: 100, yCallback: v => v + '%' })
  });
}

function buildWeeklyChart() {
  const labels = [], data = [];
  for (let w = 11; w >= 0; w--) {
    labels.push(`W${12-w}`);
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const dd = new Date(); dd.setDate(dd.getDate() - w*7 - (6-d));
      total += getPct(dd.toISOString().slice(0,10));
    }
    data.push(Math.round(total / 7));
  }
  if (charts.weekly) charts.weekly.destroy();
  charts.weekly = new Chart(document.getElementById('chart-weekly'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map(v => v >= 80 ? 'rgba(0,230,118,0.7)' : v >= 50 ? 'rgba(255,215,64,0.6)' : 'rgba(255,82,82,0.5)'),
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: chartOpts({ yMax: 100, yCallback: v => v + '%' })
  });
}

function chartOpts({ yMax = 100, yCallback }) {
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color:'#55556a', font:{ size:10 } }, grid:{ color:'#1c1c2a' } },
      y: { min: 0, max: yMax, ticks: { color:'#55556a', font:{ size:10 }, callback: yCallback }, grid:{ color:'#1c1c2a' } }
    }
  };
}

function buildInsights() {
  const streak = calcStreak();
  const best   = calcBestStreak();
  const days   = Object.keys(S.log).sort();
  const pcts   = days.map(d => Math.round(ALL_TASKS.filter(t => S.log[d][t.id]).length / TOTAL * 100));
  const avg    = pcts.length ? Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length) : 0;
  const perfect = pcts.filter(p => p === 100).length;
  const zeroDays = pcts.filter(p => p === 0).length;

  const items = [];
  if (streak >= 3) items.push({ type:'good', t:`You're on a <strong>${streak}-day streak.</strong> Recovery is 80% about showing up daily.` });
  if (best > streak && best > 0) items.push({ type:'info', t:`Your best streak was <strong>${best} days</strong>. You can beat it.` });
  if (perfect > 0) items.push({ type:'good', t:`<strong>${perfect} perfect day${perfect>1?'s':''}</strong> with 100% completion. Each one accelerates healing.` });
  if (avg >= 70)   items.push({ type:'good', t:`Average completion <strong>${avg}%</strong> — excellent. This predicts a full recovery within your timeline.` });
  else if (avg >= 40) items.push({ type:'warn', t:`Average completion <strong>${avg}%</strong>. Aim for 70%+ to stay on the 8-week return-to-cricket track.` });
  else if (days.length > 3) items.push({ type:'bad', t:`Average <strong>${avg}%</strong> — your recovery timeline may extend beyond 8 weeks. Focus on must-dos: RICE + supplements.` });
  if (zeroDays > 2) items.push({ type:'warn', t:`<strong>${zeroDays} days with zero activity.</strong> On rest days, try at least RICE + supplements.` });

  SECTIONS.forEach(sec => {
    if (!days.length) return;
    const rates = days.map(d => sec.tasks.filter(t => (S.log[d]||{})[t.id]).length / sec.tasks.length * 100);
    const avg = Math.round(rates.reduce((a,b)=>a+b,0)/rates.length);
    if (avg < 30) items.push({ type:'warn', t:`<strong>${sec.icon} ${sec.label}</strong> only ${avg}% average — this section directly impacts your recovery speed.` });
  });

  if (!items.length) items.push({ type:'info', t:'Log a few more days to see personalised insights about your patterns.' });

  document.getElementById('insights-list').innerHTML = items.map(i => `
    <div class="insight-item">
      <div class="i-dot ${i.type}"></div>
      <p>${i.t}</p>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════════════════════════════
function renderHistory() {
  const container = document.getElementById('history-list');
  const days = Object.keys(S.log).sort().reverse();
  if (!days.length) {
    container.innerHTML = `<div class="history-empty">No history yet.<br>Complete tasks on the Today tab<br>to start building your log.</div>`;
    return;
  }
  container.innerHTML = days.map(d => {
    const pct = getPct(d);
    const label = new Date(d + 'T12:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    const names = ALL_TASKS.filter(t => (S.log[d]||{})[t.id]).map(t => t.name).join(' · ') || 'No tasks logged.';
    return `
      <div class="history-day" onclick="this.classList.toggle('open')">
        <div class="hd-header">
          <span class="hd-date">${label}</span>
          <div class="hd-bar"><div class="hd-fill" style="width:${pct}%"></div></div>
          <span class="hd-pct">${pct}%</span>
        </div>
        <div class="hd-tasks">${names}</div>
      </div>`;
  }).join('');
}

function exportCSV() {
  const days = Object.keys(S.log).sort();
  if (!days.length) { alert('No history to export yet.'); return; }
  let csv = 'Date,' + ALL_TASKS.map(t => `"${t.name}"`).join(',') + ',Completion%\n';
  days.forEach(d => {
    const cols = ALL_TASKS.map(t => (S.log[d]||{})[t.id] ? 1 : 0);
    csv += [d, ...cols, getPct(d) + '%'].join(',') + '\n';
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
  a.download = 'cricket-recovery-log.csv';
  a.click();
}

// ══════════════════════════════════════════════════════════════════════════
// REMINDERS
// ══════════════════════════════════════════════════════════════════════════
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function renderReminderStatus() {
  const perm = Notification.permission;
  const el   = document.getElementById('notif-banner');
  const txt  = document.getElementById('notif-status-text');
  el.className = 'notif-banner ' + perm;
  if (perm === 'granted') {
    txt.innerHTML = '✅ Notifications enabled — reminders will fire when the app is open or installed to home screen.';
    document.getElementById('enable-btn').style.display = 'none';
  } else if (perm === 'denied') {
    txt.innerHTML = '❌ Notifications blocked. Go to Chrome Settings → Site Settings → Notifications and allow this site.';
    document.getElementById('enable-btn').style.display = 'none';
  } else {
    txt.innerHTML = '🔔 Tap Enable to allow notifications — required for reminders.';
    document.getElementById('enable-btn').style.display = '';
  }
}

async function requestNotifPermission() {
  const result = await Notification.requestPermission();
  renderReminderStatus();
  if (result === 'granted') syncSWReminders();
}

function renderReminders() {
  const list = document.getElementById('rem-list');
  if (!S.reminders.length) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:12px">No reminders yet — add one above.</div>`;
    return;
  }
  list.innerHTML = S.reminders.map(r => {
    const dayStr = r.repeat === 'daily' ? 'Every day' : r.days.map(d => DAY_NAMES[d]).join(', ');
    return `
      <div class="rem-item">
        <div class="rem-time">${r.time}</div>
        <div class="rem-body">
          <div class="rem-name">${r.label}</div>
          <div class="rem-days">${dayStr}</div>
        </div>
        <button class="toggle ${r.enabled ? 'on' : ''}" onclick="toggleReminder(${r.id})"></button>
        <button class="rem-del" onclick="deleteReminder(${r.id})">✕</button>
      </div>`;
  }).join('');
}

// Day pill selection
let selectedDays = [0,1,2,3,4,5,6]; // default all

function toggleDayPill(el, val) {
  el.classList.toggle('selected');
  const i = selectedDays.indexOf(val);
  if (i >= 0) selectedDays.splice(i, 1);
  else selectedDays.push(val);
}

document.getElementById('rem-repeat').addEventListener('change', function() {
  const custom = document.getElementById('custom-days');
  custom.style.display = this.value === 'custom' ? 'flex' : 'none';
  if (this.value === 'daily')    selectedDays = [0,1,2,3,4,5,6];
  if (this.value === 'weekdays') selectedDays = [0,1,2,3,4];
  if (this.value === 'weekends') selectedDays = [5,6];
  if (this.value === 'custom')   selectedDays = [];
});

function addReminder() {
  const label  = document.getElementById('rem-label').value.trim() || 'Recovery reminder';
  const time   = document.getElementById('rem-time').value || '07:00';
  const repeat = document.getElementById('rem-repeat').value;
  const days   = repeat === 'custom' ? [...selectedDays].sort() : selectedDays;

  if (!days.length) { alert('Select at least one day.'); return; }

  S.reminders.push({ id: Date.now(), label, time, repeat, days, enabled: true });
  save();
  renderReminders();
  document.getElementById('rem-label').value = '';
}

function toggleReminder(id) {
  const r = S.reminders.find(r => r.id === id);
  if (r) r.enabled = !r.enabled;
  save(); renderReminders();
}

function deleteReminder(id) {
  S.reminders = S.reminders.filter(r => r.id !== id);
  save(); renderReminders();
}

// ══════════════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

// ══════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════
load();
registerSW();
renderToday();
