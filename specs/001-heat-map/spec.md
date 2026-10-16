# Spec 001 — Mapa de calor de días estudiados

> **Estado: cumplida y cerrada** (2026-10-16). RF-1…RF-8 y NFR-1…NFR-7 implementados y
> verificados; 21/21 tests en verde (`node --test`) y Lighthouse de accesibilidad 100.

## 1. Contexto y objetivo
El Diario de Estudio ya registra sesiones (fecha, tema y minutos) y resume el progreso con
la racha actual, la mejor racha, los minutos de la semana y los días estudiados del mes.
Esos números dicen *cuánto* se estudia, pero no *cómo se reparte* el estudio en el tiempo.

Objetivo: añadir un mapa de calor, inspirado en el gráfico de contribuciones de GitHub, que
muestre los días de las últimas semanas. Cada día transcurrido se colorea en cinco niveles
(nivel 0 = sin estudio, y 1 a 4 de mayor intensidad a más minutos). El fin es motivar (ver
el hábito de un vistazo) y detectar huecos, sin pedir al usuario ninguna acción nueva ni
añadir complejidad.

## 2. Usuarios
- Usuario principal: una persona que registra sus propias sesiones de estudio y consulta la
  web sola. Sin cuentas, sin roles y sin varios usuarios.
- Contexto de uso: individual, con los datos guardados en su propio equipo, tanto en el
  móvil como en el escritorio.

## 3. Historias de usuario
- HU-1: Como estudiante, quiero ver un mapa de calor de las últimas semanas para reconocer
  de un vistazo qué días he estudiado.
- HU-2: Como estudiante, quiero que un día con más minutos se vea más intenso que uno con
  menos, para percibir la diferencia entre mis propios días.
- HU-3: Como estudiante, quiero consultar cuántos minutos estudié un día concreto sin
  tener que buscarlo en la lista de sesiones.
- HU-4: Como estudiante, quiero que el mapa no falle ni me haga perder datos aunque algo de
  lo guardado esté dañado o no haya ninguna sesión todavía.
- HU-5: Como estudiante que usa el móvil, quiero que el mapa se lea bien en una pantalla
  pequeña y no me obligue a hacer zoom ni scroll horizontal.

## 4. Requisitos funcionales

### RF-1 — Mostrar el mapa de calor
Criterios de aceptación (EARS):
- [Ubicuo] El sistema debe mostrar el mapa de calor en la página principal, junto a las
  estadísticas existentes, sin requerir ninguna acción del usuario.
- [Evento: Cuando] la página cargue, el sistema debe mostrar el mapa ya calculado a partir
  de las sesiones guardadas.

### RF-2 — Período y disposición
La rejilla siempre tiene 12 columnas (una por semana natural) y 7 filas (una por día de la
semana): 84 celdas en total. La última columna es la semana en curso.
Criterios de aceptación (EARS):
- [Ubicuo] El sistema debe mostrar siempre 12 columnas de semanas naturales (de lunes a
  domingo) y 7 filas por columna (de lunes, arriba, a domingo, abajo), en total 84 celdas.
- [Ubicuo] El sistema debe ordenar las columnas de la semana más antigua (izquierda) a la
  semana actual (derecha).
- [Ubicuo] El sistema debe usar la fecha local del usuario para determinar la semana actual
  y, con ella, el inicio del período.
- [Ubicuo] El sistema debe mostrar los días posteriores a hoy como días futuros, dentro de
  sus celdas, aunque la semana en curso quede incompleta.

### RF-3 — Minutos por día
Criterios de aceptación (EARS):
- [Ubicuo] El sistema debe considerar "sesión válida" toda sesión con una fecha local válida
  (formato `AAAA-MM-DD`) y minutos que sean un número entero mayor que 0.
- [Ubicuo] El sistema debe calcular los minutos de cada día como la suma de los minutos de
  todas las sesiones válidas de ese día, en fecha local.
- [Evento: Cuando] varias sesiones válidas compartan un mismo día, el sistema debe sumar sus
  minutos en un único valor diario.

### RF-4 — Escala de intensidad y leyenda
Criterios de aceptación (EARS):
- [Ubicuo] El sistema debe asignar a cada día transcurrido un nivel de 0 a 4 según sus
  minutos totales: 0 → nivel 0; 1–29 → nivel 1; 30–59 → nivel 2; 60–119 → nivel 3;
  120 o más → nivel 4 (el límite inferior de cada rango es inclusivo).
- [Ubicuo] El sistema debe representar la intensidad con un único tono, del nivel 1 (menos
  intenso) al nivel 4 (más intenso), de modo que cada nivel se distinga del anterior.
- [Ubicuo] El sistema debe mostrar una leyenda que explique la escala de "menos" a "más"
  minutos y qué significa el nivel 0 (día sin estudio).
- [Ubicuo] El estado "futuro" no debe recibir ningún nivel de intensidad.

### RF-5 — Días sin estudio y días futuros
Criterios de aceptación (EARS):
- [No deseado: Si] un día transcurrido del período no tiene sesiones válidas, entonces el
  sistema debe mostrarlo como nivel 0 (sin estudio).
- [No deseado: Si] un día del período es posterior a hoy, entonces el sistema debe mostrarlo
  como día futuro, con un estilo distinto de todos los niveles de intensidad.
- [Ubicuo] El sistema no debe contar los días futuros como días estudiados en ningún valor
  derivado.

### RF-6 — Actualización inmediata
Criterios de aceptación (EARS):
- [Evento: Cuando] el usuario registre una sesión, el sistema debe recalcular y actualizar el
  mapa de inmediato, sin recargar la página.
- [Ubicuo] El sistema no debe requerir recargar la página para reflejar la sesión recién
  registrada.

### RF-7 — Detalle de un día
El detalle es una etiqueta breve con la fecha y los minutos; no abre sesiones ni navega.
Criterios de aceptación (EARS):
- [Evento: Cuando] el usuario señale un día con el cursor o con el foco de teclado, el
  sistema debe mostrar su fecha y el total de minutos de ese día.
- [Evento: Cuando] el usuario toque un día en pantalla táctil, el sistema debe mostrar el
  mismo detalle y mantenerlo visible hasta que señale otro día.
- [Evento: Cuando] el usuario señale un día sin estudio o un día futuro, el sistema debe
  indicar que ese día no tiene minutos ("sin estudio" o "día futuro").
- [Ubicuo] El sistema debe destacar visualmente el día señalado mientras esté activo.
- [Ubicuo] El detalle debe ser solo informativo (fecha y minutos); no debe abrir, editar ni
  borrar sesiones, ni navegar a otra vista.

### RF-8 — Datos inválidos y estado vacío
Criterios de aceptación (EARS):
- [No deseado: Si] los datos guardados contienen entradas que no son sesiones válidas (fecha
  que no sea una fecha local válida en formato `AAAA-MM-DD`, minutos ausentes, no numéricos,
  no enteros o menores o iguales que 0), entonces el sistema debe excluirlas del mapa y
  seguir funcionando, sin borrarlas ni modificarlas.
- [Ubicuo] El sistema debe conservar intactas todas las sesiones guardadas, incluidas las de
  formatos anteriores que sigan siendo sesiones válidas.
- [No deseado: Si] no hay ninguna sesión guardada, entonces el sistema debe mostrar el mapa
  vacío (todos los días transcurridos en nivel 0) sin mostrar ningún error.

## 5. Requisitos no funcionales
- NFR-1 (Responsive): desde 375 px de ancho y en pantallas mayores, el mapa debe verse
  completo y ser usable sin scroll horizontal.
- NFR-2 (Accesibilidad): la intensidad no debe depender solo del color; cada día debe exponer
  a los lectores de pantalla su fecha y su estado en texto (por ejemplo, "16-10-2026,
  45 minutos", "sin estudio" o "día futuro"); el mapa debe poder recorrerse con el teclado,
  con el foco visible, y debe haber contraste suficiente en todos los niveles y estados.
- NFR-3 (Rendimiento): el mapa debe calcularse y mostrarse de forma inmediata tanto al
  cargar como con muchos días y sesiones, sin bloquear la interacción.
- NFR-4 (Datos, fechas y compatibilidad): fechas siempre en hora local; compatibilidad hacia
  atrás con lo ya guardado; nunca se pierde ni se altera una sesión (constitución,
  principio 5).
- NFR-5 (Idioma): la interfaz y la documentación se escriben en español; el código, en
  inglés (constitución, principio 6).
- NFR-6 (Determinismo y verificabilidad): el resultado del mapa debe ser función únicamente
  de las sesiones guardadas y de la fecha "hoy", que se recibe como dato explícito y no se
  lee del reloj dentro del cálculo; debe verificarse con pruebas automatizadas sin instalar
  dependencias (constitución, principios 3 y 4).
- NFR-7 (Simplicidad): la funcionalidad debe cumplir la constitución vigente; sin
  dependencias ni build y accesible abriendo la página con doble clic (constitución,
  principio 1).

## 6. Casos límite
- CL-1: Un mismo día con varias sesiones cuenta como un único día, con los minutos sumados.
- CL-2: Un día transcurrido sin sesiones se muestra como nivel 0, distinto de un día futuro.
- CL-3: Las sesiones que caen fuera del período de 12 semanas no se muestran ni afectan al
  mapa.
- CL-4: Una sesión con fecha futura dentro del período se trata como día futuro y nunca
  genera nivel ni cuenta como día estudiado.
- CL-5: Datos dañados, incompletos o con formato inesperado no rompen el mapa ni se borran.
- CL-6: Sin ninguna sesión guardada, el mapa se muestra vacío con su leyenda (no es un error).
- CL-7: Una sesión registrada a las 00:30 pertenece al día local correcto.
- CL-8: El día del cambio de hora (últimos domingos de marzo y de octubre) no altera a qué
  día pertenece una sesión.
- CL-9: Sumas de minutos muy altas (por ejemplo, 600) quedan en el nivel 4 sin desbordar ni
  deformar el mapa.
- CL-10: Varias sesiones que, sumadas, cruzan un umbral determinan el nivel por la suma y no
  por el valor de cada sesión.
- CL-11: Valores exactos en los límites (1, 30, 60 y 120 minutos) caen en el nivel cuyo rango
  empieza en ese valor.
- CL-12: Minutos que no sean enteros, iguales a 0 o negativos hacen que la sesión sea
  inválida y no cuente.
- CL-13: Un día justo en el borde del período (el primer día mostrado) se incluye; el día
  anterior no.
- CL-14: El período puede cruzar el cambio de año (diciembre–enero), o el cambio de mes, y
  debe mostrarse correctamente.
- CL-15: Un cambio de zona horaria del equipo o un ajuste manual del reloj se refleja en el
  mapa con la fecha local vigente al cargar o al registrar una sesión.
- CL-16: Si los datos se modifican fuera de la aplicación, el mapa refleja lo guardado al
  volver a cargar; sin recargar, solo se garantiza la actualización al registrar una sesión
  (RF-6).
- CL-17: En modo de alto contraste o con daltonismo, los niveles se distinguen porque cada
  día también expone su estado en texto (NFR-2).
- CL-18: Con pocos días de uso, la rejilla muestra la mayoría de celdas vacías o futuras de
  forma correcta.
- CL-19: Sesiones duplicadas (mismo `id`) no se fusionan: si son entradas distintas, sus
  minutos se suman igualmente cuando comparten día.

## 7. Fuera de alcance (de esta versión)
- Navegar a períodos anteriores o posteriores (no hay botones de "semana anterior/siguiente").
- Vista anual completa o rango de fechas personalizable.
- Abrir, ver o editar, desde el mapa, la lista de sesiones de un día, o navegar a un detalle
  ampliado (el detalle breve de RF-7 sí está dentro de alcance).
- Desglose por tema, por sesión o estadísticas adicionales dentro del mapa.
- Poder cambiar los umbrales de la escala desde la interfaz.
- Exportar o compartir el mapa como imagen.
- Sincronización, cuentas, backend o uso en varios dispositivos.
- Animaciones o transiciones del mapa.
- Actualizar automáticamente el mapa cuando cambia el día (medianoche) sin recargar la
  página.

## 8. Criterios de finalización
- Todos los RF están implementados y cada criterio de aceptación (EARS) se ha comprobado.
- Verificación manual con un ejemplo explícito: con sesiones que sumen 45 minutos hoy,
  90 minutos ayer y 20 minutos anteayer, el mapa debe mostrar hoy en nivel 2, ayer en nivel 3
  y anteayer en nivel 1; los días futuros no cuentan y las celdas fuera del período no
  aparecen.
- La consola no muestra errores durante el uso normal.
- El mapa se ve correctamente a 375 px de ancho, sin scroll horizontal.
- El mapa es comprensible con lector de pantalla y recorrible con el teclado.
- No se pierde ni se modifica ninguna sesión ya guardada.
- Las pruebas de la lógica de cálculo pasan y quedan en verde (constitución, principio 4).

## 9. Dudas abiertas
- Ninguna pendiente: las cuatro dudas anteriores se resolvieron y quedaron incorporadas como
  requisitos en esta spec (ver Anexo). Si durante el plan o la implementación aparece una
  decisión no cubierta, se detiene el trabajo y se pregunta (constitución, principio 2).

## 10. Anexo — Registro de decisiones
Este anexo es solo un registro; sus decisiones ya están incorporadas en los RF y NFR de
arriba y no añaden requisitos nuevos.
- Período: 12 semanas naturales (84 celdas); la última columna es la semana en curso, que
  puede quedar parcial y muestra sus días futuros.
- Disposición: columnas de más antigua a más reciente; filas de lunes (arriba) a domingo
  (abajo).
- Escala fija: nivel 0 = 0 min; nivel 1 = 1–29; nivel 2 = 30–59; nivel 3 = 60–119;
  nivel 4 = 120 o más.
- "Futuro" es un estado visual aparte, no un nivel de intensidad.
- Detalle breve de un día al pasar el cursor, al enfocar con el teclado o al tocar (RF-7);
  no abre sesiones.
- Sesión válida = fecha local válida + minutos enteros mayores que 0.
- El resultado depende solo de las sesiones guardadas y de "hoy" como dato explícito.
- La actualización al cambiar el día (medianoche) sin recargar queda fuera de alcance.
