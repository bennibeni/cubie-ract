import CubePosition from '../cube/CubePosition';
import SolverKociembaJS from './SolverKociembaJS';
import { expandFaceMove } from './faceMoves';

const solver = new SolverKociembaJS();
self.onmessage = ({ data }) => {
  try {
    const cube = Object.assign(new CubePosition(), data.position ?? data);
    if (!solver.prepared) solver.init();
    solver.setPosition(cube);
    solver.solve();
    const seq = solver.getGenerator();
    const moves = [];
    for (let i = seq.getLength() - 1; i >= 0; i--) {
      moves.push(...expandFaceMove(seq.getMoves()[i], 4 - seq.getAmount()[i]));
    }
    for (const move of moves) cube.doMove(move.face, move.amount);
    if (!cube.getFaceletColors().every((color, i) => color === Math.floor(i / 9))) {
      throw new Error('La sequenza calcolata non risolve questa posizione.');
    }
    self.postMessage({ moves, requestId: data.requestId });
  } catch (error) { self.postMessage({ error: error.message, requestId: data.requestId }); }
};
