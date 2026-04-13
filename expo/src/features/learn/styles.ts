import { StyleSheet } from 'react-native';

export const learnStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  contentContainerFocus: {
    paddingTop: 16,
    gap: 12,
  },
  headerBackButton: {
    padding: 8,
  },
  headerBackButtonHitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerComparisonButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerComparisonButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerFocusButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerFocusButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  exerciseSurface: {
    padding: 24,
  },
  focusCardStack: {
    gap: 10,
  },
  focusBanner: {
    gap: 10,
  },
  focusHint: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  focusReferenceBlock: {
    gap: 2,
  },
  successBadge: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  successBadgeCopy: {
    flex: 1,
    gap: 4,
  },
  successBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  successBadgeBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reference: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  referenceActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  verseWithTTS: {
    gap: 12,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButtonInline: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  comparisonCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  versionSeparator: {
    marginTop: 12,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  versionDivider: {
    flex: 1,
    height: 1,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  comparisonText: {
    fontSize: 16,
    lineHeight: 24,
  },
  maskedTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  maskedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  maskedWordTouchable: {
    marginRight: 4,
    marginBottom: 4,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  hintContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  hintActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  hintButtonDisabled: {
    opacity: 0.5,
  },
  showAllWordsButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  showAllWordsButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  hintsText: {
    fontSize: 14,
  },
  inputCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputCardFocus: {
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  feedbackFocus: {
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: '#D1FAE5',
  },
  feedbackIncorrect: {
    backgroundColor: '#FEE2E2',
  },
  feedbackCopy: {
    flex: 1,
    gap: 4,
  },
  feedbackTextCorrect: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  feedbackTextBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackTextIncorrect: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
  },
  feedbackErrorDetails: {
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  feedbackErrorDetailsText: {
    fontSize: 14,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 2,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  masteryContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  masteryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  masteryBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  masterySegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  masteryText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 12,
  },
  rewardModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rewardCardWrapper: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  rewardModalButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  rewardModalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  memorizedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  memorizedButtonFocus: {
    borderWidth: 1,
    marginBottom: 0,
  },
  memorizedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  selectionModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  selectionSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },
  selectionList: {
    maxHeight: 420,
  },
});
