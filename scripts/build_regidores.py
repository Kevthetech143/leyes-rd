#!/usr/bin/env python3
"""
Build regidores data for Politica Sencilla RD from the official JCE elected-candidates Excel.

Source: "RELACION DE CANDIDATOS ELECTOS EN LAS ELECCIONES ORDINARIAS GENERALES
MUNICIPALES DEL 18 DE FEBRERO 2024.xlsx"
Downloaded from https://elecciones2024.jce.gob.do/municipales
("Candidatos Electos... Descargar EXCEL" -> DocumentDownload.ashx documentid=14)

Outputs:
  scripts/jce_regidores_raw.json   -- full parsed regidores, all 158 municipios
  (the merge into docs/data/provincias.json is done by merge_regidores.py)

Rules:
  - REGIDOR cargo only (not SUPLENTE REGIDOR, not VOCAL, not ALCALDE/DIRECTOR).
  - Party = ORGANIZACION POLITICA (col 6, the winning ticket) to match the
    existing city-hall-sourced entries which list the bloc the regidor won on.
  - Dedup on (provincia, municipio, circ, posicion, name).
  - Names title-cased from the all-caps source.
  - Empty/junk rows (no name) dropped.
"""
import json
import sys
import unicodedata

import openpyxl

XLSX = "/Users/admin/jce_electos.xlsx"
RAW_OUT = "/Users/admin/agents/lawyer-bot-brain/dr-laws-site/scripts/jce_regidores_raw.json"

# Official JCE winning-ticket party full name -> short code used on the site.
PARTY_CODE = {
    "PARTIDO REVOLUCIONARIO MODERNO": "PRM",
    "PARTIDO DE LA LIBERACION DOMINICANA": "PLD",
    "PARTIDO FUERZA DEL PUEBLO": "FP",
    "PARTIDO REFORMISTA SOCIAL CRISTIANO": "PRSC",
    "PARTIDO REVOLUCIONARIO DOMINICANO": "PRD",
    "PARTIDO PAIS POSIBLE": "PPP",
    "PARTIDO DOMINICANOS POR EL CAMBIO": "DXC",
    "PARTIDO POPULAR CRISTIANO": "PPC",
    "PARTIDO LIBERAL REFORMISTA": "PLR",
    "PARTIDO PRIMERO LA GENTE": "PPG",
    "BLOQUE INSTITUCIONAL SOCIAL DEMOCRATA": "BIS",
    "PARTIDO ALIANZA PAIS": "ALPAIS",
    "PARTIDO JUSTICIA SOCIAL": "PJS",
    "PARTIDO VERDE DOMINICANO": "PVD",
    "PARTIDO DE UNIDAD NACIONAL": "PUN",
    "PARTIDO QUISQUEYANO DEMOCRATA CRISTIANO": "PQDC",
}

# Lowercase connector words that stay lowercase in title-casing Spanish names.
LOWER = {"de", "del", "la", "las", "los", "y", "e"}


def titlecase_name(raw: str) -> str:
    raw = raw.strip()
    parts = raw.split()
    out = []
    for i, w in enumerate(parts):
        lw = w.lower()
        # keep apostrophe / accent intact; capitalize first letter of each token
        if lw in LOWER and i != 0:
            out.append(lw)
        else:
            # handle D' / O' style and hyphens
            out.append(cap_token(lw))
    return " ".join(out)


def cap_token(tok: str) -> str:
    # Capitalize after apostrophes and hyphens too (D'Aliza, Jean-Carlos)
    res = []
    cap_next = True
    for ch in tok:
        if cap_next and ch.isalpha():
            res.append(ch.upper())
            cap_next = False
        else:
            res.append(ch)
        if ch in ("'", "´", "-"):
            cap_next = True
    return "".join(res)


def muni_title(raw: str) -> str:
    return titlecase_name(raw)


def main():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["Hoja1"]
    rows = list(ws.iter_rows(values_only=True))
    data = rows[4:]  # rows 0-2 titles, row 3 header

    reg_rows = [r for r in data
                if r[4] and str(r[4]).strip().upper() == "REGIDOR"
                and r[7] and str(r[7]).strip()
                and str(r[7]).strip().lower() != "none"]

    seen = set()
    dedup = []
    unmapped = set()
    for r in reg_rows:
        prov = str(r[0]).strip()
        muni = str(r[1]).strip()
        circ = str(r[2]).strip()
        pos = str(r[5]).strip()
        org = str(r[6]).strip() if r[6] else ""
        cand = str(r[10]).strip() if r[10] else ""
        name = str(r[7]).strip()
        key = (prov, muni, circ, pos, name)
        if key in seen:
            continue
        seen.add(key)

        org_use = org if org and org.lower() != "none" else cand
        code = PARTY_CODE.get(org_use.upper())
        if code is None:
            unmapped.add(org_use)
            code = "Otros"
        dedup.append({
            "provincia": prov,
            "municipio": muni,
            "nombre": titlecase_name(name),
            "partido": code,
            "_org": org_use,
        })

    if unmapped:
        print("WARNING unmapped parties:", unmapped, file=sys.stderr)

    # Group province -> municipio -> list
    out = {}
    for d in dedup:
        prov = d["provincia"]
        muni = d["municipio"]
        out.setdefault(prov, {}).setdefault(muni, []).append(
            {"nombre": d["nombre"], "partido": d["partido"]})

    raw = {
        "_fuente": ("Relacion de Candidatos Electos en las Elecciones Ordinarias "
                    "Generales Municipales del 18 de febrero de 2024, Junta Central "
                    "Electoral (JCE), descargada de "
                    "https://elecciones2024.jce.gob.do/municipales"),
        "_cargo": "REGIDOR (electos), suplentes excluidos",
        "_partido_columna": "ORGANIZACION POLITICA (partido/alianza ganadora)",
        "_total_regidores": len(dedup),
        "_provincias": len(out),
        "provincias": out,
    }
    with open(RAW_OUT, "w", encoding="utf-8") as f:
        json.dump(raw, f, ensure_ascii=False, indent=1)

    print("total regidores:", len(dedup))
    print("provincias:", len(out))
    print("municipios:", sum(len(m) for m in out.values()))
    print("wrote", RAW_OUT)


if __name__ == "__main__":
    main()
