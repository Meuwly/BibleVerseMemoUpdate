export function levenshteinDistance(str1: string, str2: string): number {
  let source = str1;
  let target = str2;

  if (source.length > target.length) {
    source = str2;
    target = str1;
  }

  const sourceLength = source.length;
  const targetLength = target.length;

  if (sourceLength === 0) return targetLength;
  if (targetLength === 0) return sourceLength;

  let previousRow = Array.from({ length: sourceLength + 1 }, (_, index) => index);
  let currentRow = new Array<number>(sourceLength + 1);

  for (let i = 1; i <= targetLength; i++) {
    currentRow[0] = i;

    for (let j = 1; j <= sourceLength; j++) {
      const substitutionCost = target.charAt(i - 1) === source.charAt(j - 1) ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        previousRow[j] + 1,
        previousRow[j - 1] + substitutionCost
      );
    }

    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[sourceLength];
}

export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = str1.toLowerCase().trim();
  const normalized2 = str2.toLowerCase().trim();

  if (normalized1 === normalized2) return 1;

  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - distance / maxLength;
}

export function normalizeForComparison(
  text: string,
  options?: {
    ignorePunctuation?: boolean;
    ignoreAccents?: boolean;
  }
): string {
  const { ignorePunctuation = true, ignoreAccents = true } = options || {};

  let normalized = text.toLowerCase();

  if (ignoreAccents) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  if (ignorePunctuation) {
    normalized = normalized.replace(/[.,;:!?"'()\[\]{}]/g, '');
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

export function calculateWordPrecision(
  userAnswer: string,
  correctAnswer: string,
  options?: {
    ignorePunctuation?: boolean;
    ignoreAccents?: boolean;
  }
): number {
  const normalizedUserAnswer = normalizeForComparison(userAnswer, options);
  const normalizedCorrectAnswer = normalizeForComparison(correctAnswer, options);

  if (!normalizedCorrectAnswer) {
    return normalizedUserAnswer ? 0 : 1;
  }

  const userWords = normalizedUserAnswer ? normalizedUserAnswer.split(' ') : [];
  const correctWords = normalizedCorrectAnswer.split(' ');
  const comparedWordCount = Math.max(userWords.length, correctWords.length);

  if (comparedWordCount === 0) {
    return 1;
  }

  let totalSimilarity = 0;

  for (let index = 0; index < comparedWordCount; index += 1) {
    const userWord = userWords[index] || '';
    const correctWord = correctWords[index] || '';

    if (!userWord || !correctWord) {
      continue;
    }

    totalSimilarity += calculateSimilarity(userWord, correctWord);
  }

  return totalSimilarity / comparedWordCount;
}

export function checkDyslexiaFriendlyMatch(
  userAnswer: string,
  correctAnswer: string,
  options?: {
    allowCharacterSwaps?: boolean;
    allowSimilarChars?: boolean;
    toleranceLevel?: number;
    ignorePunctuation?: boolean;
    ignoreAccents?: boolean;
    wordCountMismatchMessage?: string;
  }
): { isMatch: boolean; similarity: number; errors: string[] } {
  const {
    allowCharacterSwaps = true,
    allowSimilarChars = true,
    toleranceLevel = 0.85,
    ignorePunctuation = true,
    ignoreAccents = true,
    wordCountMismatchMessage = 'Word count very different',
  } = options || {};

  const normalized1 = normalizeForComparison(userAnswer, { ignorePunctuation, ignoreAccents });
  const normalized2 = normalizeForComparison(correctAnswer, { ignorePunctuation, ignoreAccents });

  const errors: string[] = [];

  if (normalized1 === normalized2) {
    return { isMatch: true, similarity: 1, errors: [] };
  }

  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');

  if (Math.abs(words1.length - words2.length) > words2.length * 0.2) {
    errors.push(wordCountMismatchMessage);
  }

  const similarity = calculateSimilarity(normalized1, normalized2);

  if (allowCharacterSwaps && similarity >= toleranceLevel) {
    return { isMatch: true, similarity, errors };
  }

  if (allowSimilarChars) {
    let matchCount = 0;
    const minLength = Math.min(words1.length, words2.length);

    for (let i = 0; i < minLength; i++) {
      const wordSimilarity = calculateSimilarity(words1[i], words2[i]);
      if (wordSimilarity >= 0.75) {
        matchCount++;
      }
    }

    const wordMatchRatio = matchCount / words2.length;
    if (wordMatchRatio >= toleranceLevel) {
      return { isMatch: true, similarity: wordMatchRatio, errors };
    }
  }

  return { isMatch: similarity >= toleranceLevel, similarity, errors };
}
