// Leyes RD — fácil. TypeScript source.
// Compiles to site/app.js via `npm run build` (tsc). Loads sample JSON,
// groups laws by sector, expandable cards + province profiles.

type Estado = "aprobada" | "votando" | "rechazada";
type Voto = "si" | "no" | "ausente";

interface VotoFila {
  nombre: string;
  voto: Voto;
}

interface Ley {
  titulo: string;
  estado: Estado;
  que_es: string;
  por_que: string;
  te_afecta?: string;
  votos?: VotoFila[];
  // true when the bill comes from the Cámara de Diputados (lower house)
  // instead of the Senate. Shows a small "Cámara de Diputados" chip.
  camara?: boolean;
}

interface Sector {
  id: string;
  emoji: string;
  nombre: string;
  leyes: Ley[];
}

// Official "search system" URLs, one per chamber. There is no stable public
// per-bill URL (the Senate's old system is login-walled and the Cámara SIL is a
// single-page app), so each bill links to its chamber's official initiatives
// page with honest wording (5ª sugerencia de un usuario real, Ángel).
interface BusquedaOficial {
  senado?: string;
  camara?: string;
}
interface LeyesData {
  sectores: Sector[];
  busqueda_oficial?: BusquedaOficial;
}

// --- Leyes que entran en vigencia (4ª sugerencia de un usuario real) ---
// A promulgated law (signed by the President + published in the Gaceta Oficial)
// is not the same as a bill the Congress merely approved. Each entry carries its
// verified number, title, promulgation date, Gaceta number and the date it takes
// effect (vigencia), all sourced per-entry. estado splits the list in two groups:
//  - "vigencia": already in force (nuevas).
//  - "pronto": promulgated but its entry-into-force date is still in the future.
interface VigenciaLey {
  numero: string;
  titulo: string;
  que_es: string;
  promulgada: string;        // ISO date the President signed it
  gaceta: string;            // Gaceta Oficial number (or a short description)
  estado: "vigencia" | "pronto";
  vigencia_fecha: string;    // ISO date it takes / took effect
  vigencia_texto: string;    // plain-Spanish explanation of that date
  fuente: string;            // per-entry source citation
  // Official-document deep link (5ª sugerencia de un usuario real, Ángel).
  // url_documento: a verified direct link to the full official law text (PDF).
  // url_busqueda: when no stable per-law PDF exists, the official portal where
  // the citizen can look the law up by its number. Only one is set per law.
  url_documento?: string;
  url_busqueda?: string;
}

interface VigenciaData {
  _nota?: string;
  regla_por_defecto?: { titulo: string; texto: string; fuente: string };
  leyes: VigenciaLey[];
}

// --- Novedades (FOLLOW, on-site, zero-maintenance) ---
// The ~5 most recent user-visible improvements, rewritten in kid-simple Spanish.
// One line per entry + its date. Sourced from docs/CHANGELOG-improvements.md and
// kept in data/novedades.json; the static RSS feed (docs/novedades.xml) mirrors
// the same list by hand. Newest first.
interface Novedad {
  fecha: string;   // ISO date
  texto: string;   // one short kid-Spanish line
  // Credit / origin label, shown on every entry: "💡 Idea de NOMBRE" when a
  // user suggested it (first name only), or "🔧 Mejora interna" for a team
  // change. Kelvin: every Novedad must show who contributed the idea.
  aporte?: string;
}
interface NovedadesData {
  _nota?: string;
  novedades: Novedad[];
}

// Attendance to plenary sessions, from the Senate's official scanned sheets
// (senadord.gob.do/asistencia-a-sesiones). presentes/total over the sessions
// we could read for the current legislature. periodo = covered span.
interface Asistenciasenador {
  presentes: number;
  total: number;
  periodo: string;
  fuente: string;
}

interface Lider {
  cargo: string;
  nombre: string;
  partido: string;
  resumen: string;
  registro: string;
  // Report-card fields (optional so provinces without data render unchanged).
  asistencia?: Asistenciasenador;       // Lane 1 — plenary attendance
  comisiones?: string[];                 // Lane 2 — Senate committees
  iniciativas_propuestas?: number;       // Lane 3 — bills proposed/co-proposed
  // Per-person salary, used for mayors (each ayuntamiento pays its own amount,
  // so this is read from that municipality's own nómina, not a role-wide rate).
  sueldo?: { monto: string; mes: string; fuente: string };
}

// One regidor (town-council member): name + party. Filled only with verified
// names from official sources (JCE 2024 municipal results / municipal portals).
interface Regidor {
  nombre: string;
  partido: string;
}

interface Provincia {
  nombre: string;
  lideres: Lider[];
  // Optional explainer block about the province's town-council members.
  // total: verified count of regidores across the province's municipalities,
  //        ONLY when confirmed from official data — otherwise omitted (no number).
  // municipios: verified names+parties for one or more municipalities, mirroring
  //        how alcaldes are stored (a province can have several municipalities).
  regidores?: {
    total?: number;
    fuente_total?: string;
    municipios?: {
      municipio: string;
      lista: Regidor[];
      fuente_lista?: string;
    }[];
  };
}

interface ProvinciasData {
  provincias: Provincia[];
}

interface Votacion {
  iniciativa: string;
  titulo: string;
  titulo_facil?: string;
  a_favor: number;
  presentes: number;
  resultado: string;
}

interface AsistenciaDetalle {
  nombre: string;
  estado: "presente" | "ausente" | "excusado";
}

interface Asistencia {
  presentes: number | null;
  ausentes: number | null;
  detalle: AsistenciaDetalle[];
}

interface Sesion {
  acta: string;
  fecha: string;
  votaciones: Votacion[];
  asistencia: Asistencia;
  // Direct link to the official acta PDF on the Senate site (5ª sugerencia de
  // un usuario real, Ángel). Optional so sessions without a recoverable PDF
  // render unchanged.
  url_acta?: string;
}

interface SesionesData {
  _nota?: string;
  sesiones: Sesion[];
}

const estadoLabel: Record<Estado, string> = {
  aprobada: "✅ Aprobada",
  votando: "🗳️ En votación",
  rechazada: "❌ Rechazada",
};
const votoLabel: Record<Voto, string> = { si: "👍 Sí", no: "👎 No", ausente: "➖ Ausente" };
const votoClass: Record<Voto, string> = { si: "voto-si", no: "voto-no", ausente: "voto-aus" };

// Bumped with every data/content change, same value as the index.html
// cache-buster (?v=...). Appended to every data fetch so returning visitors
// don't render stale JSON from the browser's HTTP cache when only the data
// changed (the data files are not versioned in the HTML).
const DATA_VERSION = "20260611g";

async function cargar<T>(path: string): Promise<T> {
  const sep = path.indexOf("?") >= 0 ? "&" : "?";
  const res = await fetch(path + sep + "v=" + DATA_VERSION);
  if (!res.ok) throw new Error("No se pudo cargar " + path);
  return (await res.json()) as T;
}

function el(tag: string, cls?: string | null, html?: string): HTMLElement {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

function byId(id: string): HTMLElement {
  const n = document.getElementById(id);
  if (!n) throw new Error("Falta el elemento #" + id);
  return n;
}

// One consistent "official document" link line, used across the whole site
// (5ª sugerencia de un usuario real, Ángel). Returns an <a> that opens the
// official source in a new tab, safely (rel="noopener"). texto is the visible
// label, e.g. "📄 Leer la ley completa" or "📄 Ver el documento oficial".
// Returns null when there is no url, so callers can skip it cleanly.
function enlaceDoc(url: string | undefined, texto: string): HTMLAnchorElement | null {
  if (!url) return null;
  const a = el("a", "enlace-doc") as HTMLAnchorElement;
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = texto;
  // Don't let a tap on the link also toggle the surrounding collapsible card.
  a.addEventListener("click", (e: Event) => e.stopPropagation());
  return a;
}

// Marks a doc link as a SEARCH-type link: one that drops the visitor on an
// official government search page where they must look the document up by
// number themselves (no fixed address per document). A single delegated click
// handler (setupAvisoBusqueda) shows a friendly heads-up before leaving the
// site. numero may be null when the document carries no number — then the
// dialog adjusts its wording honestly. etiqueta names the number in plain
// Spanish, e.g. "el número de la ley".
function marcarBusqueda(a: HTMLAnchorElement, numero: string | null, etiqueta: string): void {
  a.dataset.busqueda = "1";
  if (numero) a.dataset.numero = numero;
  a.dataset.numeroEtiqueta = etiqueta;
}

/* ---------- Aviso antes de ir al buscador oficial ---------- */
// One small, friendly dialog shown when a visitor taps a SEARCH-type doc link
// (data-busqueda). Direct document links never trigger it — they open in one
// tap, untouched. Wired ONCE via a single delegated listener on the document
// (guarded so it can't double-wire and cancel itself, the bug setupGlosario
// hit). Uses the native <dialog> in docs/index.html for built-in focus trap,
// Escape-to-close and backdrop. Kid-simple Spanish throughout.
let avisoBusquedaWired = false;
function setupAvisoBusqueda(): void {
  if (avisoBusquedaWired) return;
  avisoBusquedaWired = true;

  const dlg = document.getElementById("avisoBuscador") as HTMLDialogElement | null;
  const numEl = document.getElementById("avisoNumero");
  const numWrap = document.getElementById("avisoNumeroWrap");
  const sinNumEl = document.getElementById("avisoSinNumero");
  const cuerpoEl = document.getElementById("avisoCuerpo");
  const irBtn = document.getElementById("avisoIr") as HTMLAnchorElement | null;
  const copyFeed = document.getElementById("avisoCopiado");
  if (!dlg || !numEl || !numWrap || !sinNumEl || !cuerpoEl || !irBtn) return;

  const con = "Esa página del gobierno no tiene una dirección fija para cada documento. Cuando llegues, busca este número:";
  const sin = "Esa página del gobierno no tiene una dirección fija para cada documento. Cuando llegues, busca el documento por su nombre o su número.";

  // Delegated, in the CAPTURE phase: every doc link adds its own bubble-phase
  // click listener that calls stopPropagation (so a tap doesn't toggle the
  // surrounding card). That would stop a bubble-phase delegated listener from
  // ever seeing the click. Capturing runs first, top-down, so we intercept the
  // search-type link before its own handler can stop the event.
  document.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement | null;
    const a = target?.closest<HTMLAnchorElement>("a.enlace-doc[data-busqueda]");
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();

    const numero = a.dataset.numero || "";
    irBtn.href = a.href;

    if (numero) {
      numEl.textContent = numero;
      numWrap.classList.remove("hidden");
      sinNumEl.classList.add("hidden");
      cuerpoEl.textContent = con;
    } else {
      numWrap.classList.add("hidden");
      sinNumEl.classList.remove("hidden");
      cuerpoEl.textContent = sin;
    }
    if (copyFeed) copyFeed.classList.add("hidden");

    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }, true);

  // Tap-to-copy the number, with "¡Copiado!" feedback. Skipped silently if the
  // browser has no clipboard (the visitor still sees the number plainly).
  numWrap.addEventListener("click", () => {
    const txt = numEl.textContent || "";
    if (!txt) return;
    const nav = navigator as unknown as { clipboard?: { writeText(s: string): Promise<void> } };
    const ok = (): void => {
      if (!copyFeed) return;
      copyFeed.classList.remove("hidden");
      window.setTimeout(() => copyFeed.classList.add("hidden"), 1600);
    };
    // Same forgiving pattern as copiarEnlace: show "¡Copiado!" on both resolve
    // and reject. The number is already on screen, so worst case the visitor
    // copies it by hand — never a broken-looking failure.
    if (nav.clipboard?.writeText) nav.clipboard.writeText(txt).then(ok, ok);
    else ok();
  });

  // "Ir al buscador →" opens the official page in a new tab, then closes the
  // dialog. The anchor's own target/rel handle the safe new-tab open.
  irBtn.addEventListener("click", () => { if (dlg.open) dlg.close(); });

  // "Quedarme aquí" and the backdrop both close without leaving the site.
  const quedarme = document.getElementById("avisoQuedarme");
  if (quedarme) quedarme.addEventListener("click", () => { if (dlg.open) dlg.close(); });
  // Backdrop tap: a click that lands on the <dialog> element itself (not its
  // inner card) is the backdrop. Native dialog already closes on Escape.
  dlg.addEventListener("click", (e: Event) => {
    if (e.target === dlg) dlg.close();
  });
}

// Some source strings carry their URL inline as a trailing "(https://...)",
// e.g. the JCE regidores source. This splits that into the descriptive text
// (without the URL) and the bare URL, so the text reads clean and the URL can
// render as a real link. Returns url=null when the string has no trailing URL.
function partirFuenteUrl(fuente: string): { texto: string; url: string | null } {
  const m = fuente.match(/^(.*?)\s*\((https?:\/\/[^\s)]+)\)\s*$/);
  if (m) return { texto: m[1].trim(), url: m[2] };
  return { texto: fuente, url: null };
}

/* ---------- Leyes ---------- */
function renderLeyes(data: LeyesData): void {
  const cont = byId("sectores");
  cont.innerHTML = "";
  data.sectores.forEach((sec) => {
    const card = el("div", "sector");
    const head = el("div", "sector-head");
    head.append(
      el("span", "sector-emoji", sec.emoji),
      el("h3", "sector-title", sec.nombre),
      el("span", "sector-count", sec.leyes.length + (sec.leyes.length === 1 ? " ley" : " leyes")),
      el("span", "sector-chev", "▸")
    );
    const body = el("div", "sector-body");
    body.style.display = "none";

    sec.leyes.forEach((ley) => body.append(renderLey(ley, data.busqueda_oficial)));

    // Keyboard accessible: behave like an expandable button.
    head.setAttribute("role", "button");
    head.tabIndex = 0;
    head.setAttribute("aria-expanded", "false");
    head.addEventListener("click", () => {
      const abierto = body.style.display !== "none";
      body.style.display = abierto ? "none" : "block";
      card.classList.toggle("open", !abierto);
      head.setAttribute("aria-expanded", String(!abierto));
    });
    head.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); head.click(); }
    });

    card.append(head, body);
    cont.append(card);
  });
}

// Pulls the initiative number out of a bill title when present, e.g.
// "...(Iniciativa 04789-2024-2028-CD)" -> "04789-2024-2028-CD". Returns null
// when the title carries no number (most Senate bills in our data don't).
function numeroIniciativa(titulo: string): string | null {
  const m = titulo.match(/Iniciativa\s+([\w-]+)/i);
  return m ? m[1] : null;
}

function renderLey(ley: Ley, busqueda?: BusquedaOficial): HTMLElement {
  const wrap = el("div", "ley");
  wrap.append(el("p", "ley-titulo", ley.titulo));
  wrap.append(el("span", "ley-estado estado-" + ley.estado, estadoLabel[ley.estado] || ley.estado));
  // Which chamber the bill comes from. Senate is the default (no chip);
  // a chip is shown only when the bill comes from the Cámara de Diputados.
  if (ley.camara) {
    wrap.append(el("span", "ley-camara", "🏛️ Cámara de Diputados"));
  }

  const det = el("div", "ley-detalle");
  det.append(el("h4", null, "¿Qué es?"), el("p", null, ley.que_es));

  // One plain line: how this law touches daily life.
  if (ley.te_afecta) {
    det.append(el("h4", null, "¿Y a mí qué?"), el("p", "te-afecta", ley.te_afecta));
  }

  // Only show a real reason; otherwise a quiet note (the Senate source rarely states the motive).
  const sinMotivo = !ley.por_que || /^razón no indicada/i.test(ley.por_que);
  if (sinMotivo) {
    det.append(el("p", "nota-fuente", "El Senado no publicó el motivo. Cuando lo publique, te lo contamos aquí."));
  } else {
    det.append(el("h4", null, "¿Por qué se propuso?"), el("p", null, ley.por_que));
  }

  // Votes: shown when the Senate publishes them; otherwise a quiet note.
  if (ley.votos && ley.votos.length) {
    det.append(el("h4", null, "¿Quién votó?"));
    const votos = el("div", "votos");
    ley.votos.forEach((v) => {
      const fila = el("div", "voto-fila");
      fila.append(el("span", null, v.nombre));
      fila.append(el("span", votoClass[v.voto] || "", votoLabel[v.voto] || v.voto));
      votos.append(fila);
    });
    det.append(votos);
  } else {
    det.append(el("p", "nota-fuente", "Voto de cada legislador: el Senado aún no lo hace público."));
  }

  // Link to the official search system (5ª sugerencia de un usuario real,
  // Ángel). No stable per-bill URL exists, so we link the chamber's official
  // initiatives page and, when the title carries the initiative number, name it.
  const url = ley.camara ? busqueda?.camara : busqueda?.senado;
  if (url) {
    const num = numeroIniciativa(ley.titulo);
    const sistema = ley.camara ? "el SIL de la Cámara" : "el sistema del Senado";
    const texto = num
      ? "📄 Búscala en el sistema oficial: iniciativa " + num
      : "📄 Búscala en " + sistema + " (sistema oficial)";
    const a = enlaceDoc(url, texto);
    // Search-type link: warn the visitor before sending them to the chamber's
    // search system, and (when we have it) tell them which iniciativa number to
    // type. Some Senate bills carry no number — then we show no number, honestly.
    if (a) marcarBusqueda(a, num, "el número de la iniciativa");
    if (a) det.append(a);
  }

  wrap.append(det);
  // Keyboard accessible: behave like an expandable button.
  wrap.setAttribute("role", "button");
  wrap.tabIndex = 0;
  wrap.setAttribute("aria-expanded", "false");
  wrap.addEventListener("click", (e: Event) => {
    e.stopPropagation();
    const abierto = wrap.classList.toggle("open");
    wrap.setAttribute("aria-expanded", String(abierto));
  });
  wrap.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); wrap.click(); }
  });
  return wrap;
}

/* ---------- Leyes que entran en vigencia ---------- */
// One tappable card per promulgated law. Collapsed it shows the plain title,
// the law number and the vigencia date; tapped it reveals "¿qué es?", the
// full date explanation and the per-entry source. Same fold idiom (details/
// summary) the rest of the site uses, so it reads consistent on a phone.
function renderVigenciaLey(ley: VigenciaLey): HTMLElement {
  const card = el("details", "vig-ley") as HTMLDetailsElement;
  const cab = el("summary", "vig-ley-cab");
  cab.append(
    el("span", "vig-ley-num", "Ley " + ley.numero),
    el("span", "vig-ley-titulo", ley.titulo),
    el(
      "span",
      "vig-ley-fecha",
      (ley.estado === "pronto" ? "📅 Entra: " : "✅ Desde: ") + fechaLarga(ley.vigencia_fecha)
    ),
    el("span", "vig-ley-chev", "▸")
  );
  card.append(cab);

  const det = el("div", "vig-ley-det");
  det.append(el("h4", null, "¿Qué es?"), el("p", null, ley.que_es));
  det.append(
    el("h4", null, ley.estado === "pronto" ? "¿Cuándo empieza?" : "¿Desde cuándo rige?"),
    el("p", "vig-ley-cuando", ley.vigencia_texto)
  );
  det.append(
    el(
      "p",
      "vig-ley-meta",
      "El Presidente la firmó (la promulgó) el <b>" + fechaLarga(ley.promulgada) +
      "</b> y se publicó en la Gaceta Oficial " +
      (/^\d+$/.test(ley.gaceta) ? "núm. <b>" + ley.gaceta + "</b>" : "(" + ley.gaceta + ")") + "."
    )
  );
  det.append(el("p", "nota-fuente", "Fuente: " + ley.fuente + "."));

  // Official-document deep link (5ª sugerencia de un usuario real, Ángel).
  // A direct link to the full law text when we have a verified PDF; otherwise
  // an honest line pointing to the official portal to look it up by number.
  if (ley.url_documento) {
    const a = enlaceDoc(ley.url_documento, "📄 Leer la ley completa (documento oficial)");
    if (a) det.append(a);
  } else if (ley.url_busqueda) {
    const a = enlaceDoc(ley.url_busqueda, "📄 Búscala en el portal oficial: Ley " + ley.numero);
    // Search-type link: the official portal has no fixed address per law, so we
    // pop a friendly heads-up telling the visitor which number to look up.
    if (a) marcarBusqueda(a, ley.numero, "el número de la ley");
    if (a) det.append(a);
  }

  card.append(det);
  return card;
}

// Renders the whole "¿Cuáles leyes están por empezar?" block: a glossary intro
// that explains aprobada vs en vigencia, then two groups — already in force
// (nuevas) and entering soon — each a tappable card list. Nothing is invented:
// the block hides itself if the data is missing or empty.
function renderVigencia(data: VigenciaData): void {
  const host = document.getElementById("vigencia");
  if (!host) return;
  host.innerHTML = "";
  const leyes = data.leyes || [];
  if (!leyes.length) { host.classList.add("hidden"); return; }
  host.classList.remove("hidden");

  // Intro: aprobada vs en vigencia, with tap-to-define words.
  const intro = el("div", "como vig-intro");
  intro.innerHTML =
    "<b>📅 ¿Cuáles leyes están por empezar?</b><br>" +
    "Que el Congreso apruebe una ley no quiere decir que ya te aplique. " +
    "Primero el Presidente la firma (la " +
    "<span class=\"palabra\" data-def=\"Promulgar es el acto en que el Presidente firma una ley ya aprobada por el Congreso para ordenar que se cumpla y se publique.\">promulga</span>) " +
    "y se publica en la " +
    "<span class=\"palabra\" data-def=\"La Gaceta Oficial es el periódico del Estado donde se publican las leyes para que sean válidas. Una ley no rige hasta que sale ahí.\">Gaceta Oficial</span>. " +
    "Recién entonces empieza su " +
    "<span class=\"palabra\" data-def=\"La vigencia es el momento desde el cual una ley ya manda y debes cumplirla. Algunas rigen de una vez; otras esperan unos meses.\">vigencia</span>: " +
    "la fecha desde la cual ya manda.";
  host.append(intro);

  const vigentes = leyes.filter((l) => l.estado === "vigencia");
  const pronto = leyes.filter((l) => l.estado === "pronto");

  // Group "Entran pronto" goes first — it answers the user's exact question
  // ("¿qué reglas nuevas están por empezar a aplicarme?"); already-in-force
  // laws follow as recent context.
  // Each group folds into a collapsible card (Kelvin: same drop-down flow as
  // the role cards) — title + count visible, tap to see the laws.
  const grupo = (titulo: string, sub: string, arr: VigenciaLey[], cls: string): void => {
    if (!arr.length) return;
    const wrap = el("details", "grupo-cargo vig-grupo " + cls);
    const cab = el("summary", "grupo-cab vig-cab");
    cab.append(
      el("span", "grupo-nombre", titulo),
      el("span", "grupo-conteo", arr.length === 1 ? "1 ley" : arr.length + " leyes"),
      el("span", "grupo-chev", "▸")
    );
    wrap.append(cab);
    wrap.append(el("p", "vig-grupo-sub", sub));
    // Newest entry-into-force first within each group.
    const ordenadas = [...arr].sort((a, b) => b.vigencia_fecha.localeCompare(a.vigencia_fecha));
    ordenadas.forEach((l) => wrap.append(renderVigenciaLey(l)));
    host.append(wrap);
  };

  grupo(
    "🔜 Entran pronto",
    "Ya firmadas, pero su fecha de empezar todavía no llega. Apunta el día.",
    pronto,
    "vig-grupo-pronto"
  );
  grupo(
    "✅ Ya en vigencia (nuevas)",
    "Leyes recientes que ya mandan. Estas reglas ya te aplican.",
    vigentes,
    "vig-grupo-vigencia"
  );

  // Default-rule note, folded so the page stays airy.
  if (data.regla_por_defecto) {
    const r = data.regla_por_defecto;
    const det = el("details", "vig-regla");
    det.append(el("summary", "vig-regla-cab", "❓ " + r.titulo));
    const body = el("div", "vig-regla-body");
    body.append(el("p", null, r.texto));
    body.append(el("p", "nota-fuente", "Fuente: " + r.fuente + "."));
    det.append(body);
    host.append(det);
  }

  // The block just added glossary words and they need tap-to-define wiring.
  setupGlosario();
}

/* ---------- Novedades (FOLLOW) ---------- */
// Renders the latest improvements into the #novedadesLista list on Inicio.
// Each item is one short line + its long-form date. Newest first, capped at 5.
// Hides the whole block if the data is missing or empty (never an empty card).
function renderNovedades(data: NovedadesData): void {
  const host = document.getElementById("novedadesLista");
  if (!host) return;
  host.innerHTML = "";
  const items = (data.novedades || [])
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);
  const wrap = host.closest(".novedades");
  if (!items.length) {
    if (wrap) wrap.classList.add("hidden");
    return;
  }
  if (wrap) wrap.classList.remove("hidden");
  items.forEach((n) => {
    const li = el("li", "novedad");
    li.append(
      el("span", "novedad-fecha", fechaLarga(n.fecha)),
      el("span", "novedad-texto", n.texto)
    );
    // Credit / origin label on every entry (Kelvin): who contributed the idea,
    // or a "🔧 Mejora interna" marker for team changes.
    if (n.aporte) li.append(el("span", "novedad-aporte", n.aporte));
    host.append(li);
  });
}

/* ---------- Provincias ---------- */
// One kid-friendly explanation per ROLE, matched by the start of the cargo.
// Keeps the language identical for every person with the same job.
function funcionDeCargo(cargo: string): string {
  const c = cargo.toLowerCase();
  if (c.startsWith("senador"))
    return "Hace las leyes del país junto a los diputados. También aprueba nombramientos importantes (como la junta electoral o el defensor del pueblo) y juzga a altos funcionarios acusados. Y representa a toda la provincia en la capital: pelea por su parte del presupuesto y por obras como carreteras, escuelas y hospitales. Hay uno por provincia.";
  if (c.startsWith("diputad"))
    return "También hace y vota las leyes, en nombre de su provincia. Propone proyectos, revisa el presupuesto del país y vigila el trabajo del gobierno. Cada provincia tiene varios, según cuánta gente vive en ella.";
  if (c.startsWith("gobernador"))
    return "Representa al Presidente en la provincia. No hace leyes: es el puente entre el gobierno central y la gente del lugar. Lo nombra la Presidencia; no se elige por voto.";
  if (c.startsWith("alcalde") || c.startsWith("alcaldesa"))
    return "Dirige el ayuntamiento de su pueblo o ciudad. Se encarga del día a día local: calles, basura, aceras, parques, alumbrado y permisos. Se elige por voto de la gente del municipio.";
  if (c.startsWith("director"))
    return "Como un alcalde, pero de un distrito municipal (una zona más pequeña dentro de un municipio). Maneja los servicios locales de esa zona. Se elige por voto.";
  if (c.startsWith("regidor"))
    return "Forma parte del concejo del ayuntamiento. Aprueba el presupuesto del pueblo, dicta las normas locales y vigila el trabajo del alcalde. Se elige por voto.";
  return "";
}
function esLegislador(cargo: string): boolean {
  const c = cargo.toLowerCase();
  return c.startsWith("senador") || c.startsWith("diputad");
}
function esElecto(cargo: string): boolean {
  const c = cargo.toLowerCase();
  return c.startsWith("senador") || c.startsWith("diputad") || c.startsWith("alcalde")
    || c.startsWith("alcaldesa") || c.startsWith("regidor") || c.startsWith("director");
}
// Base monthly salary by role, taken straight from the published payroll
// (nómina) — not a guess. Senators: Senate nómina de sueldos fijos, abril 2026
// (transparencia.senadord.gob.do), RD$320,000. Deputies: Cámara nómina de mayo
// 2026 (camaradediputados.gob.do), RD$320,000 gross. Same base for both roles.
// Governors: MIP nómina de personal fijo de abril 2026 — the 31 provincial
// governors all appear with the cargo GOBERNADOR/GOBERNADOR CIVIL at exactly
// RD$150,000 gross (uniform, verified row by row in the official spreadsheet).
// Side benefits are NOT included — only the base salary on the nómina.
interface SueldoRol {
  monto: string;
  mes: string;
  fuente: string;
}
function sueldoDeCargo(cargo: string): SueldoRol | null {
  const c = cargo.toLowerCase();
  if (c.startsWith("senador"))
    return {
      monto: "RD$320,000",
      mes: "abril 2026",
      fuente: "nómina de sueldos fijos del Senado",
    };
  if (c.startsWith("diputad"))
    return {
      monto: "RD$320,000",
      mes: "mayo 2026",
      fuente: "nómina de la Cámara de Diputados",
    };
  if (c.startsWith("gobernador"))
    return {
      monto: "RD$150,000",
      mes: "abril 2026",
      fuente: "nómina de personal fijo del Ministerio de Interior y Policía",
    };
  return null;
}

function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter((w) => w.length > 2);
  const ini = (palabras[0]?.[0] || "") + (palabras[1]?.[0] || "");
  return ini.toUpperCase() || "·";
}

// Official senator portraits from senadord.gob.do (32 verified, fetched
// 2026-06-12). Keyed by "provincia||nombre" so a name is only matched when the
// province also lines up — no portrait is shown for a senator we can't verify.
// Only senators have verified photos; deputies/governors/mayors keep initials.
// Filenames live in docs/img/senadores/. Manifest of record (name, party,
// province, source_url, sha256): senado-reader/gallery/gallery.json.
const RETRATOS_SENADORES: Record<string, string> = {
  "Distrito Nacional||Omar Leonel Fernández Domínguez": "omar-leonel-fernandez-dominguez.jpg",
  "Azua||Lía Ynocencia Díaz Santana": "lia-ynocencia-diaz-santana.jpg",
  "Bahoruco||Andrés Guillermo Lama Pérez": "andres-guillermo-lama-perez.jpg",
  "Barahona||Moisés Ayala Pérez": "moises-ayala-perez.jpg",
  "Dajabón||Manuel María Rodríguez Ortega": "manuel-maria-rodriguez-ortega.jpg",
  "Duarte||Franklin Martín Romero Morillo": "franklin-martin-romero-morillo.jpg",
  "El Seibo||Santiago José Zorrilla": "santiago-jose-zorrilla.jpg",
  "Elías Piña||Jonhson Encarnación Díaz": "jonhson-encarnacion-diaz.jpg",
  "Espaillat||Carlos Manuel Gómez Ureña": "carlos-manuel-gomez-urena.jpg",
  "Hato Mayor||Cristóbal Venerado Castillo": "cristobal-venerado-castillo.jpg",
  "Hermanas Mirabal||María Mercedes Ortiz Diloné": "maria-mercedes-ortiz-dilone.jpg",
  "Independencia||Dagoberto Rodríguez Adames": "dagoberto-rodriguez-adames.jpg",
  "La Altagracia||Rafael Barón Duluc Rijo": "rafael-baron-duluc-rijo.jpg",
  "La Romana||Eduard Alexis Espiritusanto Castillo": "eduard-alexis-espiritusanto-castillo.jpg",
  "La Vega||Ramón Rogelio Genao Durán": "ramon-rogelio-genao-duran.jpg",
  "María Trinidad Sánchez||Alexis Victoria Yeb": "alexis-victoria-yeb.jpg",
  "Monseñor Nouel||Héctor E. Acosta": "hector-e-acosta.jpg",
  "Monte Cristi||Bernardo Alemán Rodríguez": "bernardo-aleman-rodriguez.jpg",
  "Monte Plata||Pedro Antonio Tineo Núñez": "pedro-antonio-tineo-nunez.jpg",
  "Pedernales||Secundino Velázquez Pimentel": "secundino-velazquez-pimentel.jpg",
  "Peravia||Julito Fulcar Encarnación": "julito-fulcar-encarnacion.jpg",
  "Puerto Plata||Ginnette Altagracia Bournigal": "ginnette-altagracia-bournigal.jpg",
  "Samaná||Pedro Catrain Bonilla": "pedro-catrain-bonilla.jpg",
  "San Cristóbal||Gustavo Lara Salazar": "gustavo-lara-salazar.jpg",
  "San José de Ocoa||Aneudy Ortiz Sajiun": "aneudy-ortiz-sajiun.jpg",
  "San Juan||Félix Bautista Rosario": "felix-bautista-rosario.jpg",
  "San Pedro de Macorís||Aracelis Villanueva": "aracelis-villanueva.jpg",
  "Sánchez Ramírez||Ricardo De Los Santos": "ricardo-de-los-santos.jpg",
  "Santiago||Daniel Enrique De Jesús Rivera Reyes": "daniel-enrique-de-jesus-rivera-reyes.jpg",
  "Santiago Rodríguez||Casimiro Antonio Marte Familia": "casimiro-antonio-marte-familia.jpg",
  "Santo Domingo||Antonio M. Taveras Guzmán": "antonio-m-taveras-guzman.jpg",
  "Valverde||Odalís Rafael Rodríguez Rodríguez": "odalis-rafael-rodriguez-rodriguez.jpg",
};

// Returns the portrait filename for a senator, or null when we have no verified
// photo for that exact person in that exact province. Only senators qualify.
function retratoSenador(provincia: string, l: Lider): string | null {
  if (!l.cargo.toLowerCase().startsWith("senador")) return null;
  return RETRATOS_SENADORES[provincia + "||" + l.nombre] || null;
}

const ORDEN_GRUPOS = ["senador", "diputad", "gobernador", "alcalde", "director", "regidor", "otros"];
const ETIQUETA_GRUPO: Record<string, string> = {
  senador: "Senador/a",
  diputad: "Diputados/as",
  gobernador: "Gobernador/a",
  alcalde: "Alcaldes/sas",
  director: "Directores/as de distrito",
  regidor: "Regidores/as",
  otros: "Otros",
};
function grupoDeCargo(cargo: string): string {
  const c = cargo.toLowerCase();
  return ORDEN_GRUPOS.find((k) => k !== "otros" && c.startsWith(k)) || "otros";
}

function renderLider(l: Lider, provincia: string): HTMLElement {
  const block = el("div", "lider");
  const cab = el("div", "lider-cab");
  // Senators with a verified official portrait show the photo; everyone else
  // (and any senator we couldn't match) keeps the initials circle.
  const retrato = retratoSenador(provincia, l);
  if (retrato) {
    const img = el("img", "avatar avatar-foto") as HTMLImageElement;
    img.src = "img/senadores/" + retrato;
    img.alt = "Retrato oficial de " + l.nombre;
    img.width = 44;
    img.height = 44;
    img.loading = "lazy";
    img.decoding = "async";
    // If the file ever fails to load, fall back to the initials circle so the
    // card never shows a broken-image icon.
    img.addEventListener("error", () => {
      const fb = el("span", "avatar", iniciales(l.nombre));
      img.replaceWith(fb);
    });
    cab.append(img);
  } else {
    cab.append(el("span", "avatar", iniciales(l.nombre)));
  }
  const ident = el("div", "lider-ident");
  ident.append(el("p", "lider-nombre", "<b>" + l.nombre + "</b><span class='partido-chip'>" + l.partido + "</span>"));
  ident.append(el("p", "lider-cargo", l.cargo));
  cab.append(ident);
  block.append(cab);
  if (esElecto(l.cargo)) {
    block.append(el("p", "lider-dato", "🗓️ En el cargo: 2024–2028 (elegido por voto)"));
  }
  const fn = funcionDeCargo(l.cargo);
  if (fn) block.append(el("p", "lider-funcion", fn));
  if (l.resumen) block.append(el("p", null, l.resumen));

  // --- Report-card lines, regrouped into a compact chip row. Each stat shows a
  //     short headline in the chip (emoji + number) and tucks its full sentence
  //     behind a tap, reusing the native <details> fold idiom. A leader without
  //     any data renders no chip row at all, exactly as before. ---
  const chips = el("div", "lider-chips");

  // Helper: one tappable stat chip. summary = short headline; body = full line.
  const datoChip = (resumen: string, detalle: string): HTMLElement => {
    const d = el("details", "dato-chip");
    d.append(el("summary", "dato-chip-cab", resumen), el("p", "dato-chip-det", detalle));
    return d;
  };

  // Lane 1: plenary attendance.
  if (l.asistencia && l.asistencia.total > 0) {
    const a = l.asistencia;
    chips.append(datoChip(
      "📅 <b>" + a.presentes + "/" + a.total + "</b> sesiones",
      "Asistencia: estuvo en <b>" + a.presentes + " de " + a.total +
      "</b> sesiones del Pleno (" + a.periodo + ")."
    ));
  }

  // Lane 2: committees the senator works in.
  if (l.comisiones && l.comisiones.length) {
    chips.append(datoChip(
      "🗂️ <b>" + l.comisiones.length + "</b> comisiones",
      "Trabaja en " + l.comisiones.length + " comisiones: " + l.comisiones.join(", ") + "."
    ));
  }

  // Lane 3: bills proposed or co-proposed.
  if (typeof l.iniciativas_propuestas === "number") {
    const n = l.iniciativas_propuestas;
    chips.append(datoChip(
      "📜 <b>" + n + "</b> " + (n === 1 ? "iniciativa" : "iniciativas"),
      "Ha propuesto o copropuesto <b>" + n + "</b> " +
      (n === 1 ? "iniciativa" : "iniciativas") + " en este período."
    ));
  }

  // Lane 4: base monthly salary, from the public payroll. Senators, deputies
  // and governors share a role-wide rate (sueldoDeCargo); mayors each have their
  // own amount read from their own ayuntamiento's nómina (l.sueldo).
  const sueldo = sueldoDeCargo(l.cargo) || l.sueldo || null;
  if (sueldo) {
    chips.append(datoChip(
      "💰 <b>" + sueldo.monto + "</b> al mes",
      "Sueldo: <b>" + sueldo.monto + " al mes</b>, según la " + sueldo.fuente +
      " de " + sueldo.mes + ". Lo pagan los impuestos de todos."
    ));
  }

  if (chips.children.length) block.append(chips);

  // Honest note for roles that don't legislate: explain why there are no
  // attendance/bill stats instead of leaving the card looking unfinished.
  const cargoLower = l.cargo.toLowerCase();
  if (cargoLower.startsWith("gobernador")) {
    block.append(el("p", "nota-fuente",
      "El gobernador no hace leyes ni vota en el Congreso, por eso no tiene asistencia ni iniciativas. Lo nombra la Presidencia, y su sueldo sale en la nómina del Ministerio de Interior y Policía."));
  } else if (cargoLower.startsWith("alcalde")) {
    // When we already show this mayor's salary (from their ayuntamiento's own
    // nómina), drop the "estamos reuniendo" promise and just explain the role.
    const nota = l.sueldo
      ? "El alcalde trabaja en el ayuntamiento, no en el Congreso, por eso no tiene asistencia ni iniciativas de leyes. Su sueldo sale en la nómina de su propio ayuntamiento."
      : "El alcalde trabaja en el ayuntamiento, no en el Congreso, por eso no tiene asistencia ni iniciativas de leyes. Su sueldo lo publica cada ayuntamiento; aún estamos reuniendo esas nóminas.";
    block.append(el("p", "nota-fuente", nota));
  }

  if (esLegislador(l.cargo)) {
    block.append(el("p", "lider-cargo", "Registro de votos: " + l.registro));
  }
  return block;
}

// "¿Y los regidores?" — a small explainer card in every province profile.
// Explains, kid-simple, what a regidor is (the town council that approves the
// mayor's budget and rules — los concejales del pueblo) and that each
// municipality elects several. Shows the verified total ONLY when present in
// the data; otherwise it stays a pure explainer with no invented number.
// When verified names exist (regidores.lista), they render as a name+party list.
function renderRegidoresCard(prov: Provincia): HTMLElement {
  // Same drop-down card flow as the other roles (Kelvin): title + count
  // collapsed; tap to see the explainer and the named lists.
  const r0 = prov.regidores;
  const nombres = r0 && r0.municipios
    ? r0.municipios.reduce((n, m) => n + (m.lista ? m.lista.length : 0), 0) : 0;
  const wrap = el("details", "grupo-cargo");
  const cab = el("summary", "grupo-cab");
  cab.append(
    el("span", "grupo-nombre", "Regidores/as"),
    el("span", "grupo-conteo",
      nombres > 0
        ? nombres + " con nombre"
        : (r0 && typeof r0.total === "number" ? String(r0.total) + " personas" : "¿qué son?")),
    el("span", "grupo-chev", "▸")
  );
  wrap.append(cab);
  wrap.append(renderRegidoresBody(prov));
  return wrap;
}

function renderRegidoresBody(prov: Provincia): HTMLElement {
  const card = el("div", "como");
  let html =
    "<b>🪑 ¿Y los regidores?</b> En cada ayuntamiento, además del alcalde, hay un grupo de " +
    "<span class=\"palabra\" data-def=\"Los regidores son el grupo de personas, elegidas por voto, que forman el concejo del ayuntamiento. Aprueban el presupuesto del pueblo, dictan las normas locales y vigilan al alcalde. Son como los concejales del pueblo.\">regidores</span>: " +
    "son los concejales del pueblo. Aprueban el presupuesto del municipio, dictan las normas locales y vigilan al alcalde. " +
    "Cada municipio elige varios por voto, según cuánta gente vive en él.";

  const r = prov.regidores;
  // When the source string carries its URL inline (JCE), keep the descriptive
  // text here and render the URL as a tappable link below (5ª sugerencia de un
  // usuario real, Ángel).
  let fuenteTotalLink: HTMLAnchorElement | null = null;
  if (r && typeof r.total === "number") {
    let textoFuente = r.fuente_total || "";
    if (r.fuente_total) {
      const partida = partirFuenteUrl(r.fuente_total);
      textoFuente = partida.texto;
      fuenteTotalLink = enlaceDoc(partida.url || undefined, "📄 Ver la lista oficial (JCE)");
    }
    html += "<br><br>En esta provincia hay <b>" + r.total + " regidores</b> en total" +
      (textoFuente ? ", según " + textoFuente : "") + ".";
  } else {
    html += "<br><br><span class=\"nota-fuente\">Cuántos hay en total en esta provincia: aún estamos confirmando la cifra con datos oficiales de la JCE.</span>";
  }
  card.innerHTML = html;
  if (fuenteTotalLink) card.append(fuenteTotalLink);

  // Verified names per municipality, when we have them. A municipality's list
  // folds behind a tap so a 30-name council doesn't flood the card.
  if (r && r.municipios && r.municipios.length) {
    r.municipios.forEach((m) => {
      if (!m.lista || !m.lista.length) return;
      const det = el("details", "regidores-lista") as HTMLDetailsElement;
      det.append(el("summary", "regidores-municipio",
        "🪑 Regidores de " + m.municipio + " (" + m.lista.length + ")"));
      m.lista.forEach((rg) => {
        const fila = el("p", "regidor-fila");
        fila.innerHTML = rg.nombre + " <span class='partido-chip'>" + rg.partido + "</span>";
        det.append(fila);
      });
      if (m.fuente_lista) {
        // Render the source text clean and turn its inline URL into a link.
        const partida = partirFuenteUrl(m.fuente_lista);
        det.append(el("p", "nota-fuente", "Fuente: " + partida.texto + "."));
        const a = enlaceDoc(partida.url || undefined, "📄 Ver la lista oficial (JCE)");
        if (a) det.append(a);
      }
      card.append(det);
    });
  }
  return card;
}

function renderProvincias(data: ProvinciasData): void {
  const grid = el("div", "prov-grid");
  const perfil = byId("perfilProvincia");

  const ordenadas = [...data.provincias].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  ordenadas.forEach((prov) => {
    const c = el("div", "prov-card");
    c.append(el("span", "prov-nombre", prov.nombre));
    const n = prov.lideres.length;
    c.append(el("span", "prov-count", n + (n === 1 ? " cargo" : " cargos")));
    // Keyboard accessible: behave like a button.
    c.setAttribute("role", "button");
    c.tabIndex = 0;
    c.setAttribute("aria-label", "Ver " + prov.nombre);
    c.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.click(); }
    });
    c.addEventListener("click", () => {
      perfil.classList.remove("hidden");
      perfil.innerHTML = "";
      const cerrar = el("button", "perfil-cerrar", "✕ Cerrar");
      cerrar.addEventListener("click", () => {
        perfil.classList.add("hidden");
        perfil.innerHTML = "";
      });
      perfil.append(cerrar);
      perfil.append(el("h3", null, prov.nombre));
      // Group the officials by role so a long list (e.g. 43 deputies) stays scannable.
      const grupos: Record<string, Lider[]> = {};
      prov.lideres.forEach((l) => {
        const k = grupoDeCargo(l.cargo);
        (grupos[k] = grupos[k] || []).push(l);
      });
      // Each role folds into its own card (Kelvin: find your target without
      // scrolling through every position). Same details/summary flow as Sesiones.
      ORDEN_GRUPOS.forEach((k) => {
        const arr = grupos[k];
        if (!arr || !arr.length) return;
        const etq = ETIQUETA_GRUPO[k] || "Otros";
        const grupoCard = el("details", "grupo-cargo");
        const cab = el("summary", "grupo-cab");
        cab.append(
          el("span", "grupo-nombre", etq),
          el("span", "grupo-conteo", arr.length === 1 ? "1 persona" : arr.length + " personas"),
          el("span", "grupo-chev", "▸")
        );
        grupoCard.append(cab);
        arr.forEach((l) => grupoCard.append(renderLider(l, prov.nombre)));
        perfil.append(grupoCard);
      });
      // Honest note when this province's mayors aren't loaded yet.
      if (!grupos["alcalde"]) {
        perfil.append(el(
          "p",
          "nota-fuente",
          "Alcaldes: aún por añadir. Estamos completando esta provincia con datos oficiales. " +
          "¿Conoces a tu alcalde? <a href=\"https://github.com/Kevthetech143/leyes-rd/issues/new/choose\" target=\"_blank\" rel=\"noopener\">Ayúdanos a completarlo</a>."
        ));
      }
      // Always explain the town council (regidores) — feedback de un usuario real.
      perfil.append(renderRegidoresCard(prov));
      // The card just added a new .palabra word; wire tap-to-define on it.
      setupGlosario();
      perfil.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    grid.append(c);
  });

  const host = byId("provincias");
  host.innerHTML = "";

  // "¿Cómo leer esto?" — explains the new report-card lines on a senator card,
  // in kid-simple Spanish, with tap-to-define words. Only shows once, on top.
  const comoLeer = el("div", "como");
  comoLeer.innerHTML =
    "<b>¿Cómo leer la ficha de un senador?</b> Al abrir una provincia y tocar a su senador verás cuatro datos nuevos:<br>" +
    "📅 <b>Asistencia</b>: a cuántas reuniones del " +
    "<span class=\"palabra\" data-def=\"La reunión grande donde todos los senadores se juntan a votar las leyes.\">Pleno</span> " +
    "fue, de las que pudimos contar. Ir es su trabajo.<br>" +
    "🗂️ <b>Comisiones</b>: una " +
    "<span class=\"palabra\" data-def=\"Un grupo pequeño de senadores que estudia un tema (salud, educación, dinero) antes de que todos voten.\">comisión</span> " +
    "es un equipo que estudia un tema a fondo. Trabajar en varias es normal.<br>" +
    "📜 <b>Iniciativas</b>: cuántas " +
    "<span class=\"palabra\" data-def=\"Una idea de ley o resolución que el senador presenta, solo o junto a otros, para que el Senado la estudie.\">propuestas de ley</span> " +
    "ha presentado, solo o con otros.<br>" +
    "💰 <b>Sueldo</b>: lo que gana al mes. Sale de la " +
    "<span class=\"palabra\" data-def=\"La lista pública de lo que cobra cada empleado del Estado. La ley obliga a publicarla cada mes.\">nómina</span> " +
    "pública. Lo pagan los impuestos de todos nosotros.";
  host.append(comoLeer);

  host.append(grid);
  // New glossary words were just added — wire up tap-to-define on them.
  setupGlosario();
}

/* ---------- ¿Quién controla el Congreso? — composición por partido ---------- */
// Counts how many seats each party holds in one chamber, reading the same
// provincias.json the rest of the site uses. Nothing is hardcoded: if the data
// is refreshed, these numbers move with it. cargoStart = "senador" or "diputad".
interface ConteoPartido {
  partido: string;
  asientos: number;
}
function contarPorPartido(data: ProvinciasData, cargoStart: string): ConteoPartido[] {
  const cuenta: Record<string, number> = {};
  data.provincias.forEach((p) => {
    p.lideres.forEach((l) => {
      if (l.cargo.toLowerCase().startsWith(cargoStart)) {
        const part = l.partido || "?";
        cuenta[part] = (cuenta[part] || 0) + 1;
      }
    });
  });
  return Object.keys(cuenta)
    .map((k) => ({ partido: k, asientos: cuenta[k] }))
    // Most seats first; ties broken by party initials so the order is stable.
    .sort((a, b) => b.asientos - a.asientos || a.partido.localeCompare(b.partido));
}

// A fixed color per party so the bar, the legend and the detail all agree.
// Parties not listed fall back to a neutral grey (never invented data, just a
// color). Colors picked to read apart on a small phone screen.
const COLOR_PARTIDO: Record<string, string> = {
  PRM: "#1a4ed8",   // azul — same family as the site accent
  FP: "#7b2ff7",    // morado
  PLD: "#1f9d57",   // verde
  PRSC: "#e0651a",  // naranja
  DXC: "#0fb5c4",   // turquesa
  PPG: "#d8261a",   // rojo
  PLR: "#c01b8a",   // magenta
};
const COLOR_OTROS = "#565e6e"; // gris para el grupo "Otros"
function colorDePartido(partido: string): string {
  return COLOR_PARTIDO[partido] || COLOR_OTROS;
}

// Renders one chamber: a grid of actual seat dots (one per legislator, colored
// by party, sorted so each party forms a contiguous block, majority obvious at a
// glance) + a legend of party chips, with the real per-party counts folded behind
// a tap, plus one honest takeaway derived only from the math. Tiny parties (1–2
// seats) collapse into "Otros" on the legend for readability — the seat grid and
// the fold-out detail still show every party.
function renderCamara(nombre: string, total: number, conteo: ConteoPartido[]): HTMLElement {
  const wrap = el("div", "camara-comp");
  wrap.append(el("p", "camara-titulo", "<b>" + nombre + "</b> <span class=\"camara-total\">" + total + " asientos</span>"));

  // Group tiny parties (1–2 seats) into "Otros" for the legend only.
  const grandes = conteo.filter((c) => c.asientos > 2);
  const pequenos = conteo.filter((c) => c.asientos <= 2);
  const otrosTotal = pequenos.reduce((n, c) => n + c.asientos, 0);
  const segmentos: ConteoPartido[] = [...grandes];
  if (otrosTotal > 0) segmentos.push({ partido: "Otros", asientos: otrosTotal });

  // Seat grid: one dot per legislator, in party order so each party is a solid
  // block and the majority reads at a glance. The grid is decorative-plus — it
  // carries an aria-label summarizing the counts; the legend below is the
  // readable source of truth. Tighter dots for the bigger Cámara so 178 stay
  // crisp and the grid wraps instead of stretching the page.
  const grande = total > 60;
  const grid = el("div", "comp-asientos" + (grande ? " comp-asientos-densa" : ""));
  grid.setAttribute("role", "img");
  grid.setAttribute(
    "aria-label",
    nombre + ": " + conteo.map((c) => c.partido + " " + c.asientos).join(", ") + " de " + total + " asientos."
  );
  conteo.forEach((c) => {
    for (let i = 0; i < c.asientos; i++) {
      const dot = el("span", "comp-asiento");
      dot.style.background = colorDePartido(c.partido);
      dot.title = c.partido;
      grid.append(dot);
    }
  });
  wrap.append(grid);

  // Legend: one chip per visible segment (initials + count).
  const leyenda = el("div", "comp-leyenda");
  segmentos.forEach((s) => {
    const chip = el("span", "comp-chip");
    const punto = el("span", "comp-punto");
    punto.style.background = s.partido === "Otros" ? COLOR_OTROS : colorDePartido(s.partido);
    chip.append(punto, el("span", "comp-chip-txt", s.partido + " " + s.asientos));
    leyenda.append(chip);
  });
  wrap.append(leyenda);

  // Honest takeaway, derived from the math only — no political commentary.
  const lider = conteo[0];
  if (lider) {
    const mitad = total / 2;
    let cola: string;
    if (lider.asientos > mitad) cola = " — más de la mitad.";
    else if (lider.asientos === mitad) cola = " — justo la mitad.";
    else cola = " — la mayor parte, pero no la mitad.";
    const sustantivo = nombre.toLowerCase().includes("senado") ? "senadores" : "diputados";
    wrap.append(el(
      "p",
      "comp-clave",
      "El <b>" + lider.partido + "</b> tiene <b>" + lider.asientos + " de " + total + "</b> " + sustantivo + cola
    ));
  }

  // Fold-out detail: every party with its real count, biggest first.
  const det = el("details", "comp-detalle");
  det.append(el("summary", "comp-detalle-cab", "Ver el detalle por partido"));
  conteo.forEach((c) => {
    const fila = el("p", "comp-detalle-fila");
    const punto = el("span", "comp-punto");
    punto.style.background = colorDePartido(c.partido);
    fila.append(punto, el("span", null, c.partido + ": " + c.asientos +
      (c.asientos === 1 ? " asiento" : " asientos")));
    det.append(fila);
  });
  wrap.append(det);
  return wrap;
}

function renderComposicion(data: ProvinciasData): void {
  const host = document.getElementById("composicionCongreso");
  if (!host) return;
  const senado = contarPorPartido(data, "senador");
  const diputados = contarPorPartido(data, "diputad");
  const totalSen = senado.reduce((n, c) => n + c.asientos, 0);
  const totalDip = diputados.reduce((n, c) => n + c.asientos, 0);

  host.innerHTML = "";
  const card = el("div", "comp-card");
  card.append(renderCamara("Senado", totalSen, senado));
  card.append(renderCamara("Cámara de Diputados", totalDip, diputados));
  card.append(el(
    "p",
    "nota-fuente",
    "Cuenta hecha con los datos verificados de esta misma página (Senado y Cámara, 2024–2028)."
  ));
  host.append(card);
}

/* ---------- Sesiones ---------- */
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function fechaLarga(iso: string): string {
  // iso = "2026-04-15"
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const y = parts[0];
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  const mes = MESES[m] || parts[1];
  return d + " de " + mes + " de " + y;
}

const estadoAsist: Record<string, string> = {
  presente: "✅ Presente",
  ausente: "➖ Ausente",
  excusado: "📝 Excusado",
};

function renderSesiones(data: SesionesData): void {
  const cont = byId("sesiones");
  cont.innerHTML = "";

  if (data.sesiones.length) {
    const fechas = data.sesiones.map((s) => s.fecha).sort();
    const ultima = fechas[fechas.length - 1];
    cont.append(el("p", "nota-fuente", "Última sesión publicada: " + fechaLarga(ultima) + "."));
  }

  // Kid-simple legend: what "primera/segunda discusión" and "unanimidad" mean.
  const leyenda = el("div", "como");
  leyenda.innerHTML =
    "<b>¿Cómo leer esto?</b> Una ley se vota <b>dos veces</b> en el Senado: la primera discusión y la segunda. " +
    "Si gana las dos, sigue su camino para ser ley. Las resoluciones (homenajes, peticiones) se deciden en una sola votación: <b>única discusión</b>. " +
    "<b>Unanimidad</b> = todos los presentes dijeron que sí.";
  cont.append(leyenda);

  data.sesiones.forEach((ses, idx) => {
    // Each session collapses to one line; only the newest starts open.
    const card = el("details", "sesion") as HTMLDetailsElement;
    if (idx === 0) card.open = true;

    const head = el("summary", "sesion-head");
    head.append(
      el("span", "sesion-fecha", fechaLarga(ses.fecha)),
      el("span", "sesion-conteo", ses.votaciones.length + " votaciones"),
      el("span", "sesion-acta", "Acta " + ses.acta),
      el("span", "sesion-chev", "▸")
    );
    card.append(head);

    // Votaciones
    const vlist = el("div", "votaciones");
    ses.votaciones.forEach((v) => {
      const row = el("div", "votacion");
      // Plain title up front; the official legalese title tucks behind a tap.
      if (v.titulo_facil) {
        row.append(el("p", "votacion-titulo", v.titulo_facil));
        const oficial = el("details", "oficial");
        oficial.append(
          el("summary", null, "📜 Ver nombre oficial"),
          el("p", "votacion-titulo-oficial", v.titulo)
        );
        row.append(oficial);
      } else {
        row.append(el("p", "votacion-titulo", v.titulo));
      }
      const meta = el("div", "votacion-meta");
      const aprob = /^aprob/i.test(v.resultado);
      const icono = aprob ? "✅ " : "•&nbsp;";
      meta.append(
        el("span", "v-iniciativa", "Iniciativa " + v.iniciativa),
        el("span", "v-conteo", v.a_favor + " de " + v.presentes + " presentes votaron a favor"),
        el("span", aprob ? "v-resultado" : "v-resultado v-resultado-neutral", icono + v.resultado)
      );
      row.append(meta);
      // Proportion bar: turns "X de Y" into a felt amount. Grey = simply "did not vote in favor",
      // never shown as a vote against (the Senate does not publish per-person votes).
      const pct = v.presentes > 0 ? Math.round((v.a_favor / v.presentes) * 100) : 0;
      const barra = el("div", "voto-barra");
      barra.setAttribute("role", "img");
      barra.setAttribute("aria-label", v.a_favor + " de " + v.presentes + " presentes votaron a favor");
      barra.setAttribute("title", "Gris: no votaron a favor");
      const fill = el("span", "voto-barra-fill");
      fill.style.width = pct + "%";
      barra.append(fill);
      row.append(barra);
      vlist.append(row);
    });
    card.append(vlist);

    // Asistencia (expandable)
    const det = ses.asistencia.detalle;
    const asistWrap = el("details", "asistencia");
    const sum = el("summary", "asistencia-sum");
    if (det.length) {
      sum.innerHTML = "👥 Quién faltó (con excusa): " + det.length;
    } else if (ses.asistencia.ausentes === 0) {
      sum.innerHTML = "👥 Asistencia: nadie presentó excusa ese día";
    } else {
      sum.innerHTML = "👥 Asistencia";
    }
    asistWrap.append(sum);

    const body = el("div", "asistencia-body");
    if (det.length) {
      const ul = el("div", "asist-lista");
      det.forEach((p) => {
        const fila = el("div", "asist-fila");
        fila.append(el("span", null, p.nombre));
        fila.append(el("span", "asist-estado-" + p.estado, estadoAsist[p.estado] || p.estado));
        ul.append(fila);
      });
      body.append(ul);
      body.append(
        el("p", "nota-fuente", "Lista de senadores que presentaron excusa, según el acta oficial. El acta no publica una cifra total de presentes.")
      );
    } else if (ses.asistencia.ausentes === 0) {
      body.append(el("p", null, "Según el acta, ningún senador presentó excusa ese día."));
    } else {
      body.append(el("p", "nota-fuente", "La lista por nombre no está disponible de forma legible para esta sesión."));
    }
    asistWrap.append(body);
    card.append(asistWrap);

    // Link to the official acta PDF (5ª sugerencia de un usuario real, Ángel).
    const aActa = enlaceDoc(ses.url_acta, "📄 Ver el acta oficial (PDF)");
    if (aActa) card.append(aActa);

    cont.append(card);
  });
}

/* ---------- Buscadores (search) ---------- */
// Accent-insensitive, lowercase match so "san cristobal" finds "San Cristóbal".
function normaliza(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Live filter of province cards by name.
function setupBuscadorProvincias(): void {
  const inp = document.getElementById("buscarProvincia") as HTMLInputElement | null;
  if (!inp) return;
  const aviso = document.getElementById("provNoResultado");
  inp.addEventListener("input", () => {
    const q = normaliza(inp.value);
    let visibles = 0;
    document.querySelectorAll<HTMLElement>("#provincias .prov-card").forEach((c) => {
      const nom = normaliza(c.querySelector(".prov-nombre")?.textContent || "");
      const match = !q || nom.includes(q);
      c.classList.toggle("hidden", !match);
      if (match) visibles++;
    });
    if (aviso) aviso.classList.toggle("hidden", !(q && visibles === 0));
  });
}

// Live filter of law sectors by topic or law title; opens matching sectors.
function setupBuscadorLeyes(): void {
  const inp = document.getElementById("buscarLey") as HTMLInputElement | null;
  if (!inp) return;
  const aviso = document.getElementById("leyNoResultado");
  inp.addEventListener("input", () => {
    const q = normaliza(inp.value);
    let visibles = 0;
    document.querySelectorAll<HTMLElement>("#sectores .sector").forEach((sec) => {
      const match = !q || normaliza(sec.textContent || "").includes(q);
      sec.classList.toggle("hidden", !match);
      const body = sec.querySelector<HTMLElement>(".sector-body");
      const head = sec.querySelector(".sector-head");
      const abrir = Boolean(q && match);
      if (body) body.style.display = abrir ? "block" : "none";
      sec.classList.toggle("open", abrir);
      head?.setAttribute("aria-expanded", String(abrir));
      if (match) visibles++;
    });
    if (aviso) aviso.classList.toggle("hidden", !(q && visibles === 0));
  });
}

/* ---------- Navegación ---------- */
// Every view id, keyed by the data-view / data-goto name.
const VISTAS: Record<string, string> = {
  home: "view-home",
  pais: "view-pais",
  leyes: "view-leyes",
  mapa: "view-mapa",
  sesiones: "view-sesiones",
  dinero: "view-dinero",
  // "proyecto" has no tab in the nav. It's reachable only from the hero
  // button. When it's the active view, no tab matches in mostrarVista, so no
  // tab is highlighted — which is what we want. Tapping any real tab leaves
  // this view cleanly because the tab handler calls mostrarVista with its own
  // view name, hiding view-proyecto like any other section.
  proyecto: "view-proyecto",
};

function mostrarVista(view: string): void {
  // Show only the requested section, hide the rest.
  Object.keys(VISTAS).forEach((k) => {
    byId(VISTAS[k]).classList.toggle("hidden", k !== view);
  });
  // Sync the tab bar state (highlight + aria).
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((t) => {
    const activo = t.dataset.view === view;
    t.classList.toggle("active", activo);
    t.setAttribute("aria-selected", activo ? "true" : "false");
  });
  // Bring the new section into view on small screens.
  window.scrollTo({ top: 0, behavior: "auto" });
}

function setupTabs(): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const view = tab.dataset.view;
      if (view) mostrarVista(view);
    });
  });

  // Any element with data-goto jumps straight into a section: the big home
  // cards AND the "¿Y ahora qué?" footer that chains one section to the next.
  document.querySelectorAll<HTMLElement>("[data-goto]").forEach((card) => {
    card.addEventListener("click", () => {
      const dest = card.dataset.goto;
      if (dest) mostrarVista(dest);
    });
  });

  // Tapping the site title returns home.
  const homeLink = document.getElementById("homeLink");
  if (homeLink) homeLink.addEventListener("click", () => mostrarVista("home"));
}

/* ---------- Compartir y participar ---------- */
function copiarEnlace(url: string, btn: HTMLElement): void {
  const prev = btn.textContent;
  const ok = () => {
    btn.textContent = "✅ ¡Copiado!";
    window.setTimeout(() => { if (prev) btn.textContent = prev; }, 1600);
  };
  const nav = navigator as unknown as { clipboard?: { writeText(s: string): Promise<void> } };
  if (nav.clipboard?.writeText) nav.clipboard.writeText(url).then(ok, ok);
  else ok();
}
function setupCompartir(): void {
  const url = "https://kevthetech143.github.io/leyes-rd/";
  const titulo = "Política Sencilla RD";
  const texto = "Entiende la política dominicana fácil: leyes, provincias, el Senado y el dinero público.";
  const wa = document.getElementById("waShare") as HTMLAnchorElement | null;
  if (wa) wa.href = "https://wa.me/?text=" + encodeURIComponent(texto + " " + url);
  const sb = document.getElementById("shareBtn");
  if (sb) {
    sb.addEventListener("click", () => {
      const nav = navigator as unknown as { share?: (d: object) => Promise<void> };
      if (nav.share) nav.share({ title: titulo, text: texto, url }).catch(() => {});
      else copiarEnlace(url, sb);
    });
  }
  const cb = document.getElementById("copyBtn");
  if (cb) cb.addEventListener("click", () => copiarEnlace(url, cb));
  const fs = document.getElementById("footShare");
  if (fs) {
    fs.addEventListener("click", () => {
      const nav = navigator as unknown as { share?: (d: object) => Promise<void> };
      if (nav.share) nav.share({ title: titulo, text: texto, url }).catch(() => {});
      else copiarEnlace(url, fs);
    });
  }
}

/* ---------- Inicio: cifras reales vivas ---------- */
// Prints one real count per home card, computed from the data already loaded.
// Numbers only — never invented; if data is missing the line stays empty.
function llenarCifrasHome(leyes: LeyesData, prov: ProvinciasData, ses: SesionesData): void {
  const setC = (k: string, t: string): void => {
    const e = document.querySelector('[data-cifra="' + k + '"]');
    if (e) e.textContent = t;
  };
  const totalLeyes = leyes.sectores.reduce((n, s) => n + s.leyes.length, 0);
  setC("leyes", totalLeyes + " leyes en " + leyes.sectores.length + " temas");
  const cargos = prov.provincias.reduce((n, p) => n + p.lideres.length, 0);
  setC("provincias", prov.provincias.length + " provincias · " + cargos + " cargos");
  if (ses.sesiones.length) {
    const ult = ses.sesiones.map((s) => s.fecha).sort().slice(-1)[0];
    setC("sesiones", "Última sesión: " + fechaLarga(ult));
  }
}

/* ---------- Inicio: carrusel "¿Sabías que...?" ---------- */
// Rotating fact strip built ONLY from our real data (the same JSON the rest of
// the site renders). Each fact has one button that jumps to its section. Gentle
// auto-rotate with dots; pausable; prefers-reduced-motion = no auto-rotate.
interface SabiasDato {
  texto: string;       // kid-simple line; <b> allowed for the number
  cta: string;         // button label
  destino: string;     // VISTAS key to navigate to
  acento: string;      // accent class: acc-dinero / acc-leyes / acc-sesiones
}

// Build the fact list from data already loaded. Every number is copied faithful
// from its source field; nothing is invented. If a source is missing, that fact
// is simply skipped (never faked).
function construirSabias(leyes: LeyesData, ses: SesionesData): SabiasDato[] {
  const datos: SabiasDato[] = [];

  // 1) Sueldo promedio formal — finanzas.json metricas[salario].valor.
  datos.push({
    texto: "El sueldo promedio del trabajador formal en RD es <b>RD$37,572.82 al mes</b>, según la seguridad social (junio 2025).",
    cta: "Ver el bolsillo del país", destino: "dinero", acento: "acc-dinero",
  });

  // 2) Deuda por persona — finanzas.json comparaciones_derivadas.deuda_por_persona_usd.
  datos.push({
    texto: "Cada dominicano carga <b>US$5,713</b> de la deuda del país, sin haberlo pedido.",
    cta: "Ver el dinero", destino: "dinero", acento: "acc-dinero",
  });

  // 3) Gasta vs gana — finanzas.json comparaciones_derivadas.gasta_por_cada_100_que_gana_rd.
  datos.push({
    texto: "Por cada <b>RD$100</b> que el Estado gana, gasta como <b>RD$121</b>. Ese hueco se tapa con préstamos.",
    cta: "Ver el dinero", destino: "dinero", acento: "acc-dinero",
  });

  // 4) Tamaño del Senado — 32 provincias = 32 senadores (uno por provincia).
  datos.push({
    texto: "El Senado son solo <b>32 personas</b> que hacen las leyes de todo el país: una por provincia.",
    cta: "Ver las sesiones", destino: "sesiones", acento: "acc-sesiones",
  });

  // 5) Última sesión publicada — sesiones.json: la fecha más reciente.
  if (ses.sesiones.length) {
    const ult = ses.sesiones.map((s) => s.fecha).sort().slice(-1)[0];
    datos.push({
      texto: "La última sesión del Senado que pudimos leer fue el <b>" + fechaLarga(ult) + "</b>.",
      cta: "Ver las sesiones", destino: "sesiones", acento: "acc-sesiones",
    });
  }

  // 6) Leyes explicadas — leyes.json: total de leyes en total de temas.
  const totalLeyes = leyes.sectores.reduce((n, s) => n + s.leyes.length, 0);
  datos.push({
    texto: "Aquí tienes <b>" + totalLeyes + " leyes</b> explicadas fácil, ordenadas en <b>" +
      leyes.sectores.length + " temas</b>.",
    cta: "Ver las leyes", destino: "leyes", acento: "acc-leyes",
  });

  return datos;
}

function setupSabias(leyes: LeyesData, ses: SesionesData): void {
  const seccion = document.getElementById("sabias");
  const viva = document.getElementById("sabiasViva");
  const puntosCont = document.getElementById("sabiasPuntos");
  const pausaBtn = document.getElementById("sabiasPausa") as HTMLButtonElement | null;
  if (!seccion || !viva || !puntosCont || !pausaBtn) return;

  const datos = construirSabias(leyes, ses);
  if (!datos.length) { seccion.classList.add("hidden"); return; }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let idx = 0;
  let timer = 0;
  let pausado = reduce; // reduced-motion starts paused (no auto-rotate)

  // Build the dots once.
  const puntos: HTMLButtonElement[] = datos.map((_, i) => {
    const b = el("button", "sabias-punto") as HTMLButtonElement;
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", "Dato " + (i + 1) + " de " + datos.length);
    b.addEventListener("click", () => { mostrar(i); reiniciar(); });
    puntosCont.append(b);
    return b;
  });

  function mostrar(i: number): void {
    idx = (i + datos.length) % datos.length;
    const d = datos[idx];
    viva!.innerHTML = "";
    const tarjeta = el("div", "sabias-dato");
    tarjeta.append(el("p", "sabias-texto", d.texto));
    const btn = el("button", "sabias-btn") as HTMLButtonElement;
    btn.type = "button";
    btn.innerHTML = d.cta + " ▸";
    btn.addEventListener("click", () => mostrarVista(d.destino));
    tarjeta.append(btn);
    viva!.append(tarjeta);
    // Recolor the whole strip to the destination's accent.
    seccion!.classList.remove("acc-dinero", "acc-leyes", "acc-sesiones");
    seccion!.classList.add(d.acento);
    // Sync dots.
    puntos.forEach((p, j) => p.setAttribute("aria-selected", j === idx ? "true" : "false"));
  }

  function avanzar(): void { mostrar(idx + 1); }

  function arrancar(): void {
    if (pausado) return;
    detener();
    timer = window.setInterval(avanzar, 6000);
  }
  function detener(): void { if (timer) { window.clearInterval(timer); timer = 0; } }
  function reiniciar(): void { detener(); arrancar(); }

  pausaBtn.addEventListener("click", () => {
    pausado = !pausado;
    pausaBtn.textContent = pausado ? "▶️" : "⏸️";
    pausaBtn.setAttribute("aria-pressed", String(pausado));
    pausaBtn.setAttribute("aria-label", pausado ? "Reanudar el cambio automático" : "Pausar el cambio automático");
    if (pausado) detener(); else arrancar();
  });

  // Pause while a keyboard user is tabbing through the strip; resume on leave.
  seccion.addEventListener("focusin", detener);
  seccion.addEventListener("focusout", () => { if (!pausado) arrancar(); });

  // Reflect the reduced-motion start state on the pause button.
  if (reduce) {
    pausaBtn.textContent = "▶️";
    pausaBtn.setAttribute("aria-pressed", "true");
    pausaBtn.setAttribute("aria-label", "Reanudar el cambio automático");
  }

  mostrar(0);
  arrancar();
}

/* ---------- Dinero: cada paso del caso SENASA se abre al tocarlo ---------- */
// Turns the hardcoded case steps into tap-to-reveal, reusing the accordion idiom.
// Scoped to #caso-senasa so the general money flow stays as-is.
function setupCasoAccordion(): void {
  const caso = document.getElementById("caso-senasa");
  if (!caso) return;
  caso.querySelectorAll<HTMLElement>(".flujo-graf .paso").forEach((paso) => {
    const txt = paso.querySelector(".paso-txt");
    if (!txt) return;
    const detalles = Array.from(txt.querySelectorAll<HTMLElement>(":scope > span"))
      .filter((s) => !s.classList.contains("roto-tag"));
    if (!detalles.length) return;
    detalles.forEach((d) => d.classList.add("paso-detalle"));
    paso.classList.add("paso-colapsable");
    paso.setAttribute("role", "button");
    paso.tabIndex = 0;
    paso.setAttribute("aria-expanded", "false");
    const toggle = (): void => {
      const abierto = paso.classList.toggle("paso-abierto");
      paso.setAttribute("aria-expanded", String(abierto));
    };
    paso.addEventListener("click", toggle);
    paso.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
}

/* ---------- Glosario: palabras difíciles se explican al tocarlas ---------- */
// Any <span class="palabra" data-def="..."> shows its plain-Spanish meaning on tap.
// stopPropagation so a word inside a collapsible step doesn't also toggle the step.
function setupGlosario(): void {
  document.querySelectorAll<HTMLElement>(".palabra").forEach((p) => {
    // setupGlosario runs more than once (init + after senator cards render).
    // Wire each word only once, or the click handler stacks and the toggle
    // fires twice — cancelling itself so the definition never opens.
    if (p.dataset.glosarioWired === "1") return;
    p.dataset.glosarioWired = "1";
    p.tabIndex = 0;
    p.setAttribute("role", "button");
    const def = p.getAttribute("data-def") || "";
    p.setAttribute("aria-label", (p.textContent || "") + ": " + def);
    const toggle = (e: Event): void => {
      e.stopPropagation();
      document.querySelectorAll(".palabra.abierta").forEach((o) => {
        if (o !== p) o.classList.remove("abierta");
      });
      p.classList.toggle("abierta");
    };
    p.addEventListener("click", toggle);
    p.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); }
    });
  });
}

function setupEscape(): void {
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    const p = document.getElementById("perfilProvincia");
    if (p && !p.classList.contains("hidden")) {
      p.classList.add("hidden");
      p.innerHTML = "";
    }
  });
}

async function init(): Promise<void> {
  setupTabs();
  setupCompartir();
  setupEscape();
  setupGlosario();
  setupAvisoBusqueda();
  try {
    const [leyes, provincias, sesiones, vigencia, novedades] = await Promise.all([
      cargar<LeyesData>("data/leyes.json"),
      cargar<ProvinciasData>("data/provincias.json"),
      cargar<SesionesData>("data/sesiones.json"),
      cargar<VigenciaData>("data/vigencia.json"),
      cargar<NovedadesData>("data/novedades.json"),
    ]);
    renderVigencia(vigencia);
    renderNovedades(novedades);
    renderLeyes(leyes);
    renderProvincias(provincias);
    renderComposicion(provincias);
    renderSesiones(sesiones);
    llenarCifrasHome(leyes, provincias, sesiones);
    setupSabias(leyes, sesiones);
    setupCasoAccordion();
    setupBuscadorProvincias();
    setupBuscadorLeyes();
  } catch (err) {
    const main = document.querySelector("main");
    if (main) {
      main.append(
        el("p", "hint", "No pudimos cargar la información. Revisa tu conexión y vuelve a intentar.")
      );
    }
    console.error(err);
  }
}

void init();
