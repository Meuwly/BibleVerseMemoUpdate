import { useCallback, useEffect, useState } from 'react';

import type { TTSSettings, Verse } from '../../../../types/database';
import { speak, stop as stopTTS } from '../../../../utils/tts';

interface UseLearnTtsParams {
  verseData: Verse | null;
  language: string;
  ttsSettings: TTSSettings;
}

export function useLearnTts({ verseData, language, ttsSettings }: UseLearnTtsParams) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTTS = useCallback(async () => {
    if (!verseData) {
      return;
    }

    try {
      if (isSpeaking) {
        await stopTTS();
        setIsSpeaking(false);
        return;
      }

      setIsSpeaking(true);
      await speak(verseData.text, {
        language,
        speed: ttsSettings.speed,
        voiceIdentifier: ttsSettings.voiceIdentifier,
        onStart: () => {
          console.log('[TTS] Started reading verse');
        },
        onDone: () => {
          console.log('[TTS] Finished reading verse');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('[TTS] Error reading verse:', error);
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error('[TTS] Failed to toggle speech:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking, language, ttsSettings.speed, ttsSettings.voiceIdentifier, verseData]);

  useEffect(() => {
    setIsSpeaking(false);
  }, [verseData?.book, verseData?.chapter, verseData?.verse]);

  useEffect(() => () => {
    void stopTTS();
  }, []);

  return {
    isSpeaking,
    handleTTS,
  };
}
