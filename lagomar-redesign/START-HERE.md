# Get the app to show

## Use this folder (the one with this file)

The app lives in **this** folder. If you moved or copied `lagomar-redesign` somewhere else (e.g. directly onto Desktop), that copy may be **outdated** and can show a blank page.

**Use the folder that contains this START-HERE.md** (and the same folder where you run the commands below).

## Steps

1. **Open Terminal** and go into this project folder:
   ```bash
   cd path/to/lagomar-redesign
   ```
   Example if it’s inside jacked-app:
   ```bash
   cd ~/Desktop/jacked-app/lagomar-redesign
   ```

2. **Install dependencies** (if you haven’t, or after moving the folder):
   ```bash
   npm install
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

4. **Open the URL Vite prints**, e.g.:
   ```text
   ➜  Local:   http://localhost:5173/
   ```
   In your browser go to: **http://localhost:5173**

5. **Hard refresh** so you don’t see a cached blank page:
   - Mac: **Cmd + Shift + R**
   - Windows: **Ctrl + Shift + R**

## What you should see

- First you should see a **dark bar** at the top: “Page loaded. Waiting for app…”
- Then the full Lago Mar comparison page (nav, intro, four concepts, summary).
- The page background is **light gray**, not pure white.

If you still see only a **plain white** page:

- Confirm the address bar says **http://localhost:5173** (not 3000 or something else).
- Confirm you ran `npm run dev` from **this** folder (the one that has `START-HERE.md` and `src/App.jsx`).
- If you want to use a copy on your Desktop, **copy the whole folder again** from here (so it has the latest `index.html`, `src/`, etc.) and run `npm install` and `npm run dev` inside that new copy.

## Alternative: run the built version

```bash
npm run build
npm run preview
```

Then open the URL shown (usually http://localhost:4173). Same app, served as static files.
