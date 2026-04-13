import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import type { TTSVoice } from '../types/database';

export type TTSSpeed = 'slow' | 'normal' | 'fast';

const SPEED_VALUES: Record<TTSSpeed, number> = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.3,
};

const LANGUAGE_CODES: Record<string, string> = {
  'LSG': 'fr-FR',
  'FOB': 'fr-FR',
  'KJV': 'en-US',
  'ITADIO': 'it-IT',
  'CEI': 'it-IT',
  'RVA': 'es-ES',
  'spavbl': 'es-ES',
  'ELB71': 'de-DE',
  'ELB': 'de-DE',
  'LUTH1545': 'de-DE',
  'deu1912': 'de-DE',
  'deutkw': 'de-DE',
  'VULGATE': 'la',
  'TR1894': 'el-GR',
  'TR1550': 'el-GR',
  'WHNU': 'el-GR',
  'grm': 'el-GR',
  'WLC': 'he-IL',
  'heb': 'he-IL',
  'en': 'en-US',
  'fr': 'fr-FR',
  'fr-fob': 'fr-FR',
  'es': 'es-ES',
  'pt': 'pt-BR',
  'de': 'de-DE',
  'it': 'it-IT',
  'el': 'el-GR',
  'he': 'he-IL',
};

export function getLanguageCode(bibleVersion: string): string {
  // If it's a known bible version or short code, return the mapped language
  if (LANGUAGE_CODES[bibleVersion]) {
    return LANGUAGE_CODES[bibleVersion];
  }
  
  // If it already looks like a language code (e.g. fr-FR, en-US), return it
  if (/^[a-z]{2}-[A-Z]{2}$/.test(bibleVersion)) {
    return bibleVersion;
  }

  return 'en-US';
}

function detectGender(voiceName: string, identifier: string): 'male' | 'female' | 'unknown' {
  const name = (voiceName + ' ' + identifier).toLowerCase();
  
  const femaleIndicators = ['female', 'woman', 'girl', 'feminine', 'fem',
    'hortense', 'julie', 'amelie', 'marie', 'anna', 'sara', 'karen', 'moira', 'fiona', 'samantha',
    'zira', 'hazel', 'susan', 'linda', 'catherine', 'alice', 'elena', 'monica', 'lucia', 'paulina',
    'sabina', 'helena', 'ioana', 'carmit', 'milena', 'tessa', 'melina', 'yelda', 'damayanti',
    'lekha', 'mariska', 'ting-ting', 'sin-ji', 'mei-jia', 'kyoko', 'yuna', 'zosia',
    'virginie', 'celine', 'audrey', 'claire', 'denise', 'renee', 'genevieve', 'marguerite',
    'nathalie', 'sylvie', 'veronique', 'sophie', 'isabelle', 'camille', 'lea', 'emma', 'chloe',
    'aurelie', 'juliette', 'charlotte', 'manon', 'sarah', 'laura', 'marine', 'oceane', 'mathilde',
    'victoria', 'elizabeth', 'emily', 'olivia', 'ava', 'sophia', 'isabella', 'mia', 'abigail',
    'harper', 'evelyn', 'aria', 'scarlett', 'grace', 'penelope', 'riley', 'layla', 'zoey'];
  
  const maleIndicators = ['male', 'man', 'boy', 'masculine',
    'paul', 'thomas', 'david', 'daniel', 'mark', 'james', 'george', 'alex', 'luca', 'jorge',
    'diego', 'juan', 'rishi', 'maged', 'yuri', 'xander', 'aaron', 'fred', 'ralph', 'bruce',
    'pierre', 'jean', 'jacques', 'francois', 'antoine', 'nicolas', 'sebastien', 'christophe',
    'philippe', 'guillaume', 'mathieu', 'olivier', 'alexandre', 'benoit', 'cedric', 'damien',
    'emmanuel', 'fabien', 'gilles', 'henri', 'julien', 'laurent', 'marc', 'michel', 'pascal',
    'romain', 'stephane', 'vincent', 'yves', 'william', 'john', 'michael', 'robert', 'richard',
    'joseph', 'charles', 'christopher', 'matthew', 'anthony', 'steven', 'kevin', 'brian', 'eric',
    'hans', 'stefan', 'markus', 'andreas', 'wolfgang', 'dieter', 'klaus', 'helmut', 'uwe'];
  
  for (const indicator of femaleIndicators) {
    if (name.includes(indicator)) return 'female';
  }
  
  for (const indicator of maleIndicators) {
    if (name.includes(indicator)) return 'male';
  }
  
  return 'unknown';
}

export async function getVoicesForLanguage(languageCode: string): Promise<TTSVoice[]> {
  const langPrefix = languageCode.split('-')[0].toLowerCase();
  
  try {
    const systemVoices = await Speech.getAvailableVoicesAsync();
    console.log('[TTS] System voices count:', systemVoices.length);
    
    const filteredSystemVoices = systemVoices
      .filter(v => {
        if (!v.identifier || !v.language) return false;
        const voiceLang = v.language.toLowerCase();
        return voiceLang.startsWith(langPrefix) || voiceLang.includes(langPrefix);
      })
      .map((v, index) => {
        const displayName = v.name || v.identifier || `Voice ${index + 1}`;
        const gender = detectGender(displayName, v.identifier);
        return {
          identifier: v.identifier,
          name: displayName,
          language: v.language,
          gender,
        };
      });
    
    console.log('[TTS] Filtered system voices for', languageCode, ':', filteredSystemVoices.length);
    
    return filteredSystemVoices;
  } catch (error) {
    console.error('[TTS] Failed to get system voices:', error);
    return [];
  }
}

export function getSpeedValue(speed: TTSSpeed): number {
  return SPEED_VALUES[speed];
}

let isSpeakingGlobal = false;

export async function speak(
  text: string,
  options: {
    language: string;
    speed: TTSSpeed;
    voiceIdentifier?: string;
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let settled = false;

    const safeResolve = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    const safeReject = (error: Error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    try {
      if (!text || text.trim().length === 0) {
        console.warn('[TTS] Empty text provided, skipping speech');
        safeResolve();
        return;
      }

      if (isSpeakingGlobal) {
        await stop();
      }

      const languageCode = getLanguageCode(options.language);
      const rate = getSpeedValue(options.speed);

      console.log('[TTS] Speaking text with language:', languageCode, 'speed:', options.speed, 'voice:', options.voiceIdentifier || 'default');
      console.log('[TTS] Text length:', text.length, 'First 50 chars:', text.substring(0, 50));

      isSpeakingGlobal = true;

      const speechOptions: Speech.SpeechOptions = {
        language: languageCode,
        rate,
        pitch: 1.0,
        onStart: () => {
          console.log('[TTS] Started speaking');
          options.onStart?.();
        },
        onDone: () => {
          console.log('[TTS] Finished speaking');
          isSpeakingGlobal = false;
          options.onDone?.();
          safeResolve();
        },
        onError: (error) => {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('[TTS] Speech error:', errorMsg);
          console.error('[TTS] Language code:', languageCode);
          console.error('[TTS] Voice:', options.voiceIdentifier || speechOptions.voice || 'system default');
          console.error('[TTS] Text length:', text.length);
          
          isSpeakingGlobal = false;
          
          const friendlyError = new Error(
            errorMsg === 'Error' 
              ? `TTS failed for ${languageCode}. Voice may not be available.`
              : errorMsg
          );
          
          options.onError?.(friendlyError);
          safeReject(friendlyError);
        },
        onStopped: () => {
          console.log('[TTS] Stopped');
          isSpeakingGlobal = false;
          options.onDone?.();
          safeResolve();
        },
      };

      if (Platform.OS !== 'web') {
        try {
          const voices = await Speech.getAvailableVoicesAsync();
          console.log('[TTS] Total available voices:', voices.length);
          
          const targetLang = languageCode.toLowerCase().replace('_', '-');
          const targetPrefix = targetLang.split('-')[0];
          console.log('[TTS] Target language:', targetLang, 'Prefix:', targetPrefix);

          let selectedVoice = null;

          if (options.voiceIdentifier) {
            selectedVoice = voices.find(v => v.identifier === options.voiceIdentifier);
            if (selectedVoice) {
              console.log('[TTS] Using user-selected voice:', selectedVoice.identifier, selectedVoice.language);
              speechOptions.voice = selectedVoice.identifier;
            } else {
              console.warn('[TTS] User-selected voice not found:', options.voiceIdentifier);
            }
          }

          if (!selectedVoice) {
            console.log('[TTS] Looking for voice matching language:', targetLang);
            
            const matchingVoices = voices.filter(v => {
              const voiceLang = v.language.toLowerCase().replace('_', '-');
              return voiceLang.startsWith(targetPrefix) || voiceLang === targetLang;
            });
            
            console.log('[TTS] Found', matchingVoices.length, 'matching voices for', targetPrefix);
            matchingVoices.forEach(v => {
              console.log('[TTS]   -', v.identifier, v.language, v.name);
            });

            let bestVoice = matchingVoices.find(v => 
              v.language.toLowerCase().replace('_', '-') === targetLang
            );

            if (!bestVoice && matchingVoices.length > 0) {
              bestVoice = matchingVoices[0];
            }

            if (bestVoice) {
              console.log('[TTS] Auto-selected voice:', bestVoice.identifier, '(', bestVoice.language, ') for', languageCode);
              speechOptions.voice = bestVoice.identifier;
            } else {
              console.warn('[TTS] No matching voice found for', targetLang);
              
              if (voices.length === 0) {
                console.error('[TTS] No voices available on this device');
                throw new Error('No TTS voices available on this device');
              }
              
              const fallbackVoice = voices.find(v => 
                v.language.toLowerCase().startsWith('en') ||
                v.language.toLowerCase().includes('en-')
              ) || voices[0];
              
              if (fallbackVoice) {
                console.log('[TTS] Falling back to voice:', fallbackVoice.identifier, '(', fallbackVoice.language, ')');
                speechOptions.voice = fallbackVoice.identifier;
                speechOptions.language = fallbackVoice.language;
              } else {
                console.warn('[TTS] Using system default voice with target language');
              }
            }
          }
        } catch (e) {
          console.error('[TTS] Failed to select voice:', e);
        }
      }

      console.log('[TTS] Final speech options:', {
        language: speechOptions.language,
        voice: speechOptions.voice || 'system default',
        rate: speechOptions.rate,
        pitch: speechOptions.pitch,
      });

      Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('[TTS] Failed to speak:', error);
      isSpeakingGlobal = false;
      options.onError?.(error as Error);
      safeReject(error as Error);
    }
  });
}

export async function stop(): Promise<void> {
  try {
    await Speech.stop();
    isSpeakingGlobal = false;
    console.log('[TTS] Stopped all speech');
  } catch (error) {
    console.error('[TTS] Failed to stop:', error);
  }
}

