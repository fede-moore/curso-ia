# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha
  histórica con trofeo, minutos estudiados en la semana, días estudiados en el mes y lista
  de sesiones.
- Datos en localStorage.
- docs/constitution.md redactado: 6 principios innegociables (simplicidad sin
  dependencias; la spec manda; lógica pura separada de la interfaz; tests con `node --test`
  sin instalar paquetes; datos del usuario sagrados y en hora local; código en inglés con
  interfaz y documentación en español).
- Spec 001 (mapa de calor) implementada y **cerrada**: `logic.js` (lógica pura con "hoy" como
  parámetro) y `tests/logic.test.js` (21 tests en verde con `node --test`, incluidos CL-10 y
  CL-19); sección y estilos del mapa en `index.html` y `styles.css`; pintado y eventos en
  `app.js`. Tareas T1…T5 completadas. Verificada en Chrome (RF-1…RF-8) con Lighthouse 100 en
  accesibilidad; la leyenda rotula el nivel 0 como "Sin estudio".
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- La mejor racha se calcula desde los días locales con sesiones, sin duplicar datos en
  localStorage.
- El trofeo de la mejor racha es solo un distintivo visual; no afecta su cálculo ni los
  datos guardados.
- Las fechas de sesiones en la lista se muestran como `DD-MM-YYYY` con `es-AR`; el
  campo sigue siendo `type="date"` y el navegador controla su presentación.
- La semana va de lunes a domingo (fecha local). Los minutos semanales se suman en vivo
  desde las sesiones, se muestran como "2 h 30 min" y no se persisten (valor derivado).
- El mes es el calendario local (día 1 al último día). Los "días estudiados del mes" son
  días distintos con al menos una sesión, sin contar fechas futuras; se muestran como
  "X días" (o "1 día") y no se persisten (valor derivado).
- Spec 001 (mapa de calor): rejilla fija de 12 semanas (84 celdas; última = semana en
  curso, con días futuros); filas lunes–domingo; 5 niveles (0 sin estudio + 4) según minutos
  del día sumados; umbrales 1–29 / 30–59 / 60–119 / ≥120; "futuro" es un estado aparte, no
  un nivel; detalle breve al pasar cursor, enfocar o tocar; sesión válida = fecha local
  válida + minutos entero > 0; entradas inválidas se ignoran sin borrar datos.
## Aprendizajes y errores a evitar
- Deduplicar las fechas antes de calcular rachas y excluir días futuros.
- Las decisiones por defecto de una spec son normativas: incorporarlas a los RF/NFR y
  dejar el anexo solo como registro. Fijar los límites de los umbrales como inclusivos.
- La lógica pura vive en `logic.js`, que funciona en el navegador (globales, cargado antes
  que `app.js`) y en Node (module.exports guardado para los tests). `app.js` solo tiene
  interfaz y localStorage.
## Próximos pasos
- (vacío por ahora)
