import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../contexts/AppContext";
import { t, getBookName } from "../../constants/translations";
import { getColors } from "../../constants/colors";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Eye,
  EyeOff,
  Heart,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { getVerse } from "../../utils/database";
import { speak, stop as stopTTS } from "../../utils/tts";
import { getSrsSnapshot, type SrsSnapshot } from "../../src/srs/spacedRepetition";
import type { VerseProgress } from "../../types/database";

type SortOrder = 'srs-priority' | 'newest' | 'oldest';
type FocusFilter = 'all' | 'due-now' | 'due-soon' | 'harder' | 'strong';

type VerseItem = {
  verseProgress: VerseProgress;
  srs: SrsSnapshot;
};

export default function MemorizedScreen() {
  const { language, uiLanguage, theme, progress, learningSettings, ttsSettings } = useApp();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomListInset = 24 + 74 + Math.max(insets.bottom + 10, 18);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('srs-priority');
  const [focusFilter, setFocusFilter] = useState<FocusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerseText, setShowVerseText] = useState(true);
  const [isMemorizedSpeaking, setIsMemorizedSpeaking] = useState(false);
  const [isSearchIndexing, setIsSearchIndexing] = useState(false);
  const stopReadingRef = useRef(false);
  const verseTextCacheRef = useRef<Record<string, string>>({});
  const [verseTextByKey, setVerseTextByKey] = useState<Record<string, string>>({});

  const memorizedVerses = useMemo(() => progress.filter((entry) => entry.memorized), [progress]);
  const maxMastery = learningSettings.maxMasteryLevel || 5;
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const getVerseKey = useCallback((book: string, chapter: number, verse: number) => {
    return `${book}-${chapter}-${verse}`;
  }, []);

  const bookCounts = useMemo(() => {
    return memorizedVerses.reduce<Record<string, number>>((counts, verse) => {
      counts[verse.book] = (counts[verse.book] ?? 0) + 1;
      return counts;
    }, {});
  }, [memorizedVerses]);

  const booksWithMemorizedVerses = useMemo(() => Object.keys(bookCounts), [bookCounts]);

  const describeNextReview = useCallback((dueInDays: number, dueNow: boolean) => {
    if (dueNow) {
      return t(uiLanguage, 'srsDueNow');
    }

    if (dueInDays <= 1) {
      return t(uiLanguage, 'srsDueTomorrow');
    }

    return t(uiLanguage, 'srsDueInDays').replace('{count}', String(dueInDays));
  }, [uiLanguage]);

  const versesWithSrs = useMemo<VerseItem[]>(() => {
    const now = new Date();
    return memorizedVerses.map((verseProgress) => ({
      verseProgress,
      srs: getSrsSnapshot(verseProgress, now),
    }));
  }, [memorizedVerses]);

  const dueNowCount = useMemo(
    () => versesWithSrs.filter(({ srs }) => srs.dueNow).length,
    [versesWithSrs]
  );

  const dueSoonCount = useMemo(
    () => versesWithSrs.filter(({ srs }) => !srs.dueNow && srs.dueInDays <= 2).length,
    [versesWithSrs]
  );

  const strongestInterval = useMemo(
    () => versesWithSrs.reduce((best, { srs }) => Math.max(best, srs.intervalDays), 0),
    [versesWithSrs]
  );

  const baseFilteredVerses = useMemo(() => {
    return selectedBook
      ? versesWithSrs.filter(({ verseProgress }) => verseProgress.book === selectedBook)
      : versesWithSrs;
  }, [selectedBook, versesWithSrs]);

  const filteredVerses = useMemo(() => {
    return baseFilteredVerses.filter(({ verseProgress, srs }) => {
      if (focusFilter === 'due-now' && !srs.dueNow) {
        return false;
      }

      if (focusFilter === 'due-soon' && (srs.dueNow || srs.dueInDays > 2)) {
        return false;
      }

      if (focusFilter === 'harder') {
        const difficulty = verseProgress.srs?.difficulty ?? 0;
        const lowMastery = verseProgress.masteryLevel <= Math.max(1, Math.ceil(maxMastery / 2));
        if (!(difficulty >= 0.5 || lowMastery)) {
          return false;
        }
      }

      if (focusFilter === 'strong') {
        const difficulty = verseProgress.srs?.difficulty ?? 1;
        const highMastery = verseProgress.masteryLevel >= Math.max(1, maxMastery - 1);
        if (!(highMastery && difficulty <= 0.35)) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const verseReference = `${getBookName(uiLanguage, verseProgress.book)} ${verseProgress.chapter}:${verseProgress.verse}`.toLowerCase();
      if (verseReference.includes(normalizedSearch) || verseProgress.book.toLowerCase().includes(normalizedSearch)) {
        return true;
      }

      const verseKey = getVerseKey(verseProgress.book, verseProgress.chapter, verseProgress.verse);
      const verseText = verseTextByKey[verseKey]?.toLowerCase();
      return verseText?.includes(normalizedSearch) ?? false;
    });
  }, [
    baseFilteredVerses,
    focusFilter,
    getVerseKey,
    maxMastery,
    normalizedSearch,
    uiLanguage,
    verseTextByKey,
  ]);

  const sortedVerses = useMemo(() => {
    const verses = [...filteredVerses];
    const getLastPracticedTime = (verseProgress: VerseProgress) => {
      const time = Date.parse(verseProgress.lastPracticed);
      return Number.isNaN(time) ? 0 : time;
    };

    verses.sort((a, b) => {
      if (sortOrder === 'srs-priority') {
        if (a.srs.dueNow !== b.srs.dueNow) {
          return a.srs.dueNow ? -1 : 1;
        }
        if (a.srs.dueInDays !== b.srs.dueInDays) {
          return a.srs.dueInDays - b.srs.dueInDays;
        }
        return getLastPracticedTime(a.verseProgress) - getLastPracticedTime(b.verseProgress);
      }

      const diff = getLastPracticedTime(a.verseProgress) - getLastPracticedTime(b.verseProgress);
      return sortOrder === 'newest' ? -diff : diff;
    });

    return verses;
  }, [filteredVerses, sortOrder]);

  const dueVerses = useMemo(
    () => sortedVerses.filter(({ srs }) => srs.dueNow),
    [sortedVerses]
  );

  const nextReviewTarget = dueVerses[0] ?? sortedVerses[0] ?? null;

  const focusFilterCounts = useMemo(() => {
    const harderThreshold = Math.max(1, Math.ceil(maxMastery / 2));
    return {
      all: baseFilteredVerses.length,
      'due-now': baseFilteredVerses.filter(({ srs }) => srs.dueNow).length,
      'due-soon': baseFilteredVerses.filter(({ srs }) => !srs.dueNow && srs.dueInDays <= 2).length,
      harder: baseFilteredVerses.filter(({ verseProgress }) => {
        return (verseProgress.srs?.difficulty ?? 0) >= 0.5 || verseProgress.masteryLevel <= harderThreshold;
      }).length,
      strong: baseFilteredVerses.filter(({ verseProgress }) => {
        return verseProgress.masteryLevel >= Math.max(1, maxMastery - 1) && (verseProgress.srs?.difficulty ?? 1) <= 0.35;
      }).length,
    } as Record<FocusFilter, number>;
  }, [baseFilteredVerses, maxMastery]);

  const handleVersePress = useCallback((book: string, chapter: number, verse: number) => {
    router.push({
      pathname: '/learn/[book]/[chapter]/[verse]' as any,
      params: { book, chapter: chapter.toString(), verse: verse.toString(), fromMemorized: 'true' },
    });
  }, [router]);

  const handleReviewNow = useCallback(() => {
    if (!nextReviewTarget) {
      return;
    }

    const { book, chapter, verse } = nextReviewTarget.verseProgress;
    handleVersePress(book, chapter, verse);
  }, [handleVersePress, nextReviewTarget]);

  const stopMemorizedReading = useCallback(async () => {
    stopReadingRef.current = true;
    await stopTTS();
    setIsMemorizedSpeaking(false);
  }, []);

  const handleMemorizedTTS = useCallback(async () => {
    if (isMemorizedSpeaking || sortedVerses.length === 0) {
      return;
    }
    stopReadingRef.current = false;
    setIsMemorizedSpeaking(true);
    try {
      while (!stopReadingRef.current) {
        for (const { verseProgress } of sortedVerses) {
          if (stopReadingRef.current) {
            break;
          }
          const verseData = await getVerse(language, verseProgress.book, verseProgress.chapter, verseProgress.verse);
          if (!verseData?.text) {
            continue;
          }
          await speak(verseData.text, {
            language,
            speed: ttsSettings.speed,
            voiceIdentifier: ttsSettings.voiceIdentifier,
          });
        }
      }
    } catch (error) {
      console.error('Error reading memorized verses:', error);
    } finally {
      setIsMemorizedSpeaking(false);
    }
  }, [isMemorizedSpeaking, language, sortedVerses, ttsSettings.speed, ttsSettings.voiceIdentifier]);

  useEffect(() => {
    const shouldLoadVisibleTexts = showVerseText && sortedVerses.length > 0;
    const shouldLoadSearchTexts = normalizedSearch.length > 0 && baseFilteredVerses.length > 0;

    if (!shouldLoadVisibleTexts && !shouldLoadSearchTexts) {
      setIsSearchIndexing(false);
      return;
    }

    const source = shouldLoadSearchTexts ? baseFilteredVerses : sortedVerses;
    const missingVerses = source.filter(({ verseProgress }) => {
      const key = getVerseKey(verseProgress.book, verseProgress.chapter, verseProgress.verse);
      return !verseTextCacheRef.current[key];
    });

    if (missingVerses.length === 0) {
      setIsSearchIndexing(false);
      return;
    }

    let isActive = true;
    setIsSearchIndexing(shouldLoadSearchTexts);

    const loadVerseTexts = async () => {
      const verseEntries = await Promise.all(
        missingVerses.map(async ({ verseProgress }) => {
          const verseData = await getVerse(language, verseProgress.book, verseProgress.chapter, verseProgress.verse);
          return {
            key: getVerseKey(verseProgress.book, verseProgress.chapter, verseProgress.verse),
            text: verseData?.text || '',
          };
        })
      );

      if (!isActive) {
        return;
      }

      let updated = false;
      verseEntries.forEach(({ key, text }) => {
        if (text) {
          verseTextCacheRef.current[key] = text;
          updated = true;
        }
      });

      if (updated) {
        setVerseTextByKey({ ...verseTextCacheRef.current });
      }
      setIsSearchIndexing(false);
    };

    loadVerseTexts();

    return () => {
      isActive = false;
    };
  }, [baseFilteredVerses, getVerseKey, language, normalizedSearch, showVerseText, sortedVerses]);

  useEffect(() => {
    return () => {
      stopReadingRef.current = true;
      stopTTS();
    };
  }, []);

  const renderVerseCard = useCallback(({ item }: { item: VerseItem }) => {
    const { verseProgress, srs } = item;
    const verseKey = getVerseKey(verseProgress.book, verseProgress.chapter, verseProgress.verse);
    const verseText = verseTextByKey[verseKey];
    const dueTone = srs.dueNow
      ? colors.error
      : srs.urgency === 'soon'
        ? colors.primary
        : colors.success;
    const masteryLevel = Math.min(verseProgress.masteryLevel, maxMastery);
    const difficultyPercent = Math.round((verseProgress.srs?.difficulty ?? 0.35) * 100);

    return (
      <TouchableOpacity
        style={[
          styles.verseCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: srs.dueNow ? colors.error + '55' : colors.border,
            borderWidth: 1,
          },
        ]}
        onPress={() => handleVersePress(verseProgress.book, verseProgress.chapter, verseProgress.verse)}
      >
        <View style={styles.verseHeader}>
          <View style={[styles.heartIcon, { backgroundColor: colors.success + '20' }]}>
            <Heart color={colors.success} size={20} fill={colors.success} />
          </View>
          <View style={styles.verseHeaderText}>
            <Text style={[styles.verseReference, { color: colors.primary }]}>
              {getBookName(uiLanguage, verseProgress.book)} {verseProgress.chapter}:{verseProgress.verse}
            </Text>
            <View style={styles.inlineBadges}>
              <View style={[styles.srsChip, { backgroundColor: dueTone + '18', borderColor: dueTone + '33' }]}>
                <Clock3 color={dueTone} size={14} />
                <Text style={[styles.srsChipText, { color: dueTone }]}>
                  {describeNextReview(srs.dueInDays, srs.dueNow)}
                </Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                  {t(uiLanguage, 'mastery')}: {masteryLevel}/{maxMastery}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {showVerseText && verseText ? (
          <Text style={[styles.verseText, { color: colors.text }]}>{verseText}</Text>
        ) : null}

        <View style={styles.srsMetaRow}>
          <Text style={[styles.srsMetaText, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'srsNextReview')}: {describeNextReview(srs.dueInDays, srs.dueNow)}
          </Text>
          <Text style={[styles.srsMetaText, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'srsReviewCount')}: {verseProgress.srs?.reviewCount ?? 0}
          </Text>
          <Text style={[styles.srsMetaText, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'srsInterval')}: {Math.max(1, srs.intervalDays || 0).toFixed(0)}{t(uiLanguage, 'dayShort')}
          </Text>
          <Text style={[styles.srsMetaText, { color: colors.textSecondary }]}>
            {t(uiLanguage, 'memorizedDifficulty')}: {difficultyPercent}%
          </Text>
        </View>

        <View style={styles.masteryContainer}>
          <View style={styles.masteryHeader}>
            <Text style={[styles.masteryLabel, { color: colors.textSecondary }]}>
              {t(uiLanguage, 'masteryProgress')}
            </Text>
            <Text style={[styles.masteryValue, { color: colors.text }]}>
              {masteryLevel}/{maxMastery}
            </Text>
          </View>
          <View style={styles.masteryBar}>
            {Array.from({ length: maxMastery }, (_, index) => index + 1).map((level) => (
              <View
                key={level}
                style={[
                  styles.masterySegment,
                  { backgroundColor: level <= masteryLevel ? colors.success : colors.border },
                ]}
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [
    colors.background,
    colors.border,
    colors.cardBackground,
    colors.error,
    colors.primary,
    colors.success,
    colors.text,
    colors.textSecondary,
    describeNextReview,
    getVerseKey,
    handleVersePress,
    maxMastery,
    showVerseText,
    uiLanguage,
    verseTextByKey,
  ]);

  const headerComponent = (
    <View>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 18),
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t(uiLanguage, 'memorized')}</Text>
      </View>

      <View style={[styles.controlsContainer, { backgroundColor: colors.background }]}> 
        <View style={[styles.heroCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextBlock}>
              <Text style={[styles.heroEyebrow, { color: colors.primary }]}>{t(uiLanguage, 'memorizedReviewDeck')}</Text>
              <Text style={[styles.heroTitle, { color: colors.text }]}> 
                {dueNowCount > 0
                  ? t(uiLanguage, 'memorizedDueStrongCta').replace('{count}', String(dueNowCount))
                  : t(uiLanguage, 'memorizedReviewReady')}
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                {sortedVerses.length > 0
                  ? t(uiLanguage, 'memorizedReviewHelper').replace('{count}', String(sortedVerses.length))
                  : t(uiLanguage, 'memorizedSearchHelper')}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.heroButton,
                {
                  backgroundColor: nextReviewTarget ? colors.primary : colors.border,
                  opacity: nextReviewTarget ? 1 : 0.6,
                },
              ]}
              onPress={handleReviewNow}
              disabled={!nextReviewTarget}
              accessibilityRole="button"
              accessibilityLabel={dueVerses.length > 0 ? t(uiLanguage, 'reviewDueVerses') : t(uiLanguage, 'reviewNow')}
            >
              <Text style={styles.heroButtonText}>
                {dueVerses.length > 0 ? t(uiLanguage, 'reviewDueVerses') : t(uiLanguage, 'reviewNow')}
              </Text>
              <ArrowRight color="#fff" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.summaryValue, { color: dueNowCount > 0 ? colors.error : colors.primary }]}>{dueNowCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'srsDueNow')}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{dueSoonCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'srsDueSoon')}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{strongestInterval.toFixed(0)}{t(uiLanguage, 'dayShort')}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'srsBestInterval')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.searchCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <Search color={colors.textSecondary} size={18} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t(uiLanguage, 'searchMemorizedPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
          <Text style={[styles.searchHelper, { color: colors.textSecondary }]}> 
            {isSearchIndexing && normalizedSearch
              ? t(uiLanguage, 'searchMemorizedLoading')
              : t(uiLanguage, 'searchMemorizedHint')}
          </Text>
        </View>

        <View style={styles.filterSection}>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'sortBy')}</Text>
          <FlatList
            data={[
              { key: 'srs-priority', label: t(uiLanguage, 'srsSortPriority'), icon: <Clock3 color={sortOrder === 'srs-priority' ? '#fff' : colors.text} size={16} /> },
              { key: 'newest', label: t(uiLanguage, 'sortNewest') },
              { key: 'oldest', label: t(uiLanguage, 'sortOldest') },
            ]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  { borderColor: colors.border },
                  sortOrder === item.key ? { backgroundColor: colors.primary } : { backgroundColor: colors.cardBackground },
                ]}
                onPress={() => setSortOrder(item.key as SortOrder)}
                accessibilityRole="button"
              >
                {item.icon ?? null}
                <Text style={[styles.controlButtonText, { color: sortOrder === item.key ? '#fff' : colors.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.controlRow}
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'memorizedFocusFilters')}</Text>
          <FlatList
            data={[
              { key: 'all', label: t(uiLanguage, 'memorizedFilterAll') },
              { key: 'due-now', label: t(uiLanguage, 'memorizedFilterDueNow') },
              { key: 'due-soon', label: t(uiLanguage, 'memorizedFilterDueSoon') },
              { key: 'harder', label: t(uiLanguage, 'memorizedFilterHarder') },
              { key: 'strong', label: t(uiLanguage, 'memorizedFilterStrong') },
            ]}
            renderItem={({ item }) => {
              const isActive = focusFilter === item.key;
              return (
                <TouchableOpacity
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: isActive ? colors.primary : colors.cardBackground,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setFocusFilter(item.key as FocusFilter)}
                >
                  <Text style={[styles.filterTabText, { color: isActive ? '#fff' : colors.text }]}>
                    {item.label} ({focusFilterCounts[item.key as FocusFilter] ?? 0})
                  </Text>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          />
        </View>

        {booksWithMemorizedVerses.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>{t(uiLanguage, 'memorizedFilterBook')}</Text>
            <FlatList
              data={[
                { key: '__all__', label: `${t(uiLanguage, 'allBooks')} (${memorizedVerses.length})`, icon: true },
                ...booksWithMemorizedVerses.map((book) => ({
                  key: book,
                  label: `${getBookName(uiLanguage, book)} (${bookCounts[book] ?? 0})`,
                  icon: false,
                })),
              ]}
              renderItem={({ item }) => {
                const isSelected = item.key === '__all__' ? selectedBook === null : selectedBook === item.key;
                return (
                  <TouchableOpacity
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedBook(item.key === '__all__' ? null : item.key)}
                  >
                    {item.icon ? <BookOpen size={16} color={isSelected ? '#fff' : colors.textSecondary} /> : null}
                    <Text style={[styles.filterTabText, { color: isSelected ? '#fff' : colors.text }]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.key}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            />
          </View>
        )}

        <FlatList
          data={[
            {
              key: 'show-text',
              label: showVerseText ? t(uiLanguage, 'hideVerseText') : t(uiLanguage, 'showVerseText'),
              icon: showVerseText ? <EyeOff color={colors.text} size={16} /> : <Eye color={colors.text} size={16} />,
              onPress: () => setShowVerseText((prev) => !prev),
              disabled: false,
            },
            {
              key: 'read',
              label: t(uiLanguage, 'readMemorized'),
              icon: <Volume2 color={colors.text} size={16} />,
              onPress: handleMemorizedTTS,
              disabled: isMemorizedSpeaking || sortedVerses.length === 0,
            },
            {
              key: 'stop',
              label: t(uiLanguage, 'stopReading'),
              icon: <VolumeX color={colors.text} size={16} />,
              onPress: stopMemorizedReading,
              disabled: !isMemorizedSpeaking,
            },
          ]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  opacity: item.disabled ? 0.5 : 1,
                },
              ]}
              onPress={item.onPress}
              disabled={item.disabled}
              accessibilityRole="button"
            >
              {item.icon}
              <Text style={[styles.controlButtonText, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.controlRow}
        />

        <Text style={[styles.resultsLabel, { color: colors.textSecondary }]}> 
          {t(uiLanguage, 'memorizedResultsCount').replace('{count}', String(sortedVerses.length))}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={sortedVerses}
        renderItem={renderVerseCard}
        keyExtractor={({ verseProgress }) => getVerseKey(verseProgress.book, verseProgress.chapter, verseProgress.verse)}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomListInset }]}
        scrollIndicatorInsets={{ bottom: bottomListInset }}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Heart color={colors.textSecondary} size={64} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}> 
              {memorizedVerses.length === 0
                ? t(uiLanguage, 'noMemorizedVerses')
                : t(uiLanguage, 'memorizedNoResults')}
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 14,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  heroTopRow: {
    gap: 14,
  },
  heroTextBlock: {
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  heroButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800" as const,
  },
  summaryRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800" as const,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    lineHeight: 14,
  },
  searchCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 8,
  },
  searchInputWrapper: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchHelper: {
    fontSize: 12,
    lineHeight: 18,
  },
  filterSection: {
    gap: 6,
  },
  controlLabel: {
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
    fontWeight: "600" as const,
  },
  controlRow: {
    gap: 8,
    paddingRight: 20,
  },
  controlButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0000001A",
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  filterContent: {
    paddingRight: 20,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  resultsLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    paddingHorizontal: 40,
    paddingVertical: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  verseCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  verseHeader: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
    marginBottom: 12,
  },
  verseHeaderText: {
    flex: 1,
    gap: 8,
  },
  inlineBadges: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  heartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  verseReference: {
    fontSize: 18,
    fontWeight: "700" as const,
    flex: 1,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  srsChip: {
    alignSelf: "flex-start" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  srsChipText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  metaChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  srsMetaRow: {
    gap: 4,
    marginBottom: 12,
  },
  srsMetaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  masteryContainer: {
    gap: 8,
  },
  masteryHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  masteryLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  masteryValue: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  masteryBar: {
    flexDirection: "row" as const,
    gap: 4,
  },
  masterySegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
});
