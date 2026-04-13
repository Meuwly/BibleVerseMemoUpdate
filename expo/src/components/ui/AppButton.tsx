import { Text, TouchableOpacity, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { ColorScheme } from '../../../constants/colors';

type Variant = 'primary' | 'secondary' | 'ghost';

interface AppButtonProps {
  colors: ColorScheme;
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function AppButton({
  colors,
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  compact = false,
  style,
}: AppButtonProps) {
  const palette = variant === 'primary'
    ? { backgroundColor: colors.primary, borderColor: colors.primary, textColor: '#fff' }
    : variant === 'secondary'
      ? { backgroundColor: colors.cardBackground, borderColor: colors.border, textColor: colors.text }
      : { backgroundColor: 'transparent', borderColor: 'transparent', textColor: colors.primary };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        {
          minHeight: compact ? 40 : 48,
          borderRadius: 14,
          paddingHorizontal: compact ? 12 : 16,
          paddingVertical: compact ? 8 : 12,
          borderWidth: variant === 'ghost' ? 0 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
        style,
      ]}
    >
      {Icon ? <Icon color={palette.textColor} size={18} /> : null}
      <Text style={{ color: palette.textColor, fontSize: 14, fontWeight: '800' }}>{label}</Text>
    </TouchableOpacity>
  );
}
