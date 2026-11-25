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
  PanelRight,
  Search,
  X,
  Calendar
} from 'lucide-react';
import { Study, BibleVerse, OutlinePoint, ResourceImage, ResourceVideo } from '../types';
import { BigPreview, PreviewItem } from './QuickAccess';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getChapterVerses, findBook } from '../services/bibleService';
import { getDateInfo } from '../utils/dateInfo';

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

  // Filtro instantáneo dentro de la prédica actual
  const [canvasQuery, setCanvasQuery] = useState('');

  // Sección colapsable de recursos multimedia
  const [showMediaResources, setShowMediaResources] = useState<boolean>(false);

  // Reiniciar estados transitorios al cambiar de prédica
  useEffect(() => {
    setActiveVerseId('main');
    setEditingPointId(null);
    setIsEditingHeader(false);
    setIsEditingCanvasNotes(false);
    setShowChapterContext(false);
    setCanvasQuery('');
  }, [study.id]);

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

  // En el espacio de trabajo el pasaje principal permanece fijo
  useEffect(() => {
    if (modules.pasaje && modules.citas && modules.notas && activeVerseId !== 'main') {
      setActiveVerseId('main');
    }
  }, [modules.pasaje, modules.citas, modules.notas, activeVerseId]);

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

  // Hero del pasaje principal: escenario oscuro de alto contraste con tipografía editorial
  const renderMainHero = () => {
    const v = study.mainVerse;
    return (
      <section className="relative overflow-hidden rounded-[26px] bg-[#141418] dark:bg-[#141414] border border-black/[0.06] dark:border-white/[0.08] text-white p-6 sm:p-8 shadow-xl">
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/[0.03] blur-3xl" />

        <div className="relative space-y-5">
          {/* Cabecera: etiqueta, referencia y acciones */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  <BookOpen size={12} />
                  Pasaje principal
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.08] text-white/70">
                  {v.version}
                </span>
              </div>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {v.reference || 'Sin pasaje asignado'}
              </h2>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 p-1 rounded-2xl bg-white/[0.06] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowChapterContext(!showChapterContext)}
                className={`p-2 rounded-xl transition-colors ${showChapterContext ? 'bg-white text-[#111116]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                title="Leer el capítulo completo"
              >
                <BookOpen size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleCopyText(v.text, 'main')}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Copiar texto"
              >
                {copiedVerseId === 'main' ? <Check size={15} /> : <Copy size={15} />}
              </button>
              {v.text && (
                <button
                  type="button"
                  onClick={() => setProjectedItem({
                    id: 'main',
                    kind: 'verse',
                    label: `Pasaje Central · ${v.version}`,
                    title: v.reference,
                    body: v.text
                  })}
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Proyectar a pantalla completa"
                >
                  <Maximize2 size={15} />
                </button>
              )}
              {onOpenApplyMainVerse && (
                <button
                  type="button"
                  onClick={onOpenApplyMainVerse}
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Cambiar pasaje central"
                >
                  <Edit2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Texto bíblico escalable */}
          <div className="flex gap-4">
            <span className="w-1 rounded-full bg-[#34D399]/80 flex-shrink-0" />
            <p
              className="font-serif leading-[1.6] text-white/95 select-text"
              style={{ fontSize: `calc(1.3rem * ${fontScale / 100})` }}
            >
              {v.text || 'Selecciona o añade un pasaje bíblico central para comenzar el estudio.'}
            </p>
          </div>

          {v.notes && (
            <p className="text-xs text-white/55 leading-relaxed">
              <span className="font-bold text-white/80">Nota exegética:</span> {v.notes}
            </p>
          )}

          {/* Contexto del capítulo */}
          {showChapterContext && (
            <div className="rounded-2xl bg-black/30 p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Contexto · {contextTitle} (RVR1960)
                </span>
                <span className="text-[10px] text-white/45">Toca + Cita para añadir</span>
              </div>
              {loadingContext ? (
                <div className="py-5 text-center text-xs text-white/50">Cargando capítulo completo...</div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {contextVerses.map(cv => {
                    const refString = `${contextTitle}:${cv.verse}`;
                    const added = study.relatedVerses.some(rv => rv.reference === refString);
                    return (
                      <div key={cv.verse} className="group flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
                        <p className="text-xs sm:text-sm text-white/85 leading-relaxed select-text">
                          <span className="font-bold text-white/40 mr-2 font-mono">{cv.verse}</span>
                          {cv.text}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddContextVerse(cv.verse, cv.text)}
                          disabled={added}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 transition-all ${
                            added ? 'bg-white/10 text-white/50' : 'opacity-0 group-hover:opacity-100 bg-white text-[#17171A]'
                          }`}
                        >
                          {added ? 'En citas' : '+ Cita'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  // Panel de versículos complementarios en formato línea de tiempo numerada
  const renderComplementPanel = () => {
    const q = canvasQuery.trim().toLowerCase();
    const visibleVerses = q
      ? study.relatedVerses.filter(v =>
          v.reference.toLowerCase().includes(q) ||
          v.text.toLowerCase().includes(q) ||
          (v.notes || '').toLowerCase().includes(q)
        )
      : study.relatedVerses;

    return (
      <section className="rounded-[26px] bg-white dark:bg-[#111111] border border-black/[0.04] dark:border-white/[0.06] surface-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E93]">Refuerzan el mensaje</p>
            <h3 className="text-base font-black tracking-tight text-[#1C1C1E] dark:text-white mt-0.5 flex items-center gap-2">
              <span className="truncate">Versículos complementarios</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F2F3F5] dark:bg-[#1C1C1C] text-[#8E8E93]">
                {visibleVerses.length}
              </span>
            </h3>
          </div>
          <button
            onClick={onOpenVerseModal}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1C1C1E] text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-90 transition-all shadow-xs flex-shrink-0"
            title="Añadir versículo complementario"
          >
            <Plus size={17} />
          </button>
        </div>

        {study.relatedVerses.length === 0 ? (
          <button
            onClick={onOpenVerseModal}
            className="w-full py-7 rounded-2xl bg-[#F6F7F9] dark:bg-[#191919] border border-dashed border-black/[0.08] dark:border-white/[0.08] text-xs text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white transition-colors flex flex-col items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Añade versículos que complementen el pasaje principal</span>
          </button>
        ) : visibleVerses.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8E8E93] rounded-2xl bg-[#F6F7F9] dark:bg-[#191919]">
            Sin coincidencias para “{canvasQuery}”
          </div>
        ) : (
          <ol className="relative space-y-1">
            <span className="absolute left-[14px] top-4 bottom-4 w-px bg-black/[0.07] dark:bg-white/[0.07]" />
            {visibleVerses.map((verse, idx) => (
              <li key={verse.id} className="group relative flex gap-3.5 p-2 -mx-2 rounded-2xl hover:bg-[#F6F7F9] dark:hover:bg-[#191919] transition-colors">
                <span className="relative z-10 w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 bg-[#1C1C1E] text-white dark:bg-white dark:text-black ring-4 ring-white dark:ring-[#111111]">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-[#1C1C1E] dark:text-white truncate">{verse.reference}</span>
                      <span className="text-[10px] font-semibold text-[#8E8E93]">{verse.version}</span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyText(verse.text, verse.id)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                        title="Copiar texto"
                      >
                        {copiedVerseId === verse.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      {verse.text && (
                        <button
                          type="button"
                          onClick={() => setProjectedItem({
                            id: verse.id,
                            kind: 'verse',
                            label: `Cita de Apoyo · ${verse.version}`,
                            title: verse.reference,
                            body: verse.text
                          })}
                          className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                          title="Proyectar a pantalla completa"
                        >
                          <Maximize2 size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteRelatedVerse(verse.id)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-red-500"
                        title="Eliminar versículo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p
                    className="mt-1 font-serif leading-relaxed text-[#48484D] dark:text-neutral-300 select-text"
                    style={{ fontSize: `calc(0.92rem * ${fontScale / 100})` }}
                  >
                    {verse.text}
                  </p>
                  {verse.notes && (
                    <p className="mt-1.5 text-[11px] text-[#8E8E93] leading-relaxed">
                      <span className="font-bold">Nota:</span> {verse.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  };

  // 2. Render Citas Bíblicas de Referencia (Sin Trazos, Enfoque Monocromático Luz/Gris)
  const renderCitasBiblicasSection = () => (
    <section className="surface-card bg-white dark:bg-[#18181C] rounded-3xl p-6 space-y-4 transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#F2F3F5] dark:bg-[#1A1A1A] text-[#1C1C1E] dark:text-white flex items-center justify-center font-bold">
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
          <div className="flex items-center bg-[#F2F3F5] dark:bg-[#1A1A1A] p-1 rounded-2xl text-xs">
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
                ? 'bg-[#1C1C1E] text-white dark:bg-[#E5E5E5] dark:text-black shadow-sm'
                : 'bg-[#F2F3F5] dark:bg-[#191919] text-[#1C1C1E] dark:text-neutral-200 hover:bg-[#E6E8EC] dark:hover:bg-[#2B2B32]'
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
                  ? 'bg-[#1C1C1E] text-white dark:bg-[#E5E5E5] dark:text-black shadow-sm'
                  : 'bg-[#F2F3F5] dark:bg-[#191919] text-[#1C1C1E] dark:text-neutral-200 hover:bg-[#E6E8EC] dark:hover:bg-[#2B2B32]'
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
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F6F7F9] dark:bg-[#191919] space-y-2 animate-fadeIn">
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
                className="text-xs font-semibold text-[#636366] hover:text-[#1C1C1E] dark:text-neutral-300 dark:hover:text-white flex items-center gap-1 px-3 py-1 rounded-xl bg-white dark:bg-[#1C1C1C]"
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
                  className="text-xs font-bold px-3 py-1 rounded-xl bg-[#1C1C1E] text-white dark:bg-[#E5E5E5] dark:text-black flex items-center gap-1.5 active:scale-95 transition-all"
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

  // 3. Render Notas Exegéticas, Léxico Bíblico y Bloques Homiléticos (Diseño compacto sin apilamiento)
  const renderNotasExegeticas = () => (
    <section className="surface-card bg-white dark:bg-[#111111] border border-black/[0.04] dark:border-white/[0.06] rounded-[26px] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E93]">Estudio y trasfondo</p>
            <h3 className="text-base font-black tracking-tight text-[#1C1C1E] dark:text-white mt-0.5 truncate">
              Notas Exegéticas y Léxico
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowLexiconDrawer(!showLexiconDrawer)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap ${
                showLexiconDrawer
                  ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-black'
                  : 'bg-[#F2F3F5] hover:bg-[#E6E8EC] dark:bg-[#1C1C1C] dark:hover:bg-[#23232D] text-[#1C1C1E] dark:text-neutral-200'
              }`}
              title="Abrir diccionario rápido de términos en Griego y Hebreo"
            >
              <Sparkles size={12} />
              <span>Strong</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditingCanvasNotes(!isEditingCanvasNotes)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#1C1C1E] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap"
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

        {/* Cajón de Diccionario Strong Rápido (Griego y Hebreo en 1 clic) */}
        {showLexiconDrawer && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#F6F7F9] dark:bg-[#191919] border border-black/[0.04] dark:border-white/[0.05] space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                Diccionario Strong (Toca para insertar)
              </span>
              <button
                type="button"
                onClick={() => setShowLexiconDrawer(false)}
                className="text-[11px] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {LEXICON_TERMS.map((item) => (
                <button
                  key={item.strong}
                  type="button"
                  onClick={() => handleInsertPrebuiltLexicon(item)}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#111111] hover:bg-[#EAECEF] dark:hover:bg-[#1F1F1F] text-left transition-all active:scale-[0.99] space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#1C1C1E] dark:text-white truncate">
                      {item.word}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-[#F2F3F5] dark:bg-[#1D1D1D] text-[#636366] dark:text-neutral-300 flex-shrink-0">
                      {item.strong}
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

        {/* Tira única compacta de inserción rápida */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-3">
          <button
            type="button"
            onClick={() => handleInsertLexicon('Griego')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F6F7F9] hover:bg-[#EAECEF] dark:bg-[#191919] dark:hover:bg-[#242424] text-[#636366] dark:text-neutral-300 flex items-center gap-1 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <BookA size={11} />
            <span>Griego</span>
          </button>
          <button
            type="button"
            onClick={() => handleInsertLexicon('Hebreo')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F6F7F9] hover:bg-[#EAECEF] dark:bg-[#191919] dark:hover:bg-[#242424] text-[#636366] dark:text-neutral-300 flex items-center gap-1 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <BookA size={11} />
            <span>Hebreo</span>
          </button>
          <button
            type="button"
            onClick={() => handleInsertHomileticBlock('ilustracion')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F6F7F9] hover:bg-[#EAECEF] dark:bg-[#191919] dark:hover:bg-[#242424] text-[#636366] dark:text-neutral-300 flex items-center gap-1 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Lightbulb size={11} />
            <span>Ilustración</span>
          </button>
          <button
            type="button"
            onClick={() => handleInsertHomileticBlock('aplicacion')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F6F7F9] hover:bg-[#EAECEF] dark:bg-[#191919] dark:hover:bg-[#242424] text-[#636366] dark:text-neutral-300 flex items-center gap-1 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Target size={11} />
            <span>Aplicación</span>
          </button>
          <button
            type="button"
            onClick={() => handleInsertHomileticBlock('frase')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#F6F7F9] hover:bg-[#EAECEF] dark:bg-[#191919] dark:hover:bg-[#242424] text-[#636366] dark:text-neutral-300 flex items-center gap-1 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Quote size={11} />
            <span>Frase</span>
          </button>
        </div>

        {/* Edición o Visualización Formateada */}
        {isEditingCanvasNotes ? (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="flex items-center gap-1 p-1 bg-[#F2F3F5] dark:bg-[#191919] rounded-xl w-fit">
              <button onClick={() => handleInsertFormat('**', '**', 'negrita')} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#262626] text-[#636366] dark:text-neutral-300" title="Negrita">
                <Bold size={13} />
              </button>
              <button onClick={() => handleInsertFormat('*', '*', 'cursiva')} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#262626] text-[#636366] dark:text-neutral-300" title="Cursiva">
                <Italic size={13} />
              </button>
              <button onClick={() => handleInsertFormat('\n### ', '\n', 'Subtítulo')} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#262626] text-[#636366] dark:text-neutral-300" title="Subtítulo">
                <Heading size={13} />
              </button>
              <button onClick={() => handleInsertFormat('\n- ', '', 'Punto')} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#262626] text-[#636366] dark:text-neutral-300" title="Lista">
                <List size={13} />
              </button>
            </div>
            <textarea
              ref={canvasNotesRef}
              value={study.detailedNotes}
              onChange={(e) => onUpdateStudy({ ...study, detailedNotes: e.target.value })}
              rows={8}
              className="w-full text-xs sm:text-sm font-sans leading-relaxed text-[#1C1C1E] dark:text-neutral-100 bg-[#F6F7F9] dark:bg-[#191919] p-4 rounded-2xl outline-none resize-y"
              placeholder="Escribe el estudio de palabras griegas/hebreas, notas teológicas o reflexiones..."
              autoFocus
            />
          </div>
        ) : (
          <div
            onClick={() => setIsEditingCanvasNotes(true)}
            className="p-4 sm:p-5 rounded-2xl bg-[#F6F7F9] dark:bg-[#191919] font-sans leading-relaxed text-[#1C1C1E] dark:text-neutral-200 cursor-text select-text min-h-[120px]"
            style={{ fontSize: `calc(0.92rem * ${fontScale / 100})` }}
          >
            {study.detailedNotes?.trim() ? (
              <MarkdownRenderer content={study.detailedNotes} />
            ) : (
              <div className="py-6 text-center text-xs text-[#8E8E93]">
                Toca aquí para escribir exégesis, palabras originales o ilustraciones.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );

  // 4. Render Bosquejo Homilético Interactivo y Editable en el Lienzo
  const renderBosquejoSection = () => {
    const q = canvasQuery.trim().toLowerCase();
    const visiblePoints = q
      ? study.outlinePoints.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.scriptureRef || '').toLowerCase().includes(q)
        )
      : study.outlinePoints;

    return (
      <section className="surface-card bg-white dark:bg-[#111111] border border-black/[0.04] dark:border-white/[0.06] rounded-[26px] p-5 sm:p-7 space-y-4 transition-all duration-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E93]">Flujo del mensaje</p>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-[#1C1C1E] dark:text-white mt-0.5 flex items-center gap-2">
              <span>Estructura del Bosquejo</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F2F3F5] dark:bg-[#1C1C1C] text-[#8E8E93]">
                {visiblePoints.length}
              </span>
            </h3>
          </div>

          <button
            type="button"
            onClick={handleAddPoint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C1C1E] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus size={13} />
            <span>Nuevo Punto</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {visiblePoints.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E8E93] rounded-2xl bg-[#F6F7F9] dark:bg-[#191919]">
              {q ? `Sin puntos que coincidan con “${canvasQuery}”` : 'Aún no hay puntos en este bosquejo.'}
            </div>
          ) : (
            visiblePoints.map((point) => {
              const idx = study.outlinePoints.findIndex(p => p.id === point.id);
              const isEditing = editingPointId === point.id;
              return (
                <div
                  key={point.id}
                  className="group p-4 sm:p-5 rounded-2xl bg-[#F6F7F9] dark:bg-[#191919] hover:bg-[#EFEFF3] dark:hover:bg-[#222222] transition-all duration-200 space-y-2"
                >
              {isEditing ? (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#1C1C1E] text-white dark:bg-[#E5E5E5] dark:text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {point.number}
                    </span>
                    <input
                      type="text"
                      value={point.title}
                      onChange={(e) => handleUpdatePoint(point.id, { title: e.target.value })}
                      className="flex-1 bg-white dark:bg-[#121212] px-3.5 py-2 rounded-xl text-sm font-bold text-[#1C1C1E] dark:text-white outline-none"
                      placeholder="Título del punto..."
                      autoFocus
                    />
                    <input
                      type="text"
                      value={point.scriptureRef || ''}
                      onChange={(e) => handleUpdatePoint(point.id, { scriptureRef: e.target.value })}
                      className="w-36 sm:w-44 bg-white dark:bg-[#121212] px-3 py-2 rounded-xl text-xs font-mono text-[#1C1C1E] dark:text-neutral-200 outline-none"
                      placeholder="Cita (ej. Ro 8:28)"
                    />
                  </div>
                  <textarea
                    value={point.content}
                    onChange={(e) => handleUpdatePoint(point.id, { content: e.target.value })}
                    rows={3}
                    className="w-full bg-white dark:bg-[#121212] p-3.5 rounded-xl text-xs sm:text-sm text-[#1C1C1E] dark:text-neutral-200 outline-none resize-y leading-relaxed"
                    placeholder="Explicación y desarrollo del punto..."
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingPointId(null)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#1C1C1E] text-white dark:bg-[#E5E5E5] dark:text-black"
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
                      <span className="w-7 h-7 rounded-xl bg-[#1C1C1E] text-white dark:bg-[#E5E5E5] dark:text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {point.number}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-white truncate">
                        {point.title.replace(/^\d+\.\s*/, '')}
                      </h4>
                      {point.scriptureRef && (
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-[#1C1C1C] text-[#636366] dark:text-neutral-300 flex-shrink-0">
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
                      className="text-[#636366] dark:text-neutral-300 leading-relaxed pl-10 cursor-pointer"
                      style={{ fontSize: `calc(0.9rem * ${fontScale / 100})` }}
                    >
                      {point.content}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })
          )}
        </div>
      </section>
    );
  };

  const dateInfo = getDateInfo(study.date);
  const hasLeftCol = modules.pasaje || modules.bosquejo;
  const hasRightCol = modules.citas || modules.notas;

  return (
    <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 mx-auto w-full max-w-[1720px] transition-all duration-200 font-sans select-none">
      
      {/* 1. CABECERA EDITORIAL UNIFICADA */}
      <div className="mb-4">
        {isEditingHeader ? (
          <div className="surface-card space-y-3 p-5 rounded-[24px] bg-white dark:bg-[#111111] border border-black/[0.05] dark:border-white/[0.07] animate-scaleIn">
            <input
              type="text"
              value={study.title}
              onChange={(e) => onUpdateStudy({ ...study, title: e.target.value })}
              placeholder="Título del mensaje..."
              className="w-full text-2xl font-black bg-[#F2F3F5] dark:bg-[#191919] p-3.5 rounded-2xl text-[#1C1C1E] dark:text-white outline-none"
            />
            <input
              type="text"
              value={study.subtitle}
              onChange={(e) => onUpdateStudy({ ...study, subtitle: e.target.value })}
              placeholder="Propósito o subtítulo..."
              className="w-full text-sm bg-[#F2F3F5] dark:bg-[#191919] p-3.5 rounded-2xl text-[#1C1C1E] dark:text-neutral-200 outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-5 py-2 text-xs font-bold bg-[#1C1C1E] dark:bg-white text-white dark:text-black rounded-xl"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        ) : (
          <header className="surface-card rounded-[24px] bg-white dark:bg-[#111111] border border-black/[0.05] dark:border-white/[0.07] px-5 sm:px-6 py-4 sm:py-5 space-y-3.5 transition-colors duration-200">
            {/* Fila superior: Estado de fecha + Controles agrupados */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-xl inline-flex items-center gap-2 ${
                    dateInfo.tone === 'hoy' || dateInfo.tone === 'proxima'
                      ? 'bg-[#1C1C1E] text-white dark:bg-[#34D399]/10 dark:text-[#34D399] border border-transparent dark:border-[#34D399]/25'
                      : 'bg-[#F2F3F5] dark:bg-[#191919] text-[#636366] dark:text-neutral-300'
                  }`}
                  title={dateInfo.message}
                >
                  {(dateInfo.tone === 'hoy' || dateInfo.tone === 'proxima') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] flex-shrink-0" />
                  )}
                  <Calendar size={12} className="opacity-70 flex-shrink-0" />
                  <span>{dateInfo.weekday ? `${dateInfo.weekday}, ${dateInfo.long}` : study.date}</span>
                  <span className="opacity-65 font-medium">· {dateInfo.message}</span>
                </span>

                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#F2F3F5] dark:bg-[#191919] text-[#636366] dark:text-neutral-300 inline-flex items-center gap-1" title="Duración estimada">
                  <Clock size={11} className="opacity-70" />
                  <span>~{estimatedMinutes} min</span>
                </span>

                {study.isArchived && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-black/[0.08] dark:bg-white/[0.1] text-[#1C1C1E] dark:text-white">
                    Archivado
                  </span>
                )}
              </div>

              {/* Grupo derecho: Zoom + Acciones del estudio + Panel Lateral */}
              <div className="flex items-center gap-2 flex-wrap">
                {!isMainActive && (
                  <button
                    onClick={() => setActiveVerseId('main')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1E] text-white dark:bg-white dark:text-black text-xs font-bold active:scale-95 transition-all"
                  >
                    <ArrowLeft size={12} />
                    <span>Pasaje Central</span>
                  </button>
                )}

                <div className="flex items-center bg-[#F4F5F7] dark:bg-[#191919] rounded-xl p-0.5 text-xs">
                  <button
                    onClick={() => setFontScale(Math.max(85, fontScale - 10))}
                    className="px-2 py-1 text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white rounded-lg transition-colors"
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
                    className="px-2 py-1 text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white rounded-lg transition-colors"
                    title="Aumentar tamaño de texto"
                  >
                    <ZoomIn size={12} className="inline mr-0.5" />
                    <span>A+</span>
                  </button>
                </div>

                {/* Acciones del estudio en cápsula limpia */}
                <div className="flex items-center bg-[#F4F5F7] dark:bg-[#191919] rounded-xl p-0.5">
                  <button
                    onClick={() => setIsEditingHeader(true)}
                    className="p-1.5 rounded-lg text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white hover:bg-white dark:hover:bg-[#252525] transition-colors"
                    title="Editar título y subtítulo"
                  >
                    <Edit2 size={13} />
                  </button>
                  {onToggleArchiveStudy && (
                    <button
                      onClick={() => onToggleArchiveStudy(study.id)}
                      className="p-1.5 rounded-lg text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white hover:bg-white dark:hover:bg-[#252525] transition-colors"
                      title={study.isArchived ? "Restaurar prédica" : "Archivar prédica"}
                    >
                      {study.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                    </button>
                  )}
                  {onDeleteStudy && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 rounded-lg text-[#636366] dark:text-neutral-300 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Eliminar prédica"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {onToggleOutline && (
                  <button
                    onClick={onToggleOutline}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      isOutlineOpen
                        ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-black'
                        : 'bg-[#F4F5F7] dark:bg-[#191919] text-[#1C1C1E] dark:text-neutral-200 hover:bg-[#E8E9EE] dark:hover:bg-[#252525]'
                    }`}
                    title={isOutlineOpen ? "Ocultar panel lateral de apuntes" : "Mostrar panel lateral de apuntes"}
                  >
                    <PanelRight size={13} />
                    <span>{isOutlineOpen ? 'Ocultar Panel' : 'Panel Lateral'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fila inferior: Título, subtítulo y resumen rápido del sermón */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1C1C1E] dark:text-white tracking-tight leading-tight">
                  {study.title}
                </h1>
                {study.subtitle && (
                  <p className="text-xs sm:text-sm text-[#6E6E77] dark:text-neutral-400 font-normal mt-1 leading-relaxed">
                    {study.subtitle}
                  </p>
                )}
              </div>

              {/* Resumen rápido del contenido de la prédica */}
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0 text-[11px] font-semibold text-[#6E6E77] dark:text-neutral-400">
                {study.mainVerse?.reference && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F5F7] dark:bg-[#191919] text-[#1C1C1E] dark:text-neutral-200 font-bold">
                    <BookOpen size={11} className="opacity-70" />
                    <span>{study.mainVerse.reference}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F5F7] dark:bg-[#191919]">
                  <Bookmark size={11} className="opacity-70" />
                  <span>{study.relatedVerses.length} citas</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F5F7] dark:bg-[#191919]">
                  <ListOrdered size={11} className="opacity-70" />
                  <span>{study.outlinePoints.length} pts</span>
                </span>
              </div>
            </div>
          </header>
        )}
      </div>

      {/* 2. BARRA ÚNICA DE BÚSQUEDA INSTANTÁNEA Y VISTAS (Compacta, calmada y lista para el púlpito) */}
      <div className="mb-5 p-2 rounded-2xl bg-white dark:bg-[#111111] border border-black/[0.04] dark:border-white/[0.06] flex flex-col lg:flex-row items-stretch lg:items-center gap-2 w-full">
        {/* Buscador instantáneo en la prédica */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
          <input
            type="text"
            value={canvasQuery}
            onChange={(e) => setCanvasQuery(e.target.value)}
            placeholder="Buscar punto del bosquejo o versículo al instante..."
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-[#F4F5F7] dark:bg-[#191919] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none"
          />
          {canvasQuery && (
            <button
              type="button"
              onClick={() => setCanvasQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              title="Limpiar búsqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Enfoques rápidos + interruptores de módulos en una sola línea */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center bg-[#F4F5F7] dark:bg-[#191919] p-0.5 rounded-xl text-[11px] font-bold flex-shrink-0">
            {([
              { key: 'todo', label: 'Todo', icon: Layers },
              { key: 'pasaje-notas', label: 'Exégesis', icon: Sparkles },
              { key: 'pasaje-bosquejo', label: 'Bosquejo', icon: ListOrdered },
              { key: 'solo-citas', label: 'Citas', icon: Bookmark },
            ] as const).map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                  activePreset === p.key
                    ? 'bg-white dark:bg-[#242424] text-[#1C1C1E] dark:text-white shadow-2xs'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                }`}
              >
                <p.icon size={12} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          <span className="hidden sm:block w-px h-5 bg-black/[0.06] dark:bg-white/[0.08] flex-shrink-0" />

          <div className="flex items-center gap-1 flex-shrink-0 text-[11px] font-bold">
            {([
              { key: 'pasaje', label: 'Pasaje', icon: BookOpen },
              { key: 'citas', label: `Citas (${study.relatedVerses.length})`, icon: Bookmark },
              { key: 'notas', label: 'Notas', icon: FileText },
              { key: 'bosquejo', label: `Bosquejo (${study.outlinePoints.length})`, icon: ListOrdered },
            ] as const).map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleModule(m.key)}
                className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 whitespace-nowrap border ${
                  modules[m.key]
                    ? 'bg-[#1C1C1E] text-white border-transparent dark:bg-[#E5E5E5] dark:text-black dark:border-transparent'
                    : 'bg-transparent border-transparent text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                }`}
              >
                <m.icon size={11} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ESPACIO DE TRABAJO BENTO DE ANCHO COMPLETO (Cero espacios muertos) */}
      <div className="transition-all duration-200 space-y-5">
        {isDuoPasajeNotas ? (
          <div className="w-full grid gap-5 grid-cols-1 lg:grid-cols-2 items-start">
            {renderMainHero()}
            {renderNotasExegeticas()}
          </div>
        ) : hasLeftCol && hasRightCol ? (
          <div className="w-full grid gap-5 grid-cols-1 xl:grid-cols-12 items-start">
            {/* Columna principal (Pasaje + Bosquejo): flujo central de predicación */}
            <div className="xl:col-span-7 space-y-5 min-w-0">
              {modules.pasaje && renderMainHero()}
              {modules.bosquejo && renderBosquejoSection()}
            </div>
            {/* Columna de apoyo (Versículos complementarios + Notas exegéticas) */}
            <div className="xl:col-span-5 space-y-5 min-w-0">
              {modules.citas && renderComplementPanel()}
              {modules.notas && renderNotasExegeticas()}
            </div>
          </div>
        ) : (
          <div className="w-full space-y-5">
            {modules.pasaje && renderMainHero()}
            {modules.citas && renderCitasBiblicasSection()}
            {modules.notas && renderNotasExegeticas()}
            {modules.bosquejo && renderBosquejoSection()}
          </div>
        )}

        {/* RECURSOS VISUALES Y MULTIMEDIA */}
        <section className="surface-card bg-white dark:bg-[#111111] border border-black/[0.04] dark:border-white/[0.06] rounded-[26px] overflow-hidden transition-all duration-200">
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
                  className="text-xs font-bold px-3.5 py-1.5 bg-[#F2F3F5] dark:bg-[#1A1A1A] rounded-xl text-[#1C1C1E] dark:text-neutral-200 hover:opacity-85 transition-all"
                >
                  + Añadir Imagen
                </button>
                <button
                  onClick={() => setIsAddingVideo(!isAddingVideo)}
                  className="text-xs font-bold px-3.5 py-1.5 bg-[#F2F3F5] dark:bg-[#1A1A1A] rounded-xl text-[#1C1C1E] dark:text-neutral-200 hover:opacity-85 transition-all"
                >
                  + Añadir Video
                </button>
              </div>

              {isAddingImage && (
                <form onSubmit={handleAddImage} className="p-4 bg-[#F6F7F9] dark:bg-[#191919] rounded-2xl space-y-2.5">
                  <input
                    type="url"
                    placeholder="URL de la imagen (https://...)"
                    value={newImgUrl}
                    onChange={(e) => setNewImgUrl(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-white dark:bg-[#121212] text-[#1C1C1E] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Título o referencia visual..."
                    value={newImgTitle}
                    onChange={(e) => setNewImgTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-white dark:bg-[#121212] text-[#1C1C1E] dark:text-white outline-none"
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
                <form onSubmit={handleAddVideo} className="p-4 bg-[#F6F7F9] dark:bg-[#191919] rounded-2xl space-y-2.5">
                  <input
                    type="url"
                    placeholder="URL de YouTube (https://youtu.be/...)"
                    value={newVidUrl}
                    onChange={(e) => setNewVidUrl(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-white dark:bg-[#121212] text-[#1C1C1E] dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Título del video o lección..."
                    value={newVidTitle}
                    onChange={(e) => setNewVidTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-white dark:bg-[#121212] text-[#1C1C1E] dark:text-white outline-none"
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
                    <div key={vid.id} className="rounded-2xl overflow-hidden bg-[#F6F7F9] dark:bg-[#191919] p-2.5 space-y-1.5 relative group">
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
          initialTheme="dark"
        />
      )}
    </main>
  );
};

export default StudyCanvas;
