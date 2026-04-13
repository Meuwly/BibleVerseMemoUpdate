import Slider from '@react-native-community/slider';
import { Bell, Flame } from 'lucide-react-native';
import { Switch as RNSwitch, Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { settingsStyles } from '../styles';
import { SettingsCollapsibleSection } from './SettingsCollapsibleSection';

interface NotificationSettingsValue {
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  streakWarningEnabled: boolean;
}

interface SettingsNotificationsSectionProps {
  colors: ColorScheme;
  title: string;
  expanded: boolean;
  showTimePicker: boolean;
  settings: NotificationSettingsValue;
  labels: Record<string, string>;
  onToggle: () => void;
  onToggleTimePicker: (value: boolean) => void;
  onChangeSettings: (value: Partial<NotificationSettingsValue>) => void | Promise<void>;
}

export function SettingsNotificationsSection({
  colors,
  title,
  expanded,
  showTimePicker,
  settings,
  labels,
  onToggle,
  onToggleTimePicker,
  onChangeSettings,
}: SettingsNotificationsSectionProps) {
  return (
    <SettingsCollapsibleSection
      title={title}
      icon={Bell}
      iconColor={colors.info}
      colors={colors}
      expanded={expanded}
      onToggle={onToggle}
    >
      <View>
        <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
          <View style={settingsStyles.themeOption}>
            <Text style={[settingsStyles.optionText, { color: colors.text }]}>{labels.dailyReminderEnabled}</Text>
          </View>
          <RNSwitch
            value={settings.dailyReminderEnabled}
            onValueChange={(value) => onChangeSettings({ dailyReminderEnabled: value })}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={settings.dailyReminderEnabled ? colors.primary : colors.textTertiary}
          />
        </View>

        {settings.dailyReminderEnabled ? (
          <View style={[settingsStyles.sliderContainer, { backgroundColor: colors.cardBackground }]}> 
            <Text style={[settingsStyles.sliderLabel, { color: colors.text }]}>
              {labels.dailyReminderTime}: {String(settings.dailyReminderHour).padStart(2, '0')}:{String(settings.dailyReminderMinute).padStart(2, '0')}
            </Text>
            {showTimePicker ? (
              <View>
                <Text style={[settingsStyles.sliderLabel, { color: colors.textSecondary, marginTop: 8 }]}> 
                  {labels.hour}: {settings.dailyReminderHour}
                </Text>
                <Slider
                  style={settingsStyles.slider}
                  minimumValue={0}
                  maximumValue={23}
                  step={1}
                  value={settings.dailyReminderHour}
                  onSlidingComplete={(value: number) => onChangeSettings({ dailyReminderHour: value })}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <Text style={[settingsStyles.sliderLabel, { color: colors.textSecondary, marginTop: 8 }]}>{labels.minute}: {settings.dailyReminderMinute}</Text>
                <Slider
                  style={settingsStyles.slider}
                  minimumValue={0}
                  maximumValue={55}
                  step={5}
                  value={settings.dailyReminderMinute}
                  onSlidingComplete={(value: number) => onChangeSettings({ dailyReminderMinute: value })}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <TouchableOpacity
                  style={[settingsStyles.timePickerDoneButton, { backgroundColor: colors.primary + '18' }]}
                  onPress={() => onToggleTimePicker(false)}
                >
                  <Text style={[settingsStyles.timePickerDoneText, { color: colors.primary }]}>{labels.close}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[settingsStyles.timePickerButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={() => onToggleTimePicker(true)}
              >
                <Text style={[settingsStyles.timePickerButtonText, { color: colors.primary }]}> 
                  {String(settings.dailyReminderHour).padStart(2, '0')}:{String(settings.dailyReminderMinute).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        <View style={[settingsStyles.option, { backgroundColor: colors.cardBackground }]}> 
          <View style={[settingsStyles.themeOption, { gap: 8 }]}> 
            <Flame color={colors.warning} size={18} />
            <Text style={[settingsStyles.optionText, { color: colors.text, flex: 1 }]}>{labels.streakWarningEnabled}</Text>
          </View>
          <RNSwitch
            value={settings.streakWarningEnabled}
            onValueChange={(value) => onChangeSettings({ streakWarningEnabled: value })}
            trackColor={{ false: colors.border, true: colors.warning + '80' }}
            thumbColor={settings.streakWarningEnabled ? colors.warning : colors.textTertiary}
          />
        </View>

        {settings.streakWarningEnabled ? (
          <Text style={[settingsStyles.dyslexiaInfo, { color: colors.textSecondary, marginTop: 0, marginBottom: 8 }]}>{labels.streakWarningDesc}</Text>
        ) : null}
      </View>
    </SettingsCollapsibleSection>
  );
}
