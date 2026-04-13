import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import type { ColorScheme } from '../../../constants/colors';

type Tone = 'default' | 'subtle' | 'primary' | 'success' | 'warning' | 'danger';

interface AppCardProps {
  colors: ColorScheme;
  children: ReactNode;
  tone?: Tone;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
}

const toneStyles = (colors: ColorScheme, tone: Tone) => {
  switch (tone) {
    case 'primary':
      return { backgroundColor: colors.primary + '10', borderColor: colors.primary + '35' };
    case 'success':
      return { backgroundColor: colors.success + '10', borderColor: colors.success + '35' };
    case 'warning':
      return { backgroundColor: colors.warning + '12', borderColor: colors.warning + '38' };
    case 'danger':
      return { backgroundColor: colors.error + '10', borderColor: colors.error + '35' };
    case 'subtle':
      return { backgroundColor: colors.background, borderColor: colors.border };
    case 'default':
    default:
      return { backgroundColor: colors.cardBackground, borderColor: colors.border };
  }
};

export function AppCard({ colors, children, tone = 'default', padded = true, style }: AppCardProps) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderRadius: 20,
          padding: padded ? 18 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
        toneStyles(colors, tone),
        style,
      ]}
    >
      {children}
    </View>
  );
}
