import { useEffect, useRef, useState } from 'react';
import CubePosition from './cube/CubePosition';
import { expandFaceMove } from './solvers/faceMoves';

// Cache every intermediate position so following the suggestion is immediate.
export default function useCubeHint(cubeRef, faceletColor, enabled) {
  const worker = useRef(null);
  const request = useRef(0);
  const cache = useRef(new Map());
  const [result, setResult] = useState({ key: '', move: null, error: '' });
  const key = faceletColor.join(',');
  useEffect(() => () => { worker.current?.terminate(); worker.current = null; }, []);
  useEffect(() => {
    const id = ++request.current;
    if (!enabled) return;
    if (faceletColor.every((color, i) => color === Math.floor(i / 9))) {
      setResult({ key, move: null, error: '', solved: true }); return;
    }
    if (cache.current.has(key)) {
      setResult({ key, move: cache.current.get(key), error: '' }); return;
    }
    const position = structuredClone(cubeRef.current);
    if (!worker.current) worker.current = new Worker(new URL('./solvers/solve.worker.js', import.meta.url), { type: 'module' });
    worker.current.onmessage = ({ data }) => {
      if (data.requestId !== request.current || data.requestId !== id) return;
      if (data.error) { setResult({ key, move: null, error: 'Suggerimento non disponibile.' }); return; }
      const cube = Object.assign(new CubePosition(), position);
      let quarters;
      try {
        quarters = data.moves.flatMap(move => expandFaceMove(move.face, move.amount))
          .flatMap(move => move.amount === 2 ? [{ ...move, amount: 1 }, { ...move, amount: 1 }] : [move]);
      } catch {
        setResult({ key, move: null, error: 'Suggerimento non disponibile.' }); return;
      }
      if (cache.current.size > 1000) cache.current.clear();
      quarters.forEach(move => {
        cache.current.set(cube.getFaceletColors().join(','), move);
        cube.doMove(move.face, move.amount);
      });
      setResult({ key, move: quarters[0] ?? null, error: '' });
    };
    worker.current.onerror = () => {
      if (request.current === id) setResult({ key, move: null, error: 'Suggerimento non disponibile.' });
      worker.current?.terminate(); worker.current = null;
    };
    worker.current.postMessage({ position, requestId: id });
    return () => { request.current++; };
  }, [cubeRef, faceletColor, enabled, key]);
  if (!enabled) return { move: null, message: '' };
  if (result.key !== key) return { move: null, message: 'Calcolo del suggerimento…' };
  return { move: result.move, message: result.error || (result.solved ? 'Cubo risolto: nessuna mossa necessaria.' : '') };
}
