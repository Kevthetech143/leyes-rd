#!/usr/bin/env python3
# Lane 1: per-senator attendance for the 2024-2028 legislature.
# Downloads each official attendance PDF (senadord.gob.do), OCRs the scanned
# sheet, reads each senator row's status (PRESENTE / EXCUSA / AUSENTE), and
# tallies present vs total across all sessions. Output: scripts/asistencia_raw.json
import json, os, re, sys, time, urllib.request, unicodedata
import fitz
from rapidocr_onnxruntime import RapidOCR

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(HERE, "asist_current.txt")
OUT = os.path.join(HERE, "asistencia_raw.json")
CACHE = os.path.join(HERE, ".asist_cache")
os.makedirs(CACHE, exist_ok=True)

# Canonical 32 senators from provincias.json (name as we store it).
SENATORS = json.load(open(os.path.join(HERE, "senators_canon.json")))

def norm(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z]", "", s.lower())

# Build a match key per senator from their two most distinctive surname tokens.
# We match an OCR line to a senator if enough of the senator's name tokens
# appear (as substrings) in the normalized OCR text.
def tokens(name):
    skip = {"de", "la", "los", "las", "del", "y", "san"}
    return [norm(w) for w in name.split() if w.lower() not in skip and len(w) > 2]

SEN_TOKENS = {s["nombre"]: tokens(s["nombre"]) for s in SENATORS}

def match_senator(line_norm):
    best, best_score = None, 0
    for name, toks in SEN_TOKENS.items():
        if not toks:
            continue
        hits = sum(1 for t in toks if t in line_norm)
        # require at least 2 token hits (or all tokens if only 2), to avoid
        # false matches on a single common surname.
        need = 2 if len(toks) >= 2 else 1
        if hits >= need and hits > best_score:
            best, best_score = name, hits
    return best

STATUS_WORDS = {
    "PRESENTE": "presente",
    "EXCUSA": "excusado",
    "EXCUSADO": "excusado",
    "AUSENTE": "ausente",
    "LICENCIA": "excusado",
}

def status_of(token):
    t = token.upper().replace(" ", "")
    for k, v in STATUS_WORDS.items():
        if k in t:
            return v
    return None

def download(fid, slug):
    fn = os.path.join(CACHE, f"{fid}.pdf")
    if os.path.exists(fn) and os.path.getsize(fn) > 1000:
        return fn
    url = f"https://www.senadord.gob.do/Descargas/1388/asistencia-a-sesiones/{fid}/{slug}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(req, timeout=60).read()
    open(fn, "wb").write(data)
    return fn

def ocr_lines(pdf_path, ocr):
    d = fitz.open(pdf_path)
    lines = []
    for page in d:
        pix = page.get_pixmap(matrix=fitz.Matrix(2.5, 2.5))
        png = pdf_path + f".{page.number}.png"
        pix.save(png)
        res, _ = ocr(png)
        for box, text, conf in (res or []):
            xs = [p[0] for p in box]
            ys = [p[1] for p in box]
            cx = sum(xs) / len(xs)
            cy = sum(ys) / len(ys)
            lines.append((page.number, cy, cx, text, conf))
        os.remove(png)
    # order top-to-bottom per page
    lines.sort(key=lambda x: (x[0], x[1]))
    return lines

# Single-letter status used in the 2025 "REGISTRO ASISTENCIA 1°/2°" format.
LETTER_STATUS = {"P": "presente", "E": "excusado", "A": "ausente", "L": "excusado"}


def parse_session(lines):
    # Two official layouts exist:
    #  (A) a status WORD (PRESENTE/EXCUSA/AUSENTE) near the senator's name.
    #  (B) single letters P/E/A in a right-hand "REGISTRO ASISTENCIA 1°/2°"
    #      column, aligned to the name's row by vertical position.
    # We try the word form first; if a senator has no word, we read the
    # right-most single-letter token on the same row. When two roll-call
    # columns exist we take the LAST (final) registration.
    result = {}
    # index by page
    by_page = {}
    for (pg, cy, cx, text, conf) in lines:
        by_page.setdefault(pg, []).append((cy, cx, text, conf))
    for pg, toks in by_page.items():
        # max x on this page (to know where the status column sits)
        max_x = max((cx for (_, cx, _, _) in toks), default=0)
        for (cy, cx, text, conf) in toks:
            nl = norm(text)
            if len(nl) < 6:
                continue
            sen = match_senator(nl)
            if not sen or sen in result:
                continue
            # form A: a status word in this token
            st = status_of(text)
            if st:
                result[sen] = st
                continue
            # form A continued: a status word anywhere to the RIGHT on same row
            same_row = [
                (cx2, t2) for (cy2, cx2, t2, _) in toks
                if abs(cy2 - cy) <= 18 and cx2 > cx
            ]
            for cx2, t2 in sorted(same_row):
                w = status_of(t2)
                if w:
                    st = w
                    break
            if st:
                result[sen] = st
                continue
            # form B: single-letter status in the right-hand column.
            # Collect single-letter P/E/A tokens on this row, take the
            # right-most (the final/2nd roll call when two columns exist).
            letters = [
                (cx2, t2.strip().upper())
                for (cy2, cx2, t2, _) in toks
                if abs(cy2 - cy) <= 18 and cx2 > cx
                and t2.strip().upper() in LETTER_STATUS
                and cx2 > max_x * 0.6
            ]
            if letters:
                letters.sort()
                result[sen] = LETTER_STATUS[letters[-1][1]]
    return result

def main():
    rows = [l.strip() for l in open(INDEX) if l.strip()]
    ocr = RapidOCR()
    tally = {s["nombre"]: {"presente": 0, "ausente": 0, "excusado": 0, "sin_dato": 0} for s in SENATORS}
    sessions_done = 0
    per_session = []
    for idx, row in enumerate(rows):
        fid, date, slug = row.split("|", 2)
        try:
            pdf = download(fid, slug)
            lines = ocr_lines(pdf, ocr)
            res = parse_session(lines)
        except Exception as e:
            print(f"ERR session {fid}: {e}", file=sys.stderr)
            continue
        # Only count a session if OCR found a credible quorum of senators (>=20)
        found = len(res)
        if found < 20:
            print(f"skip {fid} ({date}): only {found} senators read", file=sys.stderr)
            per_session.append({"fid": fid, "date": date, "found": found, "counted": False})
            continue
        sessions_done += 1
        for s in SENATORS:
            name = s["nombre"]
            st = res.get(name)
            if st == "presente":
                tally[name]["presente"] += 1
            elif st == "ausente":
                tally[name]["ausente"] += 1
            elif st == "excusado":
                tally[name]["excusado"] += 1
            else:
                tally[name]["sin_dato"] += 1
        per_session.append({"fid": fid, "date": date, "found": found, "counted": True})
        if sessions_done % 5 == 0:
            print(f"{sessions_done} sessions counted ({idx+1}/{len(rows)} processed)", file=sys.stderr)
            json.dump({"sessions_counted": sessions_done, "tally": tally, "per_session": per_session},
                      open(OUT, "w"), ensure_ascii=False, indent=1)
    json.dump({"sessions_counted": sessions_done, "per_session": per_session, "tally": tally},
              open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"DONE: {sessions_done} sessions counted of {len(rows)}", file=sys.stderr)

if __name__ == "__main__":
    main()
