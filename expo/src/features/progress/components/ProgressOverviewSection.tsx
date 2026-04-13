import type { ReactNode } from 'react';
import { BarChart3, BookOpen, BrainCircuit, CheckCheck, Flame, PlayCircle, Star, Target, Trophy } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { ColorScheme } from '../../../../constants/colors';
import { AppCard } from '@/src/components/ui/AppCard';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { styles } from '../styles';
import type { ProgressOverviewStats } from '../types';

type Props = {
  colors: ColorScheme;
  stats: ProgressOverviewStats;
  labels: Record<string, string>;
};

function StatCard({
  colors,
  icon,
  value,
  label,
  extra,
}: {
  colors: ColorScheme;
  icon: ReactNode;
  value: string | number;
  label: string;
  extra?: ReactNode;
}) {
  return (
    <AppCard colors={colors} style={styles.statCard}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      {extra}
    </AppCard>
  );
}

export function ProgressOverviewSection({ colors, stats, labels }: Props) {
  return (
    <View style={styles.progressOverviewGroup}>
      <SectionHeader
        colors={colors}
        icon={BarChart3}
        iconColor={colors.primary}
        title={labels.progressOverviewTitle}
        subtitle={labels.progressOverviewSubtitle}
      />

      <View style={styles.featuredStatsRow}>
        <StatCard
          colors={colors}
          icon={<Star color={colors.warning} size={32} strokeWidth={2} />}
          value={stats.totalXp}
          label={labels.xpTotal}
          extra={(
            <>
              <Text style={[styles.statSubValue, { color: colors.textSecondary }]}>{labels.xpLevelLabel} {stats.currentLevel}</Text>
              <View style={[styles.xpTrack, { backgroundColor: colors.border }]}> 
                <View style={[styles.xpFill, { backgroundColor: colors.primary, width: `${stats.xpProgressPercent}%` }]} />
              </View>
              <Text style={[styles.statSubValue, { color: colors.textSecondary }]}>
                {stats.xpIntoLevel}/{stats.xpLevelSpan} XP • {labels.xpNextLevel}
              </Text>
              <Text style={[styles.statSubValue, { color: colors.textSecondary }]}>x{stats.streakMultiplier.toFixed(2)} {labels.xpStreakBonus}</Text>
            </>
          )}
        />

        <StatCard
          colors={colors}
          icon={<Flame color={colors.warning} size={32} strokeWidth={2} />}
          value={stats.currentStreak}
          label={labels.dailyStreak}
          extra={<Text style={[styles.statSubValue, { color: colors.textSecondary }]}>{labels.bestDailyStreak}: {stats.bestStreak}</Text>}
        />
      </View>

      <View style={styles.statGrid}>
        <StatCard colors={colors} icon={<BookOpen color={colors.primary} size={28} strokeWidth={2} />} value={stats.totalVerses} label={labels.totalVerses} />
        <StatCard colors={colors} icon={<PlayCircle color={colors.warning} size={28} strokeWidth={2} />} value={stats.versesStarted} label={labels.versesStarted} />
        <StatCard colors={colors} icon={<CheckCheck color={colors.success} size={28} strokeWidth={2} />} value={stats.versesCompleted} label={labels.versesCompleted} />
        <StatCard colors={colors} icon={<Target color={colors.success} size={28} strokeWidth={2} />} value={`${stats.accuracy}%`} label={labels.accuracy} />
        <StatCard colors={colors} icon={<BarChart3 color={colors.warning} size={28} strokeWidth={2} />} value={stats.totalAttempts} label={labels.totalAttempts} />
        <StatCard colors={colors} icon={<BrainCircuit color={colors.primary} size={28} strokeWidth={2} />} value={stats.quizzesCompleted} label={labels.quizCompletedCount} />
        <StatCard colors={colors} icon={<Trophy color={colors.warning} size={28} strokeWidth={2} />} value={stats.bestQuizScore} label={labels.quizBestScore} />
        <StatCard colors={colors} icon={<Target color={colors.success} size={28} strokeWidth={2} />} value={`${stats.quizAccuracy}%`} label={labels.quizAccuracy} />
      </View>
    </View>
  );
}
