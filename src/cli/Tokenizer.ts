export class Tokenizer {
  parse(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let token = '', quoted = false, started = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '\\' && quoted && ['"', '\\'].includes(line[i + 1])) { token += line[++i]; started = true; }
      else if (ch === '"') { quoted = !quoted; started = true; }
      else if (/\s/.test(ch) && !quoted) {
        if (started) tokens.push(token);
        token = ''; started = false;
      } else { token += ch; started = true; }
    }
    if (quoted) throw new Error('unterminated quoted string');
    if (started) tokens.push(token);
    return tokens;
  }
}
