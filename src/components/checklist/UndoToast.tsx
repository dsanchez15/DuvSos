'use client'

import { useEffect } from 'react'
import { useAppTranslation } from '@/components/LanguageProvider'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onClose: () => void
}

export default function UndoToast({ message, onUndo, onClose }: UndoToastProps) {
  const { t } = useAppTranslation()

  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
      <div className="checklist-undo-toast flex items-center gap-3 rounded-lg border border-border bg-bg-surface px-5 py-3 shadow-lg">
        <span className="material-symbols-outlined text-lg text-warning">delete</span>
        <span className="text-sm font-medium text-text-primary">{message}</span>
        <button onClick={onUndo} className="rounded-lg px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10">
          {t('checklists.expandedItems.undo')}
        </button>
        <button onClick={onClose} className="checklist-close-btn text-text-muted" aria-label={t('common.cancel')}>
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  )
}
