import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { settingsStyles } from '../styles';

interface SettingsCollapsibleSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  colors: ColorScheme;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SettingsCollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  colors,
  expanded,
  onToggle,
  children,
}: SettingsCollapsibleSectionProps) {
  return (
    <View style={settingsStyles.section}>
      <TouchableOpacity style={settingsStyles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={settingsStyles.sectionTitleRow}>
          <Icon color={iconColor} size={20} />
          <Text style={[settingsStyles.sectionTitle, { color: colors.text }]}>{title}</Text>
        </View>
        {expanded ? <ChevronDown color={colors.text} size={24} /> : <ChevronRight color={colors.text} size={24} />}
      </TouchableOpacity>

      {expanded ? children : null}
    </View>
  );
}
