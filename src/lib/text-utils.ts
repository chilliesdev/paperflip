export interface Word {
  word: string;
  start: number;
  end: number;
}

export function parseWords(text: string): Word[] {
  if (!text) return [];
  const w: Word[] = [];
  const wordRegex = /\S+/g;
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    w.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return w;
}
