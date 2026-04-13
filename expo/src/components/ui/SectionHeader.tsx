import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { ColorScheme } from '../../../constants/colors';

interface SectionHeaderProps {
  colors: ColorScheme;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  rightContent?: ReactNode;
}

export function SectionHeader({
  colors,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  rightContent,
}: SectionHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {Icon ? (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (iconColor ?? colors.primary) + '18',
            }}
          >
            <Icon color={iconColor ?? colors.primary} size={18} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{title}</Text>
          {subtitle ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightContent}
    </View>
  );
}
