import { Modal, Text, TouchableOpacity, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { t } from '../../../../constants/translations';
import { GratitudePauseModal } from '../../../components/rewards/GratitudePauseModal';
import { MilestoneModal } from '../../../components/rewards/MilestoneModal';
import { RewardToast } from '../../../components/rewards/RewardToast';
import { ShareableVerseCard } from '../../../components/rewards/ShareableVerseCard';
import type {
  RewardCard,
  RewardMicroResult,
  RewardMilestoneResult,
  RewardSurpriseResult,
} from '../../../rewards/types';
import { learnStyles } from '../styles';

interface LearnRewardOverlaysProps {
  colors: ColorScheme;
  uiLanguage: string;
  rewardToast: RewardMicroResult | null;
  rewardMilestone: RewardMilestoneResult | null;
  rewardSurprise: RewardSurpriseResult | null;
  rewardCard: RewardCard | null;
  onHideToast: () => void;
  onCloseMilestone: () => void;
  onCloseSurprise: () => void;
  onCloseRewardCard: () => void;
  focusMode: boolean;
}

export function LearnRewardOverlays({
  colors,
  uiLanguage,
  rewardToast,
  rewardMilestone,
  rewardSurprise,
  rewardCard,
  onHideToast,
  onCloseMilestone,
  onCloseSurprise,
  onCloseRewardCard,
  focusMode,
}: LearnRewardOverlaysProps) {
  return (
    <>
      {rewardToast && !focusMode ? (
        <RewardToast
          message={t(uiLanguage, rewardToast.messageKey)}
          detailLines={rewardToast.detailLines}
          color={colors.text}
          backgroundColor={colors.cardBackground}
          haptic={rewardToast.haptic}
          animation={rewardToast.animation}
          onHide={onHideToast}
        />
      ) : null}
      <MilestoneModal
        visible={Boolean(rewardMilestone)}
        title={rewardMilestone ? t(uiLanguage, rewardMilestone.messageKey) : ''}
        subtitle={rewardMilestone ? t(uiLanguage, 'rewardMilestoneSubtitle') : undefined}
        onClose={onCloseMilestone}
        backgroundColor={colors.cardBackground}
        textColor={colors.text}
        accentColor={colors.primary}
        ctaLabel={t(uiLanguage, 'continue')}
      />
      <GratitudePauseModal
        visible={Boolean(rewardSurprise && rewardSurprise.type === 'gratitude')}
        title={t(uiLanguage, 'rewardGratitudeTitle')}
        body={t(uiLanguage, 'rewardGratitudeBody')}
        prayerLine={t(uiLanguage, rewardSurprise?.prayerKey || 'rewardPrayerPeace')}
        onClose={onCloseSurprise}
        backgroundColor={colors.cardBackground}
        textColor={colors.text}
        accentColor={colors.primary}
        ctaLabel={t(uiLanguage, 'continue')}
      />
      <Modal visible={Boolean(rewardSurprise && rewardSurprise.type === 'card' && rewardCard)} transparent animationType="fade">
        <View style={learnStyles.rewardModalBackdrop}>
          {rewardCard ? (
            <View style={[learnStyles.rewardCardWrapper, { backgroundColor: colors.cardBackground }]}>
              <ShareableVerseCard
                card={rewardCard}
                backgroundColor={colors.cardBackground}
                textColor={colors.text}
                accentColor={colors.primary}
                shareLabel={t(uiLanguage, 'share')}
                uiLanguage={uiLanguage}
              />
              <TouchableOpacity
                style={[learnStyles.rewardModalButton, { backgroundColor: colors.primary }]}
                onPress={onCloseRewardCard}
              >
                <Text style={learnStyles.rewardModalButtonText}>{t(uiLanguage, 'continue')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}
