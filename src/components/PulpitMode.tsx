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
  Maximize2 as ProjectIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { Study, BibleVerse } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuickAccess, BigPreview, PreviewItem } from './QuickAccess';

interface PulpitModeProps {
  study: Study;
  onExit: () => void;
  onAddVerse?: (verse: BibleVerse) => void;
}

export const PulpitMode: React.FC<PulpitModeProps> = ({ study, onExit, onAddVerse }) => {
  // Cronómetro y meta de tiempo del sermón (en minutos)
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [targetMinutes, setTargetMinutes] = useState<number>(45);
  const [currentTime, setCurrentTime] = useState('');
  const [pulpitTheme, setPulpitTheme] = useState<'dark' | 'light'>('dark');

  // Escala tipográfica para el atril
  const [fontScale, setFontScale] = useState(120);

  // Punto del bosquejo seleccionado
  const [activePointIndex, setActivePointIndex] = useState<number>(0);

  // Cita bíblica actualmente activa: 'main' o verse.id
  const [activeVerseId, setActiveVerseId] = useState<string>('main');

  // MÓDULOS ACTIVOS
  const [modules, setModules] = useState({
    pasaje: true,
    notas: true,
    citas: true,
    bosquejo: true,
    avisos: true,
  });

  const [activePreset, setActivePreset] = useState<'todo' | 'pasaje-notas' | 'pasaje-bosquejo' | 'solo-citas'>('todo');
  const [projectedItem, setProjectedItem] = useState<PreviewItem | null>(null);

  // WakeLock para mantener la pantalla encendida en el atril
  useEffect(() => {
    let wakeLock: any = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Ignorar si no está soportado
      }
    };
    requestLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // Cronómetro en segundo plano
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Reloj en vivo
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

  const progressPercent = Math.min(100, Math.round((seconds / (targetMinutes * 60)) * 100));

  const toggleModule = (mod: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  const applyPreset = (presetKey: 'todo' | 'pasaje-notas' | 'pasaje-bosquejo' | 'solo-citas') => {
    setActivePreset(presetKey);
    if (presetKey === 'pasaje-notas') {
      setModules({ pasaje: true, notas: true, citas: false, bosquejo: false, avisos: false });
    } else if (presetKey === 'pasaje-bosquejo') {
      setModules({ pasaje: true, notas: false, citas: false, bosquejo: true, avisos: false });
    } else if (presetKey === 'solo-citas') {
      setModules({ pasaje: false, notas: false, citas: true, bosquejo: false, avisos: false });
    } else {
      setModules({ pasaje: true, notas: true, citas: true, bosquejo: true, avisos: true });
    }
  };

  const isMainActive = activeVerseId === 'main';
  const currentActiveVerse: BibleVerse = isMainActive
    ? study.mainVerse
    : study.relatedVerses.find(v => v.id === activeVerseId) || study.mainVerse;

  const isLight = pulpitTheme === 'light';

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex flex-col font-sans select-none animate-fadeIn transition-colors duration-300 ${
      isLight ? 'bg-[#F4F5F7] text-[#141416]' : 'bg-[#121214] text-[#F5F5F7]'
    }`}>
      
      {/* 1. BARRA SUPERIOR DE CONTROL DEL PÚLPITO SIN TRAZOS */}
      <header className={`sticky top-0 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 z-20 shadow-sm ${
        isLight ? 'bg-white/95' : 'bg-[#18181C]/95'
      }`}>
        
        {/* Izquierda: Reloj, Cronómetro y Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
            isLight ? 'bg-[#F2F3F6] text-[#1C1C1E]' : 'bg-[#232329] text-white'
          }`}>
            <Clock size={13} className="opacity-60" />
            <span className="font-mono tracking-wide">{currentTime}</span>
          </div>

          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl whitespace-nowrap ${
            isLight ? 'bg-[#F2F3F6] text-[#1C1C1E]' : 'bg-[#232329] text-white'
          }`}>
            <span className="font-mono text-sm font-black tracking-wider">
              {formatTimer(seconds)}
            </span>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title={isRunning ? "Pausar cronómetro" : "Iniciar cronómetro"}
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              onClick={() => { setSeconds(0); setIsRunning(false); }}
              className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              title="Reiniciar cronómetro"
            >
              <RotateCcw size={13} />
            </button>

            {/* Selector rápido de meta de tiempo */}
            <div className="hidden sm:flex items-center gap-1 pl-1">
              {[30, 45, 60].map(m => (
                <button
                  key={m}
                  onClick={() => setTargetMinutes(m)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    targetMinutes === m
                      ? isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                  title={`Meta de ${m} minutos`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Centro: Navegador Rápido de Puntos del Bosquejo */}
        {study.outlinePoints.length > 0 && (
          <div className={`hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl ${
            isLight ? 'bg-[#F2F3F6]' : 'bg-[#232329]'
          }`}>
            <button
              onClick={() => setActivePointIndex(prev => Math.max(0, prev - 1))}
              disabled={activePointIndex <= 0}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Punto anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold px-2 truncate max-w-[260px]">
              Punto {activePointIndex + 1}/{study.outlinePoints.length}: {study.outlinePoints[activePointIndex]?.title}
            </span>
            <button
              onClick={() => setActivePointIndex(prev => Math.min(study.outlinePoints.length - 1, prev + 1))}
              disabled={activePointIndex >= study.outlinePoints.length - 1}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Siguiente punto"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Derecha: Tema Luz/Gris, Zoom y Salir */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center p-1 rounded-xl text-xs font-bold ${
            isLight ? 'bg-[#F2F3F6]' : 'bg-[#232329]'
          }`}>
            <button
              onClick={() => setPulpitTheme('light')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                isLight ? 'bg-white text-[#121214] shadow-xs' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Sun size={12} />
              <span>Luz</span>
            </button>
            <button
              onClick={() => setPulpitTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                !isLight ? 'bg-white text-[#121214] shadow-xs' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Moon size={12} />
              <span>Gris</span>
            </button>
          </div>

          <div className={`flex items-center rounded-xl p-1 text-xs font-bold ${
            isLight ? 'bg-[#F2F3F6]' : 'bg-[#232329]'
          }`}>
            <button
              onClick={() => setFontScale(Math.max(100, fontScale - 10))}
              className="px-2.5 py-1 opacity-75 hover:opacity-100 transition-opacity whitespace-nowrap"
              title="Reducir letra"
            >
              <ZoomOut size={13} className="inline mr-0.5" />
              <span>A-</span>
            </button>
            <span className="px-1.5 font-mono text-xs font-bold">{fontScale}%</span>
            <button
              onClick={() => setFontScale(Math.min(180, fontScale + 10))}
              className="px-2.5 py-1 opacity-75 hover:opacity-100 transition-opacity whitespace-nowrap"
              title="Aumentar letra"
            >
              <ZoomIn size={13} className="inline mr-0.5" />
              <span>A+</span>
            </button>
          </div>

          <button
            onClick={onExit}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
              isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
            }`}
          >
            <Minimize2 size={13} />
            <span className="hidden sm:inline">Salir del Púlpito</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </header>

      {/* Barra sutil de progreso del tiempo del sermón */}
      <div className={`w-full h-1 ${isLight ? 'bg-black/[0.04]' : 'bg-white/[0.04]'}`}>
        <div
          className={`h-full transition-all duration-500 ${
            isLight ? 'bg-[#1C1C1E]' : 'bg-white'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. BARRA DE COORDINACIÓN MODULAR SIN TRAZOS Y EN PALETA LUZ/GRIS */}
      <nav className={`px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10 sticky top-[60px] backdrop-blur-md ${
        isLight ? 'bg-[#F4F5F7]/90' : 'bg-[#121214]/90'
      }`}>
        
        <div className={`flex items-center gap-1 p-1 rounded-2xl text-xs ${
          isLight ? 'bg-white shadow-xs' : 'bg-[#18181C]'
        }`}>
          <button
            onClick={() => applyPreset('pasaje-notas')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'pasaje-notas'
                ? isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Sparkles size={12} />
            <span>Pasaje + Notas</span>
          </button>

          <button
            onClick={() => applyPreset('pasaje-bosquejo')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activePreset === 'pasaje-bosquejo'
                ? isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            Pasaje + Bosquejo
          </button>

          <button
            onClick={() => applyPreset('solo-citas')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activePreset === 'solo-citas'
                ? isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            Solo Citas
          </button>

          <button
            onClick={() => applyPreset('todo')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activePreset === 'todo'
                ? isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            Todo
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {[
            { key: 'pasaje' as const, label: 'Pasaje', icon: BookOpen },
            { key: 'notas' as const, label: 'Notas y Léxico', icon: FileText },
            { key: 'citas' as const, label: `Citas (${study.relatedVerses.length})`, icon: Bookmark },
            { key: 'bosquejo' as const, label: `Bosquejo (${study.outlinePoints.length})`, icon: ListOrdered },
            ...(study.quickNotes.length > 0
              ? [{ key: 'avisos' as const, label: `Avisos (${study.quickNotes.length})`, icon: StickyNote }]
              : []),
          ].map(({ key, label, icon: Icon }) => {
            const active = modules[key];
            return (
              <button
                key={key}
                onClick={() => toggleModule(key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${
                  active
                    ? isLight ? 'bg-[#1C1C1E] text-white shadow-xs' : 'bg-white text-[#121214] shadow-xs'
                    : isLight ? 'bg-white text-[#6E6E77]' : 'bg-[#1C1C22] text-[#8E8E98]'
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. ESCENARIO DE PÚLPITO ELÁSTICO SIN TRAZOS */}
      <main 
        className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6"
        style={{ fontSize: `${fontScale}%` }}
      >
        {(modules.pasaje || modules.notas) && (
          <div className={`w-full grid gap-6 ${
            modules.pasaje && modules.notas ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            
            {modules.pasaje && (
              <section className={`rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between ${
                isLight ? 'bg-white' : 'bg-[#18181C]'
              }`}>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl font-black tracking-tight">
                        {currentActiveVerse.reference || 'Sin Pasaje Asignado'}
                      </span>
                      {isMainActive ? (
                        <span className={`text-[11px] px-3 py-1 font-extrabold rounded-xl uppercase tracking-wider whitespace-nowrap ${
                          isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
                        }`}>
                          Pasaje Base
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveVerseId('main')}
                          className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 font-extrabold rounded-xl active:scale-95 transition-all whitespace-nowrap ${
                            isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
                          }`}
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
                          className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 font-bold rounded-xl transition-all active:scale-95 whitespace-nowrap ${
                            isLight ? 'bg-[#F2F3F6] text-[#1C1C1E]' : 'bg-[#25252C] text-white'
                          }`}
                        >
                          <ProjectIcon size={13} />
                          <span>Proyectar</span>
                        </button>
                      )}
                      <span className={`text-xs px-3 py-1 font-bold rounded-xl ${
                        isLight ? 'bg-[#F2F3F6] text-[#5A5A64]' : 'bg-[#25252C] text-[#A0A0AB]'
                      }`}>
                        {currentActiveVerse.version}
                      </span>
                    </div>
                  </div>

                  <p className="text-2xl sm:text-3xl font-serif font-medium leading-relaxed tracking-normal select-text">
                    “{currentActiveVerse.text}”
                  </p>
                </div>

                {currentActiveVerse.notes && (
                  <div className={`mt-5 p-3.5 rounded-2xl text-sm ${
                    isLight ? 'bg-[#F6F7F9] text-[#4A4A52]' : 'bg-[#202026] text-[#C8C8D0]'
                  }`}>
                    <span className="font-bold">Nota de cita:</span> {currentActiveVerse.notes}
                  </div>
                )}
              </section>
            )}

            {modules.notas && (
              <section className={`rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between ${
                isLight ? 'bg-white' : 'bg-[#18181C]'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="opacity-70" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">
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
                        className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap ${
                          isLight ? 'bg-[#F2F3F6] text-[#1C1C1E]' : 'bg-[#25252C] text-white'
                        }`}
                      >
                        <ProjectIcon size={12} />
                        <span>Ver en Grande</span>
                      </button>
                    )}
                  </div>

                  <div className="text-base sm:text-lg font-sans font-medium leading-relaxed space-y-2 select-text">
                    {study.detailedNotes ? (
                      <MarkdownRenderer content={study.detailedNotes} />
                    ) : (
                      <div className="py-8 text-center text-xs opacity-50">
                        No hay notas exegéticas o apuntes registrados para este estudio.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

          </div>
        )}

        {/* CITAS COMPLEMENTARIAS */}
        {modules.citas && study.relatedVerses.length > 0 && (
          <section className="w-full space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 opacity-60">
                <Bookmark size={15} />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Citas Bíblicas de Referencia ({study.relatedVerses.length})
                </h3>
              </div>
              <span className="text-xs opacity-60">
                Toca cualquier cita para colocarla en el visor principal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {study.relatedVerses.map(verse => {
                const isSelected = activeVerseId === verse.id;
                return (
                  <button
                    key={verse.id}
                    onClick={() => setActiveVerseId(verse.id)}
                    className={`p-5 rounded-2xl text-left transition-all active:scale-98 flex flex-col justify-between ${
                      isSelected
                        ? isLight ? 'bg-[#1C1C1E] text-white shadow-lg' : 'bg-white text-[#121214] shadow-lg'
                        : isLight ? 'bg-white hover:bg-[#EAECEF]' : 'bg-[#18181C] hover:bg-[#202026]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm sm:text-base truncate">
                          {verse.reference}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                          isSelected
                            ? isLight ? 'bg-white/20 text-white' : 'bg-black/10 text-[#121214]'
                            : isLight ? 'bg-[#F2F3F6] text-[#5A5A64]' : 'bg-[#25252C] text-[#A0A0AB]'
                        }`}>
                          {verse.version}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-3 opacity-85">
                        “{verse.text}”
                      </p>
                    </div>
                    <div className="text-[10px] mt-3 font-bold opacity-70">
                      {isSelected ? '● En visor principal' : 'Tocar para mostrar'}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* BOSQUEJO Y AVISOS */}
        {(modules.bosquejo || modules.avisos) && (
          <div className={`w-full grid gap-6 ${
            modules.bosquejo && modules.avisos && study.quickNotes.length > 0 ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}>
            
            {modules.bosquejo && (
              <div className={modules.avisos && study.quickNotes.length > 0 ? 'lg:col-span-8 space-y-4' : 'w-full space-y-4'}>
                <div className="flex items-center justify-between px-1 opacity-60">
                  <div className="flex items-center gap-2">
                    <ListOrdered size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Puntos del Bosquejo ({study.outlinePoints.length})
                    </h3>
                  </div>
                  <span className="text-xs">Toca para enfocar la exposición</span>
                </div>

                <div className="space-y-4">
                  {study.outlinePoints.map((point, idx) => {
                    const isSelected = activePointIndex === idx;
                    return (
                      <div
                        key={point.id}
                        onClick={() => setActivePointIndex(idx)}
                        className={`p-6 sm:p-7 rounded-3xl transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-[#1C1C1E] text-white shadow-xl'
                              : 'bg-[#24242B] text-white shadow-xl'
                            : isLight
                              ? 'bg-white text-[#141416]'
                              : 'bg-[#18181C] text-[#F5F5F7]'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-white text-[#121214]'
                                : isLight ? 'bg-[#F2F3F6] text-[#1C1C1E]' : 'bg-[#25252C] text-white'
                            }`}>
                              {point.number}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1.5 text-xs font-bold opacity-90">
                                <CheckCircle2 size={14} />
                                <span>En exposición</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {point.scriptureRef && (
                              <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                                isSelected
                                  ? 'bg-white/15 text-white'
                                  : isLight ? 'bg-[#F2F3F6] text-[#4A4A52]' : 'bg-[#25252C] text-[#C8C8D0]'
                              }`}>
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
                              className="p-2 rounded-xl opacity-70 hover:opacity-100 transition-opacity"
                              title="Proyectar punto a pantalla completa"
                            >
                              <ProjectIcon size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xl sm:text-2xl font-black mb-2">
                          {point.title}
                        </h4>

                        <p className="text-base sm:text-lg leading-relaxed font-medium opacity-90">
                          {point.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {modules.avisos && study.quickNotes.length > 0 && (
              <div className={modules.bosquejo ? 'lg:col-span-4 space-y-4' : 'w-full space-y-4'}>
                <div className="flex items-center gap-2 px-1 opacity-60">
                  <StickyNote size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Avisos de Púlpito ({study.quickNotes.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {study.quickNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`rounded-2xl p-5 flex flex-col justify-between shadow-xs ${
                        isLight ? 'bg-white' : 'bg-[#18181C]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                          isLight ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#121214]'
                        }`}>
                          {note.tag || 'RECORDATORIO'}
                        </span>
                        <span className="text-[11px] opacity-60 font-semibold">{note.createdAt}</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold leading-relaxed">
                        {note.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <QuickAccess study={study} onAddVerse={onAddVerse} variant="pulpit" />

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
