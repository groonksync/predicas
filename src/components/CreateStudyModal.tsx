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
  theme?: 'light' | 'dark';
}

export const CreateStudyModal: React.FC<CreateStudyModalProps> = ({
  isOpen,
  onClose,
  topics,
  activeTopicId,
  onCreateStudy,
  onCreateTopicOnly,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

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
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 lg:p-7 font-sans select-none overflow-y-auto animate-fadeIn">
      {/* Contenedor Modal Amplio y Cuadradito Adaptable a Modo Luz y Modo Gris */}
      <div 
        className={`w-[96vw] max-w-6xl h-[94vh] max-h-[920px] rounded-[36px] shadow-2xl flex flex-col overflow-hidden my-auto transition-colors duration-200 ${
          isLight 
            ? 'bg-[#F8F9FB] text-[#1C1C1E]' 
            : 'bg-[#161619] text-[#F5F5F7]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera Espaciosa con Márgenes Generosos (Sin Ícono Rojo ni Cortes Pegados) */}
        <div className={`px-8 pt-7 pb-5 flex items-center justify-between flex-shrink-0 transition-colors ${
          isLight ? 'bg-white' : 'bg-[#1E1E22]'
        }`}>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold tracking-tight leading-tight ${
              isLight ? 'text-[#1C1C1E]' : 'text-white'
            }`}>
              Nueva Prédica o Estudio
            </h2>
            <p className="text-xs sm:text-sm text-[#8E8E93] font-normal mt-1">
              Organiza el tema, pasajes bíblicos y visualiza la estructura en tiempo real
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isLight 
                ? 'bg-[#EAEAEE] text-slate-700 hover:bg-[#DEDEE4] hover:text-black' 
                : 'bg-[#2A2A2F] text-neutral-300 hover:bg-[#36363C] hover:text-white'
            }`}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo Principal Dividido en 2 Columnas Balanceadas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          
          {/* COLUMNA IZQUIERDA: Formulario de Configuración (7 columnas) */}
          <form 
            id={`form-${inputId}`}
            onSubmit={handleSubmit} 
            className="lg:col-span-7 flex flex-col min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-400/20"
          >
            
            {/* 1. TEMA BÍBLICO AL QUE PERTENECE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen size={12} className="text-[#8E8E93]" />
                  <span>Tema Bíblico al que pertenece:</span>
                </label>
                {onCreateTopicOnly && !isCreatingTopic && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingTopic(true)}
                    className={`text-[11px] font-semibold flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl ${
                      isLight 
                        ? 'bg-[#EAEAEE] text-slate-800 hover:bg-[#DEDEE4]' 
                        : 'bg-[#242429] text-neutral-300 hover:bg-[#2F2F35] hover:text-white'
                    }`}
                  >
                    <Plus size={11} />
                    <span>Nuevo Tema</span>
                  </button>
                )}
              </div>

              {/* Input inline para crear nuevo tema */}
              {isCreatingTopic && (
                <div className={`flex items-center gap-2 p-2.5 rounded-2xl animate-fadeIn ${
                  isLight ? 'bg-white shadow-xs' : 'bg-[#222227]'
                }`}>
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Nombre del nuevo tema bíblico..."
                    className={`flex-1 rounded-xl px-3.5 py-2 text-xs outline-none ${
                      isLight 
                        ? 'bg-[#F2F2F7] text-slate-900 focus:bg-white' 
                        : 'bg-[#18181C] text-white focus:bg-[#202026]'
                    }`}
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
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-40 ${
                      isLight 
                        ? 'bg-[#1C1C1E] text-white hover:bg-black' 
                        : 'bg-white text-black hover:bg-neutral-200'
                    }`}
                  >
                    <Check size={13} />
                    <span>Guardar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTopic(false)}
                    className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-xl"
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
                          ? isLight
                            ? 'bg-[#1C1C1E] text-white shadow-md font-bold scale-[1.02]'
                            : 'bg-white text-black shadow-md font-bold scale-[1.02]'
                          : isLight
                            ? 'bg-[#EAEAEE] text-slate-800 hover:bg-[#DEDEE4]'
                            : 'bg-[#222227] text-neutral-300 hover:bg-[#2A2A30] hover:text-white'
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
                <span className="text-[10px] text-neutral-400 font-medium">Requerido</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. El Regalo Inmerecido de la Gracia, Poder para Vencer..."
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all outline-none ${
                  isLight 
                    ? 'bg-white text-slate-900 placeholder:text-neutral-400 shadow-xs focus:ring-2 focus:ring-black/10' 
                    : 'bg-[#1E1E23] text-white placeholder:text-neutral-500 focus:bg-[#24242A] focus:ring-1 focus:ring-white/30'
                }`}
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
                  className={`w-full rounded-2xl px-4 py-2.5 text-xs transition-all outline-none ${
                    isLight 
                      ? 'bg-white text-slate-900 placeholder:text-neutral-400 shadow-xs' 
                      : 'bg-[#1E1E23] text-white placeholder:text-neutral-500 focus:bg-[#24242A]'
                  }`}
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
                  className={`w-full rounded-2xl px-3.5 py-2.5 text-xs font-medium transition-all outline-none ${
                    isLight 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'bg-[#1E1E23] text-white focus:bg-[#24242A] scheme-dark'
                  }`}
                />
              </div>
            </div>

            {/* 4. PASAJE BÍBLICO CENTRAL (EXPLORADOR COMPLETO O ESCRITURA DIRECTA) */}
            <div className={`rounded-3xl p-5 space-y-4 ${
              isLight ? 'bg-white shadow-xs' : 'bg-[#1E1E23]'
            }`}>
              
              {/* Selector de Modo: Explorador de Biblia Completa vs Entrada Rápida */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <Quote size={14} className="text-[#8E8E93]" />
                    <span>Pasaje Bíblico Central</span>
                  </h3>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">
                    Selecciona explorando la Biblia completa o escribe la cita directamente
                  </p>
                </div>

                {/* Tabs de Modo: Luz y Gris */}
                <div className={`flex items-center gap-1 p-1 rounded-2xl self-start sm:self-auto ${
                  isLight ? 'bg-[#EAEAEE]' : 'bg-[#141417]'
                }`}>
                  <button
                    type="button"
                    onClick={() => setPassageMode('explorer')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      passageMode === 'explorer'
                        ? isLight 
                          ? 'bg-[#1C1C1E] text-white shadow-xs' 
                          : 'bg-white text-black shadow-xs'
                        : isLight 
                          ? 'text-slate-600 hover:text-black' 
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
                        ? isLight 
                          ? 'bg-[#1C1C1E] text-white shadow-xs' 
                          : 'bg-white text-black shadow-xs'
                        : isLight 
                          ? 'text-slate-600 hover:text-black' 
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
                <div className="space-y-4 pt-1 animate-fadeIn">
                  
                  {/* Filtro de Testamento y Búsqueda de Libros */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Filtros de Testamento */}
                    <div className={`flex items-center gap-1 p-1 rounded-xl ${
                      isLight ? 'bg-[#F2F2F7]' : 'bg-[#141417]'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('ALL')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          testamentFilter === 'ALL'
                            ? isLight ? 'bg-white text-black font-bold shadow-xs' : 'bg-white text-black font-bold shadow-xs'
                            : isLight ? 'text-slate-600 hover:text-black' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Todos (66)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('AT')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          testamentFilter === 'AT'
                            ? isLight ? 'bg-white text-black font-bold shadow-xs' : 'bg-white text-black font-bold shadow-xs'
                            : isLight ? 'text-slate-600 hover:text-black' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Antiguo (39)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestamentFilter('NT')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          testamentFilter === 'NT'
                            ? isLight ? 'bg-white text-black font-bold shadow-xs' : 'bg-white text-black font-bold shadow-xs'
                            : isLight ? 'text-slate-600 hover:text-black' : 'text-neutral-400 hover:text-white'
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
                        className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none ${
                          isLight 
                            ? 'bg-[#F2F2F7] text-slate-900 placeholder:text-neutral-400' 
                            : 'bg-[#141417] text-white placeholder:text-neutral-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Rejilla de Libros */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                      1. Selecciona el Libro:
                    </span>
                    <div className={`flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-2xl scrollbar-thin scrollbar-thumb-neutral-400/20 ${
                      isLight ? 'bg-[#F4F4F7]' : 'bg-[#141417]'
                    }`}>
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
                                ? isLight
                                  ? 'bg-[#1C1C1E] text-white font-bold shadow-xs scale-[1.02]'
                                  : 'bg-white text-black font-bold shadow-xs scale-[1.02]'
                                : isLight
                                  ? 'bg-white text-slate-800 hover:bg-[#EAEAEA]'
                                  : 'bg-[#222227] text-neutral-300 hover:bg-[#2B2B31] hover:text-white'
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
                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                        2. Capítulos de {selectedBook.name} ({selectedBook.chaptersCount} en total):
                      </span>
                      <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Capítulo {selectedChapter}
                      </span>
                    </div>

                    <div className={`flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 rounded-2xl scrollbar-thin scrollbar-thumb-neutral-400/20 ${
                      isLight ? 'bg-[#F4F4F7]' : 'bg-[#141417]'
                    }`}>
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
                                ? isLight
                                  ? 'bg-[#1C1C1E] text-white shadow-xs scale-105'
                                  : 'bg-white text-black shadow-xs scale-105'
                                : isLight
                                  ? 'bg-white text-slate-800 hover:bg-[#EAEAEA]'
                                  : 'bg-[#222227] text-neutral-300 hover:bg-[#2B2B31] hover:text-white'
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
                      <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                        3. Versículos de {selectedBook.name} {selectedChapter}:
                      </span>
                      <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {verseRef}
                      </span>
                    </div>

                    {isLoadingVerses ? (
                      <div className="p-3 text-center text-xs text-neutral-400">
                        Cargando versículos de {selectedBook.name} {selectedChapter}...
                      </div>
                    ) : (
                      <div className={`flex flex-wrap gap-1 max-h-28 overflow-y-auto p-2 rounded-2xl scrollbar-thin scrollbar-thumb-neutral-400/20 ${
                        isLight ? 'bg-[#F4F4F7]' : 'bg-[#141417]'
                      }`}>
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
                                  ? isLight
                                    ? 'bg-[#1C1C1E] text-white shadow-xs scale-105'
                                    : 'bg-white text-black shadow-xs scale-105'
                                  : inRange
                                  ? isLight
                                    ? 'bg-black/15 text-black font-bold'
                                    : 'bg-white/20 text-white font-bold'
                                  : isLight
                                    ? 'bg-white text-slate-800 hover:bg-[#EAEAEA]'
                                    : 'bg-[#222227] text-neutral-300 hover:bg-[#2B2B31] hover:text-white'
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
                  <div className={`p-4 rounded-2xl space-y-1.5 ${
                    isLight ? 'bg-[#F4F4F7]' : 'bg-[#141417]'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={isLight ? 'text-slate-900' : 'text-white'}>
                        {verseRef || 'Pasaje seleccionado'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isLight ? 'bg-black/10 text-slate-800' : 'bg-white/10 text-neutral-300'
                      }`}>
                        RVR1960
                      </span>
                    </div>
                    <p className={`text-xs italic leading-relaxed ${
                      isLight ? 'text-slate-700' : 'text-neutral-300'
                    }`}>
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
                            className={`text-xs flex items-center gap-1 font-semibold underline ${
                              isLight ? 'text-slate-900 hover:text-black' : 'text-white/90 hover:text-white'
                            }`}
                          >
                            <Search size={11} />
                            <span>{isLookingUp ? 'Buscando...' : 'Buscar en RVR1960'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(!showSuggestions)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 ${
                            isLight 
                              ? 'bg-[#EAEAEE] text-slate-800 hover:bg-[#DEDEE4]' 
                              : 'bg-[#28282D] text-white/80 hover:text-white'
                          }`}
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
                      className={`w-full rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all outline-none ${
                        isLight 
                          ? 'bg-[#F2F2F7] text-slate-900 placeholder:text-neutral-400 focus:bg-white' 
                          : 'bg-[#141417] text-white placeholder:text-neutral-500 focus:bg-[#202026]'
                      }`}
                    />
                  </div>

                  {/* Sugerencias Rápidas desplegables */}
                  {showSuggestions && (
                    <div className={`p-3 rounded-2xl space-y-2 animate-fadeIn ${
                      isLight ? 'bg-[#F4F4F7]' : 'bg-[#141417]'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                        <span>Pasajes clave para prédica:</span>
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(false)}
                          className="text-neutral-400 hover:text-black dark:hover:text-white"
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
                            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                              isLight 
                                ? 'bg-white hover:bg-[#1C1C1E] hover:text-white text-slate-800' 
                                : 'bg-[#222227] hover:bg-white hover:text-black text-neutral-300'
                            }`}
                          >
                            {v.reference}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selector de Versión Bíblica con Espaciado Holgado y Proporcional */}
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
                                ? isLight
                                  ? 'bg-[#1C1C1E] text-white shadow-md scale-[1.02]'
                                  : 'bg-white text-black shadow-md scale-[1.02]'
                                : isLight
                                  ? 'bg-[#F2F2F7] text-slate-700 hover:bg-[#EAEAEE]'
                                  : 'bg-[#141417] text-neutral-400 hover:text-white hover:bg-[#202026]'
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
                      className={`w-full rounded-2xl p-3 text-xs leading-relaxed outline-none resize-none transition-all ${
                        isLight 
                          ? 'bg-[#F2F2F7] text-slate-900 placeholder:text-neutral-400 focus:bg-white' 
                          : 'bg-[#141417] text-neutral-200 placeholder:text-neutral-500 focus:bg-[#202026]'
                      }`}
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
                      ? isLight
                        ? 'bg-[#1C1C1E] text-white shadow-lg scale-[1.01]'
                        : 'bg-white text-black shadow-lg scale-[1.01]'
                      : isLight
                        ? 'bg-white hover:bg-[#F2F2F7] text-slate-900 shadow-xs'
                        : 'bg-[#1E1E23] hover:bg-[#24242A] text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold whitespace-nowrap ${
                        template === 'clasico'
                          ? isLight ? 'text-white' : 'text-black'
                          : isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        Clásico Expositivo
                      </h4>
                      {template === 'clasico' && (
                        <Check size={14} className={isLight ? 'text-white' : 'text-black'} />
                      )}
                    </div>
                    <p className={`text-[11px] mt-1.5 leading-snug ${
                      template === 'clasico'
                        ? isLight ? 'text-neutral-300 font-medium' : 'text-neutral-700 font-medium'
                        : 'text-[#8E8E93]'
                    }`}>
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
                      ? isLight
                        ? 'bg-[#1C1C1E] text-white shadow-lg scale-[1.01]'
                        : 'bg-white text-black shadow-lg scale-[1.01]'
                      : isLight
                        ? 'bg-white hover:bg-[#F2F2F7] text-slate-900 shadow-xs'
                        : 'bg-[#1E1E23] hover:bg-[#24242A] text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold whitespace-nowrap ${
                        template === 'tematico'
                          ? isLight ? 'text-white' : 'text-black'
                          : isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        Temático Dinámico
                      </h4>
                      {template === 'tematico' && (
                        <Check size={14} className={isLight ? 'text-white' : 'text-black'} />
                      )}
                    </div>
                    <p className={`text-[11px] mt-1.5 leading-snug ${
                      template === 'tematico'
                        ? isLight ? 'text-neutral-300 font-medium' : 'text-neutral-700 font-medium'
                        : 'text-[#8E8E93]'
                    }`}>
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
                      ? isLight
                        ? 'bg-[#1C1C1E] text-white shadow-lg scale-[1.01]'
                        : 'bg-white text-black shadow-lg scale-[1.01]'
                      : isLight
                        ? 'bg-white hover:bg-[#F2F2F7] text-slate-900 shadow-xs'
                        : 'bg-[#1E1E23] hover:bg-[#24242A] text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold whitespace-nowrap ${
                        template === 'blanco'
                          ? isLight ? 'text-white' : 'text-black'
                          : isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        Lienzo en Blanco
                      </h4>
                      {template === 'blanco' && (
                        <Check size={14} className={isLight ? 'text-white' : 'text-black'} />
                      )}
                    </div>
                    <p className={`text-[11px] mt-1.5 leading-snug ${
                      template === 'blanco'
                        ? isLight ? 'text-neutral-300 font-medium' : 'text-neutral-700 font-medium'
                        : 'text-[#8E8E93]'
                    }`}>
                      Empieza desde cero con tus propios puntos
                    </p>
                  </div>
                </button>
              </div>
            </div>

          </form>

          {/* COLUMNA DERECHA: Previsualización en Vivo de la Prédica (5 columnas) */}
          <div className={`lg:col-span-5 flex flex-col min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-4 scrollbar-thin scrollbar-thumb-neutral-400/20 transition-colors ${
            isLight ? 'bg-[#EFF1F4]' : 'bg-[#101012]'
          }`}>
            
            {/* Cabecera de Previsualización */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Eye size={14} className={isLight ? 'text-slate-900' : 'text-white'} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  Vista Previa en Vivo
                </span>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                isLight ? 'bg-black/10 text-slate-800' : 'bg-white/10 text-neutral-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isLight ? 'bg-black' : 'bg-white'
                }`} />
                <span>Tiempo Real</span>
              </div>
            </div>

            {/* Hoja de Estudio / Tarjeta del Púlpito en Blanco y Gris */}
            <div className={`rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex-1 ${
              isLight ? 'bg-white text-slate-900' : 'bg-[#1A1A1E] text-white'
            }`}>
              
              {/* Metadatos Superiores */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-xs ${
                  isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-black'
                }`}>
                  {currentTopic?.name || 'Tema Bíblico'}
                </span>
                <span className="text-xs text-[#8E8E93] font-medium flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#8E8E93]" />
                  <span>{date || 'Sin fecha'}</span>
                </span>
              </div>

              {/* Título y Subtítulo Dinámicos */}
              <div className="space-y-1">
                {title.trim() ? (
                  <h3 className={`text-base sm:text-lg font-bold leading-snug tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {title}
                  </h3>
                ) : (
                  <h3 className="text-sm sm:text-base font-semibold text-neutral-400 italic">
                    Título de la prédica aparecerá aquí...
                  </h3>
                )}

                <p className="text-xs text-[#8E8E93] font-normal leading-relaxed">
                  {subtitle.trim() || 'Subtítulo o propósito del mensaje'}
                </p>
              </div>

              {/* Cita Bíblica Central */}
              {verseRef.trim() ? (
                <div className={`rounded-2xl p-4 space-y-2 ${
                  isLight ? 'bg-[#F4F4F7]' : 'bg-[#222227]'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <Quote size={13} className="text-[#8E8E93]" />
                      <span>{verseRef}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isLight ? 'bg-black/10 text-slate-800' : 'bg-white/10 text-neutral-200'
                    }`}>
                      {verseVersion}
                    </span>
                  </div>
                  {verseText.trim() ? (
                    <p className={`text-xs italic leading-relaxed line-clamp-4 ${
                      isLight ? 'text-slate-700' : 'text-neutral-300'
                    }`}>
                      "{verseText}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#8E8E93] italic">
                      Texto bíblico listo para ser leído en el púlpito...
                    </p>
                  )}
                </div>
              ) : (
                <div className={`p-3 rounded-2xl text-center ${
                  isLight ? 'bg-[#F4F4F7]' : 'bg-[#222227]'
                }`}>
                  <p className="text-[11px] text-[#8E8E93] flex items-center justify-center gap-1.5">
                    <Quote size={12} />
                    <span>Pasaje central pendiente (podrás asignarlo después)</span>
                  </p>
                </div>
              )}

              {/* Estructura del Bosquejo en Tiempo Real */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Layers size={12} className="text-[#8E8E93]" />
                    <span>Estructura del Bosquejo ({previewPoints.length} Puntos)</span>
                  </span>
                  <span className={`font-semibold capitalize ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {template}
                  </span>
                </div>

                <div className="space-y-2">
                  {previewPoints.map((pt, idx) => (
                    <div 
                      key={pt.id || idx}
                      className={`p-3 rounded-2xl space-y-1 ${
                        isLight ? 'bg-[#F4F4F7]' : 'bg-[#222227]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                          isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-black'
                        }`}>
                          {idx + 1}
                        </span>
                        <h5 className={`text-xs font-bold truncate ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {pt.title.replace(/^\d+\.\s*/, '')}
                        </h5>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] pl-7 line-clamp-1 leading-snug">
                        {pt.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota de Preparación Inicial */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-[#8E8E93]">
                <BookmarkCheck size={13} className="text-[#8E8E93] flex-shrink-0" />
                <span className="truncate">
                  Nota inicial: <span className={isLight ? 'text-slate-800' : 'text-neutral-300'}>Pausa de silencio antes de predicar</span>
                </span>
              </div>

            </div>

            {/* Tarjeta de Información Complementaria */}
            <div className={`p-4 rounded-2xl text-[11px] space-y-1 ${
              isLight ? 'bg-white text-slate-700 shadow-xs' : 'bg-[#1A1A1E] text-neutral-400'
            }`}>
              <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Suite de Predicación Lista
              </span>
              <p className="text-[10px] leading-relaxed text-[#8E8E93]">
                Al crear el estudio tendrás acceso al bosquejo interactivo, exégesis en Griego y Hebreo, citas cruzadas y modo presentación.
              </p>
            </div>

          </div>

        </div>

        {/* Footer Global de Acciones */}
        <div className={`px-8 py-4.5 flex items-center justify-between flex-shrink-0 transition-colors ${
          isLight ? 'bg-white border-t border-black/[0.04]' : 'bg-[#1E1E22] border-t border-white/[0.04]'
        }`}>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#8E8E93]">
            <span>Tema:</span>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {currentTopic?.name || 'Por defecto'}
            </span>
            <span>•</span>
            <span>Plantilla:</span>
            <span className={`font-semibold capitalize ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {template}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            
            <button
              form={`form-${inputId}`}
              type="submit"
              disabled={!title.trim()}
              className={`px-6 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-40 ${
                isLight 
                  ? 'bg-[#1C1C1E] text-white hover:bg-black disabled:hover:bg-[#1C1C1E]' 
                  : 'bg-white text-black hover:bg-neutral-200 disabled:hover:bg-white'
              }`}
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
