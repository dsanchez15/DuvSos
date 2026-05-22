## Why

El estudio espaciado (spaced repetition) es una técnica de aprendizaje científicamente probada que fortalece la memoria a largo plazo distribuyendo los repasos en intervalos de tiempo crecientes. Actualmente, la aplicación no cuenta con una herramienta de estudio activo que permita a los usuarios repasar conocimientos de manera estructurada y medible. Agregar esta funcionalidad complementa el ecosistema de productividad de Aure, transformando la app de una simple gestora de tareas en una plataforma integral de aprendizaje y crecimiento personal.

## What Changes

- **Refactor de Settings en 3 tabs**: General (idioma, tema, colores), Vistas (toggles de visibilidad de secciones por funcionalidad), y Administración/Compartidas (gestión de temas de estudio, categorías y futuras entidades compartidas).
- **Nueva sección "Estudio" en el sidebar** con opción para activar/desactivar desde Settings > Vistas.
- **Submenú "Repaso"**: vista principal para ejecutar sesiones de repetición espaciada con configuración previa (cantidad de preguntas, límite de tiempo, selección de temas, tipo de respuesta) y generación de estadísticas post-sesión. Las sesiones iniciadas se persisten hasta por 1 semana con alerta de vencimiento.
- **Submenú "Preguntas"**: gestión completa del banco de preguntas (CRUD) con clasificación por temática y categoría, filtros avanzados e importación desde JSON.
- **Nuevos modelos de datos** para almacenar preguntas (con soporte dual de respuesta), respuestas, temáticas, sesiones de repaso y resultados.
- **Nuevos servicios** para la lógica de estudio espaciado, filtrado de preguntas, cálculo de estadísticas, comparación entre sesiones e importación JSON.
- **Alineación lineal de submenús en sidebar**: los submenús se despliegan debajo del menú principal, colapsados por defecto; se aplica también al menú "Plan" existente.

## Capabilities

### New Capabilities

- `spaced-repetition-study`: Funcionalidad principal de repaso espaciado — configuración de sesión (cantidad 20-50 configurable en settings), ejecución de preguntas (selección múltiple, respuesta directa o ambas), temporizador, persistencia de sesión hasta 1 semana con alerta de vencimiento, y generación de estadísticas comparativas post-sesión.
- `spaced-repetition-questions`: Gestión del banco de preguntas — crear, listar, editar, eliminar e importar desde JSON. Preguntas con categoría (del sistema de categorías existente), temática, soporte dual opcional (selección múltiple + respuesta directa), filtros avanzados y validación estricta.
- `settings-refactor`: Refactor completo de la vista de Settings en 3 tabs (General, Vistas, Administración). Tab Vistas organiza toggles por funcionalidad y contiene setting de máximo de preguntas por repaso (20-50, default 20). Tab Administración centraliza gestión de temas de estudio y otras entidades compartidas futuras. Incluye reorganización lineal y colapsada de submenús en sidebar.
- `study-topics-management`: Gestión de temas de estudio como entidad administrable desde Settings > Administración, usables al crear preguntas y filtrar repasos.

### Modified Capabilities

- *(Ninguna capacidad existente requiere cambios a nivel de especificación de requisitos; los cambios son puramente de implementación e integración UI).*

## Impact

- **Frontend**: Refactor de vista Settings (3 tabs), nuevas rutas/vistas de estudio, componentes de UI para sesión de estudio, formularios de gestión de preguntas con importación JSON, integración con sidebar existente y corrección de alineación de submenús.
- **Backend/Services**: Nuevos servicios para lógica de repaso, filtrado de preguntas avanzado, cálculo de estadísticas, comparación histórica, importación JSON con validación y persistencia de sesión.
- **Modelos de datos**: Nuevas entidades para `Question` (con flag dual `supportsBothModes`), `Topic` (entidad administrable), `StudySession` (con estado de resumen), `SessionResult`.
- **Configuración**: Refactor del store/settings en 3 secciones; nuevos settings para visibilidad de secciones, máximo de preguntas por repaso (20-50) y temas de estudio.
