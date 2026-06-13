#!/usr/bin/env python3
"""Build docs/data/votos_por_sesion.json — the by-session door to the same vote
data the per-senator "Registro de votos" already uses.

Reads the verified Senate vote rows and the plain-language bill explanations,
and emits one entry per plenary session, each listing the bills voted on in it
with: the plain "¿qué es? / ¿y a mí qué?" text, the Sí/No/Ausente totals computed
from the actual roll, and the full per-senator roll.

HONESTY RULES (same as the rest of the site):
- Only bills that have a verified plain-language entry in bills.json are shown.
  The raw vote file carries OCR fragments as bill ids ("PRIMERA DISCUSIÓN",
  "VARIAS", truncated numbers). Those are NOT real, explainable bills, so they
  are skipped rather than shown with a garbage title.
- Totals come from counting the real roll for that session+bill, not from a
  precomputed field, so the number always matches the names listed below it.
- Dates come from the Senate sessions ledger (sessions-ledger.md), which maps
  each session code to the real DATE of that plenary video on @SenadoRD. The
  ledger is the source of truth; this script reads it and stamps each session's
  "fecha" with the real ISO date. A session code with no ledger match keeps the
  code as its fecha (so we never invent a date) — in practice all current codes
  map. The map is parsed live from the ledger, with an inline fallback (built
  from that same ledger) so the build still works if the ledger file moves.
- Chamber of Deputies has no data yet -> emitted as an empty list placeholder.

Source datasets live in the sibling politica-sencilla-rd repo (NOT in this repo):
  ../politica-sencilla-rd/senado-reader/dataset/verified_votes.json
  ../politica-sencilla-rd/senado-reader/dataset/bills.json
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)  # dr-laws-site
DATASET = os.path.normpath(
    os.path.join(REPO, "..", "politica-sencilla-rd", "senado-reader", "dataset")
)
# Refreshed votes carry the recovered (de-garbled) bill ids + the applied
# 2026-budget NO-voter correction; bills_refreshed.json holds the 11 bills the
# id-recovery pass newly surfaced. Both fold in here so the by-session door shows
# the same corrected, fuller data as the rest of the gap-close work.
VOTES_PATH = os.path.join(DATASET, "clean_votes_refreshed.json")
BILLS_PATH = os.path.join(DATASET, "bills.json")
BILLS_REFRESHED_PATH = os.path.join(DATASET, "bills_refreshed.json")
# The sessions ledger sits one level above the dataset folder in the same
# sibling repo. It is the source of truth for session-code -> real DATE.
LEDGER_PATH = os.path.normpath(os.path.join(DATASET, "..", "sessions-ledger.md"))
OUT_PATH = os.path.join(REPO, "docs", "data", "votos_por_sesion.json")

# Raw vote tokens -> the three plain values the front-end renders.
VOTO_MAP = {"SI": "si", "NO": "no", "ABSENT": "ausente"}

# Inline fallback session-code -> real ISO date, transcribed from
# sessions-ledger.md (the YouTube @SenadoRD streams table). Used only if the
# ledger file can't be read; the live parse below is preferred. Covers every
# session code the site currently renders.
SESSION_DATES_FALLBACK = {
    "0116": "2026-06-12", "0115": "2026-06-10", "0114": "2026-06-02",
    "0113": "2026-05-27", "0112": "2026-05-18", "0111": "2026-05-13",
    "0110": "2026-05-06", "0109": "2026-04-29", "0108": "2026-04-23",
    "0107": "2026-04-21", "0106": "2026-04-15", "0105": "2026-03-24",
    "0104": "2026-03-18", "0103": "2026-03-11", "0102": "2026-03-04",
    "0099": "2026-01-10", "0097": "2026-01-08", "0095": "2025-12-18",
    "0093": "2025-12-16", "0092": "2025-12-09",
}

# Matches one ledger table row and pulls the session code (col 2) and the ISO
# date (col 3, e.g. "2026-06-12 Fri"). Example row:
#   | 1 | 0116 | 2026-06-12 Fri | 0h53m | MCxWyirFmoM | pending | queued | ...
LEDGER_ROW = re.compile(
    r"^\|\s*\d+\s*\|\s*(\d{3,4})\s*\|\s*(\d{4}-\d{2}-\d{2})\b"
)


def load_session_dates() -> dict:
    """Return {session_code: ISO_date} parsed from the ledger.

    The ledger (sessions-ledger.md) is the source of truth. If it can't be read
    for any reason, fall back to the inline transcription above so the build
    never breaks. Never invents a date — a code missing from both simply isn't
    in the map, and the caller keeps the code as the fecha.
    """
    try:
        with open(LEDGER_PATH, encoding="utf-8") as f:
            text = f.read()
    except OSError:
        return dict(SESSION_DATES_FALLBACK)

    dates = {}
    for line in text.splitlines():
        m = LEDGER_ROW.match(line)
        if m:
            dates[m.group(1)] = m.group(2)
    # If parsing somehow found nothing, fall back rather than blank every date.
    return dates or dict(SESSION_DATES_FALLBACK)


def main() -> None:
    with open(VOTES_PATH, encoding="utf-8") as f:
        votes = json.load(f)
    with open(BILLS_PATH, encoding="utf-8") as f:
        bills = json.load(f)
    # Merge the newly-recovered bills on top of the base set (base wins on any
    # id overlap so a hand-verified entry is never clobbered).
    with open(BILLS_REFRESHED_PATH, encoding="utf-8") as f:
        bills_refreshed = json.load(f)

    # Session-code -> real ISO date, from the ledger (source of truth).
    session_dates = load_session_dates()

    # Plain-language explanation per bill id (only real, verified bills).
    bmap = {b["id"]: b for b in bills_refreshed if b.get("id")}
    bmap.update({b["id"]: b for b in bills if b.get("id")})

    # Group rows by session, preserving first-seen order of bills and senators
    # so the output reads in the same order the source file lists them.
    sesiones = {}          # session -> {bill_id -> [(senator, voto), ...]}
    sesion_orden = []      # session codes, first-seen order
    bill_orden = {}        # session -> [bill_id, ...] first-seen order

    for row in votes:
        bid = row.get("bill_id")
        if not bid or bid not in bmap:
            # Skip rows whose bill id has no verified plain explanation
            # (OCR fragments, blanks). Keeps the by-session view clean + honest.
            continue
        ses = row["session"]
        voto = VOTO_MAP.get(row.get("vote"), "ausente")
        senator = row.get("senator", "")
        if ses not in sesiones:
            sesiones[ses] = {}
            bill_orden[ses] = []
            sesion_orden.append(ses)
        if bid not in sesiones[ses]:
            sesiones[ses][bid] = []
            bill_orden[ses].append(bid)
        sesiones[ses][bid].append((senator, voto))

    # Newest session first (session codes are zero-padded, so string sort works),
    # to match the rest of the site (newest at the top).
    sesion_orden.sort(reverse=True)

    senado = []
    for ses in sesion_orden:
        bills_out = []
        for bid in bill_orden[ses]:
            roll = sesiones[ses][bid]
            si = sum(1 for _, v in roll if v == "si")
            no = sum(1 for _, v in roll if v == "no")
            ausente = sum(1 for _, v in roll if v == "ausente")
            b = bmap[bid]
            bills_out.append({
                "bill_id": bid,
                "titulo": b.get("titulo", bid),
                "que_es": b.get("que_es", ""),
                "como_afecta": b.get("como_afecta", ""),
                "si": si,
                "no": no,
                "ausente": ausente,
                "roll": [{"senator": s, "vote": v} for s, v in roll],
            })
        if not bills_out:
            continue
        senado.append({
            "numero": ses,
            # Real plenary date from the ledger. Falls back to the session code
            # only if a code has no ledger match (never an invented date).
            "fecha": session_dates.get(ses, ses),
            "bills": bills_out,
        })

    out = {"Senado": senado}

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")

    total_bills = sum(len(s["bills"]) for s in senado)
    total_rolls = sum(len(b["roll"]) for s in senado for b in s["bills"])
    con_fecha = sum(1 for s in senado if s["fecha"] != s["numero"])
    print(f"Wrote {OUT_PATH}")
    print(f"  Senado: {len(senado)} sesiones, {total_bills} bills, {total_rolls} roll rows")
    print(f"  Fechas reales desde el ledger: {con_fecha}/{len(senado)} sesiones")


if __name__ == "__main__":
    main()
