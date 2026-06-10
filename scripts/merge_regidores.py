#!/usr/bin/env python3
"""
Merge JCE-sourced regidores (scripts/jce_regidores_raw.json) into the site data
(docs/data/provincias.json).

For every province:
  - regidores.municipios = [{municipio, lista:[{nombre,partido}], fuente_lista}]
  - regidores.total = number of named regidores in that province
  - regidores.fuente_total = the JCE source string

Replaces the 4 pre-existing city-hall municipios (DN, SDE, SDN, SDO) with the JCE
full-legal-name versions: one official source for the whole country.
"""
import json
import unicodedata

RAW = "/Users/admin/agents/lawyer-bot-brain/dr-laws-site/scripts/jce_regidores_raw.json"
SITE = "/Users/admin/agents/lawyer-bot-brain/dr-laws-site/docs/data/provincias.json"

FUENTE = ("relacion oficial de candidatos electos de la Junta Central Electoral (JCE), "
          "elecciones municipales del 18 de febrero de 2024 "
          "(https://elecciones2024.jce.gob.do/municipales)")


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.upper().strip())
                   if unicodedata.category(c) != "Mn")


# JCE municipio display name (exact UPPER, accents stripped in source) -> correct
# site display. Title-casing handles the rest. Display only — regidor NAMES are
# never altered, only the municipality label. Keys must match the source string.
ACCENT_FIX = {
    "BANI": "Baní",
    "BANICA": "Bánica",
    "BOHECHIO": "Bohechío",
    "COTUI": "Cotuí",
    "DAJABON": "Dajabón",
    "DUVERGE": "Duvergé",
    "EL PEÑON": "El Peñón",
    "ESTEBANIA": "Estebanía",
    "EUGENIO MARIA DE HOSTOS": "Eugenio María de Hostos",
    "FUNDACION": "Fundación",
    "GASPAR HERNANDEZ": "Gaspar Hernández",
    "GALVAN": "Galván",
    "GUAYUBIN": "Guayubín",
    "HIGUEY": "Higüey",
    "JAMAO AL NORTE": "Jamao al Norte",
    "JIMANI": "Jimaní",
    "LA CIENAGA": "La Ciénaga",
    "LAS MATAS DE FARFAN": "Las Matas de Farfán",
    "LICEY AL MEDIO": "Licey al Medio",
    "LOS RIOS": "Los Ríos",
    "LUPERON": "Luperón",
    "MAIMON": "Maimón",
    "MONCION": "Monción",
    "MONTECRISTI": "Montecristi",
    "NEYBA": "Neyba",
    "PARAISO": "Paraíso",
    "POSTRER RIO": "Postrer Río",
    "PUÑAL": "Puñal",
    "RESTAURACION": "Restauración",
    "RIO SAN JUAN": "Río San Juan",
    "SAMANA": "Samaná",
    "SAN CRISTOBAL": "San Cristóbal",
    "SAN FRANCISCO DE MACORIS": "San Francisco de Macorís",
    "SAN JOSE DE LAS MATAS": "San José de las Matas",
    "SAN JOSE DE OCOA": "San José de Ocoa",
    "SAN PEDRO DE MACORIS": "San Pedro de Macorís",
    "SAN VICTOR": "San Víctor",
    "SOSUA": "Sosúa",
    "TABARA ARRIBA": "Tábara Arriba",
    "VILLA BISONO -NAVARRETE-": "Villa Bisonó (Navarrete)",
    "VILLA GONZALEZ": "Villa González",
    "VILLA LOS ALMACIGOS": "Villa Los Almácigos",
    "VILLA VASQUEZ": "Villa Vásquez",
    "YAMASA": "Yamasá",
}

LOWER = {"de", "del", "la", "las", "los", "y", "e"}


def titlecase(raw):
    parts = raw.split()
    out = []
    for i, w in enumerate(parts):
        lw = w.lower()
        out.append(lw if (lw in LOWER and i != 0) else lw.capitalize())
    return " ".join(out)


def muni_display(jce_name):
    return ACCENT_FIX.get(jce_name.upper(), titlecase(jce_name))


def main():
    raw = json.load(open(RAW, encoding="utf-8"))
    site = json.load(open(SITE, encoding="utf-8"))

    # Index JCE by normalized province name
    jce_by_prov = {norm(p): (p, munis) for p, munis in raw["provincias"].items()}

    site_prov_norm = {norm(p["nombre"]): p for p in site["provincias"]}

    matched = 0
    grand_total = 0
    report = []
    for pnorm, (jce_pname, munis) in jce_by_prov.items():
        sp = site_prov_norm.get(pnorm)
        if sp is None:
            report.append(f"NO SITE MATCH for JCE province {jce_pname}")
            continue
        matched += 1
        muni_list = []
        ptotal = 0
        for muni_name, lst in sorted(munis.items()):
            muni_list.append({
                "municipio": muni_display(muni_name),
                "lista": lst,
                "fuente_lista": FUENTE,
            })
            ptotal += len(lst)
        grand_total += ptotal
        sp["regidores"] = {
            "total": ptotal,
            "fuente_total": FUENTE,
            "municipios": muni_list,
        }
        report.append(f"{sp['nombre']:24} munis={len(muni_list):2} total={ptotal}")

    # Update top-level note
    site["_nota"] = site.get("_nota", "")
    nota_add = (" Regidores/as electos/as 2024-2028 segun la relacion oficial de "
                "candidatos electos de la JCE (elecciones municipales del 18 de "
                "febrero de 2024): 1,161 regidores con nombre en 158 municipios. "
                "Tres escanos aparecen sin nombre en el documento oficial (La Vega, "
                "Monte Plata y Luperon) y por eso no se listan.")
    if "Regidores/as electos" not in site["_nota"]:
        site["_nota"] = site["_nota"].rstrip() + nota_add

    with open(SITE, "w", encoding="utf-8") as f:
        json.dump(site, f, ensure_ascii=False, indent=2)

    print("\n".join(report))
    print(f"\nprovinces matched: {matched}/32")
    print(f"grand total regidores shipped: {grand_total}")


if __name__ == "__main__":
    main()
