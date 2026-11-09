import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  Sparkles, 
  Plus, 
  BookMarked
} from 'lucide-react';
import { BibleVerse } from '../types';
import { COMMON_BIBLE_VERSES } from '../data/initialData';
import { 
  BIBLE_BOOKS, 
  BibleBookInfo, 
  getVerseText, 
  getChapterVerses, 
  searchBible,
  RVR1960VerseResult 
} from '../services/bibleService';

interface VerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVerse: (verse: BibleVerse) => void;
  isMainVerse?: boolean;
}

export const VerseModal: React.FC<VerseModalProps> = ({
  isOpen,
  onClose,
  onAddVerse,
  isMainVerse = false,
}) => {
  const [activeTab, setActiveTab] = useState<'rvr1960' | 'catalog' | 'custom'>('rvr1960');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RVR1960VerseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'AT' | 'NT'>('NT');
  const [selectedBook, setSelectedBook] = useState<BibleBookInfo>(() => {
    return BIBLE_BOOKS.find(b => b.name === 'Efesios') || BIBLE_BOOKS[0];
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(2);
  const [chapterVerses, setChapterVerses] = useState<{ verse: number; text: string }[]>([]);
  const [selectedStartVerse, setSelectedStartVerse] = useState<number>(8);
  const [selectedEndVerse, setSelectedEndVerse] = useState<number>(9);
  const [previewText, setPreviewText] = useState<string>('');
  const [verseNotes, setVerseNotes] = useState<string>('');
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);

  const [customRef, setCustomRef] = useState('');
  const [customVersion, setCustomVersion] = useState('RVR1960');
  const [customText, setCustomText] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchVerses() {
      setIsLoadingChapter(true);
      const verses = await getChapterVerses(selectedBook.name, selectedChapter);
      if (isMounted) {
        setChapterVerses(verses);
        setIsLoadingChapter(false);
      }
    }
    if (isOpen && activeTab === 'rvr1960') {
      fetchVerses();
    }
    return () => { isMounted = false; };
  }, [selectedBook, selectedChapter, isOpen, activeTab]);

  useEffect(() => {
    let isMounted = true;
    async function updatePreview() {
      const result = await getVerseText(
        selectedBook.name,
        selectedChapter,
        selectedStartVerse,
        selectedEndVerse
      );
      if (isMounted && result) {
        setPreviewText(result.text);
      }
    }
    if (isOpen && activeTab === 'rvr1960' && chapterVerses.length > 0) {
      updatePreview();
    }
    return () => { isMounted = false; };
  }, [selectedBook, selectedChapter, selectedStartVerse, selectedEndVerse, chapterVerses, isOpen, activeTab]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchBible(searchQuery.trim(), 20);
      setSearchResults(results);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const filteredBooks = BIBLE_BOOKS.filter(b => {
    if (testamentFilter === 'ALL') return true;
    return b.testament === testamentFilter;
  });

  const filteredCatalog = COMMON_BIBLE_VERSES.filter(
    v => v.reference.toLowerCase().includes(catalogSearch.toLowerCase()) ||
         v.text.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const handleVerseClick = (vNum: number) => {
    if (vNum < selectedStartVerse) {
      setSelectedStartVerse(vNum);
      setSelectedEndVerse(vNum);
    } else if (vNum === selectedStartVerse && selectedEndVerse > selectedStartVerse) {
      setSelectedEndVerse(vNum);
    } else {
      setSelectedEndVerse(vNum);
    }
  };

  const handleApplyRVR1960 = () => {
    if (!previewText) return;
    const refString = selectedEndVerse > selectedStartVerse
      ? `${selectedBook.name} ${selectedChapter}:${selectedStartVerse}-${selectedEndVerse}`
      : `${selectedBook.name} ${selectedChapter}:${selectedStartVerse}`;

    onAddVerse({
      id: `v-${Date.now()}`,
      reference: refString,
      version: 'RVR1960',
      text: previewText.trim(),
      notes: verseNotes.trim()
    });

    onClose();
  };

  const handleSelectSearchResult = (result: RVR1960VerseResult) => {
    onAddVerse({
      id: `v-${Date.now()}`,
      reference: result.reference,
      version: 'RVR1960',
      text: result.text.trim(),
      notes: ''
    });
    onClose();
  };

  const handleSelectFromCatalog = (verse: BibleVerse) => {
    onAddVerse({
      ...verse,
      id: `v-${Date.now()}`
    });
    onClose();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRef.trim() || !customText.trim()) return;

    onAddVerse({
      id: `v-${Date.now()}`,
      reference: customRef.trim(),
      version: customVersion.trim() || 'RVR1960',
      text: customText.trim(),
      notes: customNotes.trim()
    });

    setCustomRef('');
    setCustomText('');
    setCustomNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-sans select-none">
      <div className="bg-white dark:bg-[#18181C] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
        
        {/* Cabecera del Modal sin trazos */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1C1C1E] dark:text-white text-base leading-tight">
                {isMainVerse ? "Aplicar Pasaje Central" : "Añadir Cita Bíblica"}
              </h3>
              <span className="text-[11px] text-[#7A7A85] font-medium">
                Biblia Reina Valera 1960 • {isMainVerse ? "Pasaje base del sermón" : "Versículo complementario"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Pestañas en cápsula */}
        <div className="px-6 py-2">
          <div className="bg-[#F2F3F6] dark:bg-[#222228] p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('rvr1960')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'rvr1960'
                  ? 'bg-white dark:bg-[#18181C] text-[#1C1C1E] dark:text-white shadow-xs'
                  : 'text-[#6E6E77] dark:text-[#9E9EA8] hover:text-black dark:hover:text-white'
              }`}
            >
              <BookMarked size={13} />
              <span>Biblia RVR 1960</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-[#18181C] text-[#1C1C1E] dark:text-white shadow-xs'
                  : 'text-[#6E6E77] dark:text-[#9E9EA8] hover:text-black dark:hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>Pasajes Sugeridos</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-[#18181C] text-[#1C1C1E] dark:text-white shadow-xs'
                  : 'text-[#6E6E77] dark:text-[#9E9EA8] hover:text-black dark:hover:text-white'
              }`}
            >
              <Plus size={13} />
              <span>Escribir Manual</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'rvr1960' && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-3 text-[#7A7A85]" />
                <input
                  type="text"
                  placeholder="Buscar cita (ej. 'Juan 3:16', 'Romanos 8:28') o palabra clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-medium bg-[#F4F5F7] dark:bg-[#222228] rounded-2xl text-[#1C1C1E] dark:text-white focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-black dark:hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {searchQuery.trim().length >= 2 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#7A7A85] px-1">
                    <span>Resultados en RVR1960 ({searchResults.length})</span>
                    {isSearching && <span>Buscando en los 66 libros...</span>}
                  </div>

                  {searchResults.length === 0 && !isSearching ? (
                    <div className="p-6 text-center text-xs text-[#7A7A85] bg-[#F4F5F7] dark:bg-[#222228] rounded-2xl">
                      No se encontraron versículos para "{searchQuery}".
                    </div>
                  ) : (
                    searchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectSearchResult(res)}
                        className="p-3.5 rounded-2xl bg-[#F4F5F7] dark:bg-[#222228] hover:bg-[#EAECEF] dark:hover:bg-[#2A2A32] cursor-pointer transition-all active:scale-98"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-[#1C1C1E] dark:text-white text-xs">
                            {res.reference}
                          </span>
                          <span className="text-[10px] bg-white dark:bg-[#18181C] px-2 py-0.5 rounded-md text-[#6E6E77] dark:text-[#9E9EA8] font-bold">
                            RVR1960
                          </span>
                        </div>
                        <p className="text-xs text-[#4A4A52] dark:text-[#C8C8D0] line-clamp-2 leading-relaxed">
                          "{res.text}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7A85]">
                      Navegador Bíblico Canónico
                    </span>
                    <div className="flex items-center gap-1 bg-[#F2F3F6] dark:bg-[#222228] p-1 rounded-xl text-[10px] font-bold">
                      {(['ALL', 'AT', 'NT'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTestamentFilter(t)}
                          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                            testamentFilter === t
                              ? 'bg-white dark:bg-[#18181C] text-[#1C1C1E] dark:text-white shadow-xs'
                              : 'text-[#6E6E77] dark:text-[#9E9EA8]'
                          }`}
                        >
                          {t === 'ALL' ? 'Todos (66)' : t === 'AT' ? 'Antiguo (39)' : 'Nuevo (27)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-[#7A7A85] uppercase mb-1">
                        Libro de la Biblia
                      </label>
                      <select
                        value={selectedBook.name}
                        onChange={(e) => {
                          const found = BIBLE_BOOKS.find(b => b.name === e.target.value);
                          if (found) {
                            setSelectedBook(found);
                            setSelectedChapter(1);
                            setSelectedStartVerse(1);
                            setSelectedEndVerse(1);
                          }
                        }}
                        className="w-full text-xs font-bold p-2.5 bg-[#F4F5F7] dark:bg-[#222228] rounded-xl text-[#1C1C1E] dark:text-white focus:outline-none"
                      >
                        {filteredBooks.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name} ({b.chaptersCount} caps.)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A85] uppercase mb-1">
                        Capítulo
                      </label>
                      <select
                        value={selectedChapter}
                        onChange={(e) => {
                          setSelectedChapter(Number(e.target.value));
                          setSelectedStartVerse(1);
                          setSelectedEndVerse(1);
                        }}
                        className="w-full text-xs font-bold p-2.5 bg-[#F4F5F7] dark:bg-[#222228] rounded-xl text-[#1C1C1E] dark:text-white text-center focus:outline-none"
                      >
                        {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((c) => (
                          <option key={c} value={c}>
                            Capítulo {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#7A7A85] uppercase tracking-wider text-[10px]">
                        Seleccionar Versículo o Rango:
                      </span>
                      <span className="font-bold text-[#1C1C1E] dark:text-white text-xs">
                        {selectedBook.name} {selectedChapter}:{selectedStartVerse}
                        {selectedEndVerse > selectedStartVerse ? `-${selectedEndVerse}` : ''}
                      </span>
                    </div>

                    {isLoadingChapter ? (
                      <div className="p-4 text-center text-xs text-[#7A7A85]">Cargando versículos...</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-[#F4F5F7] dark:bg-[#222228] rounded-2xl">
                        {chapterVerses.map(({ verse }) => {
                          const isSelected = verse >= selectedStartVerse && verse <= selectedEndVerse;
                          const isBoundary = verse === selectedStartVerse || verse === selectedEndVerse;
                          return (
                            <button
                              key={verse}
                              type="button"
                              onClick={() => handleVerseClick(verse)}
                              className={`w-7 h-7 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                                isBoundary
                                  ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-xs scale-105'
                                  : isSelected
                                    ? 'bg-black/15 dark:bg-white/20 text-[#1C1C1E] dark:text-white font-extrabold'
                                    : 'bg-white dark:bg-[#18181C] text-[#4A4A52] dark:text-[#C8C8D0] hover:bg-black/10 dark:hover:bg-white/10'
                              }`}
                            >
                              {verse}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-[#F4F5F7] dark:bg-[#222228] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#1C1C1E] dark:text-white uppercase tracking-wider">
                        {selectedBook.name} {selectedChapter}:{selectedStartVerse}
                        {selectedEndVerse > selectedStartVerse ? `-${selectedEndVerse}` : ''}
                      </span>
                      <span className="text-[10px] bg-white dark:bg-[#18181C] px-2.5 py-0.5 rounded-lg font-bold text-[#6E6E77] dark:text-[#9E9EA8]">
                        RVR1960
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-serif italic text-[#2C2C32] dark:text-[#E5E5EA] leading-relaxed max-h-32 overflow-y-auto pr-1">
                      {previewText ? `“${previewText}”` : 'Cargando texto bíblico...'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#7A7A85] uppercase mb-1">
                      Nota o comentario de estudio (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nota teológica para este pasaje..."
                      value={verseNotes}
                      onChange={(e) => setVerseNotes(e.target.value)}
                      className="w-full text-xs p-3 bg-[#F4F5F7] dark:bg-[#222228] rounded-xl text-[#1C1C1E] dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs text-[#6E6E77] dark:text-[#9E9EA8] font-bold hover:text-black dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyRVR1960}
                      disabled={!previewText}
                      className="px-5 py-2.5 text-xs bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] font-bold rounded-xl shadow-xs active:scale-95 transition-all disabled:opacity-40 whitespace-nowrap"
                    >
                      {isMainVerse ? "Aplicar como Pasaje Central" : "Agregar a la Prédica"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-3 text-[#7A7A85]" />
                <input
                  type="text"
                  placeholder="Buscar versículo o palabra clave..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-[#F4F5F7] dark:bg-[#222228] rounded-xl text-[#1C1C1E] dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredCatalog.map((verse) => (
                  <div
                    key={verse.id}
                    onClick={() => handleSelectFromCatalog(verse)}
                    className="p-3.5 rounded-2xl bg-[#F4F5F7] dark:bg-[#222228] hover:bg-[#EAECEF] dark:hover:bg-[#2A2A32] cursor-pointer transition-all active:scale-98"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-[#1C1C1E] dark:text-white text-xs">
                        {verse.reference}
                      </span>
                      <span className="text-[10px] bg-white dark:bg-[#18181C] px-2 py-0.5 rounded-md text-[#6E6E77] dark:text-[#9E9EA8] font-bold">
                        {verse.version}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A4A52] dark:text-[#C8C8D0] line-clamp-2 leading-relaxed">
                      "{verse.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7A85] mb-1">
                    Cita Bíblica (ej. Romanos 8:28) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Libro y versículo..."
                    value={customRef}
                    onChange={(e) => setCustomRef(e.target.value)}
                    className="w-full text-xs font-bold p-3 bg-[#F4F5F7] dark:bg-[#222228] rounded-xl text-[#1C1C1E] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7A85] mb-1">
                    Versión
                  </label>
                  <input
                    type="text"
                    value={customVersion}
                    onChange={(e) => setCustomVersion(e.target.value)}
                    className="w-full text-xs p-3 bg-[#F4F5F7] dark:bg-[#222228] rounded-xl text-[#1C1C1E] dark:text-white text-center font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7A85] mb-1">
                  Texto del Versículo *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Pega aquí el pasaje bíblico..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full text-xs font-medium p-3 bg-[#F4F5F7] dark:bg-[#222228] rounded-xl text-[#1C1C1E] dark:text-white resize-y focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7A85] mb-1">
                  Nota o Comentario (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Comentario exegético breve..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full text-xs p-3 bg-[#F4F5F7] dark:bg-[#222228] rounded-xl text-[#1C1C1E] dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-[#6E6E77] dark:text-[#9E9EA8] font-bold hover:text-black dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] font-bold rounded-xl shadow-xs active:scale-95 transition-all whitespace-nowrap"
                >
                  {isMainVerse ? "Aplicar como Pasaje Central" : "Agregar a la Prédica"}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default VerseModal;
