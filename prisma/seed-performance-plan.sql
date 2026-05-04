-- Plan de Mejora Continua - Seed Data
-- User ID 1 assumed (adjust if needed)

-- ============================================
-- PHASES (Configurable periods)
-- ============================================
INSERT INTO "Phase" (id, "userId", number, title, description, "startDate", "endDate", "createdAt") VALUES
('phase-1', 1, 1, 'Fase 1: Mayo 2026', 'Semanas 1-4: Certificado Globant + Mejorar sueño + Iniciar agente-config', '2026-05-01', '2026-05-31', NOW()),
('phase-2', 1, 2, 'Fase 2: Junio-Julio 2026', 'Semanas 5-12: Certificación Claude Code + agente-config + Gimnasio consolidado + Inglés', '2026-06-01', '2026-07-31', NOW()),
('phase-3', 1, 3, 'Fase 3: Agosto-Diciembre 2026', 'Semanas 13-26+: Java avanzado + Curso Udemy + Inglés B2', '2026-08-01', '2026-12-31', NOW());

-- ============================================
-- GOALS - PROFESIONAL
-- ============================================

-- agente-config
INSERT INTO "Goal" (id, "userId", category, title, description, priority, status, deadline, "estimatedHours", "totalHoursSpent", "createdAt", "updatedAt") VALUES
('goal-agente-config', 1, 'PROFESIONAL', 'Proyecto agente-config', 'Librería para guardar configuraciones de usuario (skills, specs, designs, mcps) en agentes como Claude Code, OpenCode y permitir replicarlas', 'ALTA', 'ACTIVE', '2026-05-31', 30, 0, NOW(), NOW());

-- Certificado Globant
INSERT INTO "Goal" (id, "userId", category, title, description, priority, status, deadline, "estimatedHours", "totalHoursSpent", "createdAt", "updatedAt") VALUES
('goal-globant', 1, 'PROFESIONAL', 'Certificado Globant', 'Certificado interno de manejo y conocimiento de IA de Globant - obligatorio laboral', 'ALTA', 'ACTIVE', '2026-05-30', 40, 0, NOW(), NOW());

-- Certificación Claude Code
INSERT INTO "Goal" (id, "userId", category, title, description, priority, status, deadline, "estimatedHours", "totalHoursSpent", "createdAt", "updatedAt") VALUES
('goal-claude-code', 1, 'PROFESIONAL', 'Certificación Claude Code', 'Obtener certificación oficial de Claude Code para demostrar dominio a reclutadores', 'MEDIA', 'ACTIVE', '2026-07-31', 20, 0, NOW(), NOW());

-- Curso Udemy
INSERT INTO "Goal" (id, "userId", category, title, description, priority, status, deadline, "estimatedHours", "totalHoursSpent", "createdAt", "updatedAt") VALUES
('goal-udemy', 1, 'PROFESIONAL', 'Curso Udemy - Patrones y Microservicios', 'Temas: Patrones de diseño, microservicios, arquitecturas de computadores', 'MEDIA', 'ACTIVE', '2026-12-31', 25, 0, NOW(), NOW());

-- Java Avanzado
INSERT INTO "Goal" (id, "userId", category, title, description, priority, status, deadline, "estimatedHours", "totalHoursSpent", "createdAt", "updatedAt") VALUES
('goal-java', 1, 'PROFESIONAL', 'Java Avanzado - Senior Developer Path', 'Dominar: Streams y Lambdas, Programación reactiva, Design Patterns avanzados, Java 21, Spring Boot AI', 'ALTA', 'ACTIVE', '2026-12-31', 70, 0, NOW(), NOW());

-- ============================================
-- GOALS - PERSONAL
-- ============================================

-- Mejorar Estado Físico (Gym)
INSERT INTO "Goal" (id, "userId", category, title, description, priority, status, deadline, "estimatedHours", "totalHoursSpent", "createdAt", "updatedAt") VALUES
('goal-gym', 1, 'PERSONAL', 'Mejorar Estado Físico', 'Ir al gym 4 veces por semana para mejorar condición física general', 'MEDIA', 'ACTIVE', '2026-06-30', 0, 0, NOW(), NOW());

-- Mejorar Inglés
INSERT INTO "Goal" (id, "userId", category, title, description, priority, status, deadline, "estimatedHours", "totalHoursSpent", "createdAt", "updatedAt") VALUES
('goal-ingles', 1, 'PERSONAL', 'Mejorar Nivel de Inglés a B2', 'Pasar de B1 a B2 - enfocarse en listening para entender reuniones técnicas', 'MEDIA', 'ACTIVE', '2026-09-30', 100, 0, NOW(), NOW());

-- Mejorar Sueño
INSERT INTO "Goal" (id, "userId", category, title, description, priority, status, deadline, "estimatedHours", "totalHoursSpent", "createdAt", "updatedAt") VALUES
('goal-sueno', 1, 'PERSONAL', 'Mejorar Calidad de Sueño', 'Aumentar de 5-6 a 7-8 horas de sueño - URGENTE (afecta todos los otros objetivos)', 'ALTA', 'ACTIVE', '2026-05-31', 0, 0, NOW(), NOW());

-- ============================================
-- MILESTONES - agente-config
-- ============================================
INSERT INTO "GoalMilestone" (id, "goalId", title, "targetDate", completed, "order") VALUES
('ms-agente-1', 'goal-agente-config', 'Definir arquitectura + CLI básico', '2026-05-10', false, 0),
('ms-agente-2', 'goal-agente-config', 'Guardado de configs + replicación básica', '2026-05-20', false, 1),
('ms-agente-3', 'goal-agente-config', 'Tests + documentación MVP', '2026-05-28', false, 2),
('ms-agente-4', 'goal-agente-config', 'MVP FUNCIONAL', '2026-05-31', false, 3);

-- ============================================
-- MILESTONES - Globant
-- ============================================
INSERT INTO "GoalMilestone" (id, "goalId", title, "targetDate", completed, "order") VALUES
('ms-globant-1', 'goal-globant', 'Completar módulos 1-10 (10h)', '2026-05-04', false, 0),
('ms-globant-2', 'goal-globant', 'Completar módulos 11-20 (10h)', '2026-05-11', false, 1),
('ms-globant-3', 'goal-globant', 'Completar módulos 21-30 (10h)', '2026-05-18', false, 2),
('ms-globant-4', 'goal-globant', 'Repaso + simulacro final (10h)', '2026-05-25', false, 3),
('ms-globant-5', 'goal-globant', 'EXAMEN APROBADO', '2026-05-30', false, 4);

-- ============================================
-- MILESTONES - Gimnasio
-- ============================================
INSERT INTO "GoalMilestone" (id, "goalId", title, "targetDate", completed, "order") VALUES
('ms-gym-1', 'goal-gym', 'Establecer rutina (4 días/semana)', '2026-05-31', false, 0),
('ms-gym-2', 'goal-gym', '13/16 sesiones en Junio (80% asistencia)', '2026-06-30', false, 1),
('ms-gym-3', 'goal-gym', 'Consolidar hábito (4x semana por 3 meses)', '2026-09-30', false, 2);

-- ============================================
-- MILESTONES - Sueño
-- ============================================
INSERT INTO "GoalMilestone" (id, "goalId", title, "targetDate", completed, "order") VALUES
('ms-sueno-1', 'goal-sueno', 'Establecer rutina, lograr 3 noches de 8h', '2026-05-15', false, 0),
('ms-sueno-2', 'goal-sueno', '5 noches de 8h consistentemente', '2026-05-31', false, 1),
('ms-sueno-3', 'goal-sueno', 'Hábito consolidado (2 meses)', '2026-06-30', false, 2);

-- ============================================
-- MILESTONES - Java
-- ============================================
INSERT INTO "GoalMilestone" (id, "goalId", title, "targetDate", completed, "order") VALUES
('ms-java-1', 'goal-java', 'Streams y Lambdas dominados', '2026-08-31', false, 0),
('ms-java-2', 'goal-java', 'Programación reactiva + Patterns', '2026-09-30', false, 1),
('ms-java-3', 'goal-java', 'Java 21 features', '2026-10-31', false, 2),
('ms-java-4', 'goal-java', 'Spring Boot AI en proyecto real', '2026-11-30', false, 3),
('ms-java-5', 'goal-java', 'Review final + evaluación', '2026-12-31', false, 4);

-- ============================================
-- MILESTONES - Inglés
-- ============================================
INSERT INTO "GoalMilestone" (id, "goalId", title, "targetDate", completed, "order") VALUES
('ms-ingles-1', 'goal-ingles', '20h acumuladas, entender 50% conversaciones simples', '2026-06-30', false, 0),
('ms-ingles-2', 'goal-ingles', '40h acumuladas, seguir reuniones técnicas básicas', '2026-07-31', false, 1),
('ms-ingles-3', 'goal-ingles', 'Nivel B2 alcanzado', '2026-09-30', false, 2);

-- ============================================
-- SAMPLE DAILY PROGRESS (Last 7 days)
-- ============================================
INSERT INTO "DailyProgress" (id, "userId", date, "gymCompleted", "sleepHours", "studyHours", "workHours", notes, "createdAt", "updatedAt") VALUES
('dp-1', 1, CURRENT_DATE - INTERVAL '6 days', true, 7.5, 2.0, 1.0, 'Buen día', NOW(), NOW()),
('dp-2', 1, CURRENT_DATE - INTERVAL '5 days', false, 6.0, 1.5, 0, 'Dormí tarde', NOW(), NOW()),
('dp-3', 1, CURRENT_DATE - INTERVAL '4 days', true, 7.0, 2.5, 1.5, 'Globant módulo 5', NOW(), NOW()),
('dp-4', 1, CURRENT_DATE - INTERVAL '3 days', true, 7.5, 1.0, 0, 'Sesión corta', NOW(), NOW()),
('dp-5', 1, CURRENT_DATE - INTERVAL '2 days', false, 5.5, 3.0, 2.0, 'Mucho trabajo muerto', NOW(), NOW()),
('dp-6', 1, CURRENT_DATE - INTERVAL '1 day', true, 8.0, 2.0, 1.0, 'Bien', NOW(), NOW());

-- ============================================
-- SAMPLE WEEKLY CHECK-INS
-- ============================================
INSERT INTO "WeeklyCheckIn" (id, "userId", "weekStartDate", "fatigueLevel", "completedHours", deviations, "adjustmentNotes", "createdAt") VALUES
('wc-1', 1, CURRENT_DATE - INTERVAL '14 days', 3, 12, 'Globant tomó más tiempo del esperado', 'Ajustar distribución dead time', NOW()),
('wc-2', 1, CURRENT_DATE - INTERVAL '7 days', 4, 10, 'No pude hacer mucho Lunes', 'Recuperaré esta semana', NOW());

-- ============================================
-- VERIFICATION QUERY
-- ============================================
SELECT 'Goals' as entity, COUNT(*) as count FROM "Goal" WHERE "userId" = 1
UNION ALL
SELECT 'Milestones' as entity, COUNT(*) as count FROM "GoalMilestone" WHERE "goalId" IN (SELECT id FROM "Goal" WHERE "userId" = 1)
UNION ALL
SELECT 'Phases' as entity, COUNT(*) as count FROM "Phase" WHERE "userId" = 1
UNION ALL
SELECT 'DailyProgress' as entity, COUNT(*) as count FROM "DailyProgress" WHERE "userId" = 1
UNION ALL
SELECT 'WeeklyCheckIns' as entity, COUNT(*) as count FROM "WeeklyCheckIn" WHERE "userId" = 1;
