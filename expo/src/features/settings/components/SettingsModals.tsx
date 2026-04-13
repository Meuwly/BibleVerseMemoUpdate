import { Check, FileText, Info, Link as LinkIcon, Play, User, UserRound, X } from 'lucide-react-native';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { LANGUAGES } from '../../../../constants/languages';
import type { ColorScheme } from '../../../../constants/colors';
import { themeColors } from '../../../../constants/colors';
import type { Language, LearningMode, Theme, TTSSpeed, TTSVoice } from '../../../../types/database';
import { THEME_OPTIONS } from '../../../../constants/themeOptions';
import { settingsStyles } from '../styles';

export type SettingsSelectModalType = 'learningMode' | 'theme' | 'ttsSpeed' | 'ttsVoice' | null;

interface SharedModalProps {
  colors: ColorScheme;
}

interface LanguageSelectionModalProps extends SharedModalProps {
  visible: boolean;
  title: string;
  selectedLanguage: Language;
  customVersionLabel?: string;
  cancelLabel: string;
  onClose: () => void;
  onSelect: (language: Language) => Promise<void> | void;
}

export function LanguageSelectionModal({
  visible,
  title,
  selectedLanguage,
  customVersionLabel,
  cancelLabel,
  colors,
  onClose,
  onSelect,
}: LanguageSelectionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={settingsStyles.modalOverlay}>
        <View style={[settingsStyles.languageModalCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <Text style={[settingsStyles.languageModalTitle, { color: colors.text }]}>{title}</Text>
          <ScrollView style={settingsStyles.languageModalList}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[settingsStyles.languageModalItem, { borderBottomColor: colors.border }]}
                  onPress={async () => {
                    await onSelect(lang.code);
                    onClose();
                  }}
                >
                  <Text style={[settingsStyles.languageModalItemText, { color: colors.text }]}>{`${lang.flag} ${lang.name}`}</Text>
                  {isSelected ? <Check color={colors.primary} size={18} /> : null}
                </TouchableOpacity>
              );
            })}
            {customVersionLabel && selectedLanguage.startsWith('CUSTOM_') ? (
              <View style={[settingsStyles.languageModalItem, { borderBottomColor: colors.border }]}> 
                <Text style={[settingsStyles.languageModalItemText, { color: colors.text }]}>{customVersionLabel}</Text>
                <Check color={colors.primary} size={18} />
              </View>
            ) : null}
          </ScrollView>
          <TouchableOpacity style={[settingsStyles.languageModalCloseButton, { backgroundColor: colors.primary + '18' }]} onPress={onClose}>
            <Text style={[settingsStyles.languageModalCloseText, { color: colors.primary }]}>{cancelLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface ComparisonVersionModalProps extends SharedModalProps {
  visible: boolean;
  title: string;
  selectedLanguage?: Language | null;
  cancelLabel: string;
  onClose: () => void;
  onSelect: (language: Language) => Promise<void> | void;
}

export function ComparisonVersionModal({ visible, title, selectedLanguage, cancelLabel, colors, onClose, onSelect }: ComparisonVersionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={settingsStyles.modalOverlay}>
        <View style={[settingsStyles.languageModalCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <Text style={[settingsStyles.languageModalTitle, { color: colors.text }]}>{title}</Text>
          <ScrollView style={settingsStyles.languageModalList}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[settingsStyles.languageModalItem, { borderBottomColor: colors.border }]}
                  onPress={async () => {
                    await onSelect(lang.code);
                    onClose();
                  }}
                >
                  <Text style={[settingsStyles.languageModalItemText, { color: colors.text }]}>{`${lang.flag} ${lang.name}`}</Text>
                  {isSelected ? <Check color={colors.primary} size={18} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={[settingsStyles.languageModalCloseButton, { backgroundColor: colors.primary + '18' }]} onPress={onClose}>
            <Text style={[settingsStyles.languageModalCloseText, { color: colors.primary }]}>{cancelLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface SettingsSelectModalProps extends SharedModalProps {
  visible: boolean;
  activeModal: Exclude<SettingsSelectModalType, null> | null;
  title: string;
  cancelLabel: string;
  learningMode: LearningMode;
  theme: Theme;
  ttsSpeed: TTSSpeed;
  ttsVoiceIdentifier?: string;
  availableVoices: TTSVoice[];
  testingVoice: string | null;
  learningModeGuessVerseLabel: string;
  learningModeGuessReferenceLabel: string;
  ttsDefaultVoiceLabel: string;
  ttsSlowLabel: string;
  ttsNormalLabel: string;
  ttsFastLabel: string;
  getThemeLabel: (theme: Theme) => string;
  onClose: () => void;
  onSelectLearningMode: (mode: LearningMode) => Promise<void> | void;
  onSelectTheme: (theme: Theme) => Promise<void> | void;
  onSelectTTSSpeed: (speed: TTSSpeed) => Promise<void> | void;
  onSelectVoice: (voiceIdentifier: string | undefined) => Promise<void> | void;
  onTestVoice: (voiceIdentifier: string | undefined) => void;
}

export function SettingsSelectModal({
  visible,
  activeModal,
  title,
  cancelLabel,
  learningMode,
  theme,
  ttsSpeed,
  ttsVoiceIdentifier,
  availableVoices,
  testingVoice,
  learningModeGuessVerseLabel,
  learningModeGuessReferenceLabel,
  ttsDefaultVoiceLabel,
  ttsSlowLabel,
  ttsNormalLabel,
  ttsFastLabel,
  getThemeLabel,
  colors,
  onClose,
  onSelectLearningMode,
  onSelectTheme,
  onSelectTTSSpeed,
  onSelectVoice,
  onTestVoice,
}: SettingsSelectModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={settingsStyles.modalOverlay}>
        <View style={[settingsStyles.languageModalCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <Text style={[settingsStyles.languageModalTitle, { color: colors.text }]}>{title}</Text>
          <ScrollView style={settingsStyles.languageModalList}>
            {activeModal === 'learningMode'
              ? (['guess-verse', 'guess-reference'] as LearningMode[]).map((mode) => {
                  const isSelected = learningMode === mode;
                  const label = mode === 'guess-verse' ? learningModeGuessVerseLabel : learningModeGuessReferenceLabel;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[settingsStyles.languageModalItem, { borderBottomColor: colors.border }]}
                      onPress={async () => {
                        await onSelectLearningMode(mode);
                        onClose();
                      }}
                    >
                      <Text style={[settingsStyles.languageModalItemText, { color: colors.text }]}>{label}</Text>
                      {isSelected ? <Check color={colors.primary} size={18} /> : null}
                    </TouchableOpacity>
                  );
                })
              : null}

            {activeModal === 'theme'
              ? THEME_OPTIONS.map((option) => {
                  const optionTheme = option.value;
                  const isSelected = theme === optionTheme;
                  return (
                    <TouchableOpacity
                      key={optionTheme}
                      style={[settingsStyles.languageModalItem, { borderBottomColor: colors.border }]}
                      onPress={async () => {
                        await onSelectTheme(optionTheme);
                        onClose();
                      }}
                    >
                      <View style={settingsStyles.selectModalOptionRow}>
                        <View style={[settingsStyles.themeSwatch, { backgroundColor: themeColors[optionTheme].primary }]} />
                        <Text style={[settingsStyles.languageModalItemText, { color: colors.text, marginRight: 0 }]}>{getThemeLabel(optionTheme)}</Text>
                      </View>
                      {isSelected ? <Check color={colors.primary} size={18} /> : null}
                    </TouchableOpacity>
                  );
                })
              : null}

            {activeModal === 'ttsSpeed'
              ? (['slow', 'normal', 'fast'] as TTSSpeed[]).map((speed) => {
                  const isSelected = ttsSpeed === speed;
                  const label = speed === 'slow' ? ttsSlowLabel : speed === 'fast' ? ttsFastLabel : ttsNormalLabel;
                  return (
                    <TouchableOpacity
                      key={speed}
                      style={[settingsStyles.languageModalItem, { borderBottomColor: colors.border }]}
                      onPress={async () => {
                        await onSelectTTSSpeed(speed);
                        onClose();
                      }}
                    >
                      <Text style={[settingsStyles.languageModalItemText, { color: colors.text }]}>{label}</Text>
                      {isSelected ? <Check color={colors.primary} size={18} /> : null}
                    </TouchableOpacity>
                  );
                })
              : null}

            {activeModal === 'ttsVoice' ? (
              <>
                <TouchableOpacity
                  style={[settingsStyles.languageModalItem, { borderBottomColor: colors.border }]}
                  onPress={async () => {
                    await onSelectVoice(undefined);
                    onClose();
                  }}
                >
                  <View style={settingsStyles.voiceModalInfo}>
                    <Text style={[settingsStyles.languageModalItemText, { color: colors.text, marginRight: 0 }]}>{ttsDefaultVoiceLabel}</Text>
                  </View>
                  <View style={settingsStyles.voiceActions}>
                    <TouchableOpacity
                      style={[settingsStyles.voiceTestButton, { backgroundColor: colors.info + '20' }]}
                      onPress={() => onTestVoice(undefined)}
                      disabled={testingVoice !== null}
                    >
                      {testingVoice === 'default' ? <ActivityIndicator size="small" color={colors.info} /> : <Play size={14} color={colors.info} />}
                    </TouchableOpacity>
                    {!ttsVoiceIdentifier ? <Check color={colors.primary} size={18} /> : null}
                  </View>
                </TouchableOpacity>

                {availableVoices.map((voice, index) => {
                  const GenderIcon = voice.gender === 'female' ? UserRound : voice.gender === 'male' ? User : null;
                  const genderColor = voice.gender === 'female' ? '#EC4899' : voice.gender === 'male' ? '#3B82F6' : colors.textSecondary;
                  const isSelected = ttsVoiceIdentifier === voice.identifier;
                  return (
                    <TouchableOpacity
                      key={`${voice.identifier}-${index}`}
                      style={[settingsStyles.languageModalItem, { borderBottomColor: colors.border }]}
                      onPress={async () => {
                        await onSelectVoice(voice.identifier);
                        onClose();
                      }}
                    >
                      <View style={settingsStyles.voiceModalInfo}>
                        <View style={settingsStyles.voiceNameRow}>
                          {GenderIcon ? <GenderIcon size={16} color={genderColor} /> : null}
                          <Text style={[settingsStyles.languageModalItemText, { color: colors.text, marginRight: 0 }]} numberOfLines={1}>
                            {voice.name}
                          </Text>
                        </View>
                        <Text style={[settingsStyles.voiceLanguage, { color: colors.textSecondary }]} numberOfLines={1}>
                          {voice.language}
                        </Text>
                      </View>
                      <View style={settingsStyles.voiceActions}>
                        <TouchableOpacity
                          style={[settingsStyles.voiceTestButton, { backgroundColor: colors.info + '20' }]}
                          onPress={() => onTestVoice(voice.identifier)}
                          disabled={testingVoice !== null}
                        >
                          {testingVoice === voice.identifier ? <ActivityIndicator size="small" color={colors.info} /> : <Play size={14} color={colors.info} />}
                        </TouchableOpacity>
                        {isSelected ? <Check color={colors.primary} size={18} /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : null}
          </ScrollView>
          <TouchableOpacity style={[settingsStyles.languageModalCloseButton, { backgroundColor: colors.primary + '18' }]} onPress={onClose}>
            <Text style={[settingsStyles.languageModalCloseText, { color: colors.primary }]}>{cancelLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface SettingsAboutModalProps extends SharedModalProps {
  visible: boolean;
  title: string;
  versionLabel: string;
  creditsLabel: string;
  applicationLabel: string;
  appVersion: string;
  onClose: () => void;
}

export function SettingsAboutModal({ visible, title, versionLabel, creditsLabel, applicationLabel, appVersion, colors, onClose }: SettingsAboutModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={settingsStyles.modalOverlay}>
        <View style={[settingsStyles.modalContent, { backgroundColor: colors.cardBackground }]}> 
          <View style={settingsStyles.modalHeader}>
            <Text style={[settingsStyles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={settingsStyles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={settingsStyles.modalBody}>
            <Text style={[settingsStyles.aboutLabel, { color: colors.textSecondary }]}>{versionLabel}:</Text>
            <Text style={[settingsStyles.aboutValue, { color: colors.text }]}>{appVersion}</Text>

            <Text style={[settingsStyles.aboutLabel, { color: colors.textSecondary, marginTop: 24 }]}>{creditsLabel}:</Text>
            <View style={settingsStyles.creditItem}>
              <Text style={[settingsStyles.creditLabel, { color: colors.textSecondary }]}>- {applicationLabel}:</Text>
              <Text style={[settingsStyles.creditValue, { color: colors.text }]}>Timothée M.</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface SettingsCustomVersionModalProps extends SharedModalProps {
  visible: boolean;
  title: string;
  description: string;
  viewFormatGuideLabel: string;
  enterUrlLabel: string;
  urlPlaceholder: string;
  loadFromUrlLabel: string;
  orLabel: string;
  importLocalFileLabel: string;
  customUrl: string;
  isLoading: boolean;
  onClose: () => void;
  onOpenFaq: () => void;
  onChangeCustomUrl: (value: string) => void;
  onLoadFromUrl: () => void;
  onImportLocalFile: () => void;
}

export function SettingsCustomVersionModal({
  visible,
  title,
  description,
  viewFormatGuideLabel,
  enterUrlLabel,
  urlPlaceholder,
  loadFromUrlLabel,
  orLabel,
  importLocalFileLabel,
  customUrl,
  isLoading,
  colors,
  onClose,
  onOpenFaq,
  onChangeCustomUrl,
  onLoadFromUrl,
  onImportLocalFile,
}: SettingsCustomVersionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={settingsStyles.modalOverlay}>
        <View style={[settingsStyles.modalContent, { backgroundColor: colors.cardBackground }]}> 
          <View style={settingsStyles.modalHeader}>
            <Text style={[settingsStyles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={settingsStyles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={settingsStyles.modalBody}>
            <Text style={[settingsStyles.customVersionDescription, { color: colors.textSecondary }]}>{description}</Text>

            <TouchableOpacity style={[settingsStyles.faqButton, { backgroundColor: colors.info + '20', borderColor: colors.info }]} onPress={onOpenFaq}>
              <Info color={colors.info} size={18} />
              <Text style={[settingsStyles.faqButtonText, { color: colors.info }]}>{viewFormatGuideLabel}</Text>
            </TouchableOpacity>

            <Text style={[settingsStyles.inputLabel, { color: colors.text }]}>{enterUrlLabel}:</Text>
            <TextInput
              style={[settingsStyles.urlInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder={urlPlaceholder}
              placeholderTextColor={colors.textTertiary}
              value={customUrl}
              onChangeText={onChangeCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <TouchableOpacity style={[settingsStyles.modalActionButton, { backgroundColor: colors.primary }]} onPress={onLoadFromUrl} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <LinkIcon color="#fff" size={20} />
                  <Text style={settingsStyles.modalActionButtonText}>{loadFromUrlLabel}</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={settingsStyles.divider}>
              <View style={[settingsStyles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[settingsStyles.dividerText, { color: colors.textSecondary }]}>{orLabel}</Text>
              <View style={[settingsStyles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity style={[settingsStyles.modalActionButton, { backgroundColor: colors.warning }]} onPress={onImportLocalFile} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FileText color="#fff" size={20} />
                  <Text style={settingsStyles.modalActionButtonText}>{importLocalFileLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface SettingsAuthModalProps extends SharedModalProps {
  visible: boolean;
  mode: 'signIn' | 'signUp';
  authError: string | null;
  email: string;
  password: string;
  username: string;
  captchaQuestion: string;
  captchaAnswer: string;
  loading: boolean;
  titleSignIn: string;
  titleSignUp: string;
  usernameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  captchaLabel: string;
  captchaPlaceholder: string;
  switchToSignUpLabel: string;
  switchToSignInLabel: string;
  onClose: () => void;
  onChangeMode: () => void;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onChangeUsername: (value: string) => void;
  onChangeCaptchaAnswer: (value: string) => void;
  onSubmit: () => void;
  onResetError: () => void;
}

export function SettingsAuthModal({
  visible,
  mode,
  authError,
  email,
  password,
  username,
  captchaQuestion,
  captchaAnswer,
  loading,
  titleSignIn,
  titleSignUp,
  usernameLabel,
  emailLabel,
  passwordLabel,
  captchaLabel,
  captchaPlaceholder,
  switchToSignUpLabel,
  switchToSignInLabel,
  colors,
  onClose,
  onChangeMode,
  onChangeEmail,
  onChangePassword,
  onChangeUsername,
  onChangeCaptchaAnswer,
  onSubmit,
  onResetError,
}: SettingsAuthModalProps) {
  const close = () => {
    onClose();
    onResetError();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={settingsStyles.modalOverlay}>
        <View style={[settingsStyles.modalContent, { backgroundColor: colors.cardBackground }]}> 
          <View style={settingsStyles.modalHeader}>
            <Text style={[settingsStyles.modalTitle, { color: colors.text }]}>{mode === 'signIn' ? titleSignIn : titleSignUp}</Text>
            <TouchableOpacity onPress={close} style={settingsStyles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>
          <View style={settingsStyles.modalBody}>
            {authError ? (
              <View style={[settingsStyles.authErrorBanner, { backgroundColor: colors.error + '15' }]}>
                <Text style={[settingsStyles.authErrorText, { color: colors.error }]}>{authError}</Text>
              </View>
            ) : null}
            {mode === 'signUp' ? (
              <>
                <TextInput
                  style={[settingsStyles.authInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder={usernameLabel}
                  placeholderTextColor={colors.textTertiary}
                  value={username}
                  onChangeText={onChangeUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={[settingsStyles.captchaLabel, { color: colors.textSecondary }]}>{captchaLabel.replace('{question}', captchaQuestion)}</Text>
                <TextInput
                  style={[settingsStyles.authInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder={captchaPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  value={captchaAnswer}
                  onChangeText={onChangeCaptchaAnswer}
                  keyboardType="number-pad"
                />
              </>
            ) : null}
            <TextInput
              style={[settingsStyles.authInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder={emailLabel}
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={onChangeEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <TextInput
              style={[settingsStyles.authInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder={passwordLabel}
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={onChangePassword}
              secureTextEntry
            />
            <TouchableOpacity style={[settingsStyles.authSubmitButton, { backgroundColor: colors.primary }]} onPress={onSubmit} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={settingsStyles.authSubmitButtonText}>{mode === 'signIn' ? titleSignIn : titleSignUp}</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onChangeMode();
                onResetError();
              }}
              style={settingsStyles.authSwitchButton}
            >
              <Text style={[settingsStyles.authSwitchText, { color: colors.primary }]}>{mode === 'signIn' ? switchToSignUpLabel : switchToSignInLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
