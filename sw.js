const CACHE_NAME = 'cricket-recovery-v1';
const ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: cache-first strategy ───────────────────────────────────────────
self.addEventListener('fetch', e => {
  // Skip non-GET and cross-origin except CDN fonts/charts
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache CDN resources too
        if (res.ok && (e.request.url.includes('cdnjs') || e.request.url.includes('fonts.g'))) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// ─── Messages from app ─────────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (!e.data) return;

  switch (e.data.type) {
    case 'SYNC_REMINDERS':
      syncReminders(e.data.reminders || []);
      break;
    case 'TEST_NOTIFICATION':
      fireNotification({
        title: '🏏 Cricket Recovery',
        body: 'Notifications are working! Tap to open your tracker.',
        tag: 'test',
      });
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// ─── Notification click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const action = e.action;
  if (action === 'dismiss') return;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Focus existing window if open
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      // Otherwise open app
      return clients.openWindow('./index.html');
    })
  );
});

// ─── Scheduling engine ─────────────────────────────────────────────────────
let scheduledTimers = new Map(); // reminderId -> timeoutId

function syncReminders(reminders) {
  // Clear all existing timers
  scheduledTimers.forEach(t => clearTimeout(t));
  scheduledTimers.clear();

  // Schedule each enabled reminder
  reminders.filter(r => r.enabled).forEach(r => scheduleNext(r));
}

function scheduleNext(r) {
  const msUntilNext = getMsUntilNext(r);
  if (msUntilNext === null) return;

  const t = setTimeout(() => {
    fireNotification({
      title: '🏏 Cricket Recovery',
      body: r.label,
      tag: `reminder-${r.id}`,
      data: { reminderId: r.id, url: './index.html' },
    });
    // Reschedule for the next occurrence
    scheduleNext(r);
  }, msUntilNext);

  scheduledTimers.set(r.id, t);
}

function getMsUntilNext(r) {
  const now = new Date();
  const [h, m] = r.time.split(':').map(Number);

  // Try today first, then scan next 7 days
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + i);
    candidate.setHours(h, m, 0, 0);

    if (candidate <= now) continue;

    // 0=Sun…6=Sat → convert to 0=Mon…6=Sun
    const dow = candidate.getDay() === 0 ? 6 : candidate.getDay() - 1;
    if (r.days.includes(dow)) {
      return candidate - now;
    }
  }
  return null;
}

function fireNotification({ title, body, tag, data }) {
  self.registration.showNotification(title, {
    body,
    icon: './icons/icon-192.png',
    badge: './icons/icon-96.png',
    tag: tag || 'recovery',
    vibrate: [200, 100, 200],
    data: data || {},
    actions: [
      { action: 'open',    title: '✓ Open App' },
      { action: 'dismiss', title: 'Later' },
    ],
    requireInteraction: false,
  });
}
