import React, { useState, useEffect } from 'react';
import { 
  Minimize2, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  ZoomIn, 
  ZoomOut, 
  ArrowLeft, 
  FileText, 
  StickyNote, 
  ListOrdered, 
  BookOpen, 
  Bookmark, 
  CheckCircle2,
  Sparkles,
  Maximize2 as ProjectIcon
} from 'lucide-react';
import { Study, BibleVerse, QuickNote } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuickAccess, BigPreview, PreviewItem } from './QuickAccess';

interface PulpitModeProps {
  study: Study;
  onExit: () => void;
  onAddVerse?: (verse: BibleVerse) => void;
}

export const PulpitMode: React.FC<PulpitModeProps> = ({ study, onExit, onAddVerse }) => {
  // Cronómetro del sermón
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  
  // Escala tipográfica para el atril
  const [fontScale, setFontScale] = useState(125);
  
  // Punto del bosquejo seleccionado
  const [activePointIndex, setActivePointIndex] = useState<number | null>(0);

  // Cita bíblica actualmente activa: 'main' o verse.id
  const [activeVerseId, setActiveVerseId] = useState<string>('main');

  // MÓDULOS ACTIVOS (Control de visualización modular: Activar / Desactivar)
  const [modules, setModules] = useState({
    pasaje: true,      // Pasaje central
    notas: true,       // Notas exegéticas y apuntes teológicos (¡ARRIBA VISIBLES!)
    citas: true,       // Citas bíblicas complementarias
    bosquejo: true,    // Bosquejo homilético
    avisos: true,      // Avisos y pausas de púlpito
  });

  // Preset activo para feedback visual
  const [activePreset, setActivePreset] = useState<'todo' | 'pasaje-notas' | 'pasaje-bosquejo' | 'solo-citas'>('todo');

  // Item proyectado a pantalla completa gigante
  const [projectedItem, setProjectedItem] = useState<PreviewItem | null>(null);

  // WakeLock: pantalla siempre encendida en el iPad/atril
  useEffect(() => {
    let wakeLock: any = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Ignorar si no está soportado o es denegado
      }
    };
    requestLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Reloj real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Alternar módulos individuales
  const toggleModule = (mod: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  // Aplicar plantillas de vista rápida (Presets de 1 toque)
  const applyPreset = (presetKey: 'todo' | 'pasaje-notas' | 'pasaje-bosquejo' | 'solo-citas') => {
    setActivePreset(presetKey);
    if (presetKey === 'pasaje-notas') {
      setModules({
        pasaje: true,
        notas: true,
        citas: false,
        bosquejo: false,
        avisos: false,
      });
    } else if (presetKey === 'pasaje-bosquejo') {
      setModules({
        pasaje: true,
        notas: false,
        citas: false,
        bosquejo: true,
        avisos: false,
      });
    } else if (presetKey === 'solo-citas') {
      setModules({
        pasaje: false,
        notas: false,
        citas: true,
        bosquejo: false,
        avisos: false,
      });
    } else {
      // Todo
      setModules({
        pasaje: true,
        notas: true,
        citas: true,
        bosquejo: true,
        avisos: true,
      });
    }
  };

  // Versículo actualmente seleccionado
  const isMainActive = activeVerseId === 'main';
  const currentActiveVerse: BibleVerse = isMainActive
    ? study.mainVerse
    : study.relatedVerses.find(v => v.id === activeVerseId) || study.mainVerse;

  // Helper de etiquetas de notas
  const getNoteTagInfo = (note: QuickNote) => {
    const tag = note.tag || 'Recordatorio';
    switch (tag) {
      case 'Pausa': return { label: 'PAUSA', bg: 'bg-[#E03126] text-white' };
      case 'Énfasis': return { label: 'ÉNFASIS', bg: 'bg-[#D97706] text-white' };
      case 'Llamado': return { label: 'LLAMADO', bg: 'bg-[#15803D] text-white' };
      case 'Cita': return { label: 'CITA', bg: 'bg-[#6D28D9] text-white' };
      default: return { label: 'RECORDATORIO', bg: 'bg-[#38383D] text-white' };
    }
  };

  const getPointPhaseTag = (num: number, total: number) => {
    if (num === 1) return { label: 'INTRODUCCIÓN / BASE', bg: 'bg-[#2C2C30] text-neutral-200' };
    if (num === total) return { label: 'LLAMADO FINAL', bg: 'bg-[#15803D] text-white' };
    return { label: `PUNTO ${num}`, bg: 'bg-[#252528] text-neutral-300' };
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#141416] text-[#F5F5F7] overflow-y-auto flex flex-col font-sans select-none animate-fadeIn">
      
      {/* 1. BARRA SUPERIOR DE CONTROL DEL PÚLPITO (Cronómetro, Reloj, Título, Zoom, Salir) */}
      <header className="sticky top-0 bg-[#18181A]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between z-20 shadow-md">
        
        {/* Izquierda: Reloj y Cronómetro */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#222225] border border-white/[0.06] text-neutral-300 text-xs sm:text-sm font-semibold">
            <Clock size={13} className="text-neutral-400" />
            <span className="font-mono text-xs sm:text-sm text-white tracking-wide">{currentTime}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#222225] border border-white/[0.06] px-3.5 py-1.5 rounded-full">
            <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
              {formatTimer(seconds)}
            </span>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-1 rounded-full text-neutral-300 hover:text-white hover:bg-white/[0.1] transition-colors"
              title={isRunning ? "Pausar cronómetro" : "Iniciar cronómetro"}
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              onClick={() => { setSeconds(0); setIsRunning(false); }}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.1] transition-colors"
              title="Reiniciar cronómetro"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Centro: Título de la Prédica */}
        <div className="text-center hidden md:block max-w-md lg:max-w-xl truncate">
          <h2 className="text-sm font-extrabold text-white truncate">{study.title}</h2>
          <span className="text-xs text-[#8E8E93] font-medium">
            {study.mainVerse?.reference ? `${study.mainVerse.reference} • ${study.mainVerse.version}` : 'Sin pasaje central'}
          </span>
        </div>

        {/* Derecha: Zoom y Botón Salir */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#222225] border border-white/[0.06] rounded-full p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFontScale(Math.max(100, fontScale - 10))}
              className="px-2.5 py-1 text-neutral-300 hover:text-white transition-colors"
              title="Reducir letra"
            >
              <ZoomOut size={13} className="inline mr-0.5" />
              <span>A-</span>
            </button>
            <span className="px-1.5 font-mono text-xs text-white font-bold">{fontScale}%</span>
            <button
              onClick={() => setFontScale(Math.min(180, fontScale + 10))}
              className="px-2.5 py-1 text-neutral-300 hover:text-white transition-colors"
              title="Aumentar letra"
            >
              <ZoomIn size={13} className="inline mr-0.5" />
              <span>A+</span>
            </button>
          </div>

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E03126] hover:bg-[#c9271d] text-white rounded-full text-xs font-bold transition-all active:scale-95 shadow-xs"
          >
            <Minimize2 size={13} />
            <span className="hidden sm:inline">Salir de Prédica</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </header>

      {/* 2. BARRA DE COORDINACIÓN MODULAR (Activar / Desactivar módulos y aprovechar todo el ancho) */}
      <nav className="bg-[#18181A]/90 border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 z-10 sticky top-[53px] backdrop-blur-md">
        
        {/* Presets Rápidos de Púlpito (Bordes levemente circulares) */}
        <div className="flex items-center gap-1.5 bg-[#202023] p-1 rounded-xl border border-white/[0.06] text-xs">
          <button
            onClick={() => applyPreset('pasaje-notas')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activePreset === 'pasaje-notas'
                ? 'bg-[#E03126] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Solo Pasaje Central y Notas Teológicas/Griego a pantalla completa"
          >
            <Sparkles size={12} />
            <span>Pasaje + Notas</span>
          </button>

          <button
            onClick={() => applyPreset('pasaje-bosquejo')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activePreset === 'pasaje-bosquejo'
                ? 'bg-white text-[#141416] shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pasaje + Bosquejo
          </button>

          <button
            onClick={() => applyPreset('solo-citas')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activePreset === 'solo-citas'
                ? 'bg-white text-[#141416] shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Solo Citas
          </button>

          <button
            onClick={() => applyPreset('todo')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activePreset === 'todo'
                ? 'bg-white text-[#141416] shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todo
          </button>
        </div>

        {/* Interruptores individuales de módulos (Con colores, sin trazos y levemente circulares) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[10px] uppercase font-bold text-[#8E8E93] mr-1 hidden lg:inline">
            Mostrar:
          </span>

          <button
            onClick={() => toggleModule('pasaje')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-0 shadow-xs active:scale-95 ${
              modules.pasaje
                ? 'bg-blue-600 text-white'
                : 'bg-white/[0.07] text-neutral-400 hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            <span>Pasaje</span>
          </button>

          <button
            onClick={() => toggleModule('notas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-0 shadow-xs active:scale-95 ${
              modules.notas
                ? 'bg-[#E03126] text-white'
                : 'bg-white/[0.07] text-neutral-400 hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>Notas y Léxico</span>
          </button>

          <button
            onClick={() => toggleModule('citas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-0 shadow-xs active:scale-95 ${
              modules.citas
                ? 'bg-purple-600 text-white'
                : 'bg-white/[0.07] text-neutral-400 hover:text-white'
            }`}
          >
            <Bookmark size={13} />
            <span>Citas ({study.relatedVerses.length})</span>
          </button>

          <button
            onClick={() => toggleModule('bosquejo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-0 shadow-xs active:scale-95 ${
              modules.bosquejo
                ? 'bg-emerald-600 text-white'
                : 'bg-white/[0.07] text-neutral-400 hover:text-white'
            }`}
          >
            <ListOrdered size={13} />
            <span>Bosquejo ({study.outlinePoints.length})</span>
          </button>

          {study.quickNotes.length > 0 && (
            <button
              onClick={() => toggleModule('avisos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-0 shadow-xs active:scale-95 ${
                modules.avisos
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/[0.07] text-neutral-400 hover:text-white'
              }`}
            >
              <StickyNote size={13} />
              <span>Avisos ({study.quickNotes.length})</span>
            </button>
          )}
        </div>
      </nav>

      {/* 3. ESCENARIO DE PÚLPITO ELÁSTICO (Ocupa el 100% de la pantalla según lo visible) */}
      <main 
        className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-7"
        style={{ fontSize: `${fontScale}%` }}
      >
        
        {/* BLOQUE SUPERIOR: PASAJE BÍBLICO Y NOTAS EXEGÉTICAS (ARRIBA Y EN PRIMER PLANO) */}
        {(modules.pasaje || modules.notas) && (
          <div className={`w-full grid gap-6 ${
            modules.pasaje && modules.notas ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            
            {/* A. VISOR DEL PASAJE BÍBLICO (Con Proyectar) */}
            {modules.pasaje && (
              <section className="bg-[#1E1E21] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                        {currentActiveVerse.reference || 'Sin Pasaje Asignado'}
                      </span>
                      {isMainActive ? (
                        <span className="text-[11px] px-3 py-1 bg-[#E03126] text-white font-extrabold rounded-full uppercase tracking-wider">
                          Pasaje Base
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveVerseId('main')}
                          className="flex items-center gap-1.5 text-xs px-3 py-1 bg-[#E03126] hover:bg-[#c9271d] text-white font-extrabold rounded-full active:scale-95 transition-all shadow-xs"
                        >
                          <ArrowLeft size={12} />
                          <span>Volver al Base</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {currentActiveVerse.text && (
                        <button
                          onClick={() => setProjectedItem({
                            id: currentActiveVerse.id,
                            kind: 'verse',
                            label: `${isMainActive ? 'Pasaje Base Central' : 'Cita de Apoyo'} · ${currentActiveVerse.version}`,
                            title: currentActiveVerse.reference,
                            body: currentActiveVerse.text
                          })}
                          className="flex items-center gap-1.5 text-xs px-3.5 py-1 bg-white hover:bg-neutral-200 text-[#141416] font-bold rounded-full transition-all active:scale-95 shadow-sm"
                          title="Proyectar a pantalla completa gigante"
                        >
                          <ProjectIcon size={13} />
                          <span>Proyectar</span>
                        </button>
                      )}
                      <span className="text-xs px-2.5 py-0.5 bg-white/[0.08] text-neutral-300 font-bold rounded-full">
                        {currentActiveVerse.version}
                      </span>
                    </div>
                  </div>

                  <p className="text-2xl sm:text-3xl font-serif font-medium text-white leading-relaxed tracking-normal select-text">
                    “{currentActiveVerse.text}”
                  </p>
                </div>

                {currentActiveVerse.notes && (
                  <div className="mt-4 pt-3 border-t border-white/[0.06] text-sm text-neutral-300">
                    <span className="font-bold text-white">Nota de cita:</span> {currentActiveVerse.notes}
                  </div>
                )}
              </section>
            )}

            {/* B. NOTAS EXEGÉTICAS Y APUNTES TEOLÓGICOS (¡AQUÍ VISIBLES DE INMEDIATO!) */}
            {modules.notas && (
              <section className="bg-[#18181A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-[#E03126]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Notas Exegéticas y Apuntes Teológicos
                      </h3>
                    </div>
                    {study.detailedNotes && (
                      <button
                        onClick={() => setProjectedItem({
                          id: 'exegesis',
                          kind: 'exegesis',
                          label: 'Notas Exegéticas y Léxico',
                          title: 'Apuntes Teológicos',
                          body: study.detailedNotes,
                          markdown: true
                        })}
                        className="flex items-center gap-1 text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-neutral-200 font-bold rounded-full transition-all"
                        title="Proyectar notas exegéticas a pantalla completa"
                      >
                        <ProjectIcon size={12} />
                        <span>Ver en Grande</span>
                      </button>
                    )}
                  </div>

                  <div className="text-base sm:text-lg font-sans font-medium text-neutral-200 leading-relaxed space-y-2 select-text">
                    {study.detailedNotes ? (
                      <MarkdownRenderer content={study.detailedNotes} />
                    ) : (
                      <div className="py-8 text-center text-xs text-neutral-500">
                        No hay notas exegéticas o apuntes registrados para este estudio.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

          </div>
        )}

        {/* CITAS COMPLEMENTARIAS (Visible cuando modules.citas está activo) */}
        {modules.citas && study.relatedVerses.length > 0 && (
          <section className="w-full space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Bookmark size={15} className="text-[#8E8E93]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                  Citas Bíblicas de Referencia ({study.relatedVerses.length})
                </h3>
              </div>
              <span className="text-xs text-[#8E8E93]">
                Toca cualquier cita para colocarla en el visor principal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {study.relatedVerses.map(verse => {
                const isSelected = activeVerseId === verse.id;
                return (
                  <button
                    key={verse.id}
                    onClick={() => setActiveVerseId(verse.id)}
                    className={`p-4 rounded-2xl text-left transition-all active:scale-95 flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-white text-[#141416] border-white ring-2 ring-[#E03126] shadow-lg'
                        : 'bg-[#1E1E21] hover:bg-[#252528] text-neutral-200 border-white/[0.06]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-sm sm:text-base truncate">
                          {verse.reference}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isSelected ? 'bg-black/10 text-black' : 'bg-white/10 text-neutral-300'
                        }`}>
                          {verse.version}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-3 ${
                        isSelected ? 'text-neutral-800' : 'text-neutral-400'
                      }`}>
                        “{verse.text}”
                      </p>
                    </div>
                    <div className="text-[10px] mt-2 font-bold opacity-75">
                      {isSelected ? '● Proyectando en visor' : 'Tocar para ver'}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* BOSQUEJO Y AVISOS (Visible según configuración) */}
        {(modules.bosquejo || modules.avisos) && (
          <div className={`w-full grid gap-7 ${
            modules.bosquejo && modules.avisos ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}>
            
            {/* Puntos del Bosquejo */}
            {modules.bosquejo && (
              <div className={modules.avisos ? 'lg:col-span-8 space-y-4' : 'w-full space-y-4'}>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <ListOrdered size={16} className="text-[#8E8E93]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                      Puntos del Bosquejo ({study.outlinePoints.length})
                    </h3>
                  </div>
                  <span className="text-xs text-[#8E8E93]">
                    Toca para enfocar la exposición
                  </span>
                </div>

                <div className="space-y-4">
                  {study.outlinePoints.map((point, idx) => {
                    const isSelected = activePointIndex === idx;
                    const phaseTag = getPointPhaseTag(point.number, study.outlinePoints.length);
                    return (
                      <div
                        key={point.id}
                        onClick={() => setActivePointIndex(isSelected ? null : idx)}
                        className={`p-6 sm:p-7 rounded-3xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#222225] border-2 border-white shadow-2xl ring-4 ring-white/[0.05]'
                            : 'bg-[#1E1E21] border border-white/[0.06] hover:border-white/[0.15]'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-white text-[#141416]' : 'bg-[#2E2E32] text-white'
                            }`}>
                              {point.number}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${phaseTag.bg}`}>
                              {phaseTag.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {point.scriptureRef && (
                              <span className="text-xs font-bold text-neutral-300 bg-[#2C2C2E] px-3 py-1 rounded-full">
                                {point.scriptureRef}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectedItem({
                                  id: point.id,
                                  kind: 'point',
                                  label: `Punto ${point.number}${point.scriptureRef ? ` · ${point.scriptureRef}` : ''}`,
                                  title: point.title,
                                  body: point.content
                                });
                              }}
                              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Proyectar punto a pantalla completa"
                            >
                              <ProjectIcon size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xl sm:text-2xl font-black text-white mb-2">
                          {point.title}
                        </h4>

                        <p className="text-base sm:text-lg text-neutral-200 leading-relaxed font-medium">
                          {point.content}
                        </p>

                        {isSelected && (
                          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-neutral-400">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                              <CheckCircle2 size={13} />
                              <span>Punto en exposición activa</span>
                            </span>
                            <span>Toca para desmarcar</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Avisos de Púlpito */}
            {modules.avisos && study.quickNotes.length > 0 && (
              <div className={modules.bosquejo ? 'lg:col-span-4 space-y-4' : 'w-full space-y-4'}>
                <div className="flex items-center gap-2 px-1">
                  <StickyNote size={16} className="text-[#8E8E93]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                    Avisos de Púlpito ({study.quickNotes.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {study.quickNotes.map((note) => {
                    const tagInfo = getNoteTagInfo(note);
                    return (
                      <div
                        key={note.id}
                        className="bg-[#1E1E21] border border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${tagInfo.bg}`}>
                            {tagInfo.label}
                          </span>
                          <span className="text-[11px] text-[#8E8E93] font-semibold">{note.createdAt}</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                          {note.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Cierre / Mensaje final */}
        <div className="py-8 text-center text-xs text-[#8E8E93]">
          Fin del bosquejo • Predica la Palabra a tiempo y fuera de tiempo
        </div>
      </main>

      {/* Dock de acceso rápido en el púlpito */}
      <QuickAccess study={study} onAddVerse={onAddVerse} variant="pulpit" />

      {/* Vista previa gigante al proyectar */}
      {projectedItem && (
        <BigPreview
          items={[projectedItem]}
          index={0}
          onIndexChange={() => {}}
          onClose={() => setProjectedItem(null)}
        />
      )}
    </div>
  );
};

export default PulpitMode;
