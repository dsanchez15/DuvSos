export type QuestionType = 'multiple-choice' | 'direct';

export interface Question {
  id: string;
  question: string;
  categoryId: number | null;
  topic: string;
  type: QuestionType;
  directAnswer: string;
  options: string[];
  correctOptionIndex: number | null;
  supportsBothModes: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFilter {
  categoryId?: number | null;
  topic?: string | null;
  type?: QuestionType | null;
  supportsBothModes?: boolean | null;
  searchText?: string | null;
}

export interface StudyTopic {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: string;
}

export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'expired';

export interface StudySessionConfig {
  questionCount: number;
  timeLimit: number | null; // in seconds, null = no limit
  timeLimitMode: 'per-question' | 'total' | null;
  topics: string[] | 'all';
  questionType: QuestionType | 'both';
}

export interface SessionAnswer {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  modeUsed: QuestionType;
  timeSpent: number; // in seconds
}

export interface StudySession {
  id: string;
  config: StudySessionConfig;
  status: SessionStatus;
  startedAt: string;
  lastActivityAt: string;
  questionIds: string[];
  currentIndex: number;
  answers: SessionAnswer[];
  totalTimeSpent: number; // in seconds
}

export interface SessionResult {
  id: string;
  sessionId: string;
  config: StudySessionConfig;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  totalTimeSpent: number;
  completedAt: string;
}

export interface ImportSummary {
  imported: number;
  ignored: number;
  errors: string[];
}

export interface StudySettings {
  showStudySection: boolean;
  maxQuestionsPerReview: number;
}

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  showStudySection: true,
  maxQuestionsPerReview: 20,
};
