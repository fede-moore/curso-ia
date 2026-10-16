---
name: sdd
description: >-
  Úsala siempre que trabajes con Spec-Driven Development en este proyecto
  (docs/constitution.md o cualquier archivo dentro de specs/) - redactar, revisar
  o cambiar specs, planes y tareas, o implementar y validar tareas de una spec.
---

# Spec-Driven Development (SDD)
## Flujo
Constitución → Spec → Clarificación → Plan → Tareas → Implementación → Validación →
Cambio.
- Nunca pases a la siguiente fase sin la aprobación explícita del usuario.
- La spec manda: si algo no está en la spec, no se implementa. Si falta una decisión,
para y pregunta.
- Un cambio de requisitos se hace primero en la spec, luego en el plan y las tareas, y
por último en el código.
- Cada spec vive en su carpeta: `specs/NNN-nombre/` con `spec.md`, `plan.md` y
`tasks.md`.
- Al terminar cada fase, actualiza `MEMORY.md`.
## Constitución
`docs/constitution.md` fija los principios innegociables: toda spec, plan y tarea debe
cumplirlos. Léela antes de empezar y no la contradigas.
- Si una spec choca con un principio, para y pregunta; no se relaja la constitución para
encajar una funcionalidad.
- La constitución solo cambia por acuerdo explícito del usuario, y al cambiarla revisa lo
ya escrito que dependa de ella.
- Cita los principios por su número (P1, P4…) donde apliquen, para poder rastrearlos.
## Plantilla de spec (spec.md)
```
# Spec NNN — <Nombre>
Estado: borrador | aprobada | implementada
## Contexto y objetivo
## Usuarios
## Historias de usuario
- HU-1. Como <rol>, quiero <acción> para <beneficio>.
## Definiciones (solo si hay términos que puedan interpretarse de varias formas)
## Requisitos funcionales
## Requisitos no funcionales
## Casos límite
## Fuera de alcance
## Criterios de finalización
## Dudas abiertas
- [NECESITA ACLARACIÓN] <duda>
```
La spec describe el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos.
## Requisitos en EARS (en español)
- RF-x: CUANDO <evento>, EL SISTEMA <respuesta>.
- RF-x: SI <condición no deseada>, ENTONCES EL SISTEMA <respuesta>.
- RF-x: MIENTRAS <estado>, EL SISTEMA <respuesta>.
- RF-x: EL SISTEMA <comportamiento permanente>.
Cada RF debe ser verificable: nada de "rápido", "intenso" o "bonito" sin un criterio
medible.
## Clarificación
Resolver las dudas abiertas antes de planear: una spec con `[NECESITA ACLARACIÓN]` sin
responder no pasa a la fase de plan.
- Convierte cada duda en una pregunta concreta y espera la respuesta del usuario.
- Al aclararla, escribe la respuesta en la spec, borra el `[NECESITA ACLARACIÓN]` y ajusta
los RF afectados.
- Si la aclaración cambia el alcance, actualiza "Fuera de alcance" y "Criterios de
finalización".
- No decidas por tu cuenta: si la duda sigue abierta, la spec se queda en borrador.
## Plan (plan.md)
Archivos y responsabilidades · Funciones puras (con "hoy" como parámetro) · Algoritmo en
pseudocódigo · Interfaz · Decisiones justificadas con su alternativa descartada ·
Estrategia de tests con `node --test`. Indica qué RF cubre cada parte.
## Tareas (tasks.md)
```
- [ ] **Tn. <Descripción>.** RF-x, RF-y
 - Hecho cuando: <comprobación verificable>.
```
Máximo 20-30 min por tarea, en orden de dependencia. Si salen más de 10, propón dividir
la spec.
## Implementación
Una sola tarea cada vez: tests primero (en rojo), después el código, `node --test` en
verde, marcar la tarea y parar.
## Validación
Comprobar que la spec se cumple, requisito a requisito, no solo que el código funcione.
- Recorre los RF y NFR y confirma cada uno con una prueba o una comprobación concreta; lo
no comprobado queda pendiente, no hecho.
- `node --test` en verde es la puerta (constitución P4): no se valida con tests en rojo.
- Verifica en el navegador (Chrome DevTools) que lo visible sigue igual: consola sin
errores, sin scroll horizontal a 375 px y sin perder ni modificar datos guardados.
- Marca una tarea de `tasks.md` como hecha solo cuando su "Hecho cuando" se cumple.
- Si un RF no se puede comprobar, para y avisa: puede faltar un caso límite o una duda sin
aclarar.
## Cambio
Todo cambio de requisitos entra primero por la spec, nunca directo al código.
- Edita o añade el requisito en `spec.md` antes de tocar `plan.md`, `tasks.md` o el código.
- Si el cambio afecta a algo ya implementado, repasa el plan y las tareas y ajusta los
RF/NFR que cubren.
- Si invalida una spec ya cerrada, crea una spec nueva (`specs/NNN-nombre/`) que la
sustituya en lugar de reescribir el historial.
- Actualiza `MEMORY.md` con el cambio y su porqué.