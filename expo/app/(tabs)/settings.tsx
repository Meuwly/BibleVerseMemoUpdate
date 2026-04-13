import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getColors } from '../../constants/colors';
import { LANGUAGES } from '../../constants/languages';
import { THEME_OPTIONS } from '../../constants/themeOptions';
import { t } from '../../constants/translations';
import { useAppProgress, useAppSettings } from '../../contexts/AppContext';
import { useAuthProfileState, useAuthSessionState } from '../../contexts/AuthContext';
import { useRewardsSettings } from '../../src/rewards/useRewardsSettings';
import { settingsStyles } from '../../src/features/settings/styles';
import { SettingsAccountSection } from '../../src/features/settings/components/SettingsAccountSection';
import { SettingsAppearanceSections } from '../../src/features/settings/components/SettingsAppearanceSections';
import { SettingsAudioSection } from '../../src/features/settings/components/SettingsAudioSection';
import { SettingsLanguageSection } from '../../src/features/settings/components/SettingsLanguageSection';
import { SettingsMemorizationSection } from '../../src/features/settings/components/SettingsMemorizationSection';
import { SettingsNotificationsSection } from '../../src/features/settings/components/SettingsNotificationsSection';
import { SettingsSupportSection } from '../../src/features/settings/components/SettingsSupportSection';
import { SettingsPollSection } from '../../src/features/settings/components/SettingsPollSection';
import {
  ComparisonVersionModal,
  LanguageSelectionModal,
  SettingsAboutModal,
  SettingsAuthModal,
  SettingsCustomVersionModal,
  SettingsSelectModal,
  type SettingsSelectModalType,
} from '../../src/features/settings/components/SettingsModals';
import { useCustomVersionImport } from '../../src/features/settings/hooks/useCustomVersionImport';
import { useSettingsAuth } from '../../src/features/settings/hooks/useSettingsAuth';
import { useSettingsTts } from '../../src/features/settings/hooks/useSettingsTts';
import type { Theme } from '../../types/database';

const APP_VERSION = '2.0';

export default function SettingsScreen() {
  const {
    language,
    uiLanguage,
    learningMode,
    theme,
    dyslexiaSettings,
    validationSettings,
    appearanceSettings,
    learningSettings,
    ttsSettings,
    notificationSettings,
    setLanguage,
    setLearningMode,
    setTheme,
    setDyslexiaSettings,
    setValidationSettings,
    setAppearanceSettings,
    setLearningSettings,
    setTTSSettings,
    setNotificationSettings: persistNotificationSettings,
    setCustomVersionUrl,
  } = useAppSettings();
  const { progress, xpProgress, streakProgress, quizProgress, resetScoreProgress } = useAppProgress();
  const setNotificationSettings = (settings: Parameters<typeof persistNotificationSettings>[0]) => (
    persistNotificationSettings(settings, streakProgress)
  );
  const { settings: rewardSettings, updateSettings: updateRewardSettings } = useRewardsSettings();
  const { user, isLoading: authLoading, signUp, signIn, signOut } = useAuthSessionState();
  const { profile, syncProgress } = useAuthProfileState();

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showCustomVersionModal, setShowCustomVersionModal] = useState(false);
  const [activeSelectModal, setActiveSelectModal] = useState<SettingsSelectModalType>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [isLoadingCustomVersion, setIsLoadingCustomVersion] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    learningMode: false,
    validationSettings: false,
    readingSettings: false,
    themeSettings: false,
    appearanceSettings: false,
    ttsSettings: false,
    learningCustomization: false,
    notifications: false,
    rewards: false,
  });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showComparisonVersionModal, setShowComparisonVersionModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const isIos = Platform.OS === 'ios';
  const tabBarBottomOffset = Math.max(insets.bottom + 10, 18);
  const contentBottomPadding = tabBarBottomOffset + 74 + 20;
  const isFrench = uiLanguage.startsWith('fr');
  const versesCompleted = useMemo(() => progress.filter((item) => item.completed).length, [progress]);
  const {
    availableVoices,
    loadingVoices,
    testingVoice,
    selectedVoice,
    handleVoiceChange,
    testVoice,
  } = useSettingsTts({ language, ttsSettings, setTTSSettings });

  const {
    showAuthModal,
    setShowAuthModal,
    closeAuthModal,
    authMode,
    toggleAuthMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authUsername,
    setAuthUsername,
    captchaQuestion,
    captchaUserAnswer,
    setCaptchaUserAnswer,
    captchaLabel,
    captchaPlaceholder,
    authError,
    setAuthError,
    submitAuth,
  } = useSettingsAuth({
    uiLanguage,
    authLoading,
    signUp,
    signIn,
    syncProgress,
  });

  const { handleImportCustomVersion, handleLoadFromUrl } = useCustomVersionImport({
    uiLanguage,
    customUrl,
    setCustomUrl,
    setShowCustomVersionModal,
    setLanguage,
    setCustomVersionUrl,
  });

  const selectedLanguage = LANGUAGES.find((lang) => lang.code === language);
  const selectedComparisonLanguage = LANGUAGES.find((lang) => lang.code === appearanceSettings.comparisonVersion);
  const selectedThemeOption = THEME_OPTIONS.find((option) => option.value === theme);

  const learningModeLabel = learningMode === 'guess-verse' ? t(uiLanguage, 'guessVerse') : t(uiLanguage, 'guessReference');
  const ttsSpeedLabel = t(uiLanguage, ttsSettings.speed === 'slow' ? 'ttsSlow' : ttsSettings.speed === 'fast' ? 'ttsFast' : 'ttsNormal');
  const selectedVoiceLabel = !ttsSettings.voiceIdentifier ? t(uiLanguage, 'ttsDefaultVoice') : selectedVoice?.name ?? t(uiLanguage, 'ttsDefaultVoice');
  const selectedLanguageLabel = selectedLanguage ? `${selectedLanguage.flag} ${selectedLanguage.name}` : t(uiLanguage, 'customVersion');
  const comparisonLanguageLabel = selectedComparisonLanguage
    ? `${selectedComparisonLanguage.flag} ${selectedComparisonLanguage.name}`
    : t(uiLanguage, 'chooseComparisonVersion');
  const accountName = profile?.username ?? user?.email?.split('@')[0] ?? null;
  const syncLabel = t(uiLanguage, 'sync');
  const syncLoadingLabel = '...';
  const comparisonVersionModalTitle = t(uiLanguage, 'comparisonVersion');

  const settingsLabels = {
    learningMode: t(uiLanguage, 'learningMode'),
    theme: t(uiLanguage, 'theme'),
    validationSettings: t(uiLanguage, 'validationSettings'),
    validationTolerance: t(uiLanguage, 'validationTolerance'),
    allowLetterInversion: t(uiLanguage, 'allowLetterInversion'),
    ignorePunctuation: t(uiLanguage, 'ignorePunctuation'),
    ignoreAccents: t(uiLanguage, 'ignoreAccents'),
    readingSettings: t(uiLanguage, 'readingSettings'),
    fontSize: t(uiLanguage, 'fontSize'),
    lineSpacing: t(uiLanguage, 'lineSpacing'),
    wordSpacing: t(uiLanguage, 'wordSpacing'),
    appearanceSettings: t(uiLanguage, 'appearanceSettings'),
    enableAnimations: t(uiLanguage, 'enableAnimations'),
    showStartupVerse: t(uiLanguage, 'showStartupVerse'),
    startupVerseMode: t(uiLanguage, 'startupVerseMode'),
    startupVerseModeRandom: t(uiLanguage, 'startupVerseModeRandom'),
    startupVerseModeCurated: t(uiLanguage, 'startupVerseModeCurated'),
    ttsSettings: t(uiLanguage, 'ttsSettings'),
    ttsSpeed: t(uiLanguage, 'ttsSpeed'),
    ttsVoice: t(uiLanguage, 'ttsVoice'),
    ttsVoiceInfo: t(uiLanguage, 'ttsVoiceInfo'),
    ttsLoadingVoices: t(uiLanguage, 'ttsLoadingVoices'),
    ttsNoVoices: t(uiLanguage, 'ttsNoVoices'),
    learningCustomization: t(uiLanguage, 'learningCustomization'),
    autoAdvanceNext: t(uiLanguage, 'autoAdvanceNext'),
    showHintsButton: t(uiLanguage, 'showHintsButton'),
    focusModeTitle: t(uiLanguage, 'focusModeTitle'),
    focusModeDescription: t(uiLanguage, 'focusModeDescription'),
    maximumHints: t(uiLanguage, 'maximumHints'),
    autoMarkMemorizedTitle: t(uiLanguage, 'autoMarkMemorizedTitle'),
    masteryThreshold: t(uiLanguage, 'masteryThreshold'),
    autoMarkMemorizedDesc: t(uiLanguage, 'autoMarkMemorizedDesc'),
    enableHaptics: t(uiLanguage, 'enableHaptics'),
    maxMasteryLevel: t(uiLanguage, 'maxMasteryLevel'),
    maxMasteryLevelDesc: t(uiLanguage, 'maxMasteryLevelDesc'),
    notificationsSection: t(uiLanguage, 'notificationsSection'),
    dailyReminderEnabled: t(uiLanguage, 'dailyReminderEnabled'),
    dailyReminderTime: t(uiLanguage, 'dailyReminderTime'),
    streakWarningEnabled: t(uiLanguage, 'streakWarningEnabled'),
    streakWarningDesc: t(uiLanguage, 'streakWarningDesc'),
    close: t(uiLanguage, 'close'),
    rewardSettingsTitle: t(uiLanguage, 'rewardSettingsTitle'),
    rewardEnable: t(uiLanguage, 'rewardEnable'),
    rewardEnableHaptics: t(uiLanguage, 'rewardEnableHaptics'),
    rewardEnableSound: t(uiLanguage, 'rewardEnableSound'),
    rewardEnableSurprises: t(uiLanguage, 'rewardEnableSurprises'),
    rewardDailyGoal: t(uiLanguage, 'rewardDailyGoal'),
    rewardWeeklyGoal: t(uiLanguage, 'rewardWeeklyGoal'),
    rewardEnableStreak: t(uiLanguage, 'rewardEnableStreak'),
    supportReminderEnabled: t(uiLanguage, 'supportReminderEnabled'),
    chooseComparisonVersion: t(uiLanguage, 'chooseComparisonVersion'),
    enableVerseComparison: t(uiLanguage, 'enableVerseComparison'),
    resetProgression: t(uiLanguage, 'resetProgression'),
    resetProgressionHelper: t(uiLanguage, 'resetProgressionHelper'),
    hour: t(uiLanguage, 'hour'),
    minute: t(uiLanguage, 'minute'),
  };

  const groupLabels = {
    account: {
      eyebrow: isFrench ? 'Compte' : 'Account',
      title: isFrench ? 'Synchronisation et identité' : 'Identity and sync',
      description: isFrench
        ? 'Connexion, sauvegarde distante et version de traduction active.'
        : 'Sign-in, remote backup, and the active translation source.',
    },
    reading: {
      eyebrow: isFrench ? 'Lecture & audio' : 'Reading & audio',
      title: isFrench ? 'Confort de lecture' : 'Comfort while reading',
      description: isFrench
        ? 'Langue biblique, voix, vitesse et réglages de lecture regroupés au même endroit.'
        : 'Bible language, voice, speed, and reading controls in one place.',
    },
    memorization: {
      eyebrow: isFrench ? 'Mémorisation' : 'Memorization',
      title: isFrench ? 'Progression et récompenses' : 'Progress and rewards',
      description: isFrench
        ? 'Réglages pédagogiques, progression locale et boucle de récompense.'
        : 'Learning tuning, local progress, and the reward loop.',
    },
    appearance: {
      eyebrow: isFrench ? 'Apparence' : 'Appearance',
      title: isFrench ? 'Thème et comparaison' : 'Theme and comparison',
      description: isFrench
        ? 'Mode d’apprentissage, thème et options visuelles premium sans surcharge.'
        : 'Learning mode, theme, and visual options without extra clutter.',
    },
    notifications: {
      eyebrow: isFrench ? 'Notifications' : 'Notifications',
      title: isFrench ? 'Rappels utiles' : 'Useful reminders',
      description: isFrench
        ? 'Rappels quotidiens et alertes de série avec comportement plus prévisible.'
        : 'Daily reminders and streak alerts with more predictable behavior.',
    },
    data: {
      eyebrow: isFrench ? 'Données & aide' : 'Data & help',
      title: isFrench ? 'Support' : 'Support, import, and reset',
      description: isFrench
        ? ''
        : 'Help, credits, useful links, and sensitive actions clearly separated.',
    },
  };

  const handleOpenUrl = async (url: string, errorLabel: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error(errorLabel, error);
    }
  };

  const handleBooksSource = async () => handleOpenUrl('https://timprojects.online/bible-verse-memo/sources', 'Error opening books source link:');
  const handleOpenFAQ = async () => handleOpenUrl('https://timprojects.online/bible-verse-memo/FAQ#Version', 'Error opening FAQ link:');
  const handleMyProjects = async () => handleOpenUrl('https://timprojects.online', 'Error opening my projects link:');
  const handleContactDeveloper = async () => handleOpenUrl('mailto:timprojects@posteo.ch', 'Error opening mail app:');
  const handleDonate = async () => handleOpenUrl('https://timprojects.online/bible-verse-memo/donate', 'Error opening donate link:');

  const handleResetSettings = () => {
    Alert.alert(t(uiLanguage, 'resetSettings'), t(uiLanguage, 'resetConfirm'), [
      { text: t(uiLanguage, 'cancel'), style: 'cancel' },
      {
        text: t(uiLanguage, 'reset'),
        style: 'destructive',
        onPress: async () => {
          await setDyslexiaSettings({ fontSize: 18, lineHeight: 32, wordSpacing: 0 });
          await setValidationSettings({ toleranceLevel: 0.85, allowLetterInversion: false, ignorePunctuation: true, ignoreAccents: true });
          await setAppearanceSettings({ animationsEnabled: true, showStartupVerse: true });
          await setLearningSettings({ autoAdvance: false, showHints: true, maxHints: 90, autoMarkMemorized: false, autoMarkThreshold: 5, hapticFeedback: true, maxMasteryLevel: 20, focusMode: false });
          await setTTSSettings({ speed: 'normal', voiceIdentifier: undefined });
          Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'settingsReset'));
        },
      },
    ]);
  };

  const handleResetScore = () => {
    Alert.alert(t(uiLanguage, 'resetProgression'), t(uiLanguage, 'resetProgressionWarning'), [
      { text: t(uiLanguage, 'cancel'), style: 'cancel' },
      {
        text: t(uiLanguage, 'confirm'),
        style: 'destructive',
        onPress: async () => {
          await resetScoreProgress();
          Alert.alert(t(uiLanguage, 'progressionResetTitle'), t(uiLanguage, 'progressionResetMessage'));
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert(t(uiLanguage, 'logout'), t(uiLanguage, 'logoutConfirm'), [
      { text: t(uiLanguage, 'cancel'), style: 'cancel' },
      {
        text: t(uiLanguage, 'logout'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'loggedOutSuccess'));
        },
      },
    ]);
  };

  const syncPayload = {
    totalXp: xpProgress.totalXp,
    currentStreak: streakProgress.currentStreak,
    bestStreak: streakProgress.bestStreak,
    versesCompleted,
    quizzesCompleted: quizProgress.quizzesCompleted,
  };

  const handleSyncNow = async () => {
    await syncProgress(syncPayload);
    Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'syncSuccess'));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  const getSelectModalTitle = () => {
    if (activeSelectModal === 'learningMode') return t(uiLanguage, 'learningMode');
    if (activeSelectModal === 'theme') return t(uiLanguage, 'theme');
    if (activeSelectModal === 'ttsSpeed') return t(uiLanguage, 'ttsSpeed');
    return t(uiLanguage, 'ttsVoice');
  };

  const getThemeLabel = (value: Theme) => {
    const option = THEME_OPTIONS.find((item) => item.value === value);
    return option ? t(uiLanguage, option.labelKey) : value;
  };

  const submitAuthAndSync = async () => {
    await submitAuth(syncPayload);
  };

  const importCustomVersion = async () => {
    setIsLoadingCustomVersion(true);
    try {
      await handleImportCustomVersion();
    } finally {
      setIsLoadingCustomVersion(false);
    }
  };

  const loadCustomVersionFromUrl = async () => {
    setIsLoadingCustomVersion(true);
    try {
      await handleLoadFromUrl();
    } finally {
      setIsLoadingCustomVersion(false);
    }
  };

  return (
    <View style={[settingsStyles.container, { backgroundColor: colors.background }]}>
      <View style={[settingsStyles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[settingsStyles.title, { color: colors.text }]}>{t(uiLanguage, 'settings')}</Text>
        {!isFrench ? (
          <Text style={[settingsStyles.headerSubtitle, { color: colors.textSecondary }]}>
            A clearer space to manage your account, memorization, and preferences.
          </Text>
        ) : null}
      </View>

      <ScrollView
        style={settingsStyles.content}
        contentContainerStyle={[
          settingsStyles.contentContainer,
          { paddingBottom: contentBottomPadding },
        ]}
      >
        <View style={[settingsStyles.sectionGroup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[settingsStyles.groupEyebrow, { color: colors.primary }]}>{groupLabels.account.eyebrow}</Text>
          <Text style={[settingsStyles.groupTitle, { color: colors.text }]}>{groupLabels.account.title}</Text>
          {groupLabels.account.description ? (
            <Text style={[settingsStyles.groupDescription, { color: colors.textSecondary }]}>{groupLabels.account.description}</Text>
          ) : null}
          <SettingsAccountSection
            colors={colors}
            accountLabel={t(uiLanguage, 'account')}
            loginToSyncLabel={t(uiLanguage, 'loginToSync')}
            loginSignUpLabel={t(uiLanguage, 'loginSignUp')}
            logoutLabel={t(uiLanguage, 'logout')}
            syncLabel={syncLabel}
            syncLoadingLabel={syncLoadingLabel}
            username={accountName}
            email={user?.email ?? null}
            isAuthenticated={Boolean(user)}
            authLoading={authLoading}
            onOpenAuth={() => setShowAuthModal(true)}
            onSyncNow={handleSyncNow}
            onSignOut={handleSignOut}
          />
          <SettingsLanguageSection
            colors={colors}
            title={t(uiLanguage, 'verseLanguage')}
            selectedLanguageLabel={selectedLanguageLabel}
            importCustomVersionLabel={t(uiLanguage, 'importCustomVersion')}
            onOpenLanguageModal={() => setShowLanguageModal(true)}
            onOpenCustomVersionModal={() => setShowCustomVersionModal(true)}
          />
        </View>

        <View style={[settingsStyles.sectionGroup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[settingsStyles.groupEyebrow, { color: colors.primary }]}>{groupLabels.reading.eyebrow}</Text>
          <Text style={[settingsStyles.groupTitle, { color: colors.text }]}>{groupLabels.reading.title}</Text>
          <Text style={[settingsStyles.groupDescription, { color: colors.textSecondary }]}>{groupLabels.reading.description}</Text>
          <SettingsAudioSection
            colors={colors}
            title={settingsLabels.ttsSettings}
            speedLabel={settingsLabels.ttsSpeed}
            selectedSpeedLabel={ttsSpeedLabel}
            voiceLabel={settingsLabels.ttsVoice}
            selectedVoiceLabel={selectedVoiceLabel}
            voiceInfoLabel={settingsLabels.ttsVoiceInfo}
            loadingVoicesLabel={settingsLabels.ttsLoadingVoices}
            noVoicesLabel={settingsLabels.ttsNoVoices}
            expanded={expandedSections.ttsSettings}
            loadingVoices={loadingVoices}
            hasVoices={availableVoices.length > 0}
            onToggle={() => toggleSection('ttsSettings')}
            onOpenSpeed={() => setActiveSelectModal('ttsSpeed')}
            onOpenVoice={() => setActiveSelectModal('ttsVoice')}
          />
        </View>

        <View style={[settingsStyles.sectionGroup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[settingsStyles.groupEyebrow, { color: colors.primary }]}>{groupLabels.memorization.eyebrow}</Text>
          <Text style={[settingsStyles.groupTitle, { color: colors.text }]}>{groupLabels.memorization.title}</Text>
          {groupLabels.memorization.description ? (
            <Text style={[settingsStyles.groupDescription, { color: colors.textSecondary }]}>{groupLabels.memorization.description}</Text>
          ) : null}
          <SettingsMemorizationSection
            colors={colors}
            learningTitle={settingsLabels.learningCustomization}
            rewardsTitle={settingsLabels.rewardSettingsTitle}
            learningSettings={learningSettings}
            rewardSettings={rewardSettings}
            isIos={isIos}
            expandedLearning={expandedSections.learningCustomization}
            expandedRewards={expandedSections.rewards}
            labels={settingsLabels}
            onToggleLearning={() => toggleSection('learningCustomization')}
            onToggleRewards={() => toggleSection('rewards')}
            onChangeLearningSettings={setLearningSettings}
            onChangeRewardSettings={updateRewardSettings}
            onResetScore={handleResetScore}
          />
        </View>

        <View style={[settingsStyles.sectionGroup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[settingsStyles.groupEyebrow, { color: colors.primary }]}>{groupLabels.appearance.eyebrow}</Text>
          <Text style={[settingsStyles.groupTitle, { color: colors.text }]}>{groupLabels.appearance.title}</Text>
          {groupLabels.appearance.description ? (
            <Text style={[settingsStyles.groupDescription, { color: colors.textSecondary }]}>{groupLabels.appearance.description}</Text>
          ) : null}
          <SettingsAppearanceSections
            colors={colors}
            learningModeLabel={learningModeLabel}
            selectedThemeLabel={selectedThemeOption ? t(uiLanguage, selectedThemeOption.labelKey) : t(uiLanguage, 'theme')}
            selectedThemeValue={selectedThemeOption?.value ?? theme}
            comparisonLanguageLabel={comparisonLanguageLabel}
            validationSettings={validationSettings}
            dyslexiaSettings={dyslexiaSettings}
            appearanceSettings={appearanceSettings}
            expandedSections={{
              learningMode: expandedSections.learningMode,
              themeSettings: expandedSections.themeSettings,
              validationSettings: expandedSections.validationSettings,
              readingSettings: expandedSections.readingSettings,
              appearanceSettings: expandedSections.appearanceSettings,
            }}
            labels={settingsLabels}
            onToggleSection={toggleSection}
            onOpenLearningMode={() => setActiveSelectModal('learningMode')}
            onOpenTheme={() => setActiveSelectModal('theme')}
            onOpenComparisonVersion={() => setShowComparisonVersionModal(true)}
            onChangeValidationSettings={setValidationSettings}
            onChangeDyslexiaSettings={setDyslexiaSettings}
            onChangeAppearanceSettings={setAppearanceSettings}
          />
        </View>

        <View style={[settingsStyles.sectionGroup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[settingsStyles.groupEyebrow, { color: colors.primary }]}>{groupLabels.notifications.eyebrow}</Text>
          <Text style={[settingsStyles.groupTitle, { color: colors.text }]}>{groupLabels.notifications.title}</Text>
          {groupLabels.notifications.description ? (
            <Text style={[settingsStyles.groupDescription, { color: colors.textSecondary }]}>{groupLabels.notifications.description}</Text>
          ) : null}
          <SettingsNotificationsSection
            colors={colors}
            title={settingsLabels.notificationsSection}
            expanded={expandedSections.notifications}
            showTimePicker={showTimePicker}
            settings={notificationSettings}
            labels={settingsLabels}
            onToggle={() => toggleSection('notifications')}
            onToggleTimePicker={setShowTimePicker}
            onChangeSettings={setNotificationSettings}
          />
        </View>

        <View style={[settingsStyles.sectionGroup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[settingsStyles.groupEyebrow, { color: colors.primary }]}>{t(uiLanguage, 'pollGroupEyebrow')}</Text>
          <Text style={[settingsStyles.groupTitle, { color: colors.text }]}>{t(uiLanguage, 'pollGroupTitle')}</Text>
          <Text style={[settingsStyles.groupDescription, { color: colors.textSecondary }]}>{t(uiLanguage, 'pollGroupDescription')}</Text>
          <SettingsPollSection
            colors={colors}
            isFrench={isFrench}
            labels={{
              pollSectionEyebrow: t(uiLanguage, 'pollSectionEyebrow'),
              pollVoteButtonLabel: t(uiLanguage, 'pollVoteButtonLabel'),
              pollVotesLabel: t(uiLanguage, 'pollVotesLabel'),
              pollThanksMessage: t(uiLanguage, 'pollThanksMessage'),
              pollErrorMessage: t(uiLanguage, 'pollErrorMessage'),
              pollDismissLabel: t(uiLanguage, 'pollDismissLabel'),
            }}
          />
        </View>

        <View style={[settingsStyles.sectionGroup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[settingsStyles.groupEyebrow, { color: colors.primary }]}>{groupLabels.data.eyebrow}</Text>
          <Text style={[settingsStyles.groupTitle, { color: colors.text }]}>{groupLabels.data.title}</Text>
          {groupLabels.data.description ? (
            <Text style={[settingsStyles.groupDescription, { color: colors.textSecondary }]}>{groupLabels.data.description}</Text>
          ) : null}
          <SettingsSupportSection
            colors={colors}
            booksSourceLabel={t(uiLanguage, 'booksSource')}
            myProjectsLabel={t(uiLanguage, 'myProjects')}
            contactDeveloperLabel={t(uiLanguage, 'contactDeveloper')}
            aboutLabel={t(uiLanguage, 'about')}
            donateLabel={t(uiLanguage, 'donate')}
            footerText={t(uiLanguage, 'footerText')}
            resetSettingsLabel={t(uiLanguage, 'resetSettings')}
            onBooksSource={handleBooksSource}
            onMyProjects={handleMyProjects}
            onContactDeveloper={handleContactDeveloper}
            onOpenAbout={() => setShowAboutModal(true)}
            onDonate={handleDonate}
            onResetSettings={handleResetSettings}
          />
        </View>
      </ScrollView>

      <LanguageSelectionModal
        visible={showLanguageModal}
        title={t(uiLanguage, 'verseLanguage')}
        selectedLanguage={language}
        customVersionLabel={t(uiLanguage, 'customVersion')}
        cancelLabel={t(uiLanguage, 'cancel')}
        colors={colors}
        onClose={() => setShowLanguageModal(false)}
        onSelect={setLanguage}
      />

      <ComparisonVersionModal
        visible={showComparisonVersionModal}
        title={comparisonVersionModalTitle}
        selectedLanguage={appearanceSettings.comparisonVersion}
        cancelLabel={t(uiLanguage, 'cancel')}
        colors={colors}
        onClose={() => setShowComparisonVersionModal(false)}
        onSelect={(comparisonVersion) => setAppearanceSettings({ comparisonVersion })}
      />

      <SettingsSelectModal
        visible={activeSelectModal !== null}
        activeModal={activeSelectModal}
        title={getSelectModalTitle()}
        cancelLabel={t(uiLanguage, 'cancel')}
        learningMode={learningMode}
        theme={theme}
        ttsSpeed={ttsSettings.speed}
        ttsVoiceIdentifier={ttsSettings.voiceIdentifier ?? undefined}
        availableVoices={availableVoices}
        testingVoice={testingVoice}
        learningModeGuessVerseLabel={t(uiLanguage, 'guessVerse')}
        learningModeGuessReferenceLabel={t(uiLanguage, 'guessReference')}
        ttsDefaultVoiceLabel={t(uiLanguage, 'ttsDefaultVoice')}
        ttsSlowLabel={t(uiLanguage, 'ttsSlow')}
        ttsNormalLabel={t(uiLanguage, 'ttsNormal')}
        ttsFastLabel={t(uiLanguage, 'ttsFast')}
        getThemeLabel={getThemeLabel}
        colors={colors}
        onClose={() => setActiveSelectModal(null)}
        onSelectLearningMode={setLearningMode}
        onSelectTheme={setTheme}
        onSelectTTSSpeed={(speed) => setTTSSettings({ speed })}
        onSelectVoice={handleVoiceChange}
        onTestVoice={testVoice}
      />

      <SettingsAboutModal
        visible={showAboutModal}
        title={t(uiLanguage, 'about')}
        versionLabel={t(uiLanguage, 'version')}
        creditsLabel={t(uiLanguage, 'credits')}
        applicationLabel={t(uiLanguage, 'application')}
        appVersion={APP_VERSION}
        colors={colors}
        onClose={() => setShowAboutModal(false)}
      />

      <SettingsCustomVersionModal
        visible={showCustomVersionModal}
        title={t(uiLanguage, 'importCustomVersion')}
        description={t(uiLanguage, 'customVersionDescription')}
        viewFormatGuideLabel={t(uiLanguage, 'viewFormatGuide')}
        enterUrlLabel={t(uiLanguage, 'enterUrl')}
        urlPlaceholder={t(uiLanguage, 'urlPlaceholder')}
        loadFromUrlLabel={t(uiLanguage, 'loadFromUrl')}
        orLabel={t(uiLanguage, 'or')}
        importLocalFileLabel={t(uiLanguage, 'importLocalFile')}
        customUrl={customUrl}
        isLoading={isLoadingCustomVersion}
        colors={colors}
        onClose={() => setShowCustomVersionModal(false)}
        onOpenFaq={handleOpenFAQ}
        onChangeCustomUrl={setCustomUrl}
        onLoadFromUrl={loadCustomVersionFromUrl}
        onImportLocalFile={importCustomVersion}
      />

      <SettingsAuthModal
        visible={showAuthModal}
        mode={authMode}
        authError={authError}
        email={authEmail}
        password={authPassword}
        username={authUsername}
        captchaQuestion={captchaQuestion}
        captchaAnswer={captchaUserAnswer}
        loading={authLoading}
        titleSignIn={t(uiLanguage, 'signIn')}
        titleSignUp={t(uiLanguage, 'signUp')}
        usernameLabel={t(uiLanguage, 'username')}
        emailLabel={t(uiLanguage, 'email')}
        passwordLabel={t(uiLanguage, 'password')}
        captchaLabel={captchaLabel}
        captchaPlaceholder={captchaPlaceholder}
        switchToSignUpLabel={t(uiLanguage, 'switchToSignUp')}
        switchToSignInLabel={t(uiLanguage, 'switchToSignIn')}
        colors={colors}
        onClose={closeAuthModal}
        onChangeMode={toggleAuthMode}
        onChangeEmail={setAuthEmail}
        onChangePassword={setAuthPassword}
        onChangeUsername={setAuthUsername}
        onChangeCaptchaAnswer={setCaptchaUserAnswer}
        onSubmit={submitAuthAndSync}
        onResetError={() => setAuthError(null)}
      />
    </View>
  );
}
