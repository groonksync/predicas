import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');

  const renderFormattedText = (text: string) => {
    // Regex para detectar **negrita**, *cursiva*, ==resaltado==, `código/léxico`
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==|`[^`]+`)/g;
    const tokens = text.split(regex);

    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return (
          <em key={idx} className="italic text-slate-800 dark:text-neutral-200">
            {token.slice(1, -1)}
          </em>
        );
      }
      if (token.startsWith('==') && token.endsWith('==')) {
        return (
          <mark key={idx} className="bg-[#E03126]/20 text-[#E03126] dark:text-red-300 px-1 py-0.5 rounded font-bold">
            {token.slice(2, -2)}
          </mark>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={idx} className="bg-black/[0.06] dark:bg-white/10 text-slate-900 dark:text-neutral-100 px-1.5 py-0.5 rounded font-mono text-xs">
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  return (
    <div className={`space-y-2 leading-relaxed ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Encabezados
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={lineIdx} className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white pt-2 pb-0.5 border-b border-black/[0.04] dark:border-white/[0.06]">
              {renderFormattedText(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={lineIdx} className="text-base sm:text-lg font-black text-slate-900 dark:text-white pt-2.5 pb-1 border-b border-black/[0.06] dark:border-white/[0.08]">
              {renderFormattedText(trimmed.slice(3))}
            </h3>
          );
        }

        // Citas tipo Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={lineIdx} className="border-l-2 border-[#E03126] pl-3 py-1 my-1 text-slate-700 dark:text-neutral-300 italic bg-black/[0.02] dark:bg-white/[0.02] rounded-r">
              {renderFormattedText(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Listas con viñeta
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="text-[#E03126] font-bold leading-none mt-1.5">•</span>
              <span className="flex-1 text-slate-800 dark:text-neutral-200">
                {renderFormattedText(trimmed.slice(2))}
              </span>
            </div>
          );
        }

        // Listas numeradas (ej. 1. 2. etc.)
        const matchNumbered = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (matchNumbered) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="font-bold text-[#8E8E93] text-xs mt-1 flex-shrink-0">
                {matchNumbered[1]}.
              </span>
              <span className="flex-1 text-slate-800 dark:text-neutral-200">
                {renderFormattedText(matchNumbered[2])}
              </span>
            </div>
          );
        }

        // Párrafo estándar
        return (
          <p key={lineIdx} className="text-slate-800 dark:text-neutral-200 text-xs sm:text-sm">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownRenderer;
