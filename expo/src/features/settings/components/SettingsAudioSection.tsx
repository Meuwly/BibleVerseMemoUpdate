import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, Volume2 } from 'lucide-react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { settingsStyles } from '../styles';
import { SettingsCollapsibleSection } from './SettingsCollapsibleSection';

interface SettingsAudioSectionProps {
  colors: ColorScheme;
  title: string;
  speedLabel: string;
  selectedSpeedLabel: string;
  voiceLabel: string;
  selectedVoiceLabel: string;
  voiceInfoLabel: string;
  loadingVoicesLabel: string;
  noVoicesLabel: string;
  expanded: boolean;
  loadingVoices: boolean;
  hasVoices: boolean;
  onToggle: () => void;
  onOpenSpeed: () => void;
  onOpenVoice: () => void;
}

export function SettingsAudioSection({
  colors,
  title,
  speedLabel,
  selectedSpeedLabel,
  voiceLabel,
  selectedVoiceLabel,
  voiceInfoLabel,
  loadingVoicesLabel,
  noVoicesLabel,
  expanded,
  loadingVoices,
  hasVoices,
  onToggle,
  onOpenSpeed,
  onOpenVoice,
}: SettingsAudioSectionProps) {
  return (
    <SettingsCollapsibleSection
      title={title}
      icon={Volume2}
      iconColor={colors.info}
      colors={colors}
      expanded={expanded}
      onToggle={onToggle}
    >
      <View style={settingsStyles.compactControlsGroup}>
        <View style={[settingsStyles.pickerContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <TouchableOpacity style={settingsStyles.languageSelectButton} onPress={onOpenSpeed}>
            <View>
              <Text style={[settingsStyles.compactSelectLabel, { color: colors.textSecondary }]}>{speedLabel}</Text>
              <Text style={[settingsStyles.languageSelectText, { color: colors.text, marginRight: 0 }]} numberOfLines={1}>{selectedSpeedLabel}</Text>
            </View>
            <ChevronDown color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>

        {loadingVoices ? (
          <View style={[settingsStyles.voiceLoadingContainer, { backgroundColor: colors.cardBackground }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[settingsStyles.voiceLoadingText, { color: colors.textSecondary }]}>{loadingVoicesLabel}</Text>
          </View>
        ) : !hasVoices ? (
          <View style={[settingsStyles.voiceEmptyContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[settingsStyles.voiceEmptyText, { color: colors.textSecondary }]}>{noVoicesLabel}</Text>
          </View>
        ) : (
          <View style={[settingsStyles.pickerContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <TouchableOpacity style={settingsStyles.languageSelectButton} onPress={onOpenVoice}>
              <View>
                <Text style={[settingsStyles.compactSelectLabel, { color: colors.textSecondary }]}>{voiceLabel}</Text>
                <Text style={[settingsStyles.languageSelectText, { color: colors.text, marginRight: 0 }]} numberOfLines={1}>{selectedVoiceLabel}</Text>
              </View>
              <ChevronDown color={colors.textSecondary} size={18} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={[settingsStyles.dyslexiaInfo, { color: colors.textSecondary, marginTop: 4 }]}>{voiceInfoLabel}</Text>
      </View>
    </SettingsCollapsibleSection>
  );
}
