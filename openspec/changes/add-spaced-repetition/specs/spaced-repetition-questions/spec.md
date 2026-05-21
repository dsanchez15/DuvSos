## ADDED Requirements

### Requirement: Modelo de datos de preguntas
El sistema DEBE almacenar preguntas con sus respuestas, temática, categoría y tipo de respuesta.

#### Scenario: Estructura de pregunta de selección múltiple
- **WHEN** se crea una pregunta de tipo "selección múltiple"
- **THEN** el sistema DEBE almacenar: id único, texto de la pregunta, temática (string referenciada a temas gestionados en Settings), categoría (id de categoría del sistema existente), tipo de respuesta, array de opciones (hasta 4), índice de la opción correcta, flag `supportsBothModes` (boolean), fecha de creación, fecha de última modificación

#### Scenario: Estructura de pregunta de respuesta directa
- **WHEN** se crea una pregunta de tipo "respuesta directa"
- **THEN** el sistema DEBE almacenar: id único, texto de la pregunta, temática (string referenciada a temas gestionados en Settings), categoría (id de categoría del sistema existente), tipo de respuesta, texto de la respuesta correcta, flag `supportsBothModes` (boolean), fecha de creación, fecha de última modificación

#### Scenario: Pregunta con soporte dual
- **WHEN** el usuario crea una pregunta de respuesta directa Y opcionalmente ingresa opciones de selección múltiple válidas
- **THEN** el sistema DEBE establecer `supportsBothModes` en `true`
- **AND** DEBE almacenar tanto la respuesta directa como las opciones de selección múltiple
- **AND** la pregunta DEBE ser usable en repasos de tipo "ambas" o en cualquiera de los dos modos individuales

### Requirement: Categorización de preguntas
El sistema DEBE asociar cada pregunta a una categoría del sistema de categorías existente.

#### Scenario: Asignar categoría al crear pregunta
- **WHEN** el usuario crea o edita una pregunta
- **THEN** el sistema DEBE mostrar un selector de categorías basado en las categorías existentes de la aplicación
- **AND** DEBE permitir seleccionar una única categoría por pregunta

#### Scenario: Filtrar preguntas por categoría
- **WHEN** el usuario accede a la vista "Preguntas"
- **THEN** el sistema DEBE permitir filtrar la lista por categoría

### Requirement: Filtros avanzados en el banco de preguntas
El sistema DEBE proveer filtros múltiples para facilitar la búsqueda de preguntas.

#### Scenario: Filtrar por múltiples criterios
- **WHEN** el usuario está en la vista "Preguntas"
- **THEN** el sistema DEBE permitir filtrar simultáneamente por: categoría, temática, tipo de respuesta, flag `supportsBothModes`, y texto de búsqueda (en el enunciado de la pregunta)
- **AND** DEBE actualizar la lista en tiempo real a medida que se aplican filtros

### Requirement: Importación de preguntas desde JSON
El sistema DEBE permitir importar preguntas desde un archivo JSON con validación estricta.

#### Scenario: Importación exitosa
- **WHEN** el usuario selecciona un archivo JSON válido en la vista "Preguntas"
- **THEN** el sistema DEBE parsear el archivo
- **AND** cada pregunta válida DEBE ser agregada al banco de preguntas
- **AND** al finalizar DEBE mostrar un resumen con cantidad de preguntas importadas exitosamente y cantidad ignoradas

#### Scenario: Validación de preguntas en JSON
- **WHEN** se procesa una entrada del JSON
- **THEN** el sistema DEBE validar que contenga: texto de pregunta no vacío, respuesta correcta no vacía, temática no vacía, categoría existente en el sistema, y si es selección múltiple que tenga exactamente 4 opciones no vacías con índice de respuesta correcta válido
- **AND** si cualquier validación falla, DEBE ignorar esa pregunta específica sin detener el proceso de importación

#### Scenario: Estructura del JSON esperada
- **WHEN** el usuario genera o prepara un archivo de importación
- **THEN** el sistema DEBE documentar y validar la siguiente estructura mínima por pregunta: `{ "question": string, "answer": string, "topic": string, "categoryId": string, "type": "multiple-choice" | "direct", "options"?: string[], "correctOptionIndex"?: number, "supportsBothModes"?: boolean }`

### Requirement: Persistencia local del banco de preguntas
El sistema DEBE persistir el banco de preguntas en almacenamiento local de la aplicación.

#### Scenario: Pregunta guardada persiste entre sesiones
- **WHEN** el usuario crea una pregunta y recarga la aplicación
- **THEN** la pregunta DEBE seguir existiendo en la lista

#### Scenario: Eliminación persistente
- **WHEN** el usuario elimina una pregunta y recarga la aplicación
- **THEN** la pregunta NO DEBE aparecer en la lista
