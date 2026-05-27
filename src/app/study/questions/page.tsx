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

  const loadData = useCallback(async () => {
    const qs = await QuestionService.filter(filters);
    setQuestions(qs);
    const ts = await TopicService.getAll();
    setTopics(ts.map((t) => t.name));
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching
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
    if (!categoryId) {
      setFormError('La categoría es obligatoria');
      return false;
    }
    if (!topic.trim()) {
      setFormError('La temática es obligatoria');
      return false;
    }

    const needsDirect = type === 'direct' || supportsBothModes;
    const needsMultiple = type === 'multiple-choice' || supportsBothModes;

    if (needsDirect && !directAnswer.trim()) {
      setFormError('La respuesta correcta es obligatoria');
      return false;
    }
    if (needsMultiple) {
      if (options.some((o) => !o.trim())) {
        setFormError('Todas las opciones deben estar llenas');
        return false;
      }
      if (correctOptionIndex === null) {
        setFormError('Debes seleccionar la respuesta correcta');
        return false;
      }
    }

    setFormError('');
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      question: questionText.trim(),
      categoryId: categoryId === '' ? null : categoryId,
      topic: topic.trim(),
      type: supportsBothModes ? 'multiple-choice' : type,
      directAnswer: directAnswer.trim(),
      options: type === 'multiple-choice' || supportsBothModes ? options.map((o) => o.trim()) : ['', '', '', ''],
      correctOptionIndex: type === 'multiple-choice' || supportsBothModes ? correctOptionIndex : null,
      supportsBothModes,
    };

    try {
      if (editingId) {
        await QuestionService.update(editingId, data);
      } else {
        await QuestionService.create(data);
      }
      resetForm();
      setShowForm(false);
      loadData();
    } catch {
      setFormError('Error al guardar la pregunta');
    }
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    await QuestionService.delete(id);
    loadData();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const summary = await QuestionService.importFromJSON(text, categories);
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
            <div className="w-full max-w-xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">{editingId ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* PREGUNTA */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-text-muted)' }}>Pregunta</label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Escribe el enunciado de la pregunta aquí..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-[8px] border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                {/* CATEGORÍA + TEMÁTICA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-text-muted)' }}>Categoría</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-[8px] border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: categoryId ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                    >
                      <option value="">Seleccionar...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-text-muted)' }}>Temática</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[8px] border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: topic ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                    >
                      <option value="">Seleccionar...</option>
                      {topics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TIPO DE RESPUESTA — solo visible si NO es modo dual */}
                {!supportsBothModes && (
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-text-muted)' }}>Tipo de respuesta</label>
                    <div className="flex gap-2 p-1 rounded-[8px]" style={{ background: 'var(--color-bg-surface-hover)' }}>
                      <button
                        type="button"
                        onClick={() => setType('direct')}
                        className={`flex-1 px-3 py-2 rounded-[6px] text-sm font-medium transition-all ${
                          type === 'direct'
                            ? 'bg-primary text-white shadow-sm'
                            : 'hover:bg-white/5'
                        }`}
                        style={type !== 'direct' ? { color: 'var(--color-text-muted)' } : undefined}
                      >
                        Respuesta Directa
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('multiple-choice')}
                        className={`flex-1 px-3 py-2 rounded-[6px] text-sm font-medium transition-all ${
                          type === 'multiple-choice'
                            ? 'bg-primary text-white shadow-sm'
                            : 'hover:bg-white/5'
                        }`}
                        style={type !== 'multiple-choice' ? { color: 'var(--color-text-muted)' } : undefined}
                      >
                        Selección Múltiple
                      </button>
                    </div>
                  </div>
                )}

                {/* RESPUESTA CORRECTA — Directa */}
                {(type === 'direct' || supportsBothModes) && (
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--color-text-muted)' }}>Respuesta correcta</label>
                    <input
                      type="text"
                      value={directAnswer}
                      onChange={(e) => setDirectAnswer(e.target.value)}
                      placeholder="Introduce la respuesta exacta"
                      className="w-full px-4 py-2.5 rounded-[8px] border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                )}

                {/* RESPUESTA — Selección múltiple */}
                {(type === 'multiple-choice' || supportsBothModes) && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Opciones</label>
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCorrectOptionIndex(i)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            correctOptionIndex === i
                              ? 'border-primary'
                              : ''
                          }`}
                          style={correctOptionIndex !== i ? { borderColor: 'var(--color-border-strong)' } : undefined}
                        >
                          {correctOptionIndex === i && (
                            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...options];
                            next[i] = e.target.value;
                            setOptions(next);
                          }}
                          placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                          className="flex-1 px-4 py-2.5 rounded-[8px] border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* MODO DUAL */}
                <div
                  className="flex items-center justify-between p-4 rounded-[8px] border cursor-pointer transition-all hover:opacity-90"
                  style={{
                    background: supportsBothModes ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'var(--color-bg-surface-hover)',
                    borderColor: supportsBothModes ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'var(--color-border)',
                  }}
                  onClick={() => setSupportsBothModes(!supportsBothModes)}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: supportsBothModes ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>offline_bolt</span>
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Modo dual</h4>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Activa ambos tipos de respuesta simultáneamente</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${supportsBothModes ? 'bg-primary' : ''}`} style={!supportsBothModes ? { background: 'var(--color-border-strong)' } : undefined}>
                    <div className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${supportsBothModes ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                  </div>
                </div>

                {formError && (
                  <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>{formError}</p>
                )}

                {/* Footer buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all hover:opacity-80"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-[8px] text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
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
