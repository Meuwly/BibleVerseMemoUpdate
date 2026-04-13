import type { Language } from '@/types/database';

export type LocalBibleAsset = number;

// Keep an explicit mapping so runtime fallback can load bundled Bible files when
// network fetches fail.
const localBibles: Partial<Record<Language, LocalBibleAsset>> = {
  AA: require('./local/AA.txt'),
  CEI: require('./local/CEI.txt'),
  DarbyR: require('./local/DarbyR.txt'),
  ELB: require('./local/ELB.txt'),
  ELB71: require('./local/ELB71.txt'),
  FOB: require('./local/FOB.txt'),
  ITADIO: require('./local/ITADIO.txt'),
  KJV: require('./local/KJV.txt'),
  LSG: require('./local/LSG.txt'),
  LUTH1545: require('./local/LUTH1545.txt'),
  PBG: require('./local/PBG.txt'),
  RUSV: require('./local/RUSV.txt'),
  RVA: require('./local/RVA.txt'),
  TR1550: require('./local/TR1550.txt'),
  TR1894: require('./local/TR1894.txt'),
  VULGATE: require('./local/VULGATE.txt'),
  WHNU: require('./local/WHNU.txt'),
  WLC: require('./local/WLC.txt'),
  darby: require('./local/darby.txt'),
  deu1912: require('./local/deu1912.txt'),
  deutkw: require('./local/deutkw.txt'),
  grm: require('./local/grm.txt'),
  heb: require('./local/heb.txt'),
  nld: require('./local/nld.txt'),
  spavbl: require('./local/spavbl.txt'),
};

export default localBibles;
