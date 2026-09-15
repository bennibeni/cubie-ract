import { useCallback, useMemo, useRef, useState } from "react";
import "./App.css";
import Cube3D from "./components/Cube3D";
import CubeNet from "./components/CubeNet";
import {
  ANIMATION_DURATION_MS,
  getAnimationGroups,
} from "./components/moveAnimation";
import { FACE_NAMES } from "./cube/constants";
import CubePosition from "./cube/CubePosition";
import SolverAntiSlice from "./solvers/SolverAntiSlice";
import SolverKociembaJS from "./solvers/SolverKociembaJS";
import SolverSlice from "./solvers/SolverSlice";
import SolverSquare from "./solvers/SolverSquare";
import SolverTwoGen from "./solvers/SolverTwoGen";

const SOLVER_DEFS = {
  twogen: {
    label: "Two-Generator <U,R>",
    ctor: SolverTwoGen,
    subgroup: true,
  },
  slice: {
    label: "Slice",
    ctor: SolverSlice,
    subgroup: true,
  },
  antislice: {
    label: "Anti-Slice",
    ctor: SolverAntiSlice,
    subgroup: true,
  },
  square: {
    label: "Square",
    ctor: SolverSquare,
    subgroup: true,
  },
  kociemba: {
    label: "Kociemba completo (cubejs)",
    ctor: SolverKociembaJS,
    subgroup: false,
  },
};

let animationIdCounter = 0;

export default function App() {
  const cubeRef = useRef(new CubePosition());
  const solverInstances = useRef({});
  const [tick, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const [solverKey, setSolverKey] = useState("twogen");
  const [superGroup, setSuperGroup] = useState(false);
  const [status, setStatus] = useState("Pronto.");
  const [solutionText, setSolutionText] = useState("");
  const [lastSequence, setLastSequence] = useState(null);
  const [busy, setBusy] = useState(false);
  const [viewMode, setViewMode] = useState("3d");
  const [animation, setAnimation] = useState(null);
  const animatingRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const faceletColor = useMemo(
    () => cubeRef.current.getFaceletColors(),
    [tick],
  );

  function getSolver(key) {
    if (!solverInstances.current[key]) {
      solverInstances.current[key] = new SOLVER_DEFS[key].ctor();
    }
    return solverInstances.current[key];
  }

  // applica una mossa al modello, animandola nel viewer 3D quando possibile
  // (mosse singole, slice, anti-slice); altrimenti la applica istantaneamente.
  // Restituisce una Promise che si risolve quando la mossa e' stata applicata.
  function animateMove(m, amount) {
    return new Promise((resolve) => {
      const groups = viewMode === "3d" ? getAnimationGroups(m, amount) : null;
      if (!groups) {
        cubeRef.current.doMove(m, amount, true);
        rerender();
        resolve();
        return;
      }
      animatingRef.current = true;
      animationIdCounter += 1;
      setAnimation({ id: animationIdCounter, groups });
      setTimeout(() => {
        cubeRef.current.doMove(m, amount, true);
        setAnimation(null);
        animatingRef.current = false;
        rerender();
        resolve();
      }, ANIMATION_DURATION_MS);
    });
  }

  function applyMove(faceIdx, amount) {
    if (animatingRef.current) return;
    animateMove(faceIdx, amount);
  }

  function handleReset() {
    if (animatingRef.current) return;
    cubeRef.current.reset();
    setSolutionText("");
    setLastSequence(null);
    setStatus("Cubo azzerato.");
    rerender();
  }

  function handleMix() {
    if (animatingRef.current) return;
    const solver = getSolver(solverKey);
    solver.mix(cubeRef.current);
    setSolutionText("");
    setLastSequence(null);
    const def = SOLVER_DEFS[solverKey];
    setStatus(
      def.subgroup
        ? `Mescolato all'interno del sottogruppo "${def.label}".`
        : "Cubo mescolato (posizione casuale su tutto il gruppo).",
    );
    rerender();
  }

  async function handleSolve() {
    setBusy(true);
    setStatus("Verifica della posizione...");
    // lascia respirare la UI prima del possibile calcolo pesante
    await new Promise((r) => {
      setTimeout(r, 10);
    });

    const def = SOLVER_DEFS[solverKey];
    const solver = getSolver(solverKey);
    const cube = cubeRef.current;
    const effectiveSuperGroup = def.subgroup ? superGroup : false;

    const belongs = solver.setPosition(cube, true, effectiveSuperGroup);
    if (!belongs) {
      setStatus(
        `La posizione attuale non appartiene al sottogruppo "${def.label}".`,
      );
      setBusy(false);
      return;
    }

    if (!solver.prepared) {
      setStatus("Preparazione delle tabelle di ricerca (una tantum)...");
      await new Promise((r) => {
        setTimeout(r, 10);
      });
      solver.init();
    }

    solver.setPosition(cube, false, effectiveSuperGroup);
    setStatus("Ricerca della soluzione...");
    await new Promise((r) => {
      setTimeout(r, 10);
    });

    solver.solve(effectiveSuperGroup);
    // getGenerator() restituisce, come nell'originale Cubie.java, la sequenza che
    // "genera" (ricrea) la posizione mescolata a partire dal cubo risolto. La
    // soluzione vera e propria (da applicare al cubo mescolato per risolverlo) e'
    // la lettura inversa di questa stessa sequenza: e' quanto mostra toString(true)
    // ed e' quanto applica handleApplySolution qui sotto.
    const seq = solver.getGenerator();
    setLastSequence(seq);
    setSolutionText(
      seq.getLength() === 0 ? "(gia' risolto)" : seq.toString(true),
    );
    setStatus(`Soluzione trovata: ${seq.getLength()} mosse.`);
    setBusy(false);
  }

  async function handleApplySolution() {
    if (!lastSequence || animatingRef.current) return;
    setBusy(true);
    const moves = lastSequence.getMoves();
    const amount = lastSequence.getAmount();
    // applica la sequenza generatrice in ordine e verso inversi: e' cosi' che si
    // ottiene la soluzione effettiva a partire dalla posizione mescolata corrente.
    for (let i = lastSequence.getLength() - 1; i >= 0; i--) {
      // eslint-disable-next-line no-await-in-loop
      await animateMove(moves[i], 4 - amount[i]);
    }
    setStatus("Soluzione applicata.");
    setBusy(false);
  }

  return (
    <main>
      <div className="app">
        <h1>Cubie</h1>
        <p className="subtitle">
          Modello del cubo di Rubik e solver dei sottogruppi (Two-Generator,
          Slice, Anti-Slice, Square), porting fedele da Cubie.java di Jaap
          Scherphuis.
        </p>
        <a
          href="https://www.jaapsch.net/puzzles/"
          target="_blank"
          rel="noreferrer"
        >
          Jaap Scherphuis
        </a>

        <div className="layout">
          <div className="panel">
            <div className="view-toggle">
              <button
                type="button"
                className={viewMode === "3d" ? "active" : ""}
                onClick={() => setViewMode("3d")}
              >
                3D
              </button>
              <button
                type="button"
                className={viewMode === "2d" ? "active" : ""}
                onClick={() => setViewMode("2d")}
              >
                Net 2D
              </button>
            </div>
            {viewMode === "3d" ? (
              <Cube3D faceletColor={faceletColor} animation={animation} />
            ) : (
              <CubeNet faceletColor={faceletColor} />
            )}

            <div className="moves">
              {FACE_NAMES.map((name, idx) => (
                <div className="move-group" key={name}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => applyMove(idx, 1)}
                  >
                    {name}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => applyMove(idx, 3)}
                  >
                    {name}&apos;
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => applyMove(idx, 2)}
                  >
                    {name}2
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="reset"
              disabled={busy}
              onClick={handleReset}
            >
              Azzera cubo
            </button>
          </div>

          <div className="panel">
            <label className="field">
              Sottogruppo / solver:
              <select
                value={solverKey}
                onChange={(e) => {
                  setSolverKey(e.target.value);
                  setSolutionText("");
                  setLastSequence(null);
                }}
              >
                {Object.entries(SOLVER_DEFS).map(([key, def]) => (
                  <option key={key} value={key}>
                    {def.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field checkbox">
              <input
                type="checkbox"
                checked={superGroup}
                disabled={!SOLVER_DEFS[solverKey].subgroup}
                onChange={(e) => {
                  setSuperGroup(e.target.checked);
                  setSolutionText("");
                  setLastSequence(null);
                }}
              />
              Super gruppo (considera l&apos;orientamento dei centri)
            </label>

            <div className="actions">
              <button type="button" onClick={handleMix} disabled={busy}>
                Mescola nel sottogruppo
              </button>
              <button type="button" onClick={handleSolve} disabled={busy}>
                Risolvi
              </button>
              <button
                type="button"
                onClick={handleApplySolution}
                disabled={busy || !lastSequence}
              >
                Applica soluzione
              </button>
            </div>

            <p className="status">{status}</p>

            {solutionText && (
              <div className="solution">
                <strong>Sequenza:</strong>
                <div className="solution-text">{solutionText}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="projects-footer">
        <a href="https://links-page-bennibeni.vercel.app/">&larr; All projects</a>
      </footer>
    </main>
  );
}
