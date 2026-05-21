## 1. Refactor de Settings

- [x] 1.1 Crear estructura de 3 tabs en la vista Settings: General, Vistas, Administración
- [x] 1.2 Migrar settings existentes a la tab General (idioma, tema, colores, notificaciones)
- [x] 1.3 Crear componente reutilizable de sección dentro de la tab Vistas para agrupar toggles por funcionalidad
- [x] 1.4 Mover/agregar toggle "Mostrar sección de Estudio" dentro de la sección "Estudio" en tab Vistas
- [x] 1.5 Implementar setting numérico/slider "Máximo de preguntas por repaso" (20-50, default 20) en sección "Estudio" de tab Vistas
- [x] 1.6 Crear vista de gestión de temas en tab Administración (CRUD de temas: crear, listar, eliminar con confirmación y advertencia de preguntas asociadas)
- [x] 1.7 Normalizar nombres de temas (trim, lowercase) y prevenir duplicados
- [x] 1.8 Persistir nueva estructura de settings en store local

## 2. Modelos de Datos y Servicios Base

- [x] 2.1 Crear modelo `Question` con: id, texto, categoría (id de categoría del sistema), temática (string referenciada a temas gestionados), tipo de respuesta, respuesta directa, opciones (hasta 4), índice correcto, flag `supportsBothModes`, fechas de creación/modificación
- [x] 2.2 Crear modelo `Topic` para gestión de temas en administración
- [x] 2.3 Crear modelo `StudySession` con: id, configuración, estado (activa/completada/abandonada/expirada), fecha de inicio, última actividad, preguntas respondidas, resultados parciales
- [x] 2.4 Crear modelo `SessionResult` para almacenar resultados finales y comparativos
- [x] 2.5 Implementar servicio `QuestionService` con CRUD completo, persistencia local, filtros avanzados (categoría, temática, tipo, flag dual, búsqueda por texto) e importación JSON con validación
- [x] 2.6 Implementar servicio `TopicService` para normalizar, crear, listar y eliminar temas
- [x] 2.7 Implementar servicio `StudySessionService` para crear, ejecutar, finalizar, persistir, reanudar y expirar sesiones (máx 7 días)

## 3. Importación JSON de Preguntas

- [x] 3.1 Definir y documentar la estructura JSON esperada para importación
- [x] 3.2 Implementar parser de JSON que procese preguntas individualmente
- [x] 3.3 Implementar validación estricta: pregunta no vacía, respuesta no vacía, temática no vacía, categoría existente, y si es selección múltiple: 4 opciones no vacías + índice válido
- [x] 3.4 Implementar lógica de ignorar preguntas inválidas sin detener el proceso, con resumen de errores
- [x] 3.5 Agregar UI de importación (botón "Importar JSON", selector de archivo, resumen de resultados)

## 4. Vista de Gestión de Preguntas (CRUD)

- [x] 4.1 Crear ruta y componente base para la vista "Preguntas" (`/study/questions`)
- [x] 4.2 Implementar lista de preguntas con paginación o scroll infinito
- [x] 4.3 Implementar barra de filtros avanzados: categoría, temática, tipo de respuesta, flag `supportsBothModes`, búsqueda por texto
- [x] 4.4 Crear formulario de creación de preguntas con: texto, selector de categoría (del sistema), selector de temática (de temas gestionados), respuesta directa, opciones de selección múltiple (hasta 4) con índice correcto, y checkbox opcional para activar flag `supportsBothModes` (solo si se llenan opciones de selección múltiple)
- [x] 4.5 Validar formulario: pregunta no vacía, respuesta directa obligatoria, si tiene opciones de selección múltiple entonces todas las 4 deben estar llenas e índice correcto definido
- [x] 4.6 Crear formulario de edición reutilizando componentes del formulario de creación
- [x] 4.7 Implementar diálogo de confirmación para eliminar preguntas
- [x] 4.8 Integrar botón y flujo de importación JSON en la vista de preguntas

## 5. Integración con Sidebar

- [x] 5.1 Crear entrada principal "Estudio" en el sidebar con icono y comportamiento condicional basado en `showStudySection`
- [x] 5.2 Implementar submenú lineal debajo del menú principal: alineación consistente, colapsado por defecto
- [x] 5.3 Crear submenús "Repaso" y "Preguntas" bajo "Estudio"
- [x] 5.4 Configurar rutas anidadas: `/study/review` y `/study/questions`
- [x] 5.5 Asegurar que las rutas sean accesibles directamente por URL aunque el menú esté oculto
- [x] 5.6 Reparar alineación del submenú "Plan" para que también sea lineal y colapsado por defecto

## 6. Vista de Configuración de Repaso

- [x] 6.1 Crear componente base para la vista "Repaso" (`/study/review`)
- [x] 6.2 Detectar sesión persistida activa y mostrar opción de reanudar o descartar (con alerta si expiró >7 días)
- [x] 6.3 Implementar selector de cantidad de preguntas (1 hasta el máximo configurado en Settings, 20-50)
- [x] 6.4 Implementar selector de límite de tiempo (opcional: por pregunta o total)
- [x] 6.5 Implementar selector de temas ("Todos los temas" o multiselect de temas existentes con preguntas asociadas)
- [x] 6.6 Implementar selector de tipo de respuesta (selección múltiple, respuesta directa, o ambas —filtrando preguntas con `supportsBothModes`—)
- [x] 6.7 Implementar botón "Iniciar Repaso" deshabilitado hasta que la configuración sea válida
- [x] 6.8 Mostrar resumen de configuración antes de iniciar

## 7. Ejecución de Sesión de Repaso

- [x] 7.1 Crear componente de ejecución de sesión (pantalla de estudio activa)
- [x] 7.2 Implementar presentación de preguntas una a una según filtros de configuración
- [x] 7.3 Implementar modo selección múltiple con 4 opciones y validación de respuesta
- [x] 7.4 Implementar modo respuesta directa con input de texto y comparación normalizada (case/space insensitive)
- [x] 7.5 Implementar modo "ambas": elegir aleatoriamente entre presentar la pregunta como selección múltiple o respuesta directa si `supportsBothModes` es true
- [x] 7.6 Implementar temporizador visible con lógica de expiración (marcar incorrecta y avanzar)
- [x] 7.7 Mostrar retroalimentación inmediata tras responder (correcto/incorrecto + respuesta correcta)
- [x] 7.8 Implementar navegación "Continuar" entre preguntas
- [x] 7.9 Implementar persistencia de progreso de sesión en tiempo real
- [x] 7.10 Permitir abandono de sesión y registro de resultados parciales

## 8. Estadísticas y Resultados

- [x] 8.1 Crear componente de resumen post-sesión
- [x] 8.2 Calcular y mostrar: total respondidas, correctas, incorrectas, porcentaje de acierto, tiempo total
- [x] 8.3 Recuperar sesión previa con misma configuración de temas y tipo de respuesta
- [x] 8.4 Calcular y mostrar delta (diferencia) vs sesión previa en correctas, incorrectas y porcentaje
- [x] 8.5 Agregar indicadores visuales de mejora/empeoramiento/igualdad (flechas, colores)
- [x] 8.6 Implementar botón "Nueva sesión" para regresar a la configuración
- [x] 8.7 Implementar limpieza automática de sesiones expiradas (>7 días) al cargar el módulo

## 9. Testing y Calidad

- [x] 9.1 Escribir tests unitarios para `QuestionService` (CRUD, filtros, normalización, importación JSON)
- [x] 9.2 Escribir tests unitarios para `StudySessionService` (filtrado, cálculo de estadísticas, comparación, persistencia, expiración)
- [x] 9.3 Escribir tests unitarios para `TopicService` (normalización, prevención de duplicados)
- [x] 9.4 Escribir tests de componente para el formulario de creación/edición de preguntas (validación dual, categoría, temática)
- [x] 9.5 Escribir tests de componente para la vista de configuración de repaso (detección de sesión persistida, límite según setting)
- [x] 9.6 Verificar responsividad de las nuevas vistas en mobile y desktop
- [x] 9.7 Revisar accesibilidad de formularios, botones, navegación del módulo y tabs de Settings
