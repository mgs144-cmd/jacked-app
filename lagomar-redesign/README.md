# Lago Mar — Homepage Exploration

A single-page React app presenting **four** full homepage concept directions for Lago Mar Beach Resort & Club. Use it to compare brand directions side by side before choosing a final direction.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview   # preview production build
```

## Logo

Place the Lago Mar logo image at **`public/lago-mar-logo.png`**. The app uses it in the header and hero of each concept. If the file is missing, a text fallback (“Lago Mar”) is shown.

## Structure

- **Sticky nav** — Jump to Intro, Concept 1–4, or Summary.
- **Intro** — Short explanation of the exploration.
- **Comparison bar** — At-a-glance: concept name, logo style, palette, vibe.
- **Concepts 1–4** — Full hero-to-footer homepage mockups with shared content and different themes:
  - **Concept 1** — Heritage Coastal Classic (navy, cream, gold)
  - **Concept 2** — Soft Sage Resort (sage, cream, taupe, gold)
  - **Concept 3** — Rosewood-Inspired Editorial Luxury (ink, stone, sand, brass)
  - **Concept 4** — Ocean Club / Nautical Heritage (navy, seafoam, cream, brass)
- **Summary** — Thumbnail cards linking back to each concept.

Each concept includes: header, hero, intro, accommodations, dining, beach/pool, family, weddings, membership, gallery strip, footer, and a “Select this direction” button for presentations.

## Tech

- React 18
- Vite
- Tailwind CSS
- No backend; presentation-only.
