#!/usr/bin/env python3
"""Lane C: write each mayor's monthly salary into docs/data/provincias.json,
read directly from that municipality's own official nómina (Ley 200-04).

Best-effort: only municipalities whose official nómina was fetched AND machine-
readable (text layer, so no digit is guessed) are filled. Each figure is the
gross base salary (Total Bruto / Sueldo column) on the sheet, verified row by
row against the ALCALDE/ALCALDESA cargo. Mayors whose nómina is a scanned image
or whose portal blocks access are left with the honest note on their card.

Sources (all fetched and parsed 2026-06-10):
  - Distrito Nacional (Carolina Mejía = MEJIA GOMEZ, ROSA CAROLINA, cargo
    Alcalde(sa)): RD$265,000, "Nómina de Empleados Fijos Enero 2026" del ADN,
    publicada en SISMAP Municipal (sismap.gob.do).
  - Santiago (Ulises Rodríguez = JOSE ULISES RODRIGUEZ GUZMAN, ALCALDE
    MUNICIPAL): sueldo base RD$265,000 (más incentivos no incluidos),
    "Nómina Administrativa Enero 2026" del Ayuntamiento de Santiago, en SISMAP.
  - Santo Domingo Oeste (Francisco Peña = FRANCISCO ANTONIO PEÑA TAVAREZ,
    ALCALDE): RD$340,000, "Nómina Personal Fijo Mayo 2026"
    (ayuntamientosdo.gob.do).
  - San Francisco de Macorís (Alexis "Alex" Díaz = ANTONIO DIAZ PAULINO,
    ALCALDE MUNICIPAL): RD$165,459, "Nómina Junio 2025" del ayuntamiento, en
    SISMAP. (Antonio Díaz Paulino "Alex" es el alcalde 2024-2028, verificado.)
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROV = HERE.parent / "docs" / "data" / "provincias.json"

# Keyed by the exact "cargo" string in provincias.json.
SUELDOS: dict[str, dict[str, str]] = {
    "Alcalde/sa de Distrito Nacional": {
        "monto": "RD$265,000",
        "mes": "enero 2026",
        "fuente": "nómina de empleados fijos del Ayuntamiento del Distrito Nacional (SISMAP)",
    },
    "Alcalde/sa de Santiago de los Caballeros": {
        "monto": "RD$265,000",
        "mes": "enero 2026",
        "fuente": "nómina administrativa del Ayuntamiento de Santiago (SISMAP)",
    },
    "Alcalde/sa de Santo Domingo Oeste": {
        "monto": "RD$340,000",
        "mes": "mayo 2026",
        "fuente": "nómina de personal fijo del Ayuntamiento de Santo Domingo Oeste",
    },
    "Alcalde/sa de San Francisco de Macorís": {
        "monto": "RD$165,459",
        "mes": "junio 2025",
        "fuente": "nómina del Ayuntamiento de San Francisco de Macorís (SISMAP)",
    },
}


def main() -> None:
    data = json.loads(PROV.read_text())
    written = 0
    for prov in data["provincias"]:
        for lider in prov["lideres"]:
            sueldo = SUELDOS.get(lider["cargo"])
            if sueldo is not None:
                lider["sueldo"] = sueldo
                written += 1
    PROV.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    total_alcaldes = sum(
        1
        for prov in data["provincias"]
        for lider in prov["lideres"]
        if lider["cargo"].startswith("Alcalde")
    )
    print(f"sueldo written for {written}/{total_alcaldes} alcaldes")


if __name__ == "__main__":
    main()
