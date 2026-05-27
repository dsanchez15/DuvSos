export type QuestionType = 'multiple-choice' | 'direct';

export interface Topic {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: string;
}

// Alias para compatibilidad
export type StudyTopic = Topic;

export interface Question {
  id: string;
  question: string;
  categoryId: number | null;
  topicId: string;
  topic?: Topic;
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
  mode?: 'direct' | 'multiple-choice' | 'dual' | null;
  searchText?: string | null;
}

export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'expired';

export interface SessionConfig {
  questionCount: number;
  timeLimit: number | null; // in seconds, null = no limit
  timeLimitMode: 'per-question' | 'total' | null;
  topics: string[] | 'all';
  questionType: QuestionType | 'both';
}

// Alias para compatibilidad
export type StudySessionConfig = SessionConfig;

export interface SessionAnswer {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  modeUsed: QuestionType;
  timeSpent: number; // in seconds
}

export interface Session {
  id: string;
  config: SessionConfig;
  status: SessionStatus;
  startedAt: string;
  lastActivityAt: string;
  questionIds: string[];
  currentIndex: number;
  answers: SessionAnswer[];
  totalTimeSpent: number; // in seconds
}

// Alias para compatibilidad
export type StudySession = Session;

export interface SessionResult {
  id: string;
  sessionId: string;
  config: SessionConfig;
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

export interface StudySetting {
  showStudySection: boolean;
  maxQuestionsPerReview: number;
}

// Alias para compatibilidad
export type StudySettings = StudySetting;

export const DEFAULT_STUDY_SETTINGS: StudySetting = {
  showStudySection: true,
  maxQuestionsPerReview: 20,
};
