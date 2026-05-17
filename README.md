# Habit Tracker

Aplicación de seguimiento de hábitos, metas y productividad personal construida con Next.js.

## Características

- **Hábitos**: Seguimiento diario de hábitos personales
- **Metas (Goals)**: Definición de objetivos con fases y milestones
- **Checklists**: Listas de verificación para tareas específicas
- **Todos**: Gestión de tareas pendientes
- **Progreso**: Visualización del avance en el tiempo
- **Recordatorios**: Sistema de reminders para mantener el foco
- **Check-in**: Registro diario de estado y actividades
- **Dashboard**: Vista general de toda la actividad

## Tecnologías

- [Next.js](https://nextjs.org) 16
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Prisma](https://www.prisma.io) + PostgreSQL (Neon)
- [Vitest](https://vitest.dev) + Testing Library
- [pnpm](https://pnpm.io) 11

## Requisitos

- Node.js 20+
- pnpm 11+

## Empezar

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm test` | Ejecutar tests (Vitest) |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm db:sync` | Sincronizar schema de Prisma con la base de datos |
| `pnpm db:migrate` | Crear y aplicar migraciones de Prisma |

## Variables de entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
DATABASE_URL="postgresql://..."
# otras variables necesarias
```

## Estructura del proyecto

```
├── prisma/           # Schema y migraciones de Prisma
├── src/
│   ├── app/          # Rutas y páginas de Next.js (App Router)
│   ├── components/   # Componentes React reutilizables
│   └── lib/          # Utilidades, hooks y lógica compartida
├── scripts/          # Scripts de automatización
└── tests/            # Tests unitarios y de integración
```

## Despliegue

Este proyecto está optimizado para desplegar en [Vercel](https://vercel.com).

---

*Proyecto privado - Habit Tracker*
