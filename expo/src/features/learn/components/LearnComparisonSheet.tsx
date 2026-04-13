import { Check } from 'lucide-react-native';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { LANGUAGES } from '../../../../constants/languages';
import { learnStyles } from '../styles';

interface LearnComparisonSheetProps {
  visible: boolean;
  colors: ColorScheme;
  language: string;
  comparisonVersion?: string | null;
  comparisonEnabled?: boolean;
  onClose: () => void;
  onSelectPrimary: (code: string) => void;
  onSelectComparison: (code: string | null) => void;
}

export function LearnComparisonSheet({
  visible,
  colors,
  language,
  comparisonVersion,
  comparisonEnabled,
  onClose,
  onSelectPrimary,
  onSelectComparison,
}: LearnComparisonSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={learnStyles.selectionBackdrop}>
        <View style={[learnStyles.selectionModal, { backgroundColor: colors.cardBackground }]}>
          <Text style={[learnStyles.selectionTitle, { color: colors.text }]}>Éditions</Text>
          <ScrollView style={learnStyles.selectionList}>
            <Text style={[learnStyles.selectionSectionLabel, { color: colors.textSecondary }]}>Édition principale</Text>
            {LANGUAGES.map((option) => (
              <TouchableOpacity
                key={`primary-${option.code}`}
                style={[learnStyles.selectionItem, { borderBottomColor: colors.border }]}
                onPress={() => onSelectPrimary(option.code)}
              >
                <Text style={[learnStyles.selectionText, { color: colors.text }]}>
                  {option.flag} {option.name}
                </Text>
                {option.code === language ? <Check color={colors.primary} size={18} /> : null}
              </TouchableOpacity>
            ))}

            <Text style={[learnStyles.selectionSectionLabel, { color: colors.textSecondary }]}>Édition de comparaison</Text>
            <TouchableOpacity
              style={[learnStyles.selectionItem, { borderBottomColor: colors.border }]}
              onPress={() => onSelectComparison(null)}
            >
              <Text style={[learnStyles.selectionText, { color: colors.text }]}>Désactiver la comparaison</Text>
              {!comparisonEnabled ? <Check color={colors.primary} size={18} /> : null}
            </TouchableOpacity>
            {LANGUAGES.filter((option) => option.code !== language).map((option) => (
              <TouchableOpacity
                key={`comparison-${option.code}`}
                style={[learnStyles.selectionItem, { borderBottomColor: colors.border }]}
                onPress={() => onSelectComparison(option.code)}
              >
                <Text style={[learnStyles.selectionText, { color: colors.text }]}>
                  {option.flag} {option.name}
                </Text>
                {comparisonEnabled && option.code === comparisonVersion ? <Check color={colors.primary} size={18} /> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
