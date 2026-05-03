export const translations = {
  en: {
    common: {
      loading: 'Loading...',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      back: 'Back',
      search: 'Search',
      filter: 'Filter',
      required: 'Required',
      optional: 'Optional',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      close: 'Close',
    },
    login: {
      welcomeBack: "Welcome back! Let's track your progress.",
      createAccount: 'Create an account to start tracking.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@example.com',
      nameLabel: 'Full Name',
      namePlaceholder: 'John Doe',
      passwordLabel: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      processing: 'Processing...',
      logIn: 'Log In',
      signUp: 'Sign Up',
      noAccount: "Don't have an account? ",
      hasAccount: 'Already have an account? ',
      signUpFree: 'Sign up for free',
      logInLink: 'Log in',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      support: 'Support',
    },
    goals: {
      title: 'Goals',
      subtitle: 'Continuous improvement plan',
      newGoal: 'New goal',
      phases: 'Phases',
      showInactive: 'Show paused and completed',
      allCategories: 'All categories',
      noGoals: 'No goals',
      createFirst: 'Create your first goal to get started',
      titleLabel: 'Title *',
      descriptionLabel: 'Description',
      categoryLabel: 'Category',
      priorityLabel: 'Priority',
      deadlineLabel: 'Deadline',
      estimatedHoursLabel: 'Estimated hours',
      phaseLabel: 'Phase',
      milestones: 'Milestones',
      addMilestone: 'Add milestone',
      milestoneTitlePlaceholder: 'Milestone title',
      milestoneDateRequired: 'All milestones must have a target date',
      noPhase: 'No phase',
      status: {
        pending: 'Pending',
        active: 'Active',
        completed: 'Completed',
        paused: 'Paused',
        cancelled: 'Cancelled',
      },
      actions: {
        activate: 'Activate',
        pause: 'Pause',
        complete: 'Mark complete',
        deleteGoal: 'Delete goal',
        editGoal: 'Edit goal',
      },
      progress: {
        title: 'Progress',
        timeInvested: 'Time invested',
        estimated: 'Estimated',
        deadline: 'Deadline',
        phase: 'Phase',
      },
      alerts: {
        noProgress: 'This goal has no progress yet. You can edit or delete it.',
        pendingNoComplete: 'A pending goal cannot be marked as complete. Activate it first.',
        activeNoEdit: 'An active goal cannot be edited. Pause it first if needed.',
        pausedNoCheck: 'A paused goal cannot have milestones checked. Activate it first.',
        completedLocked: 'This goal is completed and cannot be modified.',
      },
    },
    phases: {
      title: 'Plan phases',
      subtitle: 'Organize your goals into timed phases',
      newPhase: 'New phase',
      phaseNumber: 'Phase number *',
      phaseTitle: 'Title *',
      description: 'Description',
      startDate: 'Start date',
      endDate: 'End date',
      noPhases: 'No phases',
      createPhaseHint: 'Create phases to organize your goals',
      goalsCount: '{{count}} goals',
    },
    progress: {
      title: 'Progress & Check-in',
      subtitle: 'Log your activity and reflect on your plan',
      newEntry: 'New entry',
      activityLog: 'Activity log',
      weeklyCheckIn: 'Weekly check-in',
      calendar: 'Calendar',
      history: 'History',
      date: 'Date',
      goal: 'Goal',
      startTime: 'Start time',
      duration: 'Duration (hours/minutes)',
      phase: 'Phase',
      notes: 'Notes',
      plannedTime: 'Planned time',
      actualTime: 'Actual time',
      fatigueLevel: 'Fatigue level',
      deviations: 'Deviations',
      adjustments: 'Adjustments',
      saveProgress: 'Save progress',
      saveCheckIn: 'Save check-in',
      weekOf: 'Week of',
    },
    sidebar: {
      dashboard: 'Dashboard',
      todos: 'To-Do List',
      checklists: 'Checklists',
      reminders: 'Reminders',
      habits: 'Habits',
      plan: 'Plan',
      goals: 'Goals',
      progressAndCheckIn: 'Progress & Check-in',
      settings: 'Settings',
      support: 'Support',
      logout: 'Log Out',
    },
  },
  es: {
    common: {
      loading: 'Cargando...',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      back: 'Volver',
      search: 'Buscar',
      filter: 'Filtrar',
      required: 'Obligatorio',
      optional: 'Opcional',
      error: 'Error',
      success: 'Éxito',
      confirm: 'Confirmar',
      close: 'Cerrar',
    },
    login: {
      welcomeBack: '¡Bienvenido de nuevo! Sigamos tu progreso.',
      createAccount: 'Crea una cuenta para empezar a registrar.',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'nombre@ejemplo.com',
      nameLabel: 'Nombre completo',
      namePlaceholder: 'Juan Pérez',
      passwordLabel: 'Contraseña',
      rememberMe: 'Recordarme',
      forgotPassword: '¿Olvidaste tu contraseña?',
      processing: 'Procesando...',
      logIn: 'Iniciar sesión',
      signUp: 'Registrarse',
      noAccount: '¿No tienes cuenta? ',
      hasAccount: '¿Ya tienes cuenta? ',
      signUpFree: 'Regístrate gratis',
      logInLink: 'Inicia sesión',
      privacyPolicy: 'Política de privacidad',
      termsOfService: 'Términos de servicio',
      support: 'Soporte',
    },
    goals: {
      title: 'Objetivos',
      subtitle: 'Plan de mejora continua',
      newGoal: 'Nuevo objetivo',
      phases: 'Fases',
      showInactive: 'Mostrar pausados y completados',
      allCategories: 'Todas las categorías',
      noGoals: 'Sin objetivos',
      createFirst: 'Crea tu primer objetivo para empezar',
      titleLabel: 'Título *',
      descriptionLabel: 'Descripción',
      categoryLabel: 'Categoría',
      priorityLabel: 'Prioridad',
      deadlineLabel: 'Fecha límite',
      estimatedHoursLabel: 'Horas estimadas',
      phaseLabel: 'Fase',
      milestones: 'Hitos',
      addMilestone: 'Añadir hito',
      milestoneTitlePlaceholder: 'Título del hito',
      milestoneDateRequired: 'Todos los hitos deben tener una fecha objetivo',
      noPhase: 'Sin fase',
      status: {
        pending: 'Pendiente',
        active: 'Activo',
        completed: 'Completado',
        paused: 'Pausado',
        cancelled: 'Cancelado',
      },
      actions: {
        activate: 'Activar',
        pause: 'Pausar',
        complete: 'Marcar completo',
        deleteGoal: 'Eliminar objetivo',
        editGoal: 'Editar objetivo',
      },
      progress: {
        title: 'Progreso',
        timeInvested: 'Tiempo invertido',
        estimated: 'Estimado',
        deadline: 'Fecha límite',
        phase: 'Fase',
      },
      alerts: {
        noProgress: 'Este objetivo aún no tiene progreso. Puedes editar o eliminar.',
        pendingNoComplete: 'Un objetivo pendiente no puede marcarse como completo. Actívalo primero.',
        activeNoEdit: 'Un objetivo activo no puede editarse. Ponlo en pausa primero si es necesario.',
        pausedNoCheck: 'Un objetivo pausado no puede tener hitos marcados. Actívalo primero.',
        completedLocked: 'Este objetivo está completado y no puede modificarse.',
      },
    },
    phases: {
      title: 'Fases del plan',
      subtitle: 'Organiza tus objetivos en fases temporizadas',
      newPhase: 'Nueva fase',
      phaseNumber: 'Número de fase *',
      phaseTitle: 'Título *',
      description: 'Descripción',
      startDate: 'Fecha inicio',
      endDate: 'Fecha fin',
      noPhases: 'Sin fases',
      createPhaseHint: 'Crea fases para organizar tus objetivos',
      goalsCount: '{{count}} objetivos',
    },
    progress: {
      title: 'Progreso y Check-in',
      subtitle: 'Registra tu actividad y reflexiona sobre tu plan',
      newEntry: 'Nuevo registro',
      activityLog: 'Registro de actividad',
      weeklyCheckIn: 'Check-in semanal',
      calendar: 'Calendario',
      history: 'Historial',
      date: 'Fecha',
      goal: 'Objetivo',
      startTime: 'Hora de inicio',
      duration: 'Duración (horas/minutos)',
      phase: 'Fase',
      notes: 'Notas',
      plannedTime: 'Hora planeada',
      actualTime: 'Hora real',
      fatigueLevel: 'Nivel de fatiga',
      deviations: 'Desviaciones',
      adjustments: 'Ajustes',
      saveProgress: 'Guardar progreso',
      saveCheckIn: 'Guardar check-in',
      weekOf: 'Semana del',
    },
    sidebar: {
      dashboard: 'Dashboard',
      todos: 'To-Do List',
      checklists: 'Checklists',
      reminders: 'Reminders',
      habits: 'Habits',
      plan: 'Plan',
      goals: 'Goals',
      progressAndCheckIn: 'Progress y Check-in',
      settings: 'Settings',
      support: 'Support',
      logout: 'Log Out',
    },
  },
} as const;

export type Language = 'en' | 'es';
export type Translations = typeof translations.en;

let currentLanguage: Language = 'es';

try {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('app-language') as Language;
    if (stored === 'en' || stored === 'es') {
      currentLanguage = stored;
    }
  }
} catch {
  // ignore
}

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('app-language', lang);
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  if (vars) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, varName) => String(vars[varName] ?? `{{${varName}}}`));
  }

  return value;
}
