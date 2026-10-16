---
description: SDD — Clarifica la spec: un QA detecta las dudas y tú las resuelves
agent: plan
---
Trabaja sobre specs/$1/spec.md con la skill sdd. NO toques código.
1. Revisa la spec como un QA muy profesional y lista, en formato numerado:
   - Ambigüedades (requisitos que no se pueden verificar).
   - Contradicciones entre requisitos.
   - Casos límite no cubiertos.
   - Conflictos con docs/constitution.md.
2. Muéstrame esa lista y hazme las preguntas de UNA en UNA hasta resolver las dudas.
   No decidas por tu cuenta: si queda algo abierto, la spec sigue en borrador.
3. Con mis respuestas, actualiza specs/$1/spec.md:
   - Escribe la respuesta y borra su [NECESITA ACLARACIÓN].
   - Ajusta los RF afectados (en EARS) y sus casos límite.
   - Si cambia el alcance, actualiza "Fuera de alcance" y "Criterios de finalización".
4. Muéstrame el diff y espera mi aprobación antes de pasar al plan.
