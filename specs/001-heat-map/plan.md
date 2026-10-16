# Plan 001 — Mapa de calor de días estudiados

Plan de implementación de `specs/001-heat-map/spec.md`. Respeta `docs/constitution.md`:
HTML/CSS/JS puros sin dependencias ni build (P1), la spec activa manda (P2), lógica pura
sin DOM ni localStorage que recibe "hoy" como parámetro (P3), pruebas con `node --test` sin
instalar paquetes (P4), datos del usuario intactos y en hora local (P5), código en inglés y
documentación e interfaz en español (P6).

Cada sección indica qué RF/NFR cubre.

---

## 1. Archivos que se crean o modifican

| Archivo | Acción | Responsabilidad | Cubre |
|---|---|---|---|
| `logic.js` | **Crear** | Única fuente de la lógica pura: funciones de fechas/estadísticas (se trasladan desde `app.js`) y las nuevas funciones del mapa. Sin DOM, sin localStorage. Recibe "hoy" como parámetro. Exporta las funciones para el navegador (global) y para las pruebas (`module.exports` guardado). | RF-2, RF-3, RF-4, RF-5, RF-8; NFR-4, NFR-6 |
| `app.js` | **Modificar** | Capa de interfaz y datos: leer/guardar sesiones en localStorage, manejar el formulario, pintar la rejilla del mapa, tooltip y eventos. Queda sin funciones de cálculo: las llama desde `logic.js`. | RF-1, RF-6, RF-7, RF-8 |
| `index.html` | **Modificar** | Estructura: nueva sección del mapa (contenedor y leyenda) y carga de `logic.js` antes de `app.js`. | RF-1, RF-4 (leyenda), RF-7 |
| `styles.css` | **Modificar** | Estilos: rejilla 12×7, los 5 niveles, el estado "futuro", leyenda, resaltado y tooltip; responsive y contraste. | RF-2, RF-4, RF-5, RF-7; NFR-1, NFR-2 |
| `tests/logic.test.js` | **Crear** | Pruebas de la lógica con `node --test` y `node:assert`. Sin paquetes. | NFR-6; verificación de RF-2…RF-5, RF-8 |

No se crea `package.json`: no hay dependencias y `node --test` funciona sin configuración
(ver Decisión D8).

---

## 2. Funciones puras de lógica (en `logic.js`, con "hoy" como parámetro)

Todas son deterministas: mismo conjunto de sesiones + mismo "hoy" ⇒ mismo resultado. Ninguna
lee el reloj ni toca el DOM ni localStorage.

### 2.1 Reutilizadas (se trasladan desde `app.js`, sin cambiar su lógica)
Reubicarlas deja una única fuente y permite probarlas (P3, P4). Cubre NFR-4, NFR-6.

| Función | Qué hace |
|---|---|
| `formatInputDate(date)` | Fecha local → texto `AAAA-MM-DD`. |
| `parseLocalDate(texto)` | `AAAA-MM-DD` → objeto Date local a las 00:00 (sin UTC). |
| `addDays(date, n)` | Suma/resta días con `setDate` (seguro ante cambio de hora). |
| `isValidLocalDate(texto)` | Comprueba que el texto es una fecha local real. |
| `formatDisplayDate(texto)` | Fecha → `DD-MM-YYYY` con `es-AR`. |
| `getWeekRange(date)` / `getMonthRange(date)` | Rangos de semana (lunes–domingo) y de mes. |
| `calculateCurrentStreak`, `calculateBestStreak`, `getSessionDays` | Rachas (se siguen usando en la app). |
| `calculateWeekMinutes`, `calculateMonthDays`, `formatWeekMinutes` | Estadísticas del panel. |

### 2.2 Nuevas (para el mapa)

| Función | Entrada | Salida | Qué hace | Cubre |
|---|---|---|---|---|
| `isSessionValid(session)` | una sesión | booleano | Sesión válida = fecha local válida `AAAA-MM-DD` y minutos entero > 0. | RF-3, RF-8 |
| `getDayMinutesByDate(sessions)` | lista de sesiones | mapa `fecha → minutos` | Suma los minutos de las sesiones válidas por día. | RF-3 |
| `getIntensityLevel(minutes)` | minutos (número) | nivel 0–4 | Convierte minutos en nivel (0 = sin estudio). | RF-4 |
| `getHeatmapStartMonday(today)` | "hoy" | fecha (Date) | Lunes de inicio: el lunes de hace 11 semanas respecto de la semana de "hoy". | RF-2 |
| `buildHeatmap(sessions, today)` | sesiones + "hoy" | 12 columnas × 7 celdas | Construye la rejilla completa: cada celda con `{ fecha, minutos, nivel, esFuturo }`. | RF-2, RF-3, RF-4, RF-5 |
| `getDayLabel(cell)` | celda | texto | Etiqueta accesible: "16-10-2026, 45 minutos" / "sin estudio" / "día futuro". | RF-7; NFR-2 |

Nota (P6): los nombres de funciones y variables van en inglés; los comentarios y textos, en
español.

---

## 3. Algoritmo del mapa (pseudocódigo)

Comparar fechas como texto `AAAA-MM-DD` es válido porque el orden alfabético coincide con el
cronológico. Cubre RF-2, RF-3, RF-4, RF-5.

isSessionValid(session):
  si session es nulo → falso
  si el texto de session.date no es una fecha local válida (isValidLocalDate) → falso
  minutos := número(session.minutes)
  si minutos no es entero o minutos <= 0 → falso
  devolver verdadero

getDayMinutesByDate(sessions):
  totales := mapa vacío            // fecha → minutos
  para cada session en sessions:
    si no isSessionValid(session): continuar
    totales[session.date] := (totales[session.date] o 0) + número(session.minutes)
  devolver totales

getIntensityLevel(minutes):
  si minutes <= 0   → devolver 0
  si minutes <= 29  → devolver 1
  si minutes <= 59  → devolver 2
  si minutes <= 119 → devolver 3
  devolver 4

getHeatmapStartMonday(today):
  hoy := parseLocalDate(today)
  dia := hoy.getDay()                     // 0 = domingo
  offset := (dia == 0 ? -6 : 1 - dia)     // retroceder al lunes de esta semana
  lunesDeEstaSemana := addDays(hoy, offset)
  devolver addDays(lunesDeEstaSemana, -77)   // 11 semanas = 77 días

buildHeatmap(sessions, today):
  totales := getDayMinutesByDate(sessions)
  lunesInicio := getHeatmapStartMonday(today)
  semanas := lista vacía
  para w de 0 a 11:                       // 12 columnas
    columna := lista vacía
    para d de 0 a 6:                      // 7 días: lunes (0) … domingo (6)
      fecha := formatInputDate(addDays(lunesInicio, w*7 + d))
      esFuturo := fecha > today
      minutos := (esFuturo ? 0 : (totales[fecha] o 0))
      nivel := (esFuturo ? nulo : getIntensityLevel(minutos))
      columna.agregar({ fecha, minutos, nivel, esFuturo })
    semanas.agregar(columna)
  devolver semanas                         // 12 columnas × 7 celdas = 84 celdas

getDayLabel(cell):
  si cell.esFuturo     → devolver cell.fecha + " (día futuro)"
  si cell.minutos == 0 → devolver cell.fecha + " (sin estudio)"
  devolver cell.fecha + ", " + cell.minutos + " minutos"
  // el formato visible de la fecha lo aplica formatDisplayDate (DD-MM-YYYY, es-AR)

---

## 4. Cómo se pinta en la interfaz

Cubre RF-1, RF-4, RF-5, RF-6, RF-7; NFR-1, NFR-2, NFR-3.

### 4.1 Estructura en `index.html`
- Una sección nueva dentro del `main`, con `aria-label` "Mapa de calor de días estudiados".
- Un título ("Últimas 12 semanas") y un contenedor vacío para la rejilla que rellena `app.js`.
- Una leyenda fija: "Menos … Más" y una muestra del nivel 0 ("sin estudio") y del estado
  "futuro".
- Un elemento de tooltip (oculto, decorativo) que se muestra sobre el día señalado.
- Carga de `logic.js` **antes** de `app.js`.

### 4.2 Rejilla y celdas
- La rejilla es un contenedor en cuadrícula con **7 filas** y **flujo por columnas**: 84
  celdas se colocan solas en 12 columnas; la primera columna es la semana más antigua y la
  última, la semana en curso. Fila superior = lunes; inferior = domingo (RF-2).
- Cada celda es un elemento enfocable con un `aria-label` descriptivo (RF-7; NFR-2) y
  atributos de datos (fecha, minutos, estado) para el tooltip.
- Cada celda recibe una clase de nivel (`level-0` … `level-4`) o la clase de futuro
  (`is-future`). "Futuro" nunca es un nivel de intensidad (RF-4, RF-5).

### 4.3 Comportamiento en `app.js` (RF-6, RF-7)
- `renderHeatmap()`: pide la rejilla a `buildHeatmap(sessions, formatInputDate(new Date()))`,
  construye las celdas, las inyecta y engancha los eventos por delegación en el contenedor.
- Eventos: `mouseover`/`mouseout` (puntero), `focusin`/`focusout` (teclado) y `click`/`touch`
  (táctil). Muestran el tooltip con `getDayLabel` y resaltan la celda; en táctil, el detalle
  permanece hasta señalar otro día (RF-7).
- `render()` (que ya se llama tras guardar una sesión) añade `renderHeatmap()`: el mapa se
  actualiza al instante, sin recargar (RF-6).
- El tooltip solo aparece/desaparece al señalar; no se reconstruye la rejilla por hover
  (RF-3, NFR-3).

### 4.4 Estilos en `styles.css`
- Un solo tono con intensidad creciente del nivel 1 al nivel 4; el nivel 0 es neutro y el
  estado "futuro" es visualmente distinto de todos los niveles (RF-4, RF-5).
- Foco visible en las celdas y contraste suficiente en todos los niveles/estados (NFR-2).
- Rejilla al 100 % de ancho con celdas proporcionales: a 375 px se ve completa, sin scroll
  horizontal (NFR-1).

---

## 5. Decisiones técnicas (y alternativa descartada)

- **D1 — Lógica en un archivo aparte `logic.js`.** *Elegida:* separa de verdad la lógica de la
  interfaz y es directamente cargable por el navegador y por `node --test` (P3, P4).
  *Descartada:* dejar la lógica en `app.js` con una guarda para Node (menos archivos, pero
  mezcla interfaz y lógica y obliga a que las pruebas carguen código de DOM). *También
  descartada:* módulos ES (`type="module"`), prohibidos por P1 (no funcionan con `file://`).
- **D2 — Doble entorno con `module.exports` guardado.** *Elegida:* `logic.js` declara las
  funciones arriba y, al final, solo si existe `module`, las exporta; en el navegador quedan
  como globales y `app.js` las usa por su nombre. *Descartada:* objeto global tipo
  "namespace" (cambiaría todas las llamadas) e import/export (P1).
- **D3 — Celdas como botones nativos.** *Elegida:* un botón es enfocable, se activa con
  teclado y con toque, y admite `aria-label` sin código extra (NFR-2, RF-7). *Descartada:*
  "roving tabindex" con navegación por flechas (mejor con 84 celdas, pero más código del
  necesario para v1) y elementos no enfocables (no cumplen NFR-2).
- **D4 — Comparar fechas como texto `AAAA-MM-DD`.** *Elegida:* ya es el formato guardado y el
  orden es cronológico; simple y sin sorpresas de zona horaria (P5, NFR-4). *Descartada:*
  comparar objetos Date (más código y riesgo de horas).
- **D5 — "Futuro" como estado, no como nivel.** *Elegida:* mantiene la escala de 5 niveles
  limpia y evita tratarlo como estudio (RF-4, RF-5). *Descartada:* usar un nivel centinela
  (por ejemplo, -1), que ensucia la escala.
- **D6 — Reconstruir la rejilla solo al cambiar los datos; el hover solo mueve el tooltip.**
  *Elegida:* simple y suficiente con 84 celdas (NFR-3). *Descartada:* actualización
  incremental del DOM (complejidad innecesaria).
- **D7 — localStorage se queda en `app.js`.** *Elegida:* la lógica pura no debe tocar storage
  (P3); `app.js` ya lee/guarda y reutiliza `isValidLocalDate`. *Descartada:* poner el storage
  en `logic.js` (violaría P3).
- **D8 — Sin `package.json`; se ejecuta `node --test` directo.** *Elegida:* no hay
  dependencias ni pasos de build (P1, P4). *Descartada:* añadir script `npm test` (implica
  npm sin necesidad).
- **D9 — Reutilizar `Intl` `es-AR` para las etiquetas.** *Elegida:* coherencia con las fechas
  que ya muestra la app (RF-7, P6). *Descartada:* formatear a mano (duplicaría lógica).
- **D10 — Trasladar las funciones puras existentes a `logic.js`.** *Elegida:* una sola fuente
  para los ayudantes de fecha, todo el cálculo bajo pruebas (P3, P4). *Descartada:*
  duplicarlas en `logic.js` (dos versiones que se desincronizan). Riesgo: es una
  reubicación, no un cambio de comportamiento; las pruebas actúan de red de seguridad.

---

## 6. Estrategia de tests con `node --test`

Cubre NFR-6 y verifica RF-2, RF-3, RF-4, RF-5, RF-8. Sin instalar nada: solo `node:test` y
`node:assert`.

- **Ubicación:** `tests/logic.test.js`. **Cómo ejecutar:** `node --test` (o
  `node --test tests/logic.test.js`). No hay `package.json`.
- **Cómo se importa:** el test hace `require("../logic.js")`; por la guarda de D2, en Node no
  se ejecuta nada de DOM.
- **Regla (P4):** si un test queda en rojo, no se avanza.

Casos previstos:
1. `getIntensityLevel` — límites exactos: 0→0, 1→1, 29→1, 30→2, 59→2, 60→3, 119→3, 120→4,
   600→4 (RF-4, CL-11, CL-9).
2. `isSessionValid` — fecha inválida de formato, fecha imposible (p. ej. 2026-02-30), minutos
   0, negativos, no enteros o ausentes ⇒ inválida (RF-3, RF-8, CL-12).
3. `getDayMinutesByDate` — suma varias sesiones del mismo día; ignora las inválidas (RF-3,
   CL-1, CL-5).
4. `buildHeatmap` con "hoy" fijo — devuelve siempre 12 columnas × 7 celdas; la primera celda
   es lunes y la última columna contiene "hoy" (RF-2).
5. `buildHeatmap` — con sesiones de 45, 90 y 20 minutos en hoy, ayer y anteayer, los niveles
   son 2, 3 y 1 (coincide con los criterios de finalización) (RF-4).
6. `buildHeatmap` — los días futuros van marcados y con nivel nulo; no cuentan como
   estudiados; una sesión con fecha futura no genera nivel (RF-5, CL-4).
7. `buildHeatmap` — sesiones fuera del período de 12 semanas se ignoran (RF-2, CL-3).
8. `buildHeatmap` — sin sesiones, todos los días transcurridos quedan en nivel 0 y no hay
   error (RF-8, CL-6).
9. Fechas — `formatInputDate`/`parseLocalDate`/`addDays`/`isValidLocalDate` de ida y vuelta;
   una hora local 00:30 pertenece a su mismo día (CL-7).
10. Fechas — la rejilla de 84 días es contigua, sin huecos ni repetidos, a través del cambio
    de hora (CL-8) y del cambio de año (CL-14).
11. Regresión — racha actual, mejor racha, minutos de la semana y días del mes siguen dando
    los mismos resultados tras el traslado a `logic.js` (protege la reubicación de D10).

---

## 7. Cobertura de requisitos

| Requisito | Dónde se cubre |
|---|---|
| RF-1 Mostrar el mapa | `index.html` (§1, §4.1), `app.js` `renderHeatmap` (§4.3) |
| RF-2 Período y disposición | `buildHeatmap`, `getHeatmapStartMonday` (§2.2, §3); CSS de rejilla (§4.4) |
| RF-3 Minutos por día | `isSessionValid`, `getDayMinutesByDate` (§2.2, §3) |
| RF-4 Escala y leyenda | `getIntensityLevel` (§2.2, §3); clases de nivel y leyenda (§4.1, §4.2, §4.4) |
| RF-5 Sin estudio vs. futuro | `buildHeatmap` (`esFuturo`, `nivel`), CSS `is-future` (§3, §4.4) |
| RF-6 Actualización inmediata | `render()` llama a `renderHeatmap` (§4.3) |
| RF-7 Detalle de un día | `getDayLabel` (§2.2); eventos y tooltip (§4.2, §4.3) |
| RF-8 Datos inválidos y vacío | `isSessionValid` (§2.2); `loadSessions` en `app.js` (§1); test 8 (§6) |
| NFR-1 Responsive | CSS de rejilla proporcional (§4.4) |
| NFR-2 Accesibilidad | `aria-label` + celdas enfocables + foco visible + contraste (§4.2, §4.4) |
| NFR-3 Rendimiento | Rejilla de 84 celdas, sin trabajo en hover (§4.3, D6) |
| NFR-4 Datos, fechas y compatibilidad | Ayudantes de fecha locales (§2.1); storage intacto (§1, D7) |
| NFR-5 Idioma | Nombres en inglés, textos y docs en español (§2.2, P6) |
| NFR-6 Determinismo y verificación | Funciones puras con "hoy" (§2, §3) y tests (§6) |
| NFR-7 Simplicidad | Sin dependencias ni build; carga con doble clic (§1, D1, D2, D8) |
