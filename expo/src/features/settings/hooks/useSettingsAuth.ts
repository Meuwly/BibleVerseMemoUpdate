import { useEffect, useMemo, useState } from 'react';

import { t } from '../../../../constants/translations';
import { normalizeUsernameInput, validateUsername } from '../../../lib/authValidation';

interface SyncPayload {
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  versesCompleted: number;
  quizzesCompleted: number;
}

interface UseSettingsAuthParams {
  uiLanguage: string;
  authLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error?: string | null }>;
  syncProgress: (payload: SyncPayload) => Promise<void>;
}

export function useSettingsAuth({ uiLanguage, authLoading, signUp, signIn, syncProgress }: UseSettingsAuthParams) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaExpectedAnswer, setCaptchaExpectedAnswer] = useState<number | null>(null);
  const [captchaUserAnswer, setCaptchaUserAnswer] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const captchaLabel = useMemo(
    () => t(uiLanguage, 'captchaQuestionLabel'),
    [uiLanguage],
  );
  const captchaPlaceholder = useMemo(() => t(uiLanguage, 'captchaPlaceholder'), [uiLanguage]);

  const resetAuthFields = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthUsername('');
    setCaptchaUserAnswer('');
  };

  const refreshCaptcha = () => {
    const firstNumber = Math.floor(Math.random() * 8) + 1;
    const secondNumber = Math.floor(Math.random() * 8) + 1;
    setCaptchaQuestion(`${firstNumber} + ${secondNumber}`);
    setCaptchaExpectedAnswer(firstNumber + secondNumber);
    setCaptchaUserAnswer('');
  };

  useEffect(() => {
    if (showAuthModal && authMode === 'signUp') {
      refreshCaptcha();
    }
  }, [showAuthModal, authMode]);

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const toggleAuthMode = () => {
    setAuthMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
  };

  const submitAuth = async (syncPayload: SyncPayload) => {
    setAuthError(null);

    if (authMode === 'signUp') {
      const normalizedUsername = normalizeUsernameInput(authUsername);
      const usernameError = validateUsername(normalizedUsername);
      if (usernameError) {
        setAuthError(usernameError);
        return;
      }

      const parsedCaptchaAnswer = Number.parseInt(captchaUserAnswer.trim(), 10);
      if (captchaExpectedAnswer === null || parsedCaptchaAnswer !== captchaExpectedAnswer) {
        setAuthError(t(uiLanguage, 'captchaIncorrect'));
        refreshCaptcha();
        return;
      }

      const { error } = await signUp(authEmail.trim(), authPassword, normalizedUsername);
      if (error) {
        setAuthError(t(uiLanguage, error) || error);
        refreshCaptcha();
        return;
      }
    } else {
      const { error } = await signIn(authEmail.trim(), authPassword);
      if (error) {
        setAuthError(t(uiLanguage, error) || error);
        return;
      }
    }

    closeAuthModal();
    resetAuthFields();

    await syncProgress(syncPayload);
  };

  return {
    authLoading,
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
  };
}
