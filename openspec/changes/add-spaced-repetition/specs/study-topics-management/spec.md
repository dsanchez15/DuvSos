## ADDED Requirements

### Requirement: Temas de estudio como entidad administrable
El sistema DEBE gestionar los temas de estudio como una entidad centralizada y administrable desde Settings, utilizándose en la creación de preguntas y en la configuración de repasos.

#### Scenario: Normalización de temas
- **WHEN** se crea o edita un tema de estudio
- **THEN** el sistema DEBE normalizar el nombre (trim, lowercase)
- **AND** DEBE prevenir duplicados comparando el nombre normalizado

#### Scenario: Temas en creación de preguntas
- **WHEN** el usuario crea o edita una pregunta en el módulo de Estudio
- **THEN** el selector de temática DEBE listar todos los temas gestionados en Settings > Administración
- **AND** DEBE permitir seleccionar un único tema por pregunta

#### Scenario: Temas en configuración de repaso
- **WHEN** el usuario configura una sesión de repaso
- **THEN** el sistema DEBE permitir seleccionar "Todos los temas" o elegir temas específicos del listado administrado
- **AND** solo DEBE mostrar temas que tengan al menos una pregunta asociada

#### Scenario: Orden alfabético de temas
- **WHEN** se listan temas en cualquier selector o vista de administración
- **THEN** el sistema DEBE ordenarlos alfabéticamente por su nombre normalizado
