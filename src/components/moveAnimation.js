import { CUBIE_SLOTS, FACE_NORMAL } from './cubieGeometry';

// durata condivisa tra l'interpolazione visiva (Cube3D) e il timer che in App.jsx
// segna il completamento della mossa (cosi' restano sincronizzati)
export const ANIMATION_DURATION_MS = 250;


// Il verso di rotazione e' stato determinato empiricamente (non per assunzione):
// per ogni faccia, un quarto di giro con amount=1 corrisponde esattamente a una
// rotazione di -90 gradi attorno alla normale uscente della faccia. Verificato
// per tutte le 6 facce e per amount=1,2,3 confrontando la permutazione risultante
// da CubePosition.doMove con la rotazione geometrica attesa.
const DEGREES_PER_QUARTER_TURN = -90;

function slotsForFace(faceIdx) {
  const normal = FACE_NORMAL[faceIdx];
  const axisIdx = normal.findIndex((v) => v !== 0);
  const val = normal[axisIdx];
  return CUBIE_SLOTS.filter((s) => s.position[axisIdx] === val).map((s) => s.index);
}

// normalizza un numero di quarti di giro nell'equivalente di percorso piu' breve
// (utile perche' slice/anti-slice compongono piu' quarti di giro grezzi)
function shortestQuarterTurns(n) {
  const m = ((n % 4) + 4) % 4; // 0..3
  return m === 3 ? -1 : m; // -1,0,1,2
}

// Dato un tipo di mossa (0-17, stessa codifica di CubePosition/MoveSequence) e un
// ammontare (1-3), restituisce i gruppi di cubie da animare in rotazione, oppure
// null se il tipo di mossa non e' (ancora) gestito dall'animazione: in tal caso il
// chiamante deve applicare la mossa istantaneamente.
// Ogni gruppo: { slots: number[] (indici), axis: [x,y,z], angleDeg: number }
export function getAnimationGroups(m, amount) {
  if (m >= 0 && m < 6) {
    const q = shortestQuarterTurns(amount);
    return [{ slots: slotsForFace(m), axis: FACE_NORMAL[m], angleDeg: DEGREES_PER_QUARTER_TURN * q }];
  }
  if (m >= 12 && m < 15) { // slice: faccia vicina 1 giro, faccia opposta 3 giri grezzi (= -1 giro)
    const near = m - 12;
    const far = near + 3;
    const qNear = shortestQuarterTurns(amount);
    const qFar = shortestQuarterTurns(3 * amount);
    return [
      { slots: slotsForFace(near), axis: FACE_NORMAL[near], angleDeg: DEGREES_PER_QUARTER_TURN * qNear },
      { slots: slotsForFace(far), axis: FACE_NORMAL[far], angleDeg: DEGREES_PER_QUARTER_TURN * qFar },
    ];
  }
  if (m >= 15 && m < 18) { // anti-slice: faccia vicina e opposta ruotano nello stesso verso
    const near = m - 15;
    const far = near + 3;
    const q = shortestQuarterTurns(amount);
    return [
      { slots: slotsForFace(near), axis: FACE_NORMAL[near], angleDeg: DEGREES_PER_QUARTER_TURN * q },
      { slots: slotsForFace(far), axis: FACE_NORMAL[far], angleDeg: DEGREES_PER_QUARTER_TURN * q },
    ];
  }
  // rotazione dell'intero cubo / layer centrale: non ancora animati, applicazione istantanea
  return null;
}
