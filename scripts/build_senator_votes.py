#!/usr/bin/env python3
"""
Build each senator's own vote record onto their province profile, for all 32 senators.

Source of truth: docs/data/votos_por_sesion.json (the shipped, fact-checked by-session
roll). It already groups by session (newest first), by bill (with plain titulo/que_es/
como_afecta), and carries a per-bill `roll` of {senator, vote} with vote already lowered
to si/no/ausente AND the two-board conflicts already resolved. We invert that roll into
the per-senator pilot shape so the per-profile view and the by-session view are identical
by construction (no second, divergent collapse rule).

We write, per Senador in provincias.json:
  - votos:      [{sesion, leyes:[{bill_id, titulo, que_es, como_afecta, voto}]}]  newest first
  - votos_nota: the honest scope line (verbatim from the pilot)
  - registro:   "N votos en M sesiones (sesiones recientes)"

Honesty rule: a bill is only included if it has titulo+que_es+como_afecta (verified plain
entry). The by-session source already only contains such bills, so nothing is dropped here;
we still guard it so an OCR fragment could never leak in.

Matched by name (accent/case-insensitive). All 32 senators in the roll map 1:1 to a Senador
leader in provincias.json (verified). Any senator that fails to match is left untouched and
reported — never guessed.
"""
import json
import unicodedata
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
PROVINCIAS = SITE / "docs" / "data" / "provincias.json"
BY_SESSION = SITE / "docs" / "data" / "votos_por_sesion.json"

NOTA = ("Estas son las sesiones recientes del Senado que ya leímos, no todo su período. "
        "Iremos añadiendo más.")


def norm(s: str) -> str:
    """Lowercase + strip accents + collapse whitespace, for name matching only."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return " ".join(s.lower().split())


def has_entry(b: dict) -> bool:
    return bool(b.get("titulo") and b.get("que_es") and b.get("como_afecta"))


def main():
    prov_doc = json.loads(PROVINCIAS.read_text(encoding="utf-8"))
    by_session = json.loads(BY_SESSION.read_text(encoding="utf-8"))["Senado"]

    # Invert the by-session roll into per-senator, preserving session order (newest first
    # as stored in the file) and bill order within a session.
    # votos_by_sen[norm_name] = list of {"sesion": str, "leyes": [...]}
    votos_by_sen: dict[str, list] = {}
    skipped_bills = 0
    for ses in by_session:
        sesion = ses["numero"]
        for b in ses.get("bills", []):
            if not has_entry(b):
                skipped_bills += 1
                continue
            ley_common = {
                "bill_id": b["bill_id"],
                "titulo": b["titulo"],
                "que_es": b["que_es"],
                "como_afecta": b["como_afecta"],
            }
            for r in b.get("roll", []):
                key = norm(r["senator"])
                voto = r["vote"]
                if voto not in ("si", "no", "ausente"):
                    raise SystemExit(f"Unexpected vote value {voto!r} for {r['senator']} "
                                     f"in session {sesion} bill {b['bill_id']}")
                bucket = votos_by_sen.setdefault(key, [])
                # find or create this session's slot, keeping first-seen order
                slot = next((x for x in bucket if x["sesion"] == sesion), None)
                if slot is None:
                    slot = {"sesion": sesion, "leyes": []}
                    bucket.append(slot)
                ley = dict(ley_common)
                ley["voto"] = voto
                slot["leyes"].append(ley)

    # Apply onto every Senador in provincias.json, matched by normalized name.
    applied = []
    unmatched_prov_senators = []
    senator_keys_used = set()
    for prov in prov_doc["provincias"]:
        for lider in prov.get("lideres", []):
            if lider.get("cargo") != "Senador/a":
                continue
            key = norm(lider["nombre"])
            votos = votos_by_sen.get(key)
            if not votos:
                unmatched_prov_senators.append((lider["nombre"], prov["nombre"]))
                continue
            senator_keys_used.add(key)
            n_votos = sum(len(s["leyes"]) for s in votos)
            n_ses = len(votos)
            lider["registro"] = f"{n_votos} votos en {n_ses} sesiones (sesiones recientes)"
            lider["votos"] = votos
            lider["votos_nota"] = NOTA
            applied.append((lider["nombre"], prov["nombre"], n_votos, n_ses))

    # Roll senators that never matched a province (should be none).
    roll_keys = set(votos_by_sen.keys())
    roll_only = roll_keys - senator_keys_used

    PROVINCIAS.write_text(
        json.dumps(prov_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"Senators given a vote record: {len(applied)} / 32")
    print(f"Skipped bills (no verified plain entry): {skipped_bills}")
    for nombre, prov, n_votos, n_ses in applied:
        print(f"  {nombre:42s} {prov:22s} {n_votos} votos / {n_ses} sesiones")
    if unmatched_prov_senators:
        print("\nProvince Senadores WITHOUT a match (left untouched):")
        for nombre, prov in unmatched_prov_senators:
            print(f"  {nombre} ({prov})")
    if roll_only:
        print("\nRoll senators that matched NO province (NOT written):")
        for k in sorted(roll_only):
            print(f"  {k}")


if __name__ == "__main__":
    main()
