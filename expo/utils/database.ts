import type { Verse, Language } from '../types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookNames as canonicalBookNames } from '../constants/translations';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import localBibles from '../assets/books';

function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

const CUSTOM_VERSION_KEY = '@custom_version';
const ALL_BIBLES_PREFETCHED_KEY = '@all_bibles_prefetched_v1';
const CURSOR_WINDOW_ERROR_SNIPPET = 'cursorwindow';
const BIBLE_CACHE_FOLDER = 'bible-cache';

function debugLog(...args: unknown[]) {
  if (__DEV__) {
    console.log(...args);
  }
}

function isCursorWindowError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes(CURSOR_WINDOW_ERROR_SNIPPET);
}

async function getItemSafely(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    if (isCursorWindowError(error)) {
      console.warn(`[Database] AsyncStorage row too large for key ${key}. Removing corrupted/oversized cache entry.`);
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`[Database] Failed to remove oversized key ${key}:`, removeError);
      }
      return null;
    }

    throw error;
  }
}

const BIBLE_URLS: Record<Language, string> = {
  'ITADIO': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/ITADIO.txt',
  'CEI': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/CEI.txt',
  'RVA': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/RVA.txt',
  'spavbl': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/spavbl.txt',
  'ELB71': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/ELB71.txt',
  'ELB': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/ELB.txt',
  'LUTH1545': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/LUTH1545.txt',
  'deu1912': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/deu1912.txt',
  'deutkw': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/deutkw.txt',
  'VULGATE': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/VULGATE.txt',
  'FOB': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/FOB.txt',
  'LSG': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/LSG.txt',
  'darby': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/darby.txt',
  'DarbyR': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/DarbyR.txt',
  'KJV': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/KJV.txt',
  'TR1894': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/TR1894.txt',
  'TR1550': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/TR1550.txt',
  'WHNU': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/WHNU.txt',
  'grm': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/grm.txt',
  'WLC': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/WLC.txt',
  'heb': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/heb.txt',
  'nld': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/nld.txt',
  'AA': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/AA.txt',
  'PBG': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/PBG.txt',
  'RUSV': 'https://raw.githubusercontent.com/ChefTim0/bible4u/refs/heads/main/RUSV.txt',
};

const FALLBACK_BIBLE_URLS: Record<Language, string> = {
  'ITADIO': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/ITADIO.txt',
  'CEI': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/CEI.txt',
  'RVA': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/RVA.txt',
  'spavbl': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/spavbl.txt',
  'ELB71': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/ELB71.txt',
  'ELB': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/ELB.txt',
  'LUTH1545': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/LUTH1545.txt',
  'deu1912': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/deu1912.txt',
  'deutkw': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/deutkw.txt',
  'VULGATE': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/VULGATE.txt',
  'FOB': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/FOB.txt',
  'LSG': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/LSG.txt',
  'darby': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/darby.txt',
  'DarbyR': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/DarbyR.txt',
  'KJV': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/KJV.txt',
  'TR1894': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/TR1894.txt',
  'TR1550': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/TR1550.txt',
  'WHNU': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/WHNU.txt',
  'grm': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/grm.txt',
  'WLC': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/WLC.txt',
  'heb': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/heb.txt',
  'nld': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/nld.txt',
  'AA': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/AA.txt',
  'PBG': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/PBG.txt',
  'RUSV': 'https://gitlab.com/ChefTim0/bible4u/-/raw/main/RUSV.txt',
};


const SECONDARY_FALLBACK_BIBLE_URLS: Record<Language, string> = {
  'ITADIO': 'https://timprojects.online/bible-verse-memo/books/ITADIO.txt',
  'CEI': 'https://timprojects.online/bible-verse-memo/books/CEI.txt',
  'RVA': 'https://timprojects.online/bible-verse-memo/books/RVA.txt',
  'spavbl': 'https://timprojects.online/bible-verse-memo/books/spavbl.txt',
  'ELB71': 'https://timprojects.online/bible-verse-memo/books/ELB71.txt',
  'ELB': 'https://timprojects.online/bible-verse-memo/books/ELB.txt',
  'LUTH1545': 'https://timprojects.online/bible-verse-memo/books/LUTH1545.txt',
  'deu1912': 'https://timprojects.online/bible-verse-memo/books/deu1912.txt',
  'deutkw': 'https://timprojects.online/bible-verse-memo/books/deutkw.txt',
  'VULGATE': 'https://timprojects.online/bible-verse-memo/books/VULGATE.txt',
  'FOB': 'https://timprojects.online/bible-verse-memo/books/FOB.txt',
  'LSG': 'https://timprojects.online/bible-verse-memo/books/LSG.txt',
  'darby': 'https://timprojects.online/bible-verse-memo/books/darby.txt',
  'DarbyR': 'https://timprojects.online/bible-verse-memo/books/DarbyR.txt',
  'KJV': 'https://timprojects.online/bible-verse-memo/books/KJV.txt',
  'TR1894': 'https://timprojects.online/bible-verse-memo/books/TR1894.txt',
  'TR1550': 'https://timprojects.online/bible-verse-memo/books/TR1550.txt',
  'WHNU': 'https://timprojects.online/bible-verse-memo/books/WHNU.txt',
  'grm': 'https://timprojects.online/bible-verse-memo/books/grm.txt',
  'WLC': 'https://timprojects.online/bible-verse-memo/books/WLC.txt',
  'heb': 'https://timprojects.online/bible-verse-memo/books/heb.txt',
  'nld': 'https://timprojects.online/bible-verse-memo/books/nld.txt',
  'AA': 'https://timprojects.online/bible-verse-memo/books/AA.txt',
  'PBG': 'https://timprojects.online/bible-verse-memo/books/PBG.txt',
  'RUSV': 'https://timprojects.online/bible-verse-memo/books/RUSV.txt',
};

interface BookData {
  book: string;
  bookName: string;
  chapters: number;
}

interface VerseData {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface ParsedBible {
  books: BookData[];
  verses: Map<string, VerseData[]>;
}

const bibleCache: Map<Language, ParsedBible> = new Map();

function getBibleCacheFileUri(lang: Language): string | null {
  if (!FileSystem.documentDirectory) {
    return null;
  }

  return `${FileSystem.documentDirectory}${BIBLE_CACHE_FOLDER}/${lang}.txt`;
}

async function ensureBibleCacheDirectoryExists(): Promise<string | null> {
  if (!FileSystem.documentDirectory) {
    return null;
  }

  const directoryUri = `${FileSystem.documentDirectory}${BIBLE_CACHE_FOLDER}`;
  const info = await FileSystem.getInfoAsync(directoryUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }

  return directoryUri;
}

async function getCachedBibleText(lang: Language): Promise<string | null> {
  const fileUri = getBibleCacheFileUri(lang);
  if (!fileUri) {
    return null;
  }

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      return null;
    }

    const text = await FileSystem.readAsStringAsync(fileUri);
    return text || null;
  } catch (error) {
    console.warn(`[Database] Failed to read local cache for ${lang}:`, error);
    return null;
  }
}

async function setCachedBibleText(lang: Language, text: string): Promise<void> {
  const fileUri = getBibleCacheFileUri(lang);
  if (!fileUri) {
    return;
  }

  await ensureBibleCacheDirectoryExists();
  await FileSystem.writeAsStringAsync(fileUri, text);
}

async function loadBundledBibleText(lang: Language): Promise<string | null> {
  const assetModule = localBibles[lang];
  if (!assetModule) {
    return null;
  }

  try {
    const [asset] = await Asset.loadAsync(assetModule);
    if (!asset?.localUri) {
      return null;
    }

    const text = await FileSystem.readAsStringAsync(asset.localUri);
    return text || null;
  } catch (error) {
    console.warn(`[Database] Failed to load bundled asset for ${lang}:`, error);
    return null;
  }
}

async function downloadBibleText(lang: Language): Promise<string> {
  const primaryUrl = BIBLE_URLS[lang];
  if (!primaryUrl) {
    throw new Error(`No URL configured for language: ${lang}`);
  }

  const remoteSources = [
    { label: 'primary source', url: primaryUrl },
    { label: 'fallback source', url: FALLBACK_BIBLE_URLS[lang] },
    { label: 'secondary fallback source', url: SECONDARY_FALLBACK_BIBLE_URLS[lang] },
  ].filter((source): source is { label: string; url: string } => Boolean(source.url));

  const failures: string[] = [];

  for (const source of remoteSources) {
    try {
      debugLog(`[Database] Downloading ${lang}.txt from ${source.label}...`);
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      debugLog(`[Database] Successfully loaded from ${source.label}`);
      return text;
    } catch (error) {
      console.error(`[Database] ${source.label} failed:`, error);
      failures.push(`${source.label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Failed to fetch ${lang}.txt from allowed online sources only. ${failures.join(' | ')}`);
}

function getStandardBookKey(bookId: string): string {
  const normalized = bookId.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const mappings: Record<string, string> = {
    'gen': 'Gen', 'genese': 'Gen', 'genesis': 'Gen', 'genesi': 'Gen',
    'exod': 'Exod', 'exode': 'Exod', 'exodus': 'Exod', 'esodo': 'Exod',
    'lev': 'Lev', 'levitique': 'Lev', 'leviticus': 'Lev', 'levitico': 'Lev',
    'num': 'Num', 'nombres': 'Num', 'numbers': 'Num', 'numeri': 'Num',
    'deut': 'Deut', 'deuteronome': 'Deut', 'deuteronomy': 'Deut', 'deuteronomio': 'Deut',
    'josh': 'Josh', 'josue': 'Josh', 'joshua': 'Josh', 'giosue': 'Josh',
    'judg': 'Judg', 'juges': 'Judg', 'judges': 'Judg', 'giudici': 'Judg',
    'ruth': 'Ruth', 'rut': 'Ruth',
    '1-sam': '1Sam', '1sam': '1Sam', '1-samuel': '1Sam', '1samuel': '1Sam', '1-samuele': '1Sam',
    '2-sam': '2Sam', '2sam': '2Sam', '2-samuel': '2Sam', '2samuel': '2Sam', '2-samuele': '2Sam',
    '1-kgs': '1Kgs', '1kgs': '1Kgs', '1-rois': '1Kgs', '1rois': '1Kgs', '1-re': '1Kgs', '1re': '1Kgs',
    '2-kgs': '2Kgs', '2kgs': '2Kgs', '2-rois': '2Kgs', '2rois': '2Kgs', '2-re': '2Kgs', '2re': '2Kgs',
    '1-chr': '1Chr', '1chr': '1Chr', '1-chroniques': '1Chr', '1chroniques': '1Chr', '1-cronache': '1Chr',
    '2-chr': '2Chr', '2chr': '2Chr', '2-chroniques': '2Chr', '2chroniques': '2Chr', '2-cronache': '2Chr',
    'ezra': 'Ezra', 'esdras': 'Ezra',
    'neh': 'Neh', 'nehemie': 'Neh', 'nehemiah': 'Neh', 'neemia': 'Neh',
    'esth': 'Esth', 'esther': 'Esth', 'ester': 'Esth',
    'job': 'Job', 'giobbe': 'Job',
    'ps': 'Ps', 'psaumes': 'Ps', 'psalms': 'Ps', 'salmi': 'Ps',
    'prov': 'Prov', 'proverbes': 'Prov', 'proverbs': 'Prov', 'proverbi': 'Prov',
    'eccl': 'Eccl', 'ecclesiaste': 'Eccl', 'ecclesiastes': 'Eccl',
    'song': 'Song', 'cantique': 'Song', 'cantique-des-cantiques': 'Song', 'cantico': 'Song',
    'isa': 'Isa', 'esaie': 'Isa', 'isaie': 'Isa', 'isaiah': 'Isa', 'isaia': 'Isa',
    'jer': 'Jer', 'jeremie': 'Jer', 'jeremiah': 'Jer', 'geremia': 'Jer',
    'lam': 'Lam', 'lamentations': 'Lam', 'lamentazioni': 'Lam',
    'ezek': 'Ezek', 'ezechiel': 'Ezek', 'ezekiel': 'Ezek', 'ezechiele': 'Ezek',
    'dan': 'Dan', 'daniel': 'Dan', 'daniele': 'Dan',
    'hos': 'Hos', 'osee': 'Hos', 'hosea': 'Hos', 'osea': 'Hos',
    'joel': 'Joel', 'gioele': 'Joel',
    'amos': 'Amos',
    'obad': 'Obad', 'abdias': 'Obad', 'obadiah': 'Obad', 'abdia': 'Obad',
    'jonah': 'Jonah', 'jonas': 'Jonah', 'giona': 'Jonah',
    'mic': 'Mic', 'michee': 'Mic', 'micah': 'Mic', 'michea': 'Mic',
    'nah': 'Nah', 'nahum': 'Nah', 'naum': 'Nah',
    'hab': 'Hab', 'habacuc': 'Hab', 'habakkuk': 'Hab', 'abacuc': 'Hab',
    'zeph': 'Zeph', 'sophonie': 'Zeph', 'zephaniah': 'Zeph', 'sofonia': 'Zeph',
    'hag': 'Hag', 'aggee': 'Hag', 'haggai': 'Hag', 'aggeo': 'Hag',
    'zech': 'Zech', 'zacharie': 'Zech', 'zechariah': 'Zech', 'zaccaria': 'Zech',
    'mal': 'Mal', 'malachie': 'Mal', 'malachi': 'Mal', 'malachia': 'Mal',
    'matt': 'Matt', 'matthieu': 'Matt', 'matthew': 'Matt', 'matteo': 'Matt',
    'mark': 'Mark', 'marc': 'Mark', 'marco': 'Mark',
    'luke': 'Luke', 'luc': 'Luke', 'luca': 'Luke',
    'john': 'John', 'jean': 'John', 'giovanni': 'John',
    'acts': 'Acts', 'actes': 'Acts', 'actes-des-apotres': 'Acts', 'atti': 'Acts',
    'rom': 'Rom', 'romains': 'Rom', 'romans': 'Rom', 'romani': 'Rom',
    '1-cor': '1Cor', '1cor': '1Cor', '1-corinthiens': '1Cor', '1corinthiens': '1Cor', '1-corinzi': '1Cor',
    '2-cor': '2Cor', '2cor': '2Cor', '2-corinthiens': '2Cor', '2corinthiens': '2Cor', '2-corinzi': '2Cor',
    'gal': 'Gal', 'galates': 'Gal', 'galatians': 'Gal', 'galati': 'Gal',
    'eph': 'Eph', 'ephesiens': 'Eph', 'ephesians': 'Eph', 'efesini': 'Eph',
    'phil': 'Phil', 'philippiens': 'Phil', 'philippians': 'Phil', 'filippesi': 'Phil',
    'col': 'Col', 'colossiens': 'Col', 'colossians': 'Col', 'colossesi': 'Col',
    '1-thess': '1Thess', '1thess': '1Thess', '1-thessaloniciens': '1Thess', '1thessaloniciens': '1Thess',
    '2-thess': '2Thess', '2thess': '2Thess', '2-thessaloniciens': '2Thess', '2thessaloniciens': '2Thess',
    '1-tim': '1Tim', '1tim': '1Tim', '1-timothee': '1Tim', '1timothee': '1Tim', '1-timoteo': '1Tim',
    '2-tim': '2Tim', '2tim': '2Tim', '2-timothee': '2Tim', '2timothee': '2Tim', '2-timoteo': '2Tim',
    'titus': 'Titus', 'tite': 'Titus', 'tito': 'Titus',
    'phlm': 'Phlm', 'philemon': 'Phlm', 'filemone': 'Phlm',
    'heb': 'Heb', 'hebreux': 'Heb', 'hebrews': 'Heb', 'ebrei': 'Heb',
    'jas': 'Jas', 'jacques': 'Jas', 'james': 'Jas', 'giacomo': 'Jas',
    '1-pet': '1Pet', '1pet': '1Pet', '1-pierre': '1Pet', '1pierre': '1Pet', '1-pietro': '1Pet',
    '2-pet': '2Pet', '2pet': '2Pet', '2-pierre': '2Pet', '2pierre': '2Pet', '2-pietro': '2Pet',
    '1-john': '1John', '1john': '1John', '1-jean': '1John', '1jean': '1John', '1-giovanni': '1John',
    '2-john': '2John', '2john': '2John', '2-jean': '2John', '2jean': '2John', '2-giovanni': '2John',
    '3-john': '3John', '3john': '3John', '3-jean': '3John', '3jean': '3John', '3-giovanni': '3John',
    'jude': 'Jude', 'giuda': 'Jude',
    'rev': 'Rev', 'apocalypse': 'Rev', 'revelation': 'Rev', 'apocalisse': 'Rev',
  };
  
  return mappings[normalized] || 'unknown';
}

function getCanonicalBookName(standardKey: string, version: Language): string | null {
  let languageKey: string;
  
  if (version === 'darby' || version === 'DarbyR' || version === 'LSG' || version === 'FOB') {
    languageKey = 'fr';
  } else if (version === 'KJV') {
    languageKey = 'en';
  } else if (version === 'ITADIO' || version === 'CEI') {
    languageKey = 'it';
  } else if (version === 'RVA' || version === 'spavbl') {
    languageKey = 'es';
  } else if (version === 'ELB71' || version === 'ELB' || version === 'LUTH1545' || version === 'deu1912' || version === 'deutkw') {
    languageKey = 'de';
  } else if (version === 'VULGATE') {
    languageKey = 'la';
  } else if (version === 'TR1894' || version === 'TR1550' || version === 'WHNU' || version === 'grm') {
    languageKey = 'el';
  } else if (version === 'WLC' || version === 'heb') {
    languageKey = 'he';
  } else if (version === 'nld') {
    languageKey = 'nl';
  } else if (version === 'AA') {
    languageKey = 'pt';
  } else if (version === 'PBG') {
    languageKey = 'pl';
  } else if (version === 'RUSV') {
    languageKey = 'ru';
  } else {
    languageKey = 'fr';
  }
  
  const books = canonicalBookNames[languageKey as keyof typeof canonicalBookNames];
  return books?.[standardKey] || null;
}

async function parseBibleFile(lang: Language): Promise<ParsedBible> {
  if (bibleCache.has(lang)) {
    return bibleCache.get(lang)!;
  }

  try {
    let text = '';
    
    if (lang.startsWith('CUSTOM_')) {
      debugLog(`[Database] Loading custom version: ${lang}`);
      const customContentRaw = await getItemSafely(CUSTOM_VERSION_KEY);
      if (!customContentRaw) {
        throw new Error('Custom version content not found');
      }

      let customContent = customContentRaw;
      try {
        const parsed = JSON.parse(customContentRaw) as Record<string, string> | string;
        if (typeof parsed === 'object' && parsed !== null) {
          customContent = parsed[lang] || '';
        }
      } catch {
        // Keep backward compatibility with legacy plain-text storage format
      }

      if (!customContent) {
        throw new Error(`Custom version content not found for ${lang}`);
      }
      text = customContent;
    } else if (isRunningInExpoGo()) {
      // In Expo Go preview: ignore bundled assets, use cache or remote
      const cachedText = await getCachedBibleText(lang);
      if (cachedText) {
        debugLog(`[Database] [ExpoGo] Loaded ${lang}.txt from local cache.`);
        text = cachedText;
      } else {
        text = await downloadBibleText(lang);
        await setCachedBibleText(lang, text);
      }
    } else {
      // Standalone build: prefer bundled assets or cache, fall back to network download
      const bundledText = await loadBundledBibleText(lang);
      if (bundledText) {
        debugLog(`[Database] Loaded ${lang}.txt from bundled asset.`);
        text = bundledText;
      } else {
        const cachedText = await getCachedBibleText(lang);
        if (cachedText) {
          debugLog(`[Database] Loaded ${lang}.txt from local cache.`);
          text = cachedText;
        } else {
          // No bundled or cached text — attempt network download as last resort
          debugLog(`[Database] No offline data for ${lang}, attempting network download...`);
          text = await downloadBibleText(lang);
          await setCachedBibleText(lang, text);
        }
      }
    }
    debugLog(`[Database] Downloaded ${text.length} characters`);
    debugLog(`[Database] Downloaded content length preview: ${Math.min(text.length, 500)} chars`);
    
    const lines = text.split('\n');
    debugLog(`[Database] Total lines: ${lines.length}`);
    const books: BookData[] = [];
    const verses: Map<string, VerseData[]> = new Map();
    
    let currentBook = '';
    let maxChapter = 0;
    const bookChapters: Map<string, number> = new Map();
    const bookNames: Map<string, string> = new Map();
    let matchedLines = 0;
    let skippedLines = 0;
    
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let match = line.match(/^(.+?)\.(\d+):(\d+)\s+(.*)$/);
      
      if (!match) {
        match = line.match(/^([^\d]+?)\s+(\d+):(\d+)\s+(.*)$/);
      }
      
      if (!match) {
        match = line.match(/^(.+?)\s+(\d+):(\d+)\s+(.*)$/);
      }
      
      if (!match) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const lastPart = parts[parts.length - 1];
          const verseParts = lastPart.match(/^(\d+):(\d+)$/);
          if (verseParts) {
            const bookName = parts.slice(0, -1).join(' ');
            const restOfLine = '';
            match = [line, bookName, verseParts[1], verseParts[2], restOfLine];
          }
        }
      }
      
      if (!match) {
        const colonMatch = line.match(/(\d+):(\d+)/);
        if (colonMatch) {
          const colonIndex = line.indexOf(colonMatch[0]);
          const bookName = line.substring(0, colonIndex).trim();
          const chapter = colonMatch[1];
          const verse = colonMatch[2];
          const afterColon = line.substring(colonIndex + colonMatch[0].length).trim();
          match = [line, bookName, chapter, verse, afterColon];
        }
      }
      
      if (match) {
        matchedLines++;
        const bookAbbrev = match[1].trim();
        const chapter = parseInt(match[2]);
        const verseNum = parseInt(match[3]);
        const verseText = match[4].trim();
        
        if (matchedLines <= 3) {
          debugLog(`[Database] Line ${i} matched:`, { bookAbbrev, chapter, verseNum, textPreview: verseText.substring(0, 50) });
        }
        
        const bookId = bookAbbrev.toLowerCase()
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        const standardKey = getStandardBookKey(bookId);
        
        if (standardKey !== currentBook) {
          if (currentBook) {
            bookChapters.set(currentBook, maxChapter);
          }
          currentBook = standardKey;
          
          const canonicalName = getCanonicalBookName(standardKey, lang);
          bookNames.set(standardKey, canonicalName || bookAbbrev);
          debugLog(`[Database] Found book: ${bookId} -> standardKey: ${standardKey} -> "${canonicalName || bookAbbrev}" (version: ${lang})`);
          
          maxChapter = 0;
        }
        
        const standardKey2 = getStandardBookKey(bookId);
        
        if (chapter > maxChapter) {
          maxChapter = chapter;
        }
        
        const cacheKey = `${standardKey2}-${chapter}`;
        if (!verses.has(cacheKey)) {
          verses.set(cacheKey, []);
        }
        
        verses.get(cacheKey)!.push({
          book: standardKey2,
          chapter,
          verse: verseNum,
          text: verseText,
        });
      } else {
        skippedLines++;
        if (skippedLines <= 10) {
          debugLog(`[Database] Line ${i} skipped (no match):`, JSON.stringify(line.substring(0, 150)));
        }
        
      }
    }
    
    if (currentBook) {
      bookChapters.set(currentBook, maxChapter);
    }
    
    bookChapters.forEach((chapters, bookId) => {
      const bookName = bookNames.get(bookId) || bookId;
      
      books.push({
        book: bookId,
        bookName: bookName,
        chapters,
      });
    });
    
    debugLog(`[Database] Parsing complete:`);
    debugLog(`  - Matched lines: ${matchedLines}`);
    debugLog(`  - Skipped lines: ${skippedLines}`);
    debugLog(`  - Books found: ${books.length}`);
    debugLog(`  - Chapters cached: ${verses.size}`);
    debugLog(`  - Book list:`, books.map(b => `${b.book}(${b.chapters}ch)`).join(', '));
    
    if (books.length === 0) {
      console.error('[Database] WARNING: No books were parsed!');
    }
    
    const parsed = { books, verses };
    bibleCache.set(lang, parsed);
    return parsed;
  } catch (error) {
    console.error('[Database] Error parsing Bible file:', error);
    throw error;
  }
}

export async function preloadAllBiblesIfNeeded(): Promise<void> {
  // Remote prefetching is only needed in Expo Go where bundled assets are ignored
  if (!isRunningInExpoGo()) {
    return;
  }

  try {
    const alreadyPrefetched = await AsyncStorage.getItem(ALL_BIBLES_PREFETCHED_KEY);
    if (alreadyPrefetched === 'true') {
      return;
    }

    const languages = Object.keys(BIBLE_URLS) as Language[];
    let allSucceeded = true;

    for (const lang of languages) {
      const cachedText = await getCachedBibleText(lang);
      if (cachedText) {
        continue;
      }

      try {
        const text = await downloadBibleText(lang);
        await setCachedBibleText(lang, text);
      } catch (error) {
        allSucceeded = false;
        console.error(`[Database] Failed to prefetch ${lang}.txt:`, error);
      }
    }

    if (allSucceeded) {
      await AsyncStorage.setItem(ALL_BIBLES_PREFETCHED_KEY, 'true');
    }
  } catch (error) {
    console.error('[Database] Failed to prefetch all bibles:', error);
  }
}

async function fetchBooks(lang: Language): Promise<BookData[]> {
  const bible = await parseBibleFile(lang);
  return bible.books;
}

async function fetchVerses(lang: Language, book: string, chapter: number): Promise<VerseData[]> {
  const bible = await parseBibleFile(lang);
  const cacheKey = `${book}-${chapter}`;
  return bible.verses.get(cacheKey) || [];
}

export async function getBooks(lang: Language): Promise<string[]> {
  const books = await fetchBooks(lang);
  return books.map(book => book.book);
}

export async function getChapters(lang: Language, book: string): Promise<number[]> {
  const books = await fetchBooks(lang);
  const bookData = books.find(b => b.book === book);
  
  if (!bookData) {
    throw new Error(`Book ${book} not found`);
  }
  
  return Array.from({ length: bookData.chapters }, (_, i) => i + 1);
}

export async function getVerses(lang: Language, book: string, chapter: number): Promise<Verse[]> {
  const verses = await fetchVerses(lang, book, chapter);
  return verses;
}

export async function getVerse(lang: Language, book: string, chapter: number, verseNum: number): Promise<Verse | null> {
  const verses = await fetchVerses(lang, book, chapter);
  const verse = verses.find(v => v.verse === verseNum);
  return verse || null;
}

export async function getRandomVerse(lang: Language): Promise<Verse | null> {
  const books = await fetchBooks(lang);
  
  if (books.length === 0) {
    return null;
  }
  
  const randomBook = books[Math.floor(Math.random() * books.length)];
  const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
  
  const verses = await fetchVerses(lang, randomBook.book, randomChapter);
  
  if (verses.length === 0) {
    return null;
  }
  
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];
  return randomVerse;
}



const NEW_TESTAMENT_PATTERNS = [
  'matt', 'matth', 'matthieu', 'mateo', 'matteo',
  'marc', 'mark', 'marcos', 'marco',
  'luc', 'luke', 'lucas', 'luca',
  'jean', 'john', 'juan', 'giovanni', 'joh',
  'act', 'actes', 'hechos', 'atti',
  'rom', 'romains', 'romanos', 'romani',
  'cor', 'corinth', 'corintios', 'corinzi',
  'gal', 'galat',
  'eph', 'ephes', 'efes',
  'phil', 'philip', 'filipenses', 'filippesi',
  'col', 'coloss',
  'thess', 'tesal', 'tessalon',
  'tim', 'timoth', 'timoteo',
  'tit', 'tite', 'tito',
  'philem', 'filem',
  'heb', 'hebr', 'hebreux', 'ebrei',
  'jacq', 'jam', 'james', 'santiago', 'giacomo',
  'pier', 'pet', 'pedro', 'pietro',
  'jude', 'judas', 'giuda',
  'apoc', 'rev', 'revel', 'apocal', 'apocalypse',
];

function isNewTestamentBook(bookId: string): boolean {
  const normalized = bookId.toLowerCase();
  return NEW_TESTAMENT_PATTERNS.some(pattern => normalized.includes(pattern));
}

export async function getRandomNewTestamentVerse(lang: Language): Promise<Verse | null> {
  const books = await fetchBooks(lang);
  
  const ntBooks = books.filter(b => isNewTestamentBook(b.book));
  
  if (ntBooks.length === 0) {
    debugLog('[Database] No NT books found, falling back to all books');
    return getRandomVerse(lang);
  }
  
  debugLog('[Database] NT books found:', ntBooks.map(b => b.book).join(', '));
  
  const randomBook = ntBooks[Math.floor(Math.random() * ntBooks.length)];
  const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
  
  const verses = await fetchVerses(lang, randomBook.book, randomChapter);
  
  if (verses.length === 0) {
    return null;
  }
  
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];
  return randomVerse;
}

export async function getRandomOldTestamentVerse(lang: Language): Promise<Verse | null> {
  const books = await fetchBooks(lang);
  
  const otBooks = books.filter(b => !isNewTestamentBook(b.book));
  
  if (otBooks.length === 0) {
    debugLog('[Database] No OT books found, falling back to all books');
    return getRandomVerse(lang);
  }
  
  debugLog('[Database] OT books found:', otBooks.map(b => b.book).join(', '));
  
  const randomBook = otBooks[Math.floor(Math.random() * otBooks.length)];
  const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
  
  const verses = await fetchVerses(lang, randomBook.book, randomChapter);
  
  if (verses.length === 0) {
    return null;
  }
  
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];
  return randomVerse;
}
