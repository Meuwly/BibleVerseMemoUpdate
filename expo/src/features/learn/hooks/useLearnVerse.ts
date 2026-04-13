import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { LANGUAGES } from '../../../../constants/languages';
import type { AppearanceSettings, Language, LearningMode, Verse, VerseProgress } from '../../../../types/database';
import { getVerse } from '../../../../utils/database';

interface UseLearnVerseParams {
  language: string;
  book?: string;
  chapter?: string;
  verse?: string;
  fromRandom?: string;
  learningMode: LearningMode;
  appearanceSettings: AppearanceSettings;
  getVerseProgress: (book: string, chapter: number, verse: number) => VerseProgress | undefined;
  onVerseLoaded?: (payload: { verseData: Verse; progress?: VerseProgress }) => void;
}

export function useLearnVerse({
  language,
  book,
  chapter,
  verse,
  fromRandom,
  learningMode,
  appearanceSettings,
  getVerseProgress,
  onVerseLoaded,
}: UseLearnVerseParams) {
  const router = useRouter();
  const [verseData, setVerseData] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [comparisonVerseText, setComparisonVerseText] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadVerse = async () => {
      if (isActive) {
        setIsLoading(true);
      }

      try {
        if (!book) {
          setVerseData(null);
          setHasPrevious(false);
          setHasNext(false);
          setComparisonVerseText(null);
          return;
        }

        const chapterNumber = Number.parseInt(chapter || '', 10);
        const verseNumber = Number.parseInt(verse || '', 10);
        const data = await getVerse(language, book, chapterNumber, verseNumber);

        if (!isActive) {
          return;
        }

        setVerseData(data);

        if (!data) {
          return;
        }

        const progress = getVerseProgress(data.book, data.chapter, data.verse);
        onVerseLoaded?.({ verseData: data, progress });

        const previousVersePromise = data.verse > 1
          ? getVerse(language, data.book, data.chapter, data.verse - 1)
          : Promise.resolve(null);
        const nextVersePromise = getVerse(language, data.book, data.chapter, data.verse + 1);

        const shouldShowComparison =
          appearanceSettings.enableVerseComparison === true
          && Boolean(appearanceSettings.comparisonVersion)
          && appearanceSettings.comparisonVersion !== language;

        const comparisonPromise = shouldShowComparison && appearanceSettings.comparisonVersion
          ? getVerse(appearanceSettings.comparisonVersion, data.book, data.chapter, data.verse)
          : Promise.resolve(null);

        const [previousVerse, nextVerse, comparisonVerse] = await Promise.all([
          previousVersePromise,
          nextVersePromise,
          comparisonPromise,
        ]);

        if (!isActive) {
          return;
        }

        setHasPrevious(Boolean(previousVerse));
        setHasNext(Boolean(nextVerse));
        setComparisonVerseText(comparisonVerse?.text || null);
      } catch (error) {
        console.error('Error loading verse:', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    if (book && chapter && verse) {
      void loadVerse();
    }

    return () => {
      isActive = false;
    };
  }, [
    appearanceSettings.comparisonVersion,
    appearanceSettings.enableVerseComparison,
    book,
    chapter,
    getVerseProgress,
    language,
    learningMode,
    onVerseLoaded,
    verse,
  ]);

  const navigateToVerse = useCallback(
    (targetVerse: number) => {
      if (!verseData) {
        return;
      }

      const params: {
        book: string;
        chapter: string;
        verse: string;
        fromRandom?: string;
      } = {
        book: verseData.book,
        chapter: verseData.chapter.toString(),
        verse: targetVerse.toString(),
      };

      if (fromRandom === 'true') {
        params.fromRandom = 'true';
      }

      router.replace({
        pathname: '/learn/[book]/[chapter]/[verse]' as any,
        params,
      });
    },
    [fromRandom, router, verseData],
  );

  const handleNext = useCallback(() => {
    if (!verseData) {
      return;
    }

    if (hasNext) {
      navigateToVerse(verseData.verse + 1);
      return;
    }

    router.back();
  }, [hasNext, navigateToVerse, router, verseData]);

  const handlePrevious = useCallback(() => {
    if (!verseData) {
      return;
    }

    const previousVerseNumber = verseData.verse - 1;
    if (hasPrevious && previousVerseNumber > 0) {
      navigateToVerse(previousVerseNumber);
    }
  }, [hasPrevious, navigateToVerse, verseData]);

  const selectedComparisonLanguage = useMemo(
    () => LANGUAGES.find((lang) => lang.code === appearanceSettings.comparisonVersion),
    [appearanceSettings.comparisonVersion],
  );

  const selectedPrimaryLanguage = useMemo(
    () => LANGUAGES.find((lang) => lang.code === language),
    [language],
  );

  const comparisonLabel = useMemo(
    () => (
      appearanceSettings.enableVerseComparison && selectedComparisonLanguage
        ? `${selectedPrimaryLanguage?.code || language} • ${selectedComparisonLanguage.code}`
        : `${selectedPrimaryLanguage?.code || language}`
    ),
    [appearanceSettings.enableVerseComparison, language, selectedComparisonLanguage, selectedPrimaryLanguage],
  );

  const handleComparisonChange = useCallback(
    async (
      comparisonVersion: string | null,
      setAppearanceSettings: (value: Partial<AppearanceSettings>) => Promise<void>,
      closeSheet: () => void,
    ) => {
      if (!comparisonVersion) {
        await setAppearanceSettings({
          enableVerseComparison: false,
          comparisonVersion: null,
        });
        closeSheet();
        return;
      }

      await setAppearanceSettings({
        enableVerseComparison: comparisonVersion !== language,
        comparisonVersion,
      });
      closeSheet();
    },
    [language],
  );

  const handlePrimaryVersionChange = useCallback(
    async (
      primaryVersion: string,
      setAppearanceSettings: (value: Partial<AppearanceSettings>) => Promise<void>,
      setLanguage: (language: Language) => Promise<void>,
      closeSheet: () => void,
    ) => {
      if (primaryVersion === language) {
        closeSheet();
        return;
      }

      if (appearanceSettings.comparisonVersion === primaryVersion) {
        await setAppearanceSettings({
          enableVerseComparison: false,
          comparisonVersion: null,
        });
      }

      await setLanguage(primaryVersion as Language);
      closeSheet();
    },
    [appearanceSettings.comparisonVersion, language],
  );

  return {
    verseData,
    isLoading,
    hasPrevious,
    hasNext,
    comparisonVerseText,
    comparisonLabel,
    handleNext,
    handlePrevious,
    handleComparisonChange,
    handlePrimaryVersionChange,
  };
}
