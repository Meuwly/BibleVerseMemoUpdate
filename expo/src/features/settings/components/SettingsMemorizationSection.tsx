import Slider from '@react-native-community/slider';
import { Heart, Zap } from 'lucide-react-native';
import { Switch as RNSwitch, Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import type { RewardSettings } from '../../../rewards/types';
import { settingsStyles } from '../styles';
import { SettingsCollapsibleSection } from './SettingsCollapsibleSection';

interface LearningSettingsValue {
  autoAdvance: boolean;
  showHints: boolean;
  maxHints: number;
  autoMarkMemorized: boolean;
  autoMarkThreshold: number;
  hapticFeedback: boolean;
  maxMasteryLevel: number;
}

interface SettingsMemorizationSectionProps {
  colors: ColorScheme;
  learningTitle: string;
  rewardsTitle: string;
  learningSettings: LearningSettingsValue;
  rewardSettings: RewardSettings;
  isIos: boolean;
  expandedLearning: boolean;
  expandedRewards: boolean;
  labels: Record<string, string>;
  onToggleLearning: () => void;
  onToggleRewards: () => void;
  onChangeLearningSettings: (value: Partial<LearningSettingsValue>) => void | Promise<void>;
  onChangeRewardSettings: (value: Partial<RewardSettings>) => void | Promise<void>;
  onResetScore: () => void;
}

export function SettingsMemorizationSection({
  colors,
  learningTitle,
  rewardsTitle,
  learningSettings,
  rewardSettings,
  isIos,
  expandedLearning,
  expandedRewards,
  labels,
  onToggleLearning,
  onToggleRewards,
  onChangeLearningSettings,
  onChangeRewardSettings,
  onResetScore,
}: SettingsMemorizationSectionProps) {
  return (
    <>
      <SettingsCollapsibleSection
        title={learningTitle}
        icon={Zap}
        iconColor={colors.warning}
        colors={colors}
        expanded={expandedLearning}
        onToggle={onToggleLearning}
      >
        <View>
          {[
            ['autoAdvanceNext', learningSettings.autoAdvance, 'autoAdvance'],
            ['showHintsButton', learningSettings.showHints, 'showHints'],
          ].map(([labelKey, value, settingKey]) => (
            <View key={String(settingKey)} style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
              <View style={settingsStyles.themeOption}>
                <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels[String(labelKey)]}</Text>
              </View>
              <RNSwitch
                value={Boolean(value)}
                onValueChange={(nextValue) => onChangeLearningSettings({ [String(settingKey)]: nextValue })}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={value ? colors.primary : colors.textTertiary}
              />
            </View>
          ))}

          {learningSettings.showHints ? (
            <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
              <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>{labels.maximumHints}: {learningSettings.maxHints}</Text>
              <Slider
                style={settingsStyles.slider}
                minimumValue={1}
                maximumValue={90}
                step={1}
                value={learningSettings.maxHints}
                onValueChange={(value: number) => onChangeLearningSettings({ maxHints: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
            </View>
          ) : null}

          <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
            <View style={settingsStyles.themeOption}>
              <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.autoMarkMemorizedTitle}</Text>
            </View>
            <RNSwitch
              value={learningSettings.autoMarkMemorized}
              onValueChange={(value) => onChangeLearningSettings({ autoMarkMemorized: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={learningSettings.autoMarkMemorized ? colors.primary : colors.textTertiary}
            />
          </View>

          {learningSettings.autoMarkMemorized ? (
            <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
              <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>
                {labels.masteryThreshold}: {learningSettings.autoMarkThreshold}/{learningSettings.maxMasteryLevel || 5}
              </Text>
              <Slider
                style={settingsStyles.slider}
                minimumValue={1}
                maximumValue={learningSettings.maxMasteryLevel || 5}
                step={1}
                value={Math.min(learningSettings.autoMarkThreshold, learningSettings.maxMasteryLevel || 5)}
                onValueChange={(value: number) => onChangeLearningSettings({ autoMarkThreshold: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={[settingsStyles.sliderDescription, { color: colors.textSecondary }]}>{labels.autoMarkMemorizedDesc}</Text>
            </View>
          ) : null}

          <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
            <View style={settingsStyles.themeOption}>
              <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.enableHaptics}</Text>
            </View>
            <RNSwitch
              value={learningSettings.hapticFeedback}
              onValueChange={(value) => onChangeLearningSettings({ hapticFeedback: value })}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={learningSettings.hapticFeedback ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
            <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>{labels.maxMasteryLevel}: {learningSettings.maxMasteryLevel || 5}</Text>
            <Slider
              style={settingsStyles.slider}
              minimumValue={3}
              maximumValue={10}
              step={1}
              value={learningSettings.maxMasteryLevel || 5}
              onValueChange={(value: number) => onChangeLearningSettings({ maxMasteryLevel: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <Text style={[settingsStyles.sliderDescription, { color: colors.textSecondary }]}>{labels.maxMasteryLevelDesc}</Text>
          </View>
        </View>
      </SettingsCollapsibleSection>

      <SettingsCollapsibleSection
        title={rewardsTitle}
        icon={Heart}
        iconColor={colors.purple}
        colors={colors}
        expanded={expandedRewards}
        onToggle={onToggleRewards}
      >
        <View>
          {[
            ['rewardEnable', rewardSettings.enableRewards, 'enableRewards'],
            ['rewardEnableHaptics', rewardSettings.enableHaptics, 'enableHaptics'],
            ['rewardEnableSound', rewardSettings.enableSound, 'enableSound'],
            ['rewardEnableSurprises', rewardSettings.enableSurprises, 'enableSurprises'],
            ['rewardEnableStreak', rewardSettings.streakEnabled, 'streakEnabled'],
          ].map(([labelKey, value, settingKey]) => (
            <View key={String(settingKey)} style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
              <View style={settingsStyles.themeOption}>
                <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels[String(labelKey)]}</Text>
              </View>
              <RNSwitch
                value={Boolean(value)}
                onValueChange={(nextValue) => onChangeRewardSettings({ [String(settingKey)]: nextValue })}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={value ? colors.primary : colors.textTertiary}
              />
            </View>
          ))}

          <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
            <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>{labels.rewardDailyGoal}: {rewardSettings.dailyGoal}</Text>
            <Slider
              style={settingsStyles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={rewardSettings.dailyGoal}
              onValueChange={(value: number) => onChangeRewardSettings({ dailyGoal: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
            <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>{labels.rewardWeeklyGoal}: {rewardSettings.weeklyGoal}</Text>
            <Slider
              style={settingsStyles.slider}
              minimumValue={5}
              maximumValue={30}
              step={1}
              value={rewardSettings.weeklyGoal}
              onValueChange={(value: number) => onChangeRewardSettings({ weeklyGoal: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          {!isIos ? (
            <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
              <View style={settingsStyles.themeOption}>
                <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.supportReminderEnabled}</Text>
              </View>
              <RNSwitch
                value={rewardSettings.supportReminderEnabled}
                onValueChange={(value) => onChangeRewardSettings({ supportReminderEnabled: value })}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={rewardSettings.supportReminderEnabled ? colors.primary : colors.textTertiary}
              />
            </View>
          ) : null}

          <TouchableOpacity
            style={[settingsStyles.resetScoreButton, { borderColor: colors.error + '66', backgroundColor: colors.error + '10' }]}
            onPress={onResetScore}
            activeOpacity={0.8}
          >
            <Text style={[settingsStyles.resetScoreButtonText, { color: colors.error }]}>{labels.resetProgression}</Text>
          </TouchableOpacity>
          <Text style={[settingsStyles.resetScoreWarningText, { color: colors.textSecondary }]}>
            {labels.resetProgressionHelper}
          </Text>
        </View>
      </SettingsCollapsibleSection>
    </>
  );
}
