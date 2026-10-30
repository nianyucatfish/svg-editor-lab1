export class SvgTransform {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
  constructor(scale = 1, x = 0, y = 0) {
    if (![scale, x, y].every(Number.isFinite) || scale <= 0) throw new Error('unsupported SVG transform');
    this.scale = scale; this.x = x; this.y = y;
  }
  then(local: SvgTransform): SvgTransform {
    return new SvgTransform(this.scale * local.scale, this.x + this.scale * local.x, this.y + this.scale * local.y);
  }
  static parse(value: string): SvgTransform {
    let result = new SvgTransform(), rest = value.trim();
    while (rest) {
      const match = /^(translate|scale)\s*\(([^()]*)\)\s*,?\s*/.exec(rest);
      if (!match) throw new Error(`unsupported SVG transform: ${value}`);
      const body = match[2].trim();
      const number = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?';
      if (!new RegExp(`^${number}(?:[ ,]+${number})?$`).test(body)) throw new Error('invalid SVG transform');
      const numbers = body.split(/[ ,]+/).map(Number);
      let next: SvgTransform;
      if (match[1] === 'translate') next = new SvgTransform(1, numbers[0], numbers[1] ?? 0);
      else {
        if (numbers[1] !== undefined && numbers[0] !== numbers[1]) throw new Error('nonuniform SVG scale is not supported');
        next = new SvgTransform(numbers[0]);
      }
      result = result.then(next); rest = rest.slice(match[0].length);
    }
    return result;
  }
}
