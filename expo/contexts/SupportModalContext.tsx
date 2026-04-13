import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { getRewardsSettings } from '../src/storage/rewardsRepo';
import { describeError } from '../utils/errorLogging';

interface SupportModalState {
  shouldShowModal: boolean;
  completedVersesCount: number;
  hasDonated: boolean;
  lastModalShownAtVerseCount: number;
  incrementCompletedVerses: () => Promise<number>;
  markAsDonated: () => Promise<void>;
  dismissModal: () => Promise<void>;
  checkAndShowModal: (currentCount?: number) => Promise<boolean>;
  isLoading: boolean;
}

const SUPPORT_MODAL_KEY = '@support_modal_state';

interface PersistedState {
  completedVersesCount: number;
  hasDonated: boolean;
  lastModalShownAtVerseCount: number;
  hasShownFirstModal: boolean;
}

const DEFAULT_PERSISTED_STATE: PersistedState = {
  completedVersesCount: 0,
  hasDonated: false,
  lastModalShownAtVerseCount: 0,
  hasShownFirstModal: false,
};

function parsePersistedState(value: string | null): PersistedState {
  if (!value) {
    return { ...DEFAULT_PERSISTED_STATE };
  }

  try {
    const parsed = JSON.parse(value) as Partial<PersistedState>;
    return {
      completedVersesCount: parsed.completedVersesCount ?? 0,
      hasDonated: parsed.hasDonated ?? false,
      lastModalShownAtVerseCount: parsed.lastModalShownAtVerseCount ?? 0,
      hasShownFirstModal: parsed.hasShownFirstModal ?? false,
    };
  } catch {
    return { ...DEFAULT_PERSISTED_STATE };
  }
}

export const [SupportModalProvider, useSupportModal] = createContextHook<SupportModalState>(() => {
  const [completedVersesCount, setCompletedVersesCount] = useState(0);
  const [hasDonated, setHasDonated] = useState(false);
  const [lastModalShownAtVerseCount, setLastModalShownAtVerseCount] = useState(0);
  const [hasShownFirstModal, setHasShownFirstModal] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pendingIncrementRef = useRef(Promise.resolve());

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(SUPPORT_MODAL_KEY);
      const state = parsePersistedState(stored);
      setCompletedVersesCount(state.completedVersesCount);
      setHasDonated(state.hasDonated);
      setLastModalShownAtVerseCount(state.lastModalShownAtVerseCount);
      setHasShownFirstModal(state.hasShownFirstModal);
    } catch (error) {
      console.error('[SupportModal] Error loading state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = async (updates: Partial<PersistedState>) => {
    try {
      const stored = await AsyncStorage.getItem(SUPPORT_MODAL_KEY);
      const currentState = parsePersistedState(stored);
      const newState: PersistedState = { ...currentState, ...updates };
      await AsyncStorage.setItem(SUPPORT_MODAL_KEY, JSON.stringify(newState));

      if (updates.completedVersesCount !== undefined) setCompletedVersesCount(updates.completedVersesCount);
      if (updates.hasDonated !== undefined) setHasDonated(updates.hasDonated);
      if (updates.lastModalShownAtVerseCount !== undefined) setLastModalShownAtVerseCount(updates.lastModalShownAtVerseCount);
      if (updates.hasShownFirstModal !== undefined) setHasShownFirstModal(updates.hasShownFirstModal);
    } catch (error) {
      console.error('[SupportModal] Error saving state:', error);
    }
  };



  const incrementCompletedVerses = async () => {
    let newCount = completedVersesCount;

    pendingIncrementRef.current = pendingIncrementRef.current.then(async () => {
      const stored = await AsyncStorage.getItem(SUPPORT_MODAL_KEY);
      const currentState = parsePersistedState(stored);
      newCount = currentState.completedVersesCount + 1;
      await saveState({ completedVersesCount: newCount });
      console.log('[SupportModal] Completed verses:', newCount);
    });

    await pendingIncrementRef.current;
    return newCount;
  };



  const markAsDonated = async () => {
    await saveState({
      hasDonated: true,
    });
    setShouldShowModal(false);
    console.log('[SupportModal] Marked as donated, will show every 200 verses');
  };

  const dismissModal = async () => {
    await saveState({ lastModalShownAtVerseCount: completedVersesCount });
    setShouldShowModal(false);
    console.log('[SupportModal] Modal dismissed at verse count:', completedVersesCount);
  };

  const checkAndShowModal = async (currentCount = completedVersesCount): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return false;
    }

    let rewardsSettings;

    try {
      rewardsSettings = await getRewardsSettings();
    } catch (error) {
      console.warn('[SupportModal] Unable to load rewards settings, skipping reminder check:', describeError(error));
      return false;
    }

    if (!rewardsSettings.supportReminderEnabled) {
      return false;
    }

    if (!hasShownFirstModal && currentCount >= 5) {
      console.log('[SupportModal] First modal: 5 verses completed');
      await saveState({ 
        hasShownFirstModal: true, 
        lastModalShownAtVerseCount: currentCount,
      });
      setShouldShowModal(true);
      return true;
    }

    if (hasShownFirstModal) {
      const interval = hasDonated ? 200 : 20;
      const versesSinceLastModal = currentCount - lastModalShownAtVerseCount;
      
      if (versesSinceLastModal >= interval) {
        console.log(`[SupportModal] Showing modal: ${interval} verses since last (donated: ${hasDonated})`);
        await saveState({ lastModalShownAtVerseCount: currentCount });
        setShouldShowModal(true);
        return true;
      }
    }

    return false;
  };

  return {
    shouldShowModal,
    completedVersesCount,
    hasDonated,
    lastModalShownAtVerseCount,
    incrementCompletedVerses,
    markAsDonated,
    dismissModal,
    checkAndShowModal,
    isLoading,
  };
});
