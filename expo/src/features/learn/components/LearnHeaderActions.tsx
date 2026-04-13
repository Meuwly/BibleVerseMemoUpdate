import { Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { XpInlineBadge } from '../../../components/XpTopBadge';
import { learnStyles } from '../styles';

interface LearnHeaderActionsProps {
  colors: ColorScheme;
  comparisonLabel: string;
  showHeaderBadge: boolean;
  onOpenComparison: () => void;
}

export function LearnHeaderActions({
  colors,
  comparisonLabel,
  showHeaderBadge,
  onOpenComparison,
}: LearnHeaderActionsProps) {
  return (
    <View style={learnStyles.headerActions}>
      <TouchableOpacity
        onPress={onOpenComparison}
        style={[
          learnStyles.headerComparisonButton,
          { borderColor: colors.border, backgroundColor: colors.cardBackground },
        ]}
      >
        <Text style={[learnStyles.headerComparisonButtonText, { color: colors.text }]}>
          {comparisonLabel}
        </Text>
      </TouchableOpacity>

      {showHeaderBadge ? <XpInlineBadge compact /> : null}
    </View>
  );
}
