export type QuizCategory =
  | 'new-testament'
  | 'old-testament'
  | 'parables'
  | 'miracles'
  | 'characters'
  | 'gospels'
  | 'prophets'
  | 'kings'
  | 'wisdom'
  | 'epistles';

export const quizLanguages = ['fr', 'en', 'it', 'es', 'pt', 'de'] as const;

export type QuizLanguage = (typeof quizLanguages)[number];
export type LocalizedValue<T> = Partial<Record<QuizLanguage, T>>;

export type QuizQuestion = {
  id: number;
  category: QuizCategory;
  question: string | LocalizedValue<string>;
  options: [string, string, string] | LocalizedValue<[string, string, string]>;
  answerIndex: number;
  reference: string;
};

const isLocalizedValue = <T,>(value: T | LocalizedValue<T>): value is LocalizedValue<T> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeQuizLanguage = (language: string): QuizLanguage => {
  const normalized = (language || '').toLowerCase();

  if (normalized.startsWith('fr') || ['lsg', 'fob', 'darby', 'darbyr'].includes(normalized)) {
    return 'fr';
  }

  if (normalized.startsWith('it') || ['itadio', 'cei'].includes(normalized)) {
    return 'it';
  }

  if (normalized.startsWith('es') || ['rva', 'spavbl', 'rv1960'].includes(normalized)) {
    return 'es';
  }

  if (normalized.startsWith('pt') || ['acf', 'ara', 'nvi', 'kjaa'].includes(normalized)) {
    return 'pt';
  }

  if (
    normalized.startsWith('de') ||
    ['elb71', 'elb', 'luth1545', 'deu1912', 'deutkw'].includes(normalized)
  ) {
    return 'de';
  }

  return 'en';
};

const italianExactTerms: [string, string][] = [
  ['Jésus', 'Gesù'],
  ['Jean-Baptiste', 'Giovanni Battista'],
  ['Pierre', 'Pietro'],
  ['Jean', 'Giovanni'],
  ['Matthieu', 'Matteo'],
  ['Marc', 'Marco'],
  ['Luc', 'Luca'],
  ['Paul', 'Paolo'],
  ['André', 'Andrea'],
  ['Thomas', 'Tommaso'],
  ['Philippe', 'Filippo'],
  ['Jacques', 'Giacomo'],
  ['Apocalypse', 'Apocalisse'],
  ['Étienne', 'Stefano'],
  ['Etienne', 'Stefano'],
  ['Ésaïe', 'Isaia'],
  ['Jérémie', 'Geremia'],
  ['Ézéchiel', 'Ezechiele'],
  ['Osée', 'Osea'],
  ['Habacuc', 'Abacuc'],
  ['Abdias', 'Abdia'],
  ['Jonas', 'Giona'],
  ['Sophonie', 'Sofonia'],
  ['Aggée', 'Aggeo'],
  ['Zacharie', 'Zaccaria'],
  ['Malachie', 'Malachia'],
  ['Cantique des cantiques', 'Cantico dei Cantici'],
  ['Proverbes', 'Proverbi'],
  ['Ecclésiaste', 'Ecclesiaste'],
  ['Genèse', 'Genesi'],
  ['Exode', 'Esodo'],
  ['Lévitique', 'Levitico'],
  ['Nombres', 'Numeri'],
  ['Deutéronome', 'Deuteronomio'],
  ['Josué', 'Giosuè'],
  ['Juges', 'Giudici'],
  ['Ruth', 'Rut'],
  ['1 Samuel', '1 Samuele'],
  ['2 Samuel', '2 Samuele'],
  ['1 Rois', '1 Re'],
  ['2 Rois', '2 Re'],
  ['1 Chroniques', '1 Cronache'],
  ['2 Chroniques', '2 Cronache'],
  ['Esdras', 'Esdra'],
  ['Néhémie', 'Neemia'],
  ['Esther', 'Ester'],
  ['Job', 'Giobbe'],
  ['Moïse', 'Mosè'],
  ['Aaron', 'Aronne'],
  ['Abraham', 'Abramo'],
  ['Isaac', 'Isacco'],
  ['Jacob', 'Giacobbe'],
  ['David', 'Davide'],
  ['Salomon', 'Salomone'],
  ['Jérusalem', 'Gerusalemme'],
  ['Antioche', 'Antiochia'],
  ['Corinthe', 'Corinto'],
  ['Pentecôte', 'Pentecoste'],
  ['Psaumes', 'Salmi'],
  ['Épîtres pauliniennes', 'Epistole paoline'],
  ['Actes', 'Atti'],
  ['Romains', 'Romani'],
  ['1 Corinthiens', '1 Corinzi'],
  ['2 Corinthiens', '2 Corinzi'],
  ['Galates', 'Galati'],
  ['Éphésiens', 'Efesini'],
  ['Philippiens', 'Filippesi'],
  ['Colossiens', 'Colossesi'],
  ['1 Thessaloniciens', '1 Tessalonicesi'],
  ['2 Thessaloniciens', '2 Tessalonicesi'],
  ['1 Timothée', '1 Timoteo'],
  ['2 Timothée', '2 Timoteo'],
  ['Tite', 'Tito'],
  ['Hébreux', 'Ebrei'],
  ['Jacques', 'Giacomo'],
  ['1 Pierre', '1 Pietro'],
  ['2 Pierre', '2 Pietro'],
  ['1 Jean', '1 Giovanni'],
  ['2 Jean', '2 Giovanni'],
  ['3 Jean', '3 Giovanni'],
  ['Jude', 'Giuda'],
  ['Jesus', 'Gesù'],
  ['John', 'Giovanni'],
  ['John the Baptist', 'Giovanni Battista'],
  ['Peter', 'Pietro'],
  ['James', 'Giacomo'],
  ['Paul', 'Paolo'],
  ['Matthew', 'Matteo'],
  ['Mark', 'Marco'],
  ['Luke', 'Luca'],
  ['Andrew', 'Andrea'],
  ['Thomas', 'Tommaso'],
  ['Philip', 'Filippo'],
  ['Stephen', 'Stefano'],
  ['Revelation', 'Apocalisse'],
  ['Genesis', 'Genesi'],
  ['Exodus', 'Esodo'],
  ['Leviticus', 'Levitico'],
  ['Numbers', 'Numeri'],
  ['Deuteronomy', 'Deuteronomio'],
  ['Joshua', 'Giosuè'],
  ['Judges', 'Giudici'],
  ['Ruth', 'Rut'],
  ['1 Samuel', '1 Samuele'],
  ['2 Samuel', '2 Samuele'],
  ['1 Kings', '1 Re'],
  ['2 Kings', '2 Re'],
  ['1 Chronicles', '1 Cronache'],
  ['2 Chronicles', '2 Cronache'],
  ['Ezra', 'Esdra'],
  ['Nehemiah', 'Neemia'],
  ['Esther', 'Ester'],
  ['Job', 'Giobbe'],
  ['Psalms', 'Salmi'],
  ['Proverbs', 'Proverbi'],
  ['Acts', 'Atti'],
  ['Romans', 'Romani'],
  ['1 Corinthians', '1 Corinzi'],
  ['2 Corinthians', '2 Corinzi'],
  ['Galatians', 'Galati'],
  ['Ephesians', 'Efesini'],
  ['Philippians', 'Filippesi'],
  ['Colossians', 'Colossesi'],
  ['1 Thessalonians', '1 Tessalonicesi'],
  ['2 Thessalonians', '2 Tessalonicesi'],
  ['1 Timothy', '1 Timoteo'],
  ['2 Timothy', '2 Timoteo'],
  ['Titus', 'Tito'],
  ['Hebrews', 'Ebrei'],
  ['1 Peter', '1 Pietro'],
  ['2 Peter', '2 Pietro'],
  ['1 John', '1 Giovanni'],
  ['2 John', '2 Giovanni'],
  ['3 John', '3 Giovanni'],
  ['Jude', 'Giuda'],
  ['Ecclesiastes', 'Ecclesiaste'],
  ['Song of Songs', 'Cantico dei Cantici'],
];
const italianQuestionReplacements: [RegExp, string][] = [
  [/^Qui /, 'Chi '],
  [/^Quel /, 'Quale '],
  [/^Quelle /, 'Quale '],
  [/^Quelles /, 'Quali '],
  [/^Que /, 'Che '],
  [/^Qu’est-ce qui /, 'Che cosa '],
  [/^Qu'est-ce qui /, 'Che cosa '],
  [/^Qu’est-ce que /, 'Che cosa '],
  [/^Qu'est-ce que /, 'Che cosa '],
  [/^Dans quel /, 'In quale '],
  [/^Dans quelle /, 'In quale '],
  [/^Dans la /, 'Nella '],
  [/^Dans le /, 'Nel '],
  [/^À quel /, 'A quale '],
  [/^À quelle /, 'A quale '],
  [/^A quel /, 'A quale '],
  [/^A quelle /, 'A quale '],
  [/^Who /, 'Chi '],
  [/^Which /, 'Quale '],
  [/^What /, 'Cosa '],
  [/^In which /, 'In quale '],
  [/^To which /, 'A quale '],
  [/ in the Bible\?/g, ' nella Bibbia?'],
  [/ dans la Bible\?/g, ' nella Bibbia?'],
  [/ de la Bible\?/g, ' della Bibbia?'],
  [/ belongs to which testament\?/g, ' appartiene a quale testamento?'],
  [/ belongs to the New Testament\?/g, ' appartiene al Nuovo Testamento?'],
  [/ belongs to the Old Testament\?/g, " appartiene all'Antico Testamento?"],
  [/ appartient à quel testament\?/g, ' appartiene a quale testamento?'],
  [/ appartient au Nouveau Testament\?/g, ' appartiene al Nuovo Testamento?'],
  [/ appartient à l’Ancien Testament\?/g, " appartiene all'Antico Testamento?"],
  [/ appartient à l'Ancien Testament\?/g, " appartiene all'Antico Testamento?"],
  [/ book follows /g, ' libro segue '],
  [/ book precedes /g, ' libro precede '],
  [/Quel livre suit /g, 'Quale libro segue '],
  [/Quel livre précède /g, 'Quale libro precede '],
  [/Nouveau Testament/g, 'Nuovo Testamento'],
  [/Ancien Testament/g, 'Antico Testamento'],
  [/ New Testament/g, ' Nuovo Testamento'],
  [/ Old Testament/g, ' Antico Testamento'],
  [/ gospel /g, ' vangelo '],
  [/ epistle /g, ' epistola '],
  [/ prophet /g, ' profeta '],
  [/ apostle /g, ' apostolo '],
  [/ disciple /g, ' discepolo '],
  [/ miracle /g, ' miracolo '],
  [/ parable /g, ' parabola '],
  [/ chapter /g, ' capitolo '],
  [/ psalm /g, ' salmo '],

  [/déclaré/g, 'dichiarato'],
  [/a déclaré/g, 'ha dichiarato'],
  [/a dit/g, 'ha detto'],
  [/a écrit/g, 'ha scritto'],
  [/raconte/g, 'racconta'],
  [/commence par/g, 'inizia con'],
  [/Au commencement était la Parole/g, 'In principio era la Parola'],
  [/Je suis le chemin, la vérité et la vie/g, 'Io sono la via, la verità e la vita'],
  [/ la majorité des /g, ' la maggior parte delle '],
  [/épîtres/g, 'epistole'],
  [/évangile/g, 'vangelo'],
  [/livre/g, 'libro'],
  [/conversion de/g, 'conversione di'],
  [/Dans la parabole/g, 'Nella parabola'],
  [/de la perle de grand prix/g, 'della perla di grande valore'],
  [/que fait le marchand/g, 'cosa fa il mercante'],
  [/est enlevé/g, 'viene rapito'],
  [/dans un char de feu/g, 'in un carro di fuoco'],
  [/prophète/g, 'profeta'],
  [/Le livre de/g, 'Il libro di'],
  [/Les deux/g, 'Entrambi'],
  [/dans la Bible/g, 'nella Bibbia'],
  [/précède/g, 'precede'],
  [/suit/g, 'segue'],
];

const toItalian = (value: string): string => {
  const exact = italianExactTerms.find(([from]) => from === value.trim())?.[1];
  if (exact) return exact;

  let translated = value;
  for (const [pattern, replacement] of italianQuestionReplacements) {
    translated = translated.replace(pattern, replacement);
  }

  for (const [fr, it] of italianExactTerms) {
    translated = translated.split(fr).join(it);
  }

  return translated;
};

const spanishExactTerms: [string, string][] = [
  ['Jésus', 'Jesús'],
  ['Jean-Baptiste', 'Juan el Bautista'],
  ['Pierre', 'Pedro'],
  ['Jean', 'Juan'],
  ['Matthieu', 'Mateo'],
  ['Marc', 'Marcos'],
  ['Luc', 'Lucas'],
  ['Paul', 'Pablo'],
  ['André', 'Andrés'],
  ['Thomas', 'Tomás'],
  ['Philippe', 'Felipe'],
  ['Jacques', 'Santiago'],
  ['Étienne', 'Esteban'],
  ['Etienne', 'Esteban'],
  ['Ésaïe', 'Isaías'],
  ['Jérémie', 'Jeremías'],
  ['Ézéchiel', 'Ezequiel'],
  ['Osée', 'Oseas'],
  ['Habacuc', 'Habacuc'],
  ['Abdias', 'Abdías'],
  ['Jonas', 'Jonás'],
  ['Sophonie', 'Sofonías'],
  ['Aggée', 'Hageo'],
  ['Zacharie', 'Zacarías'],
  ['Malachie', 'Malaquías'],
  ['Cantique des cantiques', 'Cantar de los Cantares'],
  ['Proverbes', 'Proverbios'],
  ['Ecclésiaste', 'Eclesiastés'],
  ['Genèse', 'Génesis'],
  ['Exode', 'Éxodo'],
  ['Lévitique', 'Levítico'],
  ['Nombres', 'Números'],
  ['Deutéronome', 'Deuteronomio'],
  ['Josué', 'Josué'],
  ['Juges', 'Jueces'],
  ['Ruth', 'Rut'],
  ['1 Samuel', '1 Samuel'],
  ['2 Samuel', '2 Samuel'],
  ['1 Rois', '1 Reyes'],
  ['2 Rois', '2 Reyes'],
  ['1 Chroniques', '1 Crónicas'],
  ['2 Chroniques', '2 Crónicas'],
  ['Esdras', 'Esdras'],
  ['Néhémie', 'Nehemías'],
  ['Esther', 'Ester'],
  ['Job', 'Job'],
  ['Moïse', 'Moisés'],
  ['Aaron', 'Aarón'],
  ['Abraham', 'Abraham'],
  ['Isaac', 'Isaac'],
  ['Jacob', 'Jacob'],
  ['David', 'David'],
  ['Salomon', 'Salomón'],
  ['Jérusalem', 'Jerusalén'],
  ['Antioche', 'Antioquía'],
  ['Corinthe', 'Corinto'],
  ['Pentecôte', 'Pentecostés'],
  ['Psaumes', 'Salmos'],
  ['Épîtres pauliniennes', 'Epístolas paulinas'],
  ['Actes', 'Hechos'],
  ['Romains', 'Romanos'],
  ['1 Corinthiens', '1 Corintios'],
  ['2 Corinthiens', '2 Corintios'],
  ['Galates', 'Gálatas'],
  ['Éphésiens', 'Efesios'],
  ['Philippiens', 'Filipenses'],
  ['Colossiens', 'Colosenses'],
  ['1 Thessaloniciens', '1 Tesalonicenses'],
  ['2 Thessaloniciens', '2 Tesalonicenses'],
  ['1 Timothée', '1 Timoteo'],
  ['2 Timothée', '2 Timoteo'],
  ['Tite', 'Tito'],
  ['Hébreux', 'Hebreos'],
  ['1 Pierre', '1 Pedro'],
  ['2 Pierre', '2 Pedro'],
  ['1 Jean', '1 Juan'],
  ['2 Jean', '2 Juan'],
  ['3 Jean', '3 Juan'],
  ['Jude', 'Judas'],
  ['Apocalypse', 'Apocalipsis'],
  ['Jesus', 'Jesús'],
  ['John', 'Juan'],
  ['John the Baptist', 'Juan el Bautista'],
  ['Peter', 'Pedro'],
  ['James', 'Santiago'],
  ['Paul', 'Pablo'],
  ['Matthew', 'Mateo'],
  ['Mark', 'Marcos'],
  ['Luke', 'Lucas'],
  ['Andrew', 'Andrés'],
  ['Thomas', 'Tomás'],
  ['Philip', 'Felipe'],
  ['Stephen', 'Esteban'],
  ['Revelation', 'Apocalipsis'],
  ['Genesis', 'Génesis'],
  ['Exodus', 'Éxodo'],
  ['Leviticus', 'Levítico'],
  ['Numbers', 'Números'],
  ['Deuteronomy', 'Deuteronomio'],
  ['Joshua', 'Josué'],
  ['Judges', 'Jueces'],
  ['Psalms', 'Salmos'],
  ['Acts', 'Hechos'],
  ['Romans', 'Romanos'],
  ['1 Corinthians', '1 Corintios'],
  ['2 Corinthians', '2 Corintios'],
  ['Galatians', 'Gálatas'],
  ['Ephesians', 'Efesios'],
  ['Philippians', 'Filipenses'],
  ['Colossians', 'Colosenses'],
  ['1 Thessalonians', '1 Tesalonicenses'],
  ['2 Thessalonians', '2 Tesalonicenses'],
  ['1 Timothy', '1 Timoteo'],
  ['2 Timothy', '2 Timoteo'],
  ['Titus', 'Tito'],
  ['Hebrews', 'Hebreos'],
  ['1 Peter', '1 Pedro'],
  ['2 Peter', '2 Pedro'],
  ['1 John', '1 Juan'],
  ['2 John', '2 Juan'],
  ['3 John', '3 Juan'],
  ['Jude', 'Judas'],
  ['Ecclesiastes', 'Eclesiastés'],
  ['Song of Songs', 'Cantar de los Cantares'],
  ['Antioch', 'Antioquía'],
  ['Corinth', 'Corinto'],
  ['Nineveh', 'Nínive'],
  ['Babylon', 'Babilonia'],
  ['Goliath', 'Goliat'],
  ['Lazarus', 'Lázaro'],
  ['Saul', 'Saúl'],
  ['Elijah', 'Elías'],
  ['Elisha', 'Eliseo'],
  ['Solomon', 'Salomón'],
  ['Moses', 'Moisés'],
  ['Samuel', 'Samuel'],
  ['Gethsemane', 'Getsemaní'],
  ['Nain', 'Naín'],
  ['Bethlehem', 'Belén'],
  ['Lamentations', 'Lamentaciones'],
  ['Micah', 'Miqueas'],
  ['Nahum', 'Nahúm'],
  ['Obadiah', 'Abdías'],
  ['Zephaniah', 'Sofonías'],
  ['Zechariah', 'Zacarías'],
  ['Haggai', 'Hageo'],
  ['Habakkuk', 'Habacuc'],
  ['Joel', 'Joel'],
  ['Amos', 'Amós'],
  ['Hosea', 'Oseas'],
  ['Daniel', 'Daniel'],
  ['Malachi', 'Malaquías'],
  ['Philemon', 'Filemón'],
  ['Song of Solomon', 'Cantar de los Cantares'],
  ['Proverbs', 'Proverbios'],
  ['Nicodemus', 'Nicodemo'],
  ['Joseph of Arimathea', 'José de Arimatea'],
  ['Simon of Cyrene', 'Simón de Cirene'],
  ['Rahab', 'Rajab'],
  ['Hannah', 'Ana'],
  ['Deborah', 'Débora'],
  ['Samson', 'Sansón'],
  ['Nehemiah', 'Nehemías'],
  ['Isaiah', 'Isaías'],
  ['Jeremiah', 'Jeremías'],
  ['Ezekiel', 'Ezequiel'],
  ['Jonah', 'Jonás'],
  ['Nebuchadnezzar', 'Nabucodonosor'],
  ['Belshazzar', 'Belsasar'],
  ['Jezebel', 'Jezabel'],
  ['Ahab', 'Acab'],
  ['Josiah', 'Josías'],
  ['Uzziah', 'Uzías'],
  ['Hezekiah', 'Ezequías'],
  ['Jeroboam', 'Jeroboam'],
  ['Rehoboam', 'Roboam'],
  ['Zerubbabel', 'Zorobabel'],
  ['Onesimus', 'Onésimo'],
  ['Barnabas', 'Bernabé'],
  ['Nathan', 'Natán'],
  ['Pontius Pilate', 'Poncio Pilato'],
  ['Bartimaeus', 'Bartimeo'],
  ['Jairus', 'Jairo'],
  ['Legion', 'Legión'],
  ['Gomer', 'Gomer'],
  ['Tekoa', 'Tecoa'],
  ['Turn water into wine', 'Convertir el agua en vino'],
  ['Feed 5,000 people', 'Alimentar a 5.000 personas'],
  ['Heal a blind man', 'Sanar a un ciego'],
  ['Old Testament', 'Antiguo Testamento'],
  ['New Testament', 'Nuevo Testamento'],
  ['Rock', 'Roca'],
  ['Sand', 'Arena'],
  ['Good land', 'Buena tierra'],
  ['In a boat', 'En una barca'],
  ['In the garden of Gethsemane', 'En el huerto de Getsemaní'],
  ['At the temple', 'En el templo'],
  ['The hem of his garment', 'El borde de su manto'],
  ['A Levite', 'Un levita'],
  ['A Samaritan', 'Un samaritano'],
  ['A priest', 'Un sacerdote'],
  ['In dough', 'En la masa'],
  ['Seven loaves', 'Siete panes'],
  ['Five loaves', 'Cinco panes'],
  ['Two fish', 'Dos peces'],
  ['12 baskets', '12 cestas'],
  ['7 baskets', '7 cestas'],
  ['Saliva', 'Saliva'],
  ['Ephphatha', 'Efatá'],
  ['Talitha koum', 'Talita cumi'],
  ['He sells all he has to buy it', 'Vende todo lo que tiene para comprarlo'],
  ['He runs to meet him', 'Corre a su encuentro'],
  ['He wants to build bigger barns', 'Quiere construir graneros más grandes'],
  ['He gives everyone the same wage', 'Da a todos el mismo salario'],
  ['It grows into a large tree', 'Crece hasta ser un gran árbol'],
  ['We throw them away', 'Los desechamos'],
  ['He sells all he has', 'Vende todo lo que tiene'],
  ['She persists in asking', 'Ella persiste en pedir'],
  ['Everyone from the streets', 'Todos los de las calles'],
  ['He decides to give it one more year', 'Decide darle un año más'],
  ['10,000 talents', '10.000 talentos'],
  ['One talent', 'Un talento'],
  ['Five', 'Cinco'],
];

const spanishQuestionReplacements: [RegExp, string][] = [
  [/^Qui /, '¿Quién '],
  [/^Quel /, '¿Cuál '],
  [/^Quelle /, '¿Cuál '],
  [/^Quelles /, '¿Cuáles '],
  [/^Que /, '¿Qué '],
  [/^Who /, '¿Quién '],
  [/^Which /, '¿Cuál '],
  [/^What /, '¿Qué '],
  [/\bwrote\b/g, 'escribió'],
  [/\bsaid\b/g, 'dijo'],
  [/\bbegins with\b/g, 'comienza con'],
  [/^In which /, '¿En qué '],
  [/^To which /, '¿A qué '],
  [/ in the Bible\?/g, ' en la Biblia?'],
  [/ dans la Bible\?/g, ' en la Biblia?'],
  [/ de la Bible\?/g, ' de la Biblia?'],
  [/ belongs to which testament\?/g, ' pertenece a qué testamento?'],
  [/ belongs to the New Testament\?/g, ' pertenece al Nuevo Testamento?'],
  [/ belongs to the Old Testament\?/g, ' pertenece al Antiguo Testamento?'],
  [/ appartient à quel testament\?/g, ' pertenece a qué testamento?'],
  [/ appartient au Nouveau Testament\?/g, ' pertenece al Nuevo Testamento?'],
  [/ appartient à l’Ancien Testament\?/g, ' pertenece al Antiguo Testamento?'],
  [/ appartient à l'Ancien Testament\?/g, ' pertenece al Antiguo Testamento?'],
  [/ book follows /g, ' libro sigue a '],
  [/ book precedes /g, ' libro precede a '],
  [/Quel livre suit /g, '¿Qué libro sigue a '],
  [/Quel livre précède /g, '¿Qué libro precede a '],
  [/Nouveau Testament/g, 'Nuevo Testamento'],
  [/Ancien Testament/g, 'Antiguo Testamento'],
  [/ New Testament/g, ' Nuevo Testamento'],
  [/ Old Testament/g, ' Antiguo Testamento'],
  [/ gospel /g, ' evangelio '],
  [/ epistle /g, ' epístola '],
  [/ prophet /g, ' profeta '],
  [/ apostle /g, ' apóstol '],
  [/ disciple /g, ' discípulo '],
  [/ miracle /g, ' milagro '],
  [/ parable /g, ' parábola '],
  [/ chapter /g, ' capítulo '],
  [/ psalm /g, ' salmo '],
  [/déclaré/g, 'declarado'],
  [/a déclaré/g, 'declaró'],
  [/a dit/g, 'dijo'],
  [/a écrit/g, 'escribió'],
  [/raconte/g, 'narra'],
  [/commence par/g, 'comienza con'],
  [/Au commencement était la Parole/g, 'En el principio era el Verbo'],
  [/Je suis le chemin, la vérité et la vie/g, 'Yo soy el camino, la verdad y la vida'],
  [/ la majorité des /g, ' la mayoría de las '],
  [/épîtres/g, 'epístolas'],
  [/évangile/g, 'evangelio'],
  [/livre/g, 'libro'],
  [/conversion de/g, 'conversión de'],
  [/Dans la parabole/g, 'En la parábola'],
  [/de la perle de grand prix/g, 'de la perla de gran precio'],
  [/que fait le marchand/g, 'qué hace el comerciante'],
  [/est enlevé/g, 'es arrebatado'],
  [/dans un char de feu/g, 'en un carro de fuego'],
  [/prophète/g, 'profeta'],
  [/Le livre de/g, 'El libro de'],
  [/Les deux/g, 'Ambos'],
  [/dans la Bible/g, 'en la Biblia'],
  [/précède/g, 'precede'],
  [/suit/g, 'sigue'],
  [/^How many /g, '¿Cuántos '],
  [/^Where /g, '¿Dónde '],
  [/^When /g, '¿Cuándo '],
  [/^At the /g, 'En la '],
  [/^The book of /g, 'El libro de '],
  [/^The /g, 'El '],
  [/^Jesus /g, 'Jesús '],
  [/\bwalked on water to\b/g, 'caminó sobre el agua hacia'],
  [/\bwalked on water\b/g, 'caminó sobre el agua'],
  [/\bstarts to sink when walking on water\b/g, 'empieza a hundirse al caminar sobre el agua'],
  [/\bchanges water into wine\b/g, 'convierte el agua en vino'],
  [/\basked for wisdom\b/g, 'pidió sabiduría'],
  [/\basked for\b/g, 'pidió'],
  [/\bbaptized\b/g, 'bautizó a'],
  [/\bbetrayed\b/g, 'traicionó a'],
  [/\bdenied\b/g, 'negó a'],
  [/\bbuilt the ark\b/g, 'construyó el arca'],
  [/\bbuilt the temple\b/g, 'construyó el templo'],
  [/\bbuilt\b/g, 'construyó'],
  [/\breceived the Ten Commandments\b/g, 'recibió los Diez Mandamientos'],
  [/\breceived the tablets of the law on Sinai\b/g, 'recibió las tablas de la ley en el Sinaí'],
  [/\breceived\b/g, 'recibió'],
  [/\bfaced\b/g, 'enfrentó a'],
  [/\bdoubted the resurrection\b/g, 'dudó de la resurrección'],
  [/\bdoubted\b/g, 'dudó de'],
  [/\bhad a vision of a sheet full of animals\b/g, 'tuvo una visión de un lienzo lleno de animales'],
  [/\bhad a vision\b/g, 'tuvo una visión'],
  [/\btells of Saul's conversion\b/g, 'relata la conversión de Saulo'],
  [/\btells of the Exodus from Egypt\b/g, 'relata el Éxodo de Egipto'],
  [/\btells of\b/g, 'relata'],
  [/\bspeaks of the fruit of the Spirit\b/g, 'habla del fruto del Espíritu'],
  [/\bspeaks of joy in adversity\b/g, 'habla del gozo en la adversidad'],
  [/\bspeaks of\b/g, 'habla de'],
  [/\bqualifies as\b/g, 'se califica como'],
  [/\bis attributed to a doctor\b/g, 'se atribuye a un médico'],
  [/\bis attributed to\b/g, 'se atribuye a'],
  [/\bis called\b/g, 'es llamado'],
  [/\bis considered\b/g, 'es considerado'],
  [/\bis one of the four canonical gospels\b/g, 'es uno de los cuatro evangelios canónicos'],
  [/\bis one of the\b/g, 'es uno de los'],
  [/\bis the shortest\b/g, 'es el más corto'],
  [/\bis stricken with leprosy for offering incense\b/g, 'es afligido con lepra por ofrecer incienso'],
  [/\bis a prayer of repentance from\b/g, 'es una oración de arrepentimiento de'],
  [/\bis a collection of songs and prayers\b/g, 'es una colección de cantos y oraciones'],
  [/\bis healed\b/g, 'es sanado'],
  [/\bis used to pay\b/g, 'se usa para pagar'],
  [/\bwas also a prophetess\b/g, 'fue también una profetisa'],
  [/\bwas a tax collector\b/g, 'fue un recaudador de impuestos'],
  [/\bwas a doctor\b/g, 'fue un médico'],
  [/\bwas sent to Nineveh\b/g, 'fue enviado a Nínive'],
  [/\bwas swallowed by a big fish\b/g, 'fue tragado por un gran pez'],
  [/\bwas caught up in a chariot of fire\b/g, 'fue arrebatado en un carro de fuego'],
  [/\bwas thrown into the lions' den\b/g, 'fue arrojado al foso de los leones'],
  [/\bwas humiliated and lived like an animal\b/g, 'fue humillado y vivió como un animal'],
  [/\bwas shepherd of Tekoa\b/g, 'fue pastor de Tecoa'],
  [/\bwas Samuel's mother\b/g, 'fue la madre de Samuel'],
  [/\bsaved her people\b/g, 'salvó a su pueblo'],
  [/\bfought with the jaw of a donkey\b/g, 'luchó con la quijada de un asno'],
  [/\bgleaned in the fields of Boaz\b/g, 'espigó en los campos de Booz'],
  [/\brecognizes Jesus as the "Lamb of God"\b/g, 'reconoce a Jesús como el "Cordero de Dios"'],
  [/\brecognizes\b/g, 'reconoce a'],
  [/\bsucceeded Elijah\b/g, 'sucedió a Elías'],
  [/\bsucceeded\b/g, 'sucedió a'],
  [/\banointed David as king\b/g, 'ungió a David como rey'],
  [/\banointed\b/g, 'ungió a'],
  [/\bchallenged the prophets of Baal on Mount Carmel\b/g, 'desafió a los profetas de Baal en el Monte Carmelo'],
  [/\bchallenged\b/g, 'desafió a'],
  [/\bencourages the rebuilding of the temple with Zerubbabel\b/g, 'anima a la reconstrucción del templo con Zorobabel'],
  [/\bencourages running with perseverance\b/g, 'anima a correr con perseverancia'],
  [/\bencourages\b/g, 'anima a'],
  [/\bannounces a "new covenant"\b/g, 'anuncia un "nuevo pacto"'],
  [/\bannounces the "suffering servant"\b/g, 'anuncia el "siervo sufriente"'],
  [/\bannounces\b/g, 'anuncia'],
  [/\bsaw the valley of dry bones\b/g, 'vio el valle de los huesos secos'],
  [/\bsees a valley of dry bones\b/g, 've un valle de huesos secos'],
  [/\bsees a wheel within a wheel\b/g, 've una rueda dentro de una rueda'],
  [/\bsees seraphim singing "Holy, holy, holy"\b/g, 've serafines cantando "Santo, santo, santo"'],
  [/\bsees the writing on the wall\b/g, 've la escritura en la pared'],
  [/\bsees the Assyrian army defeated by an angel\b/g, 've el ejército asirio derrotado por un ángel'],
  [/\bsees\b/g, 've'],
  [/\bwrites proverbs and songs\b/g, 'escribe proverbios y cánticos'],
  [/\bwrites\b/g, 'escribe'],
  [/\bpresents Christ as the head of the Church\b/g, 'presenta a Cristo como la cabeza de la Iglesia'],
  [/\bpresents\b/g, 'presenta a'],
  [/\bmentions "the good fight" of faith\b/g, 'menciona "la buena batalla" de la fe'],
  [/\bmentions\b/g, 'menciona'],
  [/\bstates "God is love"\b/g, 'declara "Dios es amor"'],
  [/\bstates that "the Lord gives wisdom"\b/g, 'declara que "el Señor da sabiduría"'],
  [/\bstates "The LORD is my shepherd"\b/g, 'declara "El Señor es mi pastor"'],
  [/\bstates\b/g, 'declara'],
  [/\brepented after the affair of Naboth\b/g, 'se arrepintió después del asunto de Nabot'],
  [/\brepented\b/g, 'se arrepintió'],
  [/\bmarries Jezebel\b/g, 'se casa con Jezabel'],
  [/\bmarries Gomer\b/g, 'se casa con Gomer'],
  [/\bmarries\b/g, 'se casa con'],
  [/\bfinds the book of the law during a reform\b/g, 'encuentra el libro de la ley durante una reforma'],
  [/\bfinds\b/g, 'encuentra'],
  [/\bspares Agag, king of Amalek\b/g, 'perdona a Agag, rey de Amalec'],
  [/\bspares\b/g, 'perdona a'],
  [/\bunifies the kingdom after Saul\b/g, 'unifica el reino después de Saúl'],
  [/\bunifies\b/g, 'unifica'],
  [/\bdestroyed Jerusalem\b/g, 'destruyó Jerusalén'],
  [/\bdestroyed\b/g, 'destruyó'],
  [/\bdefeated by an angel\b/g, 'derrotado por un ángel'],
  [/\bdefeated\b/g, 'derrotado'],
  [/\brolls the stone from the tomb\b/g, 'quita la piedra del sepulcro'],
  [/\brolls\b/g, 'quita'],
  [/\bcarry the cross\b/g, 'llevar la cruz'],
  [/\boffered Isaac\b/g, 'ofreció a Isaac'],
  [/\boffered\b/g, 'ofreció'],
  [/\bhid the spies in Jericho\b/g, 'escondió a los espías en Jericó'],
  [/\bhid\b/g, 'escondió'],
  [/\binterpreted the Pharaoh's dreams\b/g, 'interpretó los sueños del Faraón'],
  [/\binterpreted\b/g, 'interpretó'],
  [/\brebuilt the walls of Jerusalem\b/g, 'reconstruyó los muros de Jerusalén'],
  [/\brebuilt\b/g, 'reconstruyó'],
  [/\bled Israel after Moses\b/g, 'condujo a Israel después de Moisés'],
  [/\bled Israel around Jericho\b/g, 'condujo a Israel alrededor de Jericó'],
  [/\bled\b/g, 'condujo a'],
  [/\bhelps Jesus carry the cross\b/g, 'ayuda a Jesús a llevar la cruz'],
  [/\bhelps the injured man\b/g, 'ayuda al hombre herido'],
  [/\bhelps\b/g, 'ayuda a'],
  [/\bdreamed of a ladder to heaven\b/g, 'soñó con una escalera al cielo'],
  [/\bdreamed of\b/g, 'soñó con'],
  [/\basks for the body of\b/g, 'pide el cuerpo de'],
  [/\bwho is traditionally associated with\b/g, 'quién se asocia tradicionalmente con'],
  [/\bwho is the author of\b/g, 'quién es el autor de'],
  [/\bthe first king of Israel\b/g, 'el primer rey de Israel'],
  [/\bthe first Christian martyr\b/g, 'el primer mártir cristiano'],
  [/\bwrote most of the Psalms\b/g, 'escribió la mayoría de los Salmos'],
  [/\bwrote the Revelation\b/g, 'escribió el Apocalipsis'],
  [/\bwrote "the righteous shall live by faith"\b/g, 'escribió "el justo vivirá por fe"'],
  [/\bwhat event takes place\b/g, 'qué evento tiene lugar'],
  [/\bsays, "Faith without works is dead"\b/g, 'dice: "La fe sin obras está muerta"'],
  [/\bdo we find "Rejoice always"\b/g, 'encontramos "Estad siempre gozosos"'],
  [/\bdo we read "all things work together for good"\b/g, 'leemos "todas las cosas cooperan para bien"'],
  [/\bdoes Paul speak of the "crown of righteousness"\b/g, 'Pablo habla de la "corona de justicia"'],
  [/\bis the armor of God found\b/g, 'se encuentra la armadura de Dios'],
  [/\bare the Beatitudes found\b/g, 'se encuentran las Bienaventuranzas'],
  [/\bis the Sermon on the Mount found\b/g, 'se encuentra el Sermón del Monte'],
  [/\bis the creation story found\b/g, 'se encuentra la historia de la creación'],
  [/\bare the Ten Commandments found\b/g, 'se encuentran los Diez Mandamientos'],
  [/\bdo we find the visit of the wise men\b/g, 'encontramos la visita de los magos'],
  [/\bcontains the hymn to love\b/g, 'contiene el himno al amor'],
  [/\bcontains "There is a Time for Everything"\b/g, 'contiene "Todo tiene su tiempo"'],
  [/\bcontains\b/g, 'contiene'],
  [/\bcelebrates the love between husband and wife\b/g, 'celebra el amor entre esposo y esposa'],
  [/\bcelebrates\b/g, 'celebra'],
  [/\bopens with "Vanity of Vanities"\b/g, 'comienza con "Vanidad de vanidades"'],
  [/\bopens with\b/g, 'comienza con'],
  [/\binvites us to bless the Lord for his benefits\b/g, 'nos invita a bendecir al Señor por sus beneficios'],
  [/\binvites\b/g, 'invita a'],
  [/\bdescribes the "virtuous woman"\b/g, 'describe a la "mujer virtuosa"'],
  [/\bdescribes\b/g, 'describe'],
  [/\brighteous man suffers and is tested in his book\b/g, 'hombre justo sufre y es probado en su libro'],
  [/\bthe disciple whom Jesus loved\b/g, 'el discípulo que Jesús amaba'],
  [/\bson of encouragement\b/g, 'hijo de consolación'],
  [/\baddressed to Philemon concerning Onesimus\b/g, 'dirigida a Filemón acerca de Onésimo'],
  [/\bJesus' first miracle according to\b/g, 'el primer milagro de Jesús según'],
  [/\bwith a kiss\b/g, 'con un beso'],
  [/\bthree times\b/g, 'tres veces'],
  [/\baccording to\b/g, 'según'],
  [/\bwere the disciples first called Christians\b/g, 'fueron los discípulos llamados cristianos por primera vez'],
  [/\blukewarm\b/g, 'tibia'],
  [/\bfour canonical gospels\b/g, 'cuatro evangelios canónicos'],
  [/\bcity\b/g, 'ciudad'],
  [/\bchurch\b/g, 'iglesia'],
  [/\bchapter\b/g, 'capítulo'],
  [/\bletter\b/g, 'carta'],
  [/\bking\b/g, 'rey'],
  [/\bqueen\b/g, 'reina'],
  [/\bjudge\b/g, 'juez'],
  [/\bpatriarch\b/g, 'patriarca'],
  [/\bdays\b/g, 'días'],
  [/\bdid Jesus fast in the desert\b/g, 'ayunó Jesús en el desierto'],
  [/\bwas Lazarus in the tomb\b/g, 'estuvo Lázaro en el sepulcro'],
  [/\blepers come back to thank\b/g, 'leprosos vuelven a dar gracias a'],
  [/\bIn the parable of /g, 'En la parábola de '],
  [/\bthe Good Samaritan\b/g, 'el Buen Samaritano'],
  [/\bthe prodigal son\b/g, 'el hijo pródigo'],
  [/\bthe mustard seed\b/g, 'la semilla de mostaza'],
  [/\bthe hidden treasure\b/g, 'el tesoro escondido'],
  [/\bthe barren fig tree\b/g, 'la higuera estéril'],
  [/\bthe merciless debtor\b/g, 'el deudor despiadado'],
  [/\bthe unjust judge\b/g, 'el juez injusto'],
  [/\bthe wedding banquet\b/g, 'el banquete de bodas'],
  [/\bthe two houses\b/g, 'las dos casas'],
  [/\bthe ten virgins\b/g, 'las diez vírgenes'],
  [/\bthe workers in the vineyard\b/g, 'los obreros de la viña'],
  [/\bthe lost sheep\b/g, 'la oveja perdida'],
  [/\bthe sower\b/g, 'el sembrador'],
  [/\bthe pearl of great price\b/g, 'la perla de gran precio'],
  [/\bthe talents\b/g, 'los talentos'],
  [/\bthe net\b/g, 'la red'],
  [/\bleaven\b/g, 'la levadura'],
  [/\bthe rich fool\b/g, 'el rico insensato'],
  [/\bthe Pharisee and the tax collector\b/g, 'el fariseo y el publicano'],
  [/\bwho helps the injured man\b/g, 'quién ayuda al hombre herido'],
  [/\bwho is justified\b/g, 'quién es justificado'],
  [/\bwhere is the leaven hidden\b/g, 'dónde se esconde la levadura'],
  [/\bwhat does the winegrower decide\b/g, 'qué decide el viñador'],
  [/\bwhat does the man do\b/g, 'qué hace el hombre'],
  [/\bhow many sheep are there\b/g, 'cuántas ovejas hay'],
  [/\bwhat debt is forgiven\b/g, 'qué deuda es perdonada'],
  [/\bwhat happens to the seed\b/g, 'qué le sucede a la semilla'],
  [/\bwhat do we do with the bad fish\b/g, 'qué hacemos con los peces malos'],
  [/\bwhat does the merchant do\b/g, 'qué hace el mercader'],
  [/\bwhat does the father do\b/g, 'qué hace el padre'],
  [/\bwhat does the rich man want to do\b/g, 'qué quiere hacer el rico'],
  [/\bwhat do the thorns represent\b/g, 'qué representan los espinos'],
  [/\bwhich land bears much fruit\b/g, 'qué tierra da mucho fruto'],
  [/\bhow many talents does the third servant receive\b/g, 'cuántos talentos recibe el tercer siervo'],
  [/\bhow many were wise\b/g, 'cuántas eran prudentes'],
  [/\bwhat is the stable house built on\b/g, 'sobre qué está construida la casa firme'],
  [/\bwhat does the widow do\b/g, 'qué hace la viuda'],
  [/\bwho is ultimately invited\b/g, 'quiénes son finalmente invitados'],
  [/\bwhat wages do they receive\b/g, 'qué salario reciben'],
  [/\bwhich prophets appear\b/g, 'qué profetas aparecen'],
  [/\bhow many loaves did they have\b/g, 'cuántos panes tenían'],
  [/\bhow many fish did they have\b/g, 'cuántos peces tenían'],
  [/\bwhat word did Jesus say to heal\b/g, 'qué palabra dijo Jesús para sanar'],
  [/\bwhat word did Jesus say to raise up\b/g, 'qué palabra dijo Jesús para levantar'],
  [/\bwhat did Jesus say to Peter during the miraculous catch\b/g, 'qué le dijo Jesús a Pedro durante la pesca milagrosa'],
  [/\bwhat did Jesus use to make mud for the man born blind\b/g, 'qué usó Jesús para hacer barro para el ciego de nacimiento'],
  [/\bwhat does Bartimaeus shout to attract Jesus\b/g, 'qué grita Bartimeo para atraer a Jesús'],
  [/\bwhat does a woman with hemorrhoids touch to be cured\b/g, 'qué toca una mujer con hemorragia para ser curada'],
  [/\bwhere did Jesus pray before his arrest\b/g, 'dónde oró Jesús antes de su arresto'],
  [/\bwhere does Jesus resurrect the widow's son\b/g, 'dónde resucita Jesús al hijo de la viuda'],
  [/\bwhere is Jesus presented as a child\b/g, 'dónde es presentado Jesús como niño'],
  [/\bwhere was Jesus born\b/g, 'dónde nació Jesús'],
  [/\bwhere was Jesus sleeping when he calmed the storm\b/g, 'dónde dormía Jesús cuando calmó la tempestad'],
  [/\bWhich Roman governor judges Jesus\b/g, 'Qué gobernador romano juzga a Jesús'],
  [/\bJohn's brother\b/g, 'el hermano de Juan'],
  [/\bthe centurion's servant is healed\b/g, 'el siervo del centurión es sanado'],
  [/\bthe coin found in the fish is used to pay\b/g, 'la moneda encontrada en el pez se usa para pagar'],
  [/\bthe paralytic lowered through the roof is healed\b/g, 'el paralítico bajado por el techo es sanado'],
  [/\bthe demons called in the pig episode\b/g, 'los demonios en el episodio de los cerdos'],
  [/\bthe feeding of the 4,000\b/g, 'la alimentación de los 4.000'],
  [/\bwhen the loaves were multiplied\b/g, 'cuando se multiplicaron los panes'],
  [/\bwhen they multiplied\b/g, 'cuando se multiplicaron'],
  [/\bJesus' brother\b/g, 'el hermano de Jesús'],
  [/\bsuccessor\b/g, 'sucesor'],
  [/\bWho succeeds David\b/g, 'Quién sucede a David'],
  [/\bsuccessor of David\b/g, 'sucesor de David'],
  [/\bking succeeds\b/g, 'rey sucede a'],
];

const toSpanish = (value: string): string => {
  const exact = spanishExactTerms.find(([from]) => from === value.trim())?.[1];
  if (exact) return exact;

  let translated = value;
  for (const [pattern, replacement] of spanishQuestionReplacements) {
    translated = translated.replace(pattern, replacement);
  }

  for (const [source, es] of spanishExactTerms) {
    translated = translated.split(source).join(es);
  }

  return translated;
};

const portugueseExactTerms: [string, string][] = [
  ['Jésus', 'Jesus'],
  ['Jean-Baptiste', 'João Batista'],
  ['Pierre', 'Pedro'],
  ['Jean', 'João'],
  ['Matthieu', 'Mateus'],
  ['Marc', 'Marcos'],
  ['Luc', 'Lucas'],
  ['Paul', 'Paulo'],
  ['André', 'André'],
  ['Thomas', 'Tomé'],
  ['Philippe', 'Filipe'],
  ['Jacques', 'Tiago'],
  ['Étienne', 'Estêvão'],
  ['Etienne', 'Estêvão'],
  ['Ésaïe', 'Isaías'],
  ['Jérémie', 'Jeremias'],
  ['Ézéchiel', 'Ezequiel'],
  ['Osée', 'Oséias'],
  ['Abdias', 'Obadias'],
  ['Jonas', 'Jonas'],
  ['Sophonie', 'Sofonias'],
  ['Aggée', 'Ageu'],
  ['Zacharie', 'Zacarias'],
  ['Malachie', 'Malaquias'],
  ['Cantique des cantiques', 'Cântico dos Cânticos'],
  ['Proverbes', 'Provérbios'],
  ['Ecclésiaste', 'Eclesiastes'],
  ['Genèse', 'Gênesis'],
  ['Exode', 'Êxodo'],
  ['Lévitique', 'Levítico'],
  ['Nombres', 'Números'],
  ['Deutéronome', 'Deuteronômio'],
  ['Josué', 'Josué'],
  ['Juges', 'Juízes'],
  ['Ruth', 'Rute'],
  ['1 Rois', '1 Reis'],
  ['2 Rois', '2 Reis'],
  ['1 Chroniques', '1 Crônicas'],
  ['2 Chroniques', '2 Crônicas'],
  ['Néhémie', 'Neemias'],
  ['Moïse', 'Moisés'],
  ['Salomon', 'Salomão'],
  ['Jérusalem', 'Jerusalém'],
  ['Pentecôte', 'Pentecostes'],
  ['Psaumes', 'Salmos'],
  ['Épîtres pauliniennes', 'Epístolas paulinas'],
  ['Actes', 'Atos'],
  ['Romains', 'Romanos'],
  ['1 Corinthiens', '1 Coríntios'],
  ['2 Corinthiens', '2 Coríntios'],
  ['Galates', 'Gálatas'],
  ['Éphésiens', 'Efésios'],
  ['Philippiens', 'Filipenses'],
  ['Colossiens', 'Colossenses'],
  ['1 Thessaloniciens', '1 Tessalonicenses'],
  ['2 Thessaloniciens', '2 Tessalonicenses'],
  ['1 Timothée', '1 Timóteo'],
  ['2 Timothée', '2 Timóteo'],
  ['Hébreux', 'Hebreus'],
  ['1 Pierre', '1 Pedro'],
  ['2 Pierre', '2 Pedro'],
  ['1 Jean', '1 João'],
  ['2 Jean', '2 João'],
  ['3 Jean', '3 João'],
  ['Jude', 'Judas'],
  ['Apocalypse', 'Apocalipse'],
  ['John the Baptist', 'João Batista'],
  ['James', 'Tiago'],
  ['Matthew', 'Mateus'],
  ['Luke', 'Lucas'],
  ['Philip', 'Filipe'],
  ['Stephen', 'Estêvão'],
  ['Revelation', 'Apocalipse'],
  ['Genesis', 'Gênesis'],
  ['Exodus', 'Êxodo'],
  ['Leviticus', 'Levítico'],
  ['Numbers', 'Números'],
  ['Deuteronomy', 'Deuteronômio'],
  ['Judges', 'Juízes'],
  ['Psalms', 'Salmos'],
  ['Acts', 'Atos'],
  ['Romans', 'Romanos'],
  ['1 Corinthians', '1 Coríntios'],
  ['2 Corinthians', '2 Coríntios'],
  ['Galatians', 'Gálatas'],
  ['Ephesians', 'Efésios'],
  ['Colossians', 'Colossenses'],
  ['1 Thessalonians', '1 Tessalonicenses'],
  ['2 Thessalonians', '2 Tessalonicenses'],
  ['1 Timothy', '1 Timóteo'],
  ['2 Timothy', '2 Timóteo'],
  ['Hebrews', 'Hebreus'],
  ['1 John', '1 João'],
  ['2 John', '2 João'],
  ['3 John', '3 João'],
  ['Song of Songs', 'Cântico dos Cânticos'],
  ['Antioch', 'Antioquia'],
  ['Corinth', 'Corinto'],
  ['Nineveh', 'Nínive'],
  ['Babylon', 'Babilônia'],
  ['Goliath', 'Golias'],
  ['Lazarus', 'Lázaro'],
  ['Saul', 'Saul'],
  ['Elijah', 'Elias'],
  ['Elisha', 'Eliseu'],
  ['Solomon', 'Salomão'],
  ['Moses', 'Moisés'],
  ['Samuel', 'Samuel'],
  ['Gethsemane', 'Getsêmani'],
  ['Nain', 'Naim'],
  ['Bethlehem', 'Belém'],
  ['Lamentations', 'Lamentações'],
  ['Micah', 'Miqueias'],
  ['Nahum', 'Naum'],
  ['Obadiah', 'Obadias'],
  ['Zephaniah', 'Sofonias'],
  ['Zechariah', 'Zacarias'],
  ['Haggai', 'Ageu'],
  ['Habakkuk', 'Habacuque'],
  ['Joel', 'Joel'],
  ['Amos', 'Amós'],
  ['Hosea', 'Oséias'],
  ['Daniel', 'Daniel'],
  ['Malachi', 'Malaquias'],
  ['Philemon', 'Filemom'],
  ['Song of Solomon', 'Cântico dos Cânticos'],
  ['Proverbs', 'Provérbios'],
  ['Nicodemus', 'Nicodemos'],
  ['Joseph of Arimathea', 'José de Arimateia'],
  ['Simon of Cyrene', 'Simão de Cirene'],
  ['Rahab', 'Raabe'],
  ['Hannah', 'Ana'],
  ['Deborah', 'Débora'],
  ['Samson', 'Sansão'],
  ['Nehemiah', 'Neemias'],
  ['Isaiah', 'Isaías'],
  ['Jeremiah', 'Jeremias'],
  ['Ezekiel', 'Ezequiel'],
  ['Jonah', 'Jonas'],
  ['Nebuchadnezzar', 'Nabucodonosor'],
  ['Belshazzar', 'Belsazar'],
  ['Jezebel', 'Jezabel'],
  ['Ahab', 'Acabe'],
  ['Josiah', 'Josias'],
  ['Uzziah', 'Uzias'],
  ['Hezekiah', 'Ezequias'],
  ['Jeroboam', 'Jeroboão'],
  ['Rehoboam', 'Roboão'],
  ['Zerubbabel', 'Zorobabel'],
  ['Onesimus', 'Onésimo'],
  ['Barnabas', 'Barnabé'],
  ['Nathan', 'Natã'],
  ['Pontius Pilate', 'Pôncio Pilatos'],
  ['Bartimaeus', 'Bartimeu'],
  ['Jairus', 'Jairo'],
  ['Legion', 'Legião'],
  ['Gomer', 'Gômer'],
  ['Tekoa', 'Tecoa'],
  ['Turn water into wine', 'Transformar água em vinho'],
  ['Feed 5,000 people', 'Alimentar 5.000 pessoas'],
  ['Heal a blind man', 'Curar um cego'],
  ['Old Testament', 'Antigo Testamento'],
  ['New Testament', 'Novo Testamento'],
  ['Rock', 'Rocha'],
  ['Sand', 'Areia'],
  ['Good land', 'Boa terra'],
  ['In a boat', 'Em um barco'],
  ['In the garden of Gethsemane', 'No jardim do Getsêmani'],
  ['At the temple', 'No templo'],
  ['The hem of his garment', 'A orla do seu manto'],
  ['A Levite', 'Um levita'],
  ['A Samaritan', 'Um samaritano'],
  ['A priest', 'Um sacerdote'],
  ['In dough', 'Na massa'],
  ['Seven loaves', 'Sete pães'],
  ['Five loaves', 'Cinco pães'],
  ['Two fish', 'Dois peixes'],
  ['12 baskets', '12 cestos'],
  ['7 baskets', '7 cestos'],
  ['Saliva', 'Saliva'],
  ['Ephphatha', 'Efatá'],
  ['Talitha koum', 'Talita cumi'],
  ['He sells all he has to buy it', 'Vende tudo o que tem para comprá-lo'],
  ['He runs to meet him', 'Corre ao seu encontro'],
  ['He wants to build bigger barns', 'Quer construir celeiros maiores'],
  ['He gives everyone the same wage', 'Dá a todos o mesmo salário'],
  ['It grows into a large tree', 'Cresce até ser uma grande árvore'],
  ['We throw them away', 'Nós os jogamos fora'],
  ['He sells all he has', 'Vende tudo o que tem'],
  ['She persists in asking', 'Ela persiste em pedir'],
  ['Everyone from the streets', 'Todos das ruas'],
  ['He decides to give it one more year', 'Decide dar-lhe mais um ano'],
  ['10,000 talents', '10.000 talentos'],
  ['One talent', 'Um talento'],
  ['Five', 'Cinco'],
];

const portugueseQuestionReplacements: [RegExp, string][] = [
  [/^Qui /, 'Quem '],
  [/^Quel /, 'Qual '],
  [/^Quelle /, 'Qual '],
  [/^Quelles /, 'Quais '],
  [/^Que /, 'Que '],
  [/^Who /, 'Quem '],
  [/^Which /, 'Qual '],
  [/^What /, 'Qual '],
  [/\bwrote\b/g, 'escreveu'],
  [/\bsaid\b/g, 'disse'],
  [/\bbegins with\b/g, 'começa com'],
  [/^In which /, 'Em qual '],
  [/^To which /, 'A qual '],
  [/ in the Bible\?/g, ' na Bíblia?'],
  [/ dans la Bible\?/g, ' na Bíblia?'],
  [/ de la Bible\?/g, ' da Bíblia?'],
  [/ belongs to which testament\?/g, ' pertence a qual testamento?'],
  [/ belongs to the New Testament\?/g, ' pertence ao Novo Testamento?'],
  [/ belongs to the Old Testament\?/g, ' pertence ao Antigo Testamento?'],
  [/ appartient à quel testament\?/g, ' pertence a qual testamento?'],
  [/ appartient au Nouveau Testament\?/g, ' pertence ao Novo Testamento?'],
  [/ appartient à l’Ancien Testament\?/g, ' pertence ao Antigo Testamento?'],
  [/ appartient à l'Ancien Testament\?/g, ' pertence ao Antigo Testamento?'],
  [/ book follows /g, ' livro segue '],
  [/ book precedes /g, ' livro precede '],
  [/Quel livre suit /g, 'Qual livro segue '],
  [/Quel livre précède /g, 'Qual livro precede '],
  [/Nouveau Testament/g, 'Novo Testamento'],
  [/Ancien Testament/g, 'Antigo Testamento'],
  [/ New Testament/g, ' Novo Testamento'],
  [/ Old Testament/g, ' Antigo Testamento'],
  [/ gospel /g, ' evangelho '],
  [/ epistle /g, ' epístola '],
  [/ prophet /g, ' profeta '],
  [/ apostle /g, ' apóstolo '],
  [/ disciple /g, ' discípulo '],
  [/ miracle /g, ' milagre '],
  [/ parable /g, ' parábola '],
  [/ chapter /g, ' capítulo '],
  [/ psalm /g, ' salmo '],
  [/déclaré/g, 'declarado'],
  [/a déclaré/g, 'declarou'],
  [/a dit/g, 'disse'],
  [/a écrit/g, 'escreveu'],
  [/raconte/g, 'narra'],
  [/commence par/g, 'começa com'],
  [/Au commencement était la Parole/g, 'No princípio era o Verbo'],
  [/Je suis le chemin, la vérité et la vie/g, 'Eu sou o caminho, a verdade e a vida'],
  [/ la majorité des /g, ' a maioria das '],
  [/épîtres/g, 'epístolas'],
  [/évangile/g, 'evangelho'],
  [/livre/g, 'livro'],
  [/conversion de/g, 'conversão de'],
  [/Dans la parabole/g, 'Na parábola'],
  [/de la perle de grand prix/g, 'da pérola de grande valor'],
  [/que fait le marchand/g, 'o que faz o mercador'],
  [/est enlevé/g, 'é arrebatado'],
  [/dans un char de feu/g, 'num carro de fogo'],
  [/prophète/g, 'profeta'],
  [/Le livre de/g, 'O livro de'],
  [/Les deux/g, 'Ambos'],
  [/dans la Bible/g, 'na Bíblia'],
  [/précède/g, 'precede'],
  [/suit/g, 'segue'],
  [/^How many /g, 'Quantos '],
  [/^Where /g, 'Onde '],
  [/^When /g, 'Quando '],
  [/^At the /g, 'Na '],
  [/^The book of /g, 'O livro de '],
  [/^The /g, 'O '],
  [/^Jesus /g, 'Jesus '],
  [/\bwalked on water to\b/g, 'caminhou sobre a água até'],
  [/\bwalked on water\b/g, 'caminhou sobre a água'],
  [/\bstarts to sink when walking on water\b/g, 'começa a afundar ao caminhar sobre a água'],
  [/\bchanges water into wine\b/g, 'transforma a água em vinho'],
  [/\basked for wisdom\b/g, 'pediu sabedoria'],
  [/\basked for\b/g, 'pediu'],
  [/\bbaptized\b/g, 'batizou'],
  [/\bbetrayed\b/g, 'traiu'],
  [/\bdenied\b/g, 'negou'],
  [/\bbuilt the ark\b/g, 'construiu a arca'],
  [/\bbuilt the temple\b/g, 'construiu o templo'],
  [/\bbuilt\b/g, 'construiu'],
  [/\breceived the Ten Commandments\b/g, 'recebeu os Dez Mandamentos'],
  [/\breceived the tablets of the law on Sinai\b/g, 'recebeu as tábuas da lei no Sinai'],
  [/\breceived\b/g, 'recebeu'],
  [/\bfaced\b/g, 'enfrentou'],
  [/\bdoubted the resurrection\b/g, 'duvidou da ressurreição'],
  [/\bdoubted\b/g, 'duvidou da'],
  [/\bhad a vision of a sheet full of animals\b/g, 'teve uma visão de um lençol cheio de animais'],
  [/\bhad a vision\b/g, 'teve uma visão'],
  [/\btells of Saul's conversion\b/g, 'relata a conversão de Saulo'],
  [/\btells of the Exodus from Egypt\b/g, 'relata o Êxodo do Egito'],
  [/\btells of\b/g, 'relata'],
  [/\bspeaks of the fruit of the Spirit\b/g, 'fala do fruto do Espírito'],
  [/\bspeaks of joy in adversity\b/g, 'fala da alegria na adversidade'],
  [/\bspeaks of\b/g, 'fala de'],
  [/\bqualifies as\b/g, 'se qualifica como'],
  [/\bis attributed to a doctor\b/g, 'é atribuído a um médico'],
  [/\bis attributed to\b/g, 'é atribuído a'],
  [/\bis called\b/g, 'é chamado'],
  [/\bis considered\b/g, 'é considerado'],
  [/\bis one of the four canonical gospels\b/g, 'é um dos quatro evangelhos canônicos'],
  [/\bis one of the\b/g, 'é um dos'],
  [/\bis the shortest\b/g, 'é o mais curto'],
  [/\bis stricken with leprosy for offering incense\b/g, 'é afligido com lepra por oferecer incenso'],
  [/\bis a prayer of repentance from\b/g, 'é uma oração de arrependimento de'],
  [/\bis a collection of songs and prayers\b/g, 'é uma coleção de cantos e orações'],
  [/\bis healed\b/g, 'é curado'],
  [/\bis used to pay\b/g, 'é usado para pagar'],
  [/\bwas also a prophetess\b/g, 'foi também uma profetisa'],
  [/\bwas a tax collector\b/g, 'foi um cobrador de impostos'],
  [/\bwas sent to Nineveh\b/g, 'foi enviado a Nínive'],
  [/\bwas swallowed by a big fish\b/g, 'foi engolido por um grande peixe'],
  [/\bwas caught up in a chariot of fire\b/g, 'foi arrebatado em um carro de fogo'],
  [/\bwas thrown into the lions' den\b/g, 'foi lançado na cova dos leões'],
  [/\bwas humiliated and lived like an animal\b/g, 'foi humilhado e viveu como um animal'],
  [/\bwas shepherd of Tekoa\b/g, 'foi pastor de Tecoa'],
  [/\bwas Samuel's mother\b/g, 'foi a mãe de Samuel'],
  [/\bsaved her people\b/g, 'salvou seu povo'],
  [/\bfought with the jaw of a donkey\b/g, 'lutou com a queixada de um jumento'],
  [/\bgleaned in the fields of Boaz\b/g, 'respigou nos campos de Boaz'],
  [/\brecognizes Jesus as the "Lamb of God"\b/g, 'reconhece Jesus como o "Cordeiro de Deus"'],
  [/\brecognizes\b/g, 'reconhece'],
  [/\bsucceeded Elijah\b/g, 'sucedeu Elias'],
  [/\bsucceeded\b/g, 'sucedeu'],
  [/\banointed David as king\b/g, 'ungiu Davi como rei'],
  [/\banointed\b/g, 'ungiu'],
  [/\bchallenged the prophets of Baal on Mount Carmel\b/g, 'desafiou os profetas de Baal no Monte Carmelo'],
  [/\bchallenged\b/g, 'desafiou'],
  [/\bencourages the rebuilding of the temple with Zerubbabel\b/g, 'encoraja a reconstrução do templo com Zorobabel'],
  [/\bencourages running with perseverance\b/g, 'encoraja a correr com perseverança'],
  [/\bencourages\b/g, 'encoraja'],
  [/\bannounces a "new covenant"\b/g, 'anuncia uma "nova aliança"'],
  [/\bannounces the "suffering servant"\b/g, 'anuncia o "servo sofredor"'],
  [/\bannounces\b/g, 'anuncia'],
  [/\bsaw the valley of dry bones\b/g, 'viu o vale dos ossos secos'],
  [/\bsees a valley of dry bones\b/g, 'vê um vale de ossos secos'],
  [/\bsees a wheel within a wheel\b/g, 'vê uma roda dentro de uma roda'],
  [/\bsees seraphim singing "Holy, holy, holy"\b/g, 'vê serafins cantando "Santo, santo, santo"'],
  [/\bsees the writing on the wall\b/g, 'vê a escrita na parede'],
  [/\bsees the Assyrian army defeated by an angel\b/g, 'vê o exército assírio derrotado por um anjo'],
  [/\bsees\b/g, 'vê'],
  [/\bwrites proverbs and songs\b/g, 'escreve provérbios e cânticos'],
  [/\bwrites\b/g, 'escreve'],
  [/\bpresents Christ as the head of the Church\b/g, 'apresenta Cristo como a cabeça da Igreja'],
  [/\bpresents\b/g, 'apresenta'],
  [/\bmentions "the good fight" of faith\b/g, 'menciona "a boa batalha" da fé'],
  [/\bmentions\b/g, 'menciona'],
  [/\bstates "God is love"\b/g, 'declara "Deus é amor"'],
  [/\bstates that "the Lord gives wisdom"\b/g, 'declara que "o Senhor dá sabedoria"'],
  [/\bstates "The LORD is my shepherd"\b/g, 'declara "O Senhor é meu pastor"'],
  [/\bstates\b/g, 'declara'],
  [/\brepented after the affair of Naboth\b/g, 'se arrependeu após o caso de Nabote'],
  [/\brepented\b/g, 'se arrependeu'],
  [/\bmarries Jezebel\b/g, 'casa-se com Jezabel'],
  [/\bmarries Gomer\b/g, 'casa-se com Gômer'],
  [/\bmarries\b/g, 'casa-se com'],
  [/\bfinds the book of the law during a reform\b/g, 'encontra o livro da lei durante uma reforma'],
  [/\bfinds\b/g, 'encontra'],
  [/\bspares Agag, king of Amalek\b/g, 'poupa Agague, rei de Amaleque'],
  [/\bspares\b/g, 'poupa'],
  [/\bunifies the kingdom after Saul\b/g, 'unifica o reino após Saul'],
  [/\bunifies\b/g, 'unifica'],
  [/\bdestroyed Jerusalem\b/g, 'destruiu Jerusalém'],
  [/\bdestroyed\b/g, 'destruiu'],
  [/\bdefeated by an angel\b/g, 'derrotado por um anjo'],
  [/\bdefeated\b/g, 'derrotado'],
  [/\brolls the stone from the tomb\b/g, 'remove a pedra do túmulo'],
  [/\brolls\b/g, 'remove'],
  [/\bcarry the cross\b/g, 'carregar a cruz'],
  [/\boffered Isaac\b/g, 'ofereceu Isaque'],
  [/\boffered\b/g, 'ofereceu'],
  [/\bhid the spies in Jericho\b/g, 'escondeu os espiões em Jericó'],
  [/\bhid\b/g, 'escondeu'],
  [/\binterpreted the Pharaoh's dreams\b/g, 'interpretou os sonhos do Faraó'],
  [/\binterpreted\b/g, 'interpretou'],
  [/\brebuilt the walls of Jerusalem\b/g, 'reconstruiu os muros de Jerusalém'],
  [/\brebuilt\b/g, 'reconstruiu'],
  [/\bled Israel after Moses\b/g, 'conduziu Israel após Moisés'],
  [/\bled Israel around Jericho\b/g, 'conduziu Israel ao redor de Jericó'],
  [/\bled\b/g, 'conduziu'],
  [/\bhelps Jesus carry the cross\b/g, 'ajuda Jesus a carregar a cruz'],
  [/\bhelps the injured man\b/g, 'ajuda o homem ferido'],
  [/\bhelps\b/g, 'ajuda'],
  [/\bdreamed of a ladder to heaven\b/g, 'sonhou com uma escada ao céu'],
  [/\bdreamed of\b/g, 'sonhou com'],
  [/\basks for the body of\b/g, 'pede o corpo de'],
  [/\bwho is traditionally associated with\b/g, 'quem é tradicionalmente associado com'],
  [/\bwho is the author of\b/g, 'quem é o autor de'],
  [/\bthe first king of Israel\b/g, 'o primeiro rei de Israel'],
  [/\bthe first Christian martyr\b/g, 'o primeiro mártir cristão'],
  [/\bwrote most of the Psalms\b/g, 'escreveu a maioria dos Salmos'],
  [/\bwrote the Revelation\b/g, 'escreveu o Apocalipse'],
  [/\bwrote "the righteous shall live by faith"\b/g, 'escreveu "o justo viverá pela fé"'],
  [/\bwhat event takes place\b/g, 'que evento acontece'],
  [/\bsays, "Faith without works is dead"\b/g, 'diz: "A fé sem obras está morta"'],
  [/\bdo we find "Rejoice always"\b/g, 'encontramos "Regozijai-vos sempre"'],
  [/\bdo we read "all things work together for good"\b/g, 'lemos "todas as coisas cooperam para o bem"'],
  [/\bdoes Paul speak of the "crown of righteousness"\b/g, 'Paulo fala da "coroa de justiça"'],
  [/\bis the armor of God found\b/g, 'se encontra a armadura de Deus'],
  [/\bare the Beatitudes found\b/g, 'se encontram as Bem-aventuranças'],
  [/\bis the Sermon on the Mount found\b/g, 'se encontra o Sermão da Montanha'],
  [/\bis the creation story found\b/g, 'se encontra a história da criação'],
  [/\bare the Ten Commandments found\b/g, 'se encontram os Dez Mandamentos'],
  [/\bdo we find the visit of the wise men\b/g, 'encontramos a visita dos magos'],
  [/\bcontains the hymn to love\b/g, 'contém o hino ao amor'],
  [/\bcontains "There is a Time for Everything"\b/g, 'contém "Tudo tem o seu tempo"'],
  [/\bcontains\b/g, 'contém'],
  [/\bcelebrates the love between husband and wife\b/g, 'celebra o amor entre marido e mulher'],
  [/\bcelebrates\b/g, 'celebra'],
  [/\bopens with "Vanity of Vanities"\b/g, 'começa com "Vaidade de vaidades"'],
  [/\bopens with\b/g, 'começa com'],
  [/\binvites us to bless the Lord for his benefits\b/g, 'nos convida a bendizer o Senhor por seus benefícios'],
  [/\binvites\b/g, 'convida a'],
  [/\bdescribes the "virtuous woman"\b/g, 'descreve a "mulher virtuosa"'],
  [/\bdescribes\b/g, 'descreve'],
  [/\brighteous man suffers and is tested in his book\b/g, 'homem justo sofre e é provado em seu livro'],
  [/\bthe disciple whom Jesus loved\b/g, 'o discípulo que Jesus amava'],
  [/\bson of encouragement\b/g, 'filho da consolação'],
  [/\baddressed to Philemon concerning Onesimus\b/g, 'dirigida a Filemom sobre Onésimo'],
  [/\bJesus' first miracle according to\b/g, 'o primeiro milagre de Jesus segundo'],
  [/\bwith a kiss\b/g, 'com um beijo'],
  [/\bthree times\b/g, 'três vezes'],
  [/\baccording to\b/g, 'segundo'],
  [/\bwere the disciples first called Christians\b/g, 'os discípulos foram chamados cristãos pela primeira vez'],
  [/\blukewarm\b/g, 'morna'],
  [/\bfour canonical gospels\b/g, 'quatro evangelhos canônicos'],
  [/\bcity\b/g, 'cidade'],
  [/\bchurch\b/g, 'igreja'],
  [/\bchapter\b/g, 'capítulo'],
  [/\bletter\b/g, 'carta'],
  [/\bking\b/g, 'rei'],
  [/\bqueen\b/g, 'rainha'],
  [/\bjudge\b/g, 'juiz'],
  [/\bpatriarch\b/g, 'patriarca'],
  [/\bdays\b/g, 'dias'],
  [/\bdid Jesus fast in the desert\b/g, 'Jesus jejuou no deserto'],
  [/\bwas Lazarus in the tomb\b/g, 'Lázaro esteve no túmulo'],
  [/\blepers come back to thank\b/g, 'leprosos voltam para agradecer'],
  [/\bIn the parable of /g, 'Na parábola de '],
  [/\bthe Good Samaritan\b/g, 'o Bom Samaritano'],
  [/\bthe prodigal son\b/g, 'o filho pródigo'],
  [/\bthe mustard seed\b/g, 'a semente de mostarda'],
  [/\bthe hidden treasure\b/g, 'o tesouro escondido'],
  [/\bthe barren fig tree\b/g, 'a figueira estéril'],
  [/\bthe merciless debtor\b/g, 'o devedor impiedoso'],
  [/\bthe unjust judge\b/g, 'o juiz injusto'],
  [/\bthe wedding banquet\b/g, 'o banquete de casamento'],
  [/\bthe two houses\b/g, 'as duas casas'],
  [/\bthe ten virgins\b/g, 'as dez virgens'],
  [/\bthe workers in the vineyard\b/g, 'os trabalhadores na vinha'],
  [/\bthe lost sheep\b/g, 'a ovelha perdida'],
  [/\bthe sower\b/g, 'o semeador'],
  [/\bthe pearl of great price\b/g, 'a pérola de grande valor'],
  [/\bthe talents\b/g, 'os talentos'],
  [/\bthe net\b/g, 'a rede'],
  [/\bleaven\b/g, 'o fermento'],
  [/\bthe rich fool\b/g, 'o rico insensato'],
  [/\bthe Pharisee and the tax collector\b/g, 'o fariseu e o publicano'],
  [/\bwho helps the injured man\b/g, 'quem ajuda o homem ferido'],
  [/\bwho is justified\b/g, 'quem é justificado'],
  [/\bwhere is the leaven hidden\b/g, 'onde o fermento é escondido'],
  [/\bwhat does the winegrower decide\b/g, 'o que o vinhateiro decide'],
  [/\bwhat does the man do\b/g, 'o que o homem faz'],
  [/\bhow many sheep are there\b/g, 'quantas ovelhas há'],
  [/\bwhat debt is forgiven\b/g, 'que dívida é perdoada'],
  [/\bwhat happens to the seed\b/g, 'o que acontece com a semente'],
  [/\bwhat do we do with the bad fish\b/g, 'o que fazemos com os peixes maus'],
  [/\bwhat does the merchant do\b/g, 'o que o mercador faz'],
  [/\bwhat does the father do\b/g, 'o que o pai faz'],
  [/\bwhat does the rich man want to do\b/g, 'o que o rico quer fazer'],
  [/\bwhat do the thorns represent\b/g, 'o que os espinhos representam'],
  [/\bwhich land bears much fruit\b/g, 'que terra dá muito fruto'],
  [/\bhow many talents does the third servant receive\b/g, 'quantos talentos o terceiro servo recebe'],
  [/\bhow many were wise\b/g, 'quantas eram prudentes'],
  [/\bwhat is the stable house built on\b/g, 'sobre o que a casa firme é construída'],
  [/\bwhat does the widow do\b/g, 'o que a viúva faz'],
  [/\bwho is ultimately invited\b/g, 'quem é finalmente convidado'],
  [/\bwhat wages do they receive\b/g, 'que salário recebem'],
  [/\bwhich prophets appear\b/g, 'que profetas aparecem'],
  [/\bhow many loaves did they have\b/g, 'quantos pães tinham'],
  [/\bhow many fish did they have\b/g, 'quantos peixes tinham'],
  [/\bwhat word did Jesus say to heal\b/g, 'que palavra Jesus disse para curar'],
  [/\bwhat word did Jesus say to raise up\b/g, 'que palavra Jesus disse para ressuscitar'],
  [/\bwhat did Jesus say to Peter during the miraculous catch\b/g, 'o que Jesus disse a Pedro durante a pesca milagrosa'],
  [/\bwhat did Jesus use to make mud for the man born blind\b/g, 'o que Jesus usou para fazer lama para o cego de nascença'],
  [/\bwhat does Bartimaeus shout to attract Jesus\b/g, 'o que Bartimeu grita para atrair Jesus'],
  [/\bwhat does a woman with hemorrhoids touch to be cured\b/g, 'o que uma mulher com hemorragia toca para ser curada'],
  [/\bwhere did Jesus pray before his arrest\b/g, 'onde Jesus orou antes de sua prisão'],
  [/\bwhere does Jesus resurrect the widow's son\b/g, 'onde Jesus ressuscita o filho da viúva'],
  [/\bwhere is Jesus presented as a child\b/g, 'onde Jesus é apresentado como criança'],
  [/\bwhere was Jesus born\b/g, 'onde Jesus nasceu'],
  [/\bwhere was Jesus sleeping when he calmed the storm\b/g, 'onde Jesus dormia quando acalmou a tempestade'],
  [/\bWhich Roman governor judges Jesus\b/g, 'Que governador romano julga Jesus'],
  [/\bJohn's brother\b/g, 'o irmão de João'],
  [/\bthe centurion's servant is healed\b/g, 'o servo do centurião é curado'],
  [/\bthe coin found in the fish is used to pay\b/g, 'a moeda encontrada no peixe é usada para pagar'],
  [/\bthe paralytic lowered through the roof is healed\b/g, 'o paralítico descido pelo telhado é curado'],
  [/\bthe demons called in the pig episode\b/g, 'os demônios no episódio dos porcos'],
  [/\bwhen the loaves were multiplied\b/g, 'quando os pães foram multiplicados'],
  [/\bwhen they multiplied\b/g, 'quando se multiplicaram'],
  [/\bking succeeds\b/g, 'rei sucede'],
];

const toPortuguese = (value: string): string => {
  const exact = portugueseExactTerms.find(([from]) => from === value.trim())?.[1];
  if (exact) return exact;

  let translated = value;
  for (const [pattern, replacement] of portugueseQuestionReplacements) {
    translated = translated.replace(pattern, replacement);
  }

  for (const [source, pt] of portugueseExactTerms) {
    translated = translated.split(source).join(pt);
  }

  return translated;
};

const germanExactTerms: [string, string][] = [
  ['Jésus', 'Jesus'],
  ['Jean-Baptiste', 'Johannes der Täufer'],
  ['Pierre', 'Petrus'],
  ['Jean', 'Johannes'],
  ['Matthieu', 'Matthäus'],
  ['Marc', 'Markus'],
  ['Luc', 'Lukas'],
  ['Paul', 'Paulus'],
  ['André', 'Andreas'],
  ['Thomas', 'Thomas'],
  ['Philippe', 'Philippus'],
  ['Jacques', 'Jakobus'],
  ['Étienne', 'Stephanus'],
  ['Etienne', 'Stephanus'],
  ['Ésaïe', 'Jesaja'],
  ['Jérémie', 'Jeremia'],
  ['Ézéchiel', 'Hesekiel'],
  ['Osée', 'Hosea'],
  ['Habacuc', 'Habakuk'],
  ['Abdias', 'Obadja'],
  ['Jonas', 'Jona'],
  ['Sophonie', 'Zefanja'],
  ['Aggée', 'Haggai'],
  ['Zacharie', 'Sacharja'],
  ['Malachie', 'Maleachi'],
  ['Cantique des cantiques', 'Hoheslied'],
  ['Proverbes', 'Sprüche'],
  ['Ecclésiaste', 'Prediger'],
  ['Genèse', '1. Mose'],
  ['Exode', '2. Mose'],
  ['Lévitique', '3. Mose'],
  ['Nombres', '4. Mose'],
  ['Deutéronome', '5. Mose'],
  ['Josué', 'Josua'],
  ['Juges', 'Richter'],
  ['Ruth', 'Rut'],
  ['1 Samuel', '1. Samuel'],
  ['2 Samuel', '2. Samuel'],
  ['1 Rois', '1. Könige'],
  ['2 Rois', '2. Könige'],
  ['1 Chroniques', '1. Chronik'],
  ['2 Chroniques', '2. Chronik'],
  ['Esdras', 'Esra'],
  ['Néhémie', 'Nehemia'],
  ['Esther', 'Ester'],
  ['Job', 'Hiob'],
  ['Moïse', 'Mose'],
  ['Aaron', 'Aaron'],
  ['Abraham', 'Abraham'],
  ['Isaac', 'Isaak'],
  ['Jacob', 'Jakob'],
  ['David', 'David'],
  ['Salomon', 'Salomo'],
  ['Jérusalem', 'Jerusalem'],
  ['Antioche', 'Antiochia'],
  ['Corinthe', 'Korinth'],
  ['Pentecôte', 'Pfingsten'],
  ['Psaumes', 'Psalmen'],
  ['Épîtres pauliniennes', 'Paulinische Briefe'],
  ['Actes', 'Apostelgeschichte'],
  ['Romains', 'Römer'],
  ['1 Corinthiens', '1. Korinther'],
  ['2 Corinthiens', '2. Korinther'],
  ['Galates', 'Galater'],
  ['Éphésiens', 'Epheser'],
  ['Philippiens', 'Philipper'],
  ['Colossiens', 'Kolosser'],
  ['1 Thessaloniciens', '1. Thessalonicher'],
  ['2 Thessaloniciens', '2. Thessalonicher'],
  ['1 Timothée', '1. Timotheus'],
  ['2 Timothée', '2. Timotheus'],
  ['Tite', 'Titus'],
  ['Hébreux', 'Hebräer'],
  ['1 Pierre', '1. Petrus'],
  ['2 Pierre', '2. Petrus'],
  ['1 Jean', '1. Johannes'],
  ['2 Jean', '2. Johannes'],
  ['3 Jean', '3. Johannes'],
  ['Jude', 'Judas'],
  ['Apocalypse', 'Offenbarung'],
  ['Jesus', 'Jesus'],
  ['John', 'Johannes'],
  ['John the Baptist', 'Johannes der Täufer'],
  ['Peter', 'Petrus'],
  ['James', 'Jakobus'],
  ['Paul', 'Paulus'],
  ['Matthew', 'Matthäus'],
  ['Mark', 'Markus'],
  ['Luke', 'Lukas'],
  ['Andrew', 'Andreas'],
  ['Thomas', 'Thomas'],
  ['Philip', 'Philippus'],
  ['Stephen', 'Stephanus'],
  ['Revelation', 'Offenbarung'],
  ['Genesis', '1. Mose'],
  ['Exodus', '2. Mose'],
  ['Leviticus', '3. Mose'],
  ['Numbers', '4. Mose'],
  ['Deuteronomy', '5. Mose'],
  ['Joshua', 'Josua'],
  ['Judges', 'Richter'],
  ['Psalms', 'Psalmen'],
  ['Acts', 'Apostelgeschichte'],
  ['Romans', 'Römer'],
  ['1 Corinthians', '1. Korinther'],
  ['2 Corinthians', '2. Korinther'],
  ['Galatians', 'Galater'],
  ['Ephesians', 'Epheser'],
  ['Philippians', 'Philipper'],
  ['Colossians', 'Kolosser'],
  ['1 Thessalonians', '1. Thessalonicher'],
  ['2 Thessalonians', '2. Thessalonicher'],
  ['1 Timothy', '1. Timotheus'],
  ['2 Timothy', '2. Timotheus'],
  ['Titus', 'Titus'],
  ['Hebrews', 'Hebräer'],
  ['1 Peter', '1. Petrus'],
  ['2 Peter', '2. Petrus'],
  ['1 John', '1. Johannes'],
  ['2 John', '2. Johannes'],
  ['3 John', '3. Johannes'],
  ['Ecclesiastes', 'Prediger'],
  ['Song of Songs', 'Hoheslied'],
  ['Antioch', 'Antiochia'],
  ['Corinth', 'Korinth'],
  ['Nineveh', 'Ninive'],
  ['Babylon', 'Babylon'],
  ['Goliath', 'Goliath'],
  ['Lazarus', 'Lazarus'],
  ['Saul', 'Saul'],
  ['Elijah', 'Elia'],
  ['Elisha', 'Elisa'],
  ['Solomon', 'Salomo'],
  ['Moses', 'Mose'],
  ['Samuel', 'Samuel'],
  ['Gethsemane', 'Gethsemane'],
  ['Nain', 'Nain'],
  ['Bethlehem', 'Bethlehem'],
  ['Lamentations', 'Klagelieder'],
  ['Micah', 'Micha'],
  ['Nahum', 'Nahum'],
  ['Obadiah', 'Obadja'],
  ['Zephaniah', 'Zefanja'],
  ['Zechariah', 'Sacharja'],
  ['Haggai', 'Haggai'],
  ['Habakkuk', 'Habakuk'],
  ['Joel', 'Joel'],
  ['Amos', 'Amos'],
  ['Hosea', 'Hosea'],
  ['Daniel', 'Daniel'],
  ['Malachi', 'Maleachi'],
  ['Philemon', 'Philemon'],
  ['Song of Solomon', 'Hoheslied'],
  ['Proverbs', 'Sprüche'],
  ['Nicodemus', 'Nikodemus'],
  ['Joseph of Arimathea', 'Josef von Arimathäa'],
  ['Simon of Cyrene', 'Simon von Kyrene'],
  ['Rahab', 'Rahab'],
  ['Hannah', 'Hanna'],
  ['Deborah', 'Debora'],
  ['Samson', 'Simson'],
  ['Nehemiah', 'Nehemia'],
  ['Isaiah', 'Jesaja'],
  ['Jeremiah', 'Jeremia'],
  ['Ezekiel', 'Hesekiel'],
  ['Jonah', 'Jona'],
  ['Nebuchadnezzar', 'Nebukadnezar'],
  ['Belshazzar', 'Belsazar'],
  ['Jezebel', 'Isebel'],
  ['Ahab', 'Ahab'],
  ['Josiah', 'Josia'],
  ['Uzziah', 'Usija'],
  ['Hezekiah', 'Hiskia'],
  ['Jeroboam', 'Jerobeam'],
  ['Rehoboam', 'Rehabeam'],
  ['Zerubbabel', 'Serubbabel'],
  ['Onesimus', 'Onesimus'],
  ['Barnabas', 'Barnabas'],
  ['Nathan', 'Nathan'],
  ['Pontius Pilate', 'Pontius Pilatus'],
  ['Bartimaeus', 'Bartimäus'],
  ['Jairus', 'Jairus'],
  ['Legion', 'Legion'],
  ['Gomer', 'Gomer'],
  ['Tekoa', 'Tekoa'],
  ['Turn water into wine', 'Wasser in Wein verwandeln'],
  ['Feed 5,000 people', '5.000 Menschen speisen'],
  ['Heal a blind man', 'Einen Blinden heilen'],
  ['Old Testament', 'Altes Testament'],
  ['New Testament', 'Neues Testament'],
  ['Rock', 'Fels'],
  ['Sand', 'Sand'],
  ['Good land', 'Guter Boden'],
  ['In a boat', 'In einem Boot'],
  ['In the garden of Gethsemane', 'Im Garten Gethsemane'],
  ['At the temple', 'Im Tempel'],
  ['The hem of his garment', 'Der Saum seines Gewandes'],
  ['A Levite', 'Ein Levit'],
  ['A Samaritan', 'Ein Samariter'],
  ['A priest', 'Ein Priester'],
  ['In dough', 'Im Teig'],
  ['Seven loaves', 'Sieben Brote'],
  ['Five loaves', 'Fünf Brote'],
  ['Two fish', 'Zwei Fische'],
  ['12 baskets', '12 Körbe'],
  ['7 baskets', '7 Körbe'],
  ['Saliva', 'Speichel'],
  ['Ephphatha', 'Ephata'],
  ['Talitha koum', 'Talita kum'],
  ['He sells all he has to buy it', 'Er verkauft alles, um es zu kaufen'],
  ['He runs to meet him', 'Er läuft ihm entgegen'],
  ['He wants to build bigger barns', 'Er will größere Scheunen bauen'],
  ['He gives everyone the same wage', 'Er gibt jedem den gleichen Lohn'],
  ['It grows into a large tree', 'Es wächst zu einem großen Baum'],
  ['We throw them away', 'Wir werfen sie weg'],
  ['He sells all he has', 'Er verkauft alles, was er hat'],
  ['She persists in asking', 'Sie beharrt darauf zu bitten'],
  ['Everyone from the streets', 'Alle von den Straßen'],
  ['He decides to give it one more year', 'Er beschließt, ihm noch ein Jahr zu geben'],
  ['10,000 talents', '10.000 Talente'],
  ['One talent', 'Ein Talent'],
  ['Five', 'Fünf'],
];

const germanQuestionReplacements: [RegExp, string][] = [
  [/^Qui /, 'Wer '],
  [/^Quel /, 'Welches '],
  [/^Quelle /, 'Welche '],
  [/^Quelles /, 'Welche '],
  [/^Quels /, 'Welche '],
  [/^Que /, 'Was '],
  [/^Qu’est-ce qui /, 'Was '],
  [/^Qu'est-ce qui /, 'Was '],
  [/^Qu’est-ce que /, 'Was '],
  [/^Qu'est-ce que /, 'Was '],
  [/^Dans quel /, 'In welchem '],
  [/^Dans quelle /, 'In welcher '],
  [/^Dans quels /, 'In welchen '],
  [/^Dans quelles /, 'In welchen '],
  [/^Dans la /, 'In der '],
  [/^Dans le /, 'Im '],
  [/^À quel /, 'Zu welchem '],
  [/^À quelle /, 'Zu welcher '],
  [/^A quel /, 'Zu welchem '],
  [/^A quelle /, 'Zu welcher '],
  [/^Who /, 'Wer '],
  [/^Which /, 'Welches '],
  [/^What /, 'Was '],
  [/\bwrote\b/g, 'schrieb'],
  [/\bsaid\b/g, 'sagte'],
  [/\bbegins with\b/g, 'beginnt mit'],
  [/^In which /, 'In welchem '],
  [/^To which /, 'Zu welchem '],
  [/ in the Bible\?/g, ' in der Bibel?'],
  [/ dans la Bible\?/g, ' in der Bibel?'],
  [/ de la Bible\?/g, ' der Bibel?'],
  [/ belongs to which testament\?/g, ' gehört zu welchem Testament?'],
  [/ belongs to the New Testament\?/g, ' gehört zum Neuen Testament?'],
  [/ belongs to the Old Testament\?/g, ' gehört zum Alten Testament?'],
  [/ appartient à quel testament\?/g, ' gehört zu welchem Testament?'],
  [/ appartient au Nouveau Testament\?/g, ' gehört zum Neuen Testament?'],
  [/ appartient à l’Ancien Testament\?/g, ' gehört zum Alten Testament?'],
  [/ appartient à l'Ancien Testament\?/g, ' gehört zum Alten Testament?'],
  [/ book follows /g, ' Buch folgt auf '],
  [/ book precedes /g, ' Buch steht vor '],
  [/Quel livre suit /g, 'Welches Buch folgt auf '],
  [/Quel livre précède /g, 'Welches Buch steht vor '],
  [/Quel livre /g, 'Welches Buch '],
  [/Quelle ville /g, 'Welche Stadt '],
  [/Quel roi /g, 'Welcher König '],
  [/Quel prophète /g, 'Welcher Prophet '],
  [/Nouveau Testament/g, 'Neues Testament'],
  [/Ancien Testament/g, 'Altes Testament'],
  [/ New Testament/g, ' Neues Testament'],
  [/ Old Testament/g, ' Altes Testament'],
  [/ gospel /g, ' Evangelium '],
  [/ epistle /g, ' Brief '],
  [/ prophet /g, ' Prophet '],
  [/ apostle /g, ' Apostel '],
  [/ disciple /g, ' Jünger '],
  [/ miracle /g, ' Wunder '],
  [/ parable /g, ' Gleichnis '],
  [/ chapter /g, ' Kapitel '],
  [/ psalm /g, ' Psalm '],
  [/déclaré/g, 'gesagt'],
  [/a déclaré/g, 'hat gesagt'],
  [/a dit/g, 'hat gesagt'],
  [/a écrit/g, 'hat geschrieben'],
  [/raconte/g, 'berichtet'],
  [/commence par/g, 'beginnt mit'],
  [/Au commencement était la Parole/g, 'Im Anfang war das Wort'],
  [/Je suis le chemin, la vérité et la vie/g, 'Ich bin der Weg, die Wahrheit und das Leben'],
  [/ la majorité des /g, ' den Großteil der '],
  [/épîtres/g, 'Briefe'],
  [/évangile/g, 'Evangelium'],
  [/livre/g, 'Buch'],
  [/conversion de/g, 'Bekehrung von'],
  [/Dans la parabole/g, 'Im Gleichnis'],
  [/de la perle de grand prix/g, 'von der kostbaren Perle'],
  [/que fait le marchand/g, 'was macht der Händler'],
  [/est enlevé/g, 'wird entrückt'],
  [/dans un char de feu/g, 'in einem feurigen Wagen'],
  [/prophète/g, 'Prophet'],
  [/Le livre de/g, 'Das Buch'],
  [/Les deux/g, 'Beide'],
  [/dans la Bible/g, 'in der Bibel'],
  [/ et /g, ' und '],
  [/ ou /g, ' oder '],
  [/précède/g, 'steht vor'],
  [/suit/g, 'folgt auf'],
  [/^How many /g, 'Wie viele '],
  [/^Where /g, 'Wo '],
  [/^When /g, 'Wann '],
  [/^At the /g, 'Bei der '],
  [/^The book of /g, 'Das Buch '],
  [/^The /g, 'Der '],
  [/^Jesus /g, 'Jesus '],
  [/\bwalked on water to\b/g, 'ging auf dem Wasser zu'],
  [/\bwalked on water\b/g, 'ging auf dem Wasser'],
  [/\bstarts to sink when walking on water\b/g, 'beginnt zu sinken beim Gehen auf dem Wasser'],
  [/\bchanges water into wine\b/g, 'verwandelt Wasser in Wein'],
  [/\basked for wisdom\b/g, 'bat um Weisheit'],
  [/\basked for\b/g, 'bat um'],
  [/\bbaptized\b/g, 'taufte'],
  [/\bbetrayed\b/g, 'verriet'],
  [/\bdenied\b/g, 'verleugnete'],
  [/\bbuilt the ark\b/g, 'baute die Arche'],
  [/\bbuilt the temple\b/g, 'baute den Tempel'],
  [/\bbuilt\b/g, 'baute'],
  [/\breceived the Ten Commandments\b/g, 'empfing die Zehn Gebote'],
  [/\breceived the tablets of the law on Sinai\b/g, 'empfing die Gesetzestafeln am Sinai'],
  [/\breceived\b/g, 'empfing'],
  [/\bfaced\b/g, 'kämpfte gegen'],
  [/\bdoubted the resurrection\b/g, 'zweifelte an der Auferstehung'],
  [/\bdoubted\b/g, 'zweifelte an'],
  [/\bhad a vision of a sheet full of animals\b/g, 'hatte eine Vision von einem Tuch voller Tiere'],
  [/\bhad a vision\b/g, 'hatte eine Vision'],
  [/\btells of Saul's conversion\b/g, 'erzählt von der Bekehrung des Saulus'],
  [/\btells of the Exodus from Egypt\b/g, 'erzählt vom Auszug aus Ägypten'],
  [/\btells of\b/g, 'erzählt von'],
  [/\bspeaks of the fruit of the Spirit\b/g, 'spricht von der Frucht des Geistes'],
  [/\bspeaks of joy in adversity\b/g, 'spricht von Freude in Widrigkeiten'],
  [/\bspeaks of\b/g, 'spricht von'],
  [/\bqualifies as\b/g, 'wird bezeichnet als'],
  [/\bis attributed to a doctor\b/g, 'wird einem Arzt zugeschrieben'],
  [/\bis attributed to\b/g, 'wird zugeschrieben'],
  [/\bis called\b/g, 'wird genannt'],
  [/\bis considered\b/g, 'gilt als'],
  [/\bis one of the four canonical gospels\b/g, 'ist eines der vier kanonischen Evangelien'],
  [/\bis one of the\b/g, 'ist eines der'],
  [/\bis the shortest\b/g, 'ist das kürzeste'],
  [/\bis stricken with leprosy for offering incense\b/g, 'wird mit Aussatz geschlagen, weil er Räucherwerk darbringt'],
  [/\bis a prayer of repentance from\b/g, 'ist ein Bußgebet von'],
  [/\bis a collection of songs and prayers\b/g, 'ist eine Sammlung von Liedern und Gebeten'],
  [/\bis healed\b/g, 'wird geheilt'],
  [/\bis used to pay\b/g, 'wird zum Bezahlen verwendet'],
  [/\bwas also a prophetess\b/g, 'war auch eine Prophetin'],
  [/\bwas a tax collector\b/g, 'war ein Zöllner'],
  [/\bwas sent to Nineveh\b/g, 'wurde nach Ninive gesandt'],
  [/\bwas swallowed by a big fish\b/g, 'wurde von einem großen Fisch verschluckt'],
  [/\bwas caught up in a chariot of fire\b/g, 'wurde in einem feurigen Wagen entrückt'],
  [/\bwas thrown into the lions' den\b/g, 'wurde in die Löwengrube geworfen'],
  [/\bwas humiliated and lived like an animal\b/g, 'wurde gedemütigt und lebte wie ein Tier'],
  [/\bwas shepherd of Tekoa\b/g, 'war Hirte aus Tekoa'],
  [/\bwas Samuel's mother\b/g, 'war die Mutter Samuels'],
  [/\bsaved her people\b/g, 'rettete ihr Volk'],
  [/\bfought with the jaw of a donkey\b/g, 'kämpfte mit dem Kieferknochen eines Esels'],
  [/\bgleaned in the fields of Boaz\b/g, 'las Ähren auf den Feldern von Boas'],
  [/\brecognizes Jesus as the "Lamb of God"\b/g, 'erkennt Jesus als das "Lamm Gottes"'],
  [/\brecognizes\b/g, 'erkennt'],
  [/\bsucceeded Elijah\b/g, 'folgte Elia nach'],
  [/\bsucceeded\b/g, 'folgte nach'],
  [/\banointed David as king\b/g, 'salbte David zum König'],
  [/\banointed\b/g, 'salbte'],
  [/\bchallenged the prophets of Baal on Mount Carmel\b/g, 'forderte die Propheten Baals auf dem Berg Karmel heraus'],
  [/\bchallenged\b/g, 'forderte heraus'],
  [/\bencourages the rebuilding of the temple with Zerubbabel\b/g, 'ermutigt zum Wiederaufbau des Tempels mit Serubbabel'],
  [/\bencourages running with perseverance\b/g, 'ermutigt, mit Ausdauer zu laufen'],
  [/\bencourages\b/g, 'ermutigt'],
  [/\bannounces a "new covenant"\b/g, 'verkündet einen "neuen Bund"'],
  [/\bannounces the "suffering servant"\b/g, 'verkündet den "leidenden Knecht"'],
  [/\bannounces\b/g, 'verkündet'],
  [/\bsaw the valley of dry bones\b/g, 'sah das Tal der verdorrten Gebeine'],
  [/\bsees a valley of dry bones\b/g, 'sieht ein Tal verdorrter Gebeine'],
  [/\bsees a wheel within a wheel\b/g, 'sieht ein Rad im Rad'],
  [/\bsees seraphim singing "Holy, holy, holy"\b/g, 'sieht Seraphim, die "Heilig, heilig, heilig" singen'],
  [/\bsees the writing on the wall\b/g, 'sieht die Schrift an der Wand'],
  [/\bsees the Assyrian army defeated by an angel\b/g, 'sieht das assyrische Heer von einem Engel besiegt'],
  [/\bsees\b/g, 'sieht'],
  [/\bwrites proverbs and songs\b/g, 'schreibt Sprüche und Lieder'],
  [/\bwrites\b/g, 'schreibt'],
  [/\bpresents Christ as the head of the Church\b/g, 'stellt Christus als das Haupt der Kirche dar'],
  [/\bpresents\b/g, 'stellt dar'],
  [/\bmentions "the good fight" of faith\b/g, 'erwähnt "den guten Kampf" des Glaubens'],
  [/\bmentions\b/g, 'erwähnt'],
  [/\bstates "God is love"\b/g, 'erklärt "Gott ist Liebe"'],
  [/\bstates that "the Lord gives wisdom"\b/g, 'erklärt, dass "der Herr Weisheit gibt"'],
  [/\bstates "The LORD is my shepherd"\b/g, 'erklärt "Der Herr ist mein Hirte"'],
  [/\bstates\b/g, 'erklärt'],
  [/\brepented after the affair of Naboth\b/g, 'bereute nach der Sache mit Nabot'],
  [/\brepented\b/g, 'bereute'],
  [/\bmarries Jezebel\b/g, 'heiratet Isebel'],
  [/\bmarries Gomer\b/g, 'heiratet Gomer'],
  [/\bmarries\b/g, 'heiratet'],
  [/\bfinds the book of the law during a reform\b/g, 'findet das Gesetzbuch während einer Reform'],
  [/\bfinds\b/g, 'findet'],
  [/\bspares Agag, king of Amalek\b/g, 'verschont Agag, den König von Amalek'],
  [/\bspares\b/g, 'verschont'],
  [/\bunifies the kingdom after Saul\b/g, 'vereint das Königreich nach Saul'],
  [/\bunifies\b/g, 'vereint'],
  [/\bdestroyed Jerusalem\b/g, 'zerstörte Jerusalem'],
  [/\bdestroyed\b/g, 'zerstörte'],
  [/\bdefeated by an angel\b/g, 'von einem Engel besiegt'],
  [/\bdefeated\b/g, 'besiegt'],
  [/\brolls the stone from the tomb\b/g, 'wälzt den Stein vom Grab'],
  [/\brolls\b/g, 'wälzt'],
  [/\bcarry the cross\b/g, 'das Kreuz tragen'],
  [/\boffered Isaac\b/g, 'opferte Isaak'],
  [/\boffered\b/g, 'opferte'],
  [/\bhid the spies in Jericho\b/g, 'versteckte die Kundschafter in Jericho'],
  [/\bhid\b/g, 'versteckte'],
  [/\binterpreted the Pharaoh's dreams\b/g, 'deutete die Träume des Pharao'],
  [/\binterpreted\b/g, 'deutete'],
  [/\brebuilt the walls of Jerusalem\b/g, 'baute die Mauern Jerusalems wieder auf'],
  [/\brebuilt\b/g, 'baute wieder auf'],
  [/\bled Israel after Moses\b/g, 'führte Israel nach Mose'],
  [/\bled Israel around Jericho\b/g, 'führte Israel um Jericho'],
  [/\bled\b/g, 'führte'],
  [/\bhelps Jesus carry the cross\b/g, 'hilft Jesus das Kreuz tragen'],
  [/\bhelps the injured man\b/g, 'hilft dem verletzten Mann'],
  [/\bhelps\b/g, 'hilft'],
  [/\bdreamed of a ladder to heaven\b/g, 'träumte von einer Leiter zum Himmel'],
  [/\bdreamed of\b/g, 'träumte von'],
  [/\basks for the body of\b/g, 'bittet um den Leichnam von'],
  [/\bwho is traditionally associated with\b/g, 'wer wird traditionell verbunden mit'],
  [/\bwho is the author of\b/g, 'wer ist der Autor des'],
  [/\bthe first king of Israel\b/g, 'der erste König Israels'],
  [/\bthe first Christian martyr\b/g, 'der erste christliche Märtyrer'],
  [/\bwrote most of the Psalms\b/g, 'schrieb die meisten Psalmen'],
  [/\bwrote the Revelation\b/g, 'schrieb die Offenbarung'],
  [/\bwrote "the righteous shall live by faith"\b/g, 'schrieb "der Gerechte wird aus Glauben leben"'],
  [/\bwhat event takes place\b/g, 'welches Ereignis findet statt'],
  [/\bsays, "Faith without works is dead"\b/g, 'sagt: "Glaube ohne Werke ist tot"'],
  [/\bdo we find "Rejoice always"\b/g, 'finden wir "Freut euch allezeit"'],
  [/\bdo we read "all things work together for good"\b/g, 'lesen wir "alle Dinge dienen zum Besten"'],
  [/\bdoes Paul speak of the "crown of righteousness"\b/g, 'spricht Paulus von der "Krone der Gerechtigkeit"'],
  [/\bis the armor of God found\b/g, 'findet man die Waffenrüstung Gottes'],
  [/\bare the Beatitudes found\b/g, 'finden sich die Seligpreisungen'],
  [/\bis the Sermon on the Mount found\b/g, 'findet man die Bergpredigt'],
  [/\bis the creation story found\b/g, 'findet man die Schöpfungsgeschichte'],
  [/\bare the Ten Commandments found\b/g, 'finden sich die Zehn Gebote'],
  [/\bdo we find the visit of the wise men\b/g, 'finden wir den Besuch der Weisen'],
  [/\bcontains the hymn to love\b/g, 'enthält das Hohelied der Liebe'],
  [/\bcontains "There is a Time for Everything"\b/g, 'enthält "Alles hat seine Zeit"'],
  [/\bcontains\b/g, 'enthält'],
  [/\bcelebrates the love between husband and wife\b/g, 'feiert die Liebe zwischen Mann und Frau'],
  [/\bcelebrates\b/g, 'feiert'],
  [/\bopens with "Vanity of Vanities"\b/g, 'beginnt mit "Eitelkeit der Eitelkeiten"'],
  [/\bopens with\b/g, 'beginnt mit'],
  [/\binvites us to bless the Lord for his benefits\b/g, 'lädt uns ein, den Herrn für seine Wohltaten zu preisen'],
  [/\binvites\b/g, 'lädt ein'],
  [/\bdescribes the "virtuous woman"\b/g, 'beschreibt die "tugendhafte Frau"'],
  [/\bdescribes\b/g, 'beschreibt'],
  [/\brighteous man suffers and is tested in his book\b/g, 'gerechter Mann leidet und wird in seinem Buch geprüft'],
  [/\bthe disciple whom Jesus loved\b/g, 'der Jünger, den Jesus liebte'],
  [/\bson of encouragement\b/g, 'Sohn des Trostes'],
  [/\baddressed to Philemon concerning Onesimus\b/g, 'an Philemon gerichtet bezüglich Onesimus'],
  [/\bJesus' first miracle according to\b/g, 'das erste Wunder Jesu nach'],
  [/\bwith a kiss\b/g, 'mit einem Kuss'],
  [/\bthree times\b/g, 'dreimal'],
  [/\baccording to\b/g, 'nach'],
  [/\bwere the disciples first called Christians\b/g, 'die Jünger erstmals Christen genannt wurden'],
  [/\blukewarm\b/g, 'lau'],
  [/\bfour canonical gospels\b/g, 'vier kanonischen Evangelien'],
  [/\bcity\b/g, 'Stadt'],
  [/\bchurch\b/g, 'Gemeinde'],
  [/\bchapter\b/g, 'Kapitel'],
  [/\bletter\b/g, 'Brief'],
  [/\bking\b/g, 'König'],
  [/\bqueen\b/g, 'Königin'],
  [/\bjudge\b/g, 'Richter'],
  [/\bpatriarch\b/g, 'Patriarch'],
  [/\bdays\b/g, 'Tage'],
  [/\bdid Jesus fast in the desert\b/g, 'fastete Jesus in der Wüste'],
  [/\bwas Lazarus in the tomb\b/g, 'war Lazarus im Grab'],
  [/\blepers come back to thank\b/g, 'Aussätzige kommen zurück, um zu danken'],
  [/\bIn the parable of /g, 'Im Gleichnis von '],
  [/\bthe Good Samaritan\b/g, 'dem barmherzigen Samariter'],
  [/\bthe prodigal son\b/g, 'dem verlorenen Sohn'],
  [/\bthe mustard seed\b/g, 'dem Senfkorn'],
  [/\bthe hidden treasure\b/g, 'dem verborgenen Schatz'],
  [/\bthe barren fig tree\b/g, 'dem unfruchtbaren Feigenbaum'],
  [/\bthe merciless debtor\b/g, 'dem unbarmherzigen Schuldner'],
  [/\bthe unjust judge\b/g, 'dem ungerechten Richter'],
  [/\bthe wedding banquet\b/g, 'dem Hochzeitsmahl'],
  [/\bthe two houses\b/g, 'den zwei Häusern'],
  [/\bthe ten virgins\b/g, 'den zehn Jungfrauen'],
  [/\bthe workers in the vineyard\b/g, 'den Arbeitern im Weinberg'],
  [/\bthe lost sheep\b/g, 'dem verlorenen Schaf'],
  [/\bthe sower\b/g, 'dem Sämann'],
  [/\bthe pearl of great price\b/g, 'der kostbaren Perle'],
  [/\bthe talents\b/g, 'den Talenten'],
  [/\bthe net\b/g, 'dem Netz'],
  [/\bleaven\b/g, 'dem Sauerteig'],
  [/\bthe rich fool\b/g, 'dem reichen Toren'],
  [/\bthe Pharisee and the tax collector\b/g, 'dem Pharisäer und dem Zöllner'],
  [/\bwho helps the injured man\b/g, 'wer dem Verletzten hilft'],
  [/\bwho is justified\b/g, 'wer gerechtfertigt wird'],
  [/\bwhere is the leaven hidden\b/g, 'wo der Sauerteig versteckt ist'],
  [/\bwhat does the winegrower decide\b/g, 'was der Winzer beschließt'],
  [/\bwhat does the man do\b/g, 'was der Mann tut'],
  [/\bhow many sheep are there\b/g, 'wie viele Schafe gibt es'],
  [/\bwhat debt is forgiven\b/g, 'welche Schuld wird vergeben'],
  [/\bwhat happens to the seed\b/g, 'was geschieht mit dem Samen'],
  [/\bwhat do we do with the bad fish\b/g, 'was tun wir mit den schlechten Fischen'],
  [/\bwhat does the merchant do\b/g, 'was tut der Händler'],
  [/\bwhat does the father do\b/g, 'was tut der Vater'],
  [/\bwhat does the rich man want to do\b/g, 'was will der Reiche tun'],
  [/\bwhat do the thorns represent\b/g, 'was stellen die Dornen dar'],
  [/\bwhich land bears much fruit\b/g, 'welcher Boden viel Frucht bringt'],
  [/\bhow many talents does the third servant receive\b/g, 'wie viele Talente erhält der dritte Knecht'],
  [/\bhow many were wise\b/g, 'wie viele waren klug'],
  [/\bwhat is the stable house built on\b/g, 'worauf das feste Haus gebaut ist'],
  [/\bwhat does the widow do\b/g, 'was tut die Witwe'],
  [/\bwho is ultimately invited\b/g, 'wer wird letztlich eingeladen'],
  [/\bwhat wages do they receive\b/g, 'welchen Lohn erhalten sie'],
  [/\bwhich prophets appear\b/g, 'welche Propheten erscheinen'],
  [/\bhow many loaves did they have\b/g, 'wie viele Brote hatten sie'],
  [/\bhow many fish did they have\b/g, 'wie viele Fische hatten sie'],
  [/\bwhat word did Jesus say to heal\b/g, 'welches Wort sagte Jesus, um zu heilen'],
  [/\bwhat word did Jesus say to raise up\b/g, 'welches Wort sagte Jesus, um aufzuerwecken'],
  [/\bwhat did Jesus say to Peter during the miraculous catch\b/g, 'was sagte Jesus zu Petrus beim wunderbaren Fischfang'],
  [/\bwhat did Jesus use to make mud for the man born blind\b/g, 'was benutzte Jesus, um Lehm für den Blindgeborenen zu machen'],
  [/\bwhat does Bartimaeus shout to attract Jesus\b/g, 'was ruft Bartimäus, um Jesus anzuziehen'],
  [/\bwhat does a woman with hemorrhoids touch to be cured\b/g, 'was berührt eine blutflüssige Frau, um geheilt zu werden'],
  [/\bwhere did Jesus pray before his arrest\b/g, 'wo betete Jesus vor seiner Verhaftung'],
  [/\bwhere does Jesus resurrect the widow's son\b/g, 'wo erweckt Jesus den Sohn der Witwe'],
  [/\bwhere is Jesus presented as a child\b/g, 'wo wird Jesus als Kind dargestellt'],
  [/\bwhere was Jesus born\b/g, 'wo wurde Jesus geboren'],
  [/\bwhere was Jesus sleeping when he calmed the storm\b/g, 'wo schlief Jesus, als er den Sturm stillte'],
  [/\bWhich Roman governor judges Jesus\b/g, 'Welcher römische Statthalter richtet Jesus'],
  [/\bJohn's brother\b/g, 'der Bruder des Johannes'],
  [/\bthe centurion's servant is healed\b/g, 'der Knecht des Hauptmanns wird geheilt'],
  [/\bthe coin found in the fish is used to pay\b/g, 'die Münze im Fisch wird zum Bezahlen verwendet'],
  [/\bthe paralytic lowered through the roof is healed\b/g, 'der Gelähmte, der durchs Dach herabgelassen wird, wird geheilt'],
  [/\bthe demons called in the pig episode\b/g, 'die Dämonen im Schweine-Ereignis'],
  [/\bwhen the loaves were multiplied\b/g, 'als die Brote vermehrt wurden'],
  [/\bwhen they multiplied\b/g, 'als sie vermehrt wurden'],
  [/\bking succeeds\b/g, 'König folgt auf'],
];

const toGerman = (value: string): string => {
  const exact = germanExactTerms.find(([from]) => from === value.trim())?.[1];
  if (exact) return exact;

  let translated = value;
  for (const [pattern, replacement] of germanQuestionReplacements) {
    translated = translated.replace(pattern, replacement);
  }

  for (const [source, de] of germanExactTerms) {
    translated = translated.split(source).join(de);
  }

  return translated;
};

const translatedLanguages: QuizLanguage[] = ['es', 'pt', 'de'];

export const getLocalizedQuizValue = <T,>(value: T | LocalizedValue<T>, language: string): T => {
  if (!isLocalizedValue(value)) {
    return value;
  }

  const normalized = value as LocalizedValue<T>;
  const languageKey = normalizeQuizLanguage(language);

  const translateLanguageValue = (candidate: T): T => {
    if (typeof candidate === 'string') {
      if (languageKey === 'es') return toSpanish(candidate) as T;
      if (languageKey === 'pt') return toPortuguese(candidate) as T;
      if (languageKey === 'de') return toGerman(candidate) as T;
      if (languageKey === 'it') return toItalian(candidate) as T;
      return candidate;
    }

    if (Array.isArray(candidate)) {
      const mapper =
        languageKey === 'es'
          ? toSpanish
          : languageKey === 'pt'
            ? toPortuguese
            : languageKey === 'de'
              ? toGerman
              : languageKey === 'it'
                ? toItalian
                : null;

      if (!mapper) return candidate;

      return candidate.map((item) => (typeof item === 'string' ? mapper(item) : item)) as T;
    }

    return candidate;
  };

  if (translatedLanguages.includes(languageKey)) {
    const explicit = normalized[languageKey];
    if (explicit !== undefined) {
      return translateLanguageValue(explicit as T);
    }
    const fallback = normalized.en ?? normalized.fr;
    if (fallback !== undefined) {
      return translateLanguageValue(fallback as T);
    }
  }

  const localized = normalized[languageKey];
  if (localized !== undefined) {
    return localized;
  }

  return normalized.fr ?? normalized.en ?? Object.values(normalized)[0] ?? ('' as T);
};

export const quizCategories: { key: QuizCategory; labelKey: string }[] = [
  { key: 'new-testament', labelKey: 'quizCategoryNewTestament' },
  { key: 'old-testament', labelKey: 'quizCategoryOldTestament' },
  { key: 'parables', labelKey: 'quizCategoryParables' },
  { key: 'miracles', labelKey: 'quizCategoryMiracles' },
  { key: 'characters', labelKey: 'quizCategoryCharacters' },
  { key: 'gospels', labelKey: 'quizCategoryGospels' },
  { key: 'prophets', labelKey: 'quizCategoryProphets' },
  { key: 'kings', labelKey: 'quizCategoryKings' },
  { key: 'wisdom', labelKey: 'quizCategoryWisdom' },
  { key: 'epistles', labelKey: 'quizCategoryEpistles' },
];

const quizQuestionsRaw: QuizQuestion[] = [
  {
    "id": 1,
    "category": "new-testament",
    "question": {
      "fr": "Qui a déclaré : « Je suis le chemin, la vérité et la vie » ?",
      "en": "Who said: “I am the way, the truth and the life”?",
      "it": "Chi ha detto: “Io sono la via, la verità e la vita”?"
    },
    "options": {
      "fr": [
        "Jésus",
        "Pierre",
        "Paul"
      ],
      "en": [
        "Jesus",
        "Peter",
        "Paul"
      ],
      "it": [
        "Gesù",
        "Pietro",
        "Paolo"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 14:6"
  },
  {
    "id": 2,
    "category": "new-testament",
    "question": {
      "fr": "Quel évangile commence par « Au commencement était la Parole » ?",
      "en": "Which gospel begins with “In the beginning was the Word”?",
      "it": "Quale vangelo inizia con “In principio era il Verbo”?"
    },
    "options": {
      "fr": [
        "Jean",
        "Matthieu",
        "Marc"
      ],
      "en": [
        "John",
        "Matthew",
        "Mark"
      ],
      "it": [
        "Giovanni",
        "Matteo",
        "Marco"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 1:1"
  },
  {
    "id": 3,
    "category": "new-testament",
    "question": {
      "fr": "Qui a écrit la majorité des épîtres du Nouveau Testament ?",
      "en": "Who wrote the majority of the epistles of the New Testament?",
      "it": "Chi ha scritto la maggior parte delle epistole del Nuovo Testamento?"
    },
    "options": {
      "fr": [
        "Paul",
        "Pierre",
        "Jean"
      ],
      "en": [
        "Paul",
        "Peter",
        "John"
      ],
      "it": [
        "Paolo",
        "Pietro",
        "Giovanni"
      ]
    },
    "answerIndex": 0,
    "reference": "Épîtres pauliniennes"
  },
  {
    "id": 4,
    "category": "new-testament",
    "question": {
      "fr": "Quel disciple a marché sur l’eau vers Jésus ?",
      "en": "Which disciple walked on water to Jesus?",
      "it": "Quale discepolo camminò sulle acque verso Gesù?"
    },
    "options": {
      "fr": [
        "Pierre",
        "André",
        "Thomas"
      ],
      "en": [
        "Peter",
        "Andrew",
        "Thomas"
      ],
      "it": [
        "Pietro",
        "Andrea",
        "Tommaso"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 14:29"
  },
  {
    "id": 5,
    "category": "new-testament",
    "question": {
      "fr": "Dans quel évangile trouve-t-on les Béatitudes ?",
      "en": "In which gospel are the Beatitudes found?",
      "it": "In quale vangelo si trovano le Beatitudini?"
    },
    "options": {
      "fr": [
        "Matthieu",
        "Luc",
        "Jean"
      ],
      "en": [
        "Matthew",
        "Luke",
        "John"
      ],
      "it": [
        "Matteo",
        "Luca",
        "Giovanni"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 5"
  },
  {
    "id": 6,
    "category": "new-testament",
    "question": {
      "fr": "Qui a baptisé Jésus ?",
      "en": "Who baptized Jesus?",
      "it": "Chi ha battezzato Gesù?"
    },
    "options": {
      "fr": [
        "Jean-Baptiste",
        "Nicodème",
        "Jacques"
      ],
      "en": [
        "John the Baptist",
        "Nicodemus",
        "James"
      ],
      "it": [
        "Giovanni Battista",
        "Nicodemo",
        "Giacomo"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 3:13"
  },
  {
    "id": 7,
    "category": "new-testament",
    "question": {
      "fr": "À quel apôtre Jésus a-t-il dit : « Pais mes brebis » ?",
      "en": "To which apostle did Jesus say, “Feed my sheep”?",
      "it": "A quale apostolo Gesù disse: “Pasci le mie pecore”?"
    },
    "options": {
      "fr": [
        "Pierre",
        "Jean",
        "Philippe"
      ],
      "en": [
        "Peter",
        "John",
        "Philip"
      ],
      "it": [
        "Pietro",
        "Giovanni",
        "Filippo"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 21:17"
  },
  {
    "id": 8,
    "category": "new-testament",
    "question": {
      "fr": "Dans quelle ville les disciples furent-ils appelés chrétiens pour la première fois ?",
      "en": "In which city were the disciples first called Christians?",
      "it": "In quale città i discepoli furono chiamati cristiani per la prima volta?"
    },
    "options": {
      "fr": [
        "Antioche",
        "Jérusalem",
        "Corinthe"
      ],
      "en": [
        "Antioch",
        "Jerusalem",
        "Corinth"
      ],
      "it": [
        "Antiochia",
        "Gerusalemme",
        "Corinto"
      ]
    },
    "answerIndex": 0,
    "reference": "Actes 11:26"
  },
  {
    "id": 9,
    "category": "new-testament",
    "question": {
      "fr": "Quel est le premier miracle de Jésus selon Jean ?",
      "en": "What is Jesus' first miracle according to John?",
      "it": "Qual è il primo miracolo di Gesù secondo Giovanni?"
    },
    "options": {
      "fr": [
        "Changer l’eau en vin",
        "Nourrir 5 000 personnes",
        "Guérir un aveugle"
      ],
      "en": [
        "Turn water into wine",
        "Feed 5,000 people",
        "Heal a blind man"
      ],
      "it": [
        "Trasformare l'acqua in vino",
        "Dai da mangiare a 5.000 persone",
        "Guarisci un cieco"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 2:1-11"
  },
  {
    "id": 10,
    "category": "new-testament",
    "question": {
      "fr": "Qui a eu une vision d’un drap rempli d’animaux ?",
      "en": "Who had a vision of a sheet full of animals?",
      "it": "Chi ha avuto la visione di un lenzuolo pieno di animali?"
    },
    "options": {
      "fr": [
        "Pierre",
        "Paul",
        "Étienne"
      ],
      "en": [
        "Peter",
        "Paul",
        "Stephen"
      ],
      "it": [
        "Pietro",
        "Paolo",
        "Stefano"
      ]
    },
    "answerIndex": 0,
    "reference": "Actes 10:9-16"
  },
  {
    "id": 12,
    "category": "new-testament",
    "question": {
      "fr": "Quel disciple a douté de la résurrection ?",
      "en": "Which disciple doubted the resurrection?",
      "it": "Quale discepolo dubitava della risurrezione?"
    },
    "options": {
      "fr": [
        "Thomas",
        "Judas",
        "Matthieu"
      ],
      "en": [
        "Thomas",
        "Judas",
        "Matthew"
      ],
      "it": [
        "Tommaso",
        "Giuda",
        "Matteo"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 20:24-29"
  },
  {
    "id": 13,
    "category": "new-testament",
    "question": {
      "fr": "Quelle lettre parle du fruit de l’Esprit ?",
      "en": "Which letter speaks of the fruit of the Spirit?",
      "it": "Quale lettera parla del frutto dello Spirito?"
    },
    "options": {
      "fr": [
        "Galates",
        "Éphésiens",
        "Hébreux"
      ],
      "en": [
        "Galatians",
        "Ephesians",
        "Hebrews"
      ],
      "it": [
        "Galati",
        "Efesini",
        "Ebrei"
      ]
    },
    "answerIndex": 0,
    "reference": "Galates 5:22-23"
  },
  {
    "id": 14,
    "category": "new-testament",
    "question": {
      "fr": "Qui a écrit l’Apocalypse ?",
      "en": "Who wrote the Revelation?",
      "it": "Chi ha scritto l'Apocalisse?"
    },
    "options": {
      "fr": [
        "Jean",
        "Paul",
        "Luc"
      ],
      "en": [
        "John",
        "Paul",
        "Luke"
      ],
      "it": [
        "Giovanni",
        "Paolo",
        "Luca"
      ]
    },
    "answerIndex": 0,
    "reference": "Apocalypse 1:1"
  },
  {
    "id": 15,
    "category": "new-testament",
    "question": {
      "fr": "Quelle église est qualifiée de « tiède » ?",
      "en": "Which church qualifies as “lukewarm”?",
      "it": "Quale chiesa si qualifica come “tiepida”?"
    },
    "options": {
      "fr": [
        "Laodicée",
        "Éphèse",
        "Smyrne"
      ],
      "en": [
        "Laodicea",
        "Ephesus",
        "Smyrna"
      ],
      "it": [
        "Laodicea",
        "Efeso",
        "Smirne"
      ]
    },
    "answerIndex": 0,
    "reference": "Apocalypse 3:16"
  },
  {
    "id": 16,
    "category": "new-testament",
    "question": {
      "fr": "Combien de jours Jésus a-t-il jeûné dans le désert ?",
      "en": "How many days did Jesus fast in the desert?",
      "it": "Per quanti giorni Gesù digiunò nel deserto?"
    },
    "options": {
      "fr": [
        "40",
        "7",
        "3"
      ],
      "en": [
        "40",
        "7",
        "3"
      ],
      "it": [
        "40",
        "7",
        "3"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 4:2"
  },
  {
    "id": 17,
    "category": "new-testament",
    "question": {
      "fr": "Quel évangile est le plus court ?",
      "en": "Which gospel is the shortest?",
      "it": "Quale vangelo è il più breve?"
    },
    "options": {
      "fr": [
        "Marc",
        "Matthieu",
        "Luc"
      ],
      "en": [
        "Mark",
        "Matthew",
        "Luke"
      ],
      "it": [
        "Marco",
        "Matteo",
        "Luca"
      ]
    },
    "answerIndex": 0,
    "reference": "Évangiles"
  },
  {
    "id": 18,
    "category": "new-testament",
    "question": {
      "fr": "Qui a trahi Jésus ?",
      "en": "Who betrayed Jesus?",
      "it": "Chi ha tradito Gesù?"
    },
    "options": {
      "fr": [
        "Judas",
        "Pierre",
        "Jean"
      ],
      "en": [
        "Judas",
        "Peter",
        "John"
      ],
      "it": [
        "Giuda",
        "Pietro",
        "Giovanni"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 26:14-16"
  },
  {
    "id": 19,
    "category": "new-testament",
    "question": {
      "fr": "Dans Actes 2, quel événement a lieu ?",
      "en": "In Acts 2, what event takes place?",
      "it": "Negli Atti 2, quale evento avviene?"
    },
    "options": {
      "fr": [
        "La Pentecôte",
        "L’ascension",
        "La crucifixion"
      ],
      "en": [
        "Pentecost",
        "The ascent",
        "The crucifixion"
      ],
      "it": [
        "Pentecoste",
        "L'ascensione",
        "La crocifissione"
      ]
    },
    "answerIndex": 0,
    "reference": "Actes 2"
  },
  {
    "id": 20,
    "category": "new-testament",
    "question": {
      "fr": "Quel apôtre est appelé « fils de l’encouragement » ?",
      "en": "Which apostle is called “son of encouragement”?",
      "it": "Quale apostolo è chiamato “figlio dell’incoraggiamento”?"
    },
    "options": {
      "fr": [
        "Barnabas",
        "Silas",
        "Timothée"
      ],
      "en": [
        "Barnabas",
        "Silas",
        "Timothy"
      ],
      "it": [
        "Barnaba",
        "Sila",
        "Timoteo"
      ]
    },
    "answerIndex": 0,
    "reference": "Actes 4:36"
  },
  {
    "id": 21,
    "category": "old-testament",
    "question": {
      "fr": "Quel patriarche a offert Isaac ?",
      "en": "Which patriarch offered Isaac?",
      "it": "Quale patriarca offrì Isacco?"
    },
    "options": {
      "fr": [
        "Abraham",
        "Moïse",
        "Jacob"
      ],
      "en": [
        "Abraham",
        "Moses",
        "Jacob"
      ],
      "it": [
        "Abramo",
        "Mosé",
        "Giacobbe"
      ]
    },
    "answerIndex": 0,
    "reference": "Genèse 22"
  },
  {
    "id": 23,
    "category": "old-testament",
    "question": {
      "fr": "Quel prophète a été avalé par un grand poisson ?",
      "en": "Which prophet was swallowed by a big fish?",
      "it": "Quale profeta è stato inghiottito da un grosso pesce?"
    },
    "options": {
      "fr": [
        "Jonas",
        "Ésaïe",
        "Jérémie"
      ],
      "en": [
        "Jonah",
        "Isaiah",
        "Jeremiah"
      ],
      "it": [
        "Giona",
        "Isaia",
        "Geremia"
      ]
    },
    "answerIndex": 0,
    "reference": "Jonas 1:17"
  },
  {
    "id": 24,
    "category": "old-testament",
    "question": {
      "fr": "Qui a affronté Goliath ?",
      "en": "Who faced Goliath?",
      "it": "Chi ha affrontato Golia?"
    },
    "options": {
      "fr": [
        "David",
        "Saül",
        "Jonathan"
      ],
      "en": [
        "David",
        "Saul",
        "Jonathan"
      ],
      "it": [
        "Davide",
        "Saulo",
        "Jonathan"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Samuel 17"
  },
  {
    "id": 25,
    "category": "old-testament",
    "question": {
      "fr": "Quelle reine a sauvé son peuple ?",
      "en": "Which queen saved her people?",
      "it": "Quale regina ha salvato il suo popolo?"
    },
    "options": {
      "fr": [
        "Esther",
        "Ruth",
        "Débora"
      ],
      "en": [
        "Esther",
        "Ruth",
        "Deborah"
      ],
      "it": [
        "Ester",
        "Rut",
        "Debora"
      ]
    },
    "answerIndex": 0,
    "reference": "Esther 4-7"
  },
  {
    "id": 27,
    "category": "old-testament",
    "question": {
      "fr": "Qui a reçu les tables de la loi sur le Sinaï ?",
      "en": "Who received the tablets of the law on Sinai?",
      "it": "Chi ha ricevuto le tavole della legge sul Sinai?"
    },
    "options": {
      "fr": [
        "Moïse",
        "Aaron",
        "Josué"
      ],
      "en": [
        "Moses",
        "Aaron",
        "Joshua"
      ],
      "it": [
        "Mosé",
        "Aronne",
        "Giosuè"
      ]
    },
    "answerIndex": 0,
    "reference": "Exode 31:18"
  },
  {
    "id": 28,
    "category": "old-testament",
    "question": {
      "fr": "Quel juge a combattu avec une mâchoire d’âne ?",
      "en": "Which judge fought with the jaw of a donkey?",
      "it": "Quale giudice ha combattuto con la mascella di un asino?"
    },
    "options": {
      "fr": [
        "Samson",
        "Gédéon",
        "Jephthé"
      ],
      "en": [
        "Samson",
        "Gideon",
        "Jephthe"
      ],
      "it": [
        "Sansone",
        "Gedeone",
        "Iefte"
      ]
    },
    "answerIndex": 0,
    "reference": "Juges 15:15"
  },
  {
    "id": 29,
    "category": "old-testament",
    "question": {
      "fr": "Quel roi a demandé la sagesse ?",
      "en": "Which king asked for wisdom?",
      "it": "Quale re ha chiesto saggezza?"
    },
    "options": {
      "fr": [
        "Salomon",
        "David",
        "Roboam"
      ],
      "en": [
        "Solomon",
        "David",
        "Rehoboam"
      ],
      "it": [
        "Salomone",
        "Davide",
        "Roboamo"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Rois 3:9"
  },
  {
    "id": 31,
    "category": "old-testament",
    "question": {
      "fr": "Quel prophète a vu la vallée d’ossements secs ?",
      "en": "Which prophet saw the valley of dry bones?",
      "it": "Cosa vide il profeta nella valle delle ossa secche?"
    },
    "options": {
      "fr": [
        "Ézéchiel",
        "Daniel",
        "Amos"
      ],
      "en": [
        "Ezekiel",
        "Daniel",
        "Amos"
      ],
      "it": [
        "Ezechiele",
        "Daniele",
        "Amos"
      ]
    },
    "answerIndex": 0,
    "reference": "Ézéchiel 37"
  },
  {
    "id": 32,
    "category": "old-testament",
    "question": {
      "fr": "Qui a construit l’arche ?",
      "en": "Who built the ark?",
      "it": "Chi ha costruito l'arca?"
    },
    "options": {
      "fr": [
        "Noé",
        "Abraham",
        "Isaac"
      ],
      "en": [
        "Noah",
        "Abraham",
        "Isaac"
      ],
      "it": [
        "Noè",
        "Abramo",
        "Isacco"
      ]
    },
    "answerIndex": 0,
    "reference": "Genèse 6:14"
  },
  {
    "id": 34,
    "category": "old-testament",
    "question": {
      "fr": "Qui a mené Israël après Moïse ?",
      "en": "Who led Israel after Moses?",
      "it": "Chi guidò Israele dopo Mosè?"
    },
    "options": {
      "fr": [
        "Josué",
        "Caleb",
        "Aaron"
      ],
      "en": [
        "Joshua",
        "Caleb",
        "Aaron"
      ],
      "it": [
        "Giosuè",
        "Caleb",
        "Aronne"
      ]
    },
    "answerIndex": 0,
    "reference": "Josué 1:1-2"
  },
  {
    "id": 35,
    "category": "old-testament",
    "question": {
      "fr": "Quelle femme a glané dans les champs de Boaz ?",
      "en": "Which woman gleaned in the fields of Boaz?",
      "it": "Quale donna spigolava nei campi di Boaz?"
    },
    "options": {
      "fr": [
        "Ruth",
        "Esther",
        "Anne"
      ],
      "en": [
        "Ruth",
        "Esther",
        "Anne"
      ],
      "it": [
        "Rut",
        "Ester",
        "Anna"
      ]
    },
    "answerIndex": 0,
    "reference": "Ruth 2:2"
  },
  {
    "id": 36,
    "category": "old-testament",
    "question": {
      "fr": "Quel personnage a été jeté dans la fosse aux lions ?",
      "en": "Which character was thrown into the lions' den?",
      "it": "Quale personaggio è stato gettato nella fossa dei leoni?"
    },
    "options": {
      "fr": [
        "Daniel",
        "David",
        "Joseph"
      ],
      "en": [
        "Daniel",
        "David",
        "Joseph"
      ],
      "it": [
        "Daniele",
        "Davide",
        "Giuseppe"
      ]
    },
    "answerIndex": 0,
    "reference": "Daniel 6"
  },
  {
    "id": 37,
    "category": "old-testament",
    "question": {
      "fr": "Quel prophète a été enlevé dans un char de feu ?",
      "en": "Which prophet was caught up in a chariot of fire?",
      "it": "Quale profeta fu catturato da un carro di fuoco?"
    },
    "options": {
      "fr": [
        "Élie",
        "Élisée",
        "Ésaïe"
      ],
      "en": [
        "Elijah",
        "Elisha",
        "Isaiah"
      ],
      "it": [
        "Elia",
        "Eliseo",
        "Isaia"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Rois 2:11"
  },
  {
    "id": 38,
    "category": "old-testament",
    "question": {
      "fr": "Quel roi a construit le temple ?",
      "en": "Which king built the temple?",
      "it": "Quale re costruì il tempio?"
    },
    "options": {
      "fr": [
        "Salomon",
        "David",
        "Saül"
      ],
      "en": [
        "Solomon",
        "David",
        "Saul"
      ],
      "it": [
        "Salomone",
        "Davide",
        "Saulo"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Rois 6"
  },
  {
    "id": 40,
    "category": "old-testament",
    "question": {
      "fr": "Quel patriarche a rêvé d’une échelle vers le ciel ?",
      "en": "Which patriarch dreamed of a ladder to heaven?",
      "it": "Quale patriarca sognava una scala per il paradiso?"
    },
    "options": {
      "fr": [
        "Jacob",
        "Joseph",
        "Isaac"
      ],
      "en": [
        "Jacob",
        "Joseph",
        "Isaac"
      ],
      "it": [
        "Giacobbe",
        "Giuseppe",
        "Isacco"
      ]
    },
    "answerIndex": 0,
    "reference": "Genèse 28:12"
  },
  {
    "id": 41,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du fils prodigue, que fait le père ?",
      "en": "In the parable of the prodigal son, what does the father do?",
      "it": "Nella parabola del figliol prodigo cosa fa il padre?"
    },
    "options": {
      "fr": [
        "Il accueille son fils",
        "Il le rejette",
        "Il le punit sévèrement"
      ],
      "en": [
        "He welcomes his son",
        "He rejects it",
        "He punished him severely"
      ],
      "it": [
        "Dà il benvenuto a suo figlio",
        "Lo rifiuta",
        "Lo ha punito severamente"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 15:20"
  },
  {
    "id": 42,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du bon Samaritain, qui aide l’homme blessé ?",
      "en": "In the parable of the Good Samaritan, who helps the injured man?",
      "it": "Nella parabola del Buon Samaritano, chi aiuta l'uomo ferito?"
    },
    "options": {
      "fr": [
        "Le Samaritain",
        "Le prêtre",
        "Le lévite"
      ],
      "en": [
        "The Samaritan",
        "The priest",
        "The Levite"
      ],
      "it": [
        "Il Samaritano",
        "Il prete",
        "Il levita"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 10:33"
  },
  {
    "id": 43,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du semeur, quelle terre porte beaucoup de fruit ?",
      "en": "In the parable of the sower, which land bears much fruit?",
      "it": "Nella parabola del seminatore, quale terra dà molto frutto?"
    },
    "options": {
      "fr": [
        "La bonne terre",
        "Le chemin",
        "Les épines"
      ],
      "en": [
        "The good land",
        "The path",
        "The thorns"
      ],
      "it": [
        "La buona terra",
        "Il percorso",
        "Le spine"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 13:8"
  },
  {
    "id": 44,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole de la brebis perdue, combien de brebis y a-t-il ?",
      "en": "In the parable of the lost sheep, how many sheep are there?",
      "it": "Nella parabola della pecora smarrita, quante pecore ci sono?"
    },
    "options": {
      "fr": [
        "100",
        "10",
        "12"
      ],
      "en": [
        "100",
        "10",
        "12"
      ],
      "it": [
        "100",
        "10",
        "12"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 15:4"
  },
  {
    "id": 45,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole des talents, combien de talents reçoit le troisième serviteur ?",
      "en": "In the parable of the talents, how many talents does the third servant receive?",
      "it": "Nella parabola dei talenti, quanti talenti riceve il terzo servitore?"
    },
    "options": {
      "fr": [
        "1",
        "5",
        "2"
      ],
      "en": [
        "1",
        "5",
        "2"
      ],
      "it": [
        "1",
        "5",
        "2"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 25:15"
  },
  {
    "id": 46,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole des dix vierges, combien étaient sages ?",
      "en": "In the parable of the ten virgins, how many were wise?",
      "it": "Nella parabola delle dieci vergini, quante erano sagge?"
    },
    "options": {
      "fr": [
        "5",
        "7",
        "3"
      ],
      "en": [
        "5",
        "7",
        "3"
      ],
      "it": [
        "5",
        "7",
        "3"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 25:2"
  },
  {
    "id": 47,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du riche insensé, que veut faire le riche ?",
      "en": "In the parable of the rich fool, what does the rich man want to do?",
      "it": "Nella parabola del ricco stolto, cosa vuole fare il ricco?"
    },
    "options": {
      "fr": [
        "Agrandir ses greniers",
        "Tout donner",
        "Partir en voyage"
      ],
      "en": [
        "Expand your attics",
        "give everything",
        "Go on a trip"
      ],
      "it": [
        "Espandi le tue mansarde",
        "dare tutto",
        "Fai un viaggio"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 12:18"
  },
  {
    "id": 48,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole de la graine de moutarde, que devient la graine ?",
      "en": "In the parable of the mustard seed, what happens to the seed?",
      "it": "Nella parabola del granello di senape, cosa succede al granello?"
    },
    "options": {
      "fr": [
        "Un grand arbre",
        "Une fleur",
        "Une pierre"
      ],
      "en": [
        "A big tree",
        "A flower",
        "A stone"
      ],
      "it": [
        "Un grande albero",
        "Un fiore",
        "Una pietra"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 13:32"
  },
  {
    "id": 49,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du levain, où le levain est-il caché ?",
      "en": "In the parable of leaven, where is the leaven hidden?",
      "it": "Nella parabola del lievito, dove è nascosto il lievito?"
    },
    "options": {
      "fr": [
        "Dans la farine",
        "Dans un coffre",
        "Sous une pierre"
      ],
      "en": [
        "In the flour",
        "In a trunk",
        "Under a stone"
      ],
      "it": [
        "Nella farina",
        "In un baule",
        "Sotto una pietra"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 13:33"
  },
  {
    "id": 50,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du trésor caché, que fait l’homme ?",
      "en": "In the parable of the hidden treasure, what does the man do?",
      "it": "Nella parabola del tesoro nascosto, cosa fa l'uomo?"
    },
    "options": {
      "fr": [
        "Il vend tout pour acheter le champ",
        "Il le cache encore",
        "Il l’ignore"
      ],
      "en": [
        "He sells everything to buy the field",
        "He still hides it",
        "He ignores it"
      ],
      "it": [
        "Vende tutto per comprare il campo",
        "Lo nasconde ancora",
        "Lo ignora"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 13:44"
  },
  {
    "id": 51,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole de la perle de grand prix, que fait le marchand ?",
      "en": "In the parable of the pearl of great price, what does the merchant do?",
      "it": "Nella parabola della perla di grande valore, cosa fa il mercante?"
    },
    "options": {
      "fr": [
        "Il vend tout",
        "Il demande un prêt",
        "Il abandonne"
      ],
      "en": [
        "He sells everything",
        "He asks for a loan",
        "He gives up"
      ],
      "it": [
        "Vende tutto",
        "Chiede un prestito",
        "Si arrende"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 13:46"
  },
  {
    "id": 52,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du filet, que fait-on des mauvais poissons ?",
      "en": "In the parable of the net, what do we do with the bad fish?",
      "it": "Nella parabola della rete, cosa facciamo con i pesci cattivi?"
    },
    "options": {
      "fr": [
        "On les jette",
        "On les garde",
        "On les vend"
      ],
      "en": [
        "We throw them away",
        "We keep them",
        "We sell them"
      ],
      "it": [
        "Li buttiamo via",
        "Li teniamo",
        "Li vendiamo"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 13:48"
  },
  {
    "id": 53,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole des ouvriers de la vigne, quel salaire reçoivent-ils ?",
      "en": "In the parable of the workers in the vineyard, what wages do they receive?",
      "it": "Nella parabola dei lavoratori della vigna, quale salario ricevono?"
    },
    "options": {
      "fr": [
        "Un denier",
        "Deux deniers",
        "Cinq deniers"
      ],
      "en": [
        "A denarius",
        "Two denarii",
        "Five denarii"
      ],
      "it": [
        "Un denaro",
        "Due denari",
        "Cinque denari"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 20:9"
  },
  {
    "id": 54,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du pharisien et du publicain, qui est justifié ?",
      "en": "In the parable of the Pharisee and the tax collector, who is justified?",
      "it": "Nella parabola del fariseo e del pubblicano chi è giustificato?"
    },
    "options": {
      "fr": [
        "Le publicain",
        "Le pharisien",
        "Les deux"
      ],
      "en": [
        "The publican",
        "The Pharisee",
        "Both"
      ],
      "it": [
        "Il pubblicano",
        "Il fariseo",
        "Entrambi"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 18:14"
  },
  {
    "id": 55,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du débiteur impitoyable, quelle dette est remise ?",
      "en": "In the parable of the merciless debtor, what debt is forgiven?",
      "it": "Nella parabola del debitore spietato, quale debito viene condonato?"
    },
    "options": {
      "fr": [
        "Dix mille talents",
        "Cent deniers",
        "Dix pièces"
      ],
      "en": [
        "Ten thousand talents",
        "One hundred denarii",
        "Ten pieces"
      ],
      "it": [
        "Diecimila talenti",
        "Centesimi di negazionismo",
        "Dieci pezzi"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 18:24"
  },
  {
    "id": 56,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole des deux maisons, sur quoi la maison stable est-elle construite ?",
      "en": "In the parable of the two houses, what is the stable house built on?",
      "it": "Nella parabola delle due case, su cosa è costruita la stalla?"
    },
    "options": {
      "fr": [
        "Le rocher",
        "Le sable",
        "L’argile"
      ],
      "en": [
        "The rock",
        "The sand",
        "Clay"
      ],
      "it": [
        "La roccia",
        "La sabbia",
        "Argilla"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 7:24"
  },
  {
    "id": 57,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du banquet de noces, qui est invité finalement ?",
      "en": "In the parable of the wedding banquet, who is ultimately invited?",
      "it": "Nella parabola del banchetto nuziale, chi viene invitato alla fine?"
    },
    "options": {
      "fr": [
        "Les gens des chemins",
        "Les notables",
        "Les soldats"
      ],
      "en": [
        "The people of the roads",
        "The notables",
        "The soldiers"
      ],
      "it": [
        "La gente delle strade",
        "I notabili",
        "I soldati"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 22:9"
  },
  {
    "id": 58,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du figuier stérile, que décide le vigneron ?",
      "en": "In the parable of the barren fig tree, what does the winegrower decide?",
      "it": "Nella parabola del fico sterile, cosa decide il vignaiolo?"
    },
    "options": {
      "fr": [
        "Lui laisser encore un an",
        "Le couper tout de suite",
        "Le déplacer"
      ],
      "en": [
        "Give him another year",
        "Cut it right away",
        "Move it"
      ],
      "it": [
        "Dategli un altro anno",
        "Taglialo subito",
        "Muovilo"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 13:8"
  },
  {
    "id": 59,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du semeur, que représentent les épines ?",
      "en": "In the parable of the sower, what do the thorns represent?",
      "it": "Nella parabola del seminatore cosa rappresentano le spine?"
    },
    "options": {
      "fr": [
        "Les soucis et richesses",
        "La persécution",
        "La joie"
      ],
      "en": [
        "Worries and riches",
        "The persecution",
        "Joy"
      ],
      "it": [
        "Preoccupazioni e ricchezze",
        "La persecuzione",
        "Gioia"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 13:22"
  },
  {
    "id": 60,
    "category": "parables",
    "question": {
      "fr": "Dans la parabole du juge inique, que fait la veuve ?",
      "en": "In the parable of the unjust judge, what does the widow do?",
      "it": "Nella parabola del giudice ingiusto, cosa fa la vedova?"
    },
    "options": {
      "fr": [
        "Elle insiste",
        "Elle abandonne",
        "Elle se venge"
      ],
      "en": [
        "She insists",
        "She gives up",
        "She takes revenge"
      ],
      "it": [
        "Lei insiste",
        "Lei si arrende",
        "Si vendica"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 18:3"
  },
  {
    "id": 61,
    "category": "miracles",
    "question": {
      "fr": "Jésus change l’eau en vin à…",
      "en": "Jesus changes water into wine...",
      "it": "Gesù trasforma l'acqua in vino..."
    },
    "options": {
      "fr": [
        "Cana",
        "Nazareth",
        "Capernaüm"
      ],
      "en": [
        "Cana",
        "Nazareth",
        "Capernaum"
      ],
      "it": [
        "Cana",
        "Nazaret",
        "Cafarnao"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 2:1-11"
  },
  {
    "id": 62,
    "category": "miracles",
    "question": {
      "fr": "Lors de la multiplication des pains, combien de pains avaient-ils ?",
      "en": "When the loaves were multiplied, how many loaves did they have?",
      "it": "Quando i pani furono moltiplicati, quanti pani avevano?"
    },
    "options": {
      "fr": [
        "5",
        "7",
        "12"
      ],
      "en": [
        "5",
        "7",
        "12"
      ],
      "it": [
        "5",
        "7",
        "12"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 14:17"
  },
  {
    "id": 63,
    "category": "miracles",
    "question": {
      "fr": "Lors de la multiplication, combien de poissons avaient-ils ?",
      "en": "When they multiplied, how many fish did they have?",
      "it": "Quando si moltiplicarono, quanti pesci avevano?"
    },
    "options": {
      "fr": [
        "2",
        "5",
        "1"
      ],
      "en": [
        "2",
        "5",
        "1"
      ],
      "it": [
        "2",
        "5",
        "1"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 14:17"
  },
  {
    "id": 64,
    "category": "miracles",
    "question": {
      "fr": "Combien de jours Lazare était-il au tombeau ?",
      "en": "How many days was Lazarus in the tomb?",
      "it": "Quanti giorni Lazzaro rimase nel sepolcro?"
    },
    "options": {
      "fr": [
        "4",
        "2",
        "3"
      ],
      "en": [
        "4",
        "2",
        "3"
      ],
      "it": [
        "4",
        "2",
        "3"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 11:39"
  },
  {
    "id": 65,
    "category": "miracles",
    "question": {
      "fr": "Avec quoi Jésus fait-il la boue pour l’aveugle-né ?",
      "en": "What did Jesus use to make mud for the man born blind?",
      "it": "Che cosa ha usato Gesù per fare il fango per l'uomo nato cieco?"
    },
    "options": {
      "fr": [
        "Sa salive et la terre",
        "De l’huile",
        "De l’eau claire"
      ],
      "en": [
        "His saliva and the earth",
        "Oil",
        "Clear water"
      ],
      "it": [
        "La sua saliva e la terra",
        "Olio",
        "Acqua limpida"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 9:6"
  },
  {
    "id": 66,
    "category": "miracles",
    "question": {
      "fr": "Où Jésus dormait-il quand il apaisa la tempête ?",
      "en": "Where was Jesus sleeping when he calmed the storm?",
      "it": "Dove dormiva Gesù quando calmò la tempesta?"
    },
    "options": {
      "fr": [
        "Dans la barque",
        "Sur la montagne",
        "Dans une maison"
      ],
      "en": [
        "In the boat",
        "On the mountain",
        "In a house"
      ],
      "it": [
        "Nella barca",
        "Sulla montagna",
        "In una casa"
      ]
    },
    "answerIndex": 0,
    "reference": "Marc 4:38"
  },
  {
    "id": 67,
    "category": "miracles",
    "question": {
      "fr": "Que touche la femme hémorroïsse pour être guérie ?",
      "en": "What does a woman with hemorrhoids touch to be cured?",
      "it": "Cosa tocca una donna con le emorroidi per guarire?"
    },
    "options": {
      "fr": [
        "Le bord du vêtement",
        "La main de Jésus",
        "Le manteau de Pierre"
      ],
      "en": [
        "The edge of the garment",
        "The hand of Jesus",
        "Peter's coat"
      ],
      "it": [
        "Il bordo dell'indumento",
        "La mano di Gesù",
        "Il cappotto di Pietro"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 8:44"
  },
  {
    "id": 68,
    "category": "miracles",
    "question": {
      "fr": "Combien de lépreux reviennent remercier Jésus ?",
      "en": "How many lepers come back to thank Jesus?",
      "it": "Quanti lebbrosi tornano a ringraziare Gesù?"
    },
    "options": {
      "fr": [
        "1",
        "5",
        "10"
      ],
      "en": [
        "1",
        "5",
        "10"
      ],
      "it": [
        "1",
        "5",
        "10"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 17:17"
  },
  {
    "id": 69,
    "category": "miracles",
    "question": {
      "fr": "Quel mot Jésus dit-il pour relever la fille de Jaïrus ?",
      "en": "What word did Jesus say to raise up Jairus' daughter?",
      "it": "Quale parola disse Gesù per risuscitare la figlia di Giàiro?"
    },
    "options": {
      "fr": [
        "Talitha koum",
        "Shalom",
        "Amen"
      ],
      "en": [
        "Talitha koum",
        "Shalom",
        "Amen"
      ],
      "it": [
        "Talitha koum",
        "Shalom",
        "Amen"
      ]
    },
    "answerIndex": 0,
    "reference": "Marc 5:41"
  },
  {
    "id": 70,
    "category": "miracles",
    "question": {
      "fr": "Qui commence à couler en marchant sur l’eau ?",
      "en": "Who starts to sink when walking on water?",
      "it": "Chi inizia ad affondare quando cammina sull'acqua?"
    },
    "options": {
      "fr": [
        "Pierre",
        "Jean",
        "Jacques"
      ],
      "en": [
        "Peter",
        "John",
        "James"
      ],
      "it": [
        "Pietro",
        "Giovanni",
        "Giacomo"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 14:30"
  },
  {
    "id": 71,
    "category": "miracles",
    "question": {
      "fr": "Le paralytique descendu par le toit est guéri à…",
      "en": "The paralytic lowered through the roof is healed...",
      "it": "Il paralitico calato dal tetto è guarito..."
    },
    "options": {
      "fr": [
        "Capernaüm",
        "Jérusalem",
        "Bethléhem"
      ],
      "en": [
        "Capernaum",
        "Jerusalem",
        "Bethlehem"
      ],
      "it": [
        "Cafarnao",
        "Gerusalemme",
        "Betlemme"
      ]
    },
    "answerIndex": 0,
    "reference": "Marc 2:1-5"
  },
  {
    "id": 72,
    "category": "miracles",
    "question": {
      "fr": "Comment les démons se nomment-ils dans l’épisode des porcs ?",
      "en": "What are the demons called in the pig episode?",
      "it": "Come vengono chiamati i demoni nell'episodio del maiale?"
    },
    "options": {
      "fr": [
        "Légion",
        "Béelzébul",
        "Mammon"
      ],
      "en": [
        "Legion",
        "Beelzebub",
        "Mammon"
      ],
      "it": [
        "Legione",
        "Belzebù",
        "Mammona"
      ]
    },
    "answerIndex": 0,
    "reference": "Marc 5:9"
  },
  {
    "id": 73,
    "category": "miracles",
    "question": {
      "fr": "Le serviteur du centurion est guéri…",
      "en": "The centurion's servant is healed...",
      "it": "Il servo del centurione viene guarito..."
    },
    "options": {
      "fr": [
        "À distance",
        "Sur place",
        "Au temple"
      ],
      "en": [
        "From a distance",
        "On site",
        "At the temple"
      ],
      "it": [
        "Da lontano",
        "Sul posto",
        "Al tempio"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 8:13"
  },
  {
    "id": 74,
    "category": "miracles",
    "question": {
      "fr": "Que dit Jésus à Pierre lors de la pêche miraculeuse ?",
      "en": "What did Jesus say to Peter during the miraculous catch?",
      "it": "Cosa disse Gesù a Pietro durante la pesca miracolosa?"
    },
    "options": {
      "fr": [
        "Avance en eau profonde",
        "Rentre à la maison",
        "Mets-toi à genoux"
      ],
      "en": [
        "Deep water advance",
        "Come home",
        "Get on your knees"
      ],
      "it": [
        "Avanzamento delle acque profonde",
        "Vieni a casa",
        "Mettiti in ginocchio"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 5:4"
  },
  {
    "id": 75,
    "category": "miracles",
    "question": {
      "fr": "Lors de la nourriture des 4 000, combien de pains avaient-ils ?",
      "en": "When feeding the 4,000, how many loaves did they have?",
      "it": "Quando sfamarono i 4.000, quanti pani avevano?"
    },
    "options": {
      "fr": [
        "7",
        "5",
        "12"
      ],
      "en": [
        "7",
        "5",
        "12"
      ],
      "it": [
        "7",
        "5",
        "12"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 15:34"
  },
  {
    "id": 76,
    "category": "miracles",
    "question": {
      "fr": "Quel mot Jésus dit-il pour guérir le sourd-muet ?",
      "en": "What word did Jesus say to heal the deaf and mute?",
      "it": "Quale parola ha detto Gesù per guarire i sordomuti?"
    },
    "options": {
      "fr": [
        "Ephphatha",
        "Shalom",
        "Hosanna"
      ],
      "en": [
        "Ephphatha",
        "Shalom",
        "Hosanna"
      ],
      "it": [
        "Epaphatha",
        "Shalom",
        "Osanna"
      ]
    },
    "answerIndex": 0,
    "reference": "Marc 7:34"
  },
  {
    "id": 77,
    "category": "miracles",
    "question": {
      "fr": "À la transfiguration, quels prophètes apparaissent ?",
      "en": "At the transfiguration, which prophets appear?",
      "it": "Alla trasfigurazione quali profeti appaiono?"
    },
    "options": {
      "fr": [
        "Moïse et Élie",
        "Abraham et Isaac",
        "David et Samuel"
      ],
      "en": [
        "Moses and Elijah",
        "Abraham and Isaac",
        "David and Samuel"
      ],
      "it": [
        "Mosè ed Elia",
        "Abramo e Isacco",
        "Davide e Samuele"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 17:3"
  },
  {
    "id": 78,
    "category": "miracles",
    "question": {
      "fr": "Où Jésus ressuscite-t-il le fils de la veuve ?",
      "en": "Where does Jesus resurrect the widow's son?",
      "it": "Dove Gesù resuscita il figlio della vedova?"
    },
    "options": {
      "fr": [
        "Naïn",
        "Jéricho",
        "Emmaüs"
      ],
      "en": [
        "Dwarf",
        "Jericho",
        "Emmaus"
      ],
      "it": [
        "Nain",
        "Gerico",
        "Emmaus"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 7:11-15"
  },
  {
    "id": 79,
    "category": "miracles",
    "question": {
      "fr": "Que crie Bartimée pour attirer Jésus ?",
      "en": "What does Bartimaeus shout to attract Jesus?",
      "it": "Cosa grida Bartimeo per attirare Gesù?"
    },
    "options": {
      "fr": [
        "« Jésus, Fils de David, aie pitié de moi »",
        "« Seigneur, sois béni »",
        "« Ô Roi, écoute-moi »"
      ],
      "en": [
        "“Jesus, Son of David, have mercy on me”",
        "“Lord, be blessed”",
        "“O King, listen to me”"
      ],
      "it": [
        "“Gesù, Figlio di Davide, abbi pietà di me”",
        "“Signore, sii benedetto”",
        "“O Re, ascoltami”"
      ]
    },
    "answerIndex": 0,
    "reference": "Marc 10:47"
  },
  {
    "id": 80,
    "category": "miracles",
    "question": {
      "fr": "La pièce trouvée dans le poisson sert à payer…",
      "en": "The coin found in the fish is used to pay…",
      "it": "La moneta trovata nel pesce serve per pagare..."
    },
    "options": {
      "fr": [
        "La taxe du temple",
        "L’impôt romain",
        "Le prix du marché"
      ],
      "en": [
        "The temple tax",
        "The Roman tax",
        "The market price"
      ],
      "it": [
        "La tassa sul tempio",
        "L'imposta romana",
        "Il prezzo di mercato"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 17:27"
  },
  {
    "id": 81,
    "category": "characters",
    "question": {
      "fr": "Qui a interprété les rêves du Pharaon ?",
      "en": "Who interpreted the Pharaoh's dreams?",
      "it": "Chi interpretò i sogni del Faraone?"
    },
    "options": {
      "fr": [
        "Joseph",
        "Daniel",
        "Samuel"
      ],
      "en": [
        "Joseph",
        "Daniel",
        "Samuel"
      ],
      "it": [
        "Giuseppe",
        "Daniele",
        "Samuele"
      ]
    },
    "answerIndex": 0,
    "reference": "Genèse 41"
  },
  {
    "id": 82,
    "category": "characters",
    "question": {
      "fr": "Qui a conduit Israël autour de Jéricho ?",
      "en": "Who led Israel around Jericho?",
      "it": "Chi condusse Israele attorno a Gerico?"
    },
    "options": {
      "fr": [
        "Josué",
        "Caleb",
        "Gédéon"
      ],
      "en": [
        "Joshua",
        "Caleb",
        "Gideon"
      ],
      "it": [
        "Giosuè",
        "Caleb",
        "Gedeone"
      ]
    },
    "answerIndex": 0,
    "reference": "Josué 6"
  },
  {
    "id": 83,
    "category": "characters",
    "question": {
      "fr": "Qui était la mère de Samuel ?",
      "en": "Who was Samuel's mother?",
      "it": "Chi era la madre di Samuele?"
    },
    "options": {
      "fr": [
        "Anne",
        "Ruth",
        "Rachel"
      ],
      "en": [
        "Anne",
        "Ruth",
        "Rachael"
      ],
      "it": [
        "Anna",
        "Rut",
        "Rachele"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Samuel 1:20"
  },
  {
    "id": 84,
    "category": "characters",
    "question": {
      "fr": "Quel disciple était collecteur d’impôts ?",
      "en": "Which disciple was a tax collector?",
      "it": "Quale discepolo era pubblicano?"
    },
    "options": {
      "fr": [
        "Matthieu",
        "Pierre",
        "Jacques"
      ],
      "en": [
        "Matthew",
        "Peter",
        "James"
      ],
      "it": [
        "Matteo",
        "Pietro",
        "Giacomo"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 9:9"
  },
  {
    "id": 85,
    "category": "characters",
    "question": {
      "fr": "Qui a écrit la plupart des Psaumes ?",
      "en": "Who wrote most of the Psalms?",
      "it": "Chi ha scritto la maggior parte dei Salmi?"
    },
    "options": {
      "fr": [
        "David",
        "Salomon",
        "Moïse"
      ],
      "en": [
        "David",
        "Solomon",
        "Moses"
      ],
      "it": [
        "Davide",
        "Salomone",
        "Mosé"
      ]
    },
    "answerIndex": 0,
    "reference": "Psaumes"
  },
  {
    "id": 86,
    "category": "characters",
    "question": {
      "fr": "Quel prophète a défié les prophètes de Baal sur le mont Carmel ?",
      "en": "Which prophet challenged the prophets of Baal on Mount Carmel?",
      "it": "Quale profeta sfidò i profeti di Baal sul Monte Carmelo?"
    },
    "options": {
      "fr": [
        "Élie",
        "Élisée",
        "Ésaïe"
      ],
      "en": [
        "Elijah",
        "Elisha",
        "Isaiah"
      ],
      "it": [
        "Elia",
        "Eliseo",
        "Isaia"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Rois 18"
  },
  {
    "id": 87,
    "category": "characters",
    "question": {
      "fr": "Quelle juge était aussi prophétesse ?",
      "en": "Which judge was also a prophetess?",
      "it": "Quale giudice era anche una profetessa?"
    },
    "options": {
      "fr": [
        "Débora",
        "Esther",
        "Myriam"
      ],
      "en": [
        "Deborah",
        "Esther",
        "Myriam"
      ],
      "it": [
        "Debora",
        "Ester",
        "Myriam"
      ]
    },
    "answerIndex": 0,
    "reference": "Juges 4:4"
  },
  {
    "id": 88,
    "category": "characters",
    "question": {
      "fr": "Qui a succédé à Élie ?",
      "en": "Who succeeded Elijah?",
      "it": "Chi è succeduto a Elia?"
    },
    "options": {
      "fr": [
        "Élisée",
        "Ézéchiel",
        "Amos"
      ],
      "en": [
        "Elisha",
        "Ezekiel",
        "Amos"
      ],
      "it": [
        "Eliseo",
        "Ezechiele",
        "Amos"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Rois 2:9-15"
  },
  {
    "id": 89,
    "category": "characters",
    "question": {
      "fr": "Qui a trahi Jésus avec un baiser ?",
      "en": "Who betrayed Jesus with a kiss?",
      "it": "Chi ha tradito Gesù con un bacio?"
    },
    "options": {
      "fr": [
        "Judas",
        "Pierre",
        "Thomas"
      ],
      "en": [
        "Judas",
        "Peter",
        "Thomas"
      ],
      "it": [
        "Giuda",
        "Pietro",
        "Tommaso"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 26:48-49"
  },
  {
    "id": 90,
    "category": "characters",
    "question": {
      "fr": "Quel apôtre était médecin ?",
      "en": "Which apostle was a doctor?",
      "it": "Quale apostolo era medico?"
    },
    "options": {
      "fr": [
        "Luc",
        "Marc",
        "Jean"
      ],
      "en": [
        "Luke",
        "Mark",
        "John"
      ],
      "it": [
        "Luca",
        "Marco",
        "Giovanni"
      ]
    },
    "answerIndex": 0,
    "reference": "Colossiens 4:14"
  },
  {
    "id": 91,
    "category": "characters",
    "question": {
      "fr": "Qui a renié Jésus trois fois ?",
      "en": "Who denied Jesus three times?",
      "it": "Chi ha rinnegato Gesù tre volte?"
    },
    "options": {
      "fr": [
        "Pierre",
        "Jean",
        "Jacques"
      ],
      "en": [
        "Peter",
        "John",
        "James"
      ],
      "it": [
        "Pietro",
        "Giovanni",
        "Giacomo"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 22:61"
  },
  {
    "id": 92,
    "category": "characters",
    "question": {
      "fr": "Qui est considéré comme le premier martyr chrétien ?",
      "en": "Who is considered the first Christian martyr?",
      "it": "Chi è considerato il primo martire cristiano?"
    },
    "options": {
      "fr": [
        "Étienne",
        "Jacques",
        "Philippe"
      ],
      "en": [
        "Stephen",
        "James",
        "Philip"
      ],
      "it": [
        "Stefano",
        "Giacomo",
        "Filippo"
      ]
    },
    "answerIndex": 0,
    "reference": "Actes 7"
  },
  {
    "id": 93,
    "category": "characters",
    "question": {
      "fr": "Qui est l’auteur de l’épître de Jacques ?",
      "en": "Who is the author of the epistle of James?",
      "it": "Chi è l'autore dell'epistola di Giacomo?"
    },
    "options": {
      "fr": [
        "Jacques",
        "Paul",
        "Pierre"
      ],
      "en": [
        "James",
        "Paul",
        "Peter"
      ],
      "it": [
        "Giacomo",
        "Paolo",
        "Pietro"
      ]
    },
    "answerIndex": 0,
    "reference": "Jacques 1:1"
  },
  {
    "id": 94,
    "category": "characters",
    "question": {
      "fr": "Quel prophète était berger de Tekoa ?",
      "en": "Which prophet was shepherd of Tekoa?",
      "it": "Quale profeta era pastore di Tekoa?"
    },
    "options": {
      "fr": [
        "Amos",
        "Osée",
        "Habacuc"
      ],
      "en": [
        "Amos",
        "Hosea",
        "Habakkuk"
      ],
      "it": [
        "Amos",
        "Osea",
        "Abacuc"
      ]
    },
    "answerIndex": 0,
    "reference": "Amos 1:1"
  },
  {
    "id": 95,
    "category": "characters",
    "question": {
      "fr": "Qui a caché les espions à Jéricho ?",
      "en": "Who hid the spies in Jericho?",
      "it": "Chi ha nascosto le spie a Gerico?"
    },
    "options": {
      "fr": [
        "Rahab",
        "Ruth",
        "Abigaïl"
      ],
      "en": [
        "Rahab",
        "Ruth",
        "Abigail"
      ],
      "it": [
        "Rahab",
        "Rut",
        "Abigail"
      ]
    },
    "answerIndex": 0,
    "reference": "Josué 2:4"
  },
  {
    "id": 96,
    "category": "characters",
    "question": {
      "fr": "Quel roi a été humilié et a vécu comme un animal ?",
      "en": "Which king was humiliated and lived like an animal?",
      "it": "Quale re fu umiliato e visse come un animale?"
    },
    "options": {
      "fr": [
        "Nebucadnetsar",
        "Darius",
        "Cyrus"
      ],
      "en": [
        "Nebuchadnezzar",
        "Darius",
        "Cyrus"
      ],
      "it": [
        "Nabucodonosor",
        "Dario",
        "Ciro"
      ]
    },
    "answerIndex": 0,
    "reference": "Daniel 4:33"
  },
  {
    "id": 97,
    "category": "characters",
    "question": {
      "fr": "Qui a reçu les Dix Commandements ?",
      "en": "Who received the Ten Commandments?",
      "it": "Chi ha ricevuto i Dieci Comandamenti?"
    },
    "options": {
      "fr": [
        "Moïse",
        "Aaron",
        "Josué"
      ],
      "en": [
        "Moses",
        "Aaron",
        "Joshua"
      ],
      "it": [
        "Mosé",
        "Aronne",
        "Giosuè"
      ]
    },
    "answerIndex": 0,
    "reference": "Exode 20"
  },
  {
    "id": 98,
    "category": "characters",
    "question": {
      "fr": "Quel apôtre était le frère de Jean ?",
      "en": "Which apostle was John's brother?",
      "it": "Quale apostolo era il fratello di Giovanni?"
    },
    "options": {
      "fr": [
        "Jacques",
        "Pierre",
        "André"
      ],
      "en": [
        "James",
        "Peter",
        "Andrew"
      ],
      "it": [
        "Giacomo",
        "Pietro",
        "Andrea"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 4:21"
  },
  {
    "id": 99,
    "category": "characters",
    "question": {
      "fr": "Qui est traditionnellement associé aux Proverbes ?",
      "en": "Who is traditionally associated with Proverbs?",
      "it": "Chi è tradizionalmente associato ai Proverbi?"
    },
    "options": {
      "fr": [
        "Salomon",
        "David",
        "Ésaïe"
      ],
      "en": [
        "Solomon",
        "David",
        "Isaiah"
      ],
      "it": [
        "Salomone",
        "Davide",
        "Isaia"
      ]
    },
    "answerIndex": 0,
    "reference": "Proverbes 1:1"
  },
  {
    "id": 100,
    "category": "characters",
    "question": {
      "fr": "Qui a reconstruit les murailles de Jérusalem ?",
      "en": "Who rebuilt the walls of Jerusalem?",
      "it": "Chi ricostruì le mura di Gerusalemme?"
    },
    "options": {
      "fr": [
        "Néhémie",
        "Esdras",
        "Zorobabel"
      ],
      "en": [
        "Nehemiah",
        "Ezra",
        "Zerubbabel"
      ],
      "it": [
        "Neemia",
        "Esdra",
        "Zorobabele"
      ]
    },
    "answerIndex": 0,
    "reference": "Néhémie 2"
  },
  {
    "id": 101,
    "category": "gospels",
    "question": {
      "fr": "Où Jésus est-il né ?",
      "en": "Where was Jesus born?",
      "it": "Dove è nato Gesù?"
    },
    "options": {
      "fr": [
        "Bethléhem",
        "Nazareth",
        "Jérusalem"
      ],
      "en": [
        "Bethlehem",
        "Nazareth",
        "Jerusalem"
      ],
      "it": [
        "Betlemme",
        "Nazaret",
        "Gerusalemme"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 2:4-7"
  },
  {
    "id": 102,
    "category": "gospels",
    "question": {
      "fr": "Qui reconnaît Jésus comme « l’Agneau de Dieu » ?",
      "en": "Who recognizes Jesus as the “Lamb of God”?",
      "it": "Chi riconosce Gesù come “Agnello di Dio”?"
    },
    "options": {
      "fr": [
        "Jean-Baptiste",
        "Pierre",
        "André"
      ],
      "en": [
        "John the Baptist",
        "Peter",
        "Andrew"
      ],
      "it": [
        "Giovanni Battista",
        "Pietro",
        "Andrea"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 1:29"
  },
  {
    "id": 103,
    "category": "gospels",
    "question": {
      "fr": "Dans quel évangile se trouve le sermon sur la montagne ?",
      "en": "In which gospel is the Sermon on the Mount found?",
      "it": "In quale vangelo si trova il Sermone della Montagna?"
    },
    "options": {
      "fr": [
        "Matthieu",
        "Marc",
        "Jean"
      ],
      "en": [
        "Matthew",
        "Mark",
        "John"
      ],
      "it": [
        "Matteo",
        "Marco",
        "Giovanni"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 5-7"
  },
  {
    "id": 104,
    "category": "gospels",
    "question": {
      "fr": "Qui aide Jésus à porter la croix ?",
      "en": "Who helps Jesus carry the cross?",
      "it": "Chi aiuta Gesù a portare la croce?"
    },
    "options": {
      "fr": [
        "Simon de Cyrène",
        "Joseph d’Arimathée",
        "Nicodème"
      ],
      "en": [
        "Simon of Cyrene",
        "Joseph of Arimathea",
        "Nicodemus"
      ],
      "it": [
        "Simone di Cirene",
        "Giuseppe d'Arimatea",
        "Nicodemo"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 23:26"
  },
  {
    "id": 105,
    "category": "gospels",
    "question": {
      "fr": "Où Jésus est-il présenté enfant ?",
      "en": "Where is Jesus presented as a child?",
      "it": "Dove viene presentato Gesù bambino?"
    },
    "options": {
      "fr": [
        "Au temple",
        "À la synagogue",
        "Au Jourdain"
      ],
      "en": [
        "At the temple",
        "At the synagogue",
        "At the Jordan"
      ],
      "it": [
        "Al tempio",
        "Alla sinagoga",
        "Al Giordano"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc 2:22"
  },
  {
    "id": 106,
    "category": "gospels",
    "question": {
      "fr": "Qui demande le corps de Jésus pour l’ensevelir ?",
      "en": "Who asks for the body of Jesus to bury?",
      "it": "Chi chiede che il corpo di Gesù venga seppellito?"
    },
    "options": {
      "fr": [
        "Joseph d’Arimathée",
        "Pilate",
        "Hérode"
      ],
      "en": [
        "Joseph of Arimathea",
        "Pilate",
        "Herod"
      ],
      "it": [
        "Giuseppe d'Arimatea",
        "Pilato",
        "Erode"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 27:57-58"
  },
  {
    "id": 107,
    "category": "gospels",
    "question": {
      "fr": "Quel disciple est appelé « le disciple que Jésus aimait » ?",
      "en": "Which disciple is called “the disciple whom Jesus loved”?",
      "it": "Quale discepolo è chiamato “il discepolo che Gesù amava”?"
    },
    "options": {
      "fr": [
        "Jean",
        "Thomas",
        "Philippe"
      ],
      "en": [
        "John",
        "Thomas",
        "Philip"
      ],
      "it": [
        "Giovanni",
        "Tommaso",
        "Filippo"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean 13:23"
  },
  {
    "id": 108,
    "category": "gospels",
    "question": {
      "fr": "Dans quel évangile trouve-t-on la visite des mages ?",
      "en": "In which gospel do we find the visit of the wise men?",
      "it": "In quale vangelo troviamo la visita dei Magi?"
    },
    "options": {
      "fr": [
        "Matthieu",
        "Luc",
        "Marc"
      ],
      "en": [
        "Matthew",
        "Luke",
        "Mark"
      ],
      "it": [
        "Matteo",
        "Luca",
        "Marco"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 2:1-12"
  },
  {
    "id": 109,
    "category": "gospels",
    "question": {
      "fr": "Quel évangile est attribué à un médecin ?",
      "en": "Which gospel is attributed to a doctor?",
      "it": "Quale vangelo è attribuito a un medico?"
    },
    "options": {
      "fr": [
        "Luc",
        "Marc",
        "Matthieu"
      ],
      "en": [
        "Luke",
        "Mark",
        "Matthew"
      ],
      "it": [
        "Luca",
        "Marco",
        "Matteo"
      ]
    },
    "answerIndex": 0,
    "reference": "Colossiens 4:14"
  },
  {
    "id": 110,
    "category": "gospels",
    "question": {
      "fr": "Où Jésus prie-t-il avant son arrestation ?",
      "en": "Where did Jesus pray before his arrest?",
      "it": "Dove pregò Gesù prima del suo arresto?"
    },
    "options": {
      "fr": [
        "Gethsémané",
        "Bethléhem",
        "Cana"
      ],
      "en": [
        "Gethsemane",
        "Bethlehem",
        "Cana"
      ],
      "it": [
        "Getsemani",
        "Betlemme",
        "Cana"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 26:36"
  },
  {
    "id": 111,
    "category": "gospels",
    "question": {
      "fr": "Qui roule la pierre du tombeau ?",
      "en": "Who rolls the stone from the tomb?",
      "it": "Chi rotola la pietra dalla tomba?"
    },
    "options": {
      "fr": [
        "Un ange",
        "Les disciples",
        "Les soldats"
      ],
      "en": [
        "An angel",
        "The disciples",
        "The soldiers"
      ],
      "it": [
        "Un angelo",
        "I discepoli",
        "I soldati"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 28:2"
  },
  {
    "id": 112,
    "category": "gospels",
    "question": {
      "fr": "Quel gouverneur romain juge Jésus ?",
      "en": "Which Roman governor judges Jesus?",
      "it": "Quale governatore romano giudica Gesù?"
    },
    "options": {
      "fr": [
        "Ponce Pilate",
        "Hérode Antipas",
        "Caiaphas"
      ],
      "en": [
        "Pontius Pilate",
        "Herod Antipas",
        "Caiaphas"
      ],
      "it": [
        "Ponce Pilato",
        "Erode Antipa",
        "Caifa"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu 27:2"
  },
  {
    "id": 113,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète annonce une « nouvelle alliance » ?",
      "en": "Which prophet announces a “new covenant”?",
      "it": "Quale profeta annuncia una “nuova alleanza”?"
    },
    "options": {
      "fr": [
        "Jérémie",
        "Ésaïe",
        "Ézéchiel"
      ],
      "en": [
        "Jeremiah",
        "Isaiah",
        "Ezekiel"
      ],
      "it": [
        "Geremia",
        "Isaia",
        "Ezechiele"
      ]
    },
    "answerIndex": 0,
    "reference": "Jérémie 31:31"
  },
  {
    "id": 114,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète voit des séraphins chanter « Saint, saint, saint » ?",
      "en": "Which prophet sees seraphim singing “Holy, holy, holy”?",
      "it": "Quale profeta vede i serafini cantare “Santo, santo, santo”?"
    },
    "options": {
      "fr": [
        "Ésaïe",
        "Daniel",
        "Amos"
      ],
      "en": [
        "Isaiah",
        "Daniel",
        "Amos"
      ],
      "it": [
        "Isaia",
        "Daniele",
        "Amos"
      ]
    },
    "answerIndex": 0,
    "reference": "Ésaïe 6:2-3"
  },
  {
    "id": 115,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète est jeté dans la fosse aux lions ?",
      "en": "Which prophet is thrown into the lions' den?",
      "it": "Quale profeta viene gettato nella fossa dei leoni?"
    },
    "options": {
      "fr": [
        "Daniel",
        "Osée",
        "Joël"
      ],
      "en": [
        "Daniel",
        "Hosea",
        "Joel"
      ],
      "it": [
        "Daniele",
        "Osea",
        "Gioele"
      ]
    },
    "answerIndex": 0,
    "reference": "Daniel 6"
  },
  {
    "id": 116,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète voit une vallée d’ossements desséchés ?",
      "en": "Which prophet sees a valley of dry bones?",
      "it": "Quale profeta vede una valle di ossa secche?"
    },
    "options": {
      "fr": [
        "Ézéchiel",
        "Zacharie",
        "Habacuc"
      ],
      "en": [
        "Ezekiel",
        "Zechariah",
        "Habakkuk"
      ],
      "it": [
        "Ezechiele",
        "Zaccaria",
        "Abacuc"
      ]
    },
    "answerIndex": 0,
    "reference": "Ézéchiel 37"
  },
  {
    "id": 117,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète est envoyé à Ninive ?",
      "en": "Which prophet was sent to Nineveh?",
      "it": "Quale profeta fu inviato a Ninive?"
    },
    "options": {
      "fr": [
        "Jonas",
        "Malachie",
        "Sophonie"
      ],
      "en": [
        "Jonah",
        "Malachi",
        "Zephaniah"
      ],
      "it": [
        "Giona",
        "Malachia",
        "Sofonia"
      ]
    },
    "answerIndex": 0,
    "reference": "Jonas 1:2"
  },
  {
    "id": 118,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète épouse Gomer ?",
      "en": "Which prophet marries Gomer?",
      "it": "Quale profeta sposa Gomer?"
    },
    "options": {
      "fr": [
        "Osée",
        "Amos",
        "Michée"
      ],
      "en": [
        "Hosea",
        "Amos",
        "Micah"
      ],
      "it": [
        "Osea",
        "Amos",
        "Mica"
      ]
    },
    "answerIndex": 0,
    "reference": "Osée 1:3"
  },
  {
    "id": 119,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète voit une roue dans une roue ?",
      "en": "Which prophet sees a wheel within a wheel?",
      "it": "Quale profeta vede una ruota dentro un'altra ruota?"
    },
    "options": {
      "fr": [
        "Ézéchiel",
        "Ésaïe",
        "Jérémie"
      ],
      "en": [
        "Ezekiel",
        "Isaiah",
        "Jeremiah"
      ],
      "it": [
        "Ezechiele",
        "Isaia",
        "Geremia"
      ]
    },
    "answerIndex": 0,
    "reference": "Ézéchiel 1:16"
  },
  {
    "id": 120,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète écrit « le juste vivra par la foi » ?",
      "en": "Which prophet wrote “the righteous shall live by faith”?",
      "it": "Quale profeta scrisse “i giusti vivranno per fede”?"
    },
    "options": {
      "fr": [
        "Habacuc",
        "Aggée",
        "Jonas"
      ],
      "en": [
        "Habakkuk",
        "Haggai",
        "Jonah"
      ],
      "it": [
        "Abacuc",
        "Aggeo",
        "Giona"
      ]
    },
    "answerIndex": 0,
    "reference": "Habacuc 2:4"
  },
  {
    "id": 121,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète est enlevé dans un char de feu ?",
      "en": "Which prophet is caught up in a chariot of fire?",
      "it": "Quale profeta è coinvolto in un carro di fuoco?"
    },
    "options": {
      "fr": [
        "Élie",
        "Élisée",
        "Jérémie"
      ],
      "en": [
        "Elijah",
        "Elisha",
        "Jeremiah"
      ],
      "it": [
        "Elia",
        "Eliseo",
        "Geremia"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Rois 2:11"
  },
  {
    "id": 122,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète oint David comme roi ?",
      "en": "Which prophet anointed David as king?",
      "it": "Quale profeta unse Davide come re?"
    },
    "options": {
      "fr": [
        "Samuel",
        "Nathan",
        "Gad"
      ],
      "en": [
        "Samuel",
        "Nathan",
        "Gad"
      ],
      "it": [
        "Samuele",
        "Nathan",
        "Gad"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Samuel 16:13"
  },
  {
    "id": 123,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète encourage la reconstruction du temple avec Zorobabel ?",
      "en": "Which prophet encourages the rebuilding of the temple with Zerubbabel?",
      "it": "Quale profeta incoraggia la ricostruzione del tempio con Zorobabele?"
    },
    "options": {
      "fr": [
        "Aggée",
        "Joël",
        "Nahum"
      ],
      "en": [
        "Haggai",
        "Joel",
        "Nahum"
      ],
      "it": [
        "Aggeo",
        "Gioele",
        "Nahum"
      ]
    },
    "answerIndex": 0,
    "reference": "Aggée 1:8"
  },
  {
    "id": 124,
    "category": "prophets",
    "question": {
      "fr": "Quel prophète annonce le « serviteur souffrant » ?",
      "en": "Which prophet announces the “suffering servant”?",
      "it": "Quale profeta annuncia il “servo sofferente”?"
    },
    "options": {
      "fr": [
        "Ésaïe",
        "Malachie",
        "Jonas"
      ],
      "en": [
        "Isaiah",
        "Malachi",
        "Jonah"
      ],
      "it": [
        "Isaia",
        "Malachia",
        "Giona"
      ]
    },
    "answerIndex": 0,
    "reference": "Ésaïe 53"
  },
  {
    "id": 125,
    "category": "kings",
    "question": {
      "fr": "Quel est le premier roi d’Israël ?",
      "en": "Who was the first king of Israel?",
      "it": "Chi fu il primo re d'Israele?"
    },
    "options": {
      "fr": [
        "Saül",
        "David",
        "Salomon"
      ],
      "en": [
        "Saul",
        "David",
        "Solomon"
      ],
      "it": [
        "Saulo",
        "Davide",
        "Salomone"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Samuel 10:1"
  },
  {
    "id": 126,
    "category": "kings",
    "question": {
      "fr": "Quel roi succède à David ?",
      "en": "Which king succeeds David?",
      "it": "Quale re succede a Davide?"
    },
    "options": {
      "fr": [
        "Salomon",
        "Saül",
        "Roboam"
      ],
      "en": [
        "Solomon",
        "Saul",
        "Rehoboam"
      ],
      "it": [
        "Salomone",
        "Saulo",
        "Roboamo"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Rois 2:12"
  },
  {
    "id": 127,
    "category": "kings",
    "question": {
      "fr": "Quel roi unifie le royaume après Saül ?",
      "en": "Which king unifies the kingdom after Saul?",
      "it": "Quale re unifica il regno dopo Saul?"
    },
    "options": {
      "fr": [
        "David",
        "Salomon",
        "Josaphat"
      ],
      "en": [
        "David",
        "Solomon",
        "Jehoshaphat"
      ],
      "it": [
        "Davide",
        "Salomone",
        "Giosafat"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Samuel 5:3"
  },
  {
    "id": 128,
    "category": "kings",
    "question": {
      "fr": "Quel roi trouve le livre de la loi lors d’une réforme ?",
      "en": "Which king finds the book of the law during a reform?",
      "it": "Quale re ritrova il libro della legge durante una riforma?"
    },
    "options": {
      "fr": [
        "Josias",
        "Achab",
        "Ozias"
      ],
      "en": [
        "Josiah",
        "Ahab",
        "Uzziah"
      ],
      "it": [
        "Giosia",
        "Achab",
        "Oziah"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Rois 22:8"
  },
  {
    "id": 129,
    "category": "kings",
    "question": {
      "fr": "Quel roi voit l’écriture sur la muraille ?",
      "en": "Which king sees the writing on the wall?",
      "it": "Quale re vede la scritta sul muro?"
    },
    "options": {
      "fr": [
        "Belschatsar",
        "Darius",
        "Cyrus"
      ],
      "en": [
        "Belshazzar",
        "Darius",
        "Cyrus"
      ],
      "it": [
        "Belchatsar",
        "Dario",
        "Ciro"
      ]
    },
    "answerIndex": 0,
    "reference": "Daniel 5"
  },
  {
    "id": 130,
    "category": "kings",
    "question": {
      "fr": "Quel roi se repent après l’affaire de Naboth ?",
      "en": "Which king repented after the affair of Naboth?",
      "it": "Quale re si pentì dopo la vicenda di Nabot?"
    },
    "options": {
      "fr": [
        "Achab",
        "Jéroboam",
        "Ozias"
      ],
      "en": [
        "Ahab",
        "Jeroboam",
        "Uzziah"
      ],
      "it": [
        "Achab",
        "Geroboamo",
        "Oziah"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Rois 21:27"
  },
  {
    "id": 131,
    "category": "kings",
    "question": {
      "fr": "Quel roi épouse Jézabel ?",
      "en": "Which king marries Jezebel?",
      "it": "Quale re sposa Jezebel?"
    },
    "options": {
      "fr": [
        "Achab",
        "Saül",
        "Ézéchias"
      ],
      "en": [
        "Ahab",
        "Saul",
        "Hezekiah"
      ],
      "it": [
        "Achab",
        "Saulo",
        "Ezechia"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Rois 16:31"
  },
  {
    "id": 132,
    "category": "kings",
    "question": {
      "fr": "Quel roi est frappé de lèpre pour avoir offert de l’encens ?",
      "en": "Which king is stricken with leprosy for offering incense?",
      "it": "Quale re è colpito dalla lebbra per aver offerto incenso?"
    },
    "options": {
      "fr": [
        "Ozias",
        "Joas",
        "Manassé"
      ],
      "en": [
        "Uzziah",
        "Joash",
        "Manasseh"
      ],
      "it": [
        "Oziah",
        "Joas",
        "Manasse"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Chroniques 26:19"
  },
  {
    "id": 133,
    "category": "kings",
    "question": {
      "fr": "Quel roi voit l’armée assyrienne défaite par un ange ?",
      "en": "Which king sees the Assyrian army defeated by an angel?",
      "it": "Quale re vede l'esercito assiro sconfitto da un angelo?"
    },
    "options": {
      "fr": [
        "Ézéchias",
        "Saül",
        "Joachaz"
      ],
      "en": [
        "Hezekiah",
        "Saul",
        "Joachaz"
      ],
      "it": [
        "Ezechia",
        "Saulo",
        "Ioacaz"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Rois 19:35"
  },
  {
    "id": 134,
    "category": "kings",
    "question": {
      "fr": "Quel roi épargne Agag, roi d’Amalek ?",
      "en": "Which king spares Agag, king of Amalek?",
      "it": "Quale re risparmia Agag, re di Amalek?"
    },
    "options": {
      "fr": [
        "Saül",
        "David",
        "Salomon"
      ],
      "en": [
        "Saul",
        "David",
        "Solomon"
      ],
      "it": [
        "Saulo",
        "Davide",
        "Salomone"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Samuel 15:9"
  },
  {
    "id": 135,
    "category": "kings",
    "question": {
      "fr": "Quel roi écrit des proverbes et des chants ?",
      "en": "Which king writes proverbs and songs?",
      "it": "Quale re scrive proverbi e canzoni?"
    },
    "options": {
      "fr": [
        "Salomon",
        "David",
        "Josias"
      ],
      "en": [
        "Solomon",
        "David",
        "Josiah"
      ],
      "it": [
        "Salomone",
        "Davide",
        "Giosia"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Rois 4:32"
  },
  {
    "id": 136,
    "category": "kings",
    "question": {
      "fr": "Quel roi de Babylone détruit Jérusalem ?",
      "en": "Which king of Babylon destroyed Jerusalem?",
      "it": "Quale re di Babilonia distrusse Gerusalemme?"
    },
    "options": {
      "fr": [
        "Nebucadnetsar",
        "Cyrus",
        "Darius"
      ],
      "en": [
        "Nebuchadnezzar",
        "Cyrus",
        "Darius"
      ],
      "it": [
        "Nabucodonosor",
        "Ciro",
        "Dario"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Rois 25:8-9"
  },
  {
    "id": 137,
    "category": "wisdom",
    "question": {
      "fr": "Quel livre commence par « La crainte de l’Éternel est le commencement de la sagesse » ?",
      "en": "What book begins with “The fear of the Lord is the beginning of wisdom”?",
      "it": "Quale libro inizia con “Il timore del Signore è il principio della saggezza”?"
    },
    "options": {
      "fr": [
        "Proverbes",
        "Job",
        "Ecclésiaste"
      ],
      "en": [
        "Proverbs",
        "Job",
        "Ecclesiastes"
      ],
      "it": [
        "Proverbi",
        "Lavoro",
        "Ecclesiaste"
      ]
    },
    "answerIndex": 0,
    "reference": "Proverbes 9:10"
  },
  {
    "id": 138,
    "category": "wisdom",
    "question": {
      "fr": "Quel livre s’ouvre sur « Vanité des vanités » ?",
      "en": "Which book opens with “Vanity of Vanities”?",
      "it": "Quale libro si apre con “Vanity of Vanities”?"
    },
    "options": {
      "fr": [
        "Ecclésiaste",
        "Cantique des cantiques",
        "Psaumes"
      ],
      "en": [
        "Ecclesiastes",
        "Song of Songs",
        "Psalms"
      ],
      "it": [
        "Ecclesiaste",
        "Cantico dei Cantici",
        "Salmi"
      ]
    },
    "answerIndex": 0,
    "reference": "Ecclésiaste 1:2"
  },
  {
    "id": 139,
    "category": "wisdom",
    "question": {
      "fr": "Quel homme juste souffre et est éprouvé dans son livre ?",
      "en": "What righteous man suffers and is tested in his book?",
      "it": "Quale uomo giusto soffre ed è messo alla prova nel suo libro?"
    },
    "options": {
      "fr": [
        "Job",
        "Élie",
        "Josué"
      ],
      "en": [
        "Job",
        "Elijah",
        "Joshua"
      ],
      "it": [
        "Lavoro",
        "Elia",
        "Giosuè"
      ]
    },
    "answerIndex": 0,
    "reference": "Job 1:1"
  },
  {
    "id": 140,
    "category": "wisdom",
    "question": {
      "fr": "Quel psaume déclare « L’Éternel est mon berger » ?",
      "en": "Which psalm states “The LORD is my shepherd”?",
      "it": "Quale salmo afferma “Il Signore è il mio pastore”?"
    },
    "options": {
      "fr": [
        "Psaume 23",
        "Psaume 1",
        "Psaume 119"
      ],
      "en": [
        "Psalm 23",
        "Psalm 1",
        "Psalm 119"
      ],
      "it": [
        "Salmo 23",
        "Salmo 1",
        "Salmo 119"
      ]
    },
    "answerIndex": 0,
    "reference": "Psaume 23:1"
  },
  {
    "id": 141,
    "category": "wisdom",
    "question": {
      "fr": "Quel est le plus long psaume ?",
      "en": "What is the longest psalm?",
      "it": "Qual è il salmo più lungo?"
    },
    "options": {
      "fr": [
        "Psaume 119",
        "Psaume 117",
        "Psaume 150"
      ],
      "en": [
        "Psalm 119",
        "Psalm 117",
        "Psalm 150"
      ],
      "it": [
        "Salmo 119",
        "Salmo 117",
        "Salmo 150"
      ]
    },
    "answerIndex": 0,
    "reference": "Psaume 119"
  },
  {
    "id": 142,
    "category": "wisdom",
    "question": {
      "fr": "Quel est le psaume le plus court ?",
      "en": "What is the shortest psalm?",
      "it": "Qual è il salmo più breve?"
    },
    "options": {
      "fr": [
        "Psaume 117",
        "Psaume 1",
        "Psaume 23"
      ],
      "en": [
        "Psalm 117",
        "Psalm 1",
        "Psalm 23"
      ],
      "it": [
        "Salmo 117",
        "Salmo 1",
        "Salmo 23"
      ]
    },
    "answerIndex": 0,
    "reference": "Psaume 117"
  },
  {
    "id": 143,
    "category": "wisdom",
    "question": {
      "fr": "Quel livre célèbre l’amour entre l’époux et l’épouse ?",
      "en": "Which book celebrates the love between husband and wife?",
      "it": "Quale libro celebra l'amore tra marito e moglie?"
    },
    "options": {
      "fr": [
        "Cantique des cantiques",
        "Job",
        "Proverbes"
      ],
      "en": [
        "Song of Songs",
        "Job",
        "Proverbs"
      ],
      "it": [
        "Cantico dei Cantici",
        "Lavoro",
        "Proverbi"
      ]
    },
    "answerIndex": 0,
    "reference": "Cantique des cantiques 1:2"
  },
  {
    "id": 144,
    "category": "wisdom",
    "question": {
      "fr": "Quel psaume est une prière de repentance de David ?",
      "en": "Which psalm is a prayer of repentance from David?",
      "it": "Quale salmo è una preghiera di pentimento di Davide?"
    },
    "options": {
      "fr": [
        "Psaume 51",
        "Psaume 24",
        "Psaume 8"
      ],
      "en": [
        "Psalm 51",
        "Psalm 24",
        "Psalm 8"
      ],
      "it": [
        "Salmo 51",
        "Salmo 24",
        "Salmo 8"
      ]
    },
    "answerIndex": 0,
    "reference": "Psaume 51"
  },
  {
    "id": 145,
    "category": "wisdom",
    "question": {
      "fr": "Quel chapitre décrit la « femme vertueuse » ?",
      "en": "Which chapter describes the “virtuous woman”?",
      "it": "Quale capitolo descrive la “donna virtuosa”?"
    },
    "options": {
      "fr": [
        "Proverbes 31",
        "Proverbes 3",
        "Psaume 91"
      ],
      "en": [
        "Proverbs 31",
        "Proverbs 3",
        "Psalm 91"
      ],
      "it": [
        "Proverbi 31",
        "Proverbi 3",
        "Salmo 91"
      ]
    },
    "answerIndex": 0,
    "reference": "Proverbes 31:10"
  },
  {
    "id": 146,
    "category": "wisdom",
    "question": {
      "fr": "Quel livre contient « Il y a un temps pour tout » ?",
      "en": "Which book contains “There is a Time for Everything”?",
      "it": "Quale libro contiene “C’è un tempo per ogni cosa”?"
    },
    "options": {
      "fr": [
        "Ecclésiaste",
        "Proverbes",
        "Job"
      ],
      "en": [
        "Ecclesiastes",
        "Proverbs",
        "Job"
      ],
      "it": [
        "Ecclesiaste",
        "Proverbi",
        "Lavoro"
      ]
    },
    "answerIndex": 0,
    "reference": "Ecclésiaste 3:1"
  },
  {
    "id": 147,
    "category": "wisdom",
    "question": {
      "fr": "Quel livre affirme que « l’Éternel donne la sagesse » ?",
      "en": "Which book states that “the Lord gives wisdom”?",
      "it": "Quale libro afferma che “il Signore dà la saggezza”?"
    },
    "options": {
      "fr": [
        "Proverbes",
        "Cantique des cantiques",
        "Job"
      ],
      "en": [
        "Proverbs",
        "Song of Songs",
        "Job"
      ],
      "it": [
        "Proverbi",
        "Cantico dei Cantici",
        "Lavoro"
      ]
    },
    "answerIndex": 0,
    "reference": "Proverbes 2:6"
  },
  {
    "id": 148,
    "category": "wisdom",
    "question": {
      "fr": "Quel psaume invite à bénir l’Éternel pour ses bienfaits ?",
      "en": "Which psalm invites us to bless the Lord for his benefits?",
      "it": "Quale salmo ci invita a benedire il Signore per i suoi benefici?"
    },
    "options": {
      "fr": [
        "Psaume 103",
        "Psaume 42",
        "Psaume 19"
      ],
      "en": [
        "Psalm 103",
        "Psalm 42",
        "Psalm 19"
      ],
      "it": [
        "Salmo 103",
        "Salmo 42",
        "Salmo 19"
      ]
    },
    "answerIndex": 0,
    "reference": "Psaume 103:2"
  },
  {
    "id": 149,
    "category": "epistles",
    "question": {
      "fr": "Quelle épître contient l’hymne à l’amour ?",
      "en": "Which epistle contains the hymn to love?",
      "it": "Quale epistola contiene l'inno all'amore?"
    },
    "options": {
      "fr": [
        "1 Corinthiens",
        "2 Corinthiens",
        "Galates"
      ],
      "en": [
        "1 Corinthians",
        "2 Corinthians",
        "Galatians"
      ],
      "it": [
        "1 Corinzi",
        "2 Corinzi",
        "Galati"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Corinthiens 13"
  },
  {
    "id": 150,
    "category": "epistles",
    "question": {
      "fr": "Dans quelle épître trouve-t-on l’armure de Dieu ?",
      "en": "In which epistle is the armor of God found?",
      "it": "In quale epistola si trova l'armatura di Dio?"
    },
    "options": {
      "fr": [
        "Éphésiens",
        "Philippiens",
        "Colossiens"
      ],
      "en": [
        "Ephesians",
        "Philippians",
        "Colossians"
      ],
      "it": [
        "Efesini",
        "Filippesi",
        "Colossesi"
      ]
    },
    "answerIndex": 0,
    "reference": "Éphésiens 6:11"
  },
  {
    "id": 151,
    "category": "epistles",
    "question": {
      "fr": "Quelle épître dit : « La foi sans les œuvres est morte » ?",
      "en": "Which epistle says, “Faith without works is dead”?",
      "it": "Quale epistola dice: “La fede senza le opere è morta”?"
    },
    "options": {
      "fr": [
        "Jacques",
        "Tite",
        "Hébreux"
      ],
      "en": [
        "James",
        "Titus",
        "Hebrews"
      ],
      "it": [
        "Giacomo",
        "Tito",
        "Ebrei"
      ]
    },
    "answerIndex": 0,
    "reference": "Jacques 2:17"
  },
  {
    "id": 152,
    "category": "epistles",
    "question": {
      "fr": "Quelle épître est adressée à Philémon au sujet d’Onésime ?",
      "en": "What epistle is addressed to Philemon concerning Onesimus?",
      "it": "Quale epistola è indirizzata a Filemone riguardo a Onesimo?"
    },
    "options": {
      "fr": [
        "Philémon",
        "Colossiens",
        "1 Timothée"
      ],
      "en": [
        "Philemon",
        "Colossians",
        "1 Timothy"
      ],
      "it": [
        "Filemone",
        "Colossesi",
        "1 Timoteo"
      ]
    },
    "answerIndex": 0,
    "reference": "Philémon 1:10"
  },
  {
    "id": 153,
    "category": "epistles",
    "question": {
      "fr": "Quelle épître encourage à courir avec persévérance ?",
      "en": "Which epistle encourages running with perseverance?",
      "it": "Quale epistola incoraggia a correre con perseveranza?"
    },
    "options": {
      "fr": [
        "Hébreux",
        "Romains",
        "1 Pierre"
      ],
      "en": [
        "Hebrews",
        "Romans",
        "1 Peter"
      ],
      "it": [
        "Ebrei",
        "Romani",
        "1Pierre"
      ]
    },
    "answerIndex": 0,
    "reference": "Hébreux 12:1"
  },
  {
    "id": 154,
    "category": "epistles",
    "question": {
      "fr": "Dans quelle épître lit-on « tout concourt au bien » ?",
      "en": "In which epistle do we read “all things work together for good”?",
      "it": "In quale epistola leggiamo “tutte le cose cooperano al bene”?"
    },
    "options": {
      "fr": [
        "Romains",
        "Galates",
        "Éphésiens"
      ],
      "en": [
        "Romans",
        "Galatians",
        "Ephesians"
      ],
      "it": [
        "Romani",
        "Galati",
        "Efesini"
      ]
    },
    "answerIndex": 0,
    "reference": "Romains 8:28"
  },
  {
    "id": 155,
    "category": "epistles",
    "question": {
      "fr": "Quelle épître présente Christ comme la tête de l’Église ?",
      "en": "Which epistle presents Christ as the head of the Church?",
      "it": "Quale epistola presenta Cristo come capo della Chiesa?"
    },
    "options": {
      "fr": [
        "Colossiens",
        "Philippiens",
        "Tite"
      ],
      "en": [
        "Colossians",
        "Philippians",
        "Titus"
      ],
      "it": [
        "Colossesi",
        "Filippesi",
        "Tito"
      ]
    },
    "answerIndex": 0,
    "reference": "Colossiens 1:18"
  },
  {
    "id": 156,
    "category": "epistles",
    "question": {
      "fr": "Dans quelle épître trouve-t-on « Réjouissez-vous toujours » ?",
      "en": "In which epistle do we find “Rejoice always”?",
      "it": "In quale epistola troviamo “Rallegratevi sempre”?"
    },
    "options": {
      "fr": [
        "1 Thessaloniciens",
        "2 Thessaloniciens",
        "Romains"
      ],
      "en": [
        "1 Thessalonians",
        "2 Thessalonians",
        "Romans"
      ],
      "it": [
        "1 Tessalonicesi",
        "2 Tessalonicesi",
        "Romani"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Thessaloniciens 5:16"
  },
  {
    "id": 157,
    "category": "epistles",
    "question": {
      "fr": "Quelle épître déclare « Dieu est amour » ?",
      "en": "Which epistle states “God is love”?",
      "it": "Quale epistola afferma “Dio è amore”?"
    },
    "options": {
      "fr": [
        "1 Jean",
        "2 Pierre",
        "Jude"
      ],
      "en": [
        "1 John",
        "2 Peter",
        "Jude"
      ],
      "it": [
        "1 Giovanni",
        "2Pierre",
        "Giuda"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Jean 4:8"
  },
  {
    "id": 158,
    "category": "epistles",
    "question": {
      "fr": "Quelle épître mentionne « le bon combat » de la foi ?",
      "en": "Which epistle mentions “the good fight” of faith?",
      "it": "Quale epistola menziona “il buon combattimento” della fede?"
    },
    "options": {
      "fr": [
        "1 Timothée",
        "2 Timothée",
        "Tite"
      ],
      "en": [
        "1 Timothy",
        "2 Timothy",
        "Titus"
      ],
      "it": [
        "1 Timoteo",
        "2 Timoteo",
        "Tito"
      ]
    },
    "answerIndex": 0,
    "reference": "1 Timothée 6:12"
  },
  {
    "id": 159,
    "category": "epistles",
    "question": {
      "fr": "Dans quelle épître Paul parle de la « couronne de justice » ?",
      "en": "In which epistle does Paul speak of the “crown of righteousness”?",
      "it": "In quale epistola Paolo parla della “corona della giustizia”?"
    },
    "options": {
      "fr": [
        "2 Timothée",
        "Philippiens",
        "Hébreux"
      ],
      "en": [
        "2 Timothy",
        "Philippians",
        "Hebrews"
      ],
      "it": [
        "2 Timoteo",
        "Filippesi",
        "Ebrei"
      ]
    },
    "answerIndex": 0,
    "reference": "2 Timothée 4:8"
  },
  {
    "id": 160,
    "category": "epistles",
    "question": {
      "fr": "Quelle épître parle de la joie dans l’adversité ?",
      "en": "Which epistle speaks of joy in adversity?",
      "it": "Quale epistola parla di gioia nelle avversità?"
    },
    "options": {
      "fr": [
        "Philippiens",
        "Tite",
        "Jude"
      ],
      "en": [
        "Philippians",
        "Titus",
        "Jude"
      ],
      "it": [
        "Filippesi",
        "Tito",
        "Giuda"
      ]
    },
    "answerIndex": 0,
    "reference": "Philippiens 1:4"
  },
  {
    "id": 357,
    "category": "gospels",
    "question": {
      "fr": "Quel évangile fait partie des quatre évangiles canoniques ?",
      "en": "Which gospel is one of the four canonical gospels?",
      "it": "Quale vangelo è uno dei quattro vangeli canonici?"
    },
    "options": {
      "fr": [
        "Matthieu",
        "Genèse",
        "Exode"
      ],
      "en": [
        "Matthew",
        "Genesis",
        "Exodus"
      ],
      "it": [
        "Matteo",
        "Genesi",
        "Esodo"
      ]
    },
    "answerIndex": 0,
    "reference": "Matthieu"
  },
  {
    "id": 358,
    "category": "gospels",
    "question": {
      "fr": "Quel évangile fait partie des quatre évangiles canoniques ?",
      "en": "Which gospel is one of the four canonical gospels?",
      "it": "Quale vangelo è uno dei quattro vangeli canonici?"
    },
    "options": {
      "fr": [
        "Marc",
        "Genèse",
        "Exode"
      ],
      "en": [
        "Mark",
        "Genesis",
        "Exodus"
      ],
      "it": [
        "Marco",
        "Genesi",
        "Esodo"
      ]
    },
    "answerIndex": 0,
    "reference": "Marc"
  },
  {
    "id": 359,
    "category": "gospels",
    "question": {
      "fr": "Quel évangile fait partie des quatre évangiles canoniques ?",
      "en": "Which gospel is one of the four canonical gospels?",
      "it": "Quale vangelo è uno dei quattro vangeli canonici?"
    },
    "options": {
      "fr": [
        "Luc",
        "Genèse",
        "Exode"
      ],
      "en": [
        "Luke",
        "Genesis",
        "Exodus"
      ],
      "it": [
        "Luca",
        "Genesi",
        "Esodo"
      ]
    },
    "answerIndex": 0,
    "reference": "Luc"
  },
  {
    "id": 360,
    "category": "gospels",
    "question": {
      "fr": "Quel évangile fait partie des quatre évangiles canoniques ?",
      "en": "Which gospel is one of the four canonical gospels?",
      "it": "Quale vangelo è uno dei quattro vangeli canonici?"
    },
    "options": {
      "fr": [
        "Jean",
        "Genèse",
        "Exode"
      ],
      "en": [
        "John",
        "Genesis",
        "Exodus"
      ],
      "it": [
        "Giovanni",
        "Genesi",
        "Esodo"
      ]
    },
    "answerIndex": 0,
    "reference": "Jean"
  }
];

const getBaseQuestionText = (question: QuizQuestion): string => {
  if (typeof question.question === 'string') {
    return question.question;
  }

  return question.question.en ?? question.question.fr ?? '';
};

const getBaseOptions = (question: QuizQuestion): [string, string, string] => {
  if (Array.isArray(question.options)) {
    return question.options;
  }

  if (Array.isArray(question.options.en)) {
    return question.options.en;
  }

  if (Array.isArray(question.options.fr)) {
    return question.options.fr;
  }

  return ['', '', ''];
};

const localizeQuizQuestion = (question: QuizQuestion): QuizQuestion => {
  const baseQuestionText = getBaseQuestionText(question);
  const baseOptions = getBaseOptions(question);

  const questionValue = isLocalizedValue(question.question) ? question.question : {};
  const optionsValue = isLocalizedValue(question.options) ? question.options : {};

  return {
    ...question,
    question: {
      fr: questionValue.fr ?? baseQuestionText,
      en: questionValue.en ?? baseQuestionText,
      it: questionValue.it ?? toItalian(baseQuestionText),
      es: questionValue.es ?? toSpanish(baseQuestionText),
      pt: questionValue.pt ?? toPortuguese(baseQuestionText),
      de: questionValue.de ?? toGerman(baseQuestionText),
    },
    options: {
      fr: optionsValue.fr ?? baseOptions,
      en: optionsValue.en ?? baseOptions,
      it: optionsValue.it ?? (optionsValue.en ?? baseOptions).map((option) => toItalian(option)) as [string, string, string],
      es: optionsValue.es ?? (optionsValue.en ?? baseOptions).map((option) => toSpanish(option)) as [string, string, string],
      pt: optionsValue.pt ?? (optionsValue.en ?? baseOptions).map((option) => toPortuguese(option)) as [string, string, string],
      de: optionsValue.de ?? (optionsValue.en ?? baseOptions).map((option) => toGerman(option)) as [string, string, string],
    },
  };
};

export const quizQuestions: QuizQuestion[] = quizQuestionsRaw.map(localizeQuizQuestion);
