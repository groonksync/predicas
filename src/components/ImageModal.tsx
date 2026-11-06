import React from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      {/* Header bar */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-white">
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        <div className="flex items-center gap-2">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Abrir imagen completa"
          >
            <Download size={18} />
          </a>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Cerrar visor"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <img
          src={imageUrl}
          alt={title}
          className="max-h-[80vh] max-w-full object-contain"
        />
      </div>
    </div>
  );
};
