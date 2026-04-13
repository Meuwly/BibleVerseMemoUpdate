import { useRouter } from 'expo-router';
import { BookOpen, Settings, Sparkles } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getColors } from '../../constants/colors';
import { t } from '../../constants/translations';
import { useAppSettings } from '../../contexts/AppContext';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppCard } from '../../src/components/ui/AppCard';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function ThemesScreen() {
  const { uiLanguage, theme } = useAppSettings();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 110,
        },
      ]}
      style={{ backgroundColor: colors.background }}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{t(uiLanguage, 'themes')}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'themes')}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{t(uiLanguage, 'themesIntro')}</Text>
      </View>

      <EmptyState
        colors={colors}
        title={t(uiLanguage, 'themes')}
        description={t(uiLanguage, 'themesIntro')}
        icon={Sparkles}
      />

      <AppCard colors={colors} tone="subtle" style={styles.actionsCard}>
        <Text style={[styles.actionsTitle, { color: colors.text }]}>
          {t(uiLanguage, 'books')}
        </Text>
        <Text style={[styles.actionsDescription, { color: colors.textSecondary }]}>
          {t(uiLanguage, 'themesIntro')}
        </Text>
        <View style={styles.actionsRow}>
          <AppButton
            colors={colors}
            label={t(uiLanguage, 'books')}
            onPress={() => router.push('/(tabs)' as any)}
            icon={BookOpen}
            style={styles.actionButton}
          />
          <AppButton
            colors={colors}
            label={t(uiLanguage, 'settings')}
            onPress={() => router.push('/(tabs)/settings' as any)}
            variant="secondary"
            icon={Settings}
            style={styles.actionButton}
          />
        </View>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionsCard: {
    gap: 12,
  },
  actionsTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  actionsDescription: {
    fontSize: 14,
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
