import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  BookOpen,
  Bookmark,
  ListOrdered,
  FileText,
  StickyNote
} from 'lucide-react';
import { Study } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  study: Study | null;
  topicName?: string;
}

type PaperSize = 'letter' | 'a4';
type TextSize = 'pequeño' | 'normal' | 'grande';
type PrintPreset = 'completo' | 'pulpito' | 'bosquejo-citas';

const PAPER = {
  letter: { w: 216, h: 279, label: 'Carta' },
  a4: { w: 210, h: 297, label: 'A4' },
};

const TEXT_SCALE: Record<TextSize, number> = { 
  pequeño: 0.9, 
  normal: 1, 
  grande: 1.18 
};

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  study, 
  topicName 
}) => {
  const [paper, setPaper] = useState<PaperSize>('letter');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [zoom, setZoom] = useState(85);
  const [preset, setPreset] = useState<PrintPreset>('completo');

  // Secciones a incluir en la impresión
  const [sections, setSections] = useState({
    mainVerse: true,
    outline: true,
    relatedVerses: true,
    notes: true,
    quickNotes: true,
  });

  // Aplicar ajustes rápidos según el preset
  const applyPreset = (p: PrintPreset) => {
    setPreset(p);
    if (p === 'pulpito') {
      // 1 Página para atril: Pasaje central + Bosquejo únicamente
      setSections({
        mainVerse: true,
        outline: true,
        relatedVerses: false,
        notes: false,
        quickNotes: false,
      });
      setTextSize('grande');
    } else if (p === 'bosquejo-citas') {
      setSections({
        mainVerse: true,
        outline: true,
        relatedVerses: true,
        notes: false,
        quickNotes: false,
      });
      setTextSize('normal');
    } else {
      // Completo
      setSections({
        mainVerse: true,
        outline: true,
        relatedVerses: true,
        notes: true,
        quickNotes: true,
      });
      setTextSize('normal');
    }
  };

  // Manejo de clase de impresión en el body y atajos (Escape / Cmd+P)
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('print-preview-active');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('print-preview-active');
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  // Regla dinámica de @page para el tamaño seleccionado
  useEffect(() => {
    if (!isOpen) return;
    const style = document.createElement('style');
    style.id = 'print-page-size';
    style.innerHTML = `@page { size: ${paper === 'a4' ? 'A4' : 'letter'}; margin: 15mm; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [isOpen, paper]);

  if (!isOpen || !study) return null;

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scale = TEXT_SCALE[textSize];
  const activeQuickNotes = study.quickNotes.filter(n => !n.isArchived);

  return createPortal(
    <div className="print-preview-root fixed inset-0 z-[80] bg-black/75 backdrop-blur-md flex flex-col font-sans select-none animate-fadeIn">
      
      {/* BARRA SUPERIOR ELEGANTE TIPO IPADOS */}
      <header className="h-16 px-6 bg-[#18181A]/95 border-b border-white/[0.08] flex items-center justify-between gap-4 z-20 flex-shrink-0">
        
        {/* Izquierda: Título y Presets Rápidos */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#E03126]/10 text-[#E03126] flex items-center justify-center font-bold">
              <Printer size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Impresión de Prédica</h2>
              <p className="text-[11px] text-[#8E8E93]">Vista previa exacta de la hoja física</p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/[0.08] hidden md:block" />

          {/* Plantillas Rápidas de 1 toque */}
          <div className="hidden lg:flex items-center bg-[#222225] p-1 rounded-full border border-white/[0.06] text-xs">
            <button
              onClick={() => applyPreset('completo')}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                preset === 'completo' ? 'bg-white text-[#141416] shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Estudio Completo
            </button>
            <button
              onClick={() => applyPreset('pulpito')}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                preset === 'pulpito' ? 'bg-[#E03126] text-white shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
              title="Formato de 1 página condensada para atril"
            >
              <Sparkles size={12} />
              <span>Atril / 1 Página</span>
            </button>
            <button
              onClick={() => applyPreset('bosquejo-citas')}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                preset === 'bosquejo-citas' ? 'bg-white text-[#141416] shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Bosquejo y Citas
            </button>
          </div>
        </div>

        {/* Derecha: Botón Imprimir Destacado y Cerrar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#E03126] hover:bg-[#C92A20] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            title="Mandar a la impresora (⌘P)"
          >
            <Printer size={15} />
            <span>Imprimir Ahora</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Cerrar vista previa (ESC)"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* CUERPO: LIENZO DE HOJA + PANEL DE CONTROL DERECHO */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ZONA CENTRAL: VISTA PREVIA DE LA HOJA (Página realista sobre fondo oscuro) */}
        <div className="print-preview-stage flex-1 overflow-y-auto overflow-x-auto flex justify-center py-8 px-4 sm:px-6 bg-[#0E0E10]">
          <div
            style={{ 
              transform: `scale(${zoom / 100})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="print-preview-scaler my-auto"
          >
            <article
              id="print-sheet"
              className="print-sheet bg-white text-[#1C1C1E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] rounded-sm font-serif select-text"
              style={{
                width: `${PAPER[paper].w}mm`,
                minHeight: `${PAPER[paper].h}mm`,
                padding: '18mm 20mm',
                fontSize: `${11 * scale}pt`,
                lineHeight: 1.5,
              }}
            >
              {/* Encabezado del Documento Impreso */}
              <div className="border-b-2 border-black/80 pb-3 mb-6 font-sans">
                <div className="flex justify-between items-center text-[0.72em] uppercase tracking-wider text-neutral-500 font-bold mb-1">
                  <span>{topicName ? `Tema: ${topicName}` : 'Estudio Bíblico'}</span>
                  <span>Fecha: {study.date}</span>
                </div>
                <h1 className="text-[1.85em] font-black text-black leading-tight tracking-tight">
                  {study.title}
                </h1>
                {study.subtitle && (
                  <p className="text-[0.95em] text-neutral-600 font-medium mt-1">
                    {study.subtitle}
                  </p>
                )}
              </div>

              {/* 1. Pasaje Central */}
              {sections.mainVerse && study.mainVerse?.reference && (
                <section className="mb-6 pl-4 border-l-4 border-[#E03126] break-inside-avoid font-sans">
                  <div className="text-[0.72em] uppercase tracking-wider font-extrabold text-[#E03126] mb-1">
                    Pasaje Central · {study.mainVerse.reference} ({study.mainVerse.version})
                  </div>
                  <p className="text-[1.12em] font-serif italic text-neutral-900 leading-snug">
                    “{study.mainVerse.text}”
                  </p>
                </section>
              )}

              {/* 2. Puntos del Bosquejo Homilético */}
              {sections.outline && study.outlinePoints.length > 0 && (
                <section className="mb-6 font-sans">
                  <h2 className="text-[0.75em] uppercase tracking-widest font-black text-neutral-400 border-b border-black/10 pb-1 mb-3">
                    Bosquejo de la Prédica ({study.outlinePoints.length} Puntos)
                  </h2>
                  <div className="space-y-3.5">
                    {study.outlinePoints.map(point => (
                      <div key={point.id} className="break-inside-avoid">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-extrabold text-[1.05em] text-black">
                            {point.title}
                          </h3>
                          {point.scriptureRef && (
                            <span className="text-[0.85em] font-bold text-neutral-600 font-mono">
                              {point.scriptureRef}
                            </span>
                          )}
                        </div>
                        {point.content && (
                          <p className="text-[0.92em] text-neutral-800 leading-relaxed font-serif mt-0.5 whitespace-pre-line">
                            {point.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 3. Citas Bíblicas de Apoyo */}
              {sections.relatedVerses && study.relatedVerses.length > 0 && (
                <section className="mb-6 font-sans">
                  <h2 className="text-[0.75em] uppercase tracking-widest font-black text-neutral-400 border-b border-black/10 pb-1 mb-3">
                    Citas Bíblicas de Apoyo ({study.relatedVerses.length})
                  </h2>
                  <div className="space-y-2.5">
                    {study.relatedVerses.map(verse => (
                      <div key={verse.id} className="break-inside-avoid pl-3 border-l-2 border-neutral-300">
                        <div className="font-bold text-[0.9em] text-black">
                          {verse.reference} <span className="text-neutral-500 font-normal">({verse.version})</span>
                        </div>
                        <p className="text-[0.9em] font-serif italic text-neutral-800 mt-0.5">
                          “{verse.text}”
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Notas Exegéticas */}
              {sections.notes && study.detailedNotes?.trim() && (
                <section className="mb-6 print-notes font-sans">
                  <h2 className="text-[0.75em] uppercase tracking-widest font-black text-neutral-400 border-b border-black/10 pb-1 mb-3">
                    Notas Exegéticas y Apuntes
                  </h2>
                  <div className="text-[0.9em] text-neutral-800 leading-relaxed font-serif">
                    <MarkdownRenderer content={study.detailedNotes} />
                  </div>
                </section>
              )}

              {/* 5. Avisos y Recordatorios de Púlpito */}
              {sections.quickNotes && activeQuickNotes.length > 0 && (
                <section className="mb-4 font-sans">
                  <h2 className="text-[0.75em] uppercase tracking-widest font-black text-neutral-400 border-b border-black/10 pb-1 mb-2">
                    Avisos de Púlpito
                  </h2>
                  <div className="grid grid-cols-2 gap-2 text-[0.85em]">
                    {activeQuickNotes.map(n => (
                      <div key={n.id} className="p-2 bg-neutral-100 rounded break-inside-avoid">
                        {n.tag && (
                          <span className="font-bold text-[0.75em] uppercase px-1 py-0.5 bg-black/10 rounded mr-1">
                            {n.tag}
                          </span>
                        )}
                        <span className="text-neutral-800 font-medium">{n.text}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Pie de página impreso */}
              <footer className="mt-8 pt-2 border-t border-black/10 text-[0.7em] text-neutral-500 flex justify-between font-sans">
                <span>Preparado con Estudio de Predicación</span>
                <span>Página 1</span>
              </footer>
            </article>
          </div>
        </div>

        {/* PANEL LATERAL DERECHO: CONTROLES INTERACTIVOS Y CONFIGURACIÓN */}
        <aside className="print-preview-panel w-72 sm:w-80 bg-[#1C1C1F] border-l border-white/[0.08] flex flex-col text-[#F5F5F7] flex-shrink-0 select-none">
          
          <div className="p-4 border-b border-white/[0.08]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#8E8E93]">
              Personalizar Impresión
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* 1. Selector de Papel */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                Tamaño de Papel
              </span>
              <div className="flex bg-[#252528] p-1 rounded-2xl border border-white/[0.06]">
                <button
                  onClick={() => setPaper('letter')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    paper === 'letter' ? 'bg-white text-[#141416] shadow-xs' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Carta (US Letter)
                </button>
                <button
                  onClick={() => setPaper('a4')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    paper === 'a4' ? 'bg-white text-[#141416] shadow-xs' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  A4
                </button>
              </div>
            </div>

            {/* 2. Tamaño de Letra */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                Tamaño del Texto
              </span>
              <div className="flex bg-[#252528] p-1 rounded-2xl border border-white/[0.06]">
                {(['pequeño', 'normal', 'grande'] as TextSize[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTextSize(t)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      textSize === t ? 'bg-white text-[#141416] shadow-xs' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Interruptores de Secciones */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                Secciones en el Papel
              </span>
              <div className="bg-[#252528] rounded-2xl border border-white/[0.06] divide-y divide-white/[0.05]">
                
                <button
                  onClick={() => toggleSection('mainVerse')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-[#E03126]" />
                    <span className="text-xs font-semibold text-white">Pasaje Central</span>
                  </div>
                  <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${sections.mainVerse ? 'bg-[#34C759]' : 'bg-[#3A3A3E]'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${sections.mainVerse ? 'translate-x-4' : ''}`} />
                  </span>
                </button>

                <button
                  onClick={() => toggleSection('outline')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <ListOrdered size={14} className="text-neutral-400" />
                    <span className="text-xs font-semibold text-white">
                      Bosquejo ({study.outlinePoints.length})
                    </span>
                  </div>
                  <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${sections.outline ? 'bg-[#34C759]' : 'bg-[#3A3A3E]'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${sections.outline ? 'translate-x-4' : ''}`} />
                  </span>
                </button>

                <button
                  onClick={() => toggleSection('relatedVerses')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <Bookmark size={14} className="text-neutral-400" />
                    <span className="text-xs font-semibold text-white">
                      Citas de Apoyo ({study.relatedVerses.length})
                    </span>
                  </div>
                  <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${sections.relatedVerses ? 'bg-[#34C759]' : 'bg-[#3A3A3E]'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${sections.relatedVerses ? 'translate-x-4' : ''}`} />
                  </span>
                </button>

                <button
                  onClick={() => toggleSection('notes')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-neutral-400" />
                    <span className="text-xs font-semibold text-white">Notas Exegéticas</span>
                  </div>
                  <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${sections.notes ? 'bg-[#34C759]' : 'bg-[#3A3A3E]'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${sections.notes ? 'translate-x-4' : ''}`} />
                  </span>
                </button>

                <button
                  onClick={() => toggleSection('quickNotes')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <StickyNote size={14} className="text-neutral-400" />
                    <span className="text-xs font-semibold text-white">
                      Avisos ({activeQuickNotes.length})
                    </span>
                  </div>
                  <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${sections.quickNotes ? 'bg-[#34C759]' : 'bg-[#3A3A3E]'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${sections.quickNotes ? 'translate-x-4' : ''}`} />
                  </span>
                </button>
              </div>
            </div>

            {/* 4. Zoom de Previsualización */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                Zoom en Pantalla
              </span>
              <div className="flex items-center bg-[#252528] rounded-2xl p-1 border border-white/[0.06]">
                <button
                  onClick={() => setZoom(z => Math.max(50, z - 10))}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                  title="Alejar"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="flex-1 text-center font-mono text-xs font-bold text-white">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(140, z + 10))}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                  title="Acercar"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Pie del Panel */}
          <div className="p-4 border-t border-white/[0.08] bg-[#18181A]">
            <button
              onClick={() => window.print()}
              className="w-full py-3 rounded-2xl bg-[#E03126] hover:bg-[#C92A20] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Printer size={15} />
              <span>Imprimir Documento</span>
            </button>
          </div>
        </aside>
      </div>
    </div>,
    document.body
  );
};

export default PrintPreviewModal;
