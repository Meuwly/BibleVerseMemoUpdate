import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Modal, Animated, ScrollView, useWindowDimensions, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Shuffle, RefreshCw, X, BookOpen, Check, ChevronDown } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../../contexts/AppContext";
import { getBooks, getRandomNewTestamentVerse, getRandomOldTestamentVerse, getRandomVerse } from "../../utils/database";
import { getCuratedVerse } from "../../utils/curatedVerses";
import { t, getBookName, getLanguageFromBibleVersion } from "../../constants/translations";
import { getColors, getThemeBackgroundGradient, getThemeButtonGradient, themeColors } from "../../constants/colors";
import { THEME_OPTIONS } from "../../constants/themeOptions";
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Verse, Language, TTSVoice, TTSSpeed, Theme } from "../../types/database";
import { LANGUAGES } from "../../constants/languages";
import { getLanguageCode, getVoicesForLanguage, speak, stop } from "../../utils/tts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ONBOARDING_KEY = '@onboarding_completed';
const GUIDED_TOUR_KEY = '@guided_tour_completed';
const HERO_CARD_BASE_MARGIN_TOP = 22;
const NEW_TESTAMENT_BOOKS = new Set([
  'Matt',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Rom',
  '1Cor',
  '2Cor',
  'Gal',
  'Eph',
  'Phil',
  'Col',
  '1Thess',
  '2Thess',
  '1Tim',
  '2Tim',
  'Titus',
  'Phlm',
  'Heb',
  'Jas',
  '1Pet',
  '2Pet',
  '1John',
  '2John',
  '3John',
  'Jude',
  'Rev',
]);

export default function BooksScreen() {
  const { language, uiLanguage, theme, appearanceSettings, hasHandledStartupVerse, markStartupVerseHandled, setLanguage, setTheme, ttsSettings, setTTSSettings, isLoading: isAppLoading } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [books, setBooks] = useState<string[]>([]);
  const [bookNames, setBookNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<Language>(language);
  const [pendingTheme, setPendingTheme] = useState<Theme>(theme);
  const [pendingVoice, setPendingVoice] = useState<string | undefined>(ttsSettings.voiceIdentifier);
  const [pendingSpeed, setPendingSpeed] = useState<TTSSpeed>(ttsSettings.speed);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [guidedTourStepIndex, setGuidedTourStepIndex] = useState(0);
  const [booksSortOrder, setBooksSortOrder] = useState<'alphabetical' | 'ot-first' | 'nt-first'>('ot-first');
  const [booksSearchQuery, setBooksSearchQuery] = useState('');
  
  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);
  const [dailyVerseBookName, setDailyVerseBookName] = useState<string>('');
  const [showDailyVerse, setShowDailyVerse] = useState(false);
  const [showTestamentPicker, setShowTestamentPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pickerFadeAnim = useRef(new Animated.Value(0)).current;
  const onboardingLanguage = getLanguageFromBibleVersion(pendingLanguage);
  const activeTheme = showOnboarding ? pendingTheme : theme;
  const colors = getColors(activeTheme);
  const backgroundGradient = getThemeBackgroundGradient(activeTheme);
  const buttonGradient = getThemeButtonGradient(activeTheme);
  const randomButtonIconColor = activeTheme === 'neon' ? '#0B102B' : '#FFFFFF';
  const booksOrderIndex = useMemo(() => Object.fromEntries(books.map((book, index) => [book, index])), [books]);
  const latestBooksRequestRef = useRef<string | null>(null);
  const selectedOnboardingVoice = useMemo(
    () => availableVoices.find((voice) => voice.identifier === pendingVoice),
    [availableVoices, pendingVoice]
  );
  const selectedOnboardingTheme = useMemo(
    () => THEME_OPTIONS.find((option) => option.value === pendingTheme),
    [pendingTheme]
  );
  const onboardingModalPaddingTop = Math.max(insets.top + 12, 20);
  const onboardingModalPaddingBottom = Math.max(insets.bottom + 12, 20);
  const onboardingCardMaxHeight = Math.max(320, windowHeight - onboardingModalPaddingTop - onboardingModalPaddingBottom);
  const guidedTourSteps = useMemo(
    () => ([
      {
        title: t(uiLanguage, 'guidedTourWelcomeTitle'),
        description: t(uiLanguage, 'guidedTourWelcomeDescription'),
      },
      {
        title: t(uiLanguage, 'guidedTourPracticeTitle'),
        description: t(uiLanguage, 'guidedTourPracticeDescription'),
      },
      {
        title: t(uiLanguage, 'guidedTourProgressTitle'),
        description: t(uiLanguage, 'guidedTourProgressDescription'),
      },
      {
        title: t(uiLanguage, 'guidedTourSettingsTitle'),
        description: t(uiLanguage, 'guidedTourSettingsDescription'),
      },
    ]),
    [uiLanguage]
  );
  const activeGuidedTourStep = guidedTourSteps[guidedTourStepIndex];

  const getAlphabeticalSortKey = useCallback((bookId: string) => {
    const displayName = (bookNames[bookId] || bookId).trim();
    const match = displayName.match(/^(\d+)\s+(.+)$/);

    if (!match) {
      return {
        baseName: displayName,
        numericPrefix: Number.POSITIVE_INFINITY,
      };
    }

    return {
      baseName: match[2],
      numericPrefix: Number.parseInt(match[1], 10),
    };
  }, [bookNames]);

  const sortedBooks = useMemo(() => {
    if (booksSortOrder === 'alphabetical') {
      return [...books].sort((a, b) => {
        const aKey = getAlphabeticalSortKey(a);
        const bKey = getAlphabeticalSortKey(b);

        const byBaseName = aKey.baseName.localeCompare(bKey.baseName, undefined, { sensitivity: 'base' });
        if (byBaseName !== 0) {
          return byBaseName;
        }

        if (aKey.numericPrefix !== bKey.numericPrefix) {
          return aKey.numericPrefix - bKey.numericPrefix;
        }

        return (bookNames[a] || a).localeCompare(bookNames[b] || b, undefined, { sensitivity: 'base' });
      });
    }

    const preferNewTestament = booksSortOrder === 'nt-first';
    return [...books].sort((a, b) => {
      const aIsNew = NEW_TESTAMENT_BOOKS.has(a);
      const bIsNew = NEW_TESTAMENT_BOOKS.has(b);
      if (aIsNew !== bIsNew) {
        return preferNewTestament ? (aIsNew ? -1 : 1) : (aIsNew ? 1 : -1);
      }
      return (booksOrderIndex[a] ?? 0) - (booksOrderIndex[b] ?? 0);
    });
  }, [bookNames, books, booksOrderIndex, booksSortOrder, getAlphabeticalSortKey]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = booksSearchQuery.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return sortedBooks;
    }

    return sortedBooks.filter((bookId) => {
      const localizedName = bookNames[bookId] || bookId;
      return (
        localizedName.toLocaleLowerCase().includes(normalizedQuery) ||
        bookId.toLocaleLowerCase().includes(normalizedQuery)
      );
    });
  }, [bookNames, booksSearchQuery, sortedBooks]);

  const oldTestamentCount = useMemo(() => books.filter((book) => !NEW_TESTAMENT_BOOKS.has(book)).length, [books]);
  const newTestamentCount = useMemo(() => books.filter((book) => NEW_TESTAMENT_BOOKS.has(book)).length, [books]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (isAppLoading) {
        return;
      }
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!completed) {
          setPendingLanguage(language);
          setPendingTheme(theme);
          setPendingVoice(ttsSettings.voiceIdentifier);
          setPendingSpeed(ttsSettings.speed);
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('[BooksScreen] Error checking onboarding:', error);
      } finally {
        setIsOnboardingChecked(true);
      }
    };
    checkOnboarding();
  }, [isAppLoading, language, theme, ttsSettings.speed, ttsSettings.voiceIdentifier]);

  useEffect(() => {
    const loadVoices = async () => {
      if (!showOnboarding) {
        return;
      }
      setIsLoadingVoices(true);
      const langCode = getLanguageCode(pendingLanguage);
      const voices = await getVoicesForLanguage(langCode);
      setAvailableVoices(voices);
      setIsLoadingVoices(false);
    };
    loadVoices();
  }, [pendingLanguage, showOnboarding]);

  useEffect(() => {
    if (!showOnboarding) {
      stop();
      setIsTestingVoice(false);
      setShowThemePicker(false);
      setShowVoicePicker(false);
    }
  }, [showOnboarding]);

  const loadBooks = useCallback(async () => {
    if (isAppLoading) {
      return;
    }

    const requestKey = `${language}-${uiLanguage}-${Date.now()}`;
    latestBooksRequestRef.current = requestKey;

    setIsLoading(true);
    setError(null);
    try {
      console.log('[BooksScreen] Loading books for language:', language);
      const booksList = await getBooks(language);
      console.log('[BooksScreen] Books loaded:', booksList.length, booksList);
      
      const names: Record<string, string> = {};
      for (const bookId of booksList) {
        const name = getBookName(uiLanguage, bookId);
        console.log('[BooksScreen] Book name:', bookId, '->', name);
        names[bookId] = name;
      }
      console.log('[BooksScreen] All book names loaded:', names);

      if (latestBooksRequestRef.current !== requestKey) {
        console.log('[BooksScreen] Ignoring stale books response for', requestKey);
        return;
      }

      setBookNames(names);
      setBooks(booksList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BooksScreen] Error loading books:', errorMessage, error);
      setError(errorMessage);
    } finally {
      if (latestBooksRequestRef.current === requestKey) {
        setIsLoading(false);
      }
    }
  }, [isAppLoading, language, uiLanguage]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const openDailyVerseModal = useCallback(() => {
    setShowDailyVerse(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    const loadDailyVerse = async () => {
      if (!isOnboardingChecked || showOnboarding) {
        return;
      }
      if (hasHandledStartupVerse) {
        return;
      }
      markStartupVerseHandled();
      try {
        if (appearanceSettings.showStartupVerse === false) {
          console.log('[BooksScreen] Startup verse disabled in settings');
          return;
        }
        const isCurated = appearanceSettings.startupVerseMode === 'curated';
        console.log(`[BooksScreen] Loading ${isCurated ? 'curated' : 'random NT'} verse...`);
        let verse = isCurated
          ? await getCuratedVerse(language)
          : await getRandomNewTestamentVerse(language);
        if (!verse) {
          console.log('[BooksScreen] Primary fetch failed, falling back to random verse...');
          verse = await getRandomVerse(language);
        }
        if (verse) {
          console.log('[BooksScreen] Daily verse loaded:', verse.book, verse.chapter, verse.verse);
          setDailyVerse(verse);
          const bookNameStr = getBookName(uiLanguage, verse.book);
          setDailyVerseBookName(bookNameStr);
          openDailyVerseModal();
        }
      } catch (err) {
        console.error('[BooksScreen] Error loading daily verse:', err);
      }
    };
    loadDailyVerse();
  }, [appearanceSettings.showStartupVerse, hasHandledStartupVerse, isOnboardingChecked, language, markStartupVerseHandled, openDailyVerseModal, showOnboarding, uiLanguage]);

  useEffect(() => {
    const checkGuidedTour = async () => {
      if (isAppLoading || !isOnboardingChecked || showOnboarding) {
        return;
      }

      try {
        const completed = await AsyncStorage.getItem(GUIDED_TOUR_KEY);
        if (!completed) {
          setGuidedTourStepIndex(0);
          setShowGuidedTour(true);
        }
      } catch (error) {
        console.error('[BooksScreen] Error checking guided tour:', error);
      }
    };

    checkGuidedTour();
  }, [isAppLoading, isOnboardingChecked, showOnboarding]);

  const handleOnboardingDone = async () => {
    await stop();
    setIsTestingVoice(false);
    await setLanguage(pendingLanguage);
    await setTheme(pendingTheme);
    await setTTSSettings({ speed: pendingSpeed, voiceIdentifier: pendingVoice });
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const closeGuidedTour = useCallback(async () => {
    await AsyncStorage.setItem(GUIDED_TOUR_KEY, 'true');
    setShowGuidedTour(false);
    setGuidedTourStepIndex(0);
  }, []);

  const handleGuidedTourNext = useCallback(async () => {
    if (guidedTourStepIndex >= guidedTourSteps.length - 1) {
      await closeGuidedTour();
      return;
    }

    setGuidedTourStepIndex((current) => current + 1);
  }, [closeGuidedTour, guidedTourStepIndex, guidedTourSteps.length]);

  const handleTestVoice = useCallback(async () => {
    if (isTestingVoice) {
      await stop();
      setIsTestingVoice(false);
      return;
    }

    const sampleText = t(onboardingLanguage, 'onboardingTtsSample');
    await speak(sampleText, {
      language: pendingLanguage,
      speed: pendingSpeed,
      voiceIdentifier: pendingVoice,
      onStart: () => setIsTestingVoice(true),
      onDone: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false),
    });
  }, [isTestingVoice, onboardingLanguage, pendingLanguage, pendingSpeed, pendingVoice]);

  const closeOnboardingThemePicker = useCallback(() => {
    setShowThemePicker(false);
  }, []);

  const closeOnboardingVoicePicker = useCallback(() => {
    setShowVoicePicker(false);
  }, []);

  const closeDailyVerse = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDailyVerse(false);
    });
  };

  const learnDailyVerse = () => {
    if (dailyVerse) {
      closeDailyVerse();
      setTimeout(() => {
        router.push({
          pathname: '/learn/[book]/[chapter]/[verse]' as any,
          params: {
            book: dailyVerse.book,
            chapter: dailyVerse.chapter.toString(),
            verse: dailyVerse.verse.toString(),
            fromRandom: 'true',
          },
        });
      }, 250);
    }
  };

  const handleBookPress = (book: string) => {
    console.log('[BooksScreen] Navigating to book:', book);
    router.push({ pathname: '/book/[book]' as any, params: { book } });
  };

  const openTestamentPicker = () => {
    setShowTestamentPicker(true);
    Animated.timing(pickerFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeTestamentPicker = () => {
    Animated.timing(pickerFadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowTestamentPicker(false);
    });
  };

  const handleRandomVerseFromTestament = async (testament: 'old' | 'new') => {
    closeTestamentPicker();
    try {
      const verse = testament === 'old' 
        ? await getRandomOldTestamentVerse(language)
        : await getRandomNewTestamentVerse(language);
      if (verse) {
        router.push({ 
          pathname: '/learn/[book]/[chapter]/[verse]' as any, 
          params: { 
            book: verse.book, 
            chapter: verse.chapter.toString(), 
            verse: verse.verse.toString(),
            fromRandom: 'true',
          } 
        });
      }
    } catch (error) {
      console.error('Error getting random verse:', error);
    }
  };



  if (isLoading) {
    return (
      <View style={styles.holyLoadingRoot}>
        <LinearGradient
          colors={[colors.background, colors.primary + '18', colors.background]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.holyLoadingContent}>
          <View style={styles.holyLoadingCrossContainer}>
            <View style={[styles.holyLoadingCrossVertical, { backgroundColor: colors.primary + '30' }]} />
            <View style={[styles.holyLoadingCrossHorizontal, { backgroundColor: colors.primary + '30' }]} />
          </View>
          <View style={[styles.holyLoadingGlow, { backgroundColor: colors.primary + '10' }]} />
          <Text style={[styles.holyLoadingQuote, { color: colors.text }]}>
            {t(uiLanguage, 'loadingHolyQuote')}
          </Text>
          <Text style={[styles.holyLoadingReference, { color: colors.primary }]}>
            {t(uiLanguage, 'loadingHolyReference')}
          </Text>
          <View style={styles.holyLoadingDivider}>
            <View style={[styles.holyLoadingDividerLine, { backgroundColor: colors.primary + '30' }]} />
            <View style={[styles.holyLoadingDividerDot, { backgroundColor: colors.primary + '50' }]} />
            <View style={[styles.holyLoadingDividerLine, { backgroundColor: colors.primary + '30' }]} />
          </View>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.holyLoadingSubtitle, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'loadingHolySubtitle')}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'books')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Failed to load Bible data</Text>
          <Text style={[styles.errorDetails, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: buttonGradient ? 'transparent' : colors.primary }]}
            onPress={loadBooks}
            activeOpacity={0.7}
          >
            {buttonGradient && <LinearGradient colors={[...buttonGradient]} style={styles.buttonGradientFill} />}
            <RefreshCw color="#FFFFFF" size={20} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {backgroundGradient && (
        <LinearGradient colors={[...backgroundGradient]} style={styles.backgroundGradient} />
      )}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.bookGridRow}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  marginTop: Math.max(insets.top + 8, HERO_CARD_BASE_MARGIN_TOP),
                },
              ]}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.headerCopy}>
                  <Text style={[styles.eyebrow, { color: colors.primary }]}>Bible Verse Memo</Text>
                  <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'books')}</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(uiLanguage, 'selectBook')}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.randomButton,
                    { backgroundColor: buttonGradient ? 'transparent' : colors.primary },
                  ]}
                  onPress={openTestamentPicker}
                  activeOpacity={0.8}
                >
                  {buttonGradient && <LinearGradient colors={[...buttonGradient]} style={styles.buttonGradientFill} />}
                  <Shuffle color={randomButtonIconColor} size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{books.length}</Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Livres</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{oldTestamentCount}</Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Ancien</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{newTestamentCount}</Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Nouveau</Text>
                </View>
              </View>

            </View>

            <View style={styles.sortSection}>
              <TextInput
                value={booksSearchQuery}
                onChangeText={setBooksSearchQuery}
                placeholder={t(uiLanguage, 'searchMemorizedPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.searchInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'sortBy')}
              </Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'alphabetical', label: t(uiLanguage, 'sortAlphabetical') },
                  { key: 'ot-first', label: t(uiLanguage, 'sortOldTestamentFirst') },
                  { key: 'nt-first', label: t(uiLanguage, 'sortNewTestamentFirst') },
                ].map((option) => {
                  const isSelected = booksSortOrder === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.sortOption,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setBooksSortOrder(option.key as typeof booksSortOrder)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.sortOptionText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        }
        renderItem={({ item, index }) => {
          const isNewTestament = NEW_TESTAMENT_BOOKS.has(item);
          const isOddTrailingCard = filteredBooks.length % 2 === 1 && index === filteredBooks.length - 1;
          const hasActiveSearch = booksSearchQuery.trim().length > 0;

          return (
            <TouchableOpacity
              style={[
                styles.bookCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
                isOddTrailingCard && !hasActiveSearch && styles.bookCardFullWidth,
              ]}
              onPress={() => handleBookPress(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.bookBadge, { backgroundColor: isNewTestament ? colors.primary + '14' : colors.warning + '14' }]}>
                <Text style={[styles.bookBadgeText, { color: isNewTestament ? colors.primary : colors.warning }]}>
                  {isNewTestament ? 'NT' : 'AT'}
                </Text>
              </View>
              <Text style={[styles.bookName, { color: colors.text }]}>{bookNames[item] || item}</Text>
              <Text style={[styles.bookMeta, { color: colors.textSecondary }]}>{isNewTestament ? 'New Testament' : 'Old Testament'}</Text>
            </TouchableOpacity>
          );
        }}
      />
      {filteredBooks.length === 0 && (
        <View style={styles.emptySearchState}>
          <Text style={[styles.emptySearchTitle, { color: colors.text }]}>Aucun livre trouvé</Text>
          <Text style={[styles.emptySearchSubtitle, { color: colors.textSecondary }]}>
            Essayez avec un autre mot-clé.
          </Text>
        </View>
      )}

      <Modal
        visible={showOnboarding}
        transparent
        animationType="fade"
      >
        <View
          style={[
            styles.modalOverlay,
            styles.onboardingOverlay,
            {
              paddingTop: onboardingModalPaddingTop,
              paddingBottom: onboardingModalPaddingBottom,
            },
          ]}
        >
          <View
            style={[
              styles.onboardingCard,
              {
                backgroundColor: colors.cardBackground,
                maxHeight: onboardingCardMaxHeight,
              },
            ]}
          >
            <Text style={[styles.onboardingTitle, { color: colors.text }]}>
              {t(onboardingLanguage, 'onboardingLanguageTitle')}
            </Text>
            <ScrollView contentContainerStyle={styles.onboardingBody} nestedScrollEnabled>
              <View style={styles.onboardingSection}>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <ScrollView
                    style={styles.onboardingLanguageList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {LANGUAGES.map((lang) => {
                      const isSelected = pendingLanguage === lang.code;
                      return (
                        <TouchableOpacity
                          key={lang.code}
                          style={[styles.onboardingLanguageItem, { borderBottomColor: colors.border }]}
                          onPress={() => setPendingLanguage(lang.code)}
                        >
                          <Text style={[styles.onboardingLanguageItemText, { color: colors.text }]}>{`${lang.flag} ${lang.name}`}</Text>
                          {isSelected ? <Check color={colors.primary} size={18} /> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.onboardingSection}>
                <Text style={[styles.onboardingSectionTitle, { color: colors.text }]}>
                  {t(onboardingLanguage, 'onboardingThemeTitle')}
                </Text>
                <Text style={[styles.onboardingSectionDescription, { color: colors.textSecondary }]}>
                  {t(onboardingLanguage, 'onboardingThemeDescription')}
                </Text>
                <TouchableOpacity
                  style={[styles.onboardingSelectButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowThemePicker(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.onboardingSelectButtonInfo}>
                    <Text style={[styles.onboardingSelectButtonLabel, { color: colors.textSecondary }]}>
                      {t(onboardingLanguage, 'theme')}
                    </Text>
                    <View style={styles.onboardingThemeValueRow}>
                      <View
                        style={[
                          styles.onboardingThemeSwatch,
                          { backgroundColor: themeColors[pendingTheme].primary },
                        ]}
                      />
                      <Text style={[styles.onboardingSelectButtonValue, { color: colors.text }]}>
                        {selectedOnboardingTheme ? t(onboardingLanguage, selectedOnboardingTheme.labelKey) : t(onboardingLanguage, 'theme')}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown color={colors.textSecondary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.onboardingSection}>
                <Text style={[styles.onboardingSectionTitle, { color: colors.text }]}>
                  {t(onboardingLanguage, 'ttsSpeed')}
                </Text>
                <View style={styles.ttsSpeedContainer}>
                  {(['slow', 'normal', 'fast'] as TTSSpeed[]).map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.ttsSpeedOption,
                        {
                          backgroundColor: pendingSpeed === speed ? colors.primary + '20' : colors.background,
                          borderColor: pendingSpeed === speed ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setPendingSpeed(speed)}
                    >
                      <Text style={[styles.ttsSpeedText, { color: pendingSpeed === speed ? colors.primary : colors.text }]}>
                        {t(onboardingLanguage, speed === 'slow' ? 'ttsSlow' : speed === 'normal' ? 'ttsNormal' : 'ttsFast')}
                      </Text>
                      {pendingSpeed === speed && <Check color={colors.primary} size={16} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.onboardingSection}>
                <Text style={[styles.onboardingSectionTitle, { color: colors.text }]}>
                  {t(onboardingLanguage, 'ttsVoice')}
                </Text>
                {isLoadingVoices ? (
                  <View style={[styles.voiceLoadingContainer, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.voiceLoadingText, { color: colors.textSecondary }]}>
                      {t(onboardingLanguage, 'ttsLoadingVoices')}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.onboardingSelectButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                    onPress={() => setShowVoicePicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.onboardingSelectButtonInfo}>
                      <Text style={[styles.onboardingSelectButtonLabel, { color: colors.textSecondary }]}>
                        {t(onboardingLanguage, 'ttsVoice')}
                      </Text>
                      <Text style={[styles.onboardingSelectButtonValue, { color: colors.text }]} numberOfLines={1}>
                        {selectedOnboardingVoice
                          ? `${selectedOnboardingVoice.name} • ${selectedOnboardingVoice.language}`
                          : t(onboardingLanguage, 'ttsDefaultVoice')}
                      </Text>
                    </View>
                    <ChevronDown color={colors.textSecondary} size={18} />
                  </TouchableOpacity>
                )}

                <Text style={[styles.onboardingSampleText, { color: colors.textSecondary }]}>
                  {t(onboardingLanguage, 'onboardingTtsSample')}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.onboardingTestButton,
                    {
                      backgroundColor: isTestingVoice ? colors.primary : colors.background,
                      borderColor: isTestingVoice ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={handleTestVoice}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.onboardingTestButtonText, { color: isTestingVoice ? '#FFFFFF' : colors.text }]}>
                    {t(onboardingLanguage, isTestingVoice ? 'onboardingTtsStop' : 'onboardingTtsTest')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.onboardingActionButton, { backgroundColor: buttonGradient ? 'transparent' : colors.primary }]}
                onPress={handleOnboardingDone}
              >
                {buttonGradient && <LinearGradient colors={[...buttonGradient]} style={styles.buttonGradientFill} />}
                <Text style={styles.onboardingActionButtonText}>{t(onboardingLanguage, 'finish')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGuidedTour}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.guidedTourCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.guidedTourHeader}>
              <Text style={[styles.guidedTourStepLabel, { color: colors.textSecondary }]}>
                {`${t(uiLanguage, 'guidedTourStepLabel')} ${guidedTourStepIndex + 1}/${guidedTourSteps.length}`}
              </Text>
              <TouchableOpacity onPress={closeGuidedTour} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.guidedTourSkipText, { color: colors.textSecondary }]}>
                  {t(uiLanguage, 'guidedTourSkip')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.guidedTourTitle, { color: colors.text }]}>
              {activeGuidedTourStep?.title}
            </Text>
            <Text style={[styles.guidedTourDescription, { color: colors.textSecondary }]}>
              {activeGuidedTourStep?.description}
            </Text>

            <View style={styles.guidedTourDotsRow}>
              {guidedTourSteps.map((_, index) => (
                <View
                  key={`guided-tour-dot-${index}`}
                  style={[
                    styles.guidedTourDot,
                    {
                      backgroundColor: index === guidedTourStepIndex ? colors.primary : colors.border,
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.guidedTourActionButton, { backgroundColor: colors.primary }]}
              onPress={handleGuidedTourNext}
              activeOpacity={0.85}
            >
              <Text style={styles.guidedTourActionButtonText}>
                {guidedTourStepIndex >= guidedTourSteps.length - 1
                  ? t(uiLanguage, 'guidedTourDone')
                  : t(uiLanguage, 'guidedTourNext')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showThemePicker}
        transparent
        animationType="fade"
        onRequestClose={closeOnboardingThemePicker}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeOnboardingThemePicker}
          />
          <View
            style={[
              styles.onboardingPickerCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.onboardingPickerTitle, { color: colors.text }]}>
              {t(onboardingLanguage, 'onboardingThemeTitle')}
            </Text>
            <ScrollView style={styles.onboardingPickerList} nestedScrollEnabled>
              {THEME_OPTIONS.map((option) => {
                const isSelected = pendingTheme === option.value;
                const optionColors = themeColors[option.value];

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.onboardingPickerItem,
                      {
                        backgroundColor: isSelected ? optionColors.primary + '18' : colors.background,
                        borderColor: isSelected ? optionColors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setPendingTheme(option.value);
                      closeOnboardingThemePicker();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.onboardingThemeValueRow}>
                      <View style={[styles.onboardingThemeSwatch, { backgroundColor: optionColors.primary }]} />
                      <Text
                        style={[
                          styles.onboardingPickerItemText,
                          { color: isSelected ? optionColors.primary : colors.text },
                        ]}
                      >
                        {t(onboardingLanguage, option.labelKey)}
                      </Text>
                    </View>
                    {isSelected ? <Check color={optionColors.primary} size={18} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVoicePicker}
        transparent
        animationType="fade"
        onRequestClose={closeOnboardingVoicePicker}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeOnboardingVoicePicker}
          />
          <View
            style={[
              styles.onboardingPickerCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.onboardingPickerTitle, { color: colors.text }]}>
              {t(onboardingLanguage, 'onboardingVoiceTitle')}
            </Text>
            <ScrollView style={styles.onboardingPickerList} nestedScrollEnabled>
              <TouchableOpacity
                style={[
                  styles.onboardingPickerItem,
                  {
                    backgroundColor: !pendingVoice ? colors.primary + '18' : colors.background,
                    borderColor: !pendingVoice ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setPendingVoice(undefined);
                  closeOnboardingVoicePicker();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.onboardingPickerItemText, { color: !pendingVoice ? colors.primary : colors.text }]}>
                  {t(onboardingLanguage, 'ttsDefaultVoice')}
                </Text>
                {!pendingVoice ? <Check color={colors.primary} size={18} /> : null}
              </TouchableOpacity>

              {availableVoices.map((voice, index) => {
                const isSelected = pendingVoice === voice.identifier;
                return (
                  <TouchableOpacity
                    key={`${voice.identifier}-${index}`}
                    style={[
                      styles.onboardingPickerItem,
                      {
                        backgroundColor: isSelected ? colors.primary + '18' : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setPendingVoice(voice.identifier);
                      closeOnboardingVoicePicker();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.onboardingPickerVoiceInfo}>
                      <Text style={[styles.onboardingPickerItemText, { color: isSelected ? colors.primary : colors.text }]} numberOfLines={1}>
                        {voice.name}
                      </Text>
                      <Text style={[styles.onboardingPickerVoiceLanguage, { color: colors.textSecondary }]} numberOfLines={1}>
                        {voice.language}
                      </Text>
                    </View>
                    {isSelected ? <Check color={colors.primary} size={18} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDailyVerse}
        transparent
        animationType="none"
        onRequestClose={closeDailyVerse}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeDailyVerse}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.cardBackground,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.modalIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <BookOpen color={colors.primary} size={24} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {appearanceSettings.startupVerseMode === 'curated'
                  ? t(uiLanguage, 'curatedVerse')
                  : t(uiLanguage, 'randomVerse')}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.background }]}
                onPress={closeDailyVerse}
                activeOpacity={0.7}
              >
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            {dailyVerse && (
              <View style={styles.verseContainer}>
                <Text style={[styles.verseReference, { color: colors.primary }]}>
                  {dailyVerseBookName} {dailyVerse.chapter}:{dailyVerse.verse}
                </Text>
                <Text style={[styles.verseText, { color: colors.text }]}>
                  &quot;{dailyVerse.text}&quot;
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={closeDailyVerse}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                  {t(uiLanguage, 'close')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: buttonGradient ? 'transparent' : colors.primary }]}
                onPress={learnDailyVerse}
                activeOpacity={0.7}
              >
                {buttonGradient && <LinearGradient colors={[...buttonGradient]} style={styles.buttonGradientFill} />}
                <BookOpen color="#FFFFFF" size={18} />
                <Text style={styles.primaryButtonText}>
                  {t(uiLanguage, 'learnThisVerse')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Modal
        visible={showTestamentPicker}
        transparent
        animationType="none"
        onRequestClose={closeTestamentPicker}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: pickerFadeAnim }]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeTestamentPicker}
          />
          <Animated.View
            style={[
              styles.pickerContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: colors.text }]}>
              {t(uiLanguage, 'chooseTestament')}
            </Text>
            <TouchableOpacity
              style={[styles.testamentOption, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
              onPress={() => handleRandomVerseFromTestament('old')}
              activeOpacity={0.7}
            >
              <Text style={[styles.testamentOptionText, { color: colors.primary }]}>
                {t(uiLanguage, 'oldTestament')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.testamentOption, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
              onPress={() => handleRandomVerseFromTestament('new')}
              activeOpacity={0.7}
            >
              <Text style={[styles.testamentOptionText, { color: colors.primary }]}>
                {t(uiLanguage, 'newTestament')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={closeTestamentPicker}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                {t(uiLanguage, 'cancel')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  heroCard: {
    marginHorizontal: 20,
    marginTop: HERO_CARD_BASE_MARGIN_TOP,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    gap: 16,
  },
  headerCopy: {
    flex: 1,
  },
  headerStatusRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    alignItems: "center" as const,
    gap: 10,
    marginTop: 14,
  },
  randomButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden' as const,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "800" as const,
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: "row" as const,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800" as const,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  heroTags: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  heroTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroTagText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  holyLoadingRoot: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  holyLoadingContent: {
    alignItems: "center" as const,
    paddingHorizontal: 40,
    gap: 16,
  },
  holyLoadingCrossContainer: {
    width: 48,
    height: 48,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  holyLoadingCrossVertical: {
    position: "absolute" as const,
    width: 4,
    height: 48,
    borderRadius: 2,
  },
  holyLoadingCrossHorizontal: {
    position: "absolute" as const,
    width: 32,
    height: 4,
    borderRadius: 2,
    top: 12,
  },
  holyLoadingGlow: {
    position: "absolute" as const,
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -40,
  },
  holyLoadingQuote: {
    fontSize: 18,
    fontStyle: "italic" as const,
    fontWeight: "300" as const,
    textAlign: "center" as const,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  holyLoadingReference: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
  holyLoadingDivider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginVertical: 8,
  },
  holyLoadingDividerLine: {
    width: 40,
    height: 1,
  },
  holyLoadingDividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  holyLoadingSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  errorDetails: {
    fontSize: 14,
    textAlign: "center" as const,
  },
  retryButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    overflow: 'hidden' as const,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  sortSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 10,
    marginBottom: 4,
  },
  searchInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  sortOptions: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  list: {
    paddingBottom: 150,
  },
  bookGridRow: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  bookCard: {
    flex: 1,
    minHeight: 152,
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    justifyContent: "space-between" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  bookCardFullWidth: {
    flex: 0,
    width: "100%",
  },
  bookBadge: {
    alignSelf: "flex-start" as const,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bookBadgeText: {
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 0.8,
  },
  bookName: {
    fontSize: 20,
    fontWeight: "700" as const,
    flexWrap: "wrap" as const,
    marginTop: 18,
  },
  bookMeta: {
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 10,
  },
  emptySearchState: {
    position: 'absolute' as const,
    left: 20,
    right: 20,
    bottom: 32,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    textAlign: 'center' as const,
  },
  emptySearchSubtitle: {
    fontSize: 13,
    textAlign: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  onboardingOverlay: {
    paddingHorizontal: 20,
  },
  onboardingCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    flexShrink: 1,
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  onboardingBody: {
    gap: 16,
    paddingBottom: 12,
  },
  onboardingSection: {
    gap: 10,
  },
  onboardingSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  onboardingSectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  onboardingSelectButton: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  onboardingSelectButtonInfo: {
    flex: 1,
    gap: 6,
  },
  onboardingSelectButtonLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  onboardingSelectButtonValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  onboardingThemeValueRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  onboardingThemeSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  onboardingPickerCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%' as const,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  onboardingPickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  onboardingPickerList: {
    flexGrow: 0,
  },
  onboardingPickerItem: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  onboardingPickerItemText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  onboardingPickerVoiceInfo: {
    flex: 1,
  },
  onboardingPickerVoiceLanguage: {
    fontSize: 12,
    marginTop: 4,
  },
  onboardingActionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
  },
  onboardingActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  onboardingSampleText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  onboardingTestButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  onboardingTestButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  onboardingLanguageList: {
    maxHeight: 260,
  },
  onboardingLanguageItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  onboardingLanguageItemText: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  guidedTourCard: {
    width: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  guidedTourHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  guidedTourStepLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  guidedTourSkipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  guidedTourTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  guidedTourDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  guidedTourDotsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 6,
  },
  guidedTourDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  guidedTourActionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  guidedTourActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  ttsSpeedContainer: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  ttsSpeedOption: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  ttsSpeedText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  voiceLanguage: {
    fontSize: 12,
    marginTop: 2,
  },
  voiceLoadingContainer: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  voiceLoadingText: {
    fontSize: 14,
  },
  modalBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden' as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  verseContainer: {
    padding: 24,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic' as const,
  },
  modalActions: {
    flexDirection: 'row' as const,
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    overflow: 'hidden' as const,
  },
  buttonGradientFill: {
    ...StyleSheet.absoluteFillObject,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  primaryButton: {
    flex: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  pickerContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  testamentOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
    alignItems: 'center' as const,
  },
  testamentOptionText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
