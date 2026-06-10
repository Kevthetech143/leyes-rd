"use strict";
// Leyes RD — fácil. TypeScript source.
// Compiles to site/app.js via `npm run build` (tsc). Loads sample JSON,
// groups laws by sector, expandable cards + province profiles.
const estadoLabel = {
    aprobada: "✅ Aprobada",
    votando: "🗳️ En votación",
    rechazada: "❌ Rechazada",
};
const votoLabel = { si: "👍 Sí", no: "👎 No", ausente: "➖ Ausente" };
const votoClass = { si: "voto-si", no: "voto-no", ausente: "voto-aus" };
async function cargar(path) {
    const res = await fetch(path);
    if (!res.ok)
        throw new Error("No se pudo cargar " + path);
    return (await res.json());
}
function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls)
        n.className = cls;
    if (html !== undefined)
        n.innerHTML = html;
    return n;
}
function byId(id) {
    const n = document.getElementById(id);
    if (!n)
        throw new Error("Falta el elemento #" + id);
    return n;
}
/* ---------- Leyes ---------- */
function renderLeyes(data) {
    const cont = byId("sectores");
    cont.innerHTML = "";
    data.sectores.forEach((sec) => {
        const card = el("div", "sector");
        const head = el("div", "sector-head");
        head.append(el("span", "sector-emoji", sec.emoji), el("h3", "sector-title", sec.nombre), el("span", "sector-count", sec.leyes.length + (sec.leyes.length === 1 ? " ley" : " leyes")), el("span", "sector-chev", "▸"));
        const body = el("div", "sector-body");
        body.style.display = "none";
        sec.leyes.forEach((ley) => body.append(renderLey(ley)));
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
        head.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                head.click();
            }
        });
        card.append(head, body);
        cont.append(card);
    });
}
function renderLey(ley) {
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
    }
    else {
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
    }
    else {
        det.append(el("p", "nota-fuente", "Voto de cada legislador: el Senado aún no lo hace público."));
    }
    wrap.append(det);
    // Keyboard accessible: behave like an expandable button.
    wrap.setAttribute("role", "button");
    wrap.tabIndex = 0;
    wrap.setAttribute("aria-expanded", "false");
    wrap.addEventListener("click", (e) => {
        e.stopPropagation();
        const abierto = wrap.classList.toggle("open");
        wrap.setAttribute("aria-expanded", String(abierto));
    });
    wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            wrap.click();
        }
    });
    return wrap;
}
/* ---------- Provincias ---------- */
// One kid-friendly explanation per ROLE, matched by the start of the cargo.
// Keeps the language identical for every person with the same job.
function funcionDeCargo(cargo) {
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
function esLegislador(cargo) {
    const c = cargo.toLowerCase();
    return c.startsWith("senador") || c.startsWith("diputad");
}
function esElecto(cargo) {
    const c = cargo.toLowerCase();
    return c.startsWith("senador") || c.startsWith("diputad") || c.startsWith("alcalde")
        || c.startsWith("alcaldesa") || c.startsWith("regidor") || c.startsWith("director");
}
function sueldoDeCargo(cargo) {
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
    return null;
}
function iniciales(nombre) {
    var _a, _b;
    const palabras = nombre.trim().split(/\s+/).filter((w) => w.length > 2);
    const ini = (((_a = palabras[0]) === null || _a === void 0 ? void 0 : _a[0]) || "") + (((_b = palabras[1]) === null || _b === void 0 ? void 0 : _b[0]) || "");
    return ini.toUpperCase() || "·";
}
const ORDEN_GRUPOS = ["senador", "diputad", "gobernador", "alcalde", "director", "regidor", "otros"];
const ETIQUETA_GRUPO = {
    senador: "Senador/a",
    diputad: "Diputados/as",
    gobernador: "Gobernador/a",
    alcalde: "Alcaldes/sas",
    director: "Directores/as de distrito",
    regidor: "Regidores/as",
    otros: "Otros",
};
function grupoDeCargo(cargo) {
    const c = cargo.toLowerCase();
    return ORDEN_GRUPOS.find((k) => k !== "otros" && c.startsWith(k)) || "otros";
}
function renderLider(l) {
    const block = el("div", "lider");
    const cab = el("div", "lider-cab");
    cab.append(el("span", "avatar", iniciales(l.nombre)));
    const ident = el("div", "lider-ident");
    ident.append(el("p", "lider-nombre", "<b>" + l.nombre + "</b><span class='partido-chip'>" + l.partido + "</span>"));
    ident.append(el("p", "lider-cargo", l.cargo));
    cab.append(ident);
    block.append(cab);
    if (esElecto(l.cargo)) {
        block.append(el("p", "lider-dato", "🗓️ En el cargo: 2024–2028 (elegido por voto)"));
    }
    const fn = funcionDeCargo(l.cargo);
    if (fn)
        block.append(el("p", "lider-funcion", fn));
    if (l.resumen)
        block.append(el("p", null, l.resumen));
    // --- Report-card lines. Each appears only when its data is present, so a
    //     leader without data renders exactly as before. ---
    // Lane 1: plenary attendance.
    if (l.asistencia && l.asistencia.total > 0) {
        const a = l.asistencia;
        block.append(el("p", "lider-dato", "📅 Asistencia: estuvo en <b>" + a.presentes + " de " + a.total +
            "</b> sesiones del Pleno (" + a.periodo + ")."));
    }
    // Lane 2: committees the senator works in.
    if (l.comisiones && l.comisiones.length) {
        block.append(el("p", "lider-dato", "🗂️ Trabaja en " + l.comisiones.length + " comisiones: " + l.comisiones.join(", ") + "."));
    }
    // Lane 3: bills proposed or co-proposed.
    if (typeof l.iniciativas_propuestas === "number") {
        const n = l.iniciativas_propuestas;
        block.append(el("p", "lider-dato", "📜 Ha propuesto o copropuesto <b>" + n + "</b> " +
            (n === 1 ? "iniciativa" : "iniciativas") + " en este período."));
    }
    // Lane 4: base monthly salary, per role, from the public payroll.
    const sueldo = sueldoDeCargo(l.cargo);
    if (sueldo) {
        block.append(el("p", "lider-dato", "💰 Sueldo: <b>" + sueldo.monto + " al mes</b>, según la " + sueldo.fuente +
            " de " + sueldo.mes + ". Lo pagan los impuestos de todos."));
    }
    // Honest note for roles that don't legislate: explain why there are no
    // attendance/bill stats instead of leaving the card looking unfinished.
    const cargoLower = l.cargo.toLowerCase();
    if (cargoLower.startsWith("gobernador")) {
        block.append(el("p", "nota-fuente", "El gobernador no hace leyes ni vota en el Congreso, por eso no tiene asistencia ni iniciativas. Su sueldo no sale en una nómina central pública; estamos buscando la oficial."));
    }
    else if (cargoLower.startsWith("alcalde")) {
        block.append(el("p", "nota-fuente", "El alcalde trabaja en el ayuntamiento, no en el Congreso, por eso no tiene asistencia ni iniciativas de leyes. Su sueldo lo publica cada ayuntamiento; estamos reuniendo esas nóminas."));
    }
    else if (cargoLower.startsWith("diputad")) {
        block.append(el("p", "nota-fuente", "Asistencia, comisiones e iniciativas de los diputados: la Cámara las publica distinto al Senado; estamos trabajando en traerlas."));
    }
    if (esLegislador(l.cargo)) {
        block.append(el("p", "lider-cargo", "Registro de votos: " + l.registro));
    }
    return block;
}
function renderProvincias(data) {
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
        c.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                c.click();
            }
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
            const grupos = {};
            prov.lideres.forEach((l) => {
                const k = grupoDeCargo(l.cargo);
                (grupos[k] = grupos[k] || []).push(l);
            });
            ORDEN_GRUPOS.forEach((k) => {
                const arr = grupos[k];
                if (!arr || !arr.length)
                    return;
                const etq = ETIQUETA_GRUPO[k] || "Otros";
                const titulo = arr.length > 1 ? etq + " (" + arr.length + ")" : etq;
                perfil.append(el("h4", "grupo-titulo", titulo));
                arr.forEach((l) => perfil.append(renderLider(l)));
            });
            // Honest note when this province's mayors aren't loaded yet.
            if (!grupos["alcalde"]) {
                perfil.append(el("p", "nota-fuente", "Alcaldes: aún por añadir. Estamos completando esta provincia con datos oficiales. " +
                    "¿Conoces a tu alcalde? <a href=\"https://github.com/Kevthetech143/leyes-rd/issues/new\" target=\"_blank\" rel=\"noopener\">Ayúdanos a completarlo</a>."));
            }
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
/* ---------- Sesiones ---------- */
const MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
function fechaLarga(iso) {
    // iso = "2026-04-15"
    const parts = iso.split("-");
    if (parts.length !== 3)
        return iso;
    const y = parts[0];
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    const mes = MESES[m] || parts[1];
    return d + " de " + mes + " de " + y;
}
const estadoAsist = {
    presente: "✅ Presente",
    ausente: "➖ Ausente",
    excusado: "📝 Excusado",
};
function renderSesiones(data) {
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
        const card = el("details", "sesion");
        if (idx === 0)
            card.open = true;
        const head = el("summary", "sesion-head");
        head.append(el("span", "sesion-fecha", fechaLarga(ses.fecha)), el("span", "sesion-conteo", ses.votaciones.length + " votaciones"), el("span", "sesion-acta", "Acta " + ses.acta), el("span", "sesion-chev", "▸"));
        card.append(head);
        // Votaciones
        const vlist = el("div", "votaciones");
        ses.votaciones.forEach((v) => {
            const row = el("div", "votacion");
            // Plain title up front; the official legalese title tucks behind a tap.
            if (v.titulo_facil) {
                row.append(el("p", "votacion-titulo", v.titulo_facil));
                const oficial = el("details", "oficial");
                oficial.append(el("summary", null, "📜 Ver nombre oficial"), el("p", "votacion-titulo-oficial", v.titulo));
                row.append(oficial);
            }
            else {
                row.append(el("p", "votacion-titulo", v.titulo));
            }
            const meta = el("div", "votacion-meta");
            const aprob = /^aprob/i.test(v.resultado);
            const icono = aprob ? "✅ " : "•&nbsp;";
            meta.append(el("span", "v-iniciativa", "Iniciativa " + v.iniciativa), el("span", "v-conteo", v.a_favor + " de " + v.presentes + " presentes votaron a favor"), el("span", aprob ? "v-resultado" : "v-resultado v-resultado-neutral", icono + v.resultado));
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
        }
        else if (ses.asistencia.ausentes === 0) {
            sum.innerHTML = "👥 Asistencia: nadie presentó excusa ese día";
        }
        else {
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
            body.append(el("p", "nota-fuente", "Lista de senadores que presentaron excusa, según el acta oficial. El acta no publica una cifra total de presentes."));
        }
        else if (ses.asistencia.ausentes === 0) {
            body.append(el("p", null, "Según el acta, ningún senador presentó excusa ese día."));
        }
        else {
            body.append(el("p", "nota-fuente", "La lista por nombre no está disponible de forma legible para esta sesión."));
        }
        asistWrap.append(body);
        card.append(asistWrap);
        cont.append(card);
    });
}
/* ---------- Buscadores (search) ---------- */
// Accent-insensitive, lowercase match so "san cristobal" finds "San Cristóbal".
function normaliza(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
// Live filter of province cards by name.
function setupBuscadorProvincias() {
    const inp = document.getElementById("buscarProvincia");
    if (!inp)
        return;
    const aviso = document.getElementById("provNoResultado");
    inp.addEventListener("input", () => {
        const q = normaliza(inp.value);
        let visibles = 0;
        document.querySelectorAll("#provincias .prov-card").forEach((c) => {
            var _a;
            const nom = normaliza(((_a = c.querySelector(".prov-nombre")) === null || _a === void 0 ? void 0 : _a.textContent) || "");
            const match = !q || nom.includes(q);
            c.classList.toggle("hidden", !match);
            if (match)
                visibles++;
        });
        if (aviso)
            aviso.classList.toggle("hidden", !(q && visibles === 0));
    });
}
// Live filter of law sectors by topic or law title; opens matching sectors.
function setupBuscadorLeyes() {
    const inp = document.getElementById("buscarLey");
    if (!inp)
        return;
    const aviso = document.getElementById("leyNoResultado");
    inp.addEventListener("input", () => {
        const q = normaliza(inp.value);
        let visibles = 0;
        document.querySelectorAll("#sectores .sector").forEach((sec) => {
            const match = !q || normaliza(sec.textContent || "").includes(q);
            sec.classList.toggle("hidden", !match);
            const body = sec.querySelector(".sector-body");
            const head = sec.querySelector(".sector-head");
            const abrir = Boolean(q && match);
            if (body)
                body.style.display = abrir ? "block" : "none";
            sec.classList.toggle("open", abrir);
            head === null || head === void 0 ? void 0 : head.setAttribute("aria-expanded", String(abrir));
            if (match)
                visibles++;
        });
        if (aviso)
            aviso.classList.toggle("hidden", !(q && visibles === 0));
    });
}
/* ---------- Navegación ---------- */
// Every view id, keyed by the data-view / data-goto name.
const VISTAS = {
    home: "view-home",
    pais: "view-pais",
    leyes: "view-leyes",
    mapa: "view-mapa",
    sesiones: "view-sesiones",
    dinero: "view-dinero",
};
function mostrarVista(view) {
    // Show only the requested section, hide the rest.
    Object.keys(VISTAS).forEach((k) => {
        byId(VISTAS[k]).classList.toggle("hidden", k !== view);
    });
    // Sync the tab bar state (highlight + aria).
    document.querySelectorAll(".tab").forEach((t) => {
        const activo = t.dataset.view === view;
        t.classList.toggle("active", activo);
        t.setAttribute("aria-selected", activo ? "true" : "false");
    });
    // Bring the new section into view on small screens.
    window.scrollTo({ top: 0, behavior: "auto" });
}
function setupTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            const view = tab.dataset.view;
            if (view)
                mostrarVista(view);
        });
    });
    // Big home cards jump straight into a section.
    document.querySelectorAll(".home-card").forEach((card) => {
        card.addEventListener("click", () => {
            const dest = card.dataset.goto;
            if (dest)
                mostrarVista(dest);
        });
    });
    // Tapping the site title returns home.
    const homeLink = document.getElementById("homeLink");
    if (homeLink)
        homeLink.addEventListener("click", () => mostrarVista("home"));
}
/* ---------- Compartir y participar ---------- */
function copiarEnlace(url, btn) {
    var _a;
    const prev = btn.textContent;
    const ok = () => {
        btn.textContent = "✅ ¡Copiado!";
        window.setTimeout(() => { if (prev)
            btn.textContent = prev; }, 1600);
    };
    const nav = navigator;
    if ((_a = nav.clipboard) === null || _a === void 0 ? void 0 : _a.writeText)
        nav.clipboard.writeText(url).then(ok, ok);
    else
        ok();
}
function setupCompartir() {
    const url = "https://kevthetech143.github.io/leyes-rd/";
    const titulo = "Política Sencilla RD";
    const texto = "Entiende la política dominicana fácil: leyes, provincias, el Senado y el dinero público.";
    const wa = document.getElementById("waShare");
    if (wa)
        wa.href = "https://wa.me/?text=" + encodeURIComponent(texto + " " + url);
    const sb = document.getElementById("shareBtn");
    if (sb) {
        sb.addEventListener("click", () => {
            const nav = navigator;
            if (nav.share)
                nav.share({ title: titulo, text: texto, url }).catch(() => { });
            else
                copiarEnlace(url, sb);
        });
    }
    const cb = document.getElementById("copyBtn");
    if (cb)
        cb.addEventListener("click", () => copiarEnlace(url, cb));
    const fs = document.getElementById("footShare");
    if (fs) {
        fs.addEventListener("click", () => {
            const nav = navigator;
            if (nav.share)
                nav.share({ title: titulo, text: texto, url }).catch(() => { });
            else
                copiarEnlace(url, fs);
        });
    }
}
/* ---------- Inicio: cifras reales vivas ---------- */
// Prints one real count per home card, computed from the data already loaded.
// Numbers only — never invented; if data is missing the line stays empty.
function llenarCifrasHome(leyes, prov, ses) {
    const setC = (k, t) => {
        const e = document.querySelector('[data-cifra="' + k + '"]');
        if (e)
            e.textContent = t;
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
/* ---------- Dinero: cada paso del caso SENASA se abre al tocarlo ---------- */
// Turns the hardcoded case steps into tap-to-reveal, reusing the accordion idiom.
// Scoped to #caso-senasa so the general money flow stays as-is.
function setupCasoAccordion() {
    const caso = document.getElementById("caso-senasa");
    if (!caso)
        return;
    caso.querySelectorAll(".flujo-graf .paso").forEach((paso) => {
        const txt = paso.querySelector(".paso-txt");
        if (!txt)
            return;
        const detalles = Array.from(txt.querySelectorAll(":scope > span"))
            .filter((s) => !s.classList.contains("roto-tag"));
        if (!detalles.length)
            return;
        detalles.forEach((d) => d.classList.add("paso-detalle"));
        paso.classList.add("paso-colapsable");
        paso.setAttribute("role", "button");
        paso.tabIndex = 0;
        paso.setAttribute("aria-expanded", "false");
        const toggle = () => {
            const abierto = paso.classList.toggle("paso-abierto");
            paso.setAttribute("aria-expanded", String(abierto));
        };
        paso.addEventListener("click", toggle);
        paso.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
            }
        });
    });
}
/* ---------- Glosario: palabras difíciles se explican al tocarlas ---------- */
// Any <span class="palabra" data-def="..."> shows its plain-Spanish meaning on tap.
// stopPropagation so a word inside a collapsible step doesn't also toggle the step.
function setupGlosario() {
    document.querySelectorAll(".palabra").forEach((p) => {
        p.tabIndex = 0;
        p.setAttribute("role", "button");
        const def = p.getAttribute("data-def") || "";
        p.setAttribute("aria-label", (p.textContent || "") + ": " + def);
        const toggle = (e) => {
            e.stopPropagation();
            document.querySelectorAll(".palabra.abierta").forEach((o) => {
                if (o !== p)
                    o.classList.remove("abierta");
            });
            p.classList.toggle("abierta");
        };
        p.addEventListener("click", toggle);
        p.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(e);
            }
        });
    });
}
function setupEscape() {
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape")
            return;
        const p = document.getElementById("perfilProvincia");
        if (p && !p.classList.contains("hidden")) {
            p.classList.add("hidden");
            p.innerHTML = "";
        }
    });
}
async function init() {
    setupTabs();
    setupCompartir();
    setupEscape();
    setupGlosario();
    try {
        const [leyes, provincias, sesiones] = await Promise.all([
            cargar("data/leyes.json"),
            cargar("data/provincias.json"),
            cargar("data/sesiones.json"),
        ]);
        renderLeyes(leyes);
        renderProvincias(provincias);
        renderSesiones(sesiones);
        llenarCifrasHome(leyes, provincias, sesiones);
        setupCasoAccordion();
        setupBuscadorProvincias();
        setupBuscadorLeyes();
    }
    catch (err) {
        const main = document.querySelector("main");
        if (main) {
            main.append(el("p", "hint", "No pudimos cargar la información. Revisa tu conexión y vuelve a intentar."));
        }
        console.error(err);
    }
}
void init();
