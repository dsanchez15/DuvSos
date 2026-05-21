## ADDED Requirements

### Requirement: Refactor de Settings en 3 tabs
El sistema DEBE reorganizar la vista de Settings en tres tabs distintas: General, Vistas y Administración.

#### Scenario: Tab General
- **WHEN** el usuario accede a Settings
- **THEN** el sistema DEBE mostrar por defecto la tab "General"
- **AND** DEBE contener configuraciones globales de la aplicación: idioma, tema, colores, notificaciones y otras preferencias de sistema

#### Scenario: Tab Vistas
- **WHEN** el usuario selecciona la tab "Vistas"
- **THEN** el sistema DEBE mostrar configuraciones de visibilidad agrupadas por funcionalidad/sección
- **AND** cada sección DEBE tener su propio contenedor visual con título descriptivo
- **AND** solo DEBEN aparecer las secciones que tengan al menos un toggle o configuración asociada
- **AND** DEBE ser fácilmente extensible para agregar nuevas secciones y toggles en el futuro

#### Scenario: Tab Administración
- **WHEN** el usuario selecciona la tab "Administración"
- **THEN** el sistema DEBE mostrar herramientas de gestión de entidades compartidas que en el futuro se sincronizarán o compartirán
- **AND** inicialmente DEBE contener la gestión de temas de estudio
- **AND** DEBE estar estructurada de forma que sea trivial agregar nuevas entidades administrables (ej. categorías, etiquetas globales)

### Requirement: Toggle de visibilidad del módulo Estudio
El sistema DEBE proveer un toggle en la tab "Vistas" de Settings para controlar la visibilidad del módulo "Estudio" en el sidebar.

#### Scenario: Toggle en tab Vistas
- **WHEN** el usuario navega a Settings > Vistas
- **THEN** el sistema DEBE mostrar una sección "Estudio"
- **AND** dentro de esa sección DEBE existir un toggle etiquetado "Mostrar sección de Estudio"
- **AND** el valor por defecto DEBE ser `true` (visible)

#### Scenario: Toggle afecta el sidebar inmediatamente
- **WHEN** el usuario cambia el estado del toggle
- **THEN** el sidebar DEBE actualizar su visibilidad sin requerir recarga de página
- **AND** el estado DEBE persistir entre sesiones de la aplicación

### Requirement: Setting de máximo de preguntas por repaso
El sistema DEBE permitir configurar el número máximo de preguntas por sesión de repaso.

#### Scenario: Configurar máximo en tab Vistas
- **WHEN** el usuario accede a Settings > Vistas > Estudio
- **THEN** el sistema DEBE mostrar un control numérico o slider para "Máximo de preguntas por repaso"
- **AND** el rango permitido DEBE ser de 20 a 50
- **AND** el valor por defecto DEBE ser 20
- **AND** el sistema DEBE usar este valor como límite superior en la configuración de una nueva sesión de repaso

### Requirement: Gestión de temas de estudio en Administración
El sistema DEBE permitir crear, editar y eliminar temas de estudio desde la tab Administración.

#### Scenario: Crear tema
- **WHEN** el usuario accede a Settings > Administración > Temas de Estudio
- **AND** hace clic en "Nuevo Tema"
- **THEN** el sistema DEBE solicitar el nombre del tema
- **AND** al guardar DEBE normalizarlo (trim, lowercase) y almacenarlo
- **AND** DEBE prevenir duplicados exactos al normalizar

#### Scenario: Listar temas
- **WHEN** el usuario accede a Settings > Administración > Temas de Estudio
- **THEN** el sistema DEBE mostrar todos los temas existentes ordenados alfabéticamente

#### Scenario: Eliminar tema
- **WHEN** el usuario solicita eliminar un tema
- **THEN** el sistema DEBE solicitar confirmación
- **AND** al confirmar DEBE eliminar el tema
- **AND** si existen preguntas asociadas, DEBE mostrar una advertencia indicando que las preguntas quedarán sin temática asignada

#### Scenario: Temas disponibles en creación de pregunta
- **WHEN** el usuario crea o edita una pregunta
- **THEN** el selector de temática DEBE mostrar los temas gestionados en Settings > Administración
- **AND** DEBE permitir seleccionar un tema existente

### Requirement: Sidebar con submenús lineales y colapsados por defecto
El sistema DEBE mostrar los submenús del sidebar de forma lineal, debajo del menú principal, colapsados por defecto.

#### Scenario: Alineación lineal de submenús
- **WHEN** el sidebar muestra un menú con submenús (ej. "Estudio" o "Plan")
- **THEN** los submenús DEBEN aparecer directamente debajo del menú principal
- **AND** DEBEN estar visualmente alineados con el menú principal (indentación consistente)
- **AND** NO DEBEN usar despliegues flotantes, modales ni desalineaciones laterales

#### Scenario: Colapsado por defecto
- **WHEN** el usuario carga la aplicación por primera vez o recarga la página
- **THEN** todos los menús que tengan submenús DEBEN estar colapsados
- **AND** el usuario DEBE poder expandirlos manualmente haciendo clic en el menú principal

#### Scenario: Estado de expansión persistente
- **WHEN** el usuario expande o colapsa un menú con submenús
- **THEN** el sistema DEBE recordar el estado de expansión durante la sesión actual

### Requirement: Accesibilidad por URL directa
El sistema DEBE mantener accesibles las rutas del módulo de estudio independientemente del estado del toggle.

#### Scenario: Ruta directa funciona con menú oculto
- **WHEN** el usuario navega directamente a `/study/review` o `/study/questions` estando el menú oculto
- **THEN** el sistema DEBE cargar la vista correspondiente normalmente
- **AND** el sidebar NO DEBE mostrar el menú de Estudio mientras el toggle esté desactivado
