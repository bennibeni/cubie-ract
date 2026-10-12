import { useEffect, useRef, useState } from 'react';
import './App.css';
import Cube3D from './components/Cube3D';
import CubeNet from './components/CubeNet';
import CubeCircles from './components/CubeCircles';
import { getAnimationGroups } from './components/moveAnimation';
import { FACE_NAMES } from './cube/constants';
import CubePosition from './cube/CubePosition';
import useCubeHint from './useCubeHint';

function randomCube() {
  const cube = new CubePosition();
  let previous = -1;
  for (let i = 0; i < 30; i++) {
    let face;
    do { face = Math.floor(Math.random() * 6); } while (face === previous);
    cube.doMove(face, 1 + Math.floor(Math.random() * 3));
    previous = face;
  }
  cube.getFaceletColors();
  return cube;
}
const moveName = ({ face, amount }) => FACE_NAMES[face] + (amount === 2 ? '2' : amount === 3 ? '′' : '');
const faceLabels = ['Sinistra', 'Sopra', 'Davanti', 'Destra', 'Sotto', 'Dietro'];
function TurnIcon({ reverse }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <g transform={reverse ? 'translate(24 0) scale(-1 1)' : undefined}><path d="M20 10a8 8 0 1 0-1 7"/><path d="M20 4v6h-6"/></g>
  </svg>;
}

export default function App() {
  const [initial] = useState(randomCube);
  const cubeRef = useRef(initial);
  const startRef = useRef(structuredClone(initial));
  const [faceletColor, setFaceletColor] = useState(() => initial.getFaceletColors().slice());
  const [viewMode, setViewMode] = useState('3d');
  const [showCircles, setShowCircles] = useState(true);
  const [resetView, setResetView] = useState(0);
  const diagramHelp = useRef(null);
  const [animation, setAnimation] = useState(null);
  const [moves, setMoves] = useState(null);
  const [step, setStep] = useState(0);
  const [manualMoves, setManualMoves] = useState([]);
  const [pauseRequested, setPauseRequested] = useState(false);
  const stepRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const animatingRef = useRef(false);
  const timerRef = useRef(null);
  const workerRef = useRef(null);
  const mounted = useRef(true);
  const [duration, setDuration] = useState(600);
  const [status, setStatus] = useState('Posizione casuale pronta. Prova a risolverla con i comandi delle facce.');
  const locked = busy || playing || Boolean(animation);
  const solved = faceletColor.every((color, i) => color === Math.floor(i / 9));
  const hasChanged = faceletColor.some((color, i) => color !== startRef.current.faceletColor[i]);
  const hint = useCubeHint(cubeRef, faceletColor, !locked);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      playingRef.current = false;
      clearTimeout(timerRef.current);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  function updateCube() { setFaceletColor(cubeRef.current.getFaceletColors().slice()); }
  function animateMove(move) {
    animatingRef.current = true;
    setAnimation({ id: crypto.randomUUID(), groups: getAnimationGroups(move.face, move.amount), duration });
    return new Promise(resolve => {
      timerRef.current = setTimeout(() => {
        if (!mounted.current) return;
        cubeRef.current.doMove(move.face, move.amount);
        updateCube(); setAnimation(null); animatingRef.current = false; resolve();
      }, duration);
    });
  }
  async function play(sequence) {
    setPauseRequested(false);
    setManualMoves([]);
    playingRef.current = true; setPlaying(true);
    while (playingRef.current && stepRef.current < sequence.length) {
      const index = stepRef.current;
      setStatus(`Mossa ${index + 1} di ${sequence.length}: ${moveName(sequence[index])}`);
      await animateMove(sequence[index]);
      if (!mounted.current) return;
      stepRef.current = index + 1; setStep(index + 1);
    }
    playingRef.current = false; setPlaying(false); setPauseRequested(false);
    setStatus(stepRef.current === sequence.length ? 'Cubo risolto.' : 'In pausa.');
  }
  async function showSolution(singleStep = false) {
    if (busyRef.current || playingRef.current || animatingRef.current || solved) return;
    if (moves) {
      if (stepRef.current < moves.length) {
        if (singleStep) await nextStep(moves); else await play(moves);
      }
      return;
    }
    busyRef.current = true; setBusy(true);
    setStatus('Calcolo della soluzione… La prima volta può richiedere qualche secondo.');
    try {
      const sequence = await new Promise((resolve, reject) => {
        if (!workerRef.current) workerRef.current = new Worker(new URL('./solvers/solve.worker.js', import.meta.url), { type: 'module' });
        workerRef.current.onmessage = ({ data }) => data.error ? reject(new Error(data.error)) : resolve(data.moves);
        workerRef.current.onerror = () => {
          workerRef.current?.terminate(); workerRef.current = null;
          reject(new Error('Impossibile avviare il calcolo. Riprova.'));
        };
        workerRef.current.postMessage(structuredClone(cubeRef.current));
      });
      if (!mounted.current) return;
      setMoves(sequence); setBusy(false); busyRef.current = false;
      if (singleStep) await nextStep(sequence); else await play(sequence);
    } catch (error) {
      if (mounted.current) { setStatus(`Errore: ${error.message}`); setBusy(false); }
      busyRef.current = false;
    }
  }
  function newPosition() {
    if (busyRef.current || playingRef.current || animatingRef.current) return;
    cubeRef.current = randomCube(); cubeRef.current.getFaceletColors(); startRef.current = structuredClone(cubeRef.current);
    setManualMoves([]);
    setMoves(null); setStep(0); stepRef.current = 0; updateCube();
    setStatus('Nuova posizione casuale pronta.');
  }
  function restart() {
    if (busyRef.current || playingRef.current || animatingRef.current) return;
    cubeRef.current = Object.assign(new CubePosition(), structuredClone(startRef.current));
    setMoves(null); setManualMoves([]);
    stepRef.current = 0; setStep(0); updateCube(); setStatus('Posizione iniziale ripristinata.');
  }
  async function nextStep(sequence = moves) {
    if (!sequence || busyRef.current || playingRef.current || animatingRef.current || stepRef.current >= sequence.length) return;
    const index = stepRef.current;
    setManualMoves([]);
    await animateMove(sequence[index]);
    if (!mounted.current) return;
    stepRef.current = index + 1; setStep(index + 1);
    setStatus(index + 1 === sequence.length ? 'Cubo risolto.' : 'In pausa.');
  }
  async function manualMove(face, amount, undo = false) {
    if (busyRef.current || playingRef.current || animatingRef.current) return;
    const move = { face, amount };
    // A player move invalidates any solution computed for an earlier position.
    setMoves(null); setStep(0); stepRef.current = 0;
    setStatus(`${undo ? 'Annullamento' : 'Mossa'} ${moveName(move)}…`);
    await animateMove(move);
    if (!mounted.current) return;
    setManualMoves(history => undo ? history.slice(0, -1) : [...history, move]);
    const solved = cubeRef.current.getFaceletColors().every((color, i) => color === Math.floor(i / 9));
    setStatus(solved ? 'Hai risolto il cubo!' : undo ? 'Ultima mossa annullata.' : `Mossa ${moveName(move)} eseguita. Continua a giocare.`);
  }
  return <main><div className="app">
    <h1>Cubie · dal caso alla soluzione</h1>
    <p className="subtitle">Prova a risolvere il cubo oppure guarda la soluzione automatica dalla tua posizione.</p>
    <div className="layout"><div className="panel cube-panel">
      <div className="view-toggle">
        <button type="button" disabled={locked} className={viewMode === '3d' ? 'active' : ''} onClick={() => setViewMode('3d')}>3D</button>
        <button type="button" disabled={locked} className={viewMode === '2d' ? 'active' : ''} onClick={() => setViewMode('2d')}>Net 2D</button>
        <button type="button" disabled={locked || viewMode !== '3d'} onClick={() => setResetView(value => value + 1)} title="Ripristina orientamento e zoom, mantenendo la posizione delle etichette">Reset vista</button>
      </div>
      <div className="diagram-option">
        <label className="field checkbox"><input type="checkbox" checked={showCircles} onChange={e => setShowCircles(e.target.checked)} />Mostra diagramma dei cerchi</label>
        <button type="button" className="info-button" aria-label="Informazioni sul diagramma dei cerchi" aria-haspopup="dialog" onClick={() => diagramHelp.current.showModal()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none"/></svg>
        </button>
      </div>
      <div className="cube-views">
        {viewMode === '3d' ? <Cube3D faceletColor={faceletColor} animation={animation} resetView={resetView} /> : <CubeNet faceletColor={faceletColor} />}
        {showCircles && <CubeCircles faceletColor={faceletColor} animation={animation} />}
      </div>
      <section className="manual-play" aria-labelledby="manual-title">
        <h2 id="manual-title">Gioca tu</h2>
        <p>Le frecce indicano un quarto di giro orario o antiorario, guardando la faccia dall’esterno. Trascina per cambiare visuale. “Reset vista” riporta U in alto, F davanti e R a destra.</p>
        <p className="hint-message" aria-live="polite">{hint.move ? `Mossa suggerita: ${faceLabels[hint.move.face]}, ${hint.move.amount === 1 ? 'senso orario' : 'senso antiorario'}. Segui il pulsante evidenziato.` : hint.message || 'Suggerimento aggiornato al termine della mossa.'}</p>
        <div className="face-controls">
          {FACE_NAMES.map((name, face) => <div className={`face-control face-${name}`} key={name}>
            <span>{['L · Sinistra', 'U · Sopra', 'F · Davanti', 'R · Destra', 'D · Sotto', 'B · Dietro'][face]}</span>
            <div className="move-group">{[1, 3].map(amount => <button type="button" key={amount} disabled={locked}
              className={hint.move?.face === face && hint.move.amount === amount ? 'suggested-move' : ''}
              data-face={face} data-amount={amount}
              aria-label={`${faceLabels[face]}: ${amount === 1 ? 'orario' : 'antiorario'}${hint.move?.face === face && hint.move.amount === amount ? ', mossa suggerita' : ''}`}
              title={`${faceLabels[face]}: ${amount === 1 ? 'orario' : 'antiorario'}`}
              onClick={() => manualMove(face, amount)}><TurnIcon reverse={amount === 3} /></button>)}</div>
          </div>)}
        </div>
        <div className="manual-history">
          <span>Le tue mosse: {manualMoves.length}</span>
          <button type="button" disabled={locked || manualMoves.length === 0} onClick={() => {
            const last = manualMoves[manualMoves.length - 1];
            if (last) manualMove(last.face, 4 - last.amount, true);
          }}>Annulla ultima mossa</button>
        </div>
        {manualMoves.length > 0 && <p className="manual-sequence" aria-label="Cronologia delle tue mosse">{manualMoves.map(moveName).join(' ')}</p>}
      </section>
    </div><div className="panel playback-panel">
      <h2>Guarda la risoluzione</h2>
      <div className="actions">
        <button type="button" disabled={locked} onClick={newPosition}>Nuova posizione casuale</button>
        <button type="button" className="primary-action" disabled={locked || solved} onClick={() => showSolution()}>
          {busy ? 'Calcolo in corso…' : solved ? 'Cubo risolto' : playing ? 'Risoluzione in corso…' : moves && step > 0 ? 'Riprendi risoluzione' : 'Mostra risoluzione'}
        </button>
        <button type="button" disabled={!playing || pauseRequested} onClick={() => { playingRef.current = false; setPauseRequested(true); }}>
          {pauseRequested ? 'Pausa a fine mossa…' : 'Pausa'}
        </button>
        <button type="button" disabled={locked || solved} onClick={() => showSolution(true)}>Una mossa avanti</button>
        <button type="button" disabled={locked || !hasChanged} onClick={restart}>Ricomincia dalla posizione iniziale</button>
      </div>
      <label className="field">Velocità<select value={duration} disabled={locked} onChange={e => setDuration(Number(e.target.value))}>
        <option value={1000}>Lenta · 1 secondo per mossa</option>
        <option value={600}>Normale · 0,6 secondi per mossa</option>
        <option value={250}>Veloce · 0,25 secondi per mossa</option>
      </select></label>
      <p className="status" role="status">{status}</p>
      {moves && <div className="solution"><strong>Mosse completate: {step} / {moves.length}</strong>
        <progress value={step} max={Math.max(1, moves.length)} aria-label="Avanzamento della soluzione" />
        <div className="solution-moves">{moves.map((move, i) => <span key={i} className={i < step ? 'done' : i === step ? 'current' : ''}
          aria-current={i === step ? 'step' : undefined}>{moveName(move)}</span>)}</div>
      </div>}
      <section className="cube-theory" aria-labelledby="cube-theory-title">
        <h2 id="cube-theory-title">Quante configurazioni ha il cubo?</h2>
        <p>Il gruppo delle mosse del cubo di Rubik ha la struttura:</p>
        <div className="theory-formula">G ≅ (ℤ₃⁷ × ℤ₂¹¹) ⋊ ((A₈ × A₁₂) ⋊ ℤ₂)</div>
        <p>Per contare le configurazioni, si parte da tutte le disposizioni e gli orientamenti teoricamente possibili:</p>
        <div className="theory-formula">8! · 3⁸ · 12! · 2¹²</div>
        <ul>
          <li><strong>8!</strong> conta le permutazioni degli 8 angoli.</li>
          <li><strong>3⁸</strong> conta i loro possibili orientamenti.</li>
          <li><strong>12!</strong> conta le permutazioni dei 12 spigoli.</li>
          <li><strong>2¹²</strong> conta i loro possibili orientamenti.</li>
        </ul>
        <p>Le mosse consentite impongono però <strong>tre vincoli indipendenti</strong>:</p>
        <ol>
          <li>La somma delle torsioni degli angoli è zero modulo 3: si divide per <strong>3</strong>.</li>
          <li>La somma dei ribaltamenti degli spigoli è zero modulo 2: si divide per <strong>2</strong>.</li>
          <li>La permutazione degli angoli e quella degli spigoli hanno la stessa parità: si divide ancora per <strong>2</strong>.</li>
        </ol>
        <p>Si ottiene quindi:</p>
        <div className="theory-formula">|G| = (8! · 12! · 3⁷ · 2¹¹) / 2</div>
        <p className="theory-total">43.252.003.274.489.856.000</p>
      </section>
    </div></div>
    <p className="credits">Modello derivato da <a href="https://www.jaapsch.net/puzzles/" target="_blank" rel="noreferrer">Cubie di Jaap Scherphuis</a>.</p>
  </div>
  <dialog ref={diagramHelp} className="diagram-help" aria-labelledby="diagram-help-title" onClick={event => {
    if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
    }
  }}>
    <div className="dialog-header"><h2 id="diagram-help-title">Come leggere il diagramma</h2><button type="button" aria-label="Chiudi spiegazione" onClick={() => diagramHelp.current.close()}>×</button></div>
    <p>Il diagramma rappresenta le stesse <strong>54 etichette</strong> del cubo, disposte su <strong>nove cerchi</strong>: tre gruppi di tre, uno per ciascun asse.</p>
    <p>Ogni cerchio identifica uno strato. Ciascuno contiene 12 punti e ogni punto è l’intersezione di due cerchi di gruppi diversi. Il colore del punto è quello dell’etichetta corrispondente.</p>
    <p>I sei gruppi di nove punti rappresentano le sei facce, comprese quelle nascoste nella vista 3D. A cubo risolto ogni gruppo ha un solo colore. Passa il puntatore su un punto per leggere la faccia e il numero dell’etichetta.</p>
    <p>Durante una mossa il cerchio dello strato interessato diventa bianco. Un giro di una faccia esterna permuta le 12 etichette laterali e le 8 etichette periferiche della faccia: quattro quarti di giro uguali riportano ogni etichetta al suo posto.</p>
    <p>I 12 punti laterali scorrono lungo il cerchio evidenziato. Gli 8 punti periferici della faccia ruotata si muovono nel proprio gruppo, mentre il centro resta fermo. Ogni punto conserva il colore durante lo spostamento. Il movimento segue il cubo sia nel gioco manuale sia nella risoluzione automatica.</p>
    <p><a href="https://www.facebook.com/reel/919263231034760" target="_blank" rel="noreferrer" style={{ color: '#aebdff' }}>Guarda il video di riferimento su Facebook ↗</a></p>
    <form method="dialog"><button type="submit">Ho capito</button></form>
  </dialog>
  <footer className="projects-footer"><a href="https://links-page-bennibeni.vercel.app/">← All projects</a></footer></main>;
}
