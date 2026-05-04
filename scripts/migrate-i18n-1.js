const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [oldStr, newStr] of replacements) {
    if (content.includes(oldStr)) {
      content = content.split(oldStr).join(newStr);
      changed = true;
    } else {
      console.warn(`  ⚠️  Not found in ${filePath}: ${oldStr.slice(0, 60)}...`);
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath}`);
  }
}

const ROOT = path.join(__dirname, '..', 'src');

// ─── PlanningView.tsx ───
replaceInFile(path.join(ROOT, 'components', 'PlanningView.tsx'), [
  [`<h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Planificación</h2>`,
   `<h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('habits.planning.title')}</h2>`],
  [`{habits.length} hábito{habits.length !== 1 ? 's' : ''} configurado{habits.length !== 1 ? 's' : ''}`,
   `{t('habits.planning.habitCount', { count: habits.length })}`],
  [`{showForm ? 'Cancelar' : 'Nuevo Hábito'}`, `{showForm ? t('habits.planning.cancel') : t('habits.planning.newHabit')}`],
  [`<h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Crear Nuevo Hábito</h3>`,
   `<h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('habits.planning.createHabit')}</h3>`],
  [`{f === 'All' ? 'Todos' : f === 'Active' ? 'Activos' : f === 'Paused' ? 'Pausados' : 'Archivados'}`,
   `{f === 'All' ? t('habits.planning.filters.all') : f === 'Active' ? t('habits.planning.filters.active') : f === 'Paused' ? t('habits.planning.filters.paused') : t('habits.planning.filters.archived')}`],
  [`<p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>No hay hábitos en esta categoría</p>`,
   `<p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>{t('habits.planning.noHabits')}</p>`],
]);

// ─── ActionView.tsx ───
replaceInFile(path.join(ROOT, 'components', 'ActionView.tsx'), [
  [`<h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Acción Diaria</h2>`,
   `<h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('habits.action.title')}</h2>`],
  [`{completedCount}/{habitsWithMetrics.length} completados hoy`, `{t('habits.action.completedToday', { completed: completedCount, total: habitsWithMetrics.length })}`],
  [`<p className="level-up-text text-lg font-bold text-primary">¡Subiste de nivel!</p>`,
   `<p className="level-up-text text-lg font-bold text-primary">{t('habits.action.levelUp')}</p>`],
  [`<p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nivel {popup.newLevel} - {getLevelName(popup.newLevel)}</p>`,
   `<p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('habits.action.level', { level: popup.newLevel, name: getLevelName(popup.newLevel) })}</p>`],
  [`<p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>\n                  +{popup.xp} XP\n                </p>`,
   `<p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>\n                  +{popup.xp} XP\n                </p>`], // keep XP as is, it's a gaming term
  [`<p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>No hay hábitos activos para hoy</p>`,
   `<p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>{t('habits.action.noActiveHabits')}</p>`],
  [`<p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Crea hábitos en la vista de planificación</p>`,
   `<p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('habits.action.createInPlanning')}</p>`],
  [`{completedCount === habitsWithMetrics.length\n              ? '🎉 Excelente! Completaste todos tus hábitos hoy.'\n              : completedCount === 0\n              ? '💪 Empieza con un hábito y construye momentum.'\n              : \`🌟 Vas bien! ${completedCount}/${habitsWithMetrics.length} hábitos completados.\`}`,
   `{completedCount === habitsWithMetrics.length\n              ? t('habits.action.allCompleted')\n              : completedCount === 0\n              ? t('habits.action.startMomentum')\n              : t('habits.action.progress', { completed: completedCount, total: habitsWithMetrics.length })}`],
  [`{habit.metrics.completionsThisPeriod} de {habit.goalValue} {periodLabel}`,
   `{habit.metrics.completionsThisPeriod} {t('habits.action.of')} {habit.goalValue} {periodLabel}`], // need to add 'of' key
]);

// ─── ArchiveView.tsx ───
replaceInFile(path.join(ROOT, 'components', 'ArchiveView.tsx'), [
  [`<h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Archivo Histórico</h2>`,
   `<h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('habits.archive.title')}</h2>`],
  [`<p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Analiza tu progreso pasado</p>`,
   `<p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.subtitle')}</p>`],
  [`{ value: 1, label: 'Enero' },`, `{ value: 1, label: t('habits.archive.months.january') },`],
  [`{ value: 2, label: 'Febrero' },`, `{ value: 2, label: t('habits.archive.months.february') },`],
  [`{ value: 3, label: 'Marzo' },`, `{ value: 3, label: t('habits.archive.months.march') },`],
  [`{ value: 4, label: 'Abril' },`, `{ value: 4, label: t('habits.archive.months.april') },`],
  [`{ value: 5, label: 'Mayo' },`, `{ value: 5, label: t('habits.archive.months.may') },`],
  [`{ value: 6, label: 'Junio' },`, `{ value: 6, label: t('habits.archive.months.june') },`],
  [`{ value: 7, label: 'Julio' },`, `{ value: 7, label: t('habits.archive.months.july') },`],
  [`{ value: 8, label: 'Agosto' },`, `{ value: 8, label: t('habits.archive.months.august') },`],
  [`{ value: 9, label: 'Septiembre' },`, `{ value: 9, label: t('habits.archive.months.september') },`],
  [`{ value: 10, label: 'Octubre' },`, `{ value: 10, label: t('habits.archive.months.october') },`],
  [`{ value: 11, label: 'Noviembre' },`, `{ value: 11, label: t('habits.archive.months.november') },`],
  [`{ value: 12, label: 'Diciembre' },`, `{ value: 12, label: t('habits.archive.months.december') },`],
  [`<p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Completaciones</p>`,
   `<p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.totalCompletions')}</p>`],
  [`<p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Hábitos Activos</p>`,
   `<p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.activeHabits')}</p>`],
  [`<p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Mejor Racha</p>`,
   `<p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.bestStreak')}</p>`],
  [`<h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Detalle por Hábito</h3>`,
   `<h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('habits.archive.habitDetail')}</h3>`],
  [`<p style={{ color: 'var(--color-text-muted)' }}>No hay hábitos para mostrar</p>`,
   `<p style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.noHabits')}</p>`],
  [`{completions} completaciones · Racha actual: {streak} · Tasa: {rate}%`,
   `{t('habits.archive.completions', { count: completions })} · {t('habits.archive.currentStreak', { count: streak })} · {t('habits.archive.rate', { rate })}`],
  [`{habit.state === 'Active' ? 'Activo' : habit.state === 'Paused' ? 'Pausado' : 'Archivado'}`,
   `{habit.state === 'Active' ? t('habits.archive.status.active') : habit.state === 'Paused' ? t('habits.archive.status.paused') : t('habits.archive.status.archived')}`],
  [`<p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Últimas completaciones</p>`,
   `<p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('habits.archive.lastCompletions')}</p>`],
]);

console.log('Done with batch 1');
