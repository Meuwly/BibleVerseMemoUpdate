import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { getColors } from '../../../../constants/colors';
import { t, getBookName } from '../../../../constants/translations';
import { useApp } from '../../../../contexts/AppContext';
import { useSupportModal } from '../../../../contexts/SupportModalContext';
import { LearnComparisonSheet } from '../../../../src/features/learn/components/LearnComparisonSheet';
import { LearnExerciseCard } from '../../../../src/features/learn/components/LearnExerciseCard';
import { LearnFeedbackPanel } from '../../../../src/features/learn/components/LearnFeedbackPanel';
import { LearnHeaderActions } from '../../../../src/features/learn/components/LearnHeaderActions';
import { LearnRewardOverlays } from '../../../../src/features/learn/components/LearnRewardOverlays';
import { useLearnRewards } from '../../../../src/features/learn/hooks/useLearnRewards';
import { useLearnTts } from '../../../../src/features/learn/hooks/useLearnTts';
import { useLearnValidation } from '../../../../src/features/learn/hooks/useLearnValidation';
import { useLearnVerse } from '../../../../src/features/learn/hooks/useLearnVerse';
import { learnStyles } from '../../../../src/features/learn/styles';
import { RewardEngine } from '../../../../src/rewards/RewardEngine';
import { buildReferenceText, buildVerseId } from '../../../../src/rewards/selectors';
import { computeNextSrsState } from '../../../../src/srs/spacedRepetition';
import type { VerseProgress } from '../../../../types/database';

const PRACTICE_BADGE_VISIBILITY_MS = 5000;
let persistentShowAllWordsLocked = false;

export default function LearnScreen() {
  const {
    language,
    uiLanguage,
    learningMode,
    theme,
    dyslexiaSettings,
    validationSettings,
    appearanceSettings,
    learningSettings,
    ttsSettings,
    getVerseProgress,
    updateProgress,
    toggleMemorized,
    setAppearanceSettings,
    setLanguage,
  } = useApp();
  const { incrementCompletedVerses, checkAndShowModal } = useSupportModal();
  const colors = getColors(theme);
  const router = useRouter();
  const { book, chapter, verse, fromRandom, fromMemorized } = useLocalSearchParams<{
    book: string;
    chapter: string;
    verse: string;
    fromRandom?: string;
    fromMemorized?: string;
  }>();

  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());
  const [showAllWordsLocked, setShowAllWordsLocked] = useState(() => persistentShowAllWordsLocked);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [masteryLevel, setMasteryLevel] = useState(0);
  const [isMemorized, setIsMemorized] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showHeaderBadge, setShowHeaderBadge] = useState(true);
  const [showMasteryInfo, setShowMasteryInfo] = useState(true);

  const maxMasteryLevel = Math.max(1, learningSettings.maxMasteryLevel || 5);
  const focusMode = false;

  const {
    userAnswer,
    inputLikelyPasted,
    showFeedback,
    isCorrect,
    validationErrorDetails,
    handleAnswerChange,
    validateAnswer,
    resetValidation,
  } = useLearnValidation();
  const {
    rewardToast,
    rewardMilestone,
    rewardSurprise,
    rewardCard,
    applyRewardResult,
    resetRewards,
    setRewardToast,
    setRewardMilestone,
    setRewardSurprise,
    setRewardCard,
  } = useLearnRewards();

  const handleVerseLoaded = useCallback(
    ({ verseData, progress }: { verseData: { text: string }; progress?: VerseProgress }) => {
      setMasteryLevel(progress?.masteryLevel || 0);
      setIsMemorized(progress?.memorized || false);
      resetRewards();
      resetValidation();
      setHintsUsed(0);

      if (learningMode === 'guess-verse') {
        if (showAllWordsLocked) {
          const allWordIndexes = verseData.text.split(' ').map((_, index) => index);
          setRevealedWords(new Set(allWordIndexes));
        } else {
          setRevealedWords(new Set());
        }
      } else {
        setRevealedWords(new Set());
      }
    },
    [learningMode, resetRewards, resetValidation, showAllWordsLocked],
  );

  const {
    verseData,
    isLoading,
    hasPrevious,
    hasNext,
    comparisonVerseText,
    comparisonLabel,
    handleNext,
    handlePrevious,
    handleComparisonChange,
    handlePrimaryVersionChange,
  } = useLearnVerse({
    language,
    book,
    chapter,
    verse,
    fromRandom,
    learningMode,
    appearanceSettings,
    getVerseProgress,
    onVerseLoaded: handleVerseLoaded,
  });

  const { isSpeaking, handleTTS } = useLearnTts({ verseData, language, ttsSettings });

  useEffect(() => {
    persistentShowAllWordsLocked = showAllWordsLocked;
  }, [showAllWordsLocked]);

  useEffect(() => {
    setShowHeaderBadge(true);
    setShowMasteryInfo(true);

    const timeoutId = setTimeout(() => {
      setShowHeaderBadge(false);
      setShowMasteryInfo(false);
    }, PRACTICE_BADGE_VISIBILITY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [book, chapter, verse]);

  const handleBackToChapter = useCallback(() => {
    if (fromMemorized === 'true') {
      router.replace('/(tabs)/memorized' as any);
      return;
    }

    if (book && chapter) {
      router.replace({
        pathname: '/book/[book]/chapter/[chapter]' as any,
        params: { book, chapter },
      });
      return;
    }

    router.back();
  }, [book, chapter, fromMemorized, router]);

  const handleHint = useCallback(() => {
    if (showAllWordsLocked || learningMode !== 'guess-verse' || !verseData || !learningSettings.showHints) {
      return;
    }

    const words = verseData.text.split(' ');
    const unrevealedIndices = words.map((_, index) => index).filter((index) => !revealedWords.has(index));

    if (unrevealedIndices.length > 0 && hintsUsed < learningSettings.maxHints) {
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      const nextRevealed = new Set(revealedWords);
      nextRevealed.add(randomIndex);
      setRevealedWords(nextRevealed);
      setHintsUsed((previous) => previous + 1);

      if (learningSettings.hapticFeedback) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [hintsUsed, learningMode, learningSettings.hapticFeedback, learningSettings.maxHints, learningSettings.showHints, revealedWords, showAllWordsLocked, verseData]);

  const handleRevealWord = useCallback(
    (index: number) => {
      if (!verseData || learningMode !== 'guess-verse' || !learningSettings.showHints || showAllWordsLocked) {
        return;
      }

      if (revealedWords.has(index) || hintsUsed >= learningSettings.maxHints) {
        return;
      }

      const nextRevealed = new Set(revealedWords);
      nextRevealed.add(index);
      setRevealedWords(nextRevealed);
      setHintsUsed((previous) => previous + 1);

      if (learningSettings.hapticFeedback) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [hintsUsed, learningMode, learningSettings.hapticFeedback, learningSettings.maxHints, learningSettings.showHints, revealedWords, showAllWordsLocked, verseData],
  );

  const handleToggleShowAllWords = useCallback(() => {
    if (!verseData || learningMode !== 'guess-verse') {
      return;
    }

    if (showAllWordsLocked) {
      setShowAllWordsLocked(false);
      setRevealedWords(new Set());
      return;
    }

    const allWordIndexes = verseData.text.split(' ').map((_, index) => index);
    setShowAllWordsLocked(true);
    setRevealedWords(new Set(allWordIndexes));
  }, [learningMode, showAllWordsLocked, verseData]);

  const handleRetry = useCallback(() => {
    resetValidation();
    setRevealedWords(new Set());
    setHintsUsed(0);
  }, [resetValidation]);

  const handleToggleMemorized = useCallback(async () => {
    if (!verseData) {
      return;
    }

    const nextMemorizedState = !isMemorized;
    setIsMemorized(nextMemorizedState);

    try {
      await toggleMemorized(verseData.book, verseData.chapter, verseData.verse);
    } catch (error) {
      console.error('Error toggling memorized state:', error);
      setIsMemorized(!nextMemorizedState);
    }
  }, [isMemorized, toggleMemorized, verseData]);

  const handleCopyVerse = useCallback(async () => {
    if (!verseData?.text) {
      return;
    }

    try {
      const textToCopy = comparisonVerseText
        ? `${verseData.text}\n\n(Édition de comparaison)\n${comparisonVerseText}`
        : verseData.text;
      await Clipboard.setStringAsync(textToCopy);
      Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'verseCopied'));
    } catch (error) {
      console.error('Failed to copy verse to clipboard:', error);
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'failedToCopyVerse'));
    }
  }, [comparisonVerseText, uiLanguage, verseData]);

  const handleCheck = useCallback(async () => {
    if (!verseData) {
      return;
    }

    const currentProgress = getVerseProgress(verseData.book, verseData.chapter, verseData.verse);
    const { correct, precision, xpMultiplier, shouldSkipXpForAttempt, validationErrorsForAttempt } = validateAnswer({
      verseData,
      learningMode,
      uiLanguage,
      validationSettings,
    });

    if (learningSettings.hapticFeedback) {
      if (correct) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    if (correct && shouldSkipXpForAttempt) {
      Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'xpSkippedPasteDetected'));
    }

    if (!correct) {
      const errorDetails = validationErrorsForAttempt.length > 0
        ? `\n\n${validationErrorsForAttempt.join('\n')}`
        : '';
      Alert.alert(t(uiLanguage, 'incorrect'), `${t(uiLanguage, 'tryAgain')}${errorDetails}`);
    }

    const currentMasteryLevel = currentProgress?.masteryLevel || 0;
    const newMasteryLevel = correct && currentMasteryLevel < maxMasteryLevel
      ? currentMasteryLevel + 1
      : currentMasteryLevel;

    setMasteryLevel(newMasteryLevel);

    const shouldAutoMarkMemorized = learningSettings.autoMarkMemorized
      && newMasteryLevel >= learningSettings.autoMarkThreshold;
    const willBeMemorized = shouldAutoMarkMemorized || currentProgress?.memorized || false;
    const isNowCompleted = newMasteryLevel >= maxMasteryLevel;
    const revealedRatio = verseData.text.trim().length === 0
      ? 0
      : revealedWords.size / Math.max(1, verseData.text.split(/\s+/).filter(Boolean).length);

    const nextSrsState = willBeMemorized
      ? computeNextSrsState(currentProgress?.srs, {
          correct,
          precision,
          hintsUsed,
          revealedRatio,
          inputLikelyPasted,
        })
      : currentProgress?.srs;

    const newProgress = {
      book: verseData.book,
      chapter: verseData.chapter,
      verse: verseData.verse,
      attempts: (currentProgress?.attempts || 0) + 1,
      correctGuesses: (currentProgress?.correctGuesses || 0) + (correct ? 1 : 0),
      lastPracticed: new Date().toISOString(),
      completed: isNowCompleted,
      started: true,
      masteryLevel: newMasteryLevel,
      memorized: willBeMemorized,
      srs: nextSrsState,
    };

    await updateProgress(newProgress, {
      skipXp: shouldSkipXpForAttempt,
      xpMultiplier: correct ? xpMultiplier : undefined,
    });

    let shouldDeferFullScreen = false;
    if (correct) {
      const updatedCount = await incrementCompletedVerses();
      shouldDeferFullScreen = await checkAndShowModal(updatedCount);
    }

    if (shouldAutoMarkMemorized && !currentProgress?.memorized) {
      setIsMemorized(true);
    }

    const masteryUp = correct && newMasteryLevel > currentMasteryLevel;
    const isNewCompletion = correct && isNowCompleted && !currentProgress?.completed;

    if (correct && (masteryUp || isNewCompletion)) {
      const verseId = buildVerseId({
        book: verseData.book,
        chapter: verseData.chapter,
        verse: verseData.verse,
        version: language,
      });
      const referenceText = buildReferenceText({
        bookName: getBookName(uiLanguage, verseData.book),
        chapter: verseData.chapter,
        verse: verseData.verse,
      });

      const rewardResult = await RewardEngine.onVerseCompleted(
        {
          verseId,
          language: uiLanguage,
          version: language,
          mode: learningMode,
          precision,
          attempts: newProgress.attempts,
          masteryBefore: currentMasteryLevel,
          masteryAfter: newMasteryLevel,
          timestamp: new Date().toISOString(),
          isCompleted: isNewCompletion,
          referenceText,
          verseText: verseData.text,
          shouldDeferFullScreen,
        },
        (key) => t(uiLanguage, key),
      );

      applyRewardResult(rewardResult);
    }

    if (learningSettings.autoAdvance && correct) {
      setTimeout(() => {
        handleNext();
      }, 1500);
    }
  }, [
    applyRewardResult,
    checkAndShowModal,
    getVerseProgress,
    handleNext,
    hintsUsed,
    incrementCompletedVerses,
    inputLikelyPasted,
    language,
    learningMode,
    learningSettings.autoAdvance,
    learningSettings.autoMarkMemorized,
    learningSettings.autoMarkThreshold,
    learningSettings.hapticFeedback,
    maxMasteryLevel,
    revealedWords.size,
    uiLanguage,
    updateProgress,
    validateAnswer,
    validationSettings,
    verseData,
  ]);

  const screenOptions = useMemo(
    () => ({
      title: t(uiLanguage, 'practice'),
      headerShown: true,
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { color: colors.text },
      headerRight: () => (
        <LearnHeaderActions
          colors={colors}
          comparisonLabel={comparisonLabel}
          showHeaderBadge={showHeaderBadge}
          onOpenComparison={() => setShowComparisonModal(true)}
        />
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleBackToChapter}
          style={learnStyles.headerBackButton}
          accessibilityLabel={t(uiLanguage, 'back')}
          accessibilityRole="button"
          hitSlop={learnStyles.headerBackButtonHitSlop}
        >
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
      ),
    }),
    [colors, comparisonLabel, handleBackToChapter, showHeaderBadge, uiLanguage],
  );

  if (isLoading) {
    return (
      <View style={[learnStyles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={screenOptions} />
        <View style={learnStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!verseData) {
    return (
      <View style={[learnStyles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={screenOptions} />
        <View style={learnStyles.loadingContainer}>
          <Text style={[learnStyles.errorText, { color: colors.textSecondary }]}>Verse not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[learnStyles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={screenOptions} />

      <KeyboardAvoidingView
        style={learnStyles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={learnStyles.content}
          contentContainerStyle={learnStyles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LearnExerciseCard
            colors={colors}
            uiLanguage={uiLanguage}
            learningMode={learningMode}
            verseData={verseData}
            isMemorized={isMemorized}
            onToggleMemorized={() => void handleToggleMemorized()}
            showMasteryInfo={showMasteryInfo}
            masteryLevel={masteryLevel}
            maxMasteryLevel={maxMasteryLevel}
            dyslexiaSettings={dyslexiaSettings}
            learningSettings={learningSettings}
            isSpeaking={isSpeaking}
            onToggleTts={() => void handleTTS()}
            onCopyVerse={() => void handleCopyVerse()}
            comparisonVerseText={comparisonVerseText}
            revealedWords={revealedWords}
            showAllWordsLocked={showAllWordsLocked}
            hintsUsed={hintsUsed}
            onHint={handleHint}
            onRevealWord={handleRevealWord}
            onToggleShowAllWords={handleToggleShowAllWords}
            focusMode={focusMode}
            showFeedback={showFeedback}
            isCorrect={isCorrect}
          />

          {!showFeedback ? (
            <TouchableOpacity style={[learnStyles.button, { backgroundColor: colors.primary }]} onPress={() => void handleCheck()}>
              <Text style={learnStyles.buttonTextPrimary}>{t(uiLanguage, 'check')}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={[learnStyles.inputCard, focusMode ? learnStyles.inputCardFocus : null, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[learnStyles.inputLabel, { color: colors.text }]}>
              {learningMode === 'guess-verse' ? t(uiLanguage, 'guessVerse') : t(uiLanguage, 'guessReference')}
            </Text>
            <TextInput
              style={[
                learnStyles.input,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
              value={userAnswer}
              onChangeText={handleAnswerChange}
              placeholder={t(uiLanguage, 'yourAnswer')}
              multiline={learningMode === 'guess-verse'}
              numberOfLines={learningMode === 'guess-verse' ? 4 : 1}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={learnStyles.navigationRow}>
            <TouchableOpacity
              style={[
                learnStyles.button,
                learnStyles.buttonSecondary,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.primary,
                  flex: 1,
                  opacity: hasPrevious ? 1 : 0.5,
                },
              ]}
              onPress={handlePrevious}
              disabled={!hasPrevious}
            >
              <Text style={[learnStyles.buttonTextSecondary, { color: colors.primary }]}>
                {t(uiLanguage, 'previousVerse')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                learnStyles.button,
                learnStyles.buttonSecondary,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.primary,
                  flex: 1,
                  opacity: hasNext ? 1 : 0.5,
                },
              ]}
              onPress={handleNext}
              disabled={!hasNext}
            >
              <Text style={[learnStyles.buttonTextSecondary, { color: colors.primary }]}>
                {t(uiLanguage, 'nextVerse')}
              </Text>
            </TouchableOpacity>
          </View>

          <LearnFeedbackPanel
            colors={colors}
            uiLanguage={uiLanguage}
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            validationErrorDetails={validationErrorDetails}
            onRetry={handleRetry}
            onNext={handleNext}
            focusMode={focusMode}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <LearnRewardOverlays
        colors={colors}
        uiLanguage={uiLanguage}
        rewardToast={rewardToast}
        rewardMilestone={rewardMilestone}
        rewardSurprise={rewardSurprise}
        rewardCard={rewardCard}
        onHideToast={() => setRewardToast(null)}
        onCloseMilestone={() => setRewardMilestone(null)}
        onCloseSurprise={() => setRewardSurprise(null)}
        onCloseRewardCard={() => {
          setRewardSurprise(null);
          setRewardCard(null);
        }}
        focusMode={focusMode}
      />

      <LearnComparisonSheet
        visible={showComparisonModal}
        colors={colors}
        language={language}
        comparisonVersion={appearanceSettings.comparisonVersion}
        comparisonEnabled={appearanceSettings.enableVerseComparison}
        onClose={() => setShowComparisonModal(false)}
        onSelectPrimary={(code) => void handlePrimaryVersionChange(code, setAppearanceSettings, setLanguage, () => setShowComparisonModal(false))}
        onSelectComparison={(code) => void handleComparisonChange(code, setAppearanceSettings, () => setShowComparisonModal(false))}
      />
    </View>
  );
}
