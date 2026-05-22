## ADDED Requirements

### Requirement: Sesión de repaso configurable
El sistema DEBE permitir al usuario configurar una sesión de repaso antes de iniciarla.

#### Scenario: Configuración válida
- **WHEN** el usuario accede a la vista "Repaso"
- **THEN** el sistema DEBE mostrar opciones para: cantidad de preguntas (1 hasta el máximo configurado en Settings, 20-50, default 20), límite de tiempo por pregunta o total (opcional), selección de temas (todos o específicos), y tipo de respuesta (selección múltiple, respuesta directa o ambas —solo si el banco tiene preguntas con flag dual activo—)
- **AND** el usuario DEBE poder iniciar la sesión con un botón "Iniciar Repaso"

#### Scenario: Configuración inválida
- **WHEN** el usuario selecciona 0 preguntas o un tema inexistente
- **THEN** el sistema DEBE deshabilitar el botón "Iniciar Repaso" y mostrar un mensaje de validación

### Requirement: Ejecución de sesión de repaso
El sistema DEBE presentar preguntas una a una según la configuración elegida y registrar el resultado.

#### Scenario: Repaso con selección múltiple
- **WHEN** el usuario inicia una sesión con tipo de respuesta "selección múltiple"
- **THEN** el sistema DEBE mostrar cada pregunta con 4 opciones de respuesta
- **AND** el usuario DEBE seleccionar una opción antes de continuar

#### Scenario: Repaso con respuesta directa
- **WHEN** el usuario inicia una sesión con tipo de respuesta "respuesta directa"
- **THEN** el sistema DEBE mostrar un campo de texto para que el usuario escriba su respuesta
- **AND** el sistema DEBE validar la respuesta comparándola con la respuesta correcta almacenada (insensible a mayúsculas/minúsculas y espacios extra)

#### Scenario: Temporizador activo
- **WHEN** el usuario configura un límite de tiempo
- **THEN** el sistema DEBE mostrar un temporizador visible durante la sesión
- **AND** si el tiempo expira, el sistema DEBE marcar la pregunta actual como incorrecta y pasar a la siguiente

#### Scenario: Navegación entre preguntas
- **WHEN** el usuario responde o se agota el tiempo
- **THEN** el sistema DEBE mostrar retroalimentación inmediata (correcto/incorrecto con la respuesta correcta)
- **AND** el usuario DEBE poder avanzar a la siguiente pregunta con un botón "Continuar"

### Requirement: Persistencia de sesión interrumpida
El sistema DEBE permitir reanudar una sesión de repaso interrumpida siempre que no haya transcurrido más de 7 días desde su inicio.

#### Scenario: Reanudar sesión válida
- **WHEN** existe una sesión de repaso iniciada pero no finalizada con antigüedad menor a 7 días
- **AND** el usuario accede a la vista "Repaso"
- **THEN** el sistema DEBE mostrar una opción "Reanudar sesión anterior" con información resumida (temas, progreso, tiempo transcurrido)
- **AND** al seleccionarla, DEBE continuar desde la última pregunta respondida

#### Scenario: Sesión expirada
- **WHEN** existe una sesión de repaso con antigüedad mayor a 7 días
- **THEN** el sistema DEBE mostrar una alerta de vencimiento indicando que la sesión expiró
- **AND** DEBE ofrecer descartarla e iniciar una nueva configuración
- **AND** DEBE eliminar la sesión expirada del almacenamiento

#### Scenario: Descarte de sesión persistida
- **WHEN** el usuario elige "Descartar sesión"
- **THEN** el sistema DEBE eliminar la sesión persistida
- **AND** DEBE permitir configurar una nueva sesión normalmente

### Requirement: Estadísticas post-sesión
El sistema DEBE generar estadísticas al finalizar cada sesión de repaso y compararlas con la sesión anterior del mismo tipo.

#### Scenario: Estadísticas básicas
- **WHEN** el usuario completa todas las preguntas de la sesión o abandona
- **THEN** el sistema DEBE mostrar: total de preguntas respondidas, cantidad de respuestas correctas, cantidad de respuestas incorrectas, porcentaje de acierto, tiempo total empleado

#### Scenario: Comparación con sesión previa
- **WHEN** exista una sesión previa con la misma configuración de temas y tipo de respuesta
- **THEN** el sistema DEBE mostrar la diferencia (delta) de aciertos, errores y porcentaje respecto a la sesión anterior
- **AND** DEBE indicar visualmente si el desempeño mejoró, empeoró o se mantuvo igual

### Requirement: Gestión del banco de preguntas
El sistema DEBE permitir crear, listar, editar y eliminar preguntas del banco de repaso.

#### Scenario: Crear pregunta
- **WHEN** el usuario accede a la vista "Preguntas" y hace clic en "Nueva Pregunta"
- **THEN** el sistema DEBE mostrar un formulario con: texto de la pregunta, respuesta correcta, temática (texto libre o existente), tipo de respuesta (selección múltiple o directa)
- **AND** si es selección múltiple, DEBE permitir ingresar hasta 4 opciones y marcar cuál es la correcta
- **AND** al guardar, la pregunta DEBE aparecer en la lista

#### Scenario: Listar preguntas
- **WHEN** el usuario accede a la vista "Preguntas"
- **THEN** el sistema DEBE mostrar todas las preguntas en una lista paginada o con scroll infinito
- **AND** DEBE permitir filtrar por temática

#### Scenario: Editar pregunta
- **WHEN** el usuario selecciona una pregunta existente
- **THEN** el sistema DEBE cargar el formulario de edición con los datos actuales
- **AND** al guardar, DEBE actualizar la pregunta sin afectar sesiones previas

#### Scenario: Eliminar pregunta
- **WHEN** el usuario solicita eliminar una pregunta
- **THEN** el sistema DEBE solicitar confirmación
- **AND** al confirmar, DEBE eliminar la pregunta del banco

### Requirement: Control de visibilidad del menú de estudio
El sistema DEBE permitir al usuario mostrar u ocultar la sección "Estudio" del sidebar desde Settings.

#### Scenario: Activar menú de estudio
- **WHEN** el usuario accede a Settings y habilita la opción "Mostrar Estudio"
- **THEN** el sidebar DEBE mostrar la sección "Estudio" con sus submenús (Repaso y Preguntas)

#### Scenario: Desactivar menú de estudio
- **WHEN** el usuario accede a Settings y deshabilita la opción "Mostrar Estudio"
- **THEN** el sidebar NO DEBE mostrar la sección "Estudio"
- **AND** las rutas internas del módulo de estudio DEBEN seguir siendo accesibles directamente por URL
