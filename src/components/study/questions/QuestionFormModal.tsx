'use client'

import { useState } from 'react'
import { Button, Input, Modal, Select, Textarea, Toggle } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Question, QuestionType } from '@/types/study'
import type { QuestionInput } from '@/lib/study/question-service'
import type { CategoryOption } from '@/hooks/useQuestions'

interface QuestionFormModalProps {
  question: Question | null
  categories: CategoryOption[]
  topics: string[]
  onSave: (editingId: string | null, data: QuestionInput) => Promise<void>
  onClose: () => void
}

export default function QuestionFormModal({ question, categories, topics, onSave, onClose }: QuestionFormModalProps) {
  const { t } = useAppTranslation()
  const editingId = question?.id ?? null

  const [questionText, setQuestionText] = useState(question?.question ?? '')
  const [categoryId, setCategoryId] = useState<number | ''>(question?.categoryId ?? '')
  const [topic, setTopic] = useState(question?.topic?.name ?? '')
  const [type, setType] = useState<QuestionType>(question?.type ?? 'direct')
  const [directAnswer, setDirectAnswer] = useState(question?.directAnswer ?? '')
  const [options, setOptions] = useState<string[]>(
    question?.options.length ? question.options : ['', '', '', '']
  )
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(question?.correctOptionIndex ?? null)
  const [supportsBothModes, setSupportsBothModes] = useState(question?.supportsBothModes ?? false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const validate = (): boolean => {
    if (!questionText.trim()) {
      setFormError(t('study.questions.validation.questionRequired'))
      return false
    }
    if (!categoryId) {
      setFormError(t('study.questions.validation.categoryRequired'))
      return false
    }
    if (!topic.trim()) {
      setFormError(t('study.questions.validation.topicRequired'))
      return false
    }

    const needsDirect = type === 'direct' || supportsBothModes
    const needsMultiple = type === 'multiple-choice' || supportsBothModes

    if (needsDirect && !directAnswer.trim()) {
      setFormError(t('study.questions.validation.answerRequired'))
      return false
    }
    if (needsMultiple) {
      if (options.some((o) => !o.trim())) {
        setFormError(t('study.questions.validation.optionsRequired'))
        return false
      }
      if (correctOptionIndex === null) {
        setFormError(t('study.questions.validation.correctRequired'))
        return false
      }
    }

    setFormError('')
    return true
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSave(editingId, {
        question: questionText.trim(),
        categoryId: categoryId === '' ? null : categoryId,
        topic: topic.trim(),
        type: supportsBothModes ? 'multiple-choice' : type,
        directAnswer: directAnswer.trim(),
        options: type === 'multiple-choice' || supportsBothModes ? options.map((o) => o.trim()) : ['', '', '', ''],
        correctOptionIndex: type === 'multiple-choice' || supportsBothModes ? correctOptionIndex : null,
        supportsBothModes,
      })
      onClose()
    } catch {
      setFormError(t('study.questions.validation.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const sectionLabel = (text: string) => (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">{text}</label>
  )

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editingId ? t('study.questions.editQuestion') : t('study.questions.newQuestion')}
      maxWidth="xl"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {/* Question */}
        <div>
          {sectionLabel(t('study.questions.questionLabel'))}
          <Textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={t('study.questions.questionPlaceholder')}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Category + Topic */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            {sectionLabel(t('study.questions.categoryLabel'))}
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value === '' ? '' : parseInt(e.target.value))}
            >
              <option value="">{t('study.questions.select')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            {sectionLabel(t('study.questions.topicLabel'))}
            <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">{t('study.questions.select')}</option>
              {topics.map((topicName) => (
                <option key={topicName} value={topicName}>
                  {topicName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Answer type — hidden in dual mode */}
        {!supportsBothModes && (
          <div>
            {sectionLabel(t('study.questions.answerTypeLabel'))}
            <div className="flex gap-2 rounded-[8px] bg-bg-surface-hover p-1">
              {(['direct', 'multiple-choice'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setType(opt)}
                  className={`flex-1 rounded-[6px] px-3 py-2 text-sm font-medium transition-all ${
                    type === opt ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-white/5'
                  }`}
                >
                  {opt === 'direct' ? t('study.types.direct') : t('study.types.multipleChoice')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direct answer */}
        {(type === 'direct' || supportsBothModes) && (
          <div>
            {sectionLabel(t('study.questions.directAnswerLabel'))}
            <Input
              value={directAnswer}
              onChange={(e) => setDirectAnswer(e.target.value)}
              placeholder={t('study.questions.directAnswerPlaceholder')}
            />
          </div>
        )}

        {/* Multiple choice options */}
        {(type === 'multiple-choice' || supportsBothModes) && (
          <div className="space-y-3">
            {sectionLabel(t('study.questions.optionsLabel'))}
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectOptionIndex(i)}
                  role="radio"
                  aria-checked={correctOptionIndex === i}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    correctOptionIndex === i ? 'border-primary' : ''
                  }`}
                  style={correctOptionIndex !== i ? { borderColor: 'var(--color-border-strong)' } : undefined}
                >
                  {correctOptionIndex === i && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options]
                    next[i] = e.target.value
                    setOptions(next)
                  }}
                  placeholder={t('study.questions.optionPlaceholder', { letter: String.fromCharCode(65 + i) })}
                />
              </div>
            ))}
          </div>
        )}

        {/* Dual mode */}
        <div
          className="cursor-pointer rounded-[8px] border p-4 transition-all hover:opacity-90"
          style={{
            background: supportsBothModes
              ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
              : 'var(--color-bg-surface-hover)',
            borderColor: supportsBothModes
              ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
              : 'var(--color-border)',
          }}
          onClick={() => setSupportsBothModes(!supportsBothModes)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: supportsBothModes ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
              >
                offline_bolt
              </span>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{t('study.questions.dualMode')}</h4>
                <p className="text-xs text-text-muted">{t('study.questions.dualModeDesc')}</p>
              </div>
            </div>
            <Toggle
              checked={supportsBothModes}
              onChange={setSupportsBothModes}
              ariaLabel={t('study.questions.dualMode')}
            />
          </div>
        </div>

        {formError && <p className="text-sm font-medium text-danger">{formError}</p>}

        {/* Footer */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} className="border border-border">
            {t('common.cancel')}
          </Button>
          <Button type="submit" fullWidth disabled={saving} className="font-semibold shadow-lg shadow-primary/20">
            {editingId ? t('study.questions.saveChanges') : t('study.questions.createQuestion')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
