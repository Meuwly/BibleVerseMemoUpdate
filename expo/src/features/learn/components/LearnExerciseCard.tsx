import { CheckCircle2, Copy, Lightbulb, Volume2, VolumeX } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { getBookName, t } from '../../../../constants/translations';
import type { DyslexiaSettings, LearningMode, LearningSettings, Verse } from '../../../../types/database';
import { AppCard } from '../../../components/ui/AppCard';
import { learnStyles } from '../styles';

interface LearnExerciseCardProps {
  colors: ColorScheme;
  uiLanguage: string;
  learningMode: LearningMode;
  verseData: Verse;
  isMemorized: boolean;
  onToggleMemorized: () => void;
  showMasteryInfo: boolean;
  masteryLevel: number;
  maxMasteryLevel: number;
  dyslexiaSettings: DyslexiaSettings;
  learningSettings: LearningSettings;
  isSpeaking: boolean;
  onToggleTts: () => void;
  onCopyVerse: () => void;
  comparisonVerseText: string | null;
  revealedWords: Set<number>;
  showAllWordsLocked: boolean;
  hintsUsed: number;
  onHint: () => void;
  onRevealWord: (index: number) => void;
  onToggleShowAllWords: () => void;
  focusMode: boolean;
  showFeedback: boolean;
  isCorrect: boolean;
}

export function LearnExerciseCard({
  colors,
  uiLanguage,
  learningMode,
  verseData,
  isMemorized,
  onToggleMemorized,
  showMasteryInfo,
  masteryLevel,
  maxMasteryLevel,
  dyslexiaSettings,
  learningSettings,
  isSpeaking,
  onToggleTts,
  onCopyVerse,
  comparisonVerseText,
  revealedWords,
  showAllWordsLocked,
  hintsUsed,
  onHint,
  onRevealWord,
  onToggleShowAllWords,
  focusMode,
  showFeedback,
  isCorrect,
}: LearnExerciseCardProps) {
  const renderComparisonPanel = () => {
    if (!comparisonVerseText || focusMode) {
      return null;
    }

    return (
      <>
        <View style={learnStyles.versionSeparator}>
          <View
            style={[
              learnStyles.versionPill,
              { backgroundColor: colors.primary + '18', borderColor: colors.primary + '55' },
            ]}
          >
            <Text style={[learnStyles.versionPillText, { color: colors.primary }]}>Édition principale</Text>
          </View>
          <View style={[learnStyles.versionDivider, { backgroundColor: colors.border }]} />
          <View
            style={[
              learnStyles.versionPill,
              { backgroundColor: colors.warning + '18', borderColor: colors.warning + '55' },
            ]}
          >
            <Text style={[learnStyles.versionPillText, { color: colors.warning }]}>Édition de comparaison</Text>
          </View>
        </View>
        <View
          style={[
            learnStyles.comparisonCard,
            { borderColor: colors.warning + '55', backgroundColor: colors.warning + '10' },
          ]}
        >
          <Text style={[learnStyles.comparisonLabel, { color: colors.textSecondary }]}>Édition de comparaison</Text>
          <Text style={[learnStyles.comparisonText, { color: colors.text }]}>{comparisonVerseText}</Text>
        </View>
      </>
    );
  };

  const renderMaskedText = () => {
    const words = verseData.text.split(' ');

    return (
      <View style={learnStyles.maskedTextContainer}>
        {words.map((word, index) => (
          <TouchableOpacity
            key={`${word}-${index}`}
            onPress={() => onRevealWord(index)}
            disabled={
              showAllWordsLocked
              || revealedWords.has(index)
              || !learningSettings.showHints
              || hintsUsed >= learningSettings.maxHints
            }
            style={learnStyles.maskedWordTouchable}
          >
            <Text
              style={[
                learnStyles.maskedText,
                {
                  color: colors.text,
                  fontSize: dyslexiaSettings.fontSize,
                  lineHeight: dyslexiaSettings.lineHeight,
                  letterSpacing: dyslexiaSettings.wordSpacing,
                },
              ]}
            >
              {showAllWordsLocked || revealedWords.has(index) ? word : '____'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={focusMode ? learnStyles.focusCardStack : undefined}>
      <TouchableOpacity
        style={[
          learnStyles.memorizedButton,
          focusMode ? learnStyles.memorizedButtonFocus : null,
          {
            backgroundColor: isMemorized ? colors.success + '16' : focusMode ? colors.background : colors.cardBackground,
            borderColor: isMemorized ? colors.success : colors.border,
          },
        ]}
        onPress={onToggleMemorized}
      >
        <CheckCircle2
          color={isMemorized ? colors.success : colors.textSecondary}
          size={20}
          fill={isMemorized ? colors.success : 'transparent'}
        />
        <Text style={[learnStyles.memorizedText, { color: isMemorized ? colors.success : colors.text }]}> 
          {isMemorized ? t(uiLanguage, 'memorized') : t(uiLanguage, 'markAsMemorized')}
        </Text>
      </TouchableOpacity>

      <AppCard colors={colors} tone={focusMode ? 'subtle' : 'default'} style={learnStyles.exerciseSurface}>
        {showMasteryInfo && masteryLevel > 0 && !focusMode ? (
          <View style={[learnStyles.masteryContainer, { borderBottomColor: colors.border }]}> 
            <Text style={[learnStyles.masteryLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'mastery')}</Text>
            <View style={learnStyles.masteryBar}>
              {Array.from({ length: maxMasteryLevel }, (_, index) => index + 1).map((level) => (
                <View
                  key={level}
                  style={[
                    learnStyles.masterySegment,
                    { backgroundColor: level <= masteryLevel ? colors.success : colors.border },
                  ]}
                />
              ))}
            </View>
            <Text style={[learnStyles.masteryText, { color: colors.primary }]}>{masteryLevel}/{maxMasteryLevel}</Text>
          </View>
        ) : null}

        <View style={focusMode ? learnStyles.focusReferenceBlock : undefined}>
          {showFeedback && isCorrect ? (
            <View
              style={[
                learnStyles.successBadge,
                {
                  backgroundColor: colors.success + '14',
                  borderColor: colors.success + '40',
                },
              ]}
            >
              <CheckCircle2 color={colors.success} size={18} fill={colors.success} />
              <View style={learnStyles.successBadgeCopy}>
                <Text style={[learnStyles.successBadgeText, { color: colors.success }]}>
                  {t(uiLanguage, 'practiceSuccessTitle')}
                </Text>
                <Text style={[learnStyles.successBadgeBody, { color: colors.textSecondary }]}>
                  {t(uiLanguage, focusMode ? 'practiceSuccessFocusBody' : 'practiceSuccessBody')}
                </Text>
              </View>
            </View>
          ) : null}
          {learningMode === 'guess-verse' ? (
            <>
              <View style={learnStyles.referenceRow}>
                <Text style={[learnStyles.reference, { color: colors.primary }]}> 
                  {getBookName(uiLanguage, verseData.book)} {verseData.chapter}:{verseData.verse}
                </Text>
                <View style={learnStyles.referenceActions}>
                  <TouchableOpacity
                    style={[learnStyles.iconButton, { backgroundColor: focusMode ? colors.background : colors.cardBackground }]}
                    onPress={onCopyVerse}
                    testID="copy-verse-button"
                  >
                    <Copy color={colors.primary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      learnStyles.iconButton,
                      { backgroundColor: isSpeaking ? colors.primary + '20' : focusMode ? colors.background : colors.cardBackground },
                    ]}
                    onPress={onToggleTts}
                    testID="tts-button"
                  >
                    {isSpeaking ? <VolumeX color={colors.primary} size={20} /> : <Volume2 color={colors.primary} size={20} />}
                  </TouchableOpacity>
                </View>
              </View>
              {renderMaskedText()}
              {renderComparisonPanel()}
              {learningSettings.showHints ? (
                <View style={[learnStyles.hintContainer, { borderTopColor: colors.border }]}> 
                  <View style={learnStyles.hintActionsRow}>
                    <TouchableOpacity
                      style={[learnStyles.hintButton, showAllWordsLocked ? learnStyles.hintButtonDisabled : null]}
                      onPress={onHint}
                      disabled={showAllWordsLocked}
                    >
                      <Lightbulb color={colors.warning} size={20} />
                      <Text style={learnStyles.hintButtonText}>{t(uiLanguage, 'hint')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        learnStyles.showAllWordsButton,
                        {
                          borderColor: showAllWordsLocked ? colors.success : colors.primary,
                          backgroundColor: showAllWordsLocked ? colors.success + '1A' : colors.background,
                        },
                      ]}
                      onPress={onToggleShowAllWords}
                    >
                      <Text
                        style={[
                          learnStyles.showAllWordsButtonText,
                          { color: showAllWordsLocked ? colors.success : colors.primary },
                        ]}
                      >
                        {showAllWordsLocked ? t(uiLanguage, 'hideAllWords') : t(uiLanguage, 'showAllWords')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[learnStyles.hintsText, { color: colors.textSecondary }]}>
                    {hintsUsed}/{learningSettings.maxHints}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={learnStyles.verseWithTTS}>
                <Text
                  style={[
                    learnStyles.verseText,
                    {
                      color: colors.text,
                      fontSize: dyslexiaSettings.fontSize,
                      lineHeight: dyslexiaSettings.lineHeight,
                      letterSpacing: dyslexiaSettings.wordSpacing,
                    },
                  ]}
                >
                  {verseData.text}
                </Text>
                <View style={learnStyles.inlineActions}>
                  <TouchableOpacity
                    style={[learnStyles.iconButtonInline, { backgroundColor: colors.background }]}
                    onPress={onCopyVerse}
                    testID="copy-verse-button-inline"
                  >
                    <Copy color={colors.primary} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      learnStyles.iconButtonInline,
                      { backgroundColor: isSpeaking ? colors.primary + '20' : colors.background },
                    ]}
                    onPress={onToggleTts}
                    testID="tts-button-inline"
                  >
                    {isSpeaking ? <VolumeX color={colors.primary} size={20} /> : <Volume2 color={colors.primary} size={20} />}
                  </TouchableOpacity>
                </View>
              </View>
              {renderComparisonPanel()}
            </>
          )}
        </View>
      </AppCard>
    </View>
  );
}
