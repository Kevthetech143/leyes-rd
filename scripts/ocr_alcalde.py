#!/usr/bin/env python3
"""Lane C helper: OCR a scanned ayuntamiento nómina PDF and pull the ALCALDE /
ALCALDESA MUNICIPAL row with its salary. Best-effort, primary-source only.

Usage: python3 ocr_alcalde.py <pdf_path> [max_pages]

Prints every OCR line that mentions ALCALDE together with the numbers found on
the same and the next line, so a human can read the gross salary off the
official sheet. We never guess a digit — we surface what the OCR read and the
operator confirms the figure before it goes on the site.
"""
import re
import sys
from pathlib import Path

import fitz
from rapidocr_onnxruntime import RapidOCR


def main() -> None:
    pdf = Path(sys.argv[1])
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    ocr = RapidOCR()
    doc = fitz.open(pdf)
    pages = min(max_pages, doc.page_count)
    print(f"# {pdf.name}: {doc.page_count} pages, OCR first {pages}")
    for pno in range(pages):
        pix = doc[pno].get_pixmap(dpi=220)
        png = f"/tmp/_ocr_p{pno}.png"
        pix.save(png)
        res, _ = ocr(png)
        lines = [t[1] for t in res] if res else []
        for i, ln in enumerate(lines):
            up = ln.upper()
            if "ALCALD" in up:
                window = " || ".join(lines[i : i + 3])
                nums = re.findall(r"[\d][\d,\.]{3,}", window)
                print(f"p{pno} L{i}: {window}")
                if nums:
                    print(f"      NUMS: {nums}")


if __name__ == "__main__":
    main()
