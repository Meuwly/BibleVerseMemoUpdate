import { Check, X } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { t } from '../../../../constants/translations';
import { learnStyles } from '../styles';

interface LearnFeedbackPanelProps {
  colors: ColorScheme;
  uiLanguage: string;
  showFeedback: boolean;
  isCorrect: boolean;
  validationErrorDetails: string[];
  onRetry: () => void;
  onNext: () => void;
  focusMode: boolean;
}

export function LearnFeedbackPanel({
  colors,
  uiLanguage,
  showFeedback,
  isCorrect,
  validationErrorDetails,
  onRetry,
  onNext,
  focusMode,
}: LearnFeedbackPanelProps) {
  if (!showFeedback) {
    return null;
  }

  return (
    <>
      <View
        style={[
          learnStyles.feedback,
          isCorrect ? learnStyles.feedbackCorrect : learnStyles.feedbackIncorrect,
          focusMode ? learnStyles.feedbackFocus : null,
        ]}
      >
        {isCorrect ? (
          <>
            <Check color={colors.success} size={24} />
            <View style={learnStyles.feedbackCopy}>
              <Text style={learnStyles.feedbackTextCorrect}>{t(uiLanguage, 'practiceSuccessTitle')}</Text>
              <Text style={[learnStyles.feedbackTextBody, { color: colors.textSecondary }]}>
                {t(uiLanguage, focusMode ? 'practiceSuccessFocusBody' : 'practiceSuccessBody')}
              </Text>
            </View>
          </>
        ) : (
          <>
            <X color={colors.error} size={24} />
            <Text style={learnStyles.feedbackTextIncorrect}>{t(uiLanguage, 'incorrect')}</Text>
          </>
        )}
      </View>
      {!isCorrect && validationErrorDetails.length > 0 ? (
        <View
          style={[
            learnStyles.feedbackErrorDetails,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          {validationErrorDetails.map((error, index) => (
            <Text
              key={`${error}-${index}`}
              style={[learnStyles.feedbackErrorDetailsText, { color: colors.textSecondary }]}
            >
              • {error}
            </Text>
          ))}
        </View>
      ) : null}
      {isCorrect ? (
        <TouchableOpacity
          style={[
            learnStyles.button,
            learnStyles.buttonSecondary,
            { backgroundColor: colors.cardBackground, borderColor: colors.primary },
          ]}
          onPress={onNext}
        >
          <Text style={[learnStyles.buttonTextSecondary, { color: colors.primary }]}>
            {t(uiLanguage, 'nextVerse')}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={learnStyles.buttonGroup}>
          <TouchableOpacity style={[learnStyles.button, { backgroundColor: colors.primary }]} onPress={onRetry}>
            <Text style={learnStyles.buttonTextPrimary}>{t(uiLanguage, 'tryAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              learnStyles.button,
              learnStyles.buttonSecondary,
              { backgroundColor: colors.cardBackground, borderColor: colors.primary },
            ]}
            onPress={onNext}
          >
            <Text style={[learnStyles.buttonTextSecondary, { color: colors.primary }]}>
              {t(uiLanguage, 'nextVerse')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
