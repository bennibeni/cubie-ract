import Cube from '../vendor/cubejs/index';
import MoveSequence from '../cube/MoveSequence';
import { cubePositionToFaceletString } from '../vendor/cubejs/bridge';

// Adatta il motore cubejs (Kociemba two-phase) alla stessa interfaccia usata dai
// nostri solver dei sottogruppi (mix/setPosition/init/solve/getGenerator), cosi'
// l'App puo' trattarlo come un solver "in piu'" senza casi speciali.
// A differenza degli altri 4, questo risolve l'INTERO cubo (nessun sottogruppo),
// e non conosce il concetto di "super gruppo" (orientamento dei centri).
export default class SolverKociembaJS {
  constructor() {
    this.prepared = false;
    this.pendingCube = null;
    this.lastLen = 0;
    this.lastMoves = [];
    this.lastAmount = [];
  }

  // mescola con una sequenza casuale di mosse su tutto il gruppo (non un sottogruppo)
  mix(cubePos) {
    cubePos.reset();
    for (let i = 0; i < 30; i++) {
      const face = Math.floor(Math.random() * 6);
      const amount = 1 + Math.floor(Math.random() * 3);
      cubePos.doMove(face, amount, true);
    }
  }

  // ogni posizione valida appartiene al gruppo intero: nessun test di appartenenza
  setPosition(cubePos) {
    this.pendingCube = cubePos;
    return true;
  }

  init() {
    Cube.initSolver();
    this.prepared = true;
  }

  solve() {
    const faceletStr = cubePositionToFaceletString(this.pendingCube);
    const cjsCube = Cube.fromString(faceletStr);
    const solutionStr = cjsCube.solve();

    const ms = new MoveSequence();
    ms.parse(solutionStr, false);
    this.lastLen = ms.getLength();
    this.lastMoves = ms.getMoves();
    this.lastAmount = ms.getAmount();
    return true;
  }

  // Costruendo un nuovo MoveSequence a partire dalla soluzione DIRETTA (che risolve
  // il cubo se applicata in avanti), il costruttore stesso produce la versione
  // invertita/rovesciata — la stessa convenzione "generator" usata dagli altri
  // solver, gia' gestita da App.jsx (mostrata con toString(true), applicata al
  // contrario per ottenere la soluzione vera e propria).
  getGenerator() {
    return new MoveSequence(this.lastLen, this.lastMoves, this.lastAmount);
  }
}
