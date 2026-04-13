import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hiddenShareCapture: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  shareCardCapture: {
    width: 1080,
    padding: 40,
  },
  shareCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 30,
  },
  shareTitle: {
    fontSize: 50,
    fontWeight: '700' as const,
  },
  shareSubtitle: {
    fontSize: 28,
    marginTop: 8,
    marginBottom: 24,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  shareItem: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  shareValue: {
    fontSize: 42,
    fontWeight: '700' as const,
  },
  shareLabel: {
    fontSize: 23,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  statsContainer: {
    padding: 20,
    gap: 18,
    paddingBottom: 40,
  },
  sectionStack: {
    gap: 16,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  iconActionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardRefresh: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  heroCard: {
    gap: 12,
    borderRadius: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTextBlock: {
    flex: 1,
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    lineHeight: 26,
  },
  heroDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  heroLevelBadge: {
    minWidth: 72,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  heroLevelBadgeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroLevelBadgeValue: {
    fontSize: 17,
    fontWeight: '800' as const,
  },
  heroProgressPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  heroProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroProgressLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  heroProgressValue: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  heroProgressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  heroProgressHint: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroMetricTile: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  tabButtonSubtext: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressOverviewGroup: {
    gap: 12,
  },
  featuredStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    gap: 2,
  },
  iconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 34,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 15,
    textAlign: 'center',
  },
  statSubValue: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  xpTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    marginTop: 10,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 999,
  },
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  directoryTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  directorySubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  directoryBadge: {
    minWidth: 44,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  directoryBadgeText: {
    fontSize: 13,
    fontWeight: '800' as const,
  },
  searchInput: {
    width: '100%',
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  friendRequestsWrap: {
    width: '100%',
    marginTop: 0,
    marginBottom: 12,
    gap: 8,
  },
  friendRequestsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  friendRequestRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  friendRequestName: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  friendRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  friendRequestButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  friendRequestButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  leaderboardList: {
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  leaderboardRow: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankText: {
    width: 40,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  playerMainInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  playerMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  addFriendButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addFriendButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  selectionPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectionPillText: {
    fontSize: 11,
    fontWeight: '800' as const,
  },
  playerDetailsMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  challengeCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  challengeRefresh: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  challengeTimer: {
    fontSize: 34,
    fontWeight: '900' as const,
    textAlign: 'center',
  },
  challengeTimerLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: -8,
  },
  challengeDuelGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  challengePlayerCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  challengePlayerName: {
    fontSize: 15,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  challengePlayerValue: {
    fontSize: 32,
    fontWeight: '900' as const,
  },
  challengePlayerLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  challengePlayerXp: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  challengeHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  challengeActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  challengePrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  challengePrimaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800' as const,
    textAlign: 'center',
  },
  challengeSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  challengeSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    textAlign: 'center',
  },
  challengeSetupCard: {
    marginTop: 0,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  challengeSetupTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  challengeSetupBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationChip: {
    minWidth: 72,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  challengeLaunchButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  challengeLaunchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800' as const,
    textAlign: 'center',
  },
  friendInsightsCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  friendInsightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  friendInsightsTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    flex: 1,
  },
  removeFriendButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeFriendButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
  },
  friendStatsLoading: {
    fontSize: 13,
  },
  friendStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  friendStatItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  friendStatValue: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  friendStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
