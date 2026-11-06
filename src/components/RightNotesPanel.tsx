import React, { useState, useRef } from 'react';
import { 
  FileText, 
  StickyNote, 
  ListOrdered, 
  Plus, 
  Trash2, 
  Bold, 
  Italic, 
  Heading, 
  List, 
  Quote, 
  Highlighter, 
  BookA, 
  Edit3, 
  X,
  Check,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  BookOpen
} from 'lucide-react';
import { Study, OutlinePoint, QuickNote, BibleVerse } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface RightNotesPanelProps {
  study: Study;
  onUpdateStudy: (updated: Study) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenVerseModal?: () => void;
}

type PanelTab = 'notas' | 'bosquejo' | 'avisos';

export const RightNotesPanel: React.FC<RightNotesPanelProps> = ({
  study,
  onUpdateStudy,
  isOpen,
  onToggle,
  onOpenVerseModal,
}) => {
  // Pestaña activa: por defecto 'notas'
  const [activeTab, setActiveTab] = useState<PanelTab>('notas');

  // Modo edición vs visualización formateada: por defecto false (ver formateado primero)
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Cita de referencia seleccionada para inspección rápida
  const [selectedRefVerse, setSelectedRefVerse] = useState<BibleVerse | null>(null);
  const [copiedVerseId, setCopiedVerseId] = useState<string | null>(null);

  // Ref para el textarea de notas exegéticas para manipulación precisa de selección
  const exegesisTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Estados de notas rápidas
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTag, setNewNoteTag] = useState<QuickNote['tag']>('Recordatorio');

  const availableTags: Array<NonNullable<QuickNote['tag']>> = [
    'Recordatorio',
    'Énfasis',
    'Pausa',
    'Cita',
    'Llamado',
  ];

  // Copiar cita al portapapeles
  const handleCopyVerse = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVerseId(id);
    setTimeout(() => setCopiedVerseId(null), 1800);
  };

  // Lista unificada de citas bíblicas (Base + Referencias)
  const getAllVerses = (): BibleVerse[] => {
    const list: BibleVerse[] = [];
    if (study.mainVerse?.reference) {
      list.push(study.mainVerse);
    }
    list.push(...study.relatedVerses);
    return list;
  };

  const allVerses = getAllVerses();

  // Versículo actualmente seleccionado para lectura
  const currentSelectedVerse: BibleVerse | null = 
    selectedRefVerse || (study.mainVerse?.reference ? study.mainVerse : study.relatedVerses[0]) || null;

  // Índice actual para el stepper numérico
  const currentVerseIdx = currentSelectedVerse 
    ? allVerses.findIndex(v => v.id === currentSelectedVerse.id) 
    : 0;

  // Navegación escalonada sin cortes (Anterior / Siguiente)
  const handleStepVerse = (direction: 'prev' | 'next') => {
    if (allVerses.length === 0) return;
    const currentIdx = currentVerseIdx >= 0 ? currentVerseIdx : 0;
    let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= allVerses.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = allVerses.length - 1;
    setSelectedRefVerse(allVerses[nextIdx]);
  };

  // Eliminar cita de apoyo
  const handleDeleteRelatedVerse = (verseId: string) => {
    onUpdateStudy({
      ...study,
      relatedVerses: study.relatedVerses.filter(v => v.id !== verseId)
    });
    if (selectedRefVerse?.id === verseId) {
      setSelectedRefVerse(study.mainVerse || null);
    }
  };

  // Insertar cita seleccionada en el texto de notas
  const handleInsertVerseIntoNotes = (verse: BibleVerse) => {
    const quoteText = `\n\n> **${verse.reference} (${verse.version}):** “${verse.text}”\n`;
    onUpdateStudy({
      ...study,
      detailedNotes: (study.detailedNotes || '') + quoteText
    });
  };

  // Inserción de formato y plantillas
  const handleInsertFormat = (before: string, after: string = '', defaultPlaceholder: string = '') => {
    const textarea = exegesisTextareaRef.current;
    const currentNotes = study.detailedNotes || '';

    if (!textarea) {
      onUpdateStudy({
        ...study,
        detailedNotes: currentNotes + before + defaultPlaceholder + after
      });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentNotes.substring(start, end);
    const textToInsert = selectedText || defaultPlaceholder;

    const newContent = 
      currentNotes.substring(0, start) +
      before +
      textToInsert +
      after +
      currentNotes.substring(end);

    onUpdateStudy({
      ...study,
      detailedNotes: newContent
    });

    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + before.length;
      const newCursorEnd = newCursorStart + textToInsert.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 10);
  };

  // Plantilla rápida de Léxico Griego o Hebreo
  const handleInsertLexicon = (lang: 'Griego' | 'Hebreo') => {
    const template = `\n\n**${lang} — [Término/Palabra]:** *transliteración* (Strong)\n- **Significado literal:** \n- **Contexto teológico:** \n`;
    handleInsertFormat(template, '', '');
    setIsEditingNotes(true);
  };

  // Manejo de notas rápidas
  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      tag: newNoteTag,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    onUpdateStudy({
      ...study,
      quickNotes: [newNote, ...study.quickNotes]
    });
    setNewNoteText('');
  };

  const deleteQuickNote = (id: string) => {
    onUpdateStudy({
      ...study,
      quickNotes: study.quickNotes.filter(n => n.id !== id)
    });
  };

  // Manejo del Bosquejo
  const handleAddOutlinePoint = () => {
    const newNumber = (study.outlinePoints.length || 0) + 1;
    const newPoint: OutlinePoint = {
      id: `point-${Date.now()}`,
      number: newNumber,
      title: `Punto ${newNumber}: Nuevo Principio`,
      scriptureRef: '',
      content: 'Escribe aquí la base, explicación y aplicación práctica...'
    };
    onUpdateStudy({
      ...study,
      outlinePoints: [...study.outlinePoints, newPoint]
    });
  };

  const handleUpdatePoint = (pointId: string, updates: Partial<OutlinePoint>) => {
    const updated = study.outlinePoints.map(p => 
      p.id === pointId ? { ...p, ...updates } : p
    );
    onUpdateStudy({ ...study, outlinePoints: updated });
  };

  const handleDeletePoint = (pointId: string) => {
    const filtered = study.outlinePoints
      .filter(p => p.id !== pointId)
      .map((p, idx) => ({ ...p, number: idx + 1 }));
    onUpdateStudy({ ...study, outlinePoints: filtered });
  };

  if (!isOpen) return null;

  // Componente de Citas Bíblicas de Referencia (Diseño Ultra Limpio, Profesional y Sin Cortes)
  const renderCitasBiblicas = () => {
    if (allVerses.length === 0) return null;

    return (
      <div className="p-3.5 bg-white dark:bg-[#1C1C1F] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
        {/* Cabecera con título, conteo, stepper y botón añadir */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Bookmark size={13} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Citas Bíblicas de Referencia
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              {allVerses.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Stepper de navegación < y > */}
            <div className="flex items-center bg-black/[0.04] dark:bg-[#252528] p-0.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-xs">
              <button
                type="button"
                onClick={() => handleStepVerse('prev')}
                className="p-1 px-1.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg transition-colors active:scale-95"
                title="Cita anterior"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-1 text-[10px] font-bold text-neutral-400 font-mono">
                {(currentVerseIdx >= 0 ? currentVerseIdx : 0) + 1}/{allVerses.length}
              </span>
              <button
                type="button"
                onClick={() => handleStepVerse('next')}
                className="p-1 px-1.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg transition-colors active:scale-95"
                title="Cita siguiente"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {onOpenVerseModal && (
              <button
                type="button"
                onClick={onOpenVerseModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold text-white bg-[#E03126] hover:bg-[#C92A20] active:scale-95 transition-all shadow-xs border-0"
                title="Añadir nueva cita bíblica"
              >
                <Bookmark size={11} />
                <span>Cita</span>
              </button>
            )}
          </div>
        </div>

        {/* Cuadrícula limpia y fluida de citas (TODAS visibles, NUNCA cortadas) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Pasaje Base Central */}
          {study.mainVerse?.reference && (
            <button
              type="button"
              onClick={() => setSelectedRefVerse(study.mainVerse)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                currentSelectedVerse?.id === study.mainVerse.id
                  ? 'bg-[#E03126] text-white border-[#E03126] shadow-xs'
                  : 'bg-black/[0.03] dark:bg-[#252528] text-slate-800 dark:text-neutral-200 border-black/[0.05] dark:border-white/[0.08] hover:border-[#E03126]/40'
              }`}
            >
              <BookOpen size={12} className={currentSelectedVerse?.id === study.mainVerse.id ? 'text-white' : 'text-[#E03126]'} />
              <span>{study.mainVerse.reference}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                currentSelectedVerse?.id === study.mainVerse.id ? 'bg-white/20 text-white' : 'bg-[#E03126]/10 text-[#E03126]'
              }`}>
                Base
              </span>
            </button>
          )}

          {/* Citas de apoyo */}
          {study.relatedVerses.map((v) => {
            const isSelected = currentSelectedVerse?.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedRefVerse(v)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-black/[0.03] dark:bg-[#252528] text-slate-800 dark:text-neutral-200 border-black/[0.05] dark:border-white/[0.08] hover:border-purple-500/40'
                }`}
              >
                <BookOpen size={12} className={isSelected ? 'text-white' : 'text-neutral-400'} />
                <span>{v.reference}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-neutral-400 font-semibold'}`}>
                  ({v.version})
                </span>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRelatedVerse(v.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-opacity ml-0.5"
                  title="Eliminar cita"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tarjeta de Lectura Exegética de la Cita Seleccionada */}
        {currentSelectedVerse && (
          <div className="p-3 bg-black/[0.02] dark:bg-[#232326] rounded-xl border border-black/[0.05] dark:border-white/[0.07] space-y-1.5 animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {currentSelectedVerse.reference}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.08] text-neutral-400 font-bold">
                  {currentSelectedVerse.version}
                </span>
                {currentSelectedVerse.id === study.mainVerse?.id && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase bg-[#E03126]/10 text-[#E03126]">
                    Pasaje Base
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertVerseIntoNotes(currentSelectedVerse)}
                  className="text-[10px] font-bold text-neutral-500 hover:text-black dark:text-neutral-300 dark:hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.06] active:scale-95 transition-all"
                  title="Pegar esta cita dentro de las notas"
                >
                  <FileText size={10} />
                  <span>Insertar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyVerse(currentSelectedVerse.text, currentSelectedVerse.id)}
                  className="text-[10px] font-bold text-neutral-500 hover:text-black dark:text-neutral-300 dark:hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.06] active:scale-95 transition-all"
                >
                  {copiedVerseId === currentSelectedVerse.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                  <span>{copiedVerseId === currentSelectedVerse.id ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs font-serif italic text-slate-800 dark:text-neutral-200 leading-relaxed select-text">
              “{currentSelectedVerse.text}”
            </p>

            {currentSelectedVerse.notes && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1 border-t border-black/[0.03] dark:border-white/[0.05]">
                <span className="font-bold text-neutral-700 dark:text-neutral-300">Nota:</span> {currentSelectedVerse.notes}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-[460px] xl:w-[480px] flex-shrink-0 bg-white dark:bg-[#18181A] border-l border-black/[0.06] dark:border-white/[0.08] flex flex-col h-full select-none font-sans shadow-2xl z-20 animate-slideRight">
      
      {/* 1. CABECERA PRINCIPAL PEGADA AL TOPE (Sin espacios vacíos arriba) */}
      <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.07] flex items-center justify-between gap-3 bg-white/95 dark:bg-[#18181A]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#E03126] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <FileText size={15} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Notas y Apuntes
            </h3>
            <span className="text-[10px] text-[#8E8E93] font-medium">
              Panel derecho de estudio
            </span>
          </div>
        </div>

        {/* Botón para ocultar y recuperar el 100% de la pantalla */}
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] transition-all active:scale-95"
          title="Ocultar panel lateral (cerrar)"
        >
          <span>Ocultar</span>
          <X size={13} />
        </button>
      </div>

      {/* 2. PESTAÑAS SUPERIORES COMPACTAS */}
      <div className="px-3 py-1.5 border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="flex bg-black/[0.03] dark:bg-[#242427] p-1 rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
          <button
            onClick={() => setActiveTab('notas')}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'notas'
                ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <FileText size={12} />
            <span>Notas y Exégesis</span>
          </button>

          <button
            onClick={() => setActiveTab('bosquejo')}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'bosquejo'
                ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <ListOrdered size={12} />
            <span>Bosquejo ({study.outlinePoints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('avisos')}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'avisos'
                ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <StickyNote size={12} />
            <span>Avisos ({study.quickNotes.filter(n => !n.isArchived).length})</span>
          </button>
        </div>
      </div>

      {/* 3. CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-none">
        
        {/* ============================================================== */}
        {/* PESTAÑA 1: NOTAS EXEGÉTICAS Y APUNTES                          */}
        {/* ============================================================== */}
        {activeTab === 'notas' && (
          <div className="space-y-3.5">
            
            {/* SECCIÓN A: CITAS BÍBLICAS DE REFERENCIA (POSICIONADAS ARRIBA) */}
            {renderCitasBiblicas()}

            {/* SECCIÓN B: NOTAS EXEGÉTICAS O APUNTES TEOLÓGICOS (JUSTO DEBAJO) */}
            <div className="space-y-2.5">
              
              {/* Barra de cabecera con botones sólidos y leve circunferencia */}
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <FileText size={15} className="text-[#E03126]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Notas Exegéticas y Apuntes
                  </h4>
                </div>

                {/* Botones +Griego (Azul sólido), +Hebreo (Verde sólido), Editar (Gris sólido) con texto blanco */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInsertLexicon('Griego')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5 border-0"
                    title="Insertar apunte de término en Griego"
                  >
                    <BookA size={13} />
                    <span>Griego</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertLexicon('Hebreo')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5 border-0"
                    title="Insertar apunte de término en Hebreo"
                  >
                    <BookA size={13} />
                    <span>Hebreo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2C2C2E] hover:bg-[#38383B] text-white shadow-xs transition-all active:scale-95 flex items-center gap-1 border-0"
                  >
                    {isEditingNotes ? (
                      <>
                        <Check size={12} />
                        <span>Listo</span>
                      </>
                    ) : (
                      <>
                        <Edit3 size={12} />
                        <span>Editar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Barra de herramientas de formato (Solo al editar) */}
              {isEditingNotes && (
                <div className="flex flex-wrap items-center gap-1 p-1 bg-black/[0.03] dark:bg-[#202024] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('**', '**', 'negrita')}
                    className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.1]"
                    title="Negrita"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('*', '*', 'cursiva')}
                    className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.1]"
                    title="Cursiva"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('\n### ', '\n', 'Subtítulo')}
                    className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.1]"
                    title="Encabezado"
                  >
                    <Heading size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('==', '==', 'texto clave')}
                    className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.1]"
                    title="Resaltado"
                  >
                    <Highlighter size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('\n- ', '', 'Elemento')}
                    className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.1]"
                    title="Viñeta"
                  >
                    <List size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('\n> "', '"', 'Cita teológica')}
                    className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.1]"
                    title="Cita"
                  >
                    <Quote size={13} />
                  </button>
                </div>
              )}

              {/* Renderizado de Notas (Edición vs Formateado) con trazo sutil */}
              {isEditingNotes ? (
                <textarea
                  ref={exegesisTextareaRef}
                  value={study.detailedNotes}
                  onChange={(e) => onUpdateStudy({ ...study, detailedNotes: e.target.value })}
                  rows={14}
                  className="w-full text-xs sm:text-sm font-sans leading-relaxed text-slate-800 dark:text-neutral-200 bg-white dark:bg-[#1E1E21] p-3.5 rounded-2xl border border-black/[0.07] dark:border-white/[0.08] resize-y focus:outline-none focus:ring-1 focus:ring-[#E03126]"
                  placeholder="Escribe aquí el estudio de palabras griegas/hebreas, trasfondo teológico, notas exegéticas o reflexiones..."
                  autoFocus
                />
              ) : (
                <div 
                  onClick={() => setIsEditingNotes(true)}
                  className="w-full p-4 bg-white dark:bg-[#1E1E22] rounded-2xl border border-black/[0.05] dark:border-white/[0.07] shadow-xs cursor-text min-h-[220px]"
                >
                  {study.detailedNotes?.trim() ? (
                    <div className="text-xs sm:text-sm font-sans leading-relaxed text-slate-800 dark:text-neutral-200 select-text">
                      <MarkdownRenderer content={study.detailedNotes} />
                    </div>
                  ) : (
                    <div className="py-10 text-center text-xs text-neutral-400 space-y-2">
                      <p>No hay notas exegéticas escritas aún.</p>
                      <span className="inline-block text-[#E03126] font-bold">
                        Toca aquí o usa los botones superiores para añadir términos en Griego o notas
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: BOSQUEJO HOMILÉTICO (CON CITAS DE REFERENCIA ARRIBA) */}
        {/* ============================================================== */}
        {activeTab === 'bosquejo' && (
          <div className="space-y-3.5">
            
            {/* Citas bíblicas de referencia POSICIONADAS ARRIBA DE LOS PUNTOS DEL BOSQUEJO */}
            {renderCitasBiblicas()}

            {/* Puntos del Bosquejo */}
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Puntos del Bosquejo ({study.outlinePoints.length})
              </span>
              <button
                type="button"
                onClick={handleAddOutlinePoint}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E03126] text-white hover:bg-[#C92A20] active:scale-95 transition-all shadow-xs border-0"
              >
                <Plus size={13} />
                <span>Añadir Punto</span>
              </button>
            </div>

            <div className="space-y-3">
              {study.outlinePoints.map((point) => (
                <div
                  key={point.id}
                  className="bg-white dark:bg-[#1E1E22] rounded-2xl p-3.5 border border-black/[0.05] dark:border-white/[0.07] shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] font-bold text-xs flex items-center justify-center text-slate-800 dark:text-white flex-shrink-0">
                        {point.number}
                      </span>
                      <input
                        type="text"
                        value={point.title}
                        onChange={(e) => handleUpdatePoint(point.id, { title: e.target.value })}
                        placeholder="Título del punto..."
                        className="w-full font-bold text-xs sm:text-sm bg-transparent border-b border-transparent hover:border-black/10 dark:hover:border-white/10 focus:border-[#E03126] outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePoint(point.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 rounded-lg"
                      title="Eliminar punto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={point.scriptureRef || ''}
                    onChange={(e) => handleUpdatePoint(point.id, { scriptureRef: e.target.value })}
                    placeholder="Cita bíblica base (ej. Juan 3:16)..."
                    className="w-full text-xs font-mono bg-black/[0.02] dark:bg-[#252528] px-2.5 py-1 rounded-lg text-slate-700 dark:text-neutral-300 outline-none"
                  />

                  <textarea
                    value={point.content}
                    onChange={(e) => handleUpdatePoint(point.id, { content: e.target.value })}
                    rows={3}
                    className="w-full text-xs leading-relaxed bg-black/[0.01] dark:bg-[#252528] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-slate-800 dark:text-neutral-200 outline-none resize-y"
                    placeholder="Contenido, explicación y aplicación..."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: AVISOS Y RECORDATORIOS DE PÚLPITO                   */}
        {/* ============================================================== */}
        {activeTab === 'avisos' && (
          <div className="space-y-3.5">
            
            {/* Formulario rápido para nuevo aviso */}
            <form onSubmit={handleAddQuickNote} className="p-3 bg-white dark:bg-[#1E1E22] rounded-2xl border border-black/[0.05] dark:border-white/[0.07] space-y-2">
              <input
                type="text"
                placeholder="Escribe un recordatorio o pausa (ej. Pausa de silencio)..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full text-xs p-2.5 bg-black/[0.02] dark:bg-[#252528] rounded-xl text-slate-900 dark:text-white outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewNoteTag(tag)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                        newNoteTag === tag
                          ? 'bg-[#E03126] text-white'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-500'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs font-bold rounded-xl border-0"
                >
                  Añadir
                </button>
              </div>
            </form>

            {/* Lista de notas rápidas */}
            <div className="space-y-2">
              {study.quickNotes.map(n => (
                <div
                  key={n.id}
                  className="p-3 bg-white dark:bg-[#1E1E22] rounded-2xl border border-black/[0.05] dark:border-white/[0.07] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300">
                      {n.tag || 'Nota'}
                    </span>
                    <span className="text-xs text-slate-800 dark:text-neutral-200 truncate font-medium">
                      {n.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteQuickNote(n.id)}
                    className="p-1 text-neutral-400 hover:text-red-500 rounded-lg"
                    title="Eliminar aviso"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};

export default RightNotesPanel;
