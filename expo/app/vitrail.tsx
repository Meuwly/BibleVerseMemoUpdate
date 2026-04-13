import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { t } from '../constants/translations';
import { getColors } from '../constants/colors';
import { useApp } from '../contexts/AppContext';
import { getRewardsCards, getRewardsVitrail } from '../src/storage/rewardsRepo';
import type { RewardCard, VitrailState } from '../src/rewards/types';
import { VitrailTile } from '../src/components/rewards/VitrailTile';
import { ShareableVerseCard } from '../src/components/rewards/ShareableVerseCard';

export default function VitrailScreen() {
  const { uiLanguage, theme } = useApp();
  const colors = getColors(theme);
  const router = useRouter();
  const [vitrail, setVitrail] = useState<VitrailState>({ tiles: {} });
  const [cards, setCards] = useState<RewardCard[]>([]);

  const loadRewards = useCallback(async () => {
    const [vitrailData, cardsData] = await Promise.all([
      getRewardsVitrail(),
      getRewardsCards(),
    ]);
    setVitrail(vitrailData);
    setCards(cardsData.list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRewards();
    }, [loadRewards])
  );

  const tileEntries = Object.entries(vitrail.tiles);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Stack.Screen
        options={{
          title: t(uiLanguage, 'rewardVitrailTitle'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}> 
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'rewardVitrailSection')}</Text>
          {tileEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t(uiLanguage, 'rewardVitrailEmpty')}</Text>
          ) : (
            <View style={styles.grid}>
              {tileEntries.map(([id, tile]) => (
                <VitrailTile key={id} tile={tile} label={id.split('-').slice(0, 3).join(':')} />
              ))}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(uiLanguage, 'rewardCardsSection')}</Text>
          {cards.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t(uiLanguage, 'rewardCardsEmpty')}</Text>
          ) : (
            <View style={styles.cardsList}>
              {cards.map((card) => (
                <ShareableVerseCard
                  key={card.id}
                  card={card}
                  backgroundColor={colors.cardBackground}
                  textColor={colors.text}
                  accentColor={colors.primary}
                  shareLabel={t(uiLanguage, 'share')}
                  uiLanguage={uiLanguage}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackButton: {
    padding: 8,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardsList: {
    gap: 12,
  },
});
