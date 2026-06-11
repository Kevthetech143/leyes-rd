# Mapa de diseño — Política Sencilla RD
Capturado en vivo a 390×844 (móvil) el 2026-06-08.

Estructura común a todas las vistas:
- Barra superior azul: bandera + título "Política Sencilla RD" (es botón a Inicio) + subtítulo.
- Navegación: 5 pestañas tipo píldora (Inicio, Leyes, Provincias, Sesiones, Dinero). La activa se colorea con el acento de su sección.
- Cada vista: título con emoji + descripción corta + contenido.
- Pie: botones Compartir / Reportar o aportar.

## Inicio
- Etiqueta "BIENVENIDO" + titular grande "La política dominicana, fácil de entender".
- FLUJO 2026-06-10 (Pieza A): tira de héroe "🤔 ¿Sabías que…?" sobre las tarjetas — muestra un dato real a la vez (6 en total, todos de nuestros JSON: sueldo, deuda por persona, gasta vs gana, tamaño del Senado, última sesión, total de leyes), con UN botón que salta a su sección. Rota suave cada 6s, con puntos para elegir y botón de pausa; cada dato pinta la tira con el color de su sección; con prefers-reduced-motion arranca pausado. Inspirado en el carrusel del héroe de dgcp.gob.do.
- FLUJO 2026-06-10 (Pieza B): las 5 tarjetas se replantearon como recorrido — encabezado "¿Qué quieres aprender hoy? Te sugerimos este orden" y cada tarjeta lleva su número de paso (1–5) en el color de su sección, en el orden de la cadena El país → Leyes → Sesiones → Provincias → Dinero. La primera dice "Empezar aquí". Sigue siendo libre tocar cualquiera.
- Estado: limpio.

## El país (rojo bandera)
- Flujo "¿Quién manda?" con tarjetas-paso (pueblo → presidente → congreso → alcalde → jueces).
- "¿Cuándo y cómo voto?" en una caja azul (cuándo) + caja verde (cómo me preparo, con lista).
- Estado: limpio (ya seguía el modelo de tarjetas-paso; revisado 2026-06-10, sin cambios).

## Leyes (morado)
- UX 2026-06-10: una sola caja de intro compacta (¿Cómo funciona? + leyenda de estados adentro con estilo suave + nota de fuente al final), en vez de tres cajas apiladas.
- VIGENCIA 2026-06-10 (4ª sugerencia de usuario real): sub-sección "📅 ¿Cuáles leyes están por empezar?" justo bajo la intro. Caja de glosario que explica aprobada vs en vigencia (palabras tocables: promulgar, Gaceta Oficial, vigencia), luego dos grupos de tarjetas plegables: "🔜 Entran pronto" (riel ámbar) y "✅ Ya en vigencia (nuevas)" (riel verde), cada tarjeta con número de ley, título, fecha de vigencia y, al tocar, ¿qué es?/¿desde cuándo?/fuente. Cierra con nota plegable de la regla por defecto (Código Civil art. 1). Datos en data/vigencia.json, render en renderVigencia (src/app.ts).
- Acordeones "¿Por qué no veo quién votó?" y "¿Cómo se hace una ley?" (plegados) + buscador + sectores.
- Estado: limpio.

## Provincias (verde)
- Descripción de roles (senador, diputados, gobernador, alcaldes).
- Pista única "Toca una provincia para ver a su gente."
- Rejilla de 32 provincias, 2 columnas, con contador de cargos.
- UX 2026-06-10: en la ficha de cada líder, las 4 estadísticas (asistencia, comisiones, iniciativas, sueldo) ahora son una fila de pastillas tocables; la pastilla muestra el número corto y abre la frase completa al tocar. La función del cargo y las notas honestas siguen visibles.
- ARREGLO 2026-06-08: se quitó la pista duplicada (antes decía dos veces "toca una provincia").

## Sesiones (azul)
- Caja info: totales y asistencia; voto por senador no público.
- Pista: tocar "Asistencia".
- "Última sesión publicada" + tarjetas de sesión con votación y estado.
- Estado: limpio.

## Dinero (naranja)
- Pasos numerados del flujo general del dinero público (Congreso → Tesorería → SIGEF → ...).
- Caja "punto débil" (roja) + nota de fuente del flujo general.
- Bloque "🩺 ¿Cómo está el bolsillo del país?" (cuadrícula de tarjetas) arriba.
- Estudio de caso "desfalco del SENASA" (añadido 2026-06-08): cabecera con cifra, cadena paso a paso con el paso 1 en verde y los pasos 2–6 en rojo con etiqueta "Aquí se rompió", caja roja "la grieta de fondo", caja verde "¿Cómo se evita?", y nota de fuente del caso (Operación Cobra/PEPCA).
- UX 2026-06-10: las dos cajas "¿Cuánto es...?" se pliegan al tocar (la pregunta queda visible); las dos notas de fuente largas se pliegan tras "📚 Ver fuentes oficiales", sin tocar el texto.
- La tarjeta de Inicio "Dinero" anuncia "con un caso real".
- Estado: limpio.

## Flujo secuencial por sección (Pieza C, 2026-06-10)
- Cada sección sigue tres tiempos: (1) tarjeta "⏱️ En 30 segundos" arriba con la esencia en un párrafo; (2) el contenido que ya existía, intacto; (3) pie "¿Y ahora qué?" que enlaza la siguiente sección de la cadena con una línea de por qué.
- Cadena: El país → Leyes → Sesiones → Provincias → Dinero, circular (Dinero cierra de vuelta a El país con "¡Diste la vuelta completa!").
- El botón del pie navega con el mismo data-goto que las tarjetas de Inicio (manejador generalizado a cualquier [data-goto]).
- Dinero (Pieza D): tres sub-encabezados numerados estilo DGCP (1 cuánta plata tiene el país, 2 el viaje del dinero, 3 el caso real del SENASA) con aire entre bloques, para que las tres ideas no se lean pegadas.

## Pendientes UX detectados
- Ninguno crítico hoy. Vistas consistentes y legibles en móvil.
- Pasada UX por pestaña 2026-06-10: Inicio, El país y Sesiones ya seguían el modelo (tarjetas/acordeones agrupados) y se dejaron sin cambios a propósito; Leyes, Provincias y Dinero se reagruparon (ver arriba).
