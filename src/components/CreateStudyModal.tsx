import React, { useState, useEffect, useId } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Calendar, 
  Quote, 
  FileText, 
  ListOrdered, 
  FolderOpen, 
  Search, 
  Eye, 
  Plus, 
  Check, 
  Layers, 
  BookmarkCheck,
  Edit3
} from 'lucide-react';
import { Topic, Study, OutlinePoint } from '../types';
import { COMMON_BIBLE_VERSES } from '../data/initialData';
import { 
  BIBLE_BOOKS, 
  BibleBookInfo, 
  getChapterVerses, 
  getVerseText, 
  parseAndLookupReference 
} from '../services/bibleService';

interface CreateStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  activeTopicId: string;
  onCreateStudy: (newStudy: Study, topicId: string) => void;
  onCreateTopicOnly?: (name: string) => string;
}

export const CreateStudyModal: React.FC<CreateStudyModalProps> = ({
  isOpen,
  onClose,
  topics,
  activeTopicId,
  onCreateStudy,
  onCreateTopicOnly,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState(activeTopicId || (topics[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Modo de selección de pasaje bíblico: 'explorer' (Biblia completa interactiva) o 'direct' (Escritura rápida)
  const [passageMode, setPassageMode] = useState<'explorer' | 'direct'>('explorer');

  // Pasaje Bíblico Central (Sincronizado entre ambos modos)
  const [verseRef, setVerseRef] = useState('Efesios 2:8-9');
  const [verseVersion, setVerseVersion] = useState('RVR1960');
  const [verseText, setVerseText] = useState('Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Estados del Explorador de la Biblia Completa
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'AT' | 'NT'>('NT');
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBookInfo>(() => {
    return BIBLE_BOOKS.find(b => b.name === 'Efesios') || BIBLE_BOOKS[0];
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(2);
  const [chapterVerses, setChapterVerses] = useState<{ verse: number; text: string }[]>([]);
  const [selectedVerseStart, setSelectedVerseStart] = useState<number>(8);
  const [selectedVerseEnd, setSelectedVerseEnd] = useState<number>(9);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);

  // Plantilla de Bosquejo
  const [template, setTemplate] = useState<'clasico' | 'tematico' | 'blanco'>('clasico');

  // Selector de sugerencias rápidas en modo directo
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Crear nuevo tema inline
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const inputId = useId();

  // Versiones bíblicas disponibles
  const availableVersions = ['RVR1960', 'NVI', 'NTV', 'LBLA'];

  // Cargar versículos del capítulo seleccionado al cambiar libro o capítulo
  useEffect(() => {
    let isMounted = true;
    async function fetchVerses() {
      setIsLoadingVerses(true);
      try {
        const verses = await getChapterVerses(selectedBook.name, selectedChapter);
        if (isMounted) {
          setChapterVerses(verses);
        }
      } catch (err) {
        console.error('Error al cargar versículos:', err);
      } finally {
        if (isMounted) setIsLoadingVerses(false);
      }
    }

    if (isOpen) {
      fetchVerses();
    }
    return () => { isMounted = false; };
  }, [selectedBook, selectedChapter, isOpen]);

  // Actualizar pasaje central al interactuar en el Explorador
  const handleSelectExplorerVerse = async (vNumber: number) => {
    setSelectedVerseStart(vNumber);
    setSelectedVerseEnd(vNumber);

    try {
      const res = await getVerseText(selectedBook.name, selectedChapter, vNumber, vNumber);
      if (res) {
        setVerseRef(res.reference);
        setVerseText(res.text);
        setVerseVersion('RVR1960');
      } else {
        const refStr = `${selectedBook.name} ${selectedChapter}:${vNumber}`;
        const match = chapterVerses.find(v => v.verse === vNumber);
        setVerseRef(refStr);
        setVerseText(match ? match.text : '');
        setVerseVersion('RVR1960');
      }
    } catch {
      const refStr = `${selectedBook.name} ${selectedChapter}:${vNumber}`;
      setVerseRef(refStr);
    }
  };

  const handleSelectExplorerRange = async (vStart: number, vEnd: number) => {
    const start = Math.min(vStart, vEnd);
    const end = Math.max(vStart, vEnd);
    setSelectedVerseStart(start);
    setSelectedVerseEnd(end);

    try {
      const res = await getVerseText(selectedBook.name, selectedChapter, start, end);
      if (res) {
        setVerseRef(res.reference);
        setVerseText(res.text);
        setVerseVersion('RVR1960');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  // Tema actualmente seleccionado
  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];

  // Libros filtrados por testamento y término de búsqueda
  const filteredBooks = BIBLE_BOOKS.filter(b => {
    const matchesTestament = testamentFilter === 'ALL' || b.testament === testamentFilter;
    const matchesSearch = !bookSearchQuery.trim() || 
      b.name.toLowerCase().includes(bookSearchQuery.trim().toLowerCase());
    return matchesTestament && matchesSearch;
  });

  // Cargar pasaje sugerido en modo directo
  const handleSelectSuggestedVerse = (ref: string, text: string, ver: string) => {
    setVerseRef(ref);
    setVerseText(text);
    setVerseVersion(ver);
    setShowSuggestions(false);
  };

  // Buscar y auto-cargar texto bíblico directamente de la RVR1960
  const handleAutoLookupRVR1960 = async () => {
    if (!verseRef.trim()) return;
    setIsLookingUp(true);
    try {
      const res = await parseAndLookupReference(verseRef.trim());
      if (res) {
        setVerseText(res.text);
        setVerseRef(res.reference);
        setVerseVersion('RVR1960');
      }
    } catch {
      // Ignorar error de búsqueda silenciosamente
    } finally {
      setIsLookingUp(false);
    }
  };

  // Crear nuevo tema inline
  const handleSaveNewTopic = () => {
    if (!newTopicName.trim() || !onCreateTopicOnly) return;
    const newId = onCreateTopicOnly(newTopicName.trim());
    setSelectedTopicId(newId);
    setNewTopicName('');
    setIsCreatingTopic(false);
  };

  // Puntos del bosquejo según la plantilla
  const getOutlinePoints = (): OutlinePoint[] => {
    const hasVerse = verseRef.trim().length > 0;

    if (template === 'clasico') {
      return [
        {
          id: `p-${Date.now()}-1`,
          number: 1,
          title: '1. Introducción y Contexto del Mensaje',
          scriptureRef: hasVerse ? verseRef.trim() : '',
          content: 'Explicación del trasfondo histórico y el propósito central de la enseñanza...'
        },
        {
          id: `p-${Date.now()}-2`,
          number: 2,
          title: '2. Principio Espiritual y Doctrinal',
          scriptureRef: '',
          content: 'Desarrollo de la verdad bíblica fundamental y su significado para el creyente...'
        },
        {
          id: `p-${Date.now()}-3`,
          number: 3,
          title: '3. Aplicación Práctica a la Vida Diaria',
          scriptureRef: '',
          content: 'Cómo poner en práctica este principio en la familia, el trabajo y la fe...'
        },
        {
          id: `p-${Date.now()}-4`,
          number: 4,
          title: '4. Conclusión y Llamado a la Acción',
          scriptureRef: '',
          content: 'Oración final, desafío congregacional y tiempo de respuesta en el altar...'
        }
      ];
    } else if (template === 'tematico') {
      return [
        {
          id: `p-${Date.now()}-1`,
          number: 1,
          title: '1. La Necesidad y Condición Actual',
          scriptureRef: hasVerse ? verseRef.trim() : '',
          content: 'Planteamiento del dilema que enfrenta la persona o la sociedad...'
        },
        {
          id: `p-${Date.now()}-2`,
          number: 2,
          title: '2. La Respuesta Soberana de Dios',
          scriptureRef: '',
          content: 'Lo que Dios dice y promete a través de Su Palabra...'
        },
        {
          id: `p-${Date.now()}-3`,
          number: 3,
          title: '3. Pasos de Fe y Transformación',
          scriptureRef: '',
          content: 'Decisiones concretas para vivir en la victoria de Cristo...'
        }
      ];
    } else {
      return [
        {
          id: `p-${Date.now()}-1`,
          number: 1,
          title: '1. Fundamento del Mensaje',
          scriptureRef: hasVerse ? verseRef.trim() : '',
          content: 'Escribe aquí el primer punto de tu predicación...'
        }
      ];
    }
  };

  const previewPoints = getOutlinePoints();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const initialPoints = getOutlinePoints();

    const newStudy: Study = {
      id: `study-${Date.now()}`,
      topicId: selectedTopicId,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Estudio y bosquejo bíblico para predicación',
      date,
      mainVerse: {
        id: `mv-${Date.now()}`,
        reference: verseRef.trim(),
        version: verseVersion.trim() || 'RVR1960',
        text: verseText.trim()
      },
      relatedVerses: [],
      outlinePoints: initialPoints,
      detailedNotes: '',
      images: [],
      videos: [],
      quickNotes: [
        {
          id: `qn-${Date.now()}-1`,
          text: 'Pausa de silencio antes de comenzar la predicación.',
          tag: 'Pausa',
          createdAt: 'Inicio',
          isArchived: false
        }
      ],
      isArchived: false
    };

    onCreateStudy(newStudy, selectedTopicId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 lg:p-7 font-sans select-none overflow-y-auto animate-fadeIn">
      {/* Contenedor Modal Amplio y Cuadradito (Paleta Minimalista Luz y Gris Oscuro) */}
      <div 
        className="bg-[#18181B] text-[#F5F5F7] w-[96vw] max-w-6xl h-[94vh] max-h-[920px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera Limpia sin Ícono Rojo ni Trazos Ruidosos */}
        <div className="px-6 py-4.5 bg-[#1F1F23] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
              Nueva Prédica o Estudio
            </h2>
            <p className="text-xs text-[#8E8E93] font-normal mt-0.5">
              Organiza el tema, pasajes bíblicos y visualiza la estructura en tiempo real
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#2A2A2E] hover:bg-[#34343A] text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            title="Cerrar modal"
          >
            <X size={17} />
          </button>
        </div>

        {/* Cuerpo Principal Dividido en 2 Columnas Balanceadas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          
          {/* COLUMNA IZQUIERDA: Formulario de Configuración (7 columnas) */}
          <form 
            id={`form-${inputId}`}
            onSubmit={handleSubmit} 
            className="lg:col-span-7 flex flex-col min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
          >
            
            {/* 1. TEMA BÍBLICO AL QUE PERTENECE */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen size={12} className="text-[#8E8E93]" />
                  <span>Tema Bíblico al que pertenece:</span>
                </label>
                {onCreateTopicOnly && !isCreatingTopic && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingTopic(true)}
                    className="text-[11px] font-semibold text-white/80 hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg bg-[#26262B]"
                  >
                    <Plus size={11} />
                    <span>Nuevo Tema</span>
                  </button>
                )}
              </div>

              {/* Input inline para crear nuevo tema */}
              {isCreatingTopic && (
                <div className="flex items-center gap-2 p-2 bg-[#222226] rounded-2xl animate-fadeIn">
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Nombre del nuevo tema bíblico..."
                    className="flex-1 bg-[#18181B] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-white/40"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveNewTopic();
                      } else if (e.key === 'Escape') {
                        setIsCreatingTopic(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewTopic}
                    disabled={!newTopicName.trim()}
                    className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-40"
                  >
                    <Check size={13} />
                    <span>Guardar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTopic(false)}
                    className="p-2 text-neutral-400 hover:text-white rounded-xl"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Chips de temas bíblicos limpios */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {topics.map((t) => {
                  const isSelected = selectedTopicId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTopicId(t.id)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-white text-black shadow-md font-bold scale-[1.02]'
                          : 'bg-[#242428] text-neutral-300 hover:bg-[#2C2C32] hover:text-white'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. TÍTULO DEL MENSAJE */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                  Título del Mensaje *
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">Requerido</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. El Regalo Inmerecido de la Gracia, Poder para Vencer..."
                className="w-full bg-[#202024] focus:bg-[#242429] rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-neutral-500 transition-all outline-none focus:ring-1 focus:ring-white/40"
                required
                autoFocus
              />
            </div>

            {/* 3. SUBTÍTULO O PROPÓSITO + FECHA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                  Subtítulo o Propósito
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej. Bosquejo expositivo para culto dominical..."
                  className="w-full bg-[#202024] focus:bg-[#242429] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} className="text-[#8E8E93]" />
                  <span>Fecha</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#202024] focus:bg-[#242429] rounded-2xl px-3.5 py-2.5 text-xs text-white font-medium transition-all outline-none scheme-dark"
                />
              </div>
            </div>

            {/* 4. PASAJE BÍBLICO CENTRAL: AMBAS OPCIONES (EXPLORADOR COMPLETO O ESCRITURA DIRECTA) */}
            <div className="bg-[#202024] rounded-3xl p-5 space-y-4">
              
              {/* Selector de Modo: Explorador de Biblia Completa vs Entrada Rápida */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Quote size={14} className="text-neutral-400" />
                    <span>Pasaje Bíblico Central</span>
                  </h3>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">
                    Selecciona explorando la Biblia completa o escribe la cita directamente
                  </p>
                </div>

                {/* Tabs de Modo: Luz y Gris */}
                <div className="flex items-center gap-1 p-1 bg-[#141416] rounded-2xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setPassageMode('explorer')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      passageMode === 'explorer'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <BookOpen size={12} className="inline mr-1.5" />
                    <span>Biblia Completa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassageMode('direct')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      passageMode === 'direct'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Edit3 size={12} className="inline mr-1.5" />
                    <span>Cita Directa</span>
                  </button>
                </div>
              </div>

              {/* OPCIÓN 1: EXPLORADOR DE LA BIBLIA COMPLETA */}
              {passageMode === 'explorer' && (
                <div className="space-y-3.5 pt-1 animate-fadeIn">
                  
                  {/* Filtro de Testamento y Búsqueda de Libros */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Filtros de Testamento */}
                    <div className="flex items-center gap-1 bg-[#18181B] p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('ALL')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          testamentFilter === 'ALL'
                            ? 'bg-white text-black font-bold shadow-xs'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Todos (66)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('AT')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          testamentFilter === 'AT'
                            ? 'bg-white text-black font-bold shadow-xs'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Antiguo (39)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('NT')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          testamentFilter === 'NT'
                            ? 'bg-white text-black font-bold shadow-xs'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Nuevo (27)
                      </button>
                    </div>

                    {/* Buscador de Libro */}
                    <div className="relative flex-1 max-w-xs">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={bookSearchQuery}
                        onChange={(e) => setBookSearchQuery(e.target.value)}
                        placeholder="Buscar libro (ej. Juan, Romanos)..."
                        className="w-full bg-[#18181B] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Rejilla de Libros */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      1. Selecciona el Libro:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#161618] rounded-2xl scrollbar-thin scrollbar-thumb-white/10">
                      {filteredBooks.map((b) => {
                        const isBookActive = selectedBook.name === b.name;
                        return (
                          <button
                            key={b.name}
                            type="button"
                            onClick={() => {
                              setSelectedBook(b);
                              setSelectedChapter(1);
                              setSelectedVerseStart(1);
                              setSelectedVerseEnd(1);
                              handleSelectExplorerVerse(1);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                              isBookActive
                                ? 'bg-white text-black font-bold shadow-sm scale-[1.02]'
                                : 'bg-[#222226] text-neutral-300 hover:bg-[#2B2B30] hover:text-white'
                            }`}
                          >
                            <span>{b.name}</span>
                            <span className="text-[10px] opacity-60 ml-1">({b.chaptersCount})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector de Capítulos */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        2. Capítulos de {selectedBook.name} ({selectedBook.chaptersCount} en total):
                      </span>
                      <span className="text-xs text-white font-bold">
                        Capítulo {selectedChapter}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-[#161618] rounded-2xl scrollbar-thin scrollbar-thumb-white/10">
                      {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => {
                        const isChActive = selectedChapter === ch;
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => {
                              setSelectedChapter(ch);
                              setSelectedVerseStart(1);
                              setSelectedVerseEnd(1);
                              handleSelectExplorerVerse(1);
                            }}
                            className={`w-9 h-8 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center ${
                              isChActive
                                ? 'bg-white text-black shadow-sm scale-105'
                                : 'bg-[#222226] text-neutral-300 hover:bg-[#2B2B30] hover:text-white'
                            }`}
                          >
                            {ch}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector de Versículos */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        3. Versículos de {selectedBook.name} {selectedChapter}:
                      </span>
                      <span className="text-xs text-white font-bold">
                        {verseRef}
                      </span>
                    </div>

                    {isLoadingVerses ? (
                      <div className="p-3 text-center text-xs text-neutral-400">
                        Cargando versículos de {selectedBook.name} {selectedChapter}...
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 bg-[#161618] rounded-2xl scrollbar-thin scrollbar-thumb-white/10">
                        {chapterVerses.map((item) => {
                          const isStart = item.verse === selectedVerseStart;
                          const inRange = item.verse >= Math.min(selectedVerseStart, selectedVerseEnd) && 
                                          item.verse <= Math.max(selectedVerseStart, selectedVerseEnd);
                          return (
                            <button
                              key={item.verse}
                              type="button"
                              onClick={() => handleSelectExplorerVerse(item.verse)}
                              onDoubleClick={() => handleSelectExplorerRange(selectedVerseStart, item.verse)}
                              className={`w-9 h-8 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center ${
                                isStart
                                  ? 'bg-white text-black shadow-sm scale-105'
                                  : inRange
                                  ? 'bg-white/20 text-white font-bold'
                                  : 'bg-[#222226] text-neutral-300 hover:bg-[#2B2B30] hover:text-white'
                              }`}
                              title={`Versículo ${item.verse}: ${item.text.substring(0, 60)}...`}
                            >
                              {item.verse}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Texto del Pasaje Seleccionado en RVR1960 */}
                  <div className="p-3.5 bg-[#161618] rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{verseRef || 'Pasaje seleccionado'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                        RVR1960
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 italic leading-relaxed">
                      "{verseText || 'Selecciona un versículo arriba para ver su contenido...'}"
                    </p>
                  </div>

                </div>
              )}

              {/* OPCIÓN 2: ENTRADA RÁPIDA DE CITA BÍBLICA */}
              {passageMode === 'direct' && (
                <div className="space-y-4 pt-1 animate-fadeIn">
                  
                  {/* Fila con Input de Cita Bíblica y Botón Buscar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                        Cita Bíblica Directa
                      </label>
                      <div className="flex items-center gap-2">
                        {verseRef.trim() && (
                          <button
                            type="button"
                            onClick={handleAutoLookupRVR1960}
                            disabled={isLookingUp}
                            className="text-xs text-white/90 hover:text-white flex items-center gap-1 font-semibold underline"
                          >
                            <Search size={11} />
                            <span>{isLookingUp ? 'Buscando...' : 'Buscar en RVR1960'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(!showSuggestions)}
                          className="text-xs font-bold text-white/80 hover:text-white px-2.5 py-1 rounded-xl bg-[#28282C] transition-all flex items-center gap-1"
                        >
                          <Sparkles size={11} />
                          <span>Sugerencias</span>
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={verseRef}
                      onChange={(e) => setVerseRef(e.target.value)}
                      onBlur={handleAutoLookupRVR1960}
                      placeholder="Ej. Efesios 2:8-9, Romanos 8:28, Juan 3:16..."
                      className="w-full bg-[#18181B] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 font-semibold transition-all outline-none"
                    />
                  </div>

                  {/* Sugerencias Rápidas desplegables */}
                  {showSuggestions && (
                    <div className="p-3 bg-[#161618] rounded-2xl space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                        <span>Pasajes clave para prédica:</span>
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(false)}
                          className="text-neutral-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-none">
                        {COMMON_BIBLE_VERSES.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectSuggestedVerse(v.reference, v.text, v.version)}
                            className="px-3 py-1 rounded-xl bg-[#26262B] hover:bg-white hover:text-black text-neutral-300 text-xs font-semibold whitespace-nowrap transition-colors"
                          >
                            {v.reference}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selector de Versión Bíblica con Espaciado Perfecto */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                      Versión de la Traducción
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {availableVersions.map((ver) => {
                        const isVerActive = verseVersion === ver;
                        return (
                          <button
                            key={ver}
                            type="button"
                            onClick={() => setVerseVersion(ver)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                              isVerActive
                                ? 'bg-white text-black shadow-md scale-[1.02]'
                                : 'bg-[#18181B] text-neutral-400 hover:text-white hover:bg-[#25252A]'
                            }`}
                          >
                            {ver}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Textarea del versículo con espaciado amplio */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                      Texto del Versículo
                    </label>
                    <textarea
                      value={verseText}
                      onChange={(e) => setVerseText(e.target.value)}
                      placeholder="Escribe o pega el texto bíblico que se leerá en el púlpito..."
                      rows={3}
                      className="w-full bg-[#18181B] rounded-2xl p-3 text-xs text-neutral-200 placeholder:text-neutral-500 leading-relaxed outline-none resize-none transition-all"
                    />
                  </div>

                </div>
              )}

            </div>

            {/* 5. PLANTILLA INICIAL DEL BOSQUEJO */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered size={12} className="text-[#8E8E93]" />
                <span>Plantilla Inicial del Bosquejo:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Opción 1: Clásico Expositivo */}
                <button
                  type="button"
                  onClick={() => setTemplate('clasico')}
                  className={`p-4 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between ${
                    template === 'clasico'
                      ? 'bg-white text-black shadow-lg scale-[1.01]'
                      : 'bg-[#202024] hover:bg-[#26262B] text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold whitespace-nowrap ${template === 'clasico' ? 'text-black' : 'text-white'}`}>
                        Clásico Expositivo
                      </h4>
                      {template === 'clasico' && <Check size={14} className="text-black" />}
                    </div>
                    <p className={`text-[11px] mt-1.5 leading-snug ${template === 'clasico' ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
                      4 puntos: Intro, Doctrina, Práctica, Llamado
                    </p>
                  </div>
                </button>

                {/* Opción 2: Temático Dinámico */}
                <button
                  type="button"
                  onClick={() => setTemplate('tematico')}
                  className={`p-4 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between ${
                    template === 'tematico'
                      ? 'bg-white text-black shadow-lg scale-[1.01]'
                      : 'bg-[#202024] hover:bg-[#26262B] text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold whitespace-nowrap ${template === 'tematico' ? 'text-black' : 'text-white'}`}>
                        Temático Dinámico
                      </h4>
                      {template === 'tematico' && <Check size={14} className="text-black" />}
                    </div>
                    <p className={`text-[11px] mt-1.5 leading-snug ${template === 'tematico' ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
                      3 puntos: Necesidad, Solución en Dios, Pasos
                    </p>
                  </div>
                </button>

                {/* Opción 3: Lienzo en Blanco */}
                <button
                  type="button"
                  onClick={() => setTemplate('blanco')}
                  className={`p-4 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between ${
                    template === 'blanco'
                      ? 'bg-white text-black shadow-lg scale-[1.01]'
                      : 'bg-[#202024] hover:bg-[#26262B] text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold whitespace-nowrap ${template === 'blanco' ? 'text-black' : 'text-white'}`}>
                        Lienzo en Blanco
                      </h4>
                      {template === 'blanco' && <Check size={14} className="text-black" />}
                    </div>
                    <p className={`text-[11px] mt-1.5 leading-snug ${template === 'blanco' ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
                      Empieza desde cero con tus propios puntos
                    </p>
                  </div>
                </button>
              </div>
            </div>

          </form>

          {/* COLUMNA DERECHA: Previsualización en Vivo de la Prédica (5 columnas) */}
          <div className="lg:col-span-5 bg-[#141416] flex flex-col min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            
            {/* Cabecera de Previsualización */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-white" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Vista Previa en Vivo
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-300 bg-white/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Tiempo Real</span>
              </div>
            </div>

            {/* Hoja de Estudio / Tarjeta del Púlpito en Blanco y Gris */}
            <div className="bg-[#1C1C1F] rounded-3xl p-5 shadow-xl space-y-4 flex-1">
              
              {/* Metadatos Superiores */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white text-black shadow-xs">
                  {currentTopic?.name || 'Tema Bíblico'}
                </span>
                <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  <Calendar size={12} className="text-neutral-500" />
                  <span>{date || 'Sin fecha'}</span>
                </span>
              </div>

              {/* Título y Subtítulo Dinámicos */}
              <div className="space-y-1">
                {title.trim() ? (
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight">
                    {title}
                  </h3>
                ) : (
                  <h3 className="text-sm sm:text-base font-semibold text-neutral-500 italic">
                    Título de la prédica aparecerá aquí...
                  </h3>
                )}

                <p className="text-xs text-neutral-400 font-normal leading-relaxed">
                  {subtitle.trim() || 'Subtítulo o propósito del mensaje'}
                </p>
              </div>

              {/* Cita Bíblica Central */}
              {verseRef.trim() ? (
                <div className="bg-[#242429] rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Quote size={13} className="text-neutral-400" />
                      <span>{verseRef}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-200 font-mono">
                      {verseVersion}
                    </span>
                  </div>
                  {verseText.trim() ? (
                    <p className="text-xs text-neutral-300 italic leading-relaxed line-clamp-4">
                      "{verseText}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-neutral-500 italic">
                      Texto bíblico listo para ser leído en el púlpito...
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-2xl text-center bg-[#242429]">
                  <p className="text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
                    <Quote size={12} />
                    <span>Pasaje central pendiente (podrás asignarlo después)</span>
                  </p>
                </div>
              )}

              {/* Estructura del Bosquejo en Tiempo Real */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Layers size={12} className="text-neutral-400" />
                    <span>Estructura del Bosquejo ({previewPoints.length} Puntos)</span>
                  </span>
                  <span className="text-white font-semibold capitalize">
                    {template}
                  </span>
                </div>

                <div className="space-y-2">
                  {previewPoints.map((pt, idx) => (
                    <div 
                      key={pt.id || idx}
                      className="p-3 rounded-2xl bg-[#242429] space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-bold text-white truncate">
                          {pt.title.replace(/^\d+\.\s*/, '')}
                        </h5>
                      </div>
                      <p className="text-[11px] text-neutral-400 pl-7 line-clamp-1 leading-snug">
                        {pt.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota de Preparación Inicial */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-neutral-400">
                <BookmarkCheck size={13} className="text-neutral-400 flex-shrink-0" />
                <span className="truncate">
                  Nota inicial: <span className="text-neutral-300">Pausa de silencio antes de predicar</span>
                </span>
              </div>

            </div>

            {/* Tarjeta de Información Complementaria */}
            <div className="p-3.5 rounded-2xl bg-[#1C1C1F] text-[11px] text-neutral-400 space-y-1">
              <span className="font-bold text-white block">
                Suite de Predicación Lista
              </span>
              <p className="text-[10px] leading-relaxed text-neutral-400">
                Al crear el estudio tendrás acceso al bosquejo interactivo, exégesis en Griego y Hebreo, citas cruzadas y modo presentación.
              </p>
            </div>

          </div>

        </div>

        {/* Footer Global de Acciones */}
        <div className="px-6 py-4 bg-[#1F1F23] flex items-center justify-between flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span>Tema:</span>
            <span className="font-semibold text-white">{currentTopic?.name || 'Por defecto'}</span>
            <span className="text-neutral-600">•</span>
            <span>Plantilla:</span>
            <span className="font-semibold text-white capitalize">{template}</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            
            <button
              form={`form-${inputId}`}
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <FileText size={14} />
              <span>Crear Prédica</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateStudyModal;
