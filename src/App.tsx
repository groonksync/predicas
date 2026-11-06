import React, { useState, useEffect } from 'react';
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
  // Theme state: 'light' | 'parchment' | 'dark'
  const [theme, setTheme] = useState<'light' | 'parchment' | 'dark'>(() => {
    return (localStorage.getItem('study_theme') as any) || 'dark';
  });

  // Topics state
  const [topics, setTopics] = useState<Topic[]>(() => {
    const saved = localStorage.getItem('study_topics');
    return saved ? JSON.parse(saved) : INITIAL_TOPICS;
  });

  // Active topic
  const [activeTopicId, setActiveTopicId] = useState<string>(() => {
    return localStorage.getItem('study_active_topic') || 'salvacion';
  });

  // Studies state
  const [studiesMap, setStudiesMap] = useState<Record<string, Study[]>>(() => {
    const saved = localStorage.getItem('study_data_map');
    if (!saved) return INITIAL_STUDIES;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.salvacion && parsed.salvacion[0] && (!parsed.salvacion[0].detailedNotes || !parsed.salvacion[0].detailedNotes.includes('Léxico Griego'))) {
        parsed.salvacion[0].detailedNotes = INITIAL_STUDIES.salvacion[0].detailedNotes;
      }
      return parsed;
    } catch {
      return INITIAL_STUDIES;
    }
  });

  // Active study id
  const [activeStudyId, setActiveStudyId] = useState<string>(() => {
    const currentList = studiesMap[activeTopicId] || [];
    return currentList[0]?.id || 'estudio-salvacion-gracia';
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

  // Theme wrapper styling: Apple Space Gray in Dark Mode (NO blue)
  const getThemeClass = () => {
    if (theme === 'dark') return 'dark bg-[#141416] text-[#F5F5F7]';
    if (theme === 'parchment') return 'bg-[#FAF7F2] text-stone-900';
    return 'bg-[#F2F2F7] text-slate-900';
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
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
            <p>Selecciona o crea una prédica para comenzar el estudio.</p>
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
