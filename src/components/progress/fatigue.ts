type TranslateFn = (key: string, params?: Record<string, string | number>) => string

const FATIGUE_KEYS: Record<number, string> = {
  1: 'progress.veryLowFatigue',
  2: 'progress.lowFatigue',
  3: 'progress.normalFatigue',
  4: 'progress.highFatigue',
  5: 'progress.veryHighFatigue',
}

export function fatigueLabel(level: number, t: TranslateFn): string {
  const key = FATIGUE_KEYS[level]
  return key ? t(key) : t('progress.normalFatigue')
}

export function fatigueBadgeVariant(level: number): 'danger' | 'success' | 'warning' {
  if (level >= 4) return 'danger'
  if (level <= 2) return 'success'
  return 'warning'
}
