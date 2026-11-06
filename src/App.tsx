import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { StudyCanvas } from './components/StudyCanvas';
import { RightNotesPanel } from './components/RightNotesPanel';
import { PulpitMode } from './components/PulpitMode';
import { VerseModal } from './components/VerseModal';
import { ImageModal } from './components/ImageModal';
import { CreateStudyModal } from './components/CreateStudyModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { QuickAccess } from './components/QuickAccess';
import { INITIAL_TOPICS, INITIAL_STUDIES } from './data/initialData';
import { Topic, Study, BibleVerse } from './types';

export const App: React.FC = () => {
  // Theme state: Solo dos modos según especificación: 'light' (Luz) | 'dark' (Gris oscuro)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('study_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Migración para limpiar datos de ejemplo iniciales solicitados por el usuario
  const CLEAN_VERSION = 'v3_empty_clean';
  if (typeof window !== 'undefined' && localStorage.getItem('study_platform_version') !== CLEAN_VERSION) {
    localStorage.setItem('study_platform_version', CLEAN_VERSION);
    localStorage.removeItem('study_data_map');
    localStorage.removeItem('study_active_study');
  }

  // Topics state
  const [topics, setTopics] = useState<Topic[]>(() => {
    const saved = localStorage.getItem('study_topics');
    return saved ? JSON.parse(saved) : INITIAL_TOPICS;
  });

  // Active topic
  const [activeTopicId, setActiveTopicId] = useState<string>(() => {
    return localStorage.getItem('study_active_topic') || 'salvacion';
  });

  // Studies state (inicia completamente vacío)
  const [studiesMap, setStudiesMap] = useState<Record<string, Study[]>>(() => {
    const saved = localStorage.getItem('study_data_map');
    if (!saved) return INITIAL_STUDIES;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_STUDIES;
    }
  });

  // Active study id
  const [activeStudyId, setActiveStudyId] = useState<string>(() => {
    const currentList = studiesMap[activeTopicId] || [];
    return currentList[0]?.id || '';
  });

  // Right-hand Sermon Outline Panel open state (default true for writing and editing)
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);

  // Fullscreen Pulpit / Preaching Mode
  const [isPulpitMode, setIsPulpitMode] = useState(false);

  // Modals
  const [verseModalOpen, setVerseModalOpen] = useState(false);
  const [isVerseModalForMain, setIsVerseModalForMain] = useState(false);
  const [isCreateStudyModalOpen, setIsCreateStudyModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [imageModalData, setImageModalData] = useState<{ url: string; title: string } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('study_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('study_topics', JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem('study_active_topic', activeTopicId);
  }, [activeTopicId]);

  useEffect(() => {
    localStorage.setItem('study_data_map', JSON.stringify(studiesMap));
  }, [studiesMap]);

  // Current topic and study helpers
  const currentTopic = topics.find(t => t.id === activeTopicId) || topics[0];
  const currentStudies = studiesMap[activeTopicId] || [];
  const currentStudy = currentStudies.find(s => s.id === activeStudyId) || currentStudies[0] || null;

  // Handle study update
  const handleUpdateStudy = (updated: Study) => {
    setStudiesMap(prev => {
      const topicStudies = prev[activeTopicId] || [];
      const newTopicStudies = topicStudies.map(s => s.id === updated.id ? updated : s);
      return {
        ...prev,
        [activeTopicId]: newTopicStudies
      };
    });
  };

  // Toggle archive status of a study / message
  const handleToggleArchiveStudy = (studyId: string) => {
    setStudiesMap(prev => {
      const topicStudies = prev[activeTopicId] || [];
      const newTopicStudies = topicStudies.map(s => {
        if (s.id === studyId) {
          return { ...s, isArchived: !s.isArchived };
        }
        return s;
      });
      return {
        ...prev,
        [activeTopicId]: newTopicStudies
      };
    });
  };

  // Permanently delete a study / message with clean state fallback
  const handleDeleteStudy = (studyId: string) => {
    setStudiesMap(prev => {
      const topicStudies = prev[activeTopicId] || [];
      const filtered = topicStudies.filter(s => s.id !== studyId);
      
      // If we deleted the currently active study, pick the first available active one
      if (activeStudyId === studyId) {
        const nextActive = filtered.find(s => !s.isArchived) || filtered[0] || null;
        setActiveStudyId(nextActive ? nextActive.id : '');
      }

      return {
        ...prev,
        [activeTopicId]: filtered
      };
    });
  };

  // Add new topic
  const handleAddTopic = (name: string, description: string) => {
    const newId = `topic-${Date.now()}`;
    const newTopic: Topic = {
      id: newId,
      name,
      description: description || 'Estudio temático de las Escrituras',
      colorBadge: 'amber',
      iconName: 'BookOpen'
    };

    const initialStudy: Study = {
      id: `study-${Date.now()}`,
      topicId: newId,
      title: `${name}: Fundamento Bíblico`,
      subtitle: 'Introducción al estudio y pasajes clave',
      date: new Date().toISOString().split('T')[0],
      mainVerse: {
        id: `mv-${Date.now()}`,
        reference: '2 Timoteo 3:16-17',
        version: 'RVR1960',
        text: 'Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia.'
      },
      relatedVerses: [],
      outlinePoints: [
        {
          id: `p-${Date.now()}-1`,
          number: 1,
          title: '1. Introducción al Principio Divino',
          scriptureRef: '',
          content: 'Escribe aquí la base y propósito del mensaje...'
        }
      ],
      detailedNotes: '',
      images: [],
      videos: [],
      quickNotes: []
    };

    setTopics([...topics, newTopic]);
    setStudiesMap(prev => ({
      ...prev,
      [newId]: [initialStudy]
    }));
    setActiveTopicId(newId);
    setActiveStudyId(initialStudy.id);
  };

  // Create a new topic only (without dummy study, for use in the create study modal)
  const handleCreateTopicOnly = (name: string): string => {
    const newId = `topic-${Date.now()}`;
    const newTopic: Topic = {
      id: newId,
      name: name.trim(),
      description: 'Estudio temático de las Escrituras',
      colorBadge: 'blue',
      iconName: 'BookOpen'
    };
    setTopics(prev => [...prev, newTopic]);
    setStudiesMap(prev => ({
      ...prev,
      [newId]: []
    }));
    return newId;
  };

  // Open Create Study Modal
  const handleAddStudy = () => {
    setIsCreateStudyModalOpen(true);
  };

  // Confirm creation of new study from the guided modal
  const handleConfirmCreateStudy = (newStudy: Study, topicId: string) => {
    setStudiesMap(prev => ({
      ...prev,
      [topicId]: [newStudy, ...(prev[topicId] || [])]
    }));
    setActiveTopicId(topicId);
    setActiveStudyId(newStudy.id);
  };

  // Add verse to current study or apply main verse
  const handleAddVerseToCurrentStudy = (verse: BibleVerse) => {
    if (!currentStudy) return;
    if (isVerseModalForMain) {
      handleUpdateStudy({
        ...currentStudy,
        mainVerse: verse
      });
    } else {
      handleUpdateStudy({
        ...currentStudy,
        relatedVerses: [...currentStudy.relatedVerses, verse]
      });
    }
  };

  // Topic select helper
  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    const studies = studiesMap[topicId] || [];
    if (studies.length > 0) {
      setActiveStudyId(studies[0].id);
    }
  };

  // Theme wrapper styling: 'light' (Luz) o 'dark' (Gris oscuro y Negro)
  const getThemeClass = () => {
    if (theme === 'dark') return 'dark bg-[#121214] text-[#F5F5F7]';
    return 'bg-[#F4F4F6] text-[#1C1C1E]';
  };

  return (
    <div className={`min-h-screen flex flex-col ${getThemeClass()} transition-colors duration-200`}>
      {/* Top Navbar with integrated Topic & Sermon Selector */}
      <Navbar
        topics={topics}
        activeTopicId={activeTopicId}
        onSelectTopic={handleSelectTopic}
        studies={currentStudies}
        activeStudyId={activeStudyId}
        onSelectStudy={setActiveStudyId}
        onAddStudy={handleAddStudy}
        onAddTopic={handleAddTopic}
        onToggleArchiveStudy={handleToggleArchiveStudy}
        onDeleteStudy={handleDeleteStudy}
        onEnterPulpitMode={() => setIsPulpitMode(true)}
        onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
        theme={theme}
        setTheme={setTheme}
        activeTopicName={currentTopic?.name}
        activeStudyTitle={currentStudy?.title}
      />

      {/* Main Split Layout: Left Scripture/Study Stage + Right Sermon Outline Writing Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Scriptures, Reading, Interactive Verse Cards, Exegesis & Resources */}
        {currentStudy ? (
          <StudyCanvas
            study={currentStudy}
            onUpdateStudy={handleUpdateStudy}
            onToggleArchiveStudy={handleToggleArchiveStudy}
            onDeleteStudy={handleDeleteStudy}
            onOpenVerseModal={() => {
              setIsVerseModalForMain(false);
              setVerseModalOpen(true);
            }}
            onOpenApplyMainVerse={() => {
              setIsVerseModalForMain(true);
              setVerseModalOpen(true);
            }}
            onOpenImagePreview={(url, title) => setImageModalData({ url, title })}
            onToggleOutline={() => setIsOutlineOpen(!isOutlineOpen)}
            isOutlineOpen={isOutlineOpen}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#141416]">
            <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#1C1C1F] border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E03126]/10 text-[#E03126] flex items-center justify-center font-bold">
                <BookOpen size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Lienzo de Prédicas Vacío
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  No hay prédicas ni enseñanzas cargadas. Crea tu primer estudio bíblico para comenzar a predicar.
                </p>
              </div>
              <button
                onClick={() => setIsCreateStudyModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E03126] hover:bg-[#C92A20] active:scale-95 transition-all shadow-xs border-0"
              >
                + Crear Nueva Prédica
              </button>
            </div>
          </div>
        )}

        {/* Right: Dedicated Notes, Exegesis & Sermon Outline Panel */}
        {currentStudy && (
          <RightNotesPanel
            study={currentStudy}
            onUpdateStudy={handleUpdateStudy}
            isOpen={isOutlineOpen}
            onToggle={() => setIsOutlineOpen(!isOutlineOpen)}
            onOpenVerseModal={() => {
              setIsVerseModalForMain(false);
              setVerseModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Fullscreen Pulpit / Preaching Mode for iPad on Lectern */}
      {isPulpitMode && currentStudy && (
        <PulpitMode
          study={currentStudy}
          onExit={() => setIsPulpitMode(false)}
          onAddVerse={handleAddVerseToCurrentStudy}
        />
      )}

      {/* Dock de Acceso Rápido y Buscador Universal en Modo Normal */}
      {!isPulpitMode && currentStudy && (
        <QuickAccess
          study={currentStudy}
          onAddVerse={handleAddVerseToCurrentStudy}
          variant="normal"
          onOpenNotesPanel={() => setIsOutlineOpen(true)}
        />
      )}

      {/* Verse selection & creation modal */}
      <VerseModal
        isOpen={verseModalOpen}
        onClose={() => setVerseModalOpen(false)}
        onAddVerse={handleAddVerseToCurrentStudy}
        isMainVerse={isVerseModalForMain}
      />

      {/* Modal Guiado para Crear Nueva Prédica */}
      <CreateStudyModal
        isOpen={isCreateStudyModalOpen}
        onClose={() => setIsCreateStudyModalOpen(false)}
        topics={topics}
        activeTopicId={activeTopicId}
        onCreateStudy={handleConfirmCreateStudy}
        onCreateTopicOnly={handleCreateTopicOnly}
      />

      {/* Vista previa de impresión con panel lateral de opciones */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        study={currentStudy}
        topicName={currentTopic?.name}
      />

      {/* Fullscreen Image Preview modal */}
      {imageModalData && (
        <ImageModal
          isOpen={!!imageModalData}
          onClose={() => setImageModalData(null)}
          imageUrl={imageModalData.url}
          title={imageModalData.title}
        />
      )}
    </div>
  );
};

export default App;
