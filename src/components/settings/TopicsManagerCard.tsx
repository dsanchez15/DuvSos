'use client'

import { useState } from 'react'
import SettingCard from '@/components/SettingCard'
import { Button, Input } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { StudyTopic } from '@/types/study'

interface TopicsManagerCardProps {
  topics: StudyTopic[]
  onCreateTopic: (name: string) => Promise<void>
  onDeleteTopic: (id: string) => void
}

export default function TopicsManagerCard({ topics, onCreateTopic, onDeleteTopic }: TopicsManagerCardProps) {
  const { t } = useAppTranslation()
  const [newTopicName, setNewTopicName] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicName.trim()) return
    await onCreateTopic(newTopicName.trim())
    setNewTopicName('')
    setShowForm(false)
  }

  return (
    <SettingCard>
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">topic</span>
        <h2 className="text-lg font-semibold">{t('settings.studyTopics')}</h2>
      </div>
      <div className="space-y-4">
        {topics.length === 0 ? (
          <p className="text-sm text-text-muted">{t('settings.noTopics')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center gap-2 rounded-[8px] border border-border bg-bg-surface px-3 py-2"
              >
                <span className="material-symbols-outlined text-sm text-text-muted">tag</span>
                <span className="text-sm font-medium">{topic.name}</span>
                <button
                  onClick={() => onDeleteTopic(topic.id)}
                  className="settings-cat-delete-btn text-text-muted"
                  aria-label={`${t('common.delete')} ${topic.name}`}
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-[8px] bg-bg-surface-hover p-4">
            <Input
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder={t('settings.topicNamePlaceholder')}
              aria-label={t('settings.topicNamePlaceholder')}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setNewTopicName('')
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={!newTopicName.trim()}>
                {t('common.create')}
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-[8px] border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            {t('settings.newTopic')}
          </button>
        )}
      </div>
    </SettingCard>
  )
}
