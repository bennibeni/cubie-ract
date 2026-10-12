import { CUBIE_SLOTS } from './cubieGeometry.js';

// Three families, one per physical axis. Each radius represents one layer.
export const DIAGRAM_CIRCLES = [
  { cx: 160, cy: 114, axis: 1, name: 'Y' },
  { cx: 118, cy: 186, axis: 0, name: 'X' },
  { cx: 202, cy: 186, axis: 2, name: 'Z' },
].flatMap((family, group) => [103, 85, 67].map((r, layer) => ({
  ...family, r, group, layer: layer - 1, id: `${group}-${layer}`,
})));

function intersections(a, b) {
  const dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy);
  const along = (a.r ** 2 - b.r ** 2 + d ** 2) / (2 * d);
  const h = Math.sqrt(a.r ** 2 - along ** 2);
  return [-1, 1].map(sign => ({
    x: a.cx + along * dx / d - sign * h * dy / d,
    y: a.cy + along * dy / d + sign * h * dx / d,
  }));
}

// Branch normals for the two intersections of each pair of families.
const NORMALS = {
  '01': [[0, 0, 1], [0, 0, -1]],
  '02': [[-1, 0, 0], [1, 0, 0]],
  '12': [[0, 1, 0], [0, -1, 0]],
};

export const DIAGRAM_DOTS = DIAGRAM_CIRCLES.flatMap((a, i) =>
  DIAGRAM_CIRCLES.slice(i + 1).flatMap(b => {
    if (a.group === b.group) return [];
    return intersections(a, b).map((point, branch) => {
      const normal = NORMALS[`${a.group}${b.group}`][branch];
      const position = [...normal];
      position[a.axis] = a.layer;
      position[b.axis] = b.layer;
      const slot = CUBIE_SLOTS.find(s => s.position.every((v, axis) => v === position[axis]));
      const sticker = slot.stickers.find(s => s.normal.every((v, axis) => v === normal[axis]));
      return { ...point, facelet: sticker.facelet, circles: [a.id, b.id], position, normal };
    });
  }));

export function activeDiagramCircles(animation) {
  if (!animation) return [];
  return DIAGRAM_CIRCLES.filter(circle => animation.groups.some(group => {
    const axis = group.axis.findIndex(v => v !== 0);
    if (axis !== circle.axis) return false;
    return group.slots.some(index => CUBIE_SLOTS.find(s => s.index === index).position[axis] === circle.layer);
  })).map(c => c.id);
}
