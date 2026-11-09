import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
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
  // Theme state: 'light' (Luz) | 'dark' (Gris oscuro)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('study_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const CLEAN_VERSION = 'v3_empty_clean';
  if (typeof window !== 'undefined' && localStorage.getItem('study_platform_version') !== CLEAN_VERSION) {
    localStorage.setItem('study_platform_version', CLEAN_VERSION);
    localStorage.removeItem('study_data_map');
    localStorage.removeItem('study_active_study');
  }

  const [topics, setTopics] = useState<Topic[]>(() => {
    const saved = localStorage.getItem('study_topics');
    return saved ? JSON.parse(saved) : INITIAL_TOPICS;
  });

  const [activeTopicId, setActiveTopicId] = useState<string>(() => {
    return localStorage.getItem('study_active_topic') || 'salvacion';
  });

  const [studiesMap, setStudiesMap] = useState<Record<string, Study[]>>(() => {
    const saved = localStorage.getItem('study_data_map');
    if (!saved) return INITIAL_STUDIES;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_STUDIES;
    }
  });

  const [activeStudyId, setActiveStudyId] = useState<string>(() => {
    const currentList = studiesMap[activeTopicId] || [];
    return currentList[0]?.id || '';
  });

  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [isPulpitMode, setIsPulpitMode] = useState(false);

  const [verseModalOpen, setVerseModalOpen] = useState(false);
  const [isVerseModalForMain, setIsVerseModalForMain] = useState(false);
  const [isCreateStudyModalOpen, setIsCreateStudyModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [imageModalData, setImageModalData] = useState<{ url: string; title: string } | null>(null);

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

  const currentTopic = topics.find(t => t.id === activeTopicId) || topics[0];
  const currentStudies = studiesMap[activeTopicId] || [];
  const currentStudy = currentStudies.find(s => s.id === activeStudyId) || currentStudies[0] || null;

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

  const handleDeleteStudy = (studyId: string) => {
    setStudiesMap(prev => {
      const topicStudies = prev[activeTopicId] || [];
      const filtered = topicStudies.filter(s => s.id !== studyId);
      
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

  const handleAddStudy = () => {
    setIsCreateStudyModalOpen(true);
  };

  const handleConfirmCreateStudy = (newStudy: Study, topicId: string) => {
    setStudiesMap(prev => ({
      ...prev,
      [topicId]: [newStudy, ...(prev[topicId] || [])]
    }));
    setActiveTopicId(topicId);
    setActiveStudyId(newStudy.id);
  };

  // Cargar un estudio modelo completo con 1 clic para explorar todas las herramientas
  const handleLoadSampleStudy = () => {
    const sampleStudy: Study = {
      id: `study-sample-${Date.now()}`,
      topicId: activeTopicId,
      title: 'El Regalo Inmerecido de la Gracia',
      subtitle: 'Exposición homilética sobre la salvación por medio de la fe y no por obras',
      date: new Date().toISOString().split('T')[0],
      mainVerse: {
        id: 'mv-sample',
        reference: 'Efesios 2:8-9',
        version: 'RVR1960',
        text: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.'
      },
      relatedVerses: [
        {
          id: 'rv-1',
          reference: 'Romanos 5:8',
          version: 'RVR1960',
          text: 'Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.'
        },
        {
          id: 'rv-2',
          reference: 'Tito 3:5',
          version: 'RVR1960',
          text: 'Nos salvó, no por obras de justicia que nosotros hubiéramos hecho, sino por su misericordia.'
        }
      ],
      outlinePoints: [
        {
          id: 'pt-1',
          number: 1,
          title: 'El Origen Divino de la Salvación (La Gracia)',
          scriptureRef: 'Efesios 2:8a',
          content: 'La iniciativa nace íntegramente en el corazón de Dios (Cháris) y no en el mérito humano.'
        },
        {
          id: 'pt-2',
          number: 2,
          title: 'El Canal de Recepción (Por Medio de la Fe)',
          scriptureRef: 'Efesios 2:8b',
          content: 'La fe (Pístis) no es una obra meritoria, sino la mano vacía que recibe el regalo de Cristo.'
        },
        {
          id: 'pt-3',
          number: 3,
          title: 'El Propósito Final: Cero Jactancia y Vida Nueva',
          scriptureRef: 'Efesios 2:9-10',
          content: 'Somos hechura suya (Poíema), creados en Cristo Jesús para buenas obras como fruto, no como raíz.'
        }
      ],
      detailedNotes: `**Griego — Gracia:** *Cháris* (Strong G5485)\n- **Significado literal:** Favor inmerecido, don gratuito que produce gozo.\n- **Contexto teológico:** En Pablo, la gracia se contrapone al salario por deuda; es la generosidad soberana de Dios hacia quien no tenía ningún mérito.\n\n> "La gracia nos encuentra donde estamos, pero jamás nos deja como estábamos."`,
      images: [],
      videos: [],
      quickNotes: [
        {
          id: 'qn-1',
          text: 'Hacer pausa de silencio después de leer Efesios 2:8-9',
          tag: 'Pausa',
          createdAt: '09:30'
        },
        {
          id: 'qn-2',
          text: 'Enfatizar que somos "Poíema" (obra de arte de Dios) en el versículo 10',
          tag: 'Énfasis',
          createdAt: '09:35'
        }
      ]
    };

    handleConfirmCreateStudy(sampleStudy, activeTopicId);
  };

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

  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    const studies = studiesMap[topicId] || [];
    if (studies.length > 0) {
      setActiveStudyId(studies[0].id);
    }
  };

  const getThemeClass = () => {
    if (theme === 'dark') return 'dark bg-[#121214] text-[#F5F5F7]';
    return 'bg-[#FAFAFB] text-[#1C1C1E]';
  };

  return (
    <div className={`min-h-screen flex flex-col ${getThemeClass()} transition-colors duration-200`}>
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

      <div className="flex-1 flex overflow-hidden">
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F4F5F7] dark:bg-[#121214]">
            <div className="max-w-lg w-full p-9 rounded-3xl surface-card bg-white dark:bg-[#18181C] space-y-5 animate-scaleIn">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F2F3F6] dark:bg-[#232329] text-[#1C1C1E] dark:text-white flex items-center justify-center font-bold">
                <BookOpen size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-[#1C1C1E] dark:text-white tracking-tight">
                  Estudio y Púlpito Bíblico
                </h3>
                <p className="text-xs sm:text-sm text-[#6E6E77] dark:text-[#9E9EA8] leading-relaxed">
                  Crea una nueva prédica con el explorador completo de los 66 libros de la Biblia, diccionario Strong Grego/Hebreo, bosquejo interactivo y modo Púlpito.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  onClick={() => setIsCreateStudyModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-[#1C1C1E] text-white dark:bg-white dark:text-[#121214] active:scale-95 transition-all shadow-xs whitespace-nowrap"
                >
                  <Plus size={15} />
                  <span>Nueva Prédica</span>
                </button>
                <button
                  onClick={handleLoadSampleStudy}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-[#F2F3F6] hover:bg-[#E6E8EC] dark:bg-[#232329] dark:hover:bg-[#2C2C33] text-[#1C1C1E] dark:text-white active:scale-95 transition-all whitespace-nowrap"
                >
                  <Sparkles size={15} />
                  <span>Cargar Prédica de Ejemplo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStudy && isOutlineOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs animate-fadeIn"
              onClick={() => setIsOutlineOpen(false)}
            />
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
          </>
        )}
      </div>

      {isPulpitMode && currentStudy && (
        <PulpitMode
          study={currentStudy}
          initialTheme={theme}
          onThemeChange={setTheme}
          onExit={() => setIsPulpitMode(false)}
          onAddVerse={handleAddVerseToCurrentStudy}
        />
      )}

      {!isPulpitMode && currentStudy && (
        <QuickAccess
          study={currentStudy}
          onAddVerse={handleAddVerseToCurrentStudy}
          variant="normal"
          onOpenNotesPanel={() => setIsOutlineOpen(true)}
        />
      )}

      <VerseModal
        isOpen={verseModalOpen}
        onClose={() => setVerseModalOpen(false)}
        onAddVerse={handleAddVerseToCurrentStudy}
        isMainVerse={isVerseModalForMain}
      />

      <CreateStudyModal
        isOpen={isCreateStudyModalOpen}
        onClose={() => setIsCreateStudyModalOpen(false)}
        topics={topics}
        activeTopicId={activeTopicId}
        onCreateStudy={handleConfirmCreateStudy}
        onCreateTopicOnly={handleCreateTopicOnly}
        theme={theme}
      />

      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        study={currentStudy}
        topicName={currentTopic?.name}
      />

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
