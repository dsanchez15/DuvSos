'use client'

import { useState } from 'react'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Goal, Phase } from '@/types/goal'
import type { EditableMilestone, GoalEditData } from '@/hooks/useGoal'

interface GoalEditFormProps {
  goal: Goal
  phases: Phase[]
  saving: boolean
  onSave: (data: GoalEditData) => Promise<boolean>
  onCancel: () => void
}

export default function GoalEditForm({ goal, phases, saving, onSave, onCancel }: GoalEditFormProps) {
  const { t } = useAppTranslation()

  const [form, setForm] = useState<Partial<Goal>>({ ...goal })
  const [milestones, setMilestones] = useState<EditableMilestone[]>(
    goal.milestones?.map((m) => ({
      id: m.id,
      title: m.title,
      targetDate: m.targetDate ? new Date(m.targetDate).toISOString().split('T')[0] : '',
    })) || []
  )
  const [milestoneErrors, setMilestoneErrors] = useState<Record<number, string>>({})

  const set = <K extends keyof Goal>(key: K, value: Goal[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', targetDate: '' }])
    setMilestoneErrors({})
  }

  const updateMilestone = (index: number, field: 'title' | 'targetDate', value: string) => {
    const updated = [...milestones]
    updated[index][field] = value
    setMilestones(updated)
    if (milestoneErrors[index]) {
      setMilestoneErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    }
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
    if (milestoneErrors[index]) {
      setMilestoneErrors((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    }
  }

  const handleSave = async () => {
    if (!form.title?.trim()) return

    // Validate each milestone has a date
    const errors: Record<number, string> = {}
    milestones.forEach((m, i) => {
      if (m.title.trim() && !m.targetDate) {
        errors[i] = t('goals.milestoneDateRequired')
      }
    })
    setMilestoneErrors(errors)
    if (Object.keys(errors).length > 0) return

    const success = await onSave({
      title: form.title,
      description: form.description,
      category: form.category ?? 'PERSONAL',
      priority: form.priority ?? 'MEDIA',
      deadline: form.deadline as string | null,
      estimatedHours: form.estimatedHours ?? null,
      phaseId: form.phaseId ?? null,
      milestones,
    })
    if (success) onCancel()
  }

  return (
    <Card padding="lg" className="dashboard-card space-y-4">
      <Input
        label={t('goals.titleLabel')}
        value={form.title || ''}
        onChange={(e) => set('title', e.target.value)}
      />
      <Textarea
        label={t('goals.descriptionLabel')}
        value={form.description || ''}
        onChange={(e) => set('description', e.target.value)}
        rows={3}
        className="resize-none"
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={t('goals.categoryLabel')}
          value={form.category || 'PERSONAL'}
          onChange={(e) => set('category', e.target.value as Goal['category'])}
        >
          <option value="PERSONAL">{t('goals.categoryPersonal')}</option>
          <option value="PROFESIONAL">{t('goals.categoryProfessional')}</option>
        </Select>
        <Select
          label={t('goals.priorityLabel')}
          value={form.priority || 'MEDIA'}
          onChange={(e) => set('priority', e.target.value as Goal['priority'])}
        >
          <option value="BAJA">{t('goals.priorityLow')}</option>
          <option value="MEDIA">{t('goals.priorityMedium')}</option>
          <option value="ALTA">{t('goals.priorityHigh')}</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('goals.deadlineLabel')}
          type="date"
          value={form.deadline ? new Date(form.deadline).toISOString().split('T')[0] : ''}
          onChange={(e) => set('deadline', e.target.value || null)}
        />
        <Input
          label={t('goals.estimatedHoursLabel')}
          type="number"
          step="0.5"
          min="0"
          value={form.estimatedHours || ''}
          onChange={(e) => set('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)}
        />
      </div>
      {phases.length > 0 && (
        <Select
          label={t('goals.phaseLabel')}
          value={form.phaseId || ''}
          onChange={(e) => set('phaseId', e.target.value || null)}
        >
          <option value="">{t('goals.noPhase')}</option>
          {[...phases]
            .sort((a, b) => a.number - b.number)
            .map((p) => (
              <option key={p.id} value={p.id}>
                Phase {p.number}: {p.title}
              </option>
            ))}
        </Select>
      )}

      {/* Milestones editor */}
      <div className="border-t border-border pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">{t('goals.milestones')}</h3>
          <button
            type="button"
            onClick={addMilestone}
            className="rounded-[8px] border border-dashed border-border px-3 py-1 text-sm text-text-secondary"
          >
            {t('goals.addMilestone')}
          </button>
        </div>
        {milestones.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-muted">{t('goals.noMilestones')}</p>
        ) : (
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <Input
                    fieldSize="sm"
                    value={m.title}
                    onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                    placeholder={t('goals.milestoneTitlePlaceholder')}
                  />
                  <Input
                    fieldSize="sm"
                    type="date"
                    value={m.targetDate}
                    onChange={(e) => updateMilestone(i, 'targetDate', e.target.value)}
                    error={milestoneErrors[i]}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  aria-label={t('common.delete')}
                  className="rounded-[8px] p-2 text-danger hover:bg-danger/10"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" fullWidth onClick={onCancel} className="border border-border">
          {t('common.cancel')}
        </Button>
        <Button fullWidth onClick={handleSave} disabled={saving}>
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </Card>
  )
}
