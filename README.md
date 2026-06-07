# Leyes RD — Fácil de Entender (v0 prototype)

A free, no-login static website that explains Dominican Republic laws in plain,
kid-friendly Spanish, grouped by sector, with expandable detail, vote records, and a
province view of leaders.

Built 2026-06-07 by Lawyer (under Kelvin's explicit override).

## What works now (v0)
- Sector-grouped law list (Salud, Trabajo, Seguridad, Educación). Never by title/ID.
- Tap a sector -> tap a law -> expands to "¿Qué es?", "¿Por qué se propuso?", and "¿Quién votó?".
- Province tab: tap a province -> see leaders, party, plain summary, and vote record.
- Kid-simple Spanish, mobile-first, fun UI.
- Pure static: index.html + styles.css + app.js + /data/*.json. No backend.

## IMPORTANT — data is SAMPLE only
Everything in /data/leyes.json and /data/provincias.json is clearly labelled
"DATOS DE EJEMPLO". These are NOT real laws or real votes. A yellow banner says so.
Do not present this as real until the live feed is wired. Honesty first — no fake laws
shown as real.

## Files
- index.html — page shell + tabs
- styles.css — flag-colored, kid-friendly theme
- app.js — loads JSON, groups by sector, expand logic, province profiles
- data/leyes.json — sample laws grouped by sector
- data/provincias.json — sample provinces + leaders

## Run locally
Must use a web server (fetch() won't work from file://):
    cd site && python3 -m http.server 8765
Open http://127.0.0.1:8765

## Deploy free on GitHub Pages
1. Create a public repo (e.g. leyes-rd).
2. Put the contents of /site at the repo root.
3. Repo Settings -> Pages -> Source: main branch, / (root).
4. Live at https://<user>.github.io/leyes-rd/

## Next steps (the real work)
1. DATA PIPELINE: a scheduled GitHub Action that pulls bills from the Senate SIL and
   Chamber SIL, then rebuilds data/leyes.json. "Real-time" on static = scheduled rebuild.
2. PLAIN-LANGUAGE STEP: bills are written in legalese. Need an AI summarization pass to
   produce the short "qué es / por qué" Spanish text per law.
3. VOTING RECORDS — OPEN RISK: per-legislator votes are NOT cleanly published by the DR
   congress. Confirm what vote data is actually obtainable before promising this feature.
4. Real province + leader data (from JCE / congress rosters).
5. Optional: real clickable SVG map instead of the province grid.

Spec: 2026-06-07-spec.md
