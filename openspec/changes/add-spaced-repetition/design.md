## Context

Aure es una aplicación de productividad con módulos de tareas, hábitos, recordatorios y dashboard analítico. La arquitectura actual sigue un patrón modular con servicios desacoplados, stores reactivos y un sidebar de navegación principal. No existe actualmente un sistema de estudio activo ni gestión de conocimiento.

## Goals / Non-Goals

**Goals:**
- Integrar un módulo de estudio espaciado sin perturbar los módulos existentes.
- Proveer una experiencia de repaso configurable (cantidad, tiempo, temas, tipo de respuesta) con sesiones persistibles hasta 1 semana.
- Generar estadísticas comparativas entre sesiones para motivación y seguimiento.
- Permitir al usuario gestionar su propio banco de preguntas y respuestas, con importación desde JSON.
- Hacer la visibilidad del módulo configurable desde Settings refactorizado en 3 tabs.
- Gestionar temas de estudio como entidad administrable centralizada.

**Non-Goals:**
- Algoritmos complejos de SM-2 o SuperMemo (intervalos fijos por pregunta basados en dificultad, no en fecha exacta).
- Sincronización con servicios externos (Anki, Quizlet, etc.).
- Sistema de compartir decks/preguntas entre usuarios.
- Gamificación avanzada (logros, niveles, leaderboards).

## Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| **Modelo de datos local (no sync)** | Simplifica MVP y reduce complejidad de backend. Las preguntas y sesiones se almacenan localmente. | Sync con backend: descartado por complejidad innecesaria para MVP. |
| **Dos submenús bajo "Estudio"** | Separa claramente la acción (repasar) de la configuración (gestionar preguntas). Mejora la UX. | Vista única con tabs: descartado porque dificulta la navegación desde el sidebar. |
| **Estadísticas por sesión, no por pregunta** | Reduce complejidad de tracking. Se almacena resultado global de cada sesión para comparación. | Tracking granular por cada respuesta de cada pregunta: descartado por exceso de datos para MVP. |
| **Temas como entidad administrable en Settings** | Centraliza la gestión de temas, evita duplicados y permite reutilización consistente en todo el módulo de estudio. | Tags simples on-the-fly: descartado por riesgo de duplicación y falta de control. |
| **Settings refactorizado en 3 tabs** | Separa configuraciones por naturaleza (General, Vistas, Administración), escala mejor y mejora descubribilidad. | Settings plano: descartado por complejidad creciente al agregar más toggles y entidades administrables. |
| **Timer opcional, no obligatorio** | Respeta estilos de estudio variados (algunos prefieren sin presión de tiempo). | Timer obligatorio: descartado por rigidez. |
| **Preguntas con soporte dual opcional** | Permite una misma pregunta servir tanto para selección múltiple como respuesta directa si el usuario así lo desea, maximizando reutilización del banco. | Tipos de respuesta rígidamente separados: descartado por rigidez y duplicación de contenido. |
| **Persistencia de sesión por máximo 1 semana** | Permite reanudar sesiones interrumpidas sin acumular estados obsoletos indefinidamente. | Sesión sin persistencia / persistencia indefinida: descartado por pérdida de progreso vs acumulación de basura. |
| **Import JSON con validación estricta** | Facilita migración de datos y backups; ignora entradas inválidas sin romper el proceso. | Import sin validación: descartado por riesgo de corrupción de datos. |

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| El banco de preguntas crece indefinidamente y afecta performance | Implementar paginación/lazy loading en la lista de preguntas. Límite suave de 500 preguntas por tema recomendado en UI. |
| El usuario desactiva el menú y olvida cómo reactivarlo | Tab "Vistas" en Settings organizada por secciones con descripciones claras. |
| Sesiones de repaso muy largas generan fatiga | Setting configurable de máximo 20-50 preguntas (default 20). Sugerencia de duración óptima en UI. |
| Pérdida de datos locales si no hay backup | Importación y futura exportación JSON de preguntas. Documentar en UI. |
| Sesión persistida más allá de 1 semana genera confusión | Alerta visual de vencimiento al intentar reanudar; eliminación automática de sesiones expiradas al cargar el módulo. |
| Import JSON con datos malformados corrompe el banco | Validación estricta previa a la importación; preguntas inválidas se ignoran individualmente con resumen de errores. |

## Migration Plan

No aplica. El cambio es puramente aditivo y no modifica datos existentes.

## Open Questions

1. ¿Se requiere exportación de preguntas a JSON además de importación?
2. ¿La alerta de vencimiento de sesión persistida debe ser bloqueante (modal) o no intrusiva (banner)?
