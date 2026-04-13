import { Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { t } from '../../../../constants/translations';
import type { Language } from '../../../../types/database';

const CUSTOM_URL_TIMEOUT_MS = 10000;
const MAX_CUSTOM_BIBLE_SIZE = 5 * 1024 * 1024;

function isValidCustomBibleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface UseCustomVersionImportParams {
  uiLanguage: string;
  customUrl: string;
  setCustomUrl: (value: string) => void;
  setShowCustomVersionModal: (value: boolean) => void;
  setLanguage: (language: Language) => Promise<void>;
  setCustomVersionUrl: (name: string, content: string) => Promise<void>;
}

export function useCustomVersionImport({
  uiLanguage,
  customUrl,
  setCustomUrl,
  setShowCustomVersionModal,
  setLanguage,
  setCustomVersionUrl,
}: UseCustomVersionImportParams) {
  const handleImportCustomVersion = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      let fileContent = '';
      if (Platform.OS !== 'web') {
        const file = new File(result.assets[0].uri);
        fileContent = file.textSync();
      } else {
        const response = await fetch(result.assets[0].uri);
        fileContent = await response.text();
      }

      if (fileContent.length < 100) {
        Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'invalidFileFormat'));
        return;
      }

      const customVersionName = `CUSTOM_${Date.now()}`;
      await setCustomVersionUrl(customVersionName, fileContent);
      await setLanguage(customVersionName as Language);
      setShowCustomVersionModal(false);
      Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'customVersionImported'));
    } catch (error) {
      console.error('Error importing custom version:', error);
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'failedToImport'));
    }
  };

  const handleLoadFromUrl = async () => {
    const trimmedUrl = customUrl.trim();
    if (!trimmedUrl) {
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'pleaseEnterUrl'));
      return;
    }

    if (!isValidCustomBibleUrl(trimmedUrl)) {
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'validHttpsUrl'));
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), CUSTOM_URL_TIMEOUT_MS);

    try {
      const response = await fetch(trimmedUrl, { signal: abortController.signal });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && Number(contentLength) > MAX_CUSTOM_BIBLE_SIZE) {
        throw new Error('Remote file is too large');
      }

      const fileContent = await response.text();
      if (fileContent.length < 100 || fileContent.length > MAX_CUSTOM_BIBLE_SIZE) {
        Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'invalidFileFormat'));
        return;
      }

      const customVersionName = `CUSTOM_${Date.now()}`;
      await setCustomVersionUrl(customVersionName, fileContent);
      await setLanguage(customVersionName as Language);
      setShowCustomVersionModal(false);
      setCustomUrl('');
      Alert.alert(t(uiLanguage, 'success'), t(uiLanguage, 'customVersionImported'));
    } catch (error) {
      console.error('Error loading from URL:', error);
      Alert.alert(t(uiLanguage, 'error'), t(uiLanguage, 'failedToLoadUrl'));
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return {
    handleImportCustomVersion,
    handleLoadFromUrl,
  };
}
