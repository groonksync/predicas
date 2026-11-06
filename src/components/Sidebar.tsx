import React, { useState } from 'react';
import { 
  Sparkles, 
  Shield, 
  HeartHandshake, 
  Scroll, 
  Flame, 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  Calendar, 
  Trash2
} from 'lucide-react';
import { Topic, Study } from '../types';

interface SidebarProps {
  topics: Topic[];
  activeTopicId: string;
  onSelectTopic: (topicId: string) => void;
  studies: Study[];
  activeStudyId: string;
  onSelectStudy: (studyId: string) => void;
  onAddStudy: () => void;
  onAddTopic: (name: string, description: string) => void;
  onDeleteStudy: (studyId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  topics,
  activeTopicId,
  onSelectTopic,
  studies,
  activeStudyId,
  onSelectStudy,
  onAddStudy,
  onAddTopic,
  onDeleteStudy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  // Icon resolver (Apple Space Gray neutral icons)
  const getTopicIcon = (iconName: string, isActive: boolean) => {
    const cls = isActive ? 'text-white' : 'text-slate-500 dark:text-neutral-400';
    switch (iconName) {
      case 'Sparkles': return <Sparkles size={16} className={cls} />;
      case 'Shield': return <Shield size={16} className={cls} />;
      case 'HeartHandshake': return <HeartHandshake size={16} className={cls} />;
      case 'Scroll': return <Scroll size={16} className={cls} />;
      case 'Flame': return <Flame size={16} className={cls} />;
      case 'Users': return <Users size={16} className={cls} />;
      default: return <BookOpen size={16} className={cls} />;
    }
  };

  const filteredTopics = topics.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudies = studies.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    onAddTopic(newTopicName.trim(), newTopicDesc.trim());
    setNewTopicName('');
    setNewTopicDesc('');
    setIsAddingTopic(false);
  };

  return (
    <aside className="w-76 flex-shrink-0 bg-[#F8F8FA] dark:bg-[#18181A] border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col h-[calc(100vh-3.5rem)] select-none font-sans">
      {/* Apple Inset Search Field (Neutral Gray) */}
      <div className="p-3.5 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar temas o prédicas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/[0.05] dark:bg-[#222225] border-0 rounded-xl text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
        </div>
      </div>

      {/* Main scrolling section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Section 1: Sectors / Topics */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
              Temas Bíblicos
            </span>
            <button
              onClick={() => setIsAddingTopic(!isAddingTopic)}
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-black/[0.05] hover:bg-black/[0.1] dark:bg-[#242427] dark:hover:bg-[#2E2E32] text-slate-800 dark:text-neutral-200 flex items-center gap-1 transition-all active:scale-95"
              title="Añadir nuevo tema"
            >
              <Plus size={13} />
              <span>Nuevo</span>
            </button>
          </div>

          {/* New Topic Inline Form */}
          {isAddingTopic && (
            <form onSubmit={handleCreateTopicSubmit} className="mb-3 p-3 bg-white dark:bg-[#222225] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-2">
              <input
                type="text"
                placeholder="Nombre del tema..."
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="w-full text-xs p-2 bg-[#F2F2F7] dark:bg-[#18181A] border-0 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTopic(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs bg-[#1C1C1E] hover:bg-black dark:bg-white dark:text-[#1C1C1E] text-white rounded-xl font-bold shadow-xs transition-transform active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}

          {/* Topics List - Apple Rounded Pill Style (Titanium Gray in Dark Mode) */}
          <div className="space-y-1">
            {filteredTopics.map((topic) => {
              const isActive = topic.id === activeTopicId;
              return (
                <button
                  key={topic.id}
                  onClick={() => onSelectTopic(topic.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-left transition-all ${
                    isActive
                      ? 'bg-[#1C1C1E] text-white dark:bg-[#2C2C2F] dark:text-white font-bold shadow-xs'
                      : 'text-slate-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-[#222225] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span>{getTopicIcon(topic.iconName, isActive)}</span>
                    <span className="truncate">{topic.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Studies in current topic */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">
              Prédicas y Estudios
            </span>
            <button
              onClick={onAddStudy}
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-black/[0.05] hover:bg-black/[0.1] dark:bg-[#242427] dark:hover:bg-[#2E2E32] text-slate-800 dark:text-neutral-200 flex items-center gap-1 transition-all active:scale-95"
              title="Añadir nueva prédica"
            >
              <Plus size={13} />
              <span>Añadir</span>
            </button>
          </div>

          <div className="space-y-2">
            {filteredStudies.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-neutral-500">
                No hay estudios. Haz clic en <strong>+ Añadir</strong>.
              </div>
            ) : (
              filteredStudies.map((study) => {
                const isSelected = study.id === activeStudyId;
                return (
                  <div
                    key={study.id}
                    onClick={() => onSelectStudy(study.id)}
                    className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-[#262629] ring-2 ring-neutral-400 dark:ring-white/80 shadow-apple text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-[#1E1E21] hover:bg-white dark:hover:bg-[#242427] border border-black/[0.04] dark:border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs leading-snug line-clamp-2 ${
                          isSelected ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-neutral-300'
                        }`}>
                          {study.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#8E8E93] font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {study.date}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-neutral-300">
                            {study.mainVerse.reference}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Eliminar este estudio de prédica?')) {
                            onDeleteStudy(study.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
