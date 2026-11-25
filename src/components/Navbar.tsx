import React, { useState } from 'react';
import { 
  Maximize2, 
  Printer, 
  Sun, 
  Moon,
  BookOpen,
  Plus,
  FolderOpen,
  PanelLeft,
  PanelLeftClose,
  Archive,
  ArchiveRestore,
  Trash2,
  Search,
  Sparkles,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Topic, Study } from '../types';
import { getDateInfo } from '../utils/dateInfo';

interface NavbarProps {
  topics: Topic[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  studies: Study[];
  activeStudyId: string;
  onSelectStudy: (studyId: string) => void;
  onAddStudy: () => void;
  onAddTopic: (name: string, description: string) => void;
  onDeleteTopic?: (topicId: string) => void;
  onKeepOnlyTopic?: (topicId: string) => void;
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
  onDeleteTopic,
  onKeepOnlyTopic,
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
      <header className="h-15 sm:h-16 bg-white/90 dark:bg-[#1B1B20]/90 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 select-none font-sans flex-shrink-0 transition-colors duration-200">
        
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
              title="Modo Claro"
            >
              <Sun size={13} />
              <span>Claro</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-[#2E2E34] text-white shadow-xs font-bold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
              }`}
              title="Modo Oscuro"
            >
              <Moon size={13} />
              <span>Oscuro</span>
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

          <aside className="fixed top-0 left-0 bottom-0 w-[88vw] max-w-[400px] bg-[#F6F7F9] dark:bg-[#18181D] border-r border-black/[0.05] dark:border-white/[0.06] z-50 shadow-2xl flex flex-col font-sans select-none animate-slideRight">
            
            {/* Cabecera */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E8E93]">Biblioteca</p>
                <h3 className="font-black text-xl tracking-tight text-[#1C1C1E] dark:text-white leading-tight mt-0.5">
                  Mis Estudios
                </h3>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-9 h-9 rounded-xl bg-white dark:bg-[#23232A] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white flex items-center justify-center transition-colors active:scale-95"
                title="Cerrar biblioteca"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Buscador global */}
            <div className="px-6 pb-4">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                <input
                  type="text"
                  value={studySearch}
                  onChange={(e) => setStudySearch(e.target.value)}
                  placeholder="Buscar por título o pasaje..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-[#23232A] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none transition-colors"
                />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-7 scrollbar-none">

              {/* CATEGORÍAS */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    Categorías · {topics.length}
                  </h4>
                  <button
                    onClick={() => setIsAddingTopic(!isAddingTopic)}
                    className="text-[11px] font-bold text-[#636366] dark:text-neutral-300 hover:text-[#1C1C1E] dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} />
                    <span>Nueva</span>
                  </button>
                </div>

                {isAddingTopic && (
                  <form onSubmit={handleCreateTopic} className="p-3 bg-white dark:bg-[#23232A] rounded-2xl space-y-2.5 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Nombre de la categoría..."
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#F2F3F5] dark:bg-[#131316] rounded-xl text-[#1C1C1E] dark:text-white focus:outline-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsAddingTopic(false)} className="px-3 py-1.5 text-xs text-[#8E8E93] font-semibold">
                        Cancelar
                      </button>
                      <button type="submit" className="px-4 py-1.5 text-xs bg-[#1C1C1E] dark:bg-white text-white dark:text-[#121214] font-bold rounded-xl">
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-1">
                  {topics.map((t) => {
                    const isActive = t.id === activeTopicId;
                    return (
                      <div
                        key={t.id}
                        className={`group flex items-center rounded-xl transition-all duration-200 ${
                          isActive ? 'bg-white dark:bg-[#23232A] shadow-xs' : 'hover:bg-white/70 dark:hover:bg-[#1A1A1E]'
                        }`}
                      >
                        <button
                          onClick={() => onSelectTopic(t.id)}
                          className="flex-1 min-w-0 flex items-center gap-3 px-3.5 py-3 text-left"
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive
                              ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]'
                              : 'bg-[#E9EAEE] dark:bg-[#26262B] text-[#8E8E93]'
                          }`}>
                            <FolderOpen size={14} />
                          </span>
                          <span className={`text-sm truncate ${
                            isActive ? 'font-bold text-[#1C1C1E] dark:text-white' : 'font-medium text-[#48484D] dark:text-neutral-300'
                          }`}>
                            {t.name}
                          </span>
                          {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                        </button>
                        {onDeleteTopic && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar la categoría "${t.name}" y todas sus prédicas?`)) {
                                onDeleteTopic(t.id);
                              }
                            }}
                            className="p-2 mr-2 rounded-lg text-[#8E8E93] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                            title="Eliminar categoría"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {onKeepOnlyTopic && topics.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Conservar solo "${currentTopic?.name}" y eliminar las demás categorías?`)) {
                        onKeepOnlyTopic(activeTopicId);
                      }
                    }}
                    className="w-full text-[11px] font-bold py-2 rounded-xl text-[#636366] dark:text-neutral-400 hover:text-[#1C1C1E] dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.05] transition-colors"
                  >
                    Conservar solo «{currentTopic?.name}»
                  </button>
                )}
              </section>

              {/* PRÉDICAS */}
              <section className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] truncate">
                  Prédicas · {currentTopic?.name || 'Tema'}
                </h4>

                <div className="flex bg-[#E9EAEE] dark:bg-[#23232A] p-1 rounded-xl text-[11px] font-bold">
                  {([
                    { key: 'activos', label: 'Activos', count: studies.filter(s => !s.isArchived).length },
                    { key: 'archivados', label: 'Archivo', count: studies.filter(s => s.isArchived).length },
                    { key: 'todos', label: 'Todos', count: studies.length },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setStudyFilter(tab.key)}
                      className={`flex-1 py-2 rounded-lg transition-all ${
                        studyFilter === tab.key
                          ? 'bg-white dark:bg-[#34343B] text-[#1C1C1E] dark:text-white shadow-xs'
                          : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                      }`}
                    >
                      {tab.label} <span className="opacity-60">{tab.count}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5">
                  {filteredStudies.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#8E8E93] space-y-2">
                      <Sparkles size={20} className="mx-auto" />
                      <p>
                        {studySearch.trim()
                          ? 'Sin resultados para tu búsqueda.'
                          : studyFilter === 'archivados'
                            ? 'No hay prédicas archivadas.'
                            : 'Aún no hay prédicas en esta categoría.'}
                      </p>
                    </div>
                  ) : (
                    filteredStudies.map((s) => {
                      const isSelected = s.id === activeStudyId;
                      const info = getDateInfo(s.date);
                      const soon = info.tone === 'hoy' || info.tone === 'proxima';
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            onSelectStudy(s.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-white dark:bg-[#23232A] shadow-md'
                              : 'bg-white/60 dark:bg-[#1F1F25] hover:bg-white dark:hover:bg-[#1F1F24]'
                          }`}
                        >
                          {isSelected && <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-[#1C1C1E] dark:bg-white" />}

                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-sm leading-snug text-[#1C1C1E] dark:text-white line-clamp-2">
                              {s.title}
                            </h5>
                            <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1.5 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onToggleArchiveStudy && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onToggleArchiveStudy(s.id); }}
                                  className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                                  title={s.isArchived ? 'Restaurar prédica' : 'Archivar prédica'}
                                >
                                  {s.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                                </button>
                              )}
                              {onDeleteStudy && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setStudyToDelete(s); }}
                                  className="p-1.5 rounded-lg text-[#8E8E93] hover:text-red-500 hover:bg-red-500/10"
                                  title="Eliminar prédica"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-[#8E8E93] mt-1 flex items-center gap-1.5">
                            <BookOpen size={11} />
                            <span className="truncate">{s.mainVerse?.reference || 'Sin pasaje central'}</span>
                            <span>·</span>
                            <span className="whitespace-nowrap">{s.outlinePoints.length} pts</span>
                          </p>

                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                              soon
                                ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214]'
                                : 'bg-black/[0.05] dark:bg-white/[0.07] text-[#636366] dark:text-neutral-300'
                            }`}>
                              <Calendar size={10} />
                              {info.weekday ? `${info.weekday.slice(0, 3)}. ${info.long.replace(/ de \d{4}$/, '')}` : 'Sin fecha'}
                            </span>
                            {info.tone !== 'vacia' && (
                              <span className="text-[10px] font-medium text-[#8E8E93]">{info.message}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

            </div>

            {/* Acción principal fija */}
            <div className="px-6 py-4 bg-[#F6F7F9] dark:bg-[#18181D]">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  onAddStudy();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Nueva Prédica</span>
              </button>
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
