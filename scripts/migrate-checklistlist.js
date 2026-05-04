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
      console.warn(`  ⚠️  Not found: ${oldStr.slice(0, 80)}...`);
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.basename(filePath)}`);
  }
}

const ROOT = path.join(__dirname, '..', 'src');

// ─── ChecklistList.tsx ───
replaceInFile(path.join(ROOT, 'components', 'ChecklistList.tsx'), [
  // getStatus refactor
  [`export function getStatus(c: Checklist): { label: string; style: React.CSSProperties } {`,
   `export function getStatus(c: Checklist): { key: string; label: string; style: React.CSSProperties } {`],
  [`if (c.lifecycleState === 'Completed') return { label: 'Completed', style: successStyle }`,
   `if (c.lifecycleState === 'Completed') return { key: 'completed', label: t('checklists.status.completed'), style: successStyle }`],
  [`if (c.lifecycleState === 'Archived') return { label: 'Archived', style: mutedStyle }`,
   `if (c.lifecycleState === 'Archived') return { key: 'archived', label: t('checklists.status.archived'), style: mutedStyle }`],
  [`if (!c.startDate && !c.endDate) return { label: 'No dates', style: mutedStyle }`,
   `if (!c.startDate && !c.endDate) return { key: 'no-dates', label: t('checklists.status.noDates'), style: mutedStyle }`],
  [`if (end && end < now) return { label: 'Expired', style: dangerStyle }`,
   `if (end && end < now) return { key: 'expired', label: t('checklists.status.expired'), style: dangerStyle }`],
  [`if (days <= 3) return { label: \`\${days}d left\`, style: warningStyle }`,
   `if (days <= 3) return { key: 'days-left', label: t('checklists.status.daysLeft', { count: days }), style: warningStyle }`],
  [`if (start && start > now) return { label: 'Upcoming', style: infoStyle }`,
   `if (start && start > now) return { key: 'upcoming', label: t('checklists.status.upcoming'), style: infoStyle }`],
  [`return { label: 'Active', style: successStyle }`,
   `return { key: 'active', label: t('checklists.status.active'), style: successStyle }`],
  // Title / header
  [`<h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Checklists</h2>`,
   `<h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('checklists.title')}</h2>`],
  [`<p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{checklists.length} checklists</p>`,
   `<p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('checklists.checklistCount', { count: checklists.length })}</p>`],
  [`New Checklist`, ` {t('checklists.newChecklist')}`],
  // Tab labels
  [`{ value: 'active', label: 'Active' },`, `{ value: 'active', label: t('checklists.tabs.active') },`],
  [`{ value: 'templates', label: 'Templates' },`, `{ value: 'templates', label: t('checklists.tabs.templates') },`],
  [`{ value: 'history', label: 'History' },`, `{ value: 'history', label: t('checklists.tabs.history') },`],
  // Search placeholder
  [`placeholder="Search checklists..."`, `placeholder={t('checklists.searchPlaceholder')}`],
  // Filters
  [`{ value: 'all', label: 'All' },`, `{ value: 'all', label: t('checklists.filters.all') },`],
  [`{ value: 'active', label: 'Active' },`, `{ value: 'active', label: t('checklists.filters.active') },`],
  [`{ value: 'expired', label: 'Expired' },`, `{ value: 'expired', label: t('checklists.filters.expired') },`],
  [`{ value: 'no-dates', label: 'No dates' },`, `{ value: 'no-dates', label: t('checklists.filters.noDates') },`],
  [`<option value="">All categories</option>`, `<option value="">{t('common.all')}</option>`],
  // Sort options
  [`{ value: 'newest', label: 'Newest' },`, `{ value: 'newest', label: t('checklists.sort.newest') },`],
  [`{ value: 'name', label: 'Name' },`, `{ value: 'name', label: t('checklists.sort.name') },`],
  [`{ value: 'progress', label: 'Progress' },`, `{ value: 'progress', label: t('checklists.sort.progress') },`],
  [`{ value: 'due-date', label: 'Due date' },`, `{ value: 'due-date', label: t('checklists.sort.dueDate') },`],
  // Empty states
  [`{search ? 'No results' : tab === 'templates' ? 'No templates yet' : tab === 'history' ? 'No history yet' : 'No checklists yet'}`,
   `{search ? t('checklists.noResults') : tab === 'templates' ? t('checklists.noTemplates') : tab === 'history' ? t('checklists.noHistory') : t('checklists.noChecklists')}`],
  [`{search ? 'Try a different search' : tab === 'templates' ? 'Create a template to get started' : tab === 'history' ? 'Complete and archive checklists to see them here' : 'Create one to get started'}`,
   `{search ? t('checklists.tryDifferentSearch') : tab === 'templates' ? t('checklists.createTemplateHint') : tab === 'history' ? t('checklists.archiveHint') : t('checklists.createHint')}`],
  // Filter logic fix
  [`const status = getStatus(c).label\n    if (filter === 'all') return true\n    const status = getStatus(c).label\n    if (filter === 'active') return status === 'Active' || status.includes('left') || status === 'Upcoming'\n    if (filter === 'expired') return status === 'Expired'\n    if (filter === 'no-dates') return status === 'No dates'`,
   `const statusKey = getStatus(c).key\n    if (filter === 'all') return true\n    if (filter === 'active') return statusKey === 'active' || statusKey === 'days-left' || statusKey === 'upcoming'\n    if (filter === 'expired') return statusKey === 'expired'\n    if (filter === 'no-dates') return statusKey === 'no-dates'`],
  // MiniDashboard
  [`{priority} priority`, `{t('checklists.priorityLabel', { priority })}`],
  [`Est. effort: {Math.floor(effort / 60)}h {effort % 60}m`, `{t('checklists.estEffort', { hours: Math.floor(effort / 60), minutes: effort % 60 })}`],
  // Items count
  [`return \`\${itemsList.filter(i => i.completed).length}/\${itemsList.length} (\${progress}%)\``, `return t('checklists.itemsCount', { completed: itemsList.filter(i => i.completed).length, total: itemsList.length, progress })`],
  // History metrics
  [`<span>Items: {(c as any).metrics.totalItems}</span>`, `<span>{t('checklists.historyMetrics.items', { count: (c as any).metrics.totalItems })}</span>`],
  [`<span>Completed: {(c as any).metrics.completedItems}</span>`, `<span>{t('checklists.historyMetrics.completed', { count: (c as any).metrics.completedItems })}</span>`],
  [`<span>Completion: {(c as any).metrics.completionPercentage}%</span>`, `<span>{t('checklists.historyMetrics.completion', { count: (c as any).metrics.completionPercentage })}</span>`],
  [`<span>Effort: {Math.floor((c as any).metrics.totalEffort / 60)}h {(c as any).metrics.totalEffort % 60}m</span>`, `<span>{t('checklists.historyMetrics.effort', { hours: Math.floor((c as any).metrics.totalEffort / 60), minutes: (c as any).metrics.totalEffort % 60 })}</span>`],
  // Undo toast
  [`<span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{message}</span>`, `<span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{message}</span>`], // keep message as is, it's dynamic
  [`Undo`, `{t('checklists.expandedItems.undo')}`],
  // InlineItemInput
  [`placeholder="Add item..."`, `placeholder={t('checklists.expandedItems.addItem')}`],
  [`<option value="low">Low</option>`, `<option value="low">{t('checklists.expandedItems.low')}</option>`],
  [`<option value="normal">Normal</option>`, `<option value="normal">{t('checklists.expandedItems.normal')}</option>`],
  [`<option value="high">High</option>`, `<option value="high">{t('checklists.expandedItems.high')}</option>`],
  [`<option value="">No parent</option>`, `<option value="">{t('checklists.expandedItems.noParent')}</option>`],
  [`Add`, `{t('checklists.expandedItems.add')}`],
  // ExpandedItems
  [`{hideCompleted ? \`Show completed (\${completedCount})\` : 'Hide completed'}`, `{hideCompleted ? t('checklists.expandedItems.showCompleted', { count: completedCount }) : t('checklists.expandedItems.hideCompleted')}`],
  [`{hideCompleted ? 'All items completed!' : 'No items yet — add one below'}`, `{hideCompleted ? t('checklists.expandedItems.allCompleted') : t('checklists.expandedItems.noItems')}`],
  [`Blocked`, `{t('checklists.expandedItems.blocked')}`],
  [`Add notes...`, `{t('checklists.expandedItems.notesPlaceholder')}`],
  [`No blocker`, `{t('checklists.expandedItems.noBlocker')}`],
  [`Save`, `{t('common.save')}`],
  [`Cancel`, `{t('common.cancel')}`],
  [`\"\${undoItem.item.title}\" deleted`, `t('checklists.expandedItems.deleted', { title: undoItem.item.title })`],
  [`\"\${undoChecklist.checklist.title}\" deleted`, `t('checklists.expandedItems.deleted', { title: undoChecklist.checklist.title })`],
]);

console.log('ChecklistList replacements done');
