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
  votos?: VotoFila[];
}

interface Sector {
  id: string;
  emoji: string;
  nombre: string;
  leyes: Ley[];
}

interface LeyesData {
  sectores: Sector[];
}

interface Lider {
  cargo: string;
  nombre: string;
  partido: string;
  resumen: string;
  registro: string;
}

interface Provincia {
  nombre: string;
  lideres: Lider[];
}

interface ProvinciasData {
  provincias: Provincia[];
}

interface Votacion {
  iniciativa: string;
  titulo: string;
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

async function cargar<T>(path: string): Promise<T> {
  const res = await fetch(path);
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
      el("span", "sector-count", sec.leyes.length + (sec.leyes.length === 1 ? " ley" : " leyes"))
    );
    const body = el("div", "sector-body");
    body.style.display = "none";

    sec.leyes.forEach((ley) => body.append(renderLey(ley)));

    head.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    card.append(head, body);
    cont.append(card);
  });
}

function renderLey(ley: Ley): HTMLElement {
  const wrap = el("div", "ley");
  wrap.append(el("p", "ley-titulo", ley.titulo));
  wrap.append(el("span", "ley-estado estado-" + ley.estado, estadoLabel[ley.estado] || ley.estado));

  const det = el("div", "ley-detalle");
  det.append(el("h4", null, "¿Qué es?"), el("p", null, ley.que_es));

  // Only show a real reason; otherwise a quiet note (the Senate source rarely states the motive).
  const sinMotivo = !ley.por_que || /^razón no indicada/i.test(ley.por_que);
  if (sinMotivo) {
    det.append(el("p", "nota-fuente", "Motivo: no publicado en la fuente oficial."));
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

  wrap.append(det);
  wrap.addEventListener("click", (e: Event) => {
    e.stopPropagation();
    wrap.classList.toggle("open");
  });
  return wrap;
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

function renderProvincias(data: ProvinciasData): void {
  const grid = el("div", "prov-grid");
  const perfil = byId("perfilProvincia");

  data.provincias.forEach((prov) => {
    const c = el("div", "prov-card");
    c.append(el("span", "prov-nombre", prov.nombre));
    const n = prov.lideres.length;
    c.append(el("span", "prov-count", n + (n === 1 ? " cargo" : " cargos")));
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
      prov.lideres.forEach((l) => {
        const block = el("div", "lider");
        block.append(
          el("p", null, "<b>" + l.nombre + "</b><span class='partido-chip'>" + l.partido + "</span>")
        );
        block.append(el("p", "lider-cargo", l.cargo));
        const fn = funcionDeCargo(l.cargo);
        if (fn) block.append(el("p", "lider-funcion", fn));
        if (l.resumen) block.append(el("p", null, l.resumen));
        if (esLegislador(l.cargo)) {
          block.append(el("p", "lider-cargo", "Registro de votos: " + l.registro));
        }
        perfil.append(block);
      });
      perfil.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    grid.append(c);
  });

  const host = byId("provincias");
  host.innerHTML = "";
  host.append(grid);
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

  data.sesiones.forEach((ses) => {
    const card = el("div", "sesion");

    const head = el("div", "sesion-head");
    head.append(
      el("span", "sesion-fecha", fechaLarga(ses.fecha)),
      el("span", "sesion-acta", "Acta " + ses.acta)
    );
    card.append(head);

    // Votaciones
    const vlist = el("div", "votaciones");
    ses.votaciones.forEach((v) => {
      const row = el("div", "votacion");
      row.append(el("p", "votacion-titulo", v.titulo));
      const meta = el("div", "votacion-meta");
      const aprob = /^aprob/i.test(v.resultado);
      const icono = aprob ? "✅ " : "•&nbsp;";
      meta.append(
        el("span", "v-iniciativa", "Iniciativa " + v.iniciativa),
        el("span", "v-conteo", v.a_favor + " a favor de " + v.presentes + " presentes"),
        el("span", aprob ? "v-resultado" : "v-resultado v-resultado-neutral", icono + v.resultado)
      );
      row.append(meta);
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

    cont.append(card);
  });
}

/* ---------- Tabs ---------- */
function setupTabs(): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const view = tab.dataset.view;
      byId("view-leyes").classList.toggle("hidden", view !== "leyes");
      byId("view-mapa").classList.toggle("hidden", view !== "mapa");
      byId("view-sesiones").classList.toggle("hidden", view !== "sesiones");
    });
  });
}

async function init(): Promise<void> {
  setupTabs();
  try {
    const [leyes, provincias, sesiones] = await Promise.all([
      cargar<LeyesData>("data/leyes.json"),
      cargar<ProvinciasData>("data/provincias.json"),
      cargar<SesionesData>("data/sesiones.json"),
    ]);
    renderLeyes(leyes);
    renderProvincias(provincias);
    renderSesiones(sesiones);
  } catch (err) {
    const main = document.querySelector("main");
    if (main) {
      main.append(
        el("p", "hint", "No se pudieron cargar los datos. Abre el sitio con un servidor web (no como archivo).")
      );
    }
    console.error(err);
  }
}

void init();
