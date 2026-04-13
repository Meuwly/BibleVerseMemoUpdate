import Slider from '@react-native-community/slider';
import { BookOpen, Check, ChevronDown, List, Palette, Sun } from 'lucide-react-native';
import { Switch as RNSwitch, Text, TouchableOpacity, View } from 'react-native';

import { themeColors, type ColorScheme } from '../../../../constants/colors';
import { settingsStyles } from '../styles';
import { SettingsCollapsibleSection } from './SettingsCollapsibleSection';

interface SettingsAppearanceSectionsProps {
  colors: ColorScheme;
  learningModeLabel: string;
  selectedThemeLabel: string;
  selectedThemeValue: string;
  comparisonLanguageLabel: string;
  validationSettings: {
    toleranceLevel: number;
    allowLetterInversion: boolean;
    ignorePunctuation: boolean;
    ignoreAccents: boolean;
  };
  dyslexiaSettings: {
    fontSize: number;
    lineHeight: number;
    wordSpacing: number;
  };
  appearanceSettings: {
    animationsEnabled: boolean;
    showStartupVerse?: boolean;
    startupVerseMode?: 'random' | 'curated';
    enableVerseComparison?: boolean;
  };
  expandedSections: {
    learningMode: boolean;
    themeSettings: boolean;
    validationSettings: boolean;
    readingSettings: boolean;
    appearanceSettings: boolean;
  };
  labels: Record<string, string>;
  onToggleSection: (section: 'learningMode' | 'themeSettings' | 'validationSettings' | 'readingSettings' | 'appearanceSettings') => void;
  onOpenLearningMode: () => void;
  onOpenTheme: () => void;
  onOpenComparisonVersion: () => void;
  onChangeValidationSettings: (value: Partial<SettingsAppearanceSectionsProps['validationSettings']>) => void | Promise<void>;
  onChangeDyslexiaSettings: (value: Partial<SettingsAppearanceSectionsProps['dyslexiaSettings']>) => void | Promise<void>;
  onChangeAppearanceSettings: (value: Partial<SettingsAppearanceSectionsProps['appearanceSettings'] & { comparisonVersion?: string | null }>) => void | Promise<void>;
}

export function SettingsAppearanceSections({
  colors,
  learningModeLabel,
  selectedThemeLabel,
  selectedThemeValue,
  comparisonLanguageLabel,
  validationSettings,
  dyslexiaSettings,
  appearanceSettings,
  expandedSections,
  labels,
  onToggleSection,
  onOpenLearningMode,
  onOpenTheme,
  onOpenComparisonVersion,
  onChangeValidationSettings,
  onChangeDyslexiaSettings,
  onChangeAppearanceSettings,
}: SettingsAppearanceSectionsProps) {
  return (
    <>
      <SettingsCollapsibleSection
        title={labels.learningMode}
        icon={BookOpen}
        iconColor={colors.primary}
        colors={colors}
        expanded={expandedSections.learningMode}
        onToggle={() => onToggleSection('learningMode')}
      >
        <View style={[settingsStyles.pickerContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TouchableOpacity style={settingsStyles.languageSelectButton} onPress={onOpenLearningMode}>
            <Text style={[settingsStyles.languageSelectText, { color: colors.text }]} numberOfLines={1}>
              {learningModeLabel}
            </Text>
            <ChevronDown color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
      </SettingsCollapsibleSection>

      <SettingsCollapsibleSection
        title={labels.theme}
        icon={Sun}
        iconColor={colors.warning}
        colors={colors}
        expanded={expandedSections.themeSettings}
        onToggle={() => onToggleSection('themeSettings')}
      >
        <View style={[settingsStyles.pickerContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TouchableOpacity style={settingsStyles.languageSelectButton} onPress={onOpenTheme}>
            <View style={settingsStyles.selectValueRow}>
              <View style={[settingsStyles.themeSwatch, { backgroundColor: themeColors[selectedThemeValue as keyof typeof themeColors]?.primary ?? colors.primary }]} />
              <Text style={[settingsStyles.languageSelectText, { color: colors.text, marginRight: 0 }]} numberOfLines={1}>
                {selectedThemeLabel}
              </Text>
            </View>
            <ChevronDown color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
      </SettingsCollapsibleSection>

      <SettingsCollapsibleSection
        title={labels.validationSettings}
        icon={Check}
        iconColor={colors.success}
        colors={colors}
        expanded={expandedSections.validationSettings}
        onToggle={() => onToggleSection('validationSettings')}
      >
        <View>
          <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>
              {labels.validationTolerance}: {Math.round(validationSettings.toleranceLevel * 100)}%
            </Text>
            <Slider
              style={settingsStyles.slider}
              minimumValue={0.75}
              maximumValue={1}
              step={0.05}
              value={validationSettings.toleranceLevel}
              onValueChange={(value: number) => onChangeValidationSettings({ toleranceLevel: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
            <View style={settingsStyles.themeOption}>
              <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.allowLetterInversion}</Text>
            </View>
            <RNSwitch
              value={validationSettings.allowLetterInversion}
              onValueChange={(value) => onChangeValidationSettings({ allowLetterInversion: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={validationSettings.allowLetterInversion ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
            <View style={settingsStyles.themeOption}>
              <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.ignorePunctuation}</Text>
            </View>
            <RNSwitch
              value={validationSettings.ignorePunctuation}
              onValueChange={(value) => onChangeValidationSettings({ ignorePunctuation: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={validationSettings.ignorePunctuation ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
            <View style={settingsStyles.themeOption}>
              <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.ignoreAccents}</Text>
            </View>
            <RNSwitch
              value={validationSettings.ignoreAccents}
              onValueChange={(value) => onChangeValidationSettings({ ignoreAccents: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={validationSettings.ignoreAccents ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>
      </SettingsCollapsibleSection>

      <SettingsCollapsibleSection
        title={labels.readingSettings}
        icon={BookOpen}
        iconColor={colors.info}
        colors={colors}
        expanded={expandedSections.readingSettings}
        onToggle={() => onToggleSection('readingSettings')}
      >
        <View>
          <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
            <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>{labels.fontSize}: {dyslexiaSettings.fontSize}px</Text>
            <Slider
              style={settingsStyles.slider}
              minimumValue={14}
              maximumValue={28}
              step={1}
              value={dyslexiaSettings.fontSize}
              onValueChange={(value: number) => onChangeDyslexiaSettings({ fontSize: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
            <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>{labels.lineSpacing}: {dyslexiaSettings.lineHeight}px</Text>
            <Slider
              style={settingsStyles.slider}
              minimumValue={20}
              maximumValue={48}
              step={2}
              value={dyslexiaSettings.lineHeight}
              onValueChange={(value: number) => onChangeDyslexiaSettings({ lineHeight: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
            <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>{labels.wordSpacing}: {dyslexiaSettings.wordSpacing}px</Text>
            <Slider
              style={settingsStyles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={dyslexiaSettings.wordSpacing}
              onValueChange={(value: number) => onChangeDyslexiaSettings({ wordSpacing: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
            <View style={settingsStyles.themeOption}>
              <Text style={[settingsStyles.optionText, { color: colors.text }]}>
                {labels.enableVerseComparison}
              </Text>
            </View>
            <RNSwitch
              value={appearanceSettings.enableVerseComparison === true}
              onValueChange={(value) => onChangeAppearanceSettings({ enableVerseComparison: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={appearanceSettings.enableVerseComparison ? colors.primary : colors.textTertiary}
            />
          </View>

          {appearanceSettings.enableVerseComparison ? (
            <TouchableOpacity
              style={[settingsStyles.languageSelectButton, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
              onPress={onOpenComparisonVersion}
            >
              <Text style={[settingsStyles.languageSelectText, { color: colors.text }]} numberOfLines={1}>
                {comparisonLanguageLabel}
              </Text>
              <ChevronDown color={colors.textSecondary} size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
      </SettingsCollapsibleSection>

      <SettingsCollapsibleSection
        title={labels.appearanceSettings}
        icon={Palette}
        iconColor={colors.primary}
        colors={colors}
        expanded={expandedSections.appearanceSettings}
        onToggle={() => onToggleSection('appearanceSettings')}
      >
        <View>
          <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
            <View style={settingsStyles.themeOption}>
              <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.enableAnimations}</Text>
            </View>
            <RNSwitch
              value={appearanceSettings.animationsEnabled}
              onValueChange={(value) => onChangeAppearanceSettings({ animationsEnabled: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={appearanceSettings.animationsEnabled ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}>
            <View style={settingsStyles.themeOption}>
              <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.showStartupVerse}</Text>
            </View>
            <RNSwitch
              value={appearanceSettings.showStartupVerse !== false}
              onValueChange={(value) => onChangeAppearanceSettings({ showStartupVerse: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={appearanceSettings.showStartupVerse !== false ? colors.primary : colors.textTertiary}
            />
          </View>

          {appearanceSettings.showStartupVerse !== false && (
            <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
              <View style={settingsStyles.themeOption}>
                <List color={colors.primary} size={16} />
                <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.startupVerseMode}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, paddingTop: 2 }}>
                {(['random', 'curated'] as const).map((mode) => {
                  const isSelected = (appearanceSettings.startupVerseMode ?? 'random') === mode;
                  const label = mode === 'random' ? labels.startupVerseModeRandom : labels.startupVerseModeCurated;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        settingsStyles.modeChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => onChangeAppearanceSettings({ startupVerseMode: mode })}
                      activeOpacity={0.75}
                    >
                      {isSelected && <Check color="#FFFFFF" size={13} />}
                      <Text style={[settingsStyles.modeChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </SettingsCollapsibleSection>
    </>
  );
}
