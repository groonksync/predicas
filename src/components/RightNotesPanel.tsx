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
  ChevronUp,
  ChevronDown,
  Copy,
  BookOpen,
  Lightbulb,
  Target
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
  const [activeTab, setActiveTab] = useState<PanelTab>('notas');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [selectedRefVerse, setSelectedRefVerse] = useState<BibleVerse | null>(null);
  const [copiedVerseId, setCopiedVerseId] = useState<string | null>(null);

  const exegesisTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTag, setNewNoteTag] = useState<QuickNote['tag']>('Recordatorio');

  const availableTags: Array<NonNullable<QuickNote['tag']>> = [
    'Recordatorio',
    'Énfasis',
    'Pausa',
    'Cita',
    'Llamado',
  ];

  const handleCopyVerse = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVerseId(id);
    setTimeout(() => setCopiedVerseId(null), 1800);
  };

  const getAllVerses = (): BibleVerse[] => {
    const list: BibleVerse[] = [];
    if (study.mainVerse?.reference) {
      list.push(study.mainVerse);
    }
    list.push(...study.relatedVerses);
    return list;
  };

  const allVerses = getAllVerses();

  const currentSelectedVerse: BibleVerse | null = 
    selectedRefVerse || (study.mainVerse?.reference ? study.mainVerse : study.relatedVerses[0]) || null;

  const currentVerseIdx = currentSelectedVerse 
    ? allVerses.findIndex(v => v.id === currentSelectedVerse.id) 
    : 0;

  const handleStepVerse = (direction: 'prev' | 'next') => {
    if (allVerses.length === 0) return;
    const currentIdx = currentVerseIdx >= 0 ? currentVerseIdx : 0;
    let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= allVerses.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = allVerses.length - 1;
    setSelectedRefVerse(allVerses[nextIdx]);
  };

  const handleDeleteRelatedVerse = (verseId: string) => {
    onUpdateStudy({
      ...study,
      relatedVerses: study.relatedVerses.filter(v => v.id !== verseId)
    });
    if (selectedRefVerse?.id === verseId) {
      setSelectedRefVerse(study.mainVerse || null);
    }
  };

  const handleInsertVerseIntoNotes = (verse: BibleVerse) => {
    const quoteText = `\n\n> **${verse.reference} (${verse.version}):** “${verse.text}”\n`;
    onUpdateStudy({
      ...study,
      detailedNotes: (study.detailedNotes || '') + quoteText
    });
  };

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

  const handleInsertLexicon = (lang: 'Griego' | 'Hebreo') => {
    const template = `\n\n**${lang} — [Término/Palabra]:** *transliteración* (Strong)\n- **Significado literal:** \n- **Contexto teológico:** \n`;
    handleInsertFormat(template, '', '');
    setIsEditingNotes(true);
  };

  const handleInsertBlock = (type: 'ilustracion' | 'aplicacion') => {
    const snippet = type === 'ilustracion'
      ? `\n\n### Ilustración Homilética\n> Describe aquí la historia, metáfora o ejemplo cotidiano que conecta con la audiencia...\n`
      : `\n\n### Aplicación Práctica\n- **Para la mente:** ¿Qué verdad debemos creer hoy?\n- **Para el corazón:** ¿Qué actitud debemos entregar a Dios?\n- **Para las manos:** ¿Qué paso concreto daremos esta semana?\n`;
    handleInsertFormat(snippet, '', '');
    setIsEditingNotes(true);
  };

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

  const handleMovePoint = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= study.outlinePoints.length) return;
    const copy = [...study.outlinePoints];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    const renumbered = copy.map((p, i) => ({ ...p, number: i + 1 }));
    onUpdateStudy({ ...study, outlinePoints: renumbered });
  };

  const handleDeletePoint = (pointId: string) => {
    const filtered = study.outlinePoints
      .filter(p => p.id !== pointId)
      .map((p, idx) => ({ ...p, number: idx + 1 }));
    onUpdateStudy({ ...study, outlinePoints: filtered });
  };

  if (!isOpen) return null;

  const renderCitasBiblicas = () => {
    if (allVerses.length === 0) return null;

    return (
      <div className="p-4 bg-[#F6F7F9] dark:bg-[#202026] rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#E8E9EE] dark:bg-[#2C2C34] text-[#1C1C1E] dark:text-white flex items-center justify-center font-bold">
              <Bookmark size={13} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C1C1E] dark:text-white">
              Citas Bíblicas
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white dark:bg-[#18181C] text-[#6E6E77] dark:text-[#9E9EA8]">
              {allVerses.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-white dark:bg-[#18181C] p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => handleStepVerse('prev')}
                className="p-1 px-1.5 text-[#6E6E77] dark:text-[#9E9EA8] hover:text-black dark:hover:text-white rounded-lg transition-colors active:scale-95"
                title="Cita anterior"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-1.5 text-[10px] font-bold text-[#8E8E98] font-mono">
                {(currentVerseIdx >= 0 ? currentVerseIdx : 0) + 1}/{allVerses.length}
              </span>
              <button
                type="button"
                onClick={() => handleStepVerse('next')}
                className="p-1 px-1.5 text-[#6E6E77] dark:text-[#9E9EA8] hover:text-black dark:hover:text-white rounded-lg transition-colors active:scale-95"
                title="Cita siguiente"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {onOpenVerseModal && (
              <button
                type="button"
                onClick={onOpenVerseModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] active:scale-95 transition-all whitespace-nowrap"
                title="Añadir nueva cita bíblica"
              >
                <Plus size={12} />
                <span>Cita</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {study.mainVerse?.reference && (
            <button
              type="button"
              onClick={() => setSelectedRefVerse(study.mainVerse)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                currentSelectedVerse?.id === study.mainVerse.id
                  ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-xs'
                  : 'bg-white dark:bg-[#18181C] text-[#4A4A52] dark:text-[#C8C8D0] hover:bg-[#EAECEF] dark:hover:bg-[#282830]'
              }`}
            >
              <BookOpen size={12} />
              <span>{study.mainVerse.reference}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                currentSelectedVerse?.id === study.mainVerse.id
                  ? 'bg-white/20 text-white dark:bg-black/15 dark:text-[#121214]'
                  : 'bg-[#F0F1F4] dark:bg-[#26262E] text-[#6E6E77] dark:text-[#9E9EA8]'
              }`}>
                Base
              </span>
            </button>
          )}

          {study.relatedVerses.map((v) => {
            const isSelected = currentSelectedVerse?.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedRefVerse(v)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-xs'
                    : 'bg-white dark:bg-[#18181C] text-[#4A4A52] dark:text-[#C8C8D0] hover:bg-[#EAECEF] dark:hover:bg-[#282830]'
                }`}
              >
                <BookOpen size={12} className=" opacity-75" />
                <span>{v.reference}</span>
                <span className="text-[10px] opacity-65">({v.version})</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRelatedVerse(v.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-opacity ml-0.5"
                  title="Eliminar cita"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>

        {currentSelectedVerse && (
          <div className="p-3.5 bg-white dark:bg-[#18181C] rounded-xl space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#1C1C1E] dark:text-white">
                  {currentSelectedVerse.reference}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F2F3F6] dark:bg-[#25252C] text-[#6E6E77] dark:text-[#9E9EA8] font-bold">
                  {currentSelectedVerse.version}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleInsertVerseIntoNotes(currentSelectedVerse)}
                  className="text-[10px] font-bold text-[#5A5A64] dark:text-[#B4B4BE] hover:text-black dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F2F3F6] dark:bg-[#25252C] active:scale-95 transition-all whitespace-nowrap"
                  title="Pegar esta cita dentro de las notas"
                >
                  <FileText size={10} />
                  <span>Insertar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyVerse(currentSelectedVerse.text, currentSelectedVerse.id)}
                  className="text-[10px] font-bold text-[#5A5A64] dark:text-[#B4B4BE] hover:text-black dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F2F3F6] dark:bg-[#25252C] active:scale-95 transition-all whitespace-nowrap"
                >
                  {copiedVerseId === currentSelectedVerse.id ? <Check size={10} /> : <Copy size={10} />}
                  <span>{copiedVerseId === currentSelectedVerse.id ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs font-serif italic text-[#2C2C32] dark:text-[#D8D8E0] leading-relaxed select-text">
              “{currentSelectedVerse.text}”
            </p>

            {currentSelectedVerse.notes && (
              <p className="text-[11px] text-[#6E6E77] dark:text-[#9E9EA8] pt-1">
                <span className="font-bold text-[#1C1C1E] dark:text-white">Nota:</span> {currentSelectedVerse.notes}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-[460px] xl:w-[490px] flex-shrink-0 bg-white dark:bg-[#18181C] flex flex-col h-full select-none font-sans shadow-xl z-20 animate-slideRight">
      
      {/* 1. CABECERA PRINCIPAL SIN TRAZOS */}
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] flex items-center justify-center font-bold text-xs shadow-xs">
            <FileText size={15} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1C1C1E] dark:text-white leading-tight">
              Taller de Estudio y Notas
            </h3>
            <span className="text-[10px] text-[#7A7A85] font-medium">
              Exégesis, bosquejo y avisos de púlpito
            </span>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#5A5A64] hover:text-black dark:text-[#A0A0AB] dark:hover:text-white bg-[#F2F3F6] hover:bg-[#E6E8EC] dark:bg-[#232329] dark:hover:bg-[#2C2C33] transition-all active:scale-95 whitespace-nowrap"
          title="Ocultar panel lateral"
        >
          <span>Ocultar</span>
          <X size={13} />
        </button>
      </div>

      {/* 2. PESTAÑAS SUPERIORES COMPACTAS SIN TRAZOS */}
      <div className="px-4 pb-2">
        <div className="flex bg-[#F2F3F6] dark:bg-[#222228] p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('notas')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notas'
                ? 'bg-white dark:bg-[#18181C] text-[#1C1C1E] dark:text-white shadow-xs'
                : 'text-[#6E6E77] dark:text-[#9E9EA8] hover:text-black dark:hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>Exégesis</span>
          </button>

          <button
            onClick={() => setActiveTab('bosquejo')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'bosquejo'
                ? 'bg-white dark:bg-[#18181C] text-[#1C1C1E] dark:text-white shadow-xs'
                : 'text-[#6E6E77] dark:text-[#9E9EA8] hover:text-black dark:hover:text-white'
            }`}
          >
            <ListOrdered size={13} />
            <span>Bosquejo ({study.outlinePoints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('avisos')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'avisos'
                ? 'bg-white dark:bg-[#18181C] text-[#1C1C1E] dark:text-white shadow-xs'
                : 'text-[#6E6E77] dark:text-[#9E9EA8] hover:text-black dark:hover:text-white'
            }`}
          >
            <StickyNote size={13} />
            <span>Avisos ({study.quickNotes.filter(n => !n.isArchived).length})</span>
          </button>
        </div>
      </div>

      {/* 3. CONTENIDO SEGÚN PESTAÑA */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-none">
        
        {/* PESTAÑA 1: NOTAS EXEGÉTICAS */}
        {activeTab === 'notas' && (
          <div className="space-y-4">
            {renderCitasBiblicas()}

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A85]">
                  Apuntes Teológicos
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInsertLexicon('Griego')}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#F2F3F6] hover:bg-[#E6E8EC] dark:bg-[#232329] dark:hover:bg-[#2C2C33] text-[#1C1C1E] dark:text-white transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
                  >
                    <BookA size={12} />
                    <span>+ Griego</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertLexicon('Hebreo')}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#F2F3F6] hover:bg-[#E6E8EC] dark:bg-[#232329] dark:hover:bg-[#2C2C33] text-[#1C1C1E] dark:text-white transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
                  >
                    <BookA size={12} />
                    <span>+ Hebreo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertBlock('ilustracion')}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#F2F3F6] hover:bg-[#E6E8EC] dark:bg-[#232329] dark:hover:bg-[#2C2C33] text-[#1C1C1E] dark:text-white transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
                    title="Insertar bloque de ilustración"
                  >
                    <Lightbulb size={12} />
                    <span>+ Ilustración</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertBlock('aplicacion')}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#F2F3F6] hover:bg-[#E6E8EC] dark:bg-[#232329] dark:hover:bg-[#2C2C33] text-[#1C1C1E] dark:text-white transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
                    title="Insertar bloque de aplicación práctica"
                  >
                    <Target size={12} />
                    <span>+ Aplicación</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
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

              {isEditingNotes && (
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#F2F3F6] dark:bg-[#222228] rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('**', '**', 'negrita')}
                    className="p-1.5 rounded-lg text-[#5A5A64] dark:text-[#B4B4BE] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                    title="Negrita"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('*', '*', 'cursiva')}
                    className="p-1.5 rounded-lg text-[#5A5A64] dark:text-[#B4B4BE] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                    title="Cursiva"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('\n### ', '\n', 'Subtítulo')}
                    className="p-1.5 rounded-lg text-[#5A5A64] dark:text-[#B4B4BE] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                    title="Encabezado"
                  >
                    <Heading size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('==', '==', 'texto clave')}
                    className="p-1.5 rounded-lg text-[#5A5A64] dark:text-[#B4B4BE] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                    title="Resaltado"
                  >
                    <Highlighter size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('\n- ', '', 'Elemento')}
                    className="p-1.5 rounded-lg text-[#5A5A64] dark:text-[#B4B4BE] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                    title="Viñeta"
                  >
                    <List size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('\n> "', '"', 'Cita teológica')}
                    className="p-1.5 rounded-lg text-[#5A5A64] dark:text-[#B4B4BE] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                    title="Cita"
                  >
                    <Quote size={13} />
                  </button>
                </div>
              )}

              {isEditingNotes ? (
                <textarea
                  ref={exegesisTextareaRef}
                  value={study.detailedNotes}
                  onChange={(e) => onUpdateStudy({ ...study, detailedNotes: e.target.value })}
                  rows={14}
                  className="w-full text-xs sm:text-sm font-sans leading-relaxed text-[#1C1C1E] dark:text-[#E5E5EA] bg-[#F6F7F9] dark:bg-[#202026] p-4 rounded-2xl resize-y focus:outline-none"
                  placeholder="Escribe aquí el estudio de palabras griegas/hebreas, trasfondo teológico, notas exegéticas o reflexiones..."
                  autoFocus
                />
              ) : (
                <div 
                  onClick={() => setIsEditingNotes(true)}
                  className="w-full p-4 bg-[#F6F7F9] dark:bg-[#202026] rounded-2xl cursor-text min-h-[220px]"
                >
                  {study.detailedNotes?.trim() ? (
                    <div className="text-xs sm:text-sm font-sans leading-relaxed text-[#1C1C1E] dark:text-[#E5E5EA] select-text">
                      <MarkdownRenderer content={study.detailedNotes} />
                    </div>
                  ) : (
                    <div className="py-10 text-center text-xs text-[#7A7A85] space-y-2">
                      <p>No hay notas exegéticas escritas aún.</p>
                      <span className="inline-block text-[#1C1C1E] dark:text-white font-bold">
                        Toca aquí o usa los botones superiores para añadir términos en Griego o notas
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: BOSQUEJO HOMILÉTICO */}
        {activeTab === 'bosquejo' && (
          <div className="space-y-4">
            {renderCitasBiblicas()}

            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7A85]">
                Puntos del Bosquejo ({study.outlinePoints.length})
              </span>
              <button
                type="button"
                onClick={handleAddOutlinePoint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] active:scale-95 transition-all whitespace-nowrap"
              >
                <Plus size={13} />
                <span>Añadir Punto</span>
              </button>
            </div>

            <div className="space-y-3">
              {study.outlinePoints.map((point, idx) => (
                <div
                  key={point.id}
                  className="bg-[#F6F7F9] dark:bg-[#202026] rounded-2xl p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {point.number}
                      </span>
                      <input
                        type="text"
                        value={point.title}
                        onChange={(e) => handleUpdatePoint(point.id, { title: e.target.value })}
                        placeholder="Título del punto..."
                        className="w-full font-bold text-xs sm:text-sm bg-transparent outline-none text-[#1C1C1E] dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMovePoint(idx, 'up')}
                        className="p-1 text-[#7A7A85] hover:text-black dark:hover:text-white disabled:opacity-25 rounded-lg"
                        title="Subir punto"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === study.outlinePoints.length - 1}
                        onClick={() => handleMovePoint(idx, 'down')}
                        className="p-1 text-[#7A7A85] hover:text-black dark:hover:text-white disabled:opacity-25 rounded-lg"
                        title="Bajar punto"
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePoint(point.id)}
                        className="p-1 text-[#7A7A85] hover:text-black dark:hover:text-white rounded-lg"
                        title="Eliminar punto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={point.scriptureRef || ''}
                    onChange={(e) => handleUpdatePoint(point.id, { scriptureRef: e.target.value })}
                    placeholder="Cita bíblica de respaldo (ej. Juan 3:16)..."
                    className="w-full text-xs font-mono bg-white dark:bg-[#18181C] px-3 py-1.5 rounded-xl text-[#4A4A52] dark:text-[#C8C8D0] outline-none"
                  />

                  <textarea
                    value={point.content}
                    onChange={(e) => handleUpdatePoint(point.id, { content: e.target.value })}
                    rows={3}
                    className="w-full text-xs leading-relaxed bg-white dark:bg-[#18181C] p-3 rounded-xl text-[#1C1C1E] dark:text-[#E5E5EA] outline-none resize-y"
                    placeholder="Contenido, explicación y aplicación..."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: AVISOS Y RECORDATORIOS DE PÚLPITO */}
        {activeTab === 'avisos' && (
          <div className="space-y-4">
            <form onSubmit={handleAddQuickNote} className="p-4 bg-[#F6F7F9] dark:bg-[#202026] rounded-2xl space-y-3">
              <input
                type="text"
                placeholder="Escribe un recordatorio o pausa (ej. Hacer llamado al final)..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full text-xs p-3 bg-white dark:bg-[#18181C] rounded-xl text-[#1C1C1E] dark:text-white outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewNoteTag(tag)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                        newNoteTag === tag
                          ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]'
                          : 'bg-white dark:bg-[#18181C] text-[#6E6E77] dark:text-[#9E9EA8]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] text-xs font-bold rounded-xl whitespace-nowrap"
                >
                  Añadir
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {study.quickNotes.map(n => (
                <div
                  key={n.id}
                  className="p-3.5 bg-[#F6F7F9] dark:bg-[#202026] rounded-2xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] whitespace-nowrap">
                      {n.tag || 'Nota'}
                    </span>
                    <span className="text-xs text-[#1C1C1E] dark:text-[#E5E5EA] truncate font-medium">
                      {n.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteQuickNote(n.id)}
                    className="p-1.5 text-[#7A7A85] hover:text-black dark:hover:text-white rounded-lg"
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
