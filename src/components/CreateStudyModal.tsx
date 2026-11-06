import React, { useState, useId } from 'react';
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
  Flame,
  BookmarkCheck
} from 'lucide-react';
import { Topic, Study, OutlinePoint } from '../types';
import { COMMON_BIBLE_VERSES } from '../data/initialData';
import { parseAndLookupReference } from '../services/bibleService';

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
  
  // Pasaje Bíblico Central (Opcional)
  const [verseRef, setVerseRef] = useState('');
  const [verseVersion, setVerseVersion] = useState('RVR1960');
  const [verseText, setVerseText] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Plantilla de Bosquejo
  const [template, setTemplate] = useState<'clasico' | 'tematico' | 'blanco'>('clasico');

  // Selector de sugerencias rápidas
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Crear nuevo tema inline
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const inputId = useId();

  if (!isOpen) return null;

  const availableVersions = ['RVR1960', 'NVI', 'NTV', 'LBLA'];

  // Tema actualmente seleccionado
  const currentTopic = topics.find(t => t.id === selectedTopicId) || topics[0];

  // Cargar pasaje sugerido
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

  // Obtener puntos del bosquejo según la plantilla
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 lg:p-7 font-sans select-none overflow-y-auto animate-fadeIn">
      {/* Contenedor Modal iPadOS Amplio y Cuadradito */}
      <div 
        className="bg-[#1C1C1E] text-[#F5F5F7] w-full max-w-5xl h-[92vh] max-h-[840px] rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] border border-white/[0.08] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera Estilo iPadOS con Icono Badge y Botón Cerrar */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E03126] text-white flex items-center justify-center font-bold shadow-md shadow-[#E03126]/25">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight flex items-center gap-2">
                <span>Nueva Prédica o Estudio</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 border border-white/[0.05]">
                  Editor Guiado
                </span>
              </h2>
              <p className="text-xs text-[#8E8E93] font-normal mt-0.5">
                Organiza el tema, pasajes bíblicos y visualiza la estructura en tiempo real
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
            title="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo Principal Dividido en 2 Columnas Balanceadas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          
          {/* COLUMNA IZQUIERDA: Formulario de Configuración (7 cols) */}
          <form 
            id={`form-${inputId}`}
            onSubmit={handleSubmit} 
            className="lg:col-span-7 flex flex-col min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10"
          >
            
            {/* 1. TEMA BÍBLICO AL QUE PERTENECE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen size={12} className="text-[#8E8E93]" />
                  <span>Tema Bíblico al que pertenece:</span>
                </label>
                {onCreateTopicOnly && !isCreatingTopic && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingTopic(true)}
                    className="text-[11px] font-semibold text-[#E03126] hover:text-[#ff4d40] flex items-center gap-1 transition-colors"
                  >
                    <Plus size={11} />
                    <span>Nuevo Tema</span>
                  </button>
                )}
              </div>

              {/* Input inline para crear nuevo tema si se activa */}
              {isCreatingTopic && (
                <div className="flex items-center gap-2 p-2 bg-[#242426] rounded-xl border border-white/[0.08] animate-fadeIn">
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Nombre del nuevo tema bíblico..."
                    className="flex-1 bg-[#1C1C1E] border border-white/[0.08] focus:border-[#E03126] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
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
                    className="px-3 py-1.5 bg-[#E03126] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Check size={12} />
                    <span>Guardar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTopic(false)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Chips de temas bíblicos */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {topics.map((t) => {
                  const isSelected = selectedTopicId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTopicId(t.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-white text-[#1C1C1E] shadow-sm font-bold scale-[1.02]'
                          : 'bg-[#2C2C2E]/80 text-[#D1D1D6] hover:bg-[#3A3A3C] hover:text-white border border-white/[0.06]'
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
                className="w-full bg-[#2C2C2E]/60 focus:bg-[#2C2C2E] border border-white/[0.08] focus:border-[#E03126] focus:ring-1 focus:ring-[#E03126]/60 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-neutral-500 transition-all outline-none"
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
                  className="w-full bg-[#2C2C2E]/60 focus:bg-[#2C2C2E] border border-white/[0.08] focus:border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 transition-all outline-none"
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
                  className="w-full bg-[#2C2C2E]/60 focus:bg-[#2C2C2E] border border-white/[0.08] focus:border-white/20 rounded-2xl px-3.5 py-2.5 text-xs text-white font-medium transition-all outline-none scheme-dark"
                />
              </div>
            </div>

            {/* 4. APLICAR PASAJE CENTRAL (OPCIONAL) */}
            <div className="bg-[#242426]/70 rounded-2xl border border-white/[0.06] p-4 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-[#E03126]">
                    <Quote size={17} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Pasaje Bíblico Central (Opcional)
                    </h3>
                    <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">
                      Puedes definir la cita ahora o asignarla luego desde el estudio
                    </p>
                  </div>
                </div>

                {/* Botón Pasajes Sugeridos */}
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-xs font-bold text-[#E03126] hover:text-[#ff4d40] bg-[#E03126]/10 hover:bg-[#E03126]/20 px-2.5 py-1 rounded-full transition-all flex items-center gap-1 flex-shrink-0 active:scale-95"
                >
                  <Sparkles size={11} />
                  <span>Sugerencias</span>
                </button>
              </div>

              {/* Sugerencias Rápidas desplegables */}
              {showSuggestions && (
                <div className="p-3 bg-[#1C1C1E] rounded-xl border border-white/[0.08] space-y-2 animate-fadeIn">
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
                        className="px-2.5 py-1 rounded-lg bg-[#2C2C2E] hover:bg-[#E03126] text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                      >
                        {v.reference}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inputs Cita y Versión */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                      Cita Bíblica
                    </label>
                    {verseRef.trim() && (
                      <button
                        type="button"
                        onClick={handleAutoLookupRVR1960}
                        disabled={isLookingUp}
                        className="text-[10px] text-[#E03126] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Search size={10} />
                        <span>{isLookingUp ? 'Buscando...' : 'Buscar RVR1960'}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={verseRef}
                    onChange={(e) => setVerseRef(e.target.value)}
                    onBlur={handleAutoLookupRVR1960}
                    placeholder="Ej. Efesios 2:8-9, Romanos 8:28..."
                    className="w-full bg-[#1C1C1E] focus:bg-[#1C1C1E] border border-white/[0.08] focus:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 font-semibold transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                    Versión
                  </label>
                  <div className="bg-[#1C1C1E] p-1 rounded-xl flex items-center gap-1 border border-white/[0.06]">
                    {availableVersions.map((ver) => {
                      const isVerActive = verseVersion === ver;
                      return (
                        <button
                          key={ver}
                          type="button"
                          onClick={() => setVerseVersion(ver)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all text-center ${
                            isVerActive
                              ? 'bg-white text-[#1C1C1E] shadow-sm font-extrabold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {ver}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Textarea del versículo */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                  Texto del Versículo
                </label>
                <textarea
                  value={verseText}
                  onChange={(e) => setVerseText(e.target.value)}
                  placeholder="Escribe o pega el texto bíblico que se leerá en el púlpito..."
                  rows={2}
                  className="w-full bg-[#1C1C1E] focus:bg-[#1C1C1E] border border-white/[0.08] focus:border-white/20 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-500 leading-relaxed outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* 5. PLANTILLA INICIAL DEL BOSQUEJO */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered size={12} className="text-[#8E8E93]" />
                <span>Plantilla Inicial del Bosquejo:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Opción 1: Clásico Expositivo */}
                <button
                  type="button"
                  onClick={() => setTemplate('clasico')}
                  className={`p-3.5 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between border ${
                    template === 'clasico'
                      ? 'bg-white text-[#1C1C1E] border-white shadow-md ring-2 ring-white/20'
                      : 'bg-[#242426]/70 hover:bg-[#2C2C2E] text-white border-white/[0.06]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${template === 'clasico' ? 'text-[#1C1C1E]' : 'text-white'}`}>
                        Clásico Expositivo
                      </h4>
                      {template === 'clasico' && <Check size={13} className="text-[#1C1C1E]" />}
                    </div>
                    <p className={`text-[11px] mt-1 leading-snug ${template === 'clasico' ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
                      4 puntos: Intro, Doctrina, Práctica, Llamado
                    </p>
                  </div>
                </button>

                {/* Opción 2: Temático Dinámico */}
                <button
                  type="button"
                  onClick={() => setTemplate('tematico')}
                  className={`p-3.5 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between border ${
                    template === 'tematico'
                      ? 'bg-white text-[#1C1C1E] border-white shadow-md ring-2 ring-white/20'
                      : 'bg-[#242426]/70 hover:bg-[#2C2C2E] text-white border-white/[0.06]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${template === 'tematico' ? 'text-[#1C1C1E]' : 'text-white'}`}>
                        Temático Dinámico
                      </h4>
                      {template === 'tematico' && <Check size={13} className="text-[#1C1C1E]" />}
                    </div>
                    <p className={`text-[11px] mt-1 leading-snug ${template === 'tematico' ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
                      3 puntos: Necesidad, Solución en Dios, Pasos
                    </p>
                  </div>
                </button>

                {/* Opción 3: Lienzo en Blanco */}
                <button
                  type="button"
                  onClick={() => setTemplate('blanco')}
                  className={`p-3.5 rounded-2xl text-left transition-all active:scale-[0.98] flex flex-col justify-between border ${
                    template === 'blanco'
                      ? 'bg-white text-[#1C1C1E] border-white shadow-md ring-2 ring-white/20'
                      : 'bg-[#242426]/70 hover:bg-[#2C2C2E] text-white border-white/[0.06]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${template === 'blanco' ? 'text-[#1C1C1E]' : 'text-white'}`}>
                        Lienzo en Blanco
                      </h4>
                      {template === 'blanco' && <Check size={13} className="text-[#1C1C1E]" />}
                    </div>
                    <p className={`text-[11px] mt-1 leading-snug ${template === 'blanco' ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
                      Empieza desde cero con tus propios puntos
                    </p>
                  </div>
                </button>
              </div>
            </div>

          </form>

          {/* COLUMNA DERECHA: Previsualización en Vivo de la Prédica (5 cols) */}
          <div className="lg:col-span-5 bg-[#141416]/95 flex flex-col min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            
            {/* Cabecera de Previsualización */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-[#E03126]/15 text-[#E03126]">
                  <Eye size={13} />
                </div>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Vista Previa en Vivo
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tiempo Real</span>
              </div>
            </div>

            {/* Tarjeta de Prédica en Vivo (Hoja de Estudio iPad) */}
            <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 flex-1">
              
              {/* Metadatos Superiores */}
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-[#E03126]/20 text-[#ff5a4f] border border-[#E03126]/30">
                    {currentTopic?.name || 'Tema Bíblico'}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                  <Calendar size={11} className="text-neutral-500" />
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
                <div className="bg-[#242426] border border-[#E03126]/30 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#ff5a4f]">
                    <span className="flex items-center gap-1.5">
                      <Quote size={12} />
                      <span>{verseRef}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white font-mono">
                      {verseVersion}
                    </span>
                  </div>
                  {verseText.trim() ? (
                    <p className="text-xs text-neutral-300 italic leading-relaxed line-clamp-3">
                      "{verseText}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-neutral-500 italic">
                      Texto bíblico listo para ser leído en el púlpito...
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-xl p-2.5 text-center bg-white/[0.01]">
                  <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1">
                    <Quote size={11} />
                    <span>Pasaje central pendiente (podrás asignarlo después)</span>
                  </p>
                </div>
              )}

              {/* Estructura del Bosquejo en Tiempo Real */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Layers size={11} className="text-neutral-500" />
                    <span>Estructura del Bosquejo ({previewPoints.length} Puntos)</span>
                  </span>
                  <span className="text-[#E03126] font-semibold lowercase">
                    {template}
                  </span>
                </div>

                <div className="space-y-2">
                  {previewPoints.map((pt, idx) => (
                    <div 
                      key={pt.id || idx}
                      className="p-2.5 rounded-xl bg-[#242426]/70 border border-white/[0.04] space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-semibold text-neutral-200 truncate">
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
              <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-neutral-400">
                <BookmarkCheck size={12} className="text-neutral-500 flex-shrink-0" />
                <span className="truncate">
                  Incluye nota inicial: <span className="text-neutral-300">Pausa de silencio antes de predicar</span>
                </span>
              </div>

            </div>

            {/* Tarjeta de Información Complementaria */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <Flame size={12} className="text-[#E03126]" />
                <span>Suite de Predicación Lista</span>
              </div>
              <p className="text-[10px] leading-relaxed text-neutral-400">
                Al crear el estudio tendrás acceso al bosquejo interactivo, exégesis en Griego y Hebreo, citas cruzadas y modo presentación.
              </p>
            </div>

          </div>

        </div>

        {/* Footer Global de Acciones */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-between bg-white/[0.02] flex-shrink-0">
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
              className="px-4 py-2 text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            
            <button
              form={`form-${inputId}`}
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2.5 bg-[#E03126] hover:bg-[#C9271D] disabled:opacity-40 disabled:hover:bg-[#E03126] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#E03126]/20 active:scale-95 flex items-center gap-1.5"
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
