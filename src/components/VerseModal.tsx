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
  // Tabs: 'rvr1960' (Biblia RVR 1960) | 'catalog' (Sugeridos) | 'custom' (Manual)
  const [activeTab, setActiveTab] = useState<'rvr1960' | 'catalog' | 'custom'>('rvr1960');

  // --- Estados para RVR1960 Browser ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RVR1960VerseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Navegador por pasos (Libro -> Capítulo -> Versículos)
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

  // --- Estados para Cita Libre Manual ---
  const [customRef, setCustomRef] = useState('');
  const [customVersion, setCustomVersion] = useState('RVR1960');
  const [customText, setCustomText] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // --- Estados para Pasajes Sugeridos ---
  const [catalogSearch, setCatalogSearch] = useState('');

  // Cargar versículos del capítulo seleccionado al cambiar libro o capítulo
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

  // Actualizar texto de previsualización al cambiar versículo inicio/fin
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

  // Búsqueda en vivo en la RVR1960 con debounce
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

  // Filtrado de libros por testamento
  const filteredBooks = BIBLE_BOOKS.filter(b => {
    if (testamentFilter === 'ALL') return true;
    return b.testament === testamentFilter;
  });

  // Filtrado de pasajes sugeridos
  const filteredCatalog = COMMON_BIBLE_VERSES.filter(
    v => v.reference.toLowerCase().includes(catalogSearch.toLowerCase()) ||
         v.text.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  // Manejar selección de versículo en el navegador
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

  // Confirmar y aplicar versículo desde RVR1960
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

  // Confirmar versículo seleccionado desde los resultados de búsqueda
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

  // Confirmar desde catálogo sugerido
  const handleSelectFromCatalog = (verse: BibleVerse) => {
    onAddVerse({
      ...verse,
      id: `v-${Date.now()}`
    });
    onClose();
  };

  // Confirmar cita manual libre
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
      <div className="bg-white dark:bg-[#1C1C1F] w-full max-w-2xl rounded-3xl shadow-2xl border border-black/[0.08] dark:border-white/[0.1] overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E03126] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                {isMainVerse ? "Aplicar Pasaje Central" : "Añadir Cita Bíblica"}
              </h3>
              <span className="text-[11px] text-[#8E8E93] font-medium">
                Biblia Reina Valera 1960 • {isMainVerse ? "Pasaje base del sermón" : "Versículo complementario"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Toggle - Segmented Apple Capsule */}
        <div className="px-4 sm:px-5 pt-3 pb-1">
          <div className="bg-[#F2F2F7] dark:bg-[#252528] p-1 rounded-2xl flex items-center gap-1 border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setActiveTab('rvr1960')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'rvr1960'
                  ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <BookMarked size={13} className="text-[#E03126]" />
              <span>Biblia RVR 1960</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>Pasajes Sugeridos</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <Plus size={13} />
              <span>Escribir Manual</span>
            </button>
          </div>
        </div>

        {/* Contenido Dinámico según la pestaña activa */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* PESTAÑA 1: EXPLORADOR Y BUSCADOR COMPLETO REINA VALERA 1960 */}
          {activeTab === 'rvr1960' && (
            <div className="space-y-4">
              
              {/* Barra de Búsqueda Rápida en la Biblia RVR1960 */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-3 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Buscar cita (ej. 'Juan 3:16', 'Romanos 8:28') o palabra clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-medium bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white focus:outline-none"
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

              {/* Si hay búsqueda activa, mostrar resultados de la RVR1960 */}
              {searchQuery.trim().length >= 2 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#8E8E93] px-1">
                    <span>Resultados en RVR1960 ({searchResults.length})</span>
                    {isSearching && <span>Buscando en los 66 libros...</span>}
                  </div>

                  {searchResults.length === 0 && !isSearching ? (
                    <div className="p-6 text-center text-xs text-[#8E8E93] bg-[#F8F8FA] dark:bg-[#252528] rounded-2xl">
                      No se encontraron versículos para "{searchQuery}". Intenta con otra palabra o escribe el libro y capítulo.
                    </div>
                  ) : (
                    searchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectSearchResult(res)}
                        className="p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] bg-[#F8F8FA] dark:bg-[#252528] hover:border-[#E03126] cursor-pointer transition-all active:scale-98"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {res.reference}
                          </span>
                          <span className="text-[10px] bg-black/[0.05] dark:bg-white/[0.08] px-2 py-0.5 rounded-md text-slate-700 dark:text-neutral-300 font-bold">
                            RVR1960
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-neutral-200 line-clamp-2 leading-relaxed">
                          "{res.text}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Navegador Interactivo de Libros, Capítulos y Versículos */
                <div className="space-y-3.5">
                  
                  {/* Selector de Testamento */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      Navegador Bíblico Canónico
                    </span>
                    <div className="flex items-center gap-1 bg-[#F2F2F7] dark:bg-[#252528] p-0.5 rounded-xl text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('ALL')}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          testamentFilter === 'ALL'
                            ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        Todos (66)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('AT')}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          testamentFilter === 'AT'
                            ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        Antiguo (39)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('NT')}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          testamentFilter === 'NT'
                            ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        Nuevo (27)
                      </button>
                    </div>
                  </div>

                  {/* Selector Desplegable de Libro y Capítulo */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-[#8E8E93] uppercase mb-1">
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
                        className="w-full text-xs font-bold p-2.5 bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                      >
                        {filteredBooks.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name} ({b.chaptersCount} caps.)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8E8E93] uppercase mb-1">
                        Capítulo
                      </label>
                      <select
                        value={selectedChapter}
                        onChange={(e) => {
                          setSelectedChapter(Number(e.target.value));
                          setSelectedStartVerse(1);
                          setSelectedEndVerse(1);
                        }}
                        className="w-full text-xs font-bold p-2.5 bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-center focus:outline-none"
                      >
                        {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((c) => (
                          <option key={c} value={c}>
                            Capítulo {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Selector Rápido de Versículos */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#8E8E93] uppercase tracking-wider text-[10px]">
                        Seleccionar Versículo o Rango (Toca para marcar):
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {selectedBook.name} {selectedChapter}:{selectedStartVerse}
                        {selectedEndVerse > selectedStartVerse ? `-${selectedEndVerse}` : ''}
                      </span>
                    </div>

                    {isLoadingChapter ? (
                      <div className="p-4 text-center text-xs text-[#8E8E93]">Cargando versículos...</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-[#F8F8FA] dark:bg-[#252528] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
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
                                  ? 'bg-[#E03126] text-white shadow-xs scale-105'
                                  : isSelected
                                    ? 'bg-[#E03126]/20 text-[#E03126] dark:text-white font-extrabold'
                                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.12]'
                              }`}
                            >
                              {verse}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Previsualización del Pasaje Sagrado RVR1960 */}
                  <div className="p-4 bg-[#1C1C1E] dark:bg-[#222225] rounded-2xl border border-white/[0.08] text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#E03126] uppercase tracking-wider">
                        {selectedBook.name} {selectedChapter}:{selectedStartVerse}
                        {selectedEndVerse > selectedStartVerse ? `-${selectedEndVerse}` : ''}
                      </span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">
                        RVR1960
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-medium leading-relaxed max-h-32 overflow-y-auto pr-1">
                      {previewText ? `"${previewText}"` : 'Cargando texto bíblico...'}
                    </p>
                  </div>

                  {/* Comentario exegético opcional */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8E8E93] uppercase mb-1">
                      Nota o comentario de estudio (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nota teológica para este pasaje..."
                      value={verseNotes}
                      onChange={(e) => setVerseNotes(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Botón de Aplicación Directa */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs text-neutral-500 font-semibold hover:text-black dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyRVR1960}
                      disabled={!previewText}
                      className="px-5 py-2.5 text-xs bg-[#E03126] hover:bg-[#C92A20] text-white font-bold rounded-full shadow-sm active:scale-95 transition-all disabled:opacity-40"
                    >
                      {isMainVerse ? "Aplicar como Pasaje Central" : "Agregar a la Prédica"}
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* PESTAÑA 2: CATÁLOGO DE PASAJES SUGERIDOS */}
          {activeTab === 'catalog' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-3 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Buscar versículo o palabra clave..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredCatalog.map((verse) => (
                  <div
                    key={verse.id}
                    onClick={() => handleSelectFromCatalog(verse)}
                    className="p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] hover:border-[#E03126] bg-[#F8F8FA] dark:bg-[#252528] cursor-pointer transition-all active:scale-98"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                        {verse.reference}
                      </span>
                      <span className="text-[10px] bg-black/[0.05] dark:bg-white/[0.08] px-2 py-0.5 rounded-md text-slate-700 dark:text-neutral-300 font-bold">
                        {verse.version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-neutral-200 line-clamp-2 leading-relaxed">
                      "{verse.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: FORMULARIO MANUAL LIBRE */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Cita Bíblica (ej. Romanos 8:28) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Libro y versículo..."
                    value={customRef}
                    onChange={(e) => setCustomRef(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                    Versión
                  </label>
                  <input
                    type="text"
                    value={customVersion}
                    onChange={(e) => setCustomVersion(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-center font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                  Texto del Versículo *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Pega aquí el pasaje bíblico..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full text-xs font-medium p-3 bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white resize-y focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
                  Nota o Comentario (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Comentario exegético breve..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#F8F8FA] dark:bg-[#252528] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-neutral-500 font-semibold hover:text-black dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-bold rounded-full shadow-xs active:scale-95 transition-all"
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