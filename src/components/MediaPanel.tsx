import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  StickyNote, 
  Plus, 
  Trash2, 
  Maximize2, 
  Clock,
  X 
} from 'lucide-react';
import { Study, ResourceImage, ResourceVideo, QuickNote } from '../types';

interface MediaPanelProps {
  study: Study;
  onUpdateStudy: (updated: Study) => void;
  onOpenImagePreview: (imageUrl: string, title: string) => void;
  onClose?: () => void;
}

export const MediaPanel: React.FC<MediaPanelProps> = ({
  study,
  onUpdateStudy,
  onOpenImagePreview,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'notes'>('all');
  
  // Modals for adding
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [newImgTitle, setNewImgTitle] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newImgCaption, setNewImgCaption] = useState('');

  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [newVidTitle, setNewVidTitle] = useState('');
  const [newVidUrl, setNewVidUrl] = useState('');
  const [newVidTime, setNewVidTime] = useState('');
  const [newVidNotes, setNewVidNotes] = useState('');

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<QuickNote['color']>('red');

  // Video embed helper
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
      } else if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Add Image
  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImgUrl.trim()) return;
    const newImage: ResourceImage = {
      id: `img-${Date.now()}`,
      title: newImgTitle.trim() || 'Imagen de estudio',
      url: newImgUrl.trim(),
      caption: newImgCaption.trim()
    };
    onUpdateStudy({ ...study, images: [...study.images, newImage] });
    setNewImgTitle('');
    setNewImgUrl('');
    setNewImgCaption('');
    setIsAddingImage(false);
  };

  // Add Video
  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVidUrl.trim()) return;
    const newVideo: ResourceVideo = {
      id: `vid-${Date.now()}`,
      title: newVidTitle.trim() || 'Video de apoyo',
      url: newVidUrl.trim(),
      timestamp: newVidTime.trim(),
      notes: newVidNotes.trim()
    };
    onUpdateStudy({ ...study, videos: [...study.videos, newVideo] });
    setNewVidTitle('');
    setNewVidUrl('');
    setNewVidTime('');
    setNewVidNotes('');
    setIsAddingVideo(false);
  };

  // Add Quick Note
  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      color: newNoteColor,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    onUpdateStudy({ ...study, quickNotes: [newNote, ...study.quickNotes] });
    setNewNoteText('');
  };

  const deleteImage = (id: string) => {
    onUpdateStudy({ ...study, images: study.images.filter(img => img.id !== id) });
  };

  const deleteVideo = (id: string) => {
    onUpdateStudy({ ...study, videos: study.videos.filter(v => v.id !== id) });
  };

  const deleteQuickNote = (id: string) => {
    onUpdateStudy({ ...study, quickNotes: study.quickNotes.filter(n => n.id !== id) });
  };

  // Solid Color Classes for Notes
  const getNoteSolidClasses = (color: QuickNote['color']) => {
    switch (color) {
      case 'red':
        return 'bg-[#E03126] text-white';
      case 'green':
        return 'bg-[#2B8A3E] text-white';
      case 'purple':
        return 'bg-[#6741D9] text-white';
      case 'slate':
      default:
        return 'bg-[#252528] text-white';
    }
  };

  return (
    <aside className="w-80 sm:w-88 flex-shrink-0 bg-[#F8F8FA] dark:bg-[#18181A] border-l border-black/[0.06] dark:border-white/[0.08] flex flex-col h-[calc(100vh-3.5rem)] select-none font-sans">
      {/* Panel Header - iPadOS Segmented Pill Slider with Close Button */}
      <div className="p-3.5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs bg-black/[0.05] dark:bg-[#242427] p-1 rounded-full flex-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${activeTab === 'all' ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#1C1C1E] shadow-xs' : 'text-slate-600 dark:text-neutral-400'}`}
          >
            Todo
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${activeTab === 'images' ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#1C1C1E] shadow-xs' : 'text-slate-600 dark:text-neutral-400'}`}
          >
            Fotos
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${activeTab === 'videos' ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#1C1C1E] shadow-xs' : 'text-slate-600 dark:text-neutral-400'}`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${activeTab === 'notes' ? 'bg-[#1C1C1E] text-white dark:bg-white dark:text-[#1C1C1E] shadow-xs' : 'text-slate-600 dark:text-neutral-400'}`}
          >
            Notas
          </button>
        </div>

        {/* Direct Close Button on Panel */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-slate-500 dark:text-neutral-400 transition-colors"
            title="Cerrar panel de recursos para ver más grande el estudio"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 1. Quick Notes (Solid Color Blocks with High-Contrast White Text) */}
        {(activeTab === 'all' || activeTab === 'notes') && (
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <StickyNote size={14} className="text-neutral-500 dark:text-neutral-400" />
                Notas Rápidas
              </span>
            </div>

            {/* Quick Note Input Form */}
            <form onSubmit={handleAddQuickNote} className="mb-3.5 space-y-2.5">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Escribe un recordatorio o apunte..."
                rows={2}
                className="w-full text-xs p-3 bg-white dark:bg-[#222225] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 resize-none shadow-xs"
              />
              <div className="flex items-center justify-between px-0.5">
                {/* Solid Color Selector */}
                <div className="flex items-center gap-2">
                  {(['red', 'green', 'purple', 'slate'] as const).map((color) => {
                    const colorBg = 
                      color === 'red' ? 'bg-[#E03126]' :
                      color === 'green' ? 'bg-[#2B8A3E]' :
                      color === 'purple' ? 'bg-[#6741D9]' : 'bg-[#252528]';
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewNoteColor(color)}
                        className={`w-5 h-5 rounded-full ${colorBg} transition-transform ${newNoteColor === color ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : 'opacity-70'}`}
                        title={`Color ${color}`}
                      />
                    );
                  })}
                </div>
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-3.5 py-1.5 text-xs bg-[#1C1C1E] hover:bg-black dark:bg-white dark:text-[#1C1C1E] text-white rounded-full font-bold transition-all disabled:opacity-40 shadow-xs active:scale-95"
                >
                  Fijar Nota
                </button>
              </div>
            </form>

            {/* Solid Notes Cards */}
            <div className="space-y-2.5">
              {study.quickNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm relative group leading-relaxed shadow-apple ${getNoteSolidClasses(note.color)}`}
                >
                  <p className="font-semibold text-white">{note.text}</p>
                  <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/20 text-[10px] sm:text-xs text-white/80">
                    <span>{note.createdAt}</span>
                    <button
                      onClick={() => deleteQuickNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-1 bg-black/20 rounded-full"
                      title="Eliminar apunte"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Visual Resources (Images) */}
        {(activeTab === 'all' || activeTab === 'images') && (
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-neutral-500 dark:text-neutral-400" />
                Imágenes y Mapas ({study.images.length})
              </span>
              <button
                onClick={() => setIsAddingImage(!isAddingImage)}
                className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-black/[0.05] hover:bg-black/[0.1] dark:bg-[#252528] dark:hover:bg-[#2F2F32] text-slate-800 dark:text-neutral-200 flex items-center gap-1 transition-all active:scale-95"
              >
                <Plus size={12} />
                <span>Añadir</span>
              </button>
            </div>

            {/* Form for adding image */}
            {isAddingImage && (
              <form onSubmit={handleAddImage} className="mb-3.5 p-3.5 bg-white dark:bg-[#222225] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-2 shadow-apple">
                <input
                  type="text"
                  placeholder="Título..."
                  value={newImgTitle}
                  onChange={(e) => setNewImgTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-[#F2F2F7] dark:bg-[#18181A] border-0 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
                <input
                  type="url"
                  placeholder="URL de la imagen (https://...)"
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                  className="w-full text-xs p-2 bg-[#F2F2F7] dark:bg-[#18181A] border-0 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  required
                />
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingImage(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 text-xs bg-[#1C1C1E] hover:bg-black dark:bg-white dark:text-[#1C1C1E] text-white rounded-xl font-bold transition-transform active:scale-95"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            {/* Images List */}
            <div className="space-y-3">
              {study.images.map((img) => (
                <div
                  key={img.id}
                  className="bg-white dark:bg-[#222225] rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.06] shadow-apple group"
                >
                  <div 
                    onClick={() => onOpenImagePreview(img.url, img.title)}
                    className="relative aspect-video bg-neutral-900 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-[#1C1C1E]/80 backdrop-blur-md text-white p-2 rounded-full">
                        <Maximize2 size={14} />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {img.title}
                      </h5>
                    </div>
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Videos */}
        {(activeTab === 'all' || activeTab === 'videos') && (
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <VideoIcon size={14} className="text-neutral-500 dark:text-neutral-400" />
                Videos ({study.videos.length})
              </span>
              <button
                onClick={() => setIsAddingVideo(!isAddingVideo)}
                className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-black/[0.05] hover:bg-black/[0.1] dark:bg-[#252528] dark:hover:bg-[#2F2F32] text-slate-800 dark:text-neutral-200 flex items-center gap-1 transition-all active:scale-95"
              >
                <Plus size={12} />
                <span>Añadir</span>
              </button>
            </div>

            {/* Form for adding video */}
            {isAddingVideo && (
              <form onSubmit={handleAddVideo} className="mb-3.5 p-3.5 bg-white dark:bg-[#222225] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-2 shadow-apple">
                <input
                  type="text"
                  placeholder="Título del video..."
                  value={newVidTitle}
                  onChange={(e) => setNewVidTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-[#F2F2F7] dark:bg-[#18181A] border-0 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
                <input
                  type="url"
                  placeholder="URL del video..."
                  value={newVidUrl}
                  onChange={(e) => setNewVidUrl(e.target.value)}
                  className="w-full text-xs p-2 bg-[#F2F2F7] dark:bg-[#18181A] border-0 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  required
                />
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingVideo(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 text-xs bg-[#1C1C1E] hover:bg-black dark:bg-white dark:text-[#1C1C1E] text-white rounded-xl font-bold transition-transform active:scale-95"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            {/* Video Cards */}
            <div className="space-y-3.5">
              {study.videos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-white dark:bg-[#222225] rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.06] shadow-apple"
                >
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={getEmbedUrl(vid.url)}
                      title={vid.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="p-3 flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {vid.title}
                      </h5>
                      {vid.timestamp && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mt-1">
                          <Clock size={11} />
                          <span>Punto clave: {vid.timestamp}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteVideo(vid.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
