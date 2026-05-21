'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { QuestionService } from '@/lib/study/question-service';
import { TopicService } from '@/lib/study/topic-service';
import type { Question, QuestionType, QuestionFilter } from '@/types/study';

interface CategoryOption {
  id: number;
  name: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [filters, setFilters] = useState<QuestionFilter>({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ imported: number; ignored: number; errors: string[] } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<QuestionType>('direct');
  const [directAnswer, setDirectAnswer] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [supportsBothModes, setSupportsBothModes] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(() => {
    setQuestions(QuestionService.filter(filters));
    setTopics(TopicService.getNames());
  }, [filters]);

  useEffect(() => {
    loadData();
    fetch('/api/todo-categories')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, [loadData]);

  const resetForm = () => {
    setQuestionText('');
    setCategoryId('');
    setTopic('');
    setType('direct');
    setDirectAnswer('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(null);
    setSupportsBothModes(false);
    setFormError('');
    setEditingId(null);
  };

  const validateForm = (): boolean => {
    if (!questionText.trim()) {
      setFormError('La pregunta es obligatoria');
      return false;
    }
    if (!directAnswer.trim()) {
      setFormError('La respuesta directa es obligatoria');
      return false;
    }
    if (type === 'multiple-choice') {
      if (options.some((o) => !o.trim())) {
        setFormError('Todas las opciones de selección múltiple deben estar llenas');
        return false;
      }
      if (correctOptionIndex === null) {
        setFormError('Debes seleccionar la respuesta correcta');
        return false;
      }
    }
    if (supportsBothModes && options.some((o) => !o.trim())) {
      setFormError('Para activar modo dual, todas las opciones deben estar llenas');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      question: questionText.trim(),
      categoryId: categoryId === '' ? null : categoryId,
      topic: topic.trim(),
      type,
      directAnswer: directAnswer.trim(),
      options: type === 'multiple-choice' || supportsBothModes ? options.map((o) => o.trim()) : ['', '', '', ''],
      correctOptionIndex: type === 'multiple-choice' || supportsBothModes ? correctOptionIndex : null,
      supportsBothModes,
    };

    if (editingId) {
      QuestionService.update(editingId, data);
    } else {
      QuestionService.create(data);
    }
    resetForm();
    setShowForm(false);
    loadData();
  };

  const handleEdit = (q: Question) => {
    setEditingId(q.id);
    setQuestionText(q.question);
    setCategoryId(q.categoryId ?? '');
    setTopic(q.topic);
    setType(q.type);
    setDirectAnswer(q.directAnswer);
    setOptions(q.options.length ? q.options : ['', '', '', '']);
    setCorrectOptionIndex(q.correctOptionIndex);
    setSupportsBothModes(q.supportsBothModes);
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    QuestionService.delete(id);
    loadData();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const summary = QuestionService.importFromJSON(text, categories);
    setImportSummary(summary);
    setShowImportModal(true);
    loadData();
    e.target.value = '';
  };

  const filteredQuestions = questions;

  return (
    <AppLayout>
      <main className="flex-1 p-4 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Preguntas</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Gestiona tu banco de preguntas para repaso</p>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>Buscar</label>
            <input
              type="text"
              placeholder="Buscar pregunta..."
              value={filters.searchText || ''}
              onChange={(e) => setFilters((f) => ({ ...f, searchText: e.target.value || null }))}
              className="w-full px-3 py-2 rounded-[8px] border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>Categoría</label>
            <select
              value={filters.categoryId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value ? parseInt(e.target.value) : null }))}
              className="px-3 py-2 rounded-[8px] border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>Temática</label>
            <select
              value={filters.topic ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, topic: e.target.value || null }))}
              className="px-3 py-2 rounded-[8px] border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
            >
              <option value="">Todas</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>Tipo</label>
            <select
              value={filters.type ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, type: (e.target.value as QuestionType) || null }))}
              className="px-3 py-2 rounded-[8px] border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
            >
              <option value="">Todos</option>
              <option value="direct">Directa</option>
              <option value="multiple-choice">Selección múltiple</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>Dual</label>
            <select
              value={filters.supportsBothModes === true ? 'yes' : filters.supportsBothModes === false ? 'no' : ''}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((f) => ({ ...f, supportsBothModes: val === 'yes' ? true : val === 'no' ? false : null }));
              }}
              className="px-3 py-2 rounded-[8px] border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
            >
              <option value="">Todos</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({})}
            className="px-3 py-2 text-sm border rounded-[8px] hover:bg-primary/5"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Limpiar
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 bg-primary text-white rounded-[8px] text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nueva Pregunta
          </button>
          <label className="px-4 py-2 border border-primary/30 text-primary rounded-[8px] text-sm font-medium hover:bg-primary/5 transition-colors flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-sm">upload</span>
            Importar JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 rounded-[8px] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
              <span className="material-symbols-outlined text-4xl mb-2" style={{ color: 'var(--color-text-muted)' }}>quiz</span>
              <p style={{ color: 'var(--color-text-muted)' }}>No hay preguntas aún</p>
            </div>
          ) : (
            filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-[8px] border flex items-start justify-between gap-4"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1 truncate">{q.question}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{q.topic}</span>
                    {q.categoryId !== null && (
                      <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }}>
                        {categories.find((c) => c.id === q.categoryId)?.name ?? 'General'}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }}>
                      {q.type === 'direct' ? 'Directa' : 'Selección múltiple'}
                    </span>
                    {q.supportsBothModes && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">Dual</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleEdit(q)} className="p-2 rounded-[6px] hover:bg-primary/10 transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-2 rounded-[6px] hover:bg-red-500/10 transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--color-bg-overlay)' }} onClick={() => setShowForm(false)}>
            <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{editingId ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
                <button onClick={() => setShowForm(false)} className="p-1" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Pregunta</label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-[8px] border text-sm"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Categoría</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-[8px] border text-sm"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Temática</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] border text-sm"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
                    >
                      <option value="">Seleccionar...</option>
                      {topics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Respuesta directa</label>
                  <input
                    type="text"
                    value={directAnswer}
                    onChange={(e) => setDirectAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border text-sm"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>Tipo de respuesta</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setType('direct')}
                      className={`flex-1 px-3 py-2 rounded-[8px] border text-sm transition-all ${type === 'direct' ? 'border-primary bg-primary/10 text-primary' : ''}`}
                      style={type !== 'direct' ? { borderColor: 'var(--color-border)' } : undefined}
                    >
                      Directa
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('multiple-choice')}
                      className={`flex-1 px-3 py-2 rounded-[8px] border text-sm transition-all ${type === 'multiple-choice' ? 'border-primary bg-primary/10 text-primary' : ''}`}
                      style={type !== 'multiple-choice' ? { borderColor: 'var(--color-border)' } : undefined}
                    >
                      Selección múltiple
                    </button>
                  </div>
                </div>

                {/* Multiple choice options */}
                {(type === 'multiple-choice' || supportsBothModes) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Opciones</label>
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOptionIndex === i}
                          onChange={() => setCorrectOptionIndex(i)}
                          className="accent-primary"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...options];
                            next[i] = e.target.value;
                            setOptions(next);
                          }}
                          placeholder={`Opción ${i + 1}`}
                          className="flex-1 px-3 py-2 rounded-[8px] border text-sm"
                          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Supports both modes toggle */}
                <div className="flex items-center justify-between p-3 rounded-[8px]" style={{ background: 'var(--color-bg-surface-hover)' }}>
                  <div>
                    <h4 className="text-sm font-medium">Modo dual</h4>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Permite usar esta pregunta tanto en modo directo como selección múltiple</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={supportsBothModes}
                      onChange={(e) => setSupportsBothModes(e.target.checked)}
                    />
                    <div className="w-11 h-6 settings-toggle-track peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary rounded-full"></div>
                  </label>
                </div>

                {formError && (
                  <p className="text-sm text-red-500">{formError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border rounded-[8px] text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] text-sm font-medium hover:bg-primary/90"
                  >
                    {editingId ? 'Guardar cambios' : 'Crear pregunta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Summary Modal */}
        {showImportModal && importSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--color-bg-overlay)' }} onClick={() => setShowImportModal(false)}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Resultado de importación</h3>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-green-600">Importadas: {importSummary.imported}</p>
                <p className="text-amber-600">Ignoradas: {importSummary.ignored}</p>
                {importSummary.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Errores:</p>
                    <ul className="list-disc pl-4 space-y-1 text-xs max-h-40 overflow-y-auto" style={{ color: 'var(--color-text-muted)' }}>
                      {importSummary.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button onClick={() => setShowImportModal(false)} className="w-full px-4 py-2 bg-primary text-white rounded-[8px] text-sm font-medium">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
