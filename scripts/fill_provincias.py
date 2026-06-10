#!/usr/bin/env python3
"""Write Lane 1 (asistencia) and Lane 3 (iniciativas_propuestas) into
docs/data/provincias.json for each of the 32 senators.

Sources, both actually fetched/parsed by this repo's scrapers — nothing invented:
  - Attendance: scripts/asistencia_raw.json, OCR'd from the Senate's official
    scanned attendance sheets (senadord.gob.do/asistencia-a-sesiones).
  - Initiatives: scripts/iniciativas_count.json, tallied from the SIL Ficha
    "Proponentes" field (senado.gov.do, colección C2024-2028).

A senator's field is written only when the source has a value for them; if the
data is missing the field is left off and the card renders unchanged.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PROV = ROOT / "docs" / "data" / "provincias.json"

ASIST_FUENTE = (
    "hojas oficiales de asistencia del Senado "
    "(senadord.gob.do/asistencia-a-sesiones)"
)
ASIST_PERIODO = "agosto 2024 a mayo 2026"


def main() -> None:
    asist = json.loads((HERE / "asistencia_raw.json").read_text())["tally"]
    inic = json.loads((HERE / "iniciativas_count.json").read_text())["counts"]
    data = json.loads(PROV.read_text())

    n_asist = n_inic = 0
    for prov in data["provincias"]:
        for lider in prov["lideres"]:
            if not lider["cargo"].startswith("Senador"):
                continue
            name = lider["nombre"]

            # Lane 1 — attendance. total = sessions where the senator was
            # accounted for (present + absent + excused); present = present count.
            t = asist.get(name)
            if t:
                total = t["presente"] + t["ausente"] + t["excusado"]
                if total > 0:
                    lider["asistencia"] = {
                        "presentes": t["presente"],
                        "total": total,
                        "periodo": ASIST_PERIODO,
                        "fuente": ASIST_FUENTE,
                    }
                    n_asist += 1

            # Lane 3 — bills proposed or co-proposed this legislature.
            count = inic.get(name)
            if isinstance(count, int) and count > 0:
                lider["iniciativas_propuestas"] = count
                n_inic += 1

    PROV.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"asistencia written for {n_asist}/32 senators")
    print(f"iniciativas_propuestas written for {n_inic}/32 senators")


if __name__ == "__main__":
    main()
