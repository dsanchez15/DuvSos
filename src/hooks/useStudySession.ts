'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { QuestionService } from '@/lib/study/question-service'
import { TopicService } from '@/lib/study/topic-service'
import { SessionService } from '@/lib/study/session-service'
import { SettingsStore } from '@/lib/study/settings-store'
import type {
  Question,
  QuestionType,
  StudySessionConfig,
  StudySession,
  SessionResult,
  SessionAnswer,
} from '@/types/study'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export type ReviewView = 'config' | 'active' | 'summary'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useStudySession(t: TranslateFn) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [maxQuestions, setMaxQuestions] = useState(20)

  const [view, setView] = useState<ReviewView>('config')

  const [config, setConfig] = useState<StudySessionConfig>({
    questionCount: 10,
    timeLimit: null,
    timeLimitMode: null,
    topics: 'all',
    questionType: 'both',
  })

  // Session state
  const [session, setSession] = useState<StudySession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [currentMode, setCurrentMode] = useState<QuestionType>('direct')
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [previousResult, setPreviousResult] = useState<SessionResult | null>(null)

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Resume dialog
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  const tRef = useRef(t)
  useEffect(() => { tRef.current = t }, [t])

  useEffect(() => {
    const init = async () => {
      const qs = await QuestionService.getAll()
      setQuestions(qs)
      const ts = await TopicService.getAll()
      setTopics(ts.map((topic) => topic.name))
      const settings = await SettingsStore.getSettings()
      setMaxQuestions(settings.maxQuestionsPerReview)
      setConfig((c) => ({
        ...c,
        questionCount: Math.min(c.questionCount, settings.maxQuestionsPerReview),
      }))

      // Check for active session
      const active = await SessionService.getActiveSession()
      if (active) {
        setSession(active)
        setShowResumeDialog(true)
      }
    }
    init()
     
  }, [])

  const startTimer = useCallback((seconds: number) => {
    setTimeLeft(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const getFilteredQuestions = useCallback((): Question[] => {
    let qs = [...questions]
    if (config.topics !== 'all') {
      qs = qs.filter((q) => config.topics.includes(q.topic?.name || ''))
    }
    if (config.questionType === 'direct') {
      qs = qs.filter((q) => q.type === 'direct' || q.supportsBothModes)
    } else if (config.questionType === 'multiple-choice') {
      qs = qs.filter((q) => q.type === 'multiple-choice' || q.supportsBothModes)
    } else {
      qs = qs.filter((q) => q.type === 'direct' || q.type === 'multiple-choice' || q.supportsBothModes)
    }
    return qs
  }, [questions, config])

  const finishSession = useCallback(
    async (sess: StudySession) => {
      stopTimer()
      await SessionService.completeSession(sess.id)
      const results = await SessionService.getResults()
      setResult(results[0] || null)
      const prev = await SessionService.getPreviousResult(sess.config)
      setPreviousResult(prev)
      setView('summary')
      setSession(null)
      setCurrentQuestion(null)
    },
    [stopTimer]
  )

  const loadNextQuestionRef = useRef<((sess: StudySession, index: number) => Promise<void>) | undefined>(undefined)

  const loadNextQuestion = useCallback(
    async (sess: StudySession, index: number): Promise<void> => {
      if (index >= sess.questionIds.length) {
        await finishSession(sess)
        return
      }
      const q = await QuestionService.getById(sess.questionIds[index])
      if (!q) {
        // Skip missing questions
        sess.currentIndex = index + 1
        await SessionService.saveActiveSession(sess)
        await loadNextQuestionRef.current?.(sess, index + 1)
        return
      }

      // Determine mode
      let mode: QuestionType = q.type
      if (config.questionType === 'both' && q.supportsBothModes) {
        mode = Math.random() > 0.5 ? 'direct' : 'multiple-choice'
      } else if (config.questionType === 'direct') {
        mode = q.type === 'multiple-choice' && q.supportsBothModes ? 'direct' : q.type
      } else if (config.questionType === 'multiple-choice') {
        mode = q.type === 'direct' && q.supportsBothModes ? 'multiple-choice' : q.type
      }

      setCurrentQuestion(q)
      setCurrentMode(mode)
      setUserAnswer('')
      setSelectedOption(null)
      setShowFeedback(false)
      setIsCorrect(false)

      if (config.timeLimit && config.timeLimitMode === 'per-question') {
        startTimer(config.timeLimit)
      }
    },
    [config, finishSession, startTimer]
  )

  useEffect(() => {
    loadNextQuestionRef.current = loadNextQuestion
  }, [loadNextQuestion])

  const startSession = useCallback(async () => {
    const available = getFilteredQuestions()
    const count = Math.min(config.questionCount, available.length)
    const selected = shuffleArray(available).slice(0, count)
    const questionIds = selected.map((q) => q.id)

    const newSession = await SessionService.createSession(config, questionIds)
    setSession(newSession)
    setView('active')
    await loadNextQuestion(newSession, 0)
  }, [config, getFilteredQuestions, loadNextQuestion])

  const submitAnswer = useCallback(
    async (timedOut = false) => {
      if (!currentQuestion || !session) return

      stopTimer()

      let answerIsCorrect = false
      let answerText = ''

      if (currentMode === 'direct') {
        const normalizedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ')
        const normalizedCorrect = currentQuestion.directAnswer.trim().toLowerCase().replace(/\s+/g, ' ')
        answerIsCorrect = normalizedUser === normalizedCorrect
        answerText = userAnswer.trim()
      } else {
        if (selectedOption !== null && currentQuestion.correctOptionIndex !== null) {
          answerIsCorrect = selectedOption === currentQuestion.correctOptionIndex
        }
        answerText = selectedOption !== null ? currentQuestion.options[selectedOption] : ''
      }

      const timeSpent =
        config.timeLimit && config.timeLimitMode === 'per-question'
          ? config.timeLimit - (timeLeft ?? 0)
          : 0

      const answer: SessionAnswer = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        userAnswer: timedOut ? tRef.current('study.review.timedOut') : answerText,
        correctAnswer:
          currentMode === 'direct'
            ? currentQuestion.directAnswer
            : currentQuestion.correctOptionIndex !== null
              ? currentQuestion.options[currentQuestion.correctOptionIndex]
              : '',
        isCorrect: timedOut ? false : answerIsCorrect,
        modeUsed: currentMode,
        timeSpent,
      }

      const updatedSession = await SessionService.recordAnswer(session, answer)
      setSession(updatedSession)
      setIsCorrect(answer.isCorrect)
      setShowFeedback(true)
      setTimeLeft(null)
    },
    [currentQuestion, session, currentMode, userAnswer, selectedOption, config, timeLeft, stopTimer]
  )

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && view === 'active') {
      submitAnswer(true)
    }
  }, [timeLeft, showFeedback, view, submitAnswer])

  const continueToNext = useCallback(async () => {
    if (!session) return
    await loadNextQuestion(session, session.currentIndex)
  }, [session, loadNextQuestion])

  const abandonSession = useCallback(async () => {
    if (!session) return
    if (!confirm(tRef.current('study.review.confirmAbandon'))) return
    stopTimer()
    await SessionService.abandonSession(session.id)
    const results = await SessionService.getResults()
    setResult(results[0] || null)
    const prev = await SessionService.getPreviousResult(session.config)
    setPreviousResult(prev)
    setView('summary')
    setSession(null)
    setCurrentQuestion(null)
  }, [session, stopTimer])

  const resumeSession = useCallback(async () => {
    setShowResumeDialog(false)
    if (!session) return
    setView('active')
    await loadNextQuestion(session, session.currentIndex)
  }, [session, loadNextQuestion])

  const discardSession = useCallback(async () => {
    setShowResumeDialog(false)
    await SessionService.discardActiveSession()
    setSession(null)
  }, [])

  const resetToConfig = useCallback(() => {
    setView('config')
    setResult(null)
    setPreviousResult(null)
  }, [])

  const isConfigValid = useCallback(() => {
    const available = getFilteredQuestions()
    return (
      config.questionCount > 0 &&
      config.questionCount <= maxQuestions &&
      available.length > 0 &&
      config.questionCount <= available.length
    )
  }, [config, maxQuestions, getFilteredQuestions])

  return {
    topics,
    maxQuestions,
    view,
    config,
    setConfig,
    filteredCount: getFilteredQuestions().length,
    isConfigValid: isConfigValid(),
    session,
    currentQuestion,
    currentMode,
    userAnswer,
    setUserAnswer,
    selectedOption,
    setSelectedOption,
    showFeedback,
    isCorrect,
    result,
    previousResult,
    timeLeft,
    showResumeDialog,
    startSession,
    submitAnswer,
    continueToNext,
    abandonSession,
    resumeSession,
    discardSession,
    resetToConfig,
  }
}
