import React from 'react';

interface FormattedContentProps {
  content: string;
}

export function FormattedContent({ content }: FormattedContentProps) {
  if (content === null || content === undefined) return null;
  const textStr = typeof content === 'string' ? content : String(content);
  if (!textStr.trim()) return null;

  const parseInlineFormatting = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Split by double newline for paragraphs
  const paragraphs = textStr.split('\n\n');

  return (
    <>
      {paragraphs.map((p, pIndex) => {
        const lines = p.split('\n');
        const isList = lines.every(
          (line) =>
            line.trim().startsWith('- ') ||
            line.trim().startsWith('* ') ||
            /^\d+\.\s/.test(line.trim())
        );

        if (isList) {
          return (
            <ul key={pIndex} className="list-disc pl-5 my-2 space-y-1">
              {lines.map((line, lIndex) => {
                const cleaned = line.replace(/^[-*]\s+|\d+\.\s+/, '');
                return (
                  <li key={lIndex} className="text-sm">
                    {parseInlineFormatting(cleaned)}
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIndex} className="text-sm leading-relaxed mb-2 last:mb-0">
            {lines.map((line, lIndex) => (
              <span key={lIndex} className="block">
                {parseInlineFormatting(line)}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}
