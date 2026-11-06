import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Calendar, 
  Quote, 
  FileText,
  ListOrdered,
  FolderOpen,
  Search
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
}

export const CreateStudyModal: React.FC<CreateStudyModalProps> = ({
  isOpen,
  onClose,
  topics,
  activeTopicId,
  onCreateStudy,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState(activeTopicId);
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

  if (!isOpen) return null;

  const availableVersions = ['RVR1960', 'NVI', 'NTV', 'LBLA'];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const hasVerse = verseRef.trim().length > 0;

    // Generar bosquejo según plantilla seleccionada
    let initialPoints: OutlinePoint[] = [];

    if (template === 'clasico') {
      initialPoints = [
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
      initialPoints = [
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
      initialPoints = [
        {
          id: `p-${Date.now()}-1`,
          number: 1,
          title: '1. Fundamento del Mensaje',
          scriptureRef: hasVerse ? verseRef.trim() : '',
          content: 'Escribe aquí el primer punto de tu predicación...'
        }
      ];
    }

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans select-none overflow-y-auto animate-fadeIn">
      {/* Tarjeta Modal iPadOS Sheet */}
      <div 
        className="bg-[#1C1C1E] text-[#F5F5F7] w-full max-w-xl rounded-[28px] shadow-[0_24px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col my-auto border border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. Cabecera Estilo iPadOS con Icono Badge y Botón Cerrar */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#E03126] text-white flex items-center justify-center font-bold shadow-md shadow-[#E03126]/25">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                Nueva Prédica o Estudio
              </h2>
              <p className="text-xs text-[#8E8E93] font-normal mt-0.5">
                Define el tema, el pasaje bíblico central y la estructura inicial
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

        {/* 2. Cuerpo del Formulario Organizado */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(88vh-80px)] scrollbar-none">
          
          {/* SECCIÓN 1: TEMA BÍBLICO AL QUE PERTENECE */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen size={12} className="text-[#8E8E93]" />
              <span>Tema Bíblico al que pertenece:</span>
            </label>

            {/* Chips de temas bíblicos limpios y ordenados */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {topics.map((t) => {
                const isSelected = selectedTopicId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTopicId(t.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
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

          {/* SECCIÓN 2: TÍTULO DEL MENSAJE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">
              Título del Mensaje *
            </label>
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

          {/* SECCIÓN 3: SUBTÍTULO O PROPÓSITO + FECHA */}
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

          {/* SECCIÓN 4: APLICAR PASAJE CENTRAL (OPCIONAL) */}
          <div className="bg-[#242426]/70 rounded-2xl border border-white/[0.06] p-4 space-y-3.5">
            {/* Cabecera del bloque */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 text-[#E03126]">
                  <Quote size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Aplicar Pasaje Central (Opcional)
                  </h3>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug">
                    Puedes aplicar una cita ahora o dejarla para aplicarla en el estudio
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
                <span>Pasajes Sugeridos</span>
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
                rows={3}
                className="w-full bg-[#1C1C1E] focus:bg-[#1C1C1E] border border-white/[0.08] focus:border-white/20 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-500 leading-relaxed outline-none resize-none transition-all"
              />
            </div>
          </div>

          {/* SECCIÓN 5: PLANTILLA INICIAL DEL BOSQUEJO */}
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
                  <h4 className={`text-xs font-bold ${template === 'clasico' ? 'text-[#1C1C1E]' : 'text-white'}`}>
                    Clásico Expositivo
                  </h4>
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
                  <h4 className={`text-xs font-bold ${template === 'tematico' ? 'text-[#1C1C1E]' : 'text-white'}`}>
                    Temático Dinámico
                  </h4>
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
                  <h4 className={`text-xs font-bold ${template === 'blanco' ? 'text-[#1C1C1E]' : 'text-white'}`}>
                    Lienzo en Blanco
                  </h4>
                  <p className={`text-[11px] mt-1 leading-snug ${template === 'blanco' ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
                    Empieza desde cero con tus propios puntos
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Footer de Acciones con Botones Cancelar y Crear */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2.5 bg-[#E03126] hover:bg-[#C9271D] disabled:opacity-40 disabled:hover:bg-[#E03126] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#E03126]/20 active:scale-95 flex items-center gap-1.5"
            >
              <FileText size={14} />
              <span>Crear Prédica</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateStudyModal;
