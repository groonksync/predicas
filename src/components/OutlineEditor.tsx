import React from 'react';
import { 
  ListOrdered, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft
} from 'lucide-react';
import { OutlinePoint } from '../types';

interface OutlineEditorProps {
  outlinePoints: OutlinePoint[];
  onAddPoint: () => void;
  onUpdatePoint: (pointId: string, updates: Partial<OutlinePoint>) => void;
  onDeletePoint: (pointId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const OutlineEditor: React.FC<OutlineEditorProps> = ({
  outlinePoints,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  isOpen,
  onToggle,
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-6 z-20 flex items-center gap-2 px-4 py-3 rounded-full bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-2xl font-bold text-xs active:scale-95 transition-all"
        title="Abrir editor de bosquejo"
      >
        <ListOrdered size={16} />
        <span>Abrir Bosquejo ({outlinePoints.length})</span>
        <ChevronLeft size={14} />
      </button>
    );
  }

  return (
    <aside className="w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 bg-white dark:bg-[#18181A] border-l border-black/[0.06] dark:border-white/[0.08] flex flex-col h-[calc(100vh-3.5rem)] select-none font-sans sticky top-14">
      {/* Outline Header Bar */}
      <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3 bg-white/80 dark:bg-[#18181A]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#2C2C2E] dark:bg-[#343438] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <ListOrdered size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              Bosquejo de la Prédica
            </h3>
            <span className="text-[11px] text-[#8E8E93] font-medium">
              Panel de escritura y desarrollo ({outlinePoints.length} puntos)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Add Point Button */}
          <button
            onClick={onAddPoint}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1C1C1E] hover:bg-black dark:bg-white dark:text-[#1C1C1E] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            title="Añadir nuevo punto al bosquejo"
          >
            <Plus size={13} />
            <span>Punto</span>
          </button>

          {/* Collapse button */}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-full text-slate-500 dark:text-neutral-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            title="Ocultar bosquejo para ver sólo versículos"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Points Writing Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {outlinePoints.map((point) => (
          <div
            key={point.id}
            className="bg-[#F8F8FA] dark:bg-[#222225] rounded-3xl p-5 border border-black/[0.04] dark:border-white/[0.06] shadow-apple group transition-all"
          >
            {/* Top row: Number, Title input, Scripture ref */}
            <div className="flex items-start justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-[#2C2C2E] dark:bg-[#343438] text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                  {point.number}
                </span>
                <input
                  type="text"
                  value={point.title}
                  onChange={(e) => onUpdatePoint(point.id, { title: e.target.value })}
                  className="font-bold text-base text-slate-900 dark:text-white bg-transparent border-0 focus:outline-none p-0 w-full"
                  placeholder="Título del punto principal..."
                />
              </div>

              {outlinePoints.length > 1 && (
                <button
                  onClick={() => onDeletePoint(point.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity rounded-full"
                  title="Eliminar este punto"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Scripture reference tag for this point */}
            <div className="mb-2">
              <input
                type="text"
                value={point.scriptureRef || ''}
                onChange={(e) => onUpdatePoint(point.id, { scriptureRef: e.target.value })}
                placeholder="Cita bíblica de apoyo (ej. Romanos 3:23)..."
                className="w-full text-xs font-semibold text-slate-800 dark:text-neutral-200 bg-white dark:bg-[#2A2A2D] px-3 py-1.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] focus:outline-none"
              />
            </div>

            {/* Writing / Development Textarea */}
            <div>
              <textarea
                value={point.content}
                onChange={(e) => onUpdatePoint(point.id, { content: e.target.value })}
                rows={4}
                className="w-full text-xs sm:text-sm text-slate-700 dark:text-neutral-200 bg-white dark:bg-[#1C1C1E] p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] resize-y focus:outline-none leading-relaxed font-medium"
                placeholder="Escribe el desarrollo, ilustraciones, preguntas para la congregación o anécdotas de este punto..."
              />
            </div>
          </div>
        ))}

        {/* Add point large prompt at bottom */}
        <button
          onClick={onAddPoint}
          className="w-full py-4 rounded-3xl border-2 border-dashed border-black/[0.1] dark:border-white/[0.1] hover:border-black/[0.3] dark:hover:border-white/[0.3] text-slate-600 dark:text-neutral-400 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Plus size={16} />
          <span>Añadir Siguiente Punto al Bosquejo</span>
        </button>
      </div>
    </aside>
  );
};
