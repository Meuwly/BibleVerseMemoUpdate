import { useEffect, useMemo, useState } from 'react';

import type { Language, TTSSettings, TTSVoice } from '../../../../types/database';
import { getLanguageCode, getVoicesForLanguage, speak } from '../../../../utils/tts';

interface UseSettingsTtsParams {
  language: Language;
  ttsSettings: TTSSettings;
  setTTSSettings: (value: Partial<TTSSettings>) => Promise<void>;
}

function getVoiceTestText(languageCode: string) {
  if (languageCode.startsWith('fr')) return 'Ceci est un test de la voix sélectionnée.';
  if (languageCode.startsWith('en')) return 'This is a test of the selected voice.';
  if (languageCode.startsWith('es')) return 'Esta es una prueba de la voz seleccionada.';
  if (languageCode.startsWith('de')) return 'Dies ist ein Test der ausgewählten Stimme.';
  if (languageCode.startsWith('it')) return 'Questo è un test della voce selezionata.';
  if (languageCode.startsWith('pt')) return 'Este é um teste da voz selecionada.';
  if (languageCode.startsWith('el')) return 'Αυτή είναι μια δοκιμή της επιλεγμένης φωνής.';
  if (languageCode.startsWith('he')) return 'זהו מבחן של הקול שנבחר.';
  return 'This is a test of the selected voice.';
}

export function useSettingsTts({ language, ttsSettings, setTTSSettings }: UseSettingsTtsParams) {
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  useEffect(() => {
    const loadVoices = async () => {
      setLoadingVoices(true);
      try {
        const languageCode = getLanguageCode(language);
        const voices = await getVoicesForLanguage(languageCode);
        setAvailableVoices(voices);
        console.log('[Settings] Loaded voices for', languageCode, ':', voices.length);
      } catch (error) {
        console.error('[Settings] Failed to load voices:', error);
        setAvailableVoices([]);
      } finally {
        setLoadingVoices(false);
      }
    };

    void loadVoices();
  }, [language]);

  const selectedVoice = useMemo(
    () => availableVoices.find((voice) => voice.identifier === ttsSettings.voiceIdentifier),
    [availableVoices, ttsSettings.voiceIdentifier],
  );

  const handleVoiceChange = async (voiceIdentifier: string | undefined) => {
    await setTTSSettings({ voiceIdentifier });
  };

  const testVoice = async (voiceIdentifier: string | undefined) => {
    const voiceLanguage = getLanguageCode(language);
    setTestingVoice(voiceIdentifier || 'default');

    try {
      await speak(getVoiceTestText(voiceLanguage), {
        language: voiceLanguage,
        speed: ttsSettings.speed,
        voiceIdentifier,
        onDone: () => setTestingVoice(null),
        onError: () => setTestingVoice(null),
      });
    } catch (error) {
      console.error('[Settings] Failed to test voice:', error);
      setTestingVoice(null);
    }
  };

  return {
    availableVoices,
    loadingVoices,
    testingVoice,
    selectedVoice,
    handleVoiceChange,
    testVoice,
  };
}
