'use client'

import { useState, RefObject } from 'react'
import { Button, Input } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'

interface TodoCreateFormProps {
  inputRef: RefObject<HTMLInputElement | null>
  onAdd: (title: string) => Promise<void>
}

export default function TodoCreateForm({ inputRef, onAdd }: TodoCreateFormProps) {
  const { t } = useAppTranslation()
  const [title, setTitle] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setTitle('')
    await onAdd(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[8px] bg-bg-surface-hover p-4">
      <div className="flex items-center gap-3">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('todos.addPlaceholder')}
          className="flex-1 border-0"
          aria-label={t('todos.addPlaceholder')}
        />
        <Button type="submit" size="lg" disabled={!title.trim()} className="whitespace-nowrap">
          {t('todos.add')}
        </Button>
      </div>
    </form>
  )
}
