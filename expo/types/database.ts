export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export type VerseReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface VerseSrsState {
  reviewCount: number;
  lapseCount: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  difficulty: number;
  stability: number;
  retrievability: number;
  lastReviewAt: string | null;
  lastRating: VerseReviewRating | null;
  nextReviewAt: string | null;
}

export interface VerseProgress {
  book: string;
  chapter: number;
  verse: number;
  attempts: number;
  correctGuesses: number;
  lastPracticed: string;
  completed: boolean;
  started: boolean;
  masteryLevel: number;
  memorized?: boolean;
  srs?: VerseSrsState;
}

export type LearningMode = 'guess-verse' | 'guess-reference';
export type Language = string;

export type Theme =
  | 'light'
  | 'dark'
  | 'neon'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'rose'
  | 'amber'
  | 'emerald'
  | 'slate'
  | 'midnight'
  | 'sand';

export interface DyslexiaSettings {
  fontSize: number;
  lineHeight: number;
  wordSpacing: number;
}

export interface ValidationSettings {
  toleranceLevel: number;
  allowLetterInversion: boolean;
  ignorePunctuation: boolean;
  ignoreAccents: boolean;
}

export type StartupVerseMode = 'random' | 'curated';

export interface AppearanceSettings {
  animationsEnabled: boolean;
  showStartupVerse: boolean;
  startupVerseMode?: StartupVerseMode;
  enableVerseComparison?: boolean;
  comparisonVersion?: Language | null;
}

export interface LearningSettings {
  autoAdvance: boolean;
  showHints: boolean;
  maxHints: number;
  autoMarkMemorized: boolean;
  autoMarkThreshold: number;
  hapticFeedback: boolean;
  maxMasteryLevel: number;
  focusMode: boolean;
}

export type TTSSpeed = 'slow' | 'normal' | 'fast';

export interface TTSVoice {
  identifier: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'unknown';
}

export interface TTSSettings {
  speed: TTSSpeed;
  voiceIdentifier?: string;
}

export interface QuizProgress {
  quizzesCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
  bestScore: number;
  lastPlayedAt: string | null;
}

export interface StreakProgress {
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null;
}

export interface XpProgress {
  totalXp: number;
  sessionsCompleted: number;
  lastEarnedAt: string | null;
}
