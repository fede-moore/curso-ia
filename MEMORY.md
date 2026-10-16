# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha
histórica con trofeo y lista de sesiones.
- Datos en localStorage.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- La mejor racha se calcula desde los días locales con sesiones, sin duplicar datos en
  localStorage.
- El trofeo de la mejor racha es solo un distintivo visual; no afecta su cálculo ni los
  datos guardados.
- Las fechas de sesiones en la lista se muestran como `DD-MM-YYYY` con `es-AR`; el
  campo sigue siendo `type="date"` y el navegador controla su presentación.
## Aprendizajes y errores a evitar
- Deduplicar las fechas antes de calcular rachas y excluir días futuros.
## Próximos pasos
- (vacío por ahora) 
