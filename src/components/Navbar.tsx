import React, { useState } from 'react';
import { 
  Maximize2, 
  Printer, 
  Sun, 
  Moon,
  BookOpen,
  Plus,
  Check,
  FolderOpen,
  FileText,
  PanelLeft,
  PanelLeftClose,
  Archive,
  ArchiveRestore,
  Trash2
} from 'lucide-react';
import { Topic, Study } from '../types';

interface NavbarProps {
  topics: Topic[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  studies: Study[];
  activeStudyId: string;
  onSelectStudy: (studyId: string) => void;
  onAddStudy: () => void;
  onAddTopic: (name: string, description: string) => void;
  onToggleArchiveStudy?: (studyId: string) => void;
  onDeleteStudy?: (studyId: string) => void;
  onEnterPulpitMode: () => void;
  onOpenPrintPreview?: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  activeTopicName?: string;
  activeStudyTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  topics,
  activeTopicId,
  onSelectTopic,
  studies,
  activeStudyId,
  onSelectStudy,
  onAddStudy,
  onAddTopic,
  onToggleArchiveStudy,
  onDeleteStudy,
  onEnterPulpitMode,
  onOpenPrintPreview,
  theme,
  setTheme,
  activeTopicName,
  activeStudyTitle,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [studyFilter, setStudyFilter] = useState<'activos' | 'archivados' | 'todos'>('activos');
  const [studyToDelete, setStudyToDelete] = useState<Study | null>(null);

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    onAddTopic(newTopicName.trim(), '');
    setNewTopicName('');
    setIsAddingTopic(false);
  };

  const currentTopic = topics.find(t => t.id === activeTopicId);

  return (
    <>
      <header className="h-14 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#18181A]/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 select-none font-sans sticky top-0">
        
        {/* Left: Botón Compacto de Barra Lateral que NO ESTORBA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] dark:bg-[#222225] dark:hover:bg-[#2C2C30] text-slate-900 dark:text-white transition-all active:scale-95 border border-black/[0.04] dark:border-white/[0.06]"
            title="Abrir explorador de temas y prédicas"
          >
            <PanelLeft size={16} className="text-[#8E8E93]" />
            <span className="font-bold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[200px]">
              {activeTopicName || "Temas Bíblicos"}
            </span>
          </button>

          {/* Subtítulo del sermón actual discreto */}
          {activeStudyTitle && (
            <span className="hidden md:inline text-xs text-[#8E8E93] font-medium truncate max-w-[260px] lg:max-w-[360px]">
              • {activeStudyTitle}
            </span>
          )}
        </div>

        {/* Right controls: Theme Slider, Print & Pulpit Mode */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Selector de Modo: Luz y Gris */}
          <div className="flex items-center bg-black/[0.04] dark:bg-[#222225] p-1 rounded-full text-xs font-medium">
            <button
              onClick={() => setTheme('light')}
              className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400'
              }`}
              title="Modo Luz"
            >
              <Sun size={13} className="inline mr-1.5" />
              <span>Luz</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                theme === 'dark'
                  ? 'bg-[#323236] text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400'
              }`}
              title="Modo Gris Oscuro"
            >
              <Moon size={13} className="inline mr-1.5" />
              <span>Gris</span>
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={() => (onOpenPrintPreview ? onOpenPrintPreview() : window.print())}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-black/[0.04] hover:bg-black/[0.08] dark:bg-[#222225] dark:hover:bg-[#2A2A2E] rounded-full transition-all active:scale-95"
            title="Imprimir estudio"
          >
            <Printer size={13} />
            <span>Imprimir</span>
          </button>

          {/* Modo Prédica - Solid Red Action Button */}
          <button
            onClick={onEnterPulpitMode}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[#E03126] hover:bg-[#C92A20] text-white rounded-full shadow-xs transition-all active:scale-95"
            title="Modo atril pantalla completa"
          >
            <Maximize2 size={13} />
            <span>Modo Prédica</span>
          </button>
        </div>
      </header>

      {/* SIDEBAR DRAWER LATERAL DESLIZABLE ESTILO IPADOS (NO ESTORBA EL CENTRO) */}
      {isSidebarOpen && (
        <>
          {/* Backdrop oscurecido transparente para cerrar con un toque */}
          <div 
            className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Panel Lateral Izquierdo */}
          <aside className="fixed top-0 left-0 bottom-0 w-80 sm:w-88 bg-white dark:bg-[#18181A] z-50 border-r border-black/[0.06] dark:border-white/[0.08] shadow-2xl flex flex-col font-sans select-none animate-slideRight">
            
            {/* Cabecera del Panel Lateral */}
            <div className="p-4 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={17} className="text-[#8E8E93]" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Temas y Prédicas
                </h3>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
                title="Cerrar panel lateral"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            {/* Contenido del Sidebar con Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* SECCIÓN 1: TEMAS BÍBLICOS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Temas ({topics.length})
                  </span>
                  <button
                    onClick={() => setIsAddingTopic(!isAddingTopic)}
                    className="text-xs font-bold text-slate-700 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06]"
                  >
                    <Plus size={12} />
                    <span>Nuevo</span>
                  </button>
                </div>

                {/* Formulario para añadir nuevo tema */}
                {isAddingTopic && (
                  <form onSubmit={handleCreateTopic} className="p-3 bg-[#F2F2F7] dark:bg-[#222225] rounded-2xl border border-black/[0.05] dark:border-white/[0.06] space-y-2">
                    <input
                      type="text"
                      placeholder="Nombre del nuevo tema..."
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      className="w-full text-xs p-2 bg-white dark:bg-[#18181A] rounded-xl text-slate-900 dark:text-white focus:outline-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingTopic(false)}
                        className="px-2.5 py-0.5 text-xs text-neutral-500 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-bold rounded-lg"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de temas */}
                <div className="space-y-1">
                  {topics.map((t) => {
                    const isActive = t.id === activeTopicId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelectTopic(t.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs text-left transition-all active:scale-98 ${
                          isActive
                            ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-extrabold shadow-sm'
                            : 'text-slate-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-[#222225]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FolderOpen size={14} className={isActive ? 'opacity-90' : 'text-[#8E8E93]'} />
                          <span className="truncate">{t.name}</span>
                        </div>
                        {isActive && <Check size={14} className="flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN 2: PRÉDICAS DEL TEMA SELECCIONADO */}
              <div className="space-y-2.5 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] truncate max-w-[190px]">
                    Prédicas en {currentTopic?.name || "este tema"}
                  </span>
                  <button
                    onClick={() => {
                      onAddStudy();
                      setIsSidebarOpen(false);
                    }}
                    className="text-xs font-bold text-slate-700 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06]"
                  >
                    <Plus size={12} />
                    <span>Añadir</span>
                  </button>
                </div>

                {/* Filtro Activos / Archivados / Todos */}
                <div className="bg-[#F2F2F7] dark:bg-[#222225] p-1 rounded-2xl flex items-center gap-1 border border-black/[0.04] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setStudyFilter('activos')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-all ${
                      studyFilter === 'activos'
                        ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Activos ({studies.filter(s => !s.isArchived).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyFilter('archivados')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-all ${
                      studyFilter === 'archivados'
                        ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Archivados ({studies.filter(s => s.isArchived).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyFilter('todos')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-all ${
                      studyFilter === 'todos'
                        ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Todos ({studies.length})
                  </button>
                </div>

                {/* Lista de prédicas filtradas */}
                <div className="space-y-2">
                  {studies.filter(s => {
                    if (studyFilter === 'activos') return !s.isArchived;
                    if (studyFilter === 'archivados') return !!s.isArchived;
                    return true;
                  }).length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8E8E93] bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/[0.06] dark:border-white/[0.08]">
                      {studyFilter === 'archivados' 
                        ? 'No hay mensajes archivados en este tema.'
                        : 'No hay mensajes en este tema.'}
                    </div>
                  ) : (
                    studies.filter(s => {
                      if (studyFilter === 'activos') return !s.isArchived;
                      if (studyFilter === 'archivados') return !!s.isArchived;
                      return true;
                    }).map((s) => {
                      const isCurrent = s.id === activeStudyId;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            onSelectStudy(s.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`p-3.5 rounded-2xl cursor-pointer transition-all active:scale-98 border text-left group relative ${
                            isCurrent
                              ? 'bg-[#F2F2F7] dark:bg-[#222225] border-black/[0.08] dark:border-white/[0.12] shadow-xs'
                              : 'bg-white dark:bg-[#18181A] hover:bg-black/[0.02] dark:hover:bg-[#202023] border-black/[0.04] dark:border-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                              {s.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {s.isArchived && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                  Archivado
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#E03126] text-white">
                                  Activa
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#8E8E93] pt-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <FileText size={11} className="flex-shrink-0" />
                              <span className="truncate font-medium text-slate-600 dark:text-neutral-300">
                                {s.mainVerse?.reference || 'Sin cita'}
                              </span>
                            </div>
                            
                            {/* Botones de Acción: Archivar y Eliminar */}
                            <div className="flex items-center gap-1">
                              {onToggleArchiveStudy && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleArchiveStudy(s.id);
                                  }}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
                                  title={s.isArchived ? "Restaurar prédica a activos" : "Archivar prédica"}
                                >
                                  {s.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                                </button>
                              )}
                              {onDeleteStudy && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStudyToDelete(s);
                                  }}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                  title="Eliminar prédica"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Footer del Sidebar */}
            <div className="p-3 border-t border-black/[0.05] dark:border-white/[0.06] text-center text-[11px] text-[#8E8E93]">
              Toca una prédica para abrirla
            </div>
          </aside>

          {/* Diálogo Modal de Confirmación para Eliminar Mensaje / Prédica */}
          {studyToDelete && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#1C1C1F] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-black/[0.08] dark:border-white/[0.1] space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">¿Eliminar Mensaje?</h3>
                    <p className="text-[11px] text-[#8E8E93]">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                  ¿Estás seguro de que deseas eliminar permanentemente <strong className="text-slate-900 dark:text-white">"{studyToDelete.title}"</strong>?
                </p>
                <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setStudyToDelete(null)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-black dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteStudy) onDeleteStudy(studyToDelete.id);
                      setStudyToDelete(null);
                    }}
                    className="px-4 py-2 text-xs bg-[#E03126] hover:bg-[#C92A20] text-white font-bold rounded-full transition-all active:scale-95 shadow-sm"
                  >
                    Eliminar Definitivamente
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Navbar;
