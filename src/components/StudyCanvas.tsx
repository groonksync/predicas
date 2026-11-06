import React, { useState, useRef } from 'react';
import { 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Edit2, 
  ZoomIn, 
  ZoomOut, 
  ArrowLeft, 
  Image as ImageIcon, 
  Maximize2, 
  Archive, 
  ArchiveRestore,
  BookOpen,
  Bookmark,
  ListOrdered,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  BookA,
  Edit3,
  Bold,
  Italic,
  Heading,
  List
} from 'lucide-react';
import { Study, BibleVerse, ResourceImage, ResourceVideo } from '../types';
import { BigPreview, PreviewItem } from './QuickAccess';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StudyCanvasProps {
  study: Study;
  onUpdateStudy: (updated: Study) => void;
  onOpenVerseModal: () => void;
  onOpenApplyMainVerse?: () => void;
  onOpenImagePreview: (imageUrl: string, title: string) => void;
  onToggleOutline?: () => void;
  isOutlineOpen?: boolean;
  onToggleArchiveStudy?: (studyId: string) => void;
  onDeleteStudy?: (studyId: string) => void;
}

export const StudyCanvas: React.FC<StudyCanvasProps> = ({
  study,
  onUpdateStudy,
  onOpenVerseModal,
  onOpenApplyMainVerse,
  onOpenImagePreview,
  onToggleOutline,
  isOutlineOpen,
  onToggleArchiveStudy,
  onDeleteStudy,
}) => {
  const [copiedVerseId, setCopiedVerseId] = useState<string | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Escala de lectura
  const [fontScale, setFontScale] = useState<number>(120);

  // Versículo activo en el lienzo: 'main' o verse.id
  const [activeVerseId, setActiveVerseId] = useState<string>('main');

  // MÓDULOS ACTIVOS EN EL LIENZO (Ocultar / Mostrar y aprovechar espacio completo)
  const [modules, setModules] = useState({
    pasaje: true,       // Pasaje bíblico central
    notas: true,        // Notas exegéticas y léxico (¡visible de inmediato!)
    citas: true,        // Citas bíblicas complementarias
    bosquejo: false,    // Bosquejo homilético (opcional en el lienzo o panel derecho)
  });

  const [activePreset, setActivePreset] = useState<'todo' | 'pasaje-notas' | 'pasaje-bosquejo' | 'solo-citas'>('pasaje-notas');

  // Modo edición de notas exegéticas dentro del lienzo
  const [isEditingCanvasNotes, setIsEditingCanvasNotes] = useState(false);
  const canvasNotesRef = useRef<HTMLTextAreaElement>(null);

  // Item proyectado a pantalla completa gigante
  const [projectedItem, setProjectedItem] = useState<PreviewItem | null>(null);

  // Formularios para nuevos recursos
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [newImgTitle, setNewImgTitle] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');

  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [newVidTitle, setNewVidTitle] = useState('');
  const [newVidUrl, setNewVidUrl] = useState('');
  const [newVidTime, setNewVidTime] = useState('');

  // Sección colapsable de recursos multimedia
  const [showMediaResources, setShowMediaResources] = useState<boolean>(false);

  // Video embed helper
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
      } else if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Copiar al portapapeles
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVerseId(id);
    setTimeout(() => setCopiedVerseId(null), 2000);
  };

  // Versículo actualmente seleccionado
  const isMainActive = activeVerseId === 'main';
  const currentActiveVerse: BibleVerse = isMainActive
    ? study.mainVerse
    : study.relatedVerses.find(v => v.id === activeVerseId) || study.mainVerse;

  // Lista ordenada de todos los versículos (Base + Referencias)
  const getAllVerses = () => {
    const list: BibleVerse[] = [];
    if (study.mainVerse?.reference) list.push({ ...study.mainVerse, id: 'main' });
    list.push(...study.relatedVerses);
    return list;
  };

  const getCurrentVerseIndex = () => {
    const all = getAllVerses();
    const idx = all.findIndex(v => v.id === activeVerseId);
    return idx >= 0 ? idx + 1 : 1;
  };

  const handleStepVerse = (dir: 'prev' | 'next') => {
    const all = getAllVerses();
    if (all.length === 0) return;
    const currentIndex = all.findIndex(v => v.id === activeVerseId);
    let nextIndex = 0;
    if (dir === 'next') {
      nextIndex = currentIndex < all.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : all.length - 1;
    }
    setActiveVerseId(all[nextIndex].id);
  };

  // Alternar módulos individuales
  const toggleModule = (mod: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  // Presets de visualización rápida
  const applyPreset = (presetKey: 'todo' | 'pasaje-notas' | 'pasaje-bosquejo' | 'solo-citas') => {
    setActivePreset(presetKey);
    if (presetKey === 'pasaje-notas') {
      setModules({
        pasaje: true,
        notas: true,
        citas: false,
        bosquejo: false,
      });
    } else if (presetKey === 'pasaje-bosquejo') {
      setModules({
        pasaje: true,
        notas: false,
        citas: true, // Citas bíblicas de referencia arriba del bosquejo
        bosquejo: true,
      });
    } else if (presetKey === 'solo-citas') {
      setModules({
        pasaje: false,
        notas: false,
        citas: true,
        bosquejo: false,
      });
    } else {
      // Todo
      setModules({
        pasaje: true,
        notas: true,
        citas: true,
        bosquejo: true,
      });
    }
  };

  // Eliminar cita complementaria
  const handleDeleteRelatedVerse = (verseId: string) => {
    if (activeVerseId === verseId) {
      setActiveVerseId('main');
    }
    onUpdateStudy({
      ...study,
      relatedVerses: study.relatedVerses.filter(v => v.id !== verseId)
    });
  };

  // Inserción de plantilla de Griego / Hebreo
  const handleInsertLexicon = (lang: 'Griego' | 'Hebreo') => {
    const template = `\n\n**${lang} — [Término/Palabra]:** *transliteración*\n- **Significado literal:** \n- **Aplicación teológica:** \n`;
    onUpdateStudy({
      ...study,
      detailedNotes: (study.detailedNotes || '') + template
    });
    setIsEditingCanvasNotes(true);
  };

  // Inserción de formato en notas del lienzo
  const handleInsertFormat = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = canvasNotesRef.current;
    const currentNotes = study.detailedNotes || '';

    if (!textarea) {
      onUpdateStudy({
        ...study,
        detailedNotes: currentNotes + before + placeholder + after
      });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentNotes.substring(start, end) || placeholder;

    const updated = currentNotes.substring(0, start) + before + selected + after + currentNotes.substring(end);
    onUpdateStudy({ ...study, detailedNotes: updated });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // Handlers multimedia
  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImgUrl.trim()) return;
    const newImage: ResourceImage = {
      id: `img-${Date.now()}`,
      title: newImgTitle.trim() || 'Imagen de estudio',
      url: newImgUrl.trim()
    };
    onUpdateStudy({ ...study, images: [...study.images, newImage] });
    setNewImgTitle('');
    setNewImgUrl('');
    setIsAddingImage(false);
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVidUrl.trim()) return;
    const newVideo: ResourceVideo = {
      id: `vid-${Date.now()}`,
      title: newVidTitle.trim() || 'Video de apoyo',
      url: newVidUrl.trim(),
      timestamp: newVidTime.trim()
    };
    onUpdateStudy({ ...study, videos: [...study.videos, newVideo] });
    setNewVidTitle('');
    setNewVidUrl('');
    setNewVidTime('');
    setIsAddingVideo(false);
  };

  const deleteImage = (id: string) => {
    onUpdateStudy({ ...study, images: study.images.filter(img => img.id !== id) });
  };

  const deleteVideo = (id: string) => {
    onUpdateStudy({ ...study, videos: study.videos.filter(v => v.id !== id) });
  };

  // ¿Solo están activos Pasaje y Notas?
  const isDuoPasajeNotas = modules.pasaje && modules.notas && !modules.citas && !modules.bosquejo;

  // 1. Render Lienzo Bíblico Central
  const renderPasajeCentral = () => (
    <section className="bg-[#1C1C1F] text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {currentActiveVerse.reference || 'Sin Pasaje Asignado'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/10 text-neutral-200 rounded-full">
              {currentActiveVerse.version}
            </span>
            {isMainActive ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#E03126] text-white rounded-full">
                Base Central
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/10 text-neutral-300 rounded-full">
                Cita de Apoyo
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {currentActiveVerse.text && (
              <button
                onClick={() => setProjectedItem({
                  id: currentActiveVerse.id,
                  kind: 'verse',
                  label: `${isMainActive ? 'Pasaje Base Central' : 'Cita de Apoyo'} · ${currentActiveVerse.version}`,
                  title: currentActiveVerse.reference,
                  body: currentActiveVerse.text
                })}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-200 text-[#141416] text-xs font-bold rounded-full transition-all active:scale-95 shadow-xs"
                title="Proyectar a pantalla completa gigante"
              >
                <Maximize2 size={12} />
                <span>Proyectar</span>
              </button>
            )}

            <button
              onClick={() => handleCopyText(currentActiveVerse.text, currentActiveVerse.id)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Copiar texto bíblico"
            >
              {copiedVerseId === currentActiveVerse.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>

            {isMainActive && onOpenApplyMainVerse && (
              <button
                onClick={onOpenApplyMainVerse}
                className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-full hover:bg-white/10 transition-colors font-semibold"
                title="Cambiar pasaje central"
              >
                Cambiar
              </button>
            )}
          </div>
        </div>

        <p className="text-xl sm:text-2xl font-serif leading-relaxed text-neutral-100 tracking-normal select-text">
          “{currentActiveVerse.text}”
        </p>
      </div>

      {currentActiveVerse.notes && (
        <div className="mt-4 pt-3 border-t border-white/[0.08] text-xs text-neutral-400 leading-relaxed">
          <span className="font-bold text-neutral-200">Nota:</span> {currentActiveVerse.notes}
        </div>
      )}
    </section>
  );

  // 2. Render Citas Bíblicas de Referencia (Diseño Ultra Limpio, Profesional, Sin Cortes de Tarjetas)
  const renderCitasBiblicasSection = () => (
    <section className="bg-white dark:bg-[#1C1C1F] rounded-2xl p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
      {/* Cabecera con título, contador, stepper y acción */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Bookmark size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Citas Bíblicas de Referencia
            </h3>
            <span className="text-[11px] text-[#8E8E93]">
              {study.relatedVerses.length + (study.mainVerse?.reference ? 1 : 0)} pasajes vinculados al estudio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stepper de navegación < y > para alternar entre citas sin cortes */}
          <div className="flex items-center bg-black/[0.04] dark:bg-[#252528] p-0.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] text-xs">
            <button
              type="button"
              onClick={() => handleStepVerse('prev')}
              className="p-1 px-2.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px] active:scale-95"
              title="Cita anterior"
            >
              <ChevronLeft size={13} />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <span className="px-2 text-[10px] font-bold text-neutral-400 font-mono">
              {getCurrentVerseIndex()} / {study.relatedVerses.length + (study.mainVerse?.reference ? 1 : 0)}
            </span>
            <button
              type="button"
              onClick={() => handleStepVerse('next')}
              className="p-1 px-2.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px] active:scale-95"
              title="Cita siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <button
            onClick={onOpenVerseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#E03126] hover:bg-[#C92A20] active:scale-95 transition-all shadow-xs border-0"
          >
            <Bookmark size={12} />
            <span>Añadir Cita</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula limpia de cápsulas de citas (Flex Wrap: NUNCA se cortan los cuadros) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Pasaje Base Central */}
        {study.mainVerse?.reference && (
          <button
            type="button"
            onClick={() => setActiveVerseId('main')}
            className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
              isMainActive
                ? 'bg-[#E03126] text-white border-[#E03126] shadow-xs'
                : 'bg-black/[0.03] dark:bg-[#252528] text-slate-800 dark:text-neutral-200 border-black/[0.05] dark:border-white/[0.08] hover:border-[#E03126]/40'
            }`}
          >
            <BookOpen size={13} className={isMainActive ? 'text-white' : 'text-[#E03126]'} />
            <span>{study.mainVerse.reference}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
              isMainActive ? 'bg-white/20 text-white' : 'bg-[#E03126]/10 text-[#E03126]'
            }`}>Base</span>
          </button>
        )}

        {/* Citas de apoyo */}
        {study.relatedVerses.map(verse => {
          const isSelected = activeVerseId === verse.id;
          return (
            <div
              key={verse.id}
              onClick={() => setActiveVerseId(verse.id)}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-black/[0.03] dark:bg-[#252528] text-slate-800 dark:text-neutral-200 border-black/[0.05] dark:border-white/[0.08] hover:border-purple-500/40'
              }`}
            >
              <BookOpen size={13} className={isSelected ? 'text-white' : 'text-neutral-400'} />
              <span>{verse.reference}</span>
              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-neutral-400 font-semibold'}`}>
                ({verse.version})
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRelatedVerse(verse.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-opacity ml-1"
                title="Eliminar cita"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Vista Previa Expandida del Pasaje Seleccionado */}
      {currentActiveVerse && (
        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-[#252528]/70 border border-black/[0.04] dark:border-white/[0.06] space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {currentActiveVerse.reference}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-neutral-400 font-bold">
                {currentActiveVerse.version}
              </span>
              {isMainActive && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#E03126]/10 text-[#E03126] font-extrabold uppercase">
                  Pasaje Base
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyText(currentActiveVerse.text, currentActiveVerse.id)}
                className="text-xs font-semibold text-neutral-500 hover:text-black dark:text-neutral-300 dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.05]"
              >
                {copiedVerseId === currentActiveVerse.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedVerseId === currentActiveVerse.id ? 'Copiado' : 'Copiar'}</span>
              </button>
              {currentActiveVerse.text && (
                <button
                  type="button"
                  onClick={() => setProjectedItem({
                    id: currentActiveVerse.id,
                    kind: 'verse',
                    label: `${isMainActive ? 'Pasaje Base Central' : 'Cita de Referencia'} · ${currentActiveVerse.version}`,
                    title: currentActiveVerse.reference,
                    body: currentActiveVerse.text
                  })}
                  className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-1 active:scale-95 shadow-xs"
                >
                  <Maximize2 size={12} />
                  <span>Proyectar</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-sm font-serif italic text-slate-800 dark:text-neutral-100 leading-relaxed select-text">
            “{currentActiveVerse.text}”
          </p>

          {currentActiveVerse.notes && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-1.5 border-t border-black/[0.03] dark:border-white/[0.05]">
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Nota teológica:</span> {currentActiveVerse.notes}
            </p>
          )}
        </div>
      )}
    </section>
  );

  // 3. Render Notas Exegéticas y Apuntes Teológicos
  const renderNotasExegeticas = () => (
    <section className="bg-white dark:bg-[#1C1C1F] rounded-3xl p-6 sm:p-7 border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/[0.05] dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <FileText size={17} className="text-[#E03126]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Notas Exegéticas y Apuntes Teológicos
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleInsertLexicon('Griego')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5 border-0"
              title="Insertar apunte de término en Griego"
            >
              <BookA size={13} />
              <span>Griego</span>
            </button>

            <button
              onClick={() => handleInsertLexicon('Hebreo')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5 border-0"
              title="Insertar apunte de término en Hebreo"
            >
              <BookA size={13} />
              <span>Hebreo</span>
            </button>
            
            <button
              onClick={() => setIsEditingCanvasNotes(!isEditingCanvasNotes)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2C2C2E] hover:bg-[#38383B] text-white shadow-xs transition-all active:scale-95 flex items-center gap-1 border-0"
            >
              {isEditingCanvasNotes ? (
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

        {/* Edición o Visualización Formateada */}
        {isEditingCanvasNotes ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-[#252528] rounded-xl">
              <button onClick={() => handleInsertFormat('**', '**', 'negrita')} className="p-1 rounded text-neutral-600 dark:text-neutral-300">
                <Bold size={13} />
              </button>
              <button onClick={() => handleInsertFormat('*', '*', 'cursiva')} className="p-1 rounded text-neutral-600 dark:text-neutral-300">
                <Italic size={13} />
              </button>
              <button onClick={() => handleInsertFormat('\n### ', '\n', 'Título')} className="p-1 rounded text-neutral-600 dark:text-neutral-300">
                <Heading size={13} />
              </button>
              <button onClick={() => handleInsertFormat('\n- ', '', 'Punto')} className="p-1 rounded text-neutral-600 dark:text-neutral-300">
                <List size={13} />
              </button>
            </div>
            <textarea
              ref={canvasNotesRef}
              value={study.detailedNotes}
              onChange={(e) => onUpdateStudy({ ...study, detailedNotes: e.target.value })}
              rows={8}
              className="w-full text-xs sm:text-sm font-sans leading-relaxed text-slate-800 dark:text-neutral-200 bg-black/[0.02] dark:bg-[#222225] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] outline-none"
              placeholder="Escribe el significado en el griego de fe, paz, justicia, notas teológicas..."
              autoFocus
            />
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingCanvasNotes(true)}
            className="text-sm font-sans leading-relaxed text-slate-800 dark:text-neutral-200 cursor-text select-text"
          >
            {study.detailedNotes?.trim() ? (
              <MarkdownRenderer content={study.detailedNotes} />
            ) : (
              <div className="py-6 text-center text-xs text-neutral-400">
                No hay notas escritas. Toca aquí para añadir significados en griego o reflexiones.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );

  // 4. Render Bosquejo Homilético
  const renderBosquejoSection = () => (
    <section className="bg-white dark:bg-[#1C1C1F] rounded-3xl p-6 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <ListOrdered size={16} className="text-[#8E8E93]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Puntos del Bosquejo ({study.outlinePoints.length})
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {study.outlinePoints.map(point => (
          <div key={point.id} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {point.title}
              </h4>
              {point.scriptureRef && (
                <span className="text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400">
                  {point.scriptureRef}
                </span>
              )}
            </div>
            {point.content && (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
                {point.content}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <main className={`flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28 mx-auto w-full transition-all font-sans select-none ${
      isDuoPasajeNotas ? 'max-w-6xl' : 'max-w-4xl'
    }`}>
      
      {/* 1. BARRA SUPERIOR DISCRETA (Zoom, Acciones y Botón de Notas) */}
      <div className="flex items-center justify-between gap-3 mb-4 bg-white/70 dark:bg-[#1C1C1F]/70 backdrop-blur-xl px-4 py-2 rounded-2xl border border-black/[0.05] dark:border-white/[0.06] shadow-xs">
        
        {/* Izquierda: Fecha, Estado y Zoom */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400">
            {study.date}
          </span>
          {study.isArchived && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              Archivado
            </span>
          )}

          {/* Stepper de zoom compacto */}
          <div className="flex items-center bg-black/[0.04] dark:bg-[#252528] rounded-full p-0.5 border border-black/[0.04] dark:border-white/[0.06] text-xs">
            <button
              onClick={() => setFontScale(Math.max(100, fontScale - 10))}
              className="p-1 px-2 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
              title="Reducir letra"
            >
              <ZoomOut size={12} className="inline mr-0.5" />
              <span>A-</span>
            </button>
            <span className="px-1 text-[11px] font-mono font-bold text-neutral-800 dark:text-white">
              {fontScale}%
            </span>
            <button
              onClick={() => setFontScale(Math.min(160, fontScale + 10))}
              className="p-1 px-2 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
              title="Aumentar letra"
            >
              <ZoomIn size={12} className="inline mr-0.5" />
              <span>A+</span>
            </button>
          </div>
        </div>

        {/* Derecha: Botón de Pasaje Base (si aplica) y Toggle del Panel Derecho */}
        <div className="flex items-center gap-2">
          {!isMainActive && (
            <button
              onClick={() => setActiveVerseId('main')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E03126] text-white text-xs font-bold active:scale-95 shadow-xs transition-all"
            >
              <ArrowLeft size={12} />
              <span>Pasaje Base</span>
            </button>
          )}

          {onToggleOutline && (
            <button
              onClick={onToggleOutline}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                isOutlineOpen
                  ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-xs'
                  : 'bg-black/[0.04] dark:bg-[#252528] text-slate-700 dark:text-neutral-300 hover:text-black dark:hover:text-white'
              }`}
              title={isOutlineOpen ? "Ocultar panel derecho de notas" : "Abrir notas y bosquejo a la derecha"}
            >
              <FileText size={13} />
              <span>{isOutlineOpen ? 'Ocultar Panel' : 'Panel de Notas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TÍTULO EDITORIAL LIMPIO */}
      <div className="mb-5 px-1">
        {isEditingHeader ? (
          <div className="space-y-3 p-5 rounded-3xl bg-white dark:bg-[#1C1C1F] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
            <input
              type="text"
              value={study.title}
              onChange={(e) => onUpdateStudy({ ...study, title: e.target.value })}
              placeholder="Título del mensaje..."
              className="w-full text-2xl font-black bg-black/[0.03] dark:bg-[#252528] p-3 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#E03126]"
            />
            <input
              type="text"
              value={study.subtitle}
              onChange={(e) => onUpdateStudy({ ...study, subtitle: e.target.value })}
              placeholder="Propósito o subtítulo..."
              className="w-full text-sm bg-black/[0.03] dark:bg-[#252528] p-3 rounded-2xl text-slate-800 dark:text-neutral-200 outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-4 py-1.5 text-xs font-bold bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] rounded-full"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {study.title}
                </h1>
                {study.subtitle && (
                  <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal leading-relaxed">
                    {study.subtitle}
                  </p>
                )}
              </div>

              {/* Acciones discretas */}
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-1">
                <button
                  onClick={() => setIsEditingHeader(true)}
                  className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 hover:text-black dark:hover:text-white"
                  title="Editar título"
                >
                  <Edit2 size={13} />
                </button>
                {onToggleArchiveStudy && (
                  <button
                    onClick={() => onToggleArchiveStudy(study.id)}
                    className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-400 hover:text-black dark:hover:text-white"
                    title={study.isArchived ? "Restaurar prédica" : "Archivar prédica"}
                  >
                    {study.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                  </button>
                )}
                {onDeleteStudy && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 rounded-full hover:bg-red-500/10 text-neutral-400 hover:text-red-500"
                    title="Eliminar prédica"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BARRA DE COORDINACIÓN MODULAR (Aprovechamiento 100% del ancho sin espacios vacíos a la derecha) */}
      <div className="mb-6 p-3 rounded-2xl bg-black/[0.02] dark:bg-[#1A1A1D] border border-black/[0.05] dark:border-white/[0.08] shadow-xs space-y-2.5 w-full">
        
        {/* Fila 1: Presets Rápidos en cuadrícula simétrica que ocupa todo el ancho */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full bg-black/[0.03] dark:bg-[#222225] p-1.5 rounded-xl border border-black/[0.03] dark:border-white/[0.05] text-xs">
          <button
            onClick={() => applyPreset('pasaje-notas')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 w-full text-center ${
              activePreset === 'pasaje-notas'
                ? 'bg-[#E03126] text-white shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
            title="Ver únicamente el Pasaje Central y las Notas Teológicas a pantalla completa"
          >
            <Sparkles size={13} />
            <span>Pasaje + Notas</span>
          </button>

          <button
            onClick={() => applyPreset('pasaje-bosquejo')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 w-full text-center ${
              activePreset === 'pasaje-bosquejo'
                ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Pasaje + Bosquejo</span>
          </button>

          <button
            onClick={() => applyPreset('solo-citas')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 w-full text-center ${
              activePreset === 'solo-citas'
                ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Solo Citas</span>
          </button>

          <button
            onClick={() => applyPreset('todo')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 w-full text-center ${
              activePreset === 'todo'
                ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Todo</span>
          </button>
        </div>

        {/* Fila 2: Interruptores individuales en cuadrícula simétrica que ocupa todo el ancho */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
          <button
            onClick={() => toggleModule('pasaje')}
            className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-0 shadow-xs active:scale-95 w-full ${
              modules.pasaje
                ? 'bg-blue-600 text-white'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            <span>Pasaje</span>
          </button>

          <button
            onClick={() => toggleModule('notas')}
            className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-0 shadow-xs active:scale-95 w-full ${
              modules.notas
                ? 'bg-[#E03126] text-white'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>Notas y Léxico</span>
          </button>

          <button
            onClick={() => toggleModule('citas')}
            className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-0 shadow-xs active:scale-95 w-full ${
              modules.citas
                ? 'bg-purple-600 text-white'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
            }`}
          >
            <Bookmark size={13} />
            <span>Citas ({study.relatedVerses.length})</span>
          </button>

          <button
            onClick={() => toggleModule('bosquejo')}
            className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-0 shadow-xs active:scale-95 w-full ${
              modules.bosquejo
                ? 'bg-emerald-600 text-white'
                : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
            }`}
          >
            <ListOrdered size={13} />
            <span>Bosquejo ({study.outlinePoints.length})</span>
          </button>
        </div>
      </div>

      <div style={{ fontSize: `${fontScale}%` }} className="transition-all duration-150 space-y-6">
        
        {/* ============================================================== */}
        {/* MÓDULOS PRINCIPALES (Ordenados: Pasaje -> Citas -> Notas -> Bosquejo) */}
        {/* ============================================================== */}
        {isDuoPasajeNotas ? (
          /* Si solo está activo Pasaje y Notas, vista paralela de 2 columnas */
          <div className="w-full grid gap-6 grid-cols-1 lg:grid-cols-2">
            {renderPasajeCentral()}
            {renderNotasExegeticas()}
          </div>
        ) : (
          /* Flujo Vertical Ordenado: Pasaje -> Citas Bíblicas (ENCIMA) -> Notas -> Bosquejo */
          <div className="w-full space-y-6">
            {modules.pasaje && renderPasajeCentral()}
            {modules.citas && renderCitasBiblicasSection()}
            {modules.notas && renderNotasExegeticas()}
            {modules.bosquejo && renderBosquejoSection()}
          </div>
        )}

        {/* RECURSOS VISUALES (Acordeón discreto) */}
        {(study.images.length > 0 || study.videos.length > 0) && (
          <section className="bg-white dark:bg-[#1C1C1F] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-xs">
            <button
              onClick={() => setShowMediaResources(!showMediaResources)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-[#8E8E93]" />
                <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                  Recursos Visuales y Videos ({study.images.length + study.videos.length})
                </span>
              </div>
              <span className="text-xs text-neutral-400 flex items-center gap-1 font-semibold">
                {showMediaResources ? 'Ocultar' : 'Ver recursos'}
                {showMediaResources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>

            {showMediaResources && (
              <div className="p-4 pt-0 border-t border-black/[0.04] dark:border-white/[0.06] space-y-4">
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    onClick={() => setIsAddingImage(!isAddingImage)}
                    className="text-xs font-bold px-3 py-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-slate-800 dark:text-neutral-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all"
                  >
                    Foto
                  </button>
                  <button
                    onClick={() => setIsAddingVideo(!isAddingVideo)}
                    className="text-xs font-bold px-3 py-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-slate-800 dark:text-neutral-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all"
                  >
                    Video
                  </button>
                </div>

                {isAddingImage && (
                  <form onSubmit={handleAddImage} className="p-3 bg-black/[0.03] dark:bg-[#252528] rounded-2xl space-y-2">
                    <input
                      type="url"
                      placeholder="URL de la imagen (https://...)"
                      value={newImgUrl}
                      onChange={(e) => setNewImgUrl(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-[#18181A] text-slate-900 dark:text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Título o referencia visual..."
                      value={newImgTitle}
                      onChange={(e) => setNewImgTitle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-[#18181A] text-slate-900 dark:text-white outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsAddingImage(false)} className="text-xs text-neutral-400 px-3">
                        Cancelar
                      </button>
                      <button type="submit" className="text-xs font-bold px-3 py-1 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] rounded-lg">
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                {isAddingVideo && (
                  <form onSubmit={handleAddVideo} className="p-3 bg-black/[0.03] dark:bg-[#252528] rounded-2xl space-y-2">
                    <input
                      type="url"
                      placeholder="URL de YouTube (https://youtu.be/...)"
                      value={newVidUrl}
                      onChange={(e) => setNewVidUrl(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-[#18181A] text-slate-900 dark:text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Título del video o lección..."
                      value={newVidTitle}
                      onChange={(e) => setNewVidTitle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-[#18181A] text-slate-900 dark:text-white outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsAddingVideo(false)} className="text-xs text-neutral-400 px-3">
                        Cancelar
                      </button>
                      <button type="submit" className="text-xs font-bold px-3 py-1 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] rounded-lg">
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                {study.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {study.images.map(img => (
                      <div key={img.id} className="relative rounded-2xl overflow-hidden group aspect-video bg-black/10">
                        <img
                          src={img.url}
                          alt={img.title}
                          onClick={() => onOpenImagePreview(img.url, img.title)}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        />
                        <button
                          onClick={() => deleteImage(img.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {study.videos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {study.videos.map(vid => (
                      <div key={vid.id} className="rounded-2xl overflow-hidden bg-black/5 dark:bg-[#252528] p-2 space-y-1 relative group">
                        <iframe
                          src={getEmbedUrl(vid.url)}
                          title={vid.title}
                          className="w-full aspect-video rounded-xl"
                          allowFullScreen
                        />
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold truncate text-slate-800 dark:text-white">{vid.title}</span>
                          <button
                            onClick={() => deleteVideo(vid.id)}
                            className="p-1 text-neutral-400 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINAR */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1F] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-black/[0.08] dark:border-white/[0.1] space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">¿Eliminar Prédica?</h3>
                <p className="text-[11px] text-[#8E8E93]">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la prédica <strong className="text-slate-900 dark:text-white">"{study.title}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-black dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudy) onDeleteStudy(study.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs bg-[#E03126] hover:bg-[#C92A20] text-white font-bold rounded-full transition-all active:scale-95 shadow-sm"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISTA PREVIA GIGANTE AL PROYECTAR */}
      {projectedItem && (
        <BigPreview
          items={[projectedItem]}
          index={0}
          onIndexChange={() => {}}
          onClose={() => setProjectedItem(null)}
        />
      )}
    </main>
  );
};

export default StudyCanvas;
