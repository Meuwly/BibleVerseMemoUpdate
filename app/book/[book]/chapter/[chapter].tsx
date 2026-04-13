import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, CheckCircle2, Circle, Play, RotateCcw, Volume2, VolumeX } from "lucide-react-native";
import { useApp } from "../../../../contexts/AppContext";
import { getVerses } from "../../../../utils/database";
import { t } from "../../../../constants/translations";
import { getColors } from "../../../../constants/colors";
import { speak, stop as stopTTS } from "../../../../utils/tts";
import type { Verse } from "../../../../types/database";

export default function VersesScreen() {
  const { language, uiLanguage, theme, dyslexiaSettings, ttsSettings, getVerseProgress, resetVerseProgress } = useApp();
  const colors = getColors(theme);
  const router = useRouter();
  const { book, chapter } = useLocalSearchParams<{ book: string; chapter: string }>();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChapterSpeaking, setIsChapterSpeaking] = useState(false);
  const stopReadingRef = useRef(false);
  const handleBackToChapters = useCallback(() => {
    if (book) {
      router.replace({
        pathname: '/book/[book]' as any,
        params: { book },
      });
      return;
    }
    router.back();
  }, [book, router]);

  const loadVerses = useCallback(async () => {
    setIsLoading(true);
    try {
      const versesList = await getVerses(language, book, parseInt(chapter));
      setVerses(versesList);
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [book, chapter, language]);

  useEffect(() => {
    if (book && chapter) {
      loadVerses();
    }
  }, [book, chapter, loadVerses]);

  const handleVersePress = (verse: Verse) => {
    router.push({ 
      pathname: '/learn/[book]/[chapter]/[verse]' as any, 
      params: { 
        book: verse.book, 
        chapter: verse.chapter.toString(), 
        verse: verse.verse.toString() 
      } 
    });
  };

  const handleResetProgress = async (verse: Verse) => {
    await resetVerseProgress(verse.book, verse.chapter, verse.verse);
    loadVerses();
  };

  const renderVerseStatus = (verse: Verse) => {
    const progress = getVerseProgress(verse.book, verse.chapter, verse.verse);
    
    if (progress?.completed) {
      return <CheckCircle2 color={colors.success} size={24} />;
    } else if (progress?.started) {
      return <Play color={colors.warning} size={24} />;
    } else {
      return <Circle color={colors.border} size={24} />;
    }
  };

  const stopChapterReading = useCallback(async () => {
    stopReadingRef.current = true;
    await stopTTS();
    setIsChapterSpeaking(false);
  }, []);

  const handleChapterTTS = useCallback(async () => {
    if (isChapterSpeaking) {
      await stopChapterReading();
      return;
    }
    if (verses.length === 0) {
      return;
    }
    stopReadingRef.current = false;
    setIsChapterSpeaking(true);
    try {
      for (const verseItem of verses) {
        if (stopReadingRef.current) {
          break;
        }
        await speak(verseItem.text, {
          language,
          speed: ttsSettings.speed,
          voiceIdentifier: ttsSettings.voiceIdentifier,
        });
      }
    } catch (error) {
      console.error('Error reading chapter:', error);
    } finally {
      setIsChapterSpeaking(false);
    }
  }, [isChapterSpeaking, language, ttsSettings.speed, ttsSettings.voiceIdentifier, stopChapterReading, verses]);

  useEffect(() => {
    return () => {
      stopReadingRef.current = true;
      stopTTS();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen 
          options={{ 
            title: `${book} ${chapter}`,
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text },
            headerLeft: () => (
              <TouchableOpacity
                onPress={handleBackToChapters}
                style={styles.headerBackButton}
                accessibilityLabel={t(uiLanguage, 'back')}
                accessibilityRole="button"
                hitSlop={styles.headerBackButtonHitSlop}
              >
                <ArrowLeft color={colors.text} size={24} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleChapterTTS}
                  style={styles.headerSoundButton}
                  accessibilityLabel={isChapterSpeaking ? t(uiLanguage, 'stopReading') : t(uiLanguage, 'readChapter')}
                  accessibilityRole="button"
                  hitSlop={styles.headerBackButtonHitSlop}
                >
                  {isChapterSpeaking ? (
                    <VolumeX color={colors.text} size={24} />
                  ) : (
                    <Volume2 color={colors.text} size={24} />
                  )}
                </TouchableOpacity>
              </View>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: `${book} ${chapter}`,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBackToChapters}
              style={styles.headerBackButton}
              accessibilityLabel={t(uiLanguage, 'back')}
              accessibilityRole="button"
              hitSlop={styles.headerBackButtonHitSlop}
            >
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleChapterTTS}
                style={styles.headerSoundButton}
                accessibilityLabel={isChapterSpeaking ? t(uiLanguage, 'stopReading') : t(uiLanguage, 'readChapter')}
                accessibilityRole="button"
                hitSlop={styles.headerBackButtonHitSlop}
              >
                {isChapterSpeaking ? (
                  <VolumeX color={colors.text} size={24} />
                ) : (
                  <Volume2 color={colors.text} size={24} />
                )}
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(uiLanguage, 'selectVerse')}</Text>
      </View>

      <FlatList
        data={verses}
        keyExtractor={(item) => `${item.book}-${item.chapter}-${item.verse}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const progress = getVerseProgress(item.book, item.chapter, item.verse);
          const hasProgress = progress && (progress.started || progress.completed);
          
          return (
            <View style={[styles.verseCard, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity
                style={styles.verseCardContent}
                onPress={() => handleVersePress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.verseContent}>
                  <Text style={[
                    styles.verseText, 
                    { 
                      color: colors.text,
                      fontSize: dyslexiaSettings.fontSize,
                      lineHeight: dyslexiaSettings.lineHeight,
                    }
                  ]}>
                    {item.book}.{item.chapter}:{item.verse} {item.text}
                  </Text>
                  <View style={styles.statusIcon}>
                    {renderVerseStatus(item)}
                  </View>
                </View>
              </TouchableOpacity>
              {hasProgress && (
                <TouchableOpacity
                  style={[styles.resetButton, { borderTopColor: colors.border }]}
                  onPress={() => handleResetProgress(item)}
                  activeOpacity={0.7}
                >
                  <RotateCcw color={colors.error} size={18} />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBackButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerSoundButton: {
    padding: 8,
  },
  headerBackButtonHitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  verseCard: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  verseCardContent: {
    padding: 16,
  },
  verseContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  resetButton: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  verseText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  statusIcon: {
    marginLeft: 12,
  },
});
