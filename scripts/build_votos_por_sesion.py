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
- Dates are NOT derivable: the vote-file "session" code is a board/session index
  that does not line up with the public acta numbers in sesiones.json. So the
  session number itself is used as the label, and the view says so honestly.
- Chamber of Deputies has no data yet -> emitted as an empty list placeholder.

Source datasets live in the sibling politica-sencilla-rd repo (NOT in this repo):
  ../politica-sencilla-rd/senado-reader/dataset/verified_votes.json
  ../politica-sencilla-rd/senado-reader/dataset/bills.json
"""
import json
import os

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
OUT_PATH = os.path.join(REPO, "docs", "data", "votos_por_sesion.json")

# Raw vote tokens -> the three plain values the front-end renders.
VOTO_MAP = {"SI": "si", "NO": "no", "ABSENT": "ausente"}


def main() -> None:
    with open(VOTES_PATH, encoding="utf-8") as f:
        votes = json.load(f)
    with open(BILLS_PATH, encoding="utf-8") as f:
        bills = json.load(f)
    # Merge the newly-recovered bills on top of the base set (base wins on any
    # id overlap so a hand-verified entry is never clobbered).
    with open(BILLS_REFRESHED_PATH, encoding="utf-8") as f:
        bills_refreshed = json.load(f)

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
            "fecha": ses,  # date not derivable; label honestly by session number
            "bills": bills_out,
        })

    out = {"Senado": senado}

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")

    total_bills = sum(len(s["bills"]) for s in senado)
    total_rolls = sum(len(b["roll"]) for s in senado for b in s["bills"])
    print(f"Wrote {OUT_PATH}")
    print(f"  Senado: {len(senado)} sesiones, {total_bills} bills, {total_rolls} roll rows")


if __name__ == "__main__":
    main()
