import { ChevronDown, FileText, Plus } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { settingsStyles } from '../styles';

interface SettingsLanguageSectionProps {
  colors: ColorScheme;
  title: string;
  selectedLanguageLabel: string;
  importCustomVersionLabel: string;
  onOpenLanguageModal: () => void;
  onOpenCustomVersionModal: () => void;
}

export function SettingsLanguageSection({
  colors,
  title,
  selectedLanguageLabel,
  importCustomVersionLabel,
  onOpenLanguageModal,
  onOpenCustomVersionModal,
}: SettingsLanguageSectionProps) {
  return (
    <View style={settingsStyles.section}>
      <View style={settingsStyles.sectionHeader}>
        <View style={settingsStyles.sectionTitleRow}>
          <FileText color={colors.success} size={20} />
          <Text style={[settingsStyles.sectionTitle, { color: colors.text }]}>{title}</Text>
        </View>
      </View>

      <View>
        <View style={[settingsStyles.pickerContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <TouchableOpacity style={settingsStyles.languageSelectButton} onPress={onOpenLanguageModal}>
            <Text style={[settingsStyles.languageSelectText, { color: colors.text }]}>{selectedLanguageLabel}</Text>
            <ChevronDown color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            settingsStyles.customVersionButton,
            {
              backgroundColor: colors.primary + '20',
              borderColor: colors.primary,
            },
          ]}
          onPress={onOpenCustomVersionModal}
        >
          <Plus color={colors.primary} size={20} />
          <Text style={[settingsStyles.customVersionButtonText, { color: colors.primary }]}>{importCustomVersionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
