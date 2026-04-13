import { useRef } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from "../../shims/react-native-view-shot";
import { t } from '../../../constants/translations';
import { sharePngImage } from '../../utils/shareImage';
import type { RewardCard } from '../../rewards/types';
import { VerseCardReward } from './VerseCardReward';
import * as Sharing from 'expo-sharing';

interface ShareableVerseCardProps {
  card: RewardCard;
  shareLabel: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  uiLanguage: string;
}

export function ShareableVerseCard({ card, shareLabel, backgroundColor, textColor, accentColor, uiLanguage }: ShareableVerseCardProps) {
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    try {
      const pngUri = await viewShotRef.current?.capture?.({
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!pngUri) {
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t(uiLanguage, 'shareUnavailableTitle'), t(uiLanguage, 'shareUnavailableDevice'));
        return;
      }

      await sharePngImage(pngUri, shareLabel);
    } catch (error) {
      console.error('Error sharing reward card image:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot
        ref={viewShotRef}
        collapsable={false}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
      >
        <VerseCardReward
          card={card}
          backgroundColor={backgroundColor}
          textColor={textColor}
          accentColor={accentColor}
        />
      </ViewShot>
      <TouchableOpacity
        style={[styles.shareButton, { borderColor: accentColor }]}
        onPress={handleShare}
      >
        <Text style={[styles.shareText, { color: accentColor }]}>{shareLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
});
