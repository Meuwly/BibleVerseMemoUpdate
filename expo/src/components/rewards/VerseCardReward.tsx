import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RewardCard } from '../../rewards/types';

const appLogo = require('../../../assets/images/icon.png');

interface VerseCardRewardProps {
  card: RewardCard;
  onShare?: () => void;
  shareLabel?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

const variantBackgrounds: Record<RewardCard['styleVariant'], string> = {
  classic: '#F8FAFC',
  serene: '#EEF2FF',
  ink: '#111827',
  light: '#FEF9C3',
};

const variantText: Record<RewardCard['styleVariant'], string> = {
  classic: '#0F172A',
  serene: '#1E293B',
  ink: '#F8FAFC',
  light: '#713F12',
};

export function VerseCardReward({ card, onShare, shareLabel, backgroundColor, textColor, accentColor }: VerseCardRewardProps) {
  const cardBackground = variantBackgrounds[card.styleVariant] || backgroundColor;
  const cardText = variantText[card.styleVariant] || textColor;

  return (
    <View style={[styles.container, { backgroundColor: cardBackground }]}> 
      <Text style={[styles.reference, { color: cardText }]}>{card.referenceText}</Text>
      <Text style={[styles.text, { color: cardText }]}>{card.verseText}</Text>

      <View style={[styles.brandingRow, { borderTopColor: `${cardText}33` }]}> 
        <View style={styles.brandingLeft}>
          <Image source={appLogo} style={styles.appLogo} resizeMode="cover" />
          <Text style={[styles.brandText, { color: cardText }]}>Bible Verse Memo</Text>
        </View>
        <View style={styles.playStoreBadge}>
          <MaterialCommunityIcons name="google-play" size={14} color={cardText} />
          <Text style={[styles.playStoreText, { color: cardText }]}>Play Store</Text>
        </View>
      </View>

      {onShare ? (
        <TouchableOpacity style={[styles.shareButton, { borderColor: accentColor }]} onPress={onShare}>
          <Text style={[styles.shareText, { color: accentColor }]}>{shareLabel || ''}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 16,
    gap: 14,
  },
  reference: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  text: {
    fontSize: 17,
    lineHeight: 27,
  },
  shareButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  shareText: {
    fontSize: 12,
    fontWeight: '600',
  },
  brandingRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  appLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '700',
  },
  playStoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#00000022',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  playStoreText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
