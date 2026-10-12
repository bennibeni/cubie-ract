import test from 'node:test';
import assert from 'node:assert/strict';
import CubePosition from '../cube/CubePosition.js';
import { DIAGRAM_CIRCLES, DIAGRAM_DOTS, activeDiagramCircles } from './circleDiagramGeometry.js';
import { CUBIE_SLOTS } from './cubieGeometry.js';

test('54 distinct facelets, twelve intersections per circle, nine per face', () => {
  assert.equal(DIAGRAM_CIRCLES.length, 9);
  assert.equal(DIAGRAM_DOTS.length, 54);
  assert.deepEqual(DIAGRAM_DOTS.map(d => d.facelet).sort((a,b) => a-b), Array.from({length:54}, (_,i) => i));
  assert.equal(new Set(DIAGRAM_DOTS.map(d => `${d.x},${d.y}`)).size, 54);
  for (const c of DIAGRAM_CIRCLES) {
    const dots = DIAGRAM_DOTS.filter(d => d.circles.includes(c.id));
    assert.equal(dots.length, 12);
    for (const dot of dots) {
      assert.ok(Math.abs(Math.hypot(dot.x-c.cx, dot.y-c.cy)-c.r) < 1e-9);
      assert.equal(dot.position[c.axis], c.layer);
    }
  }
});

test('a face turn selects its layer and all 12 side stickers in the diagram', () => {
  for (const face of [0,1,2,3,4,5]) {
    const normal = DIAGRAM_DOTS.find(d => Math.floor(d.facelet / 9) === face).normal;
    const axis = normal.findIndex(v => v !== 0);
    const slots = CUBIE_SLOTS.filter(s => s.position[axis] === normal[axis]).map(s => s.index);
    const active = activeDiagramCircles({ groups: [{ axis: normal, slots }] });
    assert.equal(active.length, 1);
    const cube = new CubePosition();
    cube.doMove(face, 1);
    const colors = cube.getFaceletColors();
    const changed = DIAGRAM_DOTS.filter(d => colors[d.facelet] !== Math.floor(d.facelet / 9));
    assert.equal(changed.length, 12);
    assert.ok(changed.every(d => d.circles.includes(active[0])));
  }
});
