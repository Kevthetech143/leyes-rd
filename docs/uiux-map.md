# Mapa de diseño — Política Sencilla RD
Capturado en vivo a 390×844 (móvil) el 2026-06-08.

Estructura común a todas las vistas:
- Barra superior azul: bandera + título "Política Sencilla RD" (es botón a Inicio) + subtítulo.
- Navegación: 5 pestañas tipo píldora (Inicio, Leyes, Provincias, Sesiones, Dinero). La activa se colorea con el acento de su sección.
- Cada vista: título con emoji + descripción corta + contenido.
- Pie: botones Compartir / Reportar o aportar.

## Inicio
- Etiqueta "BIENVENIDO" + titular grande "La política dominicana, fácil de entender".
- 4 tarjetas a color (Leyes morado, Provincias verde, Sesiones azul, Dinero naranja), cada una con emoji, una línea y "Explorar ▸".
- Estado: limpio.

## El país (rojo bandera)
- Flujo "¿Quién manda?" con tarjetas-paso (pueblo → presidente → congreso → alcalde → jueces).
- "¿Cuándo y cómo voto?" en una caja azul (cuándo) + caja verde (cómo me preparo, con lista).
- Estado: limpio (ya seguía el modelo de tarjetas-paso; revisado 2026-06-10, sin cambios).

## Leyes (morado)
- UX 2026-06-10: una sola caja de intro compacta (¿Cómo funciona? + leyenda de estados adentro con estilo suave + nota de fuente al final), en vez de tres cajas apiladas.
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

## Pendientes UX detectados
- Ninguno crítico hoy. Vistas consistentes y legibles en móvil.
- Pasada UX por pestaña 2026-06-10: Inicio, El país y Sesiones ya seguían el modelo (tarjetas/acordeones agrupados) y se dejaron sin cambios a propósito; Leyes, Provincias y Dinero se reagruparon (ver arriba).
