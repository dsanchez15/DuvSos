'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { QuestionService } from '@/lib/study/question-service';
import { TopicService } from '@/lib/study/topic-service';
import { StudySessionService } from '@/lib/study/session-service';
import { getStudySettings } from '@/lib/study/settings-store';
import type {
  Question,
  QuestionType,
  StudySessionConfig,
  StudySession,
  SessionResult,
  SessionAnswer,
} from '@/types/study';

export default function ReviewPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [maxQuestions, setMaxQuestions] = useState(20);

  // View state: 'config' | 'active' | 'summary'
  const [view, setView] = useState<'config' | 'active' | 'summary'>('config');

  // Config state
  const [config, setConfig] = useState<StudySessionConfig>({
    questionCount: 10,
    timeLimit: null,
    timeLimitMode: null,
    topics: 'all',
    questionType: 'both',
  });

  // Session state
  const [session, setSession] = useState<StudySession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentMode, setCurrentMode] = useState<QuestionType>('direct');
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [previousResult, setPreviousResult] = useState<SessionResult | null>(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Resume dialog
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [expiredSession, setExpiredSession] = useState(false);

  useEffect(() => {
    setQuestions(QuestionService.getAll());
    setTopics(TopicService.getNames());
    const settings = getStudySettings();
    setMaxQuestions(settings.maxQuestionsPerReview);
    setConfig((c) => ({ ...c, questionCount: Math.min(c.questionCount, settings.maxQuestionsPerReview) }));

    fetch('/api/todo-categories')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));

    StudySessionService.cleanupExpiredSessions();

    // Check for active session
    const active = StudySessionService.getActiveSession();
    if (active) {
      setSession(active);
      setShowResumeDialog(true);
    }
  }, []);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && view === 'active') {
      handleSubmitAnswer(true);
    }
  }, [timeLeft, showFeedback, view]);

  const getFilteredQuestions = useCallback((): Question[] => {
    let qs = [...questions];
    if (config.topics !== 'all') {
      qs = qs.filter((q) => config.topics.includes(q.topic));
    }
    if (config.questionType === 'direct') {
      qs = qs.filter((q) => q.type === 'direct' || q.supportsBothModes);
    } else if (config.questionType === 'multiple-choice') {
      qs = qs.filter((q) => q.type === 'multiple-choice' || q.supportsBothModes);
    } else {
      // both - all questions with at least one mode
      qs = qs.filter((q) => q.type === 'direct' || q.type === 'multiple-choice' || q.supportsBothModes);
    }
    return qs;
  }, [questions, config]);

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const handleStartSession = () => {
    const available = getFilteredQuestions();
    const count = Math.min(config.questionCount, available.length);
    const selected = shuffleArray(available).slice(0, count);
    const questionIds = selected.map((q) => q.id);

    const newSession = StudySessionService.createSession(config, questionIds);
    setSession(newSession);
    setView('active');
    loadNextQuestion(newSession, 0);
  };

  const loadNextQuestion = (sess: StudySession, index: number) => {
    if (index >= sess.questionIds.length) {
      finishSession(sess);
      return;
    }
    const q = QuestionService.getById(sess.questionIds[index]);
    if (!q) {
      // Skip missing questions
      sess.currentIndex = index + 1;
      StudySessionService.saveActiveSession(sess);
      loadNextQuestion(sess, index + 1);
      return;
    }

    // Determine mode
    let mode: QuestionType = q.type;
    if (config.questionType === 'both' && q.supportsBothModes) {
      mode = Math.random() > 0.5 ? 'direct' : 'multiple-choice';
    } else if (config.questionType === 'direct') {
      mode = q.type === 'multiple-choice' && q.supportsBothModes ? 'direct' : q.type;
    } else if (config.questionType === 'multiple-choice') {
      mode = q.type === 'direct' && q.supportsBothModes ? 'multiple-choice' : q.type;
    }

    setCurrentQuestion(q);
    setCurrentMode(mode);
    setUserAnswer('');
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);

    if (config.timeLimit && config.timeLimitMode === 'per-question') {
      startTimer(config.timeLimit);
    }
  };

  const handleSubmitAnswer = (timedOut = false) => {
    if (!currentQuestion || !session) return;

    stopTimer();

    let answerIsCorrect = false;
    let answerText = '';

    if (currentMode === 'direct') {
      const normalizedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizedCorrect = currentQuestion.directAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
      answerIsCorrect = normalizedUser === normalizedCorrect;
      answerText = userAnswer.trim();
    } else {
      if (selectedOption !== null && currentQuestion.correctOptionIndex !== null) {
        answerIsCorrect = selectedOption === currentQuestion.correctOptionIndex;
      }
      answerText = selectedOption !== null ? currentQuestion.options[selectedOption] : '';
    }

    const timeSpent = config.timeLimit && config.timeLimitMode === 'per-question'
      ? config.timeLimit - (timeLeft ?? 0)
      : 0;

    const answer: SessionAnswer = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      userAnswer: timedOut ? '(Tiempo agotado)' : answerText,
      correctAnswer: currentMode === 'direct' ? currentQuestion.directAnswer : (currentQuestion.correctOptionIndex !== null ? currentQuestion.options[currentQuestion.correctOptionIndex] : ''),
      isCorrect: timedOut ? false : answerIsCorrect,
      modeUsed: currentMode,
      timeSpent,
    };

    const updatedSession = StudySessionService.recordAnswer(session, answer);
    setSession(updatedSession);
    setIsCorrect(answer.isCorrect);
    setShowFeedback(true);
    setTimeLeft(null);
  };

  const handleContinue = () => {
    if (!session) return;
    loadNextQuestion(session, session.currentIndex);
  };

  const finishSession = (sess: StudySession) => {
    stopTimer();
    const res = StudySessionService.completeSession(sess);
    setResult(res);
    const prev = StudySessionService.getPreviousResult(sess.config);
    setPreviousResult(prev);
    setView('summary');
    setSession(null);
    setCurrentQuestion(null);
  };

  const handleAbandon = () => {
    if (!session) return;
    if (!confirm('¿Abandonar la sesión actual? Se guardarán los resultados parciales.')) return;
    stopTimer();
    const res = StudySessionService.abandonSession(session);
    setResult(res);
    const prev = StudySessionService.getPreviousResult(session.config);
    setPreviousResult(prev);
    setView('summary');
    setSession(null);
    setCurrentQuestion(null);
  };

  const handleResume = () => {
    setShowResumeDialog(false);
    if (!session) return;
    setView('active');
    loadNextQuestion(session, session.currentIndex);
  };

  const handleDiscardSession = () => {
    setShowResumeDialog(false);
    StudySessionService.discardActiveSession();
    setSession(null);
    setExpiredSession(false);
  };

  const isConfigValid = () => {
    const available = getFilteredQuestions();
    return (
      config.questionCount > 0 &&
      config.questionCount <= maxQuestions &&
      available.length > 0 &&
      config.questionCount <= available.length
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout>
      <main className="flex-1 p-4 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Repaso</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Configura y ejecuta sesiones de repetición espaciada</p>
        </header>

        {/* Resume Dialog */}
        {showResumeDialog && (
          <div className="mb-6 p-4 rounded-[8px] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
            <p className="font-medium mb-2">Tienes una sesión en progreso</p>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Progreso: {session?.answers.length ?? 0} / {session?.questionIds.length ?? 0} preguntas respondidas
            </p>
            <div className="flex gap-2">
              <button onClick={handleResume} className="px-4 py-2 bg-primary text-white rounded-[8px] text-sm font-medium hover:bg-primary/90">
                Reanudar sesión
              </button>
              <button onClick={handleDiscardSession} className="px-4 py-2 border rounded-[8px] text-sm" style={{ borderColor: 'var(--color-border)' }}>
                Descartar e iniciar nueva
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ CONFIG VIEW ═══════════════ */}
        {view === 'config' && (
          <div className="max-w-xl space-y-6">
            <div className="p-6 rounded-[8px] border space-y-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
              <h2 className="text-lg font-semibold">Configuración de sesión</h2>

              {/* Question count */}
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Cantidad de preguntas: {config.questionCount}
                </label>
                <input
                  type="range"
                  min={1}
                  max={maxQuestions}
                  value={config.questionCount}
                  onChange={(e) => setConfig((c) => ({ ...c, questionCount: parseInt(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Máximo permitido: {maxQuestions}</p>
              </div>

              {/* Time limit */}
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>Límite de tiempo</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setConfig((c) => ({ ...c, timeLimit: null, timeLimitMode: null }))}
                    className={`px-3 py-1.5 rounded-[6px] border text-xs ${!config.timeLimit ? 'border-primary bg-primary/10 text-primary' : ''}`}
                    style={!config.timeLimit ? undefined : { borderColor: 'var(--color-border)' }}
                  >
                    Sin límite
                  </button>
                  <button
                    onClick={() => setConfig((c) => ({ ...c, timeLimit: 30, timeLimitMode: 'per-question' }))}
                    className={`px-3 py-1.5 rounded-[6px] border text-xs ${config.timeLimitMode === 'per-question' ? 'border-primary bg-primary/10 text-primary' : ''}`}
                    style={config.timeLimitMode !== 'per-question' ? { borderColor: 'var(--color-border)' } : undefined}
                  >
                    Por pregunta
                  </button>
                </div>
                {config.timeLimitMode === 'per-question' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={config.timeLimit ?? 30}
                      onChange={(e) => setConfig((c) => ({ ...c, timeLimit: parseInt(e.target.value) }))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-medium w-16 text-right">{config.timeLimit}s</span>
                  </div>
                )}
              </div>

              {/* Topics */}
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>Temas</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setConfig((c) => ({ ...c, topics: 'all' }))}
                    className={`px-3 py-1.5 rounded-[6px] border text-xs ${config.topics === 'all' ? 'border-primary bg-primary/10 text-primary' : ''}`}
                    style={config.topics !== 'all' ? { borderColor: 'var(--color-border)' } : undefined}
                  >
                    Todos los temas
                  </button>
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        const current = Array.isArray(config.topics) ? config.topics : [];
                        const exists = current.includes(t);
                        const next = exists ? current.filter((x) => x !== t) : [...current, t];
                        setConfig((c) => ({ ...c, topics: next.length ? next : 'all' }));
                      }}
                      className={`px-3 py-1.5 rounded-[6px] border text-xs ${Array.isArray(config.topics) && config.topics.includes(t) ? 'border-primary bg-primary/10 text-primary' : ''}`}
                      style={!Array.isArray(config.topics) || !config.topics.includes(t) ? { borderColor: 'var(--color-border)' } : undefined}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question type */}
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>Tipo de respuesta</label>
                <div className="flex gap-2">
                  {([
                    { key: 'direct' as const, label: 'Directa' },
                    { key: 'multiple-choice' as const, label: 'Selección múltiple' },
                    { key: 'both' as const, label: 'Ambas' },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setConfig((c) => ({ ...c, questionType: opt.key }))}
                      className={`flex-1 px-3 py-2 rounded-[8px] border text-sm transition-all ${config.questionType === opt.key ? 'border-primary bg-primary/10 text-primary' : ''}`}
                      style={config.questionType !== opt.key ? { borderColor: 'var(--color-border)' } : undefined}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 rounded-[8px] text-sm" style={{ background: 'var(--color-bg-surface-hover)' }}>
                <p className="font-medium mb-1">Resumen</p>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  {getFilteredQuestions().length} preguntas disponibles · {config.questionCount} seleccionadas · {config.timeLimit ? `${config.timeLimit}s por pregunta` : 'Sin límite de tiempo'}
                </p>
              </div>

              <button
                onClick={handleStartSession}
                disabled={!isConfigValid()}
                className="w-full px-4 py-3 bg-primary text-white rounded-[8px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Iniciar Repaso
              </button>
              {!isConfigValid() && (
                <p className="text-xs text-red-500 text-center">
                  {getFilteredQuestions().length === 0 ? 'No hay preguntas que coincidan con los filtros' : `Máximo ${getFilteredQuestions().length} preguntas disponibles`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ ACTIVE SESSION VIEW ═══════════════ */}
        {view === 'active' && currentQuestion && (
          <div className="max-w-xl mx-auto">
            {/* Progress & Timer */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{session ? session.currentIndex + 1 : 0} / {session ? session.questionIds.length : 0}</span>
                <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-surface-hover)' }}>
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${session && session.questionIds.length > 0 ? ((session.currentIndex) / session.questionIds.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              {timeLeft !== null && (
                <span className={`text-sm font-mono font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              )}
              <button onClick={handleAbandon} className="text-xs px-2 py-1 rounded-[6px] border hover:bg-red-50 text-red-500" style={{ borderColor: 'var(--color-border)' }}>
                Abandonar
              </button>
            </div>

            {/* Question Card */}
            <div className="p-6 rounded-[8px] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
              <p className="text-lg font-medium mb-6">{currentQuestion.question}</p>

              {!showFeedback ? (
                <>
                  {currentMode === 'direct' ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                        placeholder="Escribe tu respuesta..."
                        autoFocus
                        className="w-full px-4 py-3 rounded-[8px] border text-base"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}
                      />
                      <button
                        onClick={() => handleSubmitAnswer()}
                        disabled={!userAnswer.trim()}
                        className="w-full px-4 py-3 bg-primary text-white rounded-[8px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        Responder
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentQuestion.options.filter((o) => o.trim()).map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedOption(i)}
                          className={`w-full text-left px-4 py-3 rounded-[8px] border text-sm transition-all ${selectedOption === i ? 'border-primary bg-primary/10 text-primary' : ''}`}
                          style={selectedOption !== i ? { borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' } : undefined}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </button>
                      ))}
                      <button
                        onClick={() => handleSubmitAnswer()}
                        disabled={selectedOption === null}
                        className="w-full px-4 py-3 bg-primary text-white rounded-[8px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors mt-2"
                      >
                        Responder
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-[8px] ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`material-symbols-outlined ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Respuesta correcta: <span className="font-medium">{currentMode === 'direct' ? currentQuestion.directAnswer : (currentQuestion.correctOptionIndex !== null ? currentQuestion.options[currentQuestion.correctOptionIndex] : '')}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleContinue}
                    className="w-full px-4 py-3 bg-primary text-white rounded-[8px] font-medium hover:bg-primary/90 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ SUMMARY VIEW ═══════════════ */}
        {view === 'summary' && result && (
          <div className="max-w-md mx-auto">
            <div className="p-6 rounded-[8px] border text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${result.accuracyPercentage >= 70 ? 'bg-green-500/10 text-green-600' : result.accuracyPercentage >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>
                <span className="material-symbols-outlined text-3xl">
                  {result.accuracyPercentage >= 70 ? 'emoji_events' : result.accuracyPercentage >= 40 ? 'sentiment_neutral' : 'sentiment_dissatisfied'}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-1">¡Sesión completada!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{result.totalQuestions} preguntas respondidas</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-[8px]" style={{ background: 'var(--color-bg-surface-hover)' }}>
                  <p className="text-2xl font-bold text-green-600">{result.correctCount}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Correctas</p>
                </div>
                <div className="p-3 rounded-[8px]" style={{ background: 'var(--color-bg-surface-hover)' }}>
                  <p className="text-2xl font-bold text-red-500">{result.incorrectCount}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Incorrectas</p>
                </div>
                <div className="p-3 rounded-[8px]" style={{ background: 'var(--color-bg-surface-hover)' }}>
                  <p className="text-2xl font-bold text-primary">{result.accuracyPercentage}%</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Acierto</p>
                </div>
              </div>

              {previousResult && (
                <div className="mb-6 p-3 rounded-[8px] text-left" style={{ background: 'var(--color-bg-surface-hover)' }}>
                  <p className="text-sm font-medium mb-2">Comparación con sesión anterior</p>
                  <div className="space-y-1 text-sm">
                    {(() => {
                      const deltaCorrect = result.correctCount - previousResult.correctCount;
                      const deltaIncorrect = result.incorrectCount - previousResult.incorrectCount;
                      const deltaAccuracy = result.accuracyPercentage - previousResult.accuracyPercentage;
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm" style={{ color: deltaCorrect >= 0 ? '#22c55e' : '#ef4444' }}>
                              {deltaCorrect >= 0 ? 'trending_up' : 'trending_down'}
                            </span>
                            <span>Correctas: {deltaCorrect >= 0 ? '+' : ''}{deltaCorrect}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm" style={{ color: deltaIncorrect <= 0 ? '#22c55e' : '#ef4444' }}>
                              {deltaIncorrect <= 0 ? 'trending_down' : 'trending_up'}
                            </span>
                            <span>Incorrectas: {deltaIncorrect >= 0 ? '+' : ''}{deltaIncorrect}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm" style={{ color: deltaAccuracy >= 0 ? '#22c55e' : '#ef4444' }}>
                              {deltaAccuracy >= 0 ? 'trending_up' : 'trending_down'}
                            </span>
                            <span>Acierto: {deltaAccuracy >= 0 ? '+' : ''}{deltaAccuracy}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <button
                onClick={() => { setView('config'); setResult(null); setPreviousResult(null); }}
                className="w-full px-4 py-3 bg-primary text-white rounded-[8px] font-medium hover:bg-primary/90 transition-colors"
              >
                Nueva sesión
              </button>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
