# Leyes RD — Project FAQ

Scoped to the DR-laws site project. Plain answers, with the source. Update as we learn more.
Last updated 2026-06-07.

## Voting transparency

Q: Why doesn't the site show who voted on each law?
A: The Congress records the votes but does not publish them openly per legislator. The common (electronic) vote usually shows only the totals; a "nominal" (by-name) vote does record each name. Source: Reglamento de la Cámara de Diputados / Reglamento del Senado.

Q: Are legislators' votes secret in the DR?
A: No. Secret voting in Congress is banned. The "secret vote" in the Constitution refers to CITIZENS voting in elections, not legislators in session. Source: Reglamento de la Cámara (no votación secreta); Constitución Art. 208.

Q: Does the Senate keep each senator's vote?
A: Yes. The Senate runs an automated voting system that keeps an individual, historical record of how each of the 32 senators votes on every matter, shown live on screens. Page: senadord.gob.do/votaciones-electronicas. (Still confirming whether that page lists each senator's choice per bill or only session minutes.)

Q: And the Chamber of Deputies?
A: Two legal modes — electronic (ordinary) and by name (nominal); no secret voting. The record exists; open per-member publication is limited.

Q: How do I request a vote record?
A: Free, under the Free Access to Information law (Ley 200-04), through the SAIP portal (saip.gob.do). Pick the chamber, ask for the "acta de votación nominal" for the bill/date. They must answer in ~15 working days.

Q: Does the US publish individual votes?
A: Yes. Each member's recorded vote is public by law (Constitution, Article 1, Section 5) and posted at congress.gov and the House/Senate sites.

Q: Who watches the DR Congress?
A: Participación Ciudadana (main transparency watchdog), the Observatorio Político Dominicano (has a legislative unit), and the Red Latinoamericana por la Transparencia Legislativa.

## Data on the site

Q: Where do the laws come from?
A: Real bills from the Senate's own 2024-2028 database (senado.gov.do / senadord.gob.do), rewritten into simple Spanish and grouped by sector.

Q: Are the laws real?
A: Yes. Earlier versions used clearly-labeled samples; the live site now uses real Senate bills.

Q: Why do some laws say "Razón no indicada"?
A: The Senate's bill page lists the title and status but not a written reason, so we don't invent one.

Q: Are the province leaders real?
A: Senators and deputies per province are being filled in from the Senate and Chamber of Deputies (2024-2028). Any province not yet confirmed shows "Información por publicar" — no invented names.

## Build / tech

Q: Where does it live?
A: GitHub Pages (free), repo Kevthetech143/leyes-rd, served from /docs. Live: https://kevthetech143.github.io/leyes-rd/

Q: What is it built with?
A: TypeScript (src/app.ts compiled to docs/app.js), plain HTML/CSS, JSON data files. No backend.
