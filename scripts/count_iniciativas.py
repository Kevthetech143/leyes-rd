#!/usr/bin/env python3
"""Lane 3: tally Senate initiatives authored/co-authored per current senator.

Reads the scraped Ficha "Proponentes" field (campos_nota_644) for every
expediente in the SIL collection-53 list, keeps only initiatives filed during
the 2024-2028 legislature (numero year 2024-2026), and counts a senator when
their name appears in the proponente string — authored OR co-authored.

Name matching is by distinctive surname tokens, the same idea used in the
attendance OCR matcher: a proponente substring matches a senator when enough
of that senator's name tokens (2+, or 1 if it is a token unique to that one
senator) appear in the normalized proponente text. This survives the SIL's
name variants ("Pedro Manuel Catrain Bonilla" vs canonical "Pedro Catrain
Bonilla", "Ginnette Bournigal de Jiménez" vs "Ginnette Altagracia Bournigal").

Output: scripts/iniciativas_count.json  (per-senator count + matched ids).
Never invents: only counts proponente strings actually scraped from the SIL.
"""
import json
import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
SENATORS = json.loads((HERE / "senators_canon.json").read_text())


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z]", "", s.lower())


def tokens(name: str) -> list[str]:
    skip = {"de", "la", "los", "las", "del", "y", "san", "e"}
    seen: list[str] = []
    for w in name.split():
        if w.lower() in skip or len(w) <= 2:
            continue
        t = norm(w)
        # Dedupe repeated surnames (e.g. "Rodríguez Rodríguez") so a single
        # occurrence in the proponente text can't be double-counted as 2 hits.
        if t and t not in seen:
            seen.append(t)
    return seen


SEN_TOKENS = {s["nombre"]: tokens(s["nombre"]) for s in SENATORS}

# Tokens owned by exactly one senator are safe single-hit anchors.
_owners: dict[str, set[str]] = {}
for _name, _toks in SEN_TOKENS.items():
    for _t in _toks:
        _owners.setdefault(_t, set()).add(_name)
UNIQUE_TOKENS = {t: next(iter(o)) for t, o in _owners.items() if len(o) == 1}


def senators_in(proponente: str) -> list[str]:
    """Return every current senator whose name appears in this proponente string."""
    text = norm(proponente)
    if not text:
        return []
    hits: list[str] = []
    for name, toks in SEN_TOKENS.items():
        if not toks:
            continue
        present = [t for t in toks if t in text]
        n = len(present)
        if n >= 2:
            hits.append(name)
        elif n == 1:
            only = present[0]
            if len(only) >= 5 and UNIQUE_TOKENS.get(only) == name:
                hits.append(name)
    return hits


def numero_year(numero: str) -> str | None:
    m = re.search(r"-((?:19|20)\d\d)-", numero or "")
    return m.group(1) if m else None


# Origin bodies that are NOT the senator. When a Ficha's proponente starts with
# one of these, the bill came from outside the Senate (the Chamber of Deputies,
# the Executive, the courts, a city council...) and the names listed are deputies
# or officials — NOT the proposing senator. Crediting a current senator off such
# a record is a false positive (e.g. deputy "Rafael Aníbal Díaz Rodríguez"
# colliding with senator "Odalís Rafael Rodríguez Rodríguez"), so we skip them.
EXTERNAL_ORIGIN = (
    "CAMARA DE DIPUTADOS",
    "CÁMARA DE DIPUTADOS",
    "PODER EJECUTIVO",
    "SUPREMA CORTE",
    "JUNTA CENTRAL",
    "CONSEJO DEL PODER",
    "TRIBUNAL",
    "AYUNTAMIENTO",
    "LIGA MUNICIPAL",
    "PROCURADURIA",
    "PROCURADURÍA",
    "CONTRALORIA",
    "CONTRALORÍA",
)


def is_external_origin(proponente: str) -> bool:
    p = (proponente or "").strip().upper()
    return p.startswith(EXTERNAL_ORIGIN)


def load_merged() -> list[dict]:
    raw = json.loads((HERE / "iniciativas_raw.json").read_text())["records"]
    res = {r["id"]: r for r in json.loads((HERE / "iniciativas_resume.json").read_text())["records"]}
    gap_path = HERE / "_gap_out.json"
    gap = {r["id"]: r for r in json.loads(gap_path.read_text())} if gap_path.exists() else {}
    merged = []
    for r in raw:
        rec = dict(r)
        for src in (res, gap):
            if r["id"] in src:
                if not rec.get("proponente") and src[r["id"]].get("proponente"):
                    rec["proponente"] = src[r["id"]]["proponente"]
                if not rec.get("numero") and src[r["id"]].get("numero"):
                    rec["numero"] = src[r["id"]]["numero"]
        merged.append(rec)
    return merged


def main() -> None:
    merged = load_merged()
    # Keep only initiatives filed in the current legislature (2024-2026).
    legis = [r for r in merged if numero_year(r.get("numero", "")) in {"2024", "2025", "2026"}]

    # Only Senate-authored bills count toward a senator. Bills whose proponente
    # is an external body (Chamber of Deputies, Executive, courts...) are dropped.
    senate_authored = [r for r in legis if not is_external_origin(r.get("proponente", ""))]

    counts = {s["nombre"]: 0 for s in SENATORS}
    matched_ids: dict[str, list[int]] = {s["nombre"]: [] for s in SENATORS}
    for r in senate_authored:
        for name in senators_in(r.get("proponente", "")):
            counts[name] += 1
            matched_ids[name].append(r["id"])

    out = {
        "fuente": "Sistema de Información Legislativa (SIL) — senado.gov.do, colección 53 (C2024-2028)",
        "periodo": "legislatura 2024-2028 (iniciativas 2024-2026)",
        "total_expedientes_colectados": len(merged),
        "total_legislatura_2024_2028": len(legis),
        "total_autoria_senado": len(senate_authored),
        "counts": counts,
        "matched_ids": matched_ids,
    }
    (HERE / "iniciativas_count.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1)
    )
    nonzero = sum(1 for v in counts.values() if v > 0)
    print(f"legislature initiatives counted: {len(legis)}")
    print(f"senators with >=1 attributed: {nonzero}/32")
    for name in sorted(counts, key=lambda k: -counts[k]):
        print(f"  {counts[name]:4d}  {name}")


if __name__ == "__main__":
    main()
