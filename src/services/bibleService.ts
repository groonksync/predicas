// Servicio de Acceso y Búsqueda para la Biblia Reina Valera 1960 (RVR1960)

export interface BibleBookInfo {
  name: string;        // Nombre estándar amigable (ej. "Juan", "Mateo")
  jsonKey: string;     // Clave exacta en rvr1960.json (ej. "S.Juan", "S. Mateo")
  testament: 'AT' | 'NT';
  category: string;
  chaptersCount: number;
}

export const BIBLE_BOOKS: BibleBookInfo[] = [
  // Antiguo Testamento (39 libros)
  // Pentateuco
  { name: 'Génesis', jsonKey: 'Génesis', testament: 'AT', category: 'Pentateuco', chaptersCount: 50 },
  { name: 'Éxodo', jsonKey: 'Éxodo', testament: 'AT', category: 'Pentateuco', chaptersCount: 40 },
  { name: 'Levítico', jsonKey: 'Levítico', testament: 'AT', category: 'Pentateuco', chaptersCount: 27 },
  { name: 'Números', jsonKey: 'Números', testament: 'AT', category: 'Pentateuco', chaptersCount: 36 },
  { name: 'Deuteronomio', jsonKey: 'Deuteronomio', testament: 'AT', category: 'Pentateuco', chaptersCount: 34 },
  // Históricos
  { name: 'Josué', jsonKey: 'Josué', testament: 'AT', category: 'Históricos', chaptersCount: 24 },
  { name: 'Jueces', jsonKey: 'Jueces', testament: 'AT', category: 'Históricos', chaptersCount: 21 },
  { name: 'Rut', jsonKey: 'Rut', testament: 'AT', category: 'Históricos', chaptersCount: 4 },
  { name: '1 Samuel', jsonKey: '1 Samuel', testament: 'AT', category: 'Históricos', chaptersCount: 31 },
  { name: '2 Samuel', jsonKey: '2 Samuel', testament: 'AT', category: 'Históricos', chaptersCount: 24 },
  { name: '1 Reyes', jsonKey: '1 Reyes', testament: 'AT', category: 'Históricos', chaptersCount: 22 },
  { name: '2 Reyes', jsonKey: '2 Reyes', testament: 'AT', category: 'Históricos', chaptersCount: 25 },
  { name: '1 Crónicas', jsonKey: '1 Crónicas', testament: 'AT', category: 'Históricos', chaptersCount: 29 },
  { name: '2 Crónicas', jsonKey: '2 Crónicas', testament: 'AT', category: 'Históricos', chaptersCount: 36 },
  { name: 'Esdras', jsonKey: 'Esdras', testament: 'AT', category: 'Históricos', chaptersCount: 10 },
  { name: 'Nehemías', jsonKey: 'Nehemías', testament: 'AT', category: 'Históricos', chaptersCount: 13 },
  { name: 'Ester', jsonKey: 'Ester', testament: 'AT', category: 'Históricos', chaptersCount: 10 },
  // Poéticos y Sapienciales
  { name: 'Job', jsonKey: 'Job', testament: 'AT', category: 'Poéticos', chaptersCount: 42 },
  { name: 'Salmos', jsonKey: 'Salmos', testament: 'AT', category: 'Poéticos', chaptersCount: 150 },
  { name: 'Proverbios', jsonKey: 'Proverbios', testament: 'AT', category: 'Poéticos', chaptersCount: 31 },
  { name: 'Eclesiastés', jsonKey: 'Eclesiastés', testament: 'AT', category: 'Poéticos', chaptersCount: 12 },
  { name: 'Cantares', jsonKey: 'Cantares', testament: 'AT', category: 'Poéticos', chaptersCount: 8 },
  // Profetas Mayores
  { name: 'Isaías', jsonKey: 'Isaías', testament: 'AT', category: 'Profetas Mayores', chaptersCount: 66 },
  { name: 'Jeremías', jsonKey: 'Jeremías', testament: 'AT', category: 'Profetas Mayores', chaptersCount: 52 },
  { name: 'Lamentaciones', jsonKey: 'Lamentaciones', testament: 'AT', category: 'Profetas Mayores', chaptersCount: 5 },
  { name: 'Ezequiel', jsonKey: 'Ezequiel', testament: 'AT', category: 'Profetas Mayores', chaptersCount: 48 },
  { name: 'Daniel', jsonKey: 'Daniel', testament: 'AT', category: 'Profetas Mayores', chaptersCount: 12 },
  // Profetas Menores
  { name: 'Oseas', jsonKey: 'Oseas', testament: 'AT', category: 'Profetas Menores', chaptersCount: 14 },
  { name: 'Joel', jsonKey: 'Joel', testament: 'AT', category: 'Profetas Menores', chaptersCount: 3 },
  { name: 'Amós', jsonKey: 'Amós', testament: 'AT', category: 'Profetas Menores', chaptersCount: 9 },
  { name: 'Abdías', jsonKey: 'Abdías', testament: 'AT', category: 'Profetas Menores', chaptersCount: 1 },
  { name: 'Jonás', jsonKey: 'Jonás', testament: 'AT', category: 'Profetas Menores', chaptersCount: 4 },
  { name: 'Miqueas', jsonKey: 'Miqueas', testament: 'AT', category: 'Profetas Menores', chaptersCount: 7 },
  { name: 'Nahúm', jsonKey: 'Nahúm', testament: 'AT', category: 'Profetas Menores', chaptersCount: 3 },
  { name: 'Habacuc', jsonKey: 'Habacuc', testament: 'AT', category: 'Profetas Menores', chaptersCount: 3 },
  { name: 'Sofonías', jsonKey: 'Sofonías', testament: 'AT', category: 'Profetas Menores', chaptersCount: 3 },
  { name: 'Hageo', jsonKey: 'Hageo', testament: 'AT', category: 'Profetas Menores', chaptersCount: 2 },
  { name: 'Zacarías', jsonKey: 'Zacarías', testament: 'AT', category: 'Profetas Menores', chaptersCount: 14 },
  { name: 'Malaquías', jsonKey: 'Malaquías', testament: 'AT', category: 'Profetas Menores', chaptersCount: 4 },

  // Nuevo Testamento (27 libros)
  // Evangelios
  { name: 'Mateo', jsonKey: 'S. Mateo', testament: 'NT', category: 'Evangelios', chaptersCount: 28 },
  { name: 'Marcos', jsonKey: 'S. Marcos', testament: 'NT', category: 'Evangelios', chaptersCount: 16 },
  { name: 'Lucas', jsonKey: 'S. Lucas', testament: 'NT', category: 'Evangelios', chaptersCount: 24 },
  { name: 'Juan', jsonKey: 'S.Juan', testament: 'NT', category: 'Evangelios', chaptersCount: 21 },
  // Histórico
  { name: 'Hechos', jsonKey: 'Hechos', testament: 'NT', category: 'Histórico', chaptersCount: 28 },
  // Epístolas Paulinas
  { name: 'Romanos', jsonKey: 'Romanos', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 16 },
  { name: '1 Corintios', jsonKey: '1 Corintios', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 16 },
  { name: '2 Corintios', jsonKey: '2 Corintios', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 13 },
  { name: 'Gálatas', jsonKey: 'Gálatas', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 6 },
  { name: 'Efesios', jsonKey: 'Efesios', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 6 },
  { name: 'Filipenses', jsonKey: 'Filipenses', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 4 },
  { name: 'Colosenses', jsonKey: 'Colosenses', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 4 },
  { name: '1 Tesalonicenses', jsonKey: '1 Tesalonicenses', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 5 },
  { name: '2 Tesalonicenses', jsonKey: '2 Tesalonicenses', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 3 },
  { name: '1 Timoteo', jsonKey: '1 Timoteo', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 6 },
  { name: '2 Timoteo', jsonKey: '2 Timoteo', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 4 },
  { name: 'Tito', jsonKey: 'Tito', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 3 },
  { name: 'Filemón', jsonKey: 'Filemón', testament: 'NT', category: 'Epístolas Paulinas', chaptersCount: 1 },
  // Epístolas Generales
  { name: 'Hebreos', jsonKey: 'Hebreos', testament: 'NT', category: 'Epístolas Generales', chaptersCount: 13 },
  { name: 'Santiago', jsonKey: 'Santiago', testament: 'NT', category: 'Epístolas Generales', chaptersCount: 5 },
  { name: '1 Pedro', jsonKey: '1 Pedro', testament: 'NT', category: 'Epístolas Generales', chaptersCount: 5 },
  { name: '2 Pedro', jsonKey: '2 Pedro', testament: 'NT', category: 'Epístolas Generales', chaptersCount: 3 },
  { name: '1 Juan', jsonKey: '1 Juan', testament: 'NT', category: 'Epístolas Generales', chaptersCount: 5 },
  { name: '2 Juan', jsonKey: '2 Juan', testament: 'NT', category: 'Epístolas Generales', chaptersCount: 1 },
  { name: '3 Juan', jsonKey: '3 Juan', testament: 'NT', category: 'Epístolas Generales', chaptersCount: 1 },
  { name: 'Judas', jsonKey: 'Judas', testament: 'NT', category: 'Epístolas Generales', chaptersCount: 1 },
  // Profecía
  { name: 'Apocalipsis', jsonKey: 'Apocalipsis', testament: 'NT', category: 'Profecía', chaptersCount: 22 },
];

export interface RVR1960VerseResult {
  reference: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  text: string;
  version: 'RVR1960';
}

// Estructura interna del JSON
type BibleRawData = Record<string, Record<string, Record<string, string>>>;

let cachedBibleData: BibleRawData | null = null;
let loadingPromise: Promise<BibleRawData | null> | null = null;

/**
 * Carga en memoria la Biblia Reina Valera 1960 completa desde el archivo estático local.
 */
export async function getBibleData(): Promise<BibleRawData | null> {
  if (cachedBibleData) return cachedBibleData;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const response = await fetch('/bibles/rvr1960.json');
      if (!response.ok) {
        console.warn('No se pudo cargar /bibles/rvr1960.json:', response.status);
        return null;
      }
      const data: BibleRawData = await response.json();
      cachedBibleData = data;
      return data;
    } catch (err) {
      console.error('Error cargando Biblia RVR1960:', err);
      return null;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Busca un libro por coincidencia flexible (nombre, alias, sin acentos).
 */
export function findBook(input: string): BibleBookInfo | undefined {
  const clean = input.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return BIBLE_BOOKS.find(b => {
    const bookNorm = b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const jsonNorm = b.jsonKey.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Exact match o startsWith
    if (bookNorm === clean || jsonNorm === clean) return true;
    if (clean.length >= 3 && bookNorm.startsWith(clean)) return true;

    // Aliases comunes
    if (clean === 'salmo' && b.name === 'Salmos') return true;
    if (clean === 'san mateo' && b.name === 'Mateo') return true;
    if (clean === 'san marcos' && b.name === 'Marcos') return true;
    if (clean === 'san lucas' && b.name === 'Lucas') return true;
    if (clean === 'san juan' && b.name === 'Juan') return true;
    if (clean === 'apoc' && b.name === 'Apocalipsis') return true;
    if (clean === 'gen' && b.name === 'Génesis') return true;
    if (clean === 'ex' && b.name === 'Éxodo') return true;
    if (clean === 'rom' && b.name === 'Romanos') return true;
    if (clean === 'ef' && b.name === 'Efesios') return true;
    if (clean === 'fil' && b.name === 'Filipenses') return true;
    if (clean === 'col' && b.name === 'Colosenses') return true;
    if (clean === 'heb' && b.name === 'Hebreos') return true;
    if (clean === 'stgo' && b.name === 'Santiago') return true;

    return false;
  });
}

/**
 * Obtiene el texto de un versículo o rango de versículos en RVR1960.
 */
export async function getVerseText(
  bookNameOrKey: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number
): Promise<RVR1960VerseResult | null> {
  const data = await getBibleData();
  if (!data) return null;

  const bookInfo = findBook(bookNameOrKey);
  const jsonKey = bookInfo ? bookInfo.jsonKey : bookNameOrKey;
  const bookDisplayName = bookInfo ? bookInfo.name : bookNameOrKey;

  const chapterObj = data[jsonKey]?.[String(chapter)];
  if (!chapterObj) return null;

  const end = verseEnd && verseEnd >= verseStart ? verseEnd : verseStart;
  const texts: string[] = [];

  for (let v = verseStart; v <= end; v++) {
    const vText = chapterObj[String(v)];
    if (vText) {
      texts.push(vText.trim());
    }
  }

  if (texts.length === 0) return null;

  const refString = end > verseStart
    ? `${bookDisplayName} ${chapter}:${verseStart}-${end}`
    : `${bookDisplayName} ${chapter}:${verseStart}`;

  return {
    reference: refString,
    book: bookDisplayName,
    chapter,
    verseStart,
    verseEnd: end > verseStart ? end : undefined,
    text: texts.join(' '),
    version: 'RVR1960'
  };
}

/**
 * Obtiene todos los versículos de un capítulo específico.
 */
export async function getChapterVerses(
  bookName: string,
  chapter: number
): Promise<{ verse: number; text: string }[]> {
  const data = await getBibleData();
  if (!data) return [];

  const bookInfo = findBook(bookName);
  const jsonKey = bookInfo ? bookInfo.jsonKey : bookName;
  const chapterObj = data[jsonKey]?.[String(chapter)];
  if (!chapterObj) return [];

  const verses: { verse: number; text: string }[] = [];
  const keys = Object.keys(chapterObj).map(Number).sort((a, b) => a - b);

  for (const v of keys) {
    if (chapterObj[String(v)]) {
      verses.push({
        verse: v,
        text: chapterObj[String(v)].trim()
      });
    }
  }

  return verses;
}

/**
 * Analiza una cadena como "Romanos 8:28" o "Salmos 23:1-4" y extrae el pasaje.
 */
export async function parseAndLookupReference(refInput: string): Promise<RVR1960VerseResult | null> {
  const trimmed = refInput.trim();
  // Regex para citas: ej. "1 Corintios 13:4-8", "Juan 3:16", "Salmos 23:1"
  const match = trimmed.match(/^([0-9]?\s*[A-Za-záéíóúÁÉÍÓÚñÑ\.\s]+?)\s*(\d+)[\:\,\.\s]+(\d+)(?:\s*[\-\–]\s*(\d+))?$/);
  
  if (!match) return null;

  const rawBook = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verseStart = parseInt(match[3], 10);
  const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;

  return getVerseText(rawBook, chapter, verseStart, verseEnd);
}

/**
 * Búsqueda textual inteligente en toda la Biblia RVR1960.
 */
export async function searchBible(
  query: string,
  maxResults = 20
): Promise<RVR1960VerseResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  // 1. Intentar resolver como cita exacta primero
  const exactRef = await parseAndLookupReference(trimmed);
  if (exactRef) {
    return [exactRef];
  }

  const data = await getBibleData();
  if (!data) return [];

  const results: RVR1960VerseResult[] = [];
  const queryLower = trimmed.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const book of BIBLE_BOOKS) {
    const chapters = data[book.jsonKey];
    if (!chapters) continue;

    for (const [chapNum, verses] of Object.entries(chapters)) {
      for (const [verseNum, text] of Object.entries(verses)) {
        const textNorm = text.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (textNorm.includes(queryLower)) {
          results.push({
            reference: `${book.name} ${chapNum}:${verseNum}`,
            book: book.name,
            chapter: Number(chapNum),
            verseStart: Number(verseNum),
            text: text.trim(),
            version: 'RVR1960'
          });

          if (results.length >= maxResults) {
            return results;
          }
        }
      }
    }
  }

  return results;
}
