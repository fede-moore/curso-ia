# Tasks 001 — Mapa de calor de días estudiados

Lista de tareas derivada de `plan.md` (y de `spec.md`). Orden pensado para TDD: primero la
lógica pura con sus pruebas y, después, la interfaz. Marca `[x]` al completar cada tarea.

Regla (constitución P4): no se avanza con tests en rojo.

---

- [x] **T1 — Lógica pura y sus pruebas** (`logic.js` + `tests/logic.test.js`)
  - Objetivo: crear la lógica pura del mapa, sin DOM ni localStorage, con "hoy" como
    parámetro, y cubrirla con `node --test`.
  - Archivos: crear `logic.js` y `tests/logic.test.js`.
  - Pasos: (1) escribir primero los tests; (2) implementar las funciones en `logic.js` hasta
    ponerlos en verde.
  - Contenido: funciones de fecha reutilizadas (`formatInputDate`, `parseLocalDate`,
    `addDays`, `isValidLocalDate`, `formatDisplayDate`) y nuevas (`isSessionValid`,
    `getDayMinutesByDate`, `getIntensityLevel`, `getHeatmapStartMonday`, `buildHeatmap`,
    `getDayLabel`).
  - Cubre: RF-2, RF-3, RF-4, RF-5 y la parte de validación de RF-8; NFR-4, NFR-6.
  - Hecho cuando: `node --test` pasa en verde (límites, inválidos, futuros, fuera de período,
    vacío, cambio de hora y de año, fechas 00:30).
  - Depende de: —

- [x] **T2 — Integrar la lógica en la aplicación** (`app.js`, `index.html`)
  - Objetivo: que el navegador use `logic.js` y quitar de `app.js` las funciones trasladadas,
    sin cambiar el comportamiento visible.
  - Archivos: modificar `index.html` (cargar `logic.js` antes de `app.js`) y `app.js`.
  - Cubre: NFR-4, NFR-7; protege los RF existentes (racha, semana, mes).
  - Hecho cuando: la app abre con doble clic y muestra lo mismo que antes (rachas, semana,
    mes y lista), sin errores en consola.
  - Depende de: T1.

- [x] **T3 — Estructura y estilos del mapa** (`index.html`, `styles.css`)
  - Objetivo: marcado de la sección, la leyenda y los estilos de la rejilla, niveles, estado
    futuro, foco y responsive.
  - Archivos: modificar `index.html` y `styles.css`.
  - Cubre: RF-1 (parte visual), RF-4 (leyenda y niveles), RF-5 (estilo de futuro); NFR-1,
    NFR-2 (contraste y foco visible).
  - Hecho cuando: la sección y la leyenda se ven bien a 375 px y en escritorio, sin scroll
    horizontal.
  - Depende de: T2.

- [x] **T4 — Pintar el mapa y su interacción** (`app.js`)
  - Objetivo: rellenar la rejilla desde `buildHeatmap`, mostrar el tooltip y actualizar en
    vivo al guardar una sesión.
  - Archivos: modificar `app.js` (`renderHeatmap` + eventos, y `render()` llamándolo).
  - Cubre: RF-1, RF-2, RF-3, RF-5, RF-6, RF-7; NFR-3.
  - Hecho cuando: al registrar 45/90/20 minutos en hoy/ayer/anteayer el mapa muestra niveles
    2/3/1; los días futuros no cuentan; el detalle aparece con cursor, teclado y toque; el
    mapa se actualiza sin recargar.
  - Depende de: T3.

- [x] **T5 — Verificación final y accesibilidad** (sin archivos nuevos)
  - Objetivo: comprobación integral con Chrome DevTools y cierre de la spec.
  - Comprobaciones: consola sin errores; vista móvil a 375 px; recorrido con teclado y lector
    de pantalla; no se pierde ni modifica ninguna sesión; `node --test` en verde.
  - Cubre: NFR-1, NFR-2, NFR-4; criterios de finalización de la spec.
  - Depende de: T4.

---

## Cierre de la spec 001

- [x] **Verificación de RF/NFR y cierre** — todos los requisitos comprobados.
  - `node --test`: **21/21 en verde** (se añadieron CL-10 y CL-19 a los 19 iniciales).
  - Chrome DevTools: RF-1…RF-8 comprobados; ejemplo 45/90/20 → niveles 2/3/1; futuros no
    cuentan; consola sin errores; sin scroll horizontal a 375 px ni en escritorio.
  - Accesibilidad: **Lighthouse 100** (celdas enfocables con `aria-label`, tooltip con
    teclado).
  - RF-4.3 resuelto: la leyenda rotula el nivel 0 como "Sin estudio".
  - Datos: ninguna sesión se pierde ni se modifica (localStorage intacto tras las pruebas).
  - Estado: **spec 001 cumplida y cerrada.**
