import { useCallback, useState } from 'react';

import { getBookName, t } from '../../../../constants/translations';
import type { LearningMode, ValidationSettings, Verse } from '../../../../types/database';
import {
  calculateWordPrecision,
  checkDyslexiaFriendlyMatch,
} from '../../../../utils/text-validation';

interface ValidateAnswerParams {
  verseData: Verse;
  learningMode: LearningMode;
  uiLanguage: string;
  validationSettings: ValidationSettings;
}

export interface LearnValidationResult {
  correct: boolean;
  precision?: number;
  xpMultiplier?: number;
  shouldSkipXpForAttempt: boolean;
  validationErrorsForAttempt: string[];
}

export function useLearnValidation() {
  const [userAnswer, setUserAnswer] = useState('');
  const [inputLikelyPasted, setInputLikelyPasted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [validationErrorDetails, setValidationErrorDetails] = useState<string[]>([]);

  const handleAnswerChange = useCallback(
    (text: string) => {
      const jump = text.length - userAnswer.length;
      const pastedChunk = jump >= 20;
      const insertingFromEmpty = userAnswer.length === 0 && text.length >= 20;

      setInputLikelyPasted(pastedChunk || insertingFromEmpty);
      setUserAnswer(text);
    },
    [userAnswer.length],
  );

  const validateAnswer = useCallback(
    ({ verseData, learningMode, uiLanguage, validationSettings }: ValidateAnswerParams): LearnValidationResult => {
      const shouldSkipXpForAttempt = inputLikelyPasted && learningMode === 'guess-verse';

      let correct = false;
      let precision: number | undefined;
      let xpMultiplier: number | undefined;
      let validationErrorsForAttempt: string[] = [];

      if (learningMode === 'guess-verse') {
        const result = checkDyslexiaFriendlyMatch(userAnswer, verseData.text, {
          toleranceLevel: validationSettings.toleranceLevel,
          allowCharacterSwaps: validationSettings.allowLetterInversion,
          allowSimilarChars: true,
          ignorePunctuation: validationSettings.ignorePunctuation,
          ignoreAccents: validationSettings.ignoreAccents,
          wordCountMismatchMessage: t(uiLanguage, 'wordCountMismatch'),
        });

        const wordPrecision = calculateWordPrecision(userAnswer, verseData.text, {
          ignorePunctuation: validationSettings.ignorePunctuation,
          ignoreAccents: validationSettings.ignoreAccents,
        });

        correct = result.isMatch;
        precision = wordPrecision;
        xpMultiplier = wordPrecision;
        validationErrorsForAttempt = result.errors;
        setValidationErrorDetails(result.errors);

        console.log('[Verse Check]', {
          verseText: verseData.text,
          userAnswer,
          validationSimilarity: result.similarity,
          wordPrecision,
          isMatch: result.isMatch,
          errors: result.errors,
        });
      } else {
        setValidationErrorDetails([]);

        const normalizedAnswer = userAnswer.trim().toLowerCase();
        const bookNameInLanguage = getBookName(uiLanguage, verseData.book).toLowerCase();
        const hasBook = normalizedAnswer.includes(verseData.book.toLowerCase()) || normalizedAnswer.includes(bookNameInLanguage);

        validationErrorsForAttempt = [];
        correct = hasBook && normalizedAnswer.includes(`${verseData.chapter}`) && normalizedAnswer.includes(`${verseData.verse}`);
      }

      setIsCorrect(correct);
      setShowFeedback(true);

      return {
        correct,
        precision,
        xpMultiplier,
        shouldSkipXpForAttempt,
        validationErrorsForAttempt,
      };
    },
    [inputLikelyPasted, userAnswer],
  );

  const resetValidation = useCallback(() => {
    setUserAnswer('');
    setInputLikelyPasted(false);
    setShowFeedback(false);
    setIsCorrect(false);
    setValidationErrorDetails([]);
  }, []);

  const hideFeedback = useCallback(() => {
    setShowFeedback(false);
    setValidationErrorDetails([]);
    setIsCorrect(false);
  }, []);

  return {
    userAnswer,
    inputLikelyPasted,
    showFeedback,
    isCorrect,
    validationErrorDetails,
    handleAnswerChange,
    validateAnswer,
    resetValidation,
    hideFeedback,
  };
}
