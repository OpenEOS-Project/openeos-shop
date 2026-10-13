/**
 * Freitext fuer Impressum/Datenschutz des Vereins ("Markdown-light") und
 * die Plattform-Links. Gleiche Regeln wie in der Verwaltung (openeos-web,
 * src/lib/legal.ts): Absaetze per Leerzeile, Zeilenumbrueche, `#`-
 * Ueberschriften, `**fett**`, automatische Links. Kein HTML.
 */

export type LegalInline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'link'; text: string; href: string };

export type LegalBlock =
  | { type: 'heading'; level: 1 | 2 | 3; content: LegalInline[] }
  | { type: 'paragraph'; lines: LegalInline[][] };

const LINK_PATTERN =
  /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function linkify(text: string, bold: boolean): LegalInline[] {
  const out: LegalInline[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ type: bold ? 'bold' : 'text', text: text.slice(last, index) });
    const [value] = match;
    out.push({ type: 'link', text: value, href: match[1] ? value : `mailto:${value}` });
    last = index + value.length;
  }
  if (last < text.length) out.push({ type: bold ? 'bold' : 'text', text: text.slice(last) });
  return out;
}

function parseInline(line: string): LegalInline[] {
  const out: LegalInline[] = [];
  for (const part of line.split(/(\*\*[^*]+\*\*)/g)) {
    if (!part) continue;
    const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
    out.push(...linkify(isBold ? part.slice(2, -2) : part, isBold));
  }
  return out;
}

export function parseLegalText(text: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  for (const chunk of text.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim() !== '');
    let paragraph: LegalInline[][] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ type: 'paragraph', lines: paragraph });
      paragraph = [];
    };
    for (const line of lines) {
      const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim());
      if (heading) {
        flush();
        blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, content: parseInline(heading[2]) });
      } else {
        paragraph.push(parseInline(line));
      }
    }
    flush();
  }
  return blocks;
}
