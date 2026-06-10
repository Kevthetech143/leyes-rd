# JCE Regidores Pull — Resume Note

Status: PARSED. Source acquired, all 158 municipios parsed. Merging into site data.

## Source (verified 2026-06-10)
- Portal: https://elecciones2024.jce.gob.do/municipales
- The "Candidatos Electos ... Descargar EXCEL" link is the WHOLE elected list (alcaldes, vicealcaldes, regidores, directores, vocales) in one .xlsx.
- Real download URL (host has NO hyphen):
  https://elecciones2024.jce.gob.do/DesktopModules/EasyDNNNews/DocumentDownload.ashx?portalid=0&moduleid=469&articleid=9&documentid=14
  (the hyphenated host elecciones-2024... 404s; needs a Referer header for curl)
- Saved locally to ~/jce_electos.xlsx (246 KB, "RELACION DE CANDIDATOS ELECTOS ...
  MUNICIPALES DEL 18 DE FEBRERO 2024.xlsx").
- NO JSON API exists on the portal — it is a DotNetNuke CMS page. The Excel IS the clean source. No PDF grinding needed.

## Excel shape
- Sheet "Hoja1", 3862 rows. Header on row index 3.
- Cols: PROVINCIA | MUNICIPIO | CIRC. | DISTRITO MUNICIPAL | CARGO | POSICION_ELEC |
  ORGANIZACION POLITICA | NOMBRE/APELLIDO | SEXO | VOTOS | PARTIDO DEL CANDIDATO
- CARGO values: SUPLENTE REGIDOR(A) 1172, REGIDOR 1169, VOCAL 733, DIRECTOR 234,
  SUBDIRECTOR 234, ALCALDE 158, VICEALCALDE 158.

## Counting (the honest numbers)
- 1169 raw REGIDOR rows.
- 3 of them have a BLANK name cell (real seats, no name printed):
  La Vega / La Vega pos 17; Monte Plata / Monte Plata pos 7; Puerto Plata / Luperon pos 5 (PLD, no name).
  -> these 3 are LOGGED, NOT shipped (no fabrication).
- 1166 named rows. 5 are alliance-duplicate rows (same person listed under 2-3 sub-parties):
  Jarabacoa pos 6 (Rafael Antonio Peralta Sanchez) x3, Jarabacoa pos 8 (Dayamo Victoriano Ramirez) x3,
  Santo Domingo Este Circ.3 pos 9 (Ana Johanny Duran Rosario) x2.
- After dedup on (prov,muni,circ,pos,name): 1161 unique named regidores, 158 municipios, 32 provincias.
- JCE official headline = 1164 seats. Gap = 3 = the blank-name seats above. Accounted for.

## Decisions
- Party = ORGANIZACION POLITICA (col 6, winning ticket/alliance) to match the existing
  city-hall-sourced 98 entries (they listed the bloc, not the candidate's micro-party).
- Names title-cased from ALL-CAPS source (Spanish connectors de/del/la stay lowercase).
- The 4 pre-existing city-hall municipios (DN, SDE, SDN, SDO) are REPLACED with JCE data:
  same people, but JCE gives full legal names + adds seats the city halls omitted
  (DN 36->37, SDE 32->33, SDN 17->17, SDO 13->15). One official source, whole country.

## Files
- Builder: scripts/build_regidores.py  (xlsx -> scripts/jce_regidores_raw.json)
- Merge:   scripts/merge_regidores.py   (raw -> docs/data/provincias.json)
- Raw:     scripts/jce_regidores_raw.json (province -> municipio -> [{nombre,partido}])

## If you are a successor agent
Everything is parsed. Re-run `python3 scripts/build_regidores.py` then
`python3 scripts/merge_regidores.py`, `npm run build`, bump cache-buster in
docs/index.html, browser-verify at 390px, commit + push.
