import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { ColorScheme } from '../../../constants/colors';
import { AppCard } from './AppCard';

interface EmptyStateProps {
  colors: ColorScheme;
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function EmptyState({ colors, title, description, icon: Icon }: EmptyStateProps) {
  return (
    <AppCard colors={colors} tone="subtle" style={{ alignItems: 'center', gap: 10 }}>
      {Icon ? (
        <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '14' }}>
          <Icon color={colors.primary} size={22} />
        </View>
      ) : null}
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' }}>{description}</Text>
    </AppCard>
  );
}
