'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button, EmptyState } from '@/components/ui';
import { useAppTranslation } from '@/components/LanguageProvider';
import { useQuestions } from '@/hooks/useQuestions';
import QuestionFilters from '@/components/study/questions/QuestionFilters';
import QuestionCard from '@/components/study/questions/QuestionCard';
import QuestionFormModal from '@/components/study/questions/QuestionFormModal';
import ImportSummaryModal from '@/components/study/questions/ImportSummaryModal';
import type { Question, ImportSummary } from '@/types/study';

export default function QuestionsPage() {
  const { t } = useAppTranslation();
  const {
    questions,
    categories,
    topics,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    applySearch,
    clearFilters,
    saveQuestion,
    deleteQuestion,
    importQuestions,
  } = useQuestions();

  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('study.questions.confirmDelete'))) return;
    await deleteQuestion(id);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const summary = await importQuestions(text);
    setImportSummary(summary);
    e.target.value = '';
  };

  return (
    <AppLayout>
      <main className="flex-1 p-4 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{t('study.questions.title')}</h1>
          <p className="text-sm text-text-muted">{t('study.questions.subtitle')}</p>
        </header>

        <QuestionFilters
          filters={filters}
          searchQuery={searchQuery}
          categories={categories}
          topics={topics}
          onFiltersChange={setFilters}
          onSearchChange={setSearchQuery}
          onApplySearch={applySearch}
          onClear={clearFilters}
        />

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          <Button onClick={handleNew}>
            <span className="material-symbols-outlined text-sm">add</span>
            {t('study.questions.newQuestion')}
          </Button>
          <label className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
            <span className="material-symbols-outlined text-sm">upload</span>
            {t('study.questions.importJson')}
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {questions.length === 0 ? (
            <EmptyState icon="quiz" title={t('study.questions.noQuestions')} />
          ) : (
            questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <QuestionFormModal
            question={editingQuestion}
            categories={categories}
            topics={topics}
            onSave={saveQuestion}
            onClose={() => setShowForm(false)}
          />
        )}

        {/* Import Summary Modal */}
        {importSummary && (
          <ImportSummaryModal summary={importSummary} onClose={() => setImportSummary(null)} />
        )}
      </main>
    </AppLayout>
  );
}
