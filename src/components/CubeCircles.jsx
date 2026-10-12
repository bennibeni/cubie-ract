import { useEffect, useId, useMemo, useRef } from 'react';
import { diagramMotion, motionPoint } from './diagramMotion';
import { ANIMATION_DURATION_MS } from './moveAnimation';
import { FACE_COLORS, FACE_NAMES } from '../cube/constants';
import { DIAGRAM_CIRCLES, DIAGRAM_DOTS, activeDiagramCircles } from './circleDiagramGeometry';

export default function CubeCircles({ faceletColor, animation = null, width = 320, dotRadius = 5.5, colors = FACE_COLORS }) {
  const titleId = useId();
  const active = activeDiagramCircles(animation);
  const nodes = useRef(new Map());
  const paths = useMemo(() => diagramMotion(animation), [animation]);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const draw = now => {
      const progress = animation ? Math.min(1, (now-start)/(animation.duration ?? ANIMATION_DURATION_MS)) : 0;
      paths.forEach(path => {
        const point = motionPoint(path,progress), node = nodes.current.get(path.from.facelet);
        node?.setAttribute('cx',point.x); node?.setAttribute('cy',point.y);
      });
      if (animation && progress<1) frame=requestAnimationFrame(draw);
    };
    draw(start);
    return () => cancelAnimationFrame(frame);
  }, [animation, paths]);
  return <figure className="circle-diagram" style={{ width }}>
    <svg viewBox="0 0 320 306" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Permutazioni del cubo: 54 etichette su tre gruppi di tre cerchi</title>
      <rect width="320" height="306" rx="8" fill="#101014" />
      <g fill="none" strokeWidth="2.5">
        {DIAGRAM_CIRCLES.map(circle => <circle key={circle.id} cx={circle.cx} cy={circle.cy} r={circle.r}
          stroke={active.includes(circle.id) ? '#ffffff' : '#646073'}>
          <title>Asse {circle.name}, strato {circle.layer}</title>
        </circle>)}
      </g>
      {DIAGRAM_DOTS.map(dot => <circle key={dot.facelet} data-facelet={dot.facelet}
        ref={node => { if (node) nodes.current.set(dot.facelet,node); else nodes.current.delete(dot.facelet); }}
        cx={dot.x} cy={dot.y} r={dotRadius} fill={colors[faceletColor[dot.facelet]] ?? '#333333'}
        stroke="#101014" strokeWidth="1">
        <title>{FACE_NAMES[Math.floor(dot.facelet / 9)]}{dot.facelet % 9 + 1}</title>
      </circle>)}
    </svg>
    <figcaption>3 assi · 9 cerchi · 54 etichette</figcaption>
  </figure>;
}
