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
      el("span", "sector-count", String(sec.leyes.length))
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
  det.append(el("h4", null, "¿Por qué se propuso?"), el("p", null, ley.por_que));

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
  }

  wrap.append(det);
  wrap.addEventListener("click", (e: Event) => {
    e.stopPropagation();
    wrap.classList.toggle("open");
  });
  return wrap;
}

/* ---------- Provincias ---------- */
function renderProvincias(data: ProvinciasData): void {
  const grid = el("div", "prov-grid");
  const perfil = byId("perfilProvincia");

  data.provincias.forEach((prov) => {
    const c = el("div", "prov-card", prov.nombre);
    c.addEventListener("click", () => {
      perfil.classList.remove("hidden");
      perfil.innerHTML = "";
      perfil.append(el("h3", null, prov.nombre));
      prov.lideres.forEach((l) => {
        const block = el("div", "lider");
        block.append(
          el("p", null, "<b>" + l.nombre + "</b><span class='partido-chip'>" + l.partido + "</span>")
        );
        block.append(el("p", "lider-cargo", l.cargo));
        block.append(el("p", null, l.resumen));
        block.append(el("p", "lider-cargo", "Registro de votos: " + l.registro));
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

/* ---------- Tabs ---------- */
function setupTabs(): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const view = tab.dataset.view;
      byId("view-leyes").classList.toggle("hidden", view !== "leyes");
      byId("view-mapa").classList.toggle("hidden", view !== "mapa");
    });
  });
}

async function init(): Promise<void> {
  setupTabs();
  try {
    const [leyes, provincias] = await Promise.all([
      cargar<LeyesData>("data/leyes.json"),
      cargar<ProvinciasData>("data/provincias.json"),
    ]);
    renderLeyes(leyes);
    renderProvincias(provincias);
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
