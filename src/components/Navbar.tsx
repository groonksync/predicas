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
  Trash2,
  Search,
  Sparkles,
  ChevronRight
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
  const [studySearch, setStudySearch] = useState('');
  const [studyToDelete, setStudyToDelete] = useState<Study | null>(null);

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    onAddTopic(newTopicName.trim(), '');
    setNewTopicName('');
    setIsAddingTopic(false);
  };

  const currentTopic = topics.find(t => t.id === activeTopicId);

  const filteredStudies = studies.filter(s => {
    const matchesTab =
      studyFilter === 'activos' ? !s.isArchived :
      studyFilter === 'archivados' ? !!s.isArchived : true;
    const matchesQuery =
      !studySearch.trim() ||
      s.title.toLowerCase().includes(studySearch.toLowerCase()) ||
      s.mainVerse?.reference?.toLowerCase().includes(studySearch.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <>
      <header className="h-16 bg-white/85 dark:bg-[#151518]/85 backdrop-blur-2xl px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 select-none font-sans sticky top-0 shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-colors duration-200">
        
        {/* Izquierda: Selector de Biblioteca y Creación Directa */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#F2F3F5] hover:bg-[#E6E8EC] dark:bg-[#202024] dark:hover:bg-[#29292F] text-[#1C1C1E] dark:text-white transition-all duration-200 active:scale-95"
            title="Abrir biblioteca de temas y prédicas"
          >
            <PanelLeft size={16} className="text-[#8E8E93]" />
            <span className="font-bold text-xs sm:text-sm truncate max-w-[130px] sm:max-w-[190px]">
              {activeTopicName || "Biblioteca"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/[0.06] dark:bg-white/[0.1] text-[#636366] dark:text-neutral-300">
              {studies.filter(s => !s.isArchived).length}
            </span>
          </button>

          {/* Botón Directo: Nueva Prédica en 1 clic desde cualquier vista */}
          <button
            onClick={onAddStudy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#F2F3F5] hover:bg-[#E6E8EC] dark:bg-[#202024] dark:hover:bg-[#29292F] text-[#1C1C1E] dark:text-white text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap"
            title="Crear nueva prédica o estudio bíblico"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nueva Prédica</span>
          </button>

          {/* Indicador del estudio activo */}
          {activeStudyTitle && (
            <div className="hidden lg:flex items-center gap-2 pl-1 text-xs text-[#8E8E93] font-medium truncate max-w-[300px] xl:max-w-[400px]">
              <ChevronRight size={13} className="opacity-50 flex-shrink-0" />
              <span className="truncate text-[#1C1C1E]/80 dark:text-neutral-300 font-semibold">
                {activeStudyTitle}
              </span>
            </div>
          )}
        </div>

        {/* Derecha: Selector de Tema (Luz / Gris), Imprimir y Modo Prédica */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Selector de Modo: Luz y Gris (Sin trazos) */}
          <div className="flex items-center bg-[#F2F3F5] dark:bg-[#202024] p-1 rounded-2xl text-xs font-medium">
            <button
              onClick={() => setTheme('light')}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                theme === 'light'
                  ? 'bg-white text-[#1C1C1E] shadow-xs font-bold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
              }`}
              title="Modo Luz"
            >
              <Sun size={13} />
              <span>Luz</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-[#2E2E34] text-white shadow-xs font-bold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
              }`}
              title="Modo Gris Oscuro"
            >
              <Moon size={13} />
              <span>Gris</span>
            </button>
          </div>

          {/* Botón Imprimir / Exportar */}
          {activeStudyTitle && (
            <button
              onClick={() => (onOpenPrintPreview ? onOpenPrintPreview() : window.print())}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1C1C1E] dark:text-neutral-200 bg-[#F2F3F5] hover:bg-[#E6E8EC] dark:bg-[#202024] dark:hover:bg-[#29292F] rounded-2xl transition-all duration-200 active:scale-95 whitespace-nowrap"
              title="Vista previa de impresión y hoja de púlpito"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>
          )}

          {/* Modo Prédica (Púlpito) en Alto Contraste Luz/Gris */}
          {activeStudyTitle && (
            <button
              onClick={onEnterPulpitMode}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#1C1C1E] hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-[#121214] rounded-2xl shadow-sm transition-all duration-200 active:scale-95 whitespace-nowrap"
              title="Abrir Modo Atril / Púlpito a pantalla completa"
            >
              <Maximize2 size={13} />
              <span>Modo Prédica</span>
            </button>
          )}
        </div>
      </header>

      {/* PANEL LATERAL DESLIZABLE (BIBLIOTECA DE TEMAS Y PRÉDICAS SIN TRAZOS) */}
      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside className="fixed top-0 left-0 bottom-0 w-84 sm:w-96 bg-[#F8F9FB] dark:bg-[#161619] z-50 shadow-2xl flex flex-col font-sans select-none animate-slideRight">
            
            {/* Cabecera del Panel Lateral */}
            <div className="px-6 pt-6 pb-4 bg-white dark:bg-[#1C1C20] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F2F3F5] dark:bg-[#26262B] text-[#1C1C1E] dark:text-white flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-white leading-tight">
                    Biblioteca de Estudios
                  </h3>
                  <span className="text-[11px] text-[#8E8E93]">
                    Temas y bosquejos de predicación
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F2F3F5] dark:bg-[#26262B] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white flex items-center justify-center transition-colors"
                title="Cerrar biblioteca"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              
              {/* SECCIÓN 1: TEMAS BÍBLICOS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Categorías Temáticas ({topics.length})
                  </span>
                  <button
                    onClick={() => setIsAddingTopic(!isAddingTopic)}
                    className="text-xs font-bold text-[#1C1C1E] dark:text-neutral-200 hover:opacity-80 flex items-center gap-1 px-3 py-1 rounded-xl bg-white dark:bg-[#222227] shadow-2xs transition-all"
                  >
                    <Plus size={12} />
                    <span>Nuevo Tema</span>
                  </button>
                </div>

                {/* Formulario para añadir nuevo tema */}
                {isAddingTopic && (
                  <form onSubmit={handleCreateTopic} className="p-3 bg-white dark:bg-[#222227] rounded-2xl shadow-sm space-y-2.5 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Nombre del nuevo tema bíblico..."
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#F2F3F5] dark:bg-[#161619] rounded-xl text-[#1C1C1E] dark:text-white focus:outline-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingTopic(false)}
                        className="px-3 py-1 text-xs text-[#8E8E93] font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 text-xs bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] font-bold rounded-xl"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de temas */}
                <div className="grid grid-cols-1 gap-1.5">
                  {topics.map((t) => {
                    const isActive = t.id === activeTopicId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelectTopic(t.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs text-left transition-all duration-200 active:scale-[0.99] ${
                          isActive
                            ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] font-bold shadow-sm'
                            : 'bg-white/70 dark:bg-[#1E1E23] text-[#1C1C1E] dark:text-neutral-300 hover:bg-white dark:hover:bg-[#25252B]'
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
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] truncate">
                    Prédicas en {currentTopic?.name || 'Tema'} ({studies.length})
                  </span>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      onAddStudy();
                    }}
                    className="text-xs font-bold bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] flex items-center gap-1 px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all"
                  >
                    <Plus size={12} />
                    <span>Crear Prédica</span>
                  </button>
                </div>

                {/* Buscador rápido de prédicas dentro del tema */}
                {studies.length > 1 && (
                  <div className="relative">
                    <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                    <input
                      type="text"
                      value={studySearch}
                      onChange={(e) => setStudySearch(e.target.value)}
                      placeholder="Filtrar por título o pasaje..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E1E23] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none"
                    />
                  </div>
                )}

                {/* Filtro Activos / Archivados / Todos */}
                <div className="flex bg-[#EAEAEE] dark:bg-[#202025] p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStudyFilter('activos')}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      studyFilter === 'activos'
                        ? 'bg-white dark:bg-[#2E2E35] text-[#1C1C1E] dark:text-white shadow-2xs'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                    }`}
                  >
                    Activos ({studies.filter(s => !s.isArchived).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyFilter('archivados')}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      studyFilter === 'archivados'
                        ? 'bg-white dark:bg-[#2E2E35] text-[#1C1C1E] dark:text-white shadow-2xs'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                    }`}
                  >
                    Archivados ({studies.filter(s => s.isArchived).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyFilter('todos')}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      studyFilter === 'todos'
                        ? 'bg-white dark:bg-[#2E2E35] text-[#1C1C1E] dark:text-white shadow-2xs'
                        : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                    }`}
                  >
                    Todos ({studies.length})
                  </button>
                </div>

                {/* Lista de prédicas */}
                <div className="space-y-2">
                  {filteredStudies.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8E8E93] bg-white/60 dark:bg-[#1E1E23] rounded-2xl space-y-2">
                      <Sparkles size={18} className="mx-auto text-[#8E8E93]" />
                      <p>
                        {studyFilter === 'archivados'
                          ? 'No hay prédicas archivadas en este tema.'
                          : 'Aún no hay prédicas en este tema.'}
                      </p>
                    </div>
                  ) : (
                    filteredStudies.map((s) => {
                      const isSelected = s.id === activeStudyId;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            onSelectStudy(s.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`group w-full p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] shadow-md'
                              : 'bg-white dark:bg-[#1E1E23] hover:bg-[#F0F1F4] dark:hover:bg-[#26262C] text-[#1C1C1E] dark:text-neutral-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <FileText size={15} className={`mt-0.5 flex-shrink-0 ${
                                isSelected ? 'opacity-90' : 'text-[#8E8E93]'
                              }`} />
                              <div className="min-w-0">
                                <div className="font-bold text-xs sm:text-sm truncate">
                                  {s.title}
                                </div>
                                <div className={`text-[11px] truncate mt-0.5 ${
                                  isSelected ? 'opacity-75' : 'text-[#8E8E93]'
                                }`}>
                                  {s.mainVerse?.reference || 'Sin pasaje central'} • {s.outlinePoints.length} pts
                                </div>
                              </div>
                            </div>

                            {/* Acciones rápidas: Archivar y Eliminar */}
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100">
                              {onToggleArchiveStudy && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleArchiveStudy(s.id);
                                  }}
                                  className={`p-1.5 rounded-xl transition-colors ${
                                    isSelected
                                      ? 'hover:bg-white/15 dark:hover:bg-black/10'
                                      : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                                  }`}
                                  title={s.isArchived ? "Restaurar prédica" : "Archivar prédica"}
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
                                  className={`p-1.5 rounded-xl transition-colors ${
                                    isSelected
                                      ? 'hover:bg-white/15 dark:hover:bg-black/10'
                                      : 'text-[#8E8E93] hover:text-red-500 hover:bg-red-500/10'
                                  }`}
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
            <div className="p-4 bg-white dark:bg-[#1C1C20] text-center text-[11px] text-[#8E8E93]">
              Selecciona una prédica para abrir su lienzo de estudio
            </div>
          </aside>

          {/* Modal de Confirmación para Eliminar Prédica */}
          {studyToDelete && (
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
                  ¿Estás seguro de que deseas eliminar permanentemente <strong className="text-[#1C1C1E] dark:text-white">"{studyToDelete.title}"</strong>?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStudyToDelete(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteStudy) onDeleteStudy(studyToDelete.id);
                      setStudyToDelete(null);
                    }}
                    className="px-4 py-2 text-xs bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] font-bold rounded-xl transition-all active:scale-95 shadow-xs"
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
