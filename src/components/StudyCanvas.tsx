import React, { useState, useRef, useEffect } from 'react';
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
  List,
  Plus,
  Clock,
  Layers,
  Quote,
  Lightbulb,
  Target,
  PanelRight
} from 'lucide-react';
import { Study, BibleVerse, OutlinePoint, ResourceImage, ResourceVideo } from '../types';
import { BigPreview, PreviewItem } from './QuickAccess';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getChapterVerses, findBook } from '../services/bibleService';

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

// Diccionario de Léxico Bíblico Clave listo para insertar en 1 clic
const LEXICON_TERMS = [
  {
    lang: 'Griego',
    word: 'Cháris (χάρις)',
    strong: 'G5485',
    meaning: 'Favor inmerecido, don gratuito y poder capacitador de Dios.',
    usage: 'Transforma al creyente no solo perdonando, sino habilitando para una nueva vida.'
  },
  {
    lang: 'Griego',
    word: 'Pístis (πίστις)',
    strong: 'G4102',
    meaning: 'Convicción firme, confianza plena y fidelidad activa hacia Dios.',
    usage: 'No es mero asentimiento intelectual, sino entrega confiada a Su promesa.'
  },
  {
    lang: 'Griego',
    word: 'Agápe (ἀγάπη)',
    strong: 'G26',
    meaning: 'Amor sacrificial, incondicional y deliberado que busca el bien supremo del otro.',
    usage: 'La naturaleza misma de Dios manifestada en la cruz.'
  },
  {
    lang: 'Hebreo',
    word: 'Shalóm (שָׁלוֹם)',
    strong: 'H7965',
    meaning: 'Paz integral, plenitud, bienestar completo, armonía y restauración.',
    usage: 'Más que ausencia de conflicto; es la presencia del orden de Dios en el alma.'
  },
  {
    lang: 'Hebreo',
    word: 'Jésed (חֶסֶד)',
    strong: 'H2617',
    meaning: 'Amor leal, misericordia pactal y bondad inquebrantable de Dios.',
    usage: 'Fidelidad divina que permanece firme aun cuando el ser humano falla.'
  },
  {
    lang: 'Griego',
    word: 'Dúnamis (δύναμις)',
    strong: 'G1411',
    meaning: 'Poder inherente, fuerza milagrosa y capacidad sobrenatural en acción.',
    usage: 'El poder del Espíritu Santo obrando eficazmente en la iglesia.'
  },
  {
    lang: 'Griego',
    word: 'Metánoia (μετάνοια)',
    strong: 'G3341',
    meaning: 'Cambio profundo de mente, dirección y propósito de vida.',
    usage: 'Volverse de todo corazón hacia Dios con una mente renovada.'
  },
  {
    lang: 'Griego',
    word: 'Koinonía (κοινωνία)',
    strong: 'G2842',
    meaning: 'Comunión íntima, participación mutua y compañerismo espiritual.',
    usage: 'La unidad viva del Cuerpo de Cristo.'
  }
];

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
  const [fontScale, setFontScale] = useState<number>(115);

  // Versículo activo en el lienzo: 'main' o verse.id
  const [activeVerseId, setActiveVerseId] = useState<string>('main');

  // Contexto bíblico expandido del capítulo actual
  const [showChapterContext, setShowChapterContext] = useState(false);
  const [contextVerses, setContextVerses] = useState<{ verse: number; text: string }[]>([]);
  const [contextTitle, setContextTitle] = useState('');
  const [loadingContext, setLoadingContext] = useState(false);

  // Selector de léxico rápido
  const [showLexiconDrawer, setShowLexiconDrawer] = useState(false);

  // MÓDULOS ACTIVOS EN EL LIENZO
  const [modules, setModules] = useState({
    pasaje: true,
    notas: true,
    citas: true,
    bosquejo: true,
  });

  const [activePreset, setActivePreset] = useState<'todo' | 'pasaje-notas' | 'pasaje-bosquejo' | 'solo-citas'>('todo');

  // Modo edición de notas exegéticas dentro del lienzo
  const [isEditingCanvasNotes, setIsEditingCanvasNotes] = useState(false);
  const canvasNotesRef = useRef<HTMLTextAreaElement>(null);

  // Punto del bosquejo en edición rápida
  const [editingPointId, setEditingPointId] = useState<string | null>(null);

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

  // Versículo actualmente seleccionado
  const isMainActive = activeVerseId === 'main';
  const currentActiveVerse: BibleVerse = isMainActive
    ? study.mainVerse
    : study.relatedVerses.find(v => v.id === activeVerseId) || study.mainVerse;

  // Cargar contexto del capítulo cuando el usuario lo solicita
  useEffect(() => {
    let mounted = true;
    async function loadChapterContext() {
      if (!showChapterContext || !currentActiveVerse?.reference) return;
      const match = currentActiveVerse.reference.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
      if (!match) return;
      const bookInfo = findBook(match[1]);
      const chapterNum = parseInt(match[2], 10);
      if (!bookInfo || isNaN(chapterNum)) return;

      setLoadingContext(true);
      setContextTitle(`${bookInfo.name} ${chapterNum}`);
      const verses = await getChapterVerses(bookInfo.name, chapterNum);
      if (mounted) {
        setContextVerses(verses);
        setLoadingContext(false);
      }
    }
    loadChapterContext();
    return () => { mounted = false; };
  }, [showChapterContext, currentActiveVerse?.reference]);

  // Calcular tiempo estimado de predicación
  const estimatedMinutes = Math.max(
    15,
    study.outlinePoints.length * 7 +
      Math.round((study.detailedNotes?.split(/\s+/).filter(Boolean).length || 0) / 90) +
      study.relatedVerses.length * 2
  );

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
      setModules({ pasaje: true, notas: true, citas: false, bosquejo: false });
    } else if (presetKey === 'pasaje-bosquejo') {
      setModules({ pasaje: true, notas: false, citas: true, bosquejo: true });
    } else if (presetKey === 'solo-citas') {
      setModules({ pasaje: false, notas: false, citas: true, bosquejo: false });
    } else {
      setModules({ pasaje: true, notas: true, citas: true, bosquejo: true });
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

  // Añadir versículo desde el lector de contexto del capítulo
  const handleAddContextVerse = (vNum: number, vText: string) => {
    if (!contextTitle) return;
    const ref = `${contextTitle}:${vNum}`;
    const exists = study.relatedVerses.some(v => v.reference === ref) || study.mainVerse?.reference === ref;
    if (exists) return;
    const newVerse: BibleVerse = {
      id: `v-${Date.now()}-${vNum}`,
      reference: ref,
      version: 'RVR1960',
      text: vText
    };
    onUpdateStudy({
      ...study,
      relatedVerses: [...study.relatedVerses, newVerse]
    });
  };

  // Inserción de plantilla de Griego / Hebreo o bloque homilético
  const handleInsertLexicon = (lang: 'Griego' | 'Hebreo') => {
    const template = `\n\n**${lang} — [Término/Palabra]:** *transliteración*\n- **Significado literal:** \n- **Aplicación teológica:** \n`;
    onUpdateStudy({
      ...study,
      detailedNotes: (study.detailedNotes || '') + template
    });
    setIsEditingCanvasNotes(true);
  };

  const handleInsertPrebuiltLexicon = (term: typeof LEXICON_TERMS[0]) => {
    const entry = `\n\n**${term.lang} — ${term.word} (${term.strong}):**\n- **Significado:** ${term.meaning}\n- **Aplicación:** ${term.usage}\n`;
    onUpdateStudy({
      ...study,
      detailedNotes: (study.detailedNotes || '') + entry
    });
    setShowLexiconDrawer(false);
  };

  const handleInsertHomileticBlock = (type: 'ilustracion' | 'aplicacion' | 'frase') => {
    const templates = {
      ilustracion: `\n\n### Ilustración / Ejemplo Práctico\n> Describe aquí una historia o analogía cotidiana que conecte este principio con la congregación...\n`,
      aplicacion: `\n\n### Aplicación a la Vida Diaria\n- **En la familia:** \n- **En la vida espiritual:** \n- **Acción concreta:** \n`,
      frase: `\n\n> **Frase Clave de Púlpito:** “Escribe aquí una declaración memorable para enfatizar en el mensaje.”\n`
    };
    onUpdateStudy({
      ...study,
      detailedNotes: (study.detailedNotes || '') + templates[type]
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

  // Gestión del Bosquejo directamente desde el lienzo
  const handleAddPoint = () => {
    const nextNum = study.outlinePoints.length + 1;
    const newPt: OutlinePoint = {
      id: `pt-${Date.now()}`,
      number: nextNum,
      title: `${nextNum}. Nuevo Punto del Mensaje`,
      scriptureRef: '',
      content: 'Desarrolla aquí la enseñanza principal y su aplicación...'
    };
    onUpdateStudy({
      ...study,
      outlinePoints: [...study.outlinePoints, newPt]
    });
    setEditingPointId(newPt.id);
  };

  const handleUpdatePoint = (id: string, updates: Partial<OutlinePoint>) => {
    onUpdateStudy({
      ...study,
      outlinePoints: study.outlinePoints.map(p => (p.id === id ? { ...p, ...updates } : p))
    });
  };

  const handleMovePoint = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= study.outlinePoints.length) return;
    const copy = [...study.outlinePoints];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    const renumbered = copy.map((p, idx) => ({ ...p, number: idx + 1 }));
    onUpdateStudy({ ...study, outlinePoints: renumbered });
  };

  const handleDeletePoint = (id: string) => {
    const filtered = study.outlinePoints
      .filter(p => p.id !== id)
      .map((p, idx) => ({ ...p, number: idx + 1 }));
    onUpdateStudy({ ...study, outlinePoints: filtered });
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

  // 1. Render Lienzo Bíblico Central (Sin trazos, adaptado a Luz y Gris, con Contexto de Capítulo)
  const renderPasajeCentral = () => (
    <section className="surface-card bg-white dark:bg-[#18181C] text-[#1C1C1E] dark:text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1C1E] dark:text-white">
              {currentActiveVerse.reference || 'Sin Pasaje Asignado'}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F2F3F5] dark:bg-[#25252B] text-[#636366] dark:text-neutral-300 rounded-full">
              {currentActiveVerse.version}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] rounded-full">
              {isMainActive ? 'Pasaje Central' : 'Cita de Apoyo'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {currentActiveVerse.reference && (
              <button
                type="button"
                onClick={() => setShowChapterContext(!showChapterContext)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 whitespace-nowrap ${
                  showChapterContext
                    ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]'
                    : 'bg-[#F2F3F5] hover:bg-[#E6E8EC] dark:bg-[#25252B] dark:hover:bg-[#2E2E35] text-[#1C1C1E] dark:text-neutral-200'
                }`}
                title="Leer el capítulo completo para ver el contexto bíblico"
              >
                <BookOpen size={13} />
                <span>{showChapterContext ? 'Ocultar Contexto' : 'Contexto'}</span>
              </button>
            )}

            {currentActiveVerse.text && (
              <button
                onClick={() => setProjectedItem({
                  id: currentActiveVerse.id,
                  kind: 'verse',
                  label: `${isMainActive ? 'Pasaje Central' : 'Cita de Apoyo'} · ${currentActiveVerse.version}`,
                  title: currentActiveVerse.reference,
                  body: currentActiveVerse.text
                })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1C1C1E] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-[#121214] text-xs font-bold rounded-xl transition-all active:scale-95 whitespace-nowrap"
                title="Proyectar a pantalla completa gigante"
              >
                <Maximize2 size={12} />
                <span>Proyectar</span>
              </button>
            )}

            <button
              onClick={() => handleCopyText(currentActiveVerse.text, currentActiveVerse.id)}
              className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white rounded-xl bg-[#F2F3F5] dark:bg-[#25252B] transition-colors"
              title="Copiar texto bíblico"
            >
              {copiedVerseId === currentActiveVerse.id ? <Check size={14} /> : <Copy size={14} />}
            </button>

            {isMainActive && onOpenApplyMainVerse && (
              <button
                onClick={onOpenApplyMainVerse}
                className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white px-3 py-1.5 rounded-xl bg-[#F2F3F5] dark:bg-[#25252B] transition-colors font-bold whitespace-nowrap"
                title="Cambiar pasaje central"
              >
                Cambiar
              </button>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#F6F7F9] dark:bg-[#1E1E24]">
          <p className="text-xl sm:text-2xl font-serif leading-relaxed text-[#1C1C1E] dark:text-neutral-100 tracking-normal select-text">
            “{currentActiveVerse.text || 'Selecciona o añade un pasaje bíblico central para comenzar el estudio.'}”
          </p>
        </div>

        {/* Lector de Contexto del Capítulo Completo */}
        {showChapterContext && (
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[#F2F3F5] dark:bg-[#141417] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#8E8E93]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] dark:text-white">
                  Contexto del Capítulo · {contextTitle} (RVR1960)
                </span>
              </div>
              <span className="text-[11px] text-[#8E8E93]">
                Haz clic en + junto a un versículo para sumarlo a tus citas
              </span>
            </div>

            {loadingContext ? (
              <div className="py-6 text-center text-xs text-[#8E8E93]">
                Cargando capítulo completo...
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {contextVerses.map(v => {
                  const refString = `${contextTitle}:${v.verse}`;
                  const isAlreadyAdded = study.relatedVerses.some(rv => rv.reference === refString);
                  return (
                    <div
                      key={v.verse}
                      className="group flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-[#1E1E24] transition-colors"
                    >
                      <p className="text-xs sm:text-sm text-[#1C1C1E] dark:text-neutral-200 leading-relaxed select-text">
                        <span className="font-bold text-[#8E8E93] mr-2 font-mono">{v.verse}</span>
                        {v.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddContextVerse(v.verse, v.text)}
                        disabled={isAlreadyAdded}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 transition-all ${
                          isAlreadyAdded
                            ? 'bg-black/[0.05] dark:bg-white/[0.08] text-[#8E8E93]'
                            : 'opacity-0 group-hover:opacity-100 bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]'
                        }`}
                        title="Añadir como cita de referencia"
                      >
                        {isAlreadyAdded ? 'En citas' : '+ Cita'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {currentActiveVerse.notes && (
        <div className="mt-4 pt-3 text-xs text-[#636366] dark:text-neutral-400 leading-relaxed">
          <span className="font-bold text-[#1C1C1E] dark:text-neutral-200">Nota exegética:</span> {currentActiveVerse.notes}
        </div>
      )}
    </section>
  );

  // 2. Render Citas Bíblicas de Referencia (Sin Trazos, Enfoque Monocromático Luz/Gris)
  const renderCitasBiblicasSection = () => (
    <section className="surface-card bg-white dark:bg-[#18181C] rounded-3xl p-6 space-y-4 transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#F2F3F5] dark:bg-[#25252B] text-[#1C1C1E] dark:text-white flex items-center justify-center font-bold">
            <Bookmark size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] dark:text-white">
              Citas Bíblicas de Referencia
            </h3>
            <span className="text-[11px] text-[#8E8E93]">
              {study.relatedVerses.length + (study.mainVerse?.reference ? 1 : 0)} pasajes vinculados al sermón
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stepper de navegación < y > */}
          <div className="flex items-center bg-[#F2F3F5] dark:bg-[#25252B] p-1 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => handleStepVerse('prev')}
              className="px-2.5 py-1 text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white rounded-xl transition-colors flex items-center gap-1 font-bold text-[11px] active:scale-95"
              title="Cita anterior"
            >
              <ChevronLeft size={13} />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <span className="px-2 text-[11px] font-bold text-[#8E8E93] font-mono">
              {getCurrentVerseIndex()} / {study.relatedVerses.length + (study.mainVerse?.reference ? 1 : 0)}
            </span>
            <button
              type="button"
              onClick={() => handleStepVerse('next')}
              className="px-2.5 py-1 text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white rounded-xl transition-colors flex items-center gap-1 font-bold text-[11px] active:scale-95"
              title="Cita siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <button
            onClick={onOpenVerseModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-[#1C1C1E] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-[#121214] active:scale-95 transition-all shadow-xs whitespace-nowrap"
          >
            <Plus size={13} />
            <span>Añadir Cita</span>
          </button>
        </div>
      </div>

      {/* Cápsulas de citas (Flex Wrap limpio sin cortes ni bordes) */}
      <div className="flex flex-wrap items-center gap-2">
        {study.mainVerse?.reference && (
          <button
            type="button"
            onClick={() => setActiveVerseId('main')}
            className={`group flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 ${
              isMainActive
                ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-sm'
                : 'bg-[#F2F3F5] dark:bg-[#222227] text-[#1C1C1E] dark:text-neutral-200 hover:bg-[#E6E8EC] dark:hover:bg-[#2B2B32]'
            }`}
          >
            <BookOpen size={13} className="opacity-80" />
            <span>{study.mainVerse.reference}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
              isMainActive
                ? 'bg-white/20 text-white dark:bg-black/15 dark:text-[#121214]'
                : 'bg-black/[0.06] dark:bg-white/[0.08] text-[#636366] dark:text-neutral-300'
            }`}>Base</span>
          </button>
        )}

        {study.relatedVerses.map(verse => {
          const isSelected = activeVerseId === verse.id;
          return (
            <div
              key={verse.id}
              onClick={() => setActiveVerseId(verse.id)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-sm'
                  : 'bg-[#F2F3F5] dark:bg-[#222227] text-[#1C1C1E] dark:text-neutral-200 hover:bg-[#E6E8EC] dark:hover:bg-[#2B2B32]'
              }`}
            >
              <BookOpen size={13} className="opacity-75" />
              <span>{verse.reference}</span>
              <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'text-[#8E8E93] font-semibold'}`}>
                ({verse.version})
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRelatedVerse(verse.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/15 transition-opacity ml-0.5"
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
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F6F7F9] dark:bg-[#202026] space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1C1C1E] dark:text-white">
                {currentActiveVerse.reference}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] text-[#636366] dark:text-neutral-300 font-bold">
                {currentActiveVerse.version}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyText(currentActiveVerse.text, currentActiveVerse.id)}
                className="text-xs font-semibold text-[#636366] hover:text-[#1C1C1E] dark:text-neutral-300 dark:hover:text-white flex items-center gap-1 px-3 py-1 rounded-xl bg-white dark:bg-[#2A2A32]"
              >
                {copiedVerseId === currentActiveVerse.id ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedVerseId === currentActiveVerse.id ? 'Copiado' : 'Copiar'}</span>
              </button>
              {currentActiveVerse.text && (
                <button
                  type="button"
                  onClick={() => setProjectedItem({
                    id: currentActiveVerse.id,
                    kind: 'verse',
                    label: `${isMainActive ? 'Pasaje Central' : 'Cita de Referencia'} · ${currentActiveVerse.version}`,
                    title: currentActiveVerse.reference,
                    body: currentActiveVerse.text
                  })}
                  className="text-xs font-bold px-3 py-1 rounded-xl bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Maximize2 size={12} />
                  <span>Proyectar</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-sm font-serif italic text-[#1C1C1E] dark:text-neutral-100 leading-relaxed select-text">
            “{currentActiveVerse.text}”
          </p>
        </div>
      )}
    </section>
  );

  // 3. Render Notas Exegéticas, Léxico Bíblico y Bloques Homiléticos
  const renderNotasExegeticas = () => (
    <section className="surface-card bg-white dark:bg-[#18181C] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#F2F3F5] dark:bg-[#25252B] text-[#1C1C1E] dark:text-white flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] dark:text-white">
                Notas Exegéticas y Léxico Teológico
              </h3>
              <span className="text-[11px] text-[#8E8E93]">
                Estudio de palabras originales, trasfondo e ilustraciones
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowLexiconDrawer(!showLexiconDrawer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
                showLexiconDrawer
                  ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]'
                  : 'bg-[#F2F3F5] hover:bg-[#E6E8EC] dark:bg-[#25252B] dark:hover:bg-[#2E2E35] text-[#1C1C1E] dark:text-neutral-200'
              }`}
              title="Abrir diccionario rápido de términos en Griego y Hebreo"
            >
              <Sparkles size={13} />
              <span>Diccionario Strong</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertLexicon('Griego')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F2F3F5] hover:bg-[#E6E8EC] dark:bg-[#25252B] dark:hover:bg-[#2E2E35] text-[#1C1C1E] dark:text-neutral-200 transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
              title="Insertar plantilla de estudio en Griego"
            >
              <BookA size={13} />
              <span>Griego</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertLexicon('Hebreo')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F2F3F5] hover:bg-[#E6E8EC] dark:bg-[#25252B] dark:hover:bg-[#2E2E35] text-[#1C1C1E] dark:text-neutral-200 transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
              title="Insertar plantilla de estudio en Hebreo"
            >
              <BookA size={13} />
              <span>Hebreo</span>
            </button>
            
            <button
              type="button"
              onClick={() => setIsEditingCanvasNotes(!isEditingCanvasNotes)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1C1C1E] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-[#121214] transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
            >
              {isEditingCanvasNotes ? (
                <>
                  <Check size={13} />
                  <span>Listo</span>
                </>
              ) : (
                <>
                  <Edit3 size={13} />
                  <span>Editar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cajón de Diccionario Strong Rápido (Griego y Hebreo en 1 clic) */}
        {showLexiconDrawer && (
          <div className="mb-5 p-4 rounded-2xl bg-[#F6F7F9] dark:bg-[#141417] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Términos Bíblicos Clave (Toca para insertar en tus notas)
              </span>
              <button
                type="button"
                onClick={() => setShowLexiconDrawer(false)}
                className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LEXICON_TERMS.map((item) => (
                <button
                  key={item.strong}
                  type="button"
                  onClick={() => handleInsertPrebuiltLexicon(item)}
                  className="p-3 rounded-xl bg-white dark:bg-[#1E1E24] hover:bg-[#EAECEF] dark:hover:bg-[#282830] text-left transition-all active:scale-[0.99] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                      {item.word}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F2F3F5] dark:bg-[#2A2A32] text-[#636366] dark:text-neutral-300">
                      {item.lang} · {item.strong}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#636366] dark:text-neutral-400 line-clamp-1">
                    {item.meaning}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bloques Homiléticos Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => handleInsertHomileticBlock('ilustracion')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-[#F6F7F9] hover:bg-[#EAECEF] dark:bg-[#202026] dark:hover:bg-[#282830] text-[#636366] dark:text-neutral-300 flex items-center gap-1.5 transition-colors"
          >
            <Lightbulb size={12} />
            <span>+ Ilustración</span>
          </button>
          <button
            type="button"
            onClick={() => handleInsertHomileticBlock('aplicacion')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-[#F6F7F9] hover:bg-[#EAECEF] dark:bg-[#202026] dark:hover:bg-[#282830] text-[#636366] dark:text-neutral-300 flex items-center gap-1.5 transition-colors"
          >
            <Target size={12} />
            <span>+ Aplicación Práctica</span>
          </button>
          <button
            type="button"
            onClick={() => handleInsertHomileticBlock('frase')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-[#F6F7F9] hover:bg-[#EAECEF] dark:bg-[#202026] dark:hover:bg-[#282830] text-[#636366] dark:text-neutral-300 flex items-center gap-1.5 transition-colors"
          >
            <Quote size={12} />
            <span>+ Frase de Púlpito</span>
          </button>
        </div>

        {/* Edición o Visualización Formateada */}
        {isEditingCanvasNotes ? (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="flex items-center gap-1 p-1.5 bg-[#F2F3F5] dark:bg-[#222227] rounded-2xl w-fit">
              <button onClick={() => handleInsertFormat('**', '**', 'negrita')} className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#2E2E35] text-[#636366] dark:text-neutral-300" title="Negrita">
                <Bold size={13} />
              </button>
              <button onClick={() => handleInsertFormat('*', '*', 'cursiva')} className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#2E2E35] text-[#636366] dark:text-neutral-300" title="Cursiva">
                <Italic size={13} />
              </button>
              <button onClick={() => handleInsertFormat('\n### ', '\n', 'Subtítulo')} className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#2E2E35] text-[#636366] dark:text-neutral-300" title="Subtítulo">
                <Heading size={13} />
              </button>
              <button onClick={() => handleInsertFormat('\n- ', '', 'Punto')} className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#2E2E35] text-[#636366] dark:text-neutral-300" title="Lista">
                <List size={13} />
              </button>
            </div>
            <textarea
              ref={canvasNotesRef}
              value={study.detailedNotes}
              onChange={(e) => onUpdateStudy({ ...study, detailedNotes: e.target.value })}
              rows={9}
              className="w-full text-xs sm:text-sm font-sans leading-relaxed text-[#1C1C1E] dark:text-neutral-100 bg-[#F6F7F9] dark:bg-[#202026] p-4 rounded-2xl outline-none resize-y"
              placeholder="Escribe el estudio de palabras griegas/hebreas, notas teológicas o reflexiones..."
              autoFocus
            />
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingCanvasNotes(true)}
            className="p-5 rounded-2xl bg-[#F6F7F9] dark:bg-[#202026] text-sm font-sans leading-relaxed text-[#1C1C1E] dark:text-neutral-200 cursor-text select-text min-h-[140px]"
          >
            {study.detailedNotes?.trim() ? (
              <MarkdownRenderer content={study.detailedNotes} />
            ) : (
              <div className="py-8 text-center text-xs text-[#8E8E93]">
                Toca aquí o usa los botones superiores para añadir términos del Diccionario Strong, exégesis o ilustraciones.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );

  // 4. Render Bosquejo Homilético Interactivo y Editable en el Lienzo
  const renderBosquejoSection = () => (
    <section className="surface-card bg-white dark:bg-[#18181C] rounded-3xl p-6 sm:p-8 space-y-5 transition-all duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#F2F3F5] dark:bg-[#25252B] text-[#1C1C1E] dark:text-white flex items-center justify-center">
            <ListOrdered size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] dark:text-white">
              Estructura del Bosquejo ({study.outlinePoints.length} Puntos)
            </h3>
            <span className="text-[11px] text-[#8E8E93]">
              Toca cualquier punto para editarlo, reordenarlo o proyectarlo
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddPoint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-[#1C1C1E] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-[#121214] active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus size={13} />
          <span>Nuevo Punto</span>
        </button>
      </div>

      <div className="space-y-3">
        {study.outlinePoints.map((point, idx) => {
          const isEditing = editingPointId === point.id;
          return (
            <div
              key={point.id}
              className="group p-5 rounded-2xl bg-[#F6F7F9] dark:bg-[#202026] transition-all duration-200 space-y-2.5"
            >
              {isEditing ? (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {point.number}
                    </span>
                    <input
                      type="text"
                      value={point.title}
                      onChange={(e) => handleUpdatePoint(point.id, { title: e.target.value })}
                      className="flex-1 bg-white dark:bg-[#161619] px-3.5 py-2 rounded-xl text-sm font-bold text-[#1C1C1E] dark:text-white outline-none"
                      placeholder="Título del punto..."
                      autoFocus
                    />
                    <input
                      type="text"
                      value={point.scriptureRef || ''}
                      onChange={(e) => handleUpdatePoint(point.id, { scriptureRef: e.target.value })}
                      className="w-36 sm:w-44 bg-white dark:bg-[#161619] px-3 py-2 rounded-xl text-xs font-mono text-[#1C1C1E] dark:text-neutral-200 outline-none"
                      placeholder="Cita (ej. Ro 8:28)"
                    />
                  </div>
                  <textarea
                    value={point.content}
                    onChange={(e) => handleUpdatePoint(point.id, { content: e.target.value })}
                    rows={3}
                    className="w-full bg-white dark:bg-[#161619] p-3.5 rounded-xl text-xs sm:text-sm text-[#1C1C1E] dark:text-neutral-200 outline-none resize-y leading-relaxed"
                    placeholder="Explicación y desarrollo del punto..."
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingPointId(null)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]"
                    >
                      Guardar Punto
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => setEditingPointId(point.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <span className="w-7 h-7 rounded-xl bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {point.number}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-white truncate">
                        {point.title.replace(/^\d+\.\s*/, '')}
                      </h4>
                      {point.scriptureRef && (
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-[#2A2A32] text-[#636366] dark:text-neutral-300 flex-shrink-0">
                          {point.scriptureRef}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMovePoint(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white disabled:opacity-25"
                        title="Subir punto"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePoint(idx, 'down')}
                        disabled={idx === study.outlinePoints.length - 1}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white disabled:opacity-25"
                        title="Bajar punto"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPointId(point.id)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                        title="Editar punto"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectedItem({
                          id: point.id,
                          kind: 'point',
                          label: `Punto ${point.number}${point.scriptureRef ? ` · ${point.scriptureRef}` : ''}`,
                          title: point.title,
                          body: point.content
                        })}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                        title="Proyectar punto a pantalla completa"
                      >
                        <Maximize2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePoint(point.id)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-red-500"
                        title="Eliminar punto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {point.content && (
                    <p
                      onClick={() => setEditingPointId(point.id)}
                      className="text-xs sm:text-sm text-[#636366] dark:text-neutral-300 leading-relaxed pl-10 cursor-pointer"
                    >
                      {point.content}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <main className={`flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28 mx-auto w-full transition-all duration-200 font-sans select-none ${
      isDuoPasajeNotas ? 'max-w-6xl' : 'max-w-5xl'
    }`}>
      
      {/* 1. BARRA SUPERIOR DE ESTADO Y ESCALA DE LECTURA (Sin trazos) */}
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 mb-6 bg-white/90 dark:bg-[#18181C]/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl">
        
        {/* Izquierda: Fecha, Tiempo Estimado y Escala Tipográfica */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-[#F2F3F5] dark:bg-[#222227] text-[#636366] dark:text-neutral-300">
            {study.date}
          </span>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-[#F2F3F5] dark:bg-[#222227] text-[#636366] dark:text-neutral-300 flex items-center gap-1" title="Duración estimada de exposición">
            <Clock size={11} />
            <span>~{estimatedMinutes} min</span>
          </span>
          {study.isArchived && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-black/[0.08] dark:bg-white/[0.12] text-[#1C1C1E] dark:text-white">
              Archivado
            </span>
          )}

          {/* Stepper de zoom limpio */}
          <div className="flex items-center bg-[#F2F3F5] dark:bg-[#222227] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setFontScale(Math.max(95, fontScale - 10))}
              className="px-2.5 py-1 text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white rounded-lg transition-colors"
              title="Reducir tamaño de texto"
            >
              <ZoomOut size={12} className="inline mr-0.5" />
              <span>A-</span>
            </button>
            <span className="px-1.5 text-[11px] font-mono font-bold text-[#1C1C1E] dark:text-white">
              {fontScale}%
            </span>
            <button
              onClick={() => setFontScale(Math.min(165, fontScale + 10))}
              className="px-2.5 py-1 text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white rounded-lg transition-colors"
              title="Aumentar tamaño de texto"
            >
              <ZoomIn size={12} className="inline mr-0.5" />
              <span>A+</span>
            </button>
          </div>
        </div>

        {/* Derecha: Botón de Pasaje Base y Toggle del Panel Derecho */}
        <div className="flex items-center gap-2">
          {!isMainActive && (
            <button
              onClick={() => setActiveVerseId('main')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] text-xs font-bold active:scale-95 transition-all"
            >
              <ArrowLeft size={12} />
              <span>Pasaje Central</span>
            </button>
          )}

          {onToggleOutline && (
            <button
              onClick={onToggleOutline}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                isOutlineOpen
                  ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]'
                  : 'bg-[#F2F3F5] dark:bg-[#222227] text-[#1C1C1E] dark:text-neutral-300 hover:bg-[#E6E8EC] dark:hover:bg-[#2B2B32]'
              }`}
              title={isOutlineOpen ? "Ocultar panel lateral de apuntes" : "Mostrar panel lateral de apuntes"}
            >
              <PanelRight size={13} />
              <span>{isOutlineOpen ? 'Ocultar Panel' : 'Panel Lateral'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ENCABEZADO EDITORIAL DEL SERMÓN */}
      <div className="mb-6 px-1">
        {isEditingHeader ? (
          <div className="surface-card space-y-3 p-6 rounded-3xl bg-white dark:bg-[#18181C] animate-scaleIn">
            <input
              type="text"
              value={study.title}
              onChange={(e) => onUpdateStudy({ ...study, title: e.target.value })}
              placeholder="Título del mensaje..."
              className="w-full text-2xl font-black bg-[#F2F3F5] dark:bg-[#222227] p-3.5 rounded-2xl text-[#1C1C1E] dark:text-white outline-none"
            />
            <input
              type="text"
              value={study.subtitle}
              onChange={(e) => onUpdateStudy({ ...study, subtitle: e.target.value })}
              placeholder="Propósito o subtítulo..."
              className="w-full text-sm bg-[#F2F3F5] dark:bg-[#222227] p-3.5 rounded-2xl text-[#1C1C1E] dark:text-neutral-200 outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-5 py-2 text-xs font-bold bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] rounded-xl"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl font-black text-[#1C1C1E] dark:text-white tracking-tight leading-tight">
                  {study.title}
                </h1>
                {study.subtitle && (
                  <p className="text-sm sm:text-base text-[#8E8E93] font-normal leading-relaxed">
                    {study.subtitle}
                  </p>
                )}
              </div>

              {/* Acciones discretas del encabezado */}
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-1">
                <button
                  onClick={() => setIsEditingHeader(true)}
                  className="p-2 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
                  title="Editar título y subtítulo"
                >
                  <Edit2 size={14} />
                </button>
                {onToggleArchiveStudy && (
                  <button
                    onClick={() => onToggleArchiveStudy(study.id)}
                    className="p-2 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition-colors"
                    title={study.isArchived ? "Restaurar prédica" : "Archivar prédica"}
                  >
                    {study.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  </button>
                )}
                {onDeleteStudy && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-[#8E8E93] hover:text-red-500 transition-colors"
                    title="Eliminar prédica"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BARRA MODULAR UNIFICADA EN PALETA LUZ Y GRIS (Sin trazos ni colores saturados) */}
      <div className="surface-card mb-6 p-3 rounded-3xl bg-white dark:bg-[#18181C] space-y-2.5 w-full">
        
        {/* Fila 1: Modos de Enfoque Rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full bg-[#F2F3F5] dark:bg-[#202026] p-1.5 rounded-2xl text-xs">
          <button
            onClick={() => applyPreset('todo')}
            className={`py-2 px-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5 w-full whitespace-nowrap ${
              activePreset === 'todo'
                ? 'bg-white dark:bg-[#2E2E36] text-[#1C1C1E] dark:text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Vista Completa</span>
          </button>

          <button
            onClick={() => applyPreset('pasaje-notas')}
            className={`py-2 px-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5 w-full whitespace-nowrap ${
              activePreset === 'pasaje-notas'
                ? 'bg-white dark:bg-[#2E2E36] text-[#1C1C1E] dark:text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>Pasaje + Exégesis</span>
          </button>

          <button
            onClick={() => applyPreset('pasaje-bosquejo')}
            className={`py-2 px-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5 w-full whitespace-nowrap ${
              activePreset === 'pasaje-bosquejo'
                ? 'bg-white dark:bg-[#2E2E36] text-[#1C1C1E] dark:text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
            }`}
          >
            <ListOrdered size={13} />
            <span>Pasaje + Bosquejo</span>
          </button>

          <button
            onClick={() => applyPreset('solo-citas')}
            className={`py-2 px-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5 w-full whitespace-nowrap ${
              activePreset === 'solo-citas'
                ? 'bg-white dark:bg-[#2E2E36] text-[#1C1C1E] dark:text-white shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
            }`}
          >
            <Bookmark size={13} />
            <span>Solo Citas</span>
          </button>
        </div>

        {/* Fila 2: Interruptores de Apartados Individuales en Luz y Gris */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
          <button
            onClick={() => toggleModule('pasaje')}
            className={`py-2 px-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 w-full whitespace-nowrap ${
              modules.pasaje
                ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-xs'
                : 'bg-[#F2F3F5] dark:bg-[#222227] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            <span>Pasaje Central</span>
          </button>

          <button
            onClick={() => toggleModule('citas')}
            className={`py-2 px-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 w-full whitespace-nowrap ${
              modules.citas
                ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-xs'
                : 'bg-[#F2F3F5] dark:bg-[#222227] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
            }`}
          >
            <Bookmark size={13} />
            <span>Citas ({study.relatedVerses.length})</span>
          </button>

          <button
            onClick={() => toggleModule('notas')}
            className={`py-2 px-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 w-full whitespace-nowrap ${
              modules.notas
                ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-xs'
                : 'bg-[#F2F3F5] dark:bg-[#222227] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>Exégesis y Léxico</span>
          </button>

          <button
            onClick={() => toggleModule('bosquejo')}
            className={`py-2 px-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 w-full whitespace-nowrap ${
              modules.bosquejo
                ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] shadow-xs'
                : 'bg-[#F2F3F5] dark:bg-[#222227] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
            }`}
          >
            <ListOrdered size={13} />
            <span>Bosquejo ({study.outlinePoints.length})</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL ESCALABLE */}
      <div style={{ fontSize: `${fontScale}%` }} className="transition-all duration-200 space-y-6">
        
        {isDuoPasajeNotas ? (
          <div className="w-full grid gap-6 grid-cols-1 lg:grid-cols-2">
            {renderPasajeCentral()}
            {renderNotasExegeticas()}
          </div>
        ) : (
          <div className="w-full space-y-6">
            {modules.pasaje && renderPasajeCentral()}
            {modules.citas && renderCitasBiblicasSection()}
            {modules.notas && renderNotasExegeticas()}
            {modules.bosquejo && renderBosquejoSection()}
          </div>
        )}

        {/* RECURSOS VISUALES Y MULTIMEDIA */}
        <section className="surface-card bg-white dark:bg-[#18181C] rounded-3xl overflow-hidden transition-all duration-200">
          <button
            onClick={() => setShowMediaResources(!showMediaResources)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ImageIcon size={16} className="text-[#8E8E93]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C1C1E] dark:text-neutral-200">
                Recursos Visuales y Multimedia ({study.images.length + study.videos.length})
              </span>
            </div>
            <span className="text-xs text-[#8E8E93] flex items-center gap-1 font-semibold">
              {showMediaResources ? 'Ocultar' : 'Abrir galería'}
              {showMediaResources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {showMediaResources && (
            <div className="px-6 pb-6 pt-2 space-y-4 animate-fadeIn">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAddingImage(!isAddingImage)}
                  className="text-xs font-bold px-3.5 py-1.5 bg-[#F2F3F5] dark:bg-[#25252B] rounded-xl text-[#1C1C1E] dark:text-neutral-200 hover:opacity-85 transition-all"
                >
                  + Añadir Imagen
                </button>
                <button
                  onClick={() => setIsAddingVideo(!isAddingVideo)}
                  className="text-xs font-bold px-3.5 py-1.5 bg-[#F2F3F5] dark:bg-[#25252B] rounded-xl text-[#1C1C1E] dark:text-neutral-200 hover:opacity-85 transition-all"
                >
                  + Añadir Video
                </button>
              </div>

              {isAddingImage && (
                <form onSubmit={handleAddImage} className="p-4 bg-[#F6F7F9] dark:bg-[#202026] rounded-2xl space-y-2.5">
                  <input
                    type="url"
                    placeholder="URL de la imagen (https://...)"
                    value={newImgUrl}
                    onChange={(e) => setNewImgUrl(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-white dark:bg-[#161619] text-[#1C1C1E] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Título o referencia visual..."
                    value={newImgTitle}
                    onChange={(e) => setNewImgTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-white dark:bg-[#161619] text-[#1C1C1E] dark:text-white outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddingImage(false)} className="text-xs text-[#8E8E93] px-3">
                      Cancelar
                    </button>
                    <button type="submit" className="text-xs font-bold px-4 py-1.5 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] rounded-xl">
                      Guardar
                    </button>
                  </div>
                </form>
              )}

              {isAddingVideo && (
                <form onSubmit={handleAddVideo} className="p-4 bg-[#F6F7F9] dark:bg-[#202026] rounded-2xl space-y-2.5">
                  <input
                    type="url"
                    placeholder="URL de YouTube (https://youtu.be/...)"
                    value={newVidUrl}
                    onChange={(e) => setNewVidUrl(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-white dark:bg-[#161619] text-[#1C1C1E] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Título del video o lección..."
                    value={newVidTitle}
                    onChange={(e) => setNewVidTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-white dark:bg-[#161619] text-[#1C1C1E] dark:text-white outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddingVideo(false)} className="text-xs text-[#8E8E93] px-3">
                      Cancelar
                    </button>
                    <button type="submit" className="text-xs font-bold px-4 py-1.5 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] rounded-xl">
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
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black transition-all"
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
                    <div key={vid.id} className="rounded-2xl overflow-hidden bg-[#F6F7F9] dark:bg-[#202026] p-2.5 space-y-1.5 relative group">
                      <iframe
                        src={getEmbedUrl(vid.url)}
                        title={vid.title}
                        className="w-full aspect-video rounded-xl"
                        allowFullScreen
                      />
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold truncate text-[#1C1C1E] dark:text-white">{vid.title}</span>
                        <button
                          onClick={() => deleteVideo(vid.id)}
                          className="p-1 text-[#8E8E93] hover:text-red-500"
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

      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINAR */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C20] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/[0.05] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-white flex items-center justify-center font-bold">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[#1C1C1E] dark:text-white text-sm">¿Eliminar Prédica?</h3>
                <p className="text-[11px] text-[#8E8E93]">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-xs text-[#636366] dark:text-neutral-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la prédica <strong className="text-[#1C1C1E] dark:text-white">"{study.title}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudy) onDeleteStudy(study.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] font-bold rounded-xl transition-all active:scale-95"
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
