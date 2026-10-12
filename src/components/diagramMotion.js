import { DIAGRAM_CIRCLES, DIAGRAM_DOTS } from './circleDiagramGeometry.js';
import { CUBIE_SLOTS } from './cubieGeometry.js';

function rotate(v, axis, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const cross = [axis[1]*v[2]-axis[2]*v[1], axis[2]*v[0]-axis[0]*v[2], axis[0]*v[1]-axis[1]*v[0]];
  const dot = axis.reduce((sum,n,i)=>sum+n*v[i],0);
  return v.map((n,i)=>Math.round(n*c+cross[i]*s+axis[i]*dot*(1-c)));
}
function destination(dot, group, angle) {
  const p=rotate(dot.position,group.axis,angle), n=rotate(dot.normal,group.axis,angle);
  return DIAGRAM_DOTS.find(d=>d.position.every((v,i)=>v===p[i]) && d.normal.every((v,i)=>v===n[i]));
}
const wrap = angle => Math.atan2(Math.sin(angle),Math.cos(angle));

export function diagramMotion(animation) {
  return DIAGRAM_DOTS.map(dot => {
    const group=animation?.groups.find(g=>g.slots.some(index=>CUBIE_SLOTS[index].stickers.some(s=>s.facelet===dot.facelet)));
    if (!group) return { from:dot, to:dot };
    const angle=group.angleDeg*Math.PI/180;
    const to=destination(dot,group,angle);
    if (to.facelet===dot.facelet) return {from:dot,to};
    const axis=group.axis.findIndex(v=>v!==0);
    const circle=DIAGRAM_CIRCLES.find(c=>c.axis===axis && c.layer===dot.position[axis] && dot.circles.includes(c.id));
    const faceDots=DIAGRAM_DOTS.filter(d=>d.normal.every((v,i)=>v===dot.normal[i]));
    const center=circle ?? {cx:faceDots.reduce((s,d)=>s+d.x,0)/9,cy:faceDots.reduce((s,d)=>s+d.y,0)/9};
    const start=Math.atan2(dot.y-center.cy,dot.x-center.cx);
    const quarter=destination(dot,group,Math.sign(angle)*Math.PI/2);
    const direction=Math.sign(wrap(Math.atan2(quarter.y-center.cy,quarter.x-center.cx)-start));
    let delta=wrap(Math.atan2(to.y-center.cy,to.x-center.cx)-start);
    if (direction*delta<0) delta+=direction*2*Math.PI;
    return {from:dot,to,center,start,delta,r0:Math.hypot(dot.x-center.cx,dot.y-center.cy),r1:Math.hypot(to.x-center.cx,to.y-center.cy),circleId:circle?.id};
  });
}

export function motionPoint(path, progress) {
  if (progress<=0 || !path.center) return path.from;
  if (progress>=1) return path.to;
  const eased=1-(1-progress)**2;
  const angle=path.start+path.delta*eased, radius=path.r0+(path.r1-path.r0)*eased;
  return {x:path.center.cx+radius*Math.cos(angle),y:path.center.cy+radius*Math.sin(angle)};
}
