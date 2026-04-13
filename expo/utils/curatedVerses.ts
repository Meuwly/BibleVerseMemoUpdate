import type { Language, Verse } from '../types/database';
import { getVerse } from './database';

export interface CuratedVerseRef {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * A curated list of well-known, spiritually significant Bible verses.
 * Books use the canonical identifiers as parsed by the database layer.
 */
export const CURATED_VERSES: CuratedVerseRef[] = [
  // New Testament — Classic
  { book: 'John', chapter: 3, verse: 16 },
  { book: 'John', chapter: 14, verse: 6 },
  { book: 'Matt', chapter: 5, verse: 16 },
  { book: 'Matt', chapter: 6, verse: 33 },
  { book: 'Matt', chapter: 11, verse: 28 },
  { book: 'Matt', chapter: 28, verse: 19 },
  { book: 'Rom', chapter: 8, verse: 28 },
  { book: 'Rom', chapter: 8, verse: 1 },
  { book: 'Rom', chapter: 12, verse: 2 },
  { book: 'Phil', chapter: 4, verse: 13 },
  { book: 'Phil', chapter: 4, verse: 7 },
  { book: 'Gal', chapter: 5, verse: 22 },
  { book: 'Eph', chapter: 2, verse: 8 },
  { book: 'Heb', chapter: 11, verse: 1 },
  { book: '1Cor', chapter: 13, verse: 4 },
  { book: '2Tim', chapter: 1, verse: 7 },
  { book: '1John', chapter: 4, verse: 8 },
  { book: '1Pet', chapter: 5, verse: 7 },
  { book: 'Rev', chapter: 21, verse: 4 },
  // Old Testament — Classic
  { book: 'Ps', chapter: 23, verse: 1 },
  { book: 'Ps', chapter: 46, verse: 1 },
  { book: 'Ps', chapter: 27, verse: 1 },
  { book: 'Ps', chapter: 119, verse: 105 },
  { book: 'Ps', chapter: 37, verse: 4 },
  { book: 'Prov', chapter: 3, verse: 5 },
  { book: 'Isa', chapter: 40, verse: 31 },
  { book: 'Isa', chapter: 41, verse: 10 },
  { book: 'Jer', chapter: 29, verse: 11 },
  { book: 'Josh', chapter: 1, verse: 9 },
  { book: 'Gen', chapter: 1, verse: 1 },
];

/**
 * Returns the index of today's curated verse based on the day of the year.
 * The result is deterministic for a given day and cycles through the full list.
 */
export function getTodayCuratedIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear % CURATED_VERSES.length;
}

/**
 * Fetches today's curated verse for the given Bible language.
 * Falls back to null if the verse cannot be found in that version.
 */
export async function getCuratedVerse(lang: Language): Promise<Verse | null> {
  const index = getTodayCuratedIndex();
  const ref = CURATED_VERSES[index];
  if (!ref) return null;

  try {
    const verse = await getVerse(lang, ref.book, ref.chapter, ref.verse);
    return verse ?? null;
  } catch {
    return null;
  }
}
