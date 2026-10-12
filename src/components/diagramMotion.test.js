import test from 'node:test';
import assert from 'node:assert/strict';
import { diagramMotion, motionPoint } from './diagramMotion.js';
import { CUBIE_SLOTS, FACE_NORMAL } from './cubieGeometry.js';
import CubePosition from '../cube/CubePosition.js';

test('all 18 outer turns: 12 points stay on their ring; 20 move; endpoints match cube',()=>{
  for(let face=0;face<6;face++) for(const amount of [1,2,3]) {
    const axis=FACE_NORMAL[face], index=axis.findIndex(v=>v);
    const group={axis,angleDeg:-90*(amount===3?-1:amount),slots:CUBIE_SLOTS.filter(s=>s.position[index]===axis[index]).map(s=>s.index)};
    const paths=diagramMotion({groups:[group]});
    assert.equal(paths.filter(p=>p.from.facelet!==p.to.facelet).length,20);
    assert.equal(paths.filter(p=>p.circleId).length,12);
    assert.equal(new Set(paths.map(p=>p.to.facelet)).size,54);
    const cube=new CubePosition(); cube.doMove(2,1);cube.doMove(1,3);
    const before=cube.getFaceletColors().slice();cube.doMove(face,amount);const after=cube.getFaceletColors();
    for(const p of paths){
      assert.equal(before[p.from.facelet],after[p.to.facelet]);
      assert.deepEqual(motionPoint(p,1),p.to);
      if(p.circleId) for(const t of [.1,.5,.9]) {
        const v=motionPoint(p,t);
        assert.ok(Math.abs(Math.hypot(v.x-p.center.cx,v.y-p.center.cy)-p.r0)<1e-8);
      }
    }
  }
});
