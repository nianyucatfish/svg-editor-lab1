import { DOMParser, XMLSerializer, DOMImplementation } from '@xmldom/xmldom';
import type { Element, Document, Node } from '@xmldom/xmldom';
import { Drawing } from '../domain/Drawing.ts';
import type { Shape } from '../domain/Shape.ts';
import { ShapeFactory } from '../application/ShapeFactory.ts';
import { SvgTransform } from './SvgTransform.ts';
export class SvgCodec {
  readonly #namespace = 'http://www.w3.org/2000/svg';
  readonly #factory = new ShapeFactory();
  readonly #presentation = ['fill', 'stroke', 'stroke-width', 'text-anchor', 'font-size', 'font-family', 'font-weight', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin'];
  #elements(node: Node): Element[] {
    const result: Element[] = [];
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 1) result.push(child as Element);
      else if ((child.nodeType === 3 || child.nodeType === 4) && child.nodeValue?.trim()) throw new Error('unexpected SVG text');
    }
    return result;
  }
  #attributes(node: Element): Map<string, string> {
    return new Map(Array.from(node.attributes).map(attr => [attr.name, attr.value]));
  }
  #length(value: string, label: string): number {
    const match = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(?:px)?$/i.exec(value.trim());
    if (!match || !Number.isFinite(Number(match[1]))) throw new Error(`unsupported SVG length: ${label}=${value}`);
    return Number(match[1]);
  }
  decode(xml: string): { drawing: Drawing; warnings: string[] } {
    // No DTD/entity expansion: only the XML built-in entities are accepted.
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('SVG DTD is not supported');
    const document = new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(xml, 'image/svg+xml');
    const root = document.documentElement;
    if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.#namespace)) throw new Error('expected SVG root');
    const rootAttrs = this.#attributes(root);
    for (const key of rootAttrs.keys()) {
      if (!['width', 'height', 'viewBox', 'xmlns', 'version', 'id', ...this.#presentation].includes(key)) throw new Error(`unsupported SVG root attribute: ${key}`);
    }
    const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
    if (viewBox && (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0)) throw new Error('invalid SVG viewBox');
    const width = this.#length(root.getAttribute('width') ?? String(viewBox?.[2] ?? 800), 'width');
    const height = this.#length(root.getAttribute('height') ?? String(viewBox?.[3] ?? 600), 'height');
    const drawing = new Drawing(width, height);
    let rootTransform = new SvgTransform();
    if (viewBox) {
      const scale = width / viewBox[2];
      if (Math.abs(scale - height / viewBox[3]) > 1e-10) throw new Error('viewBox aspect ratio must match canvas');
      rootTransform = new SvgTransform(scale, -viewBox[0] * scale, -viewBox[1] * scale);
    }
    const rootPresentation = new Map([...rootAttrs].filter(([name]) => this.#presentation.includes(name)));
    drawing.setPresentation(rootPresentation);
    const used = new Set<string>();
    const all: Element[] = [];
    const collect = (node: Element): void => {
      if (node.namespaceURI && node.namespaceURI !== this.#namespace) throw new Error('unsupported SVG namespace');
      all.push(node);
      for (const child of Array.from(node.childNodes)) if (child.nodeType === 1) collect(child as Element);
    };
    const top = this.#elements(root); top.forEach(collect);
    // Reserve every existing ID first, so auto IDs cannot collide with later elements.
    const rootId = root.getAttribute('id'); if (rootId) used.add(rootId);
    for (const node of all) {
      const id = node.getAttribute('id');
      if (id) { if (used.has(id)) throw new Error(`id already exists: ${id}`); used.add(id); }
    }
    const counters = new Map<string, number>(), warnings: string[] = [];
    const read = (node: Element, parentId: string | undefined, transform: SvgTransform, inherited: Map<string, string>): void => {
      const tag = node.localName ?? node.tagName;
      const attrs = this.#attributes(node);
      let id = attrs.get('id');
      if (!id) {
        let count = counters.get(tag) ?? 0;
        do { id = `${tag}${++count}`; } while (used.has(id));
        counters.set(tag, count); used.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
      }
      const combined = transform.then(SvgTransform.parse(attrs.get('transform') ?? ''));
      attrs.delete('transform');
      const effective = new Map(inherited);
      // Only inheritable lengths are needed to normalize translation/uniform scale.
      for (const key of ['font-size', 'stroke-width']) if (attrs.has(key)) effective.set(key, attrs.get(key)!);
      for (const [key, value] of attrs) {
        if (['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'stroke-width'].includes(key)) attrs.set(key, String(this.#length(value, key)));
      }
      const shape = this.#factory.fromSvg(tag, id, attrs, node.textContent ?? '');
      const children = shape.content() === null ? this.#elements(node) : Array.from(node.childNodes).filter(child => child.nodeType === 1) as Element[];
      // Factory decides type validity; container ability follows the model, not a second tag switch.
      if (children.length && !shape.isContainer) throw new Error(`not a container: ${id}`);
      if (!shape.isContainer) {
        shape.scale(combined.scale); shape.move(combined.x, combined.y);
        if (combined.scale !== 1) {
          shape.set('stroke-width', String(this.#length(effective.get('stroke-width') ?? '1', 'stroke-width') * combined.scale));
          if (shape.content() !== null) shape.importPresentation('font-size', String(this.#length(effective.get('font-size') ?? '16', 'font-size') * combined.scale));
        }
      }
      drawing.add(shape, parentId);
      children.forEach(child => read(child, id, combined, effective));
    };
    top.forEach(node => read(node, undefined, rootTransform, rootPresentation));
    return { drawing, warnings };
  }
  encode(drawing: Drawing): string {
    const document = new DOMImplementation().createDocument(this.#namespace, 'svg', null);
    const root = document.documentElement!;
    root.setAttribute('width', String(drawing.width)); root.setAttribute('height', String(drawing.height));
    root.setAttribute('viewBox', `0 0 ${drawing.width} ${drawing.height}`);
    for (const [name, value] of drawing.presentation()) root.setAttribute(name, value);
    const append = (shape: Shape, parent: Element, doc: Document): void => {
      const element = doc.createElementNS(this.#namespace, shape.type);
      for (const [name, value] of shape.attributes()) element.setAttribute(name, value);
      const content = shape.content();
      if (content !== null) element.appendChild(doc.createTextNode(content));
      shape.children().forEach(child => append(child, element, doc));
      parent.appendChild(element);
    };
    drawing.elements().forEach(shape => append(shape, root, document));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(document, { requireWellFormed: true }) + '\n';
  }
}
