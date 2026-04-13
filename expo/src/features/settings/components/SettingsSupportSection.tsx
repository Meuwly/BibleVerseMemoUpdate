import { BookOpen, Folder, Heart, Info, Mail, RefreshCcw } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { settingsStyles } from '../styles';

interface SettingsSupportSectionProps {
  colors: ColorScheme;
  booksSourceLabel: string;
  myProjectsLabel: string;
  contactDeveloperLabel: string;
  aboutLabel: string;
  donateLabel: string;
  footerText: string;
  resetSettingsLabel: string;
  onBooksSource: () => void;
  onMyProjects: () => void;
  onContactDeveloper: () => void;
  onOpenAbout: () => void;
  onDonate: () => void;
  onResetSettings: () => void;
}

export function SettingsSupportSection({
  colors,
  booksSourceLabel,
  myProjectsLabel,
  contactDeveloperLabel,
  aboutLabel,
  donateLabel,
  footerText,
  resetSettingsLabel,
  onBooksSource,
  onMyProjects,
  onContactDeveloper,
  onOpenAbout,
  onDonate,
  onResetSettings,
}: SettingsSupportSectionProps) {
  return (
    <View style={settingsStyles.section}>
      <TouchableOpacity style={settingsStyles.booksSourceButton} onPress={onBooksSource} activeOpacity={0.8}>
        <BookOpen color="#059669" size={20} />
        <Text style={settingsStyles.booksSourceButtonText}>{booksSourceLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={settingsStyles.myProjectsButton} onPress={onMyProjects} activeOpacity={0.8}>
        <Folder color="#3B82F6" size={20} />
        <Text style={settingsStyles.myProjectsButtonText}>{myProjectsLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          settingsStyles.contactDeveloperButton,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.purple + '66',
            shadowColor: colors.purple,
          },
        ]}
        onPress={onContactDeveloper}
        activeOpacity={0.8}
      >
        <Mail color={colors.purple} size={20} />
        <Text style={[settingsStyles.contactDeveloperButtonText, { color: colors.purple }]}>{contactDeveloperLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          settingsStyles.donateButton,
          {
            backgroundColor: colors.error + '15',
            borderColor: colors.error,
          },
        ]}
        onPress={onDonate}
        activeOpacity={0.8}
      >
        <Heart color={colors.error} size={20} />
        <Text style={[settingsStyles.donateButtonText, { color: colors.error }]}>{donateLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={settingsStyles.aboutButton} onPress={onOpenAbout} activeOpacity={0.8}>
        <Info color={colors.primary} size={20} />
        <Text style={[settingsStyles.aboutButtonText, { color: colors.primary }]}>{aboutLabel}</Text>
      </TouchableOpacity>

      <Text style={[settingsStyles.footerText, { color: colors.textTertiary, marginTop: 24 }]}>{footerText}</Text>

      <TouchableOpacity
        style={[settingsStyles.resetButton, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
        onPress={onResetSettings}
        activeOpacity={0.8}
      >
        <RefreshCcw color={colors.error} size={20} />
        <Text style={[settingsStyles.resetButtonText, { color: colors.error }]}>{resetSettingsLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
