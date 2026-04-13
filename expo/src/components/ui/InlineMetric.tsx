import { Text, View } from 'react-native';

import type { ColorScheme } from '../../../constants/colors';

interface InlineMetricProps {
  colors: ColorScheme;
  label: string;
  value: string | number;
  emphasis?: 'primary' | 'success' | 'warning' | 'default';
}

export function InlineMetric({ colors, label, value, emphasis = 'default' }: InlineMetricProps) {
  const valueColor = emphasis === 'primary'
    ? colors.primary
    : emphasis === 'success'
      ? colors.success
      : emphasis === 'warning'
        ? colors.warning
        : colors.text;

  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: valueColor }}>{value}</Text>
    </View>
  );
}
