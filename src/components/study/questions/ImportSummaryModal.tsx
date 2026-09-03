'use client'

import { Button, Modal } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { ImportSummary } from '@/types/study'

interface ImportSummaryModalProps {
  summary: ImportSummary
  onClose: () => void
}

export default function ImportSummaryModal({ summary, onClose }: ImportSummaryModalProps) {
  const { t } = useAppTranslation()

  return (
    <Modal isOpen={true} onClose={onClose} title={t('study.questions.importResult')} maxWidth="md">
      <div className="mb-4 space-y-2 text-sm">
        <p className="text-success">{t('study.questions.imported', { count: summary.imported })}</p>
        <p className="text-warning">{t('study.questions.ignored', { count: summary.ignored })}</p>
        {summary.errors.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 font-medium">{t('study.questions.errorsLabel')}</p>
            <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-4 text-xs text-text-muted">
              {summary.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Button fullWidth onClick={onClose}>
        {t('common.close')}
      </Button>
    </Modal>
  )
}
