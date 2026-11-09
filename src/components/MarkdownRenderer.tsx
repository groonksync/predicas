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
          <strong key={idx} className="font-extrabold text-current opacity-100">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return (
          <em key={idx} className="italic text-current opacity-90">
            {token.slice(1, -1)}
          </em>
        );
      }
      if (token.startsWith('==') && token.endsWith('==')) {
        return (
          <mark key={idx} className="bg-current/15 text-current px-1.5 py-0.5 rounded font-bold">
            {token.slice(2, -2)}
          </mark>
        );
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={idx} className="bg-current/10 text-current px-1.5 py-0.5 rounded font-mono text-xs">
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  return (
    <div className={`space-y-3 leading-relaxed text-current ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-2" />;
        }

        // Encabezados
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={lineIdx} className="text-current font-extrabold pt-3 pb-1 border-b border-current/10">
              {renderFormattedText(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={lineIdx} className="text-current font-black pt-4 pb-1.5 border-b border-current/15">
              {renderFormattedText(trimmed.slice(3))}
            </h3>
          );
        }

        // Citas tipo Blockquote (con borde y fondo sutil derivados de text-current, sin rojo)
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={lineIdx} className="border-l-2 border-current/40 pl-4 py-2 my-2 text-current italic bg-current/[0.04] rounded-r">
              {renderFormattedText(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Listas con viñeta (viñeta limpia derivada de text-current)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lineIdx} className="flex items-start gap-2.5 pl-2">
              <span className="text-current opacity-70 font-bold leading-none mt-1.5 text-base">•</span>
              <span className="flex-1 text-current opacity-95">
                {renderFormattedText(trimmed.slice(2))}
              </span>
            </div>
          );
        }

        // Listas numeradas (ej. 1. 2. etc.)
        const matchNumbered = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (matchNumbered) {
          return (
            <div key={lineIdx} className="flex items-start gap-2.5 pl-2">
              <span className="font-bold text-current opacity-70 text-xs mt-1 flex-shrink-0">
                {matchNumbered[1]}.
              </span>
              <span className="flex-1 text-current opacity-95">
                {renderFormattedText(matchNumbered[2])}
              </span>
            </div>
          );
        }

        // Párrafo estándar
        return (
          <p key={lineIdx} className="text-current opacity-95">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownRenderer;
