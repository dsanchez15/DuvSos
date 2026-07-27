'use client'

import { useState } from 'react'
import SettingCard from '@/components/SettingCard'
import { Button, Input } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'

export const CATEGORY_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
]

export interface SettingsCategory {
  id: number
  name: string
  color: string
}

interface CategoriesManagerCardProps {
  categories: SettingsCategory[]
  onCreateCategory: (name: string, color: string) => Promise<void>
  onDeleteCategory: (id: number) => void
}

export default function CategoriesManagerCard({
  categories,
  onCreateCategory,
  onDeleteCategory,
}: CategoriesManagerCardProps) {
  const { t } = useAppTranslation()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0].value)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await onCreateCategory(newName.trim(), newColor)
    setNewName('')
    setNewColor(CATEGORY_COLORS[0].value)
    setShowForm(false)
  }

  return (
    <SettingCard>
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">label</span>
        <h2 className="text-lg font-semibold">{t('settings.todoCategories')}</h2>
      </div>
      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-sm text-text-muted">{t('settings.noCategories')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 rounded-[8px] border border-border bg-bg-surface px-3 py-2"
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-medium">{cat.name}</span>
                {cat.name !== 'General' && (
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="settings-cat-delete-btn text-text-muted"
                    aria-label={`${t('common.delete')} ${cat.name}`}
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-[8px] bg-bg-surface-hover p-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('settings.categoryNamePlaceholder')}
              aria-label={t('settings.categoryNamePlaceholder')}
              autoFocus
            />
            <div className="flex gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setNewColor(c.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${newColor === c.value ? 'scale-110' : 'border-transparent'}`}
                  style={{
                    backgroundColor: c.value,
                    ...(newColor === c.value ? { borderColor: 'var(--color-text-primary)' } : {}),
                  }}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setNewName('')
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={!newName.trim()}>
                {t('common.create')}
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-[8px] border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            {t('settings.newCategory')}
          </button>
        )}
      </div>
    </SettingCard>
  )
}
