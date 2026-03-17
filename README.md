# 🏏 Cricket Recovery Tracker — PWA

A Progressive Web App for tracking shin splint & ankle injury recovery while returning to cricket.

## Features
- ✅ Daily task tracker with 7 categories
- 📊 Progress charts & 12-week heatmap
- 📅 History log with CSV export
- 🔔 Browser push notifications & reminders
- 📱 Installable on Android (add to home screen)
- ✈️ Works fully offline

---

## Deploy to GitHub Pages (5 minutes)

### 1. Create a new GitHub repo
Go to https://github.com/new
- Name: `cricket-recovery`
- Visibility: **Public** (required for free GitHub Pages)
- Don't initialise with README

### 2. Push this folder

```bash
cd cricket-recovery   # this unzipped folder
git init
git add .
git commit -m "Initial commit: Cricket Recovery PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cricket-recovery.git
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Source", select **Deploy from a branch**
4. Branch: `main` / Folder: `/ (root)`
5. Click **Save**

Wait ~60 seconds, then your app is live at:
`https://YOUR_USERNAME.github.io/cricket-recovery/`

---

## Install on Pixel 7 (Android)

1. Open the URL above in **Chrome**
2. Tap the **"Add to Home Screen"** banner at the bottom (or tap ⋮ menu → "Add to Home Screen")
3. Tap **Add**
4. App appears on your home screen with its own icon
5. Open it → go to **Reminders** tab → tap **Enable** to allow notifications

Once installed, the app:
- Opens in full-screen (no browser UI)
- Works offline
- Fires notification reminders even when the tab is in the background

---

## File structure

```
cricket-recovery/
├── index.html       ← Main app shell
├── style.css        ← All styles (mobile-first)
├── app.js           ← All app logic
├── sw.js            ← Service worker (caching + notifications)
├── manifest.json    ← PWA manifest
├── README.md
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-192.png
    ├── icon-maskable-512.png
    └── ... (other sizes)
```

---

## Local development

```bash
# Needs HTTPS or localhost for service workers
# Option 1: Python simple server
python3 -m http.server 8080
# Then open: http://localhost:8080

# Option 2: npx serve
npx serve .
```

> ⚠️ Service workers require either `localhost` or HTTPS to register.
> GitHub Pages serves over HTTPS automatically — you're good.
