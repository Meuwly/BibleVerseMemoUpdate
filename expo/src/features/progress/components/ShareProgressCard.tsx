import type { RefObject } from 'react';
import { Text, View } from 'react-native';
import ViewShot from '@/src/shims/react-native-view-shot';
import { styles } from '../styles';

type ShareMetric = {
  key: string;
  value: string | number;
  label: string;
};

type Props = {
  colors: {
    background: string;
    cardBackground: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
  };
  title: string;
  subtitle: string;
  metrics: ShareMetric[];
  shareCardRef: RefObject<ViewShot | null>;
};

export function ShareProgressCard({ colors, title, subtitle, metrics, shareCardRef }: Props) {
  return (
    <View style={[styles.hiddenShareCapture, styles.pointerEventsNone]}>
      <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
        <View style={[styles.shareCardCapture, { backgroundColor: colors.background }]}> 
          <View style={[styles.shareCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Text style={[styles.shareTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.shareSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            <View style={styles.shareGrid}>
              {metrics.map((metric) => (
                <View key={metric.key} style={[styles.shareItem, { borderColor: colors.border }]}> 
                  <Text style={[styles.shareValue, { color: colors.primary }]}>{metric.value}</Text>
                  <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ViewShot>
    </View>
  );
}
